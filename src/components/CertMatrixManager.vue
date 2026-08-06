<template>
  <div class="cert-matrix-manager">
    <!-- 统计卡片 -->
    <div class="stat-cards" v-if="activeMatrixFiles.length > 0">
      <div class="stat-card">
        <span class="stat-num">{{ filteredModelCellCount }}</span>
        <span class="stat-label">{{ modelFilter ? '当前机型文件数' : '总文件数' }}</span>
      </div>
      <div class="stat-card done">
        <span class="stat-num">{{ filteredCountByStatus('done') }}</span>
        <span class="stat-label">已完成</span>
      </div>
      <div class="stat-card pending">
        <span class="stat-num">{{ filteredCountByStatus('pending') }}</span>
        <span class="stat-label">待准备</span>
      </div>
      <div class="stat-card progress">
        <span class="stat-num">{{ filteredCompletionRate }}%</span>
        <span class="stat-label">完成率</span>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="matrix-toolbar">
      <div class="toolbar-left">
        <el-select v-model="selectedTemplate" placeholder="选择模板" style="width: 200px;" @change="handleApplyTemplate" filterable>
          <el-option-group label="内置模板">
            <el-option v-for="(tpl, key) in templates" :key="key" :label="tpl.name" :value="key" />
          </el-option-group>
          <el-option-group label="自定义模板" v-if="store.certMatrixTemplates.length > 0">
            <el-option v-for="tpl in store.certMatrixTemplates" :key="tpl.id" :label="tpl.name" :value="tpl.id" />
          </el-option-group>
        </el-select>
        <el-button type="primary" @click="showAddFileDialog = true">添加文件项</el-button>
        <el-button @click="showAddModelDialog = true">批量添加机型</el-button>
        <el-button @click="showSaveTemplateDialog = true">保存为模板</el-button>
        <el-button @click="showStatusManager = true">状态管理</el-button>
        <el-button @click="triggerImport">导入矩阵</el-button>
        <input ref="importInput" type="file" accept=".xlsx,.xls" style="display:none" @change="handleImport" />
        <el-button @click="openExportDialog">导出矩阵</el-button>
        <el-button type="success" plain :disabled="!modelFilter" @click="exportSingleModelList">导出当前机型清单</el-button>
        <el-button type="warning" plain @click="jumpToOverviewTab">机型文件总览</el-button>
      </div>
      <div class="toolbar-right">
        <el-input v-model="fileSearchKey" placeholder="搜索文件名称" style="width: 180px;" clearable />
        <el-select v-model="modelFilter" placeholder="机型筛选" clearable style="width: 160px;">
          <el-option v-for="mid in selectedModelIds" :key="mid" :label="getModelName(mid)" :value="mid" />
        </el-select>
        <el-select v-model="statusFilter" placeholder="状态筛选" clearable style="width: 140px;">
          <el-option v-for="st in allStatuses" :key="st.key" :label="st.name" :value="st.key" />
        </el-select>
        <el-select v-model="certTypeFilter" placeholder="关联认证类型" clearable style="width: 140px;">
          <el-option label="CE" value="CE" />
          <el-option label="CB" value="CB" />
          <el-option label="SASO" value="SASO" />
          <el-option label="FCC" value="FCC" />
        </el-select>
      </div>
    </div>

    <!-- 图例 -->
    <div class="matrix-legend">
      <span v-for="st in allStatuses" :key="st.key" class="legend-item">
        <span class="legend-color" :style="{ background: st.color }"></span>
        {{ st.name }}
      </span>
    </div>

    <!-- 矩阵表格 -->
    <div class="matrix-table-wrapper">
      <table class="matrix-table" v-if="filteredMatrixFiles.length > 0">
        <thead>
          <tr>
            <th class="col-file sticky-col">认证文件项</th>
            <th v-for="modelId in visibleModelIds" :key="modelId" class="col-model">
              <div class="model-header">
                <span :title="getModelName(modelId)">{{ getModelName(modelId) }}</span>
                <span class="model-col-stats" :title="`已完成 ${getModelStats(modelId).done} / 总 ${getModelStats(modelId).total} | 待准备 ${getModelStats(modelId).pending}`">
                  已完成{{ getModelStats(modelId).done }}/{{ getModelStats(modelId).total }}
                  <span v-if="getModelStats(modelId).pending > 0" class="sep">|</span>
                  <span v-if="getModelStats(modelId).pending > 0" class="pending-num">待准备{{ getModelStats(modelId).pending }}</span>
                </span>
                <div class="col-actions">
                  <el-icon class="col-action-icon" @click="handleBatchColStatus(modelId, 'done')" title="整列已完成"><Check /></el-icon>
                  <el-icon class="col-action-icon remove" @click="confirmRemoveModelColumn(modelId)" title="移除列"><Close /></el-icon>
                </div>
              </div>
            </th>
            <th class="col-remark">备注</th>
            <th class="col-action">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(file, fIdx) in filteredMatrixFiles" :key="file.id" :draggable="true"
              @dragstart="onDragStart(fIdx)" @dragover.prevent @drop="onDrop(fIdx)">
            <td class="cell-file sticky-col">
              <div class="file-info">
                <el-icon class="drag-handle"><Rank /></el-icon>
                <div class="file-text">
                  <div class="file-name">{{ file.name }}</div>
                  <el-tag size="small" type="info">{{ getTemplateName(file.template) }}</el-tag>
                </div>
              </div>
            </td>
            <td v-for="modelId in visibleModelIds" :key="modelId"
                class="cell-status"
                :style="getCellStyle(file.id, modelId)"
                @click="cycleCellStatus(file.id, modelId)"
                @dblclick="editCellRemark(file.id, modelId)">
              <div class="cell-content">
                <span class="cell-status-label">{{ getCellStatusLabel(file.id, modelId) }}</span>
                <el-tooltip v-if="isCellDone(file.id, modelId)" :content="`文件已归档${getCellCertType(file.id, modelId) ? '，对应认证类型：' + getCellCertType(file.id, modelId) : ''}，可直接复用给新客户同机型订单`" placement="top">
                  <span class="archive-mark" title="已归档可复用">📂</span>
                </el-tooltip>
                <span class="cell-remark-icon" v-if="getCellRemark(file.id, modelId)">📝</span>
              </div>
            </td>
            <td class="cell-file-remark">
              <el-input v-model="file.remark" size="small" placeholder="备注" @change="updateFileRemark(file)" />
            </td>
            <td class="cell-action">
              <el-dropdown trigger="click" @command="(cmd) => handleRowCommand(cmd, file)">
                <el-button size="small" text>操作<el-icon><ArrowDown /></el-icon></el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="row_view_done">查看本机型已完成</el-dropdown-item>
                    <el-dropdown-item command="row_copy_progress">复制该行文件进度</el-dropdown-item>
                    <el-dropdown-item command="row_done" divided>整行设为已完成</el-dropdown-item>
                    <el-dropdown-item command="row_pending">整行设为待准备</el-dropdown-item>
                    <el-dropdown-item command="row_missing">整行设为缺失</el-dropdown-item>
                    <el-dropdown-item command="edit_name" divided>修改文件名</el-dropdown-item>
                    <el-dropdown-item command="delete" divided><span style="color:#f56c6c">删除文件项</span></el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </td>
          </tr>
        </tbody>
      </table>
      <el-empty v-else description="暂无文件项，请选择模板或添加文件项" />
    </div>

    <!-- 添加文件项弹窗 -->
    <el-dialog v-model="showAddFileDialog" title="添加认证文件项" width="500px">
      <el-form label-width="80px">
        <el-form-item label="文件名称">
          <el-input v-model="newFileName" placeholder="如：DOC、RF test report" />
        </el-form-item>
        <el-form-item label="分类标签">
          <el-select v-model="newFileCategory" placeholder="选择分类（可选）" clearable style="width: 100%;">
            <el-option label="RF 类" value="rf" />
            <el-option label="EMC 安全类" value="emc" />
            <el-option label="声明类" value="declaration" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注快捷标签">
          <div class="quick-tags">
            <el-tag
              v-for="tag in remarkQuickTags"
              :key="tag.text"
              class="quick-tag"
              :type="tag.type"
              effect="plain"
              @click="appendRemark(newFileRemark, tag.text)"
              style="cursor:pointer;margin-right:6px;margin-bottom:6px;"
            >{{ tag.text }}</el-tag>
          </div>
          <el-input v-model="newFileRemark" placeholder="可点击上方标签快速填入，或直接输入" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddFileDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddFile">确认添加</el-button>
      </template>
    </el-dialog>

    <!-- 批量添加机型弹窗 -->
    <el-dialog v-model="showAddModelDialog" title="批量添加机型列" width="650px">
      <div class="model-select-area">
        <div class="model-select-toolbar">
          <el-input v-model="modelSearchKey" placeholder="搜索机型名称" clearable style="flex:1;" />
          <el-button size="small" @click="selectAllModels">全选</el-button>
          <el-button size="small" @click="invertModels">反选</el-button>
          <el-button size="small" @click="tempSelectedModelIds = []">清空</el-button>
        </div>
        <el-checkbox-group v-model="tempSelectedModelIds" class="model-checkbox-group">
          <el-checkbox v-for="model in filteredModels" :key="model.id" :label="model.id" class="model-checkbox-item">
            {{ model.name }} <span class="model-country">({{ model.country || '-' }})</span>
          </el-checkbox>
        </el-checkbox-group>
        <div class="select-count">已选 {{ tempSelectedModelIds.length }} / {{ filteredModels.length }} 个</div>
      </div>
      <template #footer>
        <el-button @click="showAddModelDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddModels">确认添加</el-button>
      </template>
    </el-dialog>

    <!-- 保存自定义模板弹窗 -->
    <el-dialog v-model="showSaveTemplateDialog" title="保存为自定义模板" width="500px">
      <el-form label-width="80px">
        <el-form-item label="模板名称">
          <el-input v-model="newTemplateName" placeholder="如：中东客户专属认证" />
        </el-form-item>
        <el-form-item label="包含文件">
          <div class="template-files-preview">
            <el-tag v-for="f in activeMatrixFiles" :key="f.id" size="small" style="margin: 2px;">{{ f.name }}</el-tag>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSaveTemplateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveTemplate">保存</el-button>
      </template>
    </el-dialog>

    <!-- 状态管理弹窗 -->
    <el-dialog v-model="showStatusManager" title="状态管理" width="600px">
      <div class="status-manager">
        <div class="status-list">
          <div v-for="st in allStatuses" :key="st.id" class="status-item">
            <span class="status-color" :style="{ background: st.color }"></span>
            <span class="status-name">{{ st.name }}</span>
            <el-button v-if="st.id.startsWith('custom')" size="small" text type="danger" @click="handleDeleteStatus(st.id)">删除</el-button>
            <el-tag v-else size="small" type="info">内置</el-tag>
          </div>
        </div>
        <el-divider>新增自定义状态</el-divider>
        <div class="add-status-form">
          <el-input v-model="newStatusName" placeholder="状态名称" style="width: 150px;" />
          <el-color-picker v-model="newStatusColor" />
          <el-button type="primary" @click="handleAddStatus">添加</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 导出配置弹窗 -->
    <el-dialog v-model="showExportDialog" title="导出配置" width="550px">
      <el-form label-width="100px">
        <el-form-item label="文件名前缀">
          <el-input v-model="exportFileName" placeholder="如：DOC" style="width: 150px;" />
          <span style="margin-left: 8px; color: #909399; font-size: 12px;">_文件进度矩阵_日期.xlsx</span>
        </el-form-item>
        <el-form-item label="导出机型列">
          <el-checkbox-group v-model="exportSelectedModelIds" class="export-model-group">
            <el-checkbox v-for="modelId in selectedModelIds" :key="modelId" :label="modelId">
              {{ getModelName(modelId) }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="包含备注">
          <el-switch v-model="exportWithRemark" />
        </el-form-item>
        <el-form-item label="隐藏已完成行">
          <el-switch v-model="exportHideDone" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showExportDialog = false">取消</el-button>
        <el-button type="primary" @click="handleExport">确认导出</el-button>
      </template>
    </el-dialog>

    <!-- 导入预览弹窗 -->
    <el-dialog v-model="showImportPreview" title="导入预览" width="700px">
      <div class="import-preview">
        <el-alert v-if="importPreviewData.failed.length > 0" type="warning" :closable="false" show-icon
          :title="`${importPreviewData.failed.length} 行匹配失败，将跳过`" style="margin-bottom: 10px;" />
        <el-table :data="importPreviewData.success" border size="small" max-height="200" style="margin-bottom: 10px;">
          <el-table-column prop="fileName" label="文件名" />
          <el-table-column prop="modelCount" label="机型数" width="80" />
          <el-table-column label="状态" width="80">
            <template #default><el-tag type="success" size="small">成功</el-tag></template>
          </el-table-column>
        </el-table>
        <el-table v-if="importPreviewData.failed.length > 0" :data="importPreviewData.failed" border size="small" max-height="150">
          <el-table-column prop="fileName" label="文件名" />
          <el-table-column prop="reason" label="失败原因" />
        </el-table>
      </div>
      <template #footer>
        <el-button @click="showImportPreview = false">取消</el-button>
        <el-button type="primary" @click="confirmImport" :disabled="importPreviewData.success.length === 0">确认导入</el-button>
      </template>
    </el-dialog>

    <!-- 模板快照提示 -->
    <el-dialog v-model="snapshotHint.show" title="模板快照提示" width="500px" :close-on-click-modal="false">
      <div class="snapshot-hint">{{ snapshotHint.content }}</div>
      <template #footer>
        <el-button type="primary" @click="snapshotHint.show = false">知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Close, Check, Rank, ArrowDown } from '@element-plus/icons-vue'
