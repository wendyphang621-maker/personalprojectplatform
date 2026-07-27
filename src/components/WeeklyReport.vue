<template>
  <div class="weekly-report">
    <div class="report-header">
      <h2>周报汇总</h2>
      <div class="week-selector">
        <button @click="prevWeek">←</button>
        <span>{{ weekRangeText }}</span>
        <button @click="nextWeek">→</button>
        <el-button type="primary" @click="generateReport">自动生成</el-button>
      </div>
    </div>
    
    <div class="report-content">
      <div class="report-section">
        <h3>本周完成任务</h3>
        <div class="task-list">
          <div 
            v-for="task in completedTasks" 
            :key="task.id" 
            class="task-item"
          >
            <span class="task-project" :style="{ background: getProjectColor(task.projectId) }">
              {{ getProjectName(task.projectId) }}
            </span>
            <span class="task-name">{{ task.name }}</span>
            <span class="task-date">{{ task.startDate }}</span>
          </div>
          <div v-if="completedTasks.length === 0" class="empty-list">
            <p>本周暂无已完成任务</p>
          </div>
        </div>
      </div>
      
      <div class="report-section">
        <h3>进行中任务</h3>
        <div class="task-list">
          <div 
            v-for="task in inProgressTasks" 
            :key="task.id" 
            class="task-item"
          >
            <span class="task-project" :style="{ background: getProjectColor(task.projectId) }">
              {{ getProjectName(task.projectId) }}
            </span>
            <span class="task-name">{{ task.name }}</span>
            <span class="task-duration">{{ task.duration }}天</span>
          </div>
          <div v-if="inProgressTasks.length === 0" class="empty-list">
            <p>暂无进行中任务</p>
          </div>
        </div>
      </div>
      
      <div class="report-section">
        <h3>下周计划</h3>
        <div class="plan-input">
          <el-input v-model="nextWeekPlan" type="textarea" rows="6" placeholder="输入下周工作计划..." />
          <div class="plan-suggestions">
            <span>建议：</span>
            <button 
              v-for="task in suggestedTasks" 
              :key="task.id" 
              @click="addToPlan(task)"
            >
              + {{ task.name }}
            </button>
          </div>
        </div>
      </div>
      
      <div class="report-section summary">
        <h3>周报内容</h3>
        <div class="summary-content">
          <el-input v-model="reportContent" type="textarea" rows="8" />
        </div>
        <div class="report-actions">
          <el-button type="success" @click="copyReport">复制</el-button>
          <el-button @click="exportReport">导出</el-button>
        </div>
      </div>
    </div>
    
    <div class="report-chart">
      <h3>项目进度概览</h3>
      <div class="chart-container">
        <div 
          v-for="project in projectsWithStats" 
          :key="project.id" 
          class="project-bar"
        >
          <div class="bar-label">
            <span class="bar-dot" :style="{ background: project.color }"></span>
            <span>{{ project.name }}</span>
          </div>
          <div class="bar-track">
            <div 
              class="bar-fill" 
              :style="{ width: project.progress + '%', background: project.color }"
            ></div>
          </div>
          <div class="bar-percent">{{ project.progress }}%</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { store, getProjectById, getTasksByProjectId } from '../store.js'

const currentWeekStart = ref(getWeekStart(new Date()))
const nextWeekPlan = ref('')
const reportContent = ref('')

function getWeekStart(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff)).toISOString().split('T')[0]
}

const weekRangeText = computed(() => {
  const start = new Date(currentWeekStart.value)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return `${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日`
})

const completedTasks = computed(() => {
  const start = new Date(currentWeekStart.value)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return store.tasks.filter(t => {
    const taskDate = new Date(t.startDate)
    return t.completed && taskDate >= start && taskDate <= end
  })
})

const inProgressTasks = computed(() => {
  return store.tasks.filter(t => !t.completed)
})

const suggestedTasks = computed(() => {
  return inProgressTasks.value.slice(0, 5)
})

