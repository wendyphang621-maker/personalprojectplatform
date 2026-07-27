<template>
  <div class="file-uploader">
    <div class="upload-area" @click="triggerUpload" @dragover.prevent @drop="handleDrop">
      <div class="upload-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </div>
      <div class="upload-text">
        <span class="main-text">{{ title || '点击或拖拽上传文件' }}</span>
        <span class="sub-text">支持 .doc/.docx/.pdf/.jpg/.png/.xls/.xlsx 文件，单文件不超过5MB</span>
      </div>
    </div>
    
    <input 
      ref="fileInput"
      type="file" 
      :accept="accept"
      multiple
      style="display: none"
      @change="handleFileChange"
    />
    
    <div v-if="files.length > 0" class="file-list">
      <div 
        v-for="(file, index) in files" 
        :key="index"
        class="file-item"
        :class="{ uploading: file.status === 'uploading', success: file.status === 'success', error: file.status === 'error', stuck: file.status === 'stuck' }"
      >
        <div class="file-icon">
          <svg v-if="isImage(file.name)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <svg v-else-if="isPdf(file.name)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div class="file-info">
          <span class="file-name">{{ file.name }}</span>
          <span class="file-size">{{ formatSize(file.size) }}</span>
        </div>
        <div class="preview-action">
          <el-button 
            v-if="file.status === 'success' && file.path" 
            size="small" 
            :icon="ZoomIn" 
            @click.stop="previewFile(file)"
            title="预览"
            class="preview-action-btn"
          />
          <el-button 
            v-if="file.status === 'success' && file.path" 
            size="small" 
            :icon="Download" 
            @click.stop="downloadFile(file)"
            title="下载"
          />
        </div>
        <div class="file-status">
          <el-progress 
            v-if="file.status === 'uploading' || file.status === 'stuck'" 
            :percentage="file.progress" 
            :stroke-width="12"
            style="width: 60px"
          />
          <el-icon v-else-if="file.status === 'success'" color="#67C23A"><CircleCheck /></el-icon>
          <el-icon v-else-if="file.status === 'error'" color="#F56C6C"><CircleClose /></el-icon>
        </div>
        <div class="file-actions">
          <el-button 
            v-if="file.status === 'error' || file.status === 'stuck'" 
            size="small" 
            :icon="Refresh" 
            type="warning" 
            @click.stop="retryUpload(index)"
            title="重新上传"
          />
          <el-button 
            size="small" 
            :icon="Delete" 
            type="danger" 
            @click.stop="removeFile(index)"
            title="删除"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { CircleCheck, CircleClose, ZoomIn, Download, Delete, Refresh } from '@element-plus/icons-vue'
import { uploadFileToSupabase, getFileUrlFromSupabase, syncBucketMimeTypes, getSupabaseBucket } from '../supabase.js'

const props = defineProps({
  moduleType: {
    type: String,
    required: true
  },
  moduleId: {
    type: String,
    required: true
  },
  moduleName: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  },
  accept: {
    type: String,
    default: '.doc,.docx,.pdf,.jpg,.jpeg,.png,.xls,.xlsx'
  },
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'upload-success', 'upload-error'])

const fileInput = ref(null)
const files = ref([...props.modelValue])

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    files.value = [...newVal]
  }
}, { deep: true })

onMounted(async () => {
  console.log('[FileUploader] 组件初始化，开始同步存储桶 MIME 配置...')
  try {
    const bucketName = getSupabaseBucket()
    const syncResult = await syncBucketMimeTypes(bucketName)
    if (syncResult.success) {
      console.log('[FileUploader] ✅ 存储桶 MIME 配置同步完成:', syncResult.message)
    } else {
      console.warn('[FileUploader] ⚠️ 存储桶 MIME 配置同步失败:', syncResult.error)
    }
  } catch (err) {
    console.error('[FileUploader] ❌ 存储桶 MIME 配置同步异常:', err)
  }
})

function triggerUpload() {
  fileInput.value?.click()
}

function handleDrop(event) {
  event.preventDefault()
  const droppedFiles = Array.from(event.dataTransfer.files)
  processFiles(droppedFiles)
}

function handleFileChange(event) {
  const selectedFiles = Array.from(event.target.files)
  processFiles(selectedFiles)
  event.target.value = ''
}

