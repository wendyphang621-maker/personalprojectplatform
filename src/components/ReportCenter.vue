<template>
  <div class="report-center">
    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="月度客户跟进统计" name="customer">
        <div class="tab-content">
          <div class="report-controls">
            <el-date-picker v-model="reportMonth" type="month" placeholder="选择月份" />
            <el-button type="primary" @click="generateCustomerReport">生成报表</el-button>
            <el-button @click="previewCustomerReport">预览</el-button>
            <el-button @click="exportCustomerReport">导出Excel</el-button>
          </div>
          <div v-if="customerReportData.length > 0" class="report-stats">
            <div class="stat-card">
              <div class="stat-value">{{ totalNewCustomers }}</div>
              <div class="stat-label">新增线索数</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ totalSamples }}</div>
              <div class="stat-label">寄样次数</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ totalOrders }}</div>
              <div class="stat-label">成功转化订单</div>
            </div>
            <div class="stat-card warning">
              <div class="stat-value">{{ overdueCustomers }}</div>
              <div class="stat-label">未跟进超15天</div>
            </div>
          </div>
          <el-table v-if="customerReportData.length > 0" :data="customerReportData" border stripe>
            <el-table-column prop="customerName" label="客户姓名" />
            <el-table-column prop="group" label="客户分组" />
            <el-table-column prop="contactDate" label="首次联系" />
            <el-table-column prop="sampleCount" label="寄样次数" width="100" />
            <el-table-column prop="orderCount" label="订单数量" width="100" />
            <el-table-column prop="lastFollowup" label="最后跟进" />
            <el-table-column prop="daysNoFollowup" label="未跟进天数" />
          </el-table>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="月度物流费用汇总" name="logistics">
        <div class="tab-content">
          <div class="report-controls">
            <el-date-picker v-model="logisticsMonth" type="month" placeholder="选择月份" />
            <el-button type="primary" @click="generateLogisticsReport">生成报表</el-button>
            <el-button @click="previewLogisticsReport">预览</el-button>
            <el-button @click="exportLogisticsReport">导出Excel</el-button>
          </div>
          <div v-if="logisticsReportData.length > 0" class="report-stats">
            <div class="stat-card">
              <div class="stat-value">{{ totalFreight }}</div>
              <div class="stat-label">运费支出总计</div>
            </div>
            <div class="stat-card danger">
              <div class="stat-value">{{ unsettledFreight }}</div>
              <div class="stat-label">未结清运费</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ totalPackages }}</div>
              <div class="stat-label">包裹总数</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ avgDeliveryDays }}</div>
              <div class="stat-label">平均运输天数</div>
            </div>
          </div>
          <el-table v-if="logisticsReportData.length > 0" :data="logisticsReportData" border stripe>
            <el-table-column prop="customerName" label="客户姓名" />
            <el-table-column prop="packageCount" label="包裹数量" width="100" />
            <el-table-column prop="freightTotal" label="运费支出" />
            <el-table-column prop="unsettledAmount" label="未结清金额" />
            <el-table-column prop="avgDays" label="平均运输天数" width="120" />
            <el-table-column prop="maxDays" label="最长运输天数" width="120" />
          </el-table>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="机型出货数量统计" name="product">
        <div class="tab-content">
          <div class="report-controls">
            <el-date-picker v-model="productMonth" type="month" placeholder="选择月份" />
            <el-button type="primary" @click="generateProductReport">生成报表</el-button>
            <el-button @click="previewProductReport">预览</el-button>
            <el-button @click="exportProductReport">导出Excel</el-button>
          </div>
          <div v-if="productReportData.length > 0" class="report-stats">
            <div class="stat-card">
              <div class="stat-value">{{ totalShipments }}</div>
              <div class="stat-label">总出货台数</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ totalOrders }}</div>
              <div class="stat-label">订单数量</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ topModel }}</div>
              <div class="stat-label">畅销机型</div>
            </div>
          </div>
          <el-table v-if="productReportData.length > 0" :data="productReportData" border stripe>
            <el-table-column prop="model" label="机型" />
            <el-table-column prop="shipmentCount" label="出货台数" width="100" />
            <el-table-column prop="orderCount" label="订单数" width="100" />
            <el-table-column prop="customers" label="客户列表" />
            <el-table-column prop="firstShipment" label="首次出货" />
            <el-table-column prop="lastShipment" label="最近出货" />
          </el-table>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="合规证书到期预警" name="cert">
        <div class="tab-content">
          <div class="report-controls">
            <el-button type="primary" @click="generateCertReport">刷新预警</el-button>
            <el-button @click="previewCertReport">预览</el-button>
            <el-button @click="exportCertReport">导出Excel</el-button>
          </div>
          <div class="cert-alerts">
            <div v-if="expiring7Days.length > 0" class="alert-item danger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <span>{{ expiring7Days.length }} 个证书7天内到期</span>
            </div>
            <div v-if="expiring30Days.length > 0" class="alert-item warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              <span>{{ expiring30Days.length }} 个证书30天内到期</span>
            </div>
          </div>
          <el-table :data="certReportData" border stripe>
            <el-table-column prop="model" label="机型" />
            <el-table-column prop="certType" label="认证类型">
              <template #default="{ row }">
                <el-tag :type="getCertTypeTagType(row.certType)">{{ row.certType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="certNo" label="证书编号" />
            <el-table-column prop="expireDate" label="到期日期">
              <template #default="{ row }">
                <span :class="getExpireClass(row)">{{ row.expireDate }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="daysLeft" label="剩余天数" width="120">
              <template #default="{ row }">
                <el-tag :type="getDaysLeftTagType(row.daysLeft)">
                  {{ row.daysLeft === '' ? '未填写到期日期' : (row.daysLeft + '天') }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="organization" label="对接机构" />
          </el-table>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="标准工作周报" name="weekly">
        <div class="tab-content">
          <div class="report-controls">
            <el-date-picker v-model="weekDate" type="week" placeholder="选择周" />
            <el-button type="primary" @click="generateWeeklyReport">生成周报</el-button>
            <el-button @click="copyWeeklyReport">复制文本</el-button>
            <el-button @click="exportWeeklyReport">导出Excel</el-button>
          </div>
          <div v-if="weeklyReportData" class="weekly-report-content">
            <el-card>
              <h3>工作周报 - {{ formatWeekDate() }}</h3>
              <div class="report-section">
                <h4>一、本周工作完成情况</h4>
                <ul>
                  <li>新增客户：{{ weeklyReportData.newCustomers.length }}人</li>
                  <li>寄样次数：{{ weeklyReportData.sampleDeliveries.length }}次</li>
                  <li>订单成交：{{ weeklyReportData.salesOrders.length }}单</li>
                  <li>待办完成：{{ weeklyReportData.completedTodos.length }}项</li>
                </ul>
              </div>
              <div class="report-section">
                <h4>二、详细记录</h4>
                <div v-if="weeklyReportData.newCustomers.length > 0">
                  <p><strong>新增客户：</strong></p>
                  <ul>
                    <li v-for="c in weeklyReportData.newCustomers" :key="c.id">{{ c.name }} - {{ c.country }}</li>
                  </ul>
                </div>
                <div v-if="weeklyReportData.sampleDeliveries.length > 0">
                  <p><strong>寄样记录：</strong></p>
                  <ul>
                    <li v-for="s in weeklyReportData.sampleDeliveries" :key="s.id">{{ s.customerName }} - {{ s.model }} - {{ s.quantity }}台</li>
                  </ul>
                </div>
              </div>
              <div class="report-section">
                <h4>三、问题与困难</h4>
                <el-input v-model="weeklyReportData.problems" type="textarea" :rows="3" />
              </div>
              <div class="report-section">
                <h4>四、下周工作计划</h4>
                <el-input v-model="weeklyReportData.nextWeekPlan" type="textarea" :rows="4" />
              </div>
            </el-card>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="GB审核进度报表" name="gb">
        <div class="tab-content">
          <div class="report-controls">
            <el-date-picker v-model="gbDate" type="month" placeholder="选择月份" />
            <el-button type="primary" @click="generateGBReport">生成报表</el-button>
            <el-button type="success" @click="openGBEditDialog()">新增项目</el-button>
            <el-button @click="previewGBReport">预览</el-button>
            <el-button @click="exportGBReport">导出Excel</el-button>
          </div>
          <div class="gb-report">
            <el-table :data="gbReportData" border stripe>
              <el-table-column prop="projectName" label="项目名称" />
              <el-table-column prop="stage" label="当前阶段" />
              <el-table-column prop="progress" label="进度" width="150">
                <template #default="{ row }">
                  <el-progress :percentage="row.progress" :color="getProgressColor(row.progress)" />
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态">
                <template #default="{ row }">
                  <el-tag :type="getStatusTagType(row.status)">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="responsible" label="负责人" />
              <el-table-column prop="deadline" label="截止日期" />
              <el-table-column prop="attachments" label="云端附件" width="200">
                <template #default="{ row }">
                  <div v-if="row.attachments && row.attachments.length > 0" class="attachment-list">
                    <div v-for="(file, index) in row.attachments" :key="index" class="attachment-item">
                      <span class="attachment-name" :title="file.name">{{ file.name }}</span>
                      <el-button v-if="file.status === 'success' && file.path" size="small" type="primary" link @click="previewGBFile(file)">预览</el-button>
                    </div>
                  </div>
                  <span v-else class="no-attachment">暂无附件</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120">
                <template #default="{ row }">
                  <el-button size="small" @click="openGBEditDialog(row)">编辑</el-button>
                  <el-button size="small" type="danger" @click="confirmDeleteGB(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="彩盒设计进度管理" name="colorbox">
        <div class="tab-content">
          <div class="report-controls">
            <el-date-picker v-model="colorBoxDate" type="month" placeholder="选择月份" />
            <el-button type="primary" @click="generateColorBoxReport">生成报表</el-button>
            <el-button type="success" @click="openColorBoxEditDialog()">新增项目</el-button>
            <el-button @click="previewColorBoxReport">预览</el-button>
            <el-button @click="exportColorBoxReport">导出Excel</el-button>
          </div>
          <div class="gb-report">
            <el-table :data="colorBoxReportData" border stripe>
              <el-table-column prop="projectName" label="项目名称" />
              <el-table-column prop="designStage" label="设计阶段" />
              <el-table-column prop="progress" label="进度" width="150">
                <template #default="{ row }">
                  <el-progress :percentage="row.progress" :color="getProgressColor(row.progress)" />
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态">
                <template #default="{ row }">
                  <el-tag :type="getStatusTagType(row.status)">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="responsible" label="负责人" />
              <el-table-column prop="deadline" label="截止日期" />
              <el-table-column prop="attachments" label="云端附件" width="200">
                <template #default="{ row }">
                  <div v-if="row.attachments && row.attachments.length > 0" class="attachment-list">
                    <div v-for="(file, index) in row.attachments" :key="index" class="attachment-item">
                      <span class="attachment-name" :title="file.name">{{ file.name }}</span>
                      <el-button v-if="file.status === 'success' && file.path" size="small" type="primary" link @click="previewColorBoxFile(file)">预览</el-button>
                    </div>
                  </div>
                  <span v-else class="no-attachment">暂无附件</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120">
                <template #default="{ row }">
                  <el-button size="small" @click="openColorBoxEditDialog(row)">编辑</el-button>
                  <el-button size="small" type="danger" @click="confirmDeleteColorBox(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="包装 & 样机跟进管理" name="packageSample">
        <div class="tab-content">
          <div class="report-controls">
            <el-input v-model="psFilter.projectName" placeholder="项目名称" style="width: 150px; margin-right: 10px;" />
            <el-input v-model="psFilter.internalModel" placeholder="内部型号" style="width: 150px; margin-right: 10px;" />
            <el-select v-model="psFilter.businessType" placeholder="业务类型" style="width: 150px; margin-right: 10px;">
              <el-option label="全部" value="" />
              <el-option label="彩盒审核" value="彩盒审核" />
              <el-option label="样机寄送" value="样机寄送" />
            </el-select>
            <el-select v-model="psFilter.followStatus" placeholder="跟进状态" style="width: 150px; margin-right: 10px;">
              <el-option label="全部" value="" />
              <el-option label="待发邮件" value="待发邮件" />
              <el-option label="待客户审核" value="待客户审核" />
              <el-option label="待我方改稿" value="待我方改稿" />
              <el-option label="客户驳回" value="客户驳回" />
              <el-option label="进行中" value="进行中" />
              <el-option label="已完成" value="已完成" />
              <el-option label="暂停" value="暂停" />
            </el-select>
            <el-date-picker v-model="psFilter.startDate" type="date" placeholder="开始日期" style="margin-right: 10px;" />
            <el-date-picker v-model="psFilter.endDate" type="date" placeholder="结束日期" style="margin-right: 10px;" />
            <el-button type="primary" @click="filterPSData">筛选</el-button>
            <el-button @click="resetPSFilter">重置</el-button>
            <el-button type="success" @click="openPSEditDialog()">新增记录</el-button>
            <el-button @click="exportPSData">导出Excel</el-button>
          </div>
          
          <el-table :data="filteredPSData" border stripe>
            <el-table-column prop="projectName" label="项目名称">
              <template #default="{ row }">
                <el-button type="text" @click="viewModelRecords(row.projectName)">{{ row.projectName }}</el-button>
              </template>
            </el-table-column>
            <el-table-column prop="internalModel" label="内部型号" />
            <el-table-column prop="businessType" label="业务类型" width="100">
              <template #default="{ row }">
                <el-tag :type="row.businessType === '彩盒审核' ? 'primary' : 'success'">{{ row.businessType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="followStatus" label="跟进状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getPSStatusType(row.followStatus)">{{ row.followStatus }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="sendDate" label="发件日期" width="120" />
            <el-table-column prop="nextFollowDate" label="下次跟进" width="120">
              <template #default="{ row }">
                <span :class="{ 'overdue': row.nextFollowDate && new Date(row.nextFollowDate) < new Date() && row.followStatus !== '已完成' }">{{ row.nextFollowDate }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="emailSubject" label="邮件主题" v-if="psFilter.businessType === '' || psFilter.businessType === '彩盒审核'" />
            <el-table-column prop="logisticsNo" label="物流单号" v-if="psFilter.businessType === '' || psFilter.businessType === '样机寄送'" />
            <el-table-column prop="logisticsCompany" label="快递公司" v-if="psFilter.businessType === '' || psFilter.businessType === '样机寄送'" />
            <el-table-column prop="destination" label="目的地" v-if="psFilter.businessType === '' || psFilter.businessType === '样机寄送'" />
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button size="small" @click="openPSEditDialog(row)">编辑</el-button>
                <el-button size="small" @click="viewPSDetail(row)">详情</el-button>
                <el-button size="small" type="danger" @click="confirmDeletePS(row)">删除</el-button>
                <el-button v-if="row.businessType === '彩盒审核'" size="small" type="warning" @click="createSampleFromColorBox(row)">新建样机</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div v-if="filteredPSData.length === 0" class="empty-tip">
            暂无数据，请点击"新增记录"添加
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <el-dialog v-model="showGBEditDialog" :title="editingGBProject.id ? '编辑GB项目' : '新增GB项目'" width="600px" :close-on-click-modal="false">
      <el-form label-width="100px">
        <el-form-item label="项目名称">
          <el-input v-model="editingGBProject.projectName" />
        </el-form-item>
        <el-form-item label="当前阶段">
          <el-select v-model="editingGBProject.stage">
            <el-option v-for="stage in gbStages" :key="stage" :label="stage" :value="stage" />
          </el-select>
        </el-form-item>
        <el-form-item label="进度百分比">
          <el-input-number v-model="editingGBProject.progress" :min="0" :max="100" style="width: 100%" />
          <el-progress :percentage="editingGBProject.progress" :color="getProgressColor(editingGBProject.progress)" style="margin-top: 10px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editingGBProject.status">
            <el-option v-for="status in gbStatuses" :key="status" :label="status" :value="status" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="editingGBProject.responsible" />
        </el-form-item>
        <el-form-item label="截止日期">
          <el-date-picker v-model="editingGBProject.deadline" type="date" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="云端附件">
          <FileUploader 
            module-type="gb_project" 
            :module-id="editingGBProject.id || 'temp'" 
            :module-name="editingGBProject.projectName"
            v-model="editingGBProject.attachments"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editingGBProject.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showGBEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveGBProject">确定</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showColorBoxEditDialog" :title="editingColorBoxProject.id ? '编辑彩盒项目' : '新增彩盒项目'" width="600px" :close-on-click-modal="false">
      <el-form label-width="100px">
        <el-form-item label="项目名称">
          <el-input v-model="editingColorBoxProject.projectName" />
        </el-form-item>
        <el-form-item label="设计阶段">
          <el-select v-model="editingColorBoxProject.designStage">
            <el-option v-for="stage in colorBoxStages" :key="stage" :label="stage" :value="stage" />
          </el-select>
        </el-form-item>
        <el-form-item label="进度百分比">
          <el-input-number v-model="editingColorBoxProject.progress" :min="0" :max="100" style="width: 100%" />
          <el-progress :percentage="editingColorBoxProject.progress" :color="getProgressColor(editingColorBoxProject.progress)" style="margin-top: 10px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editingColorBoxProject.status">
            <el-option v-for="status in gbStatuses" :key="status" :label="status" :value="status" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="editingColorBoxProject.responsible" />
        </el-form-item>
        <el-form-item label="截止日期">
          <el-date-picker v-model="editingColorBoxProject.deadline" type="date" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="云端附件">
          <FileUploader 
            module-type="colorbox_project" 
            :module-id="editingColorBoxProject.id || 'temp'" 
            :module-name="editingColorBoxProject.projectName"
            v-model="editingColorBoxProject.attachments"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editingColorBoxProject.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showColorBoxEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveColorBoxProject">确定</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showPSEditDialog" :title="editingPSFollow.id ? '编辑记录' : '新增记录'" width="800px" :close-on-click-modal="false" :fullscreen="true">
      <el-form label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="项目名称">
              <el-input v-model="editingPSFollow.projectName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="内部型号">
              <el-input v-model="editingPSFollow.internalModel" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="业务类型">
              <el-select v-model="editingPSFollow.businessType">
                <el-option v-for="type in businessTypeOptions" :key="type" :label="type" :value="type" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="跟进状态">
              <el-select v-model="editingPSFollow.followStatus">
                <el-option v-for="status in followStatusOptions" :key="status" :label="status" :value="status" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="发件日期">
              <el-date-picker v-model="editingPSFollow.sendDate" type="date" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="收件日期">
              <el-date-picker v-model="editingPSFollow.receiveDate" type="date" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="下次跟进日期">
              <el-date-picker v-model="editingPSFollow.nextFollowDate" type="date" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="跟进日志">
          <div class="follow-logs">
            <div v-for="(log, index) in editingPSFollow.followLogs" :key="index" class="follow-log-item">
              <span class="log-date">{{ log.date }}</span>
              <span class="log-content">{{ log.content }}</span>
            </div>
            <div v-if="editingPSFollow.followLogs.length === 0" class="empty-logs">暂无跟进记录</div>
          </div>
          <div class="add-log">
            <el-input v-model="newFollowLog.date" placeholder="日期" style="width: 120px; margin-right: 10px;" />
            <el-input v-model="newFollowLog.content" placeholder="跟进内容" style="flex: 1; margin-right: 10px;" />
            <el-button type="primary" size="small" @click="addFollowLog">添加日志</el-button>
          </div>
        </el-form-item>
        
        <el-form-item label="通用备注">
          <el-input v-model="editingPSFollow.remark" type="textarea" :rows="3" />
        </el-form-item>
        
        <el-form-item label="自定义备用字段">
          <el-input v-model="editingPSFollow.customField1" placeholder="可填写清关资料、运费、认证编号等" />
        </el-form-item>
        
        <el-form-item label="云端附件">
          <FileUploader 
            module-type="package_sample" 
            :module-id="editingPSFollow.id || 'temp'" 
            :module-name="editingPSFollow.projectName"
            v-model="editingPSFollow.attachments"
          />
        </el-form-item>
        
        <div v-if="editingPSFollow.businessType === '彩盒审核'" class="colorbox-fields">
          <h4>彩盒审核专属字段</h4>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="邮件主题">
                <el-input v-model="editingPSFollow.emailSubject" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="合作客户">
                <el-input v-model="editingPSFollow.customer" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="海外对接人">
                <el-input v-model="editingPSFollow.overseasContact" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="彩盒版本">
                <el-input v-model="editingPSFollow.colorBoxVersion" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="文件外网链接">
            <el-input v-model="editingPSFollow.fileLink" />
          </el-form-item>
        </div>
        
        <div v-if="editingPSFollow.businessType === '样机寄送'" class="sample-fields">
          <h4>样机寄送专属字段</h4>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="寄出时间">
                <el-date-picker v-model="editingPSFollow.sendTime" type="date" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="物流单号">
                <el-input v-model="editingPSFollow.logisticsNo" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="快递公司">
                <el-select v-model="editingPSFollow.logisticsCompany">
                  <el-option v-for="company in logisticsCompanyOptions" :key="company" :label="company" :value="company" />
                  <el-option label="其他" value="其他" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="收件人">
                <el-input v-model="editingPSFollow.receiver" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="寄送目的地">
                <el-input v-model="editingPSFollow.destination" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="寄送目的">
                <el-input v-model="editingPSFollow.sendPurpose" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="寄送数量">
                <el-input-number v-model="editingPSFollow.sendQty" :min="1" :max="999" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showPSEditDialog = false">取消</el-button>
        <el-button type="primary" @click="savePSFollow">确定</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showPSDetailDialog" title="记录详情" width="800px" :close-on-click-modal="false">
      <div class="ps-detail">
        <div class="detail-row">
          <span class="detail-label">项目名称</span>
          <span class="detail-value">{{ editingPSFollow.projectName }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">内部型号</span>
          <span class="detail-value">{{ editingPSFollow.internalModel }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">业务类型</span>
          <span class="detail-value">{{ editingPSFollow.businessType }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">跟进状态</span>
          <span class="detail-value">{{ editingPSFollow.followStatus }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">发件日期</span>
          <span class="detail-value">{{ editingPSFollow.sendDate }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">收件日期</span>
          <span class="detail-value">{{ editingPSFollow.receiveDate }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">下次跟进日期</span>
          <span class="detail-value">{{ editingPSFollow.nextFollowDate }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">跟进日志</span>
          <div class="detail-value follow-logs">
            <div v-for="(log, index) in editingPSFollow.followLogs" :key="index" class="follow-log-item">
              <span class="log-date">{{ log.date }}</span>
              <span class="log-content">{{ log.content }}</span>
            </div>
            <div v-if="editingPSFollow.followLogs.length === 0">暂无跟进记录</div>
          </div>
        </div>
        <div v-if="editingPSFollow.businessType === '彩盒审核'" class="detail-section">
          <h4>彩盒审核信息</h4>
          <div class="detail-row">
            <span class="detail-label">邮件主题</span>
            <span class="detail-value">{{ editingPSFollow.emailSubject }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">合作客户</span>
            <span class="detail-value">{{ editingPSFollow.customer }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">海外对接人</span>
            <span class="detail-value">{{ editingPSFollow.overseasContact }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">彩盒版本</span>
            <span class="detail-value">{{ editingPSFollow.colorBoxVersion }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">文件链接</span>
            <span class="detail-value"><a :href="editingPSFollow.fileLink" target="_blank">{{ editingPSFollow.fileLink }}</a></span>
          </div>
        </div>
        <div v-if="editingPSFollow.businessType === '样机寄送'" class="detail-section">
          <h4>样机寄送信息</h4>
          <div class="detail-row">
            <span class="detail-label">寄出时间</span>
            <span class="detail-value">{{ editingPSFollow.sendTime }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">物流单号</span>
            <span class="detail-value">{{ editingPSFollow.logisticsNo }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">快递公司</span>
            <span class="detail-value">{{ editingPSFollow.logisticsCompany }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">收件人</span>
            <span class="detail-value">{{ editingPSFollow.receiver }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">寄送目的地</span>
            <span class="detail-value">{{ editingPSFollow.destination }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">寄送目的</span>
            <span class="detail-value">{{ editingPSFollow.sendPurpose }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">寄送数量</span>
            <span class="detail-value">{{ editingPSFollow.sendQty }} 台</span>
          </div>
        </div>
        <div class="detail-row">
          <span class="detail-label">备注</span>
          <span class="detail-value">{{ editingPSFollow.remark }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">自定义字段</span>
          <span class="detail-value">{{ editingPSFollow.customField1 }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="showPSDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showModelRecordsDialog" :title="currentModelName + ' - 全部记录'" width="800px" :close-on-click-modal="false">
      <el-table :data="currentModelRecords" border stripe>
        <el-table-column prop="businessType" label="业务类型" />
        <el-table-column prop="followStatus" label="跟进状态" />
        <el-table-column prop="sendDate" label="发件日期" />
        <el-table-column prop="nextFollowDate" label="下次跟进" />
        <el-table-column prop="emailSubject" label="邮件主题" />
        <el-table-column prop="logisticsNo" label="物流单号" />
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button size="small" @click="openPSEditDialog(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="currentModelRecords.length === 0" class="empty-tip">该机型暂无记录</div>
      <template #footer>
        <el-button @click="showModelRecordsDialog = false">关闭</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showPreviewDialog" title="报表预览" width="900px" :close-on-click-modal="false">
      <div class="preview-container">
        <div class="preview-header">
          <h2>{{ previewTitle }}</h2>
          <p>{{ new Date().toLocaleDateString('zh-CN') }}</p>
        </div>
        <div class="preview-table">
          <table>
            <thead>
              <tr>
                <th v-for="header in previewHeaders" :key="header">{{ header }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in previewData" :key="index">
                <td v-for="(cell, cellIndex) in row" :key="cellIndex">{{ cell }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="preview-summary">
          <span>共 {{ previewData.length }} 条记录</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="showPreviewDialog = false">关闭</el-button>
        <el-button type="primary" @click="confirmPreviewExport">导出Excel</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { store, addGBProject, updateGBProject, deleteGBProject, addColorBoxProject, updateColorBoxProject, deleteColorBoxProject, getGBProjects, getColorBoxProjects, addPackageSampleFollow, updatePackageSampleFollow, deletePackageSampleFollow, getPackageSampleFollowsByModel, syncAllFromSupabase } from '../store.js'
import { exportToExcel } from '../utils/excelExport.js'
import FileUploader from './FileUploader.vue'
import { getFileUrlFromSupabase } from '../supabase.js'

const activeTab = ref('customer')

onMounted(async () => {
  await syncAllFromSupabase()
})

const reportMonth = ref(new Date().toISOString().split('T')[0])
const logisticsMonth = ref(new Date().toISOString().split('T')[0])
const productMonth = ref(new Date().toISOString().split('T')[0])
const weekDate = ref(new Date().toISOString().split('T')[0])
const gbDate = ref(new Date().toISOString().split('T')[0])
const colorBoxDate = ref(new Date().toISOString().split('T')[0])

const customerReportData = ref([])
const logisticsReportData = ref([])
const productReportData = ref([])
const certReportData = ref([])
const weeklyReportData = ref(null)
const gbReportData = ref([])
const colorBoxReportData = ref([])

const psFilter = reactive({
  projectName: '',
  internalModel: '',
  businessType: '',
  followStatus: '',
  startDate: '',
  endDate: ''
})

const showPSEditDialog = ref(false)
const showPSDetailDialog = ref(false)
const showModelRecordsDialog = ref(false)
const currentModelRecords = ref([])
const currentModelName = ref('')

const editingPSFollow = reactive({
  id: '',
  projectName: '',
  internalModel: '',
  businessType: '彩盒审核',
  followStatus: '待发邮件',
  sendDate: '',
  receiveDate: '',
  nextFollowDate: '',
  followLogs: [],
  remark: '',
  customField1: '',
  attachments: [],
  emailSubject: '',
  customer: '',
  overseasContact: '',
  colorBoxVersion: '',
  fileLink: '',
  sendTime: '',
  logisticsNo: '',
  logisticsCompany: '',
  receiver: '',
  destination: '',
  sendPurpose: '',
  sendQty: 0
})

const newFollowLog = reactive({
  date: '',
  content: ''
})

const followStatusOptions = ['待发邮件', '待客户审核', '待我方改稿', '客户驳回', '进行中', '已完成', '暂停']
const businessTypeOptions = ['彩盒审核', '样机寄送']
const logisticsCompanyOptions = ['DHL', '顺丰', '跨越']

const filteredPSData = computed(() => {
  return store.packageSampleFollows.filter(item => {
    if (psFilter.projectName && !item.projectName.includes(psFilter.projectName)) return false
    if (psFilter.internalModel && !item.internalModel.includes(psFilter.internalModel)) return false
    if (psFilter.businessType && item.businessType !== psFilter.businessType) return false
    if (psFilter.followStatus && item.followStatus !== psFilter.followStatus) return false
    if (psFilter.startDate && item.sendDate < psFilter.startDate) return false
    if (psFilter.endDate && item.sendDate > psFilter.endDate) return false
    return true
  })
})

const showGBEditDialog = ref(false)
const showColorBoxEditDialog = ref(false)
const editingGBProject = reactive({
  id: '',
  projectName: '',
  stage: '资料提交',
  progress: 0,
  status: '待启动',
  responsible: '',
  deadline: '',
  attachments: [],
  remark: ''
})
const editingColorBoxProject = reactive({
  id: '',
  projectName: '',
  designStage: '设计稿确认',
  progress: 0,
  status: '待启动',
  responsible: '',
  deadline: '',
  attachments: [],
  remark: ''
})

const gbStages = ['资料提交', '检测中', '整改', '待发证', '已拿证']
const gbStatuses = ['待启动', '进行中', '待验收', '已完成', '暂停']
const colorBoxStages = ['设计稿确认', '打样确认', '批量生产']

const showPreviewDialog = ref(false)
const previewTitle = ref('')
const previewHeaders = ref([])
const previewData = ref([])
const previewExportFn = ref(null)

const totalNewCustomers = computed(() => customerReportData.value.length)
const totalSamples = computed(() => customerReportData.value.reduce((sum, c) => sum + c.sampleCount, 0))
const totalOrders = computed(() => customerReportData.value.reduce((sum, c) => sum + c.orderCount, 0))
const overdueCustomers = computed(() => customerReportData.value.filter(c => c.daysNoFollowup > 15).length)

const totalFreight = computed(() => logisticsReportData.value.reduce((sum, l) => sum + parseFloat(l.freightTotal), 0).toFixed(2))
const unsettledFreight = computed(() => logisticsReportData.value.reduce((sum, l) => sum + parseFloat(l.unsettledAmount), 0).toFixed(2))
const totalPackages = computed(() => logisticsReportData.value.reduce((sum, l) => sum + l.packageCount, 0))
const avgDeliveryDays = computed(() => {
  const total = logisticsReportData.value.reduce((sum, l) => sum + parseFloat(l.avgDays), 0)
  return logisticsReportData.value.length > 0 ? (total / logisticsReportData.value.length).toFixed(1) : '0'
})

const totalShipments = computed(() => productReportData.value.reduce((sum, p) => sum + p.shipmentCount, 0))

const topModel = computed(() => {
  if (productReportData.value.length === 0) return '-'
  return productReportData.value.reduce((prev, curr) => prev.shipmentCount > curr.shipmentCount ? prev : curr).model
})

const expiring7Days = computed(() => certReportData.value.filter(c => c.daysLeft <= 7 && c.daysLeft >= 0))
const expiring30Days = computed(() => certReportData.value.filter(c => c.daysLeft > 7 && c.daysLeft <= 30))

function getCertTypeTagType(type) {
  const types = { CE: 'primary', CB: 'success', SASO: 'warning' }
  return types[type] || 'info'
}

function getExpireClass(row) {
  if (row.daysLeft === '') return ''
  if (row.daysLeft < 0) return 'expired'
  if (row.daysLeft <= 7) return 'expiring-7'
  if (row.daysLeft <= 30) return 'expiring-30'
  return 'normal'
}

function getDaysLeftTagType(days) {
  if (days === '') return 'info'
  if (days < 0) return 'danger'
  if (days <= 7) return 'danger'
  if (days <= 30) return 'warning'
  return 'success'
}

function getProgressColor(progress) {
  if (progress >= 80) return '#52c41a'
  if (progress >= 50) return '#409EFF'
  if (progress >= 30) return '#e6a23c'
  return '#f56c6c'
}

function getStatusTagType(status) {
  const types = { '进行中': 'primary', '待验收': 'warning', '已完成': 'success', '延期': 'danger' }
  return types[status] || 'info'
}

function generateCustomerReport() {
  if (!reportMonth.value) return
  
  const month = reportMonth.value
  
  customerReportData.value = store.customers.map(c => {
    const samples = store.sampleDeliveries.filter(s => s.customerId === c.id && s.sendDate.startsWith(month))
    const orders = store.salesOrders.filter(o => o.customerId === c.id && o.bookingDate.startsWith(month))
    
    let daysNoFollowup = 0
    if (store.customerFollowUps) {
      const customerFollowups = store.customerFollowUps.filter(f => f.customerId === c.id)
      if (customerFollowups.length > 0) {
        const lastFollowup = new Date(Math.max(...customerFollowups.map(f => new Date(f.followupDate))))
        const today = new Date()
        daysNoFollowup = Math.floor((today - lastFollowup) / (1000 * 60 * 60 * 24))
      }
    }
    
    const lastFollowupDates = store.customerFollowUps ? 
      store.customerFollowUps.filter(f => f.customerId === c.id).map(f => f.followupDate) : []
    const lastFollowup = lastFollowupDates.length > 0 ? 
      lastFollowupDates.sort().reverse()[0] : '无'
    
    return {
      customerName: c.name,
      group: c.group,
      contactDate: c.firstContactDate,
      sampleCount: samples.length,
      orderCount: orders.length,
      lastFollowup: lastFollowup,
      daysNoFollowup: daysNoFollowup
    }
  })
}

function generateLogisticsReport() {
  if (!logisticsMonth.value) return
  
  const month = logisticsMonth.value
  const monthlyDeliveries = store.sampleDeliveries.filter(s => s.sendDate.startsWith(month))
  
  const customerMap = {}
  monthlyDeliveries.forEach(s => {
    const customer = store.customers.find(c => c.id === s.customerId)
    const customerName = customer ? customer.name : s.customerName || '未知客户'
    
    if (!customerMap[customerName]) {
      customerMap[customerName] = { count: 0, freight: 0, unsettled: 0, days: [] }
    }
    customerMap[customerName].count++
    customerMap[customerName].freight += parseFloat(s.freightAmount) || 0
    if (!s.settled) {
      customerMap[customerName].unsettled += parseFloat(s.freightAmount) || 0
    }
    if (s.sendDate && s.expectedSignDate) {
      const send = new Date(s.sendDate)
      const expected = new Date(s.expectedSignDate)
      const days = Math.floor((expected - send) / (1000 * 60 * 60 * 24))
      customerMap[customerName].days.push(days)
    }
  })
  
  logisticsReportData.value = Object.entries(customerMap).map(([name, data]) => ({
    customerName: name,
    packageCount: data.count,
    freightTotal: data.freight.toFixed(2),
    unsettledAmount: data.unsettled.toFixed(2),
    avgDays: data.days.length > 0 ? (data.days.reduce((a, b) => a + b, 0) / data.days.length).toFixed(1) : '-',
    maxDays: data.days.length > 0 ? Math.max(...data.days) : '-'
  }))
}

function generateProductReport() {
  if (!productMonth.value) return
  
  const month = productMonth.value
  const monthlyOrders = store.salesOrders.filter(o => o.bookingDate.startsWith(month))
  
  const modelMap = {}
  monthlyOrders.forEach(o => {
    if (!modelMap[o.model]) {
      modelMap[o.model] = { count: 0, orders: 0, customers: new Set(), dates: [] }
    }
    modelMap[o.model].count += o.quantity
    modelMap[o.model].orders++
    modelMap[o.model].customers.add(o.customerName)
    modelMap[o.model].dates.push(o.bookingDate)
  })
  
  productReportData.value = Object.entries(modelMap).map(([model, data]) => ({
    model: model,
    shipmentCount: data.count,
    orderCount: data.orders,
    customers: [...data.customers].join(', '),
    firstShipment: data.dates.sort()[0],
    lastShipment: data.dates.sort().reverse()[0]
  }))
}

function generateCertReport() {
  const today = new Date()
  
  certReportData.value = store.certRecords.map(c => {
    let daysLeft = ''
    if (c.expireDate) {
      const expire = new Date(c.expireDate)
      if (!isNaN(expire.getTime())) {
        daysLeft = Math.floor((expire - today) / (1000 * 60 * 60 * 24))
      }
    }
    return {
      ...c,
      daysLeft: daysLeft
    }
  }).sort((a, b) => {
    if (a.daysLeft === '') return 1
    if (b.daysLeft === '') return -1
    return a.daysLeft - b.daysLeft
  })
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
  
  weeklyReportData.value = {
    newCustomers: store.customers.filter(c => c.firstContactDate >= startStr && c.firstContactDate <= endStr),
    sampleDeliveries: store.sampleDeliveries.filter(s => s.sendDate >= startStr && s.sendDate <= endStr),
    salesOrders: store.salesOrders.filter(o => o.bookingDate >= startStr && o.bookingDate <= endStr),
    completedTodos: store.dailyTodos.filter(t => t.completed),
    problems: '',
    nextWeekPlan: ''
  }
}

function copyWeeklyReport() {
  if (!weeklyReportData.value) {
    alert('请先生成周报')
    return
  }
  
  const data = weeklyReportData.value
  const reportText = `工作周报 - ${formatWeekDate()}\n\n` +
    `一、本周工作完成情况\n` +
    `新增客户：${data.newCustomers.length}人\n` +
    `寄样次数：${data.sampleDeliveries.length}次\n` +
    `订单成交：${data.salesOrders.length}单\n` +
    `待办完成：${data.completedTodos.length}项\n\n` +
    `二、详细记录\n` +
    (data.newCustomers.length > 0 ? `新增客户：\n${data.newCustomers.map(c => `- ${c.name} - ${c.country}`).join('\n')}\n` : '') +
    (data.sampleDeliveries.length > 0 ? `寄样记录：\n${data.sampleDeliveries.map(s => `- ${s.customerName} - ${s.model} - ${s.quantity}台`).join('\n')}\n` : '') +
    `\n三、问题与困难\n${data.problems}\n\n` +
    `四、下周工作计划\n${data.nextWeekPlan}`
  
  navigator.clipboard.writeText(reportText).then(() => {
    alert('已复制到剪贴板')
  })
}

function generateGBReport() {
  if (!gbDate.value) return
  gbReportData.value = getGBProjects()
}

function openGBEditDialog(project = null) {
  if (project) {
    Object.assign(editingGBProject, { ...project, attachments: [...project.attachments] })
  } else {
    Object.assign(editingGBProject, {
      id: '',
      projectName: '',
      stage: '资料提交',
      progress: 0,
      status: '待启动',
      responsible: '',
      deadline: '',
      attachments: [],
      remark: ''
    })
  }
  showGBEditDialog.value = true
}

function saveGBProject() {
  if (!editingGBProject.projectName.trim()) {
    alert('请输入项目名称')
    return
  }
  
  if (editingGBProject.id) {
    updateGBProject(editingGBProject)
  } else {
    addGBProject(editingGBProject)
  }
  
  showGBEditDialog.value = false
  generateGBReport()
}

function confirmDeleteGB(row) {
  if (confirm(`确定删除项目「${row.projectName}」吗？`)) {
    deleteGBProject(row.id)
    generateGBReport()
  }
}

async function previewGBFile(file) {
  try {
    if (!file || !file.path) {
      alert('文件路径无效，无法预览')
      return
    }
    
    const result = await getFileUrlFromSupabase(file.path)
    if (result.success && result.url) {
      window.open(result.url, '_blank')
    } else {
      alert('文件预览失败，请下载后查看')
    }
  } catch (e) {
    console.error('Preview error:', e)
    alert('文件预览失败，请下载后查看')
  }
}

function generateColorBoxReport() {
  if (!colorBoxDate.value) return
  colorBoxReportData.value = getColorBoxProjects()
}

function openColorBoxEditDialog(project = null) {
  if (project) {
    Object.assign(editingColorBoxProject, { ...project, attachments: [...project.attachments] })
  } else {
    Object.assign(editingColorBoxProject, {
      id: '',
      projectName: '',
      designStage: '设计稿确认',
      progress: 0,
      status: '待启动',
      responsible: '',
      deadline: '',
      attachments: [],
      remark: ''
    })
  }
  showColorBoxEditDialog.value = true
}

function saveColorBoxProject() {
  if (!editingColorBoxProject.projectName.trim()) {
    alert('请输入项目名称')
    return
  }
  
  if (editingColorBoxProject.id) {
    updateColorBoxProject(editingColorBoxProject)
  } else {
    addColorBoxProject(editingColorBoxProject)
  }
  
  showColorBoxEditDialog.value = false
  generateColorBoxReport()
}

function confirmDeleteColorBox(row) {
  if (confirm(`确定删除项目「${row.projectName}」吗？`)) {
    deleteColorBoxProject(row.id)
    generateColorBoxReport()
  }
}

async function previewColorBoxFile(file) {
  try {
    if (!file || !file.path) {
      alert('文件路径无效，无法预览')
      return
    }
    
    const result = await getFileUrlFromSupabase(file.path)
    if (result.success && result.url) {
      window.open(result.url, '_blank')
    } else {
      alert('文件预览失败，请下载后查看')
    }
  } catch (e) {
    console.error('Preview error:', e)
    alert('文件预览失败，请下载后查看')
  }
}

function exportColorBoxReport() {
  const headers = ['项目名称', '设计阶段', '进度', '状态', '负责人', '截止日期', '附件文件名', '备注']
  const data = colorBoxReportData.value.map(c => [
    c.projectName, 
    c.designStage, 
    c.progress + '%', 
    c.status, 
    c.responsible, 
    c.deadline,
    c.attachments && c.attachments.length > 0 ? c.attachments.map(f => f.name).join('; ') : '',
    c.remark
  ])
  exportToExcel('彩盒设计进度管理', headers, data)
}

function previewCustomerReport() {
  previewTitle.value = '月度客户跟进统计'
  previewHeaders.value = ['客户姓名', '客户分组', '首次联系', '寄样次数', '订单数量', '最后跟进', '未跟进天数']
  previewData.value = customerReportData.value.map(c => [
    c.customerName, c.group, c.contactDate, c.sampleCount, c.orderCount, c.lastFollowup, c.daysNoFollowup
  ])
  previewExportFn.value = exportCustomerReport
  showPreviewDialog.value = true
}

function exportCustomerReport() {
  const headers = ['客户姓名', '客户分组', '首次联系', '寄样次数', '订单数量', '最后跟进', '未跟进天数']
  const data = customerReportData.value.map(c => [
    c.customerName, c.group, c.contactDate, c.sampleCount, c.orderCount, c.lastFollowup, c.daysNoFollowup
  ])
  exportToExcel('月度客户跟进统计', headers, data)
}

function previewLogisticsReport() {
  previewTitle.value = '月度物流费用汇总'
  previewHeaders.value = ['客户姓名', '包裹数量', '运费支出', '未结清金额', '平均运输天数', '最长运输天数']
  previewData.value = logisticsReportData.value.map(l => [
    l.customerName, l.packageCount, l.freightTotal, l.unsettledAmount, l.avgDays, l.maxDays
  ])
  previewExportFn.value = exportLogisticsReport
  showPreviewDialog.value = true
}

function exportLogisticsReport() {
  const headers = ['客户姓名', '包裹数量', '运费支出', '未结清金额', '平均运输天数', '最长运输天数']
  const data = logisticsReportData.value.map(l => [
    l.customerName, l.packageCount, l.freightTotal, l.unsettledAmount, l.avgDays, l.maxDays
  ])
  exportToExcel('月度物流费用汇总', headers, data)
}

function previewProductReport() {
  previewTitle.value = '机型出货数量统计'
  previewHeaders.value = ['机型', '出货台数', '订单数', '客户列表', '首次出货', '最近出货']
  previewData.value = productReportData.value.map(p => [
    p.model, p.shipmentCount, p.orderCount, p.customers, p.firstShipment, p.lastShipment
  ])
  previewExportFn.value = exportProductReport
  showPreviewDialog.value = true
}

function exportProductReport() {
  const headers = ['机型', '出货台数', '订单数', '客户列表', '首次出货', '最近出货']
  const data = productReportData.value.map(p => [
    p.model, p.shipmentCount, p.orderCount, p.customers, p.firstShipment, p.lastShipment
  ])
  exportToExcel('机型出货数量统计', headers, data)
}

function previewCertReport() {
  previewTitle.value = '合规证书到期预警'
  previewHeaders.value = ['机型', '认证类型', '证书编号', '到期日期', '剩余天数', '对接机构']
  previewData.value = certReportData.value.map(c => [
    c.model, c.certType, c.certNo, c.expireDate, c.daysLeft === '' ? '未填写到期日期' : (c.daysLeft + '天'), c.organization
  ])
  previewExportFn.value = exportCertReport
  showPreviewDialog.value = true
}

function exportCertReport() {
  const headers = ['机型', '认证类型', '证书编号', '到期日期', '剩余天数', '对接机构']
  const data = certReportData.value.map(c => [
    c.model, c.certType, c.certNo, c.expireDate, c.daysLeft === '' ? '未填写到期日期' : (c.daysLeft + '天'), c.organization
  ])
  exportToExcel('合规证书到期预警', headers, data)
}

function exportWeeklyReport() {
  if (!weeklyReportData.value) {
    alert('请先生成周报')
    return
  }
  
  const data = weeklyReportData.value
  const exportData = [
    ['工作周报', '', '', '', ''],
    ['周期', formatWeekDate(), '', '', ''],
    ['', '', '', '', ''],
    ['一、本周工作完成情况', '', '', '', ''],
    ['新增客户', data.newCustomers.length + '人', '', '', ''],
    ['寄样次数', data.sampleDeliveries.length + '次', '', '', ''],
    ['订单成交', data.salesOrders.length + '单', '', '', ''],
    ['待办完成', data.completedTodos.length + '项', '', '', ''],
    ['', '', '', '', ''],
    ['二、详细记录', '', '', '', '']
  ]
  
  data.newCustomers.forEach(c => {
    exportData.push(['新增客户', c.name, c.country, '', ''])
  })
  
  data.sampleDeliveries.forEach(s => {
    exportData.push(['寄样记录', s.customerName, s.model, s.quantity + '台', ''])
  })
  
  exportData.push(['', '', '', '', ''])
  exportData.push(['三、问题与困难', '', '', '', ''])
  exportData.push([data.problems, '', '', '', ''])
  exportData.push(['', '', '', '', ''])
  exportData.push(['四、下周工作计划', '', '', '', ''])
  exportData.push([data.nextWeekPlan, '', '', '', ''])
  
  const blob = new Blob(['\ufeff' + exportData.map(row => row.join('\t')).join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `工作周报_${formatWeekDate()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function previewGBReport() {
  previewTitle.value = 'GB审核进度报表'
  previewHeaders.value = ['项目名称', '当前阶段', '进度', '状态', '负责人', '截止日期', '附件文件名', '备注']
  previewData.value = gbReportData.value.map(g => [
    g.projectName, 
    g.stage, 
    g.progress + '%', 
    g.status, 
    g.responsible, 
    g.deadline,
    g.attachments && g.attachments.length > 0 ? g.attachments.map(f => f.name).join('; ') : '',
    g.remark
  ])
  previewExportFn.value = exportGBReport
  showPreviewDialog.value = true
}

function exportGBReport() {
  const headers = ['项目名称', '当前阶段', '进度', '状态', '负责人', '截止日期', '附件文件名', '备注']
  const data = gbReportData.value.map(g => [
    g.projectName, 
    g.stage, 
    g.progress + '%', 
    g.status, 
    g.responsible, 
    g.deadline,
    g.attachments && g.attachments.length > 0 ? g.attachments.map(f => f.name).join('; ') : '',
    g.remark
  ])
  exportToExcel('GB审核进度报表', headers, data)
}

function previewColorBoxReport() {
  previewTitle.value = '彩盒设计进度管理'
  previewHeaders.value = ['项目名称', '设计阶段', '进度', '状态', '负责人', '截止日期', '附件文件名', '备注']
  previewData.value = colorBoxReportData.value.map(c => [
    c.projectName, 
    c.designStage, 
    c.progress + '%', 
    c.status, 
    c.responsible, 
    c.deadline,
    c.attachments && c.attachments.length > 0 ? c.attachments.map(f => f.name).join('; ') : '',
    c.remark
  ])
  previewExportFn.value = exportColorBoxReport
  showPreviewDialog.value = true
}

function confirmPreviewExport() {
  if (previewExportFn.value) {
    previewExportFn.value()
    showPreviewDialog.value = false
  }
}

function filterPSData() {
  console.log('[筛选] 包装样机跟进筛选:', psFilter)
}

function resetPSFilter() {
  psFilter.projectName = ''
  psFilter.internalModel = ''
  psFilter.businessType = ''
  psFilter.followStatus = ''
  psFilter.startDate = ''
  psFilter.endDate = ''
}

function openPSEditDialog(row = null) {
  if (row) {
    Object.assign(editingPSFollow, row)
    editingPSFollow.followLogs = [...(row.followLogs || [])]
    editingPSFollow.attachments = [...(row.attachments || [])]
  } else {
    Object.keys(editingPSFollow).forEach(key => {
      editingPSFollow[key] = key === 'businessType' ? '彩盒审核' : 
                           key === 'followStatus' ? '待发邮件' :
                           key === 'sendQty' ? 0 :
                           key === 'followLogs' ? [] :
                           key === 'attachments' ? [] : ''
    })
  }
  showPSEditDialog.value = true
}

function viewPSDetail(row) {
  Object.assign(editingPSFollow, row)
  editingPSFollow.followLogs = [...(row.followLogs || [])]
  editingPSFollow.attachments = [...(row.attachments || [])]
  showPSDetailDialog.value = true
}

function viewModelRecords(modelName) {
  currentModelName.value = modelName
  currentModelRecords.value = getPackageSampleFollowsByModel(modelName)
  showModelRecordsDialog.value = true
}

function createSampleFromColorBox(row) {
  Object.keys(editingPSFollow).forEach(key => {
    editingPSFollow[key] = key === 'projectName' ? row.projectName :
                         key === 'internalModel' ? row.internalModel :
                         key === 'businessType' ? '样机寄送' :
                         key === 'followStatus' ? '待发邮件' :
                         key === 'sendQty' ? 0 :
                         key === 'followLogs' ? [] :
                         key === 'attachments' ? [] : ''
  })
  showPSEditDialog.value = true
}

async function savePSFollow() {
  if (!editingPSFollow.projectName) {
    alert('请填写项目名称')
    return
  }
  if (!editingPSFollow.internalModel) {
    alert('请填写内部型号')
    return
  }
  
  if (editingPSFollow.id) {
    await updatePackageSampleFollow(editingPSFollow)
  } else {
    await addPackageSampleFollow(editingPSFollow)
  }
  
  showPSEditDialog.value = false
  alert('保存成功！')
}

async function confirmDeletePS(row) {
  if (confirm(`确定删除 "${row.projectName}" 的${row.businessType}记录吗？`)) {
    await deletePackageSampleFollow(row.id)
    alert('删除成功！')
  }
}

function addFollowLog() {
  if (!newFollowLog.date || !newFollowLog.content) {
    alert('请填写日期和内容')
    return
  }
  editingPSFollow.followLogs.push({
    date: newFollowLog.date,
    content: newFollowLog.content
  })
  newFollowLog.date = ''
  newFollowLog.content = ''
}

function getPSStatusType(status) {
  const typeMap = {
    '待发邮件': 'info',
    '待客户审核': 'warning',
    '待我方改稿': 'warning',
    '客户驳回': 'danger',
    '进行中': 'success',
    '已完成': 'success',
    '暂停': 'info'
  }
  return typeMap[status] || 'info'
}

function exportPSData() {
  const headers = [
    '项目名称', '内部型号', '业务类型', '跟进状态', '发件日期', '收件日期', '下次跟进日期',
    '跟进日志', '备注', '自定义字段',
    '邮件主题', '合作客户', '海外对接人', '彩盒版本', '文件链接',
    '寄出时间', '物流单号', '快递公司', '收件人', '寄送目的地', '寄送目的', '寄送数量'
  ]
  const data = filteredPSData.value.map(item => [
    item.projectName,
    item.internalModel,
    item.businessType,
    item.followStatus,
    item.sendDate,
    item.receiveDate,
    item.nextFollowDate,
    item.followLogs ? item.followLogs.map(log => `${log.date} ${log.content}`).join('; ') : '',
    item.remark,
    item.customField1,
    item.emailSubject,
    item.customer,
    item.overseasContact,
    item.colorBoxVersion,
    item.fileLink,
    item.sendTime,
    item.logisticsNo,
    item.logisticsCompany,
    item.receiver,
    item.destination,
    item.sendPurpose,
    item.sendQty
  ])
  exportToExcel('包装 & 样机跟进管理', headers, data)
}

watch(() => store.customers, () => {}, { deep: true })
watch(() => store.sampleDeliveries, () => {}, { deep: true })
watch(() => store.salesOrders, () => {}, { deep: true })
watch(() => store.certRecords, () => {}, { deep: true })
watch(() => store.dailyTodos, () => {}, { deep: true })
</script>

<style scoped>
.report-center {
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

.report-controls {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 20px;
}

.report-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  flex: 1;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

.stat-card.warning {
  background: #fff7e6;
}

.stat-card.danger {
  background: #fef0f0;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-card.warning .stat-value {
  color: #e6a23c;
}

.stat-card.danger .stat-value {
  color: #f56c6c;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.cert-alerts {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  border-radius: 4px;
  font-size: 14px;
}

.alert-item.danger {
  background: #fef0f0;
  color: #f56c6c;
}

.alert-item.warning {
  background: #fffbe6;
  color: #e6a23c;
}

.weekly-report-content {
  max-height: calc(100% - 60px);
  overflow-y: auto;
}

.report-section {
  margin-bottom: 20px;
}

.report-section h4 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
}

.report-section ul {
  padding-left: 20px;
}

.report-section li {
  margin-bottom: 5px;
}

.expired {
  color: #f56c6c;
  font-weight: bold;
}

.expiring-7 {
  color: #f56c6c;
}

.expiring-30 {
  color: #e6a23c;
}

.normal {
  color: #52c41a;
}

.gb-report {
  margin-top: 20px;
}

.preview-container {
  max-height: 500px;
  overflow-y: auto;
}

.preview-header {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.preview-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 5px;
}

.preview-header p {
  font-size: 14px;
  color: #909399;
}

.preview-table {
  overflow-x: auto;
}

.preview-table table {
  width: 100%;
  border-collapse: collapse;
}

.preview-table th,
.preview-table td {
  padding: 10px 12px;
  border: 1px solid #ebeef5;
  font-size: 13px;
  text-align: left;
}

.preview-table th {
  background: #f5f7fa;
  font-weight: 600;
  color: #606266;
}

.preview-table tr:hover {
  background: #f5f7fa;
}

.preview-summary {
  text-align: right;
  margin-top: 15px;
  font-size: 14px;
  color: #909399;
}

.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.attachment-name {
  font-size: 12px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
}

.no-attachment {
  font-size: 12px;
  color: #c0c4cc;
}
</style>