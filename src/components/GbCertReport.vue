<template>
  <div class="gb-cert-report">
    <!-- 标题栏 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">GB 认证进度报表</h2>
        <span class="page-subtitle">共 {{ filteredReports.length }} / {{ reports.length }} 条</span>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleAdd" :disabled="!canEdit">新增项目</el-button>
        <el-button type="success" @click="triggerImport" :disabled="!canEdit">导入 Excel</el-button>
        <el-button @click="downloadTemplate">导入模板下载</el-button>
        <el-button type="warning" @click="exportExcel">导出 Excel</el-button>
        <el-button type="info" @click="generateReport">生成报表</el-button>
        <input ref="fileInputRef" type="file" accept=".xlsx,.xls" style="display:none" @change="handleImport" />
      </div>
    </div>

    <!-- 筛选区 -->
    <div class="filter-bar">
      <span class="filter-label">截止月份：</span>
      <el-date-picker
        v-model="filterMonth"
        type="month"
        placeholder="筛选截止日期所在月份"
        format="YYYY-MM"
        value-format="YYYY-MM"
        clearable
        style="width: 180px;"
      />
      <el-select v-model="statusFilter" placeholder="状态筛选" clearable style="width: 140px; margin-left: 12px;">
        <el-option v-for="s in statusOptions" :key="s" :label="s" :value="s" />
      </el-select>
      <el-select v-model="stageFilter" placeholder="阶段筛选" clearable style="width: 140px; margin-left: 12px;">
        <el-option v-for="s in stageOptions" :key="s" :label="s" :value="s" />
      </el-select>
      <el-input v-model="searchKey" placeholder="搜索项目名称/负责人" clearable style="width: 220px; margin-left: 12px;" />
      <el-button style="margin-left: 12px;" @click="resetFilter">重置</el-button>
    </div>

    <!-- 表格 -->
    <el-table :data="filteredReports" border stripe class="report-table">
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column prop="projectName" label="项目名称" min-width="180" show-overflow-tooltip />
      <el-table-column prop="stage" label="当前阶段" width="110">
        <template #default="{ row }">
          <el-tag size="small" type="info">{{ row.stage }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="进度百分比" width="220">
        <template #default="{ row }">
          <el-progress
            :percentage="Number(row.progress) || 0"
            :color="getProgressColor(row.progress)"
            :stroke-width="16"
            :text-inside="true"
          />
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="responsible" label="负责人" width="100" />
      <el-table-column prop="deadline" label="截止日期" width="120" />
      <el-table-column label="云端附件" width="120">
        <template #default="{ row }">
          <el-link v-if="row.attachments && row.attachments.length" type="primary" @click="previewAttachments(row)">
            {{ row.attachments.length }} 个附件
          </el-link>
          <span v-else style="color: #c0c4cc;">无</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="handlePreview(row)">预览</el-button>
          <el-button size="small" type="primary" @click="handleEdit(row)" :disabled="!canEdit">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)" :disabled="!canEdit">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="showFormDialog" :title="isEditing ? '编辑 GB 认证项目' : '新增 GB 认证项目'" width="640px">
      <el-form :model="form" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="项目名称" prop="projectName">
          <el-input v-model="form.projectName" placeholder="必填" />
        </el-form-item>
        <el-form-item label="当前阶段" prop="stage">
          <el-select v-model="form.stage" placeholder="请选择阶段" style="width: 100%">
            <el-option v-for="s in stageOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="进度百分比" prop="progress">
          <el-slider v-model="form.progress" :min="0" :max="100" show-input />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
            <el-option v-for="s in statusOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人" prop="responsible">
          <el-input v-model="form.responsible" placeholder="必填" />
        </el-form-item>
        <el-form-item label="截止日期" prop="deadline">
          <el-date-picker v-model="form.deadline" type="date" value-format="YYYY-MM-DD" placeholder="选择截止日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="云端附件">
          <div class="attachments-editor">
            <div v-for="(att, idx) in form.attachments" :key="idx" class="attachment-item">
              <el-input v-model="form.attachments[idx]" placeholder="附件链接（URL）" />
              <el-button type="danger" size="small" @click="form.attachments.splice(idx, 1)">删除</el-button>
            </div>
            <el-button size="small" @click="form.attachments.push('')">+ 添加附件</el-button>
          </div>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFormDialog = false">取消</el-button>
        <el-button type="primary" @click="saveForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog v-model="showPreviewDialog" title="项目详情预览" width="640px">
      <el-descriptions v-if="previewRow" :column="2" border>
        <el-descriptions-item label="项目名称">{{ previewRow.projectName }}</el-descriptions-item>
        <el-descriptions-item label="当前阶段">{{ previewRow.stage }}</el-descriptions-item>
        <el-descriptions-item label="进度百分比" :span="2">
          <el-progress
            :percentage="Number(previewRow.progress) || 0"
            :color="getProgressColor(previewRow.progress)"
            :stroke-width="16"
            :text-inside="true"
          />
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(previewRow.status)" size="small">{{ previewRow.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="负责人">{{ previewRow.responsible }}</el-descriptions-item>
        <el-descriptions-item label="截止日期">{{ previewRow.deadline || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ previewRow.remark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="云端附件" :span="2">
          <div v-if="previewRow.attachments && previewRow.attachments.length">
            <div v-for="(att, idx) in previewRow.attachments" :key="idx">
              <el-link type="primary" :href="att" target="_blank">{{ att }}</el-link>
            </div>
          </div>
          <span v-else style="color: #909399;">无</span>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="showPreviewDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 附件预览 -->
    <el-dialog v-model="showAttachmentsDialog" title="云端附件" width="520px">
      <div v-if="previewRow && previewRow.attachments && previewRow.attachments.length">
        <div v-for="(att, idx) in previewRow.attachments" :key="idx" style="margin-bottom: 8px;">
          <el-link type="primary" :href="att" target="_blank">{{ att }}</el-link>
        </div>
      </div>
      <div v-else style="color: #909399;">暂无附件</div>
      <template #footer>
        <el-button @click="showAttachmentsDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { store, saveToLocalStorage } from '../store.js'
import { exportToExcel, exportToCSV } from '../utils/excelExport.js'
import { isAdmin } from '../tabConfig.js'

// 常量配置
const statusOptions = ['规划中', '资料准备中', '测试中', '审核中', '已完成', '延期']
const stageOptions = ['立项', '资料提交', '样品测试', '报告审核', '证书发放']
const STORAGE_KEY = 'gb_cert_reports'
const EXPORT_HEADERS = ['项目名称', '当前阶段', '进度百分比', '状态', '负责人', '截止日期', '备注']

// 数据存储：优先使用 store.gbCertReports，否则使用本地 reactive 数组持久化到 localStorage
const localReports = reactive([])
const useLocalStore = computed(() => !Array.isArray(store.gbCertReports))

// 从 localStorage 加载数据
function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const arr = JSON.parse(saved)
      if (Array.isArray(arr)) {
        localReports.splice(0, localReports.length, ...arr)
      }
    }
  } catch (e) {
    console.warn('[GbCertReport] 加载本地数据失败:', e)
  }
}