function processFiles(fileList) {
  try {
    if (!fileList || !Array.isArray(fileList)) {
      alert('文件列表无效，请重新选择文件')
      return
    }
    
    for (const file of fileList) {
      if (!file || typeof file !== 'object') {
        continue
      }
      
      if (!validateFile(file)) continue
      
      const fileItem = {
        name: file.name || 'unknown',
        size: file.size || 0,
        type: file.type || '',
        status: 'pending',
        progress: 0,
        url: '',
        path: '',
        originalFile: file
      }
      
      files.value.push(fileItem)
      uploadFile(fileItem)
    }
  } catch (err) {
    console.error('FileUploader processFiles exception:', err)
    alert('文件处理异常，请刷新页面重试')
  }
}

function validateFile(file) {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
  const allowedExtensions = ['.doc', '.docx', '.pdf', '.jpg', '.jpeg', '.png', '.xls', '.xlsx']
  const maxSize = 5 * 1024 * 1024
  
  const fileName = file.name || ''
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
  
  const isValidType = allowedTypes.includes(file.type)
  const isValidExtension = allowedExtensions.includes(ext)
  
  if (!isValidType && !isValidExtension) {
    alert('文件格式不支持，请上传doc/docx/pdf/jpg/png/xls/xlsx')
    return false
  }
  
  if (file.size > maxSize) {
    alert('文件大小超过5MB限制')
    return false
  }
  
  return true
}

async function uploadFile(fileItem) {
  fileItem.status = 'uploading'
  fileItem.progress = 0
  
  const progressInterval = setInterval(() => {
    if (fileItem.status === 'uploading') {
      if (fileItem.progress < 95) {
        fileItem.progress += Math.random() * 10
        if (fileItem.progress > 95) fileItem.progress = 95
      }
    }
  }, 150)
  
  let lastProgress = -1
  let stuckTimer = null
  
  const stuckCheckInterval = setInterval(() => {
    if (fileItem.status === 'uploading') {
      if (fileItem.progress === lastProgress && fileItem.progress > 0) {
        if (!stuckTimer) {
          stuckTimer = setTimeout(() => {
            if (fileItem.status === 'uploading') {
              fileItem.status = 'stuck'
              clearInterval(progressInterval)
              clearInterval(stuckCheckInterval)
            }
          }, 5000)
        }
      } else {
        lastProgress = fileItem.progress
        if (stuckTimer) {
          clearTimeout(stuckTimer)
          stuckTimer = null
        }
      }
    }
  }, 1000)
  
  try {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const result = await uploadFileToSupabase(
      props.moduleType,
      props.moduleId,
      props.moduleName,
      fileItem.originalFile
    )
    
    clearInterval(progressInterval)
    clearInterval(stuckCheckInterval)
    if (stuckTimer) clearTimeout(stuckTimer)
    
    if (result.success) {
      fileItem.status = 'success'
      fileItem.progress = 100
      fileItem.url = result.data.path
      fileItem.path = result.data.path
      
      if (result.wasMinimal) {
        alert(`✅ 文件上传成功！\n\n注意：原文件名包含中文或特殊字符，系统已自动生成极简文件名。\n原文件名：${result.originalName}\n存储文件名：${result.minimalFileName}`)
      }
      
      emit('update:modelValue', files.value)
      emit('upload-success', fileItem)
    } else {
      throw result
    }
  } catch (error) {
    clearInterval(progressInterval)
    clearInterval(stuckCheckInterval)
    if (stuckTimer) clearTimeout(stuckTimer)
    
    if (fileItem.status === 'stuck') {
      return
    }
    
    fileItem.status = 'error'
    fileItem.progress = 0
    
    let errorMsg = error.error || error.message || '上传失败'
    const errorType = error.errorType || ''
    
    if (errorType === 'js_exception') {
      errorMsg = '文件处理异常，请刷新页面重试'
    } else if (errorType === 'path_too_long') {
      errorMsg = '文件路径过长，请简化文件名后重试'
    } else if (errorType === 'invalid_chars') {
      errorMsg = '文件名包含空格、&、中文等特殊字符，系统将自动清洗，或手动修改文件名后重试'
    } else if (errorType === 'invalid_file') {
      errorMsg = '文件对象无效，请重新选择文件'
    } else if (errorType === 'invalid_file_name') {
      errorMsg = '文件名无效，请重新选择文件'
    } else if (errorMsg.includes('not configured')) {
      errorMsg = '配置缺失：请先前往「设置」页面完成 Supabase 存储配置'
    } else if (errorMsg.includes('Bucket not found')) {
      errorMsg = '存储桶不存在：请前往「设置」页面，在存储桶配置区域点击「创建存储桶」按钮'
    } else if (errorMsg.includes('policy') || errorMsg.includes('permission')) {
      errorMsg = '权限异常：存储桶权限策略配置不正确，请检查 RLS 权限设置'
    } else if (errorMsg.includes('Invalid key')) {
      errorMsg = '文件名包含空格、&、中文等特殊字符，系统将自动清洗，或手动修改文件名后重试'
    } else if (errorMsg.includes('internal')) {
      errorMsg = '服务器内部错误，请稍后重试'
    } else if (errorMsg.includes('Network') || errorMsg.includes('network') || errorMsg.includes('timeout')) {
      errorMsg = '网络连接异常，请检查网络后重试'
    }
    
    emit('upload-error', { file: fileItem, error: errorMsg, errorType })
    alert(errorMsg)
  }
}

