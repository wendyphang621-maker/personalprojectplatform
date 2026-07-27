<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="9" y1="9" x2="15" y2="9"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          <span>项目工作台</span>
        </div>
        <p>登录您的账号</p>
      </div>
      
      <el-form :model="loginForm" label-width="80px" class="login-form">
        <el-form-item label="用户名">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-btn" @click="handleLogin" :loading="loading">登录</el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-links">
        <span @click="showRegister = true" class="link">注册新账号</span>
        <span @click="showForgotPassword = true" class="link">忘记密码?</span>
      </div>
    </div>
    
    <el-dialog v-model="showRegister" title="注册新账号" width="400px">
      <el-form :model="registerForm" label-width="100px">
        <el-form-item label="用户名">
          <el-input v-model="registerForm.username" placeholder="用户名长度3-20位" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="registerForm.password" type="password" placeholder="至少8位，包含字母和数字" show-password />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input v-model="registerForm.confirmPassword" type="password" placeholder="再次输入密码" show-password />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="registerForm.role">
            <el-option label="管理员" value="admin" />
            <el-option label="销售助理" value="sales_assistant" />
          </el-select>
        </el-form-item>
        <el-form-item label="岗位">
          <el-select v-model="registerForm.position">
            <el-option label="销售助理" value="销售助理" />
            <el-option label="研发工程师" value="研发工程师" />
            <el-option label="项目经理" value="项目经理" />
            <el-option label="财务" value="财务" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRegister = false">取消</el-button>
        <el-button type="primary" @click="handleRegister">注册</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showForgotPassword" title="找回密码" width="400px">
      <el-form :model="forgotForm" label-width="100px">
        <el-form-item label="用户名">
          <el-input v-model="forgotForm.username" placeholder="请输入用户名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForgotPassword = false">取消</el-button>
        <el-button type="primary" @click="handleForgotPassword">重置密码</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { login, register, resetPassword } from '../store.js'

const emit = defineEmits(['login-success'])

const loading = ref(false)
const showRegister = ref(false)
const showForgotPassword = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  role: 'sales_assistant',
  position: '销售助理'
})

const forgotForm = reactive({
  username: ''
})

async function handleLogin() {
  if (!loginForm.username || !loginForm.password) {
    alert('请填写用户名和密码')
    return
  }
  
  loading.value = true
  const result = await login(loginForm.username, loginForm.password)
  loading.value = false
  
  if (result.success) {
    emit('login-success')
  } else {
    alert(result.error)
  }
}

function handleRegister() {
  if (!registerForm.username || !registerForm.password) {
    alert('请填写用户名和密码')
    return
  }
  
  if (registerForm.password.length < 8) {
    alert('密码长度至少8位')
    return
  }
  
  if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(registerForm.password)) {
    alert('密码必须包含字母和数字')
    return
  }
  
  if (registerForm.password !== registerForm.confirmPassword) {
    alert('两次密码输入不一致')
    return
  }
  
  const result = register(registerForm.username, registerForm.password, registerForm.role, registerForm.position)
  if (result.success) {
    alert('注册成功，请登录')
    showRegister.value = false
    loginForm.username = registerForm.username
    loginForm.password = registerForm.password
  } else {
    alert(result.error)
  }
}

function handleForgotPassword() {
  if (!forgotForm.username) {
    alert('请输入用户名')
    return
  }
  
  const result = resetPassword(forgotForm.username)
  if (result.success) {
    alert('密码已重置为: ' + result.newPassword)
    showForgotPassword.value = false
    loginForm.username = forgotForm.username
  } else {
    alert(result.error)
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 10px;
}

.logo svg {
  width: 36px;
  height: 36px;
  color: #409EFF;
}

.login-header p {
  color: #909399;
  font-size: 14px;
}

.login-form {
  margin-bottom: 20px;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
}

.login-links {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.link {
  color: #409EFF;
  cursor: pointer;
}

.link:hover {
  text-decoration: underline;
}
</style>