const projectsWithStats = computed(() => {
  return store.projects.map(project => {
    const tasks = getTasksByProjectId(project.id)
    const completed = tasks.filter(t => t.completed).length
    const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
    return { ...project, progress, completed, total: tasks.length }
  })
})

function prevWeek() {
  const date = new Date(currentWeekStart.value)
  date.setDate(date.getDate() - 7)
  currentWeekStart.value = date.toISOString().split('T')[0]
}

function nextWeek() {
  const date = new Date(currentWeekStart.value)
  date.setDate(date.getDate() + 7)
  currentWeekStart.value = date.toISOString().split('T')[0]
}

function getProjectName(projectId) {
  const project = getProjectById(projectId)
  return project ? project.name : '未知项目'
}

function getProjectColor(projectId) {
  const project = getProjectById(projectId)
  return project ? project.color : '#909399'
}

function addToPlan(task) {
  if (nextWeekPlan.value) {
    nextWeekPlan.value += '\n'
  }
  nextWeekPlan.value += `- ${task.name}`
}

function generateReport() {
  const start = new Date(currentWeekStart.value)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  
  let content = `【周报】${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日\n\n`
  content += `一、本周完成（${completedTasks.value.length}项）\n`
  completedTasks.value.forEach((task, index) => {
    content += `${index + 1}. ${getProjectName(task.projectId)} - ${task.name}\n`
  })
  
  content += `\n二、进行中（${inProgressTasks.value.length}项）\n`
  inProgressTasks.value.forEach((task, index) => {
    content += `${index + 1}. ${getProjectName(task.projectId)} - ${task.name}\n`
  })
  
  content += `\n三、下周计划\n`
  if (nextWeekPlan.value) {
    content += nextWeekPlan.value
  } else {
    content += '待规划'
  }
  
  reportContent.value = content
}

function copyReport() {
  navigator.clipboard.writeText(reportContent.value).then(() => {
    alert('已复制到剪贴板')
  })
}

function exportReport() {
  const blob = new Blob([reportContent.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `周报_${currentWeekStart.value}.txt`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style>
.weekly-report {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}

.report-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.report-header h2 {
  font-size: 20px;
  font-weight: 600;
}

.week-selector {
  display: flex;
  align-items: center;
  gap: 15px;
}

.week-selector button {
  width: 32px;
  height: 32px;
  border: 1px solid #dcdfe6;
  background: #fff;
  cursor: pointer;
  border-radius: 4px;
}

.week-selector button:hover {
  background: #f5f7fa;
}

.report-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  overflow: hidden;
}

.report-section {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 15px;
  overflow-y: auto;
}

.report-section h3 {
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

.task-project {
  font-size: 11px;
  padding: 2px 8px;
  color: #fff;
  border-radius: 4px;
}

.task-name {
  flex: 1;
  font-size: 13px;
}

.task-date, .task-duration {
  font-size: 12px;
  color: #909399;
}

.empty-list {
  padding: 20px;
  text-align: center;
  color: #909399;
}

.plan-input {
  display: flex;
  flex-direction: column;
}

.plan-suggestions {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: #909399;
}

.plan-suggestions button {
  border: 1px solid #dcdfe6;
  background: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.plan-suggestions button:hover {
  background: #409EFF;
  color: #fff;
  border-color: #409EFF;
}

.summary {
  grid-column: span 2;
}

.summary-content {
  margin-bottom: 15px;
}

.report-actions {
  display: flex;
  gap: 10px;
}

.report-chart {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.report-chart h3 {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 15px;
}

.chart-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.project-bar {
  display: flex;
  align-items: center;
  gap: 15px;
}

.bar-label {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 180px;
  flex-shrink: 0;
  font-size: 13px;
}

.bar-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.bar-track {
  flex: 1;
  height: 20px;
  background: #e4e7ed;
  border-radius: 10px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s;
}

.bar-percent {
  width: 50px;
  text-align: right;
  font-size: 13px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .report-content {
    grid-template-columns: 1fr;
  }
  .summary {
    grid-column: span 1;
  }
}
</style>