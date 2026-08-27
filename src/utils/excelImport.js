import ExcelJS from 'exceljs'
import { ElMessage, ElMessageBox } from 'element-plus'

/**
 * 表头归一化：去除首尾空格、全角空格、不可见字符，
 * 转小写，去除空格/下划线/中划线/冒号等分隔符，
 * 用于在中文表头含空格/特殊符号时仍能模糊匹配。
 */
function normalizeHeader(header) {
  if (header === null || header === undefined) return ''
  let s = String(header)
  // 去除 BOM / 零宽字符 / 全角空格
  s = s.replace(/[\u200B-\u200D\uFEFF\u3000]/g, '')
  // 转小写
  s = s.toLowerCase()
  // 去除所有空格、下划线、中划线、冒号、括号、星号、井号等分隔/装饰符
  s = s.replace(/[\s_\-:：()*#\[\]【】""''`'，,。.!！?？/\\|]/g, '')
  return s.trim()
}

/**
 * 从 Excel 文件导入数据
 * @param {File} file - 用户选择的 Excel 文件
 * @param {Object} options - 配置选项
 * @param {Array} options.fieldMapping - 字段映射配置 [{ excelHeader: '客户ID', dataField: 'id' }, ...]
 * @param {Number} options.headerRow - 表头所在行（从1开始，默认2，第1行通常是标题）
 * @param {Function} options.validateRow - 行验证函数，返回 { valid: boolean, error?: string }
 * @param {Function} options.transformRow - 行转换函数，可对解析后的数据进行额外处理
 * @param {Boolean} options.warnOnUnmatched - 是否在存在未匹配列时弹出警告（默认 true）
 * @returns {Promise<{ success: boolean, data?: Array, errors?: Array, message?: string, unmatchedExcelHeaders?: Array, unmatchedMappingFields?: Array }>}
 */
export async function importFromExcel(file, options = {}) {
  const {
    fieldMapping = [],
    headerRow = 2,
    startRow = 3,
    validateRow = null,
    transformRow = null,
    sheetIndex = 0,
    warnOnUnmatched = true
  } = options

  try {
    const workbook = new ExcelJS.Workbook()
    const arrayBuffer = await file.arrayBuffer()
    await workbook.xlsx.load(arrayBuffer)

    const worksheet = workbook.worksheets[sheetIndex]
    if (!worksheet) {
      return { success: false, message: 'Excel 文件中没有找到工作表' }
    }

    // ===== 智能表头检测：如果指定行的匹配度太低，自动尝试下一行 =====
    const maxAutoScanRows = 3 // 最多向后扫描 3 行
    let effectiveHeaderRow = headerRow
    let bestMatchCount = -1
    let bestHeaders = []

    for (let scanOffset = 0; scanOffset <= maxAutoScanRows; scanOffset++) {
      const tryRow = headerRow + scanOffset
      if (tryRow > worksheet.rowCount) break

      const tryHeaders = []
      const rowData = worksheet.getRow(tryRow)
      rowData.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        let val = cell.value
        if (val && typeof val === 'object') {
          if (val.text) {
            val = val.text
          } else if (val.richText) {
            val = val.richText.map(rt => rt.text).join('')
          } else if (cell.text) {
            val = cell.text
          } else {
            val = val.toString ? val.toString() : String(val)
          }
        }
        tryHeaders[colNumber - 1] = val?.toString().trim() || ''
      })

      // 计算这一行与映射的匹配数
      let matchCount = 0
      const nonEmptyHeaders = tryHeaders.filter(h => h)
      if (nonEmptyHeaders.length === 0) continue

      for (const mapping of fieldMapping) {
        const headerIndex = tryHeaders.indexOf(mapping.excelHeader)
        const normalizedTarget = normalizeHeader(mapping.excelHeader)
        const normalizedHeaders = tryHeaders.map(h => normalizeHeader(h))
        if (headerIndex !== -1 || normalizedHeaders.indexOf(normalizedTarget) !== -1) {
          matchCount++
        }
      }

      if (matchCount > bestMatchCount) {
        bestMatchCount = matchCount
        bestHeaders = tryHeaders
        effectiveHeaderRow = tryRow
      }

      // 如果第一行就有较好的匹配（>=30%），直接用
      const totalFields = Math.max(fieldMapping.length, 1)
      if (matchCount / totalFields >= 0.3 && scanOffset === 0) break
    }

    if (typeof console !== 'undefined' && console.debug) {
      if (effectiveHeaderRow !== headerRow) {
        console.warn(`[Excel导入] 自动检测到表头在第 ${effectiveHeaderRow} 行（原指定第 ${headerRow} 行匹配度太低）`)
      }
      console.debug('Excel表头读取结果:', bestHeaders.filter(h => h).map((h, i) => `[col${i+1}]${h}`))
    }

    const headers = bestHeaders

    // 精确匹配：excelHeader -> colIndex
    const headerIndexMap = {}
    headers.forEach((header, idx) => {
      if (header) {
        headerIndexMap[header] = idx
      }
    })

    // 归一化匹配：normalizeHeader(excelHeader) -> colIndex（兜底，处理空格/特殊符号）
    const normalizedHeaderMap = {}
    headers.forEach((header, idx) => {
      if (header) {
        const nk = normalizeHeader(header)
        if (nk && normalizedHeaderMap[nk] === undefined) {
          normalizedHeaderMap[nk] = idx
        }
      }
    })

    // 构建字段映射：colIndex -> dataField
    // 优先精确匹配，匹配不到再用归一化匹配
    const colFieldMap = {}
    const matchedDataFields = new Set()
    fieldMapping.forEach(mapping => {
      let colIdx = headerIndexMap[mapping.excelHeader]
      if (colIdx === undefined) {
        const nk = normalizeHeader(mapping.excelHeader)
        if (nk) colIdx = normalizedHeaderMap[nk]
      }
      if (colIdx !== undefined && colFieldMap[colIdx] === undefined) {
        colFieldMap[colIdx] = mapping.dataField
        matchedDataFields.add(mapping.dataField)
      }
    })

    // 统计未匹配情况，给用户明确提示，避免“静默丢列”
    const unmatchedExcelHeaders = headers
      .filter((h, idx) => h && colFieldMap[idx] === undefined)
      .filter((h, idx, arr) => arr.indexOf(h) === idx) // 去重

    // 去重后的映射字段名列表
    const allMappingFields = [...new Set(fieldMapping.map(m => m.dataField))]
    const unmatchedMappingFields = allMappingFields.filter(f => !matchedDataFields.has(f))

    // 根据实际使用的表头行计算数据起始行
    const effectiveStartRow = Math.max(effectiveHeaderRow + 1, startRow)

    // 读取数据行
    const data = []
    const errors = []
    let rowCount = 0

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber < effectiveStartRow) return

      // 检查是否是空行
      let isEmpty = true
      row.eachCell((cell) => {
        if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
          isEmpty = false
        }
      })
      if (isEmpty) return

      rowCount++
      let rowData = {}

      // 读取每个单元格
      row.eachCell((cell, colNumber) => {
        const field = colFieldMap[colNumber - 1]
        if (field) {
          let value = cell.value
          // 处理日期类型
          if (value instanceof Date) {
            value = value.toISOString().split('T')[0]
          }
          // 处理公式结果
          if (cell.type === ExcelJS.ValueType.Formula) {
            value = cell.result
          }
          // 处理超链接/富文本单元格（cell.value 可能是对象）
          if (value && typeof value === 'object') {
            if (value.text && typeof value.text === 'string') {
              value = value.text
            } else if (value.richText) {
              value = value.richText.map(rt => rt.text).join('')
            } else if (value.hyperlink) {
              value = value.hyperlink.replace(/^mailto:/i, '')
            } else {
              value = cell.text || (value.toString ? value.toString() : String(value))
            }
          }
          rowData[field] = value
        }
      })

      // 验证行数据
      if (validateRow) {
        const validation = validateRow(rowData, rowNumber)
        if (!validation.valid) {
          errors.push({ row: rowNumber, error: validation.error || '数据验证失败' })
          return
        }
      }

      // 转换行数据
      if (transformRow) {
        const transformed = transformRow(rowData, rowNumber)
        if (transformed) {
          rowData = transformed
        }
      }

      data.push(rowData)
    })

    if (rowCount === 0) {
      return { success: false, message: 'Excel 文件中没有找到有效数据' }
    }

    // 字段全部未匹配：直接判失败，避免导入一堆空对象
    if (allMappingFields.length > 0 && matchedDataFields.size === 0) {
      const headerSample = headers.filter(h => h).slice(0, 5).join(' / ')
      const mappingSample = fieldMapping.slice(0, 5).map(m => m.excelHeader).join('、')
      const msg = `表头不匹配，导入失败。系统在第${effectiveHeaderRow}行检测到的表头是「${headerSample}」，期望的表头应是「${mappingSample}」等。请检查Excel文件格式。`
      console.error('[Excel导入]', msg)
      if (warnOnUnmatched) {
        ElMessage({ message: msg, type: 'error', duration: 8000, showClose: true })
      }
      return {
        success: false,
        message: msg,
        unmatchedExcelHeaders,
        unmatchedMappingFields
      }
    }

    // 部分未匹配：弹出警告，但仍允许导入已匹配列
    if (warnOnUnmatched && unmatchedMappingFields.length > 0) {
      const tip = `以下字段未在 Excel 中找到对应列（将被忽略）：${unmatchedMappingFields.join('、')}`
      console.warn('[Excel导入]', tip)
      ElMessage.warning(tip)
    }

    return {
      success: true,
      data,
      errors,
      totalRows: rowCount,
      importedRows: data.length,
      skippedRows: errors.length,
      unmatchedExcelHeaders,
      unmatchedMappingFields
    }

  } catch (error) {
    console.error('Excel 导入错误:', error)
    return { success: false, message: `导入失败: ${error.message}` }
  }
}

