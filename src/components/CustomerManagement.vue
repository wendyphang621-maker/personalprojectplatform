<template>
  <div class="customer-management">
    <div v-if="activeTab === 'main'" class="tab-content">
          <div class="search-bar">
            <el-input v-model="searchKeyword" placeholder="搜索客户姓名/邮箱" clearable style="width: 250px" />
            <el-select v-model="filterGroup" placeholder="客户分组" clearable style="width: 150px">
              <el-option v-for="g in customerGroups" :key="g" :label="g" :value="g" />
            </el-select>
            <el-button type="primary" @click="handleAddCustomer">新增客户</el-button>
            <el-button @click="previewCustomers">预览</el-button>
            <el-button @click="exportCustomers">导出Excel</el-button>
            <el-button type="warning" @click="triggerCustomerImport">导入Excel</el-button>
            <input type="file" ref="customerImportInput" accept=".xlsx,.xls" style="display: none" @change="handleCustomerImport" />
            <el-button type="success" :disabled="selectedCustomerIds.length === 0" @click="openMoveGroupDialog">
              批量分配分组
              <span v-if="selectedCustomerIds.length > 0">（{{ selectedCustomerIds.length }}）</span>
            </el-button>
            <el-button type="danger" :disabled="selectedCustomerIds.length === 0" @click="batchDeleteCustomers">
              批量删除
              <span v-if="selectedCustomerIds.length > 0">（{{ selectedCustomerIds.length }}）</span>
            </el-button>
          </div>
          <el-table :data="filteredCustomers" border stripe @selection-change="handleCustomerSelectionChange">
            <el-table-column type="selection" width="50" />
            <el-table-column prop="id" label="客户ID" width="80" />
            <el-table-column prop="name" label="客户姓名" />
            <el-table-column prop="group" label="客户分组" />
            <el-table-column prop="country" label="国家" />
            <el-table-column prop="region" label="地区" />
            <el-table-column prop="company" label="公司" />
            <el-table-column prop="email" label="海外邮箱" />
            <el-table-column prop="phone" label="电话" />
            <el-table-column prop="model" label="对接机型" />
            <el-table-column prop="firstContactDate" label="首次联系日期" />
            <el-table-column label="累计寄样次数" width="120">
              <template #default="{ row }">
                {{ getSampleCount(row.id) }}
              </template>
            </el-table-column>
            <el-table-column prop="localMaterialPath" label="本地产品素材路径" min-width="200">
              <template #default="{ row }">
                <div v-if="row.localMaterialPath" class="local-path-cell">
                  <span 
                    class="local-path-text" 
                    :title="row.localMaterialPath"
                  >{{ truncateFileName(row.localMaterialPath, 30) }}</span>
                  <el-button 
                    size="small" 
                    type="text" 
                    @click="copyLocalPath(row.localMaterialPath)"
                    title="复制路径"
                  >📋</el-button>
                </div>
                <span v-else class="no-path">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="attachments" label="云端附件" min-width="200">
              <template #default="{ row }">
                <div v-if="row.attachments && row.attachments.length > 0" class="attachment-scroll-container">
                  <div class="attachment-scroll-list">
                    <div 
                      v-for="(file, idx) in row.attachments" 
                      :key="idx" 
                      class="attachment-chip"
                    >
                      <span 
                        class="attachment-name" 
                        :title="file.name"
                      >{{ truncateFileName(file.name) }}</span>
                      <el-button 
                        size="small" 
                        :icon="ZoomIn"
                        @click.stop="previewSingleFile(file)"
                        class="preview-btn"
                        title="预览"
                      />
                    </div>
                  </div>
                </div>
                <span v-else class="no-attachment">- 暂无附件</span>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" />
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button size="small" @click="handleEditCustomer(row)">编辑</el-button>
                <el-button size="small" :disabled="!row.localMaterialPath || !isLocalhost" @click="openLocalFolder(row)">打开文件夹</el-button>
                <el-button size="small" type="danger" @click="handleDeleteCustomer(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
      </div>
    
    <div v-else-if="activeTab === 'followup'" class="tab-content">
          <div class="search-bar">
            <el-select v-model="followupCustomerId" placeholder="选择客户" style="width: 200px">
              <el-option v-for="c in store.customers" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
            <el-date-picker v-model="followupDate" type="date" placeholder="跟进日期" />
            <el-button type="primary" @click="handleAddFollowup">新增记录</el-button>
            <el-button @click="openFollowupPreview">导出Excel</el-button>
            <el-button type="success" @click="exportFollowupsEnhanced">增强导出</el-button>
            <el-button type="warning" @click="triggerFollowupImport">导入Excel</el-button>
            <input type="file" ref="followupImportInput" accept=".xlsx,.xls" style="display: none" @change="handleFollowupImport" />
            <el-button type="danger" :disabled="selectedFollowupIds.length === 0" @click="batchDeleteFollowups">
              批量删除
              <span v-if="selectedFollowupIds.length > 0">（{{ selectedFollowupIds.length }}）</span>
            </el-button>
          </div>
          <el-table :data="filteredFollowups" border stripe header-cell-class-name="table-header" @selection-change="handleFollowupSelectionChange">
            <el-table-column type="selection" width="50" />
            <el-table-column prop="id" label="记录ID" width="100" />
            <el-table-column prop="customerName" label="客户姓名" width="120">
              <template #default="{ row }">
                <el-tooltip :content="row.customerName" placement="top">
                  <span>{{ row.customerName }}</span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column prop="followupDate" label="跟进日期" width="110" />
            <el-table-column prop="content" label="跟进内容" min-width="200" show-overflow-tooltip>
              <template #default="{ row }">
                <span class="content-cell">{{ row.content }}</span>
              </template>
            </el-table-column>
            <el-table-column label="跟进结果" width="110">
              <template #default="{ row }">
                <el-tag :type="getResultTagType(row.result)" size="small">{{ row.result || '-' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="nextFollowup" label="下次跟进" width="110">
              <template #default="{ row }">
                <span :class="{ 'overdue-date': isOverdueDate(row.nextFollowup) }">{{ row.nextFollowup || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="openFollowupDetail(row)">预览</el-button>
                <el-button size="small" @click="handleEditFollowup(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="handleDeleteFollowup(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
      </div>
    
    <div v-else-if="activeTab === 'group'" class="tab-content">
          <div class="group-list">
            <div v-for="group in customerGroups" :key="group" class="group-card">
              <div class="group-header">
                <span class="group-name">{{ group }}</span>
                <div class="group-actions">
                  <el-button size="small" @click="handleEditGroup(group)">编辑</el-button>
                  <el-button size="small" type="danger" @click="handleDeleteGroup(group)">删除</el-button>
                </div>
              </div>
              <div class="group-count">{{ getGroupCustomerCount(group) }} 位客户</div>
              <div class="group-members">
                <div v-for="customer in getGroupCustomers(group)" :key="customer.id" class="member-tag">
                  {{ customer.name }}
                </div>
              </div>
            </div>
          </div>
          <div class="group-actions-bar">
            <el-button type="primary" @click="showAddGroupDialog = true">新增分组</el-button>
            <el-button type="success" @click="showGroupExportDialog = true">导出Excel</el-button>
            <el-button type="warning" @click="triggerGroupImport">导入Excel</el-button>
            <input type="file" ref="groupImportInput" accept=".xlsx,.xls" style="display: none" @change="handleGroupImport" />
          </div>
          <el-dialog v-model="showAddGroupDialog" :title="isEditingGroup ? '编辑客户分组' : '新增客户分组'" width="400px">
            <el-form :model="newGroupForm" label-width="80px">
              <el-form-item label="分组名称">
                <el-input v-model="newGroupForm.name" />
              </el-form-item>
            </el-form>
            <template #footer>
              <el-button @click="showAddGroupDialog = false">取消</el-button>
              <el-button type="primary" @click="isEditingGroup ? handleSaveEditGroup() : handleAddGroup()">确定</el-button>
            </template>
          </el-dialog>
      </div>
    
    <div v-else-if="activeTab === 'payment'" class="tab-content">
      <div class="search-bar">
        <el-input v-model="paymentKeyword" placeholder="搜索客户姓名/订单编号" clearable style="width: 250px" />
        <el-select v-model="paymentFilterCustomer" placeholder="选择客户" clearable style="width: 180px">
          <el-option v-for="c in store.customers" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
        <el-select v-model="paymentFilterStatus" placeholder="到账状态" clearable style="width: 120px">
          <el-option label="已到账" value="已到账" />
          <el-option label="未到账" value="未到账" />
        </el-select>
        <el-button type="primary" @click="handleAddPayment">新增付款记录</el-button>
        <el-button @click="previewPayments">预览</el-button>
        <el-button @click="exportPayments">导出Excel</el-button>
        <el-button type="warning" @click="triggerPaymentImport">批量导入</el-button>
        <el-button type="success" :disabled="selectedPaymentIds.length === 0" @click="openBatchEditDialog">
          批量编辑<span v-if="selectedPaymentIds.length > 0">（{{ selectedPaymentIds.length }}）</span>
        </el-button>
        <el-button type="danger" :disabled="selectedPaymentIds.length === 0" @click="batchDeletePayments">
          批量删除<span v-if="selectedPaymentIds.length > 0">（{{ selectedPaymentIds.length }}）</span>
        </el-button>
        <input type="file" ref="paymentImportInput" accept=".xlsx,.xls" style="display: none" @change="handlePaymentImport" />
      </div>
      <div class="payment-stats-bar">
        <div class="stats-currency-filter">
          <span class="stats-filter-label">统计币种：</span>
          <el-select v-model="statsDisplayCurrency" placeholder="全部币种" clearable size="small" style="width: 160px;">
            <el-option label="全部币种" value="" />
            <el-option v-for="c in availableCurrenciesInStats" :key="c" :label="c + ' (' + getCurrencySymbol(c) + ')'" :value="c" />
          </el-select>
        </div>
        <div class="stat-item stat-total">
          <span class="stat-label">订单总金额</span>
          <span class="stat-value">{{ formatMoney(sumTotalOrderAmount) }}</span>
        </div>
        <div class="stat-item stat-settled">
          <span class="stat-label">已到账</span>
          <span class="stat-value">{{ settledPaymentCount }} 笔 / {{ formatMoney(sumSettledAmount) }}</span>
        </div>
        <div class="stat-item stat-unpaid">
          <span class="stat-label">🔴 未付款订单</span>
          <span class="stat-value">{{ unpaidOrderCount }} 个订单 / {{ formatMoney(sumUnpaidOrderAmount) }}</span>
        </div>
        <div class="stat-item stat-remaining">
          <span class="stat-label">🟠 部分付款未结清</span>
          <span class="stat-value">{{ partiallyPaidOrderCount }} 个订单 / 待收 {{ formatMoney(sumRemainingAmount) }}</span>
        </div>
        <div 
          class="stat-item stat-warning" 
          :class="{ 'stat-warning-active': urgentDeliveryCount > 0, 'stat-warning-filtered': showOnlyUrgent }" 
          v-if="urgentDeliveryCount > 0"
          @click="toggleUrgentFilter"
          style="cursor: pointer;"
        >
          <span class="stat-label">🚨 催款提醒 <el-icon v-if="showOnlyUrgent" size="14"><Close /></el-icon></span>
          <span class="stat-value">{{ urgentDeliveryCount }} 个订单 / 待收 {{ formatMoney(sumUrgentUnpaidAmount) }}</span>
        </div>
      </div>
      <div class="row-legend">
        <span class="legend-item">
          <span class="legend-color legend-remaining"></span>
          红色底色 = 该订单尾款未结清
        </span>
        <span class="legend-item">
          <span class="legend-color legend-pending"></span>
          黄色底色 = 该笔付款未到账
        </span>
        <span class="legend-item">
          <el-icon style="color: #e6a23c;"><Warning /></el-icon>
          交货日期旁警告图标 = 近7天到期需催款（点击上方催款提醒可筛选）
        </span>
      </div>
      <el-table :data="filteredPayments" border stripe :row-class-name="paymentRowClassName" @selection-change="handlePaymentSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="id" label="记录ID" width="100" />
        <el-table-column prop="customerName" label="客户姓名" width="100" />
        <el-table-column prop="orderNo" label="订单编号" width="120" />
        <el-table-column prop="orderDate" label="订单日期" width="100" />
        <el-table-column prop="productName" label="产品名称" width="110" />
        <el-table-column prop="specModel" label="规格型号" width="100" />
        <el-table-column prop="color" label="颜色" width="90" />
        <el-table-column prop="currency" label="币种" width="70">
          <template #default="{ row }">{{ getCurrencySymbol(row.currency) }}</template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="70" />
        <el-table-column prop="unitPrice" label="单价" width="80">
          <template #default="{ row }">{{ getCurrencySymbol(row.currency) }}{{ row.unitPrice?.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="orderAmount" label="订单金额" width="100">
          <template #default="{ row }">{{ getCurrencySymbol(row.currency) }}{{ row.orderAmount?.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="交货日期" width="110">
          <template #default="{ row }">
            <span :class="{ 'reminder-date': isNearDeliveryDate(row.deliveryDate) && getRecordSettlementStatus(row) !== 'settled' }">
              {{ row.deliveryDate }}
            </span>
            <el-tooltip v-if="isNearDeliveryDate(row.deliveryDate) && getRecordSettlementStatus(row) !== 'settled'" :content="getDeliveryReminder(row.deliveryDate)" placement="top">
              <el-icon style="color: #e6a23c; margin-left: 4px;"><Warning /></el-icon>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="paymentBatch" label="付款批次" width="80" />
        <el-table-column prop="paymentType" label="付款类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.paymentType === '尾款' ? 'warning' : ''" size="small">{{ row.paymentType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="paymentRatio" label="付款比例" width="100">
          <template #default="{ row }">
            <el-progress
              :percentage="parsePaymentRatio(row)"
              :stroke-width="16"
              :color="getProgressColor(parsePaymentRatio(row))"
              :text-inside="true"
              style="width: 80px;"
            />
          </template>
        </el-table-column>
        <el-table-column prop="paymentDate" label="付款日期" width="100" />
        <el-table-column prop="paymentAmount" label="付款金额" width="110">
          <template #default="{ row }">{{ getCurrencySymbol(row.currency) }}{{ row.paymentAmount?.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="付款方式" width="100" />
        <el-table-column label="到账状态" width="140">
          <template #default="{ row }">
            <el-tag
              v-if="getRecordSettlementStatus(row) === 'remaining'"
              type="danger"
              size="default"
              effect="dark"
            >
              ⚠️ 尾款未结清
            </el-tag>
            <el-tag
              v-else-if="getRecordSettlementStatus(row) === 'settled'"
              type="success"
              size="default"
              effect="dark"
            >
              ✅ 已结清
            </el-tag>
            <el-tag
              v-else
              type="warning"
              size="default"
              effect="dark"
            >
              ⏳ 待付款
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEditPayment(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDeletePayment(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <el-dialog v-model="showCustomerDialog" :title="isEditingCustomer ? '编辑客户' : '新增客户'" width="600px">
      <el-form :model="customerForm" label-width="120px">
        <el-form-item label="客户ID">
          <el-input v-model="customerForm.id" placeholder="自动生成，可自定义" />
        </el-form-item>
        <el-form-item label="客户姓名">
          <el-input v-model="customerForm.name" />
        </el-form-item>
        <el-form-item label="客户分组">
          <el-select v-model="customerForm.group" clearable filterable allow-create>
            <el-option v-for="g in customerGroups" :key="g" :label="g" :value="g" />
          </el-select>
        </el-form-item>
        <el-form-item label="国家">
          <el-input v-model="customerForm.country" />
        </el-form-item>
        <el-form-item label="地区">
          <el-input v-model="customerForm.region" />
        </el-form-item>
        <el-form-item label="公司">
          <el-input v-model="customerForm.company" />
        </el-form-item>
        <el-form-item label="海外邮箱">
          <el-input v-model="customerForm.email" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="customerForm.phone" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="customerForm.address" />
        </el-form-item>
        <el-form-item label="对接机型">
          <el-select v-model="customerForm.model" filterable>
            <el-option v-for="m in store.productModels" :key="m.id" :label="m.name" :value="m.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="首次联系日期">
          <el-date-picker v-model="customerForm.firstContactDate" type="date" />
        </el-form-item>
        <el-form-item label="本地产品素材路径">
          <div class="local-path-input-wrapper">
            <el-input v-model="customerForm.localMaterialPath" placeholder="例：D:\外贸工作文件\产品素材库\E7 Elite" />
            <el-button 
              size="small" 
              type="primary" 
              @click="copyLocalPath(customerForm.localMaterialPath)"
              :disabled="!customerForm.localMaterialPath"
            >复制路径</el-button>
          </div>
          <div class="local-path-tip">
            <span class="tip-icon">ℹ️</span>
            <span>浏览器安全限制无法直接打开本地文件夹，复制后粘贴到资源管理器地址栏访问</span>
          </div>
        </el-form-item>
        <el-form-item label="云端附件">
          <FileUploader
            v-if="customerForm.id"
            module-type="customer"
            :module-id="customerForm.id"
            :module-name="customerForm.name"
            v-model="customerForm.attachments"
          />
          <div v-else class="upload-disabled">
            <el-alert type="info" :closable="false" show-icon>
              请先保存客户信息，然后才能上传附件
            </el-alert>
          </div>
        </el-form-item>
        <el-form-item label="标签">
          <el-select v-model="customerForm.tags" multiple style="width: 100%">
            <el-option v-for="tag in store.tags" :key="tag.id" :label="tag.label" :value="tag.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="customerForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCustomerDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmCustomer">确定</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showCustomerPreviewDialog" title="客户台账预览" width="900px" :close-on-click-modal="false">
      <div class="preview-container">
        <div class="preview-header">
          <h2>海外客户主台账</h2>
          <p>{{ new Date().toLocaleDateString('zh-CN') }}</p>
        </div>
        <div class="preview-table">
          <table>
            <thead>
              <tr>
                <th>客户ID</th>
                <th>客户姓名</th>
                <th>客户分组</th>
                <th>国家</th>
                <th>地区</th>
                <th>公司</th>
                <th>海外邮箱</th>
                <th>电话</th>
                <th>对接机型</th>
                <th>首次联系日期</th>
                <th>累计寄样次数</th>
                <th>本地产品素材路径</th>
                <th>云端附件数量</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in filteredCustomers" :key="c.id">
                <td>{{ c.id }}</td>
                <td>{{ c.name }}</td>
                <td>{{ c.group }}</td>
                <td>{{ c.country || '-' }}</td>
                <td>{{ c.region }}</td>
                <td>{{ c.company || '-' }}</td>
                <td>{{ c.email }}</td>
                <td>{{ c.phone || '-' }}</td>
                <td>{{ c.model }}</td>
                <td>{{ c.firstContactDate }}</td>
                <td>{{ c.sampleCount }}</td>
                <td>{{ c.localMaterialPath || '-' }}</td>
                <td>{{ (c.attachments && c.attachments.length) || 0 }}</td>
                <td>{{ c.remark || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="preview-summary">
          <span>共 {{ filteredCustomers.length }} 条记录</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="showCustomerPreviewDialog = false">关闭</el-button>
        <el-button type="primary" @click="exportCustomers">导出Excel</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showAttachmentDialog" title="附件预览" width="700px" :close-on-click-modal="false">
      <div v-if="currentAttachments && currentAttachments.length > 0">
        <div v-for="(file, index) in currentAttachments" :key="index" class="attachment-preview-item">
          <div class="attachment-preview-header">
            <span>{{ file.name }}</span>
            <el-button size="small" @click="downloadAttachment(file)">下载</el-button>
          </div>
          <div v-if="file.type && file.type.startsWith('image/')" class="attachment-preview-image">
            <img :src="file.previewUrl" :alt="file.name" />
          </div>
          <div v-else class="attachment-preview-other">
            <el-icon size="48" color="#909399"><Document /></el-icon>
            <p>点击下载查看文件</p>
          </div>
        </div>
      </div>
      <div v-else class="no-attachments">
        <p>暂无附件</p>
      </div>
      <template #footer>
        <el-button @click="showAttachmentDialog = false">关闭</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showFollowupDialog" title="跟进记录" width="500px">
      <el-form :model="followupForm" label-width="100px">
        <el-form-item label="记录ID">
          <el-input v-model="followupForm.id" placeholder="自动生成，可自定义" />
        </el-form-item>
        <el-form-item label="关联客户">
          <el-select v-model="followupForm.customerId">
            <el-option v-for="c in store.customers" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="跟进日期">
          <el-date-picker v-model="followupForm.followupDate" type="date" />
        </el-form-item>
        <el-form-item label="跟进内容">
          <el-input v-model="followupForm.content" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="跟进结果">
          <el-select v-model="followupForm.result">
            <el-option label="意向明确" value="interested" />
            <el-option label="需要报价" value="need_quote" />
            <el-option label="等待反馈" value="waiting" />
            <el-option label="无意向" value="not_interested" />
            <el-option label="已成交" value="dealed" />
          </el-select>
        </el-form-item>
        <el-form-item label="下次跟进">
          <el-date-picker v-model="followupForm.nextFollowup" type="date" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFollowupDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmFollowup">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showFollowupPreview"
      title="跟进记录导出预览"
      width="720px"
      @close="showFollowupPreview = false"
    >
      <div class="preview-info">
        <span>共 <strong>{{ filteredFollowups.length }}</strong> 条记录将被导出</span>
      </div>
      <el-table :data="followupPreviewData" border max-height="400" size="small">
        <el-table-column prop="id" label="记录ID" width="100" />
        <el-table-column prop="customerName" label="客户姓名" width="120" />
        <el-table-column prop="followupDate" label="跟进日期" width="110" />
        <el-table-column prop="content" label="跟进内容" :show-overflow-tooltip="true" />
        <el-table-column prop="result" label="跟进结果" width="100" />
        <el-table-column prop="nextFollowup" label="下次跟进" width="110" />
      </el-table>
      <template #footer>
        <el-button @click="showFollowupPreview = false">取消</el-button>
        <el-button type="primary" @click="confirmFollowupExport">确认导出</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showMoveGroupDialog" title="批量分配分组" width="450px">
      <div class="move-group-info">
        <p>已选择 <strong>{{ selectedCustomerIds.length }}</strong> 位客户</p>
      </div>
      <el-form label-width="100px">
        <el-form-item label="目标分组">
          <el-select v-model="moveTargetGroup" placeholder="请选择目标分组" style="width: 100%" filterable>
            <el-option v-for="g in customerGroups" :key="g" :label="g" :value="g" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showMoveGroupDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmMoveGroup">确认分配</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showFollowupDetailDialog" title="跟进记录详情" width="800px" top-class="followup-detail-dialog">
      <div v-if="currentPreviewFollowup">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="跟进ID">{{ currentPreviewFollowup.id || '-' }}</el-descriptions-item>
          <el-descriptions-item label="客户名称">{{ currentPreviewFollowup.customerName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="所属分组">
            {{ (store.customers.find(c => c.id === currentPreviewFollowup.customerId)?.group) || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="跟进日期">{{ currentPreviewFollowup.followupDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="沟通方式">{{ currentPreviewFollowup.contactMethod || '-' }}</el-descriptions-item>
          <el-descriptions-item label="关联PO号">{{ currentPreviewFollowup.poNumber || '-' }}</el-descriptions-item>
          <el-descriptions-item label="下次跟进时间">{{ currentPreviewFollowup.nextFollowup || '-' }}</el-descriptions-item>
          <el-descriptions-item label="操作人">{{ currentPreviewFollowup.operator || '-' }}</el-descriptions-item>
          <el-descriptions-item label="跟进详情" :span="2">{{ currentPreviewFollowup.content || '-' }}</el-descriptions-item>
          <el-descriptions-item label="附件名称" :span="2">
            <span v-if="currentPreviewFollowup.attachments && currentPreviewFollowup.attachments.length > 0">
              {{ currentPreviewFollowup.attachments.map(a => a.name).join('、') }}
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="showFollowupDetailDialog = false">关闭</el-button>
        <el-button type="primary" @click="printFollowupDetail">打印</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showGroupExportDialog" title="导出客户分组" width="500px">
      <el-form label-width="120px">
        <el-form-item label="导出范围">
          <el-radio-group v-model="groupExportFilter">
            <el-radio label="all">全量导出所有分组</el-radio>
            <el-radio label="single">筛选单分组导出</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="groupExportFilter === 'single'" label="选择分组">
          <el-select v-model="groupExportTarget" placeholder="请选择分组" style="width: 100%" filterable>
            <el-option v-for="g in customerGroups" :key="g" :label="g" :value="g" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="export-preview-info">
        <p>将导出字段：分组名称、分组内客户数量、客户英文名、对接人、国家、联系方式</p>
      </div>
      <template #footer>
        <el-button @click="showGroupExportDialog = false">取消</el-button>
        <el-button type="primary" @click="exportGroupsEnhanced">确认导出</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showPaymentDialog" :title="isEditingPayment ? '编辑付款记录' : '新增付款记录'" width="700px">
      <el-form :model="paymentForm" label-width="110px">
        <el-form-item label="记录ID">
          <el-input v-model="paymentForm.id" placeholder="自动生成，可自定义" />
        </el-form-item>
        <el-form-item label="选择客户">
          <el-select v-model="paymentForm.customerId" filterable placeholder="选择客户" @change="onPaymentCustomerChange">
            <el-option v-for="c in store.customers" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户姓名">
          <el-input v-model="paymentForm.customerName" readonly />
        </el-form-item>
        <el-form-item label="币种">
          <el-select v-model="paymentForm.currency" filterable allow-create default-first-option placeholder="选择或输入币种" style="width: 100%;">
            <el-option v-for="c in currencyOptions" :key="c.value" :label="c.label" :value="c.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单编号">
          <el-input v-model="paymentForm.orderNo" placeholder="如 PO-2026-001" />
        </el-form-item>
        <el-form-item label="订单日期">
          <el-date-picker v-model="paymentForm.orderDate" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-select v-model="paymentForm.productName" placeholder="选择产品" filterable allow-create default-first-option style="width: 100%;" @change="onProductNameChange">
            <el-option v-for="p in productNameOptions" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item label="型号">
          <el-select v-model="paymentForm.model" placeholder="选择型号" filterable allow-create default-first-option style="width: 100%;" @change="onModelChange">
            <el-option v-for="m in filteredModelOptions" :key="m" :label="m" :value="m" />
          </el-select>
        </el-form-item>
        <el-form-item label="规格型号">
          <el-input v-model="paymentForm.specModel" placeholder="选择型号后自动填充" readonly />
        </el-form-item>
        <el-form-item label="颜色">
          <el-input v-model="paymentForm.color" placeholder="如 Black / Blue Black" />
        </el-form-item>
        <el-form-item label="内存配置">
          <el-input v-model="paymentForm.memoryConfig" placeholder="如 4+128 / 6+256" />
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="paymentForm.quantity" :min="0" style="width: 100%" @change="calcOrderAmount" />
        </el-form-item>
        <el-form-item label="单价">
          <el-input-number v-model="paymentForm.unitPrice" :min="0" :precision="2" style="width: 100%" @change="calcOrderAmount" />
        </el-form-item>
        <el-form-item label="订单金额">
          <el-input-number v-model="paymentForm.orderAmount" :min="0" :precision="2" style="width: 100%" />
          <div class="form-tip">自动计算：单价 × 数量</div>
        </el-form-item>
        <el-form-item label="交货日期">
          <el-date-picker v-model="paymentForm.deliveryDate" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="付款批次">
          <el-select v-model="paymentForm.paymentBatch" placeholder="选择批次">
            <el-option label="第1笔" value="第1笔" />
            <el-option label="第2笔" value="第2笔" />
            <el-option label="第3笔" value="第3笔" />
            <el-option label="第4笔" value="第4笔" />
            <el-option label="尾款" value="尾款" />
          </el-select>
        </el-form-item>
        <el-form-item label="付款类型">
          <el-select v-model="paymentForm.paymentType" placeholder="选择类型">
            <el-option label="定金" value="定金" />
            <el-option label="尾款" value="尾款" />
            <el-option label="全款" value="全款" />
          </el-select>
        </el-form-item>
        <el-form-item label="付款比例">
          <el-input v-model="paymentForm.paymentRatio" placeholder="如 30% 或 30" style="width: 100%" />
        </el-form-item>
        <el-form-item label="付款日期">
          <el-date-picker v-model="paymentForm.paymentDate" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="付款金额">
          <el-input-number v-model="paymentForm.paymentAmount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="付款方式">
          <el-select v-model="paymentForm.paymentMethod" placeholder="选择方式">
            <el-option label="银行转账" value="银行转账" />
            <el-option label="支付宝" value="支付宝" />
            <el-option label="微信" value="微信" />
            <el-option label="现金" value="现金" />
            <el-option label="支票" value="支票" />
          </el-select>
        </el-form-item>
        <el-form-item label="到账状态">
          <el-select v-model="paymentForm.arrivalStatus" placeholder="选择状态">
            <el-option label="已到账" value="已到账" />
            <el-option label="未到账" value="未到账" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="paymentForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPaymentDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmPayment">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showBatchEditDialog" title="批量编辑付款记录" width="700px" :close-on-click-modal="false">
      <div style="margin-bottom: 15px; padding: 10px; background: #f0f9ff; border-radius: 4px; color: #409eff;">
        已选择 <strong>{{ selectedPaymentIds.length }}</strong> 条记录，勾选需要批量修改的字段并输入新值
      </div>
      <el-form label-width="120px">
        <el-divider content-position="left">基础信息</el-divider>
        <el-form-item>
          <el-checkbox v-model="batchEditFields.currency">批量修改币种</el-checkbox>
          <el-select v-if="batchEditFields.currency" v-model="batchEditData.currency" filterable allow-create default-first-option placeholder="选择或输入币种" style="width: 100%; margin-top: 8px;">
            <el-option v-for="c in currencyOptions" :key="c.value" :label="c.label" :value="c.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="batchEditFields.orderDate">批量修改订单日期</el-checkbox>
          <el-date-picker v-if="batchEditFields.orderDate" v-model="batchEditData.orderDate" type="date" placeholder="选择日期" style="width: 100%; margin-top: 8px;" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="batchEditFields.deliveryDate">批量修改交货日期</el-checkbox>
          <el-date-picker v-if="batchEditFields.deliveryDate" v-model="batchEditData.deliveryDate" type="date" placeholder="选择日期" style="width: 100%; margin-top: 8px;" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="batchEditFields.color">批量修改颜色</el-checkbox>
          <el-input v-if="batchEditFields.color" v-model="batchEditData.color" placeholder="如 Black / Blue Black" style="width: 100%; margin-top: 8px;" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="batchEditFields.memoryConfig">批量修改内存配置</el-checkbox>
          <el-input v-if="batchEditFields.memoryConfig" v-model="batchEditData.memoryConfig" placeholder="如 4+128 / 6+256" style="width: 100%; margin-top: 8px;" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="batchEditFields.model">批量修改型号</el-checkbox>
          <el-input v-if="batchEditFields.model" v-model="batchEditData.model" placeholder="如 HTC E7" style="width: 100%; margin-top: 8px;" />
        </el-form-item>
        
        <el-divider content-position="left">金额与数量</el-divider>
        <el-form-item>
          <el-checkbox v-model="batchEditFields.quantity">批量修改数量</el-checkbox>
          <el-input-number v-if="batchEditFields.quantity" v-model="batchEditData.quantity" :min="0" style="width: 100%; margin-top: 8px;" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="batchEditFields.unitPrice">批量修改单价</el-checkbox>
          <el-input-number v-if="batchEditFields.unitPrice" v-model="batchEditData.unitPrice" :min="0" :precision="2" style="width: 100%; margin-top: 8px;" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="batchEditFields.orderAmount">批量修改订单金额</el-checkbox>
          <el-input-number v-if="batchEditFields.orderAmount" v-model="batchEditData.orderAmount" :min="0" :precision="2" style="width: 100%; margin-top: 8px;" />
        </el-form-item>
        
        <el-divider content-position="left">付款信息</el-divider>
        <el-form-item>
          <el-checkbox v-model="batchEditFields.paymentBatch">批量修改付款批次</el-checkbox>
          <el-select v-if="batchEditFields.paymentBatch" v-model="batchEditData.paymentBatch" placeholder="选择批次" style="width: 100%; margin-top: 8px;">
            <el-option v-for="b in ['第1笔', '第2笔', '第3笔', '第4笔', '尾款']" :key="b" :label="b" :value="b" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="batchEditFields.paymentType">批量修改付款类型</el-checkbox>
          <el-select v-if="batchEditFields.paymentType" v-model="batchEditData.paymentType" placeholder="选择类型" style="width: 100%; margin-top: 8px;">
            <el-option v-for="t in ['定金', '尾款', '全款']" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="batchEditFields.paymentRatio">批量修改付款比例</el-checkbox>
          <el-input v-if="batchEditFields.paymentRatio" v-model="batchEditData.paymentRatio" placeholder="如 30% 或 30" style="width: 100%; margin-top: 8px;" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="batchEditFields.paymentDate">批量修改付款日期</el-checkbox>
          <el-date-picker v-if="batchEditFields.paymentDate" v-model="batchEditData.paymentDate" type="date" placeholder="选择日期" style="width: 100%; margin-top: 8px;" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="batchEditFields.paymentAmount">批量修改付款金额</el-checkbox>
          <el-input-number v-if="batchEditFields.paymentAmount" v-model="batchEditData.paymentAmount" :min="0" :precision="2" style="width: 100%; margin-top: 8px;" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="batchEditFields.paymentMethod">批量修改付款方式</el-checkbox>
          <el-select v-if="batchEditFields.paymentMethod" v-model="batchEditData.paymentMethod" placeholder="选择方式" style="width: 100%; margin-top: 8px;">
            <el-option v-for="m in ['银行转账', '支付宝', '微信', '现金', '其他']" :key="m" :label="m" :value="m" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="batchEditFields.arrivalStatus">批量修改到账状态</el-checkbox>
          <el-select v-if="batchEditFields.arrivalStatus" v-model="batchEditData.arrivalStatus" placeholder="选择状态" style="width: 100%; margin-top: 8px;">
            <el-option label="已到账" value="已到账" />
            <el-option label="未到账" value="未到账" />
          </el-select>
        </el-form-item>
        
        <el-divider content-position="left">其他</el-divider>
        <el-form-item>
          <el-checkbox v-model="batchEditFields.remark">批量修改备注</el-checkbox>
          <el-input v-if="batchEditFields.remark" v-model="batchEditData.remark" type="textarea" :rows="2" placeholder="输入备注内容" style="width: 100%; margin-top: 8px;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBatchEditDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmBatchEdit">应用修改</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showPaymentPreviewDialog" title="付款记录预览" width="1200px" :close-on-click-modal="false">
      <div class="preview-container">
        <div class="preview-header">
          <h2>客户付款记录</h2>
          <p>{{ new Date().toLocaleDateString('zh-CN') }}</p>
        </div>
        <div class="preview-table">
          <table>
            <thead>
              <tr>
                <th>客户姓名</th>
                <th>订单编号</th>
                <th>产品名称</th>
                <th>规格型号</th>
                <th>颜色</th>
                <th>型号</th>
                <th>币种</th>
                <th>订单金额</th>
                <th>付款批次</th>
                <th>付款类型</th>
                <th>付款比例</th>
                <th>付款金额</th>
                <th>交货日期</th>
                <th>到账状态</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in filteredPayments" :key="p.id">
                <td>{{ p.customerName || '-' }}</td>
                <td>{{ p.orderNo || '-' }}</td>
                <td>{{ p.productName || '-' }}</td>
                <td>{{ p.specModel || '-' }}</td>
                <td>{{ p.color || '-' }}</td>
                <td>{{ p.model || '-' }}</td>
                <td>{{ getCurrencySymbol(p.currency) }}</td>
                <td>{{ p.orderAmount ? p.orderAmount.toLocaleString() : '-' }}</td>
                <td>{{ p.paymentBatch || '-' }}</td>
                <td>{{ p.paymentType || '-' }}</td>
                <td>{{ p.paymentRatio || '-' }}</td>
                <td>{{ p.paymentAmount ? p.paymentAmount.toLocaleString() : '-' }}</td>
                <td>{{ p.deliveryDate || '-' }}</td>
                <td>{{ p.arrivalStatus || '-' }}</td>
                <td>{{ p.remark || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="preview-summary">
          <span>共 {{ filteredPayments.length }} 条记录</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="showPaymentPreviewDialog = false">关闭</el-button>
        <el-button type="primary" @click="exportPayments">导出Excel</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { store, authStore, addCustomer, updateCustomer, deleteCustomer, addLogisticsCompany, addCustomerGroup, updateCustomerGroup, deleteCustomerGroup, syncAllFromSupabase, generateId, saveToLocalStorage, isValidPaymentId } from '../store.js'
import { exportToExcel } from '../utils/excelExport.js'
import { importFromExcel, fieldMappingPresets, showImportResult, importAndSync, getPaymentDateFields, getPaymentAmountFields } from '../utils/excelImport.js'
import FileUploader from './FileUploader.vue'
import { getFileUrlFromSupabase, deleteFileFromSupabase, syncToSupabase, getSupabase, deleteFromSupabase } from '../supabase.js'
import { Document, ZoomIn, Plus, Warning, Close } from '@element-plus/icons-vue'

const props = defineProps({
  currentSubPage: {
    type: String,
    default: 'main'
  }
})

const emit = defineEmits(['sub-page-change'])

const activeTab = ref(props.currentSubPage || 'main')

watch(() => props.currentSubPage, (newVal) => {
  if (newVal && activeTab.value !== newVal) {
    activeTab.value = newVal
  }
}, { immediate: true })

watch(activeTab, (val) => {
  emit('sub-page-change', val)
})

const searchKeyword = ref('')
const filterGroup = ref('')
const followupCustomerId = ref('')
const followupDate = ref('')
const paymentKeyword = ref('')
const paymentFilterCustomer = ref('')
const paymentFilterStatus = ref('')
const showOnlyUrgent = ref(false)

const showCustomerDialog = ref(false)
const showFollowupDialog = ref(false)
const showAddGroupDialog = ref(false)
const showPaymentDialog = ref(false)
const showPaymentPreviewDialog = ref(false)
const isEditingPayment = ref(false)

// 导入文件输入引用
const customerImportInput = ref(null)
const followupImportInput = ref(null)
const groupImportInput = ref(null)
const paymentImportInput = ref(null)
const showCustomerPreviewDialog = ref(false)
const showAttachmentDialog = ref(false)
const showFollowupPreview = ref(false)

const isEditingCustomer = ref(false)
const isEditingFollowup = ref(false)

const selectedCustomerIds = ref([])
const showMoveGroupDialog = ref(false)
const moveTargetGroup = ref('')

const selectedFollowupIds = ref([])
const selectedPaymentIds = ref([])

const showBatchEditDialog = ref(false)
const batchEditFields = reactive({
  currency: false,
  orderDate: false,
  deliveryDate: false,
  color: false,
  memoryConfig: false,
  model: false,
  quantity: false,
  unitPrice: false,
  orderAmount: false,
  paymentBatch: false,
  paymentType: false,
  paymentRatio: false,
  paymentDate: false,
  paymentAmount: false,
  paymentMethod: false,
  arrivalStatus: false,
  remark: false
})
const batchEditData = reactive({
  currency: '',
  orderDate: '',
  deliveryDate: '',
  color: '',
  memoryConfig: '',
  model: '',
  quantity: null,
  unitPrice: null,
  orderAmount: null,
  paymentBatch: '',
  paymentType: '',
  paymentRatio: '',
  paymentDate: '',
  paymentAmount: null,
  paymentMethod: '',
  arrivalStatus: '',
  remark: ''
})

const showFollowupDetailDialog = ref(false)
const currentPreviewFollowup = ref(null)

const showGroupExportDialog = ref(false)
const groupExportFilter = ref('all')
const groupExportTarget = ref('')

const currentAttachments = ref([])
const isLocalhost = computed(() => window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

onMounted(async () => {
  await syncAllFromSupabase()
  initPresetGroups()
})

const PRESET_GROUPS = [
  '中东沙特组',
  '阿联酋UAE组',
  '阿曼/巴林/科威特组',
  '卡塔尔组',
  '黎巴嫩组',
  '欧洲客户组',
  '东南亚客户组'
]

function initPresetGroups() {
  if (!store.customerGroups) {
    store.customerGroups = []
  }
  PRESET_GROUPS.forEach(g => {
    if (!store.customerGroups.includes(g)) {
      store.customerGroups.push(g)
    }
  })
}

function formatFileSize(bytes) {
  if (!bytes) return '0B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + sizes[i]
}

function truncateFileName(name, maxLength = 15) {
  if (!name) return '未知文件'
  if (name.length <= maxLength) return name
  const ext = name.includes('.') ? name.substring(name.lastIndexOf('.')) : ''
  const base = name.substring(0, maxLength - ext.length - 3)
  return base + '...' + ext
}

async function previewSingleFile(file) {
  try {
    if (!file) {
      alert('文件不存在')
      return
    }
    
    if (file.path) {
      const result = await getFileUrlFromSupabase(file.path)
      if (result.success && result.url) {
        window.open(result.url, '_blank')
      } else {
        alert('预览失败: ' + (result.error || '无法获取文件链接'))
      }
    } else if (file.url) {
      window.open(file.url, '_blank')
    } else {
      alert('文件路径无效')
    }
  } catch (e) {
    console.error('Preview error:', e)
    alert('预览失败，请重试')
  }
}

async function copyLocalPath(path) {
  try {
    if (!path) {
      alert('路径为空')
      return
    }
    await navigator.clipboard.writeText(path)
    alert('路径已复制到剪贴板')
  } catch (e) {
    console.error('Copy path error:', e)
    const textarea = document.createElement('textarea')
    textarea.value = path
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('路径已复制到剪贴板')
  }
}

const customerForm = reactive({
  id: '',
  name: '',
  group: '',
  country: '',
  region: '',
  company: '',
  email: '',
  phone: '',
  address: '',
  model: '',
  firstContactDate: new Date().toISOString().split('T')[0],
  sampleCount: 0,
  remark: '',
  localMaterialPath: '',
  attachments: [],
  tags: []
})

const followupForm = reactive({
  id: '',
  customerId: '',
  customerName: '',
  followupDate: new Date().toISOString().split('T')[0],
  content: '',
  result: '',
  nextFollowup: ''
})

const paymentForm = reactive({
  id: '',
  customerId: '',
  customerName: '',
  currency: 'USD',
  orderNo: '',
  orderDate: new Date().toISOString().split('T')[0],
  productName: '',
  specModel: '',
  color: '',
  memoryConfig: '',
  model: '',
  quantity: 0,
  unitPrice: 0,
  orderAmount: 0,
  deliveryDate: '',
  paymentBatch: '第1笔',
  paymentType: '定金',
  paymentRatio: '',
  paymentDate: new Date().toISOString().split('T')[0],
  paymentAmount: 0,
  paymentMethod: '银行转账',
  arrivalStatus: '未到账',
  remark: ''
})

const customerOptions = computed(() => {
  const names = store.customers.map(c => c.name).filter(Boolean)
  if (names.length === 0) {
    return ['Hans', 'Ethan', 'Jason', 'Ralph', 'Mr.Krish']
  }
  return [...new Set(names)]
})

const modelOptions = computed(() => {
  const models = store.productModels.map(m => m.name).filter(Boolean)
  if (models.length === 0) {
    return ['E7 Elite', 'NE75', 'NE76', 'MTK6500']
  }
  return [...new Set(models)]
})

// 产品名称选项
const productNameOptions = computed(() => {
  const productNames = [
    '智能手机主机',
    '平板电脑',
    '智能手表',
    '其他'
  ]
  return productNames
})

// 根据产品名称过滤的型号选项
const filteredModelOptions = computed(() => {
  const productName = paymentForm.productName
  if (!productName) {
    return modelOptions.value
  }
  // 返回所有型号（简化处理，用户可以自由选择）
  return modelOptions.value
})

// 产品规格映射（型号 -> 规格信息）
const modelSpecMap = computed(() => {
  const map = {}
  store.productModels.forEach(m => {
    if (m.name) {
      map[m.name] = {
        spec: `${m.chip || ''} / ${m.screen || ''}`,
        chip: m.chip || '',
        screen: m.screen || '',
        certifications: m.certifications || []
      }
    }
  })
  return map
})

// 产品名称改变时
function onProductNameChange(value) {
  // 清除相关字段
  paymentForm.model = ''
  paymentForm.specModel = ''
  paymentForm.color = ''
  paymentForm.memoryConfig = ''
  
  // 如果选择了产品，可以自动填充一些默认型号
  const defaultModels = {
    '智能手机主机': ['E7 Elite', 'NE75', 'NE76'],
    '平板电脑': ['MTK6500'],
    '智能手表': [],
    '其他': modelOptions.value
  }
  
  const models = defaultModels[value] || modelOptions.value
  if (models.length === 1) {
    paymentForm.model = models[0]
    onModelChange(models[0])
  }
}

// 型号改变时
function onModelChange(model) {
  if (!model) {
    paymentForm.specModel = ''
    return
  }
  
  // 自动填充规格型号
  const specInfo = modelSpecMap.value[model]
  if (specInfo) {
    paymentForm.specModel = `${specInfo.chip} / ${specInfo.screen}`
  } else {
    paymentForm.specModel = model
  }
  
  // 如果是首次选择，可能需要自动计算订单金额
  calcOrderAmount()
}

// 计算订单金额
function calcOrderAmount() {
  if (paymentForm.unitPrice > 0 && paymentForm.quantity > 0) {
    paymentForm.orderAmount = Math.round(paymentForm.unitPrice * paymentForm.quantity * 100) / 100
  }
}

const logisticsOptions = [
  '顺丰速运',
  '圆通速递',
  '中通快递',
  '申通快递',
  '韵达快递',
  'EMS',
  '邮政小包',
  '德邦物流',
  '京东物流',
  '百世汇通',
  'DHL',
  'FedEx',
  'UPS',
  'TNT',
  '安骏物流',
  '燕文物流',
  '云途物流',
  '递四方',
  '万邑通',
  '速卖通'
]

const currencyOptions = [
  { value: 'CNY', label: '人民币 (CNY) - ¥', symbol: '¥' },
  { value: 'USD', label: '美元 (USD) - $', symbol: '$' },
  { value: 'EUR', label: '欧元 (EUR) - €', symbol: '€' },
  { value: 'GBP', label: '英镑 (GBP) - £', symbol: '£' },
  { value: 'JPY', label: '日元 (JPY) - ¥', symbol: '¥' },
  { value: 'HKD', label: '港币 (HKD) - HK$', symbol: 'HK$' },
  { value: 'AUD', label: '澳元 (AUD) - A$', symbol: 'A$' },
  { value: 'CAD', label: '加元 (CAD) - C$', symbol: 'C$' },
  { value: 'SGD', label: '新加坡元 (SGD) - S$', symbol: 'S$' },
  { value: 'KRW', label: '韩元 (KRW) - ₩', symbol: '₩' },
  { value: 'THB', label: '泰铢 (THB) - ฿', symbol: '฿' },
  { value: 'MYR', label: '马币 (MYR) - RM', symbol: 'RM' },
  { value: 'TWD', label: '新台币 (TWD) - NT$', symbol: 'NT$' }
]

function getCurrencySymbol(currency) {
  if (!currency) return '$' // 默认货币为 USD
  const found = currencyOptions.find(c => c.value === currency)
  return found ? found.symbol : (currency + ' ')
}

const newGroupForm = reactive({ name: '' })
const isEditingGroup = ref(false)
const editingGroupName = ref('')

const customerGroups = computed(() => {
  return store.customerGroups || []
})

const logisticsCompanies = computed(() => {
  return store.logisticsCompanies || ['顺丰', 'DHL', 'FedEx', 'UPS', 'EMS']
})

const filteredCustomers = computed(() => {
  return store.customers.filter(c => {
    const matchKeyword = !searchKeyword.value || 
      c.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      c.email.toLowerCase().includes(searchKeyword.value.toLowerCase())
    const matchGroup = !filterGroup.value || c.group === filterGroup.value
    return matchKeyword && matchGroup
  })
})

const filteredFollowups = computed(() => {
  return store.customerFollowUps.filter(f => {
    const matchCustomer = !followupCustomerId.value || f.customerId === followupCustomerId.value
    const matchDate = !followupDate.value || f.followupDate === followupDate.value
    return matchCustomer && matchDate
  })
})

const filteredPayments = computed(() => {
  return store.customerPayments.filter(p => {
    const matchKeyword = !paymentKeyword.value ||
      p.customerName?.toLowerCase().includes(paymentKeyword.value.toLowerCase()) ||
      p.orderNo?.toLowerCase().includes(paymentKeyword.value.toLowerCase())
    const matchCustomer = !paymentFilterCustomer.value || p.customerId === paymentFilterCustomer.value
    const matchStatus = !paymentFilterStatus.value || p.arrivalStatus === paymentFilterStatus.value
    // 催款提醒筛选：只显示近7天到期且未结清的订单
    const matchUrgent = !showOnlyUrgent.value || 
      (p.deliveryDate && isNearDeliveryDate(p.deliveryDate) && getRecordSettlementStatus(p) !== 'settled')
    return matchKeyword && matchCustomer && matchStatus && matchUrgent
  })
})

// 按订单编号分组，计算每个订单的结清状态
const orderSettlementMap = computed(() => {
  const map = {}
  filteredPayments.value.forEach(p => {
    const orderNo = p.orderNo
    if (!orderNo) return
    if (!map[orderNo]) {
      map[orderNo] = { orderAmount: 0, paidAmount: 0 }
    }
    map[orderNo].orderAmount += Number(p.orderAmount) || 0
    if (p.arrivalStatus === '已到账') {
      map[orderNo].paidAmount += Number(p.paymentAmount) || 0
    }
  })
  // 计算每个订单是否有未结清尾款
  const result = {}
  Object.keys(map).forEach(orderNo => {
    const { orderAmount, paidAmount } = map[orderNo]
    const unpaid = orderAmount - paidAmount
    result[orderNo] = {
      orderAmount,
      paidAmount,
      unpaid,
      isSettled: unpaid <= 0,
      hasRemaining: unpaid > 0
    }
  })
  return result
})

// 获取单条记录的结清状态（用于标签显示）
function getRecordSettlementStatus(row) {
  const orderNo = row.orderNo
  if (!orderNo) {
    return row.arrivalStatus === '已到账' ? 'settled' : 'pending'
  }
  const settlement = orderSettlementMap.value[orderNo]
  if (!settlement) {
    return row.arrivalStatus === '已到账' ? 'settled' : 'pending'
  }
  if (settlement.hasRemaining) {
    return 'remaining' // 尾款未结清
  }
  return row.arrivalStatus === '已到账' ? 'settled' : 'pending'
}

// 计算付款比例（自动计算：已付款金额/订单金额）
function parsePaymentRatio(row) {
  // 1. 优先使用订单聚合的自动计算比例（为0时继续回退，不直接返回0）
  const orderNo = row.orderNo
  if (orderNo && orderSettlementMap.value[orderNo]) {
    const settlement = orderSettlementMap.value[orderNo]
    if (settlement.orderAmount > 0) {
      const ratio = Math.round((settlement.paidAmount / settlement.orderAmount) * 100)
      if (ratio > 0) return Math.min(100, Math.max(0, ratio))
    }
  }

  // 2. 单条记录已到账且有付款金额时，按付款金额/订单金额计算
  if (row.arrivalStatus === '已到账' && row.orderAmount > 0) {
    const paidAmount = Number(row.paymentAmount) || 0
    if (paidAmount > 0) {
      return Math.min(100, Math.max(0, Math.round((paidAmount / row.orderAmount) * 100)))
    }
  }

  // 3. 回退到导入的付款比例（Excel 中的 60%/100%/20%）
  const ratio = row.paymentRatio
  if (!ratio && ratio !== 0) return 0
  if (typeof ratio === 'number') {
    return Math.min(100, Math.max(0, ratio))
  }
  if (typeof ratio === 'string') {
    const num = parseInt(ratio.replace('%', ''))
    return Math.min(100, Math.max(0, isNaN(num) ? 0 : num))
  }
  return 0
}

// 获取进度条颜色
function getProgressColor(percentage) {
  if (percentage >= 100) return '#67C23A'
  if (percentage >= 70) return '#409EFF'
  if (percentage >= 30) return '#E6A23C'
  return '#F56C6C'
}

// 判断是否接近交货日期（提前7天提醒）
function isNearDeliveryDate(deliveryDate) {
  if (!deliveryDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const delivery = new Date(deliveryDate)
  delivery.setHours(0, 0, 0, 0)
  
  const diffTime = delivery.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  // 7天内到期或已过期
  return diffDays <= 7
}

// 获取交货日期提醒信息
function getDeliveryReminder(deliveryDate) {
  if (!deliveryDate) return ''
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const delivery = new Date(deliveryDate)
  delivery.setHours(0, 0, 0, 0)
  
  const diffTime = delivery.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    return `⚠️ 已逾期 ${Math.abs(diffDays)} 天，请尽快催款！`
  } else if (diffDays === 0) {
    return `🔔 今日交货，请确认到账！`
  } else if (diffDays <= 3) {
    return `🔔 ${diffDays} 天后交货，请尽快催款！`
  } else if (diffDays <= 7) {
    return `⏰ ${diffDays} 天后交货，请及时跟进付款！`
  }
  return ''
}

const pendingPaymentCount = computed(() => {
  return filteredPayments.value.filter(p => getRecordSettlementStatus(p) !== 'settled').length
})

const settledPaymentCount = computed(() => {
  return filteredStatsPayments.value.filter(p => p.arrivalStatus === '已到账').length
})

const remainingOrderCount = computed(() => {
  return Object.values(orderSettlementMap.value).filter(s => s.hasRemaining).length
})

// 近7天到期且未结清的订单数量
const urgentDeliveryCount = computed(() => {
  const urgentOrders = new Set()
  filteredPayments.value.forEach(p => {
    if (p.deliveryDate && isNearDeliveryDate(p.deliveryDate) && getRecordSettlementStatus(p) !== 'settled') {
      if (p.orderNo) {
        urgentOrders.add(p.orderNo)
      }
    }
  })
  return urgentOrders.size
})

// 催款提醒的待收总金额
const sumUrgentUnpaidAmount = computed(() => {
  let total = 0
  const urgentOrders = new Set()
  filteredPayments.value.forEach(p => {
    if (p.deliveryDate && isNearDeliveryDate(p.deliveryDate) && getRecordSettlementStatus(p) !== 'settled') {
      if (p.orderNo) {
        urgentOrders.add(p.orderNo)
      }
    }
  })
  urgentOrders.forEach(orderNo => {
    const settlement = orderSettlementMap.value[orderNo]
    if (settlement && settlement.hasRemaining) {
      total += settlement.unpaid
    }
  })
  return total
})

// 切换催款提醒筛选
function toggleUrgentFilter() {
  showOnlyUrgent.value = !showOnlyUrgent.value
  if (showOnlyUrgent.value) {
    ElMessage.info('已筛选：近7天到期且未结清的订单')
  } else {
    ElMessage.info('已清除筛选')
  }
}

const statsDisplayCurrency = ref('')

const availableCurrenciesInStats = computed(() => {
  const currs = new Set()
  filteredPayments.value.forEach(p => { if (p.currency) currs.add(p.currency) })
  return Array.from(currs)
})

const filteredStatsPayments = computed(() => {
  if (!statsDisplayCurrency.value) return filteredPayments.value
  return filteredPayments.value.filter(p => p.currency === statsDisplayCurrency.value)
})

const filteredOrderSettlementMap = computed(() => {
  const map = {}
  filteredStatsPayments.value.forEach(p => {
    const orderNo = p.orderNo
    if (!orderNo) return
    if (!map[orderNo]) {
      map[orderNo] = { orderAmount: 0, paidAmount: 0 }
    }
    map[orderNo].orderAmount += Number(p.orderAmount) || 0
    if (p.arrivalStatus === '已到账') {
      map[orderNo].paidAmount += Number(p.paymentAmount) || 0
    }
  })
  const result = {}
  Object.keys(map).forEach(orderNo => {
    const { orderAmount, paidAmount } = map[orderNo]
    const unpaid = orderAmount - paidAmount
    result[orderNo] = {
      orderAmount, paidAmount, unpaid,
      isSettled: unpaid <= 0,
      hasRemaining: unpaid > 0
    }
  })
  return result
})

const statsRemainingOrderCount = computed(() => {
  return Object.values(filteredOrderSettlementMap.value).filter(s => s.hasRemaining).length
})

// 完全未付款的订单数（没有任何到账记录，按订单编号区分，同客户多订单互不合并）
const unpaidOrderCount = computed(() => {
  return Object.values(filteredOrderSettlementMap.value)
    .filter(s => s.orderAmount > 0 && s.paidAmount === 0).length
})

// 完全未付款订单的订单总金额
const sumUnpaidOrderAmount = computed(() => {
  return Object.values(filteredOrderSettlementMap.value)
    .filter(s => s.orderAmount > 0 && s.paidAmount === 0)
    .reduce((sum, s) => sum + s.orderAmount, 0)
})

// 部分付款但未结清的订单数
const partiallyPaidOrderCount = computed(() => {
  return Object.values(filteredOrderSettlementMap.value)
    .filter(s => s.paidAmount > 0 && s.hasRemaining).length
})

const sumSettledAmount = computed(() => {
  return filteredStatsPayments.value
    .filter(p => p.arrivalStatus === '已到账')
    .reduce((sum, p) => sum + (Number(p.paymentAmount) || 0), 0)
})

const sumRemainingAmount = computed(() => {
  return Object.values(filteredOrderSettlementMap.value)
    .filter(s => s.hasRemaining)
    .reduce((sum, s) => sum + s.unpaid, 0)
})

const sumTotalOrderAmount = computed(() => {
  return filteredStatsPayments.value.reduce((sum, p) => sum + (Number(p.orderAmount) || 0), 0)
})

function formatMoney(amount, currency) {
  if (!amount || amount <= 0) return getCurrencySymbol(currency || statsDisplayCurrency.value) + '0'
  return getCurrencySymbol(currency || statsDisplayCurrency.value) + Number(amount).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function paymentRowClassName({ row }) {
  const status = getRecordSettlementStatus(row)
  if (status === 'remaining') return 'payment-remaining-row'
  if (status === 'pending') return 'payment-pending-row'
  return ''
}

function getSampleCount(customerName) {
  return store.sampleDeliveries.filter(s => s.customer_name === customerName).length
}

function formatDate(dateValue) {
  if (!dateValue) return '-'
  if (dateValue instanceof Date) {
    const year = dateValue.getFullYear()
    const month = String(dateValue.getMonth() + 1).padStart(2, '0')
    const day = String(dateValue.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  const str = String(dateValue)
  if (str.includes('T')) {
    return str.split('T')[0]
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str
  }
  try {
    const date = new Date(str)
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  } catch (e) {}
  return '-'
}

function handleCreateLogisticsCompany(name) {
  const result = addLogisticsCompany(name)
  if (!result.success) {
    alert(result.error)
  }
}

function getResultTagType(result) {
  const map = {
    '已成交': 'success',
    '有意向': 'warning',
    '观望中': 'info',
    '无需求': 'danger'
  }
  return map[result] || ''
}

function isOverdueDate(dateStr) {
  if (!dateStr) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  return target < today
}

function exportGroups() {
  const headers = ['分组名称', '客户数量', '客户列表']
  const data = customerGroups.value.map(g => {
    const customers = getGroupCustomers(g)
    return [g, customers.length, customers.map(c => c.name).join('、')]
  })
  exportToExcel('客户分组配置', headers, data)
}

function getGroupCustomerCount(group) {
  return store.customers.filter(c => c.group === group).length
}

function getGroupCustomers(group) {
  return store.customers.filter(c => c.group === group)
}

function handleAddCustomer() {
  isEditingCustomer.value = false
  Object.assign(customerForm, {
    id: '',
    name: '',
    group: '',
    country: '',
    region: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    model: '',
    firstContactDate: new Date().toISOString().split('T')[0],
    sampleCount: 0,
    remark: '',
    localMaterialPath: '',
    attachments: [],
    tags: []
  })
  showCustomerDialog.value = true
}

function handleEditCustomer(row) {
  isEditingCustomer.value = true
  Object.assign(customerForm, {
    id: row.id,
    name: row.name,
    group: row.group,
    country: row.country || '',
    region: row.region,
    company: row.company || '',
    email: row.email,
    phone: row.phone || '',
    address: row.address || '',
    model: row.model,
    firstContactDate: row.firstContactDate,
    sampleCount: row.sampleCount,
    remark: row.remark,
    localMaterialPath: row.localMaterialPath,
    attachments: row.attachments || [],
    tags: row.tags || []
  })
  showCustomerDialog.value = true
}

async function handleDeleteCustomer(row) {
  ElMessageBox.confirm(
    `确定删除客户 ${row.name} 吗？此操作不可恢复。`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    await deleteCustomer(row.id)
  }).catch(() => {})
}

async function handleDeleteAttachment(index) {
  const file = customerForm.attachments[index]
  if (file.path) {
    await deleteFileFromSupabase(file.path)
  }
  customerForm.attachments.splice(index, 1)
}

async function previewAttachments(row) {
  currentAttachments.value = []
  for (const file of row.attachments) {
    const attachment = { ...file }
    if (file.path && file.type && file.type.startsWith('image/')) {
      const result = await getFileUrlFromSupabase(file.path)
      if (result.success) {
        attachment.previewUrl = result.url
      }
    }
    currentAttachments.value.push(attachment)
  }
  showAttachmentDialog.value = true
}

async function downloadAttachment(file) {
  if (file.path) {
    const result = await getFileUrlFromSupabase(file.path)
    if (result.success) {
      window.open(result.url, '_blank')
    } else {
      alert('获取下载链接失败: ' + result.error)
    }
  }
}

function openLocalFolder(row) {
  if (!row.localMaterialPath) {
    alert('请先填写本地产品素材路径')
    return
  }
  const path = row.localMaterialPath.trim()
  if (window.location.protocol === 'file:' || isLocalhost.value) {
    try {
      const link = document.createElement('a')
      link.href = 'file:///' + path.replace(/\\/g, '/')
      link.target = '_blank'
      link.click()
    } catch (e) {
      alert('无法打开文件夹，请手动打开: ' + path)
    }
  } else {
    alert('此功能仅在本地环境可用')
  }
}

function previewCustomers() {
  showCustomerPreviewDialog.value = true
}

async function confirmCustomer() {
  if (!customerForm.id.trim()) {
    customerForm.id = generateId('c')
  }
  if (!isEditingCustomer.value) {
    const exists = store.customers.find(c => c.id === customerForm.id)
    if (exists) {
      alert(`客户ID "${customerForm.id}" 已存在，请更换其他ID`)
      return
    }
  }
  if (!customerForm.name.trim()) {
    console.log('[提示] 客户姓名为空')
  }
  if (isEditingCustomer.value) {
    await updateCustomer(customerForm)
  } else {
    await addCustomer(customerForm)
  }
  showCustomerDialog.value = false
}

function handleAddFollowup() {
  isEditingFollowup.value = false
  Object.assign(followupForm, {
    id: '',
    customerId: '',
    customerName: '',
    followupDate: new Date().toISOString().split('T')[0],
    content: '',
    result: '',
    nextFollowup: ''
  })
  showFollowupDialog.value = true
}

function handleEditFollowup(row) {
  isEditingFollowup.value = true
  Object.assign(followupForm, row)
  showFollowupDialog.value = true
}

function handleDeleteFollowup(row) {
  ElMessageBox.confirm(
    '确定删除该跟进记录吗？此操作不可恢复。',
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const idx = store.customerFollowUps.findIndex(f => f.id === row.id)
    if (idx > -1) {
      store.customerFollowUps.splice(idx, 1)
    }
  }).catch(() => {})
}

function confirmFollowup() {
  if (!followupForm.customerId || !followupForm.content.trim()) {
    alert('请填写关联客户和跟进内容')
    return
  }
  const customer = store.customers.find(c => c.id === followupForm.customerId)
  followupForm.customerName = customer ? customer.name : ''
  
  if (!followupForm.id.trim()) {
    followupForm.id = generateId('FU')
  }
  if (!isEditingFollowup.value) {
    const exists = store.customerFollowUps.find(f => f.id === followupForm.id)
    if (exists) {
      alert(`记录ID "${followupForm.id}" 已存在，请更换其他ID`)
      return
    }
  }
  
  if (isEditingFollowup.value) {
    const idx = store.customerFollowUps.findIndex(f => f.id === followupForm.id)
    if (idx > -1) {
      store.customerFollowUps[idx] = { ...followupForm }
    }
  } else {
    store.customerFollowUps.unshift({ ...followupForm })
  }
  showFollowupDialog.value = false
}

async function handleAddGroup() {
  const name = newGroupForm.name.trim()
  if (!name) {
    alert('请填写分组名称')
    return
  }
  if (store.customerGroups.includes(name)) {
    alert('分组已存在')
    return
  }
  await addCustomerGroup(name)
  newGroupForm.name = ''
  showAddGroupDialog.value = false
}

function handleEditGroup(groupName) {
  isEditingGroup.value = true
  editingGroupName.value = groupName
  newGroupForm.name = groupName
  showAddGroupDialog.value = true
}

async function handleSaveEditGroup() {
  const newName = newGroupForm.name.trim()
  if (!newName) {
    alert('请填写分组名称')
    return
  }
  if (newName !== editingGroupName.value && store.customerGroups.includes(newName)) {
    alert('分组已存在')
    return
  }
  
  await updateCustomerGroup(editingGroupName.value, newName)
  
  isEditingGroup.value = false
  editingGroupName.value = ''
  newGroupForm.name = ''
  showAddGroupDialog.value = false
}

async function handleDeleteGroup(groupName) {
  const customerCount = getGroupCustomerCount(groupName)
  if (customerCount > 0) {
    alert(`该分组下有 ${customerCount} 位客户，无法删除。请先将客户移动到其他分组。`)
    return
  }
  ElMessageBox.confirm(
    `确定要删除分组 "${groupName}" 吗？此操作不可恢复。`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    await deleteCustomerGroup(groupName)
  }).catch(() => {})
}

function onPaymentCustomerChange(customerId) {
  const customer = store.customers.find(c => c.id === customerId)
  paymentForm.customerName = customer ? customer.name : ''
}

function handleAddPayment() {
  isEditingPayment.value = false
  Object.assign(paymentForm, {
    id: '',
    customerId: '',
    customerName: '',
    currency: 'USD',
    orderNo: '',
    orderDate: new Date().toISOString().split('T')[0],
    productName: '',
    specModel: '',
    color: '',
    memoryConfig: '',
    model: '',
    quantity: 0,
    unitPrice: 0,
    orderAmount: 0,
    deliveryDate: '',
    paymentBatch: '第1笔',
    paymentType: '定金',
    paymentRatio: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentAmount: 0,
    paymentMethod: '银行转账',
    arrivalStatus: '未到账',
    remark: ''
  })
  showPaymentDialog.value = true
}

function handleEditPayment(row) {
  isEditingPayment.value = true
  Object.assign(paymentForm, row)
  showPaymentDialog.value = true
}

async function handleDeletePayment(row) {
  ElMessageBox.confirm(
    `确认删除付款记录 "${row.id}"？此操作不可恢复。`,
    '确认删除',
    { type: 'warning' }
  ).then(async () => {
    // 本地删除
    const idx = store.customerPayments.findIndex(p => p.id === row.id)
    if (idx > -1) store.customerPayments.splice(idx, 1)
    saveToLocalStorage()
    
    // 云端同步删除
    const client = await getSupabase()
    const isLoggedIn = !store.localMode && client
    
    if (isLoggedIn) {
      const r = await deleteFromSupabase('customer_payments', row.id)
      if (r.success) {
        ElMessage.success('删除成功并已同步到云端')
      } else {
        console.warn(`[付款记录] 删除同步失败: ${r.error}`)
        ElMessage({ type: 'warning', duration: 6000, message: '本地已删除，云端同步失败，请检查网络后重试' })
      }
    } else {
      ElMessage.success('删除成功')
    }
  }).catch(() => {})
}

async function confirmPayment() {
  if (!paymentForm.customerId || !paymentForm.orderNo.trim()) {
    ElMessage.warning('请填写客户和订单编号')
    return
  }
  // 主键生成规则统一：强制 generateId('cp') 输出 CPAY-xxxxxxxxxxxx
  if (!paymentForm.id.trim()) {
    paymentForm.id = generateId('cp')
  } else if (!isValidPaymentId(paymentForm.id)) {
    // 非标准 CPAY- 前缀，拦截并重新生成
    ElMessage.warning(`付款记录ID格式不规范（${paymentForm.id}），已自动重新生成`)
    console.warn('[付款记录] 非标准ID已拦截:', paymentForm.id)
    paymentForm.id = generateId('cp')
  }

  // ===== 1) 本地写入 =====
  if (isEditingPayment.value) {
    const idx = store.customerPayments.findIndex(p => p.id === paymentForm.id)
    if (idx > -1) {
      const { id, ...rest } = paymentForm
      store.customerPayments[idx] = { id, ...rest, _pendingSync: false }
    }
  } else {
    const { id, ...rest } = paymentForm
    store.customerPayments.unshift({ id, ...rest, _pendingSync: false })
  }
  saveToLocalStorage()

  // ===== 2) 云端同步写入 =====
  const client = await getSupabase()
  const isLoggedIn = !store.localMode && client

  if (!isLoggedIn) {
    // 未登录：标记为待同步队列，不阻塞本地操作
    const idx = store.customerPayments.findIndex(p => p.id === paymentForm.id)
    if (idx > -1) {
      store.customerPayments[idx]._pendingSync = true
      saveToLocalStorage()
    }
    ElMessage.warning('未登录云端，仅本地缓存。登录后可在【设置→Supabase配置】一键同步')
    showPaymentDialog.value = false
    return
  }

  try {
    localStorage.removeItem('supabase_rls_failed')
    const { id, ...rest } = paymentForm
    const payload = { id, ...rest }
    delete payload._pendingSync
    const r = await syncToSupabase('customer_payments', payload)
    if (r.success) {
      // 同步成功：清除待同步标记
      const idx = store.customerPayments.findIndex(p => p.id === paymentForm.id)
      if (idx > -1) {
        store.customerPayments[idx]._pendingSync = false
        saveToLocalStorage()
      }
      console.log(`[付款记录] CPAY-ID=${id} 同步成功，动作: ${isEditingPayment.value ? '覆盖' : '新增'}, 时间: ${new Date().toISOString()}`)
      ElMessage.success(isEditingPayment.value ? '更新成功并已同步到云端' : '新增成功并已同步到云端')
    } else {
      // 云端写入失败：标记为待同步队列，不阻塞本地
      const idx = store.customerPayments.findIndex(p => p.id === paymentForm.id)
      if (idx > -1) {
        store.customerPayments[idx]._pendingSync = true
        saveToLocalStorage()
      }
      const reason = r.error || r.rawError || '未知错误'
      console.warn(`[付款记录] CPAY-ID=${paymentForm.id} 同步失败: ${reason}`)
      ElMessage({ type: 'warning', duration: 6000, message: `本地已保存，云端同步失败（已加入待同步队列）：${reason}` })
    }
  } catch (e) {
    const idx = store.customerPayments.findIndex(p => p.id === paymentForm.id)
    if (idx > -1) {
      store.customerPayments[idx]._pendingSync = true
      saveToLocalStorage()
    }
    console.warn(`[付款记录] CPAY-ID=${paymentForm.id} 同步异常:`, e)
    ElMessage({ type: 'warning', duration: 6000, message: `本地已保存，云端同步异常（已加入待同步队列）：${e.message || e}` })
  }
  showPaymentDialog.value = false
}

function previewPayments() {
  showPaymentPreviewDialog.value = true
}

function exportPayments() {
  const headers = ['客户姓名', '订单编号', '订单日期', '产品名称', '规格型号', '颜色', '内存配置', '型号', '币种', '数量', '单价', '订单金额', '交货日期', '付款批次', '付款类型', '付款比例', '付款日期', '付款金额', '付款方式', '到账状态', '备注']
  const data = filteredPayments.value.map(p => [
    p.customerName || '',
    p.orderNo || '',
    p.orderDate || '',
    p.productName || '',
    p.specModel || '',
    p.color || '',
    p.memoryConfig || '',
    p.model || '',
    p.currency || 'USD',
    p.quantity || 0,
    p.unitPrice || 0,
    p.orderAmount || 0,
    p.deliveryDate || '',
    p.paymentBatch || '',
    p.paymentType || '',
    p.paymentRatio || '',
    p.paymentDate || '',
    p.paymentAmount || 0,
    p.paymentMethod || '',
    p.arrivalStatus || '',
    p.remark || ''
  ])
  exportToExcel('客户付款记录', headers, data)
}

function exportCustomers() {
  const headers = ['id', 'name', 'group', 'country', 'region', 'company', 'email', 'phone', 'address', 'created_at']
  const data = filteredCustomers.value.map(c => [
    c.id, c.name, c.group, c.country || '', c.region || '', c.company || '', c.email || '', c.phone || '', c.address || '', c.firstContactDate || ''
  ])
  exportToExcel('客户台账', headers, data)
}

// 触发文件选择
function triggerCustomerImport() {
  customerImportInput.value?.click()
}

// 处理客户导入
async function handleCustomerImport(event) {
  const file = event.target.files[0]
  if (!file) return

  // 重置 input 以便可以再次选择相同文件
  event.target.value = ''

  const result = await importFromExcel(file, {
    fieldMapping: fieldMappingPresets.customers,
    headerRow: 2,
    startRow: 3
  })

  if (!result.success) {
    ElMessage.error(result.message || '导入失败')
    return
  }

  // 确认导入
  ElMessageBox.confirm(
    `检测到 ${result.data.length} 条客户数据，是否导入？\n注意：相同ID的客户将被覆盖`,
    '确认导入',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(async () => {
    // 导入数据
    let importedCount = 0
    const importedCustomers = []
    result.data.forEach(customer => {
      // 生成短编号 ID：如果已有 CUST-XXXX 格式则保留，否则用 generateId 生成
      let id = customer.id
      if (!id || !/^CUST-\d{4}$/.test(id)) {
        id = generateId('c')
      }

      const idx = store.customers.findIndex(c => c.id === id)
      let newCustomer
      if (idx > -1) {
        // 更新现有客户
        newCustomer = { ...store.customers[idx], ...customer, id }
        store.customers[idx] = newCustomer
      } else {
        // 添加新客户
        newCustomer = {
          id,
          name: customer.name || '',
          group: customer.group || '',
          country: customer.country || '',
          region: customer.region || '',
          company: customer.company || '',
          email: customer.email || '',
          phone: customer.phone || '',
          address: customer.address || '',
          model: customer.model || '',
          firstContactDate: customer.firstContactDate || '',
          localMaterialPath: '',
          attachments: [],
          remark: customer.remark || ''
        }
        store.customers.push(newCustomer)
      }
      importedCustomers.push(newCustomer)
      importedCount++
    })

    // 保存到本地
    saveToLocalStorage()

    // 同步到云端
    if (!store.localMode) {
      try {
        // 清除旧的 RLS 失败标记，避免误判为离线模式而跳过同步
        localStorage.removeItem('supabase_rls_failed')
        const { syncToSupabase } = await import('../supabase.js')
        let syncSuccess = 0
        let syncFail = 0
        const failReasons = []
        for (const customer of importedCustomers) {
          const r = await syncToSupabase('customers', customer)
          if (r.success) {
            syncSuccess++
          } else {
            syncFail++
            // 收集失败原因（去重，最多 3 条），便于定位字段/权限问题
            const reason = r.error || r.rawError || '未知错误'
            if (failReasons.length < 3 && !failReasons.includes(reason)) {
              failReasons.push(reason)
            }
          }
        }
        if (syncFail === 0) {
          ElMessage.success(`成功导入 ${importedCount} 条客户数据并已同步到云端`)
        } else {
          const detail = failReasons.length > 0 ? `\n失败原因：${failReasons.join('；')}` : ''
          ElMessage({
            type: 'warning',
            duration: 6000,
            message: `导入成功 ${importedCount} 条，云端同步成功 ${syncSuccess} 条，失败 ${syncFail} 条${detail}`
          })
          console.warn('[客户导入] 同步失败明细:', failReasons)
        }
      } catch (e) {
        console.error('云端同步失败:', e)
        ElMessage({
          type: 'warning',
          duration: 6000,
          message: `导入成功 ${importedCount} 条，但云端同步失败：${e.message || e}`
        })
      }
    } else {
      ElMessage.success(`成功导入 ${importedCount} 条客户数据（本地模式）`)
    }
  }).catch(() => {})
}

// 触发跟进记录导入
function triggerFollowupImport() {
  followupImportInput.value?.click()
}

// 处理跟进记录导入
async function handleFollowupImport(event) {
  const file = event.target.files[0]
  if (!file) return
  event.target.value = ''

  const result = await importFromExcel(file, {
    fieldMapping: fieldMappingPresets.customerFollowUps,
    headerRow: 2,
    startRow: 3
  })

  if (!result.success) {
    ElMessage.error(result.message || '导入失败')
    return
  }

  ElMessageBox.confirm(
    `检测到 ${result.data.length} 条跟进记录，是否导入？\n注意：相同ID的记录将被覆盖`,
    '确认导入',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'info' }
  ).then(async () => {
    const importedFollowups = []
    result.data.forEach(followup => {
      const idx = store.customerFollowUps.findIndex(f => f.id === followup.id)
      let rec
      if (idx > -1) {
        rec = { ...store.customerFollowUps[idx], ...followup }
        store.customerFollowUps[idx] = rec
      } else {
        rec = {
          id: followup.id || `fu${Date.now()}`,
          customerId: followup.customerId || '',
          customerName: followup.customerName || '',
          followupDate: followup.followupDate || '',
          content: followup.content || '',
          result: followup.result || '',
          contactMethod: followup.contactMethod || '',
          poNumber: followup.poNumber || '',
          nextFollowup: followup.nextFollowup || '',
          operator: followup.operator || '',
          remark: followup.remark || ''
        }
        store.customerFollowUps.push(rec)
      }
      importedFollowups.push(rec)
    })
    saveToLocalStorage()

    if (!store.localMode) {
      try {
        localStorage.removeItem('supabase_rls_failed')
        const { syncToSupabase } = await import('../supabase.js')
        let syncSuccess = 0
        let syncFail = 0
        const failReasons = []
        for (const f of importedFollowups) {
          const r = await syncToSupabase('customer_follow_ups', f)
          if (r.success) syncSuccess++
          else {
            syncFail++
            const reason = r.error || r.rawError || '未知错误'
            if (failReasons.length < 3 && !failReasons.includes(reason)) failReasons.push(reason)
          }
        }
        if (syncFail === 0) {
          ElMessage.success(`成功导入 ${importedFollowups.length} 条跟进记录并已同步到云端`)
        } else {
          const detail = failReasons.length > 0 ? `\n失败原因：${failReasons.join('；')}` : ''
          ElMessage({ type: 'warning', duration: 6000, message: `导入成功 ${importedFollowups.length} 条，云端同步成功 ${syncSuccess} 条，失败 ${syncFail} 条${detail}` })
        }
      } catch (e) {
        console.error('云端同步失败:', e)
        ElMessage({ type: 'warning', duration: 6000, message: `导入成功 ${importedFollowups.length} 条，但云端同步失败：${e.message || e}` })
      }
    } else {
      ElMessage.success(`成功导入 ${importedFollowups.length} 条跟进记录（本地模式）`)
    }
  }).catch(() => {})
}

// 触发客户分组导入
function triggerGroupImport() {
  groupImportInput.value?.click()
}

// 处理客户分组导入
async function handleGroupImport(event) {
  const file = event.target.files[0]
  if (!file) return
  event.target.value = ''

  // 客户分组的字段映射
  const groupFieldMapping = [
    { excelHeader: '分组名称', dataField: 'name' },
    { excelHeader: '客户列表', dataField: 'customers' }
  ]

  const result = await importFromExcel(file, {
    fieldMapping: groupFieldMapping,
    headerRow: 2,
    startRow: 3
  })

  if (!result.success) {
    ElMessage.error(result.message || '导入失败')
    return
  }

  ElMessageBox.confirm(
    `检测到 ${result.data.length} 个客户分组，是否导入？`,
    '确认导入',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'info' }
  ).then(() => {
    result.data.forEach(group => {
      if (group.name && !store.customerGroups.includes(group.name)) {
        store.customerGroups.push(group.name)
      }
    })
    ElMessage.success(`成功导入 ${result.data.length} 个客户分组`)
  }).catch(() => {})
}

// 触发付款记录导入
function triggerPaymentImport() {
  paymentImportInput.value?.click()
}

// 处理付款记录导入
async function handlePaymentImport(event) {
  const file = event.target.files[0]
  if (!file) return
  event.target.value = ''

  const result = await importFromExcel(file, {
    fieldMapping: fieldMappingPresets.customerPayments,
    headerRow: 2,
    startRow: 3,
    autoDetectHeader: true,
    dateFields: getPaymentDateFields(),
    amountFields: getPaymentAmountFields(),
    numericFields: ['quantity', 'unitPrice', 'orderAmount', 'paymentAmount']
  })

  if (!result.success) {
    ElMessage.error(result.message || '导入失败')
    return
  }

  if (result.detectedCurrency) {
    ElMessage.info(`检测到货币类型：${result.detectedCurrency}，将自动设置货币为 ${result.detectedCurrency}`)
  }

  ElMessageBox.confirm(
    `检测到 ${result.data.length} 条付款记录，是否导入？\n注意：相同ID的记录将被覆盖`,
    '确认导入',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'info' }
  ).then(async () => {
    const importedPayments = []
    result.data.forEach(payment => {
      // 根据客户姓名查找客户ID
      let customerId = payment.customerId || ''
      if (!customerId && payment.customerName) {
        const customer = store.customers.find(c => c.name === payment.customerName)
        if (customer) {
          customerId = customer.id
        }
      }

      // 生成ID
      let id = payment.id
      if (!id || !/^CPAY-/.test(id)) {
        id = generateId('cp')
      }

      // 货币识别：优先使用检测到的货币，默认为 USD
      let currency = payment.currency || ''
      if (!currency && result.detectedCurrency) {
        currency = result.detectedCurrency
      }
      if (!currency) {
        currency = 'USD' // 默认货币为 USD
      }

      // 智能推断到账状态：Excel 无到账状态列时，
      // 有付款日期且付款金额>0，或付款类型为"全款"且有付款金额 → 视为已到账
      if (!payment.arrivalStatus) {
        const hasPaid = Number(payment.paymentAmount) > 0
        if ((payment.paymentDate && hasPaid) || (payment.paymentType === '全款' && hasPaid)) {
          payment.arrivalStatus = '已到账'
        } else {
          payment.arrivalStatus = '未到账'
        }
      }

      const idx = store.customerPayments.findIndex(p => p.id === id)
      let rec
      if (idx > -1) {
        rec = {
          ...store.customerPayments[idx],
          ...payment,
          id,
          customerId,
          currency // 保留识别到的货币
        }
        store.customerPayments[idx] = rec
      } else {
        rec = {
          id,
          customerId,
          customerName: payment.customerName || '',
          currency,
          orderNo: payment.orderNo || '',
          orderDate: payment.orderDate || '',
          productName: payment.productName || '',
          specModel: payment.specModel || '',
          color: payment.color || '',
          model: payment.model || '',
          memoryConfig: payment.memoryConfig || '',
          quantity: Number(payment.quantity) || 0,
          unitPrice: Number(payment.unitPrice) || 0,
          orderAmount: Number(payment.orderAmount) || 0,
          deliveryDate: payment.deliveryDate || '',
          paymentBatch: payment.paymentBatch || '第1笔',
          paymentType: payment.paymentType || '定金',
          paymentRatio: payment.paymentRatio || '',
          paymentDate: payment.paymentDate || '',
          paymentAmount: Number(payment.paymentAmount) || 0,
          paymentMethod: payment.paymentMethod || '银行转账',
          arrivalStatus: payment.arrivalStatus || '未到账',
          remark: payment.remark || ''
        }
        store.customerPayments.unshift(rec)
      }
      importedPayments.push(rec)
    })
    saveToLocalStorage()

    if (!store.localMode) {
      try {
        localStorage.removeItem('supabase_rls_failed')
        let syncSuccess = 0
        let syncFail = 0
        const failReasons = []
        for (const p of importedPayments) {
          const r = await syncToSupabase('customer_payments', p)
          if (r.success) syncSuccess++
          else {
            syncFail++
            const reason = r.error || r.rawError || '未知错误'
            if (failReasons.length < 3 && !failReasons.includes(reason)) failReasons.push(reason)
          }
        }
        if (syncFail === 0) {
          ElMessage.success(`成功导入 ${importedPayments.length} 条付款记录并已同步到云端`)
        } else {
          const detail = failReasons.length > 0 ? `\n失败原因：${failReasons.join('；')}` : ''
          ElMessage({ type: 'warning', duration: 6000, message: `导入成功 ${importedPayments.length} 条，云端同步成功 ${syncSuccess} 条，失败 ${syncFail} 条${detail}` })
        }
      } catch (e) {
        console.error('云端同步失败:', e)
        ElMessage({ type: 'warning', duration: 6000, message: `导入成功 ${importedPayments.length} 条，但云端同步失败：${e.message || e}` })
      }
    } else {
      ElMessage.success(`成功导入 ${importedPayments.length} 条付款记录（本地模式）`)
    }
  }).catch(() => {})
}

const followupPreviewData = computed(() => {
  return filteredFollowups.value.slice(0, 50)
})

function openFollowupPreview() {
  if (filteredFollowups.value.length === 0) {
    ElMessageBox.alert('暂无跟进记录可导出', '提示')
    return
  }
  showFollowupPreview.value = true
}

function confirmFollowupExport() {
  const headers = ['记录ID', '客户姓名', '跟进日期', '跟进内容', '跟进结果', '下次跟进']
  const data = filteredFollowups.value.map(f => [
    f.id, f.customerName || '', f.followupDate || '', f.content || '', f.result || '', f.nextFollowup || ''
  ])
  exportToExcel('客户跟进记录', headers, data)
  showFollowupPreview.value = false
}

function handleCustomerSelectionChange(selection) {
  selectedCustomerIds.value = selection.map(c => c.id)
}

async function batchDeleteCustomers() {
  if (selectedCustomerIds.value.length === 0) {
    ElMessage.warning('请先勾选需要删除的客户')
    return
  }
  
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedCustomerIds.value.length} 位客户吗？此操作不可恢复！`,
    '确认批量删除',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'error'
    }
  ).then(async () => {
    let deletedCount = 0
    for (const id of selectedCustomerIds.value) {
      try {
        await deleteCustomer(id)
        deletedCount++
      } catch (e) {
        console.error(`删除客户 ${id} 失败:`, e)
      }
    }
    selectedCustomerIds.value = []
    ElMessage.success(`成功删除 ${deletedCount} 位客户`)
  }).catch(() => {})
}

function handleFollowupSelectionChange(selection) {
  selectedFollowupIds.value = selection.map(f => f.id)
}

function openMoveGroupDialog() {
  if (selectedCustomerIds.value.length === 0) {
    ElMessage.warning('请先勾选需要操作的数据')
    return
  }
  moveTargetGroup.value = ''
  showMoveGroupDialog.value = true
}

function confirmMoveGroup() {
  if (!moveTargetGroup.value) {
    ElMessage.warning('请选择目标分组')
    return
  }
  ElMessageBox.confirm(
    `已选择 ${selectedCustomerIds.value.length} 位客户，确认将其移动到「${moveTargetGroup.value}」？`,
    '确认批量分配分组',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    selectedCustomerIds.value.forEach(id => {
      const customer = store.customers.find(c => c.id === id)
      if (customer) {
        customer.group = moveTargetGroup.value
      }
    })
    ElMessage.success(`已将 ${selectedCustomerIds.value.length} 位客户移动到「${moveTargetGroup.value}」`)
    selectedCustomerIds.value = []
    showMoveGroupDialog.value = false
  }).catch(() => {})
}

async function exportGroupsEnhanced() {
  let groupsToExport = customerGroups.value
  if (groupExportFilter.value === 'single' && groupExportTarget.value) {
    groupsToExport = [groupExportTarget.value]
  }
  if (groupsToExport.length === 0) {
    ElMessage.warning('暂无分组可导出')
    return
  }
  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  workbook.creator = '项目工作台'
  workbook.created = new Date()
  const mainSheet = workbook.addWorksheet('分组清单')
  const titleRow = mainSheet.addRow([`客户分组清单 - ${new Date().toLocaleDateString('zh-CN')}`])
  titleRow.font = { name: '微软雅黑', size: 16, bold: true, color: { argb: 'FF1a1a2e' } }
  titleRow.alignment = { horizontal: 'center' }
  mainSheet.mergeCells('A1:D1')
  mainSheet.addRow([])
  const headers = ['分组名称', '分组内客户数量', '客户英文名', '对接人', '国家', '联系方式']
  const headerRow = mainSheet.addRow(headers)
  headerRow.font = { name: '微软雅黑', size: 12, bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a1a2e' } }
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
  headerRow.height = 28
  groupsToExport.forEach(group => {
    const customers = getGroupCustomers(group)
    if (customers.length === 0) {
      mainSheet.addRow([group, 0, '', '', '', ''])
    } else {
      customers.forEach((c, idx) => {
        const row = mainSheet.addRow([
          idx === 0 ? group : '',
          idx === 0 ? customers.length : '',
          c.name || '',
          c.email || '',
          c.country || '',
          c.phone || ''
        ])
        row.font = { name: '微软雅黑', size: 11 }
        row.alignment = { vertical: 'middle' }
        row.height = 22
      })
    }
  })
  const widths = [18, 14, 15, 20, 12, 18]
  widths.forEach((w, i) => {
    mainSheet.getColumn(i + 1).width = w
    mainSheet.getColumn(i + 1).alignment = { vertical: 'middle', horizontal: 'left' }
  })
  const dateStr = new Date().toISOString().split('T')[0]
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `客户分组_${dateStr}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
  showGroupExportDialog.value = false
  ElMessage.success('分组导出成功')
}

function openFollowupDetail(row) {
  currentPreviewFollowup.value = row
  showFollowupDetailDialog.value = true
}

function printFollowupDetail() {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return
  const row = currentPreviewFollowup.value
  if (!row) return
  const customer = store.customers.find(c => c.id === row.customerId)
  const groupName = customer ? customer.group : '-'
  const attachNames = row.attachments && row.attachments.length > 0
    ? row.attachments.map(a => a.name).join('、')
    : '-'
  printWindow.document.write(`
    <html>
    <head>
      <title>跟进记录详情 - ${row.id}</title>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; padding: 40px; }
        h1 { text-align: center; color: #1a1a2e; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #d0d0d0; padding: 12px 15px; text-align: left; }
        th { background: #1a1a2e; color: #fff; width: 150px; font-weight: 600; }
        .meta { color: #666; font-size: 14px; margin-top: 20px; text-align: center; }
      </style>
    </head>
    <body>
      <h1>跟进记录详情</h1>
      <table>
        <tr><th>跟进ID</th><td>${row.id || '-'}</td></tr>
        <tr><th>客户名称</th><td>${row.customerName || '-'}</td></tr>
        <tr><th>所属分组</th><td>${groupName}</td></tr>
        <tr><th>跟进日期</th><td>${row.followupDate || '-'}</td></tr>
        <tr><th>沟通方式</th><td>${row.contactMethod || '-'}</td></tr>
        <tr><th>跟进详情</th><td>${row.content || '-'}</td></tr>
        <tr><th>关联PO号</th><td>${row.poNumber || '-'}</td></tr>
        <tr><th>下次跟进时间</th><td>${row.nextFollowup || '-'}</td></tr>
        <tr><th>操作人</th><td>${row.operator || '-'}</td></tr>
        <tr><th>附件名称</th><td>${attachNames}</td></tr>
      </table>
      <div class="meta">打印时间：${new Date().toLocaleString('zh-CN')}</div>
      <script>window.onload = function() { window.print(); }<\/script>
    </body>
    </html>
  `)
  printWindow.document.close()
}

async function exportFollowupsEnhanced() {
  let dataToExport = filteredFollowups.value
  if (dataToExport.length === 0) {
    ElMessage.warning('暂无跟进记录可导出')
    return
  }
  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  workbook.creator = '项目工作台'
  workbook.created = new Date()
  const worksheet = workbook.addWorksheet('跟进记录')
  const titleRow = worksheet.addRow([`客户跟进记录 - ${new Date().toLocaleDateString('zh-CN')}`])
  titleRow.font = { name: '微软雅黑', size: 16, bold: true, color: { argb: 'FF1a1a2e' } }
  titleRow.alignment = { horizontal: 'center' }
  worksheet.mergeCells('A1:J1')
  worksheet.addRow([])
  const headers = ['跟进ID', '客户名称', '所属分组', '跟进日期', '沟通方式', '跟进详情', '关联PO号', '下次跟进时间', '操作人', '附件名称']
  const headerRow = worksheet.addRow(headers)
  headerRow.font = { name: '微软雅黑', size: 12, bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a1a2e' } }
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
  headerRow.height = 28
  dataToExport.forEach(f => {
    const customer = store.customers.find(c => c.id === f.customerId)
    const groupName = customer ? customer.group : '-'
    const attachNames = f.attachments && f.attachments.length > 0
      ? f.attachments.map(a => a.name).join('、')
      : '-'
    const row = worksheet.addRow([
      f.id || '',
      f.customerName || '',
      groupName,
      f.followupDate || '',
      f.contactMethod || '',
      f.content || '',
      f.poNumber || '',
      f.nextFollowup || '',
      f.operator || '',
      attachNames
    ])
    row.font = { name: '微软雅黑', size: 11 }
    row.alignment = { vertical: 'middle' }
    row.height = 22
  })
  const widths = [12, 15, 14, 12, 12, 30, 14, 14, 12, 20]
  widths.forEach((w, i) => {
    worksheet.getColumn(i + 1).width = w
    worksheet.getColumn(i + 1).alignment = { vertical: 'middle', horizontal: 'left' }
  })
  const dateStr = new Date().toISOString().split('T')[0]
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `跟进记录_${dateStr}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('跟进记录导出成功')
}

function batchDeleteFollowups() {
  if (selectedFollowupIds.value.length === 0) {
    ElMessage.warning('请先勾选需要操作的数据')
    return
  }
  ElMessageBox.confirm(
    `已勾选 ${selectedFollowupIds.value.length} 条跟进记录，删除不可恢复，确认执行？`,
    '确认批量删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    selectedFollowupIds.value.forEach(id => {
      const idx = store.customerFollowUps.findIndex(f => f.id === id)
      if (idx > -1) {
        store.customerFollowUps.splice(idx, 1)
      }
    })
    ElMessage.success(`已删除 ${selectedFollowupIds.value.length} 条跟进记录`)
    selectedFollowupIds.value = []
  }).catch(() => {})
}

function handlePaymentSelectionChange(selection) {
  selectedPaymentIds.value = selection.map(p => p.id)
}

async function batchDeletePayments() {
  if (selectedPaymentIds.value.length === 0) {
    ElMessage.warning('请先勾选需要删除的付款记录')
    return
  }
  ElMessageBox.confirm(
    `确定删除选中的 ${selectedPaymentIds.value.length} 条付款记录吗？此操作不可恢复！`,
    '确认批量删除',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'error'
    }
  ).then(async () => {
    let deletedCount = 0
    let cloudFailedCount = 0
    
    // 获取 Supabase 客户端状态
    const client = await getSupabase()
    const isLoggedIn = !store.localMode && client
    
    for (const id of selectedPaymentIds.value) {
      const idx = store.customerPayments.findIndex(p => p.id === id)
      if (idx > -1) {
        store.customerPayments.splice(idx, 1)
        deletedCount++
        
        // 云端同步删除
        if (isLoggedIn) {
          const r = await deleteFromSupabase('customer_payments', id)
          if (!r.success) {
            cloudFailedCount++
            console.warn(`[付款记录] 批量删除同步失败: ${id}, ${r.error}`)
          }
        }
      }
    }
    saveToLocalStorage()
    selectedPaymentIds.value = []
    
    if (isLoggedIn && cloudFailedCount > 0) {
      ElMessage({ type: 'warning', duration: 6000, message: `本地已删除 ${deletedCount} 条，云端同步失败 ${cloudFailedCount} 条，请检查网络后重试` })
    } else {
      ElMessage.success(`成功删除 ${deletedCount} 条付款记录${isLoggedIn ? '并已同步到云端' : ''}`)
    }
  }).catch(() => {})
}

function openBatchEditDialog() {
  if (selectedPaymentIds.value.length === 0) {
    ElMessage.warning('请先勾选需要编辑的付款记录')
    return
  }
  // Reset checkboxes and data
  Object.keys(batchEditFields).forEach(key => { batchEditFields[key] = false })
  Object.assign(batchEditData, {
    currency: '',
    orderDate: '',
    deliveryDate: '',
    quantity: null,
    unitPrice: null,
    orderAmount: null,
    paymentBatch: '',
    paymentType: '',
    paymentDate: '',
    paymentAmount: null,
    paymentMethod: '',
    arrivalStatus: '',
    remark: ''
  })
  showBatchEditDialog.value = true
}

async function confirmBatchEdit() {
  // Check if any field is selected
  const selectedFields = Object.keys(batchEditFields).filter(k => batchEditFields[k])
  if (selectedFields.length === 0) {
    ElMessage.warning('请至少勾选一个需要修改的字段')
    return
  }
  
  // Check if number fields have valid values
  const numberFields = ['quantity', 'unitPrice', 'orderAmount', 'paymentAmount']
  for (const field of numberFields) {
    if (batchEditFields[field] && (batchEditData[field] === null || batchEditData[field] === undefined)) {
      ElMessage.warning(`请填写 ${fieldLabels[field]} 的值`)
      return
    }
  }
  
  ElMessageBox.confirm(
    `确定将选中的 ${selectedPaymentIds.value.length} 条记录修改为新值吗？`,
    '确认批量修改',
    {
      confirmButtonText: '确定修改',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    let updatedCount = 0
    let cloudFailedCount = 0
    
    // 获取 Supabase 客户端状态
    const client = await getSupabase()
    const isLoggedIn = !store.localMode && client
    
    for (const id of selectedPaymentIds.value) {
      const payment = store.customerPayments.find(p => p.id === id)
      if (payment) {
        // Apply selected fields
        for (const field of selectedFields) {
          payment[field] = batchEditData[field]
        }
        updatedCount++
        
        // 云端同步更新
        if (isLoggedIn) {
          const { id: paymentId, ...rest } = payment
          const payload = { id: paymentId, ...rest }
          const r = await syncToSupabase('customer_payments', payload)
          if (!r.success) {
            cloudFailedCount++
            console.warn(`[付款记录] 批量编辑同步失败: ${id}, ${r.error}`)
          }
        }
      }
    }
    saveToLocalStorage()
    showBatchEditDialog.value = false
    
    if (isLoggedIn && cloudFailedCount > 0) {
      ElMessage({ type: 'warning', duration: 6000, message: `本地已更新 ${updatedCount} 条，云端同步失败 ${cloudFailedCount} 条，请检查网络后重试` })
    } else {
      ElMessage.success(`成功更新 ${updatedCount} 条付款记录${isLoggedIn ? '并已同步到云端' : ''}`)
    }
  }).catch(() => {})
}

const fieldLabels = {
  currency: '币种',
  orderDate: '订单日期',
  deliveryDate: '交货日期',
  quantity: '数量',
  unitPrice: '单价',
  orderAmount: '订单金额',
  paymentBatch: '付款批次',
  paymentType: '付款类型',
  paymentDate: '付款日期',
  paymentAmount: '付款金额',
  paymentMethod: '付款方式',
  arrivalStatus: '到账状态',
  remark: '备注'
}

watch(() => store.customers, () => {}, { deep: true })
watch(() => store.sampleDeliveries, () => {}, { deep: true })
watch(() => store.customerFollowUps, () => {}, { deep: true })
</script>

<style scoped>
.customer-management {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tab-content {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
}

.payment-stats-bar {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  align-items: flex-start;
  flex-wrap: wrap;
}

.stats-currency-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.stats-filter-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}


.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 16px;
  border-radius: 6px;
  background: #fff;
  min-width: 160px;
}

.stat-total {
  border-left: 4px solid #409eff;
}

.stat-settled {
  border-left: 4px solid #67c23a;
}

.stat-unpaid {
  border-left: 4px solid #f56c6c;
  background: #fef0f0;
}

.stat-unpaid .stat-value {
  color: #c45656;
}

.stat-remaining {
  border-left: 4px solid #e6a23c;
  background: #fdf6ec;
}

.stat-remaining .stat-value {
  color: #b88230;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.stat-remaining .stat-value {
  color: #c45656;
}

.stat-warning {
  border-left: 4px solid #e6a23c;
  background: #fdf6ec;
  animation: pulse-warning 2s infinite;
  transition: all 0.3s ease;
}

.stat-warning:hover {
  background: #faecd8;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(230, 162, 60, 0.3);
}

.stat-warning-filtered {
  border-left: 4px solid #f56c6c !important;
  background: #fef0f0 !important;
  animation: none !important;
}

.stat-warning-filtered .stat-value {
  color: #c45656 !important;
}

.stat-warning .stat-value {
  color: #b88230;
}

@keyframes pulse-warning {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(230, 162, 60, 0.4);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(230, 162, 60, 0);
  }
}

.reminder-date {
  color: #e6a23c;
  font-weight: 600;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.row-legend {
  display: flex;
  gap: 20px;
  align-items: center;
  padding: 6px 16px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  font-size: 12px;
  color: #64748b;
  flex-wrap: wrap;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-color {
  display: inline-block;
  width: 16px;
  height: 12px;
  border-radius: 2px;
  border: 1px solid #e5e7eb;
}

.legend-remaining {
  background: #fde2e2;
}

.legend-pending {
  background: #fdf3d1;
}

:deep(.payment-remaining-row) {
  background-color: #fde2e2 !important;
}

:deep(.payment-remaining-row:hover > td) {
  background-color: #fde2e2 !important;
}

:deep(.payment-pending-row) {
  background-color: #fdf3d1 !important;
}

:deep(.payment-pending-row:hover > td) {
  background-color: #faebbf !important;
}

.search-bar {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 20px;
}

.group-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.group-card {
  background: #f9fafc;
  border-radius: 8px;
  padding: 20px;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: 600;
}

.group-name {
  font-size: 16px;
}

.group-actions {
  display: flex;
  gap: 5px;
}

.group-count {
  font-size: 13px;
  color: #909399;
  margin-bottom: 10px;
}

.group-actions-bar {
  margin-top: 20px;
  text-align: right;
}

.group-members {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.member-tag {
  background: #e6f7ff;
  color: #1890ff;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
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

.preview-summary {
  text-align: right;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px dashed #d0d0d0;
  font-size: 14px;
  color: #6b7280;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
  margin-bottom: 0;
}

.attachment-list {
  margin-top: 10px;
  max-height: 150px;
  overflow-y: auto;
}

.attachment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 6px;
  font-size: 13px;
}

.attachment-preview-item {
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 15px;
}

.attachment-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: 500;
}

.attachment-preview-image {
  max-height: 400px;
  overflow: hidden;
}

.attachment-preview-image img {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
}

.attachment-preview-other {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #909399;
}

.no-attachments {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.attachment-scroll-container {
  overflow: hidden;
}

.attachment-scroll-list {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 0;
  white-space: nowrap;
}

.attachment-scroll-list::-webkit-scrollbar {
  height: 4px;
}

.attachment-scroll-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.attachment-scroll-list::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 2px;
}

.attachment-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  flex-shrink: 0;
}

.attachment-name {
  font-size: 12px;
  color: #606266;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-btn {
  padding: 2px 4px;
  min-width: auto;
}

.preview-info {
  margin-bottom: 16px;
  padding: 10px 14px;
  background: #ecf5ff;
  border: 1px solid #d9ecff;
  border-radius: 4px;
  color: #409eff;
  font-size: 14px;
}

.no-attachment {
  color: #c0c4cc;
  font-size: 13px;
}

.local-path-input-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
}

.local-path-input-wrapper .el-input {
  flex: 1;
}

.local-path-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.local-path-tip .tip-icon {
  font-size: 14px;
}

.local-path-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}

.local-path-text {
  font-size: 12px;
  color: #606266;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.local-path-text:hover {
  color: #409EFF;
}

.no-path {
  color: #c0c4cc;
  font-size: 12px;
}

.content-cell {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.overdue-date {
  color: #f56c6c;
  font-weight: 600;
}

.table-header th {
  background: #f5f7fa !important;
  color: #303133;
  font-weight: 600;
  font-size: 13px;
}

.el-table td {
  font-size: 13px;
}

.move-group-info {
  padding: 12px 16px;
  background: #ecf5ff;
  border: 1px solid #d9ecff;
  border-radius: 4px;
  color: #409eff;
  margin-bottom: 16px;
}

.move-group-info p {
  margin: 0;
  font-size: 14px;
}

.export-preview-info {
  padding: 10px 14px;
  background: #f0f9eb;
  border: 1px solid #e1f3d8;
  border-radius: 4px;
  color: #67c23a;
  font-size: 13px;
  margin-bottom: 16px;
}

.export-preview-info p {
  margin: 0;
}

.followup-detail-dialog :deep(.el-descriptions__label) {
  width: 120px;
  font-weight: 600;
  background: #f5f7fa;
}

.followup-detail-dialog :deep(.el-descriptions__content) {
  min-height: 40px;
}
</style>

<style>
.high-z-dropdown {
  z-index: 9999 !important;
}
</style>