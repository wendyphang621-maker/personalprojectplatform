import { reactive, watch } from 'vue'

const AUTH_KEY = 'project_workbench_auth'
const USER_PREFIX = 'project_workbench_user_'
const DATA_VERSION = 'v13'

const defaultUser = {
  name: '张三',
  avatar: '',
  role: 'sales_assistant',
  position: '销售助理',
  quickCustomers: [],
  defaultReportFormat: 'excel',
  defaultLogisticsCompany: '顺丰'
}

const defaultData = {
  customerGroups: ['中东沙特组', '阿联酋UAE组', '阿曼/巴林/科威特组', '卡塔尔组', '黎巴嫩组', '欧洲客户组', '东南亚客户组'],
  logisticsCompanies: ['顺丰', 'DHL', 'FedEx', 'UPS', 'EMS'],
  localMode: true,
  currentPage: 'workbench',
  currentSubPage: '',
  currentProjectId: null,
  openProjectIds: [],
  
  projects: [
    {
      id: 'p1',
      name: '企业官网升级项目',
      description: '对现有企业官网进行全面升级改造',
      color: '#409EFF',
      createdAt: '2024-01-15',
      status: 'active',
      projectType: 'development'
    },
    {
      id: 'p2',
      name: '移动端App开发',
      description: '开发iOS和Android双平台移动应用',
      color: '#67C23A',
      createdAt: '2024-02-01',
      status: 'active',
      projectType: 'development'
    }
  ],
  stages: [
    { id: 's1', projectId: 'p1', name: '立项启动', order: 1, color: '#409EFF' },
    { id: 's2', projectId: 'p1', name: '需求分析', order: 2, color: '#67C23A' },
    { id: 's3', projectId: 'p1', name: 'UI设计', order: 3, color: '#E6A23C' },
    { id: 's4', projectId: 'p1', name: '前端开发', order: 4, color: '#F56C6C' },
    { id: 's5', projectId: 'p1', name: '后端开发', order: 5, color: '#909399' },
    { id: 's6', projectId: 'p1', name: '测试上线', order: 6, color: '#B37FEB' },
    { id: 's7', projectId: 'p2', name: '需求调研', order: 1, color: '#409EFF' },
    { id: 's8', projectId: 'p2', name: '架构设计', order: 2, color: '#67C23A' },
    { id: 's9', projectId: 'p2', name: '功能开发', order: 3, color: '#E6A23C' },
    { id: 's10', projectId: 'p2', name: '测试优化', order: 4, color: '#F56C6C' }
  ],
  tasks: [
    { id: 't1', projectId: 'p1', stageId: 's1', name: '项目立项申请', duration: 3, startDate: '2024-01-15', completed: true, milestone: true, customerName: '', model: '', logisticsNo: '', email: '', sampleQty: 0 },
    { id: 't2', projectId: 'p1', stageId: 's1', name: '组建项目团队', duration: 5, startDate: '2024-01-16', completed: true, customerName: '', model: '', logisticsNo: '', email: '', sampleQty: 0 },
    { id: 't3', projectId: 'p1', stageId: 's2', name: '用户访谈', duration: 7, startDate: '2024-01-22', completed: true, customerName: '', model: '', logisticsNo: '', email: '', sampleQty: 0 },
    { id: 't4', projectId: 'p1', stageId: 's2', name: '需求文档编写', duration: 5, startDate: '2024-01-29', completed: true, customerName: '', model: '', logisticsNo: '', email: '', sampleQty: 0 },
    { id: 't5', projectId: 'p1', stageId: 's3', name: '首页设计', duration: 5, startDate: '2024-02-05', completed: true, customerName: '', model: '', logisticsNo: '', email: '', sampleQty: 0 },
    { id: 't6', projectId: 'p1', stageId: 's3', name: '详情页设计', duration: 4, startDate: '2024-02-12', completed: true, customerName: '', model: '', logisticsNo: '', email: '', sampleQty: 0 },
    { id: 't7', projectId: 'p1', stageId: 's4', name: '首页前端开发', duration: 6, startDate: '2024-02-19', completed: false, milestone: true, customerName: '', model: '', logisticsNo: '', email: '', sampleQty: 0 },
    { id: 't8', projectId: 'p1', stageId: 's4', name: '列表页前端开发', duration: 5, startDate: '2024-02-26', completed: false, customerName: '', model: '', logisticsNo: '', email: '', sampleQty: 0 },
    { id: 't9', projectId: 'p1', stageId: 's5', name: '用户模块开发', duration: 8, startDate: '2024-02-19', completed: false, customerName: '', model: '', logisticsNo: '', email: '', sampleQty: 0 },
    { id: 't10', projectId: 'p1', stageId: 's5', name: '权限模块开发', duration: 5, startDate: '2024-03-04', completed: false, customerName: '', model: '', logisticsNo: '', email: '', sampleQty: 0 },
    { id: 't11', projectId: 'p1', stageId: 's6', name: '系统测试', duration: 7, startDate: '2024-03-18', completed: false, customerName: '', model: '', logisticsNo: '', email: '', sampleQty: 0 },
    { id: 't12', projectId: 'p1', stageId: 's6', name: '上线部署', duration: 2, startDate: '2024-03-27', completed: false, milestone: true, customerName: '', model: '', logisticsNo: '', email: '', sampleQty: 0 },
    { id: 't13', projectId: 'p2', stageId: 's7', name: '市场调研', duration: 5, startDate: '2024-02-01', completed: true, customerName: '', model: '', logisticsNo: '', email: '', sampleQty: 0 },
    { id: 't14', projectId: 'p2', stageId: 's7', name: '竞品分析', duration: 3, startDate: '2024-02-06', completed: true, customerName: '', model: '', logisticsNo: '', email: '', sampleQty: 0 },
    { id: 't15', projectId: 'p2', stageId: 's8', name: '技术选型', duration: 4, startDate: '2024-02-12', completed: true, customerName: '', model: '', logisticsNo: '', email: '', sampleQty: 0 },
    { id: 't16', projectId: 'p2', stageId: 's8', name: '架构设计文档', duration: 5, startDate: '2024-02-16', completed: true, customerName: '', model: '', logisticsNo: '', email: '', sampleQty: 0 },
    { id: 't17', projectId: 'p2', stageId: 's9', name: '用户登录模块', duration: 6, startDate: '2024-02-23', completed: false, customerName: '', model: '', logisticsNo: '', email: '', sampleQty: 0 },
    { id: 't18', projectId: 'p2', stageId: 's9', name: '首页功能开发', duration: 8, startDate: '2024-03-01', completed: false, customerName: '', model: '', logisticsNo: '', email: '', sampleQty: 0 },
    { id: 't19', projectId: 'p2', stageId: 's10', name: '功能测试', duration: 6, startDate: '2024-03-20', completed: false, customerName: '', model: '', logisticsNo: '', email: '', sampleQty: 0 },
    { id: 't20', projectId: 'p2', stageId: 's10', name: '性能优化', duration: 4, startDate: '2024-03-27', completed: false, customerName: '', model: '', logisticsNo: '', email: '', sampleQty: 0 }
  ],
  
  customers: [
    { id: 'c1', name: 'Hans', group: '欧洲客户组', country: '德国', region: '欧洲', company: 'Hans GmbH', email: 'hans@example.com', phone: '+49123456789', address: '柏林', model: 'E7 Elite', firstContactDate: '2024-01-10', sampleCount: 3, notes: '对产品质量要求较高', localMaterialPath: '', attachments: [] },
    { id: 'c2', name: 'Ethan', group: '东南亚客户组', country: '美国', region: '北美洲', company: 'Ethan Inc', email: 'ethan@example.com', phone: '+11234567890', address: '纽约', model: 'NE75', firstContactDate: '2024-01-15', sampleCount: 2, notes: '潜在大客户', localMaterialPath: '', attachments: [] },
    { id: 'c3', name: 'Jason', group: '东南亚客户组', country: '加拿大', region: '北美洲', company: 'Jason Co', email: 'jason@example.com', phone: '+12345678901', address: '多伦多', model: 'NE76', firstContactDate: '2024-02-01', sampleCount: 1, notes: '', localMaterialPath: '', attachments: [] },
    { id: 'c4', name: 'Ralph', group: '欧洲客户组', country: '英国', region: '欧洲', company: 'Ralph Ltd', email: 'ralph@example.com', phone: '+44123456789', address: '伦敦', model: 'MTK6500', firstContactDate: '2024-02-10', sampleCount: 4, notes: '长期合作伙伴', localMaterialPath: '', attachments: [] },
    { id: 'c5', name: 'Mr.Krish', group: '中东沙特组', country: '沙特阿拉伯', region: '中东', company: 'Krish Enterprises', email: 'krish@example.com', phone: '+91123456789', address: '利雅得', model: 'E7 Elite', firstContactDate: '2024-02-15', sampleCount: 1, notes: '', localMaterialPath: '', attachments: [] }
  ],
  
  sampleDeliveries: [
    { id: '2026070101', customer_name: 'Hans', model: 'E7 Elite', area: '德国', logistics: 'SF', tracking_no: 'SF1234567890', send_date: '2024-03-01', remark: '长期合作客户' },
    { id: '2026070102', customer_name: 'Ethan', model: 'NE75', area: '美国', logistics: 'DHL', tracking_no: 'SF1234567891', send_date: '2024-03-05', remark: '' },
    { id: '2026070103', customer_name: 'Ralph', model: 'MTK6500', area: '英国', logistics: 'DHL', tracking_no: 'SF1234567892', send_date: '2024-03-08', remark: '' },
    { id: '2026070201', customer_name: 'Hans', model: 'E7 Elite', area: '德国', logistics: 'DHL', tracking_no: 'DH202607001', send_date: '2026-07-02', remark: '' },
    { id: '2026070501', customer_name: 'Ethan', model: 'NE76', area: '美国', logistics: 'FedEx', tracking_no: 'FE202607001', send_date: '2026-07-05', remark: '' },
    { id: '2026070801', customer_name: 'Jason', model: 'E7 Elite', area: '中国', logistics: 'SF', tracking_no: 'SF202607001', send_date: '2026-07-08', remark: '国内寄送' },
    { id: '2026071001', customer_name: 'Mr.Krish', model: 'NE75', area: '印度', logistics: 'DHL', tracking_no: 'DH202607002', send_date: '2026-07-10', remark: '' },
    { id: '2026071201', customer_name: 'Hans', model: 'NE76', area: '德国', logistics: 'DHL', tracking_no: 'DH202607005', send_date: '2026-07-12', remark: '' },
    { id: '2026071501', customer_name: 'Ralph', model: 'MTK6500', area: '英国', logistics: 'SF', tracking_no: 'SF202607002', send_date: '2026-07-15', remark: '' },
    { id: '2026070104', customer_name: 'Ethan', model: 'E7 Elite', area: '美国', logistics: 'DHL', tracking_no: 'DH202607003', send_date: '2026-07-01', remark: '' },
    { id: '2026070301', customer_name: 'Jason', model: 'NE76', area: '中国', logistics: 'FedEx', tracking_no: 'FE202607002', send_date: '2026-07-03', remark: '' },
    { id: '2026070601', customer_name: 'Ralph', model: 'E7 Elite', area: '英国', logistics: 'SF', tracking_no: 'SF202607003', send_date: '2026-07-06', remark: '' },
    { id: '2026070901', customer_name: 'Mr.Krish', model: 'MTK6500', area: '印度', logistics: 'DHL', tracking_no: 'DH202607006', send_date: '2026-07-09', remark: '待签收' },
    { id: '2026071101', customer_name: 'Hans', model: 'NE75', area: '德国', logistics: 'DHL', tracking_no: 'DH202607004', send_date: '2026-07-11', remark: '待签收' },
    { id: '2026071401', customer_name: 'Ethan', model: 'MTK6500', area: '美国', logistics: 'FedEx', tracking_no: 'FE202607003', send_date: '2026-07-14', remark: '待签收' }
  ],
  
  salesOrders: [
    { id: 'so1', customerId: 'c1', customerName: 'Hans', model: 'E7 Elite', qty: 100, bookingDate: '2024-03-10', logisticsNo: 'SF1234567893', status: 'in_progress', amount: 50000, currency: 'USD', bulkFreight: 200, orderType: 'bulk_order', balanceSettled: false },
    { id: 'so2', customerId: 'c4', customerName: 'Ralph', model: 'MTK6500', qty: 200, bookingDate: '2024-03-05', logisticsNo: 'SF1234567894', status: 'shipped', amount: 80000, currency: 'USD', bulkFreight: 350, orderType: 'bulk_order', balanceSettled: true },
    { id: 'SO26070001', customerId: 'c1', customerName: 'Hans', model: 'E7 Elite', qty: 150, bookingDate: '2026-07-03', logisticsNo: 'DH202607001', status: 'shipped', amount: 75000, currency: 'USD', bulkFreight: 280, orderType: 'bulk_order', balanceSettled: true },
    { id: 'SO26070002', customerId: 'c2', customerName: 'Ethan', model: 'NE76', qty: 200, bookingDate: '2026-07-06', logisticsNo: 'FE202607001', status: 'in_progress', amount: 100000, currency: 'USD', bulkFreight: 320, orderType: 'bulk_order', balanceSettled: false },
    { id: 'SO26070003', customerId: 'c3', customerName: 'Jason', model: 'E7 Elite', qty: 80, bookingDate: '2026-07-09', logisticsNo: 'SF202607001', status: 'shipped', amount: 40000, currency: 'CNY', bulkFreight: 1500, orderType: 'bulk_order', balanceSettled: true },
    { id: 'SO26070004', customerId: 'c5', customerName: 'Mr.Krish', model: 'NE75', qty: 120, bookingDate: '2026-07-11', logisticsNo: 'DH202607002', status: 'in_progress', amount: 60000, currency: 'USD', bulkFreight: 250, orderType: 'bulk_order', balanceSettled: false },
    { id: 'SO26070005', customerId: 'c4', customerName: 'Ralph', model: 'MTK6500', qty: 250, bookingDate: '2026-07-14', logisticsNo: 'UP202607001', status: 'pending', amount: 100000, currency: 'USD', bulkFreight: 400, orderType: 'bulk_order', balanceSettled: false },
    { id: 'SO26070006', customerId: 'c1', customerName: 'Hans', model: 'NE75', qty: 100, bookingDate: '2026-07-01', logisticsNo: 'SF202607004', status: 'shipped', amount: 50000, currency: 'USD', bulkFreight: 220, orderType: 'bulk_order', balanceSettled: true },
    { id: 'SO26070007', customerId: 'c2', customerName: 'Ethan', model: 'E7 Elite', qty: 180, bookingDate: '2026-07-04', logisticsNo: 'DH202607005', status: 'shipped', amount: 90000, currency: 'USD', bulkFreight: 310, orderType: 'bulk_order', balanceSettled: true },
    { id: 'SO26070008', customerId: 'c3', customerName: 'Jason', model: 'NE76', qty: 150, bookingDate: '2026-07-07', logisticsNo: 'FE202607004', status: 'in_progress', amount: 75000, currency: 'USD', bulkFreight: 290, orderType: 'bulk_order', balanceSettled: false },
    { id: 'SO26070009', customerId: 'c4', customerName: 'Ralph', model: 'E7 Elite', qty: 200, bookingDate: '2026-07-10', logisticsNo: 'SF202607005', status: 'in_progress', amount: 100000, currency: 'USD', bulkFreight: 380, orderType: 'bulk_order', balanceSettled: false },
    { id: 'SO26070010', customerId: 'c5', customerName: 'Mr.Krish', model: 'MTK6500', qty: 160, bookingDate: '2026-07-13', logisticsNo: 'UP202607003', status: 'pending', amount: 64000, currency: 'USD', bulkFreight: 270, orderType: 'bulk_order', balanceSettled: false },
    { id: 'SO26070011', customerId: 'c1', customerName: 'Hans', model: 'NE76', qty: 90, bookingDate: '2026-07-16', logisticsNo: 'SF202607002', status: 'shipped', amount: 45000, currency: 'USD', bulkFreight: 190, orderType: 'paid_sample', balanceSettled: true }
  ],
  
  logisticsBills: [
    { id: 'lb1', logisticsNo: 'SF1234567890', customerName: 'Hans', country: '美国', freightForwarder: 'DHL', freightAmount: 280, paymentStatus: 'paid', billImage: '', writeOffDate: '2026-06-10' },
    { id: 'lb2', logisticsNo: 'SF1234567891', customerName: 'Ethan', country: '德国', freightForwarder: 'DHL', freightAmount: 320, paymentStatus: 'unpaid', billImage: '', writeOffDate: '' },
    { id: 'lb3', logisticsNo: 'SF1234567892', customerName: 'Jason', country: '英国', freightForwarder: 'FedEx', freightAmount: 450, paymentStatus: 'unpaid', billImage: '', writeOffDate: '' },
    { id: 'lb4', logisticsNo: 'DH202607001', customerName: 'Ralph', country: '法国', freightForwarder: 'UPS', freightAmount: 580, paymentStatus: 'verified', billImage: '', writeOffDate: '2026-07-05' },
    { id: 'lb5', logisticsNo: 'DH202607002', customerName: 'Mr.Krish', country: '意大利', freightForwarder: 'DHL', freightAmount: 390, paymentStatus: 'paid', billImage: '', writeOffDate: '2026-07-08' },
    { id: 'lb6', logisticsNo: 'FX202607003', customerName: 'Hans', country: '西班牙', freightForwarder: 'FedEx', freightAmount: 620, paymentStatus: 'unpaid', billImage: '', writeOffDate: '' },
    { id: 'lb7', logisticsNo: 'FX202607004', customerName: 'Ethan', country: '日本', freightForwarder: 'EMS', freightAmount: 240, paymentStatus: 'paid', billImage: '', writeOffDate: '2026-07-03' },
    { id: 'lb8', logisticsNo: 'UP202607005', customerName: 'Jason', country: '韩国', freightForwarder: 'UPS', freightAmount: 310, paymentStatus: 'verified', billImage: '', writeOffDate: '2026-07-06' },
    { id: 'lb9', logisticsNo: 'DH202607006', customerName: 'Ralph', country: '澳大利亚', freightForwarder: 'DHL', freightAmount: 750, paymentStatus: 'unpaid', billImage: '', writeOffDate: '' },
    { id: 'lb10', logisticsNo: 'SF202607007', customerName: 'Mr.Krish', country: '美国', freightForwarder: '顺丰', freightAmount: 180, paymentStatus: 'paid', billImage: '', writeOffDate: '2026-07-09' }
  ],
  
  productModels: [
    { id: 'pm1', name: 'E7 Elite', chip: 'MTK6789', screen: '6.5英寸 AMOLED', certifications: ['CE', 'CB', 'SASO'], renderImagePath: '', supplierId: 'sup1' },
    { id: 'pm2', name: 'NE75', chip: 'MTK6771', screen: '6.2英寸 LCD', certifications: ['CE', 'CB'], renderImagePath: '', supplierId: 'sup2' },
    { id: 'pm3', name: 'NE76', chip: 'MTK6789', screen: '6.5英寸 AMOLED', certifications: ['CE', 'SASO'], renderImagePath: '', supplierId: 'sup1' },
    { id: 'pm4', name: 'MTK6500', chip: 'MTK6580', screen: '5.5英寸 LCD', certifications: ['CE'], renderImagePath: '', supplierId: 'sup3' }
  ],
  
  certRecords: [
    { id: 'cr1', modelId: 'pm1', certType: 'CE', certNo: 'CE-2024-001', issueDate: '2024-01-01', expiryDate: '2026-12-31', certFilePath: '' },
    { id: 'cr2', modelId: 'pm1', certType: 'CB', certNo: 'CB-2024-001', issueDate: '2024-01-05', expiryDate: '2026-01-05', certFilePath: '' },
    { id: 'cr3', modelId: 'pm1', certType: 'SASO', certNo: 'SASO-2024-001', issueDate: '2024-01-10', expiryDate: '2025-07-10', certFilePath: '' },
    { id: 'cr4', modelId: 'pm2', certType: 'CE', certNo: 'CE-2024-002', issueDate: '2024-02-01', expiryDate: '2025-08-01', certFilePath: '' }
  ],
  
  dailyTodos: [
    { id: 'dt1', category: 'cat1', customerId: 'c2', modelId: '', content: '处理Ethan的样机申请', deadline: '2024-03-15', completed: false },
    { id: 'dt2', category: 'cat2', customerId: 'c1', modelId: 'pm1', content: '核对Hans订单出货数量', deadline: '2024-03-15', completed: true },
    { id: 'dt3', category: 'cat3', customerId: '', modelId: 'pm2', content: '整理NE75产品资料', deadline: '2024-03-16', completed: false },
    { id: 'dt4', category: 'cat4', customerId: 'c4', modelId: '', content: '回复Ralph关于认证证书的邮件', deadline: '2024-03-15', completed: false }
  ],
  
  suppliers: [
    { id: 'sup1', name: '深圳华星电子', contact: '李经理', phone: '13800138001', supplyModels: 'E7 Elite, NE76', qualificationPath: '' },
    { id: 'sup2', name: '东莞盛达科技', contact: '王经理', phone: '13800138002', supplyModels: 'NE75', qualificationPath: '' },
    { id: 'sup3', name: '惠州明远电子', contact: '张经理', phone: '13800138003', supplyModels: 'MTK6500', qualificationPath: '' }
  ],
  
  customerFollowUps: [
    { id: 'fu1', customerId: 'c1', customerName: 'Hans', followupDate: '2024-03-14', content: '确认客户对样机测试结果满意', result: 'positive', contactMethod: '邮件', poNumber: 'PO2024001', nextFollowup: '2024-04-14', operator: '王聪', attachments: [] },
    { id: 'fu2', customerId: 'c2', customerName: 'Ethan', followupDate: '2024-03-13', content: '发送产品报价单', result: 'pending', contactMethod: '邮件', poNumber: '', nextFollowup: '2024-03-20', operator: '王聪', attachments: [] },
    { id: 'fu3', customerId: 'c1', customerName: 'Hans', followupDate: '2026-07-01', content: '跟进E7 Elite订单生产进度', result: 'positive', contactMethod: '微信', poNumber: 'PO202607001', nextFollowup: '2026-07-15', operator: '王聪', attachments: [] },
    { id: 'fu4', customerId: 'c2', customerName: 'Ethan', followupDate: '2026-07-03', content: '确认NE76发货时间', result: 'pending', contactMethod: '邮件', poNumber: 'PO202607002', nextFollowup: '2026-07-10', operator: '王聪', attachments: [] },
    { id: 'fu5', customerId: 'c3', customerName: 'Jason', followupDate: '2026-07-05', content: '介绍新产品E7 Elite', result: 'positive', contactMethod: '展会', poNumber: '', nextFollowup: '2026-07-20', operator: '王聪', attachments: [] },
    { id: 'fu6', customerId: 'c4', customerName: 'Ralph', followupDate: '2026-07-08', content: '协商MTK6500批量采购折扣', result: 'pending', contactMethod: '电话', poNumber: '', nextFollowup: '2026-07-18', operator: '王聪', attachments: [] },
    { id: 'fu7', customerId: 'c5', customerName: 'Mr.Krish', followupDate: '2026-07-10', content: '确认NE75样机测试反馈', result: 'positive', contactMethod: '邮件', poNumber: '', nextFollowup: '2026-07-25', operator: '王聪', attachments: [] },
    { id: 'fu8', customerId: 'c1', customerName: 'Hans', followupDate: '2026-07-12', content: '发送出货确认单', result: 'positive', contactMethod: '邮件', poNumber: 'PO202607003', nextFollowup: '2026-07-22', operator: '王聪', attachments: [] },
    { id: 'fu9', customerId: 'c2', customerName: 'Ethan', followupDate: '2026-07-14', content: '跟进付款进度', result: 'pending', contactMethod: '微信', poNumber: 'PO202607002', nextFollowup: '2026-07-28', operator: '王聪', attachments: [] },
    { id: 'fu10', customerId: 'c3', customerName: 'Jason', followupDate: '2026-07-15', content: '确认下季度订单计划', result: 'positive', contactMethod: '视频会议', poNumber: '', nextFollowup: '2026-08-01', operator: '王聪', attachments: [] }
  ],
  
  developmentLetters: [
    { id: 'dl1', customerId: 'c3', sendDate: '2024-03-10', subject: '新产品介绍', content: '尊敬的Jason，您好！我们推出了新款NE76机型...', responseStatus: 'no_response' }
  ],
  
  quotationRecords: [
    { id: 'qr1', customerId: 'c1', date: '2024-03-01', model: 'E7 Elite', unitPrice: 500, quantity: 100, totalAmount: 50000, status: 'accepted' }
  ],
  
  fileLibrary: {
    expandedFolders: [],
    files: []
  },
  
  alertSettings: {
    certExpiry: true,
    logisticsOverdue: true,
    customerInactive: true
  },
  
  weeklyReports: [
    { id: 'w1', weekStart: '2024-03-11', weekEnd: '2024-03-17', content: '', tasksCompleted: [], tasksInProgress: [], nextWeekPlan: [] }
  ],
  
  activityLogs: [
    { id: 'a1', projectId: 'p1', action: '创建任务', target: '首页前端开发', time: '2024-03-15 09:30' },
    { id: 'a2', projectId: 'p1', action: '完成任务', target: '详情页设计', time: '2024-03-15 16:45' },
    { id: 'a3', projectId: 'p2', action: '更新任务', target: '首页功能开发', time: '2024-03-15 14:20' }
  ],
  
  tags: [
    { id: 'tag1', name: 'vip', label: 'VIP客户', color: '#F56C6C' },
    { id: 'tag2', name: 'urgent', label: '紧急', color: '#E6A23C' },
    { id: 'tag3', name: 'follow_up', label: '待跟进', color: '#409EFF' },
    { id: 'tag4', name: 'hot', label: '热门', color: '#67C23A' }
  ],
  
  todoCategories: [
    { id: 'cat1', name: 'sample', label: '样机申请待处理' },
    { id: 'cat2', name: 'order', label: '订单核对待处理' },
    { id: 'cat3', name: 'product', label: '产品资料整理' },
    { id: 'cat4', name: 'email', label: '客户邮件回复' },
    { id: 'cat5', name: 'color_box', label: '彩盒审核待处理' },
    { id: 'cat6', name: 'sample_earphone', label: '样机寄送-耳机' },
    { id: 'cat7', name: 'sample_phone', label: '样机寄送-手机' },
    { id: 'cat_default', name: 'other', label: '其他待办', isDefault: true }
  ],
  
  gbProjects: [
    { id: 'gb1', projectName: 'E7 Elite GB认证', stage: '资料提交', progress: 20, status: '进行中', responsible: '张三', deadline: '2024-03-30', attachments: [], remark: '首批认证产品' },
    { id: 'gb2', projectName: 'NE75 GB认证', stage: '检测中', progress: 50, status: '进行中', responsible: '李四', deadline: '2024-04-15', attachments: [], remark: '' },
    { id: 'gb3', projectName: 'NE76 GB认证', stage: '整改', progress: 65, status: '进行中', responsible: '王五', deadline: '2024-04-01', attachments: [], remark: '需补充部分测试报告' },
    { id: 'gb4', projectName: 'MTK6500 GB认证', stage: '待发证', progress: 90, status: '待验收', responsible: '张三', deadline: '2024-03-20', attachments: [], remark: '' },
    { id: 'gb5', projectName: 'E7 Elite 升级认证', stage: '已拿证', progress: 100, status: '已完成', responsible: '李四', deadline: '2024-02-15', attachments: [], remark: '认证已完成' }
  ],
  
  colorBoxProjects: [
    { id: 'cb1', projectName: 'E7 Elite 彩盒设计', designStage: '设计稿确认', progress: 30, status: '进行中', responsible: '赵六', deadline: '2024-03-25', attachments: [], remark: '' },
    { id: 'cb2', projectName: 'NE75 彩盒设计', designStage: '打样确认', progress: 70, status: '进行中', responsible: '孙七', deadline: '2024-03-30', attachments: [], remark: '样品已寄出' },
    { id: 'cb3', projectName: 'NE76 彩盒设计', designStage: '批量生产', progress: 95, status: '待验收', responsible: '赵六', deadline: '2024-03-20', attachments: [], remark: '等待工厂交货' },
    { id: 'cb4', projectName: 'MTK6500 彩盒设计', designStage: '设计稿确认', progress: 20, status: '待启动', responsible: '孙七', deadline: '2024-04-10', attachments: [], remark: '' },
    { id: 'cb5', projectName: 'E7 Elite 新版彩盒', designStage: '批量生产', progress: 100, status: '已完成', responsible: '赵六', deadline: '2024-02-28', attachments: [], remark: '已完成交付' }
  ],
  
  packageSampleFollows: [
    { 
      id: 'ps1', 
      projectName: 'NE81', 
      internalModel: 'NE81', 
      businessType: '彩盒审核',
      followStatus: '待客户审核',
      sendDate: '2026-05-20',
      receiveDate: '2026-05-22',
      nextFollowDate: '2026-07-25',
      followLogs: [
        { date: '2026/5/21', content: '催促 HTC 审核' },
        { date: '2026/6/4', content: '发送新链接' }
      ],
      remark: '',
      customField1: '',
      attachments: [],
      emailSubject: '彩盒确认',
      customer: 'HTC',
      overseasContact: 'Hans',
      colorBoxVersion: 'V2.0',
      fileLink: 'https://example.com/ne81-colorbox.pdf'
    },
    { 
      id: 'ps2', 
      projectName: 'E9 Life', 
      internalModel: 'AST08', 
      businessType: '样机寄送',
      followStatus: '进行中',
      sendDate: '2026-06-15',
      receiveDate: '',
      nextFollowDate: '2026-07-26',
      followLogs: [
        { date: '2026/6/15', content: 'DHL寄出样机' }
      ],
      remark: '',
      customField1: '',
      attachments: [],
      sendTime: '2026-06-15',
      logisticsNo: 'DHL123456789',
      logisticsCompany: 'DHL',
      receiver: 'Tilla',
      destination: '洛杉矶',
      sendPurpose: '彩盒确认样机',
      sendQty: 2
    }
  ],

  deliveryAllocations: [],
  deliverySchedules: []
}