import {
  store,
  CERT_FILE_TEMPLATES,
  MATRIX_STATUS_CONFIG,
  addCertMatrixFile,
  updateCertMatrixFile,
  deleteCertMatrixFile,
  setMatrixCell,
  getMatrixCell,
  applyCertTemplate,
  addModelsToMatrix,
  removeModelColumn,
  moveMatrixFile,
  batchSetRowStatus,
  batchSetColStatus,
  reorderMatrixFiles,
  saveCertMatrixTemplate,
  deleteCertMatrixTemplate,
  addCertMatrixStatus,
  deleteCertMatrixStatus,
  getAllMatrixStatuses
} from '../store.js'
import { importFromExcel } from '../utils/excelImport.js'
import { exportToExcel } from '../utils/excelExport.js'

const props = defineProps({
  initialCertType: {
    type: String,
    default: ''
  }
})
const emit = defineEmits(['filterConsumed', 'jumpToOverview'])

const templates = CERT_FILE_TEMPLATES
const allStatuses = computed(() => getAllMatrixStatuses())

const selectedTemplate = ref('')
const showAddFileDialog = ref(false)
const showAddModelDialog = ref(false)
const showSaveTemplateDialog = ref(false)
const showStatusManager = ref(false)
const showExportDialog = ref(false)
const showImportPreview = ref(false)
const modelDoneListDialog = ref(false)
const modelDoneListData = ref([])
const snapshotHint = reactive({ show: false, content: '' })
const newFileName = ref('')
const newFileCategory = ref('')
const newFileRemark = ref('')
const remarkQuickTags = [
  { text: '【可复用】', type: 'success' },
  { text: '【实验室版本】', type: 'info' },
  { text: '【证书编号】', type: 'warning' },
  { text: '【发证日期】', type: 'info' }
]
function appendRemark(targetRef, text) {
  if (!targetRef.value) targetRef.value = ''
  if (targetRef.value.includes(text)) {
    ElMessage.info('标签已存在')
    return
  }
  targetRef.value = (targetRef.value ? targetRef.value + ' ' : '') + text
}
const newTemplateName = ref('')
const newStatusName = ref('')
const newStatusColor = ref('#909399')
const modelSearchKey = ref('')
const fileSearchKey = ref('')
const statusFilter = ref('')
const certTypeFilter = ref('')
const modelFilter = ref('')
const tempSelectedModelIds = ref([])
const importInput = ref(null)
const exportFileName = ref('')
const exportSelectedModelIds = ref([])
const exportWithRemark = ref(true)
const exportHideDone = ref(false)
const importPreviewData = reactive({ success: [], failed: [], rawRows: [] })

