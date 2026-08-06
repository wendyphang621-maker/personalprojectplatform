<template>
  <div class="activate-config-manager">
    <div class="tab-content">
      <div class="search-bar">
        <el-select v-model="activateFilter.customer" placeholder="客户名称" clearable filterable allow-create default-first-option style="width: 140px">
          <el-option v-for="opt in customerOptions" :key="opt" :label="opt" :value="opt" />
        </el-select>
        <el-select v-model="activateFilter.model" placeholder="型号" clearable filterable allow-create default-first-option style="width: 120px">
          <el-option v-for="opt in modelOptions" :key="opt" :label="opt" :value="opt" />
        </el-select>
        <el-input v-model="activateFilter.country" placeholder="国家地区" clearable style="width: 120px" />
        <el-select v-model="activateFilter.enabled" placeholder="启用状态" clearable style="width: 120px">
          <el-option label="启用" :value="true" />
          <el-option label="停用" :value="false" />
        </el-select>
        <el-button type="primary" @click="handleAddActivateConfig" :disabled="!canEditActivate">新增配置</el-button>
        <el-button type="success" @click="triggerActivateImport" :disabled="!canEditActivate">导入Excel</el-button>
        <el-button @click="exportActivateConfigs">导出Excel</el-button>
        <el-button @click="refreshActivateList">刷新列表</el-button>
        <el-button type="danger" :disabled="selectedActivateIds.length === 0 || !canBatchDel" @click="batchDeleteActivateConfigs">
          批量删除<span v-if="selectedActivateIds.length">({{ selectedActivateIds.length }})</span>
        </el-button>
        <el-button type="warning" :disabled="selectedActivateIds.length === 0 || !canEditActivate" @click="batchDisableActivateConfigs">
          批量停用<span v-if="selectedActivateIds.length">({{ selectedActivateIds.length }})</span>
        </el-button>
        <el-button type="success" :disabled="selectedActivateIds.length === 0 || !canEditActivate" @click="batchEnableActivateConfigs">
          批量启用<span v-if="selectedActivateIds.length">({{ selectedActivateIds.length }})</span>
        </el-button>
      </div>
      <el-table :data="filteredActivateConfigs" border stripe @selection-change="val => selectedActivateIds = val.map(c => c.id)">
        <el-table-column type="selection" width="45" />
        <el-table-column prop="customer" label="客户名称" min-width="100" />
        <el-table-column prop="updateFrequency" label="更新频率" width="100" />
        <el-table-column prop="receiveEmail" label="接收激活数据邮箱" min-width="180" show-overflow-tooltip />
        <el-table-column prop="model" label="型号" min-width="100" />
        <el-table-column prop="country" label="国家" min-width="100" />
        <el-table-column label="软件版本号" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span style="white-space: pre-line">{{ row.softwareVersion }}</span>
          </template>
        </el-table-column>
        <el-table-column label="带IMEI" width="70">
          <template #default="{ row }">{{ row.needImei ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column label="需筛选" width="70">
          <template #default="{ row }">{{ row.needFilter ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column prop="exportTableName" label="导出数据表名" min-width="160" show-overflow-tooltip />
        <el-table-column prop="fotaSource" label="FOTA搜索数据源" min-width="140" show-overflow-tooltip />
        <el-table-column label="启用状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" size="small">{{ row.enabled ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEditActivateConfig(row)" :disabled="!canEditActivate">编辑</el-button>
            <el-button size="small" :type="row.enabled ? 'warning' : 'success'" @click="toggleActivateEnabled(row)" :disabled="!canEditActivate">
              {{ row.enabled ? '停用' : '启用' }}
            </el-button>
            <el-button size="small" type="danger" @click="handleDeleteActivateConfig(row)" :disabled="!canEditActivate">删除</el-button>
            <el-button size="small" type="primary" @click="addAsDailyReminder(row)">添加为每日待办</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <input
      ref="activateImportInput"
      type="file"
      accept=".xlsx,.xls"
      style="display: none"
      @change="handleActivateImport"
    />

    <el-dialog v-model="showActivateDialog" :title="isEditingActivate ? '编辑激活导出配置' : '新增激活导出配置'" width="640px">
      <el-form :model="activateForm" label-width="140px">
        <el-form-item label="客户名称">
          <el-select v-model="activateForm.customer" placeholder="必填，可选择或输入" filterable allow-create default-first-option style="width: 100%">
            <el-option v-for="opt in customerOptions" :key="opt" :label="opt" :value="opt" />
          </el-select>
        </el-form-item>
        <el-form-item label="更新频率">
          <el-input v-model="activateForm.updateFrequency" placeholder="如：每天/每周二/周一和周四/每两天" />
        </el-form-item>
        <el-form-item label="接收激活数据邮箱">
          <el-input v-model="activateForm.receiveEmail" placeholder="如：user@example.com" />
        </el-form-item>
        <el-form-item label="型号">
          <el-select v-model="activateForm.model" placeholder="必填，可选择或输入" filterable allow-create default-first-option style="width: 100%">
            <el-option v-for="opt in modelOptions" :key="opt" :label="opt" :value="opt" />
          </el-select>
        </el-form-item>
        <el-form-item label="国家">
          <el-input v-model="activateForm.country" placeholder="必填" />
        </el-form-item>
        <el-form-item label="软件版本号">
          <el-input v-model="activateForm.softwareVersion" type="textarea" :rows="3" placeholder="支持多行换行" />
        </el-form-item>
        <el-form-item label="是否需要带IMEI">
          <el-switch v-model="activateForm.needImei" />
        </el-form-item>
        <el-form-item label="是否需要筛选">
          <el-switch v-model="activateForm.needFilter" />
        </el-form-item>
        <el-form-item label="导出数据表名">
          <el-input v-model="activateForm.exportTableName" />
        </el-form-item>
        <el-form-item label="FOTA搜索数据源">
          <el-input v-model="activateForm.fotaSource" />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="activateForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showActivateDialog = false">取消</el-button>
        <el-button type="primary" @click="saveActivateConfig">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showActivateImportResult" title="导入结果" width="720px">
      <div style="display: flex; gap: 20px; margin-bottom: 20px;">
        <el-card shadow="hover" style="flex: 1;">
          <div style="text-align: center;">
            <div style="font-size: 24px; color: #67c23a; font-weight: bold;">{{ activateImportResult.success }}</div>
            <div style="color: #909399;">成功导入</div>
          </div>
        </el-card>
        <el-card shadow="hover" style="flex: 1;">
          <div style="text-align: center;">
            <div style="font-size: 24px; color: #e6a23c; font-weight: bold;">{{ activateImportResult.conflict }}</div>
            <div style="color: #909399;">重复冲突</div>
          </div>
        </el-card>
        <el-card shadow="hover" style="flex: 1;">
          <div style="text-align: center;">
            <div style="font-size: 24px; color: #f56c6c; font-weight: bold;">{{ activateImportResult.failed }}</div>
            <div style="color: #909399;">失败条数</div>
          </div>
        </el-card>
      </div>
      <div v-if="activateImportResult.failedRecords.length > 0">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span style="font-weight: bold;">失败明细（{{ activateImportResult.failedRecords.length }} 条）</span>
          <el-button size="small" @click="exportActivateFailedRecords">导出失败数据</el-button>
        </div>
        <el-table :data="activateImportResult.failedRecords" border max-height="300">
          <el-table-column prop="rowNo" label="行号" width="70" />
          <el-table-column prop="customer" label="客户" />
          <el-table-column prop="model" label="型号" />
          <el-table-column prop="country" label="国家" />
          <el-table-column prop="error" label="错误原因" show-overflow-tooltip />
        </el-table>
      </div>
      <template #footer>
        <el-button type="primary" @click="showActivateImportResult = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 导出预览对话框 -->
    <el-dialog v-model="showExportPreview" title="导出预览" width="900px">
      <div style="margin-bottom: 12px; display: flex; gap: 12px; align-items: center;">
        <el-tag type="info">共 {{ exportPreviewData.length }} 条记录</el-tag>
        <span style="color: #909399; font-size: 12px;">确认后将导出为 Excel 文件</span>
      </div>
      <el-table :data="exportPreviewData" border max-height="420" size="small">
        <el-table-column prop="customer" label="客户" width="100" />
        <el-table-column prop="updateFrequency" label="更新频率" width="90" />
        <el-table-column prop="receiveEmail" label="接收邮箱" min-width="150" show-overflow-tooltip />
        <el-table-column prop="model" label="型号" width="90" />
        <el-table-column prop="country" label="国家" width="80" />
        <el-table-column prop="softwareVersion" label="软件版本号" min-width="140" show-overflow-tooltip />
        <el-table-column prop="needImei" label="带IMEI" width="65">
          <template #default="{ row }">{{ row.needImei ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column prop="needFilter" label="需筛选" width="65">
          <template #default="{ row }">{{ row.needFilter ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column prop="exportTableName" label="导出数据表名" min-width="140" show-overflow-tooltip />
        <el-table-column prop="fotaSource" label="FOTA搜索数据源" min-width="120" show-overflow-tooltip />
        <el-table-column prop="enabled" label="启用状态" width="75">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" size="small">{{ row.enabled ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="showExportPreview = false">取消</el-button>
        <el-button type="primary" @click="confirmExport">确认导出</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { store, addActivateExportConfig, updateActivateExportConfig, deleteActivateExportConfig, addDailyReminder, canBatchDelete, canEditActivateConfig } from '../store.js'
import { exportToExcel } from '../utils/excelExport.js'
import { importFromExcel } from '../utils/excelImport.js'

const activateImportInput = ref(null)
const showActivateDialog = ref(false)
const showActivateImportResult = ref(false)
const isEditingActivate = ref(false)
const selectedActivateIds = ref([])
const canBatchDel = computed(() => canBatchDelete())
const canEditActivate = computed(() => canEditActivateConfig())
const showExportPreview = ref(false)
const exportPreviewData = ref([])
const exportHeaders = []

const activateFilter = reactive({ customer: '', model: '', country: '', enabled: '' })

const activateForm = reactive({
  id: '', customer: '', updateFrequency: '', receiveEmail: '', model: '',
  country: '', softwareVersion: '', needImei: false, needFilter: false,
  exportTableName: '', fotaSource: '', enabled: true
})

const activateImportResult = reactive({ success: 0, conflict: 0, failed: 0, failedRecords: [] })

const activateFieldMapping = [
  { excelHeader: '客户', dataField: 'customer' },
  { excelHeader: '更新频率', dataField: 'updateFrequency' },
  { excelHeader: '接受激活数据邮箱', dataField: 'receiveEmail' },
  { excelHeader: '型号', dataField: 'model' },
  { excelHeader: '国家', dataField: 'country' },
  { excelHeader: '软件版本号', dataField: 'softwareVersion' },
  { excelHeader: '是否需要带IMEI', dataField: 'needImei' },
  { excelHeader: '是否需要筛选', dataField: 'needFilter' },
  { excelHeader: '导出数据表名', dataField: 'exportTableName' },
  { excelHeader: 'FOTA搜索数据源', dataField: 'fotaSource' },
  { excelHeader: 'FOTA搜索数据', dataField: 'fotaSource' },
  { excelHeader: '备注', dataField: 'remark' }
]

const filteredActivateConfigs = computed(() => {
  return store.activateExportConfigs.filter(c => {
    if (activateFilter.customer && !c.customer.includes(activateFilter.customer)) return false
    if (activateFilter.model && !c.model.includes(activateFilter.model)) return false
    if (activateFilter.country && !c.country.includes(activateFilter.country)) return false
    if (activateFilter.enabled !== '' && activateFilter.enabled !== null && c.enabled !== activateFilter.enabled) return false
    return true
  })
})

const customerOptions = computed(() => {
  const set = new Set(store.activateExportConfigs.map(c => c.customer).filter(Boolean))
  return [...set].sort()
})

const modelOptions = computed(() => {
  const set = new Set(store.activateExportConfigs.map(c => c.model).filter(Boolean))
  return [...set].sort()
})

function handleAddActivateConfig() {
  isEditingActivate.value = false
  Object.assign(activateForm, {
    id: '', customer: '', updateFrequency: '', receiveEmail: '', model: '',
    country: '', softwareVersion: '', needImei: false, needFilter: false,
    exportTableName: '', fotaSource: '', enabled: true
  })
  showActivateDialog.value = true
}

function handleEditActivateConfig(row) {
  isEditingActivate.value = true
  Object.assign(activateForm, row)
  showActivateDialog.value = true
}

function saveActivateConfig() {
  if (!activateForm.customer.trim() || !activateForm.model.trim() || !activateForm.country.trim()) {
    ElMessage.warning('客户、型号、国家为必填项')
    return
  }
  if (activateForm.receiveEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(activateForm.receiveEmail)) {
    ElMessage.warning('邮箱格式错误')
    return
  }
  if (isEditingActivate.value) {
    updateActivateExportConfig(activateForm.id, { ...activateForm })
    ElMessage.success('更新成功')
  } else {
    addActivateExportConfig({ ...activateForm })
    ElMessage.success('新增成功')
  }
  showActivateDialog.value = false
}

function toggleActivateEnabled(row) {
  updateActivateExportConfig(row.id, { enabled: !row.enabled })
  ElMessage.success(row.enabled ? '已停用' : '已启用')
}

function handleDeleteActivateConfig(row) {
  ElMessageBox.confirm(`确认删除 ${row.customer}-${row.model} 配置？`, '提示', { type: 'warning' })
    .then(() => {
      deleteActivateExportConfig(row.id)
      ElMessage.success('删除成功')
    })
    .catch(() => {})
}

function batchDeleteActivateConfigs() {
  ElMessageBox.confirm(`确认批量删除 ${selectedActivateIds.value.length} 条配置？此操作不可恢复。`, '确认批量删除', { type: 'warning' })
    .then(() => {
      selectedActivateIds.value.forEach(id => deleteActivateExportConfig(id))
      ElMessage.success(`已删除 ${selectedActivateIds.value.length} 条配置`)
      selectedActivateIds.value = []
    })
    .catch(() => {})
}

function batchDisableActivateConfigs() {
  const count = selectedActivateIds.value.length
  ElMessageBox.confirm(`确认批量停用 ${count} 条配置？停用后仍可单独启用。`, '确认批量停用', { type: 'warning' })
    .then(() => {
      selectedActivateIds.value.forEach(id => updateActivateExportConfig(id, { enabled: false }))
      ElMessage.success(`已停用 ${count} 条配置`)
      selectedActivateIds.value = []
    })
    .catch(() => {})
}

function batchEnableActivateConfigs() {
  const count = selectedActivateIds.value.length
  ElMessageBox.confirm(`确认批量启用 ${count} 条配置？`, '确认批量启用', { type: 'success' })
    .then(() => {
      selectedActivateIds.value.forEach(id => updateActivateExportConfig(id, { enabled: true }))
      ElMessage.success(`已启用 ${count} 条配置`)
      selectedActivateIds.value = []
    })
    .catch(() => {})
}

function refreshActivateList() {
  ElMessage.success('列表已刷新')
}

function addAsDailyReminder(row) {
  const title = `激活导出-${row.customer}-${row.model}-${row.country}`
  addDailyReminder({
    title,
    businessType: 'activate_export',
    activateConfigId: row.id,
    remindTime: '09:00',
    repeatRule: row.updateFrequency === '每日' ? 'daily' : 'once',
    remark: `来源：激活配置 ${row.id}`
  })
  ElMessage.success('已添加为每日待办：' + title)
}

function exportActivateConfigs() {
  exportHeaders.length = 0
  exportHeaders.push('客户', '更新频率', '接收激活数据邮箱', '型号', '国家', '软件版本号', '是否需要带IMEI', '是否需要筛选', '导出数据表名', 'FOTA搜索数据源', '启用状态')
  
  exportPreviewData.value = filteredActivateConfigs.value.map(c => ({
    customer: c.customer || '',
    updateFrequency: c.updateFrequency || '',
    receiveEmail: c.receiveEmail || '',
    model: c.model || '',
    country: c.country || '',
    softwareVersion: c.softwareVersion || '',
    needImei: c.needImei ? '是' : '否',
    needFilter: c.needFilter ? '是' : '否',
    exportTableName: c.exportTableName || '',
    fotaSource: c.fotaSource || '',
    enabled: c.enabled ? '启用' : '停用'
  }))
  
  if (exportPreviewData.value.length === 0) {
    ElMessage.warning('没有可导出的数据')
    return
  }
  
  showExportPreview.value = true
}

function confirmExport() {
  const data = exportPreviewData.value.map(c => [
    c.customer, c.updateFrequency, c.receiveEmail, c.model, c.country,
    c.softwareVersion, c.needImei, c.needFilter, c.exportTableName, c.fotaSource, c.enabled
  ])
  exportToExcel('激活数据导出配置', [...exportHeaders], data)
  showExportPreview.value = false
  ElMessage.success('导出成功')
}

function exportActivateFailedRecords() {
  const headers = ['行号', '客户', '型号', '国家', '错误原因']
  const data = activateImportResult.failedRecords.map(r => [r.rowNo, r.customer, r.model, r.country, r.error])
  exportToExcel('导入失败明细', headers, data)
}

function triggerActivateImport() {
  activateImportInput.value?.click()
}

async function handleActivateImport(event) {
  const file = event.target.files[0]
  if (!file) return
  Object.assign(activateImportResult, { success: 0, conflict: 0, failed: 0, failedRecords: [] })

  const lastValues = {}
  const seenCombos = new Set()
  const existingCombos = new Set(
    store.activateExportConfigs.map(c => `${c.customer}|${c.model}|${c.country}`)
  )
  const successRecords = []

  try {
    const result = await importFromExcel(file, {
      fieldMapping: activateFieldMapping,
      headerRow: 2,
      startRow: 3,
      transformRow: (rowData) => {
        // 强制剔除 id 字段（数据库 BIGSERIAL 自增，禁止外部传入）
        delete rowData.id

        for (const key in rowData) {
          const val = (rowData[key] ?? '').toString().trim()
          if (val) {
            lastValues[key] = val
          } else if (lastValues[key]) {
            rowData[key] = lastValues[key]
          }
        }

        if (typeof console !== 'undefined' && console.debug) {
          console.debug('导入行数据:', { customer: rowData.customer, model: rowData.model, country: rowData.country, email: rowData.receiveEmail })
        }

        if (rowData.softwareVersion) {
          rowData.softwareVersion = rowData.softwareVersion
            .toString().replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
        }

        const toBool = v => ['是', 'true', 'TRUE', '1', 1, true, 'yes', 'Yes', 'YES'].includes(v)
        rowData.needImei = toBool(rowData.needImei)
        rowData.needFilter = toBool(rowData.needFilter)
        return rowData
      }
    })

    if (!result.success || !result.data || !Array.isArray(result.data)) {
      ElMessage.error(result.message || '导入失败：未解析到有效数据，请检查表头是否在第1行')
      return
    }

    result.data.forEach((item, idx) => {
      const rowNo = idx + 2
      const errors = []
      if (!item.customer) errors.push('客户必填')
      if (!item.model) errors.push('型号必填')
      if (!item.country) errors.push('国家必填')
      const email = (item.receiveEmail || '').toString().trim()
      if (email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        errors.push('邮箱格式错误')
      }
      const combo = `${item.customer}|${item.model}|${item.country}`
      if (errors.length) {
        activateImportResult.failed++
        activateImportResult.failedRecords.push({
          rowNo, customer: item.customer, model: item.model, country: item.country,
          error: errors.join('; ')
        })
      } else if (seenCombos.has(combo) || existingCombos.has(combo)) {
        activateImportResult.conflict++
      } else {
        seenCombos.add(combo)
        successRecords.push(item)
      }
    })

    successRecords.forEach(item => addActivateExportConfig(item))
    activateImportResult.success = successRecords.length
    showActivateImportResult.value = true
  } catch (err) {
    ElMessage.error('导入失败：' + err.message)
  } finally {
    event.target.value = ''
  }
}
</script>

<style scoped>
.tab-content {
  padding: 16px;
}
.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: center;
}
</style>
