<template>
  <div class="calendar-view">
    <div class="calendar-header">
      <h2>业务日历</h2>
      <div class="calendar-nav">
        <button @click="prevMonth">←</button>
        <span class="month-text">{{ monthYearText }}</span>
        <button @click="nextMonth">→</button>
        <button @click="goToday">今天</button>
        <el-select v-model="holidayCountry" placeholder="节假日地区" clearable size="default" style="width: 140px; margin-left: 10px;">
          <el-option label="中国" value="CN" />
          <el-option label="德国" value="DE" />
          <el-option label="美国" value="US" />
          <el-option label="沙特阿拉伯" value="SA" />
          <el-option label="阿联酋" value="AE" />
          <el-option label="英国" value="GB" />
          <el-option label="法国" value="FR" />
          <el-option label="日本" value="JP" />
          <el-option label="德国+法国" value="DE_FR" />
        </el-select>
      </div>
    </div>
    
    <div class="calendar-content">
      <div class="calendar-grid">
        <div class="weekday-row">
          <div v-for="day in weekdays" :key="day" class="weekday-cell">{{ day }}</div>
        </div>
        <div v-for="(week, weekIndex) in calendarWeeks" :key="weekIndex" class="week-row">
          <div 
            v-for="(day, dayIndex) in week" 
            :key="dayIndex"
            class="day-cell"
            :class="{ 
              'other-month': !day.isCurrentMonth,
              'today': day.isToday,
              'selected': day.date === selectedDate,
              'has-task': day.taskCount > 0 || day.reminderCount > 0,
              'has-holiday': day.holidays.length > 0
            }"
            @click="selectDate(day)"
          >
            <span class="day-number">{{ day.day }}</span>
            <div v-if="day.holidays.length > 0" class="holiday-badge" :class="day.holidayClass">
              {{ day.holidays[0].name }}
            </div>
            <div class="indicator-row">
              <span v-if="day.taskCount > 0" class="indicator project-indicator" :title="`项目任务: ${day.taskCount}`">{{ day.taskCount }}</span>
              <span v-if="day.reminderCount > 0" class="indicator reminder-indicator" :title="`待办提醒: ${day.reminderCount}`">待{{ day.reminderCount }}</span>
            </div>
            <div v-if="day.holidays.length > 1" class="holiday-more">+{{ day.holidays.length - 1 }}</div>
          </div>
        </div>
      </div>
      
      <div class="calendar-sidebar">
        <div class="sidebar-section">
          <h3>📅 {{ selectedDateText }}</h3>
          
          <div v-if="selectedDateHolidays.length > 0" class="holiday-section">
            <div class="section-label">节假日</div>
            <div v-for="h in selectedDateHolidays" :key="h.name + h.country" class="holiday-item" :class="`holiday-${h.type}`">
              <span class="holiday-icon">🎉</span>
              <span class="holiday-name">{{ h.name }}</span>
              <span class="holiday-country">{{ getCountryName(h.country) }}</span>
            </div>
          </div>
          
          <div v-if="selectedDateReminders.length > 0" class="reminder-section">
            <div class="section-label">⏰ 待办提醒</div>
            <div 
              v-for="r in selectedDateReminders" 
              :key="r.id" 
              class="reminder-item"
              :class="{ completed: r.status === 'completed' }"
            >
              <span class="reminder-time">{{ r.remindTime }}</span>
              <span class="reminder-title">{{ r.title }}</span>
              <el-tag size="small" :type="r.status === 'completed' ? 'success' : 'warning'">
                {{ r.status === 'completed' ? '已完成' : '待办' }}
              </el-tag>
            </div>
          </div>
          
          <div v-if="selectedDateTasks.length > 0" class="task-section">
            <div class="section-label">📋 项目任务</div>
            <div 
              v-for="task in selectedDateTasks" 
              :key="task.id" 
              class="task-item"
              :class="{ completed: task.completed }"
            >
              <input type="checkbox" v-model="task.completed" @change="toggleTask(task.id)" />
              <span class="task-name">{{ task.name }}</span>
              <span class="task-project" :style="{ background: getProjectColor(task.projectId) }">
                {{ getProjectName(task.projectId) }}
              </span>
            </div>
          </div>
          
          <div v-if="selectedDateHolidays.length === 0 && selectedDateReminders.length === 0 && selectedDateTasks.length === 0" class="empty-list">
            <p>该日暂无安排</p>
          </div>
        </div>
        
        <div class="sidebar-section">
          <h3>📊 本月概览</h3>
          <div class="month-stats">
            <div class="stat-item">
              <span class="stat-value">{{ monthStats.tasks }}</span>
              <span class="stat-label">项目任务</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ monthStats.reminders }}</span>
              <span class="stat-label">待办提醒</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ monthStats.holidays }}</span>
              <span class="stat-label">节假日</span>
            </div>
          </div>
        </div>
        
        <div class="sidebar-section">
          <h3>📌 图例说明</h3>
          <div class="legend">
            <div class="legend-item">
              <span class="legend-color legend-task"></span>
              <span>项目任务（数字）</span>
            </div>
            <div class="legend-item">
              <span class="legend-color legend-reminder"></span>
              <span>待办提醒</span>
            </div>
            <div class="legend-item">
              <span class="legend-color legend-holiday-cn"></span>
              <span>中国节假日</span>
            </div>
            <div class="legend-item">
              <span class="legend-color legend-holiday-religious"></span>
              <span>宗教节日</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { store, getProjectById, toggleTaskComplete } from '../store.js'