/**
 * 创建导入预览数据
 * @param {Array} data - 解析后的数据数组
 * @param {Array} fieldMapping - 字段映射配置
 * @returns {Object} 预览数据对象
 */
export function createImportPreview(data, fieldMapping) {
  const headers = fieldMapping.map(m => m.excelHeader)
  const previewRows = data.slice(0, 10) // 只显示前10行预览

  return {
    headers,
    data: previewRows,
    totalRows: data.length,
    previewRows: previewRows.length,
    fieldMapping
  }
}

/**
 * 标准字段映射预设
 * 各模块可根据需要使用这些预设
 */
export const fieldMappingPresets = {
  // 客户主台账（支持中英文表头）
  customers: [
    { excelHeader: '客户ID', dataField: 'id' },
    { excelHeader: 'id', dataField: 'id' },
    { excelHeader: 'ID', dataField: 'id' },
    { excelHeader: '客户姓名', dataField: 'name' },
    { excelHeader: 'name', dataField: 'name' },
    { excelHeader: '客户分组', dataField: 'group' },
    { excelHeader: 'group', dataField: 'group' },
    { excelHeader: '国家', dataField: 'country' },
    { excelHeader: 'country', dataField: 'country' },
    { excelHeader: '地区', dataField: 'region' },
    { excelHeader: 'region', dataField: 'region' },
    { excelHeader: '公司', dataField: 'company' },
    { excelHeader: 'company', dataField: 'company' },
    { excelHeader: '海外邮箱', dataField: 'email' },
    { excelHeader: 'email', dataField: 'email' },
    { excelHeader: '电话', dataField: 'phone' },
    { excelHeader: 'phone', dataField: 'phone' },
    { excelHeader: '地址', dataField: 'address' },
    { excelHeader: 'address', dataField: 'address' },
    { excelHeader: '对接机型', dataField: 'model' },
    { excelHeader: 'model', dataField: 'model' },
    { excelHeader: '首次联系日期', dataField: 'firstContactDate' },
    { excelHeader: 'firstContactDate', dataField: 'firstContactDate' },
    { excelHeader: 'localMaterialPath', dataField: 'localMaterialPath' },
    { excelHeader: '备注', dataField: 'remark' },
    { excelHeader: 'remark', dataField: 'remark' }
  ],

  // 样机寄样申请
  sampleDeliveries: [
    { excelHeader: '寄样编号', dataField: 'id' },
    { excelHeader: '样机编号', dataField: 'id' },
    { excelHeader: '编号', dataField: 'id' },
    { excelHeader: '客户姓名', dataField: 'customer_name' },
    { excelHeader: '客户名称', dataField: 'customer_name' },
    { excelHeader: '客户', dataField: 'customer_name' },
    { excelHeader: '机型', dataField: 'model' },
    { excelHeader: '型号', dataField: 'model' },
    { excelHeader: '产品型号', dataField: 'model' },
    { excelHeader: '数量', dataField: 'qty' },
    { excelHeader: '寄样数量', dataField: 'qty' },
    { excelHeader: '发货日期', dataField: 'send_date' },
    { excelHeader: '寄出日期', dataField: 'send_date' },
    { excelHeader: '送货日期', dataField: 'send_date' },
    { excelHeader: '收货地区', dataField: 'area' },
    { excelHeader: '地区', dataField: 'area' },
    { excelHeader: '国家', dataField: 'area' },
    { excelHeader: '物流方式', dataField: 'logistics' },
    { excelHeader: '物流', dataField: 'logistics' },
    { excelHeader: '快递', dataField: 'logistics' },
    { excelHeader: '运单号', dataField: 'tracking_no' },
    { excelHeader: '物流单号', dataField: 'tracking_no' },
    { excelHeader: '快递单号', dataField: 'tracking_no' },
    { excelHeader: '运费', dataField: 'freight' },
    { excelHeader: '快递费', dataField: 'freight' },
    { excelHeader: '状态', dataField: 'status' },
    { excelHeader: '备注', dataField: 'remark' },
    { excelHeader: '说明', dataField: 'remark' }
  ],

  // 客户跟进记录
  customerFollowUps: [
    { excelHeader: '记录ID', dataField: 'id' },
    { excelHeader: '客户姓名', dataField: 'customerName' },
    { excelHeader: '跟进日期', dataField: 'followupDate' },
    { excelHeader: '跟进内容', dataField: 'content' },
    { excelHeader: '跟进结果', dataField: 'result' },
    { excelHeader: '联系方式', dataField: 'contactMethod' },
    { excelHeader: 'PO号', dataField: 'poNumber' },
    { excelHeader: '下次跟进', dataField: 'nextFollowup' },
    { excelHeader: '操作人', dataField: 'operator' },
    { excelHeader: '备注', dataField: 'remark' }
  ],

  // 机型参数库
  productModels: [
    { excelHeader: '机型ID', dataField: 'id' },
    { excelHeader: '机型名称', dataField: 'name' },
    { excelHeader: '芯片方案', dataField: 'chip' },
    { excelHeader: '屏幕参数', dataField: 'screen' },
    { excelHeader: '配套认证', dataField: 'certifications' },
    { excelHeader: '供应商', dataField: 'supplier' },
    { excelHeader: '备注', dataField: 'remark' }
  ],

  // 合规认证档案
  certRecords: [
    { excelHeader: '认证ID', dataField: 'id' },
    { excelHeader: '关联机型', dataField: 'model' },
    { excelHeader: '认证类型', dataField: 'certType' },
    { excelHeader: '证书编号', dataField: 'certNo' },
    { excelHeader: '下发日期', dataField: 'issueDate' },
    { excelHeader: '到期日期', dataField: 'expireDate' },
    { excelHeader: '对接机构', dataField: 'organization' },
    { excelHeader: '备注', dataField: 'remark' }
  ],

  // 物流运单跟踪
  logistics: [
    { excelHeader: '运单ID', dataField: 'id' },
    { excelHeader: '运单号', dataField: 'trackingNo' },
    { excelHeader: '客户姓名', dataField: 'customerName' },
    { excelHeader: '国家', dataField: 'country' },
    { excelHeader: '货代公司', dataField: 'freightForwarder' },
    { excelHeader: '发货日期', dataField: 'sendDate' },
    { excelHeader: '收货日期', dataField: 'receiveDate' },
    { excelHeader: '状态', dataField: 'status' },
    { excelHeader: '备注', dataField: 'remark' }
  ],

  // 物流费用对账（跳过第1行标题、第2行过滤器箭头，第3行为表头）
  // A=对账ID, B=关联运单号, C=客户姓名, D=国家, E=货代, F=运费金额, G=付款状态, H=核销日期
  logisticsBills: [
    { excelHeader: '对账ID', dataField: 'id' },
    { excelHeader: 'ID', dataField: 'id' },
    { excelHeader: '关联运单号', dataField: 'logisticsNo' },
    { excelHeader: '运单号', dataField: 'logisticsNo' },
    { excelHeader: '客户姓名', dataField: 'customerName' },
    { excelHeader: '客户', dataField: 'customerName' },
    { excelHeader: '国家', dataField: 'country' },
    { excelHeader: '货代公司', dataField: 'freightForwarder' },
    { excelHeader: '货代', dataField: 'freightForwarder' },
    { excelHeader: '运费金额', dataField: 'freightAmount' },
    { excelHeader: '运费', dataField: 'freightAmount' },
    { excelHeader: '付款状态', dataField: 'paymentStatus' },
    { excelHeader: '核销日期', dataField: 'writeOffDate' },
    { excelHeader: '未结清运费总额', dataField: '__skip__' }
  ],

  // 订单总台账
  orders: [
    { excelHeader: '订单ID', dataField: 'id' },
    { excelHeader: '客户姓名', dataField: 'customerName' },
    { excelHeader: '机型', dataField: 'model' },
    { excelHeader: '数量', dataField: 'qty' },
    { excelHeader: '订单日期', dataField: 'bookingDate' },
    { excelHeader: '订单类型', dataField: 'orderType' },
    { excelHeader: '金额', dataField: 'amount' },
    { excelHeader: '币种', dataField: 'currency' },
    { excelHeader: '出货状态', dataField: 'status' },
    { excelHeader: '物流单号', dataField: 'logisticsNo' },
    { excelHeader: '备注', dataField: 'remark' }
  ],

  // 客户分组配置（简化版）
  customerGroups: [
    { excelHeader: '分组名称', dataField: 'name' },
    { excelHeader: '客户列表', dataField: 'customers' }
  ],

  // 出货分配台账
  deliveryAllocations: [
    { excelHeader: '分配编号', dataField: 'id' },
    { excelHeader: '订单编号', dataField: 'poNumber' },
    { excelHeader: 'PO编号', dataField: 'poNumber' },
    { excelHeader: '订单日期', dataField: 'orderDate' },
    { excelHeader: '产品名称', dataField: 'productName' },
    { excelHeader: '型号', dataField: 'model' },
    { excelHeader: '机型', dataField: 'model' },
    { excelHeader: '规格型号', dataField: 'specModel' },
    { excelHeader: '内存配置', dataField: 'memoryConfig' },
    { excelHeader: '数量', dataField: 'orderQty' },
    { excelHeader: '订单总数量', dataField: 'orderQty' },
    { excelHeader: '国家', dataField: 'destinationCountry' },
    { excelHeader: '目的国家', dataField: 'destinationCountry' },
    { excelHeader: '插头', dataField: 'plugSpec' },
    { excelHeader: '插头规格', dataField: 'plugSpec' },
    { excelHeader: '承诺交期', dataField: 'promisedDate' },
    { excelHeader: '生产完成', dataField: 'productionStatus' },
    { excelHeader: '入库', dataField: 'warehouseStatus' },
    { excelHeader: 'CI编号', dataField: 'ciNumber' },
    { excelHeader: '客户名称', dataField: 'customerName' },
    { excelHeader: '客户分组', dataField: 'customerGroup' },
    { excelHeader: '硬件配置+颜色', dataField: 'hwConfig' },
    { excelHeader: '本次分配数量', dataField: 'allocatedQty' },
    { excelHeader: '欠货数量', dataField: 'shortage' },
    { excelHeader: '发货仓库', dataField: 'warehouse' },
    { excelHeader: '物流渠道', dataField: 'logistics' },
    { excelHeader: '沙特发货数量', dataField: 'saudiQty' },
    { excelHeader: '阿联酋发货数量', dataField: 'uaeQty' },
    { excelHeader: '阿曼/巴林/科威特发货数量', dataField: 'omanQty' },
    { excelHeader: '卡塔尔发货数量', dataField: 'qatarQty' },
    { excelHeader: '黎巴嫩发货数量', dataField: 'lebanonQty' },
    { excelHeader: '清关认证备注', dataField: 'certRemark' },
    { excelHeader: '是否样机', dataField: 'isSample' },
    { excelHeader: '备注', dataField: 'remark' }
  ],

  // 订单交期管控台账
  deliverySchedules: [
    { excelHeader: '管控ID', dataField: 'id' },
    { excelHeader: '订单号', dataField: 'orderId' },
    { excelHeader: '客户姓名', dataField: 'customerName' },
    { excelHeader: '机型', dataField: 'model' },
    { excelHeader: '订单数量', dataField: 'orderQty' },
    { excelHeader: '已出货数量', dataField: 'shippedQty' },
    { excelHeader: '要求交期', dataField: 'requiredDate' },
    { excelHeader: '预计交期', dataField: 'estimatedDate' },
    { excelHeader: '实际交期', dataField: 'actualDate' },
    { excelHeader: '状态', dataField: 'status' },
    { excelHeader: '备注', dataField: 'remark' }
  ],

  // 客户付款记录
  customerPayments: [
    { excelHeader: '记录ID', dataField: 'id' },
    { excelHeader: '客户姓名', dataField: 'customerName' },
    { excelHeader: '客户', dataField: 'customerName' },
    { excelHeader: '币种', dataField: 'currency' },
    { excelHeader: '货币', dataField: 'currency' },
    { excelHeader: 'Currency', dataField: 'currency' },
    { excelHeader: '订单编号', dataField: 'orderNo' },
    { excelHeader: '订单号', dataField: 'orderNo' },
    { excelHeader: 'PO号', dataField: 'orderNo' },
    { excelHeader: '订单日期', dataField: 'orderDate' },
    { excelHeader: '下单日期', dataField: 'orderDate' },
    { excelHeader: '产品名称', dataField: 'productName' },
    { excelHeader: '产品', dataField: 'productName' },
    { excelHeader: '规格型号', dataField: 'specModel' },
    { excelHeader: '规格', dataField: 'specModel' },
    { excelHeader: '数量', dataField: 'quantity' },
    { excelHeader: '单价', dataField: 'unitPrice' },
    { excelHeader: '订单金额', dataField: 'orderAmount' },
    { excelHeader: '总金额', dataField: 'orderAmount' },
    { excelHeader: '交货日期', dataField: 'deliveryDate' },
    { excelHeader: '交期', dataField: 'deliveryDate' },
    { excelHeader: '付款批次', dataField: 'paymentBatch' },
    { excelHeader: '批次', dataField: 'paymentBatch' },
    { excelHeader: '付款类型', dataField: 'paymentType' },
    { excelHeader: '类型', dataField: 'paymentType' },
    { excelHeader: '付款日期', dataField: 'paymentDate' },
    { excelHeader: '付款金额', dataField: 'paymentAmount' },
    { excelHeader: '金额', dataField: 'paymentAmount' },
    { excelHeader: '付款方式', dataField: 'paymentMethod' },
    { excelHeader: '方式', dataField: 'paymentMethod' },
    { excelHeader: '到账状态', dataField: 'arrivalStatus' },
    { excelHeader: '状态', dataField: 'arrivalStatus' },
    { excelHeader: '备注', dataField: 'remark' }
  ]
}

