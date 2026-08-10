<template>
  <div class="workbench">
    <div class="wb-header">
      <div class="greeting">
        <h1>欢迎回来，{{ store.user.name }}</h1>
        <p>{{ currentTime }}</p>
      </div>
    </div>
    
    <div class="wb-stats">
      <div class="stat-card" @click="navigateTo('customer')">
        <div class="stat-icon customer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value blue">{{ weeklyNewCustomers }}</span>
          <span class="stat-label">本周新增客户线索</span>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" class="stat-arrow">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>
      
      <div class="stat-card" @click="navigateTo('order')">
        <div class="stat-icon sample">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value" :class="{ 'danger': inTransitOverdue > 0 }">{{ inTransitSamples }}</span>
          <span class="stat-label">在途样机包裹</span>
          <span v-if="inTransitOverdue > 0" class="stat-warning">超7天 {{ inTransitOverdue }}个</span>
        </div>
      </div>
      
      <div class="stat-card" @click="navigateTo('order')">
        <div class="stat-icon order">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ monthlyPendingOrders }}</span>
          <span class="stat-label">本月待出货订单</span>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" class="stat-arrow">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>
      
      <div class="stat-card" @click="navigateTo('finance')">
        <div class="stat-icon finance">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ unsettledFreight }}</span>
          <span class="stat-label">未结清物流运费</span>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" class="stat-arrow">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>
      
      <div class="stat-card" @click="navigateTo('dailywork')">
        <div class="stat-icon todo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ todayTodosCount }}</span>
          <span class="stat-label">今日待跟进任务</span>
        </div>
        <span v-if="todayTodosCount > 0" class="stat-badge">{{ todayTodosCount }}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" class="stat-arrow">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>
    </div>
    
    <div class="wb-content">
      <div class="wb-left">
        <div class="kanban-section">
          <div class="section-header">
            <h3>待办看板</h3>
            <el-button size="small" type="primary" @click="openAddTodoDialog">+ 新增待办</el-button>
          </div>
          <div class="kanban-container">
            <div v-for="column in columns" :key="column.key" class="kanban-column">
              <div class="column-header">
                <span class="column-title">{{ column.label }}</span>
                <span class="column-count">{{ getColumnTodos(column.key).length }}</span>
              </div>
              <div class="todo-list" @dragover.prevent @drop="handleDrop($event, column.key)">
                <div 
                  v-for="todo in getColumnTodos(column.key)" 
                  :key="todo.id" 
                  class="todo-card"
                  :class="{ completed: todo.completed }"
                  draggable="true"
                  @dragstart="handleDragStart($event, todo)"
                  @click="toggleTodo(todo)"
                >
                  <div class="todo-header">
                    <span class="todo-category">{{ getCategoryLabel(todo.category) }}</span>
                    <div class="todo-actions">
                      <el-button 
                        size="small" 
                        :type="todo.completed ? 'default' : 'success'" 
                        icon="Check"
                        @click.stop="toggleTodo(todo)"
                      >
                        {{ todo.completed ? '已完成' : '完成' }}
                      </el-button>
                    </div>
                  </div>
                  <div class="todo-content" :class="{ completed: todo.completed }">
                    {{ todo.content }}
                  </div>
                  <div class="todo-meta">
                    <span v-if="todo.customer" class="meta-item">{{ todo.customer }}</span>
                    <span v-if="todo.model" class="meta-item">{{ todo.model }}</span>
                  </div>
                  <div class="todo-deadline" :class="getDeadlineClass(todo)">
                    {{ todo.deadline }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="wb-right">
        <div class="calendar-section">
          <div class="section-header">
            <h3>业务日历</h3>
            <div class="calendar-controls">
              <el-button size="small" @click="prevMonth">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </el-button>
              <span class="current-month">{{ calendarYear }}年{{ calendarMonth + 1 }}月</span>
              <el-button size="small" @click="nextMonth">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </el-button>
            </div>
          </div>
          <div class="calendar-grid">
            <div class="calendar-header">
              <div v-for="day in weekDays" :key="day" class="day-header">{{ day }}</div>
            </div>
            <div class="calendar-body">
              <div 
                v-for="(day, index) in calendarDays" 
                :key="index" 
                class="day-cell"
                :class="{ 'other-month': !day.isCurrentMonth, 'today': day.isToday }"
              >
                <span class="day-number">{{ day.date }}</span>
                <div class="day-events">
                  <span 
                    v-for="event in day.events" 
                    :key="event.id" 
                    class="event-dot"
                    :class="event.type"
                    :title="event.title"
                  ></span>
                </div>
              </div>
            </div>
          </div>
          <div class="calendar-legend">
            <div class="legend-item">
              <span class="legend-dot customer"></span>
              <span>客户预约</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot sample"></span>
              <span>样机签收</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot cert-warning"></span>
              <span>证书到期(30天)</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot cert-danger"></span>
              <span>证书到期(7天)</span>
            </div>
          </div>
        </div>
        
        <div class="reminder-section">
          <div class="section-header">
            <h3>周期提醒</h3>
          </div>
          <div class="reminder-list">
            <div v-if="todayReminders.length === 0" class="empty-reminder">
              <p>暂无待触发的周期提醒</p>
            </div>
            <div v-for="reminder in todayReminders" :key="reminder.id" class="reminder-card">
              <div class="reminder-header">
                <span class="reminder-title">{{ reminder.title }}</span>
                <el-button size="small" type="danger" text @click="deleteReminder(reminder.id)">删除</el-button>
              </div>
              <div class="reminder-info">
                <span class="reminder-rule">{{ getReminderRuleText(reminder) }}</span>
                <span v-if="reminder.customer" class="reminder-meta">{{ reminder.customer }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="wb-actions">
      <el-button @click="navigateTo('customer')" class="action-btn sample">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        新建样机申请
      </el-button>
      <el-button @click="navigateTo('customer')" class="action-btn customer">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        新增海外客户
      </el-button>
      <el-button @click="navigateTo('order')" class="action-btn logistics">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <path d="M20 7h-9M14 17H5M17 17h2M17 7h2M7 17H5M7 7H5M20 14h-9"/>
        </svg>
        录入顺丰运单
      </el-button>
      <el-button @click="navigateTo('dailywork')" class="action-btn report">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
        导出本周周报
      </el-button>
      <el-button @click="navigateTo('product')" class="action-btn product">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        机型参数查询
      </el-button>
    </div>
    
    <el-dialog v-model="showTodoDialog" title="新增待办" width="500px">
      <el-form :model="todoForm" label-width="90px">
        <el-form-item label="内容描述">
          <el-input v-model="todoForm.content" type="textarea" :rows="3" placeholder="请输入待办内容，例如：每月底提交彩盒审核情况" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="todoForm.category">
            <el-option v-for="cat in store.todoCategories" :key="cat.id" :label="cat.label" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联客户">
          <el-select v-model="todoForm.customer" filterable>
            <el-option label="请选择" value="" />
            <el-option v-for="c in store.customers" :key="c.id" :label="c.name" :value="c.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联机型">
          <el-select v-model="todoForm.model" filterable>
            <el-option label="请选择" value="" />
            <el-option v-for="m in store.productModels" :key="m.id" :label="m.name" :value="m.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="截止日期">
          <el-date-picker v-model="todoForm.deadline" type="date" />
        </el-form-item>
        <el-form-item label="重复提醒">
          <el-select v-model="todoForm.recurrenceRule" @change="onRecurrenceRuleChange">
            <el-option label="不重复" value="none" />
            <el-option label="每天" value="daily" />
            <el-option label="工作日" value="workday" />
            <el-option label="每周" value="weekly" />
            <el-option label="每月" value="monthly" />
            <el-option label="每年" value="yearly" />
          </el-select>
        </el-form-item>
        <template v-if="todoForm.recurrenceRule === 'weekly'">
          <el-form-item label="重复周几">
            <el-select v-model="todoForm.customWeekday">
              <el-option label="周一" :value="1" />
              <el-option label="周二" :value="2" />
              <el-option label="周三" :value="3" />
              <el-option label="周四" :value="4" />
              <el-option label="周五" :value="5" />
              <el-option label="周六" :value="6" />
              <el-option label="周日" :value="0" />
            </el-select>
          </el-form-item>
        </template>
        <template v-if="todoForm.recurrenceRule === 'monthly'">
          <el-form-item label="每月第">
            <el-select v-model="todoForm.customMonthday">
              <el-option v-for="i in 31" :key="i" :label="i + '日'" :value="i" />
            </el-select>
            <span style="margin-left: 10px;">提醒</span>
          </el-form-item>
        </template>
        <template v-if="todoForm.recurrenceRule !== 'none' && todoForm.recurrenceRule !== 'daily' && todoForm.recurrenceRule !== 'workday'">
          <el-form-item :label="todoForm.recurrenceRule === 'weekly' ? '每几周' : '每几月'">
            <el-input-number v-model="todoForm.recurrenceInterval" :min="1" :max="12" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="showTodoDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmTodo">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { store, addDailyTodoItem, updateDailyTodoItem, getCustomerById, addDailyReminder, deleteDailyReminder } from '../store.js'

const emit = defineEmits(['navigate'])

const currentTime = ref('')
const calendarYear = ref(new Date().getFullYear())
const calendarMonth = ref(new Date().getMonth())

const showTodoDialog = ref(false)
const todoForm = reactive({
  content: '',
  category: 'cat1',
  customer: '',
  model: '',
  deadline: new Date().toISOString().split('T')[0],
  recurrenceRule: 'none',
  recurrenceInterval: 1,
  customWeekday: 1,
  customMonthday: 1
})

const currentDragTodo = ref(null)

const todayReminders = computed(() => {
  const today = new Date()
  const todayDay = today.getDay()
  const todayDate = today.getDate()
  
  return store.dailyReminders.filter(reminder => {
    if (reminder.status === 'completed') return false
    
    switch (reminder.repeatRule) {
      case 'daily':
        return true
      case 'workday':
        return todayDay >= 1 && todayDay <= 5
      case 'weekly':
        return todayDay === reminder.customWeekday
      case 'monthly':
        return todayDate === reminder.customMonthday
      case 'yearly':
        return todayDate === reminder.customMonthday
      default:
        return false
    }
  })
})

function getReminderRuleText(reminder) {
  const ruleMap = {
    'daily': '每天提醒',
    'workday': '工作日提醒',
    'weekly': `每${reminder.recurrenceInterval || 1}周的周${getWeekdayText(reminder.customWeekday)}`,
    'monthly': `每${reminder.recurrenceInterval || 1}月${reminder.customMonthday}日`,
    'yearly': `每年${reminder.customMonthday}日`
  }
  return ruleMap[reminder.repeatRule] || '单次提醒'
}

function getWeekdayText(day) {
  const map = { 0: '日', 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六' }
  return map[day] || '一'
}

function deleteReminder(id) {
  ElMessageBox.confirm('确定删除此提醒吗？', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    deleteDailyReminder(id)
    ElMessage.success('提醒已删除')
  }).catch(() => {})
}

function checkTodayReminders() {
  if (todayReminders.value.length > 0) {
    const reminder = todayReminders.value[0]
    ElNotification({
      title: '周期提醒',
      message: reminder.title,
      type: 'info',
      duration: 5000
    })
  }
}

const columns = computed(() => {
  return store.todoCategories
    .filter(c => typeof c === 'object' && c !== null && !c.isDefault)
    .map(cat => ({
      key: cat.id,
      label: cat.label || cat.name || '未命名分类'
    }))
})

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

let timer = null

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
  checkTodayReminders()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const weeklyNewCustomers = computed(() => {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1)
  const startStr = startOfWeek.toISOString().split('T')[0]
  return store.customers.filter(c => c.firstContactDate >= startStr).length
})

const inTransitSamples = computed(() => {
  return store.sampleDeliveries.filter(s => s.status === 'in_transit').length
})

const inTransitOverdue = computed(() => {
  const now = new Date()
  return store.sampleDeliveries.filter(s => {
    if (s.status !== 'in_transit' || !s.sendDate) return false
    const sendDate = new Date(s.sendDate)
    const diffDays = Math.floor((now - sendDate) / (1000 * 60 * 60 * 24))
    return diffDays > 7
  }).length
})

const monthlyPendingOrders = computed(() => {
  const now = new Date()
  const monthStr = now.toISOString().slice(0, 7)
  return store.salesOrders.filter(o => 
    o.bookingDate.startsWith(monthStr) && o.status !== 'completed'
  ).length
})

const unsettledFreight = computed(() => {
  const total = store.logisticsBills.filter(b => b.paymentStatus !== 'paid')
    .reduce((sum, b) => sum + (parseFloat(b.freightAmount) || 0), 0)
  return `${total.toFixed(2)} USD`
})

const todayTodosCount = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return store.dailyTodos.filter(t => t.deadline === today && !t.completed).length
})