const currentDate = ref(new Date())
const selectedDate = ref(new Date().toISOString().split('T')[0])
const holidayCountry = ref('CN')

const weekdays = ['日', '一', '二', '三', '四', '五', '六']

const HOLIDAY_DATA = {
  CN: [
    { month: 1, day: 1, name: '元旦', type: 'national' },
    { month: 2, day: 10, name: '春节', type: 'national', duration: '3天' },
    { month: 2, day: 11, name: '农历新年', type: 'national' },
    { month: 4, day: 4, name: '清明节', type: 'national' },
    { month: 5, day: 1, name: '劳动节', type: 'national' },
    { month: 5, day: 4, name: '青年节', type: 'observance' },
    { month: 6, day: 1, name: '儿童节', type: 'observance' },
    { month: 6, day: 19, name: '端午节', type: 'national' },
    { month: 9, day: 15, name: '中秋节', type: 'national' },
    { month: 10, day: 1, name: '国庆节', type: 'national', duration: '7天' },
    { month: 10, day: 2, name: '国庆假期', type: 'national' },
    { month: 10, day: 3, name: '国庆假期', type: 'national' },
    { month: 10, day: 4, name: '国庆假期', type: 'national' },
    { month: 10, day: 5, name: '国庆假期', type: 'national' },
    { month: 10, day: 6, name: '国庆假期', type: 'national' },
    { month: 10, day: 7, name: '国庆假期', type: 'national' },
  ],
  DE: [
    { month: 1, day: 1, name: '元旦', type: 'national' },
    { month: 4, day: 7, name: 'Good Friday', type: 'religious' },
    { month: 4, day: 10, name: 'Easter Monday', type: 'religious' },
    { month: 5, day: 1, name: 'Labour Day', type: 'national' },
    { month: 5, day: 18, name: 'Ascension Day', type: 'religious' },
    { month: 5, day: 29, name: 'Whit Monday', type: 'religious' },
    { month: 10, day: 3, name: 'German Unity Day', type: 'national' },
    { month: 12, day: 25, name: 'Christmas', type: 'religious' },
    { month: 12, day: 26, name: 'St. Stephen\'s Day', type: 'religious' },
  ],
  US: [
    { month: 1, day: 1, name: 'New Year\'s Day', type: 'national' },
    { month: 1, day: 20, name: 'MLK Day', type: 'national' },
    { month: 2, day: 17, name: 'Presidents\' Day', type: 'national' },
    { month: 5, day: 31, name: 'Memorial Day', type: 'national' },
    { month: 6, day: 19, name: 'Juneteenth', type: 'national' },
    { month: 7, day: 4, name: 'Independence Day', type: 'national' },
    { month: 9, day: 4, name: 'Labor Day', type: 'national' },
    { month: 11, day: 27, name: 'Thanksgiving', type: 'national' },
    { month: 12, day: 25, name: 'Christmas', type: 'religious' },
  ],
  SA: [
    { month: 2, day: 22, name: 'Founding Day', type: 'national' },
    { month: 4, day: 10, name: 'Eid al-Fitr', type: 'religious', duration: '4天' },
    { month: 4, day: 11, name: 'Eid al-Fitr', type: 'religious' },
    { month: 4, day: 12, name: 'Eid al-Fitr', type: 'religious' },
    { month: 4, day: 13, name: 'Eid al-Fitr', type: 'religious' },
    { month: 6, day: 7, name: 'Eid al-Adha', type: 'religious', duration: '3天' },
    { month: 6, day: 8, name: 'Eid al-Adha', type: 'religious' },
    { month: 6, day: 9, name: 'Eid al-Adha', type: 'religious' },
    { month: 9, day: 23, name: 'National Day', type: 'national' },
  ],
  AE: [
    { month: 1, day: 1, name: 'New Year\'s Day', type: 'national' },
    { month: 4, day: 10, name: 'Eid al-Fitr', type: 'religious', duration: '4天' },
    { month: 4, day: 11, name: 'Eid al-Fitr', type: 'religious' },
    { month: 4, day: 12, name: 'Eid al-Fitr', type: 'religious' },
    { month: 4, day: 13, name: 'Eid al-Fitr', type: 'religious' },
    { month: 6, day: 7, name: 'Eid al-Adha', type: 'religious', duration: '3天' },
    { month: 6, day: 8, name: 'Eid al-Adha', type: 'religious' },
    { month: 6, day: 9, name: 'Eid al-Adha', type: 'religious' },
    { month: 12, day: 2, name: 'National Day', type: 'national' },
  ],
  GB: [
    { month: 1, day: 1, name: 'New Year\'s Day', type: 'national' },
    { month: 4, day: 7, name: 'Good Friday', type: 'religious' },
    { month: 4, day: 10, name: 'Easter Monday', type: 'religious' },
    { month: 5, day: 1, name: 'Early May Bank Holiday', type: 'national' },
    { month: 5, day: 29, name: 'Spring Bank Holiday', type: 'national' },
    { month: 8, day: 28, name: 'Summer Bank Holiday', type: 'national' },
    { month: 12, day: 25, name: 'Christmas', type: 'religious' },
    { month: 12, day: 26, name: 'Boxing Day', type: 'religious' },
  ],
  FR: [
    { month: 1, day: 1, name: 'New Year\'s Day', type: 'national' },
    { month: 4, day: 7, name: 'Good Friday', type: 'religious' },
    { month: 4, day: 10, name: 'Easter Monday', type: 'religious' },
    { month: 5, day: 1, name: 'Labour Day', type: 'national' },
    { month: 5, day: 8, name: 'Victory Day', type: 'national' },
    { month: 5, day: 29, name: 'Whit Monday', type: 'religious' },
    { month: 7, day: 14, name: 'Bastille Day', type: 'national' },
    { month: 8, day: 15, name: 'Assumption Day', type: 'religious' },
    { month: 11, day: 1, name: 'All Saints\' Day', type: 'religious' },
    { month: 11, day: 11, name: 'Armistice Day', type: 'national' },
    { month: 12, day: 25, name: 'Christmas', type: 'religious' },
  ],
  JP: [
    { month: 1, day: 1, name: 'New Year', type: 'national' },
    { month: 1, day: 12, name: 'Coming of Age Day', type: 'national' },
    { month: 2, day: 11, name: 'National Foundation Day', type: 'national' },
    { month: 2, day: 23, name: 'Emperor\'s Birthday', type: 'national' },
    { month: 3, day: 20, name: 'Vernal Equinox Day', type: 'national' },
    { month: 4, day: 29, name: 'Showa Day', type: 'national' },
    { month: 5, day: 3, name: 'Constitution Memorial Day', type: 'national' },
    { month: 5, day: 4, name: 'Greenery Day', type: 'national' },
    { month: 5, day: 5, name: 'Children\'s Day', type: 'national' },
    { month: 7, day: 15, name: 'Marine Day', type: 'national' },
    { month: 8, day: 11, name: 'Mountain Day', type: 'national' },
    { month: 9, day: 16, name: 'Respect for the Aged Day', type: 'national' },
    { month: 9, day: 23, name: 'Autumnal Equinox Day', type: 'national' },
    { month: 10, day: 14, name: 'Sports Day', type: 'national' },
    { month: 11, day: 3, name: 'Culture Day', type: 'national' },
    { month: 11, day: 23, name: 'Labour Thanksgiving Day', type: 'national' },
  ]
}

