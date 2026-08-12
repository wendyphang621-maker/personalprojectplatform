<template>
  <div class="box-design-iteration">
    <!-- 标题栏 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">彩盒设计迭代管理</h2>
        <span class="page-subtitle">共 {{ filteredRecords.length }} / {{ records.length }} 条迭代记录</span>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleAdd" :disabled="!canEdit">新增迭代</el-button>
        <el-button type="success" @click="triggerImport" :disabled="!canEdit">导入 Excel</el-button>
        <el-button @click="downloadTemplate">导入模板</el-button>
        <el-button type="warning" @click="exportExcel">导出 Excel</el-button>
        <el-button @click="showCategoryDialog = true" :disabled="!canEdit">分项管理</el-button>
        <input ref="fileInputRef" type="file" accept=".xlsx,.xls" style="display:none" @change="handleImport" />
      </div>
    </div>

    <!-- 筛选区 + 视图切换 -->
    <div class="filter-bar">
      <span class="filter-label">产品：</span>
      <el-select v-model="productFilter" placeholder="按产品筛选" clearable filterable style="width: 180px;">
        <el-option v-for="m in store.productModels" :key="m.id" :label="m.name" :value="m.name" />
      </el-select>
      <span class="filter-label" style="margin-left: 12px;">分项：</span>
      <el-select v-model="categoryFilter" placeholder="按分项筛选" clearable filterable style="width: 180px;">
        <el-option v-for="c in allCategories" :key="c" :label="c" :value="c" />
      </el-select>
      <span class="filter-label" style="margin-left: 12px;">视图：</span>
      <el-radio-group v-model="viewMode">
        <el-radio-button label="matrix">矩阵视图</el-radio-button>
        <el-radio-button label="list">清单视图</el-radio-button>
      </el-radio-group>
      <el-button style="margin-left: 12px;" @click="resetFilter">重置</el-button>
    </div>

    <!-- 矩阵视图 -->
    <div v-if="viewMode === 'matrix'" class="matrix-view">
      <div class="matrix-tip" v-if="matrixRows.length > 0">
        <el-icon><InfoFilled /></el-icon>
        行 = 产品 × 分项，列 = 版本号，悬浮单元格查看完整信息
      </div>
      <el-table
        v-if="matrixRows.length > 0"
        :data="matrixRows"
        border
        stripe
        class="matrix-table"
      >
        <el-table-column label="产品 / 分项" min-width="200" fixed>
          <template #default="{ row }">
            <div class="matrix-row-label">
              <div class="matrix-product" :title="row.productName">{{ row.productName }}</div>
              <el-tag size="small" type="info">{{ row.category }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          v-for="ver in matrixVersions"
          :key="ver"
          :label="ver"
          min-width="220"
          align="center"
        >
          <template #header>
            <span class="matrix-version-header">{{ ver }}</span>
          </template>
          <template #default="{ row }">
            <el-tooltip
              v-if="row.cells[ver]"
              placement="top"
              :show-after="200"
              effect="light"
            >
              <template #content>
                <div class="cell-tooltip">
                  <div class="tooltip-title">{{ row.productName }} · {{ row.category }} · {{ ver }}</div>
                  <div v-if="row.cells[ver].sendTime"><b>发送时间：</b>{{ row.cells[ver].sendTime }}</div>
                  <div><b>设计提交信息：</b>{{ row.cells[ver].submitInfo || '-' }}</div>
                  <div><b>客户回复：</b>{{ row.cells[ver].customerReply || '-' }}</div>
                  <div v-if="row.cells[ver].attachments && row.cells[ver].attachments.length">
                    <b>附件：</b>
                    <div v-for="(att, idx) in row.cells[ver].attachments" :key="idx" class="tooltip-att">
                      <el-link type="primary" :href="att" target="_blank">{{ att }}</el-link>
                    </div>
                  </div>
                  <div v-if="row.cells[ver].remark"><b>备注：</b>{{ row.cells[ver].remark }}</div>
                </div>
              </template>
              <div class="matrix-cell" @click="handleCellClick(row.cells[ver])">
                <div class="cell-submit">{{ truncate(row.cells[ver].submitInfo, 28) || '已提交' }}</div>
                <div class="cell-reply" v-if="row.cells[ver].customerReply">
                  💬 {{ truncate(row.cells[ver].customerReply, 18) }}
                </div>
                <div class="cell-time" v-if="row.cells[ver].sendTime">{{ row.cells[ver].sendTime }}</div>
              </div>
            </el-tooltip>
            <span v-else class="empty-cell">—</span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无迭代数据，请先新增迭代记录或导入 Excel" />
    </div>

    <!-- 清单视图 -->
    <div v-else class="list-view">
      <el-table :data="filteredRecords" border stripe class="list-table">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="productName" label="产品名称" width="140" show-overflow-tooltip />
        <el-table-column prop="version" label="版本号" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.version }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分项名称" width="140">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="submitInfo" label="设计提交信息" min-width="200" show-overflow-tooltip />
        <el-table-column prop="sendTime" label="发送时间" width="120" />
        <el-table-column prop="customerReply" label="客户回复" min-width="180" show-overflow-tooltip />
        <el-table-column label="附件" width="100">
          <template #default="{ row }">
            <el-link v-if="row.attachments && row.attachments.length" type="primary" @click="previewAttachments(row)">
              {{ row.attachments.length }} 个附件
            </el-link>
            <span v-else style="color: #c0c4cc;">无</span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" width="140" show-overflow-tooltip />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handlePreview(row)">预览</el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)" :disabled="!canEdit">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)" :disabled="!canEdit">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="filteredRecords.length === 0" description="暂无迭代数据" />
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="showFormDialog" :title="isEditing ? '编辑迭代记录' : '新增迭代记录'" width="680px">
      <el-form :model="form" :rules="formRules" ref="formRef" label-width="110px">
        <el-form-item label="产品名称" prop="productName">
          <el-select v-model="form.productName" placeholder="请选择产品" filterable allow-create style="width: 100%">
            <el-option v-for="m in store.productModels" :key="m.id" :label="m.name" :value="m.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="版本号" prop="version">
          <el-input v-model="form.version" placeholder="如 V1.0, V1.1, V2.0" />
        </el-form-item>
        <el-form-item label="分项名称" prop="category">
          <el-select v-model="form.category" placeholder="请选择分项" filterable allow-create style="width: 100%">
            <el-option v-for="c in allCategories" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="发送时间" prop="sendTime">
          <el-date-picker
            v-model="form.sendTime"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择发送日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="设计提交信息" prop="submitInfo">
          <el-input v-model="form.submitInfo" type="textarea" :rows="3" placeholder="本次设计提交的内容说明" />
        </el-form-item>
        <el-form-item label="HTC 客户回复" prop="customerReply">
          <el-input v-model="form.customerReply" type="textarea" :rows="3" placeholder="客户反馈内容" />
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
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFormDialog = false">取消</el-button>
        <el-button type="primary" @click="saveForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog v-model="showPreviewDialog" title="迭代记录详情" width="640px">
      <el-descriptions v-if="previewRow" :column="2" border>
        <el-descriptions-item label="产品名称">{{ previewRow.productName }}</el-descriptions-item>
        <el-descriptions-item label="版本号">
          <el-tag size="small">{{ previewRow.version }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="分项名称">
          <el-tag size="small" type="info">{{ previewRow.category }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="发送时间">{{ previewRow.sendTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="设计提交信息" :span="2">{{ previewRow.submitInfo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="HTC 客户回复" :span="2">{{ previewRow.customerReply || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ previewRow.remark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="云端附件" :span="2">
          <div v-if="previewRow.attachments && previewRow.attachments.length">
            <div v-for="(att, idx) in previewRow.attachments" :key="idx" style="margin-bottom: 4px;">
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

    <!-- 附件预览对话框 -->
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

    <!-- 分项管理对话框 -->
    <el-dialog v-model="showCategoryDialog" title="分项管理" width="560px">
      <div class="category-manager">
        <div class="category-section">
          <div class="section-title">内置分项</div>
          <div class="category-tags">
            <el-tag v-for="c in builtinCategories" :key="c" class="category-tag" type="info">{{ c }}</el-tag>
          </div>
        </div>
        <div class="category-section">
          <div class="section-title">自定义分项</div>
          <div class="category-tags" v-if="customCategories.length > 0">
            <el-tag
              v-for="c in customCategories"
              :key="c"
              class="category-tag"
              closable
              @close="removeCustomCategory(c)"
            >{{ c }}</el-tag>
          </div>
          <el-empty v-else description="暂无自定义分项" :image-size="60" />
          <div class="add-category">
            <el-input v-model="newCategoryName" placeholder="输入新分项名称" style="width: 240px;" />
            <el-button type="primary" size="small" @click="addCustomCategory" style="margin-left: 8px;">添加</el-button>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showCategoryDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import { store, saveToLocalStorage } from '../store.js'
import { exportToExcel } from '../utils/excelExport.js'
import { isAdmin } from '../tabConfig.js'

// 常量配置
const STORAGE_KEY_RECORDS = 'box_iter_records'
const STORAGE_KEY_CATEGORIES = 'box_iter_categories'
const EXPORT_HEADERS = ['产品名称', '版本号', '分项名称', '设计提交信息', '发送时间', '客户回复', '附件', '备注']

// 内置分项（支持自定义新增，无需修改数据库）
const builtinCategories = [
  'ID Logo 位置',
  'Logo 设计',
  '彩盒设计',
  '3D rendering',
  'KSP',
  'PDP',
  '海报',
  '网页'
]

// 数据存储：迭代记录 + 自定义分项，持久化到 localStorage
const records = reactive([])
const customCategories = reactive([])

// 从 localStorage 加载迭代记录
function loadRecords() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_RECORDS)
    if (saved) {
      const arr = JSON.parse(saved)
      if (Array.isArray(arr)) {
        records.splice(0, records.length, ...arr)
      }
    }
  } catch (e) {
    console.warn('[BoxDesignIteration] 加载迭代记录失败:', e)
  }
}

// 持久化迭代记录
function persistRecords() {
  try {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records))
  } catch (e) {
    console.error('[BoxDesignIteration] 迭代记录保存失败:', e)
  }
}

// 从 localStorage 加载自定义分项
function loadCustomCategories() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CATEGORIES)
    if (saved) {
      const arr = JSON.parse(saved)
      if (Array.isArray(arr)) {
        customCategories.splice(0, customCategories.length, ...arr)
      }
    }
  } catch (e) {
    console.warn('[BoxDesignIteration] 加载自定义分项失败:', e)
  }
}

