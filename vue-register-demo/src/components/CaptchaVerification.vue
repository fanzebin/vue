<template>
  <div class="captcha-container">
    <div class="captcha-box" @click="handleCaptchaClick">
      <!-- 验证区域 -->
      <div class="captcha-main">
        <!-- 背景图片 -->
        <div class="captcha-image" :style="{ backgroundImage: `url(${backgroundImage})` }">
          <!-- 滑块缺口 -->
          <div 
            class="captcha-gap" 
            :style="{ 
              left: `${gapPosition}px`,
              top: `${gapTop}px`
            }"
          ></div>
          <!-- 滑块 -->
          <div 
            v-if="isDragging || isVerified"
            class="captcha-slider-piece"
            :style="{ 
              left: `${sliderPosition}px`,
              top: `${gapTop}px`,
              backgroundImage: `url(${backgroundImage})`
            }"
          ></div>
        </div>
        
        <!-- 滑块轨道 -->
        <div class="slider-track-container">
          <div class="slider-track">
            <div 
              class="slider-progress" 
              :style="{ width: `${sliderPosition}px` }"
            ></div>
            <div 
              class="slider-button" 
              :class="{ 'verified': isVerified, 'failed': isFailed }"
              :style="{ left: `${sliderPosition}px` }"
              @mousedown="startDrag"
              @touchstart="startDrag"
            >
              <span v-if="!isVerified && !isFailed">➜</span>
              <span v-else-if="isVerified">✓</span>
              <span v-else>↻</span>
            </div>
          </div>
          <div class="slider-text">
            <span v-if="!isVerified && !isFailed">{{ sliderText }}</span>
            <span v-else-if="isVerified" class="success-text">验证成功</span>
            <span v-else class="fail-text">验证失败，点击重试</span>
          </div>
        </div>
      </div>
      
      <!-- 刷新按钮 -->
      <button class="refresh-btn" @click.stop="refreshCaptcha" title="换一张">
        🔄
      </button>
    </div>
    
    <!-- 验证状态提示 -->
    <div v-if="showTip" :class="['captcha-tip', tipType]">
      {{ tipMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

//  emits
const emit = defineEmits(['success', 'fail'])

// 状态
const isDragging = ref(false)
const isVerified = ref(false)
const isFailed = ref(false)
const sliderPosition = ref(0)
const gapPosition = ref(0)
const gapTop = ref(0)
const startX = ref(0)
const showTip = ref(false)
const tipType = ref('')
const tipMessage = ref('')

// 配置
const sliderText = computed(() => {
  if (isVerified.value) return '验证成功'
  if (isFailed.value) return '验证失败'
  return '向右滑动完成验证'
})

// 模拟背景图片（使用渐变色代替）
const backgroundImage = ref('')

// 生成随机颜色作为背景
function generateRandomBackground() {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

// 初始化验证码
function initCaptcha() {
  isVerified.value = false
  isFailed.value = false
  sliderPosition.value = 0
  // 缺口位置范围：距离左边 60% - 90% 的位置（对应轨道宽度约 280px）
  const trackWidth = 280
  gapPosition.value = Math.floor(Math.random() * (trackWidth * 0.3)) + (trackWidth * 0.6) // 168-252px
  gapTop.value = Math.floor(Math.random() * 80) + 40 // 40-120px
  backgroundImage.value = generateRandomBackground()
  showTip.value = false
}

// 开始拖动
function startDrag(e) {
  if (isVerified.value) return
  
  isDragging.value = true
  startX.value = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX
  
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', onDrag, { passive: false })
  document.addEventListener('touchend', stopDrag)
}

// 拖动中
function onDrag(e) {
  if (!isDragging.value) return
  
  e.preventDefault?.()
  
  const currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX
  const diff = currentX - startX.value
  
  // 限制滑块移动范围
  const maxPosition = 280
  sliderPosition.value = Math.max(0, Math.min(diff, maxPosition))
}

// 停止拖动
function stopDrag() {
  if (!isDragging.value) return
  
  isDragging.value = false
  
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
  
  // 验证滑块位置
  verifyCaptcha()
}

// 验证验证码
function verifyCaptcha() {
  const tolerance = 5 // 允许误差范围
  
  if (Math.abs(sliderPosition.value - gapPosition.value) <= tolerance) {
    // 验证成功
    isVerified.value = true
    showTipMessage('success', '验证成功！')
    emit('success', generateToken())
  } else {
    // 验证失败
    isFailed.value = true
    showTipMessage('error', '验证失败，请重试')
    emit('fail')
    
    // 1 秒后重置
    setTimeout(() => {
      if (isFailed.value) {
        resetSlider()
      }
    }, 1000)
  }
}

// 生成 Token
function generateToken() {
  return `captcha_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 显示提示信息
function showTipMessage(type, message) {
  tipType.value = type
  tipMessage.value = message
  showTip.value = true
  
  setTimeout(() => {
    showTip.value = false
  }, 2000)
}

// 重置滑块
function resetSlider() {
  sliderPosition.value = 0
  isFailed.value = false
}

// 刷新验证码
function refreshCaptcha() {
  initCaptcha()
}

// 手动点击验证（简化版）
function handleCaptchaClick() {
  if (!isVerified.value && !isDragging.value) {
    // 点击验证区域也可以触发验证（简化交互）
    initCaptcha()
  }
}

// 重置验证码（供父组件调用）
function reset() {
  initCaptcha()
}

// 暴露方法给父组件
defineExpose({
  reset
})

// 生命周期
onMounted(() => {
  initCaptcha()
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
})
</script>

<style scoped>
.captcha-container {
  position: relative;
  width: 100%;
}

.captcha-box {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  position: relative;
}

.captcha-main {
  position: relative;
}

.captcha-image {
  width: 100%;
  height: 160px;
  border-radius: 6px;
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
  margin-bottom: 12px;
}

.captcha-gap {
  position: absolute;
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.7);
  clip-path: polygon(
    0% 0%,
    0% 20%,
    20% 20%,
    20% 0%,
    80% 0%,
    80% 20%,
    100% 20%,
    100% 80%,
    80% 80%,
    80% 100%,
    20% 100%,
    20% 80%,
    0% 80%
  );
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3);
}

.captcha-slider-piece {
  position: absolute;
  width: 50px;
  height: 50px;
  background-size: cover;
  background-position: center;
  clip-path: polygon(
    0% 0%,
    0% 20%,
    20% 20%,
    20% 0%,
    80% 0%,
    80% 20%,
    100% 20%,
    100% 80%,
    80% 80%,
    80% 100%,
    20% 100%,
    20% 80%,
    0% 80%
  );
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  transition: left 0.1s ease;
  z-index: 10;
}

.slider-track-container {
  position: relative;
  width: 100%;
  height: 44px;
  background: #f5f5f5;
  border-radius: 22px;
  border: 1px solid #e0e0e0;
}

.slider-track {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 22px;
  overflow: hidden;
}

.slider-progress {
  position: absolute;
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 22px 0 0 22px;
  transition: width 0.1s ease;
}

.slider-button {
  position: absolute;
  top: 2px;
  left: 0;
  width: 40px;
  height: 40px;
  background: #fff;
  border: 2px solid #667eea;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  color: #667eea;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
  user-select: none;
  touch-action: none;
}

.slider-button:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.slider-button.verified {
  background: #52c41a;
  border-color: #52c41a;
  color: #fff;
}

.slider-button.failed {
  background: #ff4d4f;
  border-color: #ff4d4f;
  color: #fff;
}

.slider-text {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #999;
  pointer-events: none;
  z-index: 5;
}

.success-text {
  color: #52c41a;
  font-weight: 600;
}

.fail-text {
  color: #ff4d4f;
  font-weight: 600;
}

.refresh-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.refresh-btn:hover {
  transform: rotate(180deg);
  background: #fff;
}

.captcha-tip {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  animation: slideDown 0.3s ease;
  z-index: 100;
}

.captcha-tip.success {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.captcha-tip.error {
  background: #fff2f0;
  color: #ff4d4f;
  border: 1px solid #ffccc7;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* 响应式 */
@media (max-width: 520px) {
  .captcha-image {
    height: 140px;
  }
  
  .slider-track-container {
    height: 40px;
  }
  
  .slider-button {
    width: 36px;
    height: 36px;
  }
}
</style>