const COUNTRY_NAMES = {
  CN: '中国',
  DE: '德国',
  US: '美国',
  SA: '沙特阿拉伯',
  AE: '阿联酋',
  GB: '英国',
  FR: '法国',
  JP: '日本',
  DE_FR: '德国+法国'
}

const HOLIDAY_TYPE_CLASS = {
  national: 'holiday-national',
  religious: 'holiday-religious',
  observance: 'holiday-observance'
}

const monthYearText = computed(() => {
  return `${currentDate.value.getFullYear()}年${currentDate.value.getMonth() + 1}月`
})

const selectedDateText = computed(() => {
  const date = new Date(selectedDate.value)
  return `${date.getMonth() + 1}月${date.getDate()}日`
})

function getHolidaysForDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const results = []
  const countries = holidayCountry.value === 'DE_FR' ? ['DE', 'FR'] : [holidayCountry.value]
  
  countries.forEach(country => {
    const holidays = HOLIDAY_DATA[country] || []
    holidays.forEach(h => {
      if (h.month === month && h.day === day) {
        results.push({ ...h, country })
      }
    })
  })
  
  return results
}

const calendarWeeks = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  const weeks = []
  let currentWeek = []
  
  const startPadding = firstDay.getDay()
  for (let i = 0; i < startPadding; i++) {
    const date = new Date(year, month, -startPadding + 1 + i)
    currentWeek.push(createDay(date, false))
  }
  
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day)
    currentWeek.push(createDay(date, true))
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }
  
  while (currentWeek.length < 7) {
    const nextMonthDay = currentWeek.length - startPadding + lastDay.getDate() + 1
    const date = new Date(year, month + 1, nextMonthDay)
    currentWeek.push(createDay(date, false))
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }
  
  return weeks
})

