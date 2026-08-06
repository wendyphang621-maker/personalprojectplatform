import ExcelJS from 'exceljs'

export async function exportToExcel(sheetName, headers, data, options = {}) {
  const workbook = new ExcelJS.Workbook()
  
  workbook.creator = '项目工作台'
  workbook.lastModifiedBy = '项目工作台'
  workbook.created = new Date()
  workbook.modified = new Date()
  
  const worksheet = workbook.addWorksheet(sheetName)
  
  if (options.template === 'quotation') {
    return exportQuotationTemplate(worksheet, sheetName, data)
  }
  
  if (options.template === 'order') {
    return exportOrderTemplate(worksheet, sheetName, data)
  }
  
  if (options.template === 'sample') {
    return exportSampleTemplate(worksheet, sheetName, data)
  }
  
  if (options.template === 'bill') {
    return exportBillTemplate(worksheet, sheetName, data)
  }
  
  const titleRow = worksheet.addRow([`${sheetName} - ${new Date().toLocaleDateString('zh-CN')}`])
  titleRow.font = {
    name: '微软雅黑',
    size: 16,
    bold: true,
    color: { argb: 'FF1a1a2e' }
  }
  titleRow.alignment = { horizontal: 'center' }
  worksheet.mergeCells(`A1:${getColumnLetter(headers.length)}1`)
  
  worksheet.addRow([])
  
  const headerRow = worksheet.addRow(headers)
  headerRow.font = {
    name: '微软雅黑',
    size: 12,
    bold: true,
    color: { argb: 'FFFFFFFF' }
  }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1a1a2e' }
  }
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
  headerRow.height = 28
  
  data.forEach(rowData => {
    const row = worksheet.addRow(rowData)
    row.font = {
      name: '微软雅黑',
      size: 11
    }
    row.alignment = { vertical: 'middle' }
    row.height = 22
  })
  
  const defaultWidths = [8, 15, 15, 20, 15, 15, 12, 12, 15, 10, 15, 12, 15, 12, 15, 12]
  
  headers.forEach((header, index) => {
    const contentWidths = data.map(row => {
      const cell = row[index]
      if (cell === null || cell === undefined) return 0
      const str = String(cell)
      let width = str.length
      if (/[\u4e00-\u9fa5]/.test(str)) {
        width = width * 1.5
      }
      return width
    })
    
    const maxContentWidth = Math.max(...contentWidths, header.length * 1.2)
    const defaultWidth = defaultWidths[index] || 12
    
    worksheet.getColumn(index + 1).width = Math.max(maxContentWidth + 2, defaultWidth)
    
    worksheet.getColumn(index + 1).alignment = {
      horizontal: isNumeric(data.map(r => r[index])) ? 'right' : 'left',
      vertical: 'middle'
    }
  })
  
  const range = worksheet.getCell(`A3:${getColumnLetter(headers.length)}${data.length + 2}`)
  range.border = {
    top: { style: 'thin', color: { argb: 'FFd0d0d0' } },
    left: { style: 'thin', color: { argb: 'FFd0d0d0' } },
    bottom: { style: 'thin', color: { argb: 'FFd0d0d0' } },
    right: { style: 'thin', color: { argb: 'FFd0d0d0' } }
  }
  
  worksheet.freezePanes = 'A3'
  
  worksheet.autoFilter = {
    from: { row: 2, column: 1 },
    to: { row: data.length + 2, column: headers.length }
  }
  
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${sheetName}_${new Date().toISOString().split('T')[0]}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