// 监听外部传入的认证类型筛选（联动跳转）
watch(() => props.initialCertType, (newVal) => {
  if (newVal) {
    certTypeFilter.value = newVal
    emit('filterConsumed')
  }
})

// 拖拽状态
const draggingIndex = ref(null)

// 活跃文件项（过滤软删除）
const activeMatrixFiles = computed(() => {
  return store.certMatrixFiles
    .filter(f => !f.isDeleted)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
})

// 过滤后的文件项（搜索 + 认证类型筛选）
const filteredMatrixFiles = computed(() => {
  let files = activeMatrixFiles.value
  if (fileSearchKey.value) {
    const key = fileSearchKey.value.toLowerCase()
    files = files.filter(f => (f.name || '').toLowerCase().includes(key))
  }
  if (certTypeFilter.value) {
    const fileIdsWithCertType = store.certMatrixCells
      .filter(c => !c.isDeleted && c.certType === certTypeFilter.value)
      .map(c => c.fileId)
    files = files.filter(f => fileIdsWithCertType.includes(f.id))
  }
  return files
})

// 选中机型列（从单元格中提取所有活跃的 modelId）
const selectedModelIds = computed(() => {
  const ids = new Set()
  store.certMatrixCells.forEach(c => {
    if (!c.isDeleted) ids.add(c.modelId)
  })
  return Array.from(ids)
})

