<template>
  <div class="settings">
    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="云端存储" name="supabase">
        <div class="tab-content">
          <div class="setting-section">
            <h3>Supabase 配置</h3>
            <div class="supabase-status" :class="{ connected: supabaseConnected, disconnected: !supabaseConnected }">
              <span class="status-icon">
                <el-icon v-if="supabaseConnected"><CircleCheck /></el-icon>
                <el-icon v-else><CircleClose /></el-icon>
              </span>
              <span class="status-text">{{ supabaseConnected ? '已连接' : '未连接' }}</span>
            </div>
            <el-form :model="supabaseForm" label-width="120px">
              <el-form-item label="Supabase URL">
                <el-input v-model="supabaseForm.url" placeholder="https://你的项目ID.supabase.co" @blur="trimInput('url')" />
              </el-form-item>
              <el-form-item label="Supabase Anon KEY">
                <el-input v-model="supabaseForm.key" type="password" placeholder="你的匿名密钥" show-password @blur="trimInput('key')" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="testConnection">测试连接</el-button>
                <el-button @click="saveConfig">保存本地配置</el-button>
                <el-button @click="clearConfig">重置配置</el-button>
                <el-button @click="disableCloudSync" :disabled="!supabaseConnected">一键关闭云端同步</el-button>
              </el-form-item>
            </el-form>
            <div class="config-priority">
              <el-alert
                title="配置读取优先级（从高到低）"
                type="info"
                :closable="false"
                show-icon
              >
                <p>① 本机私有配置文件：.trae/settings.local.json</p>
                <p>② 本地环境文件：.env.local</p>
                <p>③ 页面手动填写临时缓存</p>
                <p>④ 无有效配置：控制台打印「Supabase 配置不全，无法连接」，系统自动强制切本地模式</p>
              </el-alert>
            </div>
          </div>
          
          <div class="setting-section">
            <h3>配置文件管理</h3>
            <el-alert
              title="配置文件说明"
              type="warning"
              :closable="false"
              show-icon
            >
              <p>配置文件存放在项目根目录的 .trae/settings.local.json 文件中</p>
              <p>该文件已加入 .gitignore，不会被上传到 GitHub</p>
              <p>配置优先级：配置文件 &gt; 环境变量 &gt; 页面临时缓存</p>
            </el-alert>
            <div class="data-actions" style="margin-top: 15px;">
              <el-button @click="exportConfig">导出配置文件</el-button>
              <el-button @click="triggerImportConfig">导入配置文件</el-button>
              <el-button type="danger" @click="handleClearCloudConfig">清除云端配置</el-button>
              <input type="file" id="config-file-input" accept=".json" style="display:none" @change="handleConfigFileSelect" />
            </div>
          </div>
          
          <div class="setting-section">
            <h3>存储桶配置</h3>
            <el-form :model="supabaseForm" label-width="120px">
              <el-form-item label="存储桶名称">
                <el-input v-model="supabaseForm.bucket" placeholder="customer_light_files" @blur="trimInput('bucket')" />
              </el-form-item>
              <el-form-item>
                <template v-if="supabaseConnected && !bucketExists && canCreateBucket">
                  <el-button type="primary" @click="handleCreateBucket">创建存储桶</el-button>
                </template>
                <template v-else-if="supabaseConnected && bucketExists">
                  <el-button type="primary" disabled>存储桶已存在</el-button>
                </template>
                <template v-else-if="supabaseConnected && bucketListError">
                  <el-button type="primary" disabled>权限不足，无法创建</el-button>
                </template>
                <el-button @click="saveConfig">保存配置</el-button>
              </el-form-item>
            </el-form>
            <div class="bucket-info">
              <div class="info-item">
                <span class="info-label">访问权限：</span>
                <span class="info-value">私有（Private）</span>
              </div>
              <div class="info-item">
                <span class="info-label">文件路径：</span>
                <span class="info-value">customers/客户ID/文件名</span>
              </div>
            </div>
            <div class="bucket-tip">
              <el-alert
                title="配置说明"
                type="info"
                :closable="false"
                show-icon
              >
                <p>1. 在 Supabase Dashboard 中创建存储桶：Settings → Storage → Create bucket</p>
                <p>2. 存储桶名称可以自定义，所有上传组件将共用此配置</p>
                <p>3. 访问权限设置为 <strong>Private</strong></p>
                <p>4. 文件限制：单文件5MB以内，支持图片、PDF、Word</p>
              </el-alert>
            </div>
          </div>
          
          <div class="setting-section">
            <h3>数据同步</h3>
            <div class="sync-actions">
              <el-button @click="syncDataToCloud">上传数据到云端</el-button>
              <el-button @click="syncDataFromCloud">从云端下载数据</el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="用户信息" name="user">
        <div class="tab-content">
          <div class="setting-section">
            <h3>基本信息</h3>
            <el-form :model="userForm" label-width="120px">
              <el-form-item label="登录账号">
                <el-input v-model="userForm.username" disabled />
              </el-form-item>
              <el-form-item label="昵称">
                <el-input v-model="userForm.name" />
              </el-form-item>
              <el-form-item label="岗位">
                <el-select v-model="userForm.position">
                  <el-option label="销售助理" value="销售助理" />
                  <el-option label="研发工程师" value="研发工程师" />
                  <el-option label="项目经理" value="项目经理" />
                  <el-option label="财务" value="财务" />
                </el-select>
              </el-form-item>
              <el-form-item label="个人备注">
                <el-input v-model="userForm.notes" type="textarea" :rows="3" placeholder="填写个人备注信息..." />
              </el-form-item>
              <el-form-item label="常用对接客户">
                <el-select v-model="userForm.quickCustomers" multiple filterable>
                  <el-option v-for="c in store.customers" :key="c.id" :label="c.name" :value="c.name" />
                </el-select>
              </el-form-item>
              <el-form-item label="默认导出报表格式">
                <el-select v-model="userForm.defaultReportFormat">
                  <el-option label="Excel (.csv)" value="excel" />
                  <el-option label="PDF" value="pdf" />
                  <el-option label="Word" value="word" />
                </el-select>
              </el-form-item>
              <el-form-item label="物流默认快递公司">
                <el-select v-model="userForm.defaultLogisticsCompany">
                  <el-option label="顺丰" value="顺丰" />
                  <el-option label="DHL" value="DHL" />
                  <el-option label="UPS" value="UPS" />
                  <el-option label="FedEx" value="FedEx" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="saveUserInfo">保存用户信息</el-button>
              </el-form-item>
            </el-form>
          </div>
          
          <div class="setting-section">
            <h3>修改密码</h3>
            <el-form :model="passwordForm" label-width="120px" :rules="passwordRules" ref="passwordFormRef">
              <el-form-item label="旧密码" prop="oldPassword">
                <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入旧密码" show-password @input="validatePasswordForm" />
              </el-form-item>
              <el-form-item label="新密码" prop="newPassword">
                <el-input v-model="passwordForm.newPassword" type="password" placeholder="至少6位" show-password @input="validatePasswordForm" />
                <div v-if="passwordErrors.minLength" class="password-error">{{ passwordErrors.minLength }}</div>
              </el-form-item>
              <el-form-item label="确认密码" prop="confirmPassword">
                <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="再次输入新密码" show-password @input="validatePasswordForm" />
                <div v-if="passwordErrors.match" class="password-error">{{ passwordErrors.match }}</div>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleChangePassword">修改密码</el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="账号管理" name="accounts" v-if="store.user.role === 'admin'">
        <div class="tab-content">
          <div class="setting-section">
            <div class="section-header">
              <h3>用户列表</h3>
              <div class="user-search-bar">
                <el-input 
                  v-model="userSearchKeyword" 
                  placeholder="搜索用户名/岗位" 
                  style="width: 200px; margin-right: 10px;"
                  clearable
                />
                <el-button type="primary" @click="handleAddUser">新增用户</el-button>
              </div>
            </div>
            <el-table :data="filteredAuthUsers" border style="width: 100%">
              <el-table-column prop="username" label="登录账号" />
              <el-table-column prop="name" label="昵称" />
              <el-table-column prop="role" label="角色">
                <template #default="{ row }">
                  <el-tag :type="row.role === 'admin' ? 'danger' : 'success'">
                    {{ row.role === 'admin' ? '管理员' : '销售助理' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="position" label="岗位" />
              <el-table-column prop="createdAt" label="创建时间" />
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'disabled' ? 'info' : 'success'">
                    {{ row.status === 'disabled' ? '已禁用' : '已启用' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="250">
                <template #default="{ row }">
                  <el-button size="small" @click="handleEditUser(row)">编辑</el-button>
                  <el-button size="small" @click="handleResetPassword(row)">重置密码</el-button>
                  <el-button size="small" @click="handleToggleStatus(row)">
                    {{ row.status === 'disabled' ? '启用' : '禁用' }}
                  </el-button>
                  <el-button size="small" type="danger" @click="handleDeleteUser(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="预警配置" name="alert">
        <div class="tab-content">
          <div class="setting-section">
            <h3>预警推送设置</h3>
            <div class="alert-items">
              <div class="alert-item">
                <div class="alert-info">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                  <div class="alert-detail">
                    <span class="alert-title">证书到期预警</span>
                    <span class="alert-desc">提前提醒证书即将到期</span>
                  </div>
                </div>
                <el-switch v-model="alertSettings.certExpire" active-text="开启" inactive-text="关闭" />
              </div>
              
              <div class="alert-item">
                <div class="alert-info">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <div class="alert-detail">
                    <span class="alert-title">物流包裹超期预警</span>
                    <span class="alert-desc">运输超时未签收提醒</span>
                  </div>
                </div>
                <el-switch v-model="alertSettings.logisticsOverdue" active-text="开启" inactive-text="关闭" />
              </div>
              
              <div class="alert-item">
                <div class="alert-info">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <div class="alert-detail">
                    <span class="alert-title">客户跟进超时预警</span>
                    <span class="alert-desc">超过设定天数无跟进记录提醒</span>
                  </div>
                </div>
                <el-switch v-model="alertSettings.customerFollowup" active-text="开启" inactive-text="关闭" />
              </div>

              <div class="alert-item">
                <div class="alert-info">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                    <line x1="12" y1="18" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                  <div class="alert-detail">
                    <span class="alert-title">物料申请到期预警</span>
                    <span class="alert-desc">物料申请即将过期提醒</span>
                  </div>
                </div>
                <el-switch v-model="alertSettings.materialExpire" active-text="开启" inactive-text="关闭" />
              </div>
            </div>
          </div>
          
          <div class="setting-section">
            <h3>预警参数设置</h3>
            <el-form :model="alertParams" label-width="150px">
              <el-form-item label="证书到期预警天数">
                <div class="param-row">
                  <el-input-number v-model="alertParams.certWarningDays" :min="7" :max="90" />
                  <span class="param-unit">天（标黄）</span>
                </div>
              </el-form-item>
              <el-form-item label="证书紧急预警天数">
                <div class="param-row">
                  <el-input-number v-model="alertParams.certDangerDays" :min="1" :max="30" />
                  <span class="param-unit">天（标红）</span>
                </div>
              </el-form-item>
              <el-form-item label="物流超期预警天数">
                <div class="param-row">
                  <el-input-number v-model="alertParams.logisticsOverdueDays" :min="3" :max="30" />
                  <span class="param-unit">天</span>
                </div>
              </el-form-item>
              <el-form-item label="客户未跟进预警天数">
                <div class="param-row">
                  <el-input-number v-model="alertParams.customerFollowupDays" :min="7" :max="90" />
                  <span class="param-unit">天</span>
                </div>
              </el-form-item>
              <el-form-item label="物料申请到期预警天数">
                <div class="param-row">
                  <el-input-number v-model="alertParams.materialExpireDays" :min="3" :max="30" />
                  <span class="param-unit">天</span>
                </div>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="saveAlertSettings">保存预警配置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="数据管理" name="data">
        <div class="tab-content">
          <div class="setting-section">
            <h3>数据导出</h3>
            <div class="data-actions">
              <el-button @click="exportDataAsJson">导出 JSON</el-button>
              <el-button @click="exportDataAsExcel">导出 Excel</el-button>
            </div>
          </div>
          
          <div class="setting-section">
            <h3>数据导入</h3>
            <el-button @click="showImportDialog = true">导入数据</el-button>
          </div>
          
          <div class="setting-section">
            <h3>云端同步</h3>
            <div class="data-actions">
              <el-button @click="checkConflict">检测数据冲突</el-button>
              <el-button @click="syncDataToCloud">本地数据上传云端</el-button>
              <el-button @click="syncDataFromCloud">云端数据拉取到本地</el-button>
            </div>
            <el-alert
              title="数据冲突说明"
              type="info"
              :closable="false"
              show-icon
              style="margin-top: 15px;"
            >
              <p>当本地数据与云端数据不一致时，系统会检测到冲突并弹出确认框</p>
              <p>您可以选择「以云端覆盖本地」或「以本地覆盖云端」</p>
            </el-alert>
          </div>
          
          <div class="setting-section danger-section">
            <h3>缓存清理</h3>
            <el-alert
              title="警告"
              type="warning"
              :closable="false"
              show-icon
            >
              <p>此操作将清空浏览器本地所有缓存数据，包括IndexedDB和localStorage。</p>
            </el-alert>
            <div class="reset-actions">
              <el-button type="danger" @click="clearBrowserCache">一键清空浏览器本地缓存</el-button>
            </div>
          </div>
          
          <div class="setting-section danger-section">
            <h3>数据重置（测试用）</h3>
            <el-alert
              title="警告"
              type="warning"
              :closable="false"
              show-icon
            >
              <p>此操作将清除所有业务数据（客户、订单、待办等），恢复到系统初始状态。</p>
              <p>仅用于测试环境，生产环境请勿使用！</p>
            </el-alert>
            <div class="reset-actions">
              <el-button type="danger" @click="confirmResetData">一键清除测试数据</el-button>
            </div>
          </div>
          
          <div class="setting-section">
            <h3>存储信息</h3>
            <div class="data-info">
              <div class="info-row">
                <span>当前存储模式：</span>
                <span :class="store.localMode ? 'local' : 'remote'">{{ store.localMode ? '本地存储' : '云端存储' }}</span>
              </div>
              <div class="info-row">
                <span>数据大小：</span>
                <span>{{ dataSize }}</span>
              </div>
              <div class="info-row">
                <span>客户数量：</span>
                <span>{{ store.customers.length }}人</span>
              </div>
              <div class="info-row">
                <span>订单数量：</span>
                <span>{{ store.salesOrders.length }}单</span>
              </div>
              <div class="info-row">
                <span>待办任务：</span>
                <span>{{ store.dailyTodos.filter(t => !t.completed).length }}项</span>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="显示设置" name="display">
        <div class="tab-content">
          <div class="setting-section">
            <h3>主题设置</h3>
            <el-form :model="displayForm" label-width="100px">
              <el-form-item label="主题颜色">
                <div class="color-picker">
                  <button 
                    v-for="color in themeColors" 
                    :key="color"
                    class="color-btn"
                    :style="{ background: color }"
                    :class="{ active: displayForm.themeColor === color }"
                    @click="displayForm.themeColor = color"
                  ></button>
                </div>
              </el-form-item>
              <el-form-item label="语言">
                <el-select v-model="displayForm.language">
                  <el-option label="中文" value="zh-CN" />
                  <el-option label="English" value="en" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="saveDisplaySettings">保存显示设置</el-button>
              </el-form-item>
            </el-form>
          </div>
          
          <div class="setting-section">
            <h3>字体设置</h3>
            <el-form :model="displayForm" label-width="100px">
              <el-form-item label="字体大小">
                <el-select v-model="displayForm.fontSize">
                  <el-option label="小号 (12px)" value="small" />
                  <el-option label="默认 (14px)" value="medium" />
                  <el-option label="大号 (16px)" value="large" />
                  <el-option label="特大号 (18px)" value="xlarge" />
                </el-select>
              </el-form-item>
              <el-form-item label="字体类型">
                <el-select v-model="displayForm.fontFamily">
                  <el-option label="系统默认" value="system" />
                  <el-option label="微软雅黑" value="microsoft" />
                  <el-option label="宋体" value="songti" />
                  <el-option label="黑体" value="heiti" />
                </el-select>
              </el-form-item>
            </el-form>
          </div>
          
          <div class="setting-section">
            <h3>页面布局</h3>
            <el-form :model="displayForm" label-width="120px">
              <el-form-item>
                <el-switch v-model="displayForm.showMilestone" active-text="显示里程碑" inactive-text="隐藏里程碑" />
              </el-form-item>
              <el-form-item>
                <el-switch v-model="displayForm.showCompleted" active-text="显示已完成" inactive-text="隐藏已完成" />
              </el-form-item>
              <el-form-item>
                <el-switch v-model="displayForm.showSalesProjects" active-text="仅展示销售类项目" inactive-text="显示全部项目" />
              </el-form-item>
            </el-form>
          </div>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="关于" name="about">
        <div class="tab-content">
          <div class="setting-section">
            <h3>系统信息</h3>
            <div class="about-info">
              <div class="info-row">
                <span>版本：</span>
                <span>2.0.0</span>
              </div>
              <div class="info-row">
                <span>构建模式：</span>
                <span>{{ buildMode }}</span>
              </div>
              <div class="info-row">
                <span>技术栈：</span>
                <span>Vue3 + Element Plus + Vite</span>
              </div>
              <div class="info-row">
                <span>存储：</span>
                <span>IndexedDB + LocalStorage</span>
              </div>
              <div class="info-row">
                <span>当前用户：</span>
                <span>{{ store.user.name }}</span>
              </div>
              <div class="info-row">
                <span>角色：</span>
                <span>{{ store.user.role === 'sales_assistant' ? '销售助理' : '管理员' }}</span>
              </div>
            </div>
          </div>
          
          <div class="setting-section">
            <h3>项目仓库</h3>
            <div class="about-info">
              <div class="info-row">
                <span>GitHub 地址：</span>
                <a href="https://github.com/wendyphang621-maker/personalprojectplatform" target="_blank" class="link">https://github.com/wendyphang621-maker/personalprojectplatform</a>
              </div>
            </div>
          </div>
          
          <div class="setting-section">
            <h3>依赖包清单</h3>
            <div class="dependency-list">
              <div class="dependency-item">
                <span>vue</span>
                <span>^3.4.0</span>
              </div>
              <div class="dependency-item">
                <span>element-plus</span>
                <span>^2.6.0</span>
              </div>
              <div class="dependency-item">
                <span>@supabase/supabase-js</span>
                <span>^2.45.0</span>
              </div>
              <div class="dependency-item">
                <span>@vueuse/core</span>
                <span>^10.9.0</span>
              </div>
              <div class="dependency-item">
                <span>xlsx</span>
                <span>^0.18.0</span>
              </div>
            </div>
          </div>
          
          <div class="setting-section">
            <h3>功能说明</h3>
            <div class="feature-list">
              <div class="feature-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span>客户线索管理：海外客户台账、跟进记录、寄样申请、分组配置</span>
              </div>
              <div class="feature-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span>订单出货管理：订单台账、物流跟踪、费用对账、IMEI核对</span>
              </div>
              <div class="feature-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <span>产品资料台账：机型参数、合规认证、渲染图素材、供应商管理</span>
              </div>
              <div class="feature-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
                <span>报表中心：5套销售专属报表，支持Excel导出</span>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <el-dialog v-model="showImportDialog" title="导入数据" width="500px">
      <el-form :model="importForm" label-width="80px">
        <el-form-item label="数据文件">
          <input type="file" accept=".json" @change="handleFileSelect" />
        </el-form-item>
        <el-form-item label="数据内容">
          <el-input v-model="importForm.data" type="textarea" :rows="10" placeholder="粘贴JSON数据..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="importData">导入</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showAddUserDialog" :title="isEditingUser ? '编辑用户' : '新增用户'" width="450px">
      <el-form :model="userEditForm" label-width="100px" ref="userFormRef">
        <el-form-item label="登录账号" prop="username" :rules="[{ required: true, message: '请输入登录账号' }]">
          <el-input v-model="userEditForm.username" placeholder="输入邮箱作为登录账号" @input="validateUserForm" />
        </el-form-item>
        <el-form-item label="昵称" prop="name">
          <el-input v-model="userEditForm.name" placeholder="用户昵称" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!isEditingUser" :rules="[{ required: true, message: '请输入密码' }]">
          <el-input v-model="userEditForm.password" type="password" placeholder="至少6位" show-password @input="validateUserForm" />
          <div v-if="userFormErrors.minLength" class="password-error">{{ userFormErrors.minLength }}</div>
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword" v-if="!isEditingUser" :rules="[{ required: true, message: '请确认密码' }]">
          <el-input v-model="userEditForm.confirmPassword" type="password" placeholder="再次输入密码" show-password @input="validateUserForm" />
          <div v-if="userFormErrors.match" class="password-error">{{ userFormErrors.match }}</div>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="userEditForm.role">
            <el-option label="管理员" value="admin" />
            <el-option label="销售助理" value="sales_assistant" />
          </el-select>
        </el-form-item>
        <el-form-item label="岗位">
          <el-select v-model="userEditForm.position">
            <el-option label="销售助理" value="销售助理" />
            <el-option label="研发工程师" value="研发工程师" />
            <el-option label="项目经理" value="项目经理" />
            <el-option label="财务" value="财务" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeUserDialog">取消</el-button>
        <el-button type="primary" @click="saveUser">保存</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showConflictDialog" title="数据冲突检测" width="500px">
      <template v-if="conflictResult">
        <div v-if="conflictResult.hasConflict">
          <el-alert
            title="检测到数据冲突"
            type="warning"
            :closable="false"
            show-icon
          >
            <p>{{ conflictResult.message }}</p>
          </el-alert>
          <div class="conflict-details" style="margin-top: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="border: 1px solid #e4e7ed; padding: 8px; text-align: left;">数据表</th>
                  <th style="border: 1px solid #e4e7ed; padding: 8px; text-align: center;">本地数量</th>
                  <th style="border: 1px solid #e4e7ed; padding: 8px; text-align: center;">云端数量</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="border: 1px solid #e4e7ed; padding: 8px;">客户</td>
                  <td style="border: 1px solid #e4e7ed; padding: 8px; text-align: center;">{{ conflictResult.localCount.customers }}</td>
                  <td style="border: 1px solid #e4e7ed; padding: 8px; text-align: center;">{{ conflictResult.cloudCount.customers }}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #e4e7ed; padding: 8px;">寄样记录</td>
                  <td style="border: 1px solid #e4e7ed; padding: 8px; text-align: center;">{{ conflictResult.localCount.sampleDeliveries }}</td>
                  <td style="border: 1px solid #e4e7ed; padding: 8px; text-align: center;">{{ conflictResult.cloudCount.sample_deliveries }}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #e4e7ed; padding: 8px;">待办任务</td>
                  <td style="border: 1px solid #e4e7ed; padding: 8px; text-align: center;">{{ conflictResult.localCount.dailyTodos }}</td>
                  <td style="border: 1px solid #e4e7ed; padding: 8px; text-align: center;">{{ conflictResult.cloudCount.daily_todos }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style="margin-top: 20px;">
            <p>请选择数据同步方式：</p>
            <div class="conflict-options">
              <el-button type="primary" @click="resolveConflict('cloud')">以云端覆盖本地</el-button>
              <el-button @click="resolveConflict('local')">以本地覆盖云端</el-button>
            </div>
          </div>
        </div>
        <div v-else>
          <el-alert
            title="数据一致"
            type="success"
            :closable="false"
            show-icon
          >
            <p>{{ conflictResult.message }}</p>
          </el-alert>
        </div>
      </template>
      <template #footer>
        <el-button @click="showConflictDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { store, authStore, register, deleteAuthUser, updateAuthUser, changePassword, resetAllData, syncAllFromSupabase } from '../store.js'
import { testSupabaseConnection, saveSupabaseConfig, getSupabaseConfig, clearSupabaseConfig, createSupabaseBucket, syncToSupabase, fetchFromSupabase, setForceProduction, getForceProduction, setLocalMode, getLocalMode, getLocalModeStatus, exportConfigFile, importConfigFile, clearSavedConfig, updatePassword, createAccount, listAccounts, updateAccount, deleteAccount, resetOtherUserPassword, logRequestDestination } from '../supabase.js'
import { CircleCheck, CircleClose } from '@element-plus/icons-vue'

const emit = defineEmits(['config-change'])
const props = defineProps({
  currentSubPage: {
    type: String,
    default: 'user'
  }
})

const activeTab = ref(props.currentSubPage || 'user')

watch(() => props.currentSubPage, (newVal) => {
  if (newVal && activeTab.value !== newVal) {
    activeTab.value = newVal
  }
}, { immediate: true })

onMounted(async () => {
  await syncAllFromSupabase()
  if (store.user.role === 'admin') {
    await loadAccounts()
  }
})

const showImportDialog = ref(false)
const showAddUserDialog = ref(false)
const showConflictDialog = ref(false)
const isEditingUser = ref(false)
const editingUserId = ref('')
const conflictResult = ref(null)
const userSearchKeyword = ref('')
const passwordFormRef = ref(null)
const userFormRef = ref(null)
const accountList = ref([])

const passwordErrors = reactive({
  minLength: '',
  match: ''
})

const userFormErrors = reactive({
  minLength: '',
  match: ''
})

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入旧密码' }],
  newPassword: [
    { required: true, message: '请输入新密码' },
    { min: 6, message: '密码长度至少6位' }
  ],
  confirmPassword: [{ required: true, message: '请确认新密码' }]
}

const authUsers = computed(() => {
  if (accountList.value.length > 0) {
    return accountList.value
  }
  return authStore.users
})

const filteredAuthUsers = computed(() => {
  if (!userSearchKeyword.value) {
    return authUsers.value
  }
  const keyword = userSearchKeyword.value.toLowerCase()
  return authUsers.value.filter(u => 
    (u.username && u.username.toLowerCase().includes(keyword)) ||
    (u.name && u.name.toLowerCase().includes(keyword)) ||
    (u.position && u.position.toLowerCase().includes(keyword))
  )
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const userEditForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  name: '',
  role: 'sales_assistant',
  position: '销售助理',
  status: 'active'
})

const supabaseConnected = ref(false)
const bucketExists = ref(false)
const canCreateBucket = ref(true)
const bucketListError = ref(false)
const forceProduction = ref(getForceProduction())
const buildMode = ref(typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.MODE : 'unknown')
const supabaseForm = reactive({
  url: '',
  key: '',
  bucket: ''
})

const savedConfig = ref({})
const config = getSupabaseConfig()
supabaseForm.url = config.url
supabaseForm.key = config.key
supabaseForm.bucket = config.bucket
savedConfig.value = { ...config }

if (config.url && config.key) {
  testConnectionSilent()
}

const isConfigChanged = computed(() => {
  return supabaseForm.url !== savedConfig.value.url || 
         supabaseForm.key !== savedConfig.value.key || 
         supabaseForm.bucket !== savedConfig.value.bucket
})

watch(isConfigChanged, (newVal) => {
  emit('config-change', newVal)
})

function handleForceProductionChange(val) {
  setForceProduction(val)
  if (val) {
    alert('已强制切换到线上正式库！\n\n请刷新页面使配置生效，本地和线上将访问同一数据库。')
  } else {
    alert('已恢复开发测试库！\n\n请刷新页面使配置生效。')
  }
}

async function testConnectionSilent() {
  if (!supabaseForm.url || !supabaseForm.key) {
    return
  }
  
  trimInput('url')
  trimInput('key')
  trimInput('bucket')
  
  const bucketName = supabaseForm.bucket || 'customer_light_files'
  const result = await testSupabaseConnection(supabaseForm.url, supabaseForm.key, bucketName)
  if (result.success) {
    supabaseConnected.value = true
    
    if (result.bucketListError) {
      bucketListError.value = true
      bucketExists.value = false
      canCreateBucket.value = false
    } else {
      bucketListError.value = false
      
      if (result.bucketMissing) {
        bucketExists.value = false
        canCreateBucket.value = true
      } else {
        bucketExists.value = true
        canCreateBucket.value = false
      }
    }
  } else {
    supabaseConnected.value = false
    bucketExists.value = false
    canCreateBucket.value = false
    bucketListError.value = false
  }
}

async function testConnection() {
  if (!supabaseForm.url || !supabaseForm.key) {
    alert('请填写 URL 和 Key')
    return
  }
  
  trimInput('url')
  trimInput('key')
  trimInput('bucket')
  
  const bucketName = supabaseForm.bucket || 'customer_light_files'
  const result = await testSupabaseConnection(supabaseForm.url, supabaseForm.key, bucketName)
  if (result.success) {
    supabaseConnected.value = true
    // 连接成功后自动保存配置并切换到云端模式
    saveConfig(true)
    
    if (result.bucketListError) {
      bucketListError.value = true
      bucketExists.value = false
      canCreateBucket.value = false
      alert(result.message)
    } else {
      bucketListError.value = false
      
      if (result.bucketMissing) {
        bucketExists.value = false
        canCreateBucket.value = true
        
        if (result.availableBuckets && result.availableBuckets.length > 0) {
          alert(result.message + '\n\n当前可用存储桶：\n' + result.availableBuckets.join('\n'))
        } else {
          alert(result.message)
        }
      } else {
        bucketExists.value = true
        canCreateBucket.value = false
        alert(result.message)
      }
    }
  } else {
    supabaseConnected.value = false
    bucketExists.value = false
    canCreateBucket.value = false
    bucketListError.value = false
    alert('连接失败：' + result.error)
  }
}

function saveConfig(silent = false) {
  if (!supabaseForm.url || !supabaseForm.key) {
    alert('请填写 URL 和 Key')
    return
  }
  
  trimInput('url')
  trimInput('key')
  trimInput('bucket')
  
  const bucketName = supabaseForm.bucket || 'customer_light_files'
  saveSupabaseConfig(supabaseForm.url, supabaseForm.key, bucketName)
  savedConfig.value = {
    url: supabaseForm.url,
    key: supabaseForm.key,
    bucket: bucketName
  }
  supabaseConnected.value = true
  
  // 保存成功后自动切换到云端模式
  setLocalMode(false)
  
  if (!silent) {
    alert('配置已保存，已切换到云端模式，现在可以同步数据了')
  }
}

function disableCloudSync() {
  if (confirm('确定要关闭云端同步吗？\n\n关闭后系统将切换到本地模式，所有数据读写仅走浏览器本地存储。')) {
    setLocalMode(true)
    alert('已关闭云端同步，系统切换到本地模式')
    location.reload()
  }
}

function trimInput(field) {
  if (supabaseForm[field]) {
    supabaseForm[field] = supabaseForm[field].trim()
  }
}

async function handleCreateBucket() {
  if (!supabaseForm.bucket) {
    alert('请填写存储桶名称')
    return
  }
  
  if (!supabaseConnected.value) {
    alert('请先测试连接并确保连接成功')
    return
  }
  
  trimInput('bucket')
  
  const result = await createSupabaseBucket(supabaseForm.bucket)
  if (result.success) {
    saveConfig(true)
    bucketExists.value = true
    canCreateBucket.value = false
    
    const verifyResult = await testSupabaseConnection(supabaseForm.url, supabaseForm.key, supabaseForm.bucket)
    if (verifyResult.success && !verifyResult.bucketMissing) {
      alert(`✅ 存储桶创建成功！\n\n存储桶名称：${supabaseForm.bucket}\n状态：可用`)
    } else {
      alert(`✅ 存储桶创建成功！\n\n存储桶名称：${supabaseForm.bucket}\n提示：${verifyResult.message}`)
    }
  } else {
    if (result.error && (result.error.includes('permission') || result.error.includes('Policy') || result.error.includes('RLS'))) {
      alert('❌ 建桶权限不足：当前密钥没有创建存储桶的权限，请使用服务端密钥或在 Supabase 控制台手动创建存储桶')
      canCreateBucket.value = false
    } else {
      alert('❌ 创建失败：' + result.error)
    }
  }
}

function clearConfig() {
  if (confirm('确定要清除配置吗？')) {
    clearSupabaseConfig()
    supabaseForm.url = ''
    supabaseForm.key = ''
    supabaseForm.bucket = ''
    supabaseConnected.value = false
    alert('配置已清除')
  }
}

async function handleClearCloudConfig() {
  if (confirm('确定要清除云端配置吗？\n\n此操作将删除浏览器中保存的所有Supabase密钥，下次关闭本地模式时需要重新填写。')) {
    await clearSavedConfig()
    clearSupabaseConfig()
    supabaseForm.url = ''
    supabaseForm.key = ''
    supabaseForm.bucket = ''
    supabaseConnected.value = false
    alert('云端配置已清除')
  }
}

async function syncDataToCloud() {
  const tables = [
    { name: 'customers', data: store.customers },
    { name: 'sample_deliveries', data: store.sampleDeliveries },
    { name: 'customer_followups', data: store.customerFollowUps }
  ]
  
  let successCount = 0
  for (const table of tables) {
    const result = await syncToSupabase(table.name, table.data)
    if (result.success) successCount++
  }
  
  alert(`同步完成：成功 ${successCount}/${tables.length} 张表`)
}

async function syncDataFromCloud() {
  if (!confirm('从云端下载数据将覆盖本地数据，确定继续吗？')) {
    return
  }
  
  const tables = [
    { name: 'customers', storeKey: 'customers' },
    { name: 'sample_deliveries', storeKey: 'sampleDeliveries' },
    { name: 'customer_followups', storeKey: 'customerFollowUps' }
  ]
  
  let successCount = 0
  for (const table of tables) {
    const result = await fetchFromSupabase(table.name)
    if (result.success && result.data) {
      store[table.storeKey] = result.data
      successCount++
    }
  }
  
  alert(`同步完成：成功 ${successCount}/${tables.length} 张表`)
}

function confirmResetData() {
  if (!confirm('⚠️ 警告：此操作将清除所有业务数据（客户、订单、待办、物流等），并恢复到系统初始状态！\n\n确定要继续吗？')) {
    return
  }
  if (!confirm('⚠️ 再次确认：此操作不可恢复！确定要清除所有测试数据吗？')) {
    return
  }
  
  try {
    resetAllData()
    alert('✅ 数据重置成功！所有业务数据已恢复到初始状态。')
  } catch (error) {
    console.error('Reset data error:', error)
    alert('❌ 数据重置失败，请刷新页面重试。')
  }
}

const userForm = reactive({
  username: authStore.currentUser?.username || '',
  name: store.user.name,
  position: store.user.position,
  notes: store.user.notes || '',
  quickCustomers: [...(store.user.quickCustomers || [])],
  defaultReportFormat: store.user.defaultReportFormat,
  defaultLogisticsCompany: store.user.defaultLogisticsCompany
})

watch(() => userForm.name, (newName) => {
  store.user.name = newName
})

watch(() => userForm.position, (newPosition) => {
  store.user.position = newPosition
})

watch(() => userForm.notes, (newNotes) => {
  store.user.notes = newNotes
})

watch(() => userForm.quickCustomers, (newCustomers) => {
  store.user.quickCustomers = [...newCustomers]
}, { deep: true })

watch(() => userForm.defaultReportFormat, (newFormat) => {
  store.user.defaultReportFormat = newFormat
})

watch(() => userForm.defaultLogisticsCompany, (newCompany) => {
  store.user.defaultLogisticsCompany = newCompany
})

function saveUserInfo() {
  alert('用户信息已保存')
}

const alertSettings = reactive({
  certExpire: store.alertSettings?.certExpire ?? true,
  logisticsOverdue: store.alertSettings?.logisticsOverdue ?? true,
  customerFollowup: store.alertSettings?.customerFollowup ?? true,
  materialExpire: store.alertSettings?.materialExpire ?? true
})

watch(() => alertSettings.certExpire, (newVal) => {
  if (!store.alertSettings) store.alertSettings = {}
  store.alertSettings.certExpire = newVal
})

watch(() => alertSettings.logisticsOverdue, (newVal) => {
  if (!store.alertSettings) store.alertSettings = {}
  store.alertSettings.logisticsOverdue = newVal
})

watch(() => alertSettings.customerFollowup, (newVal) => {
  if (!store.alertSettings) store.alertSettings = {}
  store.alertSettings.customerFollowup = newVal
})

watch(() => alertSettings.materialExpire, (newVal) => {
  if (!store.alertSettings) store.alertSettings = {}
  store.alertSettings.materialExpire = newVal
})

const alertParams = reactive({
  certWarningDays: store.alertParams?.certWarningDays ?? 30,
  certDangerDays: store.alertParams?.certDangerDays ?? 7,
  logisticsOverdueDays: store.alertParams?.logisticsOverdueDays ?? 7,
  customerFollowupDays: store.alertParams?.customerFollowupDays ?? 15,
  materialExpireDays: store.alertParams?.materialExpireDays ?? 7
})

watch(() => alertParams.certWarningDays, (newVal) => {
  if (!store.alertParams) store.alertParams = {}
  store.alertParams.certWarningDays = newVal
})

watch(() => alertParams.certDangerDays, (newVal) => {
  if (!store.alertParams) store.alertParams = {}
  store.alertParams.certDangerDays = newVal
})

watch(() => alertParams.logisticsOverdueDays, (newVal) => {
  if (!store.alertParams) store.alertParams = {}
  store.alertParams.logisticsOverdueDays = newVal
})

watch(() => alertParams.customerFollowupDays, (newVal) => {
  if (!store.alertParams) store.alertParams = {}
  store.alertParams.customerFollowupDays = newVal
})

watch(() => alertParams.materialExpireDays, (newVal) => {
  if (!store.alertParams) store.alertParams = {}
  store.alertParams.materialExpireDays = newVal
})

function saveAlertSettings() {
  alert('预警配置已保存')
}

const displayForm = reactive({
  themeColor: '#409EFF',
  language: 'zh-CN',
  fontSize: 'medium',
  fontFamily: 'system',
  showMilestone: true,
  showCompleted: true,
  showSalesProjects: false
})

function saveDisplaySettings() {
  alert('显示设置已保存')
}

const importForm = reactive({
  data: ''
})

const themeColors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#B37FEB']

const dataSize = computed(() => {
  const data = JSON.stringify(store)
  const bytes = new Blob([data]).size
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
})

function changeAvatar() {
  alert('头像功能已移除，不再需要存储桶配置')
}

async function loadAccounts() {
  try {
    const result = await listAccounts()
    if (result.success && result.users) {
      accountList.value = result.users.map(u => ({
        id: u.id,
        username: u.email,
        name: u.user_metadata?.display_name || '',
        role: u.user_metadata?.role || 'sales_assistant',
        position: u.user_metadata?.position || '销售助理',
        createdAt: new Date(u.created_at).toISOString().split('T')[0],
        status: u.banned_until ? 'disabled' : 'active'
      }))
    }
  } catch (error) {
    console.error('[账号管理] 加载账号失败:', error)
    console.log('[账号管理] 当前本地模式开关:', getLocalModeStatus() ? '开启' : '关闭')
  }
}

function validatePasswordForm() {
  passwordErrors.minLength = ''
  passwordErrors.match = ''
  
  if (passwordForm.newPassword && passwordForm.newPassword.length < 6) {
    passwordErrors.minLength = '新密码长度至少6位'
  }
  
  if (passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordErrors.match = '两次输入的密码不一致'
  }
}

function validateUserForm() {
  userFormErrors.minLength = ''
  userFormErrors.match = ''
  
  if (!isEditingUser.value) {
    if (userEditForm.password && userEditForm.password.length < 6) {
      userFormErrors.minLength = '密码长度至少6位'
    }
    
    if (userEditForm.password && userEditForm.confirmPassword && userEditForm.password !== userEditForm.confirmPassword) {
      userFormErrors.match = '两次输入的密码不一致'
    }
  }
}

async function handleChangePassword() {
  validatePasswordForm()
  
  if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
    alert('请填写所有密码字段')
    return
  }
  
  if (passwordForm.newPassword.length < 6) {
    alert('新密码至少6位')
    return
  }
  
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    alert('新密码和确认密码不一致')
    return
  }
  
  try {
    const isCloud = !getLocalModeStatus()
    logRequestDestination('密码修改', isCloud)
    
    const result = await updatePassword(passwordForm.oldPassword, passwordForm.newPassword)
    if (result.success) {
      alert('密码修改成功！即将退出登录，请使用新密码重新登录...')
      passwordForm.oldPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
      setTimeout(() => {
        localStorage.removeItem('auth_user')
        sessionStorage.clear()
        location.href = '/'
      }, 2000)
    } else {
      alert(result.error || '修改失败，请重试')
    }
  } catch (error) {
    console.error('[密码修改] 错误:', error)
    console.log('[密码修改] 当前本地模式开关:', getLocalModeStatus() ? '开启' : '关闭')
    alert('密码修改失败：' + (error.message || '请检查网络或联系管理员'))
  }
}

function handleAddUser() {
  isEditingUser.value = false
  editingUserId.value = ''
  userEditForm.username = ''
  userEditForm.password = ''
  userEditForm.confirmPassword = ''
  userEditForm.name = ''
  userEditForm.role = 'sales_assistant'
  userEditForm.position = '销售助理'
  userEditForm.status = 'active'
  userFormErrors.minLength = ''
  userFormErrors.match = ''
  showAddUserDialog.value = true
}

function handleEditUser(user) {
  isEditingUser.value = true
  editingUserId.value = user.id
  userEditForm.username = user.username
  userEditForm.name = user.name || ''
  userEditForm.role = user.role
  userEditForm.position = user.position
  userEditForm.status = user.status
  showAddUserDialog.value = true
}

async function handleResetPassword(user) {
  if (confirm(`确定要重置用户 "${user.username}" 的密码吗？\n\n新密码将设置为默认值 "Admin@123"`)) {
    try {
      const isCloud = !getLocalModeStatus()
      logRequestDestination('重置密码', isCloud)
      
      const result = await resetOtherUserPassword(user.id, 'Admin@123')
      if (result.success) {
        alert('密码重置成功')
      } else {
        alert('重置失败：' + result.error)
      }
    } catch (error) {
      console.error('[重置密码] 错误:', error)
      alert('密码重置失败')
    }
  }
}

async function handleToggleStatus(user) {
  const action = user.status === 'disabled' ? '启用' : '禁用'
  if (confirm(`确定要${action}用户 "${user.username}" 吗？`)) {
    try {
      const isCloud = !getLocalModeStatus()
      logRequestDestination('账号状态变更', isCloud)
      
      if (user.status === 'disabled') {
        const result = await updateAccount(user.id, { ban_duration: 'none' })
        if (result.success) {
          alert('账号已启用')
          await loadAccounts()
        } else {
          alert('操作失败：' + result.error)
        }
      } else {
        const result = await updateAccount(user.id, { ban_duration: '87600h' })
        if (result.success) {
          alert('账号已禁用')
          await loadAccounts()
        } else {
          alert('操作失败：' + result.error)
        }
      }
    } catch (error) {
      console.error('[账号状态变更] 错误:', error)
      alert('操作失败')
    }
  }
}

async function handleDeleteUser(user) {
  if (confirm(`确定要删除用户 "${user.username}" 吗？此操作不可恢复！`)) {
    try {
      const isCloud = !getLocalModeStatus()
      logRequestDestination('删除账号', isCloud)
      
      const result = await deleteAccount(user.id)
      if (result.success) {
        alert('删除成功')
        await loadAccounts()
      } else {
        alert('删除失败：' + result.error)
      }
    } catch (error) {
      console.error('[删除账号] 错误:', error)
      alert('删除失败')
    }
  }
}

function closeUserDialog() {
  showAddUserDialog.value = false
  isEditingUser.value = false
  editingUserId.value = ''
  userEditForm.username = ''
  userEditForm.password = ''
  userEditForm.confirmPassword = ''
  userEditForm.name = ''
  userEditForm.role = 'sales_assistant'
  userEditForm.position = '销售助理'
  userFormErrors.minLength = ''
  userFormErrors.match = ''
}

async function saveUser() {
  validateUserForm()
  
  if (!userEditForm.username) {
    alert('请填写登录账号')
    return
  }
  
  if (!isEditingUser.value) {
    if (!userEditForm.password) {
      alert('请填写密码')
      return
    }
    if (userEditForm.password.length < 6) {
      alert('密码至少6位')
      return
    }
    if (userEditForm.password !== userEditForm.confirmPassword) {
      alert('两次密码不一致')
      return
    }
  }
  
  try {
    const isCloud = !getLocalModeStatus()
    logRequestDestination(isEditingUser.value ? '更新账号' : '新增账号', isCloud)
    
    if (!isEditingUser.value) {
      const result = await createAccount(
        userEditForm.username,
        userEditForm.password,
        userEditForm.name,
        userEditForm.position
      )
      if (result.success) {
        alert('账号创建成功')
        closeUserDialog()
        await loadAccounts()
      } else {
        alert('创建失败：' + result.error)
      }
    } else {
      const result = await updateAccount(editingUserId.value, {
        email: userEditForm.username,
        user_metadata: {
          display_name: userEditForm.name,
          position: userEditForm.position,
          role: userEditForm.role
        }
      })
      if (result.success) {
        alert('更新成功')
        closeUserDialog()
        await loadAccounts()
      } else {
        alert('更新失败：' + result.error)
      }
    }
  } catch (error) {
    console.error('[账号管理] 错误:', error)
    alert('操作失败：' + (error.message || '请检查网络或联系管理员'))
  }
}

function exportDataAsJson() {
  const data = JSON.stringify(store, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `项目工作台数据_${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function exportDataAsExcel() {
  alert('Excel导出功能开发中')
}

function handleFileSelect(event) {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      importForm.data = e.target.result
    }
    reader.readAsText(file)
  }
}

function importData() {
  if (!importForm.data.trim()) return
  try {
    const data = JSON.parse(importForm.data)
    Object.assign(store, data)
    showImportDialog.value = false
    alert('导入成功')
  } catch (e) {
    alert('数据格式错误')
  }
}

function clearBrowserCache() {
  if (!confirm('确定要清空浏览器本地缓存吗？\n\n此操作将清除所有localStorage和IndexedDB数据，但不会影响业务数据。')) {
    return
  }
  
  localStorage.clear()
  indexedDB.databases().then(databases => {
    databases.forEach(db => {
      indexedDB.deleteDatabase(db.name)
    })
  })
  
  alert('浏览器缓存已清空，页面将刷新')
  location.reload()
}

function exportConfig() {
  const result = exportConfigFile()
  if (result.success) {
    alert('配置文件已导出到下载目录')
  } else {
    alert('导出失败：' + result.error)
  }
}

function triggerImportConfig() {
  document.getElementById('config-file-input').click()
}

async function handleConfigFileSelect(event) {
  const file = event.target.files[0]
  if (file) {
    const result = await importConfigFile(file)
    if (result.success) {
      alert('配置文件已导入，页面将刷新')
      location.reload()
    } else {
      alert('导入失败：' + result.error)
    }
  }
  event.target.value = ''
}

async function checkConflict() {
  const { checkDataConflict } = await import('../store.js')
  const result = await checkDataConflict()
  conflictResult.value = result
  showConflictDialog.value = true
}

async function resolveConflict(mode) {
  showConflictDialog.value = false
  if (mode === 'cloud') {
    if (confirm('确定以云端数据覆盖本地数据吗？此操作不可恢复！')) {
      await syncDataFromCloud()
      alert('已成功以云端数据覆盖本地')
    }
  } else {
    if (confirm('确定以本地数据覆盖云端数据吗？此操作不可恢复！')) {
      await syncDataToCloud()
      alert('已成功以本地数据覆盖云端')
    }
  }
}
</script>

<style scoped>
.settings {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  overflow: auto;
}

.settings :deep(.el-tabs) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.settings :deep(.el-tabs__content) {
  flex: 1;
  overflow-y: auto;
}

.settings :deep(.el-tab-pane) {
  height: 100%;
}

.supabase-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  margin-bottom: 20px;
  font-size: 14px;
}

.supabase-status.connected {
  background: #f0f9eb;
  color: #67c23a;
}

.supabase-status.disconnected {
  background: #fef0f0;
  color: #f56c6c;
}

.status-icon {
  font-size: 16px;
}

.status-text {
  font-weight: 500;
}

.bucket-info {
  margin-bottom: 15px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-label {
  color: #909399;
}

.info-value {
  font-weight: 500;
  color: #303133;
}

.bucket-tip {
  margin-top: 10px;
}

.bucket-tip p {
  margin: 4px 0;
  font-size: 13px;
  color: #606266;
}

.sync-actions {
  display: flex;
  gap: 10px;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.setting-section {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.setting-section:last-child {
  margin-bottom: 0;
}

.setting-section h3 {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.data-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.data-info {
  padding: 15px;
  background: #fff;
  border-radius: 4px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 14px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-row .local {
  color: #67C23A;
}

.info-row .remote {
  color: #409EFF;
}

.config-priority {
  margin-top: 15px;
}

.config-priority p {
  margin: 4px 0;
  font-size: 13px;
  color: #606266;
}

.color-picker {
  display: flex;
  gap: 10px;
}

.color-btn {
  width: 40px;
  height: 40px;
  border: 3px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.color-btn:hover {
  transform: scale(1.1);
}

.color-btn.active {
  border-color: #303133;
}

.alert-items {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.alert-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #fff;
  border-radius: 8px;
}

.alert-info {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #409EFF;
}

.alert-detail {
  display: flex;
  flex-direction: column;
}

.alert-title {
  font-size: 14px;
  font-weight: 500;
}

.alert-desc {
  font-size: 12px;
  color: #909399;
}

.param-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.param-unit {
  font-size: 13px;
  color: #909399;
}

.about-info {
  padding: 15px;
  background: #fff;
  border-radius: 4px;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  background: #fff;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
}

.dependency-list {
  padding: 15px;
  background: #fff;
  border-radius: 4px;
}

.dependency-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e4e7ed;
  font-size: 14px;
}

.dependency-item:last-child {
  border-bottom: none;
}

.link {
  color: #409EFF;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .data-actions {
    flex-wrap: wrap;
  }
  .alert-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .user-search-bar {
    flex-direction: column;
    gap: 10px;
  }
}

.password-error {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 4px;
}

.user-search-bar {
  display: flex;
  align-items: center;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}
</style>