<template>
  <div class="model-file-overview">
    <!-- 顶部工具栏 -->
    <div class="overview-toolbar">
      <div class="toolbar-left">
        <el-input v-model="searchKeyword" placeholder="搜索机型名" clearable style="width: 220px;" size="default">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="statusFilter" placeholder="按状态筛选" clearable style="width: 140px;">
          <el-option v-for="st in allStatuses" :key="st.key" :label="st.name" :value="st.key" />
        </el-select>
        <el-select v-model="certTypeFilter" placeholder="关联认证类型" clearable style="width: 140px;">
          <el-option label="CE" value="CE" />
          <el-option label="CB" value="CB" />
          <el-option label="SASO" value="SASO" />
          <el-option label="FCC" value="FCC" />
        </el-select>
      </div>
      <div class="toolbar-right">
        <el-select v-model="selectedModelId" placeholder="选择机型导出" clearable style="width: 180px;" @change="onModelSelectChange">
          <el-option v-for="mid in allModelIds" :key="mid" :label="getModelName(mid)" :value="mid" />
        </el-select>
        <el-button type="success" plain @click="exportOverview">导出总览</el-button>
        <el-button type="primary" plain @click="exportSingleModelList" :disabled="!selectedModelId">导出选中机型清单</el-button>
        <el-button type="warning" plain @click="showPreviewDialog = true">预览导出内容</el-button>
      </div>
    </div>

    <!-- 图例 -->
    <div class="overview-legend">
      <span class="legend-item"><span class="legend-color done"></span>已就绪（已完成）</span>
      <span class="legend-item"><span class="legend-color pending"></span>待准备 / 进行中</span>
      <span class="legend-item"><span class="legend-color missing"></span>缺失</span>
      <span class="legend-item total">共 {{ filteredModels.length }} 个机型 / {{ overviewFiles.length }} 个文件项</span>
    </div>

    <!-- 概览统计卡片 -->
    <div class="overview-stat-cards" v-if="filteredModels.length > 0">
      <div class="stat-card done">
        <span class="stat-num">{{ totalDoneCells }}</span>
        <span class="stat-label">已就绪单元格</span>
      </div>
      <div class="stat-card pending">
        <span class="stat-num">{{ totalPendingCells }}</span>
        <span class="stat-label">待处理单元格</span>
      </div>
      <div class="stat-card progress">
        <span class="stat-num">{{ overallRate }}%</span>
        <span class="stat-label">整体完成率</span>
      </div>
      <div class="stat-card ready-models">
        <span class="stat-num">{{ fullyReadyModels.length }}</span>
        <span class="stat-label">完全就绪机型数</span>
      </div>
    </div>

    <!-- 色块矩阵表格 -->
    <div class="overview-table-wrapper" v-if="filteredModels.length > 0 && overviewFiles.length > 0">
      <table class="overview-table">
        <thead>
          <tr>
            <th class="ov-model-col sticky-h">
              <div class="th-label">机型</div>
              <div class="th-rate">完成率</div>
            </th>
            <th v-for="file in overviewFiles" :key="file.id" class="ov-file-col" :title="file.name">
              <div class="th-file-name">{{ (file.name || '').slice(0, 8) }}</div>
              <div class="th-file-rate">{{ getFileDoneRate(file.id) }}%</div>
            </th>
            <th class="ov-action-col sticky-h-right">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="mid in filteredModels" :key="mid" :class="{ 'row-selected': selectedModelId === mid }">
            <td class="ov-model-col sticky-c">
              <div class="model-cell">
                <span class="model-name" :title="getModelName(mid)">{{ getModelName(mid) }}</span>
                <span class="model-rate" :class="getRateClass(getOverviewModelRate(mid))">{{ getOverviewModelRate(mid) }}%</span>
              </div>
            </td>
            <td v-for="file in overviewFiles" :key="file.id"
                class="ov-cell"
                :class="getOverviewCellClass(file.id, mid)"
                :title="getOverviewCellTitle(file.id, mid)"
                @click="onCellClick(file.id, mid)">
            </td>
            <td class="ov-action-col sticky-c-right">
              <el-button size="small" type="primary" text @click="previewModel(mid)">查看详情</el-button>
              <el-button size="small" type="success" text @click="exportModelDetail(mid)">导出</el-button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <el-empty v-else description="暂无机型数据，请先在文件进度矩阵中添加机型和文件项" />

    <!-- 机型详情预览弹窗 -->
    <el-dialog v-model="showModelDetailDialog" :title="`机型文件详情 - ${detailModelName}`" width="800px" top="5vh">
      <div class="detail-dialog-body" v-if="detailModelId">
        <div class="detail-summary">
          <el-tag type="success">已就绪 {{ detailStats.done }} 项</el-tag>
          <el-tag type="warning">待准备 {{ detailStats.pending }} 项</el-tag>
          <el-tag type="info">总计 {{ detailStats.total }} 项</el-tag>
          <el-tag type="primary">完成率 {{ detailStats.rate }}%</el-tag>
        </div>
        <el-table :data="detailFileList" border size="small" max-height="420" style="margin-top: 10px;">
          <el-table-column type="index" label="#" width="44" />
          <el-table-column prop="fileName" label="文件名称" min-width="180" show-overflow-tooltip />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.statusKey)" size="small">{{ row.statusName }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="certType" label="认证类型" width="100" />
          <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
        </el-table>
      </div>
      <template #footer>
        <el-button @click="showModelDetailDialog = false">关闭</el-button>
        <el-button type="success" @click="exportModelDetail(detailModelId)">导出该机型清单</el-button>
        <el-button type="primary" @click="copyModelDetail(detailModelId)">复制清单文本</el-button>
      </template>
    </el-dialog>

    <!-- 导出预览弹窗 -->
    <el-dialog v-model="showPreviewDialog" title="导出预览" width="900px" top="5vh">
      <div class="preview-dialog-body">
        <div class="preview-info">
          <el-tag type="info">导出范围：{{ previewData.mode === 'all' ? '全部机型总览' : '单机型清单 - ' + previewData.modelName }}</el-tag>
          <el-tag type="success">共 {{ previewData.rows.length }} 行</el-tag>
          <el-tag>共 {{ previewData.headers.length }} 列</el-tag>
        </div>
        <el-table :data="previewData.rows" border size="small" max-height="500">
          <el-table-column v-for="(h, idx) in previewData.headers" :key="idx" :prop="String(idx)" :label="h" min-width="100" show-overflow-tooltip />
        </el-table>
      </div>
      <template #footer>
        <el-button @click="showPreviewDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmPreviewExport">确认导出</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import {
  store,
  MATRIX_STATUS_CONFIG,
  getMatrixCell,
  getAllMatrixStatuses
} from '../store.js'
import { exportToExcel } from '../utils/excelExport.js'

