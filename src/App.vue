<template>
  <div v-if="!isLoggedIn" class="login-wrapper">
    <LoginPage @login-success="handleLoginSuccess" />
  </div>
  
  <div v-else class="app-container">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="9" y1="9" x2="15" y2="9"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          <span>项目工作台</span>
        </div>
      </div>
      <nav class="nav-menu">
        <div 
          v-for="item in fixedNavItems" 
          :key="item.key"
          class="nav-item"
          :class="{ active: currentPage === item.key }"
          @click="handleNavClick(item.key)"
        >
          <component :is="item.icon" />
          <span>{{ item.label }}</span>
        </div>
        
        <div class="nav-divider"></div>
        
        <div class="nav-group">
          <div 
            class="nav-group-header"
            @click="expandedGroups['settings'] = !expandedGroups['settings']"
          >
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              stroke-width="2" 
              width="16" 
              height="16"
              class="group-icon"
              :class="{ rotated: expandedGroups['settings'] }"
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
            <span>设置</span>
          </div>
          <div v-if="expandedGroups['settings']" class="nav-group-items">
            <div 
              v-for="item in visibleSettingsNavItems" 
              :key="item.subKey"
              class="nav-item sub-item"
              :class="{ active: currentPage === item.key && currentSubPage === item.subKey }"
              @click="handleSettingsNavClick(item.key, item.subKey)"
            >
              <component :is="item.icon" />
              <span>{{ item.label }}</span>
            </div>
          </div>
        </div>
        
        <div class="nav-divider"></div>
        
        <div class="nav-group">
          <div 
            class="nav-group-header"
            @click="expandedGroups['development'] = !expandedGroups['development']"
          >
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              stroke-width="2" 
              width="16" 
              height="16"
              class="group-icon"
              :class="{ rotated: expandedGroups['development'] }"
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
            <span>研发项目归档</span>
          </div>
          <div v-if="expandedGroups['development']" class="nav-group-items">
            <div 
              v-for="item in developmentNavItems" 
              :key="item.key"
              class="nav-item sub-item"
              :class="{ active: currentPage === item.key }"
              @click="handleNavClick(item.key)"
            >
              <component :is="item.icon" />
              <span>{{ item.label }}</span>
            </div>
          </div>
        </div>
        
        <div class="nav-divider"></div>
        
        <div v-for="group in salesNavGroups" :key="group.key" class="nav-group">
          <div 
            class="nav-group-header"
            @click="handleGroupClick(group)"
          >
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              stroke-width="2" 
              width="16" 
              height="16"
              class="group-icon"
              :class="{ rotated: expandedGroups[group.key] }"
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
            <span>{{ group.label }}</span>
          </div>
          <div v-if="expandedGroups[group.key]" class="nav-group-items">
            <div 
              v-for="item in group.children" 
              :key="item.key"
              class="nav-item sub-item"
              :class="{ active: currentPage === item.key && currentSubPage === item.subKey }"
              @click="handleSalesNavClick(group.key, item.key, item.subKey)"
            >
              <component :is="item.icon" />
              <span>{{ item.label }}</span>
            </div>
          </div>
        </div>
      </nav>
      <div class="sidebar-footer">
        <div class="user-info">
          <div class="avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div class="user-detail">
            <span class="user-name">{{ store.user.name }}</span>
            <span class="user-role">{{ store.user.position }}</span>
          </div>
        </div>
        <div class="local-mode-section">
          <div class="local-mode-switch">
            <span class="mode-label">{{ store.localMode ? '本地' : '云端' }}</span>
            <el-switch 
              :model-value="store.localMode" 
              active-text="" 
              inactive-text="" 
              @change="handleLocalModeChange" 
            />
            <span class="mode-label">{{ store.localMode ? '模式' : '模式' }}</span>
          </div>
          <div class="sync-buttons">
            <el-button 
              size="small" 
              :disabled="store.localMode" 
              @click="openSyncDialog('pull')"
              title="从云端拉取到本地"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              拉取
            </el-button>
            <el-button 
              size="small" 
              :disabled="!store.localMode" 
              @click="openSyncDialog('push')"
              title="从本地推送到云端"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              推送
            </el-button>
            <el-button 
              size="small" 
              @click="openBackupDialog"
              title="导出/导入数据文件（Excel/CSV）"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <ellipse cx="12" cy="5" rx="9" ry="3"/>
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
              </svg>
              备份
            </el-button>
          </div>
        </div>
        <div class="logout-btn" @click="handleLogout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>退出登录</span>
        </div>
      </div>
    </aside>
    
    <main class="main-content">
      <!-- 本地模式警告条 -->
      <div v-if="store.localMode" class="local-mode-warning">
        <div class="warning-content">
          <span class="warning-icon">⚠️</span>
          <span class="warning-text">当前处于【本地离线模式】，数据仅保存在浏览器，不会自动同步云端</span>
          <el-button type="warning" size="small" @click="openSupabaseConfig">前往设置修复</el-button>
          <el-button size="small" @click="syncLocalNow">一键同步云端</el-button>
        </div>
      </div>
      <header class="top-toolbar" v-if="isProjectPage">
        <div class="toolbar-left">
          <el-button type="primary" @click="showNewProjectDialog = true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            新建项目
          </el-button>
          <el-button @click="saveData">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            保存
          </el-button>
          <el-button @click="showImportDialog = true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            导入任务
          </el-button>
          <el-button @click="exportTemplate">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            导出模板
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-select v-model="viewMode" class="view-select">
            <el-option label="甘特图" value="gantt" />
            <el-option label="表格" value="table" />
            <el-option label="日视图" value="day" />
            <el-option label="周视图" value="week" />
            <el-option label="月视图" value="month" />
          </el-select>
          <el-button @click="showAIDialog = true" type="success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            AI智能拆解
          </el-button>
        </div>
      </header>
      
      <div class="customer-tab-bar" v-if="showTabBar">
        <el-tabs v-model="activeTopTab" type="card" @tab-change="handleTopTabChange">
          <el-tab-pane 
            v-for="tab in topTabs" 
            :key="tab.name" 
            :label="tab.label" 
            :name="tab.name"
          />
        </el-tabs>
      </div>
      
      <div class="page-content">
        <Workbench v-if="currentPage === 'workbench'" @navigate="handleNavClick" />
        <CalendarView v-else-if="currentPage === 'calendar'" />
        <FileLibrary v-else-if="currentPage === 'files'" />
        <ReportCenter v-else-if="currentPage === 'report'" />
        <Settings v-else-if="currentPage === 'settings'" ref="settingsRef" @config-change="handleConfigChange" :currentSubPage="currentSubPage" />
        
        <ProjectSpace v-else-if="currentPage === 'project'" :readOnly="isReadOnly('project')" @openAddTask="openAddTaskDialog" />
        <DailyTodo v-else-if="currentPage === 'todo'" :readOnly="isReadOnly('todo')" />
        <MilestoneView v-else-if="currentPage === 'milestone'" :readOnly="isReadOnly('milestone')" />
        <ActivityLog v-else-if="currentPage === 'activity'" :readOnly="isReadOnly('activity')" />
        
        <CustomerManagement v-else-if="currentPage === 'customer'" :currentSubPage="currentSubPage" @sub-page-change="handleSubPageChange" />
        <OrderManagement v-else-if="currentPage === 'order'" :currentSubPage="currentSubPage" />
        <ProductManagement v-else-if="currentPage === 'product'" :currentSubPage="currentSubPage" />
        <DailyWork v-else-if="currentPage === 'dailywork'" :currentSubPage="currentSubPage" />
        <FinanceManagement v-else-if="currentPage === 'finance'" :currentSubPage="currentSubPage" />
        <SampleDelivery v-else-if="currentPage === 'sample'" />
        <DeliveryAllocation v-else-if="currentPage === 'delivery-allocation'" />
        <DeliverySchedule v-else-if="currentPage === 'delivery-schedule'" />
        <GbCertReport v-else-if="currentPage === 'gb-cert'" />
        <BoxDesignIteration v-else-if="currentPage === 'box-iter'" />
        <SampleDeliveryLog v-else-if="currentPage === 'sample-log'" />
      </div>
    </main>
    
    <el-dialog v-model="showNewProjectDialog" title="新建项目" width="400px">
      <el-form :model="newProject" label-width="80px">
        <el-form-item label="项目名称">
          <el-input v-model="newProject.name" />
        </el-form-item>
        <el-form-item label="项目描述">
          <el-input v-model="newProject.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="项目类型">
          <el-select v-model="newProject.projectType">
            <el-option label="研发项目" value="development" />
            <el-option label="客户样机项目" value="sample" />
            <el-option label="产品认证项目" value="certification" />
            <el-option label="批量出货订单" value="shipment" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showNewProjectDialog = false">取消</el-button>
        <el-button type="primary" @click="createProject">确定</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showImportDialog" title="导入任务" width="500px">
      <el-form :model="importForm" label-width="80px">
        <el-form-item label="选择项目">
          <el-select v-model="importForm.projectId">
            <el-option v-for="p in store.projects" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务列表">
          <el-input v-model="importForm.tasks" type="textarea" :rows="10" placeholder="每行一个任务，格式：任务名称 开始日期 工期(天)" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="importTasks">导入</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showAIDialog" title="AI智能任务拆解" width="600px">
      <el-form :model="aiForm" label-width="80px">
        <el-form-item label="选择项目">
          <el-select v-model="aiForm.projectId">
            <el-option v-for="p in store.projects" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="输入文本">
          <el-input v-model="aiForm.text" type="textarea" :rows="12" placeholder="粘贴微信聊天记录、会议纪要或领导指令..." />
        </el-form-item>
        <div class="ai-tips">
          <div class="tip-item">支持识别日期格式：2024-03-20</div>
          <div class="tip-item">支持识别工期：5天、3日</div>
          <div class="tip-item">包含"里程碑"标记为里程碑任务</div>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showAIDialog = false">取消</el-button>
        <el-button type="success" @click="aiParse">智能拆解</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showAddTaskDialog" title="新建任务" width="500px">
      <el-form :model="newTask" label-width="100px">
        <el-form-item label="任务名称">
          <el-input v-model="newTask.name" />
        </el-form-item>
        <el-form-item label="工期(天)">
          <el-input-number v-model="newTask.duration" :min="1" :max="365" />
        </el-form-item>
        <el-form-item label="开始日期">
          <el-date-picker v-model="newTask.startDate" type="date" />
        </el-form-item>
        <el-form-item label="关联客户">
          <el-select v-model="newTask.customerName">
            <el-option label="请选择" value="" />
            <el-option v-for="c in store.customers" :key="c.id" :label="c.name" :value="c.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="产品机型">
          <el-select v-model="newTask.model">
            <el-option label="请选择" value="" />
            <el-option v-for="m in store.productModels" :key="m.id" :label="m.name" :value="m.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="物流单号">
          <el-input v-model="newTask.logisticsNo" />
        </el-form-item>
        <el-form-item label="对接邮箱">
          <el-input v-model="newTask.email" />
        </el-form-item>
        <el-form-item label="样品数量">
          <el-input-number v-model="newTask.sampleQty" :min="0" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="newTask.milestone">设为里程碑</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddTaskDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAddTask">确定</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showSupabaseConfigDialog" title="连接云端存储" width="500px" :close-on-click-modal="false" :close-on-press-escape="false">
      <el-alert
        title="安全说明"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 20px;"
      >
        <p>密钥仅保存在您的浏览器本地，不会上传到服务器或GitHub</p>
        <p>勾选「记住配置」将加密存储，刷新页面不会丢失</p>
      </el-alert>
      <el-form :model="supabaseConfigForm" label-width="120px">
        <el-form-item label="Supabase URL">
          <el-input v-model="supabaseConfigForm.url" placeholder="https://你的项目ID.supabase.co" />
        </el-form-item>
        <el-form-item label="Supabase Anon KEY">
          <el-input v-model="supabaseConfigForm.key" type="password" placeholder="你的匿名密钥" show-password />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="supabaseConfigForm.remember" :disabled="isIncognito">
            记住本次配置
            <span v-if="isIncognito" style="color: #909399; font-size: 12px;">（无痕模式下不可选）</span>
          </el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleCancelSupabaseConfig">取消（保持本地模式）</el-button>
        <el-button type="primary" @click="handleSupabaseConfigSubmit">确认连接</el-button>
      </template>
    </el-dialog>
    
    <el-dialog 
      v-model="showSyncDialog" 
      :title="syncDirection === 'push' ? '推送数据到云端' : '从云端拉取数据'" 
      width="600px"
      :close-on-click-modal="false"
    >
      <el-alert
        :title="syncDirection === 'push' ? '⚠️ 推送风险提示' : '⚠️ 拉取风险提示'"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 20px;"
      >
        <p v-if="syncDirection === 'push'">
          将把本地所有未同步的数据推送到云端 Supabase。如果云端已有相同 ID 的数据，将被本地数据覆盖。
        </p>
        <p v-else>
          将从云端 Supabase 拉取最新数据到本地。如果本地已有相同 ID 的数据，将被云端数据覆盖。
        </p>
        <p style="color: #f56c6c; margin-top: 8px;">此操作不可撤销，请谨慎操作！</p>
      </el-alert>
      
      <el-form-item label="选择同步表">
        <el-checkbox 
          :model-value="selectAllTables" 
          @change="handleSelectAllTables"
        >
          全选
        </el-checkbox>
      </el-form-item>
      <div class="sync-table-list">
        <el-checkbox
          v-for="table in syncableTables"
          :key="table.name"
          v-model="selectedTables"
          :label="table.name"
          :value="table.name"
        >
          {{ table.label }}
        </el-checkbox>
      </div>
      
      <template #footer>
        <el-button @click="showSyncDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          :loading="syncLoading"
          :disabled="selectedTables.length === 0"
          @click="executeSync"
        >
          确认{{ syncDirection === 'push' ? '推送' : '拉取' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 同步结果详情对话框 -->
    <el-dialog v-model="showSyncResultDialog" title="同步结果详情" width="720px">
      <div v-for="table in syncResultDetails" :key="table.tableName" style="margin-bottom: 16px;">
        <el-divider :content-position="'left'">{{ table.label }}</el-divider>
        <div style="display: flex; gap: 12px; margin-bottom: 10px;">
          <el-tag type="success" size="small">成功: {{ table.success }}</el-tag>
          <el-tag type="danger" size="small" v-if="table.fail > 0">失败: {{ table.fail }}</el-tag>
          <el-tag type="warning" size="small" v-if="table.skip > 0">跳过: {{ table.skip }}</el-tag>
        </div>
        <el-table v-if="table.errors && table.errors.length > 0" :data="table.errors" border size="small" max-height="200">
          <el-table-column prop="id" label="记录ID" width="140" show-overflow-tooltip />
          <el-table-column prop="error" label="错误原因" show-overflow-tooltip />
        </el-table>
      </div>
      <template #footer>
        <el-button type="primary" @click="showSyncResultDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 数据备份与迁移对话框 -->
    <el-dialog v-model="showBackupDialog" title="数据备份与迁移" width="720px" :close-on-click-modal="false">
      <el-tabs v-model="backupActiveTab">
        <!-- 导出 Tab -->
        <el-tab-pane label="导出数据" name="export">
          <el-alert
            title="导出说明"
            type="info"
            :closable="false"
            show-icon
            style="margin-bottom: 16px;"
          >
            <p>• <b>Excel 多 sheet</b>：所有选中的表合并到一个 Excel 文件，每张表一个工作表</p>
            <p>• <b>CSV</b>：每张表单独下载一个 CSV 文件（UTF-8 编码，含 BOM）</p>
            <p>• 导出的文件可直接用于导入到系统或 Supabase</p>
          </el-alert>

          <el-form-item label="导出格式">
            <el-radio-group v-model="exportFormat">
              <el-radio value="excel">Excel（多 sheet 合并）</el-radio>
              <el-radio value="csv">CSV（逐个下载）</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="选择表">
            <el-checkbox 
              :model-value="backupSelectAll" 
              @change="handleBackupSelectAll"
            >
              全选
            </el-checkbox>
          </el-form-item>
          <div class="sync-table-list" style="max-height: 240px; overflow-y: auto;">
            <el-checkbox
              v-for="table in syncableTables"
              :key="table.name"
              v-model="backupSelectedTables"
              :label="table.name"
              :value="table.name"
            >
              {{ table.label }}
            </el-checkbox>
          </div>

          <div style="margin-top: 16px; display: flex; gap: 12px; flex-wrap: wrap;">
            <el-button 
              type="primary" 
              :loading="backupLoading"
              :disabled="backupSelectedTables.length === 0"
              @click="exportSelectedTables"
            >
              一键导出所选表
            </el-button>
            <span style="color: #909399; font-size: 12px; line-height: 32px;">
              已选 {{ backupSelectedTables.length }} / {{ syncableTables.length }} 张表
            </span>
          </div>

          <el-divider content-position="left">单表快速导出</el-divider>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div 
              v-for="table in syncableTables.slice(0, 6)" 
              :key="table.name"
              style="display: flex; align-items: center; justify-content: space-between; padding: 6px 12px; background: #f5f7fa; border-radius: 4px;"
            >
              <span>{{ table.label }}</span>
              <div>
                <el-button size="small" @click="exportSingleTable(table.name, 'excel')">Excel</el-button>
                <el-button size="small" @click="exportSingleTable(table.name, 'csv')">CSV</el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 导入 Tab -->
        <el-tab-pane label="导入数据" name="import">
          <el-alert
            title="导入说明"
            type="warning"
            :closable="false"
            show-icon
            style="margin-bottom: 16px;"
          >
            <p>• <b>导入到系统</b>：数据写入浏览器本地存储，覆盖同 ID 记录</p>
            <p>• <b>导入到 Supabase</b>：数据推送到云端数据库（需先连接云端）</p>
            <p>• <b>单表导入</b>：选择目标表，文件第一个 sheet 导入到该表</p>
            <p>• <b>多表导入</b>：按 sheet 名匹配表名（使用导出时的中文名）</p>
          </el-alert>

          <el-form label-width="100px">
            <el-form-item label="导入目标">
              <el-radio-group v-model="importTarget">
                <el-radio value="system">系统（本地存储）</el-radio>
                <el-radio value="supabase">Supabase（云端）</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="导入模式">
              <el-radio-group v-model="importMode">
                <el-radio value="single">单表导入</el-radio>
                <el-radio value="all">多表导入（按 sheet 名匹配）</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="目标表" v-if="importMode === 'single'">
              <el-select v-model="importTableName" placeholder="选择目标表" style="width: 100%;">
                <el-option 
                  v-for="table in syncableTables" 
                  :key="table.name" 
                  :label="table.label" 
                  :value="table.name" 
                />
              </el-select>
            </el-form-item>
          </el-form>

          <div style="margin-top: 16px; display: flex; gap: 12px; align-items: center;">
            <el-button 
              type="primary" 
              :loading="backupLoading"
              @click="triggerImportFile"
            >
              选择文件并导入
            </el-button>
            <span style="color: #909399; font-size: 12px;">
              支持 .xlsx / .xls / .csv 格式
            </span>
            <input 
              ref="importFileInput" 
              type="file" 
              accept=".xlsx,.xls,.csv" 
              style="display: none;" 
              @change="handleImportFile"
            />
          </div>

          <!-- 导入结果 -->
          <div v-if="importResultDetails.length > 0" style="margin-top: 20px;">
            <el-divider content-position="left">导入结果</el-divider>
            <div v-for="r in importResultDetails" :key="r.tableName" style="margin-bottom: 12px;">
              <div style="display: flex; gap: 12px; margin-bottom: 6px;">
                <el-tag size="small">{{ r.label }}</el-tag>
                <el-tag type="success" size="small">成功: {{ r.success }}</el-tag>
                <el-tag type="danger" size="small" v-if="r.fail > 0">失败: {{ r.fail }}</el-tag>
              </div>
              <el-table v-if="r.errors && r.errors.length > 0" :data="r.errors" border size="small" max-height="160">
                <el-table-column prop="id" label="记录ID" width="160" show-overflow-tooltip />
                <el-table-column prop="error" label="错误原因" show-overflow-tooltip />
              </el-table>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="showBackupDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, h, computed, onMounted, onUnmounted, watch } from 'vue'
import { store, authStore, addProject, parseAIText, addTask, isReadOnly, logout, syncAllFromSupabase, syncLocalToCloud, checkSupabasePermissions, toggleLocalMode, restoreSession, persistData } from './store.js'
import { setLocalMode, getLocalMode, saveEncryptedConfig, getSavedConfig, clearSavedConfig, testSupabaseConnection, clearTempConfig, syncToSupabase, fetchFromSupabase } from './supabase.js'
import { isLocalhost, isIncognitoMode } from './utils/crypto.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { exportTableData, exportMultiSheetExcel, parseImportFile } from './utils/excelExport.js'

let pendingNavKey = null
let pendingSubKey = null

const syncableTables = [
  { name: 'customers', label: '客户主台账' },
  { name: 'sample_deliveries', label: '样机寄样申请' },
  { name: 'package_sample_follows', label: '客户跟进记录' },
  { name: 'product_models', label: '机型参数库' },
  { name: 'product_certs', label: '合规认证档案' },
  { name: 'product_images', label: '渲染图素材库' },
  { name: 'logistics_bills', label: '物流运单跟踪' },
  { name: 'customer_payments', label: '付款记录' },
  { name: 'sales_orders', label: '订单总台账' },
  { name: 'customer_groups', label: '客户分组配置' },
  { name: 'delivery_allocations', label: '出货分配台账' },
  { name: 'delivery_schedules', label: '订单交期管控台账' },
  { name: 'activate_export_configs', label: '激活数据导出配置' },
  { name: 'cert_matrix_files', label: '认证文件矩阵-文件项' },
  { name: 'cert_matrix_cells', label: '认证文件矩阵-进度' },
  { name: 'cert_matrix_templates', label: '认证矩阵-自定义模板' },
  { name: 'cert_matrix_statuses', label: '认证矩阵-自定义状态' }
]

// 每张表导出/导入使用的字段（camelCase），与 store 中对象字段保持一致
// 注：实际导出时会动态收集数据中所有出现过的字段，这里仅作为没有数据时的兜底
const TABLE_FIELDS_FALLBACK = {
  customers: ['id', 'name', 'group', 'country', 'region', 'company', 'email', 'phone', 'address', 'model', 'firstContactDate', 'sampleCount', 'notes', 'remark'],
  sample_deliveries: ['id', 'customer_name', 'model', 'area', 'logistics', 'tracking_no', 'send_date', 'qty', 'freight', 'status', 'remark'],
  package_sample_follows: ['id', 'projectName', 'internalModel', 'businessType', 'followStatus', 'sendDate', 'receiveDate', 'nextFollowDate', 'followLogs', 'remark'],
  product_models: ['id', 'name', 'model_name', 'chip', 'screen', 'certifications', 'supplier_name', 'render_image_path', 'remark'],
  product_certs: ['id', 'model_id', 'model_name', 'model', 'cert_type', 'cert_no', 'issue_date', 'expire_date', 'cert_file_path', 'organization', 'remark'],
  product_images: ['id', 'model_id', 'model_name', 'image_path', 'image_type', 'remark'],
  logistics_bills: ['id', 'logisticsNo', 'logisticsCompany', 'customerName', 'country', 'freightAmount', 'freightForwarder', 'paymentStatus', 'writeOffDate', 'remark'],
  customer_payments: ['id', 'customer_id', 'customer_name', 'order_no', 'order_date', 'product_name', 'spec_model', 'quantity', 'unit_price', 'order_amount', 'delivery_date', 'payment_batch', 'payment_type', 'payment_date', 'payment_amount', 'payment_method', 'arrival_status', 'remark'],
  sales_orders: ['id', 'customer_id', 'customer_name', 'model', 'quantity', 'order_date', 'logistics_no', 'status', 'amount', 'currency', 'bulk_freight', 'order_type', 'payment_status', 'order_no', 'remark'],
  customer_groups: ['id', 'group_name', 'name', 'remark'],
  delivery_allocations: ['id', 'order_id', 'order_no', 'customer_name', 'model', 'quantity', 'allocated_qty', 'delivery_date', 'status', 'remark'],
  delivery_schedules: ['id', 'order_id', 'order_no', 'customer_name', 'model', 'quantity', 'scheduled_date', 'delivery_date', 'status', 'remark'],
  activate_export_configs: ['id', 'customer', 'update_frequency', 'receive_email', 'model', 'model_name', 'country', 'software_version', 'need_imei', 'need_filter', 'export_table_name', 'fota_source', 'enabled', 'remark'],
  cert_matrix_files: ['id', 'name', 'template', 'category', 'order', 'order_no', 'remark', 'is_deleted', 'update_time'],
  cert_matrix_cells: ['id', 'file_id', 'template', 'status', 'remark', 'update_time'],
  cert_matrix_templates: ['id', 'name', 'config', 'remark'],
  cert_matrix_statuses: ['id', 'name', 'color', 'order', 'order_no', 'remark']
}

// 动态收集一张表所有记录中出现过的字段（保持出现顺序，去重）
function collectTableFields(tableName, records) {
  if (!Array.isArray(records) || records.length === 0) {
    return TABLE_FIELDS_FALLBACK[tableName] || ['id']
  }
  const seen = new Set()
  const fields = []
  for (const r of records) {
    if (r && typeof r === 'object') {
      for (const k of Object.keys(r)) {
        if (!seen.has(k)) {
          seen.add(k)
          fields.push(k)
        }
      }
    }
  }
  // 确保 id 在首位
  const idIdx = fields.indexOf('id')
  if (idIdx > 0) {
    fields.splice(idIdx, 1)
    fields.unshift('id')
  }
  return fields.length > 0 ? fields : (TABLE_FIELDS_FALLBACK[tableName] || ['id'])
}

const showSyncDialog = ref(false)
const syncDirection = ref('pull')
const selectedTables = ref([])
const selectAllTables = ref(false)
const syncLoading = ref(false)
const showSyncResultDialog = ref(false)
const syncResultDetails = ref([])

// ===== 数据备份与迁移 =====
const showBackupDialog = ref(false)
const backupActiveTab = ref('export')
const backupSelectedTables = ref([])  // 导出选中的表
const backupSelectAll = ref(false)
const exportFormat = ref('excel')     // 'excel' | 'csv'
const backupLoading = ref(false)
const importTarget = ref('system')    // 'system' | 'supabase'
const importMode = ref('single')      // 'single' | 'all'
const importTableName = ref('')       // 单表导入时选中的表
const importFileInput = ref(null)
const importResultDetails = ref([])

function openBackupDialog() {
  backupActiveTab.value = 'export'
  backupSelectedTables.value = []
  backupSelectAll.value = false
  exportFormat.value = 'excel'
  importTarget.value = 'system'
  importMode.value = 'single'
  importTableName.value = syncableTables[0]?.name || ''
  importResultDetails.value = []
  showBackupDialog.value = true
}

function handleBackupSelectAll(val) {
  backupSelectedTables.value = val ? syncableTables.map(t => t.name) : []
  backupSelectAll.value = val
}

// 表名 → sheet 名映射（Excel sheet 名最长 31 字符）
function tableToSheetName(tableName) {
  const item = syncableTables.find(t => t.name === tableName)
  return (item?.label || tableName).substring(0, 31)
}

// sheet 名 → 表名映射（导入时按 sheet 名匹配）
function sheetNameToTable(sheetName) {
  // 优先精确匹配 label
  const byLabel = syncableTables.find(t => t.label === sheetName)
  if (byLabel) return byLabel.name
  // 再匹配截断后的 label
  const byTruncLabel = syncableTables.find(t => t.label.substring(0, 31) === sheetName)
  if (byTruncLabel) return byTruncLabel.name
  // 最后匹配表名
  const byName = syncableTables.find(t => t.name === sheetName)
  if (byName) return byName.name
  return null
}

// 将对象序列化为字符串（用于导出 attachments 等复杂字段）
function flattenValue(v) {
  if (v === null || v === undefined) return ''
  if (typeof v === 'object') {
    try { return JSON.stringify(v) } catch { return String(v) }
  }
  return v
}

// 导出单个表
async function exportSingleTable(tableName, format) {
  try {
    const data = await getLocalData(tableName)
    if (!data || data.length === 0) {
      ElMessage.warning(`「${syncableTables.find(t => t.name === tableName)?.label || tableName}」没有数据可导出`)
      return
    }
    const fields = collectTableFields(tableName, data)
    const headers = fields
    const rows = data.map(item => fields.map(f => flattenValue(item[f])))
    await exportTableData(tableName, headers, rows, format)
    ElMessage.success(`已导出 ${data.length} 条记录（${format === 'csv' ? 'CSV' : 'Excel'}）`)
  } catch (e) {
    console.error('[导出单表] 失败:', e)
    ElMessage.error(`导出失败：${e.message || e}`)
  }
}

// 一键导出所有选中的表（Excel 多 sheet）
async function exportSelectedTables() {
  if (backupSelectedTables.value.length === 0) {
    ElMessage.warning('请至少选择一张表')
    return
  }
  backupLoading.value = true
  try {
    if (exportFormat.value === 'csv') {
      // CSV 不支持多 sheet，逐个下载
      for (const tableName of backupSelectedTables.value) {
        await exportSingleTable(tableName, 'csv')
      }
      ElMessage.success(`已导出 ${backupSelectedTables.value.length} 张表（CSV）`)
    } else {
      // Excel 多 sheet
      const sheets = []
      let totalCount = 0
      for (const tableName of backupSelectedTables.value) {
        const data = await getLocalData(tableName)
        if (!data || data.length === 0) continue
        const fields = collectTableFields(tableName, data)
        const rows = data.map(item => fields.map(f => flattenValue(item[f])))
        sheets.push({
          sheetName: tableToSheetName(tableName),
          headers: fields,
          data: rows
        })
        totalCount += data.length
      }
      if (sheets.length === 0) {
        ElMessage.warning('所选表均无数据可导出')
        backupLoading.value = false
        return
      }
      await exportMultiSheetExcel(sheets, '数据备份')
      ElMessage.success(`已导出 ${sheets.length} 张表，共 ${totalCount} 条记录`)
    }
  } catch (e) {
    console.error('[一键导出] 失败:', e)
    ElMessage.error(`导出失败：${e.message || e}`)
  } finally {
    backupLoading.value = false
  }
}

// 触发文件选择
function triggerImportFile() {
  importFileInput.value?.click()
}

// 处理文件导入
async function handleImportFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  
  backupLoading.value = true
  importResultDetails.value = []
  
  try {
    const sheets = await parseImportFile(file)
    if (sheets.length === 0) {
      ElMessage.warning('文件中没有数据')
      return
    }

    // 根据导入模式决定处理哪些 sheet
    let sheetsToProcess = sheets
    if (importMode.value === 'single') {
      // 单表导入：取第一个 sheet
      sheetsToProcess = sheets.slice(0, 1)
    }

    const targetLabel = importTarget.value === 'supabase' ? 'Supabase' : '系统'
    ElMessage.info(`开始导入到${targetLabel}，共 ${sheetsToProcess.length} 张表...`)

    for (const sheet of sheetsToProcess) {
      const tableName = importMode.value === 'single' 
        ? importTableName.value 
        : sheetNameToTable(sheet.sheetName)
      
      const tableLabel = syncableTables.find(t => t.name === tableName)?.label || sheet.sheetName
      const result = { tableName: tableName || sheet.sheetName, label: tableLabel, success: 0, fail: 0, skip: 0, errors: [] }

      if (!tableName) {
        result.errors.push({ id: '-', error: `未识别出表名（sheet: ${sheet.sheetName}）` })
        importResultDetails.value.push(result)
        continue
      }

      if (!sheet.headers || sheet.headers.length === 0 || sheet.rows.length === 0) {
        result.skip = 0
        result.errors.push({ id: '-', error: '空表' })
        importResultDetails.value.push(result)
        continue
      }

      // 将二维数组转回对象数组
      const records = sheet.rows.map(row => {
        const obj = {}
        sheet.headers.forEach((h, i) => {
          obj[h] = row[i] ?? ''
        })
        return obj
      })

      // 确保 id 存在
      for (const r of records) {
        if (!r.id) {
          r.id = 'imp' + Date.now() + Math.random().toString(36).slice(2, 8)
        }
      }

      if (importTarget.value === 'supabase') {
        // 导入到 Supabase
        const { getSupabase } = await import('./supabase.js')
        const client = await getSupabase()
        if (!client) {
          result.errors.push({ id: '-', error: 'Supabase 未配置' })
          importResultDetails.value.push(result)
          continue
        }
        for (const r of records) {
          try {
            const syncRes = await syncToSupabase(tableName, r)
            if (syncRes.success) result.success++
            else {
              result.fail++
              result.errors.push({ id: r.id, error: syncRes.error || '推送失败' })
            }
          } catch (e) {
            result.fail++
            result.errors.push({ id: r.id, error: e.message || '异常' })
          }
        }
      } else {
        // 导入到系统（本地 store）
        for (const r of records) {
          try {
            await saveLocalData(tableName, r)
            result.success++
          } catch (e) {
            result.fail++
            result.errors.push({ id: r.id, error: e.message || '保存失败' })
          }
        }
      }

      importResultDetails.value.push(result)
    }

    // 持久化本地数据
    if (importTarget.value === 'system') {
      persistData()
    }

    const totalSuccess = importResultDetails.value.reduce((s, r) => s + r.success, 0)
    const totalFail = importResultDetails.value.reduce((s, r) => s + r.fail, 0)
    
    if (totalFail > 0) {
      ElMessage.warning(`导入完成：成功 ${totalSuccess} 条，失败 ${totalFail} 条`)
    } else {
      ElMessage.success(`导入完成！共 ${totalSuccess} 条记录`)
    }
  } catch (e) {
    console.error('[导入] 失败:', e)
    ElMessage.error(`导入失败：${e.message || e}`)
  } finally {
    backupLoading.value = false
    // 清空 input，允许重复选择同一文件
    if (event.target) event.target.value = ''
  }
}

function openSyncDialog(direction) {
  syncDirection.value = direction
  selectedTables.value = []
  selectAllTables.value = false
  showSyncDialog.value = true
}

function handleSelectAllTables(val) {
  selectedTables.value = val ? syncableTables.map(t => t.name) : []
}

async function executeSync() {
  syncLoading.value = true
  const tables = selectedTables.value
  syncResultDetails.value = []
  
  try {
    // 先检查 Supabase 配置是否可用
    const { getSupabase } = await import('./supabase.js')
    const client = await getSupabase()
    if (!client) {
      ElMessage.error('Supabase 未配置或连接失败，请先在【设置→云端存储】中配置')
      syncLoading.value = false
      return
    }
    
    ElMessage.info(`开始${syncDirection.value === 'push' ? '推送' : '拉取'} ${tables.length} 张表...`)
    
    for (const tableName of tables) {
      const tableLabel = syncableTables.find(t => t.name === tableName)?.label || tableName
      const tableResult = { tableName, label: tableLabel, success: 0, fail: 0, skip: 0, errors: [] }
      
      if (syncDirection.value === 'pull') {
        try {
          const result = await fetchFromSupabase(tableName, { page: 1, pageSize: 50 })
          if (result.success) {
            for (const item of result.data) {
              await saveLocalData(tableName, item)
            }
            tableResult.success = result.data.length
          } else {
            tableResult.errors.push({ id: '-', error: result.error || '拉取失败' })
          }
        } catch (e) {
          tableResult.errors.push({ id: '-', error: e.message || '未知错误' })
        }
      } else {
        try {
          const localData = await getLocalData(tableName)
          if (localData.length === 0) {
            tableResult.skip = 0
            continue
          }
          
          for (const item of localData) {
            let pushData = { ...item }
            let recordId = pushData.id || '(无ID)'
            // 不再删除非UUID的id：所有业务表均使用 TEXT 主键（CPAY-/CUST-/SO- 等），
            // 由 syncToSupabase 内部根据 tablesWithTextId 白名单决定是否保留 id。
            // 旧代码 delete pushData.id 会导致 UPSERT 无主键、主键非空约束失败。

            // 付款记录前置校验：仅推送 CPAY- 前缀的标准 ID
            if (tableName === 'customer_payments') {
              if (!pushData.id || !/^CPAY-[a-z0-9]{8,16}$/.test(pushData.id)) {
                tableResult.skip++
                tableResult.errors.push({ id: recordId, error: 'ID非CPAY-标准格式，已拦截' })
                console.warn(`[付款记录] 非标准ID已拦截同步: ${pushData.id}`)
                continue
              }
            }

            const result = await syncToSupabase(tableName, pushData)
            if (result.success) {
              tableResult.success++
              // 同步成功后清除待同步标记（付款记录）
              if (tableName === 'customer_payments' && item._pendingSync) {
                item._pendingSync = false
              }
              console.log(`[同步日志] 表=${tableName} ID=${recordId} 动作=upsert 时间=${new Date().toISOString()}`)
              // 自增ID表：insert 成功后用数据库返回的 id 更新本地记录，避免重复推送
              if (result.id && item.id && String(item.id) !== String(result.id)) {
                console.log(`[同步] 更新本地记录 id: ${item.id} → ${result.id}`)
                item.id = result.id
              }
            } else {
              tableResult.fail++
              tableResult.errors.push({ id: recordId, error: result.error || '推送失败' })
            }
          }
        } catch (e) {
          tableResult.errors.push({ id: '-', error: e.message || '未知错误' })
        }
      }
      if (tableResult.success || tableResult.fail || tableResult.errors.length) {
        syncResultDetails.value.push(tableResult)
      }
    }
    
    showSyncDialog.value = false
    
    // 推送完成后持久化本地数据（更新了自增ID表返回的数据库id）
    persistData()
    
    const hasErrors = syncResultDetails.value.some(t => t.fail > 0 || t.errors.length > 0)
    if (hasErrors) {
      showSyncResultDialog.value = true
    } else {
      ElMessage.success('同步完成！全部成功')
    }
  } catch (err) {
    ElMessage.error(`同步失败: ${err.message}`)
  } finally {
    syncLoading.value = false
  }
}

async function saveLocalData(tableName, data) {
  const TABLE_STORE_MAP = {
    'customers': () => store.customers,
    'sample_deliveries': () => store.sampleDeliveries,
    'package_sample_follows': () => store.packageSampleFollows,
    'product_models': () => store.productModels,
    'product_certs': () => store.certRecords,
    'product_images': () => store.productImages,
    'logistics_bills': () => store.logisticsBills,
    'customer_payments': () => store.customerPayments,
    'sales_orders': () => store.salesOrders,
    'customer_groups': () => store.customerGroups,
    'delivery_allocations': () => store.deliveryAllocations,
    'delivery_schedules': () => store.deliverySchedules,
    'activate_export_configs': () => store.activateExportConfigs,
    'cert_matrix_files': () => store.certMatrixFiles,
    'cert_matrix_cells': () => store.certMatrixCells,
    'cert_matrix_templates': () => store.certMatrixTemplates,
    'cert_matrix_statuses': () => store.certMatrixStatuses
  }

  const getter = TABLE_STORE_MAP[tableName]
  if (getter) {
    const list = getter()
    if (Array.isArray(list)) {
      const index = list.findIndex(item => item.id === data.id)
      if (index >= 0) {
        list[index] = { ...list[index], ...data }
      } else {
        list.push(data)
      }
    }
    return
  }
  
  const key = `local_${tableName}`
  const existing = JSON.parse(localStorage.getItem(key) || '[]')
  const index = existing.findIndex(item => item.id === data.id)
  if (index >= 0) {
    existing[index] = data
  } else {
    existing.push(data)
  }
  localStorage.setItem(key, JSON.stringify(existing))
}

async function getLocalData(tableName) {
  const TABLE_STORE_MAP = {
    'customers': () => store.customers,
    'sample_deliveries': () => store.sampleDeliveries,
    'package_sample_follows': () => store.packageSampleFollows,
    'product_models': () => store.productModels,
    'product_certs': () => store.certRecords,
    'product_images': () => store.productImages || [],
    'logistics_bills': () => store.logisticsBills,
    'customer_payments': () => store.customerPayments,
    'sales_orders': () => store.salesOrders,
    'customer_groups': () => store.customerGroups.map(g => typeof g === 'string' ? { group_name: g } : g),
    'delivery_allocations': () => store.deliveryAllocations || [],
    'delivery_schedules': () => store.deliverySchedules || [],
    'activate_export_configs': () => store.activateExportConfigs || [],
    'cert_matrix_files': () => store.certMatrixFiles || [],
    'cert_matrix_cells': () => store.certMatrixCells || [],
    'cert_matrix_templates': () => store.certMatrixTemplates || [],
    'cert_matrix_statuses': () => store.certMatrixStatuses || []
  }

  const getter = TABLE_STORE_MAP[tableName]
  if (getter) {
    const data = getter()
    return Array.isArray(data) ? data : []
  }
  
  const key = `local_${tableName}`
  return JSON.parse(localStorage.getItem(key) || '[]')
}
import LoginPage from './components/LoginPage.vue'
import Workbench from './components/Workbench.vue'
import CalendarView from './components/CalendarView.vue'
import FileLibrary from './components/FileLibrary.vue'
import ReportCenter from './components/ReportCenter.vue'
import Settings from './components/Settings.vue'
import ProjectSpace from './components/ProjectSpace.vue'
import DailyTodo from './components/DailyTodo.vue'
import MilestoneView from './components/MilestoneView.vue'
import ActivityLog from './components/ActivityLog.vue'
import CustomerManagement from './components/CustomerManagement.vue'
import OrderManagement from './components/OrderManagement.vue'
import ProductManagement from './components/ProductManagement.vue'
import DailyWork from './components/DailyWork.vue'
import FinanceManagement from './components/FinanceManagement.vue'
import SampleDelivery from './components/SampleDelivery.vue'
import DeliveryAllocation from './components/DeliveryAllocation.vue'
import DeliverySchedule from './components/DeliverySchedule.vue'
import GbCertReport from './components/GbCertReport.vue'
import BoxDesignIteration from './components/BoxDesignIteration.vue'
import SampleDeliveryLog from './components/SampleDeliveryLog.vue'
import { tabConfigs, getTabTitle, isAdmin as checkIsAdmin } from './tabConfig.js'

const isLoggedIn = computed(() => !!authStore.currentUser)

const isIncognito = ref(false)

const currentPage = ref('workbench')
const currentSubPage = ref('')
const activeTopTab = ref('main')

const expandedGroups = reactive({
  development: false,
  customer: true,
  order: true,
  product: true,
  dailywork: true,
  finance: true,
  settings: true,
  custom_modules: true
})

onMounted(async () => {
  isIncognito.value = isIncognitoMode()
  
  if (isLoggedIn.value) {
    restoreSession()
    // 恢复会话后也检测云端权限，自动切换模式
    setTimeout(async () => {
      try {
        const permCheck = await checkSupabasePermissions()
        if (permCheck.ok && store.localMode) {
          toggleLocalMode(false)
          setLocalMode(false)
          localStorage.removeItem('supabase_rls_failed')
          await syncAllFromSupabase(false)
          ElMessage.success('✅ 已自动切换为云端模式')
        }
      } catch (e) {
        console.warn('[启动] 权限检测失败：', e)
      }
    }, 500)
  }
  
  initFromHash()
  window.addEventListener('hashchange', initFromHash)
})

onUnmounted(() => {
  window.removeEventListener('hashchange', initFromHash)
})

function initFromHash() {
  const hash = window.location.hash.replace('#', '')
  if (!hash) {
    updateHash()
    return
  }
  const [page, subPage] = hash.split('/')
  const validPages = ['workbench', 'calendar', 'files', 'report', 'settings', 'project', 'todo', 'milestone', 'activity', 'customer', 'order', 'product', 'dailywork', 'finance', 'sample', 'delivery-allocation', 'delivery-schedule', 'gb-cert', 'box-iter', 'sample-log']
  if (validPages.includes(page)) {
    currentPage.value = page
    currentSubPage.value = subPage || ''
  } else {
    currentPage.value = 'workbench'
    currentSubPage.value = ''
    updateHash()
  }
  if (page === 'customer' || page === 'delivery-allocation' || page === 'delivery-schedule') {
    expandedGroups['customer'] = true
    expandedGroups['order'] = true
  }
}

function updateHash() {
  const hash = currentSubPage.value ? `#${currentPage.value}/${currentSubPage.value}` : `#${currentPage.value}`
  if (window.location.hash !== hash) {
    window.location.hash = hash
  }
}

watch([currentPage, currentSubPage], () => {
  updateHash()
})

const viewMode = ref('gantt')

const showTabBar = computed(() => {
  return ['customer', 'sample', 'delivery-allocation', 'delivery-schedule'].includes(currentPage.value)
})

const topTabs = computed(() => {
  if (currentPage.value === 'customer' || currentPage.value === 'sample') {
    return [
      { name: 'main', label: '海外客户主台账' },
      { name: 'followup', label: '客户跟进记录' },
      { name: 'sample', label: '样机寄样申请' },
      { name: 'group', label: '客户分组配置' },
      { name: 'payment', label: '客户付款记录' }
    ]
  }
  if (currentPage.value === 'delivery-allocation' || currentPage.value === 'delivery-schedule') {
    return [
      { name: 'delivery-allocation', label: '出货分配台账' },
      { name: 'delivery-schedule', label: '订单交期管控台账' }
    ]
  }
  return []
})

watch(currentPage, () => {
  if (currentPage.value === 'customer') {
    activeTopTab.value = currentSubPage.value || 'main'
  } else if (currentPage.value === 'sample') {
    activeTopTab.value = 'sample'
  } else if (currentPage.value === 'delivery-allocation') {
    activeTopTab.value = 'delivery-allocation'
  } else if (currentPage.value === 'delivery-schedule') {
    activeTopTab.value = 'delivery-schedule'
  }
})

function handleTopTabChange(tabName) {
  if (currentPage.value === 'customer') {
    if (tabName === 'sample') {
      currentPage.value = 'sample'
      currentSubPage.value = ''
    } else {
      currentSubPage.value = tabName
    }
  } else if (tabName === 'delivery-allocation') {
    currentPage.value = 'delivery-allocation'
    currentSubPage.value = ''
  } else if (tabName === 'delivery-schedule') {
    currentPage.value = 'delivery-schedule'
    currentSubPage.value = ''
  }
}

function handleSubPageChange(subPage) {
  currentSubPage.value = subPage
  activeTopTab.value = subPage
}

const showNewProjectDialog = ref(false)
const showImportDialog = ref(false)
const showAIDialog = ref(false)
const showAddTaskDialog = ref(false)
const showSupabaseConfigDialog = ref(false)
const settingsRef = ref(null)

const supabaseConfigForm = reactive({
  url: '',
  key: '',
  remember: false
})

function handleConfigChange(changed) {
  hasUnsavedConfig.value = changed
}

const newProject = reactive({ name: '', description: '', projectType: 'development' })
const importForm = reactive({ projectId: '', tasks: '' })
const aiForm = reactive({ projectId: '', text: '' })
const newTask = reactive({ 
  name: '', 
  duration: 1, 
  startDate: new Date().toISOString().split('T')[0], 
  milestone: false,
  customerName: '',
  model: '',
  logisticsNo: '',
  email: '',
  sampleQty: 0
})

let pendingStageId = null

const fixedNavItems = [
  { key: 'workbench', label: '工作台', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '20', height: '20' }, h('rect', { x: '3', y: '3', width: '18', height: '18', rx: '2', ry: '2' })) },
  { key: 'calendar', label: '日历', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '20', height: '20' }, h('rect', { x: '3', y: '4', width: '18', height: '18', rx: '2', ry: '2' }), h('line', { x1: '16', y1: '2', x2: '16', y2: '6' }), h('line', { x1: '8', y1: '2', x2: '8', y2: '6' }), h('line', { x1: '3', y1: '10', x2: '21', y2: '10' })) },
  { key: 'files', label: '文件资料', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '20', height: '20' }, h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }), h('polyline', { points: '14 2 14 8 20 8' }), h('line', { x1: '16', y1: '13', x2: '8', y2: '13' }), h('line', { x1: '16', y1: '17', x2: '8', y2: '17' }), h('polyline', { points: '10 9 9 9 8 9' })) },
  { key: 'report', label: '报表中心', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '20', height: '20' }, h('line', { x1: '18', y1: '20', x2: '18', y2: '10' }), h('line', { x1: '12', y1: '20', x2: '12', y2: '4' }), h('line', { x1: '6', y1: '20', x2: '6', y2: '14' })) }
]

