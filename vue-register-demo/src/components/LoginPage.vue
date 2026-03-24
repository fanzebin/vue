<template>
  <div class="login-container">
    <!-- 炫酷背景动画 -->
    <div class="animated-background">
      <div class="particle" v-for="n in 50" :key="n" :style="getParticleStyle(n)"></div>
      <div class="gradient-orb gradient-orb-1"></div>
      <div class="gradient-orb gradient-orb-2"></div>
      <div class="gradient-orb gradient-orb-3"></div>
    </div>

    <div class="login-card">
      <div class="login-header">
        <h1 class="login-title">欢迎登录</h1>
        <p class="login-subtitle">PC 端登录</p>
      </div>
      
      <form @submit.prevent="handleSubmit" class="login-form">
        <!-- 用户名/邮箱 -->
        <div class="form-group">
          <label for="username" class="form-label">
            <span class="label-icon">👤</span>
            账号
          </label>
          <input
            id="username"
            v-model="formData.username"
            type="text"
            placeholder="请输入用户名或邮箱"
            class="form-input"
            @blur="trackInputBlur('username')"
            required
          />
          <span v-if="errors.username" class="form-error">{{ errors.username }}</span>
        </div>

        <!-- 密码 -->
        <div class="form-group">
          <label for="password" class="form-label">
            <span class="label-icon">🔒</span>
            密码
          </label>
          <div class="password-wrapper">
            <input
              id="password"
              v-model="formData.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入密码"
              class="form-input password-input"
              @blur="trackInputBlur('password')"
              required
            />
            <button 
              type="button" 
              class="password-toggle" 
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
          <span v-if="errors.password" class="form-error">{{ errors.password }}</span>
        </div>

        <!-- 记住我 & 忘记密码 -->
        <div class="form-options">
          <label class="checkbox-label">
            <input
              v-model="formData.rememberMe"
              type="checkbox"
            />
            <span>记住我</span>
          </label>
          <a href="#" @click.prevent="handleForgotPassword" class="forgot-link">忘记密码？</a>
        </div>

        <!-- 人机验证 -->
        <div class="captcha-section">
          <label class="form-label">
            <span class="label-icon">🛡️</span>
            安全验证
          </label>
          <CaptchaVerification 
            ref="captchaRef"
            @success="handleCaptchaSuccess"
            @fail="handleCaptchaFail"
          />
          <span v-if="errors.captcha" class="form-error">{{ errors.captcha }}</span>
        </div>

        <!-- 提交按钮 -->
        <button
          type="submit"
          class="submit-btn"
          :disabled="isSubmitting || !captchaVerified"
        >
          <span v-if="isSubmitting" class="loading-spinner"></span>
          {{ isSubmitting ? '登录中...' : '立即登录' }}
        </button>
      </form>

      <!-- 其他登录方式 -->
      <div class="other-login">
        <div class="divider">
          <span>其他登录方式</span>
        </div>
        <div class="social-login">
          <button class="social-btn wechat" title="微信登录">💬</button>
          <button class="social-btn qq" title="QQ 登录">🐧</button>
          <button class="social-btn github" title="GitHub 登录">🐙</button>
        </div>
      </div>

      <!-- 注册链接 -->
      <div class="register-link">
        还没有账号？<a href="#" @click.prevent="handleGoToRegister">立即注册</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import CaptchaVerification from './CaptchaVerification.vue'

// 神策 SDK 全局对象（通过 script 标签引入）
const sensors = window.sensorsDataAnalytic201505

// 封装埋点函数
function trackEvent(eventName, properties = {}) {
  if (sensors && typeof sensors.track === 'function') {
    sensors.track(eventName, properties)
  } else {
    console.log('[Sensors] SDK not loaded, event:', eventName, properties)
  }
}

// 设置登录用户信息
function setLoginUser(userId, properties = {}) {
  if (sensors && typeof sensors.login === 'function') {
    sensors.login(userId)
  }
  if (sensors && typeof sensors.register === 'function') {
    sensors.register(properties)
  }
}

// 表单数据
const formData = reactive({
  username: '',
  password: '',
  rememberMe: false,
})

// 错误信息
const errors = reactive({
  username: '',
  password: '',
  captcha: '',
})

// 状态
const isSubmitting = ref(false)
const showPassword = ref(false)
const captchaVerified = ref(false)
const captchaToken = ref('')

// 验证码引用
const captchaRef = ref(null)

// 粒子样式计算
function getParticleStyle(index) {
  const size = Math.random() * 6 + 2
  const left = Math.random() * 100
  const top = Math.random() * 100
  const delay = Math.random() * 20
  const duration = Math.random() * 10 + 10
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${left}%`,
    top: `${top}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
  }
}

// 页面加载时追踪页面浏览事件
trackEvent('$pageview', {
  page_name: 'login_page',
  page_type: 'login',
  platform: 'pc',
})

// 追踪输入框失焦
function trackInputBlur(fieldName) {
  const value = formData[fieldName]
  trackEvent('form_field_blur', {
    field_name: fieldName,
    field_value_length: value ? value.length : 0,
    has_value: !!value,
    page_name: 'login_page',
  })
}

// 处理验证码成功
function handleCaptchaSuccess(token) {
  captchaVerified.value = true
  captchaToken.value = token
  errors.captcha = ''
  trackEvent('captcha_success', {
    page_name: 'login_page',
  })
}

// 处理验证码失败
function handleCaptchaFail() {
  captchaVerified.value = false
  captchaToken.value = ''
  trackEvent('captcha_failed', {
    page_name: 'login_page',
  })
}