function createDay(date, isCurrentMonth) {
  const dateStr = date.toISOString().split('T')[0]
  const today = new Date().toISOString().split('T')[0]
  const taskCount = store.tasks.filter(t => t.startDate === dateStr).length
  const reminderCount = store.dailyReminders.filter(r => {
    if (r.status === 'completed') return false
    return shouldRemindOnDate(r, dateStr)
  }).length
  const holidays = getHolidaysForDate(dateStr)
  const holidayClass = holidays.length > 0 ? HOLIDAY_TYPE_CLASS[holidays[0].type] : ''
  
  return {
    day: date.getDate(),
    date: dateStr,
    isCurrentMonth,
    isToday: dateStr === today,
    taskCount,
    reminderCount,
    holidays,
    holidayClass
  }
}

function shouldRemindOnDate(reminder, dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const dayOfWeek = date.getDay()
  const todayStr = new Date().toISOString().split('T')[0]
  
  if (dateStr < todayStr) return false
  
  switch (reminder.repeatRule) {
    case 'once':
      return dateStr === todayStr
    case 'daily':
      return true
    case 'workday':
      return dayOfWeek >= 1 && dayOfWeek <= 5
    default:
      return false
  }
}

const selectedDateHolidays = computed(() => {
  return getHolidaysForDate(selectedDate.value)
})

const selectedDateReminders = computed(() => {
  return store.dailyReminders.filter(r => shouldRemindOnDate(r, selectedDate.value))
})

const selectedDateTasks = computed(() => {
  return store.tasks.filter(t => t.startDate === selectedDate.value)
})

const monthStats = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
  
  let tasks = 0, reminders = 0, holidays = 0
  
  store.tasks.forEach(t => {
    if (t.startDate && t.startDate.startsWith(prefix)) tasks++
  })
  
  store.dailyReminders.forEach(r => {
    if (r.status === 'completed') return
    for (let day = 1; day <= 31; day++) {
      const dateStr = `${prefix}-${String(day).padStart(2, '0')}`
      if (shouldRemindOnDate(r, dateStr)) reminders++
    }
  })
  
  for (let day = 1; day <= 31; day++) {
    const dateStr = `${prefix}-${String(day).padStart(2, '0')}`
    holidays += getHolidaysForDate(dateStr).length
  }
  
  return { tasks, reminders, holidays }
})

function getCountryName(code) {
  return COUNTRY_NAMES[code] || code
}

function prevMonth() {
  const date = new Date(currentDate.value)
  date.setMonth(date.getMonth() - 1)
  currentDate.value = date
}

function nextMonth() {
  const date = new Date(currentDate.value)
  date.setMonth(date.getMonth() + 1)
  currentDate.value = date
}

function goToday() {
  currentDate.value = new Date()
  selectedDate.value = new Date().toISOString().split('T')[0]
}

function selectDate(day) {
  selectedDate.value = day.date
}

function getProjectName(projectId) {
  const project = getProjectById(projectId)
  return project ? project.name : '未知项目'
}

function getProjectColor(projectId) {
  const project = getProjectById(projectId)
  return project ? project.color : '#909399'
}

function toggleTask(taskId) {
  toggleTaskComplete(taskId)
}

watch(holidayCountry, () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), 1)
})
</script>

<style>
.calendar-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.calendar-header h2 {
  font-size: 20px;
  font-weight: 600;
}

.calendar-nav {
  display: flex;
  align-items: center;
  gap: 15px;
}