const settingsNavGroup = {
  key: 'settings',
  label: '设置',
  children: [
    { key: 'settings', subKey: 'user', label: '用户信息', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('path', { d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' }), h('circle', { cx: '12', cy: '7', r: '4' })) },
    { key: 'settings', subKey: 'accounts', label: '账号用户管理', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }), h('circle', { cx: '9', cy: '7', r: '4' }), h('path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87' }), h('path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' })) },
    { key: 'settings', subKey: 'supabase', label: '云端存储配置', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('path', { d: 'M22 12h-4l-3 9L9 3l-3 9H2' })) },
    { key: 'settings', subKey: 'alert', label: '预警配置', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('path', { d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' }), h('line', { x1: '12', y1: '9', x2: '12', y2: '13' }), h('line', { x1: '12', y1: '17', x2: '12.01', y2: '17' })) },
    { key: 'settings', subKey: 'data', label: '数据管理', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('ellipse', { cx: '12', cy: '5', rx: '9', ry: '3' }), h('path', { d: 'M21 12c0 1.66-4 3-9 3s-9-1.34-9-3' }), h('path', { d: 'M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5' })) },
    { key: 'settings', subKey: 'display', label: '显示设置', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('circle', { cx: '12', cy: '12', r: '3' }), h('path', { d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' })) },
    { key: 'settings', subKey: 'tab_titles', label: 'Tab 标题管理', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('rect', { x: '3', y: '3', width: '18', height: '18', rx: '2', ry: '2' }), h('line', { x1: '9', y1: '3', x2: '9', y2: '21' })) },
    { key: 'settings', subKey: 'about', label: '关于', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('circle', { cx: '12', cy: '12', r: '10' }), h('line', { x1: '12', y1: '16', x2: '12', y2: '12' }), h('line', { x1: '12', y1: '8', x2: '12.01', y2: '8' })) }
  ]
}

const visibleSettingsNavItems = computed(() => {
  const items = [...settingsNavGroup.children]
  if (store.user.role !== 'admin') {
    return items.filter(item => item.subKey !== 'accounts' && item.subKey !== 'supabase')
  }
  return items
})

const developmentNavItems = [
  { key: 'project', label: '项目管理', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '20', height: '20' }, h('path', { d: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z' })) },
  { key: 'todo', label: '任务管理', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '20', height: '20' }, h('polyline', { points: '20 6 9 17 4 12' })) },
  { key: 'milestone', label: '里程碑', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '20', height: '20' }, h('polygon', { points: '12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2' })) },
  { key: 'activity', label: '项目动态', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '20', height: '20' }, h('path', { d: 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z' }), h('polyline', { points: '14 2 14 8 20 8' })) }
]

const salesNavGroups = [
  {
    key: 'customer',
    label: '客户线索管理',
    children: [
      { key: 'customer', subKey: 'main', label: '海外客户主台账', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('path', { d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' }), h('circle', { cx: '12', cy: '7', r: '4' })) },
      { key: 'customer', subKey: 'followup', label: '客户跟进记录', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }), h('circle', { cx: '9', cy: '7', r: '4' }), h('path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87' }), h('path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' })) },
      { key: 'customer', subKey: 'group', label: '客户分组配置', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }), h('circle', { cx: '9', cy: '7', r: '4' }), h('path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87' }), h('path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' })) },
      { key: 'customer', subKey: 'payment', label: '客户付款记录', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('rect', { x: '2', y: '5', width: '20', height: '14', rx: '2', ry: '2' }), h('line', { x1: '2', y1: '10', x2: '22', y2: '10' })) }
    ]
  },
  {
    key: 'order',
    label: '订单出货管理',
    children: [
      { key: 'order', subKey: 'main', label: '大货订单台账', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }), h('polyline', { points: '14 2 14 8 20 8' })) },
      { key: 'sample', subKey: 'main', label: '样机寄样台账', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('path', { d: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z' }), h('circle', { cx: '12', cy: '10', r: '3' })) },
      { key: 'order', subKey: 'logistics', label: '物流运单跟踪', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('path', { d: 'M20 7h-9M14 17H5M17 17h2M17 7h2M7 17H5M7 7H5M20 14h-9' })) },
      { key: 'order', subKey: 'bill', label: '物流费用对账', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('line', { x1: '12', y1: '1', x2: '12', y2: '23' }), h('path', { d: 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' })) },
      { key: 'order', subKey: 'imei', label: 'IMEI出库核对', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('rect', { x: '3', y: '3', width: '18', height: '18', rx: '2', ry: '2' }), h('line', { x1: '9', y1: '9', x2: '15', y2: '9' }), h('line', { x1: '9', y1: '15', x2: '15', y2: '15' })) },
      { key: 'delivery-allocation', subKey: '', label: '出货分配台账', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('rect', { x: '1', y: '3', width: '15', height: '13' }), h('polygon', { points: '16 8 20 8 23 11 23 16 16 16 16 8' }), h('circle', { cx: '5.5', cy: '18.5', r: '2.5' }), h('circle', { cx: '18.5', cy: '18.5', r: '2.5' })) },
      { key: 'delivery-schedule', subKey: '', label: '订单交期管控台账', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('circle', { cx: '12', cy: '12', r: '10' }), h('polyline', { points: '12 6 12 12 16 14' })) },
      { key: 'order', subKey: 'activate', label: '激活数据导出配置', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }), h('polyline', { points: '7 10 12 15 17 10' }), h('line', { x1: '12', y1: '15', x2: '12', y2: '3' })) },
      { key: 'dailywork', subKey: 'reminder', label: '每日待办清单', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('path', { d: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9' }), h('path', { d: 'M13.73 21a2 2 0 0 1-3.46 0' })) }
    ]
  },
  {
    key: 'product',
    label: '产品资料台账',
    children: [
      { key: 'product', subKey: 'model', label: '机型参数库', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('rect', { x: '5', y: '2', width: '14', height: '20', rx: '2', ry: '2' }), h('line', { x1: '12', y1: '18', x2: '12', y2: '12' }), h('line', { x1: '12', y1: '8', x2: '12.01', y2: '8' })) },
      { key: 'product', subKey: 'cert', label: '合规认证档案', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('path', { d: 'M12 2L2 7l10 5 10-5-10-5z' }), h('path', { d: 'M2 17l10 5 10-5' }), h('path', { d: 'M2 12l10 5 10-5' })) },
      { key: 'product', subKey: 'material', label: '渲染图素材库', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('rect', { x: '3', y: '3', width: '18', height: '18', rx: '2', ry: '2' }), h('circle', { cx: '8.5', cy: '8.5', r: '1.5' }), h('polyline', { points: '21 15 16 10 5 21' })) },
      { key: 'product', subKey: 'supplier', label: '供应商台账', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }), h('circle', { cx: '9', cy: '7', r: '4' }), h('polyline', { points: '23 21 17 11 12 16 7 11 1 21' })) }
    ]
  },
  {
    key: 'dailywork',
    label: '每日工作台账',
    children: [
      { key: 'dailywork', subKey: 'todo', label: '当日待办看板', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('polyline', { points: '20 6 9 17 4 12' })) },
      { key: 'dailywork', subKey: 'report', label: '周报自动生成', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('line', { x1: '18', y1: '20', x2: '18', y2: '10' }), h('line', { x1: '12', y1: '20', x2: '12', y2: '4' }), h('line', { x1: '6', y1: '20', x2: '6', y2: '14' })) },
      { key: 'dailywork', subKey: 'map', label: '客户线索采集', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('polygon', { points: '1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6' })) },
      { key: 'dailywork', subKey: 'letter', label: '开发信存档库', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('path', { d: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z' }), h('polyline', { points: '22,6 12,13 2,6' })) }
    ]
  },
  {
    key: 'finance',
    label: '财务辅助对账',
    children: [
      { key: 'finance', subKey: 'freight', label: '样品运费登记', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('line', { x1: '12', y1: '1', x2: '12', y2: '23' }), h('path', { d: 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' })) },
      { key: 'finance', subKey: 'quotation', label: '报价单存档', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }), h('polyline', { points: '14 2 14 8 20 8' }), h('line', { x1: '16', y1: '13', x2: '8', y2: '13' })) },
      { key: 'finance', subKey: 'summary', label: '月度运费汇总', icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('rect', { x: '3', y: '3', width: '18', height: '18', rx: '2', ry: '2' }), h('line', { x1: '9', y1: '9', x2: '15', y2: '9' }), h('line', { x1: '9', y1: '15', x2: '15', y2: '15' }), h('line', { x1: '9', y1: '12', x2: '15', y2: '12' })) }
    ]
  },
  {
    key: 'custom_modules',
    label: '项目管理台账',
    children: [
      // key 固定不变，title 可由管理员自定义，业务逻辑全部通过 key 匹配
      { key: 'gb-cert', subKey: '', label: getTabTitle('gb_cert'), icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('path', { d: 'M12 2L2 7l10 5 10-5-10-5z' }), h('path', { d: 'M2 17l10 5 10-5' }), h('path', { d: 'M2 12l10 5 10-5' })) },
      { key: 'box-iter', subKey: '', label: getTabTitle('box_iter'), icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('rect', { x: '3', y: '3', width: '18', height: '18', rx: '2', ry: '2' }), h('path', { d: 'M9 9h6v6H9z' })) },
      { key: 'sample-log', subKey: '', label: getTabTitle('sample_log'), icon: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke': 'currentColor', 'stroke-width': '2', width: '18', height: '18' }, h('path', { d: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z' }), h('circle', { cx: '12', cy: '10', r: '3' })) }
    ]
  }
]