// 处理忘记密码
function handleForgotPassword() {
  trackEvent('forgot_password_click', {
    page_name: 'login_page',
  })
  alert('请联系管理员重置密码')
}

// 处理去注册
function handleGoToRegister() {
  trackEvent('go_to_register_click', {
    page_name: 'login_page',
  })
  // 这里可以跳转到注册页
  // window.location.href = '/register'
}

// 表单验证
function validateForm() {
  let isValid = true
  
  // 清空错误
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })
  
  // 用户名验证
  if (!formData.username.trim()) {
    errors.username = '账号不能为空'
    isValid = false
  }
  
  // 密码验证
  if (!formData.password) {
    errors.password = '密码不能为空'
    isValid = false
  } else if (formData.password.length < 6) {
    errors.password = '密码至少需要 6 个字符'
    isValid = false
  }
  
  // 验证码验证
  if (!captchaVerified.value) {
    errors.captcha = '请完成安全验证'
    isValid = false
  }
  
  return isValid
}

// 处理表单提交
async function handleSubmit() {
  // 追踪表单提交尝试
  trackEvent('login_form_submit_attempt', {
    page_name: 'login_page',
    timestamp: Date.now(),
  })
  
  // 验证表单
  if (!validateForm()) {
    trackEvent('login_form_validation_failed', {
      page_name: 'login_page',
      error_fields: Object.keys(errors).filter(key => errors[key]),
    })
    return
  }
  
  isSubmitting.value = true
  
  try {
    // 模拟 API 请求
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 登录成功 - 设置登录用户信息
    const userId = `user_${Date.now()}`
    setLoginUser(userId, {
      username: formData.username,
      login_time: new Date().toISOString(),
      remember_me: formData.rememberMe,
    })
    
    // 追踪登录成功事件
    trackEvent('login_success', {
      user_id: userId,
      username: formData.username,
      login_method: 'password',
      remember_me: formData.rememberMe,
      page_name: 'login_page',
    })
    
    alert('登录成功！')
    
    // 这里可以跳转到首页
    // window.location.href = '/home'
    
  } catch (error) {
    // 追踪登录失败事件
    trackEvent('login_failed', {
      error_message: error.message,
      page_name: 'login_page',
    })
    
    alert('登录失败，请稍后重试')
    
    // 重置验证码
    if (captchaRef.value) {
      captchaRef.value.reset()
    }
    captchaVerified.value = false
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.login-container {
  position: relative;
  width: 100%;
  max-width: 480px;
  padding: 40px 20px;
  z-index: 1;
}

/* 炫酷背景动画 */
.animated-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
}

.particle {
  position: absolute;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  pointer-events: none;
  animation: float infinite ease-in-out;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) translateX(0) rotate(0deg);
    opacity: 0.6;
  }
  25% {
    transform: translateY(-20px) translateX(10px) rotate(90deg);
    opacity: 0.8;
  }
  50% {
    transform: translateY(-40px) translateX(-10px) rotate(180deg);
    opacity: 1;
  }
  75% {
    transform: translateY(-20px) translateX(10px) rotate(270deg);
    opacity: 0.8;
  }
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.6;
  animation: orbFloat infinite ease-in-out;
}

.gradient-orb-1 {
  width: 400px;
  height: 400px;
  background: rgba(255, 107, 107, 0.5);
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.gradient-orb-2 {
  width: 300px;
  height: 300px;
  background: rgba(78, 205, 196, 0.5);
  bottom: -50px;
  right: -50px;
  animation-delay: -5s;
}

.gradient-orb-3 {
  width: 250px;
  height: 250px;
  background: rgba(255, 230, 109, 0.5);
  top: 50%;
  left: 50%;
  animation-delay: -10s;
}

@keyframes orbFloat {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -30px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

.login-card {
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  padding: 48px 40px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-title {
  color: #1a1a1a;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-subtitle {
  color: #666;
  font-size: 14px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 6px;
}

.label-icon {
  font-size: 16px;
}

.form-input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 15px;
  transition: all 0.3s ease;
  background: #fff;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.15);
}

.form-input::placeholder {
  color: #aaa;
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input {
  padding-right: 50px;
}

.password-toggle {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 4px;
  opacity: 0.6;
  transition: opacity 0.3s;
}

.password-toggle:hover {
  opacity: 1;
}

.form-error {
  font-size: 12px;
  color: #ff4d4f;
  margin-top: 4px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #667eea;
}

.forgot-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.forgot-link:hover {
  text-decoration: underline;
}

.captcha-section {
  margin-top: 8px;
}

.submit-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
}

.submit-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  transition: left 0.5s;
}

.submit-btn:hover:not(:disabled)::before {
  left: 100%;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.5);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.other-login {
  margin-top: 32px;
}

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e0e0e0;
}

.divider span {
  color: #999;
  font-size: 13px;
}

.social-login {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.social-btn {
  width: 44px;
  height: 44px;
  border: 2px solid #e0e0e0;
  border-radius: 50%;
  background: #fff;
  cursor: pointer;
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.social-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.social-btn.wechat:hover {
  border-color: #07c160;
  background: #f0fdf4;
}

.social-btn.qq:hover {
  border-color: #12b7f5;
  background: #f0f9ff;
}

.social-btn.github:hover {
  border-color: #333;
  background: #f5f5f5;
}

.register-link {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: #666;
}

.register-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.register-link a:hover {
  text-decoration: underline;
}

/* 响应式 */
@media (max-width: 520px) {
  .login-container {
    padding: 20px 16px;
  }
  
  .login-card {
    padding: 36px 24px;
  }
  
  .login-title {
    font-size: 26px;
  }
}
</style>
