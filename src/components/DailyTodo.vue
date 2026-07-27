<template>
  <div class="daily-todo">
    <div class="todo-header">
      <h2>每日待办</h2>
      <div class="header-actions">
        <div class="date-selector">
          <button @click="prevDay">←</button>
          <el-date-picker v-model="currentDate" type="date" @change="loadTodos" />
          <button @click="nextDay">→</button>
        </div>
        <el-button v-if="!props.readOnly" size="small" type="primary" @click="openAddTodoDialog">
          新增待办
        </el-button>
        <el-button v-if="!props.readOnly" size="small" type="primary" @click="showCategoryDialog = true">
          管理分类
        </el-button>
      </div>
    </div>
    
    <div class="todo-stats">
      <div class="stat-item">
        <span class="stat-value">{{ todos.length }}</span>
        <span class="stat-label">总任务</span>
      </div>
      <div class="stat-item completed">
        <span class="stat-value">{{ completedCount }}</span>
        <span class="stat-label">已完成</span>
      </div>
      <div class="stat-item pending">
        <span class="stat-value">{{ pendingCount }}</span>
        <span class="stat-label">待完成</span>
      </div>
      <div class="stat-item progress">
        <span class="stat-value">{{ progress }}%</span>
        <span class="stat-label">完成率</span>
      </div>
    </div>
    
    <div class="todo-container">
      <div 
        v-for="category in store.todoCategories" 
        :key="category" 
        class="todo-column"
        @dragover.prevent
        @drop="handleDrop($event, category)"
      >
        <div class="column-header">
          <span>{{ category }}</span>
          <span class="count">{{ getCategoryTodos(category).length }}</span>
        </div>
        <div class="task-list">
          <div 
            v-for="todo in getCategoryTodos(category)" 
            :key="todo.id" 
            class="todo-card"
            :class="{ completed: todo.completed }"
            draggable="true"
            @dragstart="dragStart(todo)"
            @click="toggleComplete(todo.id)"
          >
            <input type="checkbox" :checked="todo.completed" @change.stop="toggleComplete(todo.id)" />
            <div class="todo-content">
              <span class="todo-text">{{ todo.content }}</span>
              <span class="todo-project" v-if="getProjectName(todo.projectId)">
                {{ getProjectName(todo.projectId) }}
              </span>
              <div v-if="todo.attachments && todo.attachments.length > 0" class="todo-attachments">
                <span class="attachment-count">{{ todo.attachments.length }}个附件</span>
                <div class="attachment-list">
                  <span 
                    v-for="(file, idx) in todo.attachments" 
                    :key="idx"
                    @click.stop="openAttachment(file)"
                    class="attachment-link"
                  >
                    {{ file.name }}
                  </span>
                </div>
              </div>
            </div>
            <div class="todo-actions">
              <el-button 
                size="small" 
                :type="todo.completed ? 'default' : 'success'" 
                icon="Check"
                @click.stop="toggleComplete(todo.id)"
              >
                {{ todo.completed ? '已完成' : '完成' }}
              </el-button>
              <button v-if="!props.readOnly" @click.stop="deleteTodoItem(todo.id)" class="delete-btn">×</button>
            </div>
          </div>
          <div v-if="getCategoryTodos(category).length === 0" class="empty-column">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <p>暂无任务</p>
          </div>
        </div>
      </div>
    </div>
    
    <div class="quick-stats">
      <h3>本周概览</h3>
      <div class="week-calendar">
        <div 
          v-for="day in weekDays" 
          :key="day.date" 
          class="week-day"
          :class="{ today: day.isToday, selected: day.date === currentDate }"
          @click="currentDate = day.date"
        >
          <span class="day-name">{{ day.name }}</span>
          <span class="day-num">{{ day.num }}</span>
          <span class="day-count">{{ getDayCount(day.date) }}</span>
        </div>
      </div>
    </div>
    
    <el-dialog v-model="showAddTodoDialog" title="新增待办任务" width="500px">
      <el-form :model="todoForm" label-width="80px">
        <el-form-item label="任务内容">
          <el-input v-model="todoForm.content" placeholder="请输入任务内容" />
        </el-form-item>
        <el-form-item label="任务分类">
          <el-select v-model="todoForm.category" placeholder="选择分类">
            <el-option v-for="cat in store.todoCategories" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联项目">
          <el-select v-model="todoForm.projectId" placeholder="选择项目">
            <el-option label="不关联" value="" />
            <el-option v-for="p in store.projects" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="截止日期">
          <el-date-picker v-model="todoForm.deadline" type="date" />
        </el-form-item>
        <el-form-item label="云端附件">
          <FileUploader
            v-if="todoForm.category"
            module-type="task"
            :module-id="(store.todoCategories.indexOf(todoForm.category) + 1).toString()"
            :module-name="todoForm.category"
            v-model="todoForm.attachments"
          />
          <div v-else class="upload-disabled">
            <el-alert type="info" :closable="false" show-icon>
              请先选择任务分类，然后才能上传附件
            </el-alert>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddTodoDialog = false">取消</el-button>
        <el-button type="primary" @click="saveTodo">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showCategoryDialog" title="待办分类管理" width="450px">
      <div class="category-list">
        <div 
          v-for="cat in store.todoCategories" 
          :key="cat" 
          class="category-item"
        >
          <span>{{ cat }}</span>
          <div class="category-actions">
            <el-button size="small" @click="editCategory(cat)">编辑</el-button>
            <el-button size="small" type="danger" @click="confirmDeleteCategory(cat)">删除</el-button>
          </div>
        </div>
      </div>
      <div class="add-category">
        <el-input v-model="newCategoryName" placeholder="输入新分类名称" @keyup.enter="addCategory" />
        <el-button type="primary" @click="addCategory">新增分类</el-button>
      </div>
      <template #footer>
        <el-button @click="showCategoryDialog = false">关闭</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showEditCategoryDialog" title="编辑分类" width="350px">
      <el-form :model="editCategoryForm" label-width="60px">
        <el-form-item label="名称">
          <el-input v-model="editCategoryForm.name" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditCategoryDialog = false">取消</el-button>
        <el-button type="primary" @click="saveCategoryEdit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import FileUploader from './FileUploader.vue'