// 持久化本地数据
function persistLocal() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localReports))
  } catch (e) {
    console.error('[GbCertReport] 本地数据保存失败:', e)
  }
}

// 统一 reports 引用：返回 store.gbCertReports 或本地数组
const reports = computed(() => useLocalStore.value ? localReports : store.gbCertReports)

// 统一保存
function saveData() {
  if (useLocalStore.value) {
    persistLocal()
  } else {
    saveToLocalStorage()
  }
}

// 筛选条件
const filterMonth = ref('')
const searchKey = ref('')
const statusFilter = ref('')
const stageFilter = ref('')

// 筛选结果
const filteredReports = computed(() => {
  return reports.value.filter(r => {
    // 月份筛选：截止日期所在月份
    if (filterMonth.value) {
      if (!r.deadline || !String(r.deadline).startsWith(filterMonth.value)) return false
    }
    if (statusFilter.value && r.status !== statusFilter.value) return false
    if (stageFilter.value && r.stage !== stageFilter.value) return false
    if (searchKey.value) {
      const k = searchKey.value.toLowerCase()
      const pn = (r.projectName || '').toLowerCase()
      const rp = (r.responsible || '').toLowerCase()
      if (!pn.includes(k) && !rp.includes(k)) return false
    }
    return true
  })
})

// 权限：仅管理员可编辑
const canEdit = computed(() => isAdmin())

// 弹窗状态
const showFormDialog = ref(false)
const showPreviewDialog = ref(false)
const showAttachmentsDialog = ref(false)
const isEditing = ref(false)
const formRef = ref(null)
const previewRow = ref(null)
const fileInputRef = ref(null)

