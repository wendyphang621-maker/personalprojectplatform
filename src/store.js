import { reactive, watch } from 'vue'

const AUTH_KEY = 'project_workbench_auth'
const USER_PREFIX = 'project_workbench_user_'
const DATA_VERSION = 'v15'

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
  localMode: false,
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

  // 认证文件进度矩阵 - 文件项（行）
  certMatrixFiles: [
    { id: 'cmf1', name: 'DOC', template: 'standard', order: 1, remark: '' },
    { id: 'cmf2', name: 'RF test report as per DOC standards', template: 'standard', order: 2, remark: '' },
    { id: 'cmf3', name: 'Proper data sheet with specification and image', template: 'standard', order: 3, remark: '' },
    { id: 'cmf4', name: 'Declaration letter - VoLTE and CBS support', template: 'standard', order: 4, remark: '' },
    { id: 'cmf5', name: 'Declaration letter for E-label', template: 'standard', order: 5, remark: '' },
    { id: 'cmf6', name: 'EMC test report', template: 'standard', order: 6, remark: '' },
    { id: 'cmf7', name: 'Health test report', template: 'standard', order: 7, remark: '' },
    { id: 'cmf8', name: 'Safety test report CB', template: 'standard', order: 8, remark: '' }
  ],

  // 认证文件进度矩阵 - 单元格（机型×文件项的状态）
  certMatrixCells: [
    { id: 'cmc1', fileId: 'cmf1', modelId: 'pm1', status: 'done', remark: '', certId: '', certType: 'CE', isDeleted: false, updateTime: '2026-08-05' },
    { id: 'cmc2', fileId: 'cmf2', modelId: 'pm1', status: 'in_progress', remark: '测试中', certId: '', certType: 'CE', isDeleted: false, updateTime: '2026-08-05' },
    { id: 'cmc3', fileId: 'cmf1', modelId: 'pm2', status: 'pending', remark: '', certId: '', certType: 'CE', isDeleted: false, updateTime: '2026-08-05' }
  ],

  // 认证文件矩阵 - 自定义模板（用户可持久化自定义文件清单）
  certMatrixTemplates: [],

  // 认证文件矩阵 - 自定义状态（用户可新增状态名称/颜色）
  certMatrixStatuses: [],

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
  
  customerPayments: [
    { id: 'cp1', customerId: 'c1', customerName: 'Hans', orderNo: 'PO-2026-001', orderDate: '2026-07-15', productName: '智能手机主机', specModel: 'MTK-6500-V2', quantity: 1000, unitPrice: 28, orderAmount: 28000, deliveryDate: '2026-08-15', paymentBatch: '第1笔', paymentType: '定金', paymentDate: '2026-07-16', paymentAmount: 8400, paymentMethod: '银行转账', arrivalStatus: '已到账', remark: '30%定金' },
    { id: 'cp2', customerId: 'c2', customerName: 'Ethan', orderNo: 'PO-2026-002', orderDate: '2026-07-28', productName: '显示屏模组', specModel: 'HD+-6.91', quantity: 500, unitPrice: 60, orderAmount: 30000, deliveryDate: '2026-08-30', paymentBatch: '第1笔', paymentType: '定金', paymentDate: '2026-07-29', paymentAmount: 9000, paymentMethod: '银行转账', arrivalStatus: '已到账', remark: '30%定金' },
    { id: 'cp3', customerId: 'c1', customerName: 'Hans', orderNo: 'PO-2026-001', orderDate: '2026-07-15', productName: '智能手机主机', specModel: 'MTK-6500-V2', quantity: 1000, unitPrice: 28, orderAmount: 28000, deliveryDate: '2026-08-15', paymentBatch: '第3笔', paymentType: '尾款', paymentDate: '2026-08-02', paymentAmount: 16800, paymentMethod: '银行转账', arrivalStatus: '已到账', remark: '60%尾款待发货' }
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
    { id: 'cat_biz', name: 'biz_order', label: '商务订单跟进' },
    { id: 'cat_sa', name: 'sales_assist', label: '销售助理事务' },
    { id: 'cat_express', name: 'sample_express', label: '样机与快递寄送' },
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
  deliverySchedules: [],

  activateExportConfigs: [
    { id: 'aec1', customer: 'Hans', updateFrequency: '每周一', receiveEmail: 'hans@example.com', model: 'E7 Elite', country: '德国', softwareVersion: 'V1.2.3\nV1.2.4', needImei: true, needFilter: false, exportTableName: 't_activate_e7_de', fotaSource: 'FOTA-DE-001', enabled: true, createdAt: '2026-08-04' },
    { id: 'aec2', customer: 'Ethan', updateFrequency: '每日', receiveEmail: 'ethan@example.com', model: 'NE75', country: '美国', softwareVersion: 'V2.0', needImei: false, needFilter: true, exportTableName: 't_activate_ne75_us', fotaSource: 'FOTA-US-002', enabled: true, createdAt: '2026-08-04' },
    { id: 'aec3', customer: 'Mr.Krish', updateFrequency: '每月1号', receiveEmail: 'krish@example.com', model: 'MTK6500', country: '沙特阿拉伯', softwareVersion: 'V1.0', needImei: true, needFilter: true, exportTableName: 't_activate_mtk_sa', fotaSource: 'FOTA-SA-003', enabled: false, createdAt: '2026-08-04' }
  ],

  dailyReminders: [
    { id: 'dr1', title: '激活导出-Hans-E7 Elite-德国', businessType: 'activate_export', activateConfigId: 'aec1', remindTime: '09:00', repeatRule: 'workday', status: 'pending', remark: '每周一推送激活数据', createdAt: '2026-08-04' },
    { id: 'dr2', title: '核对Ethan订单出货数量', businessType: 'other', activateConfigId: '', remindTime: '14:00', repeatRule: 'daily', status: 'pending', remark: '', createdAt: '2026-08-04' }
  ],

  todoRemindLogs: []
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

export function saveAuth(data) {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Auth save failed:', e)
  }
}