function loadAuth() {
  try {
    const data = localStorage.getItem(AUTH_KEY)
    if (data) {
      const parsed = JSON.parse(data)
      if (parsed.authVersion !== DATA_VERSION) {
        localStorage.removeItem(AUTH_KEY)
        return createDefaultAuth()
      }
      return parsed
    }
    return createDefaultAuth()
  } catch {
    localStorage.removeItem(AUTH_KEY)
    return createDefaultAuth()
  }
}

function createDefaultAuth() {
  return {
    users: [
      { id: 'admin1', username: 'admin', password: 'Admin@123', role: 'admin', position: '管理员', createdAt: '2024-01-01' },
      { id: 'sales1', username: 'sales', password: 'Sales@123', role: 'sales_assistant', position: '销售助理', createdAt: '2024-01-01' }
    ],
    currentUser: null,
    authVersion: DATA_VERSION
  }
}

function saveAuth(data) {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Auth save failed:', e)
  }
}

function loadUserData(userId) {
  try {
    const data = localStorage.getItem(USER_PREFIX + userId)
    if (data) {
      const parsed = JSON.parse(data)
      if (parsed.dataVersion !== DATA_VERSION) {
        localStorage.removeItem(USER_PREFIX + userId)
        return { ...defaultData, user: { ...defaultUser, name: userId }, dataVersion: DATA_VERSION }
      }
      
      const result = { ...defaultData, ...parsed, user: parsed.user || { ...defaultUser, name: userId } }
      
      if (parsed.todoCategories && Array.isArray(parsed.todoCategories)) {
        const isValid = parsed.todoCategories.every(c => typeof c === 'object' && c !== null && c.id && c.name)
        if (!isValid) {
          result.todoCategories = defaultData.todoCategories
        }
      }
      
      return migrateSampleDeliveries(result)
    }
    return { ...defaultData, user: { ...defaultUser, name: userId }, dataVersion: DATA_VERSION }
  } catch {
    localStorage.removeItem(USER_PREFIX + userId)
    return { ...defaultData, user: { ...defaultUser, name: userId }, dataVersion: DATA_VERSION }
  }
}