async function exportQuotationTemplate(worksheet, sheetName, data) {
  let rowNum = 1
  
  for (let quoteIdx = 0; quoteIdx < data.length; quoteIdx++) {
    const quote = data[quoteIdx]
    
    worksheet.addRow([])
    rowNum++
    
    const titleRow = worksheet.addRow(['报价单'])
    titleRow.font = {
      name: '微软雅黑',
      size: 20,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    }
    titleRow.alignment = { horizontal: 'center', vertical: 'middle' }
    titleRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF333333' }
    }
    titleRow.height = 35
    worksheet.mergeCells(`A${rowNum}:H${rowNum}`)
    rowNum++
    
    worksheet.addRow([])
    rowNum++
    
    const infoRow1 = worksheet.addRow(['报价单编号:', quote.id, '日期:', quote.quoteDate, '', '', '', ''])
    infoRow1.font = { name: '微软雅黑', size: 11 }
    rowNum++
    
    const infoRow2 = worksheet.addRow(['客户名称:', quote.customerName, '联系人:', '', '', '', '', ''])
    infoRow2.font = { name: '微软雅黑', size: 11 }
    rowNum++
    
    const infoRow3 = worksheet.addRow(['联系电话:', '', '报价有效期:', quote.validUntil || '30天', '', '', '', ''])
    infoRow3.font = { name: '微软雅黑', size: 11 }
    rowNum++
    
    worksheet.addRow([])
    rowNum++
    
    const tableHeaders = worksheet.addRow(['序号', '商品名称', '规格型号', '单位', '数量', '单价', '金额', '备注'])
    tableHeaders.font = {
      name: '微软雅黑',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    }
    tableHeaders.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF333333' }
    }
    tableHeaders.alignment = { horizontal: 'center', vertical: 'middle' }
    tableHeaders.height = 25
    rowNum++
    
    const itemRow = worksheet.addRow(['1', quote.product, quote.product, '台', quote.quantity, quote.unitPrice, quote.totalAmount, quote.remark || ''])
    itemRow.font = { name: '微软雅黑', size: 11 }
    itemRow.alignment = { vertical: 'middle' }
    rowNum++
    
    for (let i = 0; i < 8; i++) {
      const emptyRow = worksheet.addRow(['', '', '', '', '', '', '', ''])
      emptyRow.font = { name: '微软雅黑', size: 11 }
    }
    rowNum += 8
    
    const totalRow1 = worksheet.addRow(['', '', '', '', '', '合计金额:', quote.totalAmount + ' ' + quote.currency, ''])
    totalRow1.font = { name: '微软雅黑', size: 11, bold: true }
    totalRow1.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF333333' }
    }
    totalRow1.alignment = { horizontal: 'center', vertical: 'middle' }
    rowNum++
    
    const totalRow2 = worksheet.addRow(['', '', '', '', '税率:', '0.13', '税额:', ''])
    totalRow2.font = { name: '微软雅黑', size: 11, bold: true }
    totalRow2.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF333333' }
    }
    totalRow2.alignment = { horizontal: 'center', vertical: 'middle' }
    rowNum++
    
    const totalRow3 = worksheet.addRow(['', '', '', '', '', '报价总价:', quote.totalAmount + ' ' + quote.currency, ''])
    totalRow3.font = { name: '微软雅黑', size: 12, bold: true, color: { argb: 'FFFF0000' } }
    totalRow3.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF333333' }
    }
    totalRow3.alignment = { horizontal: 'center', vertical: 'middle' }
    rowNum++
    
    if (quoteIdx < data.length - 1) {
      worksheet.addRow([''])
      rowNum++
    }
  }
  
  const widths = [6, 15, 15, 8, 8, 12, 12, 15]
  widths.forEach((w, i) => {
    worksheet.getColumn(i + 1).width = w
    worksheet.getColumn(i + 1).alignment = { vertical: 'middle' }
  })
  
  const buffer = await worksheet.workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${sheetName}_${new Date().toISOString().split('T')[0]}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

async function exportBillTemplate(worksheet, sheetName, data) {
  const headers = ['对账ID', '关联运单号', '客户姓名', '国家', '货代公司', '运费金额', '付款状态', '核销日期']
  
  const titleRow = worksheet.addRow([`${sheetName} - ${new Date().toLocaleDateString('zh-CN')}`])
  titleRow.font = {
    name: '微软雅黑',
    size: 16,
    bold: true,
    color: { argb: 'FFFFFFFF' }
  }
  titleRow.alignment = { horizontal: 'center' }
  titleRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF333333' }
  }
  titleRow.height = 35
  worksheet.mergeCells('A1:H1')
  
  worksheet.addRow([])
  
  const headerRow = worksheet.addRow(headers)
  headerRow.font = {
    name: '微软雅黑',
    size: 12,
    bold: true,
    color: { argb: 'FFFFFFFF' }
  }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF333333' }
  }
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
  headerRow.height = 28
  
  data.forEach(bill => {
    worksheet.addRow([
      bill.id,
      bill.logisticsNo,
      bill.customerName,
      bill.country,
      bill.freightForwarder,
      bill.freightAmount,
      bill.paymentStatus === 'paid' ? '已付款' : bill.paymentStatus === 'verified' ? '已核销' : '未付款',
      bill.writeOffDate || ''
    ])
  })
  
  const widths = [10, 15, 12, 10, 12, 12, 10, 12]
  widths.forEach((w, i) => {
    worksheet.getColumn(i + 1).width = w
    worksheet.getColumn(i + 1).alignment = { vertical: 'middle', horizontal: i === 5 ? 'right' : 'left' }
  })
  
  const buffer = await worksheet.workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${sheetName}_${new Date().toISOString().split('T')[0]}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