/**
 * 显示导入结果消息
 */
export function showImportResult(result) {
  if (result.success) {
    const msg = `成功导入 ${result.importedRows} 条数据`
    if (result.skippedRows > 0) {
      ElMessage.warning(`${msg}，跳过 ${result.skippedRows} 条无效数据`)
    } else {
      ElMessage.success(msg)
    }
  } else {
    ElMessage.error(result.message || '导入失败')
  }
}

/**
 * 通用：Excel 导入 + 合并到本地 store + 云端同步
 * 各模块导入后如需云端同步，只需：
 *   import { importAndSync } from '../utils/excelImport.js'
 *   await importAndSync({ file, fieldMapping, tableName, storeKey, mergeFn })
 *
 * @param {Object} opts
 * @param {File}   opts.file           - 用户选择的 Excel 文件
 * @param {Array}  opts.fieldMapping   - excelHeader → dataField 映射
 * @param {string} opts.tableName      - Supabase 表名（snake_case，如 'sample_deliveries'）
 * @param {Array}  opts.storeData      - 本地 store 数组（如 store.sampleDeliveries）
 * @param {Function} opts.mergeFn      - 合并函数 (existingItem, importedItem) => mergedItem
 * @param {Function} opts.transformFn  - 可选：对每条导入数据做转换 (item) => newItem
 * @param {string} opts.confirmText    - 可选：确认弹窗文案
 * @returns {Promise<{success, importedCount, syncSuccess, syncFail}>}
 */