// 持久化自定义分项
function persistCustomCategories() {
  try {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(customCategories))
  } catch (e) {
    console.error('[BoxDesignIteration] 自定义分项保存失败:', e)
  }
}

// 统一保存
function saveData() {
  persistRecords()
  saveToLocalStorage()
}

// 所有分项（内置 + 自定义）
const allCategories = computed(() => [...builtinCategories, ...customCategories])

// 权限：仅管理员可编辑
const canEdit = computed(() => isAdmin())

// 筛选条件
const productFilter = ref('')
const categoryFilter = ref('')
const viewMode = ref('matrix')

// 筛选结果
const filteredRecords = computed(() => {
  return records.filter(r => {
    if (productFilter.value && r.productName !== productFilter.value) return false
    if (categoryFilter.value && r.category !== categoryFilter.value) return false
    return true
  })
})

// 版本号排序：解析 V1.0, V1.1, V2.0 为 [1, 0] 数组后数值排序
function parseVersion(ver) {
  if (!ver) return [0]
  const match = String(ver).trim().match(/^V?(\d+(?:\.\d+)*)/i)
  if (!match) return [0]
  return match[1].split('.').map(n => parseInt(n, 10) || 0)
}

function compareVersion(a, b) {
  const va = parseVersion(a)
  const vb = parseVersion(b)
  const len = Math.max(va.length, vb.length)
  for (let i = 0; i < len; i++) {
    const na = va[i] || 0
    const nb = vb[i] || 0
    if (na !== nb) return na - nb
  }
  return 0
}

