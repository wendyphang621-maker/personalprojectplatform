import ExcelJS from 'exceljs'
import { ElMessage } from 'element-plus'

/**
 * 从 Excel 文件导入数据
 * @param {File} file - 用户选择的 Excel 文件
 * @param {Object} options - 配置选项
 * @param {Array} options.fieldMapping - 字段映射配置 [{ excelHeader: '客户ID', dataField: 'id' }, ...]
 * @param {Number} options.headerRow - 表头所在行（从1开始，默认2，第1行通常是标题）
 * @param {Function} options.validateRow - 行验证函数，返回 { valid: boolean, error?: string }
 * @param {Function} options.transformRow - 行转换函数，可对解析后的数据进行额外处理
 * @returns {Promise<{ success: boolean, data?: Array, errors?: Array, message?: string }>}
 */
export async function importFromExcel(file, options = {}) {
  const {
    fieldMapping = [],
    headerRow = 2,
    startRow = 3,
    validateRow = null,
    transformRow = null,
    sheetIndex = 0
  } = options

  try {
    const workbook = new ExcelJS.Workbook()
    const arrayBuffer = await file.arrayBuffer()
    await workbook.xlsx.load(arrayBuffer)

    const worksheet = workbook.worksheets[sheetIndex]
    if (!worksheet) {
      return { success: false, message: 'Excel 文件中没有找到工作表' }
    }

    // 读取表头
    const headerRowData = worksheet.getRow(headerRow)
    const headers = []
    headerRowData.eachCell((cell, colNumber) => {
      headers[colNumber - 1] = cell.value?.toString().trim() || ''
    })

    // 构建列索引映射：excelHeader -> colIndex
    const headerIndexMap = {}
    headers.forEach((header, idx) => {
      if (header) {
        headerIndexMap[header] = idx
      }
    })

    // 构建字段映射：colIndex -> dataField
    const colFieldMap = {}
    fieldMapping.forEach(mapping => {
      const colIdx = headerIndexMap[mapping.excelHeader]
      if (colIdx !== undefined) {
        colFieldMap[colIdx] = mapping.dataField
      }
    })

    // 读取数据行
    const data = []
    const errors = []
    let rowCount = 0

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber < startRow) return

      // 检查是否是空行
      let isEmpty = true
      row.eachCell((cell) => {
        if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
          isEmpty = false
        }
      })
      if (isEmpty) return

      rowCount++
      const rowData = {}

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

    return {
      success: true,
      data,
      errors,
      totalRows: rowCount,
      importedRows: data.length,
      skippedRows: errors.length
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
  // 客户主台账
  customers: [
    { excelHeader: '客户ID', dataField: 'id' },
    { excelHeader: '客户姓名', dataField: 'name' },
    { excelHeader: '客户分组', dataField: 'group' },
    { excelHeader: '国家', dataField: 'country' },
    { excelHeader: '地区', dataField: 'region' },
    { excelHeader: '公司', dataField: 'company' },
    { excelHeader: '海外邮箱', dataField: 'email' },
    { excelHeader: '电话', dataField: 'phone' },
    { excelHeader: '对接机型', dataField: 'model' },
    { excelHeader: '首次联系日期', dataField: 'firstContactDate' },
    { excelHeader: '本地产品素材路径', dataField: 'localMaterialPath' },
    { excelHeader: '备注', dataField: 'remark' }
  ],

  // 样机寄样申请
  sampleDeliveries: [
    { excelHeader: '寄样编号', dataField: 'id' },
    { excelHeader: '客户姓名', dataField: 'customer_name' },
    { excelHeader: '机型', dataField: 'model' },
    { excelHeader: '数量', dataField: 'qty' },
    { excelHeader: '发货日期', dataField: 'send_date' },
    { excelHeader: '收货地区', dataField: 'area' },
    { excelHeader: '物流方式', dataField: 'logistics' },
    { excelHeader: '运单号', dataField: 'tracking_no' },
    { excelHeader: '运费', dataField: 'freight' },
    { excelHeader: '状态', dataField: 'status' },
    { excelHeader: '备注', dataField: 'remark' }
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

  // 物流费用对账
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
    { excelHeader: 'PO编号', dataField: 'poNumber' },
    { excelHeader: 'CI编号', dataField: 'ciNumber' },
    { excelHeader: '客户名称', dataField: 'customerName' },
    { excelHeader: '客户分组', dataField: 'customerGroup' },
    { excelHeader: '机型', dataField: 'model' },
    { excelHeader: '硬件配置+颜色', dataField: 'hwConfig' },
    { excelHeader: '插头规格', dataField: 'plugSpec' },
    { excelHeader: '订单总数量', dataField: 'orderQty' },
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