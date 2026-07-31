<template>
  <div class="sample-delivery">
    <div class="page-header">
      <h2>寄样记录</h2>
    </div>

    <div class="filter-bar">
      <div class="filter-row">
        <el-input 
          v-model="searchKeyword" 
          placeholder="按客户名称搜索" 
          clearable 
          style="width: 200px"
        />
        <el-select 
          v-model="filterCustomer" 
          placeholder="按客户筛选" 
          clearable
          style="width: 150px"
        >
          <el-option 
            v-for="c in customerFilterOptions" 
            :key="c" 
            :label="c" 
            :value="c"
          />
        </el-select>
        <el-select 
          v-model="filterModel" 
          placeholder="按机型筛选" 
          clearable
          style="width: 140px"
        >
          <el-option 
            v-for="m in modelFilterOptions" 
            :key="m" 
            :label="m" 
            :value="m"
          />
        </el-select>
        <el-select 
          v-model="filterLogistics" 
          placeholder="按物流筛选" 
          clearable
          style="width: 130px"
        >
          <el-option 
            v-for="l in logisticsFilterOptions" 
            :key="l" 
            :label="l" 
            :value="l"
          />
        </el-select>
        <el-select 
          v-model="filterStatus" 
          placeholder="按状态筛选" 
          clearable
          style="width: 120px"
        >
          <el-option 
            v-for="s in statusFilterOptions" 
            :key="s" 
            :label="s" 
            :value="s"
          />
        </el-select>
        <el-button type="primary" @click="openAddDialog">新增寄样</el-button>
        <el-button @click="showExportPreview">导出Excel</el-button>
        <el-button type="warning" @click="triggerSampleImport">导入Excel</el-button>
        <input type="file" ref="sampleImportInput" accept=".xlsx,.xls" style="display: none" @change="handleSampleImport" />
        <el-button type="danger" :disabled="sampleSelection.length === 0" @click="batchDeleteSamples">批量删除 ({{ sampleSelection.length }})</el-button>
      </div>
    </div>

    <el-table 
      ref="tableRef"
      :data="pagedData" 
      border 
      stripe 
      header-cell-class-name="table-header"
      style="width: 100%"
      :default-sort="{ prop: 'send_date', order: 'descending' }"
      @sort-change="handleSortChange"
      @selection-change="val => sampleSelection = val"
    >
      <el-table-column type="selection" width="45" />
      <el-table-column 
        prop="id" 
        label="寄样编号" 
        width="140"
        sortable="custom"
      />
      <el-table-column 
        prop="customer_name" 
        label="客户名称" 
        width="140"
        sortable="custom"
      />
      <el-table-column prop="model" label="机型" width="120">
        <template #default="{ row }">
          {{ row.model || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="area" label="收货地区" width="140">
        <template #default="{ row }">
          {{ row.area || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="logistics" label="物流方式" width="110">
        <template #default="{ row }">
          {{ row.logistics || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="tracking_no" label="运单号" width="160">
        <template #default="{ row }">
          {{ row.tracking_no || '-' }}
        </template>
      </el-table-column>
      <el-table-column 
        prop="send_date" 
        label="发货日期" 
        width="110"
        sortable="custom"
      >
        <template #default="{ row }">
          {{ row.send_date || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="150">
        <template #default="{ row }">
          {{ row.remark || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEditDialog(row)">编辑</el-button>
          <el-button size="small" type="primary" @click="openRowPreview(row)">预览</el-button>
          <el-button size="small" type="danger" @click="handleDeleteSample(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-bar">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="sortedAndFiltered.length"
        layout="total, prev, pager, next"
        background
      />
    </div>

    <SampleFormDialog 
      v-model:visible="showDialog" 
      :editing-row="editingRow"
      @submitted="handleSubmitted" 
    />

    <el-dialog 
      v-model="showPreviewDialog" 
      title="导出预览" 
      width="720px"
      @close="showPreviewDialog = false"
    >
      <div class="preview-info">
        <span>共 <strong>{{ filteredSamples.length }}</strong> 条记录将被导出</span>
      </div>
      <el-table 
        :data="previewData" 
        border 
        max-height="400"
        size="small"
      >
        <el-table-column prop="id" label="寄样编号" width="130" />
        <el-table-column prop="customer_name" label="客户名称" width="120" />
        <el-table-column prop="model" label="机型" width="110" />
        <el-table-column prop="area" label="收货地区" width="120">
          <template #default="{ row }">{{ row.area || '-' }}</template>
        </el-table-column>
        <el-table-column prop="logistics" label="物流" width="90">
          <template #default="{ row }">{{ row.logistics || '-' }}</template>
        </el-table-column>
        <el-table-column prop="tracking_no" label="运单号" width="140">
          <template #default="{ row }">{{ row.tracking_no || '-' }}</template>
        </el-table-column>
        <el-table-column prop="send_date" label="发货日期" width="100">
          <template #default="{ row }">{{ row.send_date || '-' }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="120">
          <template #default="{ row }">{{ row.remark || '-' }}</template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="showPreviewDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmExport">确认导出</el-button>
      </template>
    </el-dialog>

    <el-dialog 
      v-model="showRowPreview" 
      title="样机寄样详情" 
      width="700px"
      fullscreen
      @close="showRowPreview = false"
    >
      <el-descriptions 
        v-if="currentPreviewRow" 
        :column="2" 
        border 
        title="基本信息"
      >
        <el-descriptions-item label="样机编号">{{ currentPreviewRow.id || '-' }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ currentPreviewRow.customer_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="对接人">{{ currentPreviewRow.contact || '-' }}</el-descriptions-item>
        <el-descriptions-item label="机型">{{ currentPreviewRow.model || '-' }}</el-descriptions-item>
        <el-descriptions-item label="数量">{{ currentPreviewRow.qty || currentPreviewRow.sampleQty || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ currentPreviewRow.status || '-' }}</el-descriptions-item>
        <el-descriptions-item label="物流方式">{{ currentPreviewRow.logistics || '-' }}</el-descriptions-item>
        <el-descriptions-item label="物流单号">{{ currentPreviewRow.tracking_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发送日期">{{ currentPreviewRow.send_date || '-' }}</el-descriptions-item>
        <el-descriptions-item label="收货地区">{{ currentPreviewRow.area || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentPreviewRow.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="showRowPreview = false">关闭</el-button>
        <el-button type="primary" @click="printRow">打印</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { store, deleteSampleDelivery } from '../store.js'
import ExcelJS from 'exceljs'
import SampleFormDialog from './SampleFormDialog.vue'
import { importFromExcel, fieldMappingPresets, showImportResult } from '../utils/excelImport.js'

const searchKeyword = ref('')
const filterCustomer = ref('')
const filterModel = ref('')
const filterLogistics = ref('')
const filterStatus = ref('')
const showDialog = ref(false)
const editingRow = ref(null)
const currentPage = ref(1)
const pageSize = 15
const showPreviewDialog = ref(false)
const showRowPreview = ref(false)
const currentPreviewRow = ref(null)
const sortProp = ref('send_date')
const sortOrder = ref('descending')
const sampleSelection = ref([])
const sampleImportInput = ref(null)

const customerOptions = computed(() => {
  const names = new Set()
  store.sampleDeliveries.forEach(s => {
    if (s.customer_name) names.add(s.customer_name)
  })
  return Array.from(names).sort()
})

const modelFilterOptions = computed(() => {
  const names = new Set()
  store.productModels.forEach(m => {
    if (m.name) names.add(m.name)
  })
  store.sampleDeliveries.forEach(s => {
    if (s.model) names.add(s.model)
  })
  return Array.from(names).sort()
})

const logisticsFilterOptions = computed(() => {
  const logistics = new Set()
  store.sampleDeliveries.forEach(s => {
    if (s.logistics) logistics.add(s.logistics)
  })
  return Array.from(logistics).sort()
})

const customerFilterOptions = computed(() => {
  const names = new Set()
  store.sampleDeliveries.forEach(s => {
    if (s.customer_name) names.add(s.customer_name)
  })
  return Array.from(names).sort()
})

const statusFilterOptions = computed(() => {
  return ['待寄出', '运输中', '已签收', '异常']
})

const filteredSamples = computed(() => {
  let data = [...store.sampleDeliveries]
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    data = data.filter(s => 
      (s.customer_name || '').toLowerCase().includes(keyword)
    )
  }
  if (filterCustomer.value) {
    data = data.filter(s => s.customer_name === filterCustomer.value)
  }
  if (filterModel.value) {
    data = data.filter(s => s.model === filterModel.value)
  }
  if (filterLogistics.value) {
    data = data.filter(s => s.logistics === filterLogistics.value)
  }
  if (filterStatus.value) {
    data = data.filter(s => s.status === filterStatus.value)
  }
  return data
})

const sortedAndFiltered = computed(() => {
  const data = [...filteredSamples.value]
  if (sortProp.value && sortOrder.value) {
    data.sort((a, b) => {
      const va = a[sortProp.value] || ''
      const vb = b[sortProp.value] || ''
      if (va < vb) return sortOrder.value === 'ascending' ? -1 : 1
      if (va > vb) return sortOrder.value === 'ascending' ? 1 : -1
      return 0
    })
  }
  return data
})

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return sortedAndFiltered.value.slice(start, start + pageSize)
})

const previewData = computed(() => {
  return sortedAndFiltered.value.slice(0, 50)
})

function handleSortChange({ prop, order }) {
  sortProp.value = prop || 'send_date'
  sortOrder.value = order || 'descending'
}

function openAddDialog() {
  editingRow.value = null
  showDialog.value = true
}

function openEditDialog(row) {
  editingRow.value = { ...row }
  showDialog.value = true
}

async function handleDeleteSample(row) {
  try {
    await ElMessageBox.confirm(
      '确认删除这条寄样记录？',
      '删除确认',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
    )
    await deleteSampleDelivery(row.id)
    ElMessage.success('删除成功')
  } catch {
    // 取消删除
  }
}

async function batchDeleteSamples() {
  if (sampleSelection.value.length === 0) {
    ElMessage.warning('请先勾选需要操作的数据')
    return
  }
  try {
    await ElMessageBox.confirm(
      `已勾选 ${sampleSelection.value.length} 条数据，删除不可恢复，确认执行？`,
      '批量删除确认',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
    )
    for (const row of sampleSelection.value) {
      await deleteSampleDelivery(row.id)
    }
    sampleSelection.value = []
    ElMessage.success('批量删除成功')
  } catch {
    // 取消删除
  }
}

function handleSubmitted() {
  currentPage.value = 1
}

function showExportPreview() {
  if (sortedAndFiltered.value.length === 0) {
    ElMessage.warning('没有可导出的数据')
    return
  }
  showPreviewDialog.value = true
}

function confirmExport() {
  const headers = ['样机编号', '客户名称', '对接人', '机型', '数量', '物流方式', '物流单号', '发送日期', '状态', '备注']
  const exportData = sortedAndFiltered.value.map(s => [
    s.id || '-',
    s.customer_name || '-',
    s.contact || '-',
    s.model || '-',
    s.qty || s.sampleQty || '-',
    s.logistics || '-',
    s.tracking_no || '-',
    s.send_date || '-',
    s.status || '-',
    s.remark || '-'
  ])

  const workbook = new ExcelJS.Workbook()
  workbook.creator = '项目工作台'
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet('样机寄样')

  const titleRow = worksheet.addRow([`样机寄样台账 - ${new Date().toLocaleDateString('zh-CN')}`])
  titleRow.font = { name: '微软雅黑', size: 16, bold: true, color: { argb: 'FF1a1a2e' } }
  titleRow.alignment = { horizontal: 'center' }
  worksheet.mergeCells(`A1:J1`)

  worksheet.addRow([])

  const headerRow = worksheet.addRow(headers)
  headerRow.font = { name: '微软雅黑', size: 12, bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a1a2e' } }
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
  headerRow.height = 28

  exportData.forEach(rowData => {
    const row = worksheet.addRow(rowData)
    row.font = { name: '微软雅黑', size: 11 }
    row.alignment = { vertical: 'middle' }
    row.height = 22
  })

  const columnWidths = [14, 14, 12, 12, 8, 12, 16, 12, 10, 15]
  headers.forEach((_, index) => {
    const col = worksheet.getColumn(index + 1)
    col.width = columnWidths[index] || 12
    col.alignment = { vertical: 'middle', horizontal: 'left' }
  })

  const lastRow = exportData.length + 2
  if (exportData.length > 0) {
    const range = worksheet.getCell(`A3:J${lastRow}`)
    range.border = {
      top: { style: 'thin', color: { argb: 'FFd0d0d0' } },
      left: { style: 'thin', color: { argb: 'FFd0d0d0' } },
      bottom: { style: 'thin', color: { argb: 'FFd0d0d0' } },
      right: { style: 'thin', color: { argb: 'FFd0d0d0' } }
    }
  }

  worksheet.freezePanes = 'A3'

  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  const filename = `样机寄样_${y}${m}${d}.xlsx`

  workbook.xlsx.writeBuffer().then(buffer => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  })
  showPreviewDialog.value = false
}

function openRowPreview(row) {
  currentPreviewRow.value = row
  showRowPreview.value = true
}

function printRow() {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return
  const row = currentPreviewRow.value
  printWindow.document.write(`
    <html>
    <head>
      <title>样机寄样详情 - ${row.id}</title>
      <style>
        body { font-family: 'Microsoft YaHei', sans-serif; padding: 40px; }
        h1 { text-align: center; color: #303133; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        td { padding: 12px; border: 1px solid #dcdfe6; font-size: 14px; }
        td.label { background: #f5f7fa; font-weight: bold; width: 120px; color: #606266; }
      </style>
    </head>
    <body>
      <h1>样机寄样详情</h1>
      <table>
        <tr><td class="label">样机编号</td><td>${row.id || '-'}</td></tr>
        <tr><td class="label">客户名称</td><td>${row.customer_name || '-'}</td></tr>
        <tr><td class="label">对接人</td><td>${row.contact || '-'}</td></tr>
        <tr><td class="label">机型</td><td>${row.model || '-'}</td></tr>
        <tr><td class="label">数量</td><td>${row.qty || row.sampleQty || '-'}</td></tr>
        <tr><td class="label">物流方式</td><td>${row.logistics || '-'}</td></tr>
        <tr><td class="label">物流单号</td><td>${row.tracking_no || '-'}</td></tr>
        <tr><td class="label">发送日期</td><td>${row.send_date || '-'}</td></tr>
        <tr><td class="label">状态</td><td>${row.status || '-'}</td></tr>
        <tr><td class="label">备注</td><td>${row.remark || '-'}</td></tr>
      </table>
    </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.onload = () => {
    printWindow.print()
  }
}

function triggerSampleImport() {
  sampleImportInput.value?.click()
}

async function handleSampleImport(event) {
  const file = event.target.files[0]
  if (!file) return
  event.target.value = ''

  const result = await importFromExcel(file, {
    fieldMapping: fieldMappingPresets.sampleDeliveries,
    headerRow: 2,
    startRow: 3
  })

  if (!result.success) {
    ElMessage.error(result.message || '导入失败')
    return
  }

  ElMessageBox.confirm(
    `检测到 ${result.data.length} 条寄样数据，是否导入？\n注意：相同ID的记录将被覆盖`,
    '确认导入',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'info' }
  ).then(() => {
    result.data.forEach(sample => {
      const idx = store.sampleDeliveries.findIndex(s => s.id === sample.id)
      if (idx > -1) {
        store.sampleDeliveries[idx] = { ...store.sampleDeliveries[idx], ...sample }
      } else {
        store.sampleDeliveries.push({
          id: sample.id || `sd${Date.now()}`,
          customer_name: sample.customer_name || '',
          model: sample.model || '',
          qty: sample.qty || 1,
          send_date: sample.send_date || '',
          area: sample.area || '',
          logistics: sample.logistics || '',
          tracking_no: sample.tracking_no || '',
          freight: sample.freight || 0,
          status: sample.status || '待发货',
          remark: sample.remark || ''
        })
      }
    })
    ElMessage.success(`成功导入 ${result.data.length} 条寄样数据`)
  }).catch(() => {})
}
</script>

<style scoped>
.sample-delivery {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.page-header {
  margin-bottom: 16px;
}

.page-header h2 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.filter-bar {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
}

.filter-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.pagination-bar {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.preview-info {
  margin-bottom: 12px;
  padding: 10px 14px;
  background: #ecf5ff;
  border-radius: 4px;
  color: #409eff;
  font-size: 14px;
}

:deep(.el-table th.el-table__cell) {
  background-color: #f5f7fa !important;
  font-weight: bold;
  text-align: center;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background-color: #fafafa !important;
}

:deep(.el-table__body tr:hover > td) {
  background-color: #ecf5ff !important;
}
</style>