const props = defineProps({
  // 从外部跳转时指定的机型 id（高亮该机型）
  highlightModelId: { type: String, default: '' }
})

const emit = defineEmits(['jump-to-matrix'])

const allStatuses = computed(() => getAllMatrixStatuses())
const searchKeyword = ref('')
const statusFilter = ref('')
const certTypeFilter = ref('')
const selectedModelId = ref(props.highlightModelId || '')

const showModelDetailDialog = ref(false)
const detailModelId = ref('')
const showPreviewDialog = ref(false)
const previewData = reactive({ mode: 'all', headers: [], rows: [], modelName: '' })

// 活跃文件项
const overviewFiles = computed(() => {
  return store.certMatrixFiles
    .filter(f => !f.isDeleted)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
})

// 所有有单元格的机型
const allModelIds = computed(() => {
  const ids = new Set()
  store.certMatrixCells.forEach(c => {
    if (!c.isDeleted) ids.add(c.modelId)
  })
  return Array.from(ids)
})

// 受搜索影响的机型列表
const filteredModels = computed(() => {
  const key = searchKeyword.value.toLowerCase()
  return allModelIds.value.filter(mid => {
    if (!key) return true
    return getModelName(mid).toLowerCase().includes(key)
  })
})

// 机型名
function getModelName(modelId) {
  const model = store.productModels.find(m => m.id === modelId)
  return model ? (model.name || model.model || modelId) : modelId
}

