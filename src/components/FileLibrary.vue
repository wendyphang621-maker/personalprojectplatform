<template>
  <div class="file-library">
    <div class="library-header">
      <h2>文件资料管理</h2>
      <div class="header-actions">
        <el-input v-model="searchKeyword" placeholder="搜索文件名/运单号" clearable size="small" style="width: 200px" />
        <el-button size="small" @click="handleExportTemplate">导出模板</el-button>
        <el-button size="small" type="success" @click="openBatchImportDialog">批量导入</el-button>
        <el-button type="primary" @click="showUploadDialog = true">上传文件</el-button>
      </div>
    </div>
    
    <div class="library-body">
      <div class="folder-tree">
        <div v-for="folder in rootFolders" :key="folder.id" class="folder-item">
          <div 
            class="folder-header"
            :class="{ expanded: expandedFolders.includes(folder.id) }"
            @click="toggleFolder(folder.id)"
          >
            <svg v-if="folder.children && folder.children.length > 0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" class="expand-icon">
              <polyline points="6 9 12 15 18 9" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
            </svg>
            <span class="folder-name">{{ folder.name }}</span>
            <span class="folder-count">{{ getFolderFileCount(folder) }}</span>
          </div>
          <div v-if="expandedFolders.includes(folder.id) && folder.children" class="sub-folders">
            <div 
              v-for="sub in folder.children" 
              :key="sub.id"
              class="sub-folder-item"
              :class="{ active: currentFolder === sub.id }"
              @click.stop="selectFolder(sub.id)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              <span>{{ sub.name }}</span>
              <span class="sub-count">{{ getFolderFileCount(sub) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="file-list-panel">
        <div class="panel-header">
          <span class="current-path">{{ currentPathText }}</span>
          <div class="panel-actions">
            <el-button size="small" @click="refreshFiles">刷新</el-button>
            <el-button size="small" type="danger" @click="deleteSelectedFiles" :disabled="selectedFiles.length === 0">删除选中</el-button>
          </div>
        </div>
        
        <div class="file-grid" v-if="filteredFiles.length > 0">
          <div 
            v-for="file in filteredFiles" 
            :key="file.id"
            class="file-card"
            :class="{ selected: selectedFiles.includes(file.id) }"
            @click="toggleSelectFile(file.id)"
            @dblclick="previewFile(file)"
          >
            <div class="file-icon">
              <svg v-if="file.type === 'image'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <svg v-else-if="file.type === 'pdf'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48" style="color: #F56C6C">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              <svg v-else-if="file.type === 'excel'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48" style="color: #52c41a">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <line x1="10" y1="9" x2="8" y2="9"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48" style="color: #909399">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
            </div>
            <div class="file-info">
              <span class="file-name">{{ file.name }}</span>
              <span class="file-meta">{{ formatSize(file.size) }} · {{ file.uploadDate }}</span>
              <span v-if="file.expiryDate" class="file-expiry" :class="getExpiryClass(file.expiryDate)">
                到期: {{ file.expiryDate }}
              </span>
              <span v-if="file.remark" class="file-remark" :title="file.remark">{{ file.remark }}</span>
            </div>
            <input type="checkbox" v-model="selectedFiles" :value="file.id" class="file-checkbox" />
          </div>
        </div>
        
        <div v-else class="empty-files">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          <p>当前文件夹暂无文件</p>
        </div>
      </div>
    </div>
    
    <el-dialog v-model="showUploadDialog" title="上传文件" width="500px">
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="目标文件夹">
          <el-select v-model="uploadForm.folder" placeholder="请选择文件夹" required>
            <el-option v-for="folder in allFolders" :key="folder.id" :label="folder.fullPath" :value="folder.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="文件">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :on-change="handleFileChange"
            :file-list="uploadFiles"
            multiple
            accept="image/*,.pdf,.xls,.xlsx,.doc,.docx"
            action=""
          >
            <el-button size="small" type="primary">选择文件</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="证书到期时间" v-if="uploadForm.folder && uploadForm.folder.startsWith('cert_')">
          <el-date-picker v-model="uploadForm.expiryDate" type="date" />
        </el-form-item>
        <el-form-item label="运单号" v-if="uploadForm.folder === 'logistics'">
          <el-input v-model="uploadForm.logisticsNo" placeholder="顺丰运单号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelUpload">取消</el-button>
        <el-button type="primary" @click="confirmUpload" :disabled="uploadFiles.length === 0">上传</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showPreviewDialog" title="文件预览" width="700px">
      <div class="preview-content">
        <img v-if="previewFileData && previewFileData.type === 'image'" :src="previewFileData.url" class="preview-image" />
        <div v-else class="preview-placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="64" height="64">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          <p>{{ previewFileData?.name || '无法预览此文件' }}</p>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="showBatchImportDialog" title="批量导入文件项" width="860px" top="5vh">
      <div class="batch-import-body">
        <div class="batch-import-tips">
          <span>请先点击「导出模板」下载模板，按格式填写后上传。仅导入文件元数据（文件名/文件夹/到期日等），实际文件可后续上传补充。</span>
        </div>
        <el-upload
          ref="batchUploadRef"
          :auto-upload="false"
          :on-change="handleBatchFileChange"
          :on-remove="handleBatchFileRemove"
          :file-list="batchFileList"
          :limit="1"
          accept=".xls,.xlsx"
          action=""
          drag
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">将 Excel 文件拖到此处，或<em>点击选择</em></div>
          <template #tip>
            <div class="el-upload__tip">仅支持 .xls / .xlsx，表头须在第2行，数据从第3行开始</div>
          </template>
        </el-upload>

        <div v-if="batchImportResult" class="batch-import-summary">
          <el-tag type="success">有效 {{ batchImportResult.data.length }} 条</el-tag>
          <el-tag v-if="batchImportResult.errors.length" type="danger">无效 {{ batchImportResult.errors.length }} 条</el-tag>
          <el-tag type="info">共解析 {{ batchImportResult.totalRows }} 行</el-tag>
        </div>

        <el-table v-if="batchImportResult && batchImportResult.data.length" :data="batchImportResult.data" max-height="360" size="small" border style="margin-top: 10px">
          <el-table-column type="index" label="#" width="44" />
          <el-table-column prop="name" label="文件名" min-width="160" show-overflow-tooltip />
          <el-table-column prop="folderPath" label="目标文件夹" min-width="140" show-overflow-tooltip />
          <el-table-column prop="type" label="类型" width="80" />
          <el-table-column prop="expiryDate" label="到期时间" width="110" />
          <el-table-column prop="logisticsNo" label="运单号" width="120" show-overflow-tooltip />
          <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
        </el-table>

        <div v-if="batchImportResult && batchImportResult.errors.length" class="batch-import-errors">
          <div v-for="(err, i) in batchImportResult.errors" :key="i" class="error-line">第 {{ err.row }} 行：{{ err.error }}</div>
        </div>
      </div>
      <template #footer>
        <el-button @click="cancelBatchImport">取消</el-button>
        <el-button type="primary" @click="confirmBatchImport" :disabled="!batchImportResult || batchImportResult.data.length === 0">确认导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { store, addFileToLibrary, deleteFileFromLibrary, generateId } from '../store.js'
import { importFromExcel } from '../utils/excelImport.js'
import { exportImportTemplate } from '../utils/excelExport.js'

const searchKeyword = ref('')
const currentFolder = ref('')
const selectedFiles = ref([])
const showUploadDialog = ref(false)
const showPreviewDialog = ref(false)
const previewFileData = ref(null)
const uploadRef = ref(null)
const uploadFiles = ref([])

const uploadForm = ref({
  folder: '',
  expiryDate: '',
  logisticsNo: ''
})

const expandedFolders = ref(store.fileLibrary.expandedFolders || [])

watch(expandedFolders, (newVal) => {
  store.fileLibrary.expandedFolders = newVal
}, { deep: true })

const rootFolders = computed(() => {
  return [
    {
      id: 'customer',
      name: '客户资料',
      children: store.customers.map(c => ({
        id: `customer_${c.id}`,
        name: c.name,
        parentId: 'customer'
      }))
    },
    {
      id: 'product',
      name: '产品素材',
      children: store.productModels.map(m => ({
        id: `product_${m.id}`,
        name: m.name,
        parentId: 'product'
      }))
    },
    {
      id: 'cert',
      name: '合规认证',
      children: [
        { id: 'cert_CE', name: 'CE', parentId: 'cert' },
        { id: 'cert_CB', name: 'CB', parentId: 'cert' },
        { id: 'cert_SASO', name: 'SASO', parentId: 'cert' }
      ]
    },
    {
      id: 'logistics',
      name: '物流单据',
      children: null
    },
    {
      id: 'quotation',
      name: '报价 & 合同',
      children: getYearMonthFolders()
    }
  ]
})

const allFolders = computed(() => {
  const folders = []
  rootFolders.value.forEach(f => {
    folders.push({ id: f.id, fullPath: f.name })
    if (f.children) {
      f.children.forEach(c => {
        folders.push({ id: c.id, fullPath: `${f.name} / ${c.name}` })
      })
    }
  })
  return folders
})

const currentPathText = computed(() => {
  if (!currentFolder.value) return '全部文件'
  const folder = findFolderById(currentFolder.value)
  return folder ? folder.fullPath : '全部文件'
})

const filteredFiles = computed(() => {
  let files = store.fileLibrary.files
  
  if (currentFolder.value) {
    files = files.filter(f => f.path === currentFolder.value)
  }
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    files = files.filter(f => 
      f.name.toLowerCase().includes(keyword) || 
      (f.logisticsNo && f.logisticsNo.includes(keyword))
    )
  }
  
  return files.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
})

function getYearMonthFolders() {
  const folders = []
  const years = ['2024', '2025']
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
  
  years.forEach(year => {
    months.forEach(month => {
      folders.push({
        id: `quotation_${year}_${month}`,
        name: `${year}年${parseInt(month)}月`,
        parentId: 'quotation'
      })
    })
  })
  
  return folders
}

function findFolderById(id) {
  for (const f of rootFolders.value) {
    if (f.id === id) return { id: f.id, fullPath: f.name }
    if (f.children) {
      const found = f.children.find(c => c.id === id)
      if (found) return { id: found.id, fullPath: `${f.name} / ${found.name}` }
    }
  }
  return null
}

function getFolderFileCount(folder) {
  if (!folder.id) return 0
  return store.fileLibrary.files.filter(f => f.path === folder.id).length
}

function toggleFolder(folderId) {
  const index = expandedFolders.value.indexOf(folderId)
  if (index > -1) {
    expandedFolders.value.splice(index, 1)
  } else {
    expandedFolders.value.push(folderId)
  }
}

function selectFolder(folderId) {
  currentFolder.value = currentFolder.value === folderId ? '' : folderId
  selectedFiles.value = []
}

function toggleSelectFile(fileId) {
  const index = selectedFiles.value.indexOf(fileId)
  if (index > -1) {
    selectedFiles.value.splice(index, 1)
  } else {
    selectedFiles.value.push(fileId)
  }
}

function deleteSelectedFiles() {
  if (!confirm(`确定要删除选中的 ${selectedFiles.value.length} 个文件吗？`)) return
  
  selectedFiles.value.forEach(fileId => {
    deleteFileFromLibrary(fileId)
  })
  selectedFiles.value = []
}

function refreshFiles() {
  selectedFiles.value = []
}

function handleFileChange(file, fileList) {
  uploadFiles.value = fileList
}

function cancelUpload() {
  showUploadDialog.value = false
  uploadFiles.value = []
  uploadForm.value = { folder: '', expiryDate: '', logisticsNo: '' }
}

async function confirmUpload() {
  for (const file of uploadFiles.value) {
    const rawFile = file.raw
    let fileData = rawFile
    let fileName = rawFile.name
    
    if (rawFile.type.startsWith('image/')) {
      fileData = await compressImage(rawFile)
    }
    
    const fileRecord = {
      id: generateId('f'),
      name: fileName,
      path: uploadForm.value.folder,
      type: getFileType(fileName),
      size: fileData.size || rawFile.size,
      uploadDate: new Date().toISOString().split('T')[0],
      expiryDate: uploadForm.value.expiryDate || '',
      logisticsNo: uploadForm.value.logisticsNo || '',
      data: fileData instanceof Blob ? await blobToBase64(fileData) : ''
    }
    
    addFileToLibrary(fileRecord)
  }
  
  cancelUpload()
}

function getFileType(fileName) {
  const ext = fileName.split('.').pop().toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image'
  if (ext === 'pdf') return 'pdf'
  if (['xls', 'xlsx'].includes(ext)) return 'excel'
  if (['doc', 'docx'].includes(ext)) return 'document'
  return 'other'
}

function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        let width = img.width
        let height = img.height
        const maxSize = 2000
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize
            width = maxSize
          } else {
            width = (width / height) * maxSize
            height = maxSize
          }
        }
        
        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob((blob) => {
          resolve(blob)
        }, file.type, 0.8)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.readAsDataURL(blob)
  })
}