const hasUnsavedConfig = ref(false)

function handleNavClick(key) {
  if (hasUnsavedConfig.value && currentPage.value === 'settings') {
    const confirmLeave = confirm('当前存储配置未保存，是否保存后再切换页面？')
    if (!confirmLeave) return
  }
  currentPage.value = key
  currentSubPage.value = ''
}

function handleGroupClick(group) {
  if (hasUnsavedConfig.value && currentPage.value === 'settings') {
    const confirmLeave = confirm('当前存储配置未保存，是否保存后再切换页面？')
    if (!confirmLeave) return
  }
  expandedGroups[group.key] = !expandedGroups[group.key]
  if (group.children && group.children.length > 0) {
    const firstChild = group.children[0]
    currentPage.value = firstChild.key
    currentSubPage.value = firstChild.subKey
  }
}

function handleSalesNavClick(groupKey, pageKey, subKey) {
  if (hasUnsavedConfig.value && currentPage.value === 'settings') {
    const confirmLeave = confirm('当前存储配置未保存，是否保存后再切换页面？')
    if (!confirmLeave) return
  }
  currentPage.value = pageKey
  currentSubPage.value = subKey
}

function handleSettingsNavClick(pageKey, subKey) {
  if (hasUnsavedConfig.value && currentPage.value === 'settings') {
    const confirmLeave = confirm('当前存储配置未保存，是否保存后再切换页面？')
    if (!confirmLeave) return
  }
  currentPage.value = pageKey
  currentSubPage.value = subKey
}

