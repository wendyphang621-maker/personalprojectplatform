import { sanitizePathSegment, generateMinimalFileName, isPathTooLong, cleanAndValidateFileName } from './utils/common.js'
import { encrypt, decrypt, isLocalhost, isOnlineDeployment } from './utils/crypto.js'

let supabase = null
let localConfig = null
let tempConfig = null

const LOCAL_CONFIG_KEY = 'project_workbench_local_config'
const ENCRYPTED_CONFIG_KEY = 'project_workbench_encrypted_config'
const CONFIG_FILE_NAME = 'settings.local.json'
const CONFIG_DIR_NAME = '.trae'

async function loadLocalConfig() {
  try {
    if (isLocalhost()) {
      const configStr = localStorage.getItem(LOCAL_CONFIG_KEY)
      if (configStr) {
        localConfig = JSON.parse(configStr)
      } else {
        localConfig = {
          supabase: {
            SUPABASE_URL: '',
            SUPABASE_KEY: '',
            BUCKET_NAME: 'customer_light_files'
          },
          app: {
            localMode: true,
            themeColor: '#409EFF',
            language: 'zh-CN'
          }
        }
        await saveLocalConfig()
      }
      return
    }

    const encryptedConfig = localStorage.getItem(ENCRYPTED_CONFIG_KEY)
    if (encryptedConfig) {
      try {
        const decrypted = await decrypt(encryptedConfig)
        localConfig = JSON.parse(decrypted)
      } catch (decryptError) {
        console.warn('[配置] 解密失败，使用默认配置')
        localConfig = {
          supabase: {
            SUPABASE_URL: '',
            SUPABASE_KEY: '',
            BUCKET_NAME: 'customer_light_files'
          },
          app: {
            localMode: true,
            themeColor: '#409EFF',
            language: 'zh-CN'
          }
        }
      }
    } else {
      localConfig = {
        supabase: {
          SUPABASE_URL: '',
          SUPABASE_KEY: '',
          BUCKET_NAME: 'customer_light_files'
        },
        app: {
          localMode: true,
          themeColor: '#409EFF',
          language: 'zh-CN'
        }
      }
    }
  } catch (e) {
    console.error('[配置] 加载本地配置失败:', e)
    localConfig = {
      supabase: {
        SUPABASE_URL: '',
        SUPABASE_KEY: '',
        BUCKET_NAME: 'customer_light_files'
      },
      app: {
        localMode: true,
        themeColor: '#409EFF',
        language: 'zh-CN'
      }
    }
  }
}

async function saveLocalConfig() {
  try {
    if (isLocalhost()) {
      localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(localConfig))
      return
    }

    const encrypted = await encrypt(JSON.stringify(localConfig))
    localStorage.setItem(ENCRYPTED_CONFIG_KEY, encrypted)
  } catch (e) {
    console.error('[配置] 保存本地配置失败:', e)
  }
}

export function setTempConfig(url, key) {
  tempConfig = { url, key }
}

export function getTempConfig() {
  return tempConfig
}

export function clearTempConfig() {
  tempConfig = null
}

export async function saveEncryptedConfig(url, key, remember = false) {
  if (remember) {
    if (!localConfig) await loadLocalConfig()
    localConfig.supabase.SUPABASE_URL = url
    localConfig.supabase.SUPABASE_KEY = key
    await saveLocalConfig()
    tempConfig = null
  } else {
    tempConfig = { url, key }
  }
}

export async function getSavedConfig() {
  if (!localConfig) await loadLocalConfig()
  
  if (tempConfig && tempConfig.url && tempConfig.key) {
    return { url: tempConfig.url, key: tempConfig.key, source: 'temp' }
  }
  
  if (localConfig?.supabase?.SUPABASE_URL && localConfig?.supabase?.SUPABASE_KEY) {
    return { url: localConfig.supabase.SUPABASE_URL, key: localConfig.supabase.SUPABASE_KEY, source: 'saved' }
  }
  
  return null
}

export async function clearSavedConfig() {
  localStorage.removeItem(ENCRYPTED_CONFIG_KEY)
  localStorage.removeItem(LOCAL_CONFIG_KEY)
  localStorage.removeItem('supabase_url')
  localStorage.removeItem('supabase_key')
  localStorage.removeItem('supabase_bucket')
  localConfig = null
  tempConfig = null
  supabase = null
}

export function exportConfigFile() {
  try {
    const configStr = JSON.stringify(localConfig, null, 2)
    const blob = new Blob([configStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = CONFIG_FILE_NAME
    a.click()
    URL.revokeObjectURL(url)
    console.log('[配置] 配置文件已导出')
    return { success: true, message: '配置文件已导出' }
  } catch (e) {
    console.error('[配置] 导出配置文件失败:', e)
    return { success: false, error: e.message }
  }
}

export function importConfigFile(file) {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target.result)
          if (config.supabase) {
            if (config.supabase.SUPABASE_URL) {
              setLocalConfigValue('supabase.SUPABASE_URL', config.supabase.SUPABASE_URL)
            }
            if (config.supabase.SUPABASE_KEY) {
              setLocalConfigValue('supabase.SUPABASE_KEY', config.supabase.SUPABASE_KEY)
            }
            if (config.supabase.BUCKET_NAME) {
              setLocalConfigValue('supabase.BUCKET_NAME', config.supabase.BUCKET_NAME)
            }
          }
          if (config.app) {
            if (config.app.localMode !== undefined) {
              setLocalConfigValue('app.localMode', config.app.localMode)
            }
            if (config.app.themeColor) {
              setLocalConfigValue('app.themeColor', config.app.themeColor)
            }
            if (config.app.language) {
              setLocalConfigValue('app.language', config.app.language)
            }
          }
          supabase = null
          console.log('[配置] 配置文件已导入')
          resolve({ success: true, message: '配置文件已导入' })
        } catch (parseError) {
          console.error('[配置] 解析配置文件失败:', parseError)
          resolve({ success: false, error: '配置文件格式错误' })
        }
      }
      reader.onerror = () => {
        resolve({ success: false, error: '读取文件失败' })
      }
      reader.readAsText(file)
    } catch (e) {
      console.error('[配置] 导入配置文件失败:', e)
      resolve({ success: false, error: e.message })
    }
  })
}