function getColumnTodos(category) {
  return store.dailyTodos.filter(t => t.category === category)
}

function getCategoryLabel(category) {
  try {
    const cat = store.todoCategories.find(c => typeof c === 'object' && c !== null && (c.id === category || c.name === category))
    return cat ? (cat.label || cat.name || '未命名分类') : '未命名分类'
  } catch (e) {
    return '未命名分类'
  }
}

function getDeadlineClass(todo) {
  if (!todo.deadline) return ''
  const today = new Date()
  const deadline = new Date(todo.deadline)
  const diffDays = Math.floor((deadline - today) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'overdue'
  if (diffDays === 0) return 'today'
  if (diffDays <= 3) return 'urgent'
  return ''
}

function handleDragStart(event, todo) {
  currentDragTodo.value = todo
}

function handleDrop(event, targetCategory) {
  if (currentDragTodo.value && currentDragTodo.value.category !== targetCategory) {
    currentDragTodo.value.category = targetCategory
    updateDailyTodoItem(currentDragTodo.value.id, { category: targetCategory })
  }
  currentDragTodo.value = null
}

function toggleTodo(todo) {
  todo.completed = !todo.completed
  updateDailyTodoItem(todo.id, { completed: todo.completed })
}

function openAddTodoDialog() {
  Object.assign(todoForm, {
    content: '',
    category: 'cat1',
    customer: '',
    model: '',
    deadline: new Date().toISOString().split('T')[0],
    recurrenceRule: 'none',
    recurrenceInterval: 1,
    customWeekday: 1,
    customMonthday: 1
  })
  showTodoDialog.value = true
}

function onRecurrenceRuleChange(rule) {
  if (rule === 'weekly') {
    const today = new Date()
    const dayOfWeek = today.getDay()
    todoForm.customWeekday = dayOfWeek === 0 ? 7 : dayOfWeek
  } else if (rule === 'monthly') {
    const today = new Date()
    todoForm.customMonthday = today.getDate()
  }
}

function confirmTodo() {
  if (!todoForm.content.trim()) {
    alert('请填写待办内容')
    return
  }
  
  if (todoForm.recurrenceRule && todoForm.recurrenceRule !== 'none') {
    const reminderData = {
      title: todoForm.content,
      businessType: 'todo',
      activateConfigId: '',
      remindTime: '09:00',
      repeatRule: todoForm.recurrenceRule,
      recurrenceInterval: todoForm.recurrenceInterval,
      customWeekday: todoForm.customWeekday,
      customMonthday: todoForm.customMonthday,
      deadline: todoForm.deadline,
      category: todoForm.category,
      customer: todoForm.customer,
      model: todoForm.model,
      remark: ''
    }
    addDailyReminder(reminderData)
    ElMessage.success('周期性待办提醒创建成功')
  } else {
    const customer = store.customers.find(c => c.name === todoForm.customer)
    const model = store.productModels.find(m => m.name === todoForm.model)
    addDailyTodoItem({
      content: todoForm.content,
      category: todoForm.category,
      customerId: customer?.id || '',
      modelId: model?.id || '',
      deadline: todoForm.deadline,
      completed: false
    })
    ElMessage.success('待办添加成功')
  }
  showTodoDialog.value = false
}

const calendarDays = computed(() => {
  const year = calendarYear.value
  const month = calendarMonth.value
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  const days = []
  
  const startPadding = firstDay.getDay()
  for (let i = startPadding - 1; i >= 0; i--) {
    const date = new Date(year, month, -i)
    days.push({
      date: date.getDate(),
      fullDate: date.toISOString().split('T')[0],
      isCurrentMonth: false,
      isToday: false,
      events: []
    })
  }
  
  const today = new Date()
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i)
    const fullDate = date.toISOString().split('T')[0]
    days.push({
      date: i,
      fullDate: fullDate,
      isCurrentMonth: true,
      isToday: today.toDateString() === date.toDateString(),
      events: getCalendarEvents(fullDate)
    })
  }
  
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i)
    days.push({
      date: i,
      fullDate: date.toISOString().split('T')[0],
      isCurrentMonth: false,
      isToday: false,
      events: []
    })
  }
  
  return days
})

