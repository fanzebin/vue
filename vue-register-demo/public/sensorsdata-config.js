<script charset='UTF-8' src="/sensorsdata.js"></script>
<script>
	var sensors = window['sensorsDataAnalytic201505'];
	sensors.init({
  		server_url: 'http://test-syg.datasink.sensorsdata.cn/sa?token=xxxxx&project=xxxxxx',
		is_track_single_page:true, // 单页面配置，默认关闭。开启后自动监听 URL 有变化就会触发 $pageview 事件
		use_client_time:true, 
  		send_type:'beacon',
		heatmap: {
			//是否开启点击图，default 表示开启，自动采集 $WebClick 事件，可以设置 'not_collect' 表示关闭。
			clickmap:'default',
			//是否开启触达图，not_collect 表示关闭，不会自动采集 $WebStay 事件，可以设置 'default' 表示开启。
			scroll_notice_map:'not_collect'
		}   
	});
	sensors.quick('autoTrack');
</script>
