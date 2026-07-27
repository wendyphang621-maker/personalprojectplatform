<template>
  <div class="project-space">
    <div class="project-tabs">
      <div 
        v-for="project in filteredProjects" 
        :key="project.id"
        class="tab-item"
        :class="{ active: store.currentProjectId === project.id }"
        @click="store.currentProjectId = project.id"
      >
        <span class="tab-dot" :style="{ background: project.color }"></span>
        <span>{{ project.name }}</span>
        <span class="tab-type">{{ getProjectTypeLabel(project.projectType) }}</span>
        <button v-if="!readOnly" @click.stop="editProject(project)" class="tab-edit">✎</button>
        <button v-if="filteredProjects.length > 1" @click.stop="closeProject(project.id)" class="tab-close">×</button>
      </div>
      <button @click="showProjectList = true" class="add-tab">+</button>
    </div>
    
    <div v-if="currentProject" class="project-content">
      <div class="left-panel">
        <div class="panel-header">
          <h3>项目阶段</h3>
          <div class="panel-actions">
            <el-select v-model="projectTypeFilter" placeholder="项目类型" size="small" @change="handleProjectTypeChange">
              <el-option label="全部" value="" />
              <el-option label="研发项目" value="development" />
              <el-option label="客户样机项目" value="sample" />
              <el-option label="产品认证项目" value="certification" />
              <el-option label="批量出货订单" value="shipment" />
            </el-select>
            <button v-if="!readOnly" @click="showAddStageDialog = true" class="add-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
          <div class="stage-hint">
            <span>💡 每个项目阶段配置独立保存，切换项目不会复用当前流程模板</span>
          </div>
        </div>
        <div class="stage-tree" @dragover.prevent="handleStageDragOver" @drop="handleStageDrop">
          <div v-if="isReordering" class="reorder-loading">
            <svg class="loading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            <span>排序更新中...</span>
          </div>
          <div v-if="stages.length === 0" class="empty-stage">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <p>暂无阶段</p>
            <p class="empty-stage-hint">点击上方「+」按钮添加项目阶段</p>
          </div>
          <div 
            v-for="stage in stages" 
            :key="stage.id" 
            class="stage-item"
            :data-stage-id="stage.id"
            :draggable="!readOnly"
            @dragstart="(e) => handleStageDragStart(stage, e)"
            @dragend="handleStageDragEnd"
            :class="{ 'dragging': draggingStage?.id === stage.id }"
          >
            <div class="stage-header" :style="{ borderColor: stage.color }">
              <div class="stage-info">
                <span class="stage-color" :style="{ background: stage.color }"></span>
                <span class="stage-name">{{ stage.name }}</span>
              </div>
              <div class="stage-actions">
                <button v-if="!readOnly" @click="editStage(stage)" class="stage-edit-btn">✎</button>
                <button v-if="!readOnly && stages.length > 1" @click="confirmDeleteStage(stage)" class="stage-delete-btn">×</button>
                <button v-if="!readOnly" @click="showAddTask(stage.id)" class="add-task-btn">+</button>
              </div>
            </div>
            <div class="task-list">
              <div 
                v-for="task in getTasksByStage(stage.id)" 
                :key="task.id" 
                class="task-item"
                :class="{ completed: task.completed, milestone: task.milestone }"
              >
                <input type="checkbox" v-model="task.completed" @change="handleToggleComplete(task.id)" :disabled="readOnly" />
                <span class="task-name">{{ task.name }}</span>
                <span class="task-duration">{{ task.duration }}天</span>
                <span class="task-date">{{ task.startDate }}</span>
                <span v-if="task.customerName" class="task-customer" :title="task.customerName">{{ task.customerName }}</span>
                <span v-if="task.model" class="task-model" :title="task.model">{{ task.model }}</span>
                <button v-if="task.milestone" class="milestone-badge">里程碑</button>
                <button v-if="!readOnly" @click="deleteTaskItem(task.id)" class="delete-btn">×</button>
              </div>
              <div v-if="getTasksByStage(stage.id).length === 0" class="empty-tasks">
                <span>暂无任务</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="right-panel">
        <div class="gantt-header">
          <div class="gantt-filters">
            <el-checkbox v-model="filterMilestone">只看里程碑</el-checkbox>
            <el-checkbox v-model="filterCompleted">隐藏已完成</el-checkbox>
            <el-checkbox v-model="filterSalesOnly">仅展示销售类项目</el-checkbox>
          </div>
          <div class="gantt-controls">
            <button @click="prevPeriod">←</button>
            <span>{{ periodText }}</span>
            <button @click="nextPeriod">→</button>
          </div>
        </div>
        
        <div class="gantt-filters-row">
          <el-select v-model="customerFilter" placeholder="客户分组" size="small" filterable>
            <el-option label="全部" value="" />
            <el-option v-for="group in customerGroups" :key="group" :label="group" :value="group" />
          </el-select>
          <el-select v-model="modelFilter" placeholder="机型型号" size="small" filterable>
            <el-option label="全部" value="" />
            <el-option v-for="model in productModels" :key="model.id" :label="model.name" :value="model.name" />
          </el-select>
          <el-select v-model="logisticsFilter" placeholder="物流状态" size="small">
            <el-option label="全部" value="" />
            <el-option label="待发货" value="pending" />
            <el-option label="运输中" value="in_transit" />
            <el-option label="已签收" value="delivered" />
          </el-select>
        </div>
        
        <div class="gantt-container" ref="ganttContainer">
          <div class="gantt-timeline">
            <div class="timeline-header">
              <div class="timeline-empty"></div>
              <div class="timeline-dates">
                <div 
                  v-for="date in visibleDates" 
                  :key="date.str" 
                  class="date-cell"
                  :class="{ today: date.isToday, weekend: date.isWeekend }"
                >
                  <div class="date-day">{{ date.day }}</div>
                  <div class="date-weekday">{{ date.weekday }}</div>
                </div>
              </div>
            </div>
            <div class="timeline-body">
              <div v-for="stage in stages" :key="stage.id" class="stage-row">
                <div class="stage-label">{{ stage.name }}</div>
                <div class="stage-bars">
                  <div 
                    v-for="task in getFilteredTasks(stage.id)" 
                    :key="task.id"
                    class="task-bar"
                    :class="{ completed: task.completed, milestone: task.milestone }"
                    :style="getTaskBarStyle(task, stage.color)"
                    @mousedown="startDrag($event, task)"
                  >
                    <span class="bar-label">{{ task.name }}</span>
                    <span v-if="task.milestone" class="bar-milestone">✦</span>
                    <div class="bar-info">
                      <span v-if="task.customerName" class="info-item">{{ task.customerName }}</span>
                      <span v-if="task.model" class="info-item">{{ task.model }}</span>
                    </div>
                    <div class="bar-resize-left" @mousedown.stop="startResize($event, task, 'left')"></div>
                    <div class="bar-resize-right" @mousedown.stop="startResize($event, task, 'right')"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="empty-project">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
        <polyline points="17 21 17 13 7 13 7 21"/>
        <polyline points="7 3 7 8 15 8"/>
      </svg>
      <p>请选择或创建一个项目</p>
    </div>
    
    <el-dialog v-model="showProjectList" title="选择项目" width="500px">
      <div class="project-list">
        <div 
          v-for="project in filterProjectsByType" 
          :key="project.id"
          class="project-item"
          :class="{ active: store.currentProjectId === project.id }"
        >
          <span class="project-color" :style="{ background: project.color }"></span>
          <div class="project-info" @click="selectProject(project.id)">
            <div class="project-header">
              <span class="project-name">{{ project.name }}</span>
              <span class="project-type-badge">{{ getProjectTypeLabel(project.projectType) }}</span>
            </div>
            <span class="project-desc">{{ project.description }}</span>
          </div>
          <div v-if="!readOnly" class="project-actions">
            <el-button size="small" @click.stop="editProject(project)">编辑</el-button>
            <el-button size="small" type="danger" @click.stop="handleDeleteProject(project)">删除</el-button>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showProjectList = false">关闭</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showAddStageDialog" :title="editingStage ? '编辑阶段' : '新建阶段'" width="350px">
      <el-form :model="stageForm" label-width="80px">
        <el-form-item label="阶段名称">
          <el-input v-model="stageForm.name" />
        </el-form-item>
        <el-form-item label="状态颜色">
          <el-color-picker v-model="stageForm.color" show-text />
          <div class="color-presets">
            <span class="preset-label">预设配色：</span>
            <span 
              v-for="(color, index) in colorPresets" 
              :key="index" 
              class="color-preset"
              :style="{ backgroundColor: color.value }"
              :title="color.label"
              @click="stageForm.color = color.value"
            ></span>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddStageDialog = false">取消</el-button>
        <el-button type="primary" @click="saveStage">确定</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showEditProjectDialog" title="编辑项目" width="450px">
      <el-form :model="editProjectForm" label-width="100px">
        <el-form-item label="项目名称">
          <el-input v-model="editProjectForm.name" />
        </el-form-item>
        <el-form-item label="项目描述">
          <el-input v-model="editProjectForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="项目类型">
          <el-select v-model="editProjectForm.projectType">
            <el-option label="研发项目" value="development" />
            <el-option label="客户样机项目" value="sample" />
            <el-option label="产品认证项目" value="certification" />
            <el-option label="批量出货订单" value="shipment" />
          </el-select>
        </el-form-item>
        <el-form-item label="项目颜色">
          <el-color-picker v-model="editProjectForm.color" show-text />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditProjectDialog = false">取消</el-button>
        <el-button type="danger" v-if="!readOnly" @click="handleDeleteProjectFromEdit">删除项目</el-button>
        <el-button type="primary" @click="saveProjectEdit">保存</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showTaskDetailDialog" title="任务详情" width="500px">
      <el-form :model="taskDetail" label-width="100px">
        <el-form-item label="任务名称">
          <el-input v-model="taskDetail.name" :disabled="readOnly" />
        </el-form-item>
        <el-form-item label="工期(天)">
          <el-input-number v-model="taskDetail.duration" :min="1" :disabled="readOnly" />
        </el-form-item>
        <el-form-item label="开始日期">
          <el-date-picker v-model="taskDetail.startDate" type="date" :disabled="readOnly" />
        </el-form-item>
        <el-form-item label="关联客户">
          <el-select v-model="taskDetail.customerName" filterable :disabled="readOnly">
            <el-option label="请选择" value="" />
            <el-option v-for="c in store.customers" :key="c.id" :label="c.name" :value="c.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="产品机型">
          <el-select v-model="taskDetail.model" filterable :disabled="readOnly">
            <el-option label="请选择" value="" />
            <el-option v-for="m in store.productModels" :key="m.id" :label="m.name" :value="m.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="物流单号">
          <el-input v-model="taskDetail.logisticsNo" :disabled="readOnly" />
        </el-form-item>
        <el-form-item label="对接邮箱">
          <el-input v-model="taskDetail.email" :disabled="readOnly" />
        </el-form-item>
        <el-form-item label="样品数量">
          <el-input-number v-model="taskDetail.sampleQty" :min="0" :disabled="readOnly" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="taskDetail.milestone" :disabled="readOnly">设为里程碑</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTaskDetailDialog = false">取消</el-button>
        <el-button type="primary" @click="saveTaskDetail" :disabled="readOnly">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import { store, getStagesByProjectId, getTasksByStageId, toggleTaskComplete, deleteTask, addStage, updateStage, deleteStage, reorderStages, updateTask, getCustomerGroups, updateProject, deleteProject, authStore } from '../store.js'

