import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import { syncBucketMimeTypes, getSupabaseBucket } from './supabase.js'

const app = createApp(App)

app.config.errorHandler = (err, instance, info) => {
  console.error('Global Vue Error:', err)
  console.error('Component:', instance)
  console.error('Error Info:', info)
  alert(`页面加载异常：${err.message}\n\n请按F12查看控制台获取详细错误信息`)
}

app.config.warnHandler = (msg, instance, trace) => {
  console.warn('Global Vue Warning:', msg)
  console.warn('Component:', instance)
  console.warn('Trace:', trace)
}

window.onerror = (message, source, lineno, colno, error) => {
  console.error('Global Window Error:', {
    message,
    source,
    lineno,
    colno,
    error
  })
  return true
}

window.addEventListener('unhandledrejection', (event) => {
  console.error('Global Unhandled Rejection:', event.reason)
  event.preventDefault()
})

app.use(ElementPlus)

async function initApp() {
  console.log('[App] 应用启动，开始初始化存储桶 MIME 配置...')
  try {
    const bucketName = getSupabaseBucket()
    const syncResult = await syncBucketMimeTypes(bucketName)
    if (syncResult.success) {
      console.log('[App] ✅ 存储桶 MIME 配置初始化完成:', syncResult.message)
    } else {
      console.warn('[App] ⚠️ 存储桶 MIME 配置初始化失败:', syncResult.error)
    }
  } catch (err) {
    console.error('[App] ❌ 存储桶 MIME 配置初始化异常:', err)
  }
  
  app.mount('#app')
}

initApp()