const defaultForm = () => ({
  id: '',
  projectName: '',
  stage: '立项',
  progress: 0,
  status: '规划中',
  responsible: '',
  deadline: '',
  attachments: [],
  remark: ''
})

const form = reactive(defaultForm())

const formRules = {
  projectName: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  responsible: [{ required: true, message: '请输入负责人', trigger: 'blur' }]
}

// 进度条颜色：<30% 红色, 30-70% 橙色, >70% 绿色
function getProgressColor(progress) {
  const p = Number(progress) || 0
  if (p < 30) return '#F56C6C'
  if (p <= 70) return '#E6A23C'
  return '#67C23A'
}

// 状态对应的标签类型
function getStatusType(status) {
  const map = {
    '规划中': 'info',
    '资料准备中': '',
    '测试中': 'warning',
    '审核中': 'warning',
    '已完成': 'success',
    '延期': 'danger'
  }
  return map[status] || 'info'
}

// 生成 id
function genId() {
  return 'gb' + Date.now() + Math.floor(Math.random() * 10000)
}

// 新增
function handleAdd() {
  Object.assign(form, defaultForm())
  isEditing.value = false
  showFormDialog.value = true
}

// 编辑
function handleEdit(row) {
  Object.assign(form, {
    id: row.id,
    projectName: row.projectName || '',
    stage: row.stage || '立项',
    progress: Number(row.progress) || 0,
    status: row.status || '规划中',
    responsible: row.responsible || '',
    deadline: row.deadline || '',
    attachments: Array.isArray(row.attachments) ? [...row.attachments] : [],
    remark: row.remark || ''
  })
  isEditing.value = true
  showFormDialog.value = true
}

// 保存
async function saveForm() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch (e) {
    ElMessage.warning('请填写必填字段')
    return
  }

  // 必填字段二次校验
  if (!form.projectName.trim()) {
    ElMessage.warning('项目名称为必填项')
    return
  }
  if (!form.status) {
    ElMessage.warning('状态为必填项')
    return
  }
  if (!form.responsible.trim()) {
    ElMessage.warning('负责人为必填项')
    return
  }

  // 清理附件空字符串
  form.attachments = (form.attachments || []).filter(a => a && a.trim())

  if (isEditing.value) {
    const idx = reports.value.findIndex(r => r.id === form.id)
    if (idx > -1) {
      reports.value[idx] = { ...form }
    }
    ElMessage.success('更新成功')
  } else {
    reports.value.push({ ...form, id: genId() })
    ElMessage.success('新增成功')
  }
  saveData()
  showFormDialog.value = false
}

