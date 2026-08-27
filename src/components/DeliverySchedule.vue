<template>
  <div class="delivery-schedule">
    <div class="search-bar">
      <el-select v-model="filterModel" placeholder="机型" clearable style="width: 130px">
        <el-option v-for="m in modelOptions" :key="m" :label="m" :value="m" />
      </el-select>
      <el-input v-model="filterPo" placeholder="PO编号" clearable style="width: 160px" />
      <el-select v-model="filterCustomer" placeholder="客户" clearable style="width: 140px">
        <el-option v-for="c in customerOptions" :key="c" :label="c" :value="c" />
      </el-select>
      <el-select v-model="filterCountry" placeholder="目的国家" clearable style="width: 130px">
        <el-option v-for="c in countryOptions" :key="c" :label="c" :value="c" />
      </el-select>
      <el-select v-model="filterLogistics" placeholder="物流方式" clearable style="width: 130px">
        <el-option v-for="l in logisticsOptions" :key="l" :label="l" :value="l" />
      </el-select>
      <el-select v-model="filterStatus" placeholder="订单状态" clearable style="width: 130px">
        <el-option v-for="s in statusOptions" :key="s" :label="s" :value="s" />
      </el-select>
      <el-button type="primary" @click="resetFilters">重置</el-button>
      <div class="spacer"></div>
      <el-button type="primary" @click="handleAdd">新增</el-button>
      <el-button @click="downloadTemplate">下载模板</el-button>
      <el-button type="warning" @click="triggerImport">导入Excel</el-button>
      <input ref="importInput" type="file" accept=".xlsx,.xls" style="display: none" @change="handleImport" />
      <el-button @click="handleExport">导出Excel</el-button>
      <el-button type="danger" :disabled="selection.length === 0" @click="batchDelete">
        批量删除<template v-if="selection.length > 0">({{ selection.length }})</template>
      </el-button>
    </div>

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
      :header-cell-style="{ background: '#1a1a2e', color: '#fff', textAlign: 'center' }"
      :cell-style="{ textAlign: 'center' }"
    >
      <el-table-column type="selection" width="45" reserve-selection fixed="left" />
      <el-table-column type="index" label="序号" width="60" fixed="left" :index="indexMethod" />
      <el-table-column prop="poNumber" label="PO单号" width="130" fixed="left">
        <template #default="{ row }">
          <el-tooltip :content="row.poNumber" placement="top">
            <span>{{ row.poNumber || '-' }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column prop="customerName" label="客户名称" width="110">
        <template #default="{ row }">
          <span>{{ row.customerName || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="model" label="机型" width="100" />
      <el-table-column prop="configColor" label="配置颜色" width="130" show-overflow-tooltip>
        <template #default="{ row }">
          <span>{{ row.configColor || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="plugSpec" label="插头规格" width="90">
        <template #default="{ row }">
          <el-tag size="small" type="info">{{ row.plugSpec || '-' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="orderDate" label="下单日期" width="110" />
      <el-table-column prop="promiseDate" label="承诺客户交期" width="120" />
      <el-table-column prop="smtDate" label="SMT贴片完工日" width="130" />
      <el-table-column prop="warehouseDate" label="整机入库日期" width="130" />
      <el-table-column prop="actualShipDate" label="实际发货日期" width="120" />
      <el-table-column prop="logistics" label="整体物流方式" width="110">
        <template #default="{ row }">
          <el-tag size="small" :type="getLogisticsTagType(row.logistics)">{{ row.logistics || '-' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="trackingNos" label="运单号汇总" width="180" show-overflow-tooltip>
        <template #default="{ row }">
          <span>{{ row.trackingNos || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="etaRemark" label="分国家预计签收日备注" width="180" show-overflow-tooltip>
        <template #default="{ row }">
          <span>{{ row.etaRemark || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="delayReason" label="延期原因" width="160" show-overflow-tooltip>
        <template #default="{ row }">
          <span>{{ row.delayReason || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="latestEta" label="最新预估交期" width="120" />
      <el-table-column prop="saudiQty" label="沙特" width="80" align="right">
        <template #default="{ row }">
          <span>{{ row.saudiQty || 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="uaeQty" label="阿联酋" width="80" align="right">
        <template #default="{ row }">
          <span>{{ row.uaeQty || 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="omanQty" label="阿曼三国" width="90" align="right">
        <template #default="{ row }">
          <span>{{ row.omanQty || 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="qatarQty" label="卡塔尔" width="80" align="right">
        <template #default="{ row }">
          <span>{{ row.qatarQty || 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="lebanonQty" label="黎巴嫩" width="80" align="right">
        <template #default="{ row }">
          <span>{{ row.lebanonQty || 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="clearanceDocs" label="清关资料清单" width="200" show-overflow-tooltip>
        <template #default="{ row }">
          <span>{{ row.clearanceDocs || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="订单状态" width="110">
        <template #default="{ row }">
          <el-tag size="small" :type="getStatusTagType(row.status)">{{ row.status || '-' }}</el-tag>
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
      :title="isEditing ? '编辑订单交期' : '新增订单交期'"
      width="900px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="150px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="PO单号" prop="poNumber">
              <el-select
                v-model="form.poNumber"
                filterable
                allow-create
                default-first-option
                placeholder="选择或输入PO单号"
                @change="onPoChange"
                style="width: 100%"
              >
                <el-option
                  v-for="o in poOptions"
                  :key="o.id"
                  :label="o.id"
                  :value="o.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户名称" prop="customerName">
              <el-select v-model="form.customerName" filterable placeholder="选择客户" @change="onCustomerChange" style="width: 100%">
                <el-option v-for="c in allCustomerOptions" :key="c.name" :label="c.name" :value="c.name" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户分组">
              <el-input v-model="form.customerGroup" disabled placeholder="选择客户后自动填充" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="目的国家">
              <el-input v-model="form.destinationCountry" disabled placeholder="选择客户后自动填充" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="机型" prop="model">
              <el-select v-model="form.model" filterable placeholder="选择机型" style="width: 100%">
                <el-option v-for="m in allModelOptions" :key="m" :label="m" :value="m" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="配置颜色">
              <el-input v-model="form.configColor" placeholder="例如：8+256G 黑色" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="插头规格" prop="plugSpec">
              <el-select
                v-model="form.plugSpec"
                :disabled="isMiddleEastCountry(form.destinationCountry)"
                placeholder="选择插头规格"
                style="width: 100%"
              >
                <el-option label="英规 (BS)" value="英规" />
                <el-option label="欧规 (CEE)" value="欧规" />
                <el-option label="美规 (NEMA)" value="美规" />
                <el-option label="中规 (GB)" value="中规" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="整体物流方式">
              <el-select v-model="form.logistics" placeholder="选择物流方式" style="width: 100%">
                <el-option v-for="l in logisticsOptions" :key="l" :label="l" :value="l" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider content-position="left">日期节点</el-divider>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="下单日期">
              <el-date-picker v-model="form.orderDate" type="date" value-format="YYYY-MM-DD" placeholder="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="承诺客户交期">
              <el-date-picker v-model="form.promiseDate" type="date" value-format="YYYY-MM-DD" placeholder="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="SMT贴片完工日">
              <el-date-picker v-model="form.smtDate" type="date" value-format="YYYY-MM-DD" placeholder="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="整机入库日期">
              <el-date-picker v-model="form.warehouseDate" type="date" value-format="YYYY-MM-DD" placeholder="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="实际发货日期">
              <el-date-picker v-model="form.actualShipDate" type="date" value-format="YYYY-MM-DD" placeholder="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最新预估交期">
              <el-date-picker v-model="form.latestEta" type="date" value-format="YYYY-MM-DD" placeholder="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="运单号汇总">
              <el-input v-model="form.trackingNos" placeholder="多个运单号用英文逗号分隔" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分国家预计签收日备注">
              <el-input v-model="form.etaRemark" placeholder="例如：沙特5号，阿联酋8号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider content-position="left">各国家订单数量</el-divider>
        <el-row :gutter="16">
          <el-col :span="4">
            <el-form-item label="沙特">
              <el-input-number v-model="form.saudiQty" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="阿联酋">
              <el-input-number v-model="form.uaeQty" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="阿曼三国">
              <el-input-number v-model="form.omanQty" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="卡塔尔">
              <el-input-number v-model="form.qatarQty" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="黎巴嫩">
              <el-input-number v-model="form.lebanonQty" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="合计">
              <el-input :model-value="getCountryTotal()" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="清关资料清单">
              <el-input
                :model-value="form.clearanceDocs"
                type="textarea"
                :rows="2"
                placeholder="选择目的国家后自动匹配"
                @click="onClearanceDocsClick"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="订单状态">
              <el-radio-group v-model="form.status">
                <el-radio v-for="s in statusOptions" :key="s" :value="s">{{ s }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="延期原因">
          <el-input v-model="form.delayReason" type="textarea" :rows="3" placeholder="请输入延期原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFormDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmForm">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showPreviewDialog" title="订单交期详情预览" width="1000px" :close-on-click-modal="false" top="5vh">
      <div class="preview-container" v-if="previewData">
        <div class="preview-header">
          <h2>订单交期管控详情</h2>
          <p>PO单号：{{ previewData.poNumber }} | 预览时间：{{ currentDateTime }}</p>
        </div>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="PO单号" :span="1">{{ previewData.poNumber || '-' }}</el-descriptions-item>
          <el-descriptions-item label="客户名称">{{ previewData.customerName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="客户分组">{{ previewData.customerGroup || '-' }}</el-descriptions-item>
          <el-descriptions-item label="目的国家">{{ previewData.destinationCountry || '-' }}</el-descriptions-item>
          <el-descriptions-item label="机型">{{ previewData.model || '-' }}</el-descriptions-item>
          <el-descriptions-item label="配置颜色">{{ previewData.configColor || '-' }}</el-descriptions-item>
          <el-descriptions-item label="插头规格">{{ previewData.plugSpec || '-' }}</el-descriptions-item>
          <el-descriptions-item label="整体物流方式">{{ previewData.logistics || '-' }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="getStatusTagType(previewData.status)">{{ previewData.status || '-' }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">交期节点</el-divider>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="下单日期">{{ previewData.orderDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="承诺客户交期">{{ previewData.promiseDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="最新预估交期">{{ previewData.latestEta || '-' }}</el-descriptions-item>
          <el-descriptions-item label="SMT贴片完工日">{{ previewData.smtDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="整机入库日期">{{ previewData.warehouseDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="实际发货日期">{{ previewData.actualShipDate || '-' }}</el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">物流与数量</el-divider>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="运单号汇总" :span="2">{{ previewData.trackingNos || '-' }}</el-descriptions-item>
          <el-descriptions-item label="分国家预计签收日备注" :span="2">{{ previewData.etaRemark || '-' }}</el-descriptions-item>
        </el-descriptions>
        <el-table :data="countryDistributionRows" border size="small" style="margin-top: 12px" :header-cell-style="{ background: '#f5f7fa' }">
          <el-table-column prop="country" label="目的国家" width="200" />
          <el-table-column prop="qty" label="订单数量" align="right" width="150" />
          <el-table-column prop="percent" label="占比" align="right" width="150">
            <template #default="{ row }">
              <el-progress :percentage="row.percent" :stroke-width="14" />
            </template>
          </el-table-column>
        </el-table>

        <el-divider content-position="left">清关与备注</el-divider>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="清关资料清单">{{ previewData.clearanceDocs || '-' }}</el-descriptions-item>
          <el-descriptions-item label="延期原因">{{ previewData.delayReason || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="showPreviewDialog = false">关闭</el-button>
        <el-button type="primary" @click="printPreview">打印</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import ExcelJS from 'exceljs'
import { store } from '../store.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { importFromExcel, fieldMappingPresets, getScheduleDateFields } from '../utils/excelImport.js'

const loading = ref(false)
const selection = ref([])
const showFormDialog = ref(false)
const showPreviewDialog = ref(false)
const isEditing = ref(false)
const formRef = ref(null)
const importInput = ref(null)
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

const modelOptions = ['NE75', 'E9 Plus', 'L05', 'E6 Star', 'NE76', 'E7 Elite', 'MTK6500']
const logisticsOptions = ['海运', 'DHL', '空运']
const statusOptions = ['待生产', '生产中', '待发货', '运输中', '已签收', '延期']

const filterModel = ref('')
const filterPo = ref('')
const filterCustomer = ref('')
const filterCountry = ref('')
const filterLogistics = ref('')
const filterStatus = ref('')

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
  return store.salesOrders.map(o => ({
    id: o.id,
    customerName: o.customerName,
    model: o.model,
    qty: o.qty,
    status: o.status
  }))
})

const selectAllState = computed(() => {
  if (filteredData.value.length === 0) return false
  return selection.value.length === filteredData.value.length
})

const indeterminateState = computed(() => {
  return selection.value.length > 0 && selection.value.length < filteredData.value.length
})

const filteredData = computed(() => {
  return store.deliverySchedules.filter(item => {
    if (filterModel.value && item.model !== filterModel.value) return false
    if (filterPo.value && !(item.poNumber || '').toLowerCase().includes(filterPo.value.toLowerCase())) return false
    if (filterCustomer.value && item.customerName !== filterCustomer.value) return false
    if (filterCountry.value && item.destinationCountry !== filterCountry.value) return false
    if (filterLogistics.value && item.logistics !== filterLogistics.value) return false
    if (filterStatus.value && item.status !== filterStatus.value) return false
    return true
  })
})

const rules = {
  poNumber: [{ required: true, message: '请选择或输入PO单号', trigger: 'change' }],
  customerName: [{ required: true, message: '请选择客户', trigger: 'change' }],
  model: [{ required: true, message: '请选择机型', trigger: 'change' }]
}

const emptyForm = () => ({
  id: '',
  poNumber: '',
  customerName: '',
  customerGroup: '',
  destinationCountry: '',
  model: '',
  configColor: '',
  plugSpec: '英规',
  orderDate: '',
  promiseDate: '',
  smtDate: '',
  warehouseDate: '',
  actualShipDate: '',
  logistics: '',
  trackingNos: '',
  etaRemark: '',
  delayReason: '',
  latestEta: '',
  saudiQty: 0,
  uaeQty: 0,
  omanQty: 0,
  qatarQty: 0,
  lebanonQty: 0,
  clearanceDocs: '',
  status: '待生产'
})

const form = reactive(emptyForm())

const previewData = ref(null)

const countryDistributionRows = computed(() => {
  if (!previewData.value) return []
  const rows = []
  const countries = [
    { key: 'saudiQty', country: '沙特' },
    { key: 'uaeQty', country: '阿联酋' },
    { key: 'omanQty', country: '阿曼三国' },
    { key: 'qatarQty', country: '卡塔尔' },
    { key: 'lebanonQty', country: '黎巴嫩' }
  ]
  const total = countries.reduce((sum, c) => sum + (previewData.value[c.key] || 0), 0)
  countries.forEach(c => {
    const qty = previewData.value[c.key] || 0
    if (qty > 0) {
      rows.push({
        country: c.country,
        qty,
        percent: total > 0 ? Math.round((qty / total) * 100) : 0
      })
    }
  })
  return rows
})

onMounted(() => {
  if (!store.deliverySchedules) {
    store.deliverySchedules = []
  }
})

function indexMethod(index) {
  return index + 1
}

function getCountryTotal() {
  return (form.saudiQty || 0) + (form.uaeQty || 0) + (form.omanQty || 0) + (form.qatarQty || 0) + (form.lebanonQty || 0)
}

function isMiddleEastCountry(country) {
  return MIDDLE_EAST_COUNTRIES.includes(country)
}

function getLogisticsTagType(logistics) {
  const map = { 'DHL': 'primary', '海运': 'success', '空运': 'warning' }
  return map[logistics] || ''
}

function getStatusTagType(status) {
  const map = {
    '待生产': 'info',
    '生产中': '',
    '待发货': 'warning',
    '运输中': 'primary',
    '已签收': 'success',
    '延期': 'danger'
  }
  return map[status] || ''
}

function generateId() {
  const now = new Date()
  const ymd = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0')
  const prefix = 'DS' + ymd
  const existing = store.deliverySchedules
    .filter(a => a.id && a.id.startsWith(prefix))
    .map(a => {
      const match = a.id.match(/(\d{4})$/)
      return match ? parseInt(match[1]) : 0
    })
  const seq = (existing.length > 0 ? Math.max(...existing) : 0) + 1
  return prefix + String(seq).padStart(4, '0')
}

function getClearanceDocsByCountry(country) {
  const map = {
    '沙特': 'SASO',
    '阿联酋': 'CE+RED',
    '阿曼': 'CB',
    '巴林': 'CB',
    '科威特': 'CB',
    '卡塔尔': 'CB',
    '黎巴嫩': 'CB'
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
    if (isMiddleEastCountry(customer.country)) {
      form.plugSpec = '英规'
    }
    form.clearanceDocs = getClearanceDocsByCountry(customer.country)
  }
}

function onPoChange(poId) {
  const order = poOptions.value.find(o => o.id === poId)
  if (order) {
    form.customerName = order.customerName
    form.model = order.model
    onCustomerChange(order.customerName)
  }
}

function onClearanceDocsClick() {
  if (form.destinationCountry) {
    form.clearanceDocs = getClearanceDocsByCountry(form.destinationCountry)
  }
}

function resetFilters() {
  filterModel.value = ''
  filterPo.value = ''
  filterCustomer.value = ''
  filterCountry.value = ''
  filterLogistics.value = ''
  filterStatus.value = ''
}

function handleAdd() {
  isEditing.value = false
  Object.assign(form, emptyForm())
  form.id = generateId()
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
    `确定删除订单 ${row.poNumber} 吗？此操作不可恢复。`,
    '确认删除',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    const idx = store.deliverySchedules.findIndex(a => a.id === row.id)
    if (idx > -1) {
      store.deliverySchedules.splice(idx, 1)
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
    for (let i = store.deliverySchedules.length - 1; i >= 0; i--) {
      if (ids.has(store.deliverySchedules[i].id)) {
        store.deliverySchedules.splice(i, 1)
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
    ElMessage.warning('请选择或输入PO单号')
    return
  }
  if (!form.model) {
    ElMessage.warning('请选择机型')
    return
  }

  if (!isEditing.value) {
    store.deliverySchedules.push({ ...JSON.parse(JSON.stringify(form)) })
    ElMessage.success('新增成功')
  } else {
    const idx = store.deliverySchedules.findIndex(a => a.id === form.id)
    if (idx > -1) {
      store.deliverySchedules[idx] = { ...JSON.parse(JSON.stringify(form)) }
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
    const sheetName = '订单交期管控台账'
    const worksheet = workbook.addWorksheet(sheetName)

    const headers = [
      '序号', 'PO单号', '客户名称', '机型', '配置颜色', '插头规格',
      '下单日期', '承诺客户交期', 'SMT贴片完工日', '整机入库日期', '实际发货日期',
      '整体物流方式', '运单号汇总', '分国家预计签收日备注', '延期原因', '最新预估交期',
      '沙特订单数量', '阿联酋订单数量', '阿曼三国订单数量', '卡塔尔订单数量', '黎巴嫩订单数量',
      '清关资料清单', '订单状态'
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

    filteredData.value.forEach((row, index) => {
      worksheet.addRow([
        index + 1,
        row.poNumber || '',
        row.customerName || '',
        row.model || '',
        row.configColor || '',
        row.plugSpec || '',
        row.orderDate || '',
        row.promiseDate || '',
        row.smtDate || '',
        row.warehouseDate || '',
        row.actualShipDate || '',
        row.logistics || '',
        row.trackingNos || '',
        row.etaRemark || '',
        row.delayReason || '',
        row.latestEta || '',
        row.saudiQty || 0,
        row.uaeQty || 0,
        row.omanQty || 0,
        row.qatarQty || 0,
        row.lebanonQty || 0,
        row.clearanceDocs || '',
        row.status || ''
      ])
    })

    const colWidths = [8, 14, 12, 10, 14, 10, 12, 14, 14, 14, 14, 12, 20, 22, 20, 14, 12, 12, 14, 12, 12, 24, 12]
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
    a.download = `订单交期管控台账_${dateStr}.xlsx`
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
    const worksheet = workbook.addWorksheet('订单交期模板')

    const headers = [
      '序号', 'PO单号', '客户名称', '机型', '配置颜色', '插头规格',
      '下单日期', '承诺客户交期', 'SMT贴片完工日', '整机入库日期', '实际发货日期',
      '整体物流方式', '运单号汇总', '分国家预计签收日备注', '延期原因', '最新预估交期',
      '沙特订单数量', '阿联酋订单数量', '阿曼三国订单数量', '卡塔尔订单数量', '黎巴嫩订单数量',
      '清关资料清单', '订单状态'
    ]

    const titleRow = worksheet.addRow(['订单交期管控台账 - 导入模板'])
    titleRow.font = { name: '微软雅黑', size: 16, bold: true, color: { argb: 'FF1a1a2e' } }
    titleRow.alignment = { horizontal: 'center' }
    worksheet.mergeCells(`A1:W1`)

    worksheet.addRow([])

    const headerRow = worksheet.addRow(headers)
    headerRow.font = { name: '微软雅黑', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a1a2e' } }
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
    headerRow.height = 28

    const exampleRow = worksheet.addRow([
      1, 'SO26070001', 'Hans', 'NE75', '8+256G 黑色', '英规',
      '2026-07-01', '2026-08-01', '2026-07-20', '2026-07-25', '2026-07-28',
      'DHL', 'DH202607001,DH202607002', '沙特8月5日，阿联酋8月7日', '', '2026-08-05',
      50, 30, 10, 5, 5, 'SASO；UN38.3/MSDS', '运输中'
    ])
    exampleRow.font = { name: '微软雅黑', size: 10, color: { argb: 'FF909399' } }

    const colWidths = [8, 14, 12, 10, 14, 10, 12, 14, 14, 14, 14, 12, 20, 22, 20, 14, 12, 12, 14, 12, 12, 24, 12]
    headers.forEach((_, i) => {
      const col = worksheet.getColumn(i + 1)
      col.width = colWidths[i] || 12
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '订单交期管控台账_导入模板.xlsx'
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('模板下载成功')
  } catch (e) {
    console.error('Template error:', e)
    ElMessage.error('模板下载失败：' + e.message)
  }
}

function triggerImport() {
  importInput.value?.click()
}

async function handleImport(event) {
  const file = event.target.files[0]
  if (!file) return
  event.target.value = ''

  const result = await importFromExcel(file, {
    fieldMapping: fieldMappingPresets.deliverySchedules,
    headerRow: 2,
    startRow: 3,
    autoDetectHeader: true,
    dateFields: getScheduleDateFields()
  })

  if (!result.success) {
    ElMessage.error(result.message || '导入失败')
    return
  }

  if (result.unmatchedMappingFields && result.unmatchedMappingFields.length > 0) {
    console.warn('未匹配字段:', result.unmatchedMappingFields)
  }

  ElMessageBox.confirm(
    `检测到 ${result.data.length} 条交期管控数据，是否导入？`,
    '确认导入',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'info' }
  ).then(() => {
    result.data.forEach(item => {
      const existingIdx = store.deliverySchedules.findIndex(d => 
        d.orderId === item.orderId && d.customerName === item.customerName && d.model === item.model
      )
      
      const importData = {
        ...item,
        id: item.id || generateId(),
        orderId: item.orderId || '',
        poNumber: item.orderId || item.poNumber || '',
        customerName: item.customerName || '',
        customerGroup: item.customerGroup || '',
        destinationCountry: item.destinationCountry || '',
        model: item.model || '',
        configColor: item.configColor || '',
        memoryConfig: item.memoryConfig || '',
        plugSpec: item.plugSpec || '',
        orderDate: item.orderDate || '',
        promiseDate: item.promiseDate || item.requiredDate || '',
        smtDate: item.smtDate || '',
        warehouseDate: item.warehouseDate || '',
        actualShipDate: item.actualShipDate || item.actualDate || '',
        latestEta: item.latestEta || item.estimatedDate || '',
        logistics: item.logistics || '',
        trackingNos: item.trackingNos || '',
        etaRemark: item.etaRemark || '',
        delayReason: item.delayReason || '',
        saudiQty: Number(item.saudiQty) || 0,
        uaeQty: Number(item.uaeQty) || 0,
        omanQty: Number(item.omanQty) || 0,
        qatarQty: Number(item.qatarQty) || 0,
        lebanonQty: Number(item.lebanonQty) || 0,
        clearanceDocs: item.clearanceDocs || '',
        status: item.status || '待生产',
        remark: item.remark || ''
      }

      if (existingIdx > -1) {
        store.deliverySchedules[existingIdx] = { 
          ...store.deliverySchedules[existingIdx], 
          ...importData 
        }
      } else {
        store.deliverySchedules.push(importData)
      }
    })
    ElMessage.success(`成功导入 ${result.data.length} 条交期管控数据`)
  }).catch(() => {})
}

function printPreview() {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return
  const title = previewData.value?.poNumber || ''
  const html = `
    <html>
    <head>
      <title>订单交期详情 - ${title}</title>
      <meta charset="utf-8" />
      <style>
        body { font-family: '微软雅黑', sans-serif; padding: 24px; color: #333; }
        h1 { text-align: center; color: #1a1a2e; }
        h2 { color: #1a1a2e; margin-top: 24px; border-bottom: 2px solid #1a1a2e; padding-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #d0d0d0; padding: 8px 12px; text-align: left; font-size: 12px; }
        th { background: #f5f7fa; width: 150px; font-weight: 600; }
        .meta { color: #909399; text-align: center; margin-bottom: 24px; }
      </style>
    </head>
    <body>
      <h1>订单交期管控详情</h1>
      <p class="meta">PO单号：${previewData.value?.poNumber || ''} | 打印时间：${currentDateTime.value}</p>
      <h2>基本信息</h2>
      <table>
        <tr><th>PO单号</th><td>${previewData.value?.poNumber || '-'}</td><th>客户名称</th><td>${previewData.value?.customerName || '-'}</td></tr>
        <tr><th>客户分组</th><td>${previewData.value?.customerGroup || '-'}</td><th>目的国家</th><td>${previewData.value?.destinationCountry || '-'}</td></tr>
        <tr><th>机型</th><td>${previewData.value?.model || '-'}</td><th>配置颜色</th><td>${previewData.value?.configColor || '-'}</td></tr>
        <tr><th>插头规格</th><td>${previewData.value?.plugSpec || '-'}</td><th>整体物流方式</th><td>${previewData.value?.logistics || '-'}</td></tr>
        <tr><th>订单状态</th><td>${previewData.value?.status || '-'}</td><th></th><td></td></tr>
      </table>
      <h2>交期节点</h2>
      <table>
        <tr><th>下单日期</th><td>${previewData.value?.orderDate || '-'}</td><th>承诺客户交期</th><td>${previewData.value?.promiseDate || '-'}</td></tr>
        <tr><th>最新预估交期</th><td>${previewData.value?.latestEta || '-'}</td><th>SMT贴片完工日</th><td>${previewData.value?.smtDate || '-'}</td></tr>
        <tr><th>整机入库日期</th><td>${previewData.value?.warehouseDate || '-'}</td><th>实际发货日期</th><td>${previewData.value?.actualShipDate || '-'}</td></tr>
      </table>
      <h2>各国家订单数量</h2>
      <table>
        <tr><th>沙特</th><td>${previewData.value?.saudiQty || 0}</td><th>阿联酋</th><td>${previewData.value?.uaeQty || 0}</td></tr>
        <tr><th>阿曼三国</th><td>${previewData.value?.omanQty || 0}</td><th>卡塔尔</th><td>${previewData.value?.qatarQty || 0}</td></tr>
        <tr><th>黎巴嫩</th><td>${previewData.value?.lebanonQty || 0}</td><th></th><td></td></tr>
      </table>
      <h2>清关与备注</h2>
      <table>
        <tr><th>运单号汇总</th><td colspan="3">${previewData.value?.trackingNos || '-'}</td></tr>
        <tr><th>分国家预计签收日备注</th><td colspan="3">${previewData.value?.etaRemark || '-'}</td></tr>
        <tr><th>清关资料清单</th><td colspan="3">${previewData.value?.clearanceDocs || '-'}</td></tr>
        <tr><th>延期原因</th><td colspan="3">${previewData.value?.delayReason || '-'}</td></tr>
      </table>
    </body>
    </html>
  `
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
    }, 300)
  }
}
</script>

<style scoped>
.delivery-schedule {
  padding: 16px;
}

.search-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  padding: 12px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  margin-bottom: 12px;
}

.search-bar .spacer {
  flex: 1;
  min-width: 20px;
}

.table-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #fff;
  border-radius: 6px 6px 6px 0;
  margin-bottom: 0;
  border-bottom: 1px solid #ebeef5;
}

.selection-count {
  color: #409eff;
  font-size: 13px;
  font-weight: 500;
}

.total-count {
  color: #909399;
  font-size: 13px;
}

.preview-container {
  max-height: 70vh;
  overflow-y: auto;
  padding: 4px;
}

.preview-header {
  text-align: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #1a1a2e;
}

.preview-header h2 {
  margin: 0 0 6px 0;
  color: #1a1a2e;
}

.preview-header p {
  margin: 0;
  color: #909399;
  font-size: 13px;
}

.table-header th {
  background: #1a1a2e !important;
  color: #fff !important;
}

:deep(.el-table .cell) {
  text-align: center;
}

:deep(.el-table td),
:deep(.el-table th) {
  text-align: center;
}
</style>