// 受机型筛选影响的可见机型列
const visibleModelIds = computed(() => {
  if (modelFilter.value) {
    return selectedModelIds.value.filter(id => id === modelFilter.value)
  }
  return selectedModelIds.value
})

// 过滤后的机型列表（弹窗）
const filteredModels = computed(() => {
  const key = modelSearchKey.value.toLowerCase()
  return store.productModels.filter(m =>
    !key || (m.name || '').toLowerCase().includes(key) || (m.model || '').toLowerCase().includes(key)
  )
})

function jumpToModel(modelId) {
  // 跳转到独立的「机型文件总览」Tab，并高亮该机型
  emit('jumpToOverview', modelId)
  ElMessage.success(`已跳转到机型文件总览：${getModelName(modelId)}`)
}

// 跳转总览 Tab
function jumpToOverviewTab() {
  emit('jumpToOverview', modelFilter.value || '')
}

// 统计
function countByStatus(status) {
  return store.certMatrixCells.filter(c => !c.isDeleted && c.status === status).length
}

// 统计：受机型筛选影响
function filteredCountByStatus(status) {
  return store.certMatrixCells.filter(c => {
    if (c.isDeleted) return false
    if (modelFilter.value && c.modelId !== modelFilter.value) return false
    return c.status === status
  }).length
}
const completionRate = computed(() => {
  const total = store.certMatrixCells.filter(c => !c.isDeleted).length
  if (total === 0) return 0
  return Math.round((countByStatus('done') / total) * 100)
})
// 过滤后的总数（用于卡片联动）
const filteredModelCellCount = computed(() => {
  return store.certMatrixCells.filter(c => {
    if (c.isDeleted) return false
    if (modelFilter.value && c.modelId !== modelFilter.value) return false
    return true
  }).length
})
const filteredCompletionRate = computed(() => {
  const total = filteredModelCellCount.value
  if (total === 0) return 0
  return Math.round((filteredCountByStatus('done') / total) * 100)
})

// 机型列统计（已完成/总数/待准备）
function getModelStats(modelId) {
  const cells = store.certMatrixCells.filter(c => !c.isDeleted && c.modelId === modelId)
  const total = cells.length
  const done = cells.filter(c => c.status === 'done').length
  const pending = cells.filter(c => c.status === 'pending').length
  return { total, done, pending }
}

// 单元格辅助判断
function isCellDone(fileId, modelId) {
  const cell = getMatrixCell(fileId, modelId)
  return !!cell && cell.status === 'done'
}
function getCellCertType(fileId, modelId) {
  const cell = getMatrixCell(fileId, modelId)
  return cell?.certType || ''
}

// 状态映射
function getStatusConfig(statusKey) {
  const builtin = MATRIX_STATUS_CONFIG[statusKey]
  if (builtin) return { ...builtin, key: statusKey }
  const custom = store.certMatrixStatuses.find(s => s.key === statusKey)
  return custom || { name: statusKey, color: '#909399', bg: '#f4f4f5' }
}

function getCellStatus(fileId, modelId) {
  const cell = getMatrixCell(fileId, modelId)
  return cell ? getStatusConfig(cell.status).name : '-'
}
function getCellStatusLabel(fileId, modelId) {
  const cell = getMatrixCell(fileId, modelId)
  if (!cell) return ''
  // 状态筛选时只显示匹配的
  if (statusFilter.value && cell.status !== statusFilter.value) return ''
  return getStatusConfig(cell.status).name
}
function getCellRemark(fileId, modelId) {
  const cell = getMatrixCell(fileId, modelId)
  return cell?.remark || ''
}
function getCellStyle(fileId, modelId) {
  const cell = getMatrixCell(fileId, modelId)
  if (!cell) return {}
  const cfg = getStatusConfig(cell.status)
  // 待准备状态加深黄色边框强化高亮
  const style = { background: cfg.bg }
  if (cell.status === 'pending') {
    style.border = '2px solid #E6A23C'
  }
  // 状态筛选时非匹配项淡化
  if (statusFilter.value && cell.status !== statusFilter.value) {
    style.opacity = '0.3'
  }
  return style
}