function getCalendarEvents(date) {
  const events = []
  
  store.sampleDeliveries.forEach(s => {
    if (s.expectedSignDate === date && s.status !== 'delivered') {
      const customer = store.customers.find(c => c.id === s.customerId)
      events.push({ id: 's-' + s.id, type: 'sample', title: `${customer ? customer.name : ''} 样机签收截止` })
    }
  })
  
  store.certRecords.forEach(c => {
    if (!c.expiryDate) return
    if (c.expiryDate === date) {
      const model = store.productModels.find(m => m.id === c.modelId)
      events.push({ id: 'c-' + c.id, type: 'cert-danger', title: `${model ? model.name : ''} ${c.certType}证书到期` })
    } else {
      const expire = new Date(c.expiryDate)
      const current = new Date(date)
      const diffDays = Math.floor((expire - current) / (1000 * 60 * 60 * 24))
      const model = store.productModels.find(m => m.id === c.modelId)
      if (diffDays > 0 && diffDays <= 7) {
        events.push({ id: 'c-' + c.id, type: 'cert-danger', title: `${model ? model.name : ''} ${c.certType}证书7天内到期` })
      } else if (diffDays > 7 && diffDays <= 30) {
        events.push({ id: 'c-' + c.id, type: 'cert-warning', title: `${model ? model.name : ''} ${c.certType}证书30天内到期` })
      }
    }
  })
  
  if (store.customerFollowUps) {
    store.customerFollowUps.forEach(f => {
      if (f.followUpDate === date) {
        const customer = store.customers.find(c => c.id === f.customerId)
        events.push({ id: 'f-' + f.id, type: 'customer', title: `${customer ? customer.name : ''} 预约沟通` })
      }
    })
  }
  
  return events.slice(0, 3)
}