async function exportOrderTemplate(worksheet, sheetName, data) {
  let rowNum = 1
  
  for (let orderIdx = 0; orderIdx < data.length; orderIdx++) {
    const order = data[orderIdx]
    
    worksheet.addRow([])
    rowNum++
    
    const titleRow = worksheet.addRow(['大货订单'])
    titleRow.font = {
      name: '微软雅黑',
      size: 20,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    }
    titleRow.alignment = { horizontal: 'center', vertical: 'middle' }
    titleRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF333333' }
    }
    titleRow.height = 35
    worksheet.mergeCells(`A${rowNum}:H${rowNum}`)
    rowNum++
    
    worksheet.addRow([])
    rowNum++
    
    const infoRow1 = worksheet.addRow(['订单编号:', order.id, '日期:', order.bookingDate, '', '', '', ''])
    infoRow1.font = { name: '微软雅黑', size: 11 }
    rowNum++
    
    const infoRow2 = worksheet.addRow(['客户名称:', order.customerName, '订单类型:', order.orderType || '大货订单', '', '', '', ''])
    infoRow2.font = { name: '微软雅黑', size: 11 }
    rowNum++
    
    const infoRow3 = worksheet.addRow(['物流单号:', order.logisticsNo || '', '出货状态:', order.status, '', '', '', ''])
    infoRow3.font = { name: '微软雅黑', size: 11 }
    rowNum++
    
    worksheet.addRow([])
    rowNum++
    
    const tableHeaders = worksheet.addRow(['序号', '商品名称', '规格型号', '单位', '数量', '单价', '金额', '备注'])
    tableHeaders.font = {
      name: '微软雅黑',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    }
    tableHeaders.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF333333' }
    }
    tableHeaders.alignment = { horizontal: 'center', vertical: 'middle' }
    tableHeaders.height = 25
    rowNum++
    
    const itemRow = worksheet.addRow(['1', order.model, order.model, '台', order.qty, '', order.amount || '', ''])
    itemRow.font = { name: '微软雅黑', size: 11 }
    itemRow.alignment = { vertical: 'middle' }
    rowNum++
    
    for (let i = 0; i < 8; i++) {
      const emptyRow = worksheet.addRow(['', '', '', '', '', '', '', ''])
      emptyRow.font = { name: '微软雅黑', size: 11 }
    }
    rowNum += 8
    
    const totalRow1 = worksheet.addRow(['', '', '', '', '', '合计货款:', (order.amount || '') + ' ' + (order.currency || 'USD'), ''])
    totalRow1.font = { name: '微软雅黑', size: 11, bold: true }
    totalRow1.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF333333' }
    }
    totalRow1.alignment = { horizontal: 'center', vertical: 'middle' }
    rowNum++
    
    const totalRow2 = worksheet.addRow(['', '', '', '', '', '大货运费:', (order.bulkFreight || 0) + ' ' + (order.currency || 'USD'), ''])
    totalRow2.font = { name: '微软雅黑', size: 11, bold: true }
    totalRow2.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF333333' }
    }
    totalRow2.alignment = { horizontal: 'center', vertical: 'middle' }
    rowNum++
    
    const totalRow3 = worksheet.addRow(['', '', '', '', '尾款状态:', order.balanceSettled ? '已结清' : '未结清', '', ''])
    totalRow3.font = { name: '微软雅黑', size: 11, bold: true }
    totalRow3.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF333333' }
    }
    totalRow3.alignment = { horizontal: 'center', vertical: 'middle' }
    rowNum++
    
    if (orderIdx < data.length - 1) {
      worksheet.addRow([''])
      rowNum++
    }
  }
  
  const widths = [6, 15, 15, 8, 8, 12, 12, 15]
  widths.forEach((w, i) => {
    worksheet.getColumn(i + 1).width = w
    worksheet.getColumn(i + 1).alignment = { vertical: 'middle' }
  })
  
  const buffer = await worksheet.workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${sheetName}_${new Date().toISOString().split('T')[0]}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

