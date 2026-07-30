<template>
  <el-dialog 
    :model-value="visible" 
    :title="isEditing ? '编辑寄样记录' : '新增寄样记录'" 
    width="580px" 
    @update:model-value="val => emit('update:visible', val)"
    @close="handleClose"
  >
    <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="寄样编号" prop="id">
            <el-input 
              v-model="form.id" 
              placeholder="自动生成，可修改"
              :disabled="isEditing"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="客户名称" prop="customer_name">
            <el-select 
              v-model="form.customer_name" 
              placeholder="选择客户"
              filterable
              allow-create
              default-first-option
              style="width: 100%"
            >
              <el-option 
                v-for="c in customerOptions" 
                :key="c" 
                :label="c" 
                :value="c"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="机型" prop="model">
            <el-select 
              v-model="form.model" 
              placeholder="选择机型"
              filterable
              allow-create
              default-first-option
              style="width: 100%"
            >
              <el-option 
                v-for="m in modelOptions" 
                :key="m" 
                :label="m" 
                :value="m"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="收货地区" prop="area">
            <el-input 
              v-model="form.area" 
              placeholder="输入收货地区/国家"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="物流" prop="logistics">
            <el-select 
              v-model="form.logistics" 
              placeholder="选择物流"
              filterable
              allow-create
              default-first-option
              style="width: 100%"
            >
              <el-option label="SF" value="SF" />
              <el-option label="DHL" value="DHL" />
              <el-option label="FedEx" value="FedEx" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="运单号" prop="tracking_no">
            <el-input 
              v-model="form.tracking_no" 
              placeholder="输入运单号"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="发货日期" prop="send_date">
            <el-date-picker 
              v-model="form.send_date" 
              type="date" 
              value-format="YYYY-MM-DD"
              placeholder="选择发货日期"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input 
              v-model="form.remark" 
              type="textarea"
              :rows="3"
              placeholder="输入备注信息"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确认提交</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { store, addSampleDelivery, updateSampleDelivery } from '../store.js'

const props = defineProps({
  visible: { type: Boolean, default: false },
  editingRow: { type: Object, default: null }
})

const emit = defineEmits(['update:visible', 'submitted'])

const formRef = ref(null)

const modelOptions = computed(() => {
  const names = new Set()
  store.productModels.forEach(m => {
    if (m.name) names.add(m.name)
  })
  return Array.from(names).sort()
})

const customerOptions = computed(() => {
  const names = new Set()
  store.sampleDeliveries.forEach(s => {
    if (s.customer_name) names.add(s.customer_name)
  })
  return Array.from(names).sort()
})

const form = reactive({
  id: '',
  customer_name: '',
  model: '',
  area: '',
  logistics: '',
  tracking_no: '',
  send_date: '',
  remark: ''
})

const rules = {
  id: [
    { required: true, message: '请输入寄样编号', trigger: 'blur' },
    { pattern: /^\d{8}\d{2}$/, message: '格式应为YYYYMMDD+两位数字，如2026073001', trigger: 'blur' }
  ],
  customer_name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  model: [{ required: true, message: '请选择机型', trigger: 'change' }]
}

const isEditing = computed(() => !!props.editingRow)

function generateNextId() {
  const today = new Date()
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
  const todayNumbers = store.sampleDeliveries
    .map(s => {
      const match = (s.id || '').match(new RegExp(`^${dateStr}(\\d{2})$`))
      return match ? parseInt(match[1]) : 0
    })
    .filter(n => n > 0)
  const nextNumber = todayNumbers.length > 0 ? Math.max(...todayNumbers) + 1 : 1
  return `${dateStr}${String(nextNumber).padStart(2, '0')}`
}

watch(() => props.visible, (val) => {
  if (val) {
    if (props.editingRow) {
      Object.assign(form, {
        id: props.editingRow.id || '',
        customer_name: props.editingRow.customer_name || '',
        model: props.editingRow.model || '',
        area: props.editingRow.area || '',
        logistics: props.editingRow.logistics || '',
        tracking_no: props.editingRow.tracking_no || '',
        send_date: props.editingRow.send_date || '',
        remark: props.editingRow.remark || ''
      })
    } else {
      const today = new Date()
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      Object.assign(form, {
        id: generateNextId(),
        customer_name: '',
        model: '',
        area: '',
        logistics: '',
        tracking_no: '',
        send_date: todayStr,
        remark: ''
      })
    }
    formRef.value?.clearValidate()
  }
})

function handleClose() {
  emit('update:visible', false)
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  
  if (!isEditing.value) {
    const exists = store.sampleDeliveries.find(s => s.id === form.id)
    if (exists) {
      ElMessage.error(`寄样编号 "${form.id}" 已存在，请更换`)
      return
    }
  }
  
  const submitData = {
    id: form.id,
    customer_name: form.customer_name,
    model: form.model,
    area: form.area || '',
    logistics: form.logistics || '',
    tracking_no: form.tracking_no || '',
    send_date: form.send_date || '',
    remark: form.remark || ''
  }
  
  let result
  if (isEditing.value) {
    result = await updateSampleDelivery(form.id, submitData)
  } else {
    result = await addSampleDelivery(submitData)
  }
  
  if (result?.syncError) {
    ElMessage.warning(`已保存本地，云端同步失败: ${result.syncError}`)
  } else {
    ElMessage.success(isEditing.value ? '寄样记录已更新' : '寄样记录已添加')
  }
  
  emit('submitted')
  emit('update:visible', false)
}
</script>