function prevMonth() {
  if (calendarMonth.value === 0) {
    calendarMonth.value = 11
    calendarYear.value--
  } else {
    calendarMonth.value--
  }
}

function nextMonth() {
  if (calendarMonth.value === 11) {
    calendarMonth.value = 0
    calendarYear.value++
  } else {
    calendarMonth.value++
  }
}

function navigateTo(page) {
  emit('navigate', page)
}

watch(() => store.customers, () => {}, { deep: true })
watch(() => store.sampleDeliveries, () => {}, { deep: true })
watch(() => store.salesOrders, () => {}, { deep: true })
watch(() => store.logisticsBills, () => {}, { deep: true })
watch(() => store.dailyTodos, () => {}, { deep: true })
watch(() => store.certRecords, () => {}, { deep: true })
</script>

<style scoped>
.workbench {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--card-gap-v);
}

.wb-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.greeting h1 {
  font-size: var(--font-title);
  font-weight: 600;
}

.greeting p {
  font-size: var(--font-sm);
  color: #909399;
  margin-top: 4px;
}

.wb-stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--card-gap-h);
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: var(--card-padding);
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.stat-icon.customer {
  background: #e6f7ff;
  color: #1890ff;
}

.stat-icon.sample {
  background: #f6ffed;
  color: #52c41a;
}

