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
      </el-tab-pane>
      
      <el-tab-pane label="客户跟进记录" name="followup">
        <div class="tab-content">
          <div class="search-bar">
            <el-select v-model="followupCustomerId" placeholder="选择客户" style="width: 200px">
              <el-option v-for="c in store.customers" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
            <el-date-picker v-model="followupDate" type="date" placeholder="跟进日期" />
            <el-button type="primary" @click="handleAddFollowup">新增记录</el-button>
            <el-button @click="openFollowupPreview">导出Excel</el-button>
          </div>
          <el-table :data="filteredFollowups" border stripe header-cell-class-name="table-header">
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
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="handleEditFollowup(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="handleDeleteFollowup(row)">删除</el-button>
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
            <el-button @click="exportGroups">导出Excel</el-button>
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import { store, authStore, addCustomer, updateCustomer, deleteCustomer, addLogisticsCompany, addCustomerGroup, updateCustomerGroup, deleteCustomerGroup, syncAllFromSupabase } from '../store.js'
import { exportToExcel } from '../utils/excelExport.js'
import FileUploader from './FileUploader.vue'
import { getFileUrlFromSupabase, deleteFileFromSupabase } from '../supabase.js'
import { Document, ZoomIn, Plus } from '@element-plus/icons-vue'

const props = defineProps({
  currentSubPage: {
    type: String,
    default: 'main'
  }
})

const activeTab = ref(props.currentSubPage || 'main')

watch(() => props.currentSubPage, (newVal) => {
  if (newVal && activeTab.value !== newVal) {
    activeTab.value = newVal
  }
}, { immediate: true })

const searchKeyword = ref('')
const filterGroup = ref('')
const followupCustomerId = ref('')
const followupDate = ref('')

const showCustomerDialog = ref(false)
const showFollowupDialog = ref(false)
const showAddGroupDialog = ref(false)
const showCustomerPreviewDialog = ref(false)
const showAttachmentDialog = ref(false)
const showFollowupPreview = ref(false)

const isEditingCustomer = ref(false)
const isEditingFollowup = ref(false)

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
    customerForm.id = generateId('C')
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

function exportCustomers() {
  const headers = ['id', 'name', 'group', 'country', 'region', 'company', 'email', 'phone', 'address', 'created_at']
  const data = filteredCustomers.value.map(c => [
    c.id, c.name, c.group, c.country || '', c.region || '', c.company || '', c.email || '', c.phone || '', c.address || '', c.firstContactDate || ''
  ])
  exportToExcel('客户台账', headers, data)
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
</style>

<style>
.high-z-dropdown {
  z-index: 9999 !important;
}
</style>