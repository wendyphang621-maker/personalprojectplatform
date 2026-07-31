<template>
  <div class="product-management">
    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="机型参数库" name="model">
        <div class="tab-content">
          <div class="search-bar">
            <el-input v-model="searchKeyword" placeholder="搜索机型名称" clearable style="width: 250px" />
            <el-button type="primary" @click="handleAddModel">新增机型</el-button>
            <el-button @click="triggerModelImport" type="success">导入Excel</el-button>
            <el-button @click="exportModels">导出Excel</el-button>
            <el-button type="danger" :disabled="modelSelection.length === 0" @click="batchDeleteModels">批量删除 ({{ modelSelection.length }})</el-button>
          </div>
          <el-table :data="filteredModels" border stripe @selection-change="val => modelSelection = val">
            <el-table-column type="selection" width="45" />
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="name" label="机型名称" />
            <el-table-column prop="chip" label="芯片方案" />
            <el-table-column prop="screen" label="屏幕参数" />
            <el-table-column label="配套认证">
              <template #default="{ row }">
                {{ (Array.isArray(row.certifications) ? row.certifications : []).join(',') }}
              </template>
            </el-table-column>
            <el-table-column prop="supplier" label="供应商" />
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button size="small" @click="handleEditModel(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="handleDeleteModel(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="合规认证档案" name="cert">
        <div class="tab-content">
          <div class="search-bar">
            <el-select v-model="filterCertType" placeholder="认证类型" clearable style="width: 120px">
              <el-option label="CE" value="CE" />
              <el-option label="CB" value="CB" />
              <el-option label="SASO" value="SASO" />
            </el-select>
            <el-date-picker v-model="filterExpireDate" type="month" placeholder="到期月份" />
            <el-button type="primary" @click="handleAddCert">新增认证</el-button>
            <el-button @click="triggerCertImport" type="success">导入Excel</el-button>
            <el-button @click="exportCerts">导出Excel</el-button>
            <el-button type="danger" :disabled="selectedCertIds.length === 0" @click="batchDeleteCerts">
              批量删除
              <span v-if="selectedCertIds.length > 0">（{{ selectedCertIds.length }}）</span>
            </el-button>
          </div>
          <div class="cert-alerts">
            <div v-if="expiringCerts7Days.length > 0" class="alert-item danger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <span>{{ expiringCerts7Days.length }} 个证书将在7天内到期</span>
            </div>
            <div v-if="expiringCerts30Days.length > 0" class="alert-item warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              <span>{{ expiringCerts30Days.length }} 个证书将在30天内到期</span>
            </div>
          </div>
          <el-table :data="filteredCerts" border stripe @selection-change="handleCertSelectionChange">
            <el-table-column type="selection" width="50" />
            <el-table-column prop="id" label="认证ID" width="80" />
            <el-table-column prop="model" label="关联机型" />
            <el-table-column prop="certType" label="认证类型">
              <template #default="{ row }">
                <el-tag :type="getCertTypeTagType(row.certType)">{{ row.certType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="certNo" label="证书编号" />
            <el-table-column prop="issueDate" label="下发日期" />
            <el-table-column prop="expireDate" label="到期日期">
              <template #default="{ row }">
                <span :class="getExpireClass(row)">{{ row.expireDate }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="organization" label="对接机构" />
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button size="small" @click="handleEditCert(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="handleDeleteCert(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="渲染图素材库" name="material">
        <div class="tab-content">
          <div class="search-bar">
            <el-select v-model="filterModel" placeholder="筛选机型" clearable style="width: 150px">
              <el-option v-for="m in store.productModels" :key="m.id" :label="m.name" :value="m.name" />
            </el-select>
            <el-select v-model="uploadTargetModel" placeholder="选择上传目标机型" style="width: 150px">
              <el-option v-for="m in store.productModels" :key="m.id" :label="m.name" :value="m.name" />
            </el-select>
            <el-button type="primary" @click="handleAddModel">新增机型</el-button>
            <el-button type="primary" @click="showUploadDialog = true">批量上传</el-button>
            <div class="root-path-config">
              <el-input v-model="localMaterialRootPath" placeholder="本地产品素材根目录" readonly style="width: 250px" />
              <el-button @click="triggerFolderSelect" type="primary">选择文件夹（稳定读取）</el-button>
              <div 
                class="folder-drop-zone" 
                :class="{ 'drag-over': isDragOver }"
                @drop.prevent="handleDrop"
                @dragover.prevent="handleDragOver"
                @dragleave.prevent="handleDragLeave"
              >
                <span>拖拽文件夹（快捷方式）</span>
              </div>
              <input 
                ref="folderInput"
                type="file" 
                webkitdirectory 
                directory
                style="display: none"
                @change="handleFolderSelect"
              />
              <div class="read-guide">
                <span>💡 优先使用「选择文件夹」，拖拽入口仅作为临时快捷操作，规避浏览器兼容报错</span>
              </div>
              <div v-if="showDragError" class="drag-error-tip">
                <span>⚠️ 拖拽交互异常，请刷新页面后重试，推荐使用上方选择文件夹按钮读取素材</span>
              </div>
            </div>

            <div v-if="isProcessing" class="processing-overlay">
              <button class="processing-close-btn" @click="cancelProcessing">×</button>
              <div class="processing-content">
                <div v-if="showSizeWarning" class="size-warning">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48" class="warning-icon">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <h3>图片数量较多</h3>
                  <p>检测到 {{ totalImageCount }} 张图片，加载可能需要较长时间</p>
                  <p class="warning-hint">建议分批选择机型文件夹，不要一次性加载全部机型素材</p>
                  <div class="warning-actions">
                    <el-button type="primary" @click="confirmLoadAll">继续加载全部</el-button>
                    <el-button @click="cancelProcessing">取消</el-button>
                  </div>
                </div>
                <div v-else class="progress-display">
                  <div class="progress-phase">
                    <span class="phase-label">{{ currentPhase }}</span>
                    <span class="phase-count">{{ phaseCurrent }}/{{ phaseTotal }}</span>
                  </div>
                  <el-progress :percentage="processingProgress" :status="processingProgress === 100 ? 'success' : 'loading'" />
                  <span class="processing-text">{{ processingMessage }}</span>
                  <el-button 
                    v-if="processingProgress === 100 && processingMessage === '解析完成'" 
                    size="small" 
                    type="primary" 
                    @click="showParseDetails = true"
                    style="margin-top: 16px;"
                  >
                    查看解析详情
                  </el-button>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="Object.keys(localMaterialMap).length > 0" class="batch-toolbar">
            <el-checkbox :checked="isAllSelected" @change="toggleSelectAll" />
            <span class="batch-label">全选</span>
            <el-button size="small" @click="clearSelection">取消全选</el-button>
            <el-divider direction="vertical" />
            <el-button 
              size="small" 
              type="danger" 
              :disabled="selectedMaterials.size === 0"
              @click="batchDeleteMaterials"
            >
              批量删除 ({{ selectedMaterials.size }})
            </el-button>
            <el-button 
              size="small" 
              type="warning" 
              @click="clearAllMaterials"
            >
              清空全部素材
            </el-button>
            <el-button 
              size="small" 
              @click="handleClearAllCache"
            >
              清空全部本地缓存
            </el-button>
            <el-button 
              v-if="localMaterialRootPath && hasCachedPlaceholder" 
              size="small" 
              type="primary"
              @click="triggerQuickLoad"
            >
              快速加载上次素材目录
            </el-button>
          </div>

          <div v-if="hasCachedPlaceholder && !isProcessing" class="cache-placeholder-hint">
            <div class="hint-icon">💡</div>
            <div class="hint-content">
              <p>已读取素材目录清单；图片预览、原图下载功能需要重新选择文件夹。可点击【快速加载上次素材目录】快捷唤起选择窗口。</p>
            </div>
          </div>

          <div class="material-grid">
            <div v-if="Object.keys(localMaterialMap).length === 0 && !isProcessing" class="empty-material-overall">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <p>暂无图片素材</p>
              <p class="empty-hint">请点击「选择文件夹」或拖拽文件夹来加载本地素材</p>
              <p class="cache-hint">💡 本地文件夹读取素材为浏览器缓存预览，无需重复加载；清除缓存 / 更换浏览器后需要重新选择文件夹。</p>
            </div>
            <div v-for="model in filteredProductModels" :key="model.id" class="model-section">
              <div class="model-header">
                <div class="model-title-row">
                  <h3 class="model-title">{{ model.name }}</h3>
                  <div class="model-select-actions">
                    <el-button 
                      size="mini" 
                      :type="isModelAllSelected(model) ? 'primary' : ''"
                      @click="toggleSelectModelAll(model)"
                    >
                      {{ isModelAllSelected(model) ? '取消本组全选' : '本组全选' }}
                    </el-button>
                    <span class="model-selected-count">
                      已选 {{ getModelSelectedCount(model) }}/{{ getModelMaterials(model).length }}
                    </span>
                  </div>
                </div>
                <div class="model-actions">
                  <el-button size="small" @click="handleEditModel(model)">编辑机型</el-button>
                  <el-button size="small" type="primary" @click="openAddMaterialDialog(model)">新增素材</el-button>
                  <el-button size="small" @click="openModelFolder(model)">打开本地文件夹</el-button>
                </div>
              </div>
              <div class="file-grid">
                <div 
                  v-for="(file, index) in getModelMaterials(model)" 
                  :key="file.name + '_' + index" 
                  class="file-card"
                  :class="{ 'selected': isMaterialSelected(file), 'cached-placeholder': file.isCachedPlaceholder }"
                >
                  <el-checkbox 
                    class="file-checkbox"
                    :checked="isMaterialSelected(file)" 
                    @change="toggleMaterialSelect(file)"
                  />
                  <div class="file-card-content">
                    <div v-if="file.isCachedPlaceholder" class="file-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                    <img v-else :src="file.localDataUrl || file.url || ''" :alt="file.name" class="file-preview" />
                    <div class="file-info">
                      <span class="file-name">{{ file.name }}</span>
                      <div class="file-path-tooltip" v-if="file.webkitRelativePath || file.fullRelativePath">
                        <div class="tooltip-path">路径: {{ file.webkitRelativePath || file.fullRelativePath }}</div>
                        <div v-if="file.rootModelFolderName" class="tooltip-root">匹配根目录: {{ file.rootModelFolderName }}</div>
                      </div>
                      <div class="file-actions">
                        <el-button v-if="!file.isCachedPlaceholder" size="mini" @click="previewMaterial(file)">预览</el-button>
                        <el-button v-if="!file.isCachedPlaceholder" size="mini" @click="downloadMaterial(file)">下载</el-button>
                        <el-button size="mini" type="danger" @click="handleDeleteMaterial(model, file)">删除</el-button>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="getModelMaterials(model).length === 0" class="empty-material">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <p>暂无素材</p>
                </div>
              </div>
            </div>

            <div v-if="unclassifiedMaterials.length > 0" class="model-section unclassified-section">
              <div class="model-header">
                <div class="model-title-row">
                  <h3 class="model-title">未归类素材</h3>
                  <div class="model-select-actions">
                    <el-button 
                      size="mini" 
                      :type="isUnclassifiedAllSelected() ? 'primary' : ''"
                      @click="toggleSelectUnclassifiedAll"
                    >
                      {{ isUnclassifiedAllSelected() ? '取消本组全选' : '本组全选' }}
                    </el-button>
                    <span class="model-selected-count">
                      已选 {{ getUnclassifiedSelectedCount() }}/{{ unclassifiedMaterials.length }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="file-grid">
                <div 
                  v-for="(file, index) in unclassifiedMaterials" 
                  :key="file.id || (file.name + '_' + index)" 
                  class="file-card"
                  :class="{ 'selected': isMaterialSelected(file), 'cached-placeholder': file.isCachedPlaceholder }"
                >
                  <el-checkbox 
                    class="file-checkbox"
                    :checked="isMaterialSelected(file)" 
                    @change="toggleMaterialSelect(file)"
                  />
                  <div class="file-card-content">
                    <div v-if="file.isCachedPlaceholder" class="file-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                    <img v-else :src="file.localDataUrl || file.url || ''" :alt="file.name" class="file-preview" />
                    <div class="file-info">
                      <span class="file-name">{{ file.name }}</span>
                      <div class="file-path-tooltip" v-if="file.webkitRelativePath || file.fullRelativePath">
                        <div class="tooltip-path">路径: {{ file.webkitRelativePath || file.fullRelativePath }}</div>
                        <div v-if="file.rootModelFolderName" class="tooltip-root">匹配根目录: {{ file.rootModelFolderName }}</div>
                      </div>
                      <div class="file-actions">
                        <el-button v-if="!file.isCachedPlaceholder" size="mini" @click="previewMaterial(file)">预览</el-button>
                        <el-button size="mini" type="danger" @click="handleDeleteUnclassified(file)">删除</el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="供应商台账" name="supplier">
        <div class="tab-content">
          <div class="search-bar">
            <el-input v-model="supplierKeyword" placeholder="搜索供应商" clearable style="width: 250px" />
            <el-button type="primary" @click="handleAddSupplier">新增供应商</el-button>
            <el-button @click="triggerSupplierImport" type="success">导入Excel</el-button>
            <el-button @click="exportSuppliers">导出Excel</el-button>
            <el-button type="danger" :disabled="selectedSupplierIds.length === 0" @click="batchDeleteSuppliers">
              批量删除
              <span v-if="selectedSupplierIds.length > 0">（{{ selectedSupplierIds.length }}）</span>
            </el-button>
          </div>
          <el-table :data="filteredSuppliers" border stripe @selection-change="handleSupplierSelectionChange">
            <el-table-column type="selection" width="50" />
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="name" label="供应商名称" />
            <el-table-column prop="contact" label="对接人" />
            <el-table-column prop="phone" label="联系方式" />
            <el-table-column prop="models" label="供货机型" />
            <el-table-column prop="qualification" label="资质文件" />
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button size="small" @click="handleEditSupplier(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="handleDeleteSupplier(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <el-dialog v-model="showModelDialog" :title="isEditingModel ? '编辑机型' : '新增机型'" width="500px">
      <el-form :model="modelForm" label-width="100px">
        <el-form-item label="机型名称">
          <el-input v-model="modelForm.name" />
        </el-form-item>
        <el-form-item label="芯片方案">
          <el-input v-model="modelForm.chip" />
        </el-form-item>
        <el-form-item label="屏幕参数">
          <el-input v-model="modelForm.screen" />
        </el-form-item>
        <el-form-item label="配套认证">
          <el-select v-model="modelForm.certifications" multiple style="width: 100%">
            <el-option label="CE" value="CE" />
            <el-option label="CB" value="CB" />
            <el-option label="SASO" value="SASO" />
            <el-option label="FCC" value="FCC" />
            <el-option label="ROHS" value="ROHS" />
          </el-select>
        </el-form-item>
        <el-form-item label="供应商">
          <el-select v-model="modelForm.supplier" filterable>
            <el-option v-for="s in store.suppliers" :key="s.id" :label="s.name" :value="s.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="渲染图路径">
          <el-input v-model="modelForm.imagePath" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showModelDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmModel">确定</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showCertDialog" :title="isEditingCert ? '编辑认证' : '新增认证'" width="500px">
      <el-form :model="certForm" label-width="100px">
        <el-form-item label="关联机型">
          <el-select v-model="certForm.model" filterable>
            <el-option v-for="m in store.productModels" :key="m.id" :label="m.name" :value="m.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="认证类型">
          <el-select v-model="certForm.certType">
            <el-option label="CE" value="CE" />
            <el-option label="CB" value="CB" />
            <el-option label="SASO" value="SASO" />
          </el-select>
        </el-form-item>
        <el-form-item label="证书编号">
          <el-input v-model="certForm.certNo" />
        </el-form-item>
        <el-form-item label="下发日期">
          <el-date-picker v-model="certForm.issueDate" type="date" />
        </el-form-item>
        <el-form-item label="到期日期">
          <el-date-picker v-model="certForm.expireDate" type="date" />
        </el-form-item>
        <el-form-item label="对接机构">
          <el-input v-model="certForm.organization" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCertDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmCert">确定</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showSupplierDialog" :title="isEditingSupplier ? '编辑供应商' : '新增供应商'" width="500px">
      <el-form :model="supplierForm" label-width="100px">
        <el-form-item label="供应商名称">
          <el-input v-model="supplierForm.name" />
        </el-form-item>
        <el-form-item label="对接人">
          <el-input v-model="supplierForm.contact" />
        </el-form-item>
        <el-form-item label="联系方式">
          <el-input v-model="supplierForm.phone" />
        </el-form-item>
        <el-form-item label="供货机型">
          <el-select v-model="supplierForm.models" multiple style="width: 100%">
            <el-option v-for="m in store.productModels" :key="m.id" :label="m.name" :value="m.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="资质文件">
          <el-input v-model="supplierForm.qualification" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSupplierDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmSupplier">确定</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showUploadDialog" title="批量上传渲染图" width="600px">
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="目标机型">
          <el-select v-model="uploadForm.model">
            <el-option v-for="m in store.productModels" :key="m.id" :label="m.name" :value="m.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="上传图片">
          <FileUploader
            v-if="uploadForm.model"
            module-type="product"
            :module-id="getModelIdByName(uploadForm.model)"
            :module-name="uploadForm.model"
            v-model="tempUploadFiles"
          />
          <div v-else class="upload-disabled">
            <el-alert type="info" :closable="false" show-icon>
              请先选择目标机型
            </el-alert>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmUpload">确认上传</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showAddMaterialDialog" :title="`新增素材 - ${currentModelForMaterial?.name}`" width="600px">
      <el-form label-width="100px">
        <el-form-item label="上传素材">
          <FileUploader
            v-if="currentModelForMaterial"
            module-type="product"
            :module-id="currentModelForMaterial.id"
            :module-name="currentModelForMaterial.name"
            v-model="tempAddMaterialFiles"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddMaterialDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAddMaterial">确认添加</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showParseDetails" title="解析详情" width="600px">
      <div class="parse-stats">
        <div class="stat-row">
          <span class="stat-label">读取文件总数</span>
          <span class="stat-value">{{ parseStats.totalFiles }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">过滤无效文件数</span>
          <span class="stat-value filtered">{{ parseStats.filteredCount }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">有效图片数</span>
          <span class="stat-value valid">{{ parseStats.validImageCount }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">成功归类图片数</span>
          <span class="stat-value classified">{{ parseStats.classifiedCount }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">未归类素材数</span>
          <span class="stat-value unclassified">{{ parseStats.unclassifiedCount }}</span>
        </div>
      </div>

      <div v-if="unclassifiedList.length > 0" class="unclassified-section">
        <h4>未归类素材列表</h4>
        <div class="unclassified-list">
          <div v-for="(item, index) in unclassifiedList.slice(0, 50)" :key="index" class="unclassified-item">
            <span class="item-name">{{ item.name }}</span>
            <span class="item-path">{{ item.fullRelativePath }}</span>
          </div>
          <div v-if="unclassifiedList.length > 50" class="list-more">
            ... 还有 {{ unclassifiedList.length - 50 }} 个未显示
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="showParseDetails = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 隐藏的文件输入框用于 Excel 导入 -->
    <input
      ref="modelImportInput"
      type="file"
      accept=".xlsx,.xls"
      style="display: none"
      @change="handleModelImport"
    />
    <input
      ref="certImportInput"
      type="file"
      accept=".xlsx,.xls"
      style="display: none"
      @change="handleCertImport"
    />
    <input
      ref="supplierImportInput"
      type="file"
      accept=".xlsx,.xls"
      style="display: none"
      @change="handleSupplierImport"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted, createVNode } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import FileUploader from './FileUploader.vue'
import { store, addProductModel, updateProductModel, deleteProductModel, addCertRecord, updateCertRecord, deleteCertRecord, addSupplier, updateSupplier, deleteSupplier, syncAllFromSupabase } from '../store.js'
import { exportToExcel } from '../utils/excelExport.js'
import { importFromExcel, fieldMappingPresets, showImportResult } from '../utils/excelImport.js'
import { getAllCachedMaterials, addMaterialsToCache, deleteMaterialFromCache, batchDeleteMaterialsFromCache, clearAllCache, getCacheRootFolder, getCacheCount, validateAndCleanCache } from '../utils/materialCache.js'

const props = defineProps({
  currentSubPage: {
    type: String,
    default: 'model'
  }
})

const activeTab = ref(props.currentSubPage || 'model')

watch(() => props.currentSubPage, (newVal) => {
  if (newVal && activeTab.value !== newVal) {
    activeTab.value = newVal
  }
}, { immediate: true })

const searchKeyword = ref('')
const filterCertType = ref('')
const filterExpireDate = ref('')

// 批量选择：认证、供应商
const selectedCertIds = ref([])
const selectedSupplierIds = ref([])

function handleCertSelectionChange(selection) {
  selectedCertIds.value = selection.map(item => item.id)
}

function handleSupplierSelectionChange(selection) {
  selectedSupplierIds.value = selection.map(item => item.id)
}

function batchDeleteCerts() {
  if (selectedCertIds.value.length === 0) {
    ElMessage.warning('请先勾选需要删除的认证记录')
    return
  }
  ElMessageBox.confirm(
    `已勾选 ${selectedCertIds.value.length} 条认证记录，删除不可恢复，确认执行？`,
    '确认批量删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    selectedCertIds.value.forEach(id => {
      const idx = store.certRecords.findIndex(r => r.id === id)
      if (idx > -1) {
        store.certRecords.splice(idx, 1)
      }
    })
    ElMessage.success(`已删除 ${selectedCertIds.value.length} 条认证记录`)
    selectedCertIds.value = []
  }).catch(() => {})
}

function batchDeleteSuppliers() {
  if (selectedSupplierIds.value.length === 0) {
    ElMessage.warning('请先勾选需要删除的供应商')
    return
  }
  ElMessageBox.confirm(
    `已勾选 ${selectedSupplierIds.value.length} 个供应商，删除不可恢复，确认执行？`,
    '确认批量删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    selectedSupplierIds.value.forEach(id => {
      const idx = store.suppliers.findIndex(s => s.id === id)
      if (idx > -1) {
        store.suppliers.splice(idx, 1)
      }
    })
    ElMessage.success(`已删除 ${selectedSupplierIds.value.length} 个供应商`)
    selectedSupplierIds.value = []
  }).catch(() => {})
}

const filterModel = ref('')
const supplierKeyword = ref('')

const showModelDialog = ref(false)
const showCertDialog = ref(false)
const showSupplierDialog = ref(false)
const showUploadDialog = ref(false)
const showAddMaterialDialog = ref(false)

const modelSelection = ref([])

const uploadTargetModel = ref('')
const localMaterialRootPath = ref(localStorage.getItem('product_material_root_path') || '')
const currentModelForMaterial = ref(null)

const localMaterialMap = ref({})
const selectedMaterials = ref(new Set())
let materialIdCounter = 0

function generateMaterialId() {
  return 'mat_' + ++materialIdCounter
}
const isDragOver = ref(false)
const isProcessing = ref(false)
const isCancelled = ref(false)
const processingProgress = ref(0)
const processingMessage = ref('')
const folderInput = ref(null)
const showDragError = ref(false)

const showSizeWarning = ref(false)
const totalImageCount = ref(0)
const currentPhase = ref('')
const phaseCurrent = ref(0)
const phaseTotal = ref(0)
let materialWorker = null
let pendingFiles = []

const parseStats = ref({
  totalFiles: 0,
  filteredCount: 0,
  validImageCount: 0,
  classifiedCount: 0,
  unclassifiedCount: 0
})
const unclassifiedList = ref([])
const showParseDetails = ref(false)

// Excel 导入相关的文件输入框引用
const modelImportInput = ref(null)
const certImportInput = ref(null)
const supplierImportInput = ref(null)

// 供应商导入的 fieldMapping（手动定义）
const supplierFieldMapping = [
  { excelHeader: '供应商ID', dataField: 'id' },
  { excelHeader: '供应商名称', dataField: 'name' },
  { excelHeader: '对接人', dataField: 'contact' },
  { excelHeader: '联系方式', dataField: 'phone' },
  { excelHeader: '供货机型', dataField: 'models' },
  { excelHeader: '资质文件', dataField: 'qualification' }
]

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.ico', '.tiff', '.tif', '.svg', '.heic', '.heif']
const MAX_THUMBNAIL_WIDTH = 800

let activeFileReaders = []
let processingTimers = []
let dropZoneElement = null

function isValidImageFile(file) {
  if (!file || !file.name) {
    return false
  }
  
  const fileName = file.name.toLowerCase()
  const fileExtension = fileName.substring(fileName.lastIndexOf('.'))
  
  const hasImageExtension = IMAGE_EXTENSIONS.some(ext => fileName.endsWith(ext.toLowerCase()))
  
  if (file.type) {
    const isImageType = file.type.startsWith('image/')
    if (isImageType || hasImageExtension) {
      return true
    }
  } else {
    if (hasImageExtension) {
      return true
    }
  }
  
  return false
}

function registerFileReader(reader) {
  activeFileReaders.push(reader)
}

function unregisterFileReader(reader) {
  const index = activeFileReaders.indexOf(reader)
  if (index > -1) {
    activeFileReaders.splice(index, 1)
  }
}

function registerTimer(timerId) {
  processingTimers.push(timerId)
}

function handleGlobalDragOver(event) {
  event.preventDefault()
}

function handleGlobalDragLeave(event) {
  event.preventDefault()
}

onMounted(async () => {
  console.log('ProductManagement mounted')
  console.log('localMaterialRootPath:', localMaterialRootPath.value)
  console.log('localMaterialMap:', localMaterialMap.value)
  
  await syncAllFromSupabase()
  
  console.log('productModels:', store.productModels.map(m => m.name))

  document.addEventListener('dragover', handleGlobalDragOver, true)
  document.addEventListener('dragleave', handleGlobalDragLeave, true)

  loadCachedMaterials()
})

onUnmounted(() => {
  isCancelled.value = true
  
  document.removeEventListener('dragover', handleGlobalDragOver, true)
  document.removeEventListener('dragleave', handleGlobalDragLeave, true)

  if (materialWorker) {
    materialWorker.terminate()
    materialWorker = null
  }

  activeFileReaders.forEach(reader => {
    reader.abort()
  })
  activeFileReaders = []

  processingTimers.forEach(timerId => {
    clearTimeout(timerId)
    clearInterval(timerId)
  })
  processingTimers = []

  isDragOver.value = false
})

const isEditingModel = ref(false)
const isEditingCert = ref(false)
const isEditingSupplier = ref(false)

const modelForm = reactive({
  id: '',
  name: '',
  chip: '',
  screen: '',
  certifications: [],
  supplier: '',
  imagePath: ''
})

const certForm = reactive({
  id: '',
  model: '',
  certType: 'CE',
  certNo: '',
  issueDate: new Date().toISOString().split('T')[0],
  expireDate: '',
  organization: '',
  filePath: ''
})

const supplierForm = reactive({
  id: '',
  name: '',
  contact: '',
  phone: '',
  models: [],
  qualification: ''
})

const uploadForm = reactive({
  model: ''
})

const uploadFileList = ref([])
const tempUploadFiles = ref([])
const tempAddMaterialFiles = ref([])

const filteredModels = computed(() => {
  return store.productModels.filter(m => 
    !searchKeyword.value || m.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

const filteredCerts = computed(() => {
  return store.certRecords.filter(c => {
    const matchType = !filterCertType.value || c.certType === filterCertType.value
    const matchDate = !filterExpireDate.value || c.expireDate.startsWith(filterExpireDate.value)
    return matchType && matchDate
  })
})

const filteredSuppliers = computed(() => {
  return store.suppliers.filter(s => 
    !supplierKeyword.value || s.name.toLowerCase().includes(supplierKeyword.value.toLowerCase())
  )
})

const expiringCerts7Days = computed(() => {
  const today = new Date()
  return store.certRecords.filter(c => {
    const expire = new Date(c.expireDate)
    const diffDays = Math.floor((expire - today) / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= 7
  })
})

const expiringCerts30Days = computed(() => {
  const today = new Date()
  return store.certRecords.filter(c => {
    const expire = new Date(c.expireDate)
    const diffDays = Math.floor((expire - today) / (1000 * 60 * 60 * 24))
    return diffDays > 7 && diffDays <= 30
  })
})

const groupedMaterials = computed(() => {
  const materials = {}
  store.productModels.forEach(model => {
    materials[model.name] = model.materials || []
  })
  return materials
})

const filteredProductModels = computed(() => {
  return store.productModels.filter(m => 
    !filterModel.value || m.name.toLowerCase().includes(filterModel.value.toLowerCase())
  )
})

function getModelMaterials(model) {
  const localFiles = localMaterialMap.value[model.name] || []
  const cloudFiles = model.materials || []
  const allFiles = [...localFiles, ...cloudFiles]
  const uniqueFiles = allFiles.filter((file, index, self) =>
    index === self.findIndex(f => f.name === file.name)
  )
  return uniqueFiles
}

const unclassifiedMaterials = computed(() => {
  return localMaterialMap.value['未归类素材'] || []
})

async function handleDeleteUnclassified(file) {
  try {
    await ElMessageBox.confirm(
      `确定删除素材 "${file.name}" 吗？\n⚠️ 仅删除网页预览，本地电脑原图不会被删除。`,
      '删除素材',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }
  
  if (localMaterialMap.value['未归类素材']) {
    const index = localMaterialMap.value['未归类素材'].findIndex(m => m.id === file.id)
    if (index > -1) {
      localMaterialMap.value['未归类素材'].splice(index, 1)
    }
  }
  
  await deleteMaterialFromCache(file.id)
  selectedMaterials.value.delete(file.id)
}

function getMaterialPreview(file) {
  if (file.localDataUrl) {
    return file.localDataUrl
  }
  if (file.url && file.url.startsWith('http')) {
    return file.url
  }
  return ''
}

function previewMaterial(file) {
  const url = file.localDataUrl || file.url
  if (url) {
    window.open(url, '_blank')
  }
}

function downloadMaterial(file) {
  const url = file.localDataUrl || file.url
  if (url) {
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    a.click()
  }
}

async function handleDeleteMaterial(model, file) {
  try {
    await ElMessageBox.confirm(
      `确定删除素材 "${file.name}" 吗？\n⚠️ 仅删除网页预览，本地电脑原图不会被删除。`,
      '删除素材',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }
  
  if (file.isLocal) {
    if (localMaterialMap.value[model.name]) {
      const index = localMaterialMap.value[model.name].findIndex(m => m.id === file.id)
      if (index > -1) {
        localMaterialMap.value[model.name].splice(index, 1)
      }
    }
    await deleteMaterialFromCache(file.id)
  } else {
    const materials = model.materials || []
    const index = materials.findIndex(m => m.path === file.path || m.id === file.id)
    if (index > -1) {
      materials.splice(index, 1)
    }
  }
  
  selectedMaterials.value.delete(file.id)
}

async function loadCachedMaterials() {
  try {
    const validateResult = await validateAndCleanCache()
    if (validateResult.cleaned) {
      console.log('[缓存] 已自动清理', validateResult.count, '条旧格式缓存')
      ElMessageBox.info(
        `检测到历史旧格式缓存，已自动清理 ${validateResult.count} 条记录。\n请重新选择文件夹加载素材。`,
        '缓存已更新'
      )
      return
    }
    
    const cachedMaterials = await getAllCachedMaterials()
    if (cachedMaterials.length > 0) {
      console.log('[缓存] 加载到', cachedMaterials.length, '张缓存元信息')
      
      const rootFolder = cachedMaterials[0].rootFolderName || ''
      localMaterialRootPath.value = rootFolder
      localStorage.setItem('product_material_root_path', rootFolder)
      
      const newMaterialMap = {}
      cachedMaterials.forEach(material => {
        const modelName = material.targetModelName || '未归类素材'
        if (!newMaterialMap[modelName]) {
          newMaterialMap[modelName] = []
        }
        newMaterialMap[modelName].push({
          ...material,
          isCachedPlaceholder: true,
          localDataUrl: null
        })
      })
      
      localMaterialMap.value = newMaterialMap
    }
  } catch (error) {
    console.error('[缓存] 加载缓存失败:', error)
  }
}

async function saveMaterialsToCache(rootFolderName) {
  try {
    const allMaterials = []
    for (const modelName of Object.keys(localMaterialMap.value)) {
      allMaterials.push(...localMaterialMap.value[modelName])
    }
    
    await addMaterialsToCache(allMaterials, rootFolderName)
    console.log('[缓存] 已保存', allMaterials.length, '张素材元信息到本地缓存')
  } catch (error) {
    console.error('[缓存] 保存缓存失败:', error)
  }
}

async function handleClearAllCache() {
  try {
    await ElMessageBox.confirm(
      '确定清空所有本地缓存素材？\n清空后需要重新选择文件夹加载素材。',
      '清空缓存',
      {
        confirmButtonText: '确定清空',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await clearAllCache()
    localMaterialMap.value = {}
    selectedMaterials.value.clear()
    localMaterialRootPath.value = ''
    localStorage.removeItem('product_material_root_path')
    
    ElMessageBox.success('本地缓存已清空')
  } catch {
    // 用户取消
  }
}

async function checkRootFolderChange(newRootFolder) {
  const cachedRoot = await getCacheRootFolder()
  if (cachedRoot && cachedRoot !== newRootFolder) {
    try {
      await ElMessageBox.confirm(
        `检测到本次选择的文件夹与缓存根目录不一致。\n当前缓存根目录: ${cachedRoot}\n新选择文件夹: ${newRootFolder}\n\n是否清空历史缓存，加载新文件夹素材？`,
        '切换素材根目录',
        {
          confirmButtonText: '清空并加载',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      
      await clearAllCache()
      return true
    } catch {
      return false
    }
  }
  return true
}

const isAllSelected = computed(() => {
  let totalCount = 0
  let selectedCount = 0
  
  for (const modelName of Object.keys(localMaterialMap.value)) {
    const materials = localMaterialMap.value[modelName] || []
    totalCount += materials.length
    
    for (const material of materials) {
      if (selectedMaterials.value.has(material.id)) {
        selectedCount++
      }
    }
  }
  
  return totalCount > 0 && totalCount === selectedCount
})

const hasCachedPlaceholder = computed(() => {
  for (const modelName of Object.keys(localMaterialMap.value)) {
    const materials = localMaterialMap.value[modelName] || []
    for (const material of materials) {
      if (material.isCachedPlaceholder) {
        return true
      }
    }
  }
  return false
})

let quickLoadDebounce = null

async function triggerQuickLoad() {
  if (quickLoadDebounce) {
    clearTimeout(quickLoadDebounce)
  }
  
  quickLoadDebounce = setTimeout(async () => {
    try {
      const rootFolder = await getCacheRootFolder()
      console.log('[快速加载] 缓存读取根目录名称:', rootFolder)
      
      if (rootFolder) {
        await ElMessageBox.confirm(
          `上次加载素材根目录：${rootFolder}\n\n⚠️ 浏览器安全限制无法自动定位文件夹，请手动选中该文件夹。`,
          '快速加载上次目录',
          {
            confirmButtonText: '确定选择',
            cancelButtonText: '取消',
            type: 'info'
          }
        )
        
        const fileInput = document.getElementById('local-folder-input')
        if (fileInput) {
          fileInput.click()
        }
      } else {
        ElMessageBox.info(
          '暂无历史素材目录记录，请正常选择文件夹加载。',
          '提示'
        )
      }
    } catch (error) {
      if (error !== 'cancel') {
        console.error('[快速加载] 加载失败:', error)
        ElMessageBox.error('快速加载失败，请重试或手动选择文件夹')
      }
    } finally {
      quickLoadDebounce = null
    }
  }, 300)
}

function isMaterialSelected(file) {
  return selectedMaterials.value.has(file.id)
}

function toggleMaterialSelect(file) {
  if (selectedMaterials.value.has(file.id)) {
    selectedMaterials.value.delete(file.id)
  } else {
    selectedMaterials.value.add(file.id)
  }
}

function toggleSelectAll(val) {
  selectedMaterials.value.clear()
  
  if (val) {
    for (const modelName of Object.keys(localMaterialMap.value)) {
      const materials = localMaterialMap.value[modelName] || []
      for (const material of materials) {
        selectedMaterials.value.add(material.id)
      }
    }
  }
}

function isModelAllSelected(model) {
  const materials = getModelMaterials(model)
  if (materials.length === 0) return false
  return materials.every(m => selectedMaterials.value.has(m.id))
}

function getModelSelectedCount(model) {
  const materials = getModelMaterials(model)
  return materials.filter(m => selectedMaterials.value.has(m.id)).length
}

function toggleSelectModelAll(model) {
  const materials = getModelMaterials(model)
  const allSelected = isModelAllSelected(model)
  
  materials.forEach(m => {
    if (allSelected) {
      selectedMaterials.value.delete(m.id)
    } else {
      selectedMaterials.value.add(m.id)
    }
  })
}

function isUnclassifiedAllSelected() {
  if (unclassifiedMaterials.value.length === 0) return false
  return unclassifiedMaterials.value.every(m => selectedMaterials.value.has(m.id))
}

function getUnclassifiedSelectedCount() {
  return unclassifiedMaterials.value.filter(m => selectedMaterials.value.has(m.id)).length
}

function toggleSelectUnclassifiedAll() {
  const allSelected = isUnclassifiedAllSelected()
  
  unclassifiedMaterials.value.forEach(m => {
    if (allSelected) {
      selectedMaterials.value.delete(m.id)
    } else {
      selectedMaterials.value.add(m.id)
    }
  })
}

function clearSelection() {
  selectedMaterials.value.clear()
}

async function batchDeleteMaterials() {
  if (selectedMaterials.value.size === 0) return
  
  try {
    await ElMessageBox.confirm(
      `确定移除已勾选共 ${selectedMaterials.value.size} 张素材预览？\n⚠️ 仅移除网页内预览卡片，不会删除电脑本地磁盘原始图片文件。`,
      '批量删除素材',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }
  
  isProcessing.value = true
  processingMessage.value = '正在删除选中素材...'
  
  const deletedIds = Array.from(selectedMaterials.value)
  await batchDeleteMaterialsFromCache(deletedIds)
  
  for (const modelName of Object.keys(localMaterialMap.value)) {
    const materials = localMaterialMap.value[modelName] || []
    localMaterialMap.value[modelName] = materials.filter(m => !selectedMaterials.value.has(m.id))
  }
  
  selectedMaterials.value.clear()
  
  isProcessing.value = false
  processingMessage.value = ''
}

async function clearAllMaterials() {
  try {
    await ElMessageBox.confirm(
      '确定清空当前所有预览素材？\n⚠️ 仅移除网页内预览卡片，不会删除电脑本地磁盘原始图片文件。',
      '清空全部素材',
      {
        confirmButtonText: '确定清空',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }
  
  isProcessing.value = true
  processingMessage.value = '正在清空素材...'
  
  await clearAllCache()
  localMaterialMap.value = {}
  selectedMaterials.value.clear()
  
  isProcessing.value = false
  processingMessage.value = ''
}

function openAddMaterialDialog(model) {
  currentModelForMaterial.value = model
  showAddMaterialDialog.value = true
}

function handleDragOver(event) {
  event.preventDefault()
  event.stopPropagation()
  isDragOver.value = true
}

function handleDragLeave(event) {
  event.preventDefault()
  event.stopPropagation()
  isDragOver.value = false
}

function triggerFolderSelect() {
  folderInput.value?.click()
}

async function handleFolderSelect(event) {
  if (isProcessing.value) {
    console.log('[文件夹选择] 正在处理中，请等待完成或取消当前操作')
    event.target.value = ''
    return
  }

  const files = Array.from(event.target.files)
  
  console.log('[文件夹选择] 选择的文件数量:', files.length)
  
  if (files.length === 0) {
    console.log('[文件夹选择] 未检测到文件，请重新选择文件夹')
    event.target.value = ''
    return
  }

  if (files.length > 5000) {
    alert('文件数量过多，请选择文件数量不超过5000的文件夹')
    event.target.value = ''
    return
  }

  let rootFolderName = ''
  
  if (window.showDirectoryPicker) {
    try {
      const dirHandle = await window.showDirectoryPicker()
      rootFolderName = dirHandle.name
      console.log('[文件夹选择] 选中根文件夹名称:', rootFolderName)
    } catch (err) {
      console.log('[文件夹选择] 用户取消了目录选择')
    }
  }

  isDragOver.value = false

  await processFolderFiles(files, rootFolderName)
  
  event.target.value = ''
}

async function handleDrop(event) {
  event.preventDefault()
  event.stopPropagation()
  isDragOver.value = false

  if (isProcessing.value) {
    console.log('[拖拽] 正在处理中，请等待完成或取消当前操作')
    return
  }

  const items = event.dataTransfer?.items
  if (!items || items.length === 0) {
    console.log('[拖拽] 未检测到拖拽内容')
    return
  }

  const allFiles = []
  let rootFolderName = ''
  
  try {
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.kind === 'file') {
        const file = item.getAsFile()
        if (file) {
          if (item.webkitGetAsEntry) {
            const entry = item.webkitGetAsEntry()
            if (entry && entry.isDirectory) {
              if (!rootFolderName) {
                rootFolderName = entry.name
                console.log('[拖拽] 拖拽根文件夹名称:', rootFolderName)
              }
              await readDirectoryRecursively(entry, '', allFiles)
            } else {
              allFiles.push(file)
            }
          } else {
            allFiles.push(file)
          }
        }
      }
    }
  } catch (error) {
    console.error('[拖拽] 读取文件失败:', error)
    showDragError.value = true
    setTimeout(() => {
      showDragError.value = false
    }, 5000)
    return
  }

  console.log('[素材读取] 📁 递归读取总文件数量:', allFiles.length)

  if (allFiles.length === 0) {
    console.log('[拖拽] 未检测到文件，请拖拽包含图片素材的文件夹')
    return
  }

  if (allFiles.length > 5000) {
    alert('文件数量过多，请选择文件数量不超过5000的文件夹')
    return
  }

  if (folderInput.value) {
    folderInput.value.value = ''
  }

  await processFolderFiles(allFiles, rootFolderName)
}

async function readDirectoryRecursively(directoryEntry, pathPrefix, resultArray) {
  return new Promise((resolve, reject) => {
    const reader = directoryEntry.createReader()
    reader.readEntries(async (entries) => {
      for (const entry of entries) {
        if (entry.isDirectory) {
          const newPrefix = pathPrefix ? `${pathPrefix}/${entry.name}` : entry.name
          await readDirectoryRecursively(entry, newPrefix, resultArray)
        } else if (entry.isFile) {
          entry.file((file) => {
            Object.defineProperty(file, 'webkitRelativePath', {
              value: pathPrefix ? `${pathPrefix}/${entry.name}` : entry.name,
              writable: false,
              enumerable: true
            })
            resultArray.push(file)
          }, (error) => {
            console.warn(`[读取文件失败] ${entry.name}:`, error)
          })
        }
      }
      resolve()
    }, (error) => {
      console.error('[读取目录失败]', error)
      resolve()
    })
  })
}

async function processFolderFiles(files, selectedRootFolderName = '') {
  console.log('processFolderFiles called, files count:', files.length)
  if (!files || files.length === 0) return

  let rootFolderName = selectedRootFolderName
  
  if (!rootFolderName) {
    if (files[0] && files[0].webkitRelativePath) {
      const pathParts = files[0].webkitRelativePath.split('/')
      rootFolderName = pathParts[0] || '素材文件夹'
    } else {
      rootFolderName = '素材文件夹'
    }
  }

  console.log('[素材读取] 📂 本次选中根文件夹名称:', rootFolderName)

  const shouldProceed = await checkRootFolderChange(rootFolderName)
  if (!shouldProceed) {
    return
  }

  isProcessing.value = true
  processingProgress.value = 0
  processingMessage.value = '正在解析文件夹结构...'
  isCancelled.value = false

  localMaterialRootPath.value = rootFolderName
  localStorage.setItem('product_material_root_path', rootFolderName)

  const imageFiles = files.filter(isValidImageFile)
  totalImageCount.value = imageFiles.length

  if (imageFiles.length > 1000) {
    showSizeWarning.value = true
    return
  }

  await startMaterialProcessing(imageFiles, rootFolderName)
}

function confirmLoadAll() {
  showSizeWarning.value = false
  startMaterialProcessing(pendingFiles)
}

async function startMaterialProcessing(imageFiles, rootFolderName = '') {
  pendingFiles = imageFiles

  currentPhase.value = '目录遍历'
  phaseCurrent.value = 0
  phaseTotal.value = imageFiles.length
  processingProgress.value = 0
  processingMessage.value = '正在遍历目录...'

  const fileInfoList = imageFiles.map(file => ({
    name: file.name,
    webkitRelativePath: file.webkitRelativePath || '',
    size: file.size,
    type: file.type
  }))

  const productModels = store.productModels.map(m => ({ id: m.id, name: m.name }))

  return new Promise((resolve) => {
    if (materialWorker) {
      materialWorker.terminate()
    }

    materialWorker = new Worker(new URL('../workers/materialParser.worker.js', import.meta.url))

    materialWorker.onmessage = async function(e) {
      const { type, payload } = e.data

      if (type === 'progress') {
        phaseCurrent.value = payload.current
        processingProgress.value = Math.round((payload.current / payload.total) * 50)
        processingMessage.value = payload.message
      } else if (type === 'log') {
        if (payload.level === 'debug') {
          console.log(payload.message)
        }
      } else if (type === 'complete') {
        parseStats.value = payload.stats || {
          totalFiles: 0,
          filteredCount: 0,
          validImageCount: 0,
          classifiedCount: 0,
          unclassifiedCount: 0
        }
        unclassifiedList.value = payload.unclassifiedList || []
        await processParsedResults(payload.results, imageFiles)
        resolve()
      }
    }

    materialWorker.onerror = function(error) {
      console.error('[Worker Error]', error)
      processingMessage.value = '解析出错，请重试'
      isProcessing.value = false
      resolve()
    }

    materialWorker.postMessage({
      type: 'parse',
      payload: {
        files: fileInfoList,
        productModels: productModels,
        rootFolderName: rootFolderName
      }
    })
  })
}

async function processParsedResults(parsedResults, originalFiles) {
  currentPhase.value = '图片预览生成'
  phaseCurrent.value = 0
  phaseTotal.value = parsedResults.length
  processingProgress.value = 50
  processingMessage.value = '正在生成图片预览...'

  const newMaterialMap = {}
  const batchSize = 10

  for (let i = 0; i < parsedResults.length; i += batchSize) {
    if (isCancelled.value) {
      console.log('[素材读取] ⏹️ 用户取消了读取操作')
      cleanupAndReset()
      return
    }

    const batch = parsedResults.slice(i, Math.min(i + batchSize, parsedResults.length))
    
    for (const result of batch) {
      if (isCancelled.value) {
        console.log('[素材读取] ⏹️ 用户取消了读取操作')
        cleanupAndReset()
        return
      }

      const originalFile = originalFiles.find(f => f.name === result.name && f.webkitRelativePath === result.webkitRelativePath)
      if (!originalFile) continue

      const targetModelName = result.targetModelName

      if (!newMaterialMap[targetModelName]) {
        newMaterialMap[targetModelName] = []
      }

      try {
        const dataUrl = await readFileAsDataUrl(originalFile)
        newMaterialMap[targetModelName].push({
          id: generateMaterialId(),
          name: result.name,
          localDataUrl: dataUrl,
          isLocal: true,
          size: result.size,
          rootModelFolderName: result.rootModelFolderName,
          fullRelativePath: result.fullRelativePath
        })
      } catch (e) {
        console.warn(`无法读取文件 ${result.name}:`, e)
      }
    }

    phaseCurrent.value = Math.min(i + batchSize, parsedResults.length)
    processingProgress.value = 50 + Math.round((phaseCurrent.value / phaseTotal.value) * 50)
    processingMessage.value = `正在生成图片预览 (${phaseCurrent.value}/${phaseTotal.value})...`
    
    await new Promise(resolve => {
      const timerId = setTimeout(resolve, 80)
      registerTimer(timerId)
    })
  }

  if (isCancelled.value) {
    cleanupAndReset()
    return
  }

  processingProgress.value = 100
  
  const totalValidImages = Object.keys(newMaterialMap).reduce((sum, key) => sum + newMaterialMap[key].length, 0)
  
  if (totalValidImages === 0) {
    processingMessage.value = '未识别到有效图片素材'
    setTimeout(() => {
      alert('未识别到有效图片素材，请检查：\n1. 文件夹层级结构是否正确\n2. 图片格式是否为 jpg/png/webp 等\n3. 目录命名是否符合型号匹配规则（如 E8 Life--BSQ60）')
      cleanupAndReset()
    }, 500)
    return
  }
  
  processingMessage.value = '解析完成'

  localMaterialMap.value = newMaterialMap
  
  console.log('[素材读取] 📊 解析完成')
  console.log('[素材读取] 📊 各机型素材分布:', Object.keys(newMaterialMap).map(key => ({ model: key, count: newMaterialMap[key].length })))
  console.log('[素材读取] 📊 统计信息:', parseStats.value)
  
  if (newMaterialMap['未归类素材'] && newMaterialMap['未归类素材'].length > 0) {
    const unclassifiedFolders = [...new Set(newMaterialMap['未归类素材'].map(f => f.rootModelFolderName))]
    console.log('[素材匹配] ⚠️ 未归类素材文件夹:', unclassifiedFolders)
    console.log('[素材匹配] ⚠️ 未归类素材数量:', newMaterialMap['未归类素材'].length)
  }

  await saveMaterialsToCache(localMaterialRootPath.value)

  const finishTimerId = setTimeout(() => {
    isProcessing.value = false
    processingProgress.value = 0
    processingMessage.value = ''
    currentPhase.value = ''
    phaseCurrent.value = 0
    phaseTotal.value = 0
  }, 1500)
  registerTimer(finishTimerId)
}

function cleanupAndReset() {
  if (materialWorker) {
    materialWorker.terminate()
    materialWorker = null
  }
  
  activeFileReaders.forEach(reader => {
    reader.abort()
  })
  activeFileReaders = []
  
  processingTimers.forEach(timerId => {
    clearTimeout(timerId)
    clearInterval(timerId)
  })
  processingTimers = []
  
  pendingFiles = []
  isProcessing.value = false
  isCancelled.value = false
  processingProgress.value = 0
  processingMessage.value = ''
  currentPhase.value = ''
  phaseCurrent.value = 0
  phaseTotal.value = 0
  showSizeWarning.value = false
  isDragOver.value = false
  showParseDetails.value = false
  parseStats.value = {
    totalFiles: 0,
    filteredCount: 0,
    validImageCount: 0,
    classifiedCount: 0,
    unclassifiedCount: 0
  }
  unclassifiedList.value = []
  
  console.log('[素材读取] ⏹️ 资源已清理')
}

function cancelProcessing() {
  isCancelled.value = true
  processingMessage.value = '取消中...'
  
  if (showSizeWarning.value) {
    showSizeWarning.value = false
    isProcessing.value = false
    return
  }
  
  cleanupAndReset()
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    registerFileReader(reader)
    
    reader.onload = (event) => {
      unregisterFileReader(reader)
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        let width = img.width
        let height = img.height
        
        if (width > MAX_THUMBNAIL_WIDTH) {
          height = (height * MAX_THUMBNAIL_WIDTH) / width
          width = MAX_THUMBNAIL_WIDTH
        }
        
        canvas.width = width
        canvas.height = height
        
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
        
        ctx.drawImage(img, 0, 0, width, height)
        
        const fileName = file.name.toLowerCase()
        const isPng = fileName.endsWith('.png')
        const isGif = fileName.endsWith('.gif')
        const mimeType = isPng || isGif ? 'image/png' : 'image/jpeg'
        const quality = isPng || isGif ? 0.9 : 0.85
        
        const compressedDataUrl = canvas.toDataURL(mimeType, quality)
        
        resolve(compressedDataUrl)
      }
      img.onerror = () => {
        unregisterFileReader(reader)
        reject(new Error('图片加载失败'))
      }
      img.src = event.target.result
    }
    reader.onerror = () => {
      unregisterFileReader(reader)
      reject(new Error('文件读取失败'))
    }
    reader.onabort = () => {
      unregisterFileReader(reader)
      reject(new Error('读取已取消'))
    }
    reader.readAsDataURL(file)
  })
}



function openModelFolder(model) {
  if (!localMaterialRootPath.value) {
    alert('请先配置本地产品素材根目录')
    return
  }
  const folderPath = `${localMaterialRootPath.value}\\${model.name}`
  
  const h = createVNode('div', { class: 'folder-dialog-content' }, [
    createVNode('div', { class: 'folder-path-section' }, [
      createVNode('div', { class: 'folder-label' }, '机型目录层级：'),
      createVNode('div', { class: 'folder-path' }, folderPath)
    ]),
    createVNode('div', { class: 'folder-copy-section' }, [
      createVNode('el-input', {
        modelValue: folderPath,
        readonly: true,
        class: 'folder-copy-input',
        size: 'large'
      }),
      createVNode('el-button', {
        type: 'primary',
        size: 'large',
        onClick: async () => {
          try {
            await navigator.clipboard.writeText(folderPath)
            alert('已复制到剪贴板')
          } catch (e) {
            alert('复制失败，请手动选中复制')
          }
        }
      }, '复制文件夹名')
    ]),
    createVNode('div', { class: 'folder-tips' }, [
      createVNode('p', null, '操作指引：'),
      createVNode('ul', null, [
        createVNode('li', null, '请在你本地素材根目录下，找到对应一级机型文件夹'),
        createVNode('li', null, '浏览器无法获取磁盘绝对路径，无法一键跳转'),
        createVNode('li', null, '复制文件夹名称后，在资源管理器搜索框中搜索定位')
      ])
    ])
  ])
  
  ElMessageBox.alert(
    h,
    '打开本地文件夹',
    {
      confirmButtonText: '我知道了',
      type: 'info',
      customClass: 'folder-dialog',
      dangerouslyUseHTMLString: true
    }
  )
}

function getCertTypeTagType(type) {
  const types = { CE: 'primary', CB: 'success', SASO: 'warning' }
  return types[type] || 'info'
}

function getExpireClass(row) {
  const today = new Date()
  const expire = new Date(row.expireDate)
  const diffDays = Math.floor((expire - today) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'expired'
  if (diffDays <= 7) return 'expiring-7'
  if (diffDays <= 30) return 'expiring-30'
  return ''
}

function handleAddModel() {
  isEditingModel.value = false
  Object.assign(modelForm, {
    id: '',
    name: '',
    chip: '',
    screen: '',
    certifications: [],
    supplier: '',
    imagePath: ''
  })
  showModelDialog.value = true
}

function handleEditModel(row) {
  isEditingModel.value = true
  Object.assign(modelForm, {
    ...row,
    certifications: Array.isArray(row.certifications) ? row.certifications : [],
    materials: Array.isArray(row.materials) ? row.materials : []
  })
  showModelDialog.value = true
}

function handleDeleteModel(row) {
  if (confirm(`确定删除机型 ${row.name} 吗？`)) {
    deleteProductModel(row.id)
  }
}

function batchDeleteModels() {
  if (modelSelection.value.length === 0) return
  if (confirm(`确定批量删除 ${modelSelection.value.length} 个机型？此操作不可恢复`)) {
    modelSelection.value.forEach(row => {
      deleteProductModel(row.id)
    })
    modelSelection.value = []
  }
}

function confirmModel() {
  if (!modelForm.name.trim()) {
    alert('请填写机型名称')
    return
  }
  if (isEditingModel.value) {
    updateProductModel(modelForm)
  } else {
    addProductModel(modelForm)
  }
  showModelDialog.value = false
}

function handleAddCert() {
  isEditingCert.value = false
  Object.assign(certForm, {
    id: '',
    model: '',
    certType: 'CE',
    certNo: '',
    issueDate: new Date().toISOString().split('T')[0],
    expireDate: '',
    organization: '',
    filePath: ''
  })
  showCertDialog.value = true
}

function handleEditCert(row) {
  isEditingCert.value = true
  Object.assign(certForm, row)
  showCertDialog.value = true
}

function handleDeleteCert(row) {
  if (confirm(`确定删除认证 ${row.certNo} 吗？`)) {
    deleteCertRecord(row.id)
  }
}

function confirmCert() {
  if (!certForm.model || !certForm.certNo) {
    alert('请填写关联机型和证书编号')
    return
  }
  if (isEditingCert.value) {
    updateCertRecord(certForm)
  } else {
    addCertRecord(certForm)
  }
  showCertDialog.value = false
}

function handleAddSupplier() {
  isEditingSupplier.value = false
  Object.assign(supplierForm, {
    id: '',
    name: '',
    contact: '',
    phone: '',
    models: [],
    qualification: ''
  })
  showSupplierDialog.value = true
}

function handleEditSupplier(row) {
  isEditingSupplier.value = true
  Object.assign(supplierForm, row)
  showSupplierDialog.value = true
}

function handleDeleteSupplier(row) {
  if (confirm(`确定删除供应商 ${row.name} 吗？`)) {
    deleteSupplier(row.id)
  }
}

function confirmSupplier() {
  if (!supplierForm.name.trim()) {
    alert('请填写供应商名称')
    return
  }
  if (isEditingSupplier.value) {
    updateSupplier(supplierForm)
  } else {
    addSupplier(supplierForm)
  }
  showSupplierDialog.value = false
}

function handleImageUpload(file) {
  uploadFileList.value.push(file)
  return false
}

function getModelIdByName(modelName) {
  const model = store.productModels.find(m => m.name === modelName)
  return model ? model.id : ''
}

function confirmUpload() {
  if (!uploadForm.model) {
    alert('请选择目标机型')
    return
  }
  
  const model = store.productModels.find(m => m.name === uploadForm.model)
  if (model) {
    if (!model.materials) model.materials = []
    model.materials.push(...tempUploadFiles.value)
  }
  
  tempUploadFiles.value = []
  uploadFileList.value = []
  showUploadDialog.value = false
}

function confirmAddMaterial() {
  if (!currentModelForMaterial.value) return
  
  const model = store.productModels.find(m => m.id === currentModelForMaterial.value.id)
  if (model) {
    if (!model.materials) model.materials = []
    model.materials.push(...tempAddMaterialFiles.value)
  }
  
  tempAddMaterialFiles.value = []
  showAddMaterialDialog.value = false
}

function exportModels() {
  const headers = ['ID', '机型名称', '芯片方案', '屏幕参数', '配套认证', '供应商']
  const data = filteredModels.value.map(m => [
    m.id, m.name, m.chip, m.screen, (Array.isArray(m.certifications) ? m.certifications : []).join(','), m.supplier
  ])
  exportToExcel('机型参数库', headers, data)
}

function exportCerts() {
  const headers = ['认证ID', '关联机型', '认证类型', '证书编号', '下发日期', '到期日期', '对接机构']
  const data = filteredCerts.value.map(c => [
    c.id, c.model, c.certType, c.certNo, c.issueDate, c.expireDate, c.organization
  ])
  exportToExcel('合规认证档案', headers, data)
}

function exportSuppliers() {
  const headers = ['ID', '供应商名称', '对接人', '联系方式', '供货机型', '资质文件']
  const data = filteredSuppliers.value.map(s => [
    s.id, s.name, s.contact, s.phone, (Array.isArray(s.models) ? s.models : []).join(','), s.qualification
  ])
  exportToExcel('供应商台账', headers, data)
}

// Excel 导入相关函数

// 机型参数库导入
function triggerModelImport() {
  modelImportInput.value?.click()
}

async function handleModelImport(event) {
  const file = event.target.files[0]
  if (!file) return

  try {
    const result = await importFromExcel(file, {
      fieldMapping: fieldMappingPresets.productModels,
      transformRow: (rowData) => {
        // 处理 certifications 字段，将逗号分隔的字符串转为数组
        if (rowData.certifications && typeof rowData.certifications === 'string') {
          rowData.certifications = rowData.certifications.split(',').map(c => c.trim()).filter(c => c)
        }
        return rowData
      }
    })

    showImportResult(result)

    if (result.success && result.data) {
      // 将导入的数据添加到 store
      result.data.forEach(item => {
        // 检查是否已存在相同 ID 的机型
        const existingIndex = store.productModels.findIndex(m => m.id === item.id)
        if (existingIndex > -1) {
          // 更新现有机型
          Object.assign(store.productModels[existingIndex], item)
        } else {
          // 添加新机型
          addProductModel(item)
        }
      })
    }
  } catch (error) {
    ElMessage.error(`导入失败: ${error.message}`)
  } finally {
    // 清空文件输入
    event.target.value = ''
  }
}

// 合规认证档案导入
function triggerCertImport() {
  certImportInput.value?.click()
}

async function handleCertImport(event) {
  const file = event.target.files[0]
  if (!file) return

  try {
    const result = await importFromExcel(file, {
      fieldMapping: fieldMappingPresets.certRecords
    })

    showImportResult(result)

    if (result.success && result.data) {
      // 将导入的数据添加到 store
      result.data.forEach(item => {
        // 检查是否已存在相同 ID 的认证
        const existingIndex = store.certRecords.findIndex(c => c.id === item.id)
        if (existingIndex > -1) {
          // 更新现有认证
          Object.assign(store.certRecords[existingIndex], item)
        } else {
          // 添加新认证
          addCertRecord(item)
        }
      })
    }
  } catch (error) {
    ElMessage.error(`导入失败: ${error.message}`)
  } finally {
    // 清空文件输入
    event.target.value = ''
  }
}

// 供应商台账导入
function triggerSupplierImport() {
  supplierImportInput.value?.click()
}

async function handleSupplierImport(event) {
  const file = event.target.files[0]
  if (!file) return

  try {
    const result = await importFromExcel(file, {
      fieldMapping: supplierFieldMapping,
      transformRow: (rowData) => {
        // 处理 models 字段，将逗号分隔的字符串转为数组
        if (rowData.models && typeof rowData.models === 'string') {
          rowData.models = rowData.models.split(',').map(m => m.trim()).filter(m => m)
        }
        return rowData
      }
    })

    showImportResult(result)

    if (result.success && result.data) {
      // 将导入的数据添加到 store
      result.data.forEach(item => {
        // 检查是否已存在相同 ID 的供应商
        const existingIndex = store.suppliers.findIndex(s => s.id === item.id)
        if (existingIndex > -1) {
          // 更新现有供应商
          Object.assign(store.suppliers[existingIndex], item)
        } else {
          // 添加新供应商
          addSupplier(item)
        }
      })
    }
  } catch (error) {
    ElMessage.error(`导入失败: ${error.message}`)
  } finally {
    // 清空文件输入
    event.target.value = ''
  }
}

watch(activeTab, (newTab) => {
  if (newTab === 'material' && !localMaterialRootPath.value) {
    setTimeout(() => {
      alert('请先配置本地产品素材根目录\n\n点击右上角「选择素材根目录」按钮，选择包含各机型素材的本地文件夹')
    }, 300)
  }
})

watch(() => store.productModels, () => {}, { deep: true })
watch(() => store.certRecords, () => {}, { deep: true })
watch(() => store.suppliers, () => {}, { deep: true })
</script>

<style scoped>
.product-management {
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

.cert-alerts {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  border-radius: 4px;
  font-size: 14px;
}

.alert-item.danger {
  background: #fef0f0;
  color: #f56c6c;
}

.alert-item.warning {
  background: #fffbe6;
  color: #e6a23c;
}

.material-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.model-section {
  background: #f9fafc;
  padding: 15px;
  border-radius: 8px;
}

.model-section.unclassified-section {
  background: #fff7e6;
  border: 1px dashed #e6a23c;
}

.model-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 15px;
}

.model-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.model-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.model-select-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.model-selected-count {
  font-size: 12px;
  color: #909399;
}

.model-actions {
  display: flex;
  gap: 8px;
}

.root-path-config {
  display: flex;
  gap: 8px;
  margin-left: auto;
  align-items: center;
}

.read-guide {
  font-size: 12px;
  color: #909399;
  margin-left: 5px;
}

.empty-material-overall {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #909399;
  text-align: center;
}

.empty-material-overall p {
  margin: 8px 0 0 0;
}

.empty-material-overall .empty-hint {
  font-size: 12px;
  color: #C0C4CC;
  margin-top: 4px;
}

.empty-material-overall .cache-hint {
  font-size: 11px;
  color: #909399;
  margin-top: 8px;
  line-height: 1.5;
  max-width: 400px;
}

.folder-drop-zone {
  padding: 8px 16px;
  background: linear-gradient(135deg, #409EFF 0%, #66B1FF 100%);
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.folder-drop-zone:hover {
  background: linear-gradient(135deg, #3089E8 0%, #55A8F5 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.folder-drop-zone:active {
  transform: translateY(0);
}

.folder-drop-zone.drag-over {
  background: linear-gradient(135deg, #67C23A 0%, #85CE61 100%);
  transform: scale(1.05);
  box-shadow: 0 8px 20px rgba(103, 194, 58, 0.4);
  border: 2px dashed #fff;
}

.drag-error-tip {
  margin-top: 8px;
  padding: 8px 12px;
  background: #fef0f0;
  border-radius: 4px;
  font-size: 12px;
  color: #f56c6c;
  text-align: center;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.processing-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.processing-content {
  background: white;
  padding: 40px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.processing-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  font-size: 20px;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.processing-close-btn:hover {
  background: rgba(0, 0, 0, 0.2);
  color: #333;
}

.size-warning {
  text-align: center;
}

.warning-icon {
  color: #E6A23C;
  margin-bottom: 16px;
}

.size-warning h3 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 18px;
}

.size-warning p {
  margin: 4px 0;
  color: #606266;
  font-size: 14px;
}

.warning-hint {
  color: #909399 !important;
  font-size: 12px !important;
  margin-top: 8px !important;
}

.warning-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

.progress-display {
  min-width: 300px;
}

.progress-phase {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.phase-label {
  font-size: 14px;
  color: #606266;
}

.phase-count {
  font-size: 14px;
  color: #409EFF;
  font-weight: 500;
}

.processing-text {
  display: block;
  margin-top: 15px;
  font-size: 16px;
  color: #606266;
}

.folder-dialog {
  width: 500px !important;
}

.folder-dialog-content {
  padding: 10px 0;
}

.folder-path-section {
  margin-bottom: 20px;
}

.folder-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.folder-path {
  font-size: 16px;
  font-weight: 500;
  color: #409EFF;
  word-break: break-all;
  padding: 10px 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.folder-copy-section {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.folder-copy-input {
  flex: 1;
}

.folder-tips {
  background: #fffbe6;
  padding: 15px;
  border-radius: 4px;
  border-left: 4px solid #e6a23c;
}

.folder-tips p {
  font-size: 14px;
  font-weight: 500;
  color: #e6a23c;
  margin-bottom: 10px;
}

.folder-tips ul {
  margin: 0;
  padding-left: 20px;
}

.folder-tips li {
  font-size: 13px;
  color: #909399;
  margin-bottom: 5px;
  line-height: 1.6;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}



.file-preview {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.file-info {
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-name {
  font-size: 13px;
  color: #606266;
}

.file-original-folder {
  font-size: 11px;
  color: #909399;
  display: block;
  margin-top: 4px;
}

.file-actions {
  display: flex;
  gap: 4px;
}

.file-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  position: relative;
  transition: all 0.2s ease;
}

.file-card.selected {
  border: 2px solid #409EFF;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.3);
}

.file-card.cached-placeholder {
  opacity: 0.8;
  background: #fafafa;
}

.file-placeholder {
  width: 100%;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #C0C4CC;
}

.cache-placeholder-hint {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f0f9ff;
  border: 1px solid #e0f2fe;
  border-radius: 8px;
  margin-bottom: 16px;
  animation: fadeIn 0.3s ease;
}

.cache-placeholder-hint .hint-icon {
  font-size: 20px;
}

.cache-placeholder-hint .hint-content p {
  margin: 0;
  font-size: 13px;
  color: #606266;
}

.file-checkbox {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
}

.file-card-content {
  position: relative;
}

.file-path-tooltip {
  font-size: 11px;
  color: #909399;
  display: none;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
  border-radius: 4px;
  position: absolute;
  bottom: 100%;
  left: 0;
  z-index: 100;
  margin-bottom: 8px;
  max-width: 300px;
  line-height: 1.5;
}

.tooltip-path {
  color: #fff;
  word-break: break-all;
}

.tooltip-root {
  color: #67C23A;
  margin-top: 4px;
  font-weight: 500;
}

.file-card:hover .file-path-tooltip {
  display: block;
}

.file-path-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 10px;
  border: 6px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.85);
}

.batch-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.batch-label {
  font-size: 13px;
  color: #606266;
}

.empty-material {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #909399;
}

.empty-material p {
  margin-top: 10px;
  font-size: 14px;
}

.expired {
  color: #f56c6c;
  font-weight: bold;
}

.expiring-7 {
  color: #f56c6c;
}

.expiring-30 {
  color: #e6a23c;
}

.parse-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f9fafc;
  border-radius: 6px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.stat-value.filtered {
  color: #f56c6c;
}

.stat-value.valid {
  color: #67C23A;
}

.stat-value.classified {
  color: #409EFF;
}

.stat-value.unclassified {
  color: #E6A23C;
}

.unclassified-section {
  border-top: 1px dashed #d9d9d9;
  padding-top: 16px;
}

.unclassified-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
}

.unclassified-list {
  max-height: 200px;
  overflow-y: auto;
}

.unclassified-item {
  display: flex;
  flex-direction: column;
  padding: 6px 0;
  border-bottom: 1px solid #f0f0f0;
}

.unclassified-item:last-child {
  border-bottom: none;
}

.item-name {
  font-size: 13px;
  color: #303133;
}

.item-path {
  font-size: 11px;
  color: #909399;
  word-break: break-all;
}

.list-more {
  text-align: center;
  padding: 8px;
  font-size: 12px;
  color: #909399;
}
</style>