function previewFile(file) {
  if (file.type === 'image' && file.data) {
    previewFileData.value = {
      name: file.name,
      type: file.type,
      url: file.data
    }
    showPreviewDialog.value = true
  }
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function getExpiryClass(expiryDate) {
  if (!expiryDate) return ''
  const expire = new Date(expiryDate)
  const now = new Date()
  const diffDays = Math.floor((expire - now) / (1000 * 60 * 60 * 24))
  
  if (diffDays <= 7) return 'expiry-danger'
  if (diffDays <= 30) return 'expiry-warning'
  return ''
}

// ========== 批量导入文件项 ==========
const batchUploadRef = ref(null)
const showBatchImportDialog = ref(false)
const batchFileList = ref([])
const batchImportResult = ref(null)

// 文件项字段映射（与导出模板列保持一致）
const fileFieldMapping = [
  { excelHeader: '文件名', dataField: 'name' },
  { excelHeader: '目标文件夹', dataField: 'folderPath' },
  { excelHeader: '文件类型', dataField: 'type' },
  { excelHeader: '证书到期时间', dataField: 'expiryDate' },
  { excelHeader: '运单号', dataField: 'logisticsNo' },
  { excelHeader: '备注', dataField: 'remark' }
]

// 导出模板
async function handleExportTemplate() {
  const columns = [
    { header: '文件名', field: 'name', width: 24, sample: 'CE证书.pdf' },
    { header: '目标文件夹', field: 'folderPath', width: 24, sample: '合规认证 / CE' },
    { header: '文件类型', field: 'type', width: 12, sample: 'pdf' },
    { header: '证书到期时间', field: 'expiryDate', width: 16, sample: '2026-12-31' },
    { header: '运单号', field: 'logisticsNo', width: 16, sample: '' },
    { header: '备注', field: 'remark', width: 20, sample: '客户A的CE认证' }
  ]
  const description = '说明：1) 目标文件夹请填写完整路径，如「合规认证 / CE」「客户资料 / 客户A」「物流单据」等；2) 文件类型可选 image/pdf/excel/document/other，留空将按文件名自动识别；3) 数据从第3行开始填写。'
  try {
    await exportImportTemplate('文件资料', columns, { includeSample: true, description })
    ElMessage.success('模板已下载')
  } catch (e) {
    ElMessage.error('模板导出失败：' + e.message)
  }
}

function openBatchImportDialog() {
  batchFileList.value = []
  batchImportResult.value = null
  showBatchImportDialog.value = true
}

async function handleBatchFileChange(file, fileList) {
  batchFileList.value = fileList.slice(-1)
  if (!file.raw) return
  await parseBatchImportFile(file.raw)
}

function handleBatchFileRemove(file, fileList) {
  batchFileList.value = fileList
  batchImportResult.value = null
}

async function parseBatchImportFile(rawFile) {
  const result = await importFromExcel(rawFile, {
    fieldMapping: fileFieldMapping,
    headerRow: 2,
    startRow: 3,
    validateRow: (rowData) => {
      if (!rowData.name) {
        return { valid: false, error: '文件名不能为空' }
      }
      return { valid: true }
    },
    transformRow: (rowData) => {
      // 文件夹路径 → 文件夹 id
      let folderPath = (rowData.folderPath || '').trim()
      let folderId = ''
      if (folderPath) {
        const match = allFolders.value.find(f => f.fullPath === folderPath || f.fullPath.replace(/\s*\/\s*/g, '/') === folderPath.replace(/\s*\/\s*/g, '/'))
        if (match) {
          folderId = match.id
        }
      }
      rowData.folderPath = folderPath || '（未指定）'
      rowData.path = folderId

      // 文件类型自动识别
      if (!rowData.type) {
        rowData.type = getFileType(rowData.name)
      }

      // 到期日期格式化
      if (rowData.expiryDate instanceof Date) {
        rowData.expiryDate = rowData.expiryDate.toISOString().split('T')[0]
      } else if (rowData.expiryDate) {
        rowData.expiryDate = String(rowData.expiryDate).trim()
      }

      return rowData
    }
  })

  if (!result.success) {
    ElMessage.warning(result.message || '解析失败')
    batchImportResult.value = null
    return
  }

  batchImportResult.value = {
    data: result.data,
    errors: result.errors || [],
    totalRows: result.totalRows
  }
}

function confirmBatchImport() {
  if (!batchImportResult.value || batchImportResult.value.data.length === 0) return
  const list = batchImportResult.value.data
  let imported = 0
  list.forEach(item => {
    addFileToLibrary({
      id: generateId('f'),
      name: item.name,
      path: item.path || '',
      type: item.type || 'other',
      size: 0,
      expiryDate: item.expiryDate || '',
      logisticsNo: item.logisticsNo || '',
      remark: item.remark || '',
      data: '',
      uploadDate: new Date().toISOString().split('T')[0]
    })
    imported++
  })
  ElMessage.success(`已批量导入 ${imported} 个文件项`)
  showBatchImportDialog.value = false
  batchFileList.value = []
  batchImportResult.value = null
}

function cancelBatchImport() {
  showBatchImportDialog.value = false
  batchFileList.value = []
  batchImportResult.value = null
}
</script>

<style>
.file-library {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.library-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  border-bottom: 1px solid #e4e7ed;
}

.library-header h2 {
  font-size: 18px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.library-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.folder-tree {
  width: 280px;
  border-right: 1px solid #e4e7ed;
  overflow-y: auto;
  padding: 10px;
}

.folder-item {
  margin-bottom: 5px;
}

.folder-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.folder-header:hover {
  background: #f5f7fa;
}

.expand-icon {
  transition: transform 0.2s;
}

.folder-header.expanded .expand-icon {
  transform: rotate(90deg);
}

.folder-name {
  flex: 1;
  font-size: 14px;
}

.folder-count {
  font-size: 12px;
  color: #909399;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 10px;
}

.sub-folders {
  padding-left: 24px;
}

.sub-folder-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  cursor: pointer;
  border-radius: 4px;
  margin-bottom: 2px;
  transition: all 0.2s;
}

.sub-folder-item:hover {
  background: #f5f7fa;
}

.sub-folder-item.active {
  background: rgba(64, 158, 255, 0.1);
  color: #409EFF;
}

.sub-count {
  font-size: 11px;
  color: #909399;
  margin-left: auto;
}

.file-list-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid #e4e7ed;
  background: #fafafa;
}