const props = defineProps({
  readOnly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['openAddTask'])

onMounted(() => {
  console.log('ProjectSpace mounted - readOnly:', props.readOnly, 'currentUser:', authStore.currentUser)
})

onUnmounted(() => {
  if (reorderTimer) {
    clearTimeout(reorderTimer)
    reorderTimer = null
  }
})

const showProjectList = ref(false)
const showAddStageDialog = ref(false)
const showTaskDetailDialog = ref(false)
const showEditProjectDialog = ref(false)
const filterMilestone = ref(false)
const filterCompleted = ref(false)
const filterSalesOnly = ref(false)
const ganttContainer = ref(null)

const projectTypeFilter = ref('')
const customerFilter = ref('')
const modelFilter = ref('')
const logisticsFilter = ref('')

const newStage = reactive({ name: '', order: 1 })
const editingStage = ref(null)
const stageForm = reactive({ name: '', color: '#409EFF' })

const colorPresets = [
  { label: '蓝色', value: '#409EFF' },
  { label: '绿色', value: '#67C23A' },
  { label: '橙色', value: '#E6A23C' },
  { label: '红色', value: '#F56C6C' }
]
const draggingStage = ref(null)
const isReordering = ref(false)
const taskDetail = reactive({
  id: '',
  name: '',
  duration: 1,
  startDate: '',
  milestone: false,
  customerName: '',
  model: '',
  logisticsNo: '',
  email: '',
  sampleQty: 0
})
const editProjectForm = reactive({
  id: '',
  name: '',
  description: '',
  projectType: 'development',
  color: '#409EFF'
})

const currentDate = ref(new Date())
const viewRange = 21

const currentProject = computed(() => {
  return store.projects.find(p => p.id === store.currentProjectId)
})

const stages = computed(() => {
  if (!store.currentProjectId) return []
  return getStagesByProjectId(store.currentProjectId)
})

const customerGroups = computed(() => getCustomerGroups())

const productModels = computed(() => store.productModels)

const filterProjectsByType = computed(() => {
  if (!projectTypeFilter.value) return store.projects
  return store.projects.filter(p => p.projectType === projectTypeFilter.value)
})

const filteredProjects = computed(() => {
  let projects = store.projects
  if (filterSalesOnly.value) {
    projects = projects.filter(p => ['sample', 'certification', 'shipment'].includes(p.projectType))
  }
  return projects
})

const openProjects = computed(() => {
  if (store.openProjectIds.length === 0 && filteredProjects.value.length > 0) {
    return [filteredProjects.value[0]]
  }
  return filteredProjects.value.filter(p => store.openProjectIds.includes(p.id))
})

const periodText = computed(() => {
  const start = currentDate.value
  const end = new Date(start)
  end.setDate(end.getDate() + viewRange - 1)
  return `${start.getFullYear()}年${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日`
})

const visibleDates = computed(() => {
  const dates = []
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const today = new Date().toISOString().split('T')[0]
  
  for (let i = 0; i < viewRange; i++) {
    const date = new Date(currentDate.value)
    date.setDate(date.getDate() + i)
    const str = date.toISOString().split('T')[0]
    dates.push({
      str,
      day: date.getDate(),
      weekday: weekdays[date.getDay()],
      isToday: str === today,
      isWeekend: date.getDay() === 0 || date.getDay() === 6
    })
  }
  return dates
})

function getProjectTypeLabel(type) {
  const labels = {
    development: '研发',
    sample: '样机',
    certification: '认证',
    shipment: '出货'
  }
  return labels[type] || type
}

function getTasksByStage(stageId) {
  let tasks = getTasksByStageId(stageId)
  
  if (customerFilter.value) {
    tasks = tasks.filter(t => t.customerName === customerFilter.value)
  }
  if (modelFilter.value) {
    tasks = tasks.filter(t => t.model === modelFilter.value)
  }
  
  return tasks
}

function getFilteredTasks(stageId) {
  let tasks = getTasksByStage(stageId)
  
  if (filterCompleted.value) {
    tasks = tasks.filter(t => !t.completed)
  }
  if (filterMilestone.value) {
    tasks = tasks.filter(t => t.milestone)
  }
  
  return tasks
}

function getTaskBarStyle(task, color) {
  const startDate = new Date(task.startDate)
  const viewStart = new Date(currentDate.value)
  
  const startDiff = Math.floor((startDate - viewStart) / (1000 * 60 * 60 * 24))
  const endDiff = startDiff + parseInt(task.duration)
  
  if (endDiff < 0 || startDiff >= viewRange) {
    return { display: 'none' }
  }
  
  let left = Math.max(0, startDiff) * (100 / viewRange)
  let width = (Math.min(endDiff, viewRange) - Math.max(0, startDiff)) * (100 / viewRange)
  
  if (width < 2) width = 2
  
  return {
    left: `${left}%`,
    width: `${width}%`,
    background: task.completed ? `${color}40` : color,
    borderColor: color
  }
}

function selectProject(projectId) {
  store.currentProjectId = projectId
  if (!store.openProjectIds.includes(projectId)) {
    store.openProjectIds.push(projectId)
  }
  showProjectList.value = false
}

function closeProject(projectId) {
  store.openProjectIds = store.openProjectIds.filter(id => id !== projectId)
  if (store.currentProjectId === projectId) {
    store.currentProjectId = store.openProjectIds[0] || null
  }
}

function handleProjectTypeChange() {
  showProjectList.value = true
}

function prevPeriod() {
  const newDate = new Date(currentDate.value)
  newDate.setDate(newDate.getDate() - viewRange)
  currentDate.value = newDate
}

function nextPeriod() {
  const newDate = new Date(currentDate.value)
  newDate.setDate(newDate.getDate() + viewRange)
  currentDate.value = newDate
}

function handleToggleComplete(taskId) {
  if (!props.readOnly) {
    toggleTaskComplete(taskId)
  }
}

function deleteTaskItem(taskId) {
  if (!props.readOnly && confirm('确定要删除该任务吗？')) {
    deleteTask(taskId)
  }
}

function showAddTask(stageId) {
  emit('openAddTask', stageId)
}

function createStage() {
  editingStage.value = null
  stageForm.name = ''
  stageForm.color = '#409EFF'
  showAddStageDialog.value = true
}

function editStage(stage) {
  editingStage.value = stage
  stageForm.name = stage.name
  stageForm.color = stage.color
  showAddStageDialog.value = true
}

function saveStage() {
  if (!stageForm.name.trim() || !store.currentProjectId) {
    alert('请填写阶段名称')
    return
  }
  
  if (editingStage.value) {
    updateStage(editingStage.value.id, {
      name: stageForm.name.trim(),
      color: stageForm.color
    })
  } else {
    addStage(store.currentProjectId, stageForm.name.trim(), stageForm.color)
  }
  
  showAddStageDialog.value = false
  editingStage.value = null
}

function confirmDeleteStage(stage) {
  ElMessageBox.confirm(
    '删除该阶段将同步移除阶段内全部任务，数据无法恢复，是否确认删除？',
    `删除阶段「${stage.name}」`,
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(() => {
    deleteStage(stage.id)
  }).catch(() => {
    // 用户取消
  })
}

function handleStageDragStart(stage, event) {
  draggingStage.value = stage
  event.dataTransfer.effectAllowed = 'move'
}

function handleStageDragEnd() {
  draggingStage.value = null
}

function handleStageDragOver(event) {
  event.dataTransfer.dropEffect = 'move'
}

let reorderTimer = null

function debounceReorder(projectId, newOrder) {
  if (reorderTimer) {
    clearTimeout(reorderTimer)
  }
  isReordering.value = true
  reorderTimer = setTimeout(() => {
    reorderStages(projectId, newOrder)
    reorderTimer = null
    isReordering.value = false
  }, 300)
}

function handleStageDrop(event) {
  if (!draggingStage.value || !store.currentProjectId) return
  
  const targetElement = event.target.closest('.stage-item')
  if (!targetElement) return
  
  const targetStageId = targetElement.getAttribute('data-stage-id')
  if (!targetStageId || targetStageId === draggingStage.value.id) return
  
  const currentStages = getStagesByProjectId(store.currentProjectId)
  const newOrder = currentStages.map(s => s.id)
  
  const fromIndex = newOrder.indexOf(draggingStage.value.id)
  const toIndex = newOrder.indexOf(targetStageId)
  
  newOrder.splice(fromIndex, 1)
  newOrder.splice(toIndex, 0, draggingStage.value.id)
  
  debounceReorder(store.currentProjectId, newOrder)
  draggingStage.value = null
}

function openTaskDetail(task) {
  Object.assign(taskDetail, {
    id: task.id,
    name: task.name,
    duration: task.duration,
    startDate: task.startDate,
    milestone: task.milestone,
    customerName: task.customerName,
    model: task.model,
    logisticsNo: task.logisticsNo,
    email: task.email,
    sampleQty: task.sampleQty
  })
  showTaskDetailDialog.value = true
}

function saveTaskDetail() {
  updateTask(taskDetail.id, {
    name: taskDetail.name,
    duration: taskDetail.duration,
    startDate: taskDetail.startDate,
    milestone: taskDetail.milestone,
    customerName: taskDetail.customerName,
    model: taskDetail.model,
    logisticsNo: taskDetail.logisticsNo,
    email: taskDetail.email,
    sampleQty: taskDetail.sampleQty
  })
  showTaskDetailDialog.value = false
}

let dragTask = null
let dragType = null
let dragStartX = 0
let dragStartValue = 0

function startDrag(e, task) {
  if (props.readOnly) return
  dragTask = task
  dragType = 'move'
  dragStartX = e.clientX
  dragStartValue = new Date(task.startDate)
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', endDrag)
}

function startResize(e, task, type) {
  if (props.readOnly) return
  dragTask = task
  dragType = type
  dragStartX = e.clientX
  dragStartValue = type === 'left' ? new Date(task.startDate) : parseInt(task.duration)
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', endDrag)
}

function onDrag(e) {
  if (!dragTask) return
  
  const container = ganttContainer.value
  if (!container) return
  
  const rect = container.getBoundingClientRect()
  const cellWidth = rect.width / viewRange
  const deltaX = e.clientX - dragStartX
  const deltaDays = Math.round(deltaX / cellWidth)
  
  if (dragType === 'move') {
    const newDate = new Date(dragStartValue)
    newDate.setDate(newDate.getDate() + deltaDays)
    updateTask(dragTask.id, { startDate: newDate.toISOString().split('T')[0] })
  } else if (dragType === 'left') {
    const newDate = new Date(dragStartValue)
    newDate.setDate(newDate.getDate() + deltaDays)
    const endDate = new Date(dragTask.startDate)
    endDate.setDate(endDate.getDate() + parseInt(dragTask.duration))
    const newDuration = Math.max(1, Math.ceil((endDate - newDate) / (1000 * 60 * 60 * 24)))
    updateTask(dragTask.id, { startDate: newDate.toISOString().split('T')[0], duration: newDuration })
  } else if (dragType === 'right') {
    const newDuration = Math.max(1, dragStartValue + deltaDays)
    updateTask(dragTask.id, { duration: newDuration })
  }
}

function endDrag() {
  dragTask = null
  dragType = null
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', endDrag)
}

function editProject(project) {
  Object.assign(editProjectForm, {
    id: project.id,
    name: project.name,
    description: project.description,
    projectType: project.projectType,
    color: project.color
  })
  showEditProjectDialog.value = true
}

function handleDeleteProjectFromEdit() {
  if (confirm(`确定要删除项目「${editProjectForm.name}」吗？此操作不可撤销。`)) {
    deleteProject(editProjectForm.id)
    showEditProjectDialog.value = false
    showProjectList.value = false
  }
}

function saveProjectEdit() {
  if (!editProjectForm.name.trim()) {
    alert('请填写项目名称')
    return
  }
  updateProject(editProjectForm.id, {
    name: editProjectForm.name,
    description: editProjectForm.description,
    projectType: editProjectForm.projectType,
    color: editProjectForm.color
  })
  showEditProjectDialog.value = false
}

function handleDeleteProject(project) {
  if (confirm(`确定要删除项目「${project.name}」吗？此操作不可撤销。`)) {
    deleteProject(project.id)
    showProjectList.value = false
  }
}
</script>

<style>
.project-space {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.project-tabs {
  display: flex;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  overflow-x: auto;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  white-space: nowrap;
}

.tab-item:hover {
  background: rgba(0, 0, 0, 0.03);
}

.tab-item.active {
  background: #fff;
  border-bottom-color: #409EFF;
}

.tab-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.tab-type {
  font-size: 11px;
  padding: 2px 6px;
  background: #e6f7ff;
  color: #1890ff;
  border-radius: 4px;
}

.tab-edit {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: #909399;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-edit:hover {
  color: #409EFF;
}

.tab-close {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 50%;
  font-size: 16px;
  color: #909399;
}

.tab-close:hover {
  background: #f0f0f0;
}

.add-tab {
  width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 20px;
  color: #409EFF;
}

.project-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.left-panel {
  width: 400px;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  border-bottom: 1px solid #e4e7ed;
}

.panel-header h3 {
  font-size: 16px;
  font-weight: 600;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.add-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #409EFF;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stage-tree {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.stage-item {
  margin-bottom: 15px;
}

.stage-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #f8f9fa;
  border-left: 4px solid;
  border-radius: 0 4px 4px 0;
}

.stage-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stage-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.stage-name {
  font-weight: 500;
}

.stage-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stage-edit-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(64, 158, 255, 0.1);
  color: #409EFF;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stage-edit-btn:hover {
  background: rgba(64, 158, 255, 0.2);
}

.stage-delete-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(245, 108, 108, 0.1);
  color: #F56C6C;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stage-delete-btn:hover {
  background: rgba(245, 108, 108, 0.2);
}