// 状态配置
function getStatusConfig(statusKey) {
  const builtin = MATRIX_STATUS_CONFIG[statusKey]
  if (builtin) return { ...builtin, key: statusKey }
  const custom = store.certMatrixStatuses.find(s => s.key === statusKey)
  return custom || { name: statusKey, color: '#909399', bg: '#f4f4f5' }
}

function getStatusTagType(statusKey) {
  if (statusKey === 'done') return 'success'
  if (statusKey === 'pending') return 'warning'
  if (statusKey === 'in_progress') return 'primary'
  return 'info'
}

// 单元格分类
function getOverviewCellClass(fileId, modelId) {
  const cell = getMatrixCell(fileId, modelId)
  if (!cell || cell.isDeleted) return 'ov-missing'
  if (cell.status === 'done') return 'ov-done'
  if (cell.status === 'pending' || cell.status === 'in_progress') return 'ov-pending'
  return 'ov-missing'
}
function getOverviewCellTitle(fileId, modelId) {
  const cell = getMatrixCell(fileId, modelId)
  const fileName = overviewFiles.value.find(f => f.id === fileId)?.name || fileId
  if (!cell) return `${fileName} / 缺失`
  const statusName = getStatusConfig(cell.status).name
  return `${fileName} / ${statusName}${cell.remark ? ' / ' + cell.remark : ''}${cell.certType ? ' / 认证:' + cell.certType : ''}`
}

// 受状态/认证筛选影响 - 是否显示该单元格（用于统计/筛选逻辑）
function isCellVisible(cell) {
  if (!cell || cell.isDeleted) return false
  if (statusFilter.value && cell.status !== statusFilter.value) return false
  if (certTypeFilter.value && (cell.certType || '') !== certTypeFilter.value) return false
  return true
}

// 机型完成率
function getOverviewModelRate(modelId) {
  const cells = store.certMatrixCells.filter(c => !c.isDeleted && c.modelId === modelId)
  if (cells.length === 0) return 0
  const done = cells.filter(c => c.status === 'done').length
  return Math.round((done / cells.length) * 100)
}

// 文件项完成率（跨机型）
function getFileDoneRate(fileId) {
  const cells = store.certMatrixCells.filter(c => !c.isDeleted && c.fileId === fileId)
  if (cells.length === 0) return 0
  const done = cells.filter(c => c.status === 'done').length
  return Math.round((done / cells.length) * 100)
}

function getRateClass(rate) {
  if (rate >= 100) return 'rate-full'
  if (rate >= 60) return 'rate-high'
  if (rate >= 30) return 'rate-mid'
  return 'rate-low'
}

// 顶部统计卡片
const totalDoneCells = computed(() => {
  return store.certMatrixCells.filter(c => !c.isDeleted && c.status === 'done').length
})
const totalPendingCells = computed(() => {
  return store.certMatrixCells.filter(c => !c.isDeleted && (c.status === 'pending' || c.status === 'in_progress')).length
})
const overallRate = computed(() => {
  const total = store.certMatrixCells.filter(c => !c.isDeleted).length
  if (total === 0) return 0
  return Math.round((totalDoneCells.value / total) * 100)
})
const fullyReadyModels = computed(() => {
  return allModelIds.value.filter(mid => getOverviewModelRate(mid) >= 100)
})