function getModelName(modelId) {
  const model = store.productModels.find(m => m.id === modelId)
  return model ? (model.name || model.model || modelId) : modelId
}
function getTemplateName(key) {
  const builtin = CERT_FILE_TEMPLATES[key]?.name
  if (builtin) return builtin
  const custom = store.certMatrixTemplates.find(t => t.id === key)
  return custom?.name || key
}

// 状态循环
const STATUS_CYCLE = ['missing', 'pending', 'in_progress', 'done']
function cycleCellStatus(fileId, modelId) {
  const cell = getMatrixCell(fileId, modelId)
  const currentStatus = cell?.status || 'missing'
  const idx = STATUS_CYCLE.indexOf(currentStatus)
  const nextStatus = idx > -1 ? STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length] : 'done'
  setMatrixCell(fileId, modelId, nextStatus, cell?.remark || '')
}

// 编辑备注（多行）
function editCellRemark(fileId, modelId) {
  const cell = getMatrixCell(fileId, modelId)
  ElMessageBox.prompt('请输入备注（支持换行）', '单元格备注', {
    inputValue: cell?.remark || '',
    inputType: 'textarea',
    inputPlaceholder: '如：实验室对接中\n截止日期：2026-09-01'
  }).then(({ value }) => {
    setMatrixCell(fileId, modelId, cell?.status || 'pending', value || '')
  }).catch(() => {})
}

// 拖拽排序
function onDragStart(idx) { draggingIndex.value = idx }
function onDrop(targetIdx) {
  if (draggingIndex.value === null || draggingIndex.value === targetIdx) return
  const file = filteredMatrixFiles.value[draggingIndex.value]
  if (file) {
    moveMatrixFile(file.id, targetIdx)
    ElMessage.success('顺序已调整')
  }
  draggingIndex.value = null
}

// 应用模板
function handleApplyTemplate(templateKey) {
  if (!templateKey) return
  // 先查询模板快照
  const snapHint = getTemplateSnapshotHint(templateKey)
  const doApply = () => {
    ElMessageBox.confirm('应用模板将替换现有所有文件项，是否继续？', '提示', { type: 'warning' }).then(() => {
      applyCertTemplate(templateKey)
      ElMessage.success('模板已应用')
      // 重新应用后展示快照提示（如果存在）
      const hintText = getTemplateSnapshotHint(templateKey)
      if (hintText) {
        snapshotHint.content = hintText
        snapshotHint.show = true
      }
    }).catch(() => { selectedTemplate.value = '' })
  }
  if (snapHint) {
    ElMessageBox.alert(snapHint, '模板快照提示', { confirmButtonText: '继续应用' }).then(doApply).catch(() => { selectedTemplate.value = '' })
  } else {
    doApply()
  }
}

// 获取模板快照提示文本
function getTemplateSnapshotHint(templateKey) {
  const snap = getTemplateSnapshot(templateKey)
  if (!snap || !snap.models || snap.models.length === 0) return ''
  const lines = []
  snap.models.forEach(m => {
    lines.push(`• ${m.name}：${m.done}/${m.total} 文件已就绪（完成率 ${m.rate}%）`)
  })
  return `历史快照（${snap.createdAt}）：\n${lines.join('\n')}\n选择「继续应用」将重建文件项结构，如需保留已有机型列请在应用后手动补齐。`
}

