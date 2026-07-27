<template>
  <div class="milestone-view">
    <div class="view-header">
      <h2>里程碑管理</h2>
      <div class="header-actions">
        <el-select v-model="projectFilter" placeholder="选择项目" size="small">
          <el-option label="全部项目" value="" />
          <el-option v-for="project in store.projects" :key="project.id" :label="project.name" :value="project.id" />
        </el-select>
      </div>
    </div>
    
    <div class="milestone-content">
      <div v-if="milestones.length > 0" class="milestone-list">
        <div 
          v-for="milestone in milestones" 
          :key="milestone.id"
          class="milestone-card"
          :class="{ completed: milestone.completed, overdue: isOverdue(milestone) }"
        >
          <div class="milestone-header">
            <div class="milestone-icon">
              <svg v-if="milestone.completed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
                <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>
              </svg>
            </div>
            <div class="milestone-info">
              <h3>{{ milestone.name }}</h3>
              <span class="milestone-project">{{ getProjectName(milestone.projectId) }}</span>
            </div>
            <div class="milestone-status">
              <span v-if="milestone.completed" class="status-badge completed">已完成</span>
              <span v-else-if="isOverdue(milestone)" class="status-badge overdue">已逾期</span>
              <span v-else class="status-badge pending">进行中</span>
            </div>
          </div>
          
          <div class="milestone-details">
            <div class="detail-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span>{{ milestone.startDate }}</span>
            </div>
            <div class="detail-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>预计 {{ getEndDate(milestone) }}</span>
            </div>
            <div v-if="milestone.customerName" class="detail-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span>{{ milestone.customerName }}</span>
            </div>
            <div v-if="milestone.model" class="detail-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="9" y1="9" x2="15" y2="9"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
              <span>{{ milestone.model }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-milestones">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64">
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>
        </svg>
        <p>暂无里程碑</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { store } from '../store.js'

const projectFilter = ref('')

const milestones = computed(() => {
  let tasks = store.tasks.filter(t => t.milestone)
  
  if (projectFilter.value) {
    tasks = tasks.filter(t => t.projectId === projectFilter.value)
  }
  
  return tasks.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    return new Date(a.startDate) - new Date(b.startDate)
  })
})

function getProjectName(projectId) {
  const project = store.projects.find(p => p.id === projectId)
  return project ? project.name : ''
}

function getEndDate(milestone) {
  const start = new Date(milestone.startDate)
  const end = new Date(start)
  end.setDate(end.getDate() + parseInt(milestone.duration))
  return end.toISOString().split('T')[0]
}

function isOverdue(milestone) {
  if (milestone.completed) return false
  const end = new Date(milestone.startDate)
  end.setDate(end.getDate() + parseInt(milestone.duration))
  return end < new Date()
}
</script>

<style>
.milestone-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  border-bottom: 1px solid #e4e7ed;
}

.view-header h2 {
  font-size: 18px;
  font-weight: 600;
}

.milestone-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.milestone-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.milestone-card {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 15px;
  transition: all 0.2s;
}

.milestone-card:hover {
  border-color: #409EFF;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.milestone-card.completed {
  opacity: 0.7;
  border-color: #67C23A;
  background: rgba(103, 194, 58, 0.05);
}

.milestone-card.overdue {
  border-color: #F56C6C;
  background: rgba(245, 108, 108, 0.05);
}

.milestone-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.milestone-icon {
  color: #E6A23C;
}

.milestone-card.completed .milestone-icon {
  color: #67C23A;
}

.milestone-card.overdue .milestone-icon {
  color: #F56C6C;
}

.milestone-info h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.milestone-project {
  font-size: 13px;
  color: #909399;
}

.status-badge {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 20px;
}

.status-badge.completed {
  background: #F0F9EB;
  color: #67C23A;
}

.status-badge.pending {
  background: #ECF5FF;
  color: #409EFF;
}

.status-badge.overdue {
  background: #FEF0F0;
  color: #F56C6C;
}

.milestone-details {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
}

.detail-item svg {
  color: #909399;
}

.empty-milestones {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

.empty-milestones svg {
  margin-bottom: 20px;
}
</style>