// 单元格点击：选中机型
function onCellClick(fileId, modelId) {
  selectedModelId.value = modelId
}

// 下拉选择机型（选中后表格行自动高亮）
function onModelSelectChange(val) {
  // selectedModelId 的变更会触发 row-selected class
}

// 预览机型详情
const detailModelName = computed(() => detailModelId.value ? getModelName(detailModelId.value) : '')
const detailStats = computed(() => {
  if (!detailModelId.value) return { done: 0, pending: 0, total: 0, rate: 0 }
  const cells = store.certMatrixCells.filter(c => !c.isDeleted && c.modelId === detailModelId.value)
  const done = cells.filter(c => c.status === 'done').length
  const pending = cells.filter(c => c.status === 'pending' || c.status === 'in_progress').length
  const total = cells.length
  const rate = total > 0 ? Math.round((done / total) * 100) : 0
  return { done, pending, total, rate }
})
const detailFileList = computed(() => {
  if (!detailModelId.value) return []
  return overviewFiles.value.map(file => {
    const cell = getMatrixCell(file.id, detailModelId.value)
    const cfg = cell ? getStatusConfig(cell.status) : { name: '缺失', key: 'missing' }
    return {
      fileName: file.name,
      statusKey: cell?.status || 'missing',
      statusName: cfg.name,
      certType: cell?.certType || '',
      remark: cell?.remark || file.remark || ''
    }
  })
})

function previewModel(mid) {
  detailModelId.value = mid
  selectedModelId.value = mid
  showModelDetailDialog.value = true
}

// 导出全部机型总览（矩阵形式）
function exportOverview() {
  const headers = ['机型', ...overviewFiles.value.map(f => f.name), '完成率']
  const rows = filteredModels.value.map(mid => {
    const row = [getModelName(mid)]
    overviewFiles.value.forEach(file => {
      const cell = getMatrixCell(file.id, mid)
      const statusName = cell ? getStatusConfig(cell.status).name : '缺失'
      row.push(statusName)
    })
    row.push(getOverviewModelRate(mid) + '%')
    return row
  })
  previewData.mode = 'all'
  previewData.modelName = ''
  previewData.headers = headers
  previewData.rows = rows
  showPreviewDialog.value = true
}

// 导出单机型清单
function exportModelDetail(mid) {
  if (!mid) {
    ElMessage.warning('请先选择机型')
    return
  }
  const modelName = getModelName(mid)
  const headers = ['文件名称', '状态', '认证类型', '备注']
  const rows = overviewFiles.value.map(file => {
    const cell = getMatrixCell(file.id, mid)
    const statusName = cell ? getStatusConfig(cell.status).name : '缺失'
    return [file.name, statusName, cell?.certType || '', cell?.remark || file.remark || '']
  })
  previewData.mode = 'single'
  previewData.modelName = modelName
  previewData.headers = headers
  previewData.rows = rows
  showPreviewDialog.value = true
}

function exportSingleModelList() {
  if (!selectedModelId.value) {
    ElMessage.warning('请先点击单元格或在详情中选中一个机型')
    return
  }
  exportModelDetail(selectedModelId.value)
}

// 预览后确认导出
function confirmPreviewExport() {
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
  const name = previewData.mode === 'all' ? `机型文件总览_${dateStr}` : `${previewData.modelName}_文件清单_${dateStr}`
  exportToExcel(name, previewData.headers, previewData.rows)
  ElMessage.success('导出成功')
  showPreviewDialog.value = false
}

// 复制机型清单文本
function copyModelDetail(mid) {
  if (!mid) return
  const modelName = getModelName(mid)
  const lines = [`机型：${modelName}（完成率 ${getOverviewModelRate(mid)}%）`, '']
  overviewFiles.value.forEach(file => {
    const cell = getMatrixCell(file.id, mid)
    const statusName = cell ? getStatusConfig(cell.status).name : '缺失'
    lines.push(`• ${file.name}：${statusName}${cell?.remark ? ' / ' + cell.remark : ''}`)
  })
  const text = lines.join('\n')
  navigator.clipboard?.writeText(text).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.info('浏览器不支持自动复制，请手动复制')
  })
}
</script>

