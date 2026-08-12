<template>
  <div class="daily-work">
    <el-tabs v-model="activeTab" type="card" @tab-remove="handleTabRemove">
      <el-tab-pane 
        v-for="tab in tabs" 
        :key="tab.name" 
        :label="tab.label" 
        :name="tab.name"
        :closable="tab.closable"
      >
        <div class="tab-content">
          <div v-if="tab.type === 'todo'" class="kanban-container">
            <div class="tag-filter-bar">
              <span class="filter-label">标签筛选：</span>
              <div class="tag-filter-list">
                <span 
                  :class="['filter-tag', { active: !selectedTag }]" 
                  @click="selectedTag = ''"
                >全部</span>
                <span 
                  v-for="tag in store.tags" 
                  :key="tag.id"
                  :class="['filter-tag', { active: selectedTag === tag.id }]"
                  :style="{ 
                    backgroundColor: selectedTag === tag.id ? tag.color : tag.color + '20', 
                    color: tag.color 
                  }"
                  @click="selectedTag = tag.id"
                >{{ tag.label }}</span>
              </div>
              <div class="tag-filter-actions">
                <el-button size="small" type="primary" @click="openCategoryManageDialog">管理分类</el-button>
              </div>
            </div>
            <div class="category-scroll-container">
              <div class="category-scroll-wrapper">
                <div 
                  v-for="category in visibleCategories" 
                  :key="category.id"
                  :class="['category-tab', { active: currentCategory === category.id }]"
                  @click="currentCategory = category.id"
                >
                  <span class="category-label">{{ category.label }}</span>
                  <span class="category-count">{{ getColumnTodos(category.id).length }}</span>
                  <el-button size="small" @click.stop="openAddTodo(category.id)">+</el-button>
                </div>
              </div>
            </div>
            <div v-for="category in visibleCategories" :key="category.id" class="kanban-column">
              <div class="column-header">
                <span class="column-title">{{ category.label }}</span>
                <span class="column-count">{{ getColumnTodos(category.id).length }}</span>
                <el-button size="small" @click="openAddTodo(category.id)">+</el-button>
              </div>
              <div class="todo-list" @dragover.prevent @drop="handleDrop($event, category.id)">
                <div 
                  v-for="todo in getColumnTodos(category.id)" 
                  :key="todo.id" 
                  class="todo-card"
                  :class="{ completed: todo.completed }"
                  draggable="true"
                  @dragstart="handleDragStart($event, todo)"
                  @click="openEditTodo(todo)"
                >
                  <div class="todo-header">
                    <span class="todo-category">{{ getCategoryLabel(todo.category) }}</span>
                    <div class="todo-actions">
                      <el-button 
                        size="small" 
                        :type="todo.completed ? 'default' : 'success'" 
                        @click.stop="toggleTodo(todo)"
                      >
                        {{ todo.completed ? '已完成' : '完成' }}
                      </el-button>
                    </div>
                  </div>
                  <div class="todo-content" :class="{ completed: todo.completed }">
                    {{ todo.content }}
                  </div>
                  <div v-if="todo.tags && todo.tags.length > 0" class="todo-tags">
                    <span 
                      v-for="tagId in todo.tags" 
                      :key="tagId" 
                      class="todo-tag"
                      :style="{ backgroundColor: getTagColor(tagId) + '20', color: getTagColor(tagId) }"
                    >
                      {{ getTagLabel(tagId) }}
                    </span>
                  </div>
                  <div class="todo-meta">
                    <span v-if="todo.customer" class="meta-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      {{ todo.customer }}
                    </span>
                    <span v-if="todo.model" class="meta-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                        <line x1="12" y1="18" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                      {{ todo.model }}
                    </span>
                  </div>
                  <div class="todo-footer">
                    <span :class="getDeadlineClass(todo)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {{ todo.deadline }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="tab.type === 'report'" class="report-container">
            <div class="report-header">
              <el-date-picker v-model="weekDate" type="date" placeholder="选择日期" />
              <el-button type="primary" @click="generateWeeklyReport">生成周报数据</el-button>
              <el-button @click="copyReport">复制周报文本</el-button>
              <el-button @click="exportReport">导出Excel</el-button>
            </div>
            <div class="report-content">
              <div class="report-section">
                <h3>本周新增客户（{{ weeklyData.newCustomers.length }}人）</h3>
                <div v-if="weeklyData.newCustomers.length > 0">
                  <el-table :data="weeklyData.newCustomers" border stripe>
                    <el-table-column prop="name" label="客户名称" />
                    <el-table-column prop="region" label="国家" />
                    <el-table-column prop="email" label="邮箱" />
                  </el-table>
                </div>
                <p v-else class="empty-text">本周无新增客户</p>
              </div>
              <div class="report-section">
                <h3>寄样记录（{{ weeklyData.sampleDeliveries.length }}次）</h3>
                <div v-if="weeklyData.sampleDeliveries.length > 0">
                  <el-table :data="weeklyData.sampleDeliveries" border stripe>
                    <el-table-column prop="customerName" label="客户名称" />
                    <el-table-column prop="model" label="机型" />
                    <el-table-column prop="quantity" label="数量" />
                    <el-table-column prop="sendDate" label="寄样日期" />
                  </el-table>
                </div>
                <p v-else class="empty-text">本周无寄样记录</p>
              </div>
              <div class="report-section">
                <h3>订单进度（{{ weeklyData.salesOrders.length }}单）</h3>
                <div v-if="weeklyData.salesOrders.length > 0">
                  <el-table :data="weeklyData.salesOrders" border stripe>
                    <el-table-column prop="id" label="订单编号" />
                    <el-table-column prop="customerName" label="客户名称" />
                    <el-table-column prop="model" label="机型" />
                    <el-table-column prop="status" label="状态">
                      <template #default="{ row }">{{ getOrderStatusLabel(row.status) }}</template>
                    </el-table-column>
                  </el-table>
                </div>
                <p v-else class="empty-text">本周无订单</p>
              </div>
              <div class="report-section">
                <h3>待办事项</h3>
                <div v-if="weeklyData.todos.length > 0">
                  <el-table :data="weeklyData.todos" border stripe>
                    <el-table-column prop="content" label="内容" />
                    <el-table-column prop="completed" label="状态">
                      <template #default="{ row }">{{ row.completed ? '已完成' : '未完成' }}</template>
                    </el-table-column>
                  </el-table>
                </div>
                <p v-else class="empty-text">本周无待办事项</p>
              </div>
              <div class="report-section">
                <h3>下周计划</h3>
                <el-input v-model="weeklyData.nextWeekPlan" type="textarea" :rows="4" placeholder="输入下周工作计划" />
              </div>
            </div>
          </div>

          <div v-else-if="tab.type === 'map'" class="map-container">
            <div class="map-header">
              <el-button type="primary" @click="handleAddMapRecord">新增线索</el-button>
              <el-button @click="downloadImportTemplate">下载导入模板</el-button>
              <el-button @click="triggerExcelImport">导入Excel</el-button>
              <input ref="excelFileInput" type="file" accept=".xlsx,.xls" style="display:none" @change="handleExcelImport" />
            </div>
            <div class="map-search">
              <el-input v-model="mapKeyword" placeholder="搜索客户姓名、邮箱" clearable />
            </div>
            <el-table :data="filteredMapRecords" border stripe>
              <el-table-column prop="customerName" label="客户姓名" />
              <el-table-column prop="location" label="地理位置" />
              <el-table-column prop="phone" label="联系电话" />
              <el-table-column prop="email" label="邮箱" />
              <el-table-column prop="source" label="来源" />
              <el-table-column prop="collectDate" label="采集日期" />
              <el-table-column label="操作" width="120">
                <template #default="{ row }">
                  <el-button size="small" @click="handleEditMapRecord(row)">编辑</el-button>
                  <el-button size="small" type="danger" @click="handleDeleteMapRecord(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div v-else-if="tab.type === 'cert'" class="cert-container">
            <div class="cert-header">
              <el-button type="primary" @click="handleAddCert">新增证书进度</el-button>
              <el-button type="success" @click="exportCerts">导出Excel</el-button>
            </div>
            <div class="cert-search">
              <el-select v-model="certFilterModel" placeholder="选择机型" clearable style="width: 200px">
                <el-option v-for="m in store.productModels" :key="m.id" :label="m.name" :value="m.name" />
              </el-select>
              <el-select v-model="certFilterType" placeholder="选择认证类型" clearable style="width: 200px">
                <el-option label="CE" value="CE" />
                <el-option label="CB" value="CB" />
                <el-option label="SASO" value="SASO" />
                <el-option label="FCC" value="FCC" />
                <el-option label="ROHS" value="ROHS" />
              </el-select>
              <el-select v-model="certFilterStatus" placeholder="选择状态" clearable style="width: 200px">
                <el-option label="进行中" value="in_progress" />
                <el-option label="待审核" value="pending_review" />
                <el-option label="已完成" value="completed" />
                <el-option label="已过期" value="expired" />
              </el-select>
            </div>
            <el-table :data="filteredCerts" border stripe>
              <el-table-column prop="model" label="机型" />
              <el-table-column prop="certType" label="认证类型">
                <template #default="{ row }">
                  <el-tag :type="getCertTypeTagType(row.certType)">{{ row.certType }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="certNo" label="证书编号" />
              <el-table-column prop="issuingAuthority" label="发证机构" />
              <el-table-column prop="startDate" label="开始日期" />
              <el-table-column prop="expireDate" label="到期日期">
                <template #default="{ row }">
                  <span :class="getExpireClass(row)">{{ row.expireDate }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态">
                <template #default="{ row }">
                  <el-tag :type="getCertStatusTagType(row.status)">{{ getCertStatusLabel(row.status) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="progress" label="进度" width="120">
                <template #default="{ row }">
                  <el-progress :percentage="row.progress" :color="getProgressColor(row.progress)" />
                </template>
              </el-table-column>
              <el-table-column prop="responsible" label="负责人" />
              <el-table-column prop="notes" label="备注" />
              <el-table-column label="操作" width="150">
                <template #default="{ row }">
                  <el-button size="small" @click="handleEditCert(row)">编辑</el-button>
                  <el-button size="small" type="danger" @click="handleDeleteCert(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div v-else-if="tab.type === 'letter'" class="letter-container">
            <div class="letter-header">
              <el-button type="primary" @click="handleAddLetter">新增开发信</el-button>
              <el-button @click="previewLetters">预览</el-button>
              <el-button @click="exportLetters">导出Excel</el-button>
            </div>
            <div class="letter-search">
              <el-input v-model="letterKeyword" placeholder="搜索客户姓名、主题" clearable />
            </div>
            <el-table :data="filteredLetters" border stripe>
              <el-table-column prop="subject" label="主题" />
              <el-table-column prop="customerName" label="客户姓名" />
              <el-table-column prop="email" label="邮箱" />
              <el-table-column prop="sendDate" label="发送日期" />
              <el-table-column prop="status" label="状态">
                <template #default="{ row }">{{ getLetterStatusLabel(row.status) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="120">
                <template #default="{ row }">
                  <el-button size="small" @click="handleEditLetter(row)">编辑</el-button>
                  <el-button size="small" type="danger" @click="handleDeleteLetter(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div v-else-if="tab.type === 'reminder'" class="reminder-container">
            <div class="search-bar" style="display: flex; gap: 10px; align-items: center; margin-bottom: 15px;">
              <el-button type="primary" @click="handleAddReminder">新增待办</el-button>
              <el-button @click="exportReminders">导出Excel</el-button>
              <span v-if="reminderPermission !== 'granted'" style="color: #e6a23c; font-size: 13px;">
                桌面通知未开启，
                <el-button link type="primary" @click="requestNotifyPermission">点击开启</el-button>
              </span>
              <span v-else style="color: #67c23a; font-size: 13px;">✓ 桌面通知已开启</span>
            </div>
            <el-table :data="filteredDailyReminders" border stripe>
              <el-table-column prop="title" label="任务标题" min-width="200" show-overflow-tooltip />
              <el-table-column label="关联业务" width="120">
                <template #default="{ row }">{{ getBusinessLabel(row.businessType) }}</template>
              </el-table-column>
              <el-table-column label="关联激活配置" width="180">
                <template #default="{ row }">{{ getActivateConfigLabel(row.activateConfigId) }}</template>
              </el-table-column>
              <el-table-column prop="remindTime" label="提醒时间" width="90" />
              <el-table-column label="重复规则" width="160">
                <template #default="{ row }">{{ getRepeatLabel(row.repeatRule, row) }}</template>
              </el-table-column>
              <el-table-column label="任务状态" width="90">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'completed' ? 'success' : 'warning'" size="small">
                    {{ row.status === 'completed' ? '已完成' : '待办' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
              <el-table-column label="操作" width="220" fixed="right">
                <template #default="{ row }">
                  <el-button size="small" @click="handleEditReminder(row)">编辑</el-button>
                  <el-button size="small" type="success" :disabled="row.status === 'completed'" @click="markReminderDone(row)">完成</el-button>
                  <el-button size="small" type="danger" @click="handleDeleteReminder(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div v-else class="custom-tab-content">
            <p>自定义标签内容</p>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <div class="tab-management">
      <el-button @click="openTabManageDialog">管理标签</el-button>
    </div>
    
    <el-dialog 
      v-model="showTabManageDialog" 
      title="管理标签" 
      width="550px"
      :close-on-click-modal="false"
      @open="onTabManageDialogOpen"
      @close="onTabManageDialogClose"
    >
      <div class="tab-manage-content">
        <div class="add-tab-row">
          <el-form :model="tagForm" class="add-tab-form">
            <el-form-item :error="tagFormError" class="add-tab-input-item">
              <el-input 
                v-model="tagForm.label" 
                placeholder="输入新标签名称" 
                @keyup.enter="addTag"
                @input="onTagNameInput"
                clearable
              />
            </el-form-item>
            <el-form-item class="add-tab-btn-item">
              <el-button 
                type="primary" 
                @click="addTag"
                :disabled="isAddButtonDisabled"
              >新增标签</el-button>
            </el-form-item>
          </el-form>
          <p class="tab-tip">标签名称仅支持英文、数字、下划线，其他字符将自动过滤</p>
        </div>
        
        <div class="tag-list">
          <div v-for="(tag, index) in tagList" :key="tag.id" class="tag-item">
            <div class="tag-color-dot" :style="{ backgroundColor: tag.color }"></div>
            <div v-if="editingTag?.id !== tag.id" class="tag-info">
              <span class="tag-label">{{ tag.label }}</span>
              <span class="tag-name">/{{ tag.name }}</span>
            </div>
            <el-form :model="editingTag" inline v-else>
              <el-form-item :error="editTagError">
                <el-input 
                  v-model="editingTag.label" 
                  style="width: 180px" 
                  @keyup.enter="saveEditTag"
                  @input="onEditTagNameInput"
                  autofocus
                />
              </el-form-item>
            </el-form>
            <div class="tag-actions">
              <el-button size="small" @click="editTag(tag)" v-if="editingTag?.id !== tag.id">编辑</el-button>
              <el-button size="small" type="primary" @click="saveEditTag" v-else>保存</el-button>
              <el-button size="small" type="danger" @click="deleteTagItem(tag)">删除</el-button>
            </div>
          </div>
          <div v-if="tagList.length === 0" class="empty-tag">
            暂无自定义标签，点击上方按钮新增
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showTabManageDialog = false">关闭</el-button>
      </template>
    </el-dialog>
    
    <el-dialog 
      v-model="showCategoryManageDialog" 
      title="管理分类" 
      width="550px"
      :close-on-click-modal="false"
    >
      <div class="category-manage-content">
        <div class="add-category-row">
          <el-form :model="categoryForm" class="add-category-form">
            <el-form-item :error="categoryFormError" class="add-category-input-item">
              <el-input 
                v-model="categoryForm.label" 
                placeholder="输入新分类名称" 
                @keyup.enter="addCategory"
                @input="onCategoryNameInput"
                clearable
              />
            </el-form-item>
            <el-form-item class="add-category-btn-item">
              <el-button 
                type="primary" 
                @click="addCategory"
                :disabled="isAddCategoryButtonDisabled"
              >新增分类</el-button>
            </el-form-item>
          </el-form>
          <p class="category-tip">分类名称仅支持英文、数字、下划线，其他字符将自动过滤</p>
        </div>
        
        <div class="category-list">
          <div v-for="cat in visibleCategories" :key="cat.id" class="category-item">
            <div v-if="editingCategory?.id !== cat.id" class="category-info">
              <span class="category-label">{{ cat.label }}</span>
              <span class="category-name">/{{ cat.name }}</span>
            </div>
            <el-form :model="editingCategory" inline v-else>
              <el-form-item :error="editCategoryError">
                <el-input 
                  v-model="editingCategory.label" 
                  style="width: 180px" 
                  @keyup.enter="saveEditCategory"
                  @input="onEditCategoryNameInput"
                  autofocus
                />
              </el-form-item>
            </el-form>
            <div class="category-actions">
              <el-button size="small" @click="editCategory(cat)" v-if="editingCategory?.id !== cat.id">编辑</el-button>
              <el-button size="small" type="primary" @click="saveEditCategory" v-else>保存</el-button>
              <el-button size="small" type="danger" @click="deleteCategoryItem(cat)">删除</el-button>
            </div>
          </div>
          <div v-if="visibleCategories.length === 0" class="empty-category">
            暂无自定义分类，点击上方按钮新增
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showCategoryManageDialog = false">关闭</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showTodoDialog" :title="isEditingTodo ? '编辑待办' : '新增待办'" width="500px">
      <el-form :model="todoForm" label-width="80px">
        <el-form-item label="内容描述">
          <el-input v-model="todoForm.content" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="todoForm.category">
            <el-option v-for="cat in visibleCategories" :key="cat.id" :label="cat.label" :value="cat.id" />
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
        <el-form-item label="标签">
          <el-select v-model="todoForm.tags" multiple style="width: 100%">
            <el-option v-for="tag in store.tags" :key="tag.id" :label="tag.label" :value="tag.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="附件">
          <FileUploader
            v-if="todoForm.id"
            module-type="task"
            :module-id="todoForm.id"
            :module-name="todoForm.content"
            v-model="todoForm.attachments"
          />
          <div v-else class="upload-disabled">
            <el-alert type="info" :closable="false" show-icon>
              请先保存待办，然后才能上传附件
            </el-alert>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTodoDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmTodo">确定</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showLetterDialog" :title="isEditingLetter ? '编辑开发信' : '新增开发信'" width="600px">
      <el-form :model="letterForm" label-width="100px">
        <el-form-item label="主题">
          <el-input v-model="letterForm.subject" />
        </el-form-item>
        <el-form-item label="客户姓名">
          <el-select v-model="letterForm.customerName" filterable>
            <el-option label="请选择" value="" />
            <el-option v-for="c in store.customers" :key="c.id" :label="c.name" :value="c.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户邮箱">
          <el-input v-model="letterForm.email" />
        </el-form-item>
        <el-form-item label="发送日期">
          <el-date-picker v-model="letterForm.sendDate" type="date" />
        </el-form-item>
        <el-form-item label="发送状态">
          <el-select v-model="letterForm.status">
            <el-option label="草稿" value="draft" />
            <el-option label="已发送" value="sent" />
            <el-option label="已回复" value="replied" />
            <el-option label="无回复" value="no_reply" />
          </el-select>
        </el-form-item>
        <el-form-item label="邮件内容">
          <el-input v-model="letterForm.content" type="textarea" :rows="8" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showLetterDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmLetter">确定</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showLetterPreviewDialog" title="开发信存档库预览" width="900px" :close-on-click-modal="false">
      <div class="preview-container">
        <div class="preview-header">
          <h2>开发信存档库</h2>
          <p>{{ new Date().toLocaleDateString('zh-CN') }}</p>
        </div>
        <div class="preview-table">
          <table>
            <thead>
              <tr>
                <th>主题</th>
                <th>客户姓名</th>
                <th>邮箱</th>
                <th>发送日期</th>
                <th>状态</th>
                <th>内容</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="l in filteredLetters" :key="l.id">
                <td>{{ l.subject || '-' }}</td>
                <td>{{ l.customerName || '-' }}</td>
                <td>{{ l.email || '-' }}</td>
                <td>{{ l.sendDate || '-' }}</td>
                <td>{{ getLetterStatusLabel(l.status) }}</td>
                <td class="preview-content-cell">{{ l.content || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="preview-summary">
          <span>共 {{ filteredLetters.length }} 条记录</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="showLetterPreviewDialog = false">关闭</el-button>
        <el-button type="primary" @click="exportLetters">导出Excel</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showCertDialog" :title="isEditingCert ? '编辑证书进度' : '新增证书进度'" width="600px">
      <el-form :model="certForm" label-width="120px">
        <el-form-item label="机型">
          <el-select v-model="certForm.model" filterable>
            <el-option v-for="m in store.productModels" :key="m.id" :label="m.name" :value="m.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="认证类型">
          <el-select v-model="certForm.certType">
            <el-option label="CE" value="CE" />
            <el-option label="CB" value="CB" />
            <el-option label="SASO" value="SASO" />
            <el-option label="FCC" value="FCC" />
            <el-option label="ROHS" value="ROHS" />
          </el-select>
        </el-form-item>
        <el-form-item label="证书编号">
          <el-input v-model="certForm.certNo" />
        </el-form-item>
        <el-form-item label="发证机构">
          <el-input v-model="certForm.issuingAuthority" />
        </el-form-item>
        <el-form-item label="开始日期">
          <el-date-picker v-model="certForm.startDate" type="date" />
        </el-form-item>
        <el-form-item label="到期日期">
          <el-date-picker v-model="certForm.expireDate" type="date" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="certForm.status">
            <el-option label="进行中" value="in_progress" />
            <el-option label="待审核" value="pending_review" />
            <el-option label="已完成" value="completed" />
            <el-option label="已过期" value="expired" />
          </el-select>
        </el-form-item>
        <el-form-item label="进度">
          <el-input-number v-model="certForm.progress" :min="0" :max="100" />
          <el-progress :percentage="certForm.progress" :color="getProgressColor(certForm.progress)" style="margin-left: 10px" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="certForm.responsible" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="certForm.notes" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCertDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmCert">确定</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showMapRecordDialog" :title="isEditingMapRecord ? '编辑线索' : '新增线索'" width="500px">
      <el-form :model="mapRecordForm" label-width="100px">
        <el-form-item label="客户姓名">
          <el-input v-model="mapRecordForm.customerName" />
        </el-form-item>
        <el-form-item label="地理位置">
          <el-input v-model="mapRecordForm.location" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="mapRecordForm.phone" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="mapRecordForm.email" />
        </el-form-item>
        <el-form-item label="来源">
          <el-input v-model="mapRecordForm.source" />
        </el-form-item>
        <el-form-item label="采集日期">
          <el-date-picker v-model="mapRecordForm.collectDate" type="date" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showMapRecordDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmMapRecord">确定</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showImportResultDialog" title="导入结果" width="500px">
      <div class="import-result">
        <div class="result-stats">
          <div class="stat-item success">
            <span class="stat-value">{{ importResult.success }}</span>
            <span class="stat-label">成功</span>
          </div>
          <div class="stat-item danger">
            <span class="stat-value">{{ importResult.failed }}</span>
            <span class="stat-label">失败</span>
          </div>
          <div class="stat-item warning">
            <span class="stat-value">{{ importResult.duplicate }}</span>
            <span class="stat-label">重复</span>
          </div>
        </div>
        <div v-if="importResult.failed > 0" class="failed-list">
          <h4>失败记录</h4>
          <el-table :data="importResult.failedRecords" border stripe max-height="200">
            <el-table-column prop="rowIndex" label="行号" width="60" />
            <el-table-column prop="customerName" label="客户姓名" />
            <el-table-column prop="email" label="邮箱" />
            <el-table-column prop="error" label="错误原因" />
          </el-table>
          <el-button @click="exportFailedRecords" type="primary" style="margin-top: 10px">导出失败数据</el-button>
        </div>
      </div>
      <template #footer>
        <el-button @click="showImportResultDialog = false">关闭</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showReminderDialog" :title="isEditingReminder ? '编辑待办提醒' : '新增待办提醒'" width="550px">
      <el-form :model="reminderForm" label-width="110px">
        <el-form-item label="任务标题">
          <el-input v-model="reminderForm.title" placeholder="请输入待办内容，例如：每月底提交彩盒审核情况" />
        </el-form-item>
        <el-form-item label="关联业务">
          <el-select v-model="reminderForm.businessType" placeholder="请选择">
            <el-option label="待办" value="todo" />
            <el-option label="客户" value="customer" />
            <el-option label="订单" value="order" />
            <el-option label="产品" value="product" />
            <el-option label="证书" value="certificate" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联机型">
          <el-select v-model="reminderForm.activateConfigId" placeholder="请选择" clearable filterable>
            <el-option v-for="m in store.productModels" :key="m.id" :label="m.name" :value="m.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="提醒时间">
          <el-input v-model="reminderForm.remindTime" placeholder="HH:mm" style="width: 120px;" />
        </el-form-item>
        <el-form-item label="重复规则">
          <el-select v-model="reminderForm.repeatRule" @change="onReminderRepeatRuleChange">
            <el-option label="不重复" value="once" />
            <el-option label="每天" value="daily" />
            <el-option label="工作日" value="workday" />
            <el-option label="每周" value="weekly" />
            <el-option label="每月" value="monthly" />
            <el-option label="每年" value="yearly" />
          </el-select>
        </el-form-item>
        <template v-if="reminderForm.repeatRule === 'weekly'">
          <el-form-item label="重复周几">
            <el-select v-model="reminderForm.customWeekdays" multiple collapse-tags collapse-tags-tooltip placeholder="请选择重复的星期" style="width: 100%;">
              <el-option label="周一" :value="1" />
              <el-option label="周二" :value="2" />
              <el-option label="周三" :value="3" />
              <el-option label="周四" :value="4" />
              <el-option label="周五" :value="5" />
              <el-option label="周六" :value="6" />
              <el-option label="周日" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item label="">
            <span style="margin-right: 10px;">每</span>
            <el-input-number v-model="reminderForm.recurrenceInterval" :min="1" :max="52" />
            <span style="margin-left: 5px;">周重复一次</span>
          </el-form-item>
        </template>
        <template v-if="reminderForm.repeatRule === 'monthly'">
          <el-form-item label="每月第">
            <el-select v-model="reminderForm.customMonthday">
              <el-option v-for="i in 31" :key="i" :label="i + '日'" :value="i" />
            </el-select>
            <span style="margin-left: 10px;">每</span>
            <el-input-number v-model="reminderForm.recurrenceInterval" :min="1" :max="24" style="margin-left: 5px;" />
            <span style="margin-left: 5px;">月</span>
          </el-form-item>
        </template>
        <el-form-item label="截止日期">
          <el-date-picker v-model="reminderForm.deadline" type="date" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="reminderForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReminderDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmReminder">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { store, addDailyTodoItem, updateDailyTodoItem, deleteDailyTodoItem, addTag as addTagStore, updateTag, deleteTag, getTags, addTodoCategory, updateTodoCategory, deleteTodoCategory, getTodoCategories, generateId, addDailyReminder, updateDailyReminder, deleteDailyReminder } from '../store.js'
import { exportToExcel } from '../utils/excelExport.js'
import FileUploader from './FileUploader.vue'
import { sanitizePathSegment } from '../utils/common.js'
import { syncToSupabase, fetchFromSupabase } from '../supabase.js'

const props = defineProps({
  currentSubPage: {
    type: String,
    default: 'todo'
  }
})

const excelFileInput = ref(null)

const showImportResultDialog = ref(false)
const importResult = reactive({
  success: 0,
  failed: 0,
  duplicate: 0,
  failedRecords: []
})

const activeTab = ref(props.currentSubPage || 'todo')

watch(() => props.currentSubPage, (newVal) => {
  if (newVal && activeTab.value !== newVal) {
    activeTab.value = newVal
  }
}, { immediate: true })
const weekDate = ref(new Date().toISOString().split('T')[0])
const letterKeyword = ref('')
const mapKeyword = ref('')

const showTodoDialog = ref(false)
const showLetterDialog = ref(false)
const showLetterPreviewDialog = ref(false)
const showMapRecordDialog = ref(false)

const isEditingTodo = ref(false)
const isEditingLetter = ref(false)
const isEditingMapRecord = ref(false)

const todoForm = reactive({
  id: '',
  content: '',
  category: 'sample',
  customer: '',
  model: '',
  deadline: '',
  completed: false,
  attachments: [],
  tags: []
})

const letterForm = reactive({
  id: '',
  subject: '',
  customerName: '',
  email: '',
  sendDate: new Date().toISOString().split('T')[0],
  status: 'draft',
  content: ''
})

const mapRecordForm = reactive({
  id: '',
  customerName: '',
  location: '',
  phone: '',
  email: '',
  source: '',
  collectDate: new Date().toISOString().split('T')[0]
})

const currentDragTodo = ref(null)
const currentColumnKey = ref('')
const selectedTag = ref('')
const currentCategory = ref('cat1')

const reminderPermission = ref(
  typeof Notification !== 'undefined' ? Notification.permission : 'default'
)
const showReminderDialog = ref(false)
const isEditingReminder = ref(false)
const reminderForm = reactive({
  id: '',
  title: '',
  businessType: 'todo',
  activateConfigId: '',
  remindTime: '09:00',
  repeatRule: 'once',
  recurrenceInterval: 1,
  customWeekdays: [1],
  customMonthday: 1,
  deadline: '',
  remark: ''
})

const visibleCategories = computed(() => {
  return store.todoCategories
    .filter(c => typeof c === 'object' && c !== null && !c.isDefault)
    .map(c => ({
      id: c.id || '',
      name: c.name || '',
      label: c.label || c.name || '未命名分类'
    }))
})

const filteredDailyReminders = computed(() => {
  return store.dailyReminders || []
})

const defaultTabs = [
  { name: 'todo', label: '当日待办看板', closable: false, type: 'todo' },
  { name: 'cert', label: '证书进度跟进', closable: false, type: 'cert' },
  { name: 'report', label: '周报自动生成', closable: false, type: 'report' },
  { name: 'map', label: '客户线索采集', closable: false, type: 'map' },
  { name: 'letter', label: '开发信存档库', closable: false, type: 'letter' },
  { name: 'reminder', label: '每日待办清单', closable: false, type: 'reminder' }
]

const customTabs = ref([])

const tabs = computed(() => {
  return [...defaultTabs, ...customTabs.value]
})

const showTabManageDialog = ref(false)
const tagList = computed(() => store.tags)
const editingTag = ref(null)

const tagForm = reactive({
  label: ''
})

const tagFormError = ref('')
const editTagError = ref('')

const isAddButtonDisabled = computed(() => {
  const cleaned = cleanTagName(tagForm.label)
  return !cleaned || !cleaned.trim()
})

const showCategoryManageDialog = ref(false)
const editingCategory = ref(null)

const categoryForm = reactive({
  label: ''
})

const categoryFormError = ref('')
const editCategoryError = ref('')

const isAddCategoryButtonDisabled = computed(() => {
  const cleaned = cleanCategoryName(categoryForm.label)
  return !cleaned || !cleaned.trim()
})

function cleanCategoryName(name) {
  return sanitizePathSegment(name)
}

function onCategoryNameInput() {
  const cleaned = cleanCategoryName(categoryForm.label)
  if (cleaned !== categoryForm.label) {
    if (!cleaned && categoryForm.label) {
      categoryFormError.value = '分类名称不能仅包含中文或特殊符号'
    } else {
      categoryForm.label = cleaned
      categoryFormError.value = ''
    }
  } else {
    categoryFormError.value = ''
  }
}

function onEditCategoryNameInput() {
  if (editingCategory.value) {
    const cleaned = cleanCategoryName(editingCategory.value.label)
    if (cleaned !== editingCategory.value.label) {
      if (!cleaned && editingCategory.value.label) {
        editCategoryError.value = '分类名称不能仅包含中文或特殊符号'
      } else {
        editingCategory.value.label = cleaned
        editCategoryError.value = ''
      }
    } else {
      editCategoryError.value = ''
    }
  }
}

function openCategoryManageDialog() {
  categoryForm.label = ''
  categoryFormError.value = ''
  editingCategory.value = null
  editCategoryError.value = ''
  showCategoryManageDialog.value = true
}

function addCategory() {
  const cleanedName = cleanCategoryName(categoryForm.label).trim()
  
  if (!cleanedName) {
    categoryFormError.value = '分类名称不能为空或仅包含特殊字符'
    return
  }
  
  const exists = store.todoCategories.find(c => c.name === cleanedName.toLowerCase())
  if (exists) {
    categoryFormError.value = '该分类已存在，请更换名称'
    return
  }
  
  addTodoCategory({
    name: cleanedName.toLowerCase(),
    label: cleanedName
  })
  
  categoryForm.label = ''
  categoryFormError.value = ''
  
  ElMessage.success('分类新增成功')
}

function editCategory(cat) {
  editingCategory.value = { ...cat }
  editCategoryError.value = ''
}

function saveEditCategory() {
  if (!editingCategory.value) return
  
  const cleanedName = cleanCategoryName(editingCategory.value.label).trim()
  
  if (!cleanedName) {
    editCategoryError.value = '分类名称不能为空或仅包含特殊字符'
    return
  }
  
  const exists = store.todoCategories.find(c => c.name === cleanedName.toLowerCase() && c.id !== editingCategory.value.id)
  if (exists) {
    editCategoryError.value = '该分类已存在，请更换名称'
    return
  }
  
  updateTodoCategory(editingCategory.value.id, {
    name: cleanedName.toLowerCase(),
    label: cleanedName
  })
  
  editingCategory.value = null
  editCategoryError.value = ''
  
  ElMessage.success('分类修改成功')
}

function deleteCategoryItem(cat) {
  ElMessageBox.confirm(
    '删除后该分类下所有待办将移动至默认分类，确认删除？',
    '确认删除',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(() => {
    const result = deleteTodoCategory(cat.id)
    if (result.success) {
      ElMessage.success('分类删除成功')
    } else {
      ElMessage.error(result.error)
    }
  }).catch(() => {})
}

function validateTagName(name) {
  const trimmed = name.trim()
  
  if (!trimmed) {
    return { valid: false, message: '请填写标签名称后再提交' }
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return { valid: false, message: '标签名称仅支持英文、数字、下划线' }
  }
  
  return { valid: true, message: '' }
}

function cleanTagName(name) {
  return sanitizePathSegment(name)
}

function onTagNameInput() {
  const cleaned = cleanTagName(tagForm.label)
  if (cleaned !== tagForm.label) {
    if (!cleaned && tagForm.label) {
      tagFormError.value = '标签名称不能仅包含中文或特殊符号'
    } else {
      tagForm.label = cleaned
      tagFormError.value = ''
    }
  } else {
    tagFormError.value = ''
  }
}

function onEditTagNameInput() {
  if (editingTag.value) {
    const cleaned = cleanTagName(editingTag.value.label)
    if (cleaned !== editingTag.value.label) {
      editingTag.value.label = cleaned
    }
    editTagError.value = ''
  }
}

function onTabManageDialogOpen() {
  try {
    tagForm.label = ''
    tagFormError.value = ''
    editingTag.value = null
    editTagError.value = ''
  } catch (error) {
    console.error('Tag manage dialog open error:', error)
    showTabManageDialog.value = false
    alert('弹窗加载异常，请刷新页面重试')
  }
}

function onTabManageDialogClose() {
  tagForm.label = ''
  tagFormError.value = ''
  editingTag.value = null
  editTagError.value = ''
}

function loadCustomTabs() {
  const saved = localStorage.getItem('dailywork_custom_tabs')
  if (saved) {
    try {
      customTabs.value = JSON.parse(saved)
    } catch (e) {
      console.error('Failed to parse custom tabs:', e)
      customTabs.value = []
    }
  }
}

function openTabManageDialog() {
  try {
    showTabManageDialog.value = true
  } catch (error) {
    console.error('Failed to open tag manage dialog:', error)
    alert('弹窗加载异常，请刷新页面重试')
  }
}

function addTag() {
  try {
    const cleanedName = cleanTagName(tagForm.label).trim()
    
    if (!cleanedName) {
      tagFormError.value = '标签名称不能为空或仅包含特殊字符'
      return
    }
    
    const result = addTagStore({
      name: cleanedName.toLowerCase(),
      label: cleanedName
    })
    
    tagForm.label = ''
    tagFormError.value = ''
    
    ElMessage.success('标签新增成功')
  } catch (error) {
    console.error('Add tag error:', error)
    alert('操作异常，请刷新页面重试')
  }
}

function editTag(tag) {
  try {
    editingTag.value = { ...tag }
    editTagError.value = ''
  } catch (error) {
    console.error('Edit tag error:', error)
    alert('操作异常，请刷新页面重试')
  }
}

function saveEditTag() {
  try {
    if (!editingTag.value) {
      return
    }
    
    const validation = validateTagName(editingTag.value.label)
    
    if (!validation.valid) {
      editTagError.value = validation.message
      return
    }
    
    const cleanedName = editingTag.value.label.trim()
    
    updateTag(editingTag.value.id, {
      name: cleanedName.toLowerCase(),
      label: cleanedName
    })
    
    editingTag.value = null
    editTagError.value = ''
    
    ElMessage.success('标签修改成功')
  } catch (error) {
    console.error('Save edit tag error:', error)
    alert('操作异常，请刷新页面重试')
  }
}

function deleteTagItem(tag) {
  try {
    ElMessageBox.confirm(
      `确定删除标签「${tag.label}」吗？关联数据会取消绑定。`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    ).then(() => {
      deleteTag(tag.id)
      
      ElMessage.success('标签删除成功')
    }).catch(() => {
      ElMessage.info('已取消删除')
    })
  } catch (error) {
    console.error('Delete tag error:', error)
    alert('操作异常，请刷新页面重试')
  }
}

loadCustomTabs()

const mapRecords = ref([
  { id: '1', customerName: 'Hans', location: '德国柏林', phone: '+49 xxx', email: 'hans@xxx.com', source: 'Google搜索', collectDate: '2024-01-15' },
  { id: '2', customerName: 'Ethan', location: '美国纽约', phone: '+1 xxx', email: 'ethan@xxx.com', source: 'LinkedIn', collectDate: '2024-01-16' },
  { id: '3', customerName: 'Jason', location: '澳大利亚悉尼', phone: '+61 xxx', email: 'jason@xxx.com', source: '行业展会', collectDate: '2024-01-17' }
])

// ===== 开发信存档持久化（本地 + Supabase 同步） =====
const LETTERS_STORAGE_KEY = 'daily_work_letters'
const EMAIL_LETTERS_TABLE = 'email_letters'
let supabaseSyncing = false // 防止循环触发

function loadLettersFromStorage() {
  try {
    const saved = localStorage.getItem(LETTERS_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (e) {
    console.warn('[开发信] 本地加载存档失败:', e)
  }
  // 默认示例数据
  return [
    { id: '1', subject: '关于产品询价', customerName: 'Hans', email: 'hans@xxx.com', sendDate: '2024-01-15', status: 'replied', content: '尊敬的Hans先生：\n\n您好！感谢您对我司产品的关注...' },
    { id: '2', subject: '样品寄送确认', customerName: 'Ethan', email: 'ethan@xxx.com', sendDate: '2024-01-16', status: 'sent', content: '尊敬的Ethan先生：\n\n样品已寄出，运单号：SF123456789...' }
  ]
}

function saveLettersToStorage() {
  try {
    localStorage.setItem(LETTERS_STORAGE_KEY, JSON.stringify(letters.value))
  } catch (e) {
    console.warn('[开发信] 本地保存存档失败:', e)
  }
}

const letters = ref(loadLettersFromStorage())

// 从 Supabase 加载开发信
async function loadLettersFromSupabase() {
  if (store.localMode) return // 本地模式跳过
  try {
    const { data, error } = await fetchFromSupabase(EMAIL_LETTERS_TABLE)
    if (error) {
      console.warn('[开发信] 从Supabase加载失败:', error)
      return
    }
    if (data && Array.isArray(data) && data.length > 0) {
      // 将数据库字段映射回前端字段
      const mapped = data.map(row => ({
        id: row.id,
        subject: row.subject || '',
        customerName: row.customer_name || '',
        email: row.email || '',
        sendDate: row.send_date || '',
        status: row.status || 'draft',
        content: row.content || '',
        tags: row.tags ? (typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags) : []
      }))
      supabaseSyncing = true
      letters.value = mapped
      saveLettersToStorage()
      console.log(`[开发信] 从Supabase加载 ${mapped.length} 条记录`)
    }
  } catch (e) {
    console.warn('[开发信] 从Supabase加载异常:', e)
  }
}

// 同步单条记录到 Supabase
async function syncLetterToSupabase(letter) {
  if (store.localMode) return
  try {
    const data = {
      id: letter.id,
      subject: letter.subject || '',
      customer_name: letter.customerName || '',
      email: letter.email || '',
      send_date: letter.sendDate || '',
      status: letter.status || 'draft',
      content: letter.content || '',
      tags: letter.tags ? JSON.stringify(letter.tags) : '[]'
    }
    const result = await syncToSupabase(EMAIL_LETTERS_TABLE, data)
    if (!result.success) {
      console.warn('[开发信] 同步到Supabase失败:', result.error)
    }
  } catch (e) {
    console.warn('[开发信] 同步到Supabase异常:', e)
  }
}

// 监听 letters 变化自动保存（本地 + Supabase）
watch(letters, (newVal, oldVal) => {
  saveLettersToStorage()
  if (!supabaseSyncing && !store.localMode) {
    // 逐条同步变更的记录
    if (Array.isArray(newVal) && Array.isArray(oldVal)) {
      newVal.forEach(letter => {
        const oldLetter = oldVal.find(l => l.id === letter.id)
        if (!oldLetter || JSON.stringify(letter) !== JSON.stringify(oldLetter)) {
          syncLetterToSupabase(letter)
        }
      })
    }
  }
  supabaseSyncing = false
}, { deep: true })

const certs = ref([
  { id: 'cert1', model: 'E7 Elite', certType: 'CE', certNo: 'CE-2026-E7001', issuingAuthority: 'TUV', startDate: '2026-01-15', expireDate: '2031-01-15', status: 'completed', progress: 100, responsible: '张三', notes: '已完成认证' },
  { id: 'cert2', model: 'E7 Elite', certType: 'CB', certNo: 'CB-2026-E7001', issuingAuthority: 'TUV', startDate: '2026-02-01', expireDate: '2031-02-01', status: 'completed', progress: 100, responsible: '张三', notes: '已完成认证' },
  { id: 'cert3', model: 'NE75', certType: 'CE', certNo: 'CE-2026-NE7501', issuingAuthority: 'BSI', startDate: '2026-03-01', expireDate: '2031-03-01', status: 'in_progress', progress: 75, responsible: '李四', notes: '正在进行最终测试' },
  { id: 'cert4', model: 'NE75', certType: 'FCC', certNo: 'FCC-2026-NE7501', issuingAuthority: 'FCC', startDate: '2026-04-01', expireDate: '2029-04-01', status: 'pending_review', progress: 85, responsible: '李四', notes: '等待审核结果' },
  { id: 'cert5', model: 'NE76', certType: 'CE', certNo: 'CE-2026-NE7601', issuingAuthority: 'TUV', startDate: '2026-05-01', expireDate: '2031-05-01', status: 'in_progress', progress: 45, responsible: '王五', notes: '文档准备中' },
  { id: 'cert6', model: 'NE76', certType: 'ROHS', certNo: 'ROHS-2026-NE7601', issuingAuthority: 'SGS', startDate: '2026-06-01', expireDate: '2031-06-01', status: 'in_progress', progress: 30, responsible: '王五', notes: '材料检测中' },
  { id: 'cert7', model: 'MTK6500', certType: 'CE', certNo: 'CE-2024-MTK001', issuingAuthority: 'TUV', startDate: '2024-01-01', expireDate: '2029-01-01', status: 'completed', progress: 100, responsible: '张三', notes: '证书有效' },
  { id: 'cert8', model: 'MTK6500', certType: 'SASO', certNo: 'SASO-2024-MTK001', issuingAuthority: 'SASO', startDate: '2024-02-01', expireDate: '2025-02-01', status: 'expired', progress: 100, responsible: '张三', notes: '证书已过期，需续期' }
])

const certFilterModel = ref('')
const certFilterType = ref('')
const certFilterStatus = ref('')

const showCertDialog = ref(false)
const isEditingCert = ref(false)
const certForm = reactive({
  id: '',
  model: '',
  certType: 'CE',
  certNo: '',
  issuingAuthority: '',
  startDate: '',
  expireDate: '',
  status: 'in_progress',
  progress: 0,
  responsible: '',
  notes: ''
})

const filteredCerts = computed(() => {
  return certs.value.filter(c => {
    const matchModel = !certFilterModel.value || c.model === certFilterModel.value
    const matchType = !certFilterType.value || c.certType === certFilterType.value
    const matchStatus = !certFilterStatus.value || c.status === certFilterStatus.value
    return matchModel && matchType && matchStatus
  })
})

const filteredLetters = computed(() => {
  return letters.value.filter(l => 
    !letterKeyword.value || 
    l.customerName.toLowerCase().includes(letterKeyword.value.toLowerCase()) ||
    l.subject.toLowerCase().includes(letterKeyword.value.toLowerCase())
  )
})

const filteredMapRecords = computed(() => {
  return mapRecords.value.filter(r => 
    !mapKeyword.value ||
    r.customerName.toLowerCase().includes(mapKeyword.value.toLowerCase()) ||
    r.email.toLowerCase().includes(mapKeyword.value.toLowerCase())
  )
})

const weeklyData = reactive({
  newCustomers: [],
  sampleDeliveries: [],
  salesOrders: [],
  todos: [],
  nextWeekPlan: ''
})

function getColumnTodos(categoryId) {
  try {
    if (!store.dailyTodos || !Array.isArray(store.dailyTodos)) return []
    return store.dailyTodos.filter(t => {
      if (!t || typeof t !== 'object') return false
      const matchCategory = t.category === categoryId
      const matchTag = !selectedTag.value || (t.tags && Array.isArray(t.tags) && t.tags.includes(selectedTag.value))
      return matchCategory && matchTag
    })
  } catch (e) {
    console.error('getColumnTodos error:', e)
    return []
  }
}

function getCategoryLabel(category) {
  try {
    const cat = store.todoCategories.find(c => typeof c === 'object' && c !== null && (c.id === category || c.name === category))
    return cat ? (cat.label || cat.name || '未命名分类') : (category || '未命名分类')
  } catch (e) {
    return category || '未命名分类'
  }
}

function getTagLabel(tagId) {
  const tag = store.tags.find(t => t.id === tagId)
  return tag ? tag.label : tagId
}

function getTagColor(tagId) {
  const tag = store.tags.find(t => t.id === tagId)
  return tag ? tag.color : '#909399'
}

function getDeadlineClass(todo) {
  if (!todo.deadline) return ''
  const today = new Date()
  const deadline = new Date(todo.deadline)
  const diffDays = Math.floor((deadline - today) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'deadline-overdue'
  if (diffDays === 0) return 'deadline-today'
  if (diffDays <= 3) return 'deadline-urgent'
  return ''
}

function getOrderStatusLabel(status) {
  const labels = { pending: '待确认', confirmed: '已确认', shipped: '已出货', signed: '已签收', completed: '已完成', in_progress: '进行中' }
  return labels[status] || status
}

function getLetterStatusLabel(status) {
  const labels = { draft: '草稿', sent: '已发送', replied: '已回复', no_reply: '无回复' }
  return labels[status] || status
}

function getCertTypeTagType(type) {
  const types = { CE: 'primary', CB: 'success', SASO: 'warning', FCC: 'info', ROHS: 'danger' }
  return types[type] || 'info'
}

function getExpireClass(row) {
  if (!row.expireDate) return ''
  const expire = new Date(row.expireDate)
  const today = new Date()
  const diffDays = Math.floor((expire - today) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'expired'
  if (diffDays <= 30) return 'expiring-30'
  if (diffDays <= 90) return 'expiring-90'
  return 'normal'
}

function getCertStatusTagType(status) {
  const types = { in_progress: 'primary', pending_review: 'warning', completed: 'success', expired: 'danger' }
  return types[status] || 'info'
}

function getCertStatusLabel(status) {
  const labels = { in_progress: '进行中', pending_review: '待审核', completed: '已完成', expired: '已过期' }
  return labels[status] || status
}

function getProgressColor(progress) {
  if (progress >= 80) return '#52c41a'
  if (progress >= 50) return '#409EFF'
  if (progress >= 30) return '#e6a23c'
  return '#f56c6c'
}

function handleAddCert() {
  isEditingCert.value = false
  Object.assign(certForm, {
    id: '',
    model: '',
    certType: 'CE',
    certNo: '',
    issuingAuthority: '',
    startDate: new Date().toISOString().split('T')[0],
    expireDate: '',
    status: 'in_progress',
    progress: 0,
    responsible: '',
    notes: ''
  })
  showCertDialog.value = true
}

function handleEditCert(row) {
  isEditingCert.value = true
  Object.assign(certForm, row)
  showCertDialog.value = true
}

function handleDeleteCert(row) {
  if (confirm(`确定删除证书 ${row.certNo} 吗？`)) {
    const idx = certs.value.findIndex(c => c.id === row.id)
    if (idx > -1) {
      certs.value.splice(idx, 1)
    }
  }
}

function confirmCert() {
  if (!certForm.model || !certForm.certType || !certForm.certNo) {
    alert('请填写机型、认证类型和证书编号')
    return
  }
  
  if (isEditingCert.value) {
    const idx = certs.value.findIndex(c => c.id === certForm.id)
    if (idx > -1) {
      certs.value[idx] = { ...certForm }
    }
  } else {
    certForm.id = generateId('cert')
    certs.value.push({ ...certForm })
  }
  
  showCertDialog.value = false
}

function exportCerts() {
  const headers = ['机型', '认证类型', '证书编号', '发证机构', '开始日期', '到期日期', '状态', '进度(%)', '负责人', '备注']
  const data = filteredCerts.value.map(c => [
    c.model,
    c.certType,
    c.certNo,
    c.issuingAuthority,
    c.startDate,
    c.expireDate,
    getCertStatusLabel(c.status),
    c.progress,
    c.responsible,
    c.notes || ''
  ])
  exportToExcel('证书进度跟进', headers, data)
}

function handleDragStart(event, todo) {
  currentDragTodo.value = todo
  currentColumnKey.value = todo.category
}

function handleDrop(event, targetCategory) {
  if (currentDragTodo.value && currentColumnKey.value !== targetCategory) {
    currentDragTodo.value.category = targetCategory
    updateDailyTodoItem(currentDragTodo.value.id, { category: targetCategory })
  }
  currentDragTodo.value = null
  currentColumnKey.value = ''
}

function openAddTodo(category) {
  try {
    isEditingTodo.value = false
    Object.assign(todoForm, {
      id: '',
      content: '',
      category: category,
      customer: '',
      model: '',
      deadline: new Date().toISOString().split('T')[0],
      completed: false,
      attachments: [],
      tags: []
    })
    showTodoDialog.value = true
  } catch (error) {
    console.error('Open todo dialog error:', error)
    alert('弹窗加载异常，请刷新页面重试')
  }
}

function openEditTodo(todo) {
  try {
    isEditingTodo.value = true
    Object.assign(todoForm, {
      id: todo.id,
      content: todo.content,
      category: todo.category,
      customer: todo.customer || '',
      model: todo.model || '',
      deadline: todo.deadline || '',
      completed: todo.completed || false,
      attachments: todo.attachments || [],
      tags: todo.tags || []
    })
    showTodoDialog.value = true
  } catch (error) {
    console.error('Open todo dialog error:', error)
    alert('弹窗加载异常，请刷新页面重试')
  }
}

function toggleTodo(todo) {
  try {
    updateDailyTodoItem(todo.id, { completed: !todo.completed })
  } catch (error) {
    console.error('Toggle todo error:', error)
    alert('操作异常，请刷新页面重试')
  }
}

function confirmTodo() {
  try {
    if (!todoForm.content.trim()) {
      alert('请填写待办内容')
      return
    }
    if (isEditingTodo.value) {
      updateDailyTodoItem(todoForm.id, {
        content: todoForm.content,
        category: todoForm.category,
        customerId: todoForm.customer,
        modelId: todoForm.model,
        deadline: todoForm.deadline,
        completed: todoForm.completed,
        attachments: todoForm.attachments,
        tags: todoForm.tags
      })
      ElMessage.success('待办修改成功')
    } else {
      addDailyTodoItem({
        content: todoForm.content,
        category: todoForm.category,
        customerId: todoForm.customer,
        modelId: todoForm.model,
        deadline: todoForm.deadline,
        attachments: todoForm.attachments,
        tags: todoForm.tags
      })
      ElMessage.success('待办新增成功')
    }
    showTodoDialog.value = false
  } catch (error) {
    console.error('Confirm todo error:', error)
    alert('操作异常，请刷新页面重试')
  }
}

function formatWeekDate() {
  const date = new Date(weekDate.value)
  const startOfWeek = new Date(date)
  startOfWeek.setDate(date.getDate() - date.getDay() + 1)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  
  return `${startOfWeek.getFullYear()}年${startOfWeek.getMonth() + 1}月${startOfWeek.getDate()}日 - ${endOfWeek.getMonth() + 1}月${endOfWeek.getDate()}日`
}

function generateWeeklyReport() {
  const date = new Date(weekDate.value)
  const startOfWeek = new Date(date)
  startOfWeek.setDate(date.getDate() - date.getDay() + 1)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  
  const startStr = startOfWeek.toISOString().split('T')[0]
  const endStr = endOfWeek.toISOString().split('T')[0]
  
  weeklyData.newCustomers = store.customers.filter(c => 
    c.firstContactDate >= startStr && c.firstContactDate <= endStr
  )
  
  weeklyData.sampleDeliveries = store.sampleDeliveries.filter(s => 
    s.sendDate >= startStr && s.sendDate <= endStr
  ).map(s => {
    const customer = store.customers.find(c => c.id === s.customerId)
    return {
      ...s,
      customerName: customer ? customer.name : '',
      quantity: s.sampleQty
    }
  })
  
  weeklyData.salesOrders = store.salesOrders.filter(o => 
    o.bookingDate >= startStr && o.bookingDate <= endStr
  ).map(o => {
    const customer = store.customers.find(c => c.id === o.customerId)
    return {
      ...o,
      customerName: customer ? customer.name : ''
    }
  })
  
  weeklyData.todos = store.dailyTodos.filter(t => 
    t.deadline >= startStr && t.deadline <= endStr
  )
  
  weeklyData.nextWeekPlan = ''
}

function copyReport() {
  const reportText = `工作周报 - ${formatWeekDate()}\n\n` +
    `一、本周新增客户（${weeklyData.newCustomers.length}人）\n` +
    weeklyData.newCustomers.map(c => `- ${c.name} - ${c.region}`).join('\n') + '\n\n' +
    `二、寄样记录（${weeklyData.sampleDeliveries.length}次）\n` +
    weeklyData.sampleDeliveries.map(s => `- ${s.customerName} - ${s.model} - ${s.quantity}台`).join('\n') + '\n\n' +
    `三、订单进度（${weeklyData.salesOrders.length}单）\n` +
    weeklyData.salesOrders.map(o => `- ${o.id} - ${o.customerName} - ${getOrderStatusLabel(o.status)}`).join('\n') + '\n\n' +
    `四、待办事项\n` +
    weeklyData.todos.map(t => `- ${t.content}${t.completed ? ' (已完成)' : ''}`).join('\n') + '\n\n' +
    `五、下周计划\n${weeklyData.nextWeekPlan}`
  
  navigator.clipboard.writeText(reportText).then(() => {
    alert('已复制到剪贴板')
  })
}

function exportReport() {
  const headers = ['类型', '详情']
  const data = []
  
  data.push(['本周新增客户', weeklyData.newCustomers.length + '人'])
  weeklyData.newCustomers.forEach(c => {
    data.push(['', `${c.name} - ${c.region} - ${c.email}`])
  })
  
  data.push(['寄样记录', weeklyData.sampleDeliveries.length + '次'])
  weeklyData.sampleDeliveries.forEach(s => {
    data.push(['', `${s.customerName} - ${s.model} - ${s.quantity}台 - ${s.sendDate}`])
  })
  
  data.push(['订单进度', weeklyData.salesOrders.length + '单'])
  weeklyData.salesOrders.forEach(o => {
    data.push(['', `${o.id} - ${o.customerName} - ${getOrderStatusLabel(o.status)}`])
  })
  
  data.push(['待办事项', ''])
  weeklyData.todos.forEach(t => {
    data.push(['', `${t.content}${t.completed ? ' (已完成)' : ''}`])
  })
  
  data.push(['下周计划', weeklyData.nextWeekPlan])
  
  exportToExcel('工作周报', headers, data)
}

function handleAddLetter() {
  try {
    isEditingLetter.value = false
    Object.assign(letterForm, {
      id: '',
      subject: '',
      customerName: '',
      email: '',
      sendDate: new Date().toISOString().split('T')[0],
      status: 'draft',
      content: ''
    })
    showLetterDialog.value = true
  } catch (error) {
    console.error('Open letter dialog error:', error)
    alert('弹窗加载异常，请刷新页面重试')
  }
}

function handleEditLetter(row) {
  try {
    isEditingLetter.value = true
    Object.assign(letterForm, row)
    showLetterDialog.value = true
  } catch (error) {
    console.error('Open letter dialog error:', error)
    alert('弹窗加载异常，请刷新页面重试')
  }
}

function handleDeleteLetter(row) {
  try {
    ElMessageBox.confirm(
      '确定删除该开发信吗？此操作不可恢复。',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      const idx = letters.value.findIndex(l => l.id === row.id)
      if (idx > -1) {
        letters.value.splice(idx, 1)
        ElMessage.success('删除成功')
      }
    }).catch(() => {})
  } catch (error) {
    console.error('Delete letter error:', error)
    alert('操作异常，请刷新页面重试')
  }
}

function confirmLetter() {
  try {
    if (!letterForm.subject.trim() || !letterForm.content.trim()) {
      alert('请填写主题和邮件内容')
      return
    }
    
    if (isEditingLetter.value) {
      const idx = letters.value.findIndex(l => l.id === letterForm.id)
      if (idx > -1) {
        letters.value[idx] = { ...letterForm }
        ElMessage.success('修改成功')
      }
    } else {
      letterForm.id = Date.now().toString()
      letters.value.unshift({ ...letterForm })
      ElMessage.success('新增成功')
    }
    showLetterDialog.value = false
  } catch (error) {
    console.error('Confirm letter error:', error)
    alert('操作异常，请刷新页面重试')
  }
}

function previewLetters() {
  showLetterPreviewDialog.value = true
}

function exportLetters() {
  const headers = ['主题', '客户姓名', '邮箱', '发送日期', '状态', '内容']
  const data = filteredLetters.value.map(l => [
    l.subject || '',
    l.customerName || '',
    l.email || '',
    l.sendDate || '',
    getLetterStatusLabel(l.status),
    l.content || ''
  ])
  exportToExcel('开发信存档库', headers, data)
}

function handleAddMapRecord() {
  try {
    isEditingMapRecord.value = false
    Object.assign(mapRecordForm, {
      id: '',
      customerName: '',
      location: '',
      phone: '',
      email: '',
      source: '',
      collectDate: new Date().toISOString().split('T')[0]
    })
    showMapRecordDialog.value = true
  } catch (error) {
    console.error('Open map record dialog error:', error)
    alert('弹窗加载异常，请刷新页面重试')
  }
}

function handleEditMapRecord(row) {
  try {
    isEditingMapRecord.value = true
    Object.assign(mapRecordForm, row)
    showMapRecordDialog.value = true
  } catch (error) {
    console.error('Open map record dialog error:', error)
    alert('弹窗加载异常，请刷新页面重试')
  }
}

function handleDeleteMapRecord(row) {
  try {
    ElMessageBox.confirm(
      '确定删除该线索吗？此操作不可恢复。',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      const idx = mapRecords.value.findIndex(r => r.id === row.id)
      if (idx > -1) {
        mapRecords.value.splice(idx, 1)
        ElMessage.success('删除成功')
      }
    }).catch(() => {})
  } catch (error) {
    console.error('Delete map record error:', error)
    alert('操作异常，请刷新页面重试')
  }
}

function confirmMapRecord() {
  try {
    if (!mapRecordForm.customerName.trim()) {
      alert('请填写客户姓名')
      return
    }
    
    if (isEditingMapRecord.value) {
      const idx = mapRecords.value.findIndex(r => r.id === mapRecordForm.id)
      if (idx > -1) {
        mapRecords.value[idx] = { ...mapRecordForm }
        ElMessage.success('修改成功')
      }
    } else {
      mapRecordForm.id = Date.now().toString()
      mapRecords.value.unshift({ ...mapRecordForm })
      ElMessage.success('新增成功')
    }
    showMapRecordDialog.value = false
  } catch (error) {
    console.error('Confirm map record error:', error)
    alert('操作异常，请刷新页面重试')
  }
}

function downloadImportTemplate() {
  const headers = ['客户姓名', '地理位置', '联系电话', '邮箱', '来源', '采集日期']
  const data = [
    ['John Smith', '美国纽约', '+1 234 567 890', 'john@example.com', 'Google搜索', '2024-01-15'],
    ['Hans Mueller', '德国柏林', '+49 123 456 789', 'hans@example.com', 'LinkedIn', '2024-01-16']
  ]
  exportToExcel('客户线索导入模板', headers, data)
}

function triggerExcelImport() {
  excelFileInput.value?.click()
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validatePhone(phone) {
  const phoneRegex = /^[+]?[0-9\s\-()]{6,20}$/
  return phoneRegex.test(phone)
}

async function handleExcelImport(event) {
  const file = event.target.files[0]
  if (!file) return

  try {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result)
      const xlsx = await import('xlsx')
      const workbook = xlsx.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = xlsx.utils.sheet_to_json(worksheet)

      const emailSet = new Set(mapRecords.value.map(r => r.email.toLowerCase()))
      const successRecords = []
      const failedRecords = []
      let duplicateCount = 0

      jsonData.forEach((row, index) => {
        const errors = []
        
        const customerName = (row['客户姓名'] || row['姓名'] || '').toString().trim()
        const location = (row['地理位置'] || row['地址'] || row['位置'] || '').toString().trim()
        const phone = (row['联系电话'] || row['电话'] || row['手机'] || '').toString().trim()
        const email = (row['邮箱'] || row['email'] || '').toString().trim().toLowerCase()
        const source = (row['来源'] || row['渠道'] || '').toString().trim() || 'Excel导入'
        const collectDate = (row['采集日期'] || row['日期'] || new Date().toISOString().split('T')[0]).toString().trim()

        if (!customerName) errors.push('客户姓名必填')
        if (!email) errors.push('邮箱必填')
        else if (!validateEmail(email)) errors.push('邮箱格式错误')
        
        if (phone && !validatePhone(phone)) errors.push('电话格式错误')

        if (emailSet.has(email)) {
          duplicateCount++
        } else if (errors.length > 0) {
          failedRecords.push({
            rowIndex: index + 2,
            customerName,
            email,
            error: errors.join('; ')
          })
        } else {
          successRecords.push({
            id: Date.now().toString() + index,
            customerName,
            location,
            phone,
            email,
            source,
            collectDate
          })
        }
      })

      mapRecords.value.push(...successRecords)

      importResult.success = successRecords.length
      importResult.failed = failedRecords.length
      importResult.duplicate = duplicateCount
      importResult.failedRecords = failedRecords

      showImportResultDialog.value = true
    }
    reader.readAsArrayBuffer(file)
  } catch (error) {
    alert(`导入失败：${error.message}`)
  }

  event.target.value = ''
}

function exportFailedRecords() {
  const headers = ['行号', '客户姓名', '邮箱', '错误原因']
  const data = importResult.failedRecords.map(r => [r.rowIndex, r.customerName, r.email, r.error])
  exportToExcel('导入失败数据', headers, data)
}

function handleAddReminder() {
  isEditingReminder.value = false
  Object.assign(reminderForm, {
    id: '',
    title: '',
    businessType: 'todo',
    activateConfigId: '',
    remindTime: '09:00',
    repeatRule: 'once',
    recurrenceInterval: 1,
    customWeekdays: [1],
    customMonthday: 1,
    deadline: '',
    remark: ''
  })
  showReminderDialog.value = true
}

function handleEditReminder(row) {
  isEditingReminder.value = true
  const weekDays = row.customWeekdays || (row.customWeekday !== undefined ? [row.customWeekday] : [1])
  Object.assign(reminderForm, {
    id: row.id,
    title: row.title,
    businessType: row.businessType || 'todo',
    activateConfigId: row.activateConfigId || '',
    remindTime: row.remindTime || '09:00',
    repeatRule: row.repeatRule || 'once',
    recurrenceInterval: row.recurrenceInterval || 1,
    customWeekdays: weekDays,
    customMonthday: row.customMonthday || 1,
    deadline: row.deadline || '',
    remark: row.remark || ''
  })
  showReminderDialog.value = true
}

function handleDeleteReminder(row) {
  ElMessageBox.confirm(
    '确定删除该待办提醒吗？此操作不可恢复。',
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    deleteDailyReminder(row.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

function markReminderDone(row) {
  updateDailyReminder(row.id, { status: 'completed' })
  ElMessage.success('已标记为完成')
}

function confirmReminder() {
  if (!reminderForm.title.trim()) {
    alert('请填写任务标题')
    return
  }
  
  const data = {
    title: reminderForm.title,
    businessType: reminderForm.businessType,
    activateConfigId: reminderForm.activateConfigId,
    remindTime: reminderForm.remindTime,
    repeatRule: reminderForm.repeatRule,
    recurrenceInterval: reminderForm.recurrenceInterval,
    customWeekdays: reminderForm.customWeekdays,
    customMonthday: reminderForm.customMonthday,
    deadline: reminderForm.deadline,
    remark: reminderForm.remark
  }
  
  if (isEditingReminder.value) {
    updateDailyReminder(reminderForm.id, data)
    ElMessage.success('修改成功')
  } else {
    addDailyReminder(data)
    ElMessage.success('新增成功')
  }
  showReminderDialog.value = false
}

function onReminderRepeatRuleChange() {
  if (reminderForm.repeatRule === 'weekly') {
    if (!reminderForm.customWeekdays || reminderForm.customWeekdays.length === 0) {
      reminderForm.customWeekdays = [1]
    }
  } else if (reminderForm.repeatRule === 'monthly') {
    if (!reminderForm.customMonthday) reminderForm.customMonthday = 1
  }
}

function requestNotifyPermission() {
  if (typeof Notification === 'undefined') {
    alert('您的浏览器不支持桌面通知')
    return
  }
  Notification.requestPermission().then(permission => {
    reminderPermission.value = permission
    if (permission === 'granted') {
      ElMessage.success('桌面通知已开启')
    } else {
      ElMessage.warning('桌面通知未开启')
    }
  })
}

function getBusinessLabel(type) {
  const labels = {
    todo: '待办',
    customer: '客户',
    order: '订单',
    product: '产品',
    certificate: '证书',
    other: '其他'
  }
  return labels[type] || type || '-'
}

function getActivateConfigLabel(id) {
  if (!id) return '-'
  const model = store.productModels.find(m => m.id === id || m.name === id)
  return model ? model.name : id
}

function getRepeatLabel(rule, row) {
  const labels = {
    once: '不重复',
    daily: '每天',
    workday: '工作日',
    weekly: '每周',
    monthly: '每月',
    yearly: '每年'
  }
  if (rule === 'weekly' && row) {
    const weekDays = row.customWeekdays || (row.customWeekday !== undefined ? [row.customWeekday] : [])
    const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    if (weekDays.length > 0) {
      const names = weekDays.map(d => weekNames[d] || ('周' + d)).join('、')
      const interval = row.recurrenceInterval || 1
      return `每${interval}周的${names}`
    }
    return '每周'
  }
  if (rule === 'monthly' && row) {
    const interval = row.recurrenceInterval || 1
    const day = row.customMonthday || 1
    return `每${interval}月${day}日`
  }
  return labels[rule] || rule || '-'
}

function exportReminders() {
  const headers = ['任务标题', '关联业务', '关联机型', '提醒时间', '重复规则', '状态', '备注']
  const data = filteredDailyReminders.value.map(r => [
    r.title || '',
    getBusinessLabel(r.businessType),
    getActivateConfigLabel(r.activateConfigId),
    r.remindTime || '',
    getRepeatLabel(r.repeatRule, r),
    r.status === 'completed' ? '已完成' : '待办',
    r.remark || ''
  ])
  exportToExcel('待办提醒清单', headers, data)
}

watch(() => store.dailyTodos, () => {}, { deep: true })

// 组件挂载时从 Supabase 加载开发信
onMounted(async () => {
  await loadLettersFromSupabase()
})
</script>

<style scoped>
.daily-work {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tab-content {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
  height: calc(100% - 60px);
  overflow-y: auto;
}

.kanban-container {
  display: flex;
  gap: 20px;
  height: 100%;
}

.kanban-column {
  flex: 1;
  background: #f5f7fa;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  min-width: 280px;
}

.column-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  border-bottom: 1px solid #e4e7ed;
}

.column-title {
  font-weight: 600;
}

.tag-filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 15px;
  background: #fafafa;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 15px;
}

.tag-filter-actions {
  margin-left: auto;
}

.filter-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.tag-filter-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-tag {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: #f0f0f0;
  color: #606266;
}

.filter-tag:hover {
  opacity: 0.8;
}

.filter-tag.active {
  font-weight: 500;
}

.category-scroll-container {
  overflow-x: auto;
  white-space: nowrap;
  margin-bottom: 15px;
  padding-bottom: 5px;
}

.category-scroll-wrapper {
  display: inline-flex;
  gap: 10px;
  padding: 5px 0;
}

.category-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.category-tab:hover {
  background: #f5f7fa;
}

.category-tab.active {
  background: #ecf5ff;
  border-color: #409EFF;
}

.category-label {
  font-size: 13px;
  font-weight: 500;
}

.category-tab.active .category-label {
  color: #409EFF;
}

.category-manage-btn {
  display: inline-flex;
  align-items: center;
  padding-left: 10px;
  border-left: 1px solid #ebeef5;
  margin-left: 5px;
}

.category-manage-content {
  padding: 15px;
}

.add-category-row {
  margin-bottom: 20px;
}

.add-category-form {
  display: flex;
  align-items: center;
  gap: 12px;
}

.add-category-input-item {
  flex: 1;
  margin-bottom: 0;
}

.add-category-btn-item {
  margin-bottom: 0;
  flex-shrink: 0;
}

.category-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
  margin-bottom: 15px;
  padding-left: 5px;
}

.category-list {
  border-top: 1px solid #e4e7ed;
  padding-top: 15px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #fafafa;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: background-color 0.2s;
}

.category-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-list .category-label {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.category-name {
  font-size: 12px;
  color: #909399;
  font-family: monospace;
}

.category-actions {
  display: flex;
  gap: 5px;
}

.empty-category {
  text-align: center;
  color: #909399;
  padding: 30px;
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
  font-size: 12px;
}

.todo-list {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
}

.todo-card {
  background: #fff;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #ebeef5;
  border-left: 4px solid transparent;
}

.todo-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-color: #409EFF;
}

.todo-card.completed {
  background: #f5f7fa;
  border-left-color: #67C23A;
  opacity: 0.85;
}

.todo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.todo-actions {
  display: flex;
  gap: 8px;
}

.todo-category {
  font-size: 12px;
  padding: 2px 8px;
  background: #ecf5ff;
  color: #409EFF;
  border-radius: 4px;
}

.todo-content {
  font-size: 14px;
  color: #303133;
  margin-bottom: 8px;
}

.todo-content.completed {
  text-decoration: line-through;
  color: #909399;
}

.todo-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.todo-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
}

.todo-meta {
  display: flex;
  gap: 15px;
  margin-bottom: 8px;
}

.meta-item {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
}

.todo-footer {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
}

.deadline-overdue {
  color: #F56C6C;
}

.deadline-today {
  color: #E6A23C;
}

.deadline-urgent {
  color: #E6A23C;
}

.report-container {
  height: 100%;
}

.report-header {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  align-items: center;
}

.report-content {
  height: calc(100% - 60px);
  overflow-y: auto;
}

.report-section {
  margin-bottom: 25px;
  padding: 15px;
  background: #fafafa;
  border-radius: 8px;
}

.report-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #303133;
}

.empty-text {
  color: #909399;
  text-align: center;
  padding: 20px;
}

.map-container {
  height: 100%;
}

.map-header {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  align-items: center;
}

.map-search {
  margin-bottom: 15px;
}

.letter-container {
  height: 100%;
}

.letter-header {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  align-items: center;
}

.letter-search {
  margin-bottom: 15px;
}

.tab-management {
  padding: 10px 20px;
  background: #f5f7fa;
  border-top: 1px solid #e4e7ed;
}

.tab-manage-content {
  padding: 10px;
}

.add-tab {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tab-list {
  max-height: 300px;
  overflow-y: auto;
}

.tab-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.tab-info {
  flex: 1;
}

.tab-actions {
  display: flex;
  gap: 5px;
}

.empty-tab {
  text-align: center;
  color: #909399;
  padding: 20px;
}

.upload-disabled {
  opacity: 0.6;
}

.import-result {
  padding: 10px;
}

.result-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 15px;
  border-radius: 8px;
}

.stat-item.success {
  background: #f0f9eb;
}

.stat-item.success .stat-value {
  color: #67C23A;
}

.stat-item.danger {
  background: #fef0f0;
}

.stat-item.danger .stat-value {
  color: #F56C6C;
}

.stat-item.warning {
  background: #fdf6ec;
}

.stat-item.warning .stat-value {
  color: #E6A23C;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
}

.stat-label {
  display: block;
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.failed-list {
  margin-top: 10px;
}

.custom-tab-content {
  text-align: center;
  padding: 50px;
  color: #909399;
}

.tab-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
  margin-bottom: 15px;
  padding-left: 5px;
}

.tab-manage-content {
  padding: 15px;
}

.add-tab-row {
  margin-bottom: 20px;
}

.add-tab-form {
  display: flex;
  align-items: center;
  gap: 12px;
}

.add-tab-input-item {
  flex: 1;
  margin-bottom: 0;
}

.add-tab-input-item .el-input__wrapper {
  width: 100%;
}

.add-tab-btn-item {
  margin-bottom: 0;
  flex-shrink: 0;
}

.tag-list {
  border-top: 1px solid #e4e7ed;
  padding-top: 15px;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #fafafa;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: background-color 0.2s;
}

.tag-item:hover {
  background: #f5f7fa;
}

.tag-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tag-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tag-label {
  font-size: 14px;
  color: #303133;
}

.tag-name {
  font-size: 12px;
  color: #909399;
  font-family: monospace;
}

.tag-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.empty-tag {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
  font-size: 14px;
  background: #fafafa;
  border-radius: 8px;
}

.preview-container {
  max-height: 500px;
  overflow-y: auto;
}

.preview-header {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #1a1a2e;
}

.preview-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.preview-header p {
  font-size: 14px;
  color: #909399;
  margin: 8px 0 0;
}

.preview-table {
  overflow-x: auto;
}

.preview-table table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.preview-table th,
.preview-table td {
  padding: 12px 15px;
  text-align: left;
  border: 1px solid #d0d0d0;
  font-size: 14px;
  vertical-align: top;
}

.preview-table th {
  background: #1a1a2e;
  color: #fff;
  font-weight: 600;
  white-space: nowrap;
}

.preview-table tbody tr:nth-child(even) {
  background: #fafafa;
}

.preview-table tbody tr:hover {
  background: #f0f5ff;
}

.preview-content-cell {
  max-width: 300px;
  white-space: pre-wrap;
  word-break: break-word;
}

.preview-summary {
  text-align: right;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px dashed #d0d0d0;
  font-size: 14px;
  color: #6b7280;
}
</style>