function migrateSampleDeliveries(data) {
  if (!data.sampleDeliveries || !Array.isArray(data.sampleDeliveries)) return data
  
  data.sampleDeliveries = data.sampleDeliveries.map(sd => {
    const needsMigration = sd.customerName !== undefined || sd.sampleQty !== undefined || sd.qty !== undefined
    if (needsMigration) {
      return {
        id: sd.id,
        customer_name: sd.customer_name || sd.customerName || '',
        model: sd.model || '',
        area: sd.area || '',
        logistics: sd.logistics || sd.logisticsCompany || '',
        tracking_no: sd.tracking_no || sd.tracking_number || sd.logisticsNo || '',
        send_date: sd.send_date || sd.sendDate || '',
        remark: sd.remark || ''
      }
    }
    return sd
  })
  
  if (data.productModels && Array.isArray(data.productModels)) {
    const isCorrupted = data.productModels.some(m => {
      return !m.chip || !m.certifications
    })
    
    if (isCorrupted) {
      data.productModels = defaultData.productModels
      console.log('[数据修复] productModels 数据异常，已重置为默认值')
    } else {
      data.productModels = data.productModels.map(m => {
        if (typeof m.certifications === 'string') {
          return {
            ...m,
            certifications: m.certifications ? m.certifications.split(',') : []
          }
        }
        if (!Array.isArray(m.certifications)) {
          return { ...m, certifications: [] }
        }
        return m
      })
    }
  }
  
  if (data.customers && Array.isArray(data.customers)) {
    const customerFields = ['id', 'name', 'group', 'country', 'region', 'company', 'email', 'phone', 'address']
    data.customers = data.customers.map(c => {
      const cleaned = {}
      customerFields.forEach(f => {
        if (c[f] !== undefined) cleaned[f] = c[f]
      })
      return { ...cleaned, attachments: [], localMaterialPath: '', notes: c.notes || '' }
    })
  }
  
  return data
}

