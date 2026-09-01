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
  s = s.replace(/[\u200B-\u200D\uFEFF\u3000]/g, '')
  s = s.toLowerCase()
  s = s.replace(/[\s_\-:：()*#\[\]【】""''`'，,。.!！?？/\\|]/g, '')
  return s.trim()
}

/**
 * 将 Excel 序列号日期转换为标准日期格式 (YYYY-MM-DD)
 */
function excelSerialToDate(serial) {
  if (serial === null || serial === undefined || serial === '') return ''
  if (serial instanceof Date) {
    return serial.toISOString().split('T')[0]
  }
  const num = Number(serial)
  if (isNaN(num)) return String(serial)
  if (num < 1 || num > 60000) return String(serial)
  const excelEpoch = new Date(Date.UTC(1899, 11, 30))
  const msPerDay = 86400000
  const utcDays = Math.floor(num)
  const utcValue = excelEpoch.getTime() + utcDays * msPerDay
  const dateInfo = new Date(utcValue)
  return dateInfo.toISOString().split('T')[0]
}

/**
 * 从 Excel 单元格数字格式识别货币类型
 */
function detectCurrency(cell) {
  if (!cell) return ''
  const numFmt = cell.numFmt || ''
  const strFmt = String(numFmt)
  if (/[$\u0024]|USD|US\$/i.test(strFmt)) return 'USD'
  if (/[¥\u00A5]|CNY|RMB|人民币/i.test(strFmt)) return 'CNY'
  if (/[€\u20AC]|EUR|欧元/i.test(strFmt)) return 'EUR'
  if (/[£\u00A3]|GBP|英镑/i.test(strFmt)) return 'GBP'
  if (/HKD|港币/i.test(strFmt)) return 'HKD'
  if (/JPY|日元/i.test(strFmt)) return 'JPY'
  return ''
}

/**
 * 读取 Excel 单元格值的通用方法
 */
function readCellValue(cell) {
  let val = cell.value
  if (val && typeof val === 'object') {
    if (val.text) {
      val = val.text
    } else if (val.richText) {
      val = val.richText.map(rt => rt.text).join('')
    } else if (cell.text) {
      val = cell.text
    } else if (val.hyperlink) {
      val = val.hyperlink.replace(/^mailto:/i, '')
    } else {
      val = val.toString ? val.toString() : String(val)
    }
  }
  return val
}

/**
 * 从 Excel 单元格读取日期值，兼容序列号和 Date 对象
 */
function readCellDate(cell) {
  let val = cell.value
  if (val === null || val === undefined || val === '') return ''
  if (val instanceof Date) {
    return val.toISOString().split('T')[0]
  }
  if (typeof val === 'number') {
    return excelSerialToDate(val)
  }
  if (cell.type === ExcelJS.ValueType.Formula && cell.result instanceof Date) {
    return cell.result.toISOString().split('T')[0]
  }
  if (typeof val === 'object') {
    val = readCellValue(cell)
  }
  return val !== null && val !== undefined ? String(val) : ''
}

/**
 * 从 Excel 单元格读取金额值，识别货币并清理格式
 */
function readCellAmount(cell) {
  let val = cell.value
  let currency = detectCurrency(cell)

  if (val === null || val === undefined || val === '') {
    return { value: 0, currency }
  }

  if (cell.type === ExcelJS.ValueType.Formula) {
    val = cell.result
  }

  if (typeof val === 'number') {
    return { value: val, currency }
  }

  if (typeof val === 'object') {
    val = readCellValue(cell)
  }

  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.\-]/g, '')
    return { value: Number(cleaned) || 0, currency }
  }

  return { value: Number(val) || 0, currency }
}

/**
 * 从 Excel 文件导入数据
 * @param {File} file - 用户选择的 Excel 文件
 * @param {Object} options - 配置选项
 * @param {Array} options.fieldMapping - 字段映射配置
 * @param {Number} options.headerRow - 表头所在行
 * @param {Number} options.startRow - 数据起始行
 * @param {Function} options.validateRow - 行验证函数
 * @param {Function} options.transformRow - 行转换函数
 * @param {Boolean} options.warnOnUnmatched - 是否警告未匹配字段
 * @param {Boolean} options.autoDetectHeader - 是否自动检测表头位置
 * @param {Array} options.dateFields - 日期字段名列表
 * @param {Array} options.amountFields - 金额字段名列表
 * @param {Array} options.numericFields - 数字字段名列表（不做日期序列号转换）
 * @returns {Promise<Object>}
 */
