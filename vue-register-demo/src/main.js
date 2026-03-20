import { initSensorsAnalytics } from './utils/sensorsAnalytics'

// 在应用启动时初始化神策 SDK
initSensorsAnalytics()
  .then(() => {
    console.log('神策 SDK 初始化完成')
  })
  .catch((error) => {
    console.error('神策 SDK 初始化失败:', error)
  })

import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
