<template>
  <div class="finance-management">
    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="样品运费登记" name="freight">
        <div class="tab-content">
          <div class="search-bar">
            <el-select v-model="filterCustomer" placeholder="选择客户" clearable style="width: 200px">
              <el-option v-for="c in store.customers" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
            <el-date-picker v-model="filterDate" type="month" placeholder="登记月份" />
            <el-button type="primary" @click="handleAddFreight">新增运费</el-button>
            <el-button @click="exportFreights">导出Excel</el-button>
          </div>
          <el-table :data="filteredFreights" border stripe>
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="customerName" label="客户姓名" />
            <el-table-column prop="model" label="机型" />
            <el-table-column prop="quantity" label="样品数量" width="100" />
            <el-table-column prop="logisticsNo" label="运单号" />
            <el-table-column prop="freightAmount" label="运费金额" />
            <el-table-column prop="currency" label="币种" width="80" />
            <el-table-column prop="exchangeRate" label="汇率" width="80" />
            <el-table-column prop="rmbAmount" label="人民币金额" />
            <el-table-column prop="registerDate" label="登记日期" />
            <el-table-column prop="settled" label="是否结清">
              <template #default="{ row }">
                <el-tag :type="row.settled ? 'success' : 'danger'">{{ row.settled ? '已结清' : '未结清' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button size="small" @click="handleEditFreight(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="handleDeleteFreight(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="报价单存档检索" name="quotation">
        <div class="tab-content">
          <div class="search-bar">
            <el-input v-model="quotationKeyword" placeholder="搜索客户/产品" clearable style="width: 250px" />
            <el-date-picker v-model="quotationDate" type="month" placeholder="报价月份" />
            <el-button type="primary" @click="handleAddQuotation">新增报价单</el-button>
            <el-button @click="exportQuotations">导出Excel</el-button>
          </div>
          <div class="quotation-list">
            <div v-for="quote in filteredQuotations" :key="quote.id" class="quotation-card">
              <div class="quotation-header">
                <span class="quotation-id">报价单：{{ quote.id }}</span>
                <span class="quotation-date">{{ quote.quoteDate }}</span>
              </div>
              <div class="quotation-info">
                <div class="info-row">
                  <span class="label">客户：</span>
                  <span>{{ quote.customerName }}</span>
                </div>
                <div class="info-row">
                  <span class="label">产品：</span>
                  <span>{{ quote.product }}</span>
                </div>
                <div class="info-row">
                  <span class="label">数量：</span>
                  <span>{{ quote.quantity }}台</span>
                </div>
                <div class="info-row">
                  <span class="label">单价：</span>
                  <span>{{ quote.unitPrice }} {{ quote.currency }}</span>
                </div>
                <div class="info-row">
                  <span class="label">总价：</span>
                  <span class="total">{{ quote.totalAmount }} {{ quote.currency }}</span>
                </div>
              </div>
              <div class="quotation-actions">
                <el-button size="small" @click="handleEditQuotation(quote)">编辑</el-button>
                <el-button size="small" @click="previewQuotation(quote)">预览</el-button>
                <el-button size="small" @click="exportSingleQuotation(quote)">导出Excel</el-button>
                <el-button size="small" type="danger" @click="handleDeleteQuotation(quote)">删除</el-button>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="月度运费汇总" name="summary">
        <div class="tab-content">
          <div class="summary-controls">
            <el-date-picker v-model="summaryDate" type="month" placeholder="选择月份" />
            <el-select v-model="summaryType" placeholder="汇总类型" style="width: 150px">
              <el-option label="按客户" value="customer" />
              <el-option label="按物流商" value="logistics" />
              <el-option label="按货代公司" value="freightForwarder" />
            </el-select>
            <el-button type="primary" @click="generateSummary">生成汇总</el-button>
            <el-button @click="exportSummary">导出Excel</el-button>
          </div>
          <div v-if="summaryData.length > 0" class="summary-content">
            <div class="summary-total">
              <span class="total-label">月度运费总计：</span>
              <span class="total-value">{{ totalFreightAmount }}</span>
            </div>
            <el-table :data="summaryData" border stripe>
              <el-table-column prop="customerName" :label="summaryType === 'customer' ? '客户姓名' : (summaryType === 'logistics' ? '物流商' : '货代公司')" />
              <el-table-column prop="count" label="寄样次数" width="100" />
              <el-table-column prop="totalFreight" label="运费总额" />
              <el-table-column prop="avgFreight" label="平均运费" />
              <el-table-column prop="unsettled" label="未结金额" />
              <el-table-column prop="settled" label="已结金额" />
            </el-table>
          </div>
          <div v-else class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            <p>请选择月份并生成汇总</p>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <el-dialog v-model="showFreightDialog" :title="isEditingFreight ? '编辑运费' : '新增运费'" width="500px">
      <el-form :model="freightForm" label-width="100px">
        <el-form-item label="客户姓名">
          <el-select v-model="freightForm.customerId">
            <el-option v-for="c in store.customers" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="机型">
          <el-select v-model="freightForm.model" filterable>
            <el-option v-for="m in store.productModels" :key="m.id" :label="m.name" :value="m.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="样品数量">
          <el-input-number v-model="freightForm.quantity" :min="1" />
        </el-form-item>
        <el-form-item label="运单号">
          <el-input v-model="freightForm.logisticsNo" />
        </el-form-item>
        <el-form-item label="运费金额">
          <el-input v-model="freightForm.freightAmount" />
        </el-form-item>
        <el-form-item label="币种">
          <el-select v-model="freightForm.currency">
            <el-option label="USD" value="USD" />
            <el-option label="EUR" value="EUR" />
            <el-option label="CNY" value="CNY" />
          </el-select>
        </el-form-item>
        <el-form-item label="汇率">
          <el-input v-model="freightForm.exchangeRate" type="number" />
        </el-form-item>
        <el-form-item label="登记日期">
          <el-date-picker v-model="freightForm.registerDate" type="date" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="freightForm.settled">已结清</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFreightDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmFreight">确定</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showQuotationDialog" :title="isEditingQuotation ? '编辑报价单' : '新增报价单'" width="600px">
      <el-form :model="quotationForm" label-width="100px">
        <el-form-item label="报价单号">
          <el-input v-model="quotationForm.id" />
        </el-form-item>
        <el-form-item label="客户姓名">
          <el-select v-model="quotationForm.customerName" filterable>
            <el-option label="请选择" value="" />
            <el-option v-for="c in store.customers" :key="c.id" :label="c.name" :value="c.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="产品型号">
          <el-select v-model="quotationForm.product" filterable>
            <el-option label="请选择" value="" />
            <el-option v-for="m in store.productModels" :key="m.id" :label="m.name" :value="m.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="quotationForm.quantity" :min="1" />
        </el-form-item>
        <el-form-item label="单价">
          <el-input v-model="quotationForm.unitPrice" />
        </el-form-item>
        <el-form-item label="币种">
          <el-select v-model="quotationForm.currency">
            <el-option label="USD" value="USD" />
            <el-option label="EUR" value="EUR" />
            <el-option label="CNY" value="CNY" />
          </el-select>
        </el-form-item>
        <el-form-item label="报价日期">
          <el-date-picker v-model="quotationForm.quoteDate" type="date" />
        </el-form-item>
        <el-form-item label="有效期">
          <el-date-picker v-model="quotationForm.validUntil" type="date" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="quotationForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showQuotationDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmQuotation">确定</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showPreviewDialog" title="报价单预览" width="600px">
      <div v-if="previewQuote" class="quote-preview">
        <div class="quote-header">
          <h2>报价单</h2>
          <div class="quote-meta">
            <span>报价单号：{{ previewQuote.id }}</span>
            <span>日期：{{ previewQuote.quoteDate }}</span>
          </div>
        </div>
        <div class="quote-body">
          <div class="quote-section">
            <h4>客户信息</h4>
            <p>客户姓名：{{ previewQuote.customerName }}</p>
          </div>
          <div class="quote-section">
            <h4>产品信息</h4>
            <table>
              <thead>
                <tr>
                  <th>产品型号</th>
                  <th>数量</th>
                  <th>单价</th>
                  <th>总价</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{{ previewQuote.product }}</td>
                  <td>{{ previewQuote.quantity }}台</td>
                  <td>{{ previewQuote.unitPrice }} {{ previewQuote.currency }}</td>
                  <td>{{ previewQuote.totalAmount }} {{ previewQuote.currency }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="quote-section">
            <h4>备注</h4>
            <p>{{ previewQuote.remark || '无' }}</p>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { store, syncAllFromSupabase } from '../store.js'
import { exportToExcel } from '../utils/excelExport.js'

const props = defineProps({
  currentSubPage: {
    type: String,
    default: 'freight'
  }
})

const activeTab = ref(props.currentSubPage || 'freight')

watch(() => props.currentSubPage, (newVal) => {
  if (newVal && activeTab.value !== newVal) {
    activeTab.value = newVal
  }
}, { immediate: true })

onMounted(async () => {
  await syncAllFromSupabase()
})

const filterCustomer = ref('')
const filterDate = ref('')
const quotationKeyword = ref('')
const quotationDate = ref('')
const summaryDate = ref(new Date().toISOString().split('T')[0])

const showFreightDialog = ref(false)
const showQuotationDialog = ref(false)
const showPreviewDialog = ref(false)

const isEditingFreight = ref(false)
const isEditingQuotation = ref(false)

const freightForm = reactive({
  id: '',
  customerId: '',
  customerName: '',
  model: '',
  quantity: 1,
  logisticsNo: '',
  freightAmount: '',
  currency: 'USD',
  exchangeRate: 7.2,
  rmbAmount: '',
  registerDate: new Date().toISOString().split('T')[0],
  settled: false
})

const quotationForm = reactive({
  id: '',
  customerName: '',
  product: '',
  quantity: 1,
  unitPrice: '',
  currency: 'USD',
  totalAmount: '',
  quoteDate: new Date().toISOString().split('T')[0],
  validUntil: '',
  remark: ''
})

const previewQuote = ref(null)

const freights = ref([
  { id: '1', customerId: 'c1', customerName: 'Hans', model: 'E7 Elite', quantity: 2, logisticsNo: 'SF123456', freightAmount: '50', currency: 'USD', exchangeRate: 7.2, rmbAmount: '360', registerDate: '2024-01-10', settled: true },
  { id: '2', customerId: 'c2', customerName: 'Ethan', model: 'NE75', quantity: 1, logisticsNo: 'SF123457', freightAmount: '35', currency: 'USD', exchangeRate: 7.2, rmbAmount: '252', registerDate: '2024-01-12', settled: false }
])

const quotations = ref([
  { id: 'QT-2024-001', customerName: 'Hans', product: 'E7 Elite', quantity: 100, unitPrice: '150', currency: 'USD', totalAmount: '15000', quoteDate: '2024-01-05', validUntil: '2024-02-05', remark: '' },
  { id: 'QT-2024-002', customerName: 'Ethan', product: 'NE75', quantity: 50, unitPrice: '120', currency: 'USD', totalAmount: '6000', quoteDate: '2024-01-10', validUntil: '2024-02-10', remark: '包含运费' }
])

const summaryData = ref([])
const summaryType = ref('customer')

const filteredFreights = computed(() => {
  return freights.value.filter(f => {
    const matchCustomer = !filterCustomer.value || f.customerId === filterCustomer.value
    const matchDate = !filterDate.value || f.registerDate.startsWith(filterDate.value)
    return matchCustomer && matchDate
  })
})

const filteredQuotations = computed(() => {
  return quotations.value.filter(q => {
    const matchKeyword = !quotationKeyword.value || 
      q.customerName.toLowerCase().includes(quotationKeyword.value.toLowerCase()) ||
      q.product.toLowerCase().includes(quotationKeyword.value.toLowerCase()) ||
      q.id.toLowerCase().includes(quotationKeyword.value.toLowerCase())
    const matchDate = !quotationDate.value || q.quoteDate.startsWith(quotationDate.value)
    return matchKeyword && matchDate
  })
})

const totalFreightAmount = computed(() => {
  return summaryData.value.reduce((sum, item) => sum + parseFloat(item.totalFreight), 0).toFixed(2)
})

function handleAddFreight() {
  isEditingFreight.value = false
  Object.assign(freightForm, {
    id: '',
    customerId: '',
    customerName: '',
    model: '',
    quantity: 1,
    logisticsNo: '',
    freightAmount: '',
    currency: 'USD',
    exchangeRate: 7.2,
    rmbAmount: '',
    registerDate: new Date().toISOString().split('T')[0],
    settled: false
  })
  showFreightDialog.value = true
}

function handleEditFreight(row) {
  isEditingFreight.value = true
  Object.assign(freightForm, row)
  showFreightDialog.value = true
}

function handleDeleteFreight(row) {
  if (confirm('确定删除该运费记录吗？')) {
    const idx = freights.value.findIndex(f => f.id === row.id)
    if (idx > -1) {
      freights.value.splice(idx, 1)
    }
  }
}

function confirmFreight() {
  if (!freightForm.customerId || !freightForm.freightAmount) {
    alert('请填写客户和运费金额')
    return
  }
  
  const customer = store.customers.find(c => c.id === freightForm.customerId)
  freightForm.customerName = customer ? customer.name : ''
  
  freightForm.rmbAmount = (parseFloat(freightForm.freightAmount) * parseFloat(freightForm.exchangeRate)).toFixed(2)
  
  if (isEditingFreight.value) {
    const idx = freights.value.findIndex(f => f.id === freightForm.id)
    if (idx > -1) {
      freights.value[idx] = { ...freightForm }
    }
  } else {
    freightForm.id = Date.now().toString()
    freights.value.unshift({ ...freightForm })
  }
  showFreightDialog.value = false
}

function handleAddQuotation() {
  isEditingQuotation.value = false
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const count = quotations.value.filter(q => q.id.startsWith(`QT-${year}-${month}`)).length + 1
  
  Object.assign(quotationForm, {
    id: `QT-${year}-${month}${String(count).padStart(3, '0')}`,
    customerName: '',
    product: '',
    quantity: 1,
    unitPrice: '',
    currency: 'USD',
    totalAmount: '',
    quoteDate: new Date().toISOString().split('T')[0],
    validUntil: '',
    remark: ''
  })
  showQuotationDialog.value = true
}

function handleEditQuotation(row) {
  isEditingQuotation.value = true
  Object.assign(quotationForm, row)
  showQuotationDialog.value = true
}

function previewQuotation(row) {
  previewQuote.value = row
  showPreviewDialog.value = true
}

function handleDeleteQuotation(row) {
  if (confirm(`确定删除报价单 ${row.id} 吗？`)) {
    const idx = quotations.value.findIndex(q => q.id === row.id)
    if (idx > -1) {
      quotations.value.splice(idx, 1)
    }
  }
}

function confirmQuotation() {
  if (!quotationForm.customerName || !quotationForm.product || !quotationForm.unitPrice) {
    alert('请填写客户、产品和单价')
    return
  }
  
  quotationForm.totalAmount = (parseFloat(quotationForm.unitPrice) * parseFloat(quotationForm.quantity)).toFixed(2)
  
  if (isEditingQuotation.value) {
    const idx = quotations.value.findIndex(q => q.id === quotationForm.id)
    if (idx > -1) {
      quotations.value[idx] = { ...quotationForm }
    }
  } else {
    quotations.value.unshift({ ...quotationForm })
  }
  showQuotationDialog.value = false
}

function generateSummary() {
  if (!summaryDate.value) {
    alert('请选择月份')
    return
  }
  
  const month = summaryDate.value
  const monthlyDeliveries = store.sampleDeliveries.filter(s => s.sendDate && s.sendDate.startsWith(month))
  
  const resultMap = {}
  
  monthlyDeliveries.forEach(s => {
    let key
    if (summaryType.value === 'customer') {
      key = s.customerName || store.customers.find(c => c.id === s.customerId)?.name || '未知客户'
    } else if (summaryType.value === 'logistics') {
      key = s.logisticsCompany || '未知物流商'
    } else {
      key = s.freightForwarder || '未知货代公司'
    }
    
    if (!resultMap[key]) {
      resultMap[key] = { count: 0, totalFreight: 0, unsettled: 0, settled: 0 }
    }
    resultMap[key].count++
    resultMap[key].totalFreight += parseFloat(s.freightAmount) || 0
    if (s.settled) {
      resultMap[key].settled += parseFloat(s.freightAmount) || 0
    } else {
      resultMap[key].unsettled += parseFloat(s.freightAmount) || 0
    }
  })
  
  summaryData.value = Object.entries(resultMap).map(([name, data]) => ({
    customerName: name,
    count: data.count,
    totalFreight: data.totalFreight.toFixed(2),
    avgFreight: data.count > 0 ? (data.totalFreight / data.count).toFixed(2) : '0.00',
    unsettled: data.unsettled.toFixed(2),
    settled: data.settled.toFixed(2)
  }))
}

function exportFreights() {
  const headers = ['ID', '客户姓名', '机型', '样品数量', '运单号', '运费金额', '币种', '汇率', '人民币金额', '登记日期', '是否结清']
  const data = filteredFreights.value.map(f => [
    f.id, f.customerName, f.model, f.quantity, f.logisticsNo, f.freightAmount, f.currency, 
    f.exchangeRate, f.rmbAmount, f.registerDate, f.settled ? '已结清' : '未结清'
  ])
  exportToExcel('样品运费登记', headers, data)
}

function exportSummary() {
  if (summaryData.value.length === 0) {
    alert('请先生成汇总数据')
    return
  }
  
  const headers = [summaryType.value === 'customer' ? '客户姓名' : (summaryType.value === 'logistics' ? '物流商' : '货代公司'), '寄样次数', '运费总额', '平均运费', '未结金额', '已结金额']
  const data = summaryData.value.map(d => [
    d.customerName, d.count, d.totalFreight, d.avgFreight, d.unsettled, d.settled
  ])
  
  data.unshift(['月度运费汇总', '', '', '', '', ''])
  data.unshift(['总计', '', totalFreightAmount.value, '', '', ''])
  
  exportToExcel('月度运费汇总', headers, data)
}

function exportQuotations() {
  const quotes = filteredQuotations.value.map(q => ({
    id: q.id,
    quoteDate: q.quoteDate,
    customerName: q.customerName,
    validUntil: q.validUntil,
    product: q.product,
    quantity: q.quantity,
    unitPrice: q.unitPrice,
    totalAmount: q.totalAmount,
    currency: q.currency,
    remark: q.remark
  }))
  exportToExcel('报价单存档', [], quotes, { template: 'quotation' })
}

function exportSingleQuotation(quote) {
  exportToExcel(quote.id, [], [{
    id: quote.id,
    quoteDate: quote.quoteDate,
    customerName: quote.customerName,
    validUntil: quote.validUntil,
    product: quote.product,
    quantity: quote.quantity,
    unitPrice: quote.unitPrice,
    totalAmount: quote.totalAmount,
    currency: quote.currency,
    remark: quote.remark
  }], { template: 'quotation' })
}

watch(() => freights.value, () => {}, { deep: true })
watch(() => quotations.value, () => {}, { deep: true })
</script>

<style scoped>
.finance-management {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tab-content {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
  height: calc(100% - 60px);
  overflow-y: auto;
}

.search-bar {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 20px;
}

.summary-controls {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 20px;
}

.summary-content {
  background: #f9fafc;
  padding: 20px;
  border-radius: 8px;
}

.summary-total {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding: 15px;
  background: #fff;
  border-radius: 8px;
}

.total-label {
  font-size: 16px;
  font-weight: 600;
}

.total-value {
  font-size: 24px;
  font-weight: bold;
  color: #f56c6c;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #909399;
}

.quotation-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 15px;
}

.quotation-card {
  background: #f9fafc;
  border-radius: 8px;
  padding: 20px;
}

.quotation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.quotation-id {
  font-size: 16px;
  font-weight: 600;
}

.quotation-date {
  font-size: 13px;
  color: #909399;
}

.quotation-info {
  margin-bottom: 15px;
}

.info-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.label {
  font-weight: 600;
  color: #606266;
}

.total {
  font-size: 16px;
  font-weight: bold;
  color: #409EFF;
}

.quotation-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.quote-preview {
  padding: 20px;
}

.quote-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #409EFF;
}

.quote-header h2 {
  margin-bottom: 10px;
}

.quote-meta {
  display: flex;
  justify-content: center;
  gap: 30px;
  font-size: 14px;
}

.quote-body {
  max-height: 400px;
  overflow-y: auto;
}

.quote-section {
  margin-bottom: 25px;
}

.quote-section h4 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
}

.quote-section table {
  width: 100%;
  border-collapse: collapse;
}

.quote-section th, .quote-section td {
  border: 1px solid #e4e7ed;
  padding: 10px;
  text-align: center;
}

.quote-section th {
  background: #f5f7fa;
}
</style>