export async function importFromExcel(file, options = {}) {
  const {
    fieldMapping = [],
    headerRow = 2,
    startRow = 3,
    validateRow = null,
    transformRow = null,
    sheetIndex = 0,
    warnOnUnmatched = true,
    autoDetectHeader = true,
    dateFields = [],
    amountFields = [],
    numericFields = []
  } = options

  try {
    const workbook = new ExcelJS.Workbook()
    const arrayBuffer = await file.arrayBuffer()
    await workbook.xlsx.load(arrayBuffer)

    const worksheet = workbook.worksheets[sheetIndex]
    if (!worksheet) {
      return { success: false, message: 'Excel 文件中没有找到工作表' }
    }

    // ===== 智能表头检测：扫描前5行，自动定位真实表头 =====
    const maxScanRange = autoDetectHeader ? 5 : 0
    let effectiveHeaderRow = headerRow
    let bestMatchCount = -1
    let bestHeaders = []

    const allMappingNames = [...new Set(fieldMapping.map(m => normalizeHeader(m.excelHeader)).filter(Boolean))]

    for (let scanOffset = 0; scanOffset <= maxScanRange; scanOffset++) {
      const tryRow = scanOffset + 1
      if (tryRow > worksheet.rowCount) break

      const tryHeaders = []
      const rowData = worksheet.getRow(tryRow)
      rowData.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const val = readCellValue(cell)
        tryHeaders[colNumber - 1] = val?.toString().trim() || ''
      })

      let matchCount = 0
      const nonEmptyHeaders = tryHeaders.filter(h => h)
      if (nonEmptyHeaders.length < 2) continue

      const normalizedHeaders = tryHeaders.map(h => normalizeHeader(h))
      for (const mappingName of allMappingNames) {
        if (!mappingName) continue
        if (normalizedHeaders.some(nh => nh === mappingName)) {
          matchCount++
        }
      }

      if (matchCount > bestMatchCount) {
        bestMatchCount = matchCount
        bestHeaders = tryHeaders
        effectiveHeaderRow = tryRow
      }
    }

    // 如果自动检测失败，回退到指定的 headerRow
    if (bestMatchCount === 0 || bestHeaders.length === 0) {
      effectiveHeaderRow = headerRow
      const rowData = worksheet.getRow(headerRow)
      bestHeaders = []
      rowData.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const val = readCellValue(cell)
        bestHeaders[colNumber - 1] = val?.toString().trim() || ''
      })
    }

    if (typeof console !== 'undefined' && console.debug) {
      if (effectiveHeaderRow !== headerRow) {
        console.warn(`[Excel导入] 自动检测到表头在第 ${effectiveHeaderRow} 行（原指定第 ${headerRow} 行）`)
      }
      console.debug('Excel表头读取结果:', bestHeaders.filter(h => h).map((h, i) => `[col${i+1}]${h}`))
    }

    const headers = bestHeaders

    // ===== 构建列位置索引，支持重复列名 =====
    const headerPositions = {}
    headers.forEach((header, idx) => {
      if (header) {
        const nk = normalizeHeader(header)
        if (!headerPositions[nk]) {
          headerPositions[nk] = []
        }
        headerPositions[nk].push(idx)
      }
    })

    // 构建字段映射：colIndex -> dataField
    const colFieldMap = {}
    const matchedDataFields = new Set()
    const usedColIndices = new Set()

    fieldMapping.forEach(mapping => {
      let colIdx = undefined

      if (mapping.colIndex !== undefined) {
        colIdx = mapping.colIndex
      } else {
        const nk = normalizeHeader(mapping.excelHeader)
        const positions = headerPositions[nk] || []

        for (const pos of positions) {
          if (!usedColIndices.has(pos)) {
            colIdx = pos
            break
          }
        }

        if (colIdx === undefined && positions.length > 0) {
          colIdx = positions[0]
        }
      }

      if (colIdx !== undefined && colFieldMap[colIdx] === undefined) {
        colFieldMap[colIdx] = mapping.dataField
        matchedDataFields.add(mapping.dataField)
        usedColIndices.add(colIdx)
      }
    })

    // 统计未匹配情况
    const unmatchedExcelHeaders = headers
      .filter((h, idx) => h && colFieldMap[idx] === undefined)
      .filter((h, idx, arr) => arr.indexOf(h) === idx)

    const allMappingFields = [...new Set(fieldMapping.map(m => m.dataField))]
    const unmatchedMappingFields = allMappingFields.filter(f => !matchedDataFields.has(f))

    const effectiveStartRow = Math.max(effectiveHeaderRow + 1, startRow)

    // ===== 读取数据行 =====
    const data = []
    const errors = []
    let rowCount = 0
    let detectedCurrency = ''

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber < effectiveStartRow) return

      let isEmpty = true
      row.eachCell((cell) => {
        if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
          isEmpty = false
        }
      })
      if (isEmpty) return

      rowCount++
      let rowData = {}
      let rowCurrency = ''

      row.eachCell((cell, colNumber) => {
        const field = colFieldMap[colNumber - 1]
        if (!field) return

        let value

        if (dateFields.includes(field)) {
          value = readCellDate(cell)
        } else if (amountFields.includes(field)) {
          const { value: amtVal, currency } = readCellAmount(cell)
          value = amtVal
          if (currency && !rowCurrency) {
            rowCurrency = currency
          }
        } else if (numericFields.includes(field)) {
          // 数字字段（数量等）：直接读取数字，不做日期序列号转换
          value = cell.value
          if (value && typeof value === 'object') {
            value = readCellValue(cell)
          }
          const num = Number(value)
          value = isNaN(num) ? value : num
        } else {
          value = readCellValue(cell)
          if (typeof value === 'number') {
            // 可能是日期序列号
            if (value >= 1 && value <= 60000) {
              const dateVal = excelSerialToDate(value)
              if (dateVal && /\d{4}-\d{2}-\d{2}/.test(dateVal)) {
                value = dateVal
              }
            }
          }
        }

        rowData[field] = value
      })

      if (rowCurrency && !rowData.currency) {
        rowData.currency = rowCurrency
        if (!detectedCurrency) {
          detectedCurrency = rowCurrency
        }
      }

      if (validateRow) {
        const validation = validateRow(rowData, rowNumber)
        if (!validation.valid) {
          errors.push({ row: rowNumber, error: validation.error || '数据验证失败' })
          return
        }
      }

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

    // 字段全部未匹配
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
      unmatchedMappingFields,
      detectedCurrency
    }

  } catch (error) {
    console.error('Excel 导入错误:', error)
    return { success: false, message: `导入失败: ${error.message}` }
  }
}