import { store, getProjectById, addDailyTodo, toggleTodoComplete, deleteTodo, addTodoCategory, updateTodoCategory, deleteTodoCategory } from '../store.js'
import { getFileUrlFromSupabase } from '../supabase.js'

const props = defineProps({
  readOnly: {
    type: Boolean,
    default: false
  }
})

const currentDate = ref(new Date().toISOString().split('T')[0])
const newTodo = ref('')
const selectedCategory = ref('')
const selectedProjectId = ref('')
const currentDragTodo = ref(null)

const showCategoryDialog = ref(false)
const showEditCategoryDialog = ref(false)
const showAddTodoDialog = ref(false)
const newCategoryName = ref('')
const editingCategory = ref('')
const editCategoryForm = reactive({ name: '' })

const todoForm = reactive({
  content: '',
  category: '',
  projectId: '',
  deadline: '',
  attachments: []
})

const todos = computed(() => {
  return store.dailyTodos.filter(t => t.date === currentDate.value)
})

const pendingTodos = computed(() => todos.value.filter(t => !t.completed))
const completedTodos = computed(() => todos.value.filter(t => t.completed))

const completedCount = computed(() => completedTodos.value.length)
const pendingCount = computed(() => pendingTodos.value.length)
const progress = computed(() => {
  if (todos.value.length === 0) return 0
  return Math.round((completedCount.value / todos.value.length) * 100)
})

const weekDays = computed(() => {
  const days = []
  const weekDayNames = ['日', '一', '二', '三', '四', '五', '六']
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    days.push({
      date: date.toISOString().split('T')[0],
      name: weekDayNames[date.getDay()],
      num: date.getDate(),
      isToday: date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
    })
  }
  return days
})

function loadTodos() {}

function prevDay() {
  const date = new Date(currentDate.value)
  date.setDate(date.getDate() - 1)
  currentDate.value = date.toISOString().split('T')[0]
}

function nextDay() {
  const date = new Date(currentDate.value)
  date.setDate(date.getDate() + 1)
  currentDate.value = date.toISOString().split('T')[0]
}

function getProjectName(projectId) {
  if (!projectId) return null
  const project = getProjectById(projectId)
  return project ? project.name : null
}

function toggleComplete(todoId) {
  toggleTodoComplete(todoId)
}

function deleteTodoItem(todoId) {
  deleteTodo(todoId)
}

function addTodoItem() {
  if (!newTodo.value.trim()) return
  if (!selectedCategory.value && store.todoCategories.length > 0) {
    selectedCategory.value = store.todoCategories[0]
  }
  addDailyTodo(newTodo.value.trim(), selectedProjectId.value || null, selectedCategory.value)
  newTodo.value = ''
}

function openAddTodoDialog() {
  Object.assign(todoForm, {
    content: '',
    category: '',
    projectId: '',
    deadline: '',
    attachments: []
  })
  showAddTodoDialog.value = true
}

function saveTodo() {
  if (!todoForm.content.trim()) {
    alert('请输入任务内容')
    return
  }
  if (!todoForm.category && store.todoCategories.length > 0) {
    alert('请选择任务分类')
    return
  }
  
  addDailyTodo(
    todoForm.content.trim(),
    todoForm.projectId || null,
    todoForm.category,
    [...todoForm.attachments]
  )
  
  showAddTodoDialog.value = false
  alert('待办任务添加成功')
}

async function getFileUrl(filePath) {
  if (!filePath) return '#'
  const result = await getFileUrlFromSupabase(filePath)
  return result.success ? result.url : '#'
}

async function openAttachment(file) {
  const url = await getFileUrl(file.path)
  if (url !== '#') {
    window.open(url, '_blank')
  }
}

function getDayCount(date) {
  return store.dailyTodos.filter(t => t.date === date && !t.completed).length
}

function getCategoryTodos(category) {
  return todos.value.filter(t => t.category === category)
}