export async function importAndSync(opts) {
  const {
    file, fieldMapping, tableName, storeData,
    mergeFn = null,
    transformFn = null,
    confirmText = null,
    headerRow = 2,
    startRow = 3
  } = opts

  const result = await importFromExcel(file, { fieldMapping, headerRow, startRow })
  if (!result.success) {
    ElMessage({ message: result.message || '导入失败', type: 'error', duration: 6000, showClose: true })
    return { success: false, importedCount: 0, syncSuccess: 0, syncFail: 0 }
  }

  const count = result.data.length
  const text = confirmText || `检测到 ${count} 条数据，是否导入？\n注意：相同ID的记录将被覆盖`

  try {
    await ElMessageBox.confirm(text, '确认导入', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'info' })
  } catch {
    return { success: false, importedCount: 0, syncSuccess: 0, syncFail: 0 }
  }

  // 合并到本地 store
  const importedItems = []
  for (const item of result.data) {
    const transformed = transformFn ? transformFn(item) : item
    if (!transformed) continue
    const idx = storeData.findIndex(s => s.id === transformed.id)
    if (idx > -1) {
      storeData[idx] = mergeFn ? mergeFn(storeData[idx], transformed) : { ...storeData[idx], ...transformed }
    } else {
      storeData.push(transformed)
    }
    importedItems.push(storeData[idx > -1 ? idx : storeData.length - 1])
  }
  // 保存到本地
  const { saveToLocalStorage } = await import('../store.js').catch(() => ({ saveToLocalStorage: () => {} }))
  if (typeof saveToLocalStorage === 'function') saveToLocalStorage()

  // 云端同步
  const { store } = await import('../store.js').catch(() => ({ store: { localMode: true } }))
  if (store && store.localMode) {
    ElMessage.success(`成功导入 ${importedItems.length} 条数据（本地模式）`)
    return { success: true, importedCount: importedItems.length, syncSuccess: 0, syncFail: 0 }
  }

  try {
    localStorage.removeItem('supabase_rls_failed')
    const { syncToSupabase } = await import('../supabase.js')
    let syncSuccess = 0
    let syncFail = 0
    const failReasons = []
    for (const item of importedItems) {
      const r = await syncToSupabase(tableName, item)
      if (r.success) syncSuccess++
      else {
        syncFail++
        const reason = r.error || r.rawError || '未知错误'
        if (failReasons.length < 3 && !failReasons.includes(reason)) failReasons.push(reason)
      }
    }
    if (syncFail === 0) {
      ElMessage.success(`成功导入 ${importedItems.length} 条数据并已同步到云端`)
    } else {
      const detail = failReasons.length > 0 ? `失败原因：${failReasons.join('；')}` : ''
      ElMessage({ type: 'warning', duration: 6000, showClose: true, message: `导入成功 ${importedItems.length} 条，云端同步成功 ${syncSuccess} 条，失败 ${syncFail} 条 ${detail}` })
    }
    return { success: true, importedCount: importedItems.length, syncSuccess, syncFail }
  } catch (e) {
    console.error('云端同步失败:', e)
    ElMessage({ type: 'warning', duration: 6000, showClose: true, message: `导入成功 ${importedItems.length} 条，但云端同步失败：${e.message || e}` })
    return { success: true, importedCount: importedItems.length, syncSuccess: 0, syncFail: importedItems.length }
  }
}