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
  const trimmedBucket = bucketName.trim()
  
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
  setLocalConfigValue('supabase.SUPABASE_URL', url)
  setLocalConfigValue('supabase.SUPABASE_KEY', key)
  setLocalConfigValue('supabase.BUCKET_NAME', bucketName)
  localStorage.setItem('supabase_url', url)
  localStorage.setItem('supabase_key', key)
  localStorage.setItem('supabase_bucket', bucketName)
  supabase = null
  console.log('[配置] Supabase配置已保存到本机私有配置')
}

export function getSupabaseConfig() {
  const localUrl = getLocalConfigValue('supabase.SUPABASE_URL')
  const localKey = getLocalConfigValue('supabase.SUPABASE_KEY')
  const localBucket = getLocalConfigValue('supabase.BUCKET_NAME') || 'customer_light_files'
  
  return {
    url: localUrl || localStorage.getItem('supabase_url') || import.meta.env.VITE_SUPABASE_URL || '',
    key: localKey || localStorage.getItem('supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    bucket: localBucket || localStorage.getItem('supabase_bucket') || 'customer_light_files'
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
  return getLocalConfigValue('supabase.BUCKET_NAME') || localStorage.getItem('supabase_bucket') || 'customer_light_files'
}

export function getLocalMode() {
  const mode = getLocalConfigValue('app.localMode')
  return mode === null ? true : mode
}

export function setLocalMode(mode) {
  setLocalConfigValue('app.localMode', mode)
  console.log(`[配置] 本地模式已${mode ? '开启' : '关闭'}`)
}

export async function syncToSupabase(tableName, data) {
  const client = await getSupabase()
  if (!client) {
    console.log('Supabase not configured, skipping sync')
    return { success: false, error: 'Supabase not configured' }
  }
  
  try {
    const { error } = await client
      .from(tableName)
      .upsert(data, { onConflict: 'id' })
    
    if (error) {
      console.error('Supabase sync error:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (err) {
    console.error('Supabase sync exception:', err)
    return { success: false, error: err.message }
  }
}

export async function fetchFromSupabase(tableName) {
  const client = await getSupabase()
  if (!client) {
    console.log('Supabase not configured, skipping fetch')
    return { success: false, data: [], error: 'Supabase not configured' }
  }
  
  try {
    const { data, error } = await client
      .from(tableName)
      .select('*')
    
    if (error) {
      console.error('Supabase fetch error:', error)
      return { success: false, data: [], error: error.message }
    }
    
    return { success: true, data }
  } catch (err) {
    console.error('Supabase fetch exception:', err)
    return { success: false, data: [], error: err.message }
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