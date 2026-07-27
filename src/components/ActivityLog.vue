<template>
  <div class="activity-log">
    <div class="log-header">
      <h2>项目动态</h2>
      <div class="filter-bar">
        <el-select v-model="filterProject" placeholder="全部项目">
          <el-option label="全部项目" value="" />
          <el-option v-for="p in store.projects" :key="p.id" :label="p.name" :value="p.id" />
        </el-select>
        <el-select v-model="filterAction" placeholder="全部操作">
          <el-option label="全部操作" value="" />
          <el-option label="创建任务" value="创建任务" />
          <el-option label="完成任务" value="完成任务" />
          <el-option label="更新任务" value="更新任务" />
          <el-option label="删除任务" value="删除任务" />
          <el-option label="创建阶段" value="创建阶段" />
          <el-option label="更新阶段" value="更新阶段" />
          <el-option label="删除阶段" value="删除阶段" />
        </el-select>
      </div>
    </div>
    
    <div class="log-list">
      <div 
        v-for="log in filteredLogs" 
        :key="log.id" 
        class="log-item"
      >
        <div class="log-icon">
          <svg v-if="log.action.includes('创建')" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <svg v-else-if="log.action.includes('完成')" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <svg v-else-if="log.action.includes('更新')" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
            <path d="M16 21h5v-5"/>
          </svg>
          <svg v-else-if="log.action.includes('删除')" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </div>
        <div class="log-content">
          <div class="log-text">
            <span class="log-user">{{ store.user.name }}</span>
            <span class="log-action">{{ log.action }}</span>
            <span class="log-target">{{ log.target }}</span>
          </div>
          <div class="log-meta">
            <span class="log-project" :style="{ background: getProjectColor(log.projectId) }">
              {{ getProjectName(log.projectId) }}
            </span>
            <span class="log-time">{{ log.time }}</span>
          </div>
        </div>
      </div>
      
      <div v-if="filteredLogs.length === 0" class="empty-logs">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <p>暂无动态记录</p>
      </div>
    </div>
    
    <div class="log-stats">
      <h3>今日统计</h3>
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">{{ todayStats.created }}</span>
          <span class="stat-label">新创建</span>
        </div>
        <div class="stat-card completed">
          <span class="stat-value">{{ todayStats.completed }}</span>
          <span class="stat-label">已完成</span>
        </div>
        <div class="stat-card updated">
          <span class="stat-value">{{ todayStats.updated }}</span>
          <span class="stat-label">已更新</span>
        </div>
        <div class="stat-card deleted">
          <span class="stat-value">{{ todayStats.deleted }}</span>
          <span class="stat-label">已删除</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { store, getProjectById } from '../store.js'

const filterProject = ref('')
const filterAction = ref('')

const filteredLogs = computed(() => {
  let logs = store.activityLogs
  if (filterProject.value) {
    logs = logs.filter(l => l.projectId === filterProject.value)
  }
  if (filterAction.value) {
    logs = logs.filter(l => l.action === filterAction.value)
  }
  return logs
})

const todayStats = computed(() => {
  const today = new Date().toLocaleDateString('zh-CN')
  const todayLogs = store.activityLogs.filter(l => l.time.includes(today))
  return {
    created: todayLogs.filter(l => l.action.includes('创建')).length,
    completed: todayLogs.filter(l => l.action.includes('完成')).length,
    updated: todayLogs.filter(l => l.action.includes('更新')).length,
    deleted: todayLogs.filter(l => l.action.includes('删除')).length
  }
})

function getProjectName(projectId) {
  const project = getProjectById(projectId)
  return project ? project.name : '未知项目'
}

function getProjectColor(projectId) {
  const project = getProjectById(projectId)
  return project ? project.color : '#909399'
}
</script>

<style>
.activity-log {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}

.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.log-header h2 {
  font-size: 20px;
  font-weight: 600;
}

.filter-bar {
  display: flex;
  gap: 15px;
}

.filter-bar .el-select {
  width: 150px;
}

.log-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.log-item {
  display: flex;
  gap: 15px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.log-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 8px;
  color: #409EFF;
}

.log-icon svg {
  color: #409EFF;
}

.log-icon:nth-child(2) svg {
  color: #67C23A;
}

.log-content {
  flex: 1;
}

.log-text {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.log-user {
  font-weight: 500;
}

.log-action {
  color: #409EFF;
}

.log-target {
  color: #606266;
}

.log-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.log-project {
  font-size: 11px;
  padding: 2px 8px;
  color: #fff;
  border-radius: 4px;
}

.log-time {
  font-size: 12px;
  color: #909399;
}

.empty-logs {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #909399;
}

.empty-logs svg {
  margin-bottom: 15px;
}

.log-stats {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.log-stats h3 {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 15px;
}

.stats-grid {
  display: flex;
  gap: 15px;
}

.stat-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-card .stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #409EFF;
}

.stat-card.completed .stat-value {
  color: #67C23A;
}

.stat-card.updated .stat-value {
  color: #E6A23C;
}

.stat-card.deleted .stat-value {
  color: #F56C6C;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .log-header {
    flex-direction: column;
    gap: 15px;
  }
  .stats-grid {
    flex-wrap: wrap;
  }
  .stat-card {
    width: calc(50% - 7.5px);
  }
}
</style>