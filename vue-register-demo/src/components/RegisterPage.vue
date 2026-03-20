<template>
  <div class="register-container">
    <div class="register-card">
      <h1 class="register-title">用户注册</h1>
      
      <form @submit.prevent="handleSubmit" class="register-form">
        <!-- 用户名 -->
        <div class="form-group">
          <label for="username" class="form-label">用户名</label>
          <input
            id="username"
            v-model="formData.username"
            type="text"
            placeholder="请输入用户名"
            class="form-input"
            @blur="trackInputBlur('username')"
            required
          />
          <span v-if="errors.username" class="form-error">{{ errors.username }}</span>
        </div>

        <!-- 邮箱 -->
        <div class="form-group">
          <label for="email" class="form-label">邮箱</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            placeholder="请输入邮箱地址"
            class="form-input"
            @blur="trackInputBlur('email')"
            required
          />
          <span v-if="errors.email" class="form-error">{{ errors.email }}</span>
        </div>

        <!-- 手机号 -->
        <div class="form-group">
          <label for="phone" class="form-label">手机号</label>
          <input
            id="phone"
            v-model="formData.phone"
            type="tel"
            placeholder="请输入手机号"
            class="form-input"
            @blur="trackInputBlur('phone')"
            pattern="[0-9]{11}"
          />
          <span v-if="errors.phone" class="form-error">{{ errors.phone }}</span>
        </div>

        <!-- 密码 -->
        <div class="form-group">
          <label for="password" class="form-label">密码</label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            placeholder="请输入密码（至少6位）"
            class="form-input"
            @blur="trackInputBlur('password')"
            minlength="6"
            required
          />
          <span v-if="errors.password" class="form-error">{{ errors.password }}</span>
        </div>

        <!-- 确认密码 -->
        <div class="form-group">
          <label for="confirmPassword" class="form-label">确认密码</label>
          <input
            id="confirmPassword"
            v-model="formData.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            class="form-input"
            @blur="trackInputBlur('confirmPassword')"
            required
          />
          <span v-if="errors.confirmPassword" class="form-error">{{ errors.confirmPassword }}</span>
        </div>

        <!-- 同意协议 -->
        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input
              v-model="formData.agreeTerms"
              type="checkbox"
              @change="trackAgreeTerms"
            />
            <span>我已阅读并同意 <a href="#" @click.prevent="trackViewTerms">《用户服务协议》</a></span>
          </label>
          <span v-if="errors.agreeTerms" class="form-error">{{ errors.agreeTerms }}</span>
        </div>

        <!-- 提交按钮 -->
        <button
          type="submit"
          class="submit-btn"
          :disabled="isSubmitting"
          @click="trackSubmitClick"
        >
          {{ isSubmitting ? '注册中...' : '立即注册' }}
        </button>
      </form>

      <!-- 登录链接 -->
      <div class="login-link">
        已有账号？<a href="#" @click.prevent="trackGoToLogin">立即登录</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

// 神策 SDK 全局对象（通过 script 标签引入）
const sensors = window.sensorsDataAnalytic201505

// 封装埋点函数，确保 SDK 加载后再调用
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
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false,
})

// 错误信息
const errors = reactive({
  username: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  agreeTerms: '',
})

// 提交状态
const isSubmitting = ref(false)

// 字段交互追踪
const fieldInteractions = reactive({
  username: { focused: false, blurred: false },
  email: { focused: false, blurred: false },
  phone: { focused: false, blurred: false },
  password: { focused: false, blurred: false },
  confirmPassword: { focused: false, blurred: false },
})

// 页面加载时追踪页面浏览事件
trackEvent('$pageview', {
  page_name: 'register_page',
  page_type: 'registration',
})

// 追踪输入框失焦
function trackInputBlur(fieldName) {
  const value = formData[fieldName]
  trackEvent('form_field_blur', {
    field_name: fieldName,
    field_value_length: value ? value.length : 0,
    has_value: !!value,
    page_name: 'register_page',
  })
}

