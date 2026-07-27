# 项目管理工作台

基于 Vue 3 + Element Plus 构建的企业项目管理工作台应用，提供客户管理、订单管理、物流跟踪、报表统计等一站式管理功能。

## 功能特性

### 📊 核心模块

- **工作台** - 项目看板、待办事项、任务管理
- **客户管理** - 客户台账、分组管理、跟进记录、附件上传
- **订单管理** - 销售订单、出货记录、物流跟踪
- **产品管理** - 产品型号、认证证书管理
- **财务管理** - 物流费用汇总、账单管理
- **每日工作台账** - 工作记录、证书进度跟进
- **报表中心** - 月度统计、GB审核进度、彩盒设计进度

### 📁 文件管理

- 支持文件上传（.doc/.docx/.pdf/.jpg/.png/.xls/.xlsx）
- 云端附件存储（Supabase）
- 文件预览、下载功能
- 文件名自动清洗与重命名

### 🎨 界面特性

- 响应式布局，支持移动端
- 丰富的图表与进度展示
- 标签筛选与分类管理
- Excel 报表导出

## 技术栈

- **前端框架**: Vue 3 (Composition API)
- **UI 库**: Element Plus
- **构建工具**: Vite 5
- **数据库**: localStorage（本地模式）+ Supabase（云端存储）
- **Excel 处理**: xlsx + exceljs

## 项目结构

```
project-workbench/
├── src/                    # 源码目录
│   ├── components/         # Vue 组件
│   │   ├── Workbench.vue          # 工作台
│   │   ├── CustomerManagement.vue # 客户管理
│   │   ├── OrderManagement.vue    # 订单管理
│   │   ├── ProductManagement.vue  # 产品管理
│   │   ├── FinanceManagement.vue  # 财务管理
│   │   ├── DailyWork.vue         # 每日工作台账
│   │   ├── ReportCenter.vue      # 报表中心
│   │   ├── FileUploader.vue      # 文件上传组件
│   │   └── ...
│   ├── utils/              # 工具函数
│   │   ├── common.js             # 通用工具
│   │   └── excelExport.js        # Excel 导出
│   ├── App.vue             # 根组件
│   ├── main.js             # 入口文件
│   ├── store.js            # 状态管理
│   └── supabase.js         # Supabase 配置
├── dist/                   # 构建产物（部署时使用）
├── index.html              # HTML 入口
├── vite.config.js          # Vite 配置
├── package.json            # 项目依赖
├── netlify.toml            # Netlify 部署配置
├── .gitignore              # Git 忽略文件
└── README.md               # 项目文档
```

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 本地运行

```bash
# 安装依赖
npm install

# 启动开发服务器（端口 8080）
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

### 默认登录

- **用户名**: admin
- **密码**: Admin@123

## Netlify 部署指南

### 步骤一：准备项目

1. 将项目推送到 GitHub/GitLab/Bitbucket
2. 确保项目根目录包含以下文件：
   - `netlify.toml`（已配置）
   - `package.json`
   - `vite.config.js`

### 步骤二：连接 Netlify

1. 访问 [Netlify](https://app.netlify.com/) 并登录
2. 点击 **Add new site** → **Import an existing project**
3. 选择你的 Git 仓库
4. 配置构建参数（系统会自动检测）：
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

### 步骤三：配置环境变量（可选）

如果需要使用 Supabase 云端存储，在 Netlify 中配置：

1. 进入项目 → **Site settings** → **Environment variables**
2. 添加以下变量：
   - `VITE_SUPABASE_URL` - Supabase 项目 URL
   - `VITE_SUPABASE_ANON_KEY` - Supabase 匿名密钥

### 步骤四：部署

点击 **Deploy site** 开始部署，Netlify 会自动：

1. 克隆代码
2. 安装依赖 (`npm install`)
3. 构建项目 (`npm run build`)
4. 部署到 CDN

### 部署完成

部署成功后，你会获得一个 Netlify 子域名（如 `your-project.netlify.app`）。

## 部署常见问题

### Q1: 构建失败 - 缺少依赖

**错误信息**: `Error: Cannot find module 'xxx'`

**解决方案**:
```bash
# 清除缓存后重新构建
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Q2: 部署后页面空白

**可能原因**:

1. **路由问题** - Vue Router 模式为 `history` 时需要配置重定向
2. **资源路径问题** - 构建时 publicPath 配置错误

**解决方案**:

确保 `netlify.toml` 包含重定向配置：
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Q3: Supabase 存储无法上传文件

**错误信息**: `Bucket not found` 或 `Policy not found`

**解决方案**:

1. 在 Supabase Dashboard 中创建存储桶（名称：`customer-files`）
2. 设置存储桶访问权限为 **Private**
3. 配置 Row Level Security (RLS) 策略允许访问

### Q4: 构建超时

**错误信息**: `Build timed out`

**解决方案**:

1. 优化构建速度，使用 `npm ci` 替代 `npm install`
2. 在 `netlify.toml` 中增加构建超时时间：
```toml
[build]
  command = "npm run build"
  publish = "dist"
  timeout = 10
```

### Q5: 环境变量未生效

**错误信息**: `undefined` 或空值

**解决方案**:

1. 确保环境变量以 `VITE_` 开头（Vite 要求）
2. 在 Netlify 中重新部署（环境变量变更后需要重新构建）

## 配置说明

### Supabase 配置

在应用中通过 **设置 → 云端存储** 配置：

1. **Supabase URL**: 项目 URL
2. **Supabase Anon Key**: 匿名密钥
3. **存储桶名称**: `customer-files`

### 数据存储

- **本地模式**: 数据存储在浏览器 localStorage 中
- **云端模式**: 附件上传至 Supabase Storage

## 许可证

MIT License