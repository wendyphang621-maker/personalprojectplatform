<template>
  <div class="calendar-view">
    <div class="calendar-header">
      <h2>日历</h2>
      <div class="calendar-nav">
        <button @click="prevMonth">←</button>
        <span>{{ monthYearText }}</span>
        <button @click="nextMonth">→</button>
        <button @click="goToday">今天</button>
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
              'has-task': day.taskCount > 0
            }"
            @click="selectDate(day)"
          >
            <span class="day-number">{{ day.day }}</span>
            <div v-if="day.taskCount > 0" class="task-dots">
              <span v-for="i in Math.min(day.taskCount, 3)" :key="i" class="task-dot"></span>
              <span v-if="day.taskCount > 3" class="task-more">+{{ day.taskCount - 3 }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="calendar-sidebar">
        <div class="sidebar-section">
          <h3>今日任务</h3>
          <div class="task-list">
            <div 
              v-for="task in todayTasks" 
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
            <div v-if="todayTasks.length === 0" class="empty-list">
              <p>今日暂无任务</p>
            </div>
          </div>
        </div>
        
        <div class="sidebar-section">
          <h3>{{ selectedDateText }} 的任务</h3>
          <div class="task-list">
            <div 
              v-for="task in selectedTasks" 
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
            <div v-if="selectedTasks.length === 0" class="empty-list">
              <p>该日暂无任务</p>
            </div>
          </div>
        </div>
        
        <div class="sidebar-section">
          <h3>项目分布</h3>
          <div class="project-distribution">
            <div 
              v-for="project in projectCounts" 
              :key="project.id" 
              class="distribution-item"
            >
              <span class="distribution-color" :style="{ background: project.color }"></span>
              <span class="distribution-name">{{ project.name }}</span>
              <span class="distribution-count">{{ project.count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { store, getProjectById, toggleTaskComplete } from '../store.js'

const currentDate = ref(new Date())
const selectedDate = ref(new Date().toISOString().split('T')[0])

const weekdays = ['日', '一', '二', '三', '四', '五', '六']

const monthYearText = computed(() => {
  return `${currentDate.value.getFullYear()}年${currentDate.value.getMonth() + 1}月`
})

const selectedDateText = computed(() => {
  const date = new Date(selectedDate.value)
  return `${date.getMonth() + 1}月${date.getDate()}日`
})

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
  
  return {
    day: date.getDate(),
    date: dateStr,
    isCurrentMonth,
    isToday: dateStr === today,
    taskCount
  }
}

const todayTasks = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return store.tasks.filter(t => t.startDate === today)
})

const selectedTasks = computed(() => {
  return store.tasks.filter(t => t.startDate === selectedDate.value)
})

const projectCounts = computed(() => {
  const counts = {}
  store.tasks.forEach(task => {
    if (!counts[task.projectId]) {
      counts[task.projectId] = 0
    }
    counts[task.projectId]++
  })
  
  return store.projects.map(project => ({
    ...project,
    count: counts[project.id] || 0
  })).filter(p => p.count > 0)
})

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
}

.weekday-row {
  display: flex;
  background: #f5f7fa;
  border-radius: 8px 8px 0 0;
}

.weekday-cell {
  flex: 1;
  padding: 15px;
  text-align: center;
  font-weight: 500;
  font-size: 14px;
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
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 8px;
  cursor: pointer;
  position: relative;
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
  width: 28px;
  height: 28px;
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
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.day-number {
  font-size: 14px;
}

.task-dots {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-top: 4px;
}

.task-dot {
  width: 6px;
  height: 6px;
  background: #409EFF;
  border-radius: 50%;
}

.task-more {
  font-size: 10px;
  color: #409EFF;
}

.day-cell.selected .task-dot,
.day-cell.selected .task-more {
  background: #fff;
  color: #409EFF;
}

.calendar-sidebar {
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.sidebar-section {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 15px;
}

.sidebar-section h3 {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #fff;
  border-radius: 4px;
}

.task-item.completed {
  opacity: 0.6;
}

.task-item.completed .task-name {
  text-decoration: line-through;
}

.task-name {
  flex: 1;
  font-size: 13px;
}

.task-project {
  font-size: 11px;
  padding: 2px 6px;
  color: #fff;
  border-radius: 4px;
}

.empty-list {
  padding: 20px;
  text-align: center;
  color: #909399;
}

.project-distribution {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.distribution-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: #fff;
  border-radius: 4px;
}

.distribution-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.distribution-name {
  flex: 1;
  font-size: 13px;
}

.distribution-count {
  font-size: 14px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .calendar-content {
    flex-direction: column;
  }
  .calendar-sidebar {
    width: 100%;
    height: 300px;
    overflow-y: auto;
  }
}
</style>