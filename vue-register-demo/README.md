# Vue 注册页面 + 神策埋点项目

这是一个基于 Vue 3 + Vite 构建的用户注册页面项目，已集成神策数据分析 SDK。

## 项目结构

```
vue-register-demo/
├── public/
│   ├── sensorsdata.js            # 神策 SDK 文件（从官方下载）
│   └── sensorsdata-config.js     # 神策 SDK 初始化配置
├── src/
│   ├── components/
│   │   └── RegisterPage.vue      # 用户注册页面组件（包含完整的埋点逻辑）
│   ├── App.vue                   # 应用根组件
│   └── main.js                   # 应用入口
├── index.html                    # HTML 模板（引入神策 SDK）
├── package.json                  # 项目配置
└── vite.config.js                # Vite 配置
```

## 快速开始

### 1. 安装依赖

```bash
cd vue-register-demo
npm install
```

### 2. 配置神策信息

编辑 `public/sensorsdata-config.js` 文件，修改以下配置：

```javascript
sensors.init({
  server_url: 'http://your-server-url/sa?token=xxxxx&project=xxxxxx',
  // 其他配置...
})
```

**重要**: 将 `server_url` 替换为你的神策数据接收地址。

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
   - 页面加载时自动触发（通过 `sensors.quick('autoTrack')`）
   - 单页面应用会自动追踪 URL 变化

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
   - 同时调用 `sensors.login()` 设置登录用户 ID

9. **注册失败** (`register_failed`)
   - 注册失败时触发
   - 记录错误信息

10. **跳转登录** (`go_to_login_link_click`)
    - 用户点击"立即登录"链接时触发

### 神策 SDK 配置说明

在 `public/sensorsdata-config.js` 中，可以配置以下选项：

- `server_url`: 神策数据接收地址（必填）
- `is_track_single_page`: 是否开启单页面追踪（默认 true）
- `use_client_time`: 是否使用客户端时间（默认 true）
- `send_type`: 数据发送方式（'beacon' | 'ajax' | 'image'）
- `heatmap.clickmap`: 是否开启点击图（'default' | 'not_collect'）
- `heatmap.scroll_notice_map`: 是否开启触达图（'default' | 'not_collect'）

### 手动添加埋点

在组件中使用全局的 `sensors` 对象：

```javascript
// 在 Vue 组件中
const sensors = window.sensorsDataAnalytic201505

// 追踪自定义事件
sensors.track('custom_event_name', {
  property1: 'value1',
  property2: 'value2',
})

// 设置用户 ID（登录后）
sensors.login('user_id')

// 设置用户属性
sensors.register({
  username: '用户名',
  email: '邮箱',
  phone: '手机号',
})
```

## 注意事项

1. **神策配置**: 务必将 `server_url` 替换为你自己的神策数据接收地址
2. **调试模式**: 生产环境请根据需要调整日志输出
3. **隐私合规**: 确保你的埋点方案符合相关隐私法规要求（如 GDPR、个人信息保护法等）
4. **SDK 加载**: 神策 SDK 通过 `<script>` 标签在页面头部加载，确保在网络正常环境下使用
5. **用户信息采集**: 避免在埋点中直接传输敏感信息（如密码、完整手机号等）

## 技术栈

- Vue 3 (Composition API)
- Vite 5
- 神策数据分析 JavaScript SDK (sa-sdk-javascript)

## 许可证

MIT
