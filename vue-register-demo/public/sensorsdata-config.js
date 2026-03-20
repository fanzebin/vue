// 神策数据分析 SDK 加载器
// 动态加载 sensorsdata.js 并初始化

(function() {
  // 创建 script 标签加载 SDK
  var sdkScript = document.createElement('script');
  sdkScript.charset = 'UTF-8';
  sdkScript.src = '/sensorsdata.js';
  sdkScript.onload = function() {
    // SDK 加载完成后初始化
    var sensors = window['sensorsDataAnalytic201505'];
    
    if (sensors) {
      sensors.init({
        server_url: 'http://test-syg.datasink.sensorsdata.cn/sa?token=xxxxx&project=xxxxxx',
        is_track_single_page: true, // 单页面配置，开启后自动监听 URL 变化触发 $pageview 事件
        use_client_time: true, 
        send_type: 'beacon',
        heatmap: {
          // 是否开启点击图，default 表示开启，自动采集 $WebClick 事件
          clickmap: 'default',
          // 是否开启触达图，not_collect 表示关闭
          scroll_notice_map: 'not_collect'
        }   
      });
      sensors.quick('autoTrack');
      console.log('[Sensors] 神策 SDK 初始化成功');
    } else {
      console.error('[Sensors] 神策 SDK 加载失败，window.sensorsDataAnalytic201505 未定义');
    }
  };
  
  sdkScript.onerror = function() {
    console.error('[Sensors] 神策 SDK 文件加载失败');
  };
  
  document.head.appendChild(sdkScript);
})();
