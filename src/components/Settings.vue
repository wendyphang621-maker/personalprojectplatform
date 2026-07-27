<template>
  <div class="settings">
    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="云端存储" name="supabase">
        <div class="tab-content">
          <div class="setting-section">
            <h3>Supabase 配置</h3>
            <div class="supabase-status" :class="{ connected: supabaseConnected, disconnected: !supabaseConnected }">
              <span class="status-icon">
                <el-icon v-if="supabaseConnected"><CircleCheck /></el-icon>
                <el-icon v-else><CircleClose /></el-icon>
              </span>
              <span class="status-text">{{ supabaseConnected ? '已连接' : '未连接' }}</span>
            </div>
            <el-form :model="supabaseForm" label-width="120px">
              <el-form-item label="Supabase URL">
                <el-input v-model="supabaseForm.url" placeholder="https://你的项目ID.supabase.co" @blur="trimInput('url')" />
              </el-form-item>
              <el-form-item label="Supabase Key">
                <el-input v-model="supabaseForm.key" type="password" placeholder="你的匿名密钥" show-password @blur="trimInput('key')" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="testConnection">测试连接</el-button>
                <el-button @click="saveConfig">保存配置</el-button>
                <el-button @click="clearConfig">清除配置</el-button>
              </el-form-item>
            </el-form>
          </div>
          
          <div class="setting-section">
            <h3>存储桶配置</h3>
            <el-form :model="supabaseForm" label-width="120px">
              <el-form-item label="存储桶名称">
                <el-input v-model="supabaseForm.bucket" placeholder="customer_light_files" @blur="trimInput('bucket')" />
              </el-form-item>
              <el-form-item>
                <template v-if="supabaseConnected && !bucketExists && canCreateBucket">
                  <el-button type="primary" @click="handleCreateBucket">创建存储桶</el-button>
                </template>
                <template v-else-if="supabaseConnected && bucketExists">
                  <el-button type="primary" disabled>存储桶已存在</el-button>
                </template>
                <template v-else-if="supabaseConnected && bucketListError">
                  <el-button type="primary" disabled>权限不足，无法创建</el-button>
                </template>
                <el-button @click="saveConfig">保存配置</el-button>
              </el-form-item>
            </el-form>
            <div class="bucket-info">
              <div class="info-item">
                <span class="info-label">访问权限：</span>
                <span class="info-value">私有（Private）</span>
              </div>
              <div class="info-item">
                <span class="info-label">文件路径：</span>
                <span class="info-value">customers/客户ID/文件名</span>
              </div>
            </div>
            <div class="bucket-tip">
              <el-alert
                title="配置说明"
                type="info"
                :closable="false"
                show-icon
              >
                <p>1. 在 Supabase Dashboard 中创建存储桶：Settings → Storage → Create bucket</p>
                <p>2. 存储桶名称可以自定义，所有上传组件将共用此配置</p>
                <p>3. 访问权限设置为 <strong>Private</strong></p>
                <p>4. 文件限制：单文件5MB以内，支持图片、PDF、Word</p>
              </el-alert>
            </div>
          </div>
          
          <div class="setting-section">
            <h3>数据同步</h3>
            <div class="sync-actions">
              <el-button @click="syncDataToCloud">上传数据到云端</el-button>
              <el-button @click="syncDataFromCloud">从云端下载数据</el-button>
            </div>
          </div>
          
          <div class="setting-section">
            <h3>环境切换</h3>
            <el-alert
              title="环境切换说明"
              type="warning"
              :closable="false"
              show-icon
            >
              <p>开发环境默认使用测试库，开启此开关后强制使用线上正式库</p>
              <p>开启后本地和线上将访问同一数据库，确保数据完全同步</p>
              <p>修改后需要刷新页面生效</p>
            </el-alert>
            <div class="env-switch">
              <span class="switch-label">强制使用线上正式库</span>
              <el-switch 
                v-model="forceProduction" 
                :active-value="true" 
                :inactive-value="false"
                @change="handleForceProductionChange"
              />
            </div>
            <div class="env-info">
              <p>当前环境：<span :class="forceProduction ? 'prod' : 'dev'">{{ forceProduction ? '线上正式库(强制)' : '开发测试库' }}</span></p>
              <p>主机名：{{ window.location.hostname }}</p>
              <p>构建模式：{{ buildMode }}</p>
            </div>
          </div>
          
          <div class="setting-section danger-section">
            <h3>数据重置（测试用）</h3>
            <el-alert
              title="警告"
              type="warning"
              :closable="false"
              show-icon
            >
              <p>此操作将清除所有业务数据（客户、订单、待办等），恢复到系统初始状态。</p>
              <p>仅用于测试环境，生产环境请勿使用！</p>
            </el-alert>
            <div class="reset-actions">
              <el-button type="danger" @click="confirmResetData">一键清除测试数据</el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="用户信息" name="user">
        <div class="tab-content">
          <div class="setting-section">
            <h3>基本信息</h3>
            <el-form :model="userForm" label-width="120px">
              <el-form-item label="用户名">
                <el-input v-model="userForm.name" />
              </el-form-item>
              <el-form-item label="岗位">
                <el-select v-model="userForm.position">
                  <el-option label="销售助理" value="销售助理" />
                  <el-option label="研发工程师" value="研发工程师" />
                  <el-option label="项目经理" value="项目经理" />
                  <el-option label="财务" value="财务" />
                </el-select>
              </el-form-item>
              <el-form-item label="常用对接客户">
                <el-select v-model="userForm.quickCustomers" multiple filterable>
                  <el-option v-for="c in store.customers" :key="c.id" :label="c.name" :value="c.name" />
                </el-select>
              </el-form-item>
              <el-form-item label="默认导出报表格式">
                <el-select v-model="userForm.defaultReportFormat">
                  <el-option label="Excel (.csv)" value="excel" />
                  <el-option label="PDF" value="pdf" />
                  <el-option label="Word" value="word" />
                </el-select>
              </el-form-item>
              <el-form-item label="物流默认快递公司">
                <el-select v-model="userForm.defaultLogisticsCompany">
                  <el-option label="顺丰" value="顺丰" />
                  <el-option label="DHL" value="DHL" />
                  <el-option label="UPS" value="UPS" />
                  <el-option label="FedEx" value="FedEx" />
                </el-select>
              </el-form-item>
              <el-form-item label="头像">
                <el-button type="primary" @click="changeAvatar">上传头像</el-button>
              </el-form-item>
            </el-form>
          </div>
          
          <div class="setting-section">
            <h3>修改密码</h3>
            <el-form :model="passwordForm" label-width="120px">
              <el-form-item label="旧密码">
                <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入旧密码" show-password />
              </el-form-item>
              <el-form-item label="新密码">
                <el-input v-model="passwordForm.newPassword" type="password" placeholder="至少8位，包含字母和数字" show-password />
              </el-form-item>
              <el-form-item label="确认密码">
                <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="再次输入新密码" show-password />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleChangePassword">修改密码</el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="账号管理" name="accounts" v-if="store.user.role === 'admin'">
        <div class="tab-content">
          <div class="setting-section">
            <div class="section-header">
              <h3>用户列表</h3>
              <el-button type="primary" @click="showAddUserDialog = true">新增用户</el-button>
            </div>
            <el-table :data="authUsers" border style="width: 100%">
              <el-table-column prop="username" label="用户名" />
              <el-table-column prop="role" label="角色">
                <template #default="{ row }">
                  <el-tag :type="row.role === 'admin' ? 'danger' : 'success'">
                    {{ row.role === 'admin' ? '管理员' : '销售助理' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="position" label="岗位" />
              <el-table-column prop="createdAt" label="创建时间" />
              <el-table-column label="操作" width="180">
                <template #default="{ row }">
                  <el-button size="small" @click="handleEditUser(row)">编辑</el-button>
                  <el-button size="small" type="danger" @click="handleDeleteUser(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="预警配置" name="alert">
        <div class="tab-content">
          <div class="setting-section">
            <h3>预警推送设置</h3>
            <div class="alert-items">
              <div class="alert-item">
                <div class="alert-info">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                  <div class="alert-detail">
                    <span class="alert-title">证书到期预警</span>
                    <span class="alert-desc">提前30天提醒，7天内标红预警</span>
                  </div>
                </div>
                <el-switch v-model="alertSettings.certExpire" active-text="开启" inactive-text="关闭" />
              </div>
              
              <div class="alert-item">
                <div class="alert-info">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <div class="alert-detail">
                    <span class="alert-title">物流包裹超期预警</span>
                    <span class="alert-desc">运输超过7天未签收标红预警</span>
                  </div>
                </div>
                <el-switch v-model="alertSettings.logisticsOverdue" active-text="开启" inactive-text="关闭" />
              </div>
              
              <div class="alert-item">
                <div class="alert-info">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <div class="alert-detail">
                    <span class="alert-title">客户跟进预警</span>
                    <span class="alert-desc">超过15天无跟进记录提醒</span>
                  </div>
                </div>
                <el-switch v-model="alertSettings.customerFollowup" active-text="开启" inactive-text="关闭" />
              </div>
            </div>
          </div>
          
          <div class="setting-section">
            <h3>预警参数设置</h3>
            <el-form :model="alertParams" label-width="150px">
              <el-form-item label="证书到期预警天数">
                <div class="param-row">
                  <el-input-number v-model="alertParams.certWarningDays" :min="7" :max="90" />
                  <span class="param-unit">天（标黄）</span>
                </div>
              </el-form-item>
              <el-form-item label="证书紧急预警天数">
                <div class="param-row">
                  <el-input-number v-model="alertParams.certDangerDays" :min="1" :max="30" />
                  <span class="param-unit">天（标红）</span>
                </div>
              </el-form-item>
              <el-form-item label="物流超期预警天数">
                <div class="param-row">
                  <el-input-number v-model="alertParams.logisticsOverdueDays" :min="3" :max="30" />
                  <span class="param-unit">天</span>
                </div>
              </el-form-item>
              <el-form-item label="客户未跟进预警天数">
                <div class="param-row">
                  <el-input-number v-model="alertParams.customerFollowupDays" :min="7" :max="90" />
                  <span class="param-unit">天</span>
                </div>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="数据管理" name="data">
        <div class="tab-content">
          <div class="setting-section">
            <h3>数据操作</h3>
            <div class="data-actions">
              <el-button @click="exportData">导出数据</el-button>
              <el-button @click="showImportDialog = true">导入数据</el-button>
              <el-button @click="cleanOldCache">清理90天以上缓存</el-button>
            </div>
          </div>
          
          <div class="setting-section danger-section">
            <h3>数据重置（测试用）</h3>
            <el-alert
              title="警告"
              type="warning"
              :closable="false"
              show-icon
            >
              <p>此操作将清除所有业务数据（客户、订单、待办等），恢复到系统初始状态。</p>
              <p>仅用于测试环境，生产环境请勿使用！</p>
            </el-alert>
            <div class="reset-actions">
              <el-button type="danger" @click="confirmResetData">一键清除测试数据</el-button>
            </div>
          </div>
          
          <div class="setting-section">
            <h3>存储信息</h3>
            <div class="data-info">
              <div class="info-row">
                <span>当前存储模式：</span>
                <span :class="store.localMode ? 'local' : 'remote'">{{ store.localMode ? '本地存储' : '云端存储' }}</span>
              </div>
              <div class="info-row">
                <span>数据大小：</span>
                <span>{{ dataSize }}</span>
              </div>
              <div class="info-row">
                <span>客户数量：</span>
                <span>{{ store.customers.length }}人</span>
              </div>
              <div class="info-row">
                <span>订单数量：</span>
                <span>{{ store.salesOrders.length }}单</span>
              </div>
              <div class="info-row">
                <span>待办任务：</span>
                <span>{{ store.dailyTodos.filter(t => !t.completed).length }}项</span>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="显示设置" name="display">
        <div class="tab-content">
          <div class="setting-section">
            <h3>主题设置</h3>
            <el-form :model="displayForm" label-width="100px">
              <el-form-item label="主题颜色">
                <div class="color-picker">
                  <button 
                    v-for="color in themeColors" 
                    :key="color"
                    class="color-btn"
                    :style="{ background: color }"
                    :class="{ active: displayForm.themeColor === color }"
                    @click="displayForm.themeColor = color"
                  ></button>
                </div>
              </el-form-item>
              <el-form-item label="语言">
                <el-select v-model="displayForm.language">
                  <el-option label="中文" value="zh-CN" />
                  <el-option label="English" value="en" />
                </el-select>
              </el-form-item>
            </el-form>
          </div>
          
          <div class="setting-section">
            <h3>甘特图显示</h3>
            <el-form :model="displayForm" label-width="120px">
              <el-form-item>
                <el-switch v-model="displayForm.showMilestone" active-text="显示里程碑" inactive-text="隐藏里程碑" />
              </el-form-item>
              <el-form-item>
                <el-switch v-model="displayForm.showCompleted" active-text="显示已完成" inactive-text="隐藏已完成" />
              </el-form-item>
              <el-form-item>
                <el-switch v-model="displayForm.showSalesProjects" active-text="仅展示销售类项目" inactive-text="显示全部项目" />
              </el-form-item>
            </el-form>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="关于" name="about">
        <div class="tab-content">
          <div class="setting-section">
            <h3>系统信息</h3>
            <div class="about-info">
              <div class="info-row">
                <span>版本：</span>
                <span>2.0.0</span>
              </div>
              <div class="info-row">
                <span>技术栈：</span>
                <span>Vue3 + Element Plus</span>
              </div>
              <div class="info-row">
                <span>存储：</span>
                <span>LocalStorage</span>
              </div>
              <div class="info-row">
                <span>角色：</span>
                <span>{{ store.user.role === 'sales_assistant' ? '销售助理' : '管理员' }}</span>
              </div>
            </div>
          </div>
          
          <div class="setting-section">
            <h3>功能说明</h3>
            <div class="feature-list">
              <div class="feature-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span>客户线索管理：海外客户台账、跟进记录、寄样申请、分组配置</span>
              </div>
              <div class="feature-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span>订单出货管理：订单台账、物流跟踪、费用对账、IMEI核对</span>
              </div>
              <div class="feature-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <span>产品资料台账：机型参数、合规认证、渲染图素材、供应商管理</span>
              </div>
              <div class="feature-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
                <span>报表中心：5套销售专属报表，支持Excel导出</span>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <el-dialog v-model="showImportDialog" title="导入数据" width="500px">
      <el-form :model="importForm" label-width="80px">
        <el-form-item label="数据文件">
          <input type="file" accept=".json" @change="handleFileSelect" />
        </el-form-item>
        <el-form-item label="数据内容">
          <el-input v-model="importForm.data" type="textarea" :rows="10" placeholder="粘贴JSON数据..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="importData">导入</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showAddUserDialog" :title="isEditingUser ? '编辑用户' : '新增用户'" width="400px">
      <el-form :model="userEditForm" label-width="100px">
        <el-form-item label="用户名">
          <el-input v-model="userEditForm.username" />
        </el-form-item>
        <el-form-item label="密码" v-if="!isEditingUser">
          <el-input v-model="userEditForm.password" type="password" placeholder="至少8位，包含字母和数字" show-password />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="userEditForm.role">
            <el-option label="管理员" value="admin" />
            <el-option label="销售助理" value="sales_assistant" />
          </el-select>
        </el-form-item>
        <el-form-item label="岗位">
          <el-select v-model="userEditForm.position">
            <el-option label="销售助理" value="销售助理" />
            <el-option label="研发工程师" value="研发工程师" />
            <el-option label="项目经理" value="项目经理" />
            <el-option label="财务" value="财务" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeUserDialog">取消</el-button>
        <el-button type="primary" @click="saveUser">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { store, authStore, register, deleteAuthUser, updateAuthUser, changePassword, resetAllData, syncAllFromSupabase } from '../store.js'
import { testSupabaseConnection, saveSupabaseConfig, getSupabaseConfig, clearSupabaseConfig, createSupabaseBucket, syncToSupabase, fetchFromSupabase, setForceProduction, getForceProduction } from '../supabase.js'
import { CircleCheck, CircleClose } from '@element-plus/icons-vue'

const emit = defineEmits(['config-change'])

const activeTab = ref('supabase')

onMounted(async () => {
  await syncAllFromSupabase()
})
const showImportDialog = ref(false)
const showAddUserDialog = ref(false)
const isEditingUser = ref(false)
const editingUserId = ref('')

const authUsers = computed(() => authStore.users)

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const userEditForm = reactive({
  username: '',
  password: '',
  role: 'sales_assistant',
  position: '销售助理'
})

const supabaseConnected = ref(false)
const bucketExists = ref(false)
const canCreateBucket = ref(true)
const bucketListError = ref(false)
const forceProduction = ref(getForceProduction())
const buildMode = ref(import.meta.env.MODE || 'unknown')
const supabaseForm = reactive({
  url: '',
  key: '',
  bucket: ''
})

const savedConfig = ref({})
const config = getSupabaseConfig()
supabaseForm.url = config.url
supabaseForm.key = config.key
supabaseForm.bucket = config.bucket
savedConfig.value = { ...config }

if (config.url && config.key) {
  testConnectionSilent()
}

const isConfigChanged = computed(() => {
  return supabaseForm.url !== savedConfig.value.url || 
         supabaseForm.key !== savedConfig.value.key || 
         supabaseForm.bucket !== savedConfig.value.bucket
})

watch(isConfigChanged, (newVal) => {
  emit('config-change', newVal)
})

function handleForceProductionChange(val) {
  setForceProduction(val)
  if (val) {
    alert('已强制切换到线上正式库！\n\n请刷新页面使配置生效，本地和线上将访问同一数据库。')
  } else {
    alert('已恢复开发测试库！\n\n请刷新页面使配置生效。')
  }
}

async function testConnectionSilent() {
  if (!supabaseForm.url || !supabaseForm.key) {
    return
  }
  
  trimInput('url')
  trimInput('key')
  trimInput('bucket')
  
  const bucketName = supabaseForm.bucket || 'customer_light_files'
  const result = await testSupabaseConnection(supabaseForm.url, supabaseForm.key, bucketName)
  if (result.success) {
    supabaseConnected.value = true
    
    if (result.bucketListError) {
      bucketListError.value = true
      bucketExists.value = false
      canCreateBucket.value = false
    } else {
      bucketListError.value = false
      
      if (result.bucketMissing) {
        bucketExists.value = false
        canCreateBucket.value = true
      } else {
        bucketExists.value = true
        canCreateBucket.value = false
      }
    }
  } else {
    supabaseConnected.value = false
    bucketExists.value = false
    canCreateBucket.value = false
    bucketListError.value = false
  }
}

async function testConnection() {
  if (!supabaseForm.url || !supabaseForm.key) {
    alert('请填写 URL 和 Key')
    return
  }
  
  trimInput('url')
  trimInput('key')
  trimInput('bucket')
  
  const bucketName = supabaseForm.bucket || 'customer_light_files'
  const result = await testSupabaseConnection(supabaseForm.url, supabaseForm.key, bucketName)
  if (result.success) {
    supabaseConnected.value = true
    
    if (result.bucketListError) {
      bucketListError.value = true
      bucketExists.value = false
      canCreateBucket.value = false
      alert(result.message)
    } else {
      bucketListError.value = false
      
      if (result.bucketMissing) {
        bucketExists.value = false
        canCreateBucket.value = true
        
        if (result.availableBuckets && result.availableBuckets.length > 0) {
          alert(result.message + '\n\n当前可用存储桶：\n' + result.availableBuckets.join('\n'))
        } else {
          alert(result.message)
        }
      } else {
        bucketExists.value = true
        canCreateBucket.value = false
        alert(result.message)
      }
    }
  } else {
    supabaseConnected.value = false
    bucketExists.value = false
    canCreateBucket.value = false
    bucketListError.value = false
    alert('连接失败：' + result.error)
  }
}

function saveConfig(silent = false) {
  if (!supabaseForm.url || !supabaseForm.key) {
    alert('请填写 URL 和 Key')
    return
  }
  
  trimInput('url')
  trimInput('key')
  trimInput('bucket')
  
  const bucketName = supabaseForm.bucket || 'customer_light_files'
  saveSupabaseConfig(supabaseForm.url, supabaseForm.key, bucketName)
  savedConfig.value = {
    url: supabaseForm.url,
    key: supabaseForm.key,
    bucket: bucketName
  }
  supabaseConnected.value = true
  if (!silent) {
    alert('配置已保存')
  }
}

function trimInput(field) {
  if (supabaseForm[field]) {
    supabaseForm[field] = supabaseForm[field].trim()
  }
}

async function handleCreateBucket() {
  if (!supabaseForm.bucket) {
    alert('请填写存储桶名称')
    return
  }
  
  if (!supabaseConnected.value) {
    alert('请先测试连接并确保连接成功')
    return
  }
  
  trimInput('bucket')
  
  const result = await createSupabaseBucket(supabaseForm.bucket)
  if (result.success) {
    saveConfig(true)
    bucketExists.value = true
    canCreateBucket.value = false
    
    const verifyResult = await testSupabaseConnection(supabaseForm.url, supabaseForm.key, supabaseForm.bucket)
    if (verifyResult.success && !verifyResult.bucketMissing) {
      alert(`✅ 存储桶创建成功！\n\n存储桶名称：${supabaseForm.bucket}\n状态：可用`)
    } else {
      alert(`✅ 存储桶创建成功！\n\n存储桶名称：${supabaseForm.bucket}\n提示：${verifyResult.message}`)
    }
  } else {
    if (result.error && (result.error.includes('permission') || result.error.includes('Policy') || result.error.includes('RLS'))) {
      alert('❌ 建桶权限不足：当前密钥没有创建存储桶的权限，请使用服务端密钥或在 Supabase 控制台手动创建存储桶')
      canCreateBucket.value = false
    } else {
      alert('❌ 创建失败：' + result.error)
    }
  }
}

function clearConfig() {
  if (confirm('确定要清除配置吗？')) {
    clearSupabaseConfig()
    supabaseForm.url = ''
    supabaseForm.key = ''
    supabaseForm.bucket = ''
    supabaseConnected.value = false
    alert('配置已清除')
  }
}

async function syncDataToCloud() {
  const tables = [
    { name: 'customers', data: store.customers },
    { name: 'sample_deliveries', data: store.sampleDeliveries },
    { name: 'customer_followups', data: store.customerFollowUps }
  ]
  
  let successCount = 0
  for (const table of tables) {
    const result = await syncToSupabase(table.name, table.data)
    if (result.success) successCount++
  }
  
  alert(`同步完成：成功 ${successCount}/${tables.length} 张表`)
}

async function syncDataFromCloud() {
  if (!confirm('从云端下载数据将覆盖本地数据，确定继续吗？')) {
    return
  }
  
  const tables = [
    { name: 'customers', storeKey: 'customers' },
    { name: 'sample_deliveries', storeKey: 'sampleDeliveries' },
    { name: 'customer_followups', storeKey: 'customerFollowUps' }
  ]
  
  let successCount = 0
  for (const table of tables) {
    const result = await fetchFromSupabase(table.name)
    if (result.success && result.data) {
      store[table.storeKey] = result.data
      successCount++
    }
  }
  
  alert(`同步完成：成功 ${successCount}/${tables.length} 张表`)
}

function confirmResetData() {
  if (!confirm('⚠️ 警告：此操作将清除所有业务数据（客户、订单、待办、物流等），并恢复到系统初始状态！\n\n确定要继续吗？')) {
    return
  }
  if (!confirm('⚠️ 再次确认：此操作不可恢复！确定要清除所有测试数据吗？')) {
    return
  }
  
  try {
    resetAllData()
    alert('✅ 数据重置成功！所有业务数据已恢复到初始状态。')
  } catch (error) {
    console.error('Reset data error:', error)
    alert('❌ 数据重置失败，请刷新页面重试。')
  }
}

const userForm = reactive({
  name: store.user.name,
  position: store.user.position,
  quickCustomers: [...(store.user.quickCustomers || [])],
  defaultReportFormat: store.user.defaultReportFormat,
  defaultLogisticsCompany: store.user.defaultLogisticsCompany
})

watch(() => userForm.name, (newName) => {
  store.user.name = newName
})

watch(() => userForm.position, (newPosition) => {
  store.user.position = newPosition
})

watch(() => userForm.quickCustomers, (newCustomers) => {
  store.user.quickCustomers = [...newCustomers]
}, { deep: true })

watch(() => userForm.defaultReportFormat, (newFormat) => {
  store.user.defaultReportFormat = newFormat
})

watch(() => userForm.defaultLogisticsCompany, (newCompany) => {
  store.user.defaultLogisticsCompany = newCompany
})

const alertSettings = reactive({
  certExpire: store.alertSettings?.certExpire ?? true,
  logisticsOverdue: store.alertSettings?.logisticsOverdue ?? true,
  customerFollowup: store.alertSettings?.customerFollowup ?? true
})

watch(() => alertSettings.certExpire, (newVal) => {
  if (!store.alertSettings) store.alertSettings = {}
  store.alertSettings.certExpire = newVal
})

watch(() => alertSettings.logisticsOverdue, (newVal) => {
  if (!store.alertSettings) store.alertSettings = {}
  store.alertSettings.logisticsOverdue = newVal
})

watch(() => alertSettings.customerFollowup, (newVal) => {
  if (!store.alertSettings) store.alertSettings = {}
  store.alertSettings.customerFollowup = newVal
})

const alertParams = reactive({
  certWarningDays: store.alertParams?.certWarningDays ?? 30,
  certDangerDays: store.alertParams?.certDangerDays ?? 7,
  logisticsOverdueDays: store.alertParams?.logisticsOverdueDays ?? 7,
  customerFollowupDays: store.alertParams?.customerFollowupDays ?? 15
})

watch(() => alertParams.certWarningDays, (newVal) => {
  if (!store.alertParams) store.alertParams = {}
  store.alertParams.certWarningDays = newVal
})

watch(() => alertParams.certDangerDays, (newVal) => {
  if (!store.alertParams) store.alertParams = {}
  store.alertParams.certDangerDays = newVal
})

watch(() => alertParams.logisticsOverdueDays, (newVal) => {
  if (!store.alertParams) store.alertParams = {}
  store.alertParams.logisticsOverdueDays = newVal
})

watch(() => alertParams.customerFollowupDays, (newVal) => {
  if (!store.alertParams) store.alertParams = {}
  store.alertParams.customerFollowupDays = newVal
})

const displayForm = reactive({
  themeColor: '#409EFF',
  language: 'zh-CN',
  showMilestone: true,
  showCompleted: true,
  showSalesProjects: false
})

const importForm = reactive({
  data: ''
})

const themeColors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#B37FEB']

const dataSize = computed(() => {
  const data = JSON.stringify(store)
  const bytes = new Blob([data]).size
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
})

function changeAvatar() {
  alert('头像上传功能开发中')
}

function exportData() {
  const data = JSON.stringify(store, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `项目工作台数据_${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function handleFileSelect(event) {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      importForm.data = e.target.result
    }
    reader.readAsText(file)
  }
}

function importData() {
  if (!importForm.data.trim()) return
  try {
    const data = JSON.parse(importForm.data)
    Object.assign(store, data)
    showImportDialog.value = false
    alert('导入成功')
  } catch (e) {
    alert('数据格式错误')
  }
}

function cleanOldCache() {
  const now = new Date()
  const expireDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  
  let cleanedCount = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    const value = localStorage.getItem(key)
    
    try {
      const parsed = JSON.parse(value)
      if (parsed.timestamp && new Date(parsed.timestamp) < expireDate) {
        localStorage.removeItem(key)
        cleanedCount++
        i--
      }
    } catch (e) {
      continue
    }
  }
  
  alert(`已清理 ${cleanedCount} 条过期缓存`)
}

function clearData() {
  if (confirm('确定要清空所有数据吗？此操作不可恢复。')) {
    localStorage.removeItem('project_workbench_data')
    location.reload()
  }
}

function handleChangePassword() {
  if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
    alert('请填写所有密码字段')
    return
  }
  
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    alert('新密码和确认密码不一致')
    return
  }
  
  const result = changePassword(authStore.currentUser?.username, passwordForm.oldPassword, passwordForm.newPassword)
  if (result.success) {
    alert('密码修改成功')
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } else {
    alert(result.error)
  }
}

function handleEditUser(user) {
  isEditingUser.value = true
  editingUserId.value = user.id
  userEditForm.username = user.username
  userEditForm.role = user.role
  userEditForm.position = user.position
  showAddUserDialog.value = true
}

function handleDeleteUser(user) {
  if (confirm(`确定要删除用户 "${user.username}" 吗？`)) {
    const result = deleteAuthUser(user.id)
    if (result.success) {
      alert('删除成功')
    } else {
      alert(result.error)
    }
  }
}

function closeUserDialog() {
  showAddUserDialog.value = false
  isEditingUser.value = false
  editingUserId.value = ''
  userEditForm.username = ''
  userEditForm.password = ''
  userEditForm.role = 'sales_assistant'
  userEditForm.position = '销售助理'
}

function saveUser() {
  if (!userEditForm.username) {
    alert('请填写用户名')
    return
  }
  
  if (!isEditingUser.value && !userEditForm.password) {
    alert('请填写密码')
    return
  }
  
  if (!isEditingUser.value) {
    const result = register(userEditForm.username, userEditForm.password, userEditForm.role, userEditForm.position)
    if (result.success) {
      alert('创建成功')
      closeUserDialog()
    } else {
      alert(result.error)
    }
  } else {
    const existingUser = authStore.users.find(u => u.username === userEditForm.username && u.id !== editingUserId.value)
    if (existingUser) {
      alert('用户名已存在')
      return
    }
    const result = updateAuthUser(editingUserId.value, {
      username: userEditForm.username,
      role: userEditForm.role,
      position: userEditForm.position
    })
    if (result.success) {
      alert('更新成功')
      closeUserDialog()
    } else {
      alert(result.error)
    }
  }
}
</script>

<style scoped>
.settings {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.supabase-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  margin-bottom: 20px;
  font-size: 14px;
}

.supabase-status.connected {
  background: #f0f9eb;
  color: #67c23a;
}

.supabase-status.disconnected {
  background: #fef0f0;
  color: #f56c6c;
}

.status-icon {
  font-size: 16px;
}

.status-text {
  font-weight: 500;
}

.bucket-info {
  margin-bottom: 15px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-label {
  color: #909399;
}

.info-value {
  font-weight: 500;
  color: #303133;
}

.bucket-tip {
  margin-top: 10px;
}

.bucket-tip p {
  margin: 4px 0;
  font-size: 13px;
  color: #606266;
}

.sync-actions {
  display: flex;
  gap: 10px;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.setting-section {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.setting-section:last-child {
  margin-bottom: 0;
}

.setting-section h3 {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.data-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.data-info {
  padding: 15px;
  background: #fff;
  border-radius: 4px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 14px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-row .local {
  color: #67C23A;
}

.info-row .remote {
  color: #409EFF;
}

.env-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  background: #fff;
  border-radius: 4px;
  margin-bottom: 15px;
}

.switch-label {
  font-size: 14px;
  font-weight: 500;
}

.env-info {
  padding: 15px;
  background: #fff;
  border-radius: 4px;
}

.env-info p {
  margin-bottom: 8px;
  font-size: 14px;
}

.env-info p:last-child {
  margin-bottom: 0;
}

.env-info .prod {
  color: #e6a23c;
  font-weight: 500;
}

.env-info .dev {
  color: #67c23a;
  font-weight: 500;
}

.color-picker {
  display: flex;
  gap: 10px;
}

.color-btn {
  width: 40px;
  height: 40px;
  border: 3px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.color-btn:hover {
  transform: scale(1.1);
}

.color-btn.active {
  border-color: #303133;
}

.alert-items {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.alert-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #fff;
  border-radius: 8px;
}

.alert-info {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #409EFF;
}

.alert-detail {
  display: flex;
  flex-direction: column;
}

.alert-title {
  font-size: 14px;
  font-weight: 500;
}

.alert-desc {
  font-size: 12px;
  color: #909399;
}

.param-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.param-unit {
  font-size: 13px;
  color: #909399;
}

.about-info {
  padding: 15px;
  background: #fff;
  border-radius: 4px;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  background: #fff;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
}

@media (max-width: 768px) {
  .data-actions {
    flex-wrap: wrap;
  }
  .alert-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>