function getTemplateSnapshot(templateKey) {
  if (!templateKey) return null
  // 自定义模板从 store 查找
  const custom = store.certMatrixTemplates.find(t => t.id === templateKey)
  if (custom?.snapshot) return custom.snapshot
  // 内置模板从 local storage 取
  try {
    const raw = localStorage.getItem(`certTemplateSnapshot_${templateKey}`)
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  return null
}

// 保存快照到本地（内置模板）或 store（自定义模板）
function saveTemplateSnapshot(name, fileNames) {
  const models = selectedModelIds.value.map(mid => {
    const stats = getModelStats(mid)
    return {
      name: getModelName(mid),
      modelId: mid,
      total: stats.total,
      done: stats.done,
      pending: stats.pending,
      rate: stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0
    }
  })
  const snap = {
    createdAt: new Date().toLocaleString('zh-CN'),
    files: fileNames,
    models
  }
  return snap
}

// 添加文件项
function handleAddFile() {
  if (!newFileName.value.trim()) {
    ElMessage.warning('请输入文件名称')
    return
  }
  const file = addCertMatrixFile(newFileName.value.trim(), 'custom', newFileCategory.value)
  if (file && newFileRemark.value.trim()) {
    updateCertMatrixFile(file.id, { remark: newFileRemark.value.trim() })
  }
  newFileName.value = ''
  newFileCategory.value = ''
  newFileRemark.value = ''
  showAddFileDialog.value = false
  ElMessage.success('文件项已添加')
}

function updateFileRemark(file) {
  updateCertMatrixFile(file.id, { remark: file.remark })
}

// 行操作命令
function handleRowCommand(cmd, file) {
  if (cmd === 'row_done') batchSetRowStatus(file.id, 'done')
  else if (cmd === 'row_pending') batchSetRowStatus(file.id, 'pending')
  else if (cmd === 'row_missing') batchSetRowStatus(file.id, 'missing')
  else if (cmd === 'row_view_done') {
    showModelDoneListForRow(file)
  } else if (cmd === 'row_copy_progress') {
    copyRowProgress(file)
  } else if (cmd === 'edit_name') {
    ElMessageBox.prompt('修改文件名称', '编辑', { inputValue: file.name }).then(({ value }) => {
      if (value) updateCertMatrixFile(file.id, { name: value })
    }).catch(() => {})
  } else if (cmd === 'delete') {
    ElMessageBox.confirm(`确认删除文件项"${file.name}"？`, '提示', { type: 'warning' }).then(() => {
      deleteCertMatrixFile(file.id)
      ElMessage.success('已删除')
    }).catch(() => {})
  }
}

// 查看某机型下已完成文件
function showModelDoneListForRow(file) {
  const modelIds = visibleModelIds.value
  if (modelIds.length === 0) {
    ElMessage.warning('请先添加机型列')
    return
  }
  const lines = []
  modelIds.forEach(mid => {
    const cell = getMatrixCell(file.id, mid)
    if (cell && cell.status === 'done') {
      lines.push(`• ${getModelName(mid)}：${cell.certType || '-'} / ${cell.remark || '无备注'}`)
    }
  })
  if (lines.length === 0) {
    ElMessageBox.alert(`${file.name}\n\n当前机型下尚未有已完成的文件项`, '已完成文件清单')
    return
  }
  ElMessageBox.alert(`${file.name}\n\n已完成的机型：\n${lines.join('\n')}`, '已完成文件清单', {
    confirmButtonText: '复制清单'
  }).then(() => {
    navigator.clipboard?.writeText(lines.join('\n')).then(() => {
      ElMessage.success('已复制到剪贴板')
    }).catch(() => {
      ElMessage.info('浏览器不支持自动复制，请手动复制')
    })
  }).catch(() => {})
}

// 复制该行文件进度文本
function copyRowProgress(file) {
  const lines = [`文件项：${file.name}`]
  visibleModelIds.value.forEach(mid => {
    const cell = getMatrixCell(file.id, mid)
    const statusName = cell ? getStatusConfig(cell.status).name : '缺失'
    lines.push(`${getModelName(mid)}: ${statusName}${cell?.remark ? ' (' + cell.remark + ')' : ''}`)
  })
  const text = lines.join('\n')
  navigator.clipboard?.writeText(text).then(() => {
    ElMessage.success('进度已复制到剪贴板')
  }).catch(() => {
    ElMessage.info('浏览器不支持自动复制，请手动复制')
  })
}

// 导出当前机型文件清单
function exportSingleModelList() {
  if (!modelFilter.value) {
    ElMessage.warning('请先在右上角选择机型')
    return
  }
  const modelId = modelFilter.value
  const modelName = getModelName(modelId)
  const rows = activeMatrixFiles.value.map(file => {
    const cell = getMatrixCell(file.id, modelId)
    const statusName = cell ? getStatusConfig(cell.status).name : '缺失'
    return [file.name, statusName, cell?.certType || '', cell?.remark || file.remark || '']
  })
  const headers = ['文件名称', '状态', '认证类型', '备注']
  exportToExcel(`${modelName}_文件清单_${new Date().toISOString().split('T')[0].replace(/-/g, '')}`, headers, rows)
  ElMessage.success(`已导出机型【${modelName}】的文件清单`)
}

// 整列批量操作
function handleBatchColStatus(modelId, status) {
  ElMessageBox.confirm(`确认将"${getModelName(modelId)}"整列设为"${getStatusConfig(status).name}"？`, '提示').then(() => {
    batchSetColStatus(modelId, status)
    ElMessage.success('已批量修改')
  }).catch(() => {})
}

// 移除机型列
function confirmRemoveModelColumn(modelId) {
  ElMessageBox.confirm(`确认移除机型列"${getModelName(modelId)}"？`, '提示', { type: 'warning' }).then(() => {
    removeModelColumn(modelId)
    ElMessage.success('已移除')
  }).catch(() => {})
}

// 机型选择弹窗
function selectAllModels() {
  tempSelectedModelIds.value = filteredModels.value.map(m => m.id)
}
function invertModels() {
  const allIds = filteredModels.value.map(m => m.id)
  tempSelectedModelIds.value = allIds.filter(id => !tempSelectedModelIds.value.includes(id))
}
function handleAddModels() {
  if (tempSelectedModelIds.value.length === 0) {
    ElMessage.warning('请至少选择一个机型')
    return
  }
  addModelsToMatrix(tempSelectedModelIds.value)
  ElMessage.success(`已添加 ${tempSelectedModelIds.value.length} 个机型列`)
  tempSelectedModelIds.value = []
  showAddModelDialog.value = false
}

// 保存模板
function handleSaveTemplate() {
  if (!newTemplateName.value.trim()) {
    ElMessage.warning('请输入模板名称')
    return
  }
  const fileNames = activeMatrixFiles.value.map(f => f.name)
  // 对于内置模板名（模板 key），存到 localStorage；自定义模板保存快照
  const isBuiltin = Object.keys(templates).includes(selectedTemplate.value) && selectedTemplate.value
  const snap = saveTemplateSnapshot(newTemplateName.value.trim(), fileNames)

  if (isBuiltin) {
    try {
      localStorage.setItem(`certTemplateSnapshot_${selectedTemplate.value}`, JSON.stringify(snap))
    } catch (e) {}
    ElMessage.success('模板快照已保存（内置模板）')
  } else {
    saveCertMatrixTemplate(newTemplateName.value.trim(), fileNames, snap)
    ElMessage.success('模板已保存（含快照）')
  }
  newTemplateName.value = ''
  showSaveTemplateDialog.value = false
}

// 状态管理
function handleAddStatus() {
  if (!newStatusName.value.trim()) {
    ElMessage.warning('请输入状态名称')
    return
  }
  addCertMatrixStatus(newStatusName.value.trim(), newStatusColor.value)
  newStatusName.value = ''
  ElMessage.success('状态已添加')
}
function handleDeleteStatus(id) {
  deleteCertMatrixStatus(id)
  ElMessage.success('已删除')
}

// 导入
function triggerImport() { importInput.value?.click() }

async function handleImport(event) {
  const file = event.target.files[0]
  if (!file) return
  try {
    const reader = await import('exceljs')
    const ExcelJS = reader.default || reader
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(await file.arrayBuffer())
    const worksheet = workbook.getWorksheet(1)
    if (!worksheet) {
      ElMessage.error('Excel 文件无效')
      return
    }
    // 读取表头机型列
    const headerRow = worksheet.getRow(1)
    const modelCols = []
    headerRow.eachCell((cell, colNumber) => {
      if (colNumber > 1 && cell.value) {
        const modelName = cell.value.toString().trim()
        const model = store.productModels.find(m => (m.name || m.model) === modelName)
        modelCols.push({ col: colNumber, modelName, modelId: model?.id || null, matched: !!model })
      }
    })
    // 读取数据行
    const successRows = []
    const failedRows = []
    const rawRows = []
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return
      const fileName = row.getCell(1).value?.toString().trim()
      if (!fileName) return
      const rowData = { fileName, cells: [] }
      let hasMatchedModel = false
      modelCols.forEach(mc => {
        const cellVal = row.getCell(mc.col).value?.toString().trim() || ''
        if (mc.modelId) {
          hasMatchedModel = true
          let status = 'missing'
          if (cellVal.includes('已完成') || cellVal.toLowerCase().includes('done')) status = 'done'
          else if (cellVal.includes('进行')) status = 'in_progress'
          else if (cellVal.includes('待准备') || cellVal.includes('pending')) status = 'pending'
          else if (cellVal) status = 'done'
          rowData.cells.push({ modelId: mc.modelId, status, remark: '' })
        }
      })
      rawRows.push(rowData)
      if (hasMatchedModel) {
        successRows.push({ fileName, modelCount: rowData.cells.length })
      } else {
        failedRows.push({ fileName, reason: '未匹配到任何机型（请检查机型名称是否与机型参数库一致）' })
      }
    })
    // 未匹配的机型列也提示
    const unmatchedCols = modelCols.filter(mc => !mc.matched).map(mc => mc.modelName)
    if (unmatchedCols.length > 0) {
      unmatchedCols.forEach(name => {
        failedRows.unshift({ fileName: '-', reason: `机型"${name}"未在机型参数库中找到` })
      })
    }
    importPreviewData.success = successRows
    importPreviewData.failed = failedRows
    importPreviewData.rawRows = rawRows
    showImportPreview.value = true
  } catch (error) {
    ElMessage.error(`导入失败: ${error.message}`)
  } finally {
    event.target.value = ''
  }
}

