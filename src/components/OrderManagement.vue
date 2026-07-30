<template>
  <div class="order-management">
    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="大货订单台账" name="main">
        <div class="tab-content">
          <div class="search-bar">
            <el-input v-model="searchKeyword" placeholder="搜索订单号/客户" clearable style="width: 200px" />
            <el-date-picker v-model="filterMonth" type="month" placeholder="选择月份" format="YYYY-MM" value-format="YYYY-MM" />
            <el-select v-model="filterStatus" placeholder="出货状态" clearable style="width: 120px">
              <el-option label="待确认" value="pending" />
              <el-option label="已确认" value="confirmed" />
              <el-option label="已出货" value="shipped" />
              <el-option label="已签收" value="signed" />
              <el-option label="已完成" value="completed" />
            </el-select>
            <el-select v-model="filterPaymentStatus" placeholder="尾款状态" clearable style="width: 120px">
              <el-option label="未结清" :value="false" />
              <el-option label="已结清" :value="true" />
            </el-select>
            <el-select v-model="filterCurrency" placeholder="币种" clearable style="width: 100px">
              <el-option label="USD" value="USD" />
              <el-option label="CNY" value="CNY" />
              <el-option label="EUR" value="EUR" />
            </el-select>
            <el-button type="primary" @click="handleAddOrder">新增订单</el-button>
            <el-button @click="showOrderPreview">预览全部</el-button>
            <el-button @click="exportOrders">导出Excel</el-button>
            <el-button type="danger" :disabled="orderSelection.length === 0" @click="batchDeleteOrders">批量删除 ({{ orderSelection.length }})</el-button>
          </div>
          <el-table :data="filteredOrders" border stripe header-cell-class-name="table-header" @selection-change="val => orderSelection = val">
            <el-table-column type="selection" width="45" />
            <el-table-column prop="id" label="订单ID" width="120">
              <template #default="{ row }">
                <el-tooltip :content="row.id" placement="top">
                  <span class="order-id-cell">{{ row.id }}</span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column prop="customerName" label="客户姓名" width="120" />
            <el-table-column prop="model" label="机型" width="100" />
            <el-table-column prop="qty" label="出货数量" width="90" align="center" />
            <el-table-column prop="bookingDate" label="订舱日期" width="110">
              <template #default="{ row }">
                {{ row.bookingDate || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="logisticsNo" label="物流单号" width="140" />
            <el-table-column label="出货状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getOrderStatusTagType(row.status)" size="small">{{ getOrderStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="订单货款" width="110" align="right">
              <template #default="{ row }">
                <span v-if="row.amount">{{ row.amount }}</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="大货运费" width="100" align="right">
              <template #default="{ row }">
                <span v-if="row.bulkFreight">{{ row.bulkFreight }}</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="币种" width="70" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.currency" size="small" type="info">{{ row.currency }}</el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="尾款状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.balanceSettled ? 'success' : 'warning'" size="small">{{ row.balanceSettled ? '已结清' : '未结清' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="handleEditOrder(row)">编辑</el-button>
                <el-button size="small" @click="previewSingleOrder(row)">预览</el-button>
                <el-button size="small" @click="exportSingleOrder(row)">导出</el-button>
                <el-button size="small" type="danger" @click="handleDeleteOrder(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="物流运单跟踪" name="logistics">
        <div class="tab-content">
          <div class="search-bar">
            <el-input v-model="logisticsKeyword" placeholder="搜索运单号/客户" clearable style="width: 250px" />
            <el-select v-model="logisticsStatus" placeholder="物流状态" clearable style="width: 120px">
              <el-option label="待寄出" value="pending" />
              <el-option label="运输中" value="transit" />
              <el-option label="已签收" value="signed" />
              <el-option label="异常" value="exception" />
            </el-select>
            <el-button type="primary" @click="handleAddLogistics">录入运单</el-button>
            <el-button type="danger" :disabled="logisticsSelection.length === 0" @click="batchDeleteLogistics">批量删除 ({{ logisticsSelection.length }})</el-button>
          </div>
          <div class="logistics-stats">
            <div class="stat-card">
              <div class="stat-value">{{ inTransitCount }}</div>
              <div class="stat-label">运输中包裹</div>
            </div>
            <div class="stat-card warning">
              <div class="stat-value">{{ overdueCount }}</div>
              <div class="stat-label">超7天未签收</div>
            </div>
            <div class="stat-card success">
              <div class="stat-value">{{ signedCount }}</div>
              <div class="stat-label">本周已签收</div>
            </div>
          </div>
          <el-table :data="filteredLogistics" border stripe @selection-change="val => logisticsSelection = val">
            <el-table-column type="selection" width="45" />
            <el-table-column prop="id" label="运单ID" width="80" />
            <el-table-column prop="customerName" label="客户姓名" />
            <el-table-column prop="logisticsNo" label="顺丰运单号" />
            <el-table-column prop="sendDate" label="寄出日期" />
            <el-table-column prop="expectedSignDate" label="预计签收日" />
            <el-table-column prop="trackingInfo" label="物流信息" width="200">
              <template #default="{ row }">
                <div class="tracking-info">
                  <el-button size="small" @click="showTrackingDetail(row)">查看详情</el-button>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="物流状态">
              <template #default="{ row }">
                <el-tag :type="getLogisticsStatusTagType(row.status)" :class="{ 'overdue-tag': isOverdue(row) }">
                  {{ getLogisticsStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button size="small" @click="handleEditLogistics(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="handleDeleteLogistics(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="物流费用对账" name="bill">
        <div class="tab-content">
          <div class="search-bar">
            <el-input v-model="billKeyword" placeholder="搜索运单号" clearable style="width: 150px" />
            <el-select v-model="billCountry" placeholder="国家" clearable style="width: 120px">
              <el-option label="美国" value="美国" />
              <el-option label="德国" value="德国" />
              <el-option label="英国" value="英国" />
              <el-option label="法国" value="法国" />
              <el-option label="意大利" value="意大利" />
              <el-option label="西班牙" value="西班牙" />
              <el-option label="日本" value="日本" />
              <el-option label="韩国" value="韩国" />
              <el-option label="澳大利亚" value="澳大利亚" />
              <el-option label="其他" value="其他" />
            </el-select>
            <el-select v-model="paymentStatus" placeholder="付款状态" clearable style="width: 120px">
              <el-option label="未付款" value="unpaid" />
              <el-option label="已付款" value="paid" />
              <el-option label="已核销" value="verified" />
            </el-select>
            <el-button type="primary" @click="handleAddBill">新增账单</el-button>
            <el-button type="success" @click="handleGenerateMonthlyBills">生成本月账单</el-button>
            <el-button @click="showBillPreview">预览</el-button>
            <el-button @click="exportBills">导出Excel</el-button>
          </div>
          <div class="bill-summary">
            <div class="summary-item">
              <span class="summary-label">未结清运费总额：</span>
              <span class="summary-value danger">{{ unsettledTotal }}</span>
            </div>
          </div>
          <el-table :data="filteredBills" border stripe>
            <el-table-column prop="id" label="对账ID" width="80" />
            <el-table-column prop="logisticsNo" label="关联运单号" width="130">
              <template #default="{ row }">
                <el-tooltip :content="row.logisticsNo" placement="top">
                  <span class="order-id-cell">{{ row.logisticsNo }}</span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column prop="customerName" label="客户姓名" />
            <el-table-column prop="country" label="国家" width="100" />
            <el-table-column prop="freightForwarder" label="货代公司" />
            <el-table-column prop="freightAmount" label="运费金额" />
            <el-table-column prop="status" label="付款状态">
              <template #default="{ row }">
                <el-tag :type="getPaymentStatusTagType(row.status)">{{ getPaymentStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="verificationDate" label="核销日期" />
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button size="small" @click="handleVerify(row)">核销</el-button>
                <el-button size="small" type="danger" @click="handleDeleteBill(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="IMEI出库核对" name="imei">
        <div class="tab-content">
          <div class="imei-upload">
            <el-upload
              class="upload-demo"
              drag
              :before-upload="handleImeiUpload"
              accept=".xlsx,.xls,.csv"
            >
              <el-icon class="el-icon--upload"><upload /></el-icon>
              <div class="el-upload__text">拖拽Excel文件到此处，或<em>点击上传</em></div>
              <template #tip>
                <div class="el-upload__tip">支持xlsx、xls、csv格式文件，用于批量比对IMEI设备出库</div>
              </template>
            </el-upload>
          </div>
          <div v-if="imeiComparison.length > 0" class="imei-result">
            <h4>比对结果</h4>
            <div class="result-stats">
              <span>总条数：{{ imeiComparison.length }}</span>
              <span>匹配：{{ matchedCount }}</span>
              <span>不匹配：{{ unmatchedCount }}</span>
            </div>
            <el-table :data="imeiComparison" border stripe>
              <el-table-column prop="imei" label="IMEI号码" />
              <el-table-column prop="model" label="机型" />
              <el-table-column prop="orderId" label="关联订单" />
              <el-table-column prop="status" label="核对状态">
                <template #default="{ row }">
                  <el-tag :type="row.matched ? 'success' : 'danger'">{{ row.matched ? '匹配' : '不匹配' }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <el-dialog v-model="showOrderDialog" :title="isEditingOrder ? '编辑订单' : '新增订单'" width="500px">
      <el-form :model="orderForm" label-width="100px">
        <el-form-item label="订单号">
          <el-input v-model="orderForm.id" :disabled="!isEditingOrder" />
        </el-form-item>
        <el-form-item label="客户姓名">
          <el-select v-model="orderForm.customerId">
            <el-option v-for="c in store.customers" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="机型">
          <el-select v-model="orderForm.model" filterable>
            <el-option v-for="m in store.productModels" :key="m.id" :label="m.name" :value="m.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="出货数量">
          <el-input-number v-model="orderForm.qty" :min="1" />
        </el-form-item>
        <el-form-item label="订舱日期">
          <el-date-picker v-model="orderForm.bookingDate" type="date" />
        </el-form-item>
        <el-form-item label="物流单号">
          <el-input v-model="orderForm.logisticsNo" />
        </el-form-item>
        <el-form-item label="出货状态">
          <el-select v-model="orderForm.status">
            <el-option label="待确认" value="pending" />
            <el-option label="已确认" value="confirmed" />
            <el-option label="已出货" value="shipped" />
            <el-option label="已签收" value="signed" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单金额">
          <el-input-number v-model="orderForm.amount" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="币种">
          <el-select v-model="orderForm.currency">
            <el-option label="USD" value="USD" />
            <el-option label="CNY" value="CNY" />
            <el-option label="EUR" value="EUR" />
          </el-select>
        </el-form-item>
        <el-form-item label="大货运费">
          <el-input-number v-model="orderForm.bulkFreight" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="订单类型">
          <el-select v-model="orderForm.orderType">
            <el-option label="大货订单" value="bulk_order" />
            <el-option label="付费样品" value="paid_sample" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="orderForm.balanceSettled">尾款已结清</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showOrderDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmOrder">确定</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showLogisticsDialog" :title="isEditingLogistics ? '编辑运单' : '录入运单'" width="500px">
      <el-form :model="logisticsForm" label-width="100px">
        <el-form-item label="关联客户">
          <el-select v-model="logisticsForm.customerId">
            <el-option v-for="c in store.customers" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="顺丰运单号">
          <el-input v-model="logisticsForm.logisticsNo" />
        </el-form-item>
        <el-form-item label="寄出日期">
          <el-date-picker v-model="logisticsForm.sendDate" type="date" />
        </el-form-item>
        <el-form-item label="预计签收日">
          <el-date-picker v-model="logisticsForm.expectedSignDate" type="date" />
        </el-form-item>
        <el-form-item label="物流状态">
          <el-select v-model="logisticsForm.status">
            <el-option label="待寄出" value="pending" />
            <el-option label="运输中" value="transit" />
            <el-option label="已签收" value="signed" />
            <el-option label="异常" value="exception" />
          </el-select>
        </el-form-item>
        <el-form-item label="物流信息">
          <el-input v-model="logisticsForm.trackingInfo" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showLogisticsDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmLogistics">确定</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showBillDialog" :title="isEditingBill ? '编辑账单' : '新增账单'" width="500px">
      <el-form :model="billForm" label-width="100px">
        <el-form-item label="关联运单号">
          <el-input v-model="billForm.logisticsNo" />
        </el-form-item>
        <el-form-item label="客户姓名">
          <el-input v-model="billForm.customerName" />
        </el-form-item>
        <el-form-item label="国家">
          <el-select v-model="billForm.country">
            <el-option label="美国" value="美国" />
            <el-option label="德国" value="德国" />
            <el-option label="英国" value="英国" />
            <el-option label="法国" value="法国" />
            <el-option label="意大利" value="意大利" />
            <el-option label="西班牙" value="西班牙" />
            <el-option label="日本" value="日本" />
            <el-option label="韩国" value="韩国" />
            <el-option label="澳大利亚" value="澳大利亚" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="货代公司">
          <el-input v-model="billForm.freightForwarder" />
        </el-form-item>
        <el-form-item label="运费金额">
          <el-input v-model="billForm.amount" />
        </el-form-item>
        <el-form-item label="付款状态">
          <el-select v-model="billForm.status">
            <el-option label="未付款" value="unpaid" />
            <el-option label="已付款" value="paid" />
            <el-option label="已核销" value="verified" />
          </el-select>
        </el-form-item>
        <el-form-item label="核销日期">
          <el-date-picker v-model="billForm.verificationDate" type="date" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBillDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmBill">确定</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showTrackingDialog" title="物流跟踪详情" width="600px">
      <div v-if="trackingData" class="tracking-detail">
        <div class="tracking-header">
          <span class="tracking-no">运单号：{{ trackingData.logisticsNo }}</span>
          <el-tag :type="getLogisticsStatusTagType(trackingData.status)">{{ getLogisticsStatusLabel(trackingData.status) }}</el-tag>
        </div>
        <div class="tracking-timeline">
          <div v-for="(item, index) in trackingEvents" :key="index" class="timeline-item">
            <div class="timeline-dot" :class="{ active: index === 0 }"></div>
            <div class="timeline-content">
              <div class="timeline-time">{{ item.time }}</div>
              <div class="timeline-desc">{{ item.desc }}</div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
    
    <el-dialog v-model="showPreviewDialog" title="订单导出预览" width="800px">
      <div class="preview-container">
        <div v-for="(order, idx) in previewOrders" :key="idx" class="order-template">
          <div class="template-title">销售订单</div>
          <div class="template-info">
            <div class="info-row">
              <span class="info-label">订单编号:</span>
              <span class="info-value">{{ order.id }}</span>
              <span class="info-label">日期:</span>
              <span class="info-value">{{ order.bookingDate }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">客户名称:</span>
              <span class="info-value">{{ order.customerName }}</span>
              <span class="info-label">联系人:</span>
              <span class="info-value"></span>
            </div>
            <div class="info-row">
              <span class="info-label">物流单号:</span>
              <span class="info-value">{{ order.logisticsNo || '' }}</span>
              <span class="info-label">出货状态:</span>
              <span class="info-value">{{ order.status }}</span>
            </div>
          </div>
          <table class="template-table">
            <thead>
              <tr>
                <th>序号</th>
                <th>商品名称</th>
                <th>规格型号</th>
                <th>单位</th>
                <th>数量</th>
                <th>单价</th>
                <th>金额</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>{{ order.model }}</td>
                <td>{{ order.model }}</td>
                <td>台</td>
                <td>{{ order.qty }}</td>
                <td></td>
                <td>{{ order.amount || '' }}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
          <div class="template-total">
            <div class="total-row">
              <span class="total-label">合计金额:</span>
              <span class="total-value">{{ order.amount || '' }}</span>
            </div>
            <div class="total-row">
              <span class="total-label">尾款状态:</span>
              <span class="total-value">{{ order.balanceSettled ? '已结清' : '未结清' }}</span>
            </div>
          </div>
          <div v-if="idx < previewOrders.length - 1" class="template-divider"></div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showPreviewDialog = false">关闭</el-button>
        <el-button type="primary" @click="confirmOrderExport">导出Excel</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showBillPreviewDialog" title="物流账单预览" width="800px">
      <div class="preview-container">
        <div class="bill-preview-header">
          <span>物流费用对账 - {{ new Date().toLocaleDateString('zh-CN') }}</span>
          <span class="preview-count">共 {{ previewBills.length }} 条数据</span>
        </div>
        <div class="preview-table-wrapper">
          <table class="preview-table">
            <thead>
              <tr>
                <th>对账ID</th>
                <th>关联运单号</th>
                <th>客户姓名</th>
                <th>国家</th>
                <th>货代公司</th>
                <th>运费金额</th>
                <th>付款状态</th>
                <th>核销日期</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(bill, idx) in previewBills" :key="idx">
                <td>{{ bill.id }}</td>
                <td>{{ bill.logisticsNo }}</td>
                <td>{{ bill.customerName }}</td>
                <td>{{ bill.country }}</td>
                <td>{{ bill.freightForwarder }}</td>
                <td>{{ bill.freightAmount }}</td>
                <td>{{ getPaymentStatusLabel(bill.paymentStatus) }}</td>
                <td>{{ bill.writeOffDate || '' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <template #footer>
        <el-button @click="showBillPreviewDialog = false">关闭</el-button>
        <el-button type="primary" @click="confirmBillExport">导出Excel</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { store, addSalesOrder, updateSalesOrder, deleteSalesOrder, addLogisticsBill, updateLogisticsBill, deleteLogisticsBill, generateOrderNumber, generateMonthlyBills, syncAllFromSupabase } from '../store.js'
import { Upload } from '@element-plus/icons-vue'
import { exportToExcel, showExportPreview } from '../utils/excelExport.js'

const props = defineProps({
  currentSubPage: {
    type: String,
    default: 'main'
  }
})

const activeTab = ref(props.currentSubPage || 'main')

watch(() => props.currentSubPage, (newVal) => {
  if (newVal && activeTab.value !== newVal) {
    activeTab.value = newVal
  }
}, { immediate: true })

onMounted(async () => {
  await syncAllFromSupabase()
})

const searchKeyword = ref('')
const filterMonth = ref('')
const filterStatus = ref('')
const filterPaymentStatus = ref('')
const filterCurrency = ref('')
const logisticsKeyword = ref('')
const logisticsStatus = ref('')
const billKeyword = ref('')
const billCountry = ref('')
const paymentStatus = ref('')

const showOrderDialog = ref(false)
const showLogisticsDialog = ref(false)
const showBillDialog = ref(false)
const showTrackingDialog = ref(false)
const showPreviewDialog = ref(false)
const showBillPreviewDialog = ref(false)
const previewHeaders = ref([])
const previewData = ref([])
const previewOrders = ref([])
const previewBills = ref([])

const isEditingOrder = ref(false)
const isEditingLogistics = ref(false)
const isEditingBill = ref(false)

const orderSelection = ref([])
const logisticsSelection = ref([])

const orderForm = reactive({
  id: '',
  customerId: '',
  customerName: '',
  model: '',
  qty: 1,
  bookingDate: new Date().toISOString().split('T')[0],
  logisticsNo: '',
  status: 'pending',
  amount: 0,
  currency: 'USD',
  bulkFreight: 0,
  orderType: 'bulk_order',
  balanceSettled: false
})

const logisticsForm = reactive({
  id: '',
  customerId: '',
  customerName: '',
  logisticsNo: '',
  sendDate: new Date().toISOString().split('T')[0],
  expectedSignDate: '',
  status: 'pending',
  trackingInfo: ''
})

const billForm = reactive({
  id: '',
  logisticsNo: '',
  customerName: '',
  country: '',
  freightForwarder: '',
  amount: '',
  status: 'unpaid',
  verificationDate: ''
})

const trackingData = ref(null)
const trackingEvents = ref([])

const imeiComparison = ref([])

const filteredOrders = computed(() => {
  return store.salesOrders.filter(o => {
    const matchKeyword = !searchKeyword.value ||
      o.id.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchKeyword.value.toLowerCase())
    const matchStatus = !filterStatus.value || o.status === filterStatus.value
    const matchPaymentStatus = filterPaymentStatus.value === '' || o.balanceSettled === filterPaymentStatus.value
    const matchCurrency = !filterCurrency.value || o.currency === filterCurrency.value
    let matchMonth = true
    if (filterMonth.value) {
      if (o.bookingDate) {
        matchMonth = o.bookingDate.startsWith(filterMonth.value)
      }
    }
    return matchKeyword && matchStatus && matchMonth && matchPaymentStatus && matchCurrency
  })
})

const filteredLogistics = computed(() => {
  return store.sampleDeliveries.filter(s => {
    const matchKeyword = !logisticsKeyword.value || 
      s.logisticsNo.toLowerCase().includes(logisticsKeyword.value.toLowerCase()) ||
      s.customerName.toLowerCase().includes(logisticsKeyword.value.toLowerCase())
    const matchStatus = !logisticsStatus.value || s.status === logisticsStatus.value
    return matchKeyword && matchStatus
  })
})

const filteredBills = computed(() => {
  return store.logisticsBills.filter(b => {
    const matchKeyword = !billKeyword.value || b.logisticsNo.toLowerCase().includes(billKeyword.value.toLowerCase())
    const matchCountry = !billCountry.value || b.country === billCountry.value
    const matchStatus = !paymentStatus.value || b.status === paymentStatus.value
    return matchKeyword && matchCountry && matchStatus
  })
})

const inTransitCount = computed(() => store.sampleDeliveries.filter(s => s.status === 'in_transit').length)
const signedCount = computed(() => store.sampleDeliveries.filter(s => s.status === 'delivered').length)
const overdueCount = computed(() => store.sampleDeliveries.filter(s => s.status === 'in_transit' && isOverdue(s)).length)

const matchedCount = computed(() => imeiComparison.value.filter(i => i.matched).length)
const unmatchedCount = computed(() => imeiComparison.value.filter(i => !i.matched).length)

const unsettledTotal = computed(() => {
  return store.logisticsBills
    .filter(b => b.status !== 'verified')
    .reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0)
    .toFixed(2)
})

function getOrderStatusTagType(status) {
  const types = { pending: 'info', confirmed: 'warning', in_progress: 'info', shipped: 'primary', signed: 'success', completed: 'success' }
  return types[status] || 'info'
}

function getOrderStatusLabel(status) {
  const labels = { pending: '待确认', confirmed: '已确认', in_progress: '进行中', shipped: '已出货', signed: '已签收', completed: '已完成' }
  return labels[status] || status
}

function getLogisticsStatusTagType(status) {
  const types = { pending: 'info', in_transit: 'warning', delivered: 'success', exception: 'danger' }
  return types[status] || 'info'
}

function getLogisticsStatusLabel(status) {
  const labels = { pending: '待寄出', in_transit: '运输中', delivered: '已签收', exception: '异常' }
  return labels[status] || status
}

function getPaymentStatusTagType(status) {
  const types = { unpaid: 'danger', paid: 'warning', verified: 'success' }
  return types[status] || 'info'
}

function getPaymentStatusLabel(status) {
  const labels = { unpaid: '未付款', paid: '已付款', verified: '已核销' }
  return labels[status] || status
}

function isOverdue(item) {
  if (!item.expectedSignDate || item.status !== 'in_transit') return false
  const expected = new Date(item.expectedSignDate)
  const today = new Date()
  const diffDays = Math.floor((today - expected) / (1000 * 60 * 60 * 24))
  return diffDays > 7
}

function handleAddOrder() {
  isEditingOrder.value = false
  Object.assign(orderForm, {
    id: generateOrderNumber(),
    customerId: '',
    customerName: '',
    model: '',
    qty: 1,
    bookingDate: new Date().toISOString().split('T')[0],
    logisticsNo: '',
    status: 'pending',
    amount: 0,
    currency: 'USD',
    bulkFreight: 0,
    orderType: 'bulk_order',
    balanceSettled: false
  })
  showOrderDialog.value = true
}

function handleEditOrder(row) {
  isEditingOrder.value = true
  Object.assign(orderForm, row)
  showOrderDialog.value = true
}

function handleDeleteOrder(row) {
  if (confirm(`确定删除这条大货订单？订单运费、货款数据会同步删除\n订单ID: ${row.id}`)) {
    deleteSalesOrder(row.id)
  }
}

function batchDeleteOrders() {
  if (orderSelection.value.length === 0) return
  if (confirm(`确定批量删除 ${orderSelection.value.length} 条大货订单？此操作不可恢复`)) {
    orderSelection.value.forEach(row => {
      deleteSalesOrder(row.id)
    })
    orderSelection.value = []
  }
}

function confirmOrder() {
  if (!orderForm.customerId || !orderForm.model) {
    alert('请填写客户和机型')
    return
  }
  const customer = store.customers.find(c => c.id === orderForm.customerId)
  orderForm.customerName = customer ? customer.name : ''
  
  if (isEditingOrder.value) {
    updateSalesOrder(orderForm.id, orderForm)
  } else {
    addSalesOrder(orderForm)
  }
  showOrderDialog.value = false
}

function handleAddLogistics() {
  isEditingLogistics.value = false
  Object.assign(logisticsForm, {
    id: '',
    customerId: '',
    customerName: '',
    logisticsNo: '',
    sendDate: new Date().toISOString().split('T')[0],
    expectedSignDate: '',
    status: 'pending',
    trackingInfo: ''
  })
  showLogisticsDialog.value = true
}

function handleEditLogistics(row) {
  isEditingLogistics.value = true
  Object.assign(logisticsForm, row)
  showLogisticsDialog.value = true
}

function handleDeleteLogistics(row) {
  if (confirm('确定删除该运单吗？')) {
    deleteSampleDelivery(row.id)
  }
}

function batchDeleteLogistics() {
  if (logisticsSelection.value.length === 0) return
  if (confirm(`确定批量删除 ${logisticsSelection.value.length} 条运单？此操作不可恢复`)) {
    logisticsSelection.value.forEach(row => {
      deleteSampleDelivery(row.id)
    })
    logisticsSelection.value = []
  }
}

function confirmLogistics() {
  if (!logisticsForm.customerId || !logisticsForm.logisticsNo) {
    alert('请填写客户和运单号')
    return
  }
  const customer = store.customers.find(c => c.id === logisticsForm.customerId)
  logisticsForm.customerName = customer ? customer.name : ''
  
  if (isEditingLogistics.value) {
    const idx = store.sampleDeliveries.findIndex(s => s.id === logisticsForm.id)
    if (idx > -1) {
      store.sampleDeliveries[idx] = { ...logisticsForm }
    }
  } else {
    const newLogistics = {
      ...logisticsForm,
      id: Date.now().toString(),
      model: '',
      sampleQty: 0,
      freightAmount: 0,
      settled: false
    }
    store.sampleDeliveries.unshift(newLogistics)
  }
  showLogisticsDialog.value = false
}

function showTrackingDetail(row) {
  trackingData.value = row
  trackingEvents.value = [
    { time: row.sendDate || '未知', desc: '包裹已寄出' },
    { time: row.expectedSignDate || '未知', desc: '预计签收时间' },
    { time: '实时', desc: `当前状态：${getLogisticsStatusLabel(row.status)}` }
  ]
  showTrackingDialog.value = true
}

function handleAddBill() {
  isEditingBill.value = false
  Object.assign(billForm, {
    id: '',
    logisticsNo: '',
    customerName: '',
    country: '',
    freightForwarder: '',
    amount: '',
    status: 'unpaid',
    verificationDate: ''
  })
  showBillDialog.value = true
}

function handleGenerateMonthlyBills() {
  const result = generateMonthlyBills()
  alert(`成功生成 ${result.generatedCount} 条本月物流账单`)
}

function handleVerify(row) {
  const idx = store.logisticsBills.findIndex(b => b.id === row.id)
  if (idx > -1) {
    store.logisticsBills[idx].status = 'verified'
    store.logisticsBills[idx].verificationDate = new Date().toISOString().split('T')[0]
  }
}

function handleDeleteBill(row) {
  if (confirm('确定删除该账单吗？')) {
    deleteLogisticsBill(row.id)
  }
}

function confirmBill() {
  if (!billForm.logisticsNo || !billForm.amount) {
    alert('请填写运单号和金额')
    return
  }
  
  if (isEditingBill.value) {
    updateLogisticsBill(billForm)
  } else {
    addLogisticsBill(billForm)
  }
  showBillDialog.value = false
}

function handleImeiUpload(file) {
  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target.result
    const lines = content.split('\n').filter(l => l.trim())
    const headers = lines[0].split('\t')
    const data = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t')
      const row = {}
      headers.forEach((h, idx) => {
        row[h.trim()] = values[idx] ? values[idx].trim() : ''
      })
      data.push(row)
    }
    
    imeiComparison.value = data.map(d => ({
      imei: d.IMEI || d.imei || '',
      model: d.机型 || d.model || '',
      orderId: d.订单号 || d.orderId || '',
      matched: store.salesOrders.some(o => o.id === (d.订单号 || d.orderId))
    }))
  }
  
  if (file.name.endsWith('.csv')) {
    reader.readAsText(file)
  } else {
    reader.readAsBinaryString(file)
  }
  
  return false
}

function showOrderPreview() {
  previewOrders.value = filteredOrders.value.map(o => ({
    id: o.id,
    bookingDate: o.bookingDate,
    customerName: o.customerName,
    logisticsNo: o.logisticsNo,
    status: getOrderStatusLabel(o.status),
    model: o.model,
    qty: o.qty,
    amount: o.amount,
    currency: o.currency || 'USD',
    bulkFreight: o.bulkFreight || 0,
    orderType: o.orderType === 'paid_sample' ? '付费样品' : '大货订单',
    balanceSettled: o.balanceSettled
  }))
  showPreviewDialog.value = true
}

function showBillPreview() {
  previewBills.value = filteredBills.value.map(b => ({
    id: b.id,
    logisticsNo: b.logisticsNo,
    customerName: b.customerName,
    country: b.country || '-',
    freightForwarder: b.freightForwarder || '-',
    freightAmount: b.freightAmount,
    paymentStatus: b.paymentStatus,
    writeOffDate: b.writeOffDate || ''
  }))
  showBillPreviewDialog.value = true
}

function confirmOrderExport() {
  exportToExcel('订单台账', [], previewOrders.value, { template: 'order' })
  showPreviewDialog.value = false
}

function confirmBillExport() {
  exportToExcel('物流账单', [], previewBills.value, { template: 'bill' })
  showBillPreviewDialog.value = false
}

function exportOrders() {
  const orders = filteredOrders.value.map(o => ({
    id: o.id,
    bookingDate: o.bookingDate,
    customerName: o.customerName,
    logisticsNo: o.logisticsNo,
    status: getOrderStatusLabel(o.status),
    model: o.model,
    qty: o.qty,
    amount: o.amount,
    currency: o.currency || 'USD',
    bulkFreight: o.bulkFreight || 0,
    orderType: o.orderType === 'paid_sample' ? '付费样品' : '大货订单',
    balanceSettled: o.balanceSettled
  }))
  exportToExcel('大货订单台账', [], orders, { template: 'order' })
}

function previewSingleOrder(order) {
  previewOrders.value = [{
    id: order.id,
    bookingDate: order.bookingDate,
    customerName: order.customerName,
    logisticsNo: order.logisticsNo,
    status: getOrderStatusLabel(order.status),
    model: order.model,
    qty: order.qty,
    amount: order.amount,
    currency: order.currency || 'USD',
    bulkFreight: order.bulkFreight || 0,
    orderType: order.orderType === 'paid_sample' ? '付费样品' : '大货订单',
    balanceSettled: order.balanceSettled
  }]
  showPreviewDialog.value = true
}

function exportSingleOrder(order) {
  exportToExcel(order.id, [], [{
    id: order.id,
    bookingDate: order.bookingDate,
    customerName: order.customerName,
    logisticsNo: order.logisticsNo,
    status: getOrderStatusLabel(order.status),
    model: order.model,
    qty: order.qty,
    amount: order.amount,
    currency: order.currency || 'USD',
    bulkFreight: order.bulkFreight || 0,
    orderType: order.orderType === 'paid_sample' ? '付费样品' : '大货订单',
    balanceSettled: order.balanceSettled
  }], { template: 'order' })
}

function exportBills() {
  const headers = ['对账ID', '关联运单号', '客户姓名', '国家', '货代公司', '运费金额', '付款状态', '核销日期']
  const data = filteredBills.value.map(b => [
    b.id, b.logisticsNo, b.customerName, b.country || '', b.freightForwarder || '', 
    b.amount, getPaymentStatusLabel(b.status), b.verificationDate || ''
  ])
  exportToExcel('物流对账', headers, data)
}



function deleteSampleDelivery(id) {
  const idx = store.sampleDeliveries.findIndex(s => s.id === id)
  if (idx > -1) {
    store.sampleDeliveries.splice(idx, 1)
  }
}

watch(() => store.salesOrders, () => {}, { deep: true })
watch(() => store.sampleDeliveries, () => {}, { deep: true })
watch(() => store.logisticsBills, () => {}, { deep: true })
</script>

<style scoped>
.order-management {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.order-id-cell {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.order-id-preview {
  padding: 10px 0;
  margin-bottom: 10px;
  background: #f5f7fa;
  border-radius: 4px;
  padding-left: 120px;
}

.order-id-preview .label {
  font-weight: bold;
  color: #606266;
}

.order-id-preview .value {
  font-weight: bold;
  color: #409EFF;
  font-size: 16px;
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

.logistics-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  flex: 1;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

.stat-card.warning {
  background: #fff7e6;
}

.stat-card.success {
  background: #f6ffed;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-card.warning .stat-value {
  color: #fa8c16;
}

.stat-card.success .stat-value {
  color: #52c41a;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.bill-summary {
  background: #fff7e6;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.summary-label {
  font-size: 14px;
  color: #606266;
}

.summary-value {
  font-size: 20px;
  font-weight: bold;
}

.summary-value.danger {
  color: #f56c6c;
}

.imei-upload {
  margin-bottom: 20px;
}

.imei-result {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
}

.result-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
  font-size: 14px;
}

.tracking-detail {
  padding: 10px;
}

.tracking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.tracking-no {
  font-size: 16px;
  font-weight: 600;
}

.tracking-timeline {
  padding-left: 10px;
}

.timeline-item {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ccc;
  margin-top: 5px;
  flex-shrink: 0;
}

.timeline-dot.active {
  background: #409EFF;
}

.timeline-content {
  flex: 1;
}

.timeline-time {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.timeline-desc {
  font-size: 14px;
  color: #303133;
}

.overdue-tag {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.preview-container {
  max-height: 600px;
  overflow-y: auto;
  padding: 10px;
}

.order-template {
  margin-bottom: 20px;
}

.template-title {
  background: #333333;
  color: #ffffff;
  text-align: center;
  padding: 12px;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 15px;
}

.template-info {
  margin-bottom: 15px;
}

.info-row {
  display: flex;
  gap: 20px;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-label {
  font-weight: bold;
  color: #333;
}

.info-value {
  color: #666;
}

.template-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  margin-bottom: 15px;
}

.template-table th {
  background: #333333;
  color: #ffffff;
  padding: 10px 8px;
  text-align: center;
  border: 1px solid #ddd;
  font-weight: bold;
}

.template-table td {
  padding: 10px 8px;
  border: 1px solid #ddd;
  text-align: center;
}

.template-total {
  margin-top: 10px;
}

.total-row {
  display: flex;
  gap: 10px;
  padding: 8px 12px;
  background: #333333;
  color: #ffffff;
  font-weight: bold;
  margin-bottom: 5px;
}

.total-label {
  font-weight: bold;
}

.total-value {
  font-weight: bold;
}

.template-divider {
  height: 2px;
  background: #333;
  margin: 20px 0;
}

.order-management .el-table th.table-header {
  background-color: #f5f7fa !important;
  color: #303133 !important;
  font-weight: 700;
  text-align: center;
}

.order-management .el-table--striped .el-table__body tr.el-table__row--striped td {
  background-color: #fafafa !important;
}

.order-management .el-table__body tr:hover > td {
  background-color: #ecf5ff !important;
}

.order-management .search-bar .el-button + .el-button {
  margin-left: 6px;
}

.order-management .search-bar .el-button:not(.el-button--primary):not(.el-button--danger) {
  border-color: #dcdfe6;
  color: #606266;
  background-color: #fff;
}

.order-management .search-bar .el-button:not(.el-button--primary):not(.el-button--danger):hover {
  border-color: #409eff;
  color: #409eff;
  background-color: #ecf5ff;
}

.order-management .el-button--small {
  border-radius: 4px;
  padding: 6px 12px;
  margin-right: 6px;
}

.order-management .el-button--danger.el-button--small {
  background-color: #f56c6c;
  border-color: #f56c6c;
}
</style>