// 矩阵视图：所有版本号（动态列），按版本号排序
const matrixVersions = computed(() => {
  const set = new Set()
  filteredRecords.value.forEach(r => {
    if (r.version) set.add(r.version)
  })
  return Array.from(set).sort(compareVersion)
})

// 矩阵视图：行 = 产品 × 分项，每个单元格包含对应版本的记录
const matrixRows = computed(() => {
  const rowMap = new Map()
  filteredRecords.value.forEach(r => {
    const key = `${r.productName}||${r.category}`
    if (!rowMap.has(key)) {
      rowMap.set(key, {
        productName: r.productName,
        category: r.category,
        cells: {}
      })
    }
    rowMap.get(key).cells[r.version] = r
  })
  // 按产品名 + 分项顺序排序
  const rows = Array.from(rowMap.values())
  rows.sort((a, b) => {
    if (a.productName !== b.productName) {
      return a.productName.localeCompare(b.productName, 'zh-CN')
    }
    const ai = allCategories.value.indexOf(a.category)
    const bi = allCategories.value.indexOf(b.category)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })
  return rows
})

// 文本截断
function truncate(str, maxLen) {
  if (!str) return ''
  const s = String(str)
  return s.length > maxLen ? s.slice(0, maxLen) + '…' : s
}

// 弹窗状态
const showFormDialog = ref(false)
const showPreviewDialog = ref(false)
const showAttachmentsDialog = ref(false)
const showCategoryDialog = ref(false)
const isEditing = ref(false)
const formRef = ref(null)
const previewRow = ref(null)
const fileInputRef = ref(null)
const newCategoryName = ref('')

