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
          v-model="filterModel" 
          placeholder="按机型筛选" 
          clearable
          style="width: 160px"
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
          style="width: 140px"
        >
          <el-option 
            v-for="l in logisticsFilterOptions" 
            :key="l" 
            :label="l" 
            :value="l"
          />
        </el-select>
        <el-button type="primary" @click="openAddDialog">新增寄样</el-button>
        <el-button @click="showExportPreview">导出Excel</el-button>
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
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEditDialog(row)">编辑</el-button>
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
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { store, deleteSampleDelivery } from '../store.js'
import { exportToExcel } from '../utils/excelExport.js'
import SampleFormDialog from './SampleFormDialog.vue'

const searchKeyword = ref('')
const filterModel = ref('')
const filterLogistics = ref('')
const showDialog = ref(false)
const editingRow = ref(null)
const currentPage = ref(1)
const pageSize = 15
const showPreviewDialog = ref(false)
const sortProp = ref('send_date')
const sortOrder = ref('descending')
const sampleSelection = ref([])

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

const filteredSamples = computed(() => {
  let data = [...store.sampleDeliveries]
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    data = data.filter(s => 
      (s.customer_name || '').toLowerCase().includes(keyword)
    )
  }
  if (filterModel.value) {
    data = data.filter(s => s.model === filterModel.value)
  }
  if (filterLogistics.value) {
    data = data.filter(s => s.logistics === filterLogistics.value)
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
  if (sampleSelection.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      `确认批量删除 ${sampleSelection.value.length} 条寄样记录？此操作不可恢复`,
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
  const headers = ['寄样编号', '客户名称', '机型', '收货地区', '物流方式', '运单号', '发货日期', '备注']
  const data = sortedAndFiltered.value.map(s => [
    s.id || '-',
    s.customer_name || '-',
    s.model || '-',
    s.area || '-',
    s.logistics || '-',
    s.tracking_no || '-',
    s.send_date || '-',
    s.remark || '-'
  ])
  exportToExcel('寄样记录', headers, data)
  showPreviewDialog.value = false
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