function saveUserData(userId, data) {
  try {
    localStorage.setItem(USER_PREFIX + userId, JSON.stringify(data))
  } catch (e) {
    console.error('User data save failed:', e)
  }
}

function saveToLocalStorage() {
  if (!currentUserId) return
  try {
    const data = {
      user: store.user,
      customers: store.customers,
      productModels: store.productModels,
      sampleDeliveries: store.sampleDeliveries,
      sampleRecords: store.sampleRecords,
      followups: store.followups,
      customerGroups: store.customerGroups,
      tasks: store.tasks,
      dailyTodos: store.dailyTodos,
      orderProducts: store.orderProducts,
      certRecords: store.certRecords,
      suppliers: store.suppliers,
      logisticsBills: store.logisticsBills,
      dailyReports: store.dailyReports,
      materialRecords: store.materialRecords,
      projects: store.projects,
      stages: store.stages,
      salesOrders: store.salesOrders,
      deliveryAllocations: store.deliveryAllocations,
      deliverySchedules: store.deliverySchedules,
      dataVersion: DATA_VERSION
    }
    localStorage.setItem(USER_PREFIX + currentUserId, JSON.stringify(data))
  } catch (e) {
    console.error('Local storage save failed:', e)
  }
}

export const authStore = reactive(loadAuth())
export const store = reactive(migrateSampleDeliveries({ user: defaultUser, ...defaultData }))

let currentUserId = null

export async function login(username, password) {
  const user = authStore.users.find(u => u.username === username)
  
  if (!user) {
    return { success: false, error: '用户不存在' }
  }
  
  if (user.password !== password) {
    return { success: false, error: '密码错误' }
  }
  
  authStore.currentUser = user
  saveAuth(authStore)
  
  currentUserId = user.id
  store.user = { ...defaultUser, ...user }
  
  await syncAllFromSupabase()
  
  return { success: true, user }
}

export function logout() {
  authStore.currentUser = null
  saveAuth(authStore)
  currentUserId = null
  Object.assign(store, { user: defaultUser, ...defaultData })
}

export function register(username, password, role = 'sales_assistant', position = '销售助理') {
  if (authStore.users.find(u => u.username === username)) {
    return { success: false, error: '用户名已存在' }
  }
  
  const newUser = {
    id: generateId('u'),
    username,
    password,
    role,
    position,
    createdAt: new Date().toISOString().split('T')[0]
  }
  
  authStore.users.push(newUser)
  saveAuth(authStore)
  
  return { success: true, user: newUser }
}

export function resetPassword(username) {
  const user = authStore.users.find(u => u.username === username)
  
  if (!user) {
    return { success: false, error: '用户不存在' }
  }
  
  const newPassword = 'NewPass@' + Math.random().toString(36).substr(2, 6)
  user.password = newPassword
  saveAuth(authStore)
  
  return { success: true, newPassword }
}

export function changePassword(username, oldPassword, newPassword) {
  const user = authStore.users.find(u => u.username === username)
  
  if (!user) {
    return { success: false, error: '用户不存在' }
  }
  
  if (user.password !== oldPassword) {
    return { success: false, error: '旧密码错误' }
  }
  
  if (newPassword.length < 8) {
    return { success: false, error: '密码长度至少8位' }
  }
  
  if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(newPassword)) {
    return { success: false, error: '密码必须包含字母和数字' }
  }
  
  user.password = newPassword
  saveAuth(authStore)
  
  return { success: true }
}

export function getAuthUsers() {
  return authStore.users
}

export function deleteAuthUser(userId) {
  if (authStore.currentUser?.id === userId) {
    return { success: false, error: '不能删除当前登录用户' }
  }
  
  const index = authStore.users.findIndex(u => u.id === userId)
  if (index > -1) {
    authStore.users.splice(index, 1)
    saveAuth(authStore)
    localStorage.removeItem(USER_PREFIX + userId)
    return { success: true }
  }
  
  return { success: false, error: '用户不存在' }
}

