<template>
  <div class="customer-management">
    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="海外客户主台账" name="main">
        <div class="tab-content">
          <div class="search-bar">
            <el-input v-model="searchKeyword" placeholder="搜索客户姓名/邮箱" clearable style="width: 250px" />
            <el-select v-model="filterGroup" placeholder="客户分组" clearable style="width: 150px">
              <el-option v-for="g in customerGroups" :key="g" :label="g" :value="g" />
            </el-select>
            <el-button type="primary" @click="handleAddCustomer">新增客户</el-button>
            <el-button @click="previewCustomers">预览</el-button>
            <el-button @click="exportCustomers">导出Excel</el-button>
          </div>
          <el-table :data="filteredCustomers" border stripe>
            <el-table-column prop="id" label="客户ID" width="80" />
            <el-table-column prop="name" label="客户姓名" />
            <el-table-column prop="group" label="客户分组" />
            <el-table-column prop="email" label="海外邮箱" />
            <el-table-column prop="region" label="国家地区" />
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
      </el-tab-pane>
      
      <el-tab-pane label="客户跟进记录" name="followup">
        <div class="tab-content">
          <div class="search-bar">
            <el-select v-model="followupCustomerId" placeholder="选择客户" style="width: 200px">
              <el-option v-for="c in store.customers" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
            <el-date-picker v-model="followupDate" type="date" placeholder="跟进日期" />
            <el-button type="primary" @click="handleAddFollowup">新增记录</el-button>
          </div>
          <el-table :data="filteredFollowups" border stripe>
            <el-table-column prop="id" label="记录ID" width="80" />
            <el-table-column prop="customerName" label="客户姓名" />
            <el-table-column prop="followupDate" label="跟进日期" />
            <el-table-column prop="content" label="跟进内容" />
            <el-table-column prop="result" label="跟进结果" />
            <el-table-column prop="nextFollowup" label="下次跟进" />
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button size="small" @click="handleEditFollowup(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="handleDeleteFollowup(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="样机寄样申请" name="sample">
        <div class="tab-content">
          <div class="search-bar">
            <el-select v-model="sampleCustomerId" placeholder="选择客户" style="width: 200px">
              <el-option v-for="c in store.customers" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
            <el-select v-model="sampleStatus" placeholder="物流状态" clearable style="width: 120px">
              <el-option label="待寄出" value="pending" />
              <el-option label="运输中" value="in_transit" />
              <el-option label="已签收" value="delivered" />
              <el-option label="异常" value="exception" />
            </el-select>
            <el-select v-model="sampleSortBy" style="width: 120px">
              <el-option label="按ID排序" value="id" />
              <el-option label="按寄件时间" value="sendDate" />
              <el-option label="按客户姓名" value="customerName" />
            </el-select>
            <el-button @click="toggleSampleSort" size="small">
              {{ sampleSortOrder === 'asc' ? '↑' : '↓' }}
            </el-button>
            <el-button type="primary" @click="handleAddSample">新增寄样</el-button>
            <el-button @click="previewSamples">预览</el-button>
            <el-button @click="exportSamples">导出Excel</el-button>
          </div>
          <el-table :data="filteredSamples" border stripe>
            <el-table-column prop="id" label="寄样ID" width="80" />
            <el-table-column prop="customerName" label="客户姓名" />
            <el-table-column prop="model" label="机型型号" />
            <el-table-column prop="sampleQty" label="样品数量" width="100" />
            <el-table-column prop="logisticsCompany" label="物流商" width="80" />
            <el-table-column prop="logisticsNo" label="运单号" />
            <el-table-column prop="sendDate" label="寄出日期">
              <template #default="{ row }">
                {{ formatDate(row.sendDate) }}
              </template>
            </el-table-column>
            <el-table-column prop="expectedSignDate" label="预计签收日">
              <template #default="{ row }">
                {{ formatDate(row.expectedSignDate) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="物流状态">
              <template #default="{ row }">
                <el-tag :type="getStatusTagType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="freightAmount" label="运费金额" />
            <el-table-column prop="settled" label="是否结清">
              <template #default="{ row }">
                <el-tag :type="row.settled ? 'success' : 'danger'">{{ row.settled ? '已结清' : '未结清' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" width="150">
              <template #default="{ row }">
                <span v-if="row.remark" :title="row.remark" class="remark-text">{{ row.remark.slice(0, 20) }}{{ row.remark.length > 20 ? '...' : '' }}</span>
                <span v-else class="no-data">-</span>
              </template>
            </el-table-column>
            <el-table-column label="附件" width="100">
              <template #default="{ row }">
                <div v-if="row.attachments && row.attachments.length > 0" class="attachment-list">
                  <el-button 
                    v-for="(file, index) in row.attachments.slice(0, 3)" 
                    :key="index" 
                    size="small" 
                    icon="Picture"
                    @click="previewSampleAttachment(file)"
                    :title="file.name"
                  />
                  <span v-if="row.attachments.length > 3" class="more-attachments">+{{ row.attachments.length - 3 }}</span>
                </div>
                <span v-else class="no-data">-</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button size="small" @click="handleEditSample(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="handleDeleteSample(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="客户分组配置" name="group">
        <div class="tab-content">
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
      </el-tab-pane>
    </el-tabs>
    
    <el-dialog v-model="showCustomerDialog" :title="isEditingCustomer ? '编辑客户' : '新增客户'" width="600px">
      <el-form :model="customerForm" label-width="120px">
        <el-form-item label="客户ID">
          <el-input v-model="customerForm.id" placeholder="自动生成，可自定义" />
        </el-form-item>
        <el-form-item label="客户姓名">
          <el-input v-model="customerForm.name" />
        </el-form-item>
        <el-form-item label="客户分组">
          <el-select v-model="customerForm.group">
            <el-option v-for="g in customerGroups" :key="g" :label="g" :value="g" />
          </el-select>
        </el-form-item>
        <el-form-item label="海外邮箱">
          <el-input v-model="customerForm.email" />
        </el-form-item>
        <el-form-item label="国家地区">
          <el-input v-model="customerForm.region" />
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
                <th>海外邮箱</th>
                <th>国家地区</th>
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
                <td>{{ c.email }}</td>
                <td>{{ c.region }}</td>
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
    
    <el-dialog v-model="showSampleDialog" :title="isEditingSample ? '编辑寄样申请' : '新增寄样申请'" width="500px">
      <el-form :model="sampleForm" label-width="100px">
        <el-form-item label="寄样ID">
          <el-input v-model="sampleForm.id" placeholder="自动生成，可自定义" />
        </el-form-item>
        <el-form-item label="关联客户">
          <el-select v-model="sampleForm.customerId">
            <el-option v-for="c in store.customers" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="机型型号">
          <el-select v-model="sampleForm.model" filterable>
            <el-option v-for="m in store.productModels" :key="m.id" :label="m.name" :value="m.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="样品数量">
          <el-input-number v-model="sampleForm.sampleQty" :min="1" />
        </el-form-item>
        <el-form-item label="物流商">
          <el-select v-model="sampleForm.logisticsCompany" filterable allow-create @create="handleCreateLogisticsCompany">
            <el-option v-for="lc in logisticsCompanies" :key="lc" :label="lc" :value="lc" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="运单号">
          <el-input v-model="sampleForm.logisticsNo" />
        </el-form-item>
        <el-form-item label="寄出日期">
          <el-date-picker v-model="sampleForm.sendDate" type="date" />
        </el-form-item>
        <el-form-item label="预计签收日">
          <el-date-picker v-model="sampleForm.expectedSignDate" type="date" />
        </el-form-item>
        <el-form-item label="物流状态">
          <el-select v-model="sampleForm.status">
            <el-option label="待寄出" value="pending" />
            <el-option label="运输中" value="in_transit" />
            <el-option label="已签收" value="delivered" />
            <el-option label="异常" value="exception" />
          </el-select>
        </el-form-item>
        <el-form-item label="运费金额">
          <el-input-number v-model="sampleForm.freightAmount" :min="0" />
        </el-form-item>
        <el-form-item label="标签">
          <el-select v-model="sampleForm.tags" multiple style="width: 100%">
            <el-option v-for="tag in store.tags" :key="tag.id" :label="tag.label" :value="tag.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="sampleForm.remark" type="textarea" :rows="3" placeholder="可填写样品类型、特殊要求等信息" />
        </el-form-item>
        <el-form-item label="附件">
          <div class="sample-attachments">
            <el-upload
              :on-change="handleAttachmentChange"
              :on-remove="handleAttachmentRemove"
              :file-list="sampleForm.attachments"
              list-type="picture-card"
              accept="image/jpeg,image/png,application/pdf"
              :auto-upload="false"
            >
              <el-icon><Plus /></el-icon>
            </el-upload>
          </div>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="sampleForm.settled">已结清</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSampleDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmSample">确定</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showPreviewDialog" title="寄样台账预览" width="900px" :close-on-click-modal="false">
      <div class="preview-container">
        <div class="preview-header">
          <h2>寄样台账</h2>
          <p>{{ new Date().toLocaleDateString('zh-CN') }}</p>
        </div>
        <div class="preview-table">
          <table>
            <thead>
              <tr>
                <th>寄样ID</th>
                <th>客户姓名</th>
                <th>机型型号</th>
                <th>样品数量</th>
                <th>物流商</th>
                <th>运单号</th>
                <th>寄出日期</th>
                <th>预计签收日</th>
                <th>物流状态</th>
                <th>运费金额</th>
                <th>是否结清</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in filteredSamples" :key="s.id">
                <td>{{ s.id }}</td>
                <td>{{ s.customerName }}</td>
                <td>{{ s.model }}</td>
                <td>{{ s.sampleQty }}</td>
                <td>{{ s.logisticsCompany || '-' }}</td>
                <td>{{ s.logisticsNo || '-' }}</td>
                <td>{{ s.sendDate || '-' }}</td>
                <td>{{ s.expectedSignDate || '-' }}</td>
                <td>{{ getStatusLabel(s.status) }}</td>
                <td>{{ s.freightAmount || '-' }}</td>
                <td>{{ s.settled ? '已结清' : '未结清' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="preview-summary">
          <span>共 {{ filteredSamples.length }} 条记录</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="showPreviewDialog = false">关闭</el-button>
        <el-button type="primary" @click="exportSamples">导出Excel</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import { store, addCustomer, updateCustomer, deleteCustomer, addSampleDelivery, updateSampleDelivery, deleteSampleDelivery, addLogisticsCompany, generateId, addCustomerGroup, updateCustomerGroup, deleteCustomerGroup, syncAllFromSupabase } from '../store.js'
import { exportToExcel } from '../utils/excelExport.js'
import FileUploader from './FileUploader.vue'
import { getFileUrlFromSupabase, deleteFileFromSupabase } from '../supabase.js'
import { Document, ZoomIn } from '@element-plus/icons-vue'

const activeTab = ref('main')

const searchKeyword = ref('')
const filterGroup = ref('')
const followupCustomerId = ref('')
const followupDate = ref('')
const sampleCustomerId = ref('')
const sampleStatus = ref('')

const showCustomerDialog = ref(false)
const showFollowupDialog = ref(false)
const showSampleDialog = ref(false)
const showAddGroupDialog = ref(false)
const showPreviewDialog = ref(false)
const showCustomerPreviewDialog = ref(false)
const showAttachmentDialog = ref(false)

const isEditingCustomer = ref(false)
const isEditingFollowup = ref(false)
const isEditingSample = ref(false)

const currentAttachments = ref([])
const isLocalhost = computed(() => window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

onMounted(async () => {
  await syncAllFromSupabase()
})

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
  email: '',
  region: '',
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

const sampleForm = reactive({
  id: '',
  customerId: '',
  customerName: '',
  model: '',
  sampleQty: 1,
  logisticsCompany: '顺丰',
  logisticsNo: '',
  sendDate: new Date().toISOString().split('T')[0],
  expectedSignDate: '',
  status: 'pending',
  freightAmount: 0,
  settled: false,
  tags: []
})

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

const sampleSortBy = ref('id')
const sampleSortOrder = ref('desc')

const filteredSamples = computed(() => {
  const samples = store.sampleDeliveries.filter(s => {
    const matchCustomer = !sampleCustomerId.value || s.customerId === sampleCustomerId.value
    const matchStatus = !sampleStatus.value || s.status === sampleStatus.value
    return matchCustomer && matchStatus
  })
  
  return [...samples].sort((a, b) => {
    let result = 0
    if (sampleSortBy.value === 'id') {
      result = a.id.localeCompare(b.id)
    } else if (sampleSortBy.value === 'sendDate') {
      const dateA = a.sendDate ? new Date(a.sendDate).getTime() : 0
      const dateB = b.sendDate ? new Date(b.sendDate).getTime() : 0
      result = dateA - dateB
    } else if (sampleSortBy.value === 'customerName') {
      result = (a.customerName || '').localeCompare(b.customerName || '')
    }
    return sampleSortOrder.value === 'desc' ? -result : result
  })
})

function getStatusTagType(status) {
  const types = { pending: 'info', in_transit: 'warning', delivered: 'success', exception: 'danger' }
  return types[status] || 'info'
}

function toggleSampleSort() {
  sampleSortOrder.value = sampleSortOrder.value === 'asc' ? 'desc' : 'asc'
}

function getStatusLabel(status) {
  const labels = { pending: '待寄出', in_transit: '运输中', delivered: '已签收', exception: '异常' }
  return labels[status] || status
}

function getSampleCount(customerId) {
  return store.sampleDeliveries.filter(s => s.customerId === customerId).length
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
    email: '',
    region: '',
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
    email: row.email,
    region: row.region,
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
  if (!customerForm.name.trim()) {
    alert('请填写客户姓名')
    return
  }
  if (!customerForm.id.trim()) {
    customerForm.id = generateId('C')
  }
  if (!isEditingCustomer.value) {
    const exists = store.customers.find(c => c.id === customerForm.id)
    if (exists) {
      alert(`客户ID "${customerForm.id}" 已存在，请更换其他ID`)
      return
    }
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

function handleAddSample() {
  isEditingSample.value = false
  Object.assign(sampleForm, {
    id: '',
    customerId: '',
    customerName: '',
    model: '',
    sampleQty: 1,
    logisticsCompany: '顺丰',
    logisticsNo: '',
    sendDate: new Date().toISOString().split('T')[0],
    expectedSignDate: '',
    status: 'pending',
    freightAmount: 0,
    settled: false,
    tags: [],
    remark: '',
    attachments: []
  })
  showSampleDialog.value = true
}

function handleEditSample(row) {
  isEditingSample.value = true
  Object.assign(sampleForm, {
    id: row.id,
    customerId: row.customerId,
    customerName: row.customerName,
    model: row.model,
    sampleQty: row.sampleQty,
    logisticsCompany: row.logisticsCompany,
    logisticsNo: row.logisticsNo,
    sendDate: row.sendDate,
    expectedSignDate: row.expectedSignDate,
    status: row.status,
    freightAmount: row.freightAmount,
    settled: row.settled,
    tags: row.tags || [],
    remark: row.remark || '',
    attachments: row.attachments || []
  })
  showSampleDialog.value = true
}

async function handleDeleteSample(row) {
  ElMessageBox.confirm(
    '确定删除该寄样记录吗？此操作不可恢复。',
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    await deleteSampleDelivery(row.id)
  }).catch(() => {})
}

async function confirmSample() {
  if (!sampleForm.customerId || !sampleForm.model) {
    alert('请填写关联客户和机型型号')
    return
  }
  const customer = store.customers.find(c => c.id === sampleForm.customerId)
  sampleForm.customerName = customer ? customer.name : ''
  
  if (!sampleForm.id.trim()) {
    sampleForm.id = generateId('SD')
  }
  if (!isEditingSample.value) {
    const exists = store.sampleDeliveries.find(s => s.id === sampleForm.id)
    if (exists) {
      alert(`寄样ID "${sampleForm.id}" 已存在，请更换其他ID`)
      return
    }
  }
  
  if (isEditingSample.value) {
    await updateSampleDelivery(sampleForm)
  } else {
    await addSampleDelivery(sampleForm)
    if (customer) {
      customer.sampleCount = (customer.sampleCount || 0) + 1
    }
  }
  showSampleDialog.value = false
}

function handleAttachmentChange(file, fileList) {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
  if (!allowedTypes.includes(file.raw.type)) {
    alert('附件格式不支持，请上传 jpg/png/pdf 文件')
    return false
  }
  const maxSize = 5 * 1024 * 1024
  if (file.raw.size > maxSize) {
    alert('附件大小超过5MB限制')
    return false
  }
  sampleForm.attachments = fileList
}

function handleAttachmentRemove(file, fileList) {
  sampleForm.attachments = fileList
}

function previewSampleAttachment(file) {
  if (file.url) {
    window.open(file.url, '_blank')
  } else if (file.response && file.response.url) {
    window.open(file.response.url, '_blank')
  } else {
    alert('暂无预览链接')
  }
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

function previewSamples() {
  showPreviewDialog.value = true
}

function exportCustomers() {
  const headers = ['客户ID', '客户姓名', '客户分组', '海外邮箱', '国家地区', '对接机型', '首次联系日期', '累计寄样次数', '备注']
  const data = filteredCustomers.value.map(c => [
    c.id, c.name, c.group, c.email, c.region, c.model, c.firstContactDate, c.sampleCount, c.remark
  ])
  exportToExcel('客户台账', headers, data)
}

function exportSamples() {
  const headers = ['寄样ID', '客户姓名', '机型型号', '样品数量', '物流商', '运单号', '寄出日期', '预计签收日', '物流状态', '运费金额', '是否结清', '备注', '附件']
  const data = filteredSamples.value.map(s => [
    s.id, s.customerName, s.model, s.sampleQty, s.logisticsCompany || '-', s.logisticsNo || '-', 
    s.sendDate || '-', s.expectedSignDate || '-', getStatusLabel(s.status), 
    s.freightAmount || '-', s.settled ? '已结清' : '未结清',
    s.remark || '-',
    s.attachments && s.attachments.length > 0 ? s.attachments.map(f => f.name).join(', ') : '-'
  ])
  exportToExcel('寄样台账', headers, data)
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
</style>