const isProjectPage = computed(() => {
  return ['project', 'todo', 'milestone', 'activity'].includes(currentPage.value)
})

function createProject() {
  if (newProject.name.trim()) {
    addProject(newProject.name.trim(), newProject.description.trim(), newProject.projectType)
    newProject.name = ''
    newProject.description = ''
    newProject.projectType = 'development'
    showNewProjectDialog.value = false
  }
}

function saveData() {
  localStorage.setItem('project_workbench_data', JSON.stringify(store))
  alert('数据已保存')
}

function importTasks() {
  if (!importForm.projectId || !importForm.tasks.trim()) return
  const lines = importForm.tasks.split('\n').filter(l => l.trim())
  const projectStages = store.stages.filter(s => s.projectId === importForm.projectId)
  const defaultStage = projectStages[0]
  if (!defaultStage) return
  
  lines.forEach(line => {
    const parts = line.trim().split(/\s+/)
    const name = parts[0]
    const startDate = parts[1] || new Date().toISOString().split('T')[0]
    const duration = parseInt(parts[2]) || 1
    addTask(importForm.projectId, defaultStage.id, name, duration, startDate)
  })
  
  importForm.projectId = ''
  importForm.tasks = ''
  showImportDialog.value = false
  alert('导入成功')
}

function aiParse() {
  if (!aiForm.projectId || !aiForm.text.trim()) return
  const count = parseAIText(aiForm.text, aiForm.projectId)
  aiForm.text = ''
  showAIDialog.value = false
  alert(`成功拆解 ${count} 个任务`)
}