async function exportSampleTemplate(worksheet, sheetName, data) {
  let rowNum = 1
  
  for (let sampleIdx = 0; sampleIdx < data.length; sampleIdx++) {
    const sample = data[sampleIdx]
    
    worksheet.addRow([])
    rowNum++
    
    const titleRow = worksheet.addRow(['样机寄样'])
    titleRow.font = {
      name: '微软雅黑',
      size: 20,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    }
    titleRow.alignment = { horizontal: 'center', vertical: 'middle' }
    titleRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF333333' }
    }
    titleRow.height = 35
    worksheet.mergeCells(`A${rowNum}:H${rowNum}`)
    rowNum++
    
    worksheet.addRow([])
    rowNum++
    
    const infoRow1 = worksheet.addRow(['寄样编号:', sample.id, '发货日期:', sample.send_date, '', '', '', ''])
    infoRow1.font = { name: '微软雅黑', size: 11 }
    rowNum++
    
    const infoRow2 = worksheet.addRow(['客户名称:', sample.customer_name, '机型:', sample.model, '', '', '', ''])
    infoRow2.font = { name: '微软雅黑', size: 11 }
    rowNum++
    
    const infoRow3 = worksheet.addRow(['收货地区:', sample.area || '-', '物流方式:', sample.logistics || '-', '', '', '', ''])
    infoRow3.font = { name: '微软雅黑', size: 11 }
    rowNum++
    
    const infoRow4 = worksheet.addRow(['运单号:', sample.tracking_no || '-', '备注:', sample.remark || '-', '', '', '', ''])
    infoRow4.font = { name: '微软雅黑', size: 11 }
    rowNum++
    
    worksheet.addRow([])
    rowNum++
    
    const tableHeaders = worksheet.addRow(['序号', '项目', '详情', '', '', '', '', ''])
    tableHeaders.font = {
      name: '微软雅黑',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    }
    tableHeaders.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF333333' }
    }
    tableHeaders.alignment = { horizontal: 'center', vertical: 'middle' }
    tableHeaders.height = 25
    rowNum++
    
    const feeRow1 = worksheet.addRow(['1', '寄样编号', sample.id, '', '', '', '', ''])
    feeRow1.font = { name: '微软雅黑', size: 11 }
    rowNum++
    
    const feeRow2 = worksheet.addRow(['2', '客户名称', sample.customer_name, '', '', '', '', ''])
    feeRow2.font = { name: '微软雅黑', size: 11 }
    rowNum++
    
    const feeRow3 = worksheet.addRow(['3', '备注', sample.remark || '-', '', '', '', '', ''])
    feeRow3.font = { name: '微软雅黑', size: 11 }
    rowNum++
    
    for (let i = 0; i < 5; i++) {
      const emptyRow = worksheet.addRow(['', '', '', '', '', '', '', ''])
      emptyRow.font = { name: '微软雅黑', size: 11 }
    }
    rowNum += 5
    
    if (sampleIdx < data.length - 1) {
      worksheet.addRow([''])
      rowNum++
    }
  }
  
  const widths = [6, 15, 20, 8, 8, 12, 12, 15]
  widths.forEach((w, i) => {
    worksheet.getColumn(i + 1).width = w
    worksheet.getColumn(i + 1).alignment = { vertical: 'middle' }
  })
  
  const buffer = await worksheet.workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${sheetName}_${new Date().toISOString().split('T')[0]}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

function getColumnLetter(index) {
  let letter = ''
  let num = index
  
  while (num > 0) {
    num--
    letter = String.fromCharCode(65 + (num % 26)) + letter
    num = Math.floor(num / 26)
  }
  
  return letter
}

function isNumeric(values) {
  const nonEmptyValues = values.filter(v => v !== null && v !== undefined && v !== '')
  if (nonEmptyValues.length === 0) return false
  
  return nonEmptyValues.every(v => {
    const num = Number(v)
    return !isNaN(num) && isFinite(num)
  })
}

export function showExportPreview(headers, data, title = '') {
  const previewData = {
    title: title || '导出预览',
    headers,
    data,
    totalRows: data.length,
    totalColumns: headers.length
  }
  
  window.dispatchEvent(new CustomEvent('excel-preview', { detail: previewData }))
}