function confirmImport() {
  const now = new Date().toISOString().split('T')[0]
  importPreviewData.rawRows.forEach(rowData => {
    // 查找或创建文件项
    let file = store.certMatrixFiles.find(f => !f.isDeleted && f.name === rowData.fileName)
    if (!file) {
      file = addCertMatrixFile(rowData.fileName, 'imported', '')
    }
    rowData.cells.forEach(c => {
      setMatrixCell(file.id, c.modelId, c.status, c.remark)
    })
  })
  ElMessage.success(`导入成功：${importPreviewData.rawRows.length} 行`)
  showImportPreview.value = false
}

// 导出
function handleExport() {
  let files = filteredMatrixFiles.value
  if (exportHideDone.value) {
    // 隐藏已完成行（该文件项所有机型都已完成）
    files = files.filter(f => {
      return selectedModelIds.value.some(modelId => {
        const cell = getMatrixCell(f.id, modelId)
        return cell?.status !== 'done'
      })
    })
  }
  const exportModels = selectedModelIds.value.filter(id => exportSelectedModelIds.value.includes(id))
  const headers = ['认证文件项', ...exportModels.map(id => getModelName(id))]
  if (exportWithRemark.value) headers.push('备注')
  const data = files.map(file => {
    const row = [file.name]
    exportModels.forEach(modelId => {
      const cell = getMatrixCell(file.id, modelId)
      const statusLabel = cell ? getStatusConfig(cell.status).name : ''
      const remark = cell?.remark || ''
      row.push(remark && exportWithRemark.value ? `${statusLabel}：${remark}` : statusLabel)
    })
    if (exportWithRemark.value) row.push(file.remark || '')
    return row
  })
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
  const prefix = exportFileName.value.trim() || '认证'
  exportToExcel(`${prefix}_文件进度矩阵_${dateStr}`, headers, data)
  showExportDialog.value = false
  ElMessage.success('导出成功')
}