function dragStart(todo) {
  currentDragTodo.value = todo
}

function handleDrop(event, targetCategory) {
  if (currentDragTodo.value && currentDragTodo.value.category !== targetCategory) {
    const todo = store.dailyTodos.find(t => t.id === currentDragTodo.value.id)
    if (todo) {
      todo.category = targetCategory
    }
  }
  currentDragTodo.value = null
}

function addCategory() {
  if (!newCategoryName.value.trim()) {
    alert('请输入分类名称')
    return
  }
  const result = addTodoCategory(newCategoryName.value.trim())
  if (result.success) {
    newCategoryName.value = ''
  } else {
    alert(result.error)
  }
}

function editCategory(name) {
  editingCategory.value = name
  editCategoryForm.name = name
  showEditCategoryDialog.value = true
}

function saveCategoryEdit() {
  if (!editCategoryForm.name.trim()) {
    alert('请输入分类名称')
    return
  }
  const result = updateTodoCategory(editingCategory.value, editCategoryForm.name.trim())
  if (result.success) {
    showEditCategoryDialog.value = false
  } else {
    alert(result.error)
  }
}

function confirmDeleteCategory(name) {
  const count = store.dailyTodos.filter(t => t.category === name).length
  if (count > 0) {
    alert(`该分类下有 ${count} 个待办，无法删除`)
    return
  }
  if (confirm(`确定删除分类 "${name}" 吗？`)) {
    const result = deleteTodoCategory(name)
    if (!result.success) {
      alert(result.error)
    }
  }
}
</script>

<style>
.daily-todo {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}

.todo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.todo-header h2 {
  font-size: 20px;
  font-weight: 600;
}

.date-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date-selector button {
  width: 32px;
  height: 32px;
  border: 1px solid #dcdfe6;
  background: #fff;
  cursor: pointer;
  border-radius: 4px;
}

.date-selector button:hover {
  background: #f5f7fa;
}

.todo-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-item.completed .stat-value {
  color: #67C23A;
}

.stat-item.pending .stat-value {
  color: #E6A23C;
}

.stat-item.progress .stat-value {
  color: #409EFF;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.todo-container {
  flex: 1;
  display: flex;
  gap: 20px;
  overflow-x: auto;
}

.todo-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
  min-width: 220px;
}

.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
}

.column-header .count {
  width: 24px;
  height: 24px;
  background: #E6A23C;
  color: #fff;
  border-radius: 50%;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.task-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.todo-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 15px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 4px solid transparent;
}

.todo-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.todo-card.completed {
  opacity: 0.7;
  background: #f5f7fa;
  border-left-color: #67C23A;
}

.todo-card.completed .todo-text {
  text-decoration: line-through;
}

.todo-content {
  flex: 1;
}

.todo-text {
  font-size: 14px;
}

.todo-project {
  display: inline-block;
  font-size: 11px;
  padding: 2px 6px;
  background: #f0f0f0;
  color: #606266;
  border-radius: 4px;
  margin-top: 4px;
}

.todo-attachments {
  margin-top: 8px;
}

.attachment-count {
  font-size: 11px;
  color: #409eff;
  cursor: pointer;
}

.attachment-list {
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.attachment-link {
  font-size: 11px;
  padding: 2px 6px;
  background: #ecf5ff;
  color: #409eff;
  border-radius: 4px;
  text-decoration: none;
}

.attachment-link:hover {
  background: #d4e8ff;
}

.todo-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
}

.delete-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #909399;
  font-size: 16px;
  border-radius: 50%;
}

.delete-btn:hover {
  background: #f0f0f0;
  color: #F56C6C;
}

.empty-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #909399;
}

.empty-column svg {
  margin-bottom: 10px;
}

.empty-column p {
  font-size: 13px;
}

.add-todo {
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.add-todo .el-input {
  flex: 1;
  min-width: 150px;
}

.quick-stats {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.quick-stats h3 {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 15px;
}

.week-calendar {
  display: flex;
  gap: 10px;
}

.week-day {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.week-day:hover {
  background: #e4e7ed;
}

.week-day.today {
  background: rgba(64, 158, 255, 0.1);
  border: 2px solid #409EFF;
}

.week-day.selected {
  background: #409EFF;
  color: #fff;
}

.day-name {
  font-size: 12px;
}

.day-num {
  font-size: 18px;
  font-weight: 600;
  margin: 4px 0;
}

.day-count {
  font-size: 11px;
  padding: 2px 6px;
  background: #fff;
  border-radius: 10px;
  color: #606266;
}

.week-day.selected .day-count {
  background: rgba(255,255,255,0.3);
  color: #fff;
}

.category-list {
  margin-bottom: 20px;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 8px;
}

.add-category {
  display: flex;
  gap: 10px;
}

.add-category .el-input {
  flex: 1;
}

@media (max-width: 768px) {
  .todo-container {
    flex-direction: column;
  }
  .todo-stats {
    flex-wrap: wrap;
  }
  .stat-item {
    width: calc(50% - 10px);
  }
}
</style>