export function updateAuthUser(userId, updates) {
  const user = authStore.users.find(u => u.id === userId)
  if (user) {
    Object.assign(user, updates)
    saveAuth(authStore)
    if (authStore.currentUser?.id === userId) {
      Object.assign(store.user, updates)
    }
    return { success: true }
  }
  return { success: false, error: '用户不存在' }
}



const idCounters = {}

export function generateId(prefix = '') {
  const now = new Date()
  const dateStr = now.getFullYear().toString().slice(2) + 
                  String(now.getMonth() + 1).padStart(2, '0') + 
                  String(now.getDate()).padStart(2, '0')
  
  const key = prefix + dateStr
  if (!idCounters[key]) {
    idCounters[key] = 1
  } else {
    idCounters[key]++
  }
  
  const seq = String(idCounters[key]).padStart(4, '0')
  return prefix + dateStr + seq
}

const permissionMatrix = {
  admin: {
    workbench: { view: true, edit: true },
    calendar: { view: true, edit: true },
    files: { view: true, edit: true },
    report: { view: true, edit: true },
    settings: { view: true, edit: true },
    project: { view: true, edit: true },
    todo: { view: true, edit: true },
    milestone: { view: true, edit: true },
    activity: { view: true, edit: true },
    customer: { view: true, edit: true },
    order: { view: true, edit: true },
    product: { view: true, edit: true },
    dailywork: { view: true, edit: true },
    finance: { view: true, edit: true }
  },
  sales_assistant: {
    workbench: { view: true, edit: true },
    calendar: { view: true, edit: true },
    files: { view: true, edit: true },
    report: { view: true, edit: false },
    settings: { view: true, edit: false },
    project: { view: true, edit: true },
    todo: { view: true, edit: false },
    milestone: { view: true, edit: false },
    activity: { view: true, edit: false },
    customer: { view: true, edit: true },
    order: { view: true, edit: true },
    product: { view: true, edit: true },
    dailywork: { view: true, edit: true },
    finance: { view: true, edit: true }
  }
}

export function isReadOnly(pageKey = '') {
  if (!authStore.currentUser) return true
  
  const role = authStore.currentUser.role
  const permissions = permissionMatrix[role]?.[pageKey]
  
  if (!permissions) return true
  
  return !permissions.edit
}

export function canView(pageKey = '') {
  if (!authStore.currentUser) return false
  
  const role = authStore.currentUser.role
  const permissions = permissionMatrix[role]?.[pageKey]
  
  return permissions?.view ?? true
}

export async function addCustomer(data) {
  const customer = {
    id: data.id || generateId('c'),
    name: data.name || '',
    group: data.group || '',
    country: data.country || '',
    region: data.region || '',
    company: data.company || '',
    email: data.email || '',
    phone: data.phone || '',
    address: data.address || '',
    model: data.model || '',
    firstContactDate: data.firstContactDate || new Date().toISOString().split('T')[0],
    sampleCount: data.sampleCount || 0,
    notes: data.notes || '',
    remark: data.remark || '',
    localMaterialPath: data.localMaterialPath || '',
    attachments: data.attachments || [],
    tags: data.tags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  store.customers.push(customer)
  
  try {
    const { syncToSupabase } = await import('./supabase.js')
    const dbData = {
      id: customer.id,
      name: customer.name,
      group: customer.group,
      country: customer.country,
      region: customer.region,
      company: customer.company,
      email: customer.email,
      phone: customer.phone,
      address: customer.address
    }
    await syncToSupabase('customers', dbData)
    console.log('[同步] 客户已保存到后端')
  } catch (error) {
    console.error('[同步] 客户保存失败:', error)
  }
  
  return customer
}

export async function updateCustomer(customer) {
  const idx = store.customers.findIndex(c => c.id === customer.id)
  if (idx > -1) {
    store.customers[idx] = { ...customer, updatedAt: new Date().toISOString() }
    
    try {
      const { syncToSupabase } = await import('./supabase.js')
      const dbData = {
        id: store.customers[idx].id,
        name: store.customers[idx].name,
        group: store.customers[idx].group,
        country: store.customers[idx].country,
        region: store.customers[idx].region,
        company: store.customers[idx].company,
        email: store.customers[idx].email,
        phone: store.customers[idx].phone,
        address: store.customers[idx].address
      }
      await syncToSupabase('customers', dbData)
      console.log('[同步] 客户已更新到后端')
    } catch (error) {
      console.error('[同步] 客户更新失败:', error)
    }
  }
}

export async function deleteCustomer(customerId) {
  const idx = store.customers.findIndex(c => c.id === customerId)
  if (idx > -1) {
    store.customers.splice(idx, 1)
    
    try {
      const { deleteFromSupabase } = await import('./supabase.js')
      await deleteFromSupabase('customers', customerId)
      console.log('[同步] 客户已删除')
    } catch (error) {
      console.error('[同步] 客户删除失败:', error)
    }
  }
}

const ALLOWED_SAMPLE_FIELDS = ['id', 'customer_name', 'model', 'area', 'logistics', 'tracking_no', 'send_date', 'remark']

function filterSampleFields(data) {
  const filtered = {}
  ALLOWED_SAMPLE_FIELDS.forEach(field => {
    if (data[field] !== undefined) {
      filtered[field] = data[field]
    }
  })
  return filtered
}

export async function addSampleDelivery(data) {
  const delivery = {
    id: data.id,
    customer_name: data.customer_name || '',
    model: data.model || '',
    area: data.area || '',
    logistics: data.logistics || '',
    tracking_no: data.tracking_no || '',
    send_date: data.send_date || '',
    remark: data.remark || ''
  }
  
  store.sampleDeliveries.push(delivery)
  saveToLocalStorage()
  
  let syncError = null
  try {
    const { syncToSupabase } = await import('./supabase.js')
    const submitData = filterSampleFields(delivery)
    const result = await syncToSupabase('sample_deliveries', submitData)
    if (result.success) {
      console.log('[同步] 寄样记录已同步到云端')
    } else {
      syncError = result.error || '云端同步失败'
      console.warn('[同步] 寄样记录云端同步失败，已保存本地:', syncError)
    }
  } catch (error) {
    syncError = error.message || '云端同步异常'
    console.warn('[同步] 寄样记录云端同步失败，已保存本地:', syncError)
  }
  
  return { ...delivery, syncError }
}

export async function updateSampleDelivery(id, data) {
  const idx = store.sampleDeliveries.findIndex(d => d.id === id)
  if (idx > -1) {
    const filteredData = filterSampleFields(data)
    const updatedData = { ...store.sampleDeliveries[idx], ...filteredData }
    store.sampleDeliveries[idx] = updatedData
    saveToLocalStorage()
    
    let syncError = null
    try {
      const { syncToSupabase } = await import('./supabase.js')
      const result = await syncToSupabase('sample_deliveries', updatedData)
      if (result.success) {
        console.log('[同步] 寄样记录已同步到云端')
      } else {
        syncError = result.error || '云端同步失败'
        console.warn('[同步] 寄样记录云端同步失败，已保存本地:', syncError)
      }
    } catch (error) {
      syncError = error.message || '云端同步异常'
      console.warn('[同步] 寄样记录云端同步失败，已保存本地:', syncError)
    }
    return { success: true, syncError }
  }
  return { success: false, error: '记录不存在' }
}

export async function deleteSampleDelivery(deliveryId) {
  const idx = store.sampleDeliveries.findIndex(d => d.id === deliveryId)
  if (idx > -1) {
    store.sampleDeliveries.splice(idx, 1)
    saveToLocalStorage()
    
    try {
      const { deleteFromSupabase } = await import('./supabase.js')
      await deleteFromSupabase('sample_deliveries', deliveryId)
      console.log('[同步] 寄样记录已从云端删除')
    } catch (error) {
      console.warn('[同步] 寄样记录云端删除失败，已删除本地:', error.message)
    }
  }
}

export function addLogisticsCompany(name) {
  if (!name || !name.trim()) {
    return { success: false, error: '请输入物流商名称' }
  }
  if (!store.logisticsCompanies) {
    store.logisticsCompanies = ['顺丰', 'DHL', 'FedEx', 'UPS', 'EMS']
  }
  if (store.logisticsCompanies.includes(name.trim())) {
    return { success: false, error: '物流商已存在' }
  }
  store.logisticsCompanies.push(name.trim())
  return { success: true }
}

export function removeLogisticsCompany(name) {
  if (!store.logisticsCompanies) return { success: false, error: '物流商列表为空' }
  const idx = store.logisticsCompanies.indexOf(name)
  if (idx > -1) {
    store.logisticsCompanies.splice(idx, 1)
    return { success: true }
  }
  return { success: false, error: '物流商不存在' }
}

export function getLogisticsCompanies() {
  if (!store.logisticsCompanies) {
    store.logisticsCompanies = ['顺丰', 'DHL', 'FedEx', 'UPS', 'EMS']
  }
  return store.logisticsCompanies
}

export function addProject(name, description, projectType = 'development') {
  const project = {
    id: generateId('p'),
    name,
    description,
    color: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#B37FEB'][Math.floor(Math.random() * 6)],
    createdAt: new Date().toISOString().split('T')[0],
    status: 'active',
    projectType
  }
  store.projects.push(project)
  
  const stages = projectType === 'development' 
    ? ['立项启动', '需求分析', 'UI设计', '前端开发', '后端开发', '测试上线']
    : ['需求确认', '样品制作', '寄送客户', '反馈处理', '订单转化']
    
  stages.forEach((name, index) => {
    store.stages.push({
      id: generateId('s'),
      projectId: project.id,
      name,
      order: index + 1,
      color: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#B37FEB'][index]
    })
  })
  
  return project
}

export function updateProject(projectId, data) {
  const idx = store.projects.findIndex(p => p.id === projectId)
  if (idx === -1) return null
  
  store.projects[idx] = { ...store.projects[idx], ...data }
  return store.projects[idx]
}

export function deleteProject(projectId) {
  const idx = store.projects.findIndex(p => p.id === projectId)
  if (idx === -1) return
  
  store.projects.splice(idx, 1)
  store.stages = store.stages.filter(s => s.projectId !== projectId)
  store.tasks = store.tasks.filter(t => t.projectId !== projectId)
  
  if (store.currentProjectId === projectId) {
    store.currentProjectId = store.projects[0]?.id || null
  }
  store.openProjectIds = store.openProjectIds.filter(id => id !== projectId)
}

export function addTask(projectId, stageId, name, duration = 1, startDate = new Date().toISOString().split('T')[0], milestone = false, extra = {}) {
  const task = {
    id: generateId('t'),
    projectId,
    stageId,
    name,
    duration,
    startDate,
    completed: false,
    milestone,
    customerName: extra.customerName || '',
    model: extra.model || '',
    logisticsNo: extra.logisticsNo || '',
    email: extra.email || '',
    sampleQty: extra.sampleQty || 0
  }
  store.tasks.push(task)
  return task
}

export function parseAIText(text, projectId) {
  const lines = text.split('\n').filter(l => l.trim())
  const stages = store.stages.filter(s => s.projectId === projectId)
  const defaultStage = stages[0]
  
  if (!defaultStage) return 0
  
  let count = 0
  lines.forEach(line => {
    const match = line.match(/(.+?)(?:\s+(\d{4}-\d{2}-\d{2}))?(?:\s+(\d+)[天日])?(?:\s*(里程碑))?/)
    if (match) {
      const name = match[1].trim()
      const startDate = match[2] || new Date().toISOString().split('T')[0]
      const duration = parseInt(match[3]) || 1
      const milestone = match[4] === '里程碑'
      
      addTask(projectId, defaultStage.id, name, duration, startDate, milestone)
      count++
    }
  })
  
  return count
}

export function addDailyTodo(content, projectId = null, category = '', attachments = []) {
  const today = new Date().toISOString().split('T')[0]
  const todo = {
    id: generateId('dt'),
    content,
    projectId,
    category: category || (store.todoCategories.length > 0 ? store.todoCategories[0].id : ''),
    date: today,
    completed: false,
    deadline: '',
    customerId: '',
    modelId: '',
    attachments: attachments || []
  }
  store.dailyTodos.push(todo)
  return todo
}

export function toggleTodoComplete(todoId) {
  const todo = store.dailyTodos.find(t => t.id === todoId)
  if (todo) {
    todo.completed = !todo.completed
    return { success: true }
  }
  return { success: false, error: '待办不存在' }
}

export function deleteTodo(todoId) {
  const index = store.dailyTodos.findIndex(t => t.id === todoId)
  if (index > -1) {
    store.dailyTodos.splice(index, 1)
    return { success: true }
  }
  return { success: false, error: '待办不存在' }
}

export function getProjectById(projectId) {
  return store.projects.find(p => p.id === projectId)
}

export async function addCustomerGroup(name) {
  if (!name.trim()) return { success: false, error: '分组名称不能为空' }
  if (store.customerGroups.includes(name.trim())) return { success: false, error: '分组已存在' }
  
  store.customerGroups.push(name.trim())
  
  return { success: true }
}

export async function updateCustomerGroup(oldName, newName) {
  if (!newName.trim()) return { success: false, error: '分组名称不能为空' }
  if (oldName === newName) return { success: false, error: '名称未更改' }
  const index = store.customerGroups.indexOf(oldName)
  if (index === -1) return { success: false, error: '分组不存在' }
  
  store.customerGroups[index] = newName.trim()
  store.customers.forEach(c => {
    if (c.group === oldName) {
      c.group = newName.trim()
    }
  })
  
  const { syncToSupabase } = await import('./supabase.js')
  
  for (const customer of store.customers) {
    if (customer.group === newName.trim()) {
      const dbData = {
        id: customer.id,
        name: customer.name,
        group: customer.group,
        country: customer.country,
        region: customer.region,
        company: customer.company,
        email: customer.email,
        phone: customer.phone,
        address: customer.address
      }
      await syncToSupabase('customers', dbData)
    }
  }
  
  return { success: true }
}

export async function deleteCustomerGroup(name) {
  const count = store.customers.filter(c => c.group === name).length
  if (count > 0) return { success: false, error: `该分组下有 ${count} 个客户，无法删除` }
  const index = store.customerGroups.indexOf(name)
  if (index === -1) return { success: false, error: '分组不存在' }
  
  store.customerGroups.splice(index, 1)
  
  return { success: true }
}

export async function syncCustomerGroupsFromSupabase() {
  try {
    const { fetchFromSupabase } = await import('./supabase.js')
    const result = await fetchFromSupabase('customers')
    
    if (result.success && result.data && result.data.length > 0) {
      const groups = [...new Set(result.data.map(c => c.group).filter(n => n))]
      if (groups.length > 0) {
        store.customerGroups = groups
        console.log('[同步] 从后端加载客户分组:', store.customerGroups)
        return { success: true, count: groups.length }
      }
    }
  } catch (error) {
    console.error('[同步] 加载客户分组失败:', error)
  }
  return { success: false, count: 0 }
}

function clearOldLocalStorage() {
  const keysToClear = [
    'user_data_',
    'customers',
    'customerGroups',
    'sampleDeliveries',
    'salesOrders',
    'productModels',
    'certRecords',
    'suppliers',
    'logisticsBills',
    'dailyTodos',
    'customerFollowUps',
    'projects',
    'stages',
    'tasks'
  ]
  
  let clearedCount = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    for (const pattern of keysToClear) {
      if (key && key.includes(pattern)) {
        localStorage.removeItem(key)
        clearedCount++
        console.log('[缓存清理] 已清除旧缓存:', key)
        break
      }
    }
  }
  
  if (clearedCount > 0) {
    console.log(`[缓存清理] 共清除 ${clearedCount} 个旧缓存项`)
  }
}