.stat-icon.order {
  background: #fff7e6;
  color: #fa8c16;
}

.stat-icon.finance {
  background: #fff0f6;
  color: #eb2f96;
}

.stat-icon.todo {
  background: #f5f0ff;
  color: #722ed1;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: var(--font-stat);
  font-weight: 700;
  color: #1f2937;
  line-height: 1.2;
}

.stat-value.blue {
  color: #1890ff;
}

.stat-value.danger {
  color: #f56c6c;
}

.stat-label {
  font-size: var(--font-sm);
  color: #6b7280;
  font-weight: 500;
}

.stat-warning {
  font-size: var(--font-xs);
  color: #f56c6c;
  margin-top: 2px;
  font-weight: 500;
}

.stat-arrow {
  color: #c0c4cc;
}

.stat-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #f56c6c;
  color: #fff;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-xs);
  font-weight: 600;
}

.wb-content {
  flex: 1;
  display: flex;
  gap: var(--card-gap-h);
  overflow: hidden;
}

.wb-left {
  flex: 7;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.wb-right {
  flex: 3;
  display: flex;
  flex-direction: column;
  min-width: 280px;
}

.kanban-section, .calendar-section {
  background: #fff;
  border-radius: 12px;
  padding: var(--card-padding);
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.section-header h3 {
  font-size: var(--font-title);
  font-weight: 600;
}

.calendar-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.current-month {
  font-size: var(--font-base);
  font-weight: 500;
}

.kanban-container {
  display: flex;
  gap: var(--card-gap-h);
  flex: 1;
  overflow-x: auto;
}

.kanban-column {
  flex: 1;
  background: #f5f7fa;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  min-width: 220px;
}

.column-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid #e4e7ed;
}

.column-title {
  font-weight: 600;
  font-size: var(--font-base);
}

.column-count {
  background: #409EFF;
  color: #fff;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-xs);
  flex-shrink: 0;
}

.todo-list {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
}

.todo-card {
  background: #fff;
  border-radius: 8px;
  padding: 14px;
  margin-bottom: 10px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  transition: all 0.2s;
  border-left: 4px solid transparent;
}

.todo-card:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.08);
  transform: translateY(-1px);
}