<style scoped>
.model-file-overview {
  padding: 10px 0;
}

.overview-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}
.toolbar-left {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.toolbar-right {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.overview-legend {
  display: flex;
  gap: 16px;
  margin-bottom: 10px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  flex-wrap: wrap;
  align-items: center;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #606266;
}
.legend-item.total {
  margin-left: auto;
  color: #909399;
  font-size: 12px;
}
.legend-color {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 3px;
}
.legend-color.done { background: #67C23A; }
.legend-color.pending { background: #E6A23C; }
.legend-color.missing { background: #EBEEF5; border: 1px dashed #DCDFE6; }

.overview-stat-cards {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}
.stat-card {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-left: 4px solid #909399;
}
.stat-card.done { border-left-color: #67C23A; background: #f0f9eb; }
.stat-card.pending { border-left-color: #E6A23C; background: #fdf6ec; }
.stat-card.progress { border-left-color: #409EFF; background: #ecf5ff; }
.stat-card.ready-models { border-left-color: #67C23A; background: #f0f9eb; }
.stat-num { font-size: 22px; font-weight: 700; color: #303133; }
.stat-label { font-size: 12px; color: #909399; margin-top: 4px; }

.overview-table-wrapper {
  max-height: 65vh;
  overflow: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background: #fff;
}
.overview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.overview-table th,
.overview-table td {
  border: 1px solid #ebeef5;
  padding: 4px;
  text-align: center;
  vertical-align: middle;
}
.overview-table th {
  background: #f5f7fa;
  font-weight: 600;
  font-size: 12px;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 2;
}
.sticky-h {
  position: sticky;
  left: 0;
  z-index: 4;
  background: #f5f7fa;
}
.sticky-h-right {
  position: sticky;
  right: 0;
  z-index: 4;
  background: #f5f7fa;
}
.sticky-c {
  position: sticky;
  left: 0;
  z-index: 3;
  background: #fff;
}
.sticky-c-right {
  position: sticky;
  right: 0;
  z-index: 3;
  background: #fff;
}

.th-label { font-weight: 600; }
.th-rate { font-size: 11px; color: #909399; font-weight: normal; margin-top: 2px; }
.th-file-name { font-weight: 500; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.th-file-rate { font-size: 11px; color: #909399; font-weight: normal; margin-top: 2px; }

.ov-model-col {
  min-width: 140px;
  text-align: left;
  padding-left: 10px;
}
.ov-action-col {
  min-width: 130px;
  white-space: nowrap;
}
.ov-file-col {
  min-width: 60px;
}

.model-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.model-name { font-weight: 500; }
.model-rate { font-size: 11px; font-weight: 600; }
.rate-full { color: #67C23A; }
.rate-high { color: #67C23A; }
.rate-mid { color: #E6A23C; }
.rate-low { color: #F56C6C; }

.ov-cell {
  width: 36px;
  height: 32px;
  padding: 0 !important;
  background: #EBEEF5;
  cursor: pointer;
  transition: transform 0.15s;
}
.ov-cell:hover {
  transform: scale(1.15);
  z-index: 2;
  box-shadow: 0 0 6px rgba(0,0,0,0.2);
}
.ov-cell.ov-done { background: #67C23A; }
.ov-cell.ov-pending { background: #E6A23C; }
.ov-cell.ov-missing { background: #EBEEF5; }

.row-selected {
  background: #ecf5ff !important;
}
.row-selected .sticky-c,
.row-selected .sticky-c-right {
  background: #ecf5ff !important;
}

.detail-dialog-body .detail-summary {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.preview-dialog-body .preview-info {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
</style>