const defaultForm = () => ({
  id: '',
  productName: '',
  version: 'V1.0',
  category: '',
  submitInfo: '',
  sendTime: '',
  customerReply: '',
  attachments: [],
  remark: ''
})

const form = reactive(defaultForm())

const formRules = {
  productName: [{ required: true, message: '请选择产品', trigger: 'change' }],
  version: [{ required: true, message: '请输入版本号', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分项', trigger: 'change' }]
}

// 生成 id
function genId() {
  return 'bdi' + Date.now() + Math.floor(Math.random() * 10000)
}

// 新增
function handleAdd() {
  Object.assign(form, defaultForm())
  form.sendTime = new Date().toISOString().split('T')[0]
  isEditing.value = false
  showFormDialog.value = true
}

// 编辑
function handleEdit(row) {
  Object.assign(form, {
    id: row.id,
    productName: row.productName || '',
    version: row.version || 'V1.0',
    category: row.category || '',
    submitInfo: row.submitInfo || '',
    sendTime: row.sendTime || '',
    customerReply: row.customerReply || '',
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
  if (!form.productName.toString().trim()) {
    ElMessage.warning('产品名称为必填项')
    return
  }
  if (!form.version.trim()) {
    ElMessage.warning('版本号为必填项')
    return
  }
  if (!form.category.toString().trim()) {
    ElMessage.warning('分项名称为必填项')
    return
  }

  // 清理附件空字符串
  form.attachments = (form.attachments || []).filter(a => a && a.trim())
  form.productName = form.productName.toString().trim()
  form.version = form.version.trim()
  form.category = form.category.toString().trim()

  if (isEditing.value) {
    const idx = records.findIndex(r => r.id === form.id)
    if (idx > -1) {
      records[idx] = { ...form }
    }
    ElMessage.success('更新成功')
  } else {
    records.push({ ...form, id: genId() })
    ElMessage.success('新增成功')
  }
  saveData()
  showFormDialog.value = false
}

// 删除
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确认删除「${row.productName} / ${row.version} / ${row.category}」迭代记录？此操作不可恢复。`,
      '确认删除',
      { type: 'warning' }
    )
  } catch {
    return
  }
  const idx = records.findIndex(r => r.id === row.id)
  if (idx > -1) {
    records.splice(idx, 1)
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

// 矩阵单元格点击：打开预览
function handleCellClick(row) {
  handlePreview(row)
}

// 重置筛选
function resetFilter() {
  productFilter.value = ''
  categoryFilter.value = ''
}

// 添加自定义分项
function addCustomCategory() {
  const name = newCategoryName.value.trim()
  if (!name) {
    ElMessage.warning('请输入分项名称')
    return
  }
  if (allCategories.value.includes(name)) {
    ElMessage.warning('该分项已存在')
    return
  }
  customCategories.push(name)
  persistCustomCategories()
  newCategoryName.value = ''
  ElMessage.success('分项已添加')
}

// 删除自定义分项
async function removeCustomCategory(name) {
  try {
    await ElMessageBox.confirm(`确认删除自定义分项「${name}」？`, '确认删除', { type: 'warning' })
  } catch {
    return
  }
  const idx = customCategories.indexOf(name)
  if (idx > -1) {
    customCategories.splice(idx, 1)
    persistCustomCategories()
    ElMessage.success('已删除')
  }
}

// 导出 Excel：导出当前清单视图数据
function exportExcel() {
  if (filteredRecords.value.length === 0) {
    ElMessage.warning('没有可导出的数据')
    return
  }
  const data = filteredRecords.value.map(r => [
    r.productName || '',
    r.version || '',
    r.category || '',
    r.submitInfo || '',
    r.sendTime || '',
    r.customerReply || '',
    (r.attachments || []).join('\n'),
    r.remark || ''
  ])
  exportToExcel('彩盒设计迭代记录', EXPORT_HEADERS, data)
  ElMessage.success('导出成功')
}

// 导入模板下载
async function downloadTemplate() {
  const sampleRow = ['E7 Elite', 'V1.0', '彩盒设计', '首版彩盒设计稿已发送客户确认', '2026-08-01', '客户要求调整 Logo 位置', 'https://example.com/box-v1.0.pdf', '首版']
  await exportToExcel('彩盒迭代导入模板', EXPORT_HEADERS, [sampleRow])
  ElMessage.success('模板已下载')
}

// 触发文件选择
function triggerImport() {
  if (!fileInputRef.value) return
  fileInputRef.value.value = ''
  fileInputRef.value.click()
}

// 导入 Excel：动态 import('xlsx') 解析
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
    const requiredFields = ['产品名称', '版本号', '分项名称']
    const missing = requiredFields.filter(f => !headers.includes(f))
    if (missing.length > 0) {
      ElMessage.error(`表头缺失必填字段：${missing.join('、')}。请先下载导入模板。`)
      return
    }
    const idxProduct = headers.indexOf('产品名称')
    const idxVersion = headers.indexOf('版本号')
    const idxCategory = headers.indexOf('分项名称')
    const idxSubmit = headers.indexOf('设计提交信息')
    const idxSendTime = headers.indexOf('发送时间')
    const idxReply = headers.indexOf('客户回复')
    const idxAttachments = headers.indexOf('附件')
    const idxRemark = headers.indexOf('备注')

    let successCount = 0
    let failCount = 0

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      // 全空行跳过
      if (!row || row.every(c => c === '' || c === null || c === undefined)) continue

      const productName = (row[idxProduct] ?? '').toString().trim()
      const version = (row[idxVersion] ?? '').toString().trim()
      const category = (row[idxCategory] ?? '').toString().trim()

      // 必填字段校验
      if (!productName || !version || !category) {
        failCount++
        continue
      }

      // 附件按换行拆分为数组
      const attRaw = idxAttachments >= 0 ? (row[idxAttachments] ?? '').toString().trim() : ''
      const attachments = attRaw ? attRaw.split(/[\n\r]+/).map(s => s.trim()).filter(Boolean) : []

      const newItem = {
        id: genId(),
        productName,
        version,
        category,
        submitInfo: idxSubmit >= 0 ? (row[idxSubmit] ?? '').toString().trim() : '',
        sendTime: idxSendTime >= 0 ? (row[idxSendTime] ?? '').toString().trim() : '',
        customerReply: idxReply >= 0 ? (row[idxReply] ?? '').toString().trim() : '',
        attachments,
        remark: idxRemark >= 0 ? (row[idxRemark] ?? '').toString().trim() : ''
      }
      records.push(newItem)
      successCount++
    }
    saveData()

    let msg = `导入完成：成功 ${successCount} 条`
    if (failCount > 0) msg += `，失败 ${failCount} 条（必填字段缺失）`
    ElMessage.success(msg)
  } catch (err) {
    console.error('[BoxDesignIteration] 导入失败:', err)
    ElMessage.error('导入失败：' + (err.message || err))
  }
}

// 初始化：加载本地数据
onMounted(() => {
  loadRecords()
  loadCustomCategories()
})
</script>

<style scoped>
.box-design-iteration {
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

/* 矩阵视图样式 */
.matrix-view {
  margin-top: 8px;
}

.matrix-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #909399;
  font-size: 12px;
  margin-bottom: 8px;
  padding: 6px 10px;
  background: #f4f4f5;
  border-radius: 4px;
}

.matrix-table {
  width: 100%;
}

.matrix-row-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.matrix-product {
  font-weight: 600;
  color: #303133;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.matrix-version-header {
  font-weight: 600;
  color: #409EFF;
}

.matrix-cell {
  cursor: pointer;
  padding: 6px 4px;
  border-radius: 4px;
  transition: background 0.2s;
  text-align: left;
}

.matrix-cell:hover {
  background: #ecf5ff;
}

.cell-submit {
  font-size: 12px;
  color: #303133;
  line-height: 1.4;
  word-break: break-all;
}

.cell-reply {
  font-size: 11px;
  color: #E6A23C;
  margin-top: 4px;
  line-height: 1.3;
  word-break: break-all;
}

.cell-time {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}

.empty-cell {
  color: #c0c4cc;
}

.cell-tooltip {
  max-width: 360px;
  font-size: 12px;
  line-height: 1.6;
  color: #303133;
}

.tooltip-title {
  font-weight: 600;
  margin-bottom: 6px;
  padding-bottom: 4px;
  border-bottom: 1px solid #ebeef5;
  color: #409EFF;
}

.tooltip-att {
  margin-left: 8px;
  margin-top: 2px;
}

/* 清单视图样式 */
.list-view {
  margin-top: 8px;
}

.list-table {
  width: 100%;
}

/* 附件编辑器 */
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

/* 分项管理 */
.category-manager {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.category-section {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 12px;
}

.section-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
  font-size: 14px;
}

.category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-tag {
  margin: 0;
}

.add-category {
  display: flex;
  align-items: center;
  margin-top: 12px;
}
</style>
