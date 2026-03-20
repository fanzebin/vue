# Vue 注册页面 + 神策埋点项目

这是一个基于 Vue 3 + Vite 构建的用户注册页面项目，已集成神策数据分析 SDK。

## 项目结构

```
vue-register-demo/
├── src/
│   ├── components/
│   │   └── RegisterPage.vue    # 用户注册页面组件（包含完整的埋点逻辑）
│   ├── utils/
│   │   └── sensorsAnalytics.js # 神策 SDK 封装工具
│   ├── App.vue                 # 应用根组件
│   └── main.js                 # 应用入口（初始化神策 SDK）
├── index.html                  # HTML 模板
├── package.json                # 项目配置
└── vite.config.js              # Vite 配置
```

## 快速开始

### 1. 安装依赖

```bash
cd vue-register-demo
npm install
```

### 2. 配置神策信息

编辑 `src/utils/sensorsAnalytics.js` 文件，修改以下配置：

```javascript
const SA_CONFIG = {
  projectId: 'YOUR_PROJECT_ID',      // 替换为你的神策项目 ID
  serverUrl: 'YOUR_SERVER_URL',      // 替换为你的神策数据接收地址
  showLog: true,                     // 生产环境建议设为 false
}
```

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 构建生产版本

```bash
npm run build
```

## 埋点说明

### 自动采集的埋点事件

1. **页面浏览事件** (`$pageview`)
   - 页面加载时自动触发
   - 包含页面名称、页面类型等属性

2. **表单字段交互** (`form_field_blur`)
   - 用户在输入框失焦时触发
   - 记录字段名称、是否填写、内容长度

3. **协议勾选** (`agree_terms_checkbox`)
   - 用户勾选/取消勾选协议时触发
   - 记录是否同意状态

4. **查看协议链接** (`view_terms_link_click`)
   - 用户点击查看协议时触发

5. **提交按钮点击** (`register_submit_button_click`)
   - 用户点击提交按钮时触发
   - 记录各字段的填写状态

6. **表单提交尝试** (`register_form_submit_attempt`)
   - 用户尝试提交表单时触发

7. **表单验证失败** (`register_form_validation_failed`)
   - 表单验证未通过时触发
   - 记录错误字段列表

8. **注册成功** (`register_success`)
   - 注册成功后触发
   - 同时调用 `sensors.login()` 设置登录用户

9. **注册失败** (`register_failed`)
   - 注册失败时触发
   - 记录错误信息

10. **跳转登录** (`go_to_login_link_click`)
    - 用户点击"立即登录"链接时触发

### 手动添加埋点

在组件中导入并使用 `trackEvent` 函数：

```javascript
import { trackEvent } from '../utils/sensorsAnalytics'

// 追踪自定义事件
trackEvent('custom_event_name', {
  property1: 'value1',
  property2: 'value2',
})
```

### 设置用户信息

```javascript
import { setLoginUser } from '../utils/sensorsAnalytics'

// 用户登录成功后
setLoginUser(userId, {
  username: '用户名',
  email: '邮箱',
  phone: '手机号',
  // 其他用户画像属性
})
```

## 注意事项

1. **神策配置**: 务必将 `projectId` 和 `serverUrl` 替换为你自己的神策项目配置
2. **调试模式**: 生产环境请将 `showLog` 设置为 `false`
3. **隐私合规**: 确保你的埋点方案符合相关隐私法规要求
4. **错误处理**: 神策 SDK 加载失败不会影响应用正常运行

## 技术栈

- Vue 3 (Composition API)
- Vite 5
- 神策数据分析 JavaScript SDK

## 许可证

MIT