export function exportToCSV(headers, data, filename = 'export') {
  const BOM = '\uFEFF'
  
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return ''
    const str = String(value)
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return '"' + str.replace(/"/g, '""') + '"'
    }
    return str
  }
  
  const headerLine = headers.map(h => escapeCSV(h)).join(',')
  const dataLines = data.map(row => row.map(cell => escapeCSV(cell)).join(','))
  
  const csvContent = BOM + [headerLine, ...dataLines].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * 导出导入模板（仅表头 + 可选示例行 + 说明）
 * @param {String} sheetName - 工作表名称
 * @param {Array} columns - 列配置 [{ header: '文件名', field: 'name', width: 20, sample: 'CE证书.pdf' }, ...]
 * @param {Object} options - { includeSample: true, description: '说明文字' }
 */
export async function exportImportTemplate(sheetName, columns, options = {}) {
  const { includeSample = true, description = '' } = options

  const workbook = new ExcelJS.Workbook()
  workbook.creator = '项目工作台'
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet(sheetName)

  // 第1行：标题
  const titleRow = worksheet.addRow([`${sheetName}导入模板`])
  titleRow.font = {
    name: '微软雅黑',
    size: 14,
    bold: true,
    color: { argb: 'FFFFFFFF' }
  }
  titleRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1a1a2e' }
  }
  titleRow.alignment = { horizontal: 'center', vertical: 'middle' }
  titleRow.height = 30
  worksheet.mergeCells(`A1:${getColumnLetter(columns.length)}1`)

  // 第2行：表头
  const headers = columns.map(c => c.header)
  const headerRow = worksheet.addRow(headers)
  headerRow.font = {
    name: '微软雅黑',
    size: 11,
    bold: true,
    color: { argb: 'FFFFFFFF' }
  }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF409EFF' }
  }
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
  headerRow.height = 24

  // 第3行：示例行（可选）
  if (includeSample) {
    const sampleRow = worksheet.addRow(columns.map(c => c.sample || ''))
    sampleRow.font = {
      name: '微软雅黑',
      size: 10,
      italic: true,
      color: { argb: 'FF909399' }
    }
    sampleRow.alignment = { vertical: 'middle' }
    sampleRow.height = 20
  }

  // 说明行
  if (description) {
    worksheet.addRow([])
    const descRow = worksheet.addRow([description])
    descRow.font = {
      name: '微软雅黑',
      size: 10,
      color: { argb: 'FFE6A23C' }
    }
    worksheet.mergeCells(`A${descRow.number}:${getColumnLetter(columns.length)}${descRow.number}`)
  }

  // 列宽
  columns.forEach((c, i) => {
    worksheet.getColumn(i + 1).width = c.width || 18
  })

  // 表头边框
  const headerRange = worksheet.getCell(`A2:${getColumnLetter(columns.length)}2`)
  headerRange.border = {
    top: { style: 'thin', color: { argb: 'FFd0d0d0' } },
    left: { style: 'thin', color: { argb: 'FFd0d0d0' } },
    bottom: { style: 'thin', color: { argb: 'FFd0d0d0' } },
    right: { style: 'thin', color: { argb: 'FFd0d0d0' } }
  }

  worksheet.freezePanes = 'A3'

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${sheetName}_导入模板_${new Date().toISOString().split('T')[0]}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function handleExportError(error, tableName) {
  const errorMessages = {
    table_missing: `数据表「${tableName}」不存在，请先在 Supabase 创建对应数据表`,
    field_error: '字段名拼写错误，请检查数据库字段是否正确',
    permission: '权限不足，请检查 RLS 策略或重新登录',
    auth: '认证失败，请重新登录后重试',
    config: 'Supabase 未配置，请先配置云端连接信息',
    network: '网络连接失败，请检查网络后重试'
  }
  
  let message = errorMessages[error?.type] || error?.message || '未知错误'
  
  console.error(`[导出错误] ${tableName}:`, error)
  
  return {
    title: '导出失败',
    message: message,
    suggestion: getSuggestion(error?.type)
  }
}

function getSuggestion(errorType) {
  const suggestions = {
    table_missing: '请在 Supabase SQL 编辑器中运行建表语句，或联系管理员创建对应表',
    field_error: '请检查表单字段名与数据库字段是否完全匹配（使用小写下划线命名）',
    permission: '请检查 Supabase RLS 策略是否允许当前用户读写',
    auth: '请退出后重新登录，确保认证状态有效',
    config: '请点击左下角切换到云端模式并配置 Supabase 连接信息',
    network: '请检查网络连接，确保能访问 Supabase 服务'
  }
  return suggestions[errorType] || '请稍后重试，如果问题持续请联系管理员'
}