export function toggleLocalMode(enable) {
  store.localMode = enable
  console.log(`[模式切换] 本地模式${enable ? '开启' : '关闭'}`)
  if (enable) {
    console.log('[模式切换] 所有数据读写仅走浏览器本地存储')
  } else {
    console.log('[模式切换] 启用云端模式，默认读写Supabase，IndexedDB做离线兜底')
  }
}

export async function checkDataConflict() {
  if (store.localMode) {
    return { hasConflict: false, message: '本地模式下无需检查冲突' }
  }
  
  try {
    const { fetchFromSupabase } = await import('./supabase.js')
    const localCount = {
      customers: store.customers.length,
      sampleDeliveries: store.sampleDeliveries.length,
      dailyTodos: store.dailyTodos.length
    }
    
    const cloudCount = {}
    const tables = ['customers', 'sample_deliveries', 'daily_todos']
    
    for (const table of tables) {
      const result = await fetchFromSupabase(table)
      cloudCount[table] = result.data ? result.data.length : 0
    }
    
    const hasConflict = Object.keys(localCount).some(key => localCount[key] !== cloudCount[key])
    
    if (hasConflict) {
      return {
        hasConflict: true,
        localCount,
        cloudCount,
        message: '检测到本地与云端数据不一致'
      }
    }
    
    return { hasConflict: false, message: '本地与云端数据一致' }
  } catch (error) {
    return { hasConflict: false, message: '无法连接云端，跳过冲突检查' }
  }
}

export async function syncAllFromSupabase(showToast = true) {
  if (store.localMode) {
    console.log('[同步] ⚠️ 本地模式已开启，跳过云端同步')
    return { success: false, error: 'Local mode enabled', totalCount: 0, successCount: 0 }
  }
  
  console.log('=======================================')
  console.log('[同步] 开始全量同步后端数据')
  console.log('=======================================')
  
  clearOldLocalStorage()
  
  try {
    const { fetchFromSupabase, getSupabase } = await import('./supabase.js')
    
    const supabaseClient = await getSupabase()
    if (!supabaseClient) {
      console.log('[同步] ⚠️ Supabase 未配置，保留本地默认数据')
      return { success: false, error: 'Supabase not configured', totalCount: 0, successCount: 0 }
    }
    
    const tables = [
      { name: 'customers', key: 'customers', transform: (data) => {
        const groups = [...new Set(data.map(c => c.group).filter(n => n))]
        store.customerGroups = groups
        console.log(`[同步] 从客户表提取分组: ${groups.length} 个`)
        return data
      }},
      { name: 'sample_deliveries', key: 'sampleDeliveries' },
      { name: 'sales_orders', key: 'salesOrders' },
      { name: 'product_models', key: 'productModels' },
      { name: 'cert_records', key: 'certRecords' },
      { name: 'suppliers', key: 'suppliers' },
      { name: 'logistics_bills', key: 'logisticsBills' },
      { name: 'daily_todos', key: 'dailyTodos' },
      { name: 'customer_follow_ups', key: 'customerFollowUps' },
      { name: 'projects', key: 'projects' },
      { name: 'stages', key: 'stages' },
      { name: 'tasks', key: 'tasks' },
      { name: 'package_sample_follows', key: 'packageSampleFollows' }
    ]
    
    let totalCount = 0
    let successCount = 0
    
    for (const table of tables) {
      console.log(`[同步] 正在加载 ${table.key}...`)
      const result = await fetchFromSupabase(table.name)
      if (result.success && result.data && result.data.length > 0) {
        const data = table.transform ? table.transform(result.data) : result.data
        store[table.key] = data
        totalCount += data.length
        successCount++
        console.log(`[同步] ✅ ${table.key}: ${data.length} 条记录`)
      } else {
        console.log(`[同步] ⚠️ ${table.key}: 无数据或加载失败，保留默认数据`)
      }
    }
    
    console.log('=======================================')
    console.log(`[同步] 同步完成: ${successCount}/${tables.length} 表成功, 共 ${totalCount} 条记录`)
    console.log('=======================================')
    
    if (showToast && totalCount > 0) {
      alert(`数据同步完成！\n\n共加载 ${totalCount} 条记录\n${successCount}/${tables.length} 个数据表`)
    }
    
    return { success: true, totalCount, successCount }
  } catch (error) {
    console.error('[同步] 加载所有数据失败:', error)
    return { success: false, error: error.message }
  }
}