.todo-card:active {
  cursor: grabbing;
}

.todo-card.completed {
  background: #f5f7fa;
  border-left-color: #67C23A;
  opacity: 0.85;
}

.todo-card.completed:hover {
  cursor: pointer;
}

.todo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.todo-actions {
  display: flex;
  gap: 8px;
}

.todo-category {
  font-size: var(--font-xs);
  padding: 3px 8px;
  background: #e6f7ff;
  color: #1890ff;
  border-radius: 4px;
}

.todo-content {
  font-size: var(--font-base);
  color: #303133;
  margin-bottom: 10px;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  line-height: 1.6;
}

.todo-content.completed {
  text-decoration: line-through;
  color: #909399;
}

.todo-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.meta-item {
  font-size: var(--font-xs);
  color: #909399;
  background: #f5f7fa;
  padding: 3px 8px;
  border-radius: 4px;
}

.todo-deadline {
  font-size: var(--font-xs);
  color: #909399;
}

.todo-deadline.today {
  color: #f56c6c;
  font-weight: bold;
}

.todo-deadline.urgent {
  color: #e6a23c;
}

.todo-deadline.overdue {
  color: #f56c6c;
}

.calendar-grid {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.day-header {
  font-size: var(--font-xs);
  color: #909399;
  padding: 6px;
}

.calendar-body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  flex: 1;
  padding-top: 12px;
}

