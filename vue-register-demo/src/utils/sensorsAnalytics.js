/**
 * 神策数据分析 SDK 配置模块
 * 
 * 使用方法：
 * 1. 将 project_id 替换为你的神策项目 ID
 * 2. 将 server_url 替换为你的神策数据接收地址
 * 3. 根据需求调整其他配置项
 */

// 神策配置信息 - 请根据实际情况修改
const SA_CONFIG = {
  // 神策项目 ID (必填)
  projectId: 'YOUR_PROJECT_ID',
  
  // 神策数据接收地址 (必填)
  // 示例：'https://sandbox-web-sa.sensorsdata.cn/sa?project=YOUR_PROJECT_ID'
  serverUrl: 'YOUR_SERVER_URL',
  
  // 是否开启调试模式
  showLog: true,
  
  // 是否自动采集全埋点
  autoTrack: true,
  
  // 是否采集页面浏览事件
  pageView: true,
  
  // 是否采集点击事件
  heatMap: true,
  
  // 用户唯一标识
  distinctId: '',
  
  // 是否启用 AB 测试
  useABTest: false,
}

/**
 * 初始化神策 SDK
 * @returns {Promise<void>}
 */
export function initSensorsAnalytics() {
  return new Promise((resolve, reject) => {
    // 检查是否已加载神策
    if (window.sensors) {
      console.warn('神策 SDK 已经加载')
      resolve()
      return
    }

    // 创建全局 sensors_data_init 回调函数
    window.sensors_data_init = () => {
      try {
        // 初始化神策
        window.sensors.init({
          projectId: SA_CONFIG.projectId,
          serverUrl: SA_CONFIG.serverUrl,
          showLog: SA_CONFIG.showLog,
          useClientTime: true, // 使用客户端时间
          send_type: 'beacon', // 使用 beacon 发送数据，兼容性更好
          
          // 自动采集配置
          heatmap: {
            clickmap: SA_CONFIG.autoTrack,
            scrollNoticeMap: false,
            scrollEvent: false,
          },
          
          // 页面浏览事件
          pageView: SA_CONFIG.pageView,
          
          // 自定义用户标识
          distinct_id: SA_CONFIG.distinctId,
        })
        
        console.log('神策 SDK 初始化成功')
        resolve()
      } catch (error) {
        console.error('神策 SDK 初始化失败:', error)
        reject(error)
      }
    }

    // 动态加载神策 SDK 脚本
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.async = true
    
    // 使用神策官方 CDN 地址
    script.src = 'https://cdn.jsdelivr.net/npm/sa-sdk-javascript@latest/dist/sa.min.js'
    
    // 脚本加载错误处理
    script.onerror = () => {
      console.error('神策 SDK 脚本加载失败')
      reject(new Error('Failed to load Sensors Analytics SDK'))
    }
    
    // 脚本加载成功处理
    script.onload = () => {
      console.log('神策 SDK 脚本加载完成')
    }
    
    // 将脚本添加到页面
    document.head.appendChild(script)
  })
}

/**
 * 设置登录用户信息
 * @param {string} userId - 用户 ID
 * @param {Object} userProfile - 用户画像信息
 */
export function setLoginUser(userId, userProfile = {}) {
  if (!window.sensors) {
    console.warn('神策 SDK 未初始化')
    return
  }
  
  try {
    // 设置登录用户 ID
    window.sensors.login(userId)
    
    // 设置用户画像
    if (Object.keys(userProfile).length > 0) {
      window.sensors.setProfile(userProfile)
    }
    
    console.log(`用户 ${userId} 登录信息已设置`)
  } catch (error) {
    console.error('设置登录用户信息失败:', error)
  }
}

/**
 * 退出登录
 */
export function logout() {
  if (!window.sensors) {
    console.warn('神策 SDK 未初始化')
    return
  }
  
  try {
    window.sensors.logout()
    console.log('用户已退出登录')
  } catch (error) {
    console.error('退出登录失败:', error)
  }
}

/**
 * 追踪自定义事件
 * @param {string} eventName - 事件名称
 * @param {Object} properties - 事件属性
 */
export function trackEvent(eventName, properties = {}) {
  if (!window.sensors) {
    console.warn('神策 SDK 未初始化，无法追踪事件:', eventName)
    return
  }
  
  try {
    // 添加公共属性
    const eventProperties = {
      ...properties,
      $current_url: window.location.href,
      $page_title: document.title,
      timestamp: Date.now(),
    }
    
    window.sensors.track(eventName, eventProperties)
    console.log(`事件追踪: ${eventName}`, eventProperties)
  } catch (error) {
    console.error(`事件追踪失败 [${eventName}]:`, error)
  }
}

/**
 * 注册页面浏览事件
 * @param {string} pageName - 页面名称
 */
export function trackPageView(pageName) {
  if (!window.sensors) {
    console.warn('神策 SDK 未初始化')
    return
  }
  
  try {
    window.sensors.track('$pageview', {
      url: window.location.href,
      title: pageName || document.title,
    })
    console.log(`页面浏览: ${pageName}`)
  } catch (error) {
    console.error('页面浏览事件追踪失败:', error)
  }
}

export default {
  initSensorsAnalytics,
  setLoginUser,
  logout,
  trackEvent,
  trackPageView,
  SA_CONFIG,
}