// 追踪同意协议
function trackAgreeTerms() {
  trackEvent('agree_terms_checkbox', {
    agreed: formData.agreeTerms,
    page_name: 'register_page',
  })
}

// 追踪查看协议
function trackViewTerms() {
  trackEvent('view_terms_link_click', {
    link_type: 'user_agreement',
    page_name: 'register_page',
  })
}

// 追踪提交按钮点击
function trackSubmitClick() {
  trackEvent('register_submit_button_click', {
    page_name: 'register_page',
    form_filled: {
      username: !!formData.username,
      email: !!formData.email,
      phone: !!formData.phone,
      password: !!formData.password,
      agree_terms: formData.agreeTerms,
    },
  })
}

// 追踪去登录
function trackGoToLogin() {
  trackEvent('go_to_login_link_click', {
    page_name: 'register_page',
  })
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
    errors.username = '用户名不能为空'
    isValid = false
  } else if (formData.username.length < 3) {
    errors.username = '用户名至少需要3个字符'
    isValid = false
  }
  
  // 邮箱验证
  if (!formData.email.trim()) {
    errors.email = '邮箱不能为空'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = '请输入有效的邮箱地址'
    isValid = false
  }
  
  // 手机号验证
  if (formData.phone && !/^[0-9]{11}$/.test(formData.phone)) {
    errors.phone = '请输入有效的11位手机号'
    isValid = false
  }
  
  // 密码验证
  if (!formData.password) {
    errors.password = '密码不能为空'
    isValid = false
  } else if (formData.password.length < 6) {
    errors.password = '密码至少需要6个字符'
    isValid = false
  }
  
  // 确认密码验证
  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = '两次输入的密码不一致'
    isValid = false
  }
  
  // 协议验证
  if (!formData.agreeTerms) {
    errors.agreeTerms = '请先同意用户服务协议'
    isValid = false
  }
  
  return isValid
}

// 处理表单提交
async function handleSubmit() {
  // 追踪表单提交尝试
  trackEvent('register_form_submit_attempt', {
    page_name: 'register_page',
    timestamp: Date.now(),
  })
  
  // 验证表单
  if (!validateForm()) {
    trackEvent('register_form_validation_failed', {
      page_name: 'register_page',
      error_fields: Object.keys(errors).filter(key => errors[key]),
    })
    return
  }
  
  isSubmitting.value = true
  
  try {
    // 模拟 API 请求
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 注册成功 - 设置登录用户信息
    const userId = `user_${Date.now()}`
    setLoginUser(userId, {
      username: formData.username,
      email: formData.email,
      phone: formData.phone,
      register_time: new Date().toISOString(),
    })
    
    // 追踪注册成功事件
    trackEvent('register_success', {
      user_id: userId,
      username: formData.username,
      email: formData.email,
      phone: formData.phone ? 'provided' : 'not_provided',
      register_method: 'form',
      page_name: 'register_page',
    })
    
    alert('注册成功！')
    
    // 这里可以跳转到登录页或首页
    // window.location.href = '/login'
    
  } catch (error) {
    // 追踪注册失败事件
    trackEvent('register_failed', {
      error_message: error.message,
      page_name: 'register_page',
    })
    
    alert('注册失败，请稍后重试')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.register-container {
  width: 100%;
  max-width: 480px;
  padding: 40px 20px;
}

.register-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 40px;
}

.register-title {
  text-align: center;
  color: #1a1a1a;
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 32px;
}

.register-form {
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
  font-weight: 500;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #4a90d9;
  box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.1);
}

.form-input::placeholder {
  color: #999;
}

.form-error {
  font-size: 12px;
  color: #ff4d4f;
  margin-top: 4px;
}

.checkbox-group {
  flex-direction: row;
  align-items: flex-start;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  margin-top: 2px;
  cursor: pointer;
}

.checkbox-label a {
  color: #4a90d9;
  text-decoration: none;
}

.checkbox-label a:hover {
  text-decoration: underline;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 8px;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.login-link {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: #666;
}

.login-link a {
  color: #4a90d9;
  text-decoration: none;
  font-weight: 500;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>