function retryUpload(index) {
  try {
    const fileItem = files.value[index]
    if (fileItem && fileItem.originalFile) {
      uploadFile(fileItem)
    }
  } catch (e) {
    console.error('Retry upload error:', e)
    alert('重新上传失败，请刷新页面重试')
  }
}

function removeFile(index) {
  try {
    if (index < 0 || index >= files.value.length) {
      return
    }
    files.value.splice(index, 1)
    emit('update:modelValue', files.value)
  } catch (e) {
    console.error('Remove file error:', e)
    alert('删除文件失败，请刷新页面重试')
  }
}

function toggleSelectFile(index) {
  try {
    if (files.value[index]) {
      files.value[index].selected = !files.value[index].selected
    }
  } catch (e) {
    console.error('Toggle select error:', e)
  }
}

async function previewFile(file) {
  try {
    if (!file || !file.path) {
      alert('文件路径无效，无法预览')
      return
    }
    
    const result = await getFileUrlFromSupabase(file.path)
    if (result.success && result.url) {
      const url = result.url
      if (isImage(file.name)) {
        window.open(url, '_blank')
      } else if (isPdf(file.name)) {
        window.open(url, '_blank')
      } else if (isDoc(file.name) || isExcel(file.name)) {
        window.open(url, '_blank')
      } else {
        window.open(url, '_blank')
      }
    } else {
      alert('文件预览失败，请下载后查看')
    }
  } catch (e) {
    console.error('Preview error:', e)
    alert('文件预览失败，请下载后查看')
  }
}

function isDoc(fileName) {
  return /\.(doc|docx)$/i.test(fileName)
}

function isExcel(fileName) {
  return /\.(xls|xlsx)$/i.test(fileName)
}

async function downloadFile(file) {
  try {
    if (!file || !file.path) {
      alert('文件路径无效，无法下载')
      return
    }
    
    const result = await getFileUrlFromSupabase(file.path)
    if (result.success && result.url) {
      const a = document.createElement('a')
      a.href = result.url
      a.download = file.name
      a.click()
    } else {
      alert('获取下载链接失败')
    }
  } catch (e) {
    console.error('Download error:', e)
    alert('下载失败，请稍后重试')
  }
}

function isImage(fileName) {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)
}

function isPdf(fileName) {
  return /\.pdf$/i.test(fileName)
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
</script>

<style scoped>
.file-uploader {
  width: 100%;
}

.upload-area {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafafa;
}

.upload-area:hover {
  border-color: #409EFF;
  background: #f0f5ff;
}

.upload-area.dragover {
  border-color: #409EFF;
  background: #f0f5ff;
}

.upload-icon {
  color: #c0c4cc;
  margin-bottom: 16px;
}

.upload-area:hover .upload-icon {
  color: #409EFF;
}

.upload-text {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.main-text {
  font-size: 16px;
  font-weight: 500;
  color: #606266;
}

.sub-text {
  font-size: 12px;
  color: #909399;
}

.file-list {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  transition: all 0.3s;
}

.file-item.uploading {
  border-color: #409EFF;
}

.file-item.success {
  border-color: #67C23A;
}

.file-item.error {
  border-color: #F56C6C;
}

.file-item.stuck {
  border-color: #E6A23C;
}

.file-icon {
  color: #409EFF;
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  display: block;
  font-size: 14px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  display: block;
  font-size: 12px;
  color: #909399;
}

.file-status {
  flex-shrink: 0;
}

.preview-action {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.file-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
</style>