.calendar-nav button {
  width: 32px;
  height: 32px;
  border: 1px solid #dcdfe6;
  background: #fff;
  cursor: pointer;
  border-radius: 4px;
}

.calendar-nav button:hover {
  background: #f5f7fa;
}

.month-text {
  font-weight: 500;
  min-width: 100px;
  text-align: center;
}

.calendar-content {
  flex: 1;
  display: flex;
  gap: 20px;
  overflow: hidden;
}

.calendar-grid {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.weekday-row {
  display: flex;
  background: #f5f7fa;
  border-radius: 8px 8px 0 0;
  position: sticky;
  top: 0;
  z-index: 1;
}

.weekday-cell {
  flex: 1;
  padding: 10px;
  text-align: center;
  font-weight: 500;
  font-size: 13px;
}

.week-row {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
}

.week-row:last-child {
  border-bottom: none;
}

.day-cell {
  flex: 1;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 6px 8px;
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
}

.day-cell:hover {
  background: #f5f7fa;
}

.day-cell.other-month {
  color: #c0c4cc;
}

.day-cell.today {
  background: rgba(64, 158, 255, 0.1);
}

.day-cell.today .day-number {
  background: #409EFF;
  color: #fff;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.day-cell.selected {
  background: #409EFF;
  color: #fff;
}

.day-cell.selected .day-number {
  background: #fff;
  color: #409EFF;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.day-number {
  font-size: 14px;
  font-weight: 500;
}

.holiday-badge {
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 3px;
  margin-top: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  line-height: 1.3;
}

.holiday-national {
  background: #fef0f0;
  color: #f56c6c;
}

.holiday-religious {
  background: #fdf6ec;
  color: #e6a23c;
}

.holiday-observance {
  background: #ecf5ff;
  color: #409eff;
}

.day-cell.selected .holiday-badge {
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
}

.indicator-row {
  display: flex;
  gap: 3px;
  margin-top: 2px;
  flex-wrap: wrap;
}

.indicator {
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 2px;
  line-height: 1.3;
}

.project-indicator {
  background: #409eff;
  color: #fff;
}

.reminder-indicator {
  background: #e6a23c;
  color: #fff;
}

.day-cell.selected .project-indicator,
.day-cell.selected .reminder-indicator {
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
}

.holiday-more {
  font-size: 10px;
  color: #909399;
}

.calendar-sidebar {
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  overflow-y: auto;
}

.sidebar-section {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 15px;
}

.sidebar-section h3 {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.section-label {
  font-size: 12px;
  color: #909399;
  margin: 8px 0 6px;
}

.section-label:first-child {
  margin-top: 0;
}

.holiday-section,
.reminder-section,
.task-section {
  margin-bottom: 12px;
}

.holiday-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: #fff;
  border-radius: 4px;
  font-size: 13px;
}

.holiday-item.holiday-national {
  border-left: 3px solid #f56c6c;
}

.holiday-item.holiday-religious {
  border-left: 3px solid #e6a23c;
}

.holiday-item.holiday-observance {
  border-left: 3px solid #409eff;
}

.holiday-icon {
  font-size: 14px;
}

.holiday-name {
  flex: 1;
}

.holiday-country {
  font-size: 11px;
  color: #909399;
}

.reminder-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: #fff;
  border-radius: 4px;
  font-size: 13px;
  border-left: 3px solid #e6a23c;
  margin-bottom: 4px;
}

.reminder-item.completed {
  opacity: 0.6;
  text-decoration: line-through;
}

.reminder-time {
  font-weight: 500;
  color: #e6a23c;
  min-width: 40px;
}

.reminder-title {
  flex: 1;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: #fff;
  border-radius: 4px;
  font-size: 13px;
}

.task-item.completed {
  opacity: 0.6;
}

.task-item.completed .task-name {
  text-decoration: line-through;
}

.task-name {
  flex: 1;
}

.task-project {
  font-size: 11px;
  padding: 2px 6px;
  color: #fff;
  border-radius: 4px;
}

.empty-list {
  padding: 15px;
  text-align: center;
  color: #909399;
  font-size: 13px;
}

.month-stats {
  display: flex;
  justify-content: space-around;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #606266;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.legend-task {
  background: #409eff;
}

.legend-reminder {
  background: #e6a23c;
}

.legend-holiday-cn {
  background: #f56c6c;
}

.legend-holiday-religious {
  background: #e6a23c;
}

@media (max-width: 768px) {
  .calendar-content {
    flex-direction: column;
  }
  .calendar-sidebar {
    width: 100%;
    max-height: 300px;
  }
  .day-cell {
    min-height: 60px;
    padding: 4px;
  }
}
</style>