.day-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  cursor: pointer;
  border-radius: 6px;
}

.day-cell:hover {
  background: #f5f7fa;
}

.day-cell.other-month {
  opacity: 0.4;
}

.day-cell.today {
  background: #e6f7ff;
}

.day-number {
  font-size: var(--font-base);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.day-cell.today .day-number {
  background: #1890ff;
  color: #fff;
}

.day-events {
  display: flex;
  gap: 3px;
  margin-top: 4px;
}

.event-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.event-dot.customer {
  background: #409EFF;
}

.event-dot.sample {
  background: #52c41a;
}

.event-dot.cert-warning {
  background: #e6a23c;
}

.event-dot.cert-danger {
  background: #f56c6c;
}

.calendar-legend {
  display: flex;
  gap: var(--spacing-md);
  padding-top: var(--spacing-sm);
  border-top: 1px solid #f0f0f0;
  margin-top: auto;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-xs);
  color: #909399;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-dot.customer {
  background: #409EFF;
}

.legend-dot.sample {
  background: #52c41a;
}

.legend-dot.cert-warning {
  background: #e6a23c;
}

.legend-dot.cert-danger {
  background: #f56c6c;
}

.reminder-section {
  background: #fff;
  border-radius: 12px;
  padding: var(--card-padding);
  margin-top: var(--card-gap-v);
}

.reminder-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 200px;
  overflow-y: auto;
}

.empty-reminder {
  text-align: center;
  color: #909399;
  padding: 20px;
  font-size: var(--font-sm);
}

.reminder-card {
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%);
  border-radius: 8px;
  padding: 12px;
  border-left: 4px solid #409EFF;
}

.reminder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.reminder-title {
  font-size: var(--font-base);
  font-weight: 500;
  color: #303133;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reminder-info {
  display: flex;
  gap: 12px;
  font-size: var(--font-xs);
  color: #606266;
}

.reminder-rule {
  background: #ecf5ff;
  color: #409EFF;
  padding: 2px 8px;
  border-radius: 4px;
}

.reminder-meta {
  color: #909399;
}

.wb-actions {
  display: flex;
  gap: var(--card-gap-h);
  flex-wrap: wrap;
}

.action-btn {
  flex: 1;
  min-width: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px var(--spacing-md);
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  font-size: var(--font-base);
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  border-color: #409EFF;
  color: #409EFF;
}

.action-btn.sample:hover {
  border-color: #52c41a;
  color: #52c41a;
}

.action-btn.customer:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.action-btn.logistics:hover {
  border-color: #fa8c16;
  color: #fa8c16;
}

.action-btn.report:hover {
  border-color: #722ed1;
  color: #722ed1;
}

.action-btn.product:hover {
  border-color: #eb2f96;
  color: #eb2f96;
}

@media (max-width: 1024px) {
  .wb-stats {
    grid-template-columns: repeat(3, 1fr);
  }
  .wb-content {
    flex-direction: column;
  }
  .wb-right {
    width: 100%;
    height: 400px;
    max-width: none;
  }
  .kanban-container {
    flex-wrap: wrap;
  }
  .kanban-column {
    width: calc(50% - 8px);
  }
}

@media (max-width: 768px) {
  .wb-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .stat-card {
    padding: var(--spacing-sm);
  }
  .stat-value {
    font-size: 22px;
  }
  .stat-label {
    font-size: 12px;
  }
  .kanban-column {
    width: 100%;
  }
  .wb-actions {
    flex-wrap: wrap;
  }
  .action-btn {
    width: calc(50% - 8px);
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .wb-stats {
    grid-template-columns: 1fr;
  }
}
</style>