.add-task-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(64, 158, 255, 0.1);
  color: #409EFF;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}

.stage-item {
  cursor: grab;
  transition: all 0.2s;
}

.stage-item.dragging {
  opacity: 0.5;
  cursor: grabbing;
}

.stage-item.drag-over {
  border: 2px dashed #409EFF;
  background: rgba(64, 158, 255, 0.05);
}

.color-presets {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.preset-label {
  font-size: 12px;
  color: #909399;
}

.color-preset {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.color-preset:hover {
  border-color: #909399;
  transform: scale(1.1);
}

.stage-hint {
  font-size: 12px;
  color: #909399;
  padding: 8px 0;
  border-top: 1px solid #f0f0f0;
  margin-top: 8px;
}

.empty-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #909399;
  text-align: center;
}

.empty-stage p {
  margin: 8px 0 0 0;
}

.empty-stage .empty-stage-hint {
  font-size: 12px;
  color: #C0C4CC;
  margin-top: 4px;
}

.reorder-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  color: #409EFF;
  font-size: 13px;
  background: rgba(64, 158, 255, 0.05);
  border-radius: 4px;
  margin-bottom: 8px;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.task-list {
  margin-top: 8px;
  padding-left: 8px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #fff;
  border-radius: 4px;
  margin-bottom: 6px;
  border: 1px solid #f0f0f0;
  transition: all 0.2s;
}

.task-item:hover {
  background: #fafafa;
}

.task-item.completed {
  opacity: 0.6;
}

.task-item.completed .task-name {
  text-decoration: line-through;
}

.task-item.milestone {
  border-color: #E6A23C;
  background: rgba(230, 162, 60, 0.05);
}

.task-name {
  flex: 1;
  font-size: 13px;
}

.task-duration {
  font-size: 12px;
  color: #909399;
}

.task-date {
  font-size: 12px;
  color: #909399;
}

.task-customer {
  font-size: 11px;
  padding: 2px 6px;
  background: #e6f7ff;
  color: #1890ff;
  border-radius: 4px;
  white-space: nowrap;
}

.task-model {
  font-size: 11px;
  padding: 2px 6px;
  background: #f6ffed;
  color: #52c41a;
  border-radius: 4px;
  white-space: nowrap;
}

.milestone-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: #E6A23C;
  color: #fff;
  border: none;
  border-radius: 4px;
}