function loadUserData(userId) {
  try {
    const storageKey = USER_PREFIX + userId
    const data = localStorage.getItem(storageKey)
    if (data) {
      const parsed = JSON.parse(data)
      console.log(`[数据加载] 用户 ${userId}, 数据版本: ${parsed.dataVersion}, 当前版本: ${DATA_VERSION}`)
      console.log(`[数据加载] activateExportConfigs 数量: ${parsed.activateExportConfigs?.length || 0}`)
      
      if (parsed.dataVersion !== DATA_VERSION) {
        console.log(`[数据加载] 版本不匹配 (${parsed.dataVersion} → ${DATA_VERSION})，执行迁移`)
        // 不清除数据，而是保留旧数据并执行迁移
      }
      
      const result = { ...defaultData, ...parsed, user: parsed.user || { ...defaultUser, name: userId } }
      
      if (parsed.todoCategories && Array.isArray(parsed.todoCategories)) {
        const isValid = parsed.todoCategories.every(c => typeof c === 'object' && c !== null && c.id && c.name)
        if (!isValid) {
          result.todoCategories = defaultData.todoCategories
        } else {
          // 迁移：补全新增的默认分类（如果用户本地没有）
          const existingIds = new Set(parsed.todoCategories.map(c => c.id))
          const missingDefaults = defaultData.todoCategories.filter(dc => !existingIds.has(dc.id))
          if (missingDefaults.length > 0) {
            result.todoCategories = [...parsed.todoCategories, ...missingDefaults]
          }
        }
      }
      
      return migratePaymentIds(migrateSampleDeliveries(result))
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
    // 生成短编号的计数器，用于为缺失 id 或非标准编号的机型自动补/改号
    let pmIdCounter = 0
    const existingPmIds = new Set()
    // 先收集已是标准短编号的 id (PM-XXX 格式)
    data.productModels.forEach(m => {
      if (m.id && /^PM-\d{3}$/.test(m.id)) {
        existingPmIds.add(m.id)
      }
    })
    // 找到现有最大编号
    existingPmIds.forEach(id => {
      const match = id.match(/^PM-(\d{3})$/)
      if (match) pmIdCounter = Math.max(pmIdCounter, parseInt(match[1]))
    })
    
    data.productModels = data.productModels.map(m => {
      const fixed = { ...m }
      // 核心修复：为缺失 id、过长、或非 PM-XXX 格式的记录自动换短编号
      const needNewId = !fixed.id || fixed.id.length > 15 || !/^PM-\d{3}$/.test(fixed.id)
      if (needNewId) {
        pmIdCounter++
        fixed.id = `PM-${String(pmIdCounter).padStart(3, '0')}`
        while (existingPmIds.has(fixed.id)) {
          pmIdCounter++
          fixed.id = `PM-${String(pmIdCounter).padStart(3, '0')}`
        }
        existingPmIds.add(fixed.id)
        console.log(`[迁移] 机型 ${m.name} 编号已修正: ${m.id} -> ${fixed.id}`)
      }
      if (fixed.certifications == null) {
        fixed.certifications = []
      } else if (typeof fixed.certifications === 'string') {
        fixed.certifications = fixed.certifications ? fixed.certifications.split(',') : []
      } else if (!Array.isArray(fixed.certifications)) {
        fixed.certifications = []
      }
      if (fixed.chip == null) fixed.chip = ''
      if (fixed.screen == null) fixed.screen = ''
      if (fixed.name == null) fixed.name = ''
      if (fixed.supplierId == null) fixed.supplierId = ''
      if (fixed.renderImagePath == null) fixed.renderImagePath = ''
      return fixed
    })
  }
  
  if (data.customers && Array.isArray(data.customers)) {
    // 为缺失 id 或非标准编号的客户自动补/改 id
    const validCustomerIds = new Set()
    data.customers.forEach(c => {
      if (c.id && /^CUST-\d{4}$/.test(c.id)) {
        validCustomerIds.add(c.id)
      }
    })
    let customerIdCounter = validCustomerIds.size
    data.customers = data.customers.map((c, idx) => {
      let id = c.id
      // 需要新ID的情况: 无id、过长、或不是 CUST-XXXX 格式
      const needNewId = !id || id.length > 15 || !/^CUST-\d{4}$/.test(id)
      if (needNewId) {
        customerIdCounter++
        id = `CUST-${String(customerIdCounter).padStart(4, '0')}`
        while (validCustomerIds.has(id)) {
          customerIdCounter++
          id = `CUST-${String(customerIdCounter).padStart(4, '0')}`
        }
        validCustomerIds.add(id)
        console.log(`[迁移] 客户 ${c.name} 编号已修正: ${c.id} -> ${id}`)
      }
      const customerFields = ['id', 'name', 'group', 'country', 'region', 'company', 'email', 'phone', 'address']
      const cleaned = { id }
      customerFields.forEach(f => {
        if (c[f] !== undefined) cleaned[f] = c[f]
      })
      return { ...cleaned, attachments: [], localMaterialPath: '', notes: c.notes || '' }
    })
  }
  
  // 为 salesOrders 补/改 id
  if (data.salesOrders && Array.isArray(data.salesOrders)) {
    const validSoIds = new Set()
    data.salesOrders.forEach(s => {
      if (s.id && /^SO-\d{5}$/.test(s.id)) validSoIds.add(s.id)
    })
    let soIdCounter = 0
    validSoIds.forEach(id => {
      const match = id.match(/^SO-(\d{5})$/)
      if (match) soIdCounter = Math.max(soIdCounter, parseInt(match[1]))
    })
    data.salesOrders = data.salesOrders.map(s => {
      const fixed = { ...s }
      const needNewId = !fixed.id || fixed.id.length > 15 || !/^SO-\d{5}$/.test(fixed.id)
      if (needNewId) {
        soIdCounter++
        fixed.id = `SO-${String(soIdCounter).padStart(5, '0')}`
        while (validSoIds.has(fixed.id)) {
          soIdCounter++
          fixed.id = `SO-${String(soIdCounter).padStart(5, '0')}`
        }
        validSoIds.add(fixed.id)
        console.log(`[迁移] 订单 ${s.orderNo} 编号已修正: ${s.id} -> ${fixed.id}`)
      }
      return fixed
    })
  }
  
  // 为 dailyTodos 补/改 id
  if (data.dailyTodos && Array.isArray(data.dailyTodos)) {
    const validTodoIds = new Set()
    data.dailyTodos.forEach(t => {
      if (t.id && /^TODO-\d{5}$/.test(t.id)) validTodoIds.add(t.id)
    })
    let todoIdCounter = 0
    validTodoIds.forEach(id => {
      const match = id.match(/^TODO-(\d{5})$/)
      if (match) todoIdCounter = Math.max(todoIdCounter, parseInt(match[1]))
    })
    data.dailyTodos = data.dailyTodos.map(t => {
      const fixed = { ...t }
      const needNewId = !fixed.id || fixed.id.length > 15 || !/^TODO-\d{5}$/.test(fixed.id)
      if (needNewId) {
        todoIdCounter++
        fixed.id = `TODO-${String(todoIdCounter).padStart(5, '0')}`
        while (validTodoIds.has(fixed.id)) {
          todoIdCounter++
          fixed.id = `TODO-${String(todoIdCounter).padStart(5, '0')}`
        }
        validTodoIds.add(fixed.id)
        console.log(`[迁移] 待办编号已修正: ${t.id} -> ${fixed.id}`)
      }
      return fixed
    })
  }
  
  // 为 suppliers 补/改 id
  if (data.suppliers && Array.isArray(data.suppliers)) {
    const validSupIds = new Set()
    data.suppliers.forEach(s => {
      if (s.id && /^SUP-\d{4}$/.test(s.id)) validSupIds.add(s.id)
    })
    let supIdCounter = 0
    validSupIds.forEach(id => {
      const match = id.match(/^SUP-(\d{4})$/)
      if (match) supIdCounter = Math.max(supIdCounter, parseInt(match[1]))
    })
    data.suppliers = data.suppliers.map(s => {
      const fixed = { ...s }
      const needNewId = !fixed.id || fixed.id.length > 15 || !/^SUP-\d{4}$/.test(fixed.id)
      if (needNewId) {
        supIdCounter++
        fixed.id = `SUP-${String(supIdCounter).padStart(4, '0')}`
        while (validSupIds.has(fixed.id)) {
          supIdCounter++
          fixed.id = `SUP-${String(supIdCounter).padStart(4, '0')}`
        }
        validSupIds.add(fixed.id)
        console.log(`[迁移] 供应商 ${s.name} 编号已修正: ${s.id} -> ${fixed.id}`)
      }
      return fixed
    })
  }
  
  // 为 activateExportConfigs 补/改 id
  if (data.activateExportConfigs && Array.isArray(data.activateExportConfigs)) {
    const validAecIds = new Set()
    data.activateExportConfigs.forEach(a => {
      if (a.id && /^AEC-\d{3}$/.test(a.id)) validAecIds.add(a.id)
    })
    let aecIdCounter = 0
    validAecIds.forEach(id => {
      const match = id.match(/^AEC-(\d{3})$/)
      if (match) aecIdCounter = Math.max(aecIdCounter, parseInt(match[1]))
    })
    data.activateExportConfigs = data.activateExportConfigs.map(a => {
      const fixed = { ...a }
      const needNewId = !fixed.id || fixed.id.length > 15 || !/^AEC-\d{3}$/.test(fixed.id)
      if (needNewId) {
        aecIdCounter++
        fixed.id = `AEC-${String(aecIdCounter).padStart(3, '0')}`
        while (validAecIds.has(fixed.id)) {
          aecIdCounter++
          fixed.id = `AEC-${String(aecIdCounter).padStart(3, '0')}`
        }
        validAecIds.add(fixed.id)
        console.log(`[迁移] 激活导出配置 ${a.customer} 编号已修正: ${a.id} -> ${fixed.id}`)
      }
      return fixed
    })
  }
  
  // 为 certMatrixCells 补/改 id
  if (data.certMatrixCells && Array.isArray(data.certMatrixCells)) {
    const validCmcIds = new Set()
    data.certMatrixCells.forEach(c => {
      if (c.id && /^CMC-\d{3}$/.test(c.id)) validCmcIds.add(c.id)
    })
    let cmcIdCounter = 0
    validCmcIds.forEach(id => {
      const match = id.match(/^CMC-(\d{3})$/)
      if (match) cmcIdCounter = Math.max(cmcIdCounter, parseInt(match[1]))
    })
    data.certMatrixCells = data.certMatrixCells.map(c => {
      const fixed = { ...c }
      const needNewId = !fixed.id || fixed.id.length > 15 || !/^CMC-\d{3}$/.test(fixed.id)
      if (needNewId) {
        cmcIdCounter++
        fixed.id = `CMC-${String(cmcIdCounter).padStart(3, '0')}`
        while (validCmcIds.has(fixed.id)) {
          cmcIdCounter++
          fixed.id = `CMC-${String(cmcIdCounter).padStart(3, '0')}`
        }
        validCmcIds.add(fixed.id)
        console.log(`[迁移] 认证矩阵单元格编号已修正: ${c.id} -> ${fixed.id}`)
      }
      return fixed
    })
  }
  
  // 为 dailyReminders 迁移新字段
  if (data.dailyReminders && Array.isArray(data.dailyReminders)) {
    data.dailyReminders = data.dailyReminders.map(r => {
      const fixed = { ...r }
      if (fixed.recurrenceInterval === undefined) fixed.recurrenceInterval = 1
      // 迁移 customWeekday (单个值) 为 customWeekdays (数组)
      if (fixed.customWeekdays === undefined) {
        fixed.customWeekdays = fixed.customWeekday !== undefined ? [fixed.customWeekday] : [1]
      }
      if (fixed.customMonthday === undefined) fixed.customMonthday = 1
      if (fixed.deadline === undefined) fixed.deadline = ''
      if (fixed.category === undefined) fixed.category = ''
      if (fixed.customer === undefined) fixed.customer = ''
      if (fixed.model === undefined) fixed.model = ''
      if (fixed.lastTriggeredAt === undefined) fixed.lastTriggeredAt = null
      return fixed
    })
  }
  
  return data
}

// 付款记录ID迁移：将随机ID转换为有序编号
function migratePaymentIds(data) {
  if (!data.customerPayments || !Array.isArray(data.customerPayments)) return data
  
  // 收集已是标准 CPAY-XXXX 格式的ID
  const validCpayIds = new Set()
  data.customerPayments.forEach(p => {
    if (p.id && /^CPAY-\d{4}$/.test(p.id)) {
      validCpayIds.add(p.id)
    }
  })
  
  // 计算当前最大编号
  let cpayIdCounter = 0
  validCpayIds.forEach(id => {
    const match = id.match(/^CPAY-(\d{4})$/)
    if (match) cpayIdCounter = Math.max(cpayIdCounter, parseInt(match[1]))
  })
  
  let migratedCount = 0
  data.customerPayments = data.customerPayments.map(p => {
    const fixed = { ...p }
    // 需要新ID的情况: 无id、随机格式、或非 CPAY-XXXX 格式
    const needNewId = !fixed.id || !/^CPAY-\d{4}$/.test(fixed.id)
    if (needNewId) {
      cpayIdCounter++
      fixed.id = `CPAY-${String(cpayIdCounter).padStart(4, '0')}`
      while (validCpayIds.has(fixed.id)) {
        cpayIdCounter++
        fixed.id = `CPAY-${String(cpayIdCounter).padStart(4, '0')}`
      }
      validCpayIds.add(fixed.id)
      migratedCount++
      console.log(`[迁移] 付款记录编号已修正: ${p.id} -> ${fixed.id}`)
    }
    return fixed
  })
  
  if (migratedCount > 0) {
    console.log(`[迁移] 共迁移 ${migratedCount} 条付款记录ID为有序编号`)
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

export function saveToLocalStorage() {
  if (!currentUserId) {
    console.warn('[数据保存] currentUserId 为空，跳过保存')
    return
  }
  try {
    const data = {
      user: store.user,
      customers: store.customers,
      productModels: store.productModels,
      sampleDeliveries: store.sampleDeliveries,
      sampleRecords: store.sampleRecords,
      followups: store.followups,
      customerGroups: store.customerGroups,
      customerPayments: store.customerPayments,
      tasks: store.tasks,
      dailyTodos: store.dailyTodos,
      orderProducts: store.orderProducts,
      certRecords: store.certRecords,
      certMatrixFiles: store.certMatrixFiles,
      certMatrixCells: store.certMatrixCells,
      certMatrixTemplates: store.certMatrixTemplates,
      certMatrixStatuses: store.certMatrixStatuses,
      suppliers: store.suppliers,
      logisticsBills: store.logisticsBills,
      dailyReports: store.dailyReports,
      materialRecords: store.materialRecords,
      projects: store.projects,
      stages: store.stages,
      salesOrders: store.salesOrders,
      deliveryAllocations: store.deliveryAllocations,
      deliverySchedules: store.deliverySchedules,
      activateExportConfigs: store.activateExportConfigs,
      dailyReminders: store.dailyReminders,
      todoRemindLogs: store.todoRemindLogs,
      dataVersion: DATA_VERSION
    }
    const storageKey = USER_PREFIX + currentUserId
    localStorage.setItem(storageKey, JSON.stringify(data))
    console.log(`[数据保存] 用户 ${currentUserId}, activateExportConfigs 数量: ${store.activateExportConfigs.length}`)
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

export function restoreSession() {
  if (!authStore.currentUser) return false

  const user = authStore.currentUser
  currentUserId = user.id
  store.user = { ...defaultUser, ...user }

  const userData = loadUserData(user.id)
  if (userData) {
    Object.assign(store, userData)
    store.user = { ...defaultUser, ...user, ...(userData.user || {}) }
  }

  console.log(`[会话恢复] 用户: ${user.username} (${user.role}), 数据版本: ${userData?.dataVersion || 'default'}`)
  return true
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

const SHORT_ID_FORMATS = {
  c: { prefix: 'CUST', pad: 4, storeKey: 'customers' },
  cust: { prefix: 'CUST', pad: 4, storeKey: 'customers' },
  p: { prefix: 'PRJ', pad: 3, storeKey: 'projects' },
  prj: { prefix: 'PRJ', pad: 3, storeKey: 'projects' },
  s: { prefix: 'SUP', pad: 4, storeKey: 'suppliers' },
  sup: { prefix: 'SUP', pad: 4, storeKey: 'suppliers' },
  t: { prefix: 'TASK', pad: 3, storeKey: 'tasks' },
  task: { prefix: 'TASK', pad: 3, storeKey: 'tasks' },
  dt: { prefix: 'TODO', pad: 5, storeKey: 'dailyTodos' },
  todo: { prefix: 'TODO', pad: 5, storeKey: 'dailyTodos' },
  f: { prefix: 'FILE', pad: 4, storeKey: 'files' },
  file: { prefix: 'FILE', pad: 4, storeKey: 'files' },
  cr: { prefix: 'CR', pad: 4, storeKey: 'certRecords' },
  cert: { prefix: 'CERT', pad: 4, storeKey: 'certRecords' },
  lb: { prefix: 'LB', pad: 4, storeKey: 'logisticsBills' },
  cp: { prefix: 'CPAY', pad: 4, storeKey: 'customerPayments' },
  pay: { prefix: 'CPAY', pad: 4, storeKey: 'customerPayments' },
  tag: { prefix: 'TAG', pad: 3, storeKey: 'tags' },
  cat: { prefix: 'CAT', pad: 3, storeKey: 'categories' },
  gb: { prefix: 'GB', pad: 3, storeKey: 'groups' },
  cb: { prefix: 'CB', pad: 3, storeKey: 'customerGroups' },
  ps: { prefix: 'PS', pad: 3, storeKey: 'productSeries' },
  u: { prefix: 'U', pad: 3, storeKey: 'users' },
  model: { prefix: 'PM', pad: 3, storeKey: 'productModels' },
  pm: { prefix: 'PM', pad: 3, storeKey: 'productModels' },
  so: { prefix: 'SO', pad: 5, storeKey: 'salesOrders' },
  sd: { prefix: 'SD', pad: 4, storeKey: 'sampleDeliveries' },
  sample: { prefix: 'SD', pad: 4, storeKey: 'sampleDeliveries' },
  aec: { prefix: 'AEC', pad: 3, storeKey: 'activateExportConfigs' },
  cmf: { prefix: 'CMF', pad: 3, storeKey: 'certMatrixFiles' },
  cmc: { prefix: 'CMC', pad: 3, storeKey: 'certMatrixCells' },
  cmt: { prefix: 'CMT', pad: 3, storeKey: 'certMatrixTemplates' },
  fu: { prefix: 'CFU', pad: 4, storeKey: 'customerFollowUps' },
  followup: { prefix: 'CFU', pad: 4, storeKey: 'customerFollowUps' }
}

function getNextCounter(fmtPrefix, storeKey) {
  if (idCounters[fmtPrefix]) return idCounters[fmtPrefix]
  
  try {
    const data = store[storeKey]
    if (Array.isArray(data)) {
      let maxNum = 0
      data.forEach(item => {
        if (item && item.id) {
          const match = item.id.match(new RegExp(`^${fmtPrefix}-(\\d+)$`))
          if (match) {
            const num = parseInt(match[1])
            if (num > maxNum) maxNum = num
          }
        }
      })
      idCounters[fmtPrefix] = maxNum + 1
      return idCounters[fmtPrefix]
    }
  } catch (e) {
    // store might not be ready yet
  }
  
  idCounters[fmtPrefix] = 1
  return 1
}

export function generateId(prefix = '') {
  const format = SHORT_ID_FORMATS[prefix]
  if (format) {
    const { prefix: fmtPrefix, pad, storeKey, random, randomLen } = format
    // 随机模式：生成 CPAY-xxxxxxxxxxxx 格式（12位字母数字），保证唯一
    if (random) {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
      let attempts = 0
      while (attempts < 20) {
        let rand = ''
        for (let i = 0; i < (randomLen || 12); i++) {
          rand += chars[Math.floor(Math.random() * chars.length)]
        }
        const id = `${fmtPrefix}-${rand}`
        // 检查本地是否已存在
        const exists = store[storeKey] && Array.isArray(store[storeKey])
          ? store[storeKey].some(item => item && item.id === id)
          : false
        if (!exists) return id
        attempts++
      }
      // 兜底：20 次仍冲突则加时间戳后缀
      return `${fmtPrefix}-${Date.now().toString(36)}`
    }
    const nextNum = getNextCounter(fmtPrefix, storeKey)
    idCounters[fmtPrefix] = nextNum + 1
    return `${fmtPrefix}-${String(nextNum).padStart(pad, '0')}`
  }
  
  if (!idCounters[prefix]) {
    idCounters[prefix] = 1
  } else {
    idCounters[prefix]++
  }
  return `${prefix}-${String(idCounters[prefix]).padStart(3, '0')}`
}

// 校验付款记录 ID 是否为标准 CPAY- 前缀（支持有序编号和随机字符串两种格式）
export function isValidPaymentId(id) {
  return typeof id === 'string' && /^CPAY-(\d+|[a-z0-9]{4,16})$/.test(id)
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
  saveToLocalStorage()
  
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
      address: customer.address,
      model: customer.model,
      firstContactDate: customer.firstContactDate,
      sampleCount: customer.sampleCount,
      notes: customer.notes,
      remark: customer.remark,
      localMaterialPath: customer.localMaterialPath,
      attachments: customer.attachments,
      tags: customer.tags
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
    saveToLocalStorage()
    
    try {
      const { syncToSupabase } = await import('./supabase.js')
      const c = store.customers[idx]
      const dbData = {
        id: c.id,
        name: c.name,
        group: c.group,
        country: c.country,
        region: c.region,
        company: c.company,
        email: c.email,
        phone: c.phone,
        address: c.address,
        model: c.model,
        firstContactDate: c.firstContactDate,
        sampleCount: c.sampleCount,
        notes: c.notes,
        remark: c.remark,
        localMaterialPath: c.localMaterialPath,
        attachments: c.attachments,
        tags: c.tags
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
    id: data.id || generateId('sd'),
    customer_name: data.customer_name || '',
    model: data.model || '',
    area: data.area || '',
    logistics: data.logistics || '',
    tracking_no: data.tracking_no || '',
    send_date: data.send_date || '',
    qty: data.qty || 1,
    freight: data.freight || 0,
    status: data.status || '待发货',
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
    'customerPayments',
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

// 轻量权限检测
export async function checkSupabasePermissions() {
  const { getSupabase } = await import('./supabase.js')
  const client = await getSupabase()
  if (!client) return { ok: false, error: 'Supabase not configured' }
  
  const testTables = ['customers', 'product_models', 'sales_orders']
  let failedCount = 0
  const failedTables = []
  
  for (const table of testTables) {
    try {
      const { data, error } = await client.from(table).select('id', { count: 'exact', head: true })
      if (error) {
        failedCount++
        failedTables.push({ table, error: error.message })
      }
    } catch (e) {
      failedCount++
      failedTables.push({ table, error: e.message })
    }
  }
  
  if (failedCount === 0) {
    // 权限通过，清除失败标记
    localStorage.removeItem('supabase_rls_failed')
    return { ok: true, message: '所有表权限正常' }
  } else {
    return { ok: false, failedCount, failedTables, message: `${failedCount}/${testTables.length} 表权限失败` }
  }
}

// 同步本地数据到云端（一键同步）
export async function syncLocalToCloud(showToast = true) {
  const { getSupabase, syncToSupabase } = await import('./supabase.js')
  const client = await getSupabase()
  if (!client) {
    return { success: false, error: 'Supabase not configured' }
  }
  
  const rlsCheck = await checkSupabasePermissions()
  if (!rlsCheck.ok) {
    return { success: false, error: 'RLS 权限未修复，请先执行 fix_full_permissions.sql' }
  }
  
  const dataMap = {
    'customers': store.customers,
    'product_models': store.productModels,
    'sales_orders': store.salesOrders,
    'sample_deliveries': store.sampleDeliveries,
    // 修复：旧代码把 logisticsBills 写入 logistics_orders 表，
    // 而 syncAllFromSupabase 从 logistics_bills 表读取，导致写入的数据读不回来。
    'logistics_bills': store.logisticsBills,
    'daily_todos': store.dailyTodos,
    'projects': store.projects,
    'stages': store.stages,
    'tasks': store.tasks,
    'activate_export_configs': store.activateExportConfigs,
    'cert_matrix_files': store.certMatrixFiles,
    'cert_matrix_cells': store.certMatrixCells,
    'cert_matrix_templates': store.certMatrixTemplates,
    'cert_matrix_statuses': store.certMatrixStatuses,
    'suppliers': store.suppliers,
    'package_sample_follows': store.packageSampleFollows,
    // 补齐：客户跟进、客户付款、认证档案之前未纳入一键同步，导致换设备后丢失
    'customer_follow_ups': store.customerFollowUps,
    'customer_payments': store.customerPayments,
    'cert_records': store.certRecords,
    'daily_reminders': store.dailyReminders,
    'todo_remind_logs': store.todoRemindLogs
  }
  
  let totalUploaded = 0
  let totalFailed = 0
  const failures = []
  
  for (const [tableName, records] of Object.entries(dataMap)) {
    if (!records || !Array.isArray(records)) continue
    
    for (const record of records) {
      try {
        const result = await syncToSupabase(tableName, record)
        if (result.success) {
          totalUploaded++
        } else {
          totalFailed++
          failures.push({ table: tableName, id: record.id, error: result.error })
        }
      } catch (e) {
        totalFailed++
        failures.push({ table: tableName, id: record.id, error: e.message })
      }
    }
  }
  
  // 同步完成后切回云端模式
  if (totalUploaded > 0 && totalFailed === 0) {
    store.localMode = false
    localStorage.removeItem('supabase_rls_failed')
    saveToLocalStorage()
  }
  
  return {
    success: true,
    uploaded: totalUploaded,
    failed: totalFailed,
    failures,
    switchedToCloud: totalUploaded > 0 && totalFailed === 0
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
      { name: 'cert_matrix_files', key: 'certMatrixFiles' },
      { name: 'cert_matrix_cells', key: 'certMatrixCells' },
      { name: 'cert_matrix_templates', key: 'certMatrixTemplates' },
      { name: 'cert_matrix_statuses', key: 'certMatrixStatuses' },
      { name: 'suppliers', key: 'suppliers' },
      { name: 'logistics_bills', key: 'logisticsBills' },
      { name: 'daily_todos', key: 'dailyTodos' },
      { name: 'customer_follow_ups', key: 'customerFollowUps' },
      { name: 'customer_payments', key: 'customerPayments' },
      { name: 'projects', key: 'projects' },
      { name: 'stages', key: 'stages' },
      { name: 'tasks', key: 'tasks' },
      { name: 'package_sample_follows', key: 'packageSampleFollows' },
      { name: 'activate_export_configs', key: 'activateExportConfigs' },
      { name: 'daily_reminders', key: 'dailyReminders' },
      { name: 'todo_remind_logs', key: 'todoRemindLogs' }
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
        // 关键修复：加载失败时保留本地数据，不要用空数组覆盖
        console.warn(`[同步] ⚠️ ${table.key}: 云端加载失败(${result.error || '无数据'})，保留本地数据(${store[table.key]?.length || 0} 条)`)
        if (result.errorType === 'permission') {
          // RLS 权限不足，标记为永久失败
          console.error(`[同步] ❌ ${table.key} RLS 权限不足，将自动降级为本地模式`)
          localStorage.setItem('supabase_rls_failed', new Date().toISOString())
        }
      }
    }
    
    console.log('=======================================')
    console.log(`[同步] 同步完成: ${successCount}/${tables.length} 表成功, 共 ${totalCount} 条记录`)
    console.log('=======================================')
    
    // 如果失败的表太多，提示用户但不自动降级为本地模式
    if (showToast && successCount < tables.length / 2) {
      const failedTables = tables.length - successCount
      console.warn(`[同步] ⚠️ 超过半数表同步失败（${failedTables}/${tables.length}）`)
      const dontShow = sessionStorage.getItem('supabase_sync_failed_shown')
      if (!dontShow) {
        sessionStorage.setItem('supabase_sync_failed_shown', '1')
        setTimeout(async () => {
          const { ElMessage } = await import('element-plus')
          ElMessage({
            type: 'warning',
            duration: 10000,
            showClose: true,
            message: `Supabase 同步失败（${failedTables}/${tables.length} 个表），数据保留本地。请在【设置→Supabase配置】排查。`
          })
        }, 100)
      }
      return { success: false, totalCount, successCount, syncFailed: true }
    }
    
    if (showToast && totalCount > 0) {
      setTimeout(async () => {
        const { ElMessage } = await import('element-plus')
        ElMessage.success(`数据同步完成：${totalCount} 条记录，${successCount}/${tables.length} 个表`)
      }, 100)
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
    id: file.id || generateId('f'),
    name: file.name,
    size: file.size || 0,
    type: file.type || 'other',
    path: file.path || '',
    folder: file.folder || '',
    expiryDate: file.expiryDate || '',
    logisticsNo: file.logisticsNo || '',
    remark: file.remark || '',
    data: file.data || '',
    uploadDate: file.uploadDate || new Date().toISOString().split('T')[0],
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

// 生成机型短序号 ID (PM-001, PM-002 ...)
let modelIdCounter = 0
function nextModelShortId() {
  if (modelIdCounter === 0) {
    const maxId = store.productModels.reduce((max, m) => {
      const match = (m.id || '').match(/^PM-(\d+)$/)
      return match ? Math.max(max, parseInt(match[1])) : max
    }, 0)
    modelIdCounter = maxId
  }
  modelIdCounter++
  return `PM-${String(modelIdCounter).padStart(3, '0')}`
}

export function addProductModel(data) {
  const model = {
    id: data.id || nextModelShortId(),
    name: data.name || '',
    chip: data.chip || '',
    screen: data.screen || '',
    certifications: data.certifications || '',
    renderImagePath: data.renderImagePath || '',
    supplierId: data.supplierId || ''
  }
  store.productModels.push(model)
  saveToLocalStorage()
  return model
}

export function updateProductModel(model) {
  const idx = store.productModels.findIndex(m => m.id === model.id)
  if (idx > -1) {
    store.productModels[idx] = { ...model }
    saveToLocalStorage()
  }
}

// 更新机型编号（级联更新所有引用）
export function updateProductModelId(oldId, newId) {
  // 1. 更新 productModels 表
  const model = store.productModels.find(m => m.id === oldId)
  if (model) {
    model.id = newId
  }
  // 2. 更新认证矩阵 cells
  store.certMatrixCells.forEach(c => {
    if (c.modelId === oldId) c.modelId = newId
  })
  // 3. 更新认证档案中的 model 字段
  store.certRecords.forEach(c => {
    if (c.model === oldId) c.model = newId
  })
  // 4. 更新物料中的机型引用
  if (store.materials) {
    store.materials.forEach(m => {
      if (m.model === oldId) m.model = newId
    })
  }
  saveToLocalStorage()
  return { success: true }
}

export function deleteProductModel(modelOrId) {
  const id = typeof modelOrId === 'string' ? modelOrId : modelOrId.id
  const idx = store.productModels.findIndex(m => m.id === id)
  if (idx > -1) {
    store.productModels.splice(idx, 1)
    // 级联清理：删除该机型的认证矩阵单元格
    store.certMatrixCells = store.certMatrixCells.filter(c => c.modelId !== id)
    // 级联清理：将认证档案中引用该机型的设为空
    store.certRecords.forEach(c => { if (c.model === id) c.model = '' })
    saveToLocalStorage()
    return { success: true }
  }
  return { success: false, error: '机型不存在' }
}

export function addCertRecord(data) {
  const record = {
    id: data.id?.trim() || generateId('cr'),
    modelId: data.modelId || '',
    certType: data.certType || '',
    certNo: data.certNo || '',
    issueDate: data.issueDate || '',
    expiryDate: data.expiryDate || '',
    certFilePath: data.certFilePath || ''
  }
  store.certRecords.push(record)
  saveToLocalStorage()
  return record
}

export function updateCertRecord(record) {
  const idx = store.certRecords.findIndex(r => r.id === record.id)
  if (idx > -1) {
    store.certRecords[idx] = { ...record }
    saveToLocalStorage()
  }
}

export function deleteCertRecord(record) {
  const idx = store.certRecords.findIndex(r => r.id === record.id)
  if (idx > -1) {
    store.certRecords.splice(idx, 1)
    saveToLocalStorage()
  }
}

// === 认证文件进度矩阵管理 ===

// 认证文件模板预设
export const CERT_FILE_TEMPLATES = {
  standard: {
    name: '标准全套（8项）',
    files: [
      'DOC',
      'RF test report as per DOC standards',
      'Proper data sheet with specification and image',
      'Declaration letter - VoLTE and CBS support',
      'Declaration letter for E-label',
      'EMC test report',
      'Health test report',
      'Safety test report CB'
    ]
  },
  cb: {
    name: 'CB 认证配套',
    files: [
      'DOC',
      'RF test report as per DOC standards',
      'Safety test report CB',
      'EMC test report',
      'Proper data sheet with specification and image'
    ]
  },
  ce: {
    name: 'CE 认证配套',
    files: [
      'DOC',
      'RF test report as per DOC standards',
      'EMC test report',
      'Health test report',
      'Safety test report CB',
      'Declaration letter for E-label'
    ]
  },
  saso: {
    name: 'SASO 认证配套',
    files: [
      'DOC',
      'RF test report as per DOC standards',
      'SASO COC 证书',
      'Proper data sheet with specification and image',
      'EMC test report'
    ]
  },
  fcc: {
    name: 'FCC 认证配套',
    files: [
      'DOC',
      'RF test report as per FCC standards',
      'Declaration letter for E-label',
      'Proper data sheet with specification and image'
    ]
  }
}

// 矩阵进度状态配置
export const MATRIX_STATUS_CONFIG = {
  done: { label: '已完成', color: '#67C23A', bg: '#f0f9eb' },
  pending: { label: '待准备', color: '#E6A23C', bg: '#fdf6ec' },
  in_progress: { label: '进行中', color: '#409EFF', bg: '#ecf5ff' },
  missing: { label: '缺失', color: '#F56C6C', bg: '#fef0f0' }
}

// 添加文件项（行）
export function addCertMatrixFile(name, template = 'custom', category = '') {
  const maxOrder = store.certMatrixFiles.reduce((max, f) => Math.max(max, f.order || 0), 0)
  const file = {
    id: 'cmf' + Date.now() + Math.random().toString(36).slice(2, 6),
    name: name || '',
    template: template,
    category: category,
    order: maxOrder + 1,
    remark: '',
    isDeleted: false,
    updateTime: new Date().toISOString().split('T')[0]
  }
  store.certMatrixFiles.push(file)
  saveToLocalStorage()
  return file
}

// 更新文件项
export function updateCertMatrixFile(id, updates) {
  const idx = store.certMatrixFiles.findIndex(f => f.id === id)
  if (idx > -1) {
    store.certMatrixFiles[idx] = { ...store.certMatrixFiles[idx], ...updates, updateTime: new Date().toISOString().split('T')[0] }
    saveToLocalStorage()
  }
}

// 删除文件项（软删除：标记 isDeleted，保留历史可回溯）
export function deleteCertMatrixFile(id) {
  const file = store.certMatrixFiles.find(f => f.id === id)
  if (file) {
    file.isDeleted = true
    file.updateTime = new Date().toISOString().split('T')[0]
    // 关联单元格也软删除
    store.certMatrixCells.forEach(c => {
      if (c.fileId === id) {
        c.isDeleted = true
        c.updateTime = new Date().toISOString().split('T')[0]
      }
    })
    reorderMatrixFiles()
    saveToLocalStorage()
  }
}

// 自动重排 order（按当前非软删除文件项的顺序重置 order，避免断层）
export function reorderMatrixFiles() {
  const activeFiles = store.certMatrixFiles
    .filter(f => !f.isDeleted)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
  activeFiles.forEach((f, idx) => {
    f.order = idx + 1
  })
}

// 移动文件项顺序（拖拽排序：将 fileId 移动到 targetIndex 位置）
export function moveMatrixFile(fileId, targetIndex) {
  const activeFiles = store.certMatrixFiles
    .filter(f => !f.isDeleted)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
  const fromIdx = activeFiles.findIndex(f => f.id === fileId)
  if (fromIdx === -1) return
  const [moved] = activeFiles.splice(fromIdx, 1)
  activeFiles.splice(targetIndex, 0, moved)
  activeFiles.forEach((f, idx) => {
    f.order = idx + 1
  })
  saveToLocalStorage()
}

// 设置单元格状态（fileId + modelId 唯一确定单元格）
export function setMatrixCell(fileId, modelId, status, remark, certId, certType) {
  let cell = store.certMatrixCells.find(c => c.fileId === fileId && c.modelId === modelId && !c.isDeleted)
  const now = new Date().toISOString().split('T')[0]
  if (cell) {
    cell.status = status
    if (remark !== undefined) cell.remark = remark
    if (certId !== undefined) cell.certId = certId
    if (certType !== undefined) cell.certType = certType
    cell.isDeleted = false
    cell.updateTime = now
  } else {
    cell = {
      id: 'cmc' + Date.now() + Math.random().toString(36).slice(2, 6),
      fileId: fileId,
      modelId: modelId,
      status: status,
      remark: remark || '',
      certId: certId || '',
      certType: certType || '',
      isDeleted: false,
      updateTime: now
    }
    store.certMatrixCells.push(cell)
  }
  saveToLocalStorage()
  return cell
}

// 获取单元格（过滤软删除）
export function getMatrixCell(fileId, modelId) {
  return store.certMatrixCells.find(c => c.fileId === fileId && c.modelId === modelId && !c.isDeleted)
}

// 批量设置整行状态（某文件项下所有机型的状态）
export function batchSetRowStatus(fileId, status) {
  const now = new Date().toISOString().split('T')[0]
  store.certMatrixCells.forEach(c => {
    if (c.fileId === fileId && !c.isDeleted) {
      c.status = status
      c.updateTime = now
    }
  })
  saveToLocalStorage()
}

// 批量设置整列状态（某机型下所有文件项的状态）
export function batchSetColStatus(modelId, status) {
  const now = new Date().toISOString().split('T')[0]
  store.certMatrixCells.forEach(c => {
    if (c.modelId === modelId && !c.isDeleted) {
      c.status = status
      c.updateTime = now
    }
  })
  saveToLocalStorage()
}

// 批量清空备注（选中单元格）
export function batchClearRemarks(cellIds) {
  store.certMatrixCells.forEach(c => {
    if (cellIds.includes(c.id)) {
      c.remark = ''
      c.updateTime = new Date().toISOString().split('T')[0]
    }
  })
  saveToLocalStorage()
}

// 应用模板（替换现有文件项）
export function applyCertTemplate(templateKey) {
  // 优先查找自定义模板
  const customTpl = store.certMatrixTemplates.find(t => t.id === templateKey)
  const files = customTpl ? customTpl.files : CERT_FILE_TEMPLATES[templateKey]?.files
  if (!files) return false
  // 现有文件项全部软删除
  store.certMatrixFiles.forEach(f => { f.isDeleted = true })
  store.certMatrixCells.forEach(c => { c.isDeleted = true })
  // 添加模板文件项
  files.forEach((name, idx) => {
    store.certMatrixFiles.push({
      id: 'cmf' + Date.now() + '_' + idx,
      name: name,
      template: templateKey,
      category: '',
      order: idx + 1,
      remark: '',
      isDeleted: false,
      updateTime: new Date().toISOString().split('T')[0]
    })
  })
  saveToLocalStorage()
  return true
}

// 保存自定义模板（持久化用户自定义文件清单）
export function saveCertMatrixTemplate(name, files, snapshot = null) {
  const tpl = {
    id: 'cmt' + Date.now(),
    name: name,
    files: files,
    snapshot: snapshot,
    createdAt: new Date().toISOString().split('T')[0]
  }
  store.certMatrixTemplates.push(tpl)
  saveToLocalStorage()
  return tpl
}

// 删除自定义模板
export function deleteCertMatrixTemplate(id) {
  const idx = store.certMatrixTemplates.findIndex(t => t.id === id)
  if (idx > -1) {
    store.certMatrixTemplates.splice(idx, 1)
    saveToLocalStorage()
  }
}

// 新增自定义状态
export function addCertMatrixStatus(name, color, bg) {
  const status = {
    id: 'cms' + Date.now(),
    key: 'custom_' + Date.now(),
    name: name,
    color: color || '#909399',
    bg: bg || '#f4f4f5'
  }
  store.certMatrixStatuses.push(status)
  saveToLocalStorage()
  return status
}

// 删除自定义状态
export function deleteCertMatrixStatus(id) {
  const idx = store.certMatrixStatuses.findIndex(s => s.id === id)
  if (idx > -1) {
    store.certMatrixStatuses.splice(idx, 1)
    saveToLocalStorage()
  }
}

// 获取所有状态配置（内置 + 自定义）
export function getAllMatrixStatuses() {
  const builtin = Object.entries(MATRIX_STATUS_CONFIG).map(([key, cfg]) => ({
    id: 'builtin_' + key,
    key: key,
    name: cfg.label,
    color: cfg.color,
    bg: cfg.bg
  }))
  return [...builtin, ...store.certMatrixStatuses]
}

// 批量添加机型列（为每个文件项创建空单元格）
export function addModelsToMatrix(modelIds) {
  const now = new Date().toISOString().split('T')[0]
  modelIds.forEach(modelId => {
    store.certMatrixFiles.forEach(file => {
      if (file.isDeleted) return
      const exists = store.certMatrixCells.some(c => c.fileId === file.id && c.modelId === modelId && !c.isDeleted)
      if (!exists) {
        // 复用已软删除的单元格（恢复）
        const softDeleted = store.certMatrixCells.find(c => c.fileId === file.id && c.modelId === modelId && c.isDeleted)
        if (softDeleted) {
          softDeleted.isDeleted = false
          softDeleted.status = 'missing'
          softDeleted.updateTime = now
        } else {
          store.certMatrixCells.push({
            id: 'cmc' + Date.now() + Math.random().toString(36).slice(2, 6),
            fileId: file.id,
            modelId: modelId,
            status: 'missing',
            remark: '',
            certId: '',
            certType: '',
            isDeleted: false,
            updateTime: now
          })
        }
      }
    })
  })
  saveToLocalStorage()
}

// 移除机型列（软删除该机型所有单元格）
export function removeModelColumn(modelId) {
  const now = new Date().toISOString().split('T')[0]
  store.certMatrixCells.forEach(c => {
    if (c.modelId === modelId && !c.isDeleted) {
      c.isDeleted = true
      c.updateTime = now
    }
  })
  saveToLocalStorage()
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
    freightAmount: data.freightAmount !== undefined ? data.freightAmount : (data.amount || ''),
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

// === 权限工具 ===
export function canBatchDelete() {
  return authStore.currentUser?.role === 'admin'
}

export function canEditActivateConfig() {
  const role = authStore.currentUser?.role
  return role === 'admin' || role === 'sales_assistant'
}

// === 激活数据导出配置 CRUD ===
export function addActivateExportConfig(data) {
  const cfg = {
    id: data.id?.trim() || ('aec' + Date.now()),
    customer: data.customer || '',
    updateFrequency: data.updateFrequency || '',
    receiveEmail: data.receiveEmail || '',
    model: data.model || '',
    country: data.country || '',
    softwareVersion: data.softwareVersion || '',
    needImei: !!data.needImei,
    needFilter: !!data.needFilter,
    exportTableName: data.exportTableName || '',
    fotaSource: data.fotaSource || '',
    enabled: data.enabled !== false,
    createdAt: new Date().toISOString().split('T')[0]
  }
  store.activateExportConfigs.push(cfg)
  saveToLocalStorage()
  return cfg
}

export function updateActivateExportConfig(id, updates) {
  const idx = store.activateExportConfigs.findIndex(c => c.id === id)
  if (idx > -1) {
    Object.assign(store.activateExportConfigs[idx], updates)
    saveToLocalStorage()
    return { success: true }
  }
  return { success: false, error: '配置不存在' }
}

export function deleteActivateExportConfig(id) {
  const idx = store.activateExportConfigs.findIndex(c => c.id === id)
  if (idx > -1) {
    store.activateExportConfigs.splice(idx, 1)
    saveToLocalStorage()
    return { success: true }
  }
  return { success: false, error: '配置不存在' }
}

// === 每日待办清单 CRUD ===
export function addDailyReminder(data) {
  const r = {
    id: data.id?.trim() || ('dr' + Date.now()),
    title: data.title || '',
    businessType: data.businessType || 'other',
    activateConfigId: data.activateConfigId || '',
    remindTime: data.remindTime || '09:00',
    repeatRule: data.repeatRule || 'once',
    recurrenceInterval: data.recurrenceInterval || 1,
    customWeekdays: data.customWeekdays || (data.customWeekday !== undefined ? [data.customWeekday] : [1]),
    customMonthday: data.customMonthday ?? 1,
    deadline: data.deadline || '',
    category: data.category || '',
    customer: data.customer || '',
    model: data.model || '',
    status: 'pending',
    remark: data.remark || '',
    createdAt: new Date().toISOString().split('T')[0],
    lastTriggeredAt: null
  }
  store.dailyReminders.push(r)
  saveToLocalStorage()
  return r
}

export function updateDailyReminder(id, updates) {
  const idx = store.dailyReminders.findIndex(r => r.id === id)
  if (idx > -1) {
    Object.assign(store.dailyReminders[idx], updates)
    saveToLocalStorage()
    return { success: true }
  }
  return { success: false, error: '待办不存在' }
}

export function deleteDailyReminder(id) {
  const idx = store.dailyReminders.findIndex(r => r.id === id)
  if (idx > -1) {
    store.dailyReminders.splice(idx, 1)
    saveToLocalStorage()
    return { success: true }
  }
  return { success: false, error: '待办不存在' }
}

// === 提醒日志（控制单日任务不重复提醒） ===
export function hasRemindedToday(todoId) {
  const today = new Date().toISOString().split('T')[0]
  return store.todoRemindLogs.some(log => log.todoId === todoId && log.date === today)
}

export function markReminded(todoId) {
  const today = new Date().toISOString().split('T')[0]
  if (!hasRemindedToday(todoId)) {
    store.todoRemindLogs.push({ todoId, date: today })
    saveToLocalStorage()
  }
}

// 手动持久化当前 store 数据到 localStorage（供外部调用）
export function persistData() {
  saveToLocalStorage()
}