function exportTemplate() {
  const template = `任务名称\t开始日期\t工期(天)\t是否里程碑\n任务1\t${new Date().toISOString().split('T')[0]}\t5\t否\n任务2\t${new Date().toISOString().split('T')[0]}\t3\t是`
  const blob = new Blob([template], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '任务导入模板.txt'
  a.click()
  URL.revokeObjectURL(url)
}

function openAddTaskDialog(stageId) {
  pendingStageId = stageId
  showAddTaskDialog.value = true
}

function confirmAddTask() {
  if (!newTask.name.trim()) return
  const stage = store.stages.find(s => s.id === pendingStageId)
  if (stage) {
    addTask(stage.projectId, stage.id, newTask.name, newTask.duration, newTask.startDate, newTask.milestone, {
      customerName: newTask.customerName,
      model: newTask.model,
      logisticsNo: newTask.logisticsNo,
      email: newTask.email,
      sampleQty: newTask.sampleQty
    })
  }
  newTask.name = ''
  newTask.duration = 1
  newTask.startDate = new Date().toISOString().split('T')[0]
  newTask.milestone = false
  newTask.customerName = ''
  newTask.model = ''
  newTask.logisticsNo = ''
  newTask.email = ''
  newTask.sampleQty = 0
  showAddTaskDialog.value = false
}

function handleLoginSuccess() {
  currentPage.value = 'workbench'
  // 登录后自动检测权限
  setTimeout(async () => {
    try {
      const permCheck = await checkSupabasePermissions()
      if (permCheck.ok && store.localMode) {
        // 权限正常，自动切回云端模式
        toggleLocalMode(false)
        setLocalMode(false)
        localStorage.removeItem('supabase_rls_failed')
        await syncAllFromSupabase(false)
        ElMessage.success('✅ 云端权限已修复，已自动切换为云端模式')
      }
    } catch (e) {
      console.warn('[启动] 权限检测失败：', e)
    }
  }, 500)
}

async function handleLocalModeChange(enabled) {
  try {
    await ElMessageBox.confirm(
      enabled 
        ? '切换到本地模式后，所有数据读写仅走浏览器本地存储，不会同步到云端。确定要切换吗？'
        : '切换到云端模式后，将从 Supabase 拉取最新数据，本地未同步的数据可能被覆盖。确定要切换吗？',
      '模式切换确认',
      {
        confirmButtonText: '确定切换',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }
  
  if (enabled) {
    toggleLocalMode(true)
    setLocalMode(true)
    clearTempConfig()
    ElMessage.success('已切换到本地模式，所有数据读写仅走浏览器本地存储')
    return
  }

  if (isLocalhost()) {
    toggleLocalMode(false)
    setLocalMode(false)
    await syncAllFromSupabase()
    ElMessage.success('已切换到云端模式，默认读写 Supabase')
    return
  }

  const savedConfig = await getSavedConfig()
  
  if (savedConfig && savedConfig.source === 'saved') {
    const testResult = await testSupabaseConnection(savedConfig.url, savedConfig.key)
    if (testResult.success) {
      await saveEncryptedConfig(savedConfig.url, savedConfig.key, true)
      toggleLocalMode(false)
      setLocalMode(false)
      await syncAllFromSupabase()
      ElMessage.success('已切换到云端模式，自动使用已保存的配置连接')
    } else {
      ElMessage.error('已保存的配置连接失败，请重新填写')
      showSupabaseConfigDialog.value = true
    }
  } else {
    showSupabaseConfigDialog.value = true
  }
}

async function handleSupabaseConfigSubmit() {
  const url = supabaseConfigForm.url.trim()
  const key = supabaseConfigForm.key.trim()
  
  if (!url || !key) {
    alert('请填写完整的Supabase URL和密钥')
    return
  }
  
  const testResult = await testSupabaseConnection(url, key)
  
  if (!testResult.success) {
    alert('连接失败：' + testResult.error)
    return
  }
  
  const remember = supabaseConfigForm.remember && !isIncognito.value
  await saveEncryptedConfig(url, key, remember)
  
  showSupabaseConfigDialog.value = false
  
  toggleLocalMode(false)
  setLocalMode(false)
  await syncAllFromSupabase()
  
  if (remember) {
    alert('配置已保存，下次关闭本地模式将自动连接')
  } else {
    alert('配置已生效，页面刷新后需要重新填写')
  }
}

function handleCancelSupabaseConfig() {
  showSupabaseConfigDialog.value = false
  toggleLocalMode(true)
  setLocalMode(true)
}

function openSupabaseConfig() {
  showSupabaseConfigDialog.value = true
}

async function syncLocalNow() {
  try {
    ElMessageBox.confirm(
      '将本地所有数据同步到云端，同步完成后将自动切换为云端模式。\n\n确认执行？',
      '一键同步云端',
      { confirmButtonText: '开始同步', cancelButtonText: '取消', type: 'warning' }
    )
    const result = await syncLocalToCloud(true)
    if (result.switchedToCloud) {
      ElMessage.success(`同步成功！${result.uploaded} 条数据已上传，已切换为云端模式`)
    } else {
      ElMessage.info(`同步完成：成功 ${result.uploaded} 条，失败 ${result.failed} 条`)
      if (result.failed > 0 && result.failures.length > 0) {
        console.warn('同步失败详情:', result.failures)
      }
    }
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('同步失败：' + (e.message || '未知错误'))
    }
  }
}

function handleLogout() {
  logout()
  currentPage.value = 'workbench'
}

defineExpose({ openAddTaskDialog })
</script>

<style>
.login-wrapper {
  width: 100%;
  height: 100%;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  margin-top: 8px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.2s;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
}

:root {
  --spacing-xs: 8px;
  --spacing-sm: 16px;
  --spacing-md: 24px;
  --spacing-lg: 32px;
  
  --font-base: 14px;
  --font-sm: 13px;
  --font-xs: 12px;
  --font-title: 18px;
  --font-stat: 26px;
  
  --sidebar-width: 240px;
  --sidebar-gap: 20px;
  
  --card-padding: 20px;
  --card-gap-h: 16px;
  --card-gap-v: 24px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: var(--font-base);
  line-height: 1.6;
  color: #303133;
  overflow-x: hidden;
}

.app-container {
  display: flex;
  height: 100%;
}

.sidebar {
  width: var(--sidebar-width);
  flex-shrink: 0;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

.sidebar-header {
  padding: var(--spacing-md);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 600;
}

.logo svg {
  width: 28px;
  height: 28px;
  color: #409EFF;
}

.nav-menu {
  flex: 1;
  padding: var(--spacing-sm) 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.nav-menu::-webkit-scrollbar {
  width: 4px;
}

.nav-menu::-webkit-scrollbar-track {
  background: transparent;
}

.nav-menu::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 18px;
  height: 34px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 15px;
  line-height: 34px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.nav-item.active {
  background: rgba(64, 158, 255, 0.25);
  border-left: 3px solid #409EFF;
}

.nav-item.sub-item {
  padding-left: calc(18px + 22px);
  font-size: 14px;
}

.nav-item svg {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
}

.nav-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.05);
  margin: var(--spacing-sm) 0;
}

.nav-group {
  margin-bottom: 5px;
}

.nav-group-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 22px;
  height: 38px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.2s;
  color: rgba(255, 255, 255, 0.9);
}

.nav-group-header:hover {
  background: rgba(255, 255, 255, 0.05);
}

.group-icon {
  transition: transform 0.2s;
  font-size: 10px;
}

.group-icon.rotated {
  transform: rotate(180deg);
}

.nav-group-items {
  background: rgba(0, 0, 0, 0.2);
}

.sidebar-footer {
  padding: var(--spacing-md);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: var(--spacing-md);
}

.user-detail {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
}

.user-role {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar svg {
  width: 20px;
  height: 20px;
}

.local-mode-section {
  padding: 10px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.local-mode-switch {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
}

.mode-label {
  min-width: 24px;
  text-align: center;
  font-weight: 500;
}

.sync-buttons {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  justify-content: center;
}

.sync-table-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 10px;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  margin-bottom: 10px;
}

.sync-table-list .el-checkbox {
  margin-right: 0;
}

.local-mode-warning {
  background: #fdf6ec;
  border-bottom: 1px solid #faecd8;
  padding: 8px 16px;
  animation: slideDown 0.3s ease;
}

.warning-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.warning-icon {
  font-size: 18px;
}

.warning-text {
  color: #e6a23c;
  font-size: 13px;
  font-weight: 500;
  flex: 1;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  overflow: hidden;
  margin-left: var(--sidebar-gap);
}

.top-toolbar {
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-md);
}

.toolbar-left {
  display: flex;
  gap: var(--spacing-sm);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.view-select {
  width: 120px;
}

.customer-tab-bar {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 var(--spacing-md);
  flex-shrink: 0;
}

.customer-tab-bar .el-tabs--card > .el-tabs__header .el-tabs__item {
  font-weight: 500;
}

.customer-tab-bar .el-tabs--card > .el-tabs__header .el-tabs__item.is-active {
  background: #ecf5ff;
  color: #409eff;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--spacing-md);
  min-width: 0;
}

.page-content::-webkit-scrollbar {
  width: 6px;
}

.page-content::-webkit-scrollbar-track {
  background: #f5f7fa;
}

.page-content::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

.ai-tips {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: #f5f7fa;
  border-radius: 4px;
}

.tip-item {
  font-size: var(--font-xs);
  color: #909399;
}

@media (max-width: 768px) {
  .sidebar {
    width: 60px;
  }
  .sidebar-header span, .nav-item span, .sidebar-footer span, .nav-group-header span {
    display: none;
  }
  .sidebar-header, .nav-item, .nav-group-header, .sidebar-footer {
    padding: 10px;
    justify-content: center;
  }
  .nav-item.active {
    border-left: none;
    background: rgba(64, 158, 255, 0.3);
  }
  .nav-item.sub-item {
    padding-left: 10px;
  }
}

.el-dialog {
  z-index: 9999 !important;
}

.el-dialog__wrapper {
  z-index: 9998 !important;
}

.el-input__wrapper {
  box-shadow: none !important;
  background: #ffffff !important;
  border: 1px solid #dcdfe6 !important;
}

.el-input__inner {
  z-index: 1000 !important;
  background: #ffffff !important;
  color: #303133 !important;
  border: none !important;
}

.el-select__wrapper {
  box-shadow: none !important;
  background: #ffffff !important;
}

.el-date-editor {
  z-index: 1000 !important;
  background: #ffffff !important;
}

.el-textarea__inner {
  z-index: 1000 !important;
  background: #ffffff !important;
  color: #303133 !important;
}

.el-form-item__label {
  z-index: 1000 !important;
  color: #606266 !important;
}

.el-form-item__content {
  z-index: 1000 !important;
}

.el-button {
  z-index: 1000 !important;
}

.el-dialog__body {
  z-index: 1000 !important;
}

.el-dialog__header {
  z-index: 1000 !important;
}
</style>