.current-path {
  font-size: 14px;
  color: #606266;
}

.file-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  padding: 20px;
  overflow-y: auto;
}

.file-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.file-card:hover {
  border-color: #409EFF;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}

.file-card.selected {
  border-color: #409EFF;
  background: rgba(64, 158, 255, 0.05);
}

.file-icon {
  margin-bottom: 10px;
}

.file-info {
  text-align: center;
  width: 100%;
}

.file-name {
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  display: block;
  font-size: 11px;
  color: #909399;
}

.file-expiry {
  display: block;
  font-size: 11px;
  margin-top: 4px;
}

.file-remark {
  display: block;
  font-size: 11px;
  color: #909399;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.expiry-warning {
  color: #E6A23C;
}

.expiry-danger {
  color: #F56C6C;
}

.file-checkbox {
  position: absolute;
  top: 10px;
  right: 10px;
}

.empty-files {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.empty-files svg {
  margin-bottom: 20px;
}

.preview-content {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  min-height: 400px;
}

.preview-image {
  max-width: 100%;
  max-height: 500px;
  border-radius: 8px;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #909399;
}

.preview-placeholder svg {
  margin-bottom: 15px;
}

@media (max-width: 768px) {
  .library-body {
    flex-direction: column;
  }
  .folder-tree {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e4e7ed;
    height: 200px;
  }
  .file-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}

.batch-import-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.batch-import-tips {
  background: #ecf5ff;
  border: 1px solid #d9ecff;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 12px;
  color: #409EFF;
  line-height: 1.6;
}

.batch-import-summary {
  display: flex;
  gap: 8px;
  align-items: center;
}

.batch-import-errors {
  max-height: 120px;
  overflow-y: auto;
  background: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 4px;
  padding: 8px 12px;
}

.batch-import-errors .error-line {
  font-size: 12px;
  color: #F56C6C;
  line-height: 1.8;
}
</style>
