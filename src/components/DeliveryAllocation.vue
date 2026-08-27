<template>
  <div class="delivery-allocation">
    <div class="search-bar">
      <el-input v-model="filterPo" placeholder="订单编号" clearable style="width: 160px" />
      <el-input v-model="filterPoCi" placeholder="CI编号" clearable style="width: 140px" />
      <el-select v-model="filterProductName" placeholder="产品名称" clearable style="width: 130px">
        <el-option v-for="p in productNameOptions" :key="p" :label="p" :value="p" />
      </el-select>
      <el-select v-model="filterModel" placeholder="型号" clearable style="width: 130px">
        <el-option v-for="m in modelOptions" :key="m" :label="m" :value="m" />
      </el-select>
      <el-select v-model="filterCustomer" placeholder="客户" clearable style="width: 120px">
        <el-option v-for="c in customerOptions" :key="c" :label="c" :value="c" />
      </el-select>
      <el-select v-model="filterCountry" placeholder="国家" clearable style="width: 110px">
        <el-option v-for="c in countryOptions" :key="c" :label="c" :value="c" />
      </el-select>
      <el-select v-model="filterLogistics" placeholder="物流方式" clearable style="width: 120px">
        <el-option v-for="l in logisticsOptions" :key="l" :label="l" :value="l" />
      </el-select>
      <el-select v-model="filterStatus" placeholder="订单状态" clearable style="width: 120px">
        <el-option label="待分配" value="pending" />
        <el-option label="部分分配" value="partial" />
        <el-option label="已完成" value="completed" />
      </el-select>
      <el-select v-model="filterProductionStatus" placeholder="生产状态" clearable style="width: 110px">
        <el-option label="未生产" value="未生产" />
        <el-option label="生产中" value="生产中" />
        <el-option label="已发货" value="已发货" />
        <el-option label="已完成" value="已完成" />
      </el-select>
      <el-button type="primary" @click="resetFilters">重置</el-button>
      <el-button @click="showAdvancedColumns = !showAdvancedColumns">
        {{ showAdvancedColumns ? '收起详情' : '展开详情' }}
      </el-button>
      <div class="spacer"></div>
      <el-button type="primary" @click="handleAdd">新增分配</el-button>
      <el-button @click="downloadTemplate">下载模板</el-button>
      <el-button @click="triggerImport">导入Excel</el-button>
      <el-button @click="handleExport">导出Excel</el-button>
      <el-button type="danger" :disabled="selection.length === 0" @click="batchDelete">
        批量删除<template v-if="selection.length > 0">({{ selection.length }})</template>
      </el-button>
    </div>

    <input ref="fileInputRef" type="file" accept=".xlsx,.xls" style="display: none" @change="handleImport" />

    <div class="table-toolbar">
      <el-checkbox :model-value="selectAllState" :indeterminate="indeterminateState" @change="handleSelectAll">
        全选
      </el-checkbox>
      <el-button size="small" @click="invertSelection">反选</el-button>
      <el-button size="small" @click="clearSelection">清空</el-button>
      <span class="selection-count">已选中 {{ selection.length }} 条</span>
      <span class="total-count">共 {{ filteredData.length }} 条数据</span>
    </div>

    <el-table
      :data="filteredData"
      border
      stripe
      header-cell-class-name="table-header"
      @selection-change="val => selection = val"
      v-loading="loading"
    >
      <el-table-column type="selection" width="45" reserve-selection />
      <el-table-column prop="id" label="分配编号" width="130" fixed />
      <el-table-column prop="poNumber" label="订单编号" width="140">
        <template #default="{ row }">
          <el-tooltip :content="row.poNumber" placement="top">
            <span>{{ row.poNumber }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column prop="orderDate" label="订单日期" width="110">
        <template #default="{ row }">
          <span>{{ row.orderDate || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="productName" label="产品名称" width="110">
        <template #default="{ row }">
          <span>{{ row.productName || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="model" label="型号" width="110">
        <template #default="{ row }">
          <span>{{ row.model || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="specModel" label="规格型号" width="160" show-overflow-tooltip>
        <template #default="{ row }">
          <span>{{ row.specModel || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="memoryConfig" label="内存配置" width="100">
        <template #default="{ row }">
          <span>{{ row.memoryConfig || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="orderQty" label="数量" width="90" align="right">
        <template #default="{ row }">
          <span>{{ row.orderQty || 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="destinationCountry" label="国家" width="90">
        <template #default="{ row }">
          <span>{{ row.destinationCountry || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="plugSpec" label="插头" width="80">
        <template #default="{ row }">
          <el-tag size="small">{{ row.plugSpec || '-' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="promisedDate" label="承诺交期" width="110">
        <template #default="{ row }">
          <span>{{ row.promisedDate || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="productionStatus" label="生产完成" width="100">
        <template #default="{ row }">
          <el-tag 
            size="small" 
            :type="getProductionStatusType(row.productionStatus)"
          >{{ row.productionStatus || '-' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="warehouseStatus" label="入库" width="100">
        <template #default="{ row }">
          <el-tag 
            size="small" 
            :type="getWarehouseStatusType(row.warehouseStatus)"
          >{{ row.warehouseStatus || '-' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="ciNumber" label="CI编号" width="130" v-if="showAdvancedColumns">
        <template #default="{ row }">
          <span>{{ row.ciNumber || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="customerName" label="客户名称" width="110" v-if="showAdvancedColumns" />
      <el-table-column prop="customerGroup" label="客户分组" width="130" v-if="showAdvancedColumns">
        <template #default="{ row }">
          <el-tag size="small" type="info">{{ row.customerGroup || '-' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="hwConfig" label="硬件配置+颜色" width="140" v-if="showAdvancedColumns">
        <template #default="{ row }">
          <span>{{ row.hwConfig || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="allocatedQty" label="本次分配数量" width="110" align="right" v-if="showAdvancedColumns">
        <template #default="{ row }">
          <span class="text-primary">{{ row.allocatedQty || 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column label="欠货数量" width="100" align="right" v-if="showAdvancedColumns">
        <template #default="{ row }">
          <span :class="{ 'text-danger': getShortage(row) > 0 }">{{ getShortage(row) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="warehouse" label="发货仓库" width="100" v-if="showAdvancedColumns">
        <template #default="{ row }">
          <span>{{ row.warehouse || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="logistics" label="物流渠道" width="110" v-if="showAdvancedColumns">
        <template #default="{ row }">
          <el-tag size="small" :type="getLogisticsTagType(row.logistics)">{{ row.logistics || '-' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="certRemark" label="清关认证备注" width="160" show-overflow-tooltip v-if="showAdvancedColumns">
        <template #default="{ row }">
          <span>{{ row.certRemark || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="isSample" label="是否样机" width="90" v-if="showAdvancedColumns">
        <template #default="{ row }">
          <el-tag size="small" :type="row.isSample === '是' ? 'warning' : 'info'">{{ row.isSample || '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" width="140" show-overflow-tooltip v-if="showAdvancedColumns">
        <template #default="{ row }">
          <span>{{ row.remark || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" @click="handlePreview(row)">预览</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="showFormDialog"
      :title="isEditing ? '编辑出货分配' : '新增出货分配'"
      width="900px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="130px" :disabled="formDisabled">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="分配编号">
              <el-input v-model="form.id" disabled placeholder="自动生成" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="订单编号" prop="poNumber">
              <el-select
                v-model="form.poNumber"
                filterable
                placeholder="选择订单编号"
                @change="onPoChange"
                style="width: 100%"
              >
                <el-option
                  v-for="o in poOptions"
                  :key="o.id"
                  :label="`${o.id} | ${o.model} | ${o.qty}件 | 已出货${o.deliveredQty} | 剩余${o.remainingQty}`"
                  :value="o.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="订单日期">
              <el-date-picker
                v-model="form.orderDate"
                type="date"
                placeholder="选择日期"
                format="YYYY/MM/DD"
                value-format="YYYY/MM/DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="产品名称" prop="productName">
              <el-select v-model="form.productName" filterable placeholder="选择产品" style="width: 100%">
                <el-option v-for="p in productNameOptions" :key="p" :label="p" :value="p" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="型号" prop="model">
              <el-select 
                v-model="form.model" 
                filterable 
                placeholder="选择型号" 
                @change="onModelChange" 
                style="width: 100%"
                :disabled="!!form.poNumber"
              >
                <el-option v-for="m in filteredModelOptions" :key="m" :label="m" :value="m" />
              </el-select>
              <div v-if="form.poNumber" class="form-tip">已根据订单自动锁定型号</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="规格型号">
              <el-input v-model="form.specModel" placeholder="如：Black, Blue Black等" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="内存配置">
              <el-select 
                v-model="form.memoryConfig" 
                filterable 
                allow-create 
                placeholder="如：4+128, 6+128" 
                style="width: 100%"
                :disabled="!form.model"
              >
                <el-option v-for="c in filteredMemoryConfigOptions" :key="c" :label="c" :value="c" />
              </el-select>
              <div v-if="!form.model" class="form-tip">请先选择型号</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="数量" prop="orderQty">
              <el-input-number v-model="form.orderQty" :min="0" :step="10" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="国家">
              <el-select v-model="form.destinationCountry" filterable placeholder="选择国家" style="width: 100%">
                <el-option v-for="c in countryOptions" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="插头" prop="plugSpec">
              <el-select
                v-model="form.plugSpec"
                :disabled="isMiddleEastCountry(form.destinationCountry)"
                placeholder="选择插头规格"
                style="width: 100%"
              >
                <el-option label="英规" value="英规" />
                <el-option label="欧规" value="欧规" />
                <el-option label="美规" value="美规" />
                <el-option label="中规" value="中规" />
                <el-option label="印度规" value="印度规" />
                <el-option label="南非规" value="南非规" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="承诺交期">
              <el-date-picker
                v-model="form.promisedDate"
                type="date"
                placeholder="选择交期"
                format="M月D日"
                value-format="M月D日"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="生产完成">
              <el-select v-model="form.productionStatus" placeholder="选择状态" style="width: 100%">
                <el-option label="未生产" value="未生产" />
                <el-option label="生产中" value="生产中" />
                <el-option label="已发货" value="已发货" />
                <el-option label="已完成" value="已完成" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="入库">
              <el-select v-model="form.warehouseStatus" placeholder="选择入库状态" style="width: 100%">
                <el-option label="未入库" value="未入库" />
                <el-option label="部分入库" value="部分入库" />
                <el-option label="已入库" value="已入库" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="客户名称">
              <el-select v-model="form.customerName" filterable placeholder="选择客户" @change="onCustomerChange" style="width: 100%">
                <el-option v-for="c in allCustomerOptions" :key="c.name" :label="c.name" :value="c.name" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="CI编号">
              <el-input v-model="form.ciNumber" placeholder="请输入CI编号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider content-position="left">详细信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="客户分组">
              <el-input v-model="form.customerGroup" disabled placeholder="选择客户后自动填充" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="本次分配数量">
              <el-input-number v-model="form.allocatedQty" :min="0" :step="10" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="欠货数量">
              <el-input :model-value="getFormShortage()" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="发货仓库">
              <el-select v-model="form.warehouse" placeholder="选择仓库" style="width: 100%">
                <el-option label="深圳仓" value="深圳仓" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="物流渠道">
              <el-select v-model="form.logistics" placeholder="选择物流方式" style="width: 100%">
                <el-option v-for="l in logisticsOptions" :key="l" :label="l" :value="l" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="是否样机">
              <el-radio-group v-model="form.isSample">
                <el-radio value="否">否</el-radio>
                <el-radio value="是">是</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="清关认证备注">
              <el-input
                :model-value="form.certRemark"
                type="textarea"
                :rows="2"
                placeholder="选择目的国家后自动填充"
                @click="onCertRemarkClick"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注信息" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider content-position="left">各目的国发货数量分配</el-divider>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="沙特发货">
              <el-input-number v-model="form.saudiQty" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="阿联酋发货">
              <el-input-number v-model="form.uaeQty" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="阿曼/巴林/科威特">
              <el-input-number v-model="form.omanQty" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="卡塔尔发货">
              <el-input-number v-model="form.qatarQty" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="黎巴嫩发货">
              <el-input-number v-model="form.lebanonQty" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="数量合计">
              <el-input :model-value="getCountryTotal()" disabled />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="showFormDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmForm">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showPreviewDialog" title="出货分配详情预览" width="900px" :close-on-click-modal="false">
      <div class="preview-container" v-if="previewData">
        <div class="preview-header">
          <h2>出货分配详情</h2>
          <p>分配编号：{{ previewData.id }} | 预览时间：{{ currentDateTime }}</p>
        </div>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="分配编号">{{ previewData.id }}</el-descriptions-item>
          <el-descriptions-item label="订单编号">{{ previewData.poNumber }}</el-descriptions-item>
          <el-descriptions-item label="订单日期">{{ previewData.orderDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="产品名称">{{ previewData.productName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="型号">{{ previewData.model }}</el-descriptions-item>
          <el-descriptions-item label="规格型号">{{ previewData.specModel || '-' }}</el-descriptions-item>
          <el-descriptions-item label="内存配置">{{ previewData.memoryConfig || '-' }}</el-descriptions-item>
          <el-descriptions-item label="数量">{{ previewData.orderQty }}</el-descriptions-item>
          <el-descriptions-item label="国家">{{ previewData.destinationCountry || '-' }}</el-descriptions-item>
          <el-descriptions-item label="插头">{{ previewData.plugSpec || '-' }}</el-descriptions-item>
          <el-descriptions-item label="承诺交期">{{ previewData.promisedDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="生产完成">{{ previewData.productionStatus || '-' }}</el-descriptions-item>
          <el-descriptions-item label="入库">{{ previewData.warehouseStatus || '-' }}</el-descriptions-item>
          <el-descriptions-item label="CI编号">{{ previewData.ciNumber || '-' }}</el-descriptions-item>
          <el-descriptions-item label="客户名称">{{ previewData.customerName || '-' }}</el-descriptions-item>
        </el-descriptions>
        <el-divider content-position="left">详细信息</el-divider>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="客户分组">{{ previewData.customerGroup || '-' }}</el-descriptions-item>
          <el-descriptions-item label="硬件配置+颜色">{{ previewData.hwConfig || '-' }}</el-descriptions-item>
          <el-descriptions-item label="本次分配数量">{{ previewData.allocatedQty || 0 }}</el-descriptions-item>
          <el-descriptions-item label="欠货数量">
            <span :class="{ 'text-danger': getShortage(previewData) > 0 }">{{ getShortage(previewData) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="发货仓库">{{ previewData.warehouse }}</el-descriptions-item>
          <el-descriptions-item label="物流渠道">{{ previewData.logistics }}</el-descriptions-item>
          <el-descriptions-item label="是否样机">{{ previewData.isSample || '否' }}</el-descriptions-item>
        </el-descriptions>
        <el-divider content-position="left">各目的国发货分配</el-divider>
        <el-table :data="countryDistributionRows" border size="small" :header-cell-style="{ background: '#f5f7fa' }">
          <el-table-column prop="country" label="目的国家" width="200" />
          <el-table-column prop="qty" label="发货数量" align="right" width="150" />
          <el-table-column prop="percent" label="占比" align="right" width="150">
            <template #default="{ row }">
              <el-progress :percentage="row.percent" :stroke-width="14" />
            </template>
          </el-table-column>
        </el-table>
        <el-divider content-position="left">清关认证与备注</el-divider>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="清关认证备注">{{ previewData.certRemark || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ previewData.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="showPreviewDialog = false">关闭</el-button>
        <el-button type="primary" @click="printPreview">打印</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showImportDialog" title="Excel导入" width="500px">
      <div class="import-area">
        <el-upload
          drag
          :auto-upload="false"
          :on-change="handleFileSelect"
          :file-list="importFileList"
          :on-remove="handleFileRemove"
          accept=".xlsx,.xls"
        >
          <el-icon class="el-icon--upload"><Upload /></el-icon>
          <div class="el-upload__text">拖拽Excel文件到此处，或<em>点击上传</em></div>
          <template #tip>
            <div class="el-upload__tip">仅支持 .xlsx / .xls 格式，请先下载模板填写</div>
          </template>
        </el-upload>
        <div class="import-actions">
          <el-button @click="downloadTemplate">下载模板</el-button>
          <el-button type="primary" :disabled="importFileList.length === 0" @click="confirmImport">确认导入</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import ExcelJS from 'exceljs'
import { store } from '../store.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'
import { importFromExcel, fieldMappingPresets, showImportResult } from '../utils/excelImport.js'

const loading = ref(false)
const selection = ref([])
const showFormDialog = ref(false)
const showPreviewDialog = ref(false)
const showImportDialog = ref(false)
const isEditing = ref(false)
const formRef = ref(null)
const fileInputRef = ref(null)
const importFileList = ref([])
const showAdvancedColumns = ref(true)
const currentDateTime = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
})

const PRESET_CUSTOMER_GROUPS = [
  '中东沙特组',
  '阿联酋UAE组',
  '阿曼/巴林/科威特组',
  '卡塔尔组',
  '黎巴嫩组',
  '欧洲客户组',
  '东南亚客户组'
]

const MIDDLE_EAST_COUNTRIES = ['沙特', '阿联酋', '阿曼', '巴林', '科威特', '卡塔尔', '黎巴嫩']

const modelOptions = ['NE75', 'E9 Plus', 'L05', 'E6 Star', 'NE76', 'E7 Elite', 'MTK6500', 'HTC E7', 'E7 Lite (5G)', 'E5 Elite', 'E9', 'E9 Plus', 'E7 Life']
const logisticsOptions = ['DHL', '海运', '空运', '顺丰拼柜']
const productNameOptions = ['智能手机主机', '平板电脑', '智能手表', '其他']
const memoryConfigOptions = ['4+128', '6+128', '8+256', '12+256', '4+64', '6+256']

const filterPo = ref('')
const filterPoCi = ref('')
const filterProductName = ref('')
const filterModel = ref('')
const filterCustomer = ref('')
const filterCountry = ref('')
const filterLogistics = ref('')
const filterStatus = ref('')
const filterProductionStatus = ref('')

const allCustomerOptions = computed(() => {
  const map = new Map()
  store.customers.forEach(c => {
    if (c.name && !map.has(c.name)) {
      map.set(c.name, {
        name: c.name,
        group: c.group || '',
        country: c.country || ''
      })
    }
  })
  return Array.from(map.values())
})

const customerOptions = computed(() => {
  const names = store.customers.map(c => c.name).filter(Boolean)
  return [...new Set(names)]
})

const countryOptions = computed(() => {
  const countries = store.customers.map(c => c.country).filter(Boolean)
  const all = [...MIDDLE_EAST_COUNTRIES, ...countries]
  return [...new Set(all)]
})

const allModelOptions = computed(() => {
  const models = store.productModels.map(m => m.name).filter(Boolean)
  return [...new Set([...modelOptions, ...models])]
})

const poOptions = computed(() => {
  return store.salesOrders.filter(o => o.status !== 'completed').map(o => {
    // 计算该订单的已出货数量
    const deliveredQty = store.deliveryAllocations
      .filter(a => a.poNumber === o.id)
      .reduce((sum, a) => sum + (a.allocatedQty || 0), 0)
    const remainingQty = (o.qty || 0) - deliveredQty
    
    return {
      id: o.id,
      customerName: o.customerName,
      model: o.model,
      qty: o.qty,
      status: o.status,
      deliveredQty,
      remainingQty,
      // 如果该订单已完成所有出货，则标记为 completed
      allDelivered: remainingQty <= 0
    }
  }).filter(o => !o.allDelivered) // 只显示未完成的订单
})

// 基于所选订单的型号选项（只显示订单中存在的型号）
const filteredModelOptions = computed(() => {
  if (!form.poNumber) {
    return allModelOptions.value
  }
  
  const order = poOptions.value.find(o => o.id === form.poNumber)
  if (!order) {
    return allModelOptions.value
  }
  
  // 只显示该订单的型号
  return [order.model]
})

// 基于型号的内存配置选项
const filteredMemoryConfigOptions = computed(() => {
  if (!form.model) {
    return memoryConfigOptions
  }
  
  // 从产品型号库中查找该型号支持的内存配置
  const product = store.productModels.find(p => p.name === form.model)
  if (product && product.memoryConfigs && product.memoryConfigs.length > 0) {
    return product.memoryConfigs
  }
  
  // 默认返回所有内存配置选项
  return memoryConfigOptions
})

const selectAllState = computed(() => {
  if (filteredData.value.length === 0) return false
  return selection.value.length === filteredData.value.length
})

const indeterminateState = computed(() => {
  return selection.value.length > 0 && selection.value.length < filteredData.value.length
})

const filteredData = computed(() => {
  return store.deliveryAllocations.filter(item => {
    if (filterPo.value && !item.poNumber.toLowerCase().includes(filterPo.value.toLowerCase())) return false
    if (filterPoCi.value && !(item.ciNumber || '').toLowerCase().includes(filterPoCi.value.toLowerCase())) return false
    if (filterProductName.value && item.productName !== filterProductName.value) return false
    if (filterModel.value && item.model !== filterModel.value) return false
    if (filterCustomer.value && item.customerName !== filterCustomer.value) return false
    if (filterCountry.value && item.destinationCountry !== filterCountry.value) return false
    if (filterLogistics.value && item.logistics !== filterLogistics.value) return false
    if (filterProductionStatus.value && item.productionStatus !== filterProductionStatus.value) return false
    if (filterStatus.value) {
      const allocated = item.allocatedQty || 0
      const order = item.orderQty || 0
      if (filterStatus.value === 'pending' && allocated > 0) return false
      if (filterStatus.value === 'partial' && (allocated === 0 || allocated >= order)) return false
      if (filterStatus.value === 'completed' && allocated < order) return false
    }
    return true
  })
})

const rules = {
  poNumber: [{ required: true, message: '请选择PO编号', trigger: 'change' }],
  ciNumber: [{ required: true, message: '请输入CI编号', trigger: 'blur' }],
  customerName: [{ required: true, message: '请选择客户', trigger: 'change' }],
  model: [{ required: true, message: '请选择机型', trigger: 'change' }],
  orderQty: [{ required: true, message: '请输入订单总数量', trigger: 'blur' }],
  allocatedQty: [{ required: true, message: '请输入分配数量', trigger: 'blur' }]
}

const emptyForm = () => ({
  id: '',
  poNumber: '',
  orderDate: '',
  productName: '智能手机主机',
  model: '',
  specModel: '',
  memoryConfig: '',
  orderQty: 0,
  destinationCountry: '',
  plugSpec: '英规',
  promisedDate: '',
  productionStatus: '未生产',
  warehouseStatus: '未入库',
  ciNumber: '',
  customerName: '',
  customerGroup: '',
  hwConfig: '',
  allocatedQty: 0,
  warehouse: '深圳仓',
  logistics: '',
  saudiQty: 0,
  uaeQty: 0,
  omanQty: 0,
  qatarQty: 0,
  lebanonQty: 0,
  certRemark: '',
  isSample: '否',
  remark: ''
})

const form = reactive(emptyForm())

const previewData = ref(null)

const countryDistributionRows = computed(() => {
  if (!previewData.value) return []
  const rows = []
  const countries = [
    { key: 'saudiQty', country: '沙特' },
    { key: 'uaeQty', country: '阿联酋' },
    { key: 'omanQty', country: '阿曼/巴林/科威特' },
    { key: 'qatarQty', country: '卡塔尔' },
    { key: 'lebanonQty', country: '黎巴嫩' }
  ]
  countries.forEach(c => {
    const qty = previewData.value[c.key] || 0
    if (qty > 0) {
      rows.push({
        country: c.country,
        qty,
        percent: Math.round((qty / (previewData.value.allocatedQty || 1)) * 100)
      })
    }
  })
  return rows
})

const formDisabled = computed(() => false)

onMounted(() => {
  if (!store.deliveryAllocations) {
    store.deliveryAllocations = []
  }
})

function getShortage(row) {
  return (row.orderQty || 0) - (getAlreadyAllocated(row) + (row.allocatedQty || 0))
}

function getAlreadyAllocated(row) {
  return store.deliveryAllocations
    .filter(a => a.poNumber === row.poNumber && a.id !== row.id)
    .reduce((sum, a) => sum + (a.allocatedQty || 0), 0)
}

function getFormShortage() {
  const alreadyAllocated = store.deliveryAllocations
    .filter(a => a.poNumber === form.poNumber && a.id !== form.id)
    .reduce((sum, a) => sum + (a.allocatedQty || 0), 0)
  return (form.orderQty || 0) - alreadyAllocated - (form.allocatedQty || 0)
}

function getCountryTotal() {
  return (form.saudiQty || 0) + (form.uaeQty || 0) + (form.omanQty || 0) + (form.qatarQty || 0) + (form.lebanonQty || 0)
}

function isMiddleEastCountry(country) {
  return MIDDLE_EAST_COUNTRIES.includes(country)
}

function getLogisticsTagType(logistics) {
  const map = { 'DHL': 'primary', '海运': 'success', '空运': 'warning', '顺丰拼柜': 'info' }
  return map[logistics] || ''
}

function getProductionStatusType(status) {
  const map = {
    '未生产': 'info',
    '生产中': 'warning',
    '已发货': 'success',
    '已完成': ''
  }
  return map[status] || 'info'
}

function getWarehouseStatusType(status) {
  const map = {
    '未入库': 'info',
    '部分入库': 'warning',
    '已入库': 'success'
  }
  return map[status] || 'info'
}

function generateAllocationId() {
  const now = new Date()
  const ymd = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0')
  const prefix = 'FP' + ymd
  const existing = store.deliveryAllocations
    .filter(a => a.id && a.id.startsWith(prefix))
    .map(a => {
      const match = a.id.match(/(\d{4})$/)
      return match ? parseInt(match[1]) : 0
    })
  const seq = (existing.length > 0 ? Math.max(...existing) : 0) + 1
  return prefix + String(seq).padStart(4, '0')
}

function getCertRemarkByCountry(country) {
  const map = {
    '沙特': 'SASO认证',
    '阿联酋': 'CE+RED认证',
    '阿曼': 'CB认证',
    '巴林': 'CB认证',
    '科威特': 'CB认证',
    '卡塔尔': 'CB认证',
    '黎巴嫩': 'CB认证'
  }
  const base = map[country] || ''
  if (base) {
    return `${base}；UN38.3/MSDS`
  }
  return ''
}

function onCustomerChange(name) {
  const customer = allCustomerOptions.value.find(c => c.name === name)
  if (customer) {
    form.customerGroup = customer.group || ''
    form.destinationCountry = customer.country || ''
    form.plugSpec = isMiddleEastCountry(customer.country) ? '英规' : form.plugSpec
    form.certRemark = getCertRemarkByCountry(customer.country)
  }
}

function onPoChange(poId) {
  const order = poOptions.value.find(o => o.id === poId)
  if (order) {
    // 填充客户信息
    form.customerName = order.customerName
    
    // 自动锁定型号
    form.model = order.model
    
    // 设置订单数量为剩余未出货数量
    form.orderQty = order.remainingQty > 0 ? order.remainingQty : order.qty
    form.allocatedQty = 0
    
    // 自动选择产品名称
    const product = store.productModels.find(p => p.name === order.model)
    if (product) {
      form.productName = '智能手机主机'
    }
    
    // 重置内存配置（需要用户重新选择）
    form.memoryConfig = ''
    form.specModel = ''
    
    // 触发客户变更逻辑
    onCustomerChange(order.customerName)
    
    // 显示提示
    if (order.deliveredQty > 0) {
      ElMessage.info(`订单已出货 ${order.deliveredQty} 件，剩余 ${order.remainingQty} 件待出货`)
    }
  }
}

function onModelChange(model) {
  if (!model) {
    form.memoryConfig = ''
    return
  }
  
  // 自动填充硬件配置
  const product = store.productModels.find(p => p.name === model)
  if (product) {
    form.hwConfig = `${product.chip || ''} / ${product.screen || ''}`
    
    // 如果该型号支持的内存配置只有一个，自动选中
    if (product.memoryConfigs && product.memoryConfigs.length === 1) {
      form.memoryConfig = product.memoryConfigs[0]
    }
  }
}

function onCertRemarkClick() {
  if (form.destinationCountry) {
    form.certRemark = getCertRemarkByCountry(form.destinationCountry)
  }
}

function resetFilters() {
  filterPo.value = ''
  filterPoCi.value = ''
  filterProductName.value = ''
  filterModel.value = ''
  filterCustomer.value = ''
  filterCountry.value = ''
  filterLogistics.value = ''
  filterStatus.value = ''
  filterProductionStatus.value = ''
}

function handleAdd() {
  isEditing.value = false
  Object.assign(form, emptyForm())
  form.id = generateAllocationId()
  showFormDialog.value = true
}

function handleEdit(row) {
  isEditing.value = true
  Object.assign(form, JSON.parse(JSON.stringify(row)))
  showFormDialog.value = true
}

function handlePreview(row) {
  previewData.value = row
  showPreviewDialog.value = true
}

function handleDelete(row) {
  ElMessageBox.confirm(
    `确定删除分配记录 ${row.id} 吗？此操作不可恢复。`,
    '确认删除',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    const idx = store.deliveryAllocations.findIndex(a => a.id === row.id)
    if (idx > -1) {
      store.deliveryAllocations.splice(idx, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {})
}

function handleSelectAll(val) {
  if (val) {
    selection.value = [...filteredData.value]
  } else {
    selection.value = []
  }
}

function invertSelection() {
  const filteredIds = filteredData.value.map(a => a.id)
  const selectedIds = new Set(selection.value.map(a => a.id))
  selection.value = filteredData.value.filter(a => !selectedIds.has(a.id))
}

function clearSelection() {
  selection.value = []
}

function batchDelete() {
  if (selection.value.length === 0) {
    ElMessage.warning('请先勾选需要操作的数据')
    return
  }
  ElMessageBox.confirm(
    `已勾选 ${selection.value.length} 条数据，删除不可恢复，确认执行？`,
    '批量删除确认',
    { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    const ids = new Set(selection.value.map(a => a.id))
    for (let i = store.deliveryAllocations.length - 1; i >= 0; i--) {
      if (ids.has(store.deliveryAllocations[i].id)) {
        store.deliveryAllocations.splice(i, 1)
      }
    }
    selection.value = []
    ElMessage.success('批量删除成功')
  }).catch(() => {})
}

async function confirmForm() {
  if (!form.customerName) {
    ElMessage.warning('请选择客户')
    return
  }
  if (!form.poNumber) {
    ElMessage.warning('请选择PO编号')
    return
  }
  if (!form.ciNumber) {
    ElMessage.warning('请输入CI编号')
    return
  }
  if (!form.model) {
    ElMessage.warning('请选择机型')
    return
  }
  if (!form.orderQty || form.orderQty <= 0) {
    ElMessage.warning('请输入有效的订单总数量')
    return
  }
  if (form.allocatedQty <= 0) {
    ElMessage.warning('请输入有效的分配数量')
    return
  }

  if (!isEditing.value) {
    store.deliveryAllocations.push({ ...JSON.parse(JSON.stringify(form)) })
    ElMessage.success('新增成功')
  } else {
    const idx = store.deliveryAllocations.findIndex(a => a.id === form.id)
    if (idx > -1) {
      store.deliveryAllocations[idx] = { ...JSON.parse(JSON.stringify(form)) }
      ElMessage.success('更新成功')
    }
  }
  showFormDialog.value = false
}

async function handleExport() {
  if (filteredData.value.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }

  loading.value = true
  try {
    const workbook = new ExcelJS.Workbook()
    const sheetName = '出货分配台账'
    const worksheet = workbook.addWorksheet(sheetName)

    const headers = [
      '分配编号', '订单编号', '订单日期', '产品名称', '型号',
      '规格型号', '内存配置', '数量', '国家', '插头',
      '承诺交期', '生产完成', '入库', 'CI编号', '客户名称',
      '客户分组', '硬件配置+颜色', '本次分配数量', '欠货数量',
      '发货仓库', '物流渠道', '沙特发货数量', '阿联酋发货数量',
      '阿曼/巴林/科威特发货数量', '卡塔尔发货数量', '黎巴嫩发货数量',
      '清关认证备注', '是否样机', '备注'
    ]

    const titleRow = worksheet.addRow([`${sheetName} - ${new Date().toLocaleDateString('zh-CN')}`])
    titleRow.font = { name: '微软雅黑', size: 16, bold: true, color: { argb: 'FF1a1a2e' } }
    titleRow.alignment = { horizontal: 'center' }
    worksheet.mergeCells(`A1:${String.fromCharCode(64 + headers.length)}1`)

    worksheet.addRow([])

    const headerRow = worksheet.addRow(headers)
    headerRow.font = { name: '微软雅黑', size: 12, bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a1a2e' } }
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
    headerRow.height = 28

    filteredData.value.forEach(row => {
      const shortage = getShortage(row)
      worksheet.addRow([
        row.id,
        row.poNumber,
        row.orderDate || '',
        row.productName || '',
        row.model,
        row.specModel || '',
        row.memoryConfig || '',
        row.orderQty || 0,
        row.destinationCountry || '',
        row.plugSpec || '',
        row.promisedDate || '',
        row.productionStatus || '',
        row.warehouseStatus || '',
        row.ciNumber || '',
        row.customerName || '',
        row.customerGroup || '',
        row.hwConfig || '',
        row.allocatedQty || 0,
        shortage,
        row.warehouse || '',
        row.logistics || '',
        row.saudiQty || 0,
        row.uaeQty || 0,
        row.omanQty || 0,
        row.qatarQty || 0,
        row.lebanonQty || 0,
        row.certRemark || '',
        row.isSample || '否',
        row.remark || ''
      ])
    })

    const colWidths = [16, 14, 12, 12, 12, 16, 10, 8, 10, 8, 12, 10, 10, 14, 12, 14, 16, 12, 10, 10, 12, 12, 12, 18, 12, 12, 20, 10, 16]
    headers.forEach((_, i) => {
      const col = worksheet.getColumn(i + 1)
      col.width = colWidths[i] || 12
      col.alignment = { vertical: 'middle' }
    })

    const lastRow = filteredData.value.length + 2
    const range = worksheet.getCell(`A3:${String.fromCharCode(64 + headers.length)}${lastRow}`)
    range.border = {
      top: { style: 'thin', color: { argb: 'FFd0d0d0' } },
      left: { style: 'thin', color: { argb: 'FFd0d0d0' } },
      bottom: { style: 'thin', color: { argb: 'FFd0d0d0' } },
      right: { style: 'thin', color: { argb: 'FFd0d0d0' } }
    }

    worksheet.freezePanes = 'A3'

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const today = new Date()
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
    a.download = `出货分配台账_${dateStr}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (e) {
    console.error('Export error:', e)
    ElMessage.error('导出失败：' + e.message)
  } finally {
    loading.value = false
  }
}

async function downloadTemplate() {
  try {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('出货分配模板')

    const headers = [
      '分配编号', '订单编号', '订单日期', '产品名称', '型号',
      '规格型号', '内存配置', '数量', '国家', '插头',
      '承诺交期', '生产完成', '入库', 'CI编号', '客户名称',
      '客户分组', '硬件配置+颜色', '本次分配数量', '欠货数量',
      '发货仓库', '物流渠道', '沙特发货数量', '阿联酋发货数量',
      '阿曼/巴林/科威特发货数量', '卡塔尔发货数量', '黎巴嫩发货数量',
      '清关认证备注', '是否样机', '备注'
    ]

    const titleRow = worksheet.addRow(['出货分配台账 - 导入模板'])
    titleRow.font = { name: '微软雅黑', size: 16, bold: true, color: { argb: 'FF1a1a2e' } }
    titleRow.alignment = { horizontal: 'center' }
    worksheet.mergeCells(`A1:AC1`)

    worksheet.addRow([])

    const headerRow = worksheet.addRow(headers)
    headerRow.font = { name: '微软雅黑', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a1a2e' } }
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
    headerRow.height = 28

    const exampleRow = worksheet.addRow([
      'FP202607310001', 'MEAHTC20260725', '2026/7/25', '智能手机主机', 'HTC E7',
      'Non-camera Blue Black', '4+128', 3000, '阿联酋', '英规',
      '9月7日', '已发货', '已入库', 'CI20260731001', 'Hans',
      '中东沙特组', '8+256G 黑色', 100, 50,
      '深圳仓', 'DHL', 30, 10,
      5, 3, 2, 'SASO认证；UN38.3/MSDS', '否', '示例备注'
    ])
    exampleRow.font = { name: '微软雅黑', size: 10, color: { argb: 'FF909399' } }

    const noteRow = worksheet.addRow([])
    noteRow.font = { name: '微软雅黑', size: 10, italic: true, color: { argb: 'FF909399' } }
    worksheet.addRow(['说明：分配编号、客户分组、欠货数量、清关认证备注由系统自动计算/填充，可留空'])
    worksheet.addRow(['      是否样机：填写"是"或"否"'])
    worksheet.addRow(['      插头规格：沙特/阿联酋/阿曼/巴林/科威特/卡塔尔/黎巴嫩等地建议使用"英规"'])
    worksheet.addRow(['      生产完成：填写"未生产"、"生产中"、"已发货"或"已完成"'])
    worksheet.addRow(['      入库：填写"未入库"、"部分入库"或"已入库"'])

    const colWidths = [16, 14, 12, 12, 12, 16, 10, 8, 10, 8, 12, 10, 10, 14, 12, 14, 16, 12, 10, 10, 12, 12, 12, 18, 12, 12, 20, 10, 16]
    headers.forEach((_, i) => {
      worksheet.getColumn(i + 1).width = colWidths[i] || 12
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '出货分配台账_导入模板.xlsx'
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('模板下载成功')
  } catch (e) {
    console.error('Template download error:', e)
    ElMessage.error('模板下载失败')
  }
}

function triggerImport() {
  importFileList.value = []
  showImportDialog.value = true
}

function handleFileSelect(file) {
  if (file.raw) {
    importFileList.value = [file]
  }
}

function handleFileRemove() {
  importFileList.value = []
}

async function confirmImport() {
  if (importFileList.value.length === 0) {
    ElMessage.warning('请先选择文件')
    return
  }

  loading.value = true
  try {
    const file = importFileList.value[0].raw

    // 使用 importFromExcel 工具函数
    const result = await importFromExcel(file, {
      fieldMapping: fieldMappingPresets.deliveryAllocations,
      headerRow: 2,
      startRow: 3,
      transformRow: (rowData) => {
        // 转换数据类型
        return {
          id: rowData.id || '',
          poNumber: rowData.poNumber || '',
          orderDate: rowData.orderDate || '',
          productName: rowData.productName || '智能手机主机',
          model: rowData.model || '',
          specModel: rowData.specModel || '',
          memoryConfig: rowData.memoryConfig || '',
          orderQty: Number(rowData.orderQty) || 0,
          destinationCountry: rowData.destinationCountry || '',
          plugSpec: rowData.plugSpec || '英规',
          promisedDate: rowData.promisedDate || '',
          productionStatus: rowData.productionStatus || '未生产',
          warehouseStatus: rowData.warehouseStatus || '未入库',
          ciNumber: rowData.ciNumber || '',
          customerName: rowData.customerName || '',
          customerGroup: rowData.customerGroup || '',
          hwConfig: rowData.hwConfig || '',
          allocatedQty: Number(rowData.allocatedQty) || 0,
          warehouse: rowData.warehouse || '深圳仓',
          logistics: rowData.logistics || '',
          saudiQty: Number(rowData.saudiQty) || 0,
          uaeQty: Number(rowData.uaeQty) || 0,
          omanQty: Number(rowData.omanQty) || 0,
          qatarQty: Number(rowData.qatarQty) || 0,
          lebanonQty: Number(rowData.lebanonQty) || 0,
          certRemark: rowData.certRemark || '',
          isSample: rowData.isSample || '否',
          remark: rowData.remark || ''
        }
      }
    })

    if (!result.success) {
      ElMessage.error(result.message || '导入失败')
      loading.value = false
      return
    }

    // 确认导入
    ElMessageBox.confirm(
      `检测到 ${result.data.length} 条出货分配数据，是否导入？`,
      '确认导入',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'info' }
    ).then(() => {
      let imported = 0
      result.data.forEach(item => {
        if (item.poNumber && item.customerName && item.model) {
          // 检查是否已存在（根据ID或PO+客户+机型组合判断）
          const existingIndex = store.deliveryAllocations.findIndex(d => d.id === item.id && item.id)

          if (!item.id) {
            item.id = generateAllocationId()
          }

          // 自动填充客户分组
          if (!item.customerGroup) {
            const customer = allCustomerOptions.value.find(c => c.name === item.customerName)
            item.customerGroup = customer?.group || ''
          }

          if (existingIndex > -1) {
            // 更新已存在的记录
            store.deliveryAllocations[existingIndex] = {
              ...store.deliveryAllocations[existingIndex],
              ...item
            }
          } else {
            // 新增记录
            store.deliveryAllocations.push(item)
          }
          imported++
        }
      })

      ElMessage.success(`成功导入 ${imported} 条出货分配数据`)
      showImportDialog.value = false
    }).catch(() => {
      // 用户取消
    })
  } catch (e) {
    console.error('Import error:', e)
    ElMessage.error('导入失败：' + e.message)
  } finally {
    loading.value = false
  }
}

function handleImport() {
  const file = fileInputRef.value.files?.[0]
  if (file) {
    importFileList.value = [{ raw: file, name: file.name }]
    confirmImport()
  }
}

function printPreview() {
  if (!previewData.value) return
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    ElMessage.error('无法打开打印窗口')
    return
  }
  const row = previewData.value
  printWindow.document.write(`
    <html>
      <head>
        <title>出货分配详情 - ${row.id}</title>
        <style>
          body { font-family: 'Microsoft YaHei', sans-serif; padding: 20px; }
          h1 { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          td, th { border: 1px solid #333; padding: 8px 12px; text-align: left; }
          th { background: #f0f0f0; }
          .section-title { background: #1a1a2e; color: white; padding: 8px 12px; margin: 20px 0 10px; }
        </style>
      </head>
      <body>
        <h1>出货分配详情</h1>
        <table>
          <tr><th>分配编号</th><td>${row.id}</td><th>订单编号</th><td>${row.poNumber}</td></tr>
          <tr><th>订单日期</th><td>${row.orderDate || '-'}</td><th>产品名称</th><td>${row.productName || '-'}</td></tr>
          <tr><th>型号</th><td>${row.model}</td><th>规格型号</th><td>${row.specModel || '-'}</td></tr>
          <tr><th>内存配置</th><td>${row.memoryConfig || '-'}</td><th>数量</th><td>${row.orderQty}</td></tr>
          <tr><th>国家</th><td>${row.destinationCountry || '-'}</td><th>插头</th><td>${row.plugSpec || '-'}</td></tr>
          <tr><th>承诺交期</th><td>${row.promisedDate || '-'}</td><th>生产完成</th><td>${row.productionStatus || '-'}</td></tr>
          <tr><th>入库</th><td>${row.warehouseStatus || '-'}</td><th>CI编号</th><td>${row.ciNumber || '-'}</td></tr>
          <tr><th>客户名称</th><td>${row.customerName || '-'}</td><th>客户分组</th><td>${row.customerGroup || '-'}</td></tr>
          <tr><th>硬件配置+颜色</th><td>${row.hwConfig || '-'}</td><th>是否样机</th><td>${row.isSample || '否'}</td></tr>
          <tr><th>本次分配数量</th><td>${row.allocatedQty || 0}</td><th>欠货数量</th><td>${getShortage(row)}</td></tr>
          <tr><th>发货仓库</th><td>${row.warehouse}</td><th>物流渠道</th><td>${row.logistics}</td></tr>
        </table>
        <div class="section-title">各目的国发货分配</div>
        <table>
          <tr><th>目的国家</th><th>发货数量</th></tr>
          <tr><td>沙特</td><td>${row.saudiQty || 0}</td></tr>
          <tr><td>阿联酋</td><td>${row.uaeQty || 0}</td></tr>
          <tr><td>阿曼/巴林/科威特</td><td>${row.omanQty || 0}</td></tr>
          <tr><td>卡塔尔</td><td>${row.qatarQty || 0}</td></tr>
          <tr><td>黎巴嫩</td><td>${row.lebanonQty || 0}</td></tr>
        </table>
        <div class="section-title">清关认证与备注</div>
        <table>
          <tr><th>清关认证备注</th><td>${row.certRemark || '-'}</td></tr>
          <tr><th>备注</th><td>${row.remark || '-'}</td></tr>
        </table>
      </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => printWindow.print(), 300)
}

watch(() => store.deliveryAllocations, () => {}, { deep: true })
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.delivery-allocation {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: #f5f7fa;
}

.search-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  background: #fff;
  padding: 14px 16px;
  border-radius: 8px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.search-bar .spacer {
  flex: 1;
}

.table-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  background: #fff;
  padding: 10px 16px;
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid #ebeef5;
}

.selection-count {
  font-size: 13px;
  color: #409eff;
  font-weight: 500;
}

.total-count {
  margin-left: auto;
  font-size: 13px;
  color: #909399;
}

.text-primary {
  color: #409eff;
  font-weight: 600;
}

.text-danger {
  color: #f56c6c;
  font-weight: 600;
}

.preview-container {
  max-height: 600px;
  overflow-y: auto;
}

.preview-header {
  text-align: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #1a1a2e;
}

.preview-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 6px;
}

.preview-header p {
  font-size: 13px;
  color: #909399;
  margin: 0;
}

.import-area {
  padding: 10px 0;
}

.import-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 16px;
}

::v-deep .el-table th.table-header {
  background-color: #f5f7fa !important;
  color: #303133 !important;
  font-weight: 600;
  font-size: 13px;
}

::v-deep .el-table td {
  font-size: 13px;
}

::v-deep .el-table--striped .el-table__body tr.el-table__row--striped td {
  background-color: #fafafa !important;
}

::v-deep .el-table__body tr:hover > td {
  background-color: #ecf5ff !important;
}

::v-deep .el-divider__text {
  background-color: #f5f7fa;
}

::v-deep .el-descriptions__label {
  width: 120px;
  font-weight: 600;
  color: #606266;
}

::v-deep .el-descriptions__content {
  color: #303133;
}
</style>