export function addDailyTodoItem(data) {
  const today = new Date().toISOString().split('T')[0]
  const todo = {
    id: generateId('dt'),
    content: data.content,
    category: data.category || (store.todoCategories.length > 0 ? store.todoCategories[0].id : ''),
    customerId: data.customerId || '',
    modelId: data.modelId || '',
    customer: data.customer || '',
    model: data.model || '',
    deadline: data.deadline || '',
    date: today,
    completed: data.completed || false,
    tags: data.tags || []
  }
  store.dailyTodos.push(todo)
  return todo
}

export function updateDailyTodoItem(id, updates) {
  const index = store.dailyTodos.findIndex(t => t.id === id)
  if (index > -1) {
    Object.assign(store.dailyTodos[index], updates)
    return { success: true }
  }
  return { success: false, error: '待办不存在' }
}

export function toggleTaskComplete(taskId) {
  const task = store.tasks.find(t => t.id === taskId)
  if (task) {
    task.completed = !task.completed
    return { success: true }
  }
  return { success: false, error: '任务不存在' }
}

export function addFileToLibrary(file) {
  const newFile = {
    id: generateId('f'),
    name: file.name,
    size: file.size,
    type: file.type,
    path: file.path || '',
    folder: file.folder || '',
    uploadedAt: new Date().toISOString()
  }
  store.fileLibrary.files.push(newFile)
  return newFile
}

export function deleteFileFromLibrary(fileId) {
  const index = store.fileLibrary.files.findIndex(f => f.id === fileId)
  if (index > -1) {
    store.fileLibrary.files.splice(index, 1)
    return { success: true }
  }
  return { success: false, error: '文件不存在' }
}

export function getStagesByProjectId(projectId) {
  return store.stages.filter(s => s.projectId === projectId).sort((a, b) => a.order - b.order)
}

export function getTasksByStageId(stageId) {
  return store.tasks.filter(t => t.stageId === stageId)
}

export function getTasksByProjectId(projectId) {
  return store.tasks.filter(t => t.projectId === projectId)
}

export function deleteTask(taskId) {
  const index = store.tasks.findIndex(t => t.id === taskId)
  if (index > -1) {
    store.tasks.splice(index, 1)
    return { success: true }
  }
  return { success: false, error: '任务不存在' }
}

export function addStage(projectId, name, color = null) {
  const stages = getStagesByProjectId(projectId)
  const newStage = {
    id: generateId('s'),
    projectId,
    name,
    order: stages.length + 1,
    color: color || ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#B37FEB'][stages.length % 6]
  }
  store.stages.push(newStage)
  return newStage
}

export function updateStage(stageId, updates) {
  const index = store.stages.findIndex(s => s.id === stageId)
  if (index > -1) {
    Object.assign(store.stages[index], updates)
    return { success: true }
  }
  return { success: false, error: '阶段不存在' }
}

export function deleteStage(stageId) {
  const index = store.stages.findIndex(s => s.id === stageId)
  if (index > -1) {
    const stage = store.stages[index]
    const projectId = stage.projectId
    
    store.stages.splice(index, 1)
    
    store.tasks = store.tasks.filter(t => t.stageId !== stageId)
    
    const remainingStages = getStagesByProjectId(projectId)
    remainingStages.forEach((s, i) => {
      s.order = i + 1
    })
    
    return { success: true }
  }
  return { success: false, error: '阶段不存在' }
}

export function reorderStages(projectId, stageIds) {
  stageIds.forEach((stageId, index) => {
    const stage = store.stages.find(s => s.id === stageId)
    if (stage) {
      stage.order = index + 1
    }
  })
}

export function updateTask(taskId, updates) {
  const index = store.tasks.findIndex(t => t.id === taskId)
  if (index > -1) {
    Object.assign(store.tasks[index], updates)
    return { success: true }
  }
  return { success: false, error: '任务不存在' }
}

export function deleteDailyTodoItem(id) {
  const index = store.dailyTodos.findIndex(t => t.id === id)
  if (index > -1) {
    store.dailyTodos.splice(index, 1)
    return { success: true }
  }
  return { success: false, error: '待办不存在' }
}

export function addProductModel(data) {
  const model = {
    id: generateId('pm'),
    name: data.name || '',
    chip: data.chip || '',
    screen: data.screen || '',
    certifications: data.certifications || '',
    renderImagePath: data.renderImagePath || '',
    supplierId: data.supplierId || ''
  }
  store.productModels.push(model)
  return model
}

export function updateProductModel(model) {
  const idx = store.productModels.findIndex(m => m.id === model.id)
  if (idx > -1) {
    store.productModels[idx] = { ...model }
  }
}

export function deleteProductModel(model) {
  const idx = store.productModels.findIndex(m => m.id === model.id)
  if (idx > -1) {
    store.productModels.splice(idx, 1)
  }
}

export function addCertRecord(data) {
  const record = {
    id: generateId('cr'),
    modelId: data.modelId || '',
    certType: data.certType || '',
    certNo: data.certNo || '',
    issueDate: data.issueDate || '',
    expiryDate: data.expiryDate || '',
    certFilePath: data.certFilePath || ''
  }
  store.certRecords.push(record)
  return record
}

export function updateCertRecord(record) {
  const idx = store.certRecords.findIndex(r => r.id === record.id)
  if (idx > -1) {
    store.certRecords[idx] = { ...record }
  }
}

export function deleteCertRecord(record) {
  const idx = store.certRecords.findIndex(r => r.id === record.id)
  if (idx > -1) {
    store.certRecords.splice(idx, 1)
  }
}

export function addSupplier(data) {
  const supplier = {
    id: generateId('sup'),
    name: data.name || '',
    contact: data.contact || '',
    phone: data.phone || '',
    supplyModels: data.supplyModels || '',
    qualificationPath: data.qualificationPath || ''
  }
  store.suppliers.push(supplier)
  return supplier
}

export function updateSupplier(supplier) {
  const idx = store.suppliers.findIndex(s => s.id === supplier.id)
  if (idx > -1) {
    store.suppliers[idx] = { ...supplier }
  }
}

export function deleteSupplier(supplier) {
  const idx = store.suppliers.findIndex(s => s.id === supplier.id)
  if (idx > -1) {
    store.suppliers.splice(idx, 1)
  }
}

export function generateOrderNumber() {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = String(now.getMonth() + 1).padStart(2, '0')
  
  const pattern = new RegExp(`^SO${year}${month}\\d{4}$`)
  const existingOrders = store.salesOrders.filter(o => pattern.test(o.id))
  
  let maxSeq = 0
  existingOrders.forEach(o => {
    const seq = parseInt(o.id.slice(-4))
    if (!isNaN(seq) && seq > maxSeq) {
      maxSeq = seq
    }
  })
  
  const seq = String(maxSeq + 1).padStart(4, '0')
  return `SO${year}${month}${seq}`
}

export function addSalesOrder(data) {
  const order = {
    id: data.id || generateOrderNumber(),
    customerId: data.customerId || '',
    customerName: data.customerName || '',
    model: data.model || '',
    qty: data.qty || 0,
    bookingDate: data.bookingDate || '',
    logisticsNo: data.logisticsNo || '',
    status: data.status || 'pending',
    amount: data.amount || 0,
    currency: data.currency || 'USD',
    bulkFreight: data.bulkFreight || 0,
    orderType: data.orderType || 'bulk_order',
    balanceSettled: data.balanceSettled || false
  }
  store.salesOrders.push(order)
  saveToLocalStorage()
  return order
}

export function updateSalesOrder(orderId, data) {
  const index = store.salesOrders.findIndex(o => o.id === orderId)
  if (index > -1) {
    Object.assign(store.salesOrders[index], data)
    return { success: true }
  }
  return { success: false, error: '订单不存在' }
}

export function deleteSalesOrder(orderId) {
  const index = store.salesOrders.findIndex(o => o.id === orderId)
  if (index > -1) {
    store.salesOrders.splice(index, 1)
    return { success: true }
  }
  return { success: false, error: '订单不存在' }
}

export function addLogisticsBill(data) {
  const bill = {
    id: generateId('lb'),
    logisticsNo: data.logisticsNo || '',
    customerName: data.customerName || '',
    country: data.country || '',
    freightForwarder: data.freightForwarder || '',
    amount: data.amount || '',
    status: data.status || 'unpaid',
    verificationDate: data.verificationDate || ''
  }
  store.logisticsBills.push(bill)
  return bill
}

export function updateLogisticsBill(bill) {
  const idx = store.logisticsBills.findIndex(b => b.id === bill.id)
  if (idx > -1) {
    store.logisticsBills[idx] = { ...bill }
  }
}

export function deleteLogisticsBill(billId) {
  const index = store.logisticsBills.findIndex(b => b.id === billId)
  if (index > -1) {
    store.logisticsBills.splice(index, 1)
    return { success: true }
  }
  return { success: false, error: '账单不存在' }
}