function getLocalConfigValue(keyPath) {
  if (!localConfig) loadLocalConfig()
  const keys = keyPath.split('.')
  let value = localConfig
  for (const key of keys) {
    value = value?.[key]
    if (value === undefined) return ''
  }
  return value
}

function setLocalConfigValue(keyPath, value) {
  if (!localConfig) loadLocalConfig()
  const keys = keyPath.split('.')
  let obj = localConfig
  for (let i = 0; i < keys.length - 1; i++) {
    if (!obj[keys[i]]) obj[keys[i]] = {}
    obj = obj[keys[i]]
  }
  obj[keys[keys.length - 1]] = value
  saveLocalConfig()
}

loadLocalConfig()

function isProduction() {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  return import.meta.env.PROD || 
         hostname.includes('netlify.app') || 
         hostname.includes('.vercel.app') ||
         hostname.includes('www.') ||
         import.meta.env.VITE_ENV === 'production'
}

function shouldForceProduction() {
  return localStorage.getItem('supabase_force_production') === 'true'
}

function logEnvironmentInfo() {
  const production = isProduction()
  const forceProd = shouldForceProduction()
  const host = typeof window !== 'undefined' ? window.location.hostname : ''
  const env = import.meta.env.MODE || 'unknown'
  
  console.log('=======================================')
  console.log('[Supabase] 环境检测信息')
  console.log('=======================================')
  console.log(`[环境] 主机名: ${host}`)
  console.log(`[环境] 构建模式: ${env}`)
  console.log(`[环境] 生产环境标志: ${production}`)
  console.log(`[环境] 强制线上库: ${forceProd}`)
  console.log(`[环境] 最终环境: ${forceProd ? '线上正式库(强制)' : (production ? '线上正式库' : '开发测试库')}`)
  console.log('=======================================')
}

export function setForceProduction(force) {
  if (force) {
    localStorage.setItem('supabase_force_production', 'true')
    console.log('[Supabase] 已强制切换到线上正式库')
  } else {
    localStorage.removeItem('supabase_force_production')
    console.log('[Supabase] 已恢复默认环境配置')
  }
  supabase = null
}

export function getForceProduction() {
  return shouldForceProduction()
}

export async function getSupabase() {
  if (supabase) return supabase
  
  let supabaseUrl = ''
  let supabaseKey = ''
  let configSource = ''
  
  if (isLocalhost()) {
    logEnvironmentInfo()
    
    if (shouldForceProduction()) {
      supabaseUrl = import.meta.env.VITE_PROD_SUPABASE_URL || getLocalConfigValue('supabase.SUPABASE_URL') || ''
      supabaseKey = import.meta.env.VITE_PROD_SUPABASE_ANON_KEY || getLocalConfigValue('supabase.SUPABASE_KEY') || ''
      configSource = '线上正式配置(强制)'
    } else if (isProduction()) {
      supabaseUrl = import.meta.env.VITE_PROD_SUPABASE_URL || getLocalConfigValue('supabase.SUPABASE_URL') || ''
      supabaseKey = import.meta.env.VITE_PROD_SUPABASE_ANON_KEY || getLocalConfigValue('supabase.SUPABASE_KEY') || ''
      configSource = '线上正式配置'
    } else {
      supabaseUrl = getLocalConfigValue('supabase.SUPABASE_URL') || localStorage.getItem('supabase_url') || import.meta.env.VITE_DEV_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || ''
      supabaseKey = getLocalConfigValue('supabase.SUPABASE_KEY') || localStorage.getItem('supabase_key') || import.meta.env.VITE_DEV_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || ''
      configSource = getLocalConfigValue('supabase.SUPABASE_URL') ? '本机私有配置' : (localStorage.getItem('supabase_url') ? '用户临时缓存' : '开发环境变量')
    }
    
    console.log(`[Supabase] 配置来源: ${configSource}`)
    console.log(`[Supabase] URL: ${supabaseUrl ? supabaseUrl : '(未配置)'}`)
    console.log(`[Supabase] KEY: ${supabaseKey ? '已配置(隐藏)' : '(未配置)'}`)
  } else {
    const savedConfig = await getSavedConfig()
    
    if (savedConfig) {
      supabaseUrl = savedConfig.url
      supabaseKey = savedConfig.key
      configSource = savedConfig.source === 'temp' ? '临时内存配置' : '加密存储配置'
    }
  }
  
  if (!supabaseUrl || !supabaseKey) {
    if (isLocalhost()) {
      console.error('[Supabase] 配置不完整，无法连接，系统自动切换到本地模式')
    }
    return null
  }
  
  try {
    const { createClient } = await import('@supabase/supabase-js')
    supabase = createClient(supabaseUrl, supabaseKey)
    
    if (isLocalhost()) {
      console.log('[Supabase] 客户端初始化成功')
    }
    
    return supabase
  } catch (err) {
    if (isLocalhost()) {
      console.error('[Supabase] 客户端初始化失败:', err)
    }
    return null
  }
}