// 初始化导出配置默认值
function openExportDialog() {
  exportSelectedModelIds.value = [...selectedModelIds.value]
  showExportDialog.value = true
}
</script>

<style scoped>
.cert-matrix-manager { padding: 10px 0; }
.stat-cards { display: flex; gap: 12px; margin-bottom: 12px; }
.stat-card {
  flex: 1; padding: 12px; border-radius: 8px; background: #f5f7fa;
  display: flex; flex-direction: column; align-items: center; border-left: 4px solid #909399;
}
.stat-card.done { border-left-color: #67C23A; background: #f0f9eb; }
.stat-card.pending { border-left-color: #E6A23C; background: #fdf6ec; }
.stat-card.progress { border-left-color: #409EFF; background: #ecf5ff; }
.stat-num { font-size: 24px; font-weight: 700; color: #303133; }
.stat-label { font-size: 12px; color: #909399; margin-top: 4px; }
.matrix-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px; }
.toolbar-left { display: flex; gap: 8px; flex-wrap: wrap; }
.toolbar-right { display: flex; gap: 8px; flex-wrap: wrap; }
.matrix-legend { display: flex; gap: 16px; margin-bottom: 10px; padding: 8px 12px; background: #f5f7fa; border-radius: 4px; flex-wrap: wrap; }
.legend-item { display: flex; align-items: center; gap: 4px; font-size: 13px; color: #606266; }
.legend-color { display: inline-block; width: 14px; height: 14px; border-radius: 3px; }
.matrix-table-wrapper { overflow-x: auto; }
.matrix-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.matrix-table th, .matrix-table td { border: 1px solid #ebeef5; padding: 8px; text-align: center; vertical-align: middle; }
.matrix-table th { background: #f5f7fa; font-weight: 600; color: #303133; position: sticky; top: 0; z-index: 2; }
.sticky-col { position: sticky; left: 0; z-index: 3; background: #fff; box-shadow: 2px 0 4px rgba(0,0,0,0.05); }
.matrix-table th.sticky-col { background: #f5f7fa; z-index: 4; }
.col-file { text-align: left; min-width: 260px; }
.col-model { min-width: 130px; }
.col-remark { min-width: 140px; }
.col-action { min-width: 80px; }
.model-header { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.col-actions { display: flex; gap: 6px; }
.col-action-icon { cursor: pointer; color: #67C23A; font-size: 13px; }
.col-action-icon.remove { color: #f56c6c; }
.col-action-icon:hover { transform: scale(1.2); }
.cell-file { text-align: left; }
.file-info { display: flex; align-items: center; gap: 6px; }
.drag-handle { cursor: move; color: #c0c4cc; }
.file-text { flex: 1; }
.file-name { font-weight: 500; margin-bottom: 4px; word-break: break-all; }
.cell-status { cursor: pointer; transition: all 0.2s; min-width: 100px; }
.cell-status:hover { filter: brightness(0.95); }
.cell-content { display: flex; align-items: center; justify-content: center; gap: 4px; min-height: 28px; }
.cell-status-label { font-size: 12px; color: #606266; }
.cell-remark-icon { font-size: 11px; }
.cell-file-remark { min-width: 140px; }
.model-checkbox-group { display: flex; flex-direction: column; gap: 6px; max-height: 300px; overflow-y: auto; padding: 8px; border: 1px solid #ebeef5; border-radius: 4px; }
.model-checkbox-item { margin: 0; }
.model-country { color: #909399; font-size: 12px; }
.model-select-toolbar { display: flex; gap: 8px; margin-bottom: 8px; align-items: center; }
.select-count { margin-top: 8px; color: #909399; font-size: 13px; text-align: right; }
.template-files-preview { max-height: 120px; overflow-y: auto; }
.status-manager .status-list { display: flex; flex-direction: column; gap: 8px; }
.status-item { display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: #f5f7fa; border-radius: 4px; }
.status-color { width: 20px; height: 20px; border-radius: 4px; }
.status-name { flex: 1; }
.add-status-form { display: flex; gap: 8px; align-items: center; }
.export-model-group { display: flex; flex-wrap: wrap; gap: 8px; max-height: 200px; overflow-y: auto; padding: 8px; border: 1px solid #ebeef5; border-radius: 4px; }
.export-model-group .el-checkbox { margin: 0; }
.import-preview .el-table { margin-bottom: 10px; }

/* 机型列微型统计 */
.model-col-stats {
  font-size: 11px;
  color: #606266;
  margin-top: 2px;
  font-weight: normal;
  line-height: 1.3;
  white-space: nowrap;
}
.model-col-stats .sep {
  margin: 0 4px;
  color: #c0c4cc;
}
.model-col-stats .pending-num {
  color: #E6A23C;
}

/* 单元格归档图标 */
.archive-mark {
  font-size: 13px;
  margin-left: 3px;
  cursor: help;
}

/* 模板快照提示 */
.snapshot-hint {
  padding: 8px 4px;
  white-space: pre-line;
  font-size: 13px;
  line-height: 1.7;
  color: #303133;
}

/* 快捷标签 */
.quick-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
}
</style>