export function generateMonthlyBills(month = null) {
  const targetMonth = month || new Date().toISOString().slice(0, 7)
  
  const ordersWithLogistics = store.salesOrders.filter(o => 
    o.logisticsNo && o.bookingDate.startsWith(targetMonth)
  )
  
  const freightForwarders = ['DHL', 'FedEx', 'UPS', 'EMS', '顺丰']
  const countries = ['美国', '德国', '英国', '法国', '意大利', '西班牙', '日本', '韩国', '澳大利亚']
  
  let generatedCount = 0
  
  ordersWithLogistics.forEach(order => {
    const exists = store.logisticsBills.some(b => b.logisticsNo === order.logisticsNo)
    if (!exists) {
      const bill = {
        id: generateId('lb'),
        logisticsNo: order.logisticsNo,
        customerName: order.customerName,
        country: countries[Math.floor(Math.random() * countries.length)],
        freightForwarder: freightForwarders[Math.floor(Math.random() * freightForwarders.length)],
        freightAmount: Math.floor(Math.random() * 500) + 150,
        paymentStatus: 'unpaid',
        billImage: '',
        writeOffDate: ''
      }
      store.logisticsBills.push(bill)
      generatedCount++
    }
  })
  
  return { success: true, generatedCount }
}

export function getCustomerGroups() {
  return store.customerGroups
}

export function getCustomerById(customerId) {
  return store.customers.find(c => c.id === customerId)
}

export function addTag(data) {
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#B37FEB', '#C0C4CC']
  
  const tag = {
    id: data.id || generateId('tag'),
    name: data.name || '',
    label: data.label || '',
    color: data.color || colors[store.tags.length % colors.length]
  }
  
  store.tags.push(tag)
  return tag
}

export function updateTag(tagId, data) {
  const index = store.tags.findIndex(t => t.id === tagId)
  if (index > -1) {
    Object.assign(store.tags[index], data)
    return { success: true }
  }
  return { success: false, error: '标签不存在' }
}

export function deleteTag(tagId) {
  const index = store.tags.findIndex(t => t.id === tagId)
  if (index > -1) {
    const tag = store.tags[index]
    store.tags.splice(index, 1)
    
    store.customers.forEach(c => {
      if (c.tags) {
        c.tags = c.tags.filter(t => t !== tagId)
      }
    })
    
    store.dailyTodos.forEach(t => {
      if (t.tags) {
        t.tags = t.tags.filter(t => t !== tagId)
      }
    })
    
    store.sampleDeliveries.forEach(s => {
      if (s.tags) {
        s.tags = s.tags.filter(t => t !== tagId)
      }
    })
    
    return { success: true }
  }
  return { success: false, error: '标签不存在' }
}

export function getTags() {
  return store.tags
}

export function getTagById(tagId) {
  return store.tags.find(t => t.id === tagId)
}

export function addTodoCategory(data) {
  const category = {
    id: data.id || generateId('cat'),
    name: data.name || '',
    label: data.label || '',
    isDefault: false
  }
  store.todoCategories.push(category)
  return category
}

export function updateTodoCategory(categoryId, data) {
  const index = store.todoCategories.findIndex(c => c.id === categoryId)
  if (index > -1) {
    Object.assign(store.todoCategories[index], data)
    return { success: true }
  }
  return { success: false, error: '分类不存在' }
}

export function deleteTodoCategory(categoryId) {
  const index = store.todoCategories.findIndex(c => c.id === categoryId)
  if (index > -1) {
    const category = store.todoCategories[index]
    
    if (category.isDefault) {
      return { success: false, error: '默认分类不能删除' }
    }
    
    const defaultCategory = store.todoCategories.find(c => c.isDefault)
    const defaultId = defaultCategory ? defaultCategory.id : 'cat_default'
    
    store.dailyTodos.forEach(t => {
      if (t.category === category.id) {
        t.category = defaultId
      }
    })
    
    store.todoCategories.splice(index, 1)
    return { success: true }
  }
  return { success: false, error: '分类不存在' }
}

export function getTodoCategories() {
  return store.todoCategories.filter(c => !c.isDefault)
}

export function getAllTodoCategories() {
  return store.todoCategories
}

export function getTodoCategoryById(categoryId) {
  return store.todoCategories.find(c => c.id === categoryId)
}

export function resetAllData() {
  const keepKeys = ['customerGroups', 'logisticsCompanies', 'localMode', 'todoCategories', 'alertSettings', 'currentPage', 'currentSubPage', 'currentProjectId', 'openProjectIds', 'dataVersion']
  
  Object.keys(defaultData).forEach(key => {
    if (keepKeys.includes(key)) {
      store[key] = JSON.parse(JSON.stringify(defaultData[key]))
    } else {
      const defaultValue = defaultData[key]
      if (Array.isArray(defaultValue)) {
        store[key] = []
      } else if (typeof defaultValue === 'object' && defaultValue !== null) {
        store[key] = {}
      } else {
        store[key] = defaultValue
      }
    }
  })
  
  if (currentUserId) {
    saveUserData(currentUserId, store)
  }
  return { success: true }
}

export function addGBProject(data) {
  const project = {
    id: data.id || generateId('gb'),
    projectName: data.projectName || '',
    stage: data.stage || '资料提交',
    progress: data.progress || 0,
    status: data.status || '待启动',
    responsible: data.responsible || '',
    deadline: data.deadline || '',
    attachments: data.attachments || [],
    remark: data.remark || ''
  }
  store.gbProjects.push(project)
  return project
}

export function updateGBProject(project) {
  const idx = store.gbProjects.findIndex(p => p.id === project.id)
  if (idx > -1) {
    store.gbProjects[idx] = { ...project }
  }
}

export function deleteGBProject(projectId) {
  const idx = store.gbProjects.findIndex(p => p.id === projectId)
  if (idx > -1) {
    store.gbProjects.splice(idx, 1)
  }
}

export function addColorBoxProject(data) {
  const project = {
    id: data.id || generateId('cb'),
    projectName: data.projectName || '',
    designStage: data.designStage || '设计稿确认',
    progress: data.progress || 0,
    status: data.status || '待启动',
    responsible: data.responsible || '',
    deadline: data.deadline || '',
    attachments: data.attachments || [],
    remark: data.remark || ''
  }
  store.colorBoxProjects.push(project)
  return project
}

export function updateColorBoxProject(project) {
  const idx = store.colorBoxProjects.findIndex(p => p.id === project.id)
  if (idx > -1) {
    store.colorBoxProjects[idx] = { ...project }
  }
}

export function deleteColorBoxProject(projectId) {
  const idx = store.colorBoxProjects.findIndex(p => p.id === projectId)
  if (idx > -1) {
    store.colorBoxProjects.splice(idx, 1)
  }
}

export async function addPackageSampleFollow(data) {
  const follow = {
    id: data.id || generateId('ps'),
    projectName: data.projectName || '',
    internalModel: data.internalModel || '',
    businessType: data.businessType || '彩盒审核',
    followStatus: data.followStatus || '待发邮件',
    sendDate: data.sendDate || '',
    receiveDate: data.receiveDate || '',
    nextFollowDate: data.nextFollowDate || '',
    followLogs: data.followLogs || [],
    remark: data.remark || '',
    customField1: data.customField1 || '',
    attachments: data.attachments || [],
    emailSubject: data.emailSubject || '',
    customer: data.customer || '',
    overseasContact: data.overseasContact || '',
    colorBoxVersion: data.colorBoxVersion || '',
    fileLink: data.fileLink || '',
    sendTime: data.sendTime || '',
    logisticsNo: data.logisticsNo || '',
    logisticsCompany: data.logisticsCompany || '',
    receiver: data.receiver || '',
    destination: data.destination || '',
    sendPurpose: data.sendPurpose || '',
    sendQty: data.sendQty || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  store.packageSampleFollows.push(follow)
  
  try {
    const { syncToSupabase } = await import('./supabase.js')
    await syncToSupabase('package_sample_follows', follow)
    console.log('[同步] 包装样机跟进已保存到后端')
  } catch (error) {
    console.error('[同步] 包装样机跟进保存失败:', error)
  }
  
  return follow
}

export async function updatePackageSampleFollow(follow) {
  const idx = store.packageSampleFollows.findIndex(p => p.id === follow.id)
  if (idx > -1) {
    store.packageSampleFollows[idx] = { ...follow, updatedAt: new Date().toISOString() }
    
    try {
      const { syncToSupabase } = await import('./supabase.js')
      await syncToSupabase('package_sample_follows', store.packageSampleFollows[idx])
      console.log('[同步] 包装样机跟进已更新到后端')
    } catch (error) {
      console.error('[同步] 包装样机跟进更新失败:', error)
    }
  }
}

export async function deletePackageSampleFollow(followId) {
  const idx = store.packageSampleFollows.findIndex(p => p.id === followId)
  if (idx > -1) {
    store.packageSampleFollows.splice(idx, 1)
    
    try {
      const { deleteFromSupabase } = await import('./supabase.js')
      await deleteFromSupabase('package_sample_follows', followId)
      console.log('[同步] 包装样机跟进已删除')
    } catch (error) {
      console.error('[同步] 包装样机跟进删除失败:', error)
    }
  }
}

export function getPackageSampleFollows() {
  return store.packageSampleFollows
}

export function getPackageSampleFollowsByModel(modelName) {
  return store.packageSampleFollows.filter(f => 
    f.projectName === modelName || f.internalModel === modelName
  )
}

export function getGBProjects() {
  return store.gbProjects
}

export function getColorBoxProjects() {
  return store.colorBoxProjects
}