export async function testSupabaseConnection(url, key, bucketName = 'customer_light_files') {
  const trimmedUrl = url.trim()
  const trimmedKey = key.trim()
  const trimmedBucket = normalizeBucketName(bucketName) || 'customer_light_files'
  
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const client = createClient(trimmedUrl, trimmedKey)
    
    const { data, error } = await client.auth.getSession()
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    const { data: buckets, error: bucketError } = await client.storage.listBuckets()
    
    if (bucketError) {
      return { 
        success: true, 
        message: `连接成功！仅校验连通性，不影响上传下载功能，可忽略弹窗继续使用。`,
        bucketListError: true
      }
    }
    
    const bucketExists = buckets.some(b => b.name === trimmedBucket)
    
    if (!bucketExists) {
      return { 
        success: true, 
        message: `连接成功！存储桶 "${trimmedBucket}" 不存在，请点击下方「创建存储桶」按钮创建`, 
        bucketMissing: true,
        availableBuckets: buckets.map(b => b.name)
      }
    }
    
    return { success: true, message: `连接成功！存储桶 "${trimmedBucket}" 可用` }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export function saveSupabaseConfig(url, key, bucketName = 'customer_light_files') {
  const normalizedBucket = normalizeBucketName(bucketName) || 'customer_light_files'
  setLocalConfigValue('supabase.SUPABASE_URL', url)
  setLocalConfigValue('supabase.SUPABASE_KEY', key)
  setLocalConfigValue('supabase.BUCKET_NAME', normalizedBucket)
  localStorage.setItem('supabase_url', url)
  localStorage.setItem('supabase_key', key)
  localStorage.setItem('supabase_bucket', normalizedBucket)
  supabase = null
  console.log('[配置] Supabase配置已保存到本机私有配置')
}

export function getSupabaseConfig() {
  const localUrl = getLocalConfigValue('supabase.SUPABASE_URL')
  const localKey = getLocalConfigValue('supabase.SUPABASE_KEY')
  const rawBucket = getLocalConfigValue('supabase.BUCKET_NAME') || localStorage.getItem('supabase_bucket') || ''
  // 自动修正旧的错误桶名 customer-files → customer_light_files
  const localBucket = normalizeBucketName(rawBucket) || 'customer_light_files'

  return {
    url: localUrl || localStorage.getItem('supabase_url') || import.meta.env.VITE_SUPABASE_URL || '',
    key: localKey || localStorage.getItem('supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    bucket: localBucket
  }
}

export function clearSupabaseConfig() {
  setLocalConfigValue('supabase.SUPABASE_URL', '')
  setLocalConfigValue('supabase.SUPABASE_KEY', '')
  setLocalConfigValue('supabase.BUCKET_NAME', 'customer_light_files')
  localStorage.removeItem('supabase_url')
  localStorage.removeItem('supabase_key')
  localStorage.removeItem('supabase_bucket')
  supabase = null
  console.log('[配置] Supabase配置已清除')
}

export function getSupabaseBucket() {
  const raw = getLocalConfigValue('supabase.BUCKET_NAME') || localStorage.getItem('supabase_bucket') || ''
  return normalizeBucketName(raw) || 'customer_light_files'
}

/**
 * 桶名自动修正：将旧的各种错误桶名统一归一为 customer_light_files
 * 修正项：customer-files / customer_files / customerfiles / light-files / customer-light-files
 */
function normalizeBucketName(name) {
  if (!name || typeof name !== 'string') return ''
  const trimmed = name.trim()
  if (!trimmed) return ''
  // 已是正确桶名，直接返回
  if (trimmed === 'customer_light_files') return trimmed
  // 命中旧错误名，统一修正
  const wrongNames = ['customer-files', 'customer_files', 'customerfiles', 'light-files', 'customer-light-files', 'customer_light']
  if (wrongNames.includes(trimmed.toLowerCase())) {
    console.warn(`[配置] 检测到旧桶名 "${trimmed}"，已自动修正为 "customer_light_files"`)
    return 'customer_light_files'
  }
  // 用户自定义桶名，原样返回
  return trimmed
}

export function getLocalMode() {
  const mode = getLocalConfigValue('app.localMode')
  return mode === null ? true : mode
}

export function setLocalMode(mode) {
  setLocalConfigValue('app.localMode', mode)
  console.log(`[配置] 本地模式已${mode ? '开启' : '关闭'}`)
}

const TABLE_SCHEMA = {
  customers: {
    allowedFields: ['id', 'name', 'group_name', 'country', 'region', 'company', 'email', 'phone', 'address', 'created_at', 'updated_at']
  },
  sample_deliveries: {
    allowedFields: ['id', 'customer_name', 'model', 'area', 'logistics', 'tracking_no', 'send_date', 'remark']
  },
  package_sample_follows: {
    allowedFields: ['id', 'customer_name', 'model', 'follow_content', 'next_follow_date', 'last_follow_date', 'follow_type', 'remark', 'created_at', 'updated_at']
  },
  product_models: {
    allowedFields: ['id', 'model_name', 'chip_scheme', 'screen_param', 'cert_list', 'supplier_name', 'created_at', 'updated_at']
  },
  product_certs: {
    allowedFields: ['id', 'model_id', 'model_name', 'cert_type', 'cert_no', 'issue_date', 'expire_date', 'attachments', 'created_at', 'updated_at']
  },
  product_images: {
    allowedFields: ['id', 'model_id', 'pic_url', 'pic_size', 'pic_type', 'upload_time', 'created_at']
  },
  logistics_orders: {
    allowedFields: ['id', 'order_no', 'tracking_no', 'logistics_company', 'status', 'estimated_delivery', 'actual_delivery', 'created_at', 'updated_at']
  },
  package_freight_records: {
    allowedFields: ['id', 'customer_name', 'model', 'invoice_no', 'total_amount', 'paid_amount', 'unpaid_amount', 'currency', 'remark', 'created_at', 'updated_at']
  },
  sales_orders: {
    allowedFields: ['id', 'order_no', 'customer_name', 'model', 'quantity', 'order_date', 'logistics_no', 'status', 'amount', 'bulk_freight', 'freight_currency', 'order_type', 'payment_status', 'currency', 'created_at', 'updated_at']
  },
  customer_groups: {
    allowedFields: ['id', 'group_name', 'description', 'color', 'created_at']
  },
  activate_export_configs: {
    allowedFields: ['id', 'customer', 'update_frequency', 'receive_email', 'model', 'country', 'software_version', 'need_imei', 'need_filter', 'export_table_name', 'fota_source', 'enabled', 'created_at', 'updated_at']
  },
  cert_matrix_files: {
    allowedFields: ['id', 'name', 'template', 'category', 'order', 'remark', 'is_deleted', 'update_time']
  },
  cert_matrix_cells: {
    allowedFields: ['id', 'file_id', 'model_id', 'status', 'remark', 'cert_id', 'cert_type', 'is_deleted', 'update_time']
  },
  cert_matrix_templates: {
    allowedFields: ['id', 'name', 'files', 'created_at']
  },
  cert_matrix_statuses: {
    allowedFields: ['id', 'key', 'name', 'color', 'bg']
  }
}

const FIELD_MAPPING = {
  sample_deliveries: {},
  sales_orders: {
    id: 'order_no',
    customerName: 'customer_name',
    bookingDate: 'order_date',
    logisticsNo: 'logistics_no',
    qty: 'quantity',
    bulkFreight: 'bulk_freight',
    orderType: 'order_type',
    balanceSettled: 'payment_status'
  },
  package_sample_follows: {
    customerId: 'customer_name',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    nextFollowDate: 'next_follow_date',
    lastFollowDate: 'last_follow_date'
  },
  product_models: {
    id: 'id',
    name: 'model_name',
    chip: 'chip_scheme',
    screen: 'screen_param',
    certifications: 'cert_list',
    supplierId: 'supplier_name',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  product_certs: {
    modelId: 'model_id',
    modelName: 'model_name',
    certType: 'cert_type',
    certNo: 'cert_no',
    issueDate: 'issue_date',
    expireDate: 'expire_date',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  product_images: {
    modelId: 'model_id',
    picUrl: 'pic_url',
    picSize: 'pic_size',
    picType: 'pic_type',
    uploadTime: 'upload_time',
    createdAt: 'created_at'
  },
  customers: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  logistics_orders: {
    orderNo: 'order_no',
    trackingNo: 'tracking_no',
    logisticsCompany: 'logistics_company',
    estimatedDelivery: 'estimated_delivery',
    actualDelivery: 'actual_delivery',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  package_freight_records: {
    invoiceNo: 'invoice_no',
    totalAmount: 'total_amount',
    paidAmount: 'paid_amount',
    unpaidAmount: 'unpaid_amount',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  activate_export_configs: {
    updateFrequency: 'update_frequency',
    receiveEmail: 'receive_email',
    softwareVersion: 'software_version',
    needImei: 'need_imei',
    needFilter: 'need_filter',
    exportTableName: 'export_table_name',
    fotaSource: 'fota_source',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  cert_matrix_files: {
    isDeleted: 'is_deleted',
    updateTime: 'update_time'
  },
  cert_matrix_cells: {
    fileId: 'file_id',
    modelId: 'model_id',
    certId: 'cert_id',
    certType: 'cert_type',
    isDeleted: 'is_deleted',
    updateTime: 'update_time'
  },
  cert_matrix_templates: {
    createdAt: 'created_at'
  },
  cert_matrix_statuses: {}
}

function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

function convertFieldName(fieldName, mapping, direction) {
  if (!mapping) return fieldName
  if (direction === 'toSnake') {
    const directMap = mapping[fieldName]
    if (directMap) return directMap
    return camelToSnake(fieldName)
  } else {
    for (const [camel, snake] of Object.entries(mapping)) {
      if (snake === fieldName) return camel
    }
    return snakeToCamel(fieldName)
  }
}

function convertDataForSupabase(data, tableName) {
  const mapping = FIELD_MAPPING[tableName]
  const schema = TABLE_SCHEMA[tableName]
  const allowedFields = schema ? schema.allowedFields : null
  
  console.log(`[convertDataForSupabase] 表 ${tableName}, 原始数据:`, JSON.stringify(data))
  console.log(`[convertDataForSupabase] 原始字段:`, Object.keys(data))
  console.log(`[convertDataForSupabase] mapping:`, mapping)
  console.log(`[convertDataForSupabase] allowedFields:`, allowedFields)
  
  let converted = data
  if (mapping) {
    converted = {}
    for (const [key, value] of Object.entries(data)) {
      const newKey = convertFieldName(key, mapping, 'toSnake')
      console.log(`[convertDataForSupabase] 字段 ${key} -> ${newKey}, 值:`, value)
      converted[newKey] = value
    }
  }
  
  console.log(`[convertDataForSupabase] 转换后字段:`, Object.keys(converted))
  
  if (!allowedFields) return converted
  
  const filtered = {}
  let strippedCount = 0
  for (const [key, value] of Object.entries(converted)) {
    if (allowedFields.includes(key)) {
      filtered[key] = value
    } else {
      console.log(`[convertDataForSupabase] 剥离字段: ${key} (不在白名单中)`)
      strippedCount++
    }
  }
  
  if (strippedCount > 0) {
    console.log(`[字段过滤] 表 ${tableName} 已剥离 ${strippedCount} 个不在白名单中的字段`)
  }
  
  console.log(`[convertDataForSupabase] 最终字段:`, Object.keys(filtered))
  return filtered
}

function convertDataFromSupabase(data, tableName) {
  const mapping = FIELD_MAPPING[tableName]
  if (!mapping) return data
  
  if (Array.isArray(data)) {
    return data.map(item => convertDataFromSupabase(item, tableName))
  }
  
  if (!data || typeof data !== 'object') return data
  
  const result = {}
  for (const [key, value] of Object.entries(data)) {
    const newKey = convertFieldName(key, mapping, 'toCamel')
    result[newKey] = value
  }
  return result
}

export async function syncToSupabase(tableName, data) {
  const client = await getSupabase()
  if (!client) {
    console.log('Supabase not configured, skipping sync')
    return { success: false, error: 'Supabase not configured' }
  }
  
  try {
    // ======= 兜底：同步前为缺失 id 的记录自动补短编号 =======
    const safeData = { ...data }
    if (!safeData.id || safeData.id.length > 30) {
      // 只在没有 id 或 id 是长时间戳格式时才生成短编号
      const idPrefixMap = {
        product_models: 'PM',
        customers: 'CUST',
        sales_orders: 'SO',
        daily_todos: 'TODO',
        suppliers: 'SUP',
        logistics_orders: 'LOG',
        package_sample_follows: 'PKG',
        customer_follow_ups: 'CFU',
        customer_payments: 'CPAY',
        projects: 'PRJ',
        stages: 'STG',
        tasks: 'TSK',
        package_freight_records: 'PFR',
        inventory: 'INV',
        inventory_logs: 'ILOG',
        price_history: 'PH',
        customer_groups: 'CG',
        cert_matrix_files: 'CMF',
        cert_matrix_cells: 'CMC',
        cert_matrix_templates: 'CMT',
        cert_matrix_statuses: 'CMS',
        product_certs: 'PC',
        product_images: 'PI',
        daily_reminders: 'DR',
        todo_remind_logs: 'TRL',
        sample_deliveries: 'SD',
        activate_export_configs: 'AEC'
      }
      const prefix = idPrefixMap[tableName] || 'REC'
      // 用短编号：查询现有最大编号 + 1
      try {
        const { data: existing } = await client.from(tableName).select('id').order('id', { ascending: false }).limit(1)
        let nextNum = 1
        if (existing && existing.length > 0 && existing[0].id) {
          const match = existing[0].id.match(/-(\d+)$/)
          if (match) nextNum = parseInt(match[1]) + 1
        }
        safeData.id = `${prefix}-${String(nextNum).padStart(3, '0')}`
      } catch {
        // 查询失败则用随机短编号兜底
        safeData.id = `${prefix}-${String(Math.floor(Math.random() * 900) + 100)}`
      }
      console.log(`[syncToSupabase] 表 ${tableName} 生成短编号: ${safeData.id}`)
    }
    
    let convertedData = convertDataForSupabase(safeData, tableName)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    const tablesWithTextId = ['sample_deliveries', 'product_models', 'customers', 'sales_orders', 'suppliers', 'logistics_orders', 'package_sample_follows', 'daily_todos', 'customer_follow_ups', 'customer_payments', 'projects', 'stages', 'tasks', 'package_freight_records', 'inventory', 'inventory_logs', 'price_history', 'customer_groups', 'cert_matrix_files', 'cert_matrix_cells', 'cert_matrix_templates', 'cert_matrix_statuses', 'product_certs', 'product_images', 'daily_reminders', 'todo_remind_logs']
    const preserveId = tablesWithTextId.includes(tableName)

    // 自增ID表：id 由数据库 BIGSERIAL 生成，前端不得传入
    // 仅当 id 为纯数字（数据库已生成）时才保留用于 upsert，否则一律剥离走 insert
    const tablesWithAutoId = ['activate_export_configs']
    const isAutoIdTable = tablesWithAutoId.includes(tableName)

    if (isAutoIdTable && convertedData.id) {
      const isDbGeneratedId = /^\d+$/.test(String(convertedData.id))
      if (!isDbGeneratedId) {
        console.log(`[Supabase] 自增ID表 ${tableName}，剥离前端生成的id: ${convertedData.id}`)
        delete convertedData.id
      }
    } else if (convertedData.id && !uuidPattern.test(convertedData.id) && !preserveId) {
      console.log(`[Supabase] 剥离非UUID格式的本地ID: ${convertedData.id}`)
      delete convertedData.id
    }
    console.log(`[Supabase] 同步表 ${tableName}, 待提交字段:`, Object.keys(convertedData))
    console.log(`[Supabase] 待提交数据:`, JSON.stringify(convertedData))
    console.log(`[Supabase] id字段状态:`, convertedData.id ? `存在 (值: ${convertedData.id})` : '不存在')
    console.log(`[Supabase] preserveId:`, preserveId)

    let result
    if (!convertedData.id) {
      console.log(`[Supabase] 使用 INSERT (无id)`)
      result = await client
        .from(tableName)
        .insert(convertedData)
        .select()
    } else {
      console.log(`[Supabase] 使用 UPSERT (有id: ${convertedData.id})`)
      result = await client
        .from(tableName)
        .upsert(convertedData, { onConflict: 'id' })
        .select()
    }

    const { data: resultData, error } = result

    if (error) {
      console.error('[Supabase] 原始错误:', error)
      console.error('[Supabase] 错误代码:', error.code)
      console.error('[Supabase] 错误消息:', error.message)
      console.error('[Supabase] 详细错误:', error.details)
      const classified = classifySupabaseError(error)
      console.error('[Supabase] 分类错误:', classified.message)
      return {
        success: false,
        error: classified.message,
        errorType: classified.type,
        rawError: error.message
      }
    }

    const returnedId = resultData && resultData.length > 0 ? (resultData[0].id || resultData[0].delivery_id) : null
    return { success: true, id: returnedId, data: resultData }
  } catch (err) {
    console.error('[Supabase] 异常:', err.message)
    const classified = classifySupabaseError(err)
    return { 
      success: false, 
      error: classified.message,
      errorType: classified.type,
      rawError: err.message
    }
  }
}

function classifySupabaseError(error) {
  if (!error) return { type: 'unknown', message: '' }
  const msg = error.message || String(error)
  
  if (msg.includes('does not exist') || msg.includes('relation') || msg.includes('42P01')) {
    if (msg.includes('column')) {
      const colMatch = msg.match(/column\s+"([^"]+)"/i)
      const colName = colMatch ? colMatch[1] : '未知'
      return { type: 'field_error', message: `字段 "${colName}" 不存在于数据库表中，请检查字段名` }
    }
    return { type: 'table_missing', message: '数据表不存在，请在 Supabase 创建对应表' }
  }
  if (msg.includes('permission') || msg.includes('policy') || msg.includes('42501') || msg.includes('violates')) {
    return { type: 'permission', message: '权限不足，请检查 RLS 策略或登录状态' }
  }
  if (msg.includes('auth') || msg.includes('token') || msg.includes('jwt')) {
    return { type: 'auth', message: '认证失败，请重新登录' }
  }
  return { type: 'other', message: msg }
}

export async function fetchFromSupabase(tableName, options = {}) {
  const { page = 1, pageSize = 50 } = options
  const client = await getSupabase()
  if (!client) {
    console.log('Supabase not configured, skipping fetch')
    return { success: false, data: [], error: 'Supabase not configured', errorType: 'config' }
  }
  
  try {
    const from = (page - 1) * pageSize
    const { data, error, count } = await client
      .from(tableName)
      .select('*', { count: 'exact' })
      .range(from, from + pageSize - 1)
      .order('created_at', { ascending: false })
    
    if (error) {
      const classified = classifySupabaseError(error)
      console.error('Supabase fetch error:', classified.message)
      return { 
        success: false, 
        data: [], 
        error: classified.message,
        errorType: classified.type 
      }
    }
    
    const convertedData = convertDataFromSupabase(data || [], tableName)
    return { 
      success: true, 
      data: convertedData,
      pagination: { page, pageSize, total: count || 0 }
    }
  } catch (err) {
    const classified = classifySupabaseError(err)
    console.error('Supabase fetch exception:', classified.message)
    return { 
      success: false, 
      data: [], 
      error: classified.message,
      errorType: classified.type 
    }
  }
}

export async function deleteFromSupabase(tableName, id) {
  const client = await getSupabase()
  if (!client) {
    console.log('Supabase not configured, skipping delete')
    return { success: false, error: 'Supabase not configured' }
  }
  
  try {
    const { error } = await client
      .from(tableName)
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Supabase delete error:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (err) {
    console.error('Supabase delete exception:', err)
    return { success: false, error: err.message }
  }
}

export const REQUIRED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]

export async function createSupabaseBucket(bucketName) {
  const client = await getSupabase()
  if (!client) {
    return { success: false, error: 'Supabase not configured' }
  }
  
  try {
    const { error } = await client.storage.createBucket(bucketName, {
      public: false,
      allowedMimeTypes: REQUIRED_MIME_TYPES,
      maxFileSize: 5 * 1024 * 1024
    })
    
    if (error) {
      console.error('Supabase create bucket error:', error)
      return { success: false, error: error.message }
    }
    
    const { error: policyError } = await client.storage.setBucketPolicy(bucketName, {
      permissions: [
        { action: 'insert', resource: 'objects/*', constraints: [] },
        { action: 'update', resource: 'objects/*', constraints: [] },
        { action: 'delete', resource: 'objects/*', constraints: [] },
        { action: 'select', resource: 'objects/*', constraints: [] }
      ]
    })
    
    if (policyError) {
      console.warn('Supabase set bucket policy warning:', policyError)
    }
    
    return { success: true, message: '存储桶创建成功' }
  } catch (err) {
    console.error('Supabase create bucket exception:', err)
    return { success: false, error: err.message }
  }
}

export async function getBucketConfig(bucketName) {
  const client = await getSupabase()
  if (!client) {
    return { success: false, error: 'Supabase not configured' }
  }
  
  try {
    const { data, error } = await client.storage.getBucket(bucketName)
    if (error) {
      console.error('Supabase get bucket config error:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, data }
  } catch (err) {
    console.error('Supabase get bucket config exception:', err)
    return { success: false, error: err.message }
  }
}

export async function updateBucketConfig(bucketName, config) {
  const client = await getSupabase()
  if (!client) {
    return { success: false, error: 'Supabase not configured' }
  }
  
  try {
    const { error } = await client.storage.updateBucket(bucketName, config)
    if (error) {
      console.error('Supabase update bucket config error:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, message: '存储桶配置更新成功' }
  } catch (err) {
    console.error('Supabase update bucket config exception:', err)
    return { success: false, error: err.message }
  }
}

export async function syncBucketMimeTypes(bucketName) {
  console.log('[Supabase] 开始同步存储桶 MIME 配置...')
  
  const bucketResult = await getBucketConfig(bucketName)
  if (!bucketResult.success) {
    console.warn('[Supabase] 获取桶配置失败:', bucketResult.error)
    return { success: false, error: bucketResult.error }
  }
  
  const currentMimeTypes = bucketResult.data.allowed_mime_types || []
  console.log('[Supabase] 当前桶允许的 MIME 类型:', currentMimeTypes)
  
  const missingTypes = REQUIRED_MIME_TYPES.filter(type => !currentMimeTypes.includes(type))
  
  if (missingTypes.length === 0) {
    console.log('[Supabase] ✅ 存储桶 MIME 配置已完整，无需同步')
    return { success: true, message: '存储桶 MIME 配置已完整' }
  }
  
  console.log('[Supabase] 发现缺失的 MIME 类型:', missingTypes)
  
  const newMimeTypes = [...new Set([...currentMimeTypes, ...REQUIRED_MIME_TYPES])]
  
  const updateResult = await updateBucketConfig(bucketName, {
    allowedMimeTypes: newMimeTypes,
    maxFileSize: 5 * 1024 * 1024
  })
  
  if (updateResult.success) {
    console.log('[Supabase] ✅ 存储桶 MIME 配置同步成功，新增类型:', missingTypes)
    return { success: true, message: `存储桶 MIME 配置同步成功，新增 ${missingTypes.length} 个类型` }
  } else {
    console.error('[Supabase] ❌ 存储桶 MIME 配置同步失败:', updateResult.error)
    return updateResult
  }
}

export async function uploadFileToSupabase(moduleType, moduleId, moduleName, file) {
  try {
    const client = await getSupabase()
    if (!client) {
      return { success: false, error: 'Supabase not configured' }
    }

    if (!file || typeof file !== 'object') {
      return { success: false, error: '文件对象无效', errorType: 'invalid_file' }
    }

    if (!file.name || typeof file.name !== 'string') {
      return { success: false, error: '文件名无效', errorType: 'invalid_file_name' }
    }

    const bucketName = getSupabaseBucket()
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.oasis.opendocument.spreadsheet',
      'application/vnd.oasis.opendocument.text'
    ]
    const allowedExtensions = ['.doc', '.docx', '.pdf', '.jpg', '.jpeg', '.png', '.xls', '.xlsx']
    const maxSize = 5 * 1024 * 1024

    const fileName = file.name || ''
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    const isValidType = allowedTypes.includes(file.type)
    const isValidExtension = allowedExtensions.includes(ext)

    console.log('[Upload] 开始上传文件:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      isValidType,
      isValidExtension,
      allowedTypes: REQUIRED_MIME_TYPES,
      bucketName
    })

    if (!isValidType && !isValidExtension) {
      console.error('[Upload] ❌ 文件格式不支持:', { fileType: file.type, ext })
      return { success: false, error: '文件格式不支持，请上传doc/docx/pdf/jpg/png/xls/xlsx格式文件' }
    }

    if (file.size > maxSize) {
      console.error('[Upload] ❌ 文件大小超过限制:', { fileSize: file.size, maxSize })
      return { success: false, error: '文件大小超过5MB限制' }
    }

    const originalName = file.name
    const cleanModuleId = sanitizePathSegment(moduleId)
    const cleanModuleName = moduleName ? sanitizePathSegment(moduleName) : ''

    const { storageFileName: cleanedFileName, needsMinimal: initiallyMinimal } = cleanAndValidateFileName(file.name)
    let storageFileName = cleanedFileName
    let needsMinimal = initiallyMinimal

    function buildFilePath(fileName, includeModuleName = true) {
      const targetModuleName = includeModuleName ? cleanModuleName : ''

      if (moduleType === 'customer') {
        return `customers/${cleanModuleId}/attachments/${fileName}`
      } else if (moduleType === 'task') {
        const taskPath = includeModuleName && targetModuleName
          ? `tasks/${cleanModuleId}_${targetModuleName}/attachments/${fileName}`
          : `tasks/${cleanModuleId}/attachments/${fileName}`
        return taskPath
      } else if (moduleType === 'product') {
        const productPath = includeModuleName && targetModuleName
          ? `products/${cleanModuleId}_${targetModuleName}/materials/${fileName}`
          : `products/${cleanModuleId}/materials/${fileName}`
        return productPath
      } else if (moduleType === 'lead_import') {
        const today = new Date().toISOString().split('T')[0]
        const fileExt = file.name.split('.').pop().toLowerCase()
        return `lead_import/${today}/${fileExt}/${fileName}`
      } else if (moduleType === 'dashboard') {
        const dashboardPath = includeModuleName && targetModuleName
          ? `dashboard/${cleanModuleId}_${targetModuleName}/attachments/${fileName}`
          : `dashboard/${cleanModuleId}/attachments/${fileName}`
        return dashboardPath
      } else {
        return `${moduleType}/${cleanModuleId}/attachments/${fileName}`
      }
    }

    let filePath = buildFilePath(storageFileName, true)

    if (isPathTooLong(filePath)) {
      filePath = buildFilePath(storageFileName, false)
    }

    if (isPathTooLong(filePath)) {
      storageFileName = generateMinimalFileName(file.name)
      needsMinimal = true
      filePath = buildFilePath(storageFileName, false)
    }

    if (isPathTooLong(filePath)) {
      console.error('[Upload] ❌ 文件路径过长:', { filePath, length: filePath.length })
      return {
        success: false,
        error: '文件路径过长，请简化文件名后重试',
        errorType: 'path_too_long'
      }
    }

    console.log('[Upload] 查询目标目录是否存在同名文件...')
    const directoryPath = filePath.substring(0, filePath.lastIndexOf('/'))
    const existingFiles = []
    try {
      const { data: listedFiles } = await client.storage.from(bucketName).list(directoryPath)
      if (listedFiles && Array.isArray(listedFiles)) {
        existingFiles.push(...listedFiles)
      }
    } catch (listErr) {
      console.warn('[Upload] 列出目录文件失败（目录可能不存在）:', listErr.message)
    }

    const existingFileNames = existingFiles.map(f => f.name)
    console.log('[Upload] 目录已存在文件:', existingFileNames)

    if (existingFileNames.includes(storageFileName)) {
      const timestamp = Date.now().toString(36)
      const nameWithoutExt = storageFileName.substring(0, storageFileName.lastIndexOf('.'))
      storageFileName = `${nameWithoutExt}_${timestamp}${ext}`
      filePath = buildFilePath(storageFileName, isPathTooLong(buildFilePath(storageFileName, true)) ? false : true)
      console.log('[Upload] ⚠️ 检测到同名文件，自动追加时间戳:', { oldName: cleanedFileName, newName: storageFileName })
    }

    console.log('[Upload] 开始上传到路径:', filePath)

    const { data, error } = await client.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('[Upload] ❌ 上传失败:', { error: error.message, errorCode: error.code })

      if (error.message.includes('Invalid key')) {
        const fallbackFileName = generateMinimalFileName(file.name)
        const fallbackPath = buildFilePath(fallbackFileName, false)

        console.log('[Upload] 尝试使用极简文件名重试:', fallbackFileName)

        const { data: fallbackData, error: fallbackError } = await client.storage
          .from(bucketName)
          .upload(fallbackPath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (fallbackError) {
          console.error('[Upload] ❌ 极简文件名上传仍失败:', fallbackError.message)
          return {
            success: false,
            error: '文件名包含空格、&、中文等特殊字符，系统将自动清洗，或手动修改文件名后重试',
            errorType: 'invalid_chars'
          }
        }

        console.log('[Upload] ✅ 极简文件名上传成功:', fallbackData.path)
        return {
          success: true,
          data: { path: fallbackData.path, name: file.name, size: file.size, type: file.type },
          minimalFileName: fallbackFileName,
          originalName: originalName,
          wasMinimal: true
        }
      }

      return {
        success: false,
        error: error.message,
        errorType: 'upload_failed'
      }
    }

    console.log('[Upload] ✅ 上传成功:', { path: data.path, name: file.name })
    return {
      success: true,
      data: { path: data.path, name: file.name, size: file.size, type: file.type },
      minimalFileName: storageFileName,
      originalName: originalName,
      wasMinimal: needsMinimal
    }
  } catch (err) {
    console.error('[Upload] ❌ 上传异常:', err)
    return {
      success: false,
      error: '文件处理异常，请刷新页面重试',
      errorType: 'js_exception'
    }
  }
}

export async function getFileUrlFromSupabase(filePath) {
  const client = await getSupabase()
  if (!client) {
    return { success: false, error: 'Supabase not configured' }
  }
  
  const bucketName = getSupabaseBucket()
  
  try {
    const { data, error } = await client.storage
      .from(bucketName)
      .createSignedUrl(filePath, 3600)
    
    if (error) {
      console.error('Supabase get url error:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, url: data.signedUrl }
  } catch (err) {
    console.error('Supabase get url exception:', err)
    return { success: false, error: err.message }
  }
}

export async function deleteFileFromSupabase(filePath) {
  const client = await getSupabase()
  if (!client) {
    return { success: false, error: 'Supabase not configured' }
  }
  
  const bucketName = getSupabaseBucket()
  
  try {
    const { error } = await client.storage
      .from(bucketName)
      .remove([filePath])
    
    if (error) {
      console.error('Supabase delete file error:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (err) {
    console.error('Supabase delete file exception:', err)
    return { success: false, error: err.message }
  }
}

export async function listFilesFromSupabase(customerId) {
  const client = await getSupabase()
  if (!client) {
    return { success: false, error: 'Supabase not configured', data: [] }
  }
  
  const bucketName = getSupabaseBucket()
  const cleanId = sanitizePathSegment(customerId)
  
  try {
    const { data, error } = await client.storage
      .from(bucketName)
      .list(`customers/${cleanId}`)
    
    if (error) {
      console.error('Supabase list files error:', error)
      return { success: false, error: error.message, data: [] }
    }
    
    return { success: true, data: data || [] }
  } catch (err) {
    console.error('Supabase list files exception:', err)
    return { success: false, error: err.message, data: [] }
  }
}

export async function updatePassword(oldPassword, newPassword) {
  const client = await getSupabase()
  if (!client) {
    return { success: false, error: 'Supabase未配置' }
  }
  
  try {
    const { data: { user } } = await client.auth.getUser()
    if (!user) {
      return { success: false, error: '未登录' }
    }
    
    const { error: signInError } = await client.auth.signInWithPassword({
      email: user.email,
      password: oldPassword
    })
    
    if (signInError) {
      return { success: false, error: '旧密码错误' }
    }
    
    const { error } = await client.auth.updateUser({
      password: newPassword
    })
    
    if (error) {
      console.error('[Supabase] 更新密码错误:', error.message)
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (err) {
    console.error('[Supabase] 更新密码异常:', err.message)
    return { success: false, error: err.message }
  }
}

export async function createAccount(email, password, displayName, position) {
  const client = await getSupabase()
  if (!client) {
    return { success: false, error: 'Supabase未配置' }
  }
  
  try {
    const { data, error } = await client.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        position: position || '销售助理'
      }
    })
    
    if (error) {
      console.error('[Supabase] 创建账号错误:', error.message)
      return { success: false, error: error.message }
    }
    
    return { success: true, user: data.user }
  } catch (err) {
    console.error('[Supabase] 创建账号异常:', err.message)
    return { success: false, error: err.message }
  }
}

export async function listAccounts() {
  const client = await getSupabase()
  if (!client) {
    return { success: false, error: 'Supabase未配置', data: [] }
  }
  
  try {
    const { data, error } = await client.auth.admin.listUsers()
    
    if (error) {
      console.error('[Supabase] 列出账号错误:', error.message)
      return { success: false, error: error.message, data: [] }
    }
    
    return { success: true, users: data.users }
  } catch (err) {
    console.error('[Supabase] 列出账号异常:', err.message)
    return { success: false, error: err.message, data: [] }
  }
}

export async function updateAccount(userId, updates) {
  const client = await getSupabase()
  if (!client) {
    return { success: false, error: 'Supabase未配置' }
  }
  
  try {
    const { data, error } = await client.auth.admin.updateUserById(userId, updates)
    
    if (error) {
      console.error('[Supabase] 更新账号错误:', error.message)
      return { success: false, error: error.message }
    }
    
    return { success: true, user: data.user }
  } catch (err) {
    console.error('[Supabase] 更新账号异常:', err.message)
    return { success: false, error: err.message }
  }
}

export async function deleteAccount(userId) {
  const client = await getSupabase()
  if (!client) {
    return { success: false, error: 'Supabase未配置' }
  }
  
  try {
    const { error } = await client.auth.admin.deleteUser(userId)
    
    if (error) {
      console.error('[Supabase] 删除账号错误:', error.message)
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (err) {
    console.error('[Supabase] 删除账号异常:', err.message)
    return { success: false, error: err.message }
  }
}

export async function resetOtherUserPassword(userId, newPassword) {
  const client = await getSupabase()
  if (!client) {
    return { success: false, error: 'Supabase未配置' }
  }
  
  try {
    const { error } = await client.auth.admin.updateUserById(userId, {
      password: newPassword
    })
    
    if (error) {
      console.error('[Supabase] 重置密码错误:', error.message)
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (err) {
    console.error('[Supabase] 重置密码异常:', err.message)
    return { success: false, error: err.message }
  }
}

export function getLocalModeStatus() {
  return getLocalMode()
}

export function logRequestDestination(module, isCloud) {
  const mode = getLocalModeStatus()
  console.log(`[${module}] 本地模式开关: ${mode ? '开启' : '关闭'} | 本次请求去向: ${isCloud ? '云端' : '本地'}`)
}