/**
 * 创建导入预览数据
 */
export function createImportPreview(data, fieldMapping) {
  const headers = fieldMapping.map(m => m.excelHeader)
  const previewRows = data.slice(0, 10)

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
 */
export const fieldMappingPresets = {
  customers: [
    { excelHeader: '客户ID', dataField: 'id' },
    { excelHeader: 'id', dataField: 'id' },
    { excelHeader: 'ID', dataField: 'id' },
    { excelHeader: '客户姓名', dataField: 'name' },
    { excelHeader: 'name', dataField: 'name' },
    { excelHeader: '客户分组', dataField: 'group' },
    { excelHeader: '国家', dataField: 'country' },
    { excelHeader: '地区', dataField: 'region' },
    { excelHeader: '公司', dataField: 'company' },
    { excelHeader: '海外邮箱', dataField: 'email' },
    { excelHeader: '电话', dataField: 'phone' },
    { excelHeader: '地址', dataField: 'address' },
    { excelHeader: '对接机型', dataField: 'model' },
    { excelHeader: '首次联系日期', dataField: 'firstContactDate' },
    { excelHeader: '备注', dataField: 'remark' }
  ],

  sampleDeliveries: [
    { excelHeader: '寄样编号', dataField: 'id' },
    { excelHeader: '样机编号', dataField: 'id' },
    { excelHeader: '客户姓名', dataField: 'customer_name' },
    { excelHeader: '客户名称', dataField: 'customer_name' },
    { excelHeader: '机型', dataField: 'model' },
    { excelHeader: '型号', dataField: 'model' },
    { excelHeader: '数量', dataField: 'qty' },
    { excelHeader: '寄样数量', dataField: 'qty' },
    { excelHeader: '发货日期', dataField: 'send_date' },
    { excelHeader: '收货地区', dataField: 'area' },
    { excelHeader: '国家', dataField: 'area' },
    { excelHeader: '物流方式', dataField: 'logistics' },
    { excelHeader: '运单号', dataField: 'tracking_no' },
    { excelHeader: '运费', dataField: 'freight' },
    { excelHeader: '状态', dataField: 'status' },
    { excelHeader: '备注', dataField: 'remark' }
  ],

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

  productModels: [
    { excelHeader: '机型ID', dataField: 'id' },
    { excelHeader: '机型名称', dataField: 'name' },
    { excelHeader: '芯片方案', dataField: 'chip' },
    { excelHeader: '屏幕参数', dataField: 'screen' },
    { excelHeader: '配套认证', dataField: 'certifications' },
    { excelHeader: '供应商', dataField: 'supplier' },
    { excelHeader: '备注', dataField: 'remark' }
  ],

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

  logisticsBills: [
    { excelHeader: '对账ID', dataField: 'id' },
    { excelHeader: '关联运单号', dataField: 'logisticsNo' },
    { excelHeader: '客户姓名', dataField: 'customerName' },
    { excelHeader: '国家', dataField: 'country' },
    { excelHeader: '货代公司', dataField: 'freightForwarder' },
    { excelHeader: '运费金额', dataField: 'freightAmount' },
    { excelHeader: '付款状态', dataField: 'paymentStatus' },
    { excelHeader: '核销日期', dataField: 'writeOffDate' }
  ],

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

  customerGroups: [
    { excelHeader: '分组名称', dataField: 'name' },
    { excelHeader: '客户列表', dataField: 'customers' }
  ],

  deliveryAllocations: [
    { excelHeader: '分配编号', dataField: 'id' },
    { excelHeader: '订单编号', dataField: 'poNumber' },
    { excelHeader: '订单日期', dataField: 'orderDate' },
    { excelHeader: '产品名称', dataField: 'productName' },
    { excelHeader: '型号', dataField: 'model' },
    { excelHeader: '规格型号', dataField: 'specModel' },
    { excelHeader: '内存配置', dataField: 'memoryConfig' },
    { excelHeader: '数量', dataField: 'orderQty' },
    { excelHeader: '国家', dataField: 'destinationCountry' },
    { excelHeader: '插头', dataField: 'plugSpec' },
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
    { excelHeader: '清关认证备注', dataField: 'certRemark' },
    { excelHeader: '是否样机', dataField: 'isSample' },
    { excelHeader: '备注', dataField: 'remark' }
  ],

  // 订单交期管控台账 - 更新字段映射以匹配实际表格结构
  deliverySchedules: [
    { excelHeader: '管控ID', dataField: 'id' },
    { excelHeader: '订单号', dataField: 'orderId' },
    { excelHeader: 'PO单号', dataField: 'orderId' },
    { excelHeader: 'PO号', dataField: 'orderId' },
    { excelHeader: '客户姓名', dataField: 'customerName' },
    { excelHeader: '客户名称', dataField: 'customerName' },
    { excelHeader: '客户', dataField: 'customerName' },
    { excelHeader: '机型', dataField: 'model' },
    { excelHeader: '型号', dataField: 'model' },
    { excelHeader: '产品型号', dataField: 'model' },
    { excelHeader: '配置颜色', dataField: 'configColor' },
    { excelHeader: '规格型号', dataField: 'configColor' },
    { excelHeader: '内存配置', dataField: 'memoryConfig' },
    { excelHeader: '订单数量', dataField: 'orderQty' },
    { excelHeader: '数量', dataField: 'orderQty' },
    { excelHeader: '下单日期', dataField: 'orderDate' },
    { excelHeader: '订单日期', dataField: 'orderDate' },
    { excelHeader: '承诺客户交期', dataField: 'promiseDate' },
    { excelHeader: '承诺交期', dataField: 'promiseDate' },
    { excelHeader: '客户交期', dataField: 'promiseDate' },
    { excelHeader: 'SMT贴片完工日', dataField: 'smtDate' },
    { excelHeader: 'SMT完工日', dataField: 'smtDate' },
    { excelHeader: '整机入库日期', dataField: 'warehouseDate' },
    { excelHeader: '入库日期', dataField: 'warehouseDate' },
    { excelHeader: '实际发货日期', dataField: 'actualShipDate' },
    { excelHeader: '发货日期', dataField: 'actualShipDate' },
    { excelHeader: '整体物流方式', dataField: 'logistics' },
    { excelHeader: '物流方式', dataField: 'logistics' },
    { excelHeader: '物流', dataField: 'logistics' },
    { excelHeader: '客户分组', dataField: 'customerGroup' },
    { excelHeader: '目的国家', dataField: 'destinationCountry' },
    { excelHeader: '国家', dataField: 'destinationCountry' },
    { excelHeader: '插头规格', dataField: 'plugSpec' },
    { excelHeader: '插头', dataField: 'plugSpec' },
    { excelHeader: '状态', dataField: 'status' },
    { excelHeader: '订单状态', dataField: 'status' },
    { excelHeader: '备注', dataField: 'remark' },
    { excelHeader: '说明', dataField: 'remark' }
  ],

  // 客户付款记录 - 完整映射所有20个业务字段
  customerPayments: [
    { excelHeader: '记录ID', dataField: 'id' },
    { excelHeader: '客户姓名', dataField: 'customerName' },
    { excelHeader: '客户', dataField: 'customerName' },
    { excelHeader: '客户名称', dataField: 'customerName' },
    { excelHeader: '收款主体', dataField: 'receivingEntityName' },
    { excelHeader: '收款公司', dataField: 'receivingEntityName' },
    { excelHeader: '主体', dataField: 'receivingEntityName' },
    { excelHeader: '订单编号', dataField: 'orderNo' },
    { excelHeader: '订单号', dataField: 'orderNo' },
    { excelHeader: 'PO号', dataField: 'orderNo' },
    { excelHeader: '订单日期', dataField: 'orderDate' },
    { excelHeader: '下单日期', dataField: 'orderDate' },
    { excelHeader: '产品名称', dataField: 'productName' },
    { excelHeader: '产品', dataField: 'productName' },
    { excelHeader: '规格型号', dataField: 'specModel' },
    { excelHeader: '规格', dataField: 'specModel' },
    // 颜色字段 - 使用 colIndex 指定第二处重复的"规格型号"列
    { excelHeader: '规格型号', colIndex: 6, dataField: 'color' },
    { excelHeader: '颜色', dataField: 'color' },
    { excelHeader: '内存配置', dataField: 'memoryConfig' },
    { excelHeader: '内存', dataField: 'memoryConfig' },
    { excelHeader: '型号', dataField: 'model' },
    { excelHeader: '机型', dataField: 'model' },
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
    { excelHeader: '币种', dataField: 'currency' },
    { excelHeader: '货币', dataField: 'currency' },
    { excelHeader: 'Currency', dataField: 'currency' },
    { excelHeader: '备注', dataField: 'remark' },
    { excelHeader: '说明', dataField: 'remark' }
  ]
}

/**
 * 获取付款记录的日期字段列表
 */
export function getPaymentDateFields() {
  return ['orderDate', 'deliveryDate', 'paymentDate']
}

/**
 * 获取付款记录的金额字段列表
 */
export function getPaymentAmountFields() {
  return ['unitPrice', 'orderAmount', 'paymentAmount']
}

/**
 * 获取订单交期管控的日期字段列表
 */
export function getScheduleDateFields() {
  return ['orderDate', 'promiseDate', 'smtDate', 'warehouseDate', 'actualShipDate', 'latestEta']
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
    if (result.detectedCurrency) {
      ElMessage.info(`检测到货币类型：${result.detectedCurrency}`)
    }
  } else {
    ElMessage.error(result.message || '导入失败')
  }
}

/**
 * 通用：Excel 导入 + 合并到本地 store + 云端同步
 */
export async function importAndSync(opts) {
  const {
    file, fieldMapping, tableName, storeData,
    mergeFn = null,
    transformFn = null,
    confirmText = null,
    headerRow = 2,
    startRow = 3,
    dateFields = [],
    amountFields = []
  } = opts

  const result = await importFromExcel(file, {
    fieldMapping,
    headerRow,
    startRow,
    dateFields,
    amountFields
  })

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

  const { saveToLocalStorage } = await import('../store.js').catch(() => ({ saveToLocalStorage: () => {} }))
  if (typeof saveToLocalStorage === 'function') saveToLocalStorage()

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