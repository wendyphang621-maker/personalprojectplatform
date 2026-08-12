<template>
  <div class="sample-delivery-log">
    <!-- 标题栏 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">样机寄送跟进台账</h2>
        <span class="page-subtitle">共 {{ filteredRecords.length }} / {{ records.length }} 条记录</span>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleAdd" :disabled="!canEdit">新增记录</el-button>
        <el-button type="success" @click="triggerImport" :disabled="!canEdit">导入 Excel</el-button>
        <el-button @click="downloadTemplate">导入模板</el-button>
        <el-button type="warning" @click="exportExcel">导出 Excel</el-button>
        <el-button @click="showOptionDialog = true" :disabled="!canEdit">选项管理</el-button>
        <input ref="fileInputRef" type="file" accept=".xlsx,.xls" style="display:none" @change="handleImport" />
      </div>
    </div>

    <!-- 筛选区 -->
    <div class="filter-bar">
      <div class="filter-row">
        <span class="filter-label">品类：</span>
        <el-radio-group v-model="categoryFilter" @change="currentPage = 1">
          <el-radio-button label="">全部</el-radio-button>
          <el-radio-button v-for="c in allCategories" :key="c" :label="c">{{ c }}</el-radio-button>
        </el-radio-group>
      </div>
      <div class="filter-row" style="margin-top: 10px;">
        <span class="filter-label">业务类型：</span>
        <el-select v-model="businessTypeFilter" placeholder="按业务类型筛选" clearable style="width: 160px;" @change="currentPage = 1">
          <el-option v-for="b in allBusinessTypes" :key="b" :label="b" :value="b" />
        </el-select>
        <span class="filter-label" style="margin-left: 12px;">跟进状态：</span>
        <el-select v-model="followStatusFilter" placeholder="按跟进状态筛选" clearable style="width: 160px;" @change="currentPage = 1">
          <el-option v-for="s in allFollowStatuses" :key="s" :label="s" :value="s" />
        </el-select>
        <span class="filter-label" style="margin-left: 12px;">关键词：</span>
        <el-input
          v-model="searchKeyword"
          placeholder="项目名称 / 内部型号 / 物流单号"
          clearable
          style="width: 260px;"
          @input="currentPage = 1"
        />
        <el-button style="margin-left: 12px;" @click="resetFilter">重置</el-button>
      </div>
    </div>

    <!-- 表格 -->
    <el-table :data="pagedData" border stripe style="width: 100%">
      <el-table-column type="index" label="序号" width="55" />
      <el-table-column prop="projectName" label="项目名称" min-width="150" show-overflow-tooltip />
      <el-table-column prop="internalModel" label="内部型号" width="120" show-overflow-tooltip />
      <el-table-column prop="productCategory" label="产品品类" width="100">
        <template #default="{ row }">
          <el-tag size="small" type="info">{{ row.productCategory || '-' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="businessType" label="业务类型" width="110">
        <template #default="{ row }">
          {{ row.businessType || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="followStatus" label="跟进状态" width="120">
        <template #default="{ row }">
          <el-tag size="small" :type="getStatusTagType(row.followStatus)">{{ row.followStatus || '-' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sendDate" label="发件日期" width="110">
        <template #default="{ row }">{{ row.sendDate || '-' }}</template>
      </el-table-column>
      <el-table-column prop="nextFollowDate" label="下次跟进日期" width="120">
        <template #default="{ row }">{{ row.nextFollowDate || '-' }}</template>
      </el-table-column>
      <el-table-column prop="emailSubject" label="邮件主题" min-width="160" show-overflow-tooltip />
      <el-table-column prop="logisticsNo" label="物流单号" width="150" show-overflow-tooltip />
      <el-table-column prop="logisticsCompany" label="快递公司" width="110">
        <template #default="{ row }">{{ row.logisticsCompany || '-' }}</template>
      </el-table-column>
      <el-table-column prop="destination" label="目的地" width="110">
        <template #default="{ row }">{{ row.destination || '-' }}</template>
      </el-table-column>
      <el-table-column label="附件" width="90">
        <template #default="{ row }">
          <el-link v-if="row.attachments && row.attachments.length" type="primary" @click="previewAttachments(row)">
            {{ row.attachments.length }} 个
          </el-link>
          <span v-else style="color: #c0c4cc;">无</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="handleDetail(row)">详情</el-button>
          <el-button size="small" type="primary" @click="handleEdit(row)" :disabled="!canEdit">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)" :disabled="!canEdit">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-bar">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="filteredRecords.length"
        layout="total, prev, pager, next"
        background
      />
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="showFormDialog" :title="isEditing ? '编辑跟进记录' : '新增跟进记录'" width="760px">
      <el-form :model="form" :rules="formRules" ref="formRef" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="项目名称" prop="projectName">
              <el-input v-model="form.projectName" placeholder="请输入项目名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="内部型号" prop="internalModel">
              <el-input v-model="form.internalModel" placeholder="请输入内部型号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="产品品类" prop="productCategory">
              <el-select v-model="form.productCategory" placeholder="请选择产品品类" filterable allow-create style="width: 100%">
                <el-option v-for="c in allCategories" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="业务类型" prop="businessType">
              <el-select v-model="form.businessType" placeholder="请选择业务类型" filterable allow-create style="width: 100%">
                <el-option v-for="b in allBusinessTypes" :key="b" :label="b" :value="b" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="跟进状态" prop="followStatus">
              <el-select v-model="form.followStatus" placeholder="请选择跟进状态" filterable allow-create style="width: 100%">
                <el-option v-for="s in allFollowStatuses" :key="s" :label="s" :value="s" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="目的地">
              <el-input v-model="form.destination" placeholder="请输入目的地" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="发件日期">
              <el-date-picker v-model="form.sendDate" type="date" value-format="YYYY-MM-DD" placeholder="选择发件日期" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="下次跟进日期">
              <el-date-picker v-model="form.nextFollowDate" type="date" value-format="YYYY-MM-DD" placeholder="选择下次跟进日期" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="邮件主题">
          <el-input v-model="form.emailSubject" placeholder="请输入邮件主题" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="物流单号">
              <el-input v-model="form.logisticsNo" placeholder="请输入物流单号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="快递公司">
              <el-input v-model="form.logisticsCompany" placeholder="请输入快递公司" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="附件">
          <div class="attachments-editor">
            <div v-for="(att, idx) in form.attachments" :key="idx" class="attachment-item">
              <el-input v-model="form.attachments[idx]" placeholder="附件链接（URL）" />
              <el-button type="danger" size="small" @click="form.attachments.splice(idx, 1)">删除</el-button>
            </div>
            <el-button size="small" @click="form.attachments.push('')">+ 添加附件</el-button>
          </div>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFormDialog = false">取消</el-button>
        <el-button type="primary" @click="saveForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="跟进记录详情" width="820px">
      <el-descriptions v-if="detailRow" :column="2" border title="基本信息">
        <el-descriptions-item label="项目名称">{{ detailRow.projectName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="内部型号">{{ detailRow.internalModel || '-' }}</el-descriptions-item>
        <el-descriptions-item label="产品品类">
          <el-tag size="small" type="info">{{ detailRow.productCategory || '-' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="业务类型">{{ detailRow.businessType || '-' }}</el-descriptions-item>
        <el-descriptions-item label="跟进状态">
          <el-tag size="small" :type="getStatusTagType(detailRow.followStatus)">{{ detailRow.followStatus || '-' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="目的地">{{ detailRow.destination || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发件日期">{{ detailRow.sendDate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="下次跟进日期">{{ detailRow.nextFollowDate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮件主题" :span="2">{{ detailRow.emailSubject || '-' }}</el-descriptions-item>
        <el-descriptions-item label="物流单号">{{ detailRow.logisticsNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="快递公司">{{ detailRow.logisticsCompany || '-' }}</el-descriptions-item>
        <el-descriptions-item label="附件" :span="2">
          <div v-if="detailRow.attachments && detailRow.attachments.length">
            <div v-for="(att, idx) in detailRow.attachments" :key="idx" style="margin-bottom: 4px;">
              <el-link type="primary" :href="att" target="_blank">{{ att }}</el-link>
            </div>
          </div>
          <span v-else style="color: #909399;">无</span>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailRow.remark || '-' }}</el-descriptions-item>
      </el-descriptions>

      <div class="follow-logs-section">
        <div class="section-header">
          <h3 class="section-title">跟进日志</h3>
          <el-button v-if="canEdit" size="small" type="primary" @click="showAddLog = !showAddLog">添加跟进</el-button>
        </div>
        <div v-if="canEdit && showAddLog" class="add-log-box">
          <el-input v-model="newLogContent" type="textarea" :rows="2" placeholder="请输入跟进内容" />
          <el-button type="primary" size="small" @click="addFollowLog" style="margin-top: 8px;">提交</el-button>
        </div>
        <div v-if="detailRow && detailRow.followLogs && detailRow.followLogs.length" class="log-list">
          <div v-for="(log, idx) in detailRow.followLogs" :key="idx" class="log-item">
            <div class="log-time">{{ log.time }}</div>
            <div class="log-content">{{ log.content }}</div>
          </div>
        </div>
        <el-empty v-else description="暂无跟进日志" :image-size="60" />
      </div>

      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 附件预览对话框 -->
    <el-dialog v-model="showAttachmentsDialog" title="附件列表" width="520px">
      <div v-if="previewRow && previewRow.attachments && previewRow.attachments.length">
        <div v-for="(att, idx) in previewRow.attachments" :key="idx" style="margin-bottom: 8px;">
          <el-link type="primary" :href="att" target="_blank">{{ att }}</el-link>
        </div>
      </div>
      <div v-else style="color: #909399;">暂无附件</div>
      <template #footer>
        <el-button @click="showAttachmentsDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 选项管理对话框 -->
    <el-dialog v-model="showOptionDialog" title="选项管理" width="640px">
      <div class="option-manager">
        <div class="option-section">
          <div class="section-title">产品品类</div>
          <div class="option-tags" v-if="allCategories.length">
            <el-tag
              v-for="c in allCategories"
              :key="c"
              class="option-tag"
              closable
              :type="builtinCategories.includes(c) ? 'info' : 'success'"
              @close="removeCustomOption('categories', c)"
            >{{ c }}</el-tag>
          </div>
          <div class="add-option">
            <el-input v-model="newCategoryName" placeholder="输入新品类名称" style="width: 240px;" />
            <el-button type="primary" size="small" @click="addCustomOption('categories', newCategoryName)" style="margin-left: 8px;">添加</el-button>
          </div>
        </div>
        <div class="option-section">
          <div class="section-title">业务类型</div>
          <div class="option-tags" v-if="allBusinessTypes.length">
            <el-tag
              v-for="b in allBusinessTypes"
              :key="b"
              class="option-tag"
              closable
              :type="builtinBusinessTypes.includes(b) ? 'info' : 'success'"
              @close="removeCustomOption('businessTypes', b)"
            >{{ b }}</el-tag>
          </div>
          <div class="add-option">
            <el-input v-model="newBusinessTypeName" placeholder="输入新业务类型" style="width: 240px;" />
            <el-button type="primary" size="small" @click="addCustomOption('businessTypes', newBusinessTypeName)" style="margin-left: 8px;">添加</el-button>
          </div>
        </div>
        <div class="option-section">
          <div class="section-title">跟进状态</div>
          <div class="option-tags" v-if="allFollowStatuses.length">
            <el-tag
              v-for="s in allFollowStatuses"
              :key="s"
              class="option-tag"
              closable
              :type="builtinFollowStatuses.includes(s) ? 'info' : 'success'"
              @close="removeCustomOption('followStatuses', s)"
            >{{ s }}</el-tag>
          </div>
          <div class="add-option">
            <el-input v-model="newFollowStatusName" placeholder="输入新跟进状态" style="width: 240px;" />
            <el-button type="primary" size="small" @click="addCustomOption('followStatuses', newFollowStatusName)" style="margin-left: 8px;">添加</el-button>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showOptionDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { store, saveToLocalStorage } from '../store.js'
import { exportToExcel } from '../utils/excelExport.js'
import { isAdmin } from '../tabConfig.js'

// ===== 常量配置 =====
const STORAGE_KEY_RECORDS = 'sample_log_records'
const STORAGE_KEY_CATEGORIES = 'sample_log_categories'
const STORAGE_KEY_BUSINESS_TYPES = 'sample_log_business_types'
const STORAGE_KEY_FOLLOW_STATUSES = 'sample_log_follow_statuses'

const EXPORT_HEADERS = ['项目名称', '内部型号', '产品品类', '业务类型', '跟进状态', '发件日期', '下次跟进日期', '邮件主题', '物流单号', '快递公司', '目的地', '备注']

// 内置选项（支持自定义扩充）
const builtinCategories = ['手机', '平板', '耳机', '其他']
const builtinBusinessTypes = ['彩盒审核', '样机寄送']
const builtinFollowStatuses = ['待客户审核', '进行中', '已完成']

// 跟进状态 → el-tag 类型映射
const STATUS_TAG_MAP = {
  '待客户审核': 'warning',
  '进行中': 'primary',
  '已完成': 'success'
}

function getStatusTagType(status) {
  return STATUS_TAG_MAP[status] || 'info'
}

// ===== 数据存储 =====
const records = reactive([])
const customCategories = reactive([])
const customBusinessTypes = reactive([])
const customFollowStatuses = reactive([])

function loadRecords() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_RECORDS)
    if (saved) {
      const arr = JSON.parse(saved)
      if (Array.isArray(arr)) {
        records.splice(0, records.length, ...arr)
      }
    }
  } catch (e) {
    console.warn('[SampleDeliveryLog] 加载记录失败:', e)
  }
}

function persistRecords() {
  try {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records))
  } catch (e) {
    console.error('[SampleDeliveryLog] 记录保存失败:', e)
  }
}

function loadCustomOptions(key, target) {
  try {
    const saved = localStorage.getItem(key)
    if (saved) {
      const arr = JSON.parse(saved)
      if (Array.isArray(arr)) {
        target.splice(0, target.length, ...arr)
      }
    }
  } catch (e) {
    console.warn('[SampleDeliveryLog] 加载自定义选项失败:', e)
  }
}

function persistCustomOptions(key, target) {
  try {
    localStorage.setItem(key, JSON.stringify(target))
  } catch (e) {
    console.error('[SampleDeliveryLog] 自定义选项保存失败:', e)
  }
}

function saveData() {
  persistRecords()
  saveToLocalStorage()
}

// ===== 选项合并 =====
const allCategories = computed(() => [...builtinCategories, ...customCategories])
const allBusinessTypes = computed(() => [...builtinBusinessTypes, ...customBusinessTypes])
const allFollowStatuses = computed(() => [...builtinFollowStatuses, ...customFollowStatuses])

// ===== 权限 =====
const canEdit = computed(() => isAdmin())

// ===== 筛选 =====
const categoryFilter = ref('')
const businessTypeFilter = ref('')
const followStatusFilter = ref('')
const searchKeyword = ref('')

const filteredRecords = computed(() => {
  return records.filter(r => {
    if (categoryFilter.value && r.productCategory !== categoryFilter.value) return false
    if (businessTypeFilter.value && r.businessType !== businessTypeFilter.value) return false
    if (followStatusFilter.value && r.followStatus !== followStatusFilter.value) return false
    if (searchKeyword.value) {
      const kw = searchKeyword.value.toLowerCase()
      const hit = [r.projectName, r.internalModel, r.logisticsNo]
        .some(v => (v || '').toLowerCase().includes(kw))
      if (!hit) return false
    }
    return true
  })
})

// ===== 分页 =====
const currentPage = ref(1)
const pageSize = 15
const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredRecords.value.slice(start, start + pageSize)
})

function resetFilter() {
  categoryFilter.value = ''
  businessTypeFilter.value = ''
  followStatusFilter.value = ''
  searchKeyword.value = ''
  currentPage.value = 1
}

// ===== 表单 =====
const showFormDialog = ref(false)
const isEditing = ref(false)
const formRef = ref(null)

const defaultForm = () => ({
  id: '',
  projectName: '',
  internalModel: '',
  productCategory: '',
  businessType: '',
  followStatus: '',
  sendDate: '',
  nextFollowDate: '',
  emailSubject: '',
  logisticsNo: '',
  logisticsCompany: '',
  destination: '',
  attachments: [],
  followLogs: [],
  remark: ''
})

const form = reactive(defaultForm())

const formRules = {
  projectName: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  internalModel: [{ required: true, message: '请输入内部型号', trigger: 'blur' }],
  productCategory: [{ required: true, message: '请选择产品品类', trigger: 'change' }],
  businessType: [{ required: true, message: '请选择业务类型', trigger: 'change' }],
  followStatus: [{ required: true, message: '请选择跟进状态', trigger: 'change' }]
}

function genId() {
  return 'sdl' + Date.now() + Math.floor(Math.random() * 10000)
}

function handleAdd() {
  Object.assign(form, defaultForm())
  form.sendDate = new Date().toISOString().split('T')[0]
  isEditing.value = false
  showFormDialog.value = true
}

function handleEdit(row) {
  Object.assign(form, {
    id: row.id,
    projectName: row.projectName || '',
    internalModel: row.internalModel || '',
    productCategory: row.productCategory || '',
    businessType: row.businessType || '',
    followStatus: row.followStatus || '',
    sendDate: row.sendDate || '',
    nextFollowDate: row.nextFollowDate || '',
    emailSubject: row.emailSubject || '',
    logisticsNo: row.logisticsNo || '',
    logisticsCompany: row.logisticsCompany || '',
    destination: row.destination || '',
    attachments: Array.isArray(row.attachments) ? [...row.attachments] : [],
    followLogs: Array.isArray(row.followLogs) ? row.followLogs.map(l => ({ ...l })) : [],
    remark: row.remark || ''
  })
  isEditing.value = true
  showFormDialog.value = true
}

async function saveForm() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch (e) {
    ElMessage.warning('请填写必填字段')
    return
  }

  // 必填字段二次校验
  const required = {
    projectName: '项目名称',
    internalModel: '内部型号',
    productCategory: '产品品类',
    businessType: '业务类型',
    followStatus: '跟进状态'
  }
  for (const [field, label] of Object.entries(required)) {
    if (!form[field] || !String(form[field]).trim()) {
      ElMessage.warning(`${label}为必填项`)
      return
    }
  }

  // 清理附件空字符串
  form.attachments = (form.attachments || []).filter(a => a && a.trim())
  form.projectName = form.projectName.toString().trim()
  form.internalModel = form.internalModel.toString().trim()

  if (isEditing.value) {
    const idx = records.findIndex(r => r.id === form.id)
    if (idx > -1) {
      records[idx] = { ...form }
    }
    ElMessage.success('更新成功')
  } else {
    records.push({ ...form, id: genId() })
    ElMessage.success('新增成功')
  }
  saveData()
  showFormDialog.value = false
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确认删除「${row.projectName} / ${row.internalModel}」跟进记录？此操作不可恢复。`,
      '确认删除',
      { type: 'warning' }
    )
  } catch {
    return
  }
  const idx = records.findIndex(r => r.id === row.id)
  if (idx > -1) {
    records.splice(idx, 1)
    saveData()
    ElMessage.success('删除成功')
  }
}

// ===== 详情 =====
const showDetailDialog = ref(false)
const detailRow = ref(null)
const showAddLog = ref(false)
const newLogContent = ref('')

function handleDetail(row) {
  detailRow.value = row
  showAddLog.value = false
  newLogContent.value = ''
  showDetailDialog.value = true
}

function addFollowLog() {
  if (!newLogContent.value.trim()) {
    ElMessage.warning('请输入跟进内容')
    return
  }
  if (!detailRow.value) return
  if (!Array.isArray(detailRow.value.followLogs)) {
    detailRow.value.followLogs = []
  }
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  const time = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
  detailRow.value.followLogs.unshift({ time, content: newLogContent.value.trim() })
  // 同步到 records
  const idx = records.findIndex(r => r.id === detailRow.value.id)
  if (idx > -1) {
    records[idx].followLogs = [...detailRow.value.followLogs]
  }
  saveData()
  newLogContent.value = ''
  showAddLog.value = false
  ElMessage.success('跟进日志已添加')
}

// ===== 附件预览 =====
const showAttachmentsDialog = ref(false)
const previewRow = ref(null)

function previewAttachments(row) {
  previewRow.value = row
  showAttachmentsDialog.value = true
}

// ===== 导出 Excel =====
function exportExcel() {
  if (filteredRecords.value.length === 0) {
    ElMessage.warning('没有可导出的数据')
    return
  }
  const data = filteredRecords.value.map(r => [
    r.projectName || '',
    r.internalModel || '',
    r.productCategory || '',
    r.businessType || '',
    r.followStatus || '',
    r.sendDate || '',
    r.nextFollowDate || '',
    r.emailSubject || '',
    r.logisticsNo || '',
    r.logisticsCompany || '',
    r.destination || '',
    r.remark || ''
  ])
  exportToExcel('样机寄送跟进台账', EXPORT_HEADERS, data)
  ElMessage.success('导出成功')
}

// ===== 导入模板下载 =====
async function downloadTemplate() {
  const sampleRow = ['E7 Elite', 'E7-2026', '手机', '样机寄送', '待客户审核', '2026-08-01', '2026-08-08', 'E7 样机寄送确认', 'SF1234567890', '顺丰', '深圳', '首批发货']
  await exportToExcel('样机寄送跟进导入模板', EXPORT_HEADERS, [sampleRow])
  ElMessage.success('模板已下载')
}

// ===== Excel 导入 =====
const fileInputRef = ref(null)

function triggerImport() {
  if (!fileInputRef.value) return
  fileInputRef.value.value = ''
  fileInputRef.value.click()
}

async function handleImport(e) {
  const file = e.target.files[0]
  if (!file) return
  try {
    const XLSX = await import('xlsx')
    const buf = await file.arrayBuffer()
    const workbook = XLSX.read(buf, { type: 'array' })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' })
    if (rows.length === 0) {
      ElMessage.warning('Excel 文件为空')
      return
    }
    const headers = rows[0].map(h => String(h).trim())
    // 表头必填字段校验
    const requiredFields = ['项目名称', '内部型号', '产品品类', '业务类型', '跟进状态']
    const missing = requiredFields.filter(f => !headers.includes(f))
    if (missing.length > 0) {
      ElMessage.error(`表头缺失必填字段：${missing.join('、')}。请先下载导入模板。`)
      return
    }

    const idxProject = headers.indexOf('项目名称')
    const idxModel = headers.indexOf('内部型号')
    const idxCategory = headers.indexOf('产品品类')
    const idxBusiness = headers.indexOf('业务类型')
    const idxStatus = headers.indexOf('跟进状态')
    const idxSendDate = headers.indexOf('发件日期')
    const idxNextFollow = headers.indexOf('下次跟进日期')
    const idxEmail = headers.indexOf('邮件主题')
    const idxLogisticsNo = headers.indexOf('物流单号')
    const idxCompany = headers.indexOf('快递公司')
    const idxDestination = headers.indexOf('目的地')
    const idxRemark = headers.indexOf('备注')

    let successCount = 0
    let failCount = 0
    const failReasons = []

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      // 全空行跳过
      if (!row || row.every(c => c === '' || c === null || c === undefined)) continue

      const projectName = (row[idxProject] ?? '').toString().trim()
      const internalModel = (row[idxModel] ?? '').toString().trim()
      const productCategory = (row[idxCategory] ?? '').toString().trim()
      const businessType = (row[idxBusiness] ?? '').toString().trim()
      const followStatus = (row[idxStatus] ?? '').toString().trim()

      // 必填字段校验
      if (!projectName || !internalModel || !productCategory || !businessType || !followStatus) {
        failCount++
        failReasons.push(`第 ${i + 1} 行：必填字段缺失`)
        continue
      }

      const newItem = {
        id: genId(),
        projectName,
        internalModel,
        productCategory,
        businessType,
        followStatus,
        sendDate: idxSendDate >= 0 ? (row[idxSendDate] ?? '').toString().trim() : '',
        nextFollowDate: idxNextFollow >= 0 ? (row[idxNextFollow] ?? '').toString().trim() : '',
        emailSubject: idxEmail >= 0 ? (row[idxEmail] ?? '').toString().trim() : '',
        logisticsNo: idxLogisticsNo >= 0 ? (row[idxLogisticsNo] ?? '').toString().trim() : '',
        logisticsCompany: idxCompany >= 0 ? (row[idxCompany] ?? '').toString().trim() : '',
        destination: idxDestination >= 0 ? (row[idxDestination] ?? '').toString().trim() : '',
        attachments: [],
        followLogs: [],
        remark: idxRemark >= 0 ? (row[idxRemark] ?? '').toString().trim() : ''
      }
      records.push(newItem)
      successCount++
    }
    saveData()

    let msg = `导入完成：成功 ${successCount} 条`
    if (failCount > 0) {
      msg += `，失败 ${failCount} 条（必填字段缺失）`
      if (failReasons.length > 0) {
        console.warn('[SampleDeliveryLog] 导入失败明细:', failReasons)
      }
    }
    ElMessage.success(msg)
  } catch (err) {
    console.error('[SampleDeliveryLog] 导入失败:', err)
    ElMessage.error('导入失败：' + (err.message || err))
  }
}

// ===== 选项管理 =====
const showOptionDialog = ref(false)
const newCategoryName = ref('')
const newBusinessTypeName = ref('')
const newFollowStatusName = ref('')

const OPTION_CONFIG = {
  categories: {
    builtin: builtinCategories,
    custom: customCategories,
    storageKey: STORAGE_KEY_CATEGORIES,
    inputRef: () => newCategoryName,
    clear: () => { newCategoryName.value = '' },
    all: allCategories
  },
  businessTypes: {
    builtin: builtinBusinessTypes,
    custom: customBusinessTypes,
    storageKey: STORAGE_KEY_BUSINESS_TYPES,
    inputRef: () => newBusinessTypeName,
    clear: () => { newBusinessTypeName.value = '' },
    all: allBusinessTypes
  },
  followStatuses: {
    builtin: builtinFollowStatuses,
    custom: customFollowStatuses,
    storageKey: STORAGE_KEY_FOLLOW_STATUSES,
    inputRef: () => newFollowStatusName,
    clear: () => { newFollowStatusName.value = '' },
    all: allFollowStatuses
  }
}

function addCustomOption(type, name) {
  const cfg = OPTION_CONFIG[type]
  const trimmed = (name || '').trim()
  if (!trimmed) {
    ElMessage.warning('请输入选项名称')
    return
  }
  if (cfg.all.value.includes(trimmed)) {
    ElMessage.warning('该选项已存在')
    return
  }
  cfg.custom.push(trimmed)
  persistCustomOptions(cfg.storageKey, cfg.custom)
  cfg.clear()
  ElMessage.success('选项已添加')
}

async function removeCustomOption(type, name) {
  const cfg = OPTION_CONFIG[type]
  if (cfg.builtin.includes(name)) {
    ElMessage.warning('内置选项不可删除')
    return
  }
  try {
    await ElMessageBox.confirm(`确认删除自定义选项「${name}」？`, '确认删除', { type: 'warning' })
  } catch {
    return
  }
  const idx = cfg.custom.indexOf(name)
  if (idx > -1) {
    cfg.custom.splice(idx, 1)
    persistCustomOptions(cfg.storageKey, cfg.custom)
    ElMessage.success('已删除')
  }
}

// ===== 初始化 =====
onMounted(() => {
  loadRecords()
  loadCustomOptions(STORAGE_KEY_CATEGORIES, customCategories)
  loadCustomOptions(STORAGE_KEY_BUSINESS_TYPES, customBusinessTypes)
  loadCustomOptions(STORAGE_KEY_FOLLOW_STATUSES, customFollowStatuses)
})
</script>

<style scoped>
.sample-delivery-log {
  padding: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
  flex-wrap: wrap;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.page-subtitle {
  font-size: 13px;
  color: #909399;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-bar {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
}

.filter-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
}

.pagination-bar {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.attachments-editor {
  width: 100%;
}

.attachment-item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.follow-logs-section {
  margin-top: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  margin: 0;
  font-size: 15px;
  color: #303133;
  font-weight: 600;
}

.add-log-box {
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.log-list {
  border-left: 3px solid #409eff;
  padding-left: 16px;
}

.log-item {
  padding: 8px 0;
  border-bottom: 1px dashed #ebeef5;
}

.log-item:last-child {
  border-bottom: none;
}

.log-time {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.log-content {
  font-size: 14px;
  color: #303133;
  line-height: 1.6;
}

.option-manager {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.option-section {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.option-section .section-title {
  margin-bottom: 10px;
  font-size: 14px;
}

.option-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.option-tag {
  margin: 0;
}

.add-option {
  display: flex;
  align-items: center;
}

:deep(.el-table th.el-table__cell) {
  background-color: #f5f7fa !important;
  font-weight: bold;
  text-align: center;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background-color: #fafafa !important;
}

:deep(.el-table__body tr:hover > td) {
  background-color: #ecf5ff !important;
}
</style>