.delete-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #909399;
  font-size: 14px;
  border-radius: 50%;
}

.delete-btn:hover {
  background: #f0f0f0;
  color: #F56C6C;
}

.empty-tasks {
  padding: 15px;
  text-align: center;
  color: #909399;
  font-size: 13px;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.gantt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  border-bottom: 1px solid #e4e7ed;
  background: #fafafa;
}

.gantt-filters {
  display: flex;
  gap: 20px;
}

.gantt-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.gantt-controls button {
  width: 32px;
  height: 32px;
  border: 1px solid #dcdfe6;
  background: #fff;
  cursor: pointer;
  border-radius: 4px;
  font-size: 16px;
}

.gantt-controls button:hover {
  background: #f5f7fa;
}

.gantt-controls span {
  font-size: 13px;
  color: #606266;
}

.gantt-filters-row {
  display: flex;
  gap: 15px;
  padding: 10px 20px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.gantt-filters-row .el-select {
  width: 150px;
}

.gantt-container {
  flex: 1;
  overflow: auto;
  background: #fff;
}

.gantt-timeline {
  min-width: 100%;
}

.timeline-header {
  display: flex;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 10;
}

.timeline-empty {
  width: 150px;
  flex-shrink: 0;
  border-right: 1px solid #e4e7ed;
  padding: 10px;
}

.timeline-dates {
  display: flex;
  flex: 1;
  min-width: 100%;
}

.date-cell {
  flex: 1;
  min-width: 60px;
  padding: 10px 5px;
  text-align: center;
  border-right: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}

.date-cell.today {
  background: rgba(64, 158, 255, 0.1);
}

.date-cell.weekend {
  background: #fafafa;
  color: #909399;
}

.date-day {
  font-size: 14px;
  font-weight: 500;
}

.date-weekday {
  font-size: 11px;
  color: #909399;
  margin-top: 4px;
}

.timeline-body {
  display: flex;
  flex-direction: column;
}

.stage-row {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
}

.stage-label {
  width: 150px;
  flex-shrink: 0;
  padding: 12px 10px;
  border-right: 1px solid #e4e7ed;
  font-size: 13px;
  font-weight: 500;
  background: #fafafa;
}

.stage-bars {
  flex: 1;
  min-width: 100%;
  height: 56px;
  position: relative;
  padding: 8px 0;
}

.task-bar {
  position: absolute;
  height: 40px;
  border-radius: 4px;
  border: 2px solid;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 4px 8px;
  cursor: move;
  overflow: hidden;
  transition: all 0.1s;
  min-width: 50px;
}

.task-bar:hover {
  transform: scaleY(1.05);
  z-index: 5;
}

.task-bar.completed {
  opacity: 0.6;
}

.task-bar.milestone {
  border-style: dashed;
}

.bar-label {
  font-size: 12px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.bar-milestone {
  color: #fff;
  font-size: 14px;
  margin-left: 4px;
}

.bar-info {
  display: flex;
  gap: 6px;
  margin-top: 2px;
}

.info-item {
  font-size: 10px;
  color: rgba(255,255,255,0.8);
  background: rgba(0,0,0,0.2);
  padding: 1px 4px;
  border-radius: 2px;
}

.bar-resize-left,
.bar-resize-right {
  position: absolute;
  width: 8px;
  height: 100%;
  cursor: ew-resize;
  z-index: 10;
}

.bar-resize-left {
  left: 0;
}

.bar-resize-right {
  right: 0;
}

.bar-resize-left:hover,
.bar-resize-right:hover {
  background: rgba(255, 255, 255, 0.3);
}

.empty-project {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.empty-project svg {
  margin-bottom: 20px;
}

.project-list {
  max-height: 400px;
  overflow-y: auto;
}

.project-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.project-item:hover {
  background: #f5f7fa;
}

.project-item.active {
  background: rgba(64, 158, 255, 0.1);
}

.project-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.project-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.project-actions {
  display: flex;
  gap: 8px;
}

.project-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.project-name {
  font-weight: 500;
}

.project-type-badge {
  font-size: 11px;
  padding: 2px 6px;
  background: #e6f7ff;
  color: #1890ff;
  border-radius: 4px;
}

.project-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

@media (max-width: 768px) {
  .project-content {
    flex-direction: column;
  }
  .left-panel {
    width: 100%;
    height: 300px;
    border-right: none;
    border-bottom: 1px solid #e4e7ed;
  }
  .gantt-filters-row {
    flex-wrap: wrap;
  }
}
</style>