// 删除
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除项目「${row.projectName}」？此操作不可恢复。`, '确认删除', { type: 'warning' })
  } catch {
    return
  }
  const idx = reports.value.findIndex(r => r.id === row.id)
  if (idx > -1) {
    reports.value.splice(idx, 1)
    saveData()
    ElMessage.success('删除成功')
  }
}

// 预览
function handlePreview(row) {
  previewRow.value = row
  showPreviewDialog.value = true
}

// 预览附件
function previewAttachments(row) {
  previewRow.value = row
  showAttachmentsDialog.value = true
}

// 重置筛选
function resetFilter() {
  filterMonth.value = ''
  searchKey.value = ''
  statusFilter.value = ''
  stageFilter.value = ''
}

// 导出 Excel
function exportExcel() {
  if (filteredReports.value.length === 0) {
    ElMessage.warning('没有可导出的数据')
    return
  }
  const data = filteredReports.value.map(r => [
    r.projectName || '',
    r.stage || '',
    Number(r.progress) || 0,
    r.status || '',
    r.responsible || '',
    r.deadline || '',
    r.remark || ''
  ])
  exportToExcel('GB认证进度报表', EXPORT_HEADERS, data)
  ElMessage.success('导出成功')
}

// 生成报表：将当前筛选结果导出为 CSV
function generateReport() {
  if (filteredReports.value.length === 0) {
    ElMessage.warning('当前筛选结果为空')
    return
  }
  const data = filteredReports.value.map(r => [
    r.projectName || '',
    r.stage || '',
    Number(r.progress) || 0,
    r.status || '',
    r.responsible || '',
    r.deadline || '',
    r.remark || ''
  ])
  exportToCSV(EXPORT_HEADERS, data, 'GB认证进度报表')
  ElMessage.success('报表已生成')
}

// 导入模板下载：含表头 + 一行示例数据
async function downloadTemplate() {
  const sampleRow = ['示例项目-GB认证', '资料提交', 30, '资料准备中', '张三', '2024-12-31', '示例备注']
  await exportToExcel('GB认证导入模板', EXPORT_HEADERS, [sampleRow])
  ElMessage.success('模板已下载')
}

// 触发文件选择
function triggerImport() {
  if (!fileInputRef.value) return
  fileInputRef.value.value = ''
  fileInputRef.value.click()
}

// 导入 Excel：动态 import('xlsx')
async function handleImport(e) {
  const file = e.target.files[0]
  if (!file) return
  try {
    const XLSX = await import('xlsx')
    const buf = await file.arrayBuffer()
    const workbook = XLSX.read(buf, { type: 'array' })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' })
    if (rows.length === 0) {
      ElMessage.warning('Excel 文件为空')
      return
    }
    const headers = rows[0].map(h => String(h).trim())
    // 表头必填字段校验
    const requiredFields = ['项目名称', '状态', '负责人']
    const missing = requiredFields.filter(f => !headers.includes(f))
    if (missing.length > 0) {
      ElMessage.error(`表头缺失必填字段：${missing.join('、')}。请先下载导入模板。`)
      return
    }
    const idxName = headers.indexOf('项目名称')
    const idxStage = headers.indexOf('当前阶段')
    const idxProgress = headers.indexOf('进度百分比')
    const idxStatus = headers.indexOf('状态')
    const idxResponsible = headers.indexOf('负责人')
    const idxDeadline = headers.indexOf('截止日期')
    const idxRemark = headers.indexOf('备注')

    let successCount = 0
    let failCount = 0
    const warnedRows = []

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      // 全空行跳过
      if (!row || row.every(c => c === '' || c === null || c === undefined)) continue

      const projectName = (row[idxName] ?? '').toString().trim()
      const status = (row[idxStatus] ?? '').toString().trim()
      const responsible = (row[idxResponsible] ?? '').toString().trim()

      // 必填字段校验
      if (!projectName || !status || !responsible) {
        failCount++
        continue
      }

      // 状态/阶段合法性警告（不阻塞导入）
      if (!statusOptions.includes(status) && !warnedRows.includes(i + 1)) {
        warnedRows.push(i + 1)
        ElMessage.warning(`第 ${i + 1} 行状态「${status}」不在选项内，已保留原值`)
      }
      const stageVal = idxStage >= 0 ? (row[idxStage] ?? '').toString().trim() : ''
      if (stageVal && !stageOptions.includes(stageVal) && !warnedRows.includes(i + 1)) {
        warnedRows.push(i + 1)
        ElMessage.warning(`第 ${i + 1} 行阶段「${stageVal}」不在选项内，已保留原值`)
      }

      const progressRaw = idxProgress >= 0 ? Number(row[idxProgress]) : 0
      const newItem = {
        id: genId(),
        projectName,
        stage: stageVal || '立项',
        progress: isNaN(progressRaw) ? 0 : Math.max(0, Math.min(100, progressRaw)),
        status,
        responsible,
        deadline: idxDeadline >= 0 ? (row[idxDeadline] ?? '').toString().trim() : '',
        attachments: [],
        remark: idxRemark >= 0 ? (row[idxRemark] ?? '').toString().trim() : ''
      }
      reports.value.push(newItem)
      successCount++
    }
    saveData()

    let msg = `导入完成：成功 ${successCount} 条`
    if (failCount > 0) msg += `，失败 ${failCount} 条（必填字段缺失）`
    ElMessage.success(msg)
  } catch (err) {
    console.error('[GbCertReport] 导入失败:', err)
    ElMessage.error('导入失败：' + (err.message || err))
  }
}

// 初始化：加载本地数据
onMounted(() => {
  loadFromLocalStorage()
})
</script>

<style scoped>
.gb-cert-report {
  padding: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
  flex-wrap: wrap;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.page-subtitle {
  color: #909399;
  font-size: 13px;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 16px;
}

.filter-label {
  color: #606266;
  font-size: 14px;
}

.report-table {
  width: 100%;
}

.attachments-editor {
  width: 100%;
}

.attachment-item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.attachment-item .el-input {
  flex: 1;
}
</style>
