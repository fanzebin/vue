<template>
  <div class="dashboard">
    <!-- 标题 -->
    <div class="header">
      <h1 class="title">OceanBase 三地延时监控大屏</h1>
      <div class="time">{{ currentTime }}</div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧：地图可视化 -->
      <div class="left-panel">
        <div class="panel-title">三地集群分布与延时拓扑</div>
        <div ref="mapChartRef" class="chart-container"></div>
      </div>

      <!-- 中间：关键指标 -->
      <div class="center-panel">
        <div class="metrics-container">
          <div class="metric-card" v-for="(metric, index) in metrics" :key="index">
            <div class="metric-label">{{ metric.label }}</div>
            <div class="metric-value">{{ metric.value }}</div>
            <div class="metric-unit">{{ metric.unit }}</div>
          </div>
        </div>

        <!-- 延时趋势图 -->
        <div class="trend-chart">
          <div class="panel-title">整体延时趋势</div>
          <div ref="trendChartRef" class="trend-container"></div>
        </div>

        <!-- DataV 装饰组件 -->
        <div class="datav-decoration">
          <dv-border-box-13 title="实时监控区域">
            <div class="decoration-content">
              <div class="location-info">
                <div class="location-item" v-for="loc in locations" :key="loc.name">
                  <span class="location-name">{{ loc.name }}</span>
                  <span class="location-status" :class="loc.status">{{ loc.statusText }}</span>
                </div>
              </div>
            </div>
          </dv-border-box-13>
        </div>
      </div>

      <!-- 右侧：租户延时详情 -->
      <div class="right-panel">
        <div class="panel-title">各租户延时详情</div>
        <div class="tenant-list">
          <div class="tenant-item" v-for="tenant in tenantData" :key="tenant.name">
            <div class="tenant-header">
              <span class="tenant-name">{{ tenant.appName }}</span>
              <span class="tenant-id">{{ tenant.name }}</span>
            </div>
            <div class="delay-paths">
              <div class="delay-path" v-for="(path, pIndex) in tenant.paths" :key="pIndex">
                <div class="path-nodes">
                  <span class="node from">{{ path.from.local }} ({{ path.from.role || 'UNKNOWN' }})</span>
                  <span class="arrow">→</span>
                  <span class="node to">{{ path.to.local }} ({{ path.to.role || 'UNKNOWN' }})</span>
                </div>
                <div class="delay-bar-container">
                  <div class="delay-bar" :style="{ width: getDelayWidth(path.property) }"></div>
                  <span class="delay-value">{{ (path.property * 100).toFixed(2) }}ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部统计 -->
    <div class="footer">
      <dv-digital-flop :config="digitalFlopConfig" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { Chart } from '@antv/g2'
import * as datavVue3 from 'datav-vue3'
import { Graph } from '@antv/g6'

// 原始数据
const rawData = {
  "topic": "TENANTS_DELAY",
  "time": "17:20:55",
  "data": [
    {
      "name": "ets_t01",
      "appName": "电子客票",
      "tenantDelayList": [
        [
          {
            "from": {
              "name": "ets_t01",
              "id": "1000006",
              "clusterName": "xxdl_main_clu01",
              "clusterId": "1000002",
              "local": "信息大楼",
              "role": "PRIMARY",
              "ocpGroupId": "36FEA2E78FC1450AAA30AE25D52CA2F1"
            },
            "to": {
              "name": "ets_t01",
              "id": "9",
              "clusterName": "nhds_standby_clu01",
              "clusterId": "5",
              "local": "南航大厦",
              "role": "STANDBY",
              "ocpGroupId": "36FEA2E78FC1450AAA30AE25D52CA2F1"
            },
            "property": 0.34
          }
        ],
        [
          {
            "from": {
              "name": "ets_t01",
              "id": "1000006",
              "clusterName": "xxdl_main_clu01",
              "clusterId": "1000002",
              "local": "信息大楼",
              "role": "PRIMARY",
              "ocpGroupId": "36FEA2E78FC1450AAA30AE25D52CA2F1"
            },
            "to": {
              "name": "ets_t01",
              "id": "8",
              "clusterName": "bjdx_zb_clu01",
              "clusterId": "2",
              "local": "北京大兴",
              "role": "STANDBY",
              "ocpGroupId": "36FEA2E78FC1450AAA30AE25D52CA2F1"
            },
            "property": 0.74
          }
        ]
      ]
    },
    {
      "name": "flightplan_t01",
      "appName": "飞行计划",
      "tenantDelayList": [
        [
          {
            "from": {
              "name": "flightplan_t01",
              "id": "1000007",
              "clusterName": "xxdl_main_clu01",
              "clusterId": "1000002",
              "local": "信息大楼",
              "role": "PRIMARY",
              "ocpGroupId": "36FEA2E78FC1450AAA30AE25D52CA2F1"
            },
            "to": {
              "name": "flightplan_t01",
              "id": "10",
              "clusterName": "nhds_standby_clu01",
              "clusterId": "5",
              "local": "南航大厦",
              "role": null,
              "ocpGroupId": "36FEA2E78FC1450AAA30AE25D52CA2F1"
            },
            "property": 0.38
          },
          {
            "from": {
              "name": "flightplan_t01",
              "id": "10",
              "clusterName": "nhds_standby_clu01",
              "clusterId": "5",
              "local": "南航大厦",
              "role": null,
              "ocpGroupId": "36FEA2E78FC1450AAA30AE25D52CA2F1"
            },
            "to": {
              "name": "flightplan_t01",
              "id": "6",
              "clusterName": "bjdx_zb_clu01",
              "clusterId": "2",
              "local": "北京大兴",
              "role": "STANDBY",
              "ocpGroupId": "36FEA2E78FC1450AAA30AE25D52CA2F1"
            },
            "property": 0.38
          }
        ]
      ]
    },
    {
      "name": "ecs_t01",
      "appName": "电子商务",
      "tenantDelayList": [
        [
          {
            "from": {
              "name": "ecs_t01",
              "id": "1000003",
              "clusterName": "xxdl_main_clu01",
              "clusterId": "1000002",
              "local": "信息大楼",
              "role": "PRIMARY",
              "ocpGroupId": "36FEA2E78FC1450AAA30AE25D52CA2F1"
            },
            "to": {
              "name": "ecs_t01",
              "id": "8",
              "clusterName": "nhds_standby_clu01",
              "clusterId": "5",
              "local": "南航大厦",
              "role": null,
              "ocpGroupId": "36FEA2E78FC1450AAA30AE25D52CA2F1"
            },
            "property": 0.52
          },
          {
            "from": {
              "name": "ecs_t01",
              "id": "8",
              "clusterName": "nhds_standby_clu01",
              "clusterId": "5",
              "local": "南航大厦",
              "role": null,
              "ocpGroupId": "36FEA2E78FC1450AAA30AE25D52CA2F1"
            },
            "to": {
              "name": "ecs_t01",
              "id": "5",
              "clusterName": "bjdx_zb_clu01",
              "clusterId": "2",
              "local": "北京大兴",
              "role": "STANDBY",
              "ocpGroupId": "36FEA2E78FC1450AAA30AE25D52CA2F1"
            },
            "property": 0.84
          }
        ]
      ]
    },
    {
      "name": "fic_t01",
      "appName": "航班中心",
      "tenantDelayList": [
        [
          {
            "from": {
              "name": "fic_t01",
              "id": "1000008",
              "clusterName": "xxdl_main_clu01",
              "clusterId": "1000002",
              "local": "信息大楼",
              "role": "PRIMARY",
              "ocpGroupId": "36FEA2E78FC1450AAA30AE25D52CA2F1"
            },
            "to": {
              "name": "fic_t01",
              "id": "11",
              "clusterName": "nhds_standby_clu01",
              "clusterId": "5",
              "local": "南航大厦",
              "role": "STANDBY",
              "ocpGroupId": "36FEA2E78FC1450AAA30AE25D52CA2F1"
            },
            "property": 0.29
          }
        ]
      ]
    }
  ]
}

// 注册 DataV 组件
const { DvBorderBox13, DvDigitalFlop } = datavVue3

// 当前时间
const currentTime = ref(rawData.time)

// 图表引用
const mapChartRef = ref(null)
const trendChartRef = ref(null)

// 提取位置信息
const locations = computed(() => {
  const locationSet = new Set()
  rawData.data.forEach(tenant => {
    tenant.tenantDelayList.forEach(paths => {
      paths.forEach(path => {
        locationSet.add(path.from.local)
        locationSet.add(path.to.local)
      })
    })
  })
  
  return Array.from(locationSet).map(loc => ({
    name: loc,
    status: 'normal',
    statusText: '正常'
  }))
})

// 计算指标
const metrics = computed(() => {
  let totalDelay = 0
  let delayCount = 0
  let maxDelay = 0
  
  rawData.data.forEach(tenant => {
    tenant.tenantDelayList.forEach(paths => {
      paths.forEach(path => {
        totalDelay += path.property
        delayCount++
        if (path.property > maxDelay) {
          maxDelay = path.property
        }
      })
    })
  })
  
  const avgDelay = delayCount > 0 ? (totalDelay / delayCount) : 0
  
  return [
    { label: '平均延时', value: (avgDelay * 100).toFixed(2), unit: 'ms' },
    { label: '最大延时', value: (maxDelay * 100).toFixed(2), unit: 'ms' },
    { label: '租户数量', value: rawData.data.length, unit: '个' },
    { label: '复制链路', value: delayCount, unit: '条' }
  ]
})

// 处理租户数据
const tenantData = computed(() => {
  return rawData.data.map(tenant => {
    const paths = []
    tenant.tenantDelayList.forEach(pathGroup => {
      pathGroup.forEach(path => {
        paths.push(path)
      })
    })
    
    return {
      name: tenant.name,
      appName: tenant.appName,
      paths: paths
    }
  })
})

// 数字翻牌器配置
const digitalFlopConfig = {
  number: [rawData.data.length],
  content: '租户总数：{nt}',
  style: {
    fontSize: 40,
    fill: '#37cfe8',
    fontWeight: 'bold'
  }
}

// 获取延时条宽度
const getDelayWidth = (property) => {
  const percentage = Math.min(property * 100, 100)
  return `${percentage}%`
}

// 初始化地图拓扑图
let mapGraph = null
const initMapChart = () => {
  if (!mapChartRef.value) return
  
  // 提取所有节点和边
  const nodes = []
  const edges = []
  const nodeSet = new Set()
  
  rawData.data.forEach(tenant => {
    tenant.tenantDelayList.forEach(paths => {
      paths.forEach(path => {
        const fromKey = `${path.from.local}-${path.from.clusterName}`
        const toKey = `${path.to.local}-${path.to.clusterName}`
        
        if (!nodeSet.has(fromKey)) {
          nodes.push({
            id: path.from.local,
            name: path.from.local,
            cluster: path.from.clusterName,
            role: path.from.role || 'UNKNOWN',
            value: 1
          })
          nodeSet.add(fromKey)
        }
        
        if (!nodeSet.has(toKey)) {
          nodes.push({
            id: path.to.local,
            name: path.to.local,
            cluster: path.to.clusterName,
            role: path.to.role || 'UNKNOWN',
            value: 1
          })
          nodeSet.add(toKey)
        }
        
        edges.push({
          source: path.from.local,
          target: path.to.local,
          value: path.property,
          tenant: tenant.appName
        })
      })
    })
  })
  
  // 使用 G6 创建拓扑图
  mapGraph = new Graph({
    container: mapChartRef.value,
    width: mapChartRef.value.offsetWidth,
    height: 400,
    data: {
      nodes,
      edges
    },
    layout: {
      type: 'force',
      preventOverlap: true,
      linkDistance: 150,
      nodeStrength: -500,
      edgeStrength: 0.1
    },
    node: {
      style: {
        fill: '#37cfe8',
        stroke: '#ffd700',
        lineWidth: 2,
        size: 50,
        labelText: d => d.name,
        labelFill: '#fff',
        labelFontSize: 12
      }
    },
    edge: {
      style: {
        stroke: d => {
          const val = d.value || 0
          if (val < 0.3) return '#67e68b'
          if (val < 0.6) return '#facc14'
          return '#f87171'
        },
        lineWidth: 2,
        endArrow: true
      }
    }
  })
  
  mapGraph.render()
}

// 初始化趋势图
let trendChart = null
const initTrendChart = () => {
  if (!trendChartRef.value) return
  
  // 模拟历史数据
  const historyData = []
  for (let i = 0; i < 24; i++) {
    historyData.push({
      time: `${i.toString().padStart(2, '0')}:00`,
      delay: Math.random() * 0.8 + 0.2
    })
  }
  
  trendChart = new Chart({
    container: trendChartRef.value,
    autoFit: true,
    height: 200
  })
  
  trendChart.data(historyData)
  
  trendChart
    .line()
    .encode('x', 'time')
    .encode('y', 'delay')
    .encode('color', () => '#37cfe8')
    .style('lineWidth', 2)
  
  trendChart
    .point()
    .encode('x', 'time')
    .encode('y', 'delay')
    .encode('shape', 'circle')
    .encode('color', () => '#37cfe8')
  
  trendChart.render()
}

// 更新时间
let timeInterval = null
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { hour12: false })
}

onMounted(() => {
  setTimeout(() => {
    initMapChart()
    initTrendChart()
  }, 100)
  
  timeInterval = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (mapGraph) {
    mapGraph.destroy()
  }
  if (trendChart) {
    trendChart.destroy()
  }
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
.dashboard {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #0c1a3a 0%, #1a2a5a 50%, #0c1a3a 100%);
  color: #fff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 20px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 2px solid #37cfe8;
}

.title {
  font-size: 32px;
  font-weight: bold;
  color: #37cfe8;
  text-shadow: 0 0 10px rgba(55, 207, 232, 0.5);
  margin: 0;
}

.time {
  font-size: 24px;
  color: #ffd700;
  font-family: 'Courier New', monospace;
}

.main-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
  padding: 20px;
  overflow: hidden;
}

.left-panel,
.center-panel,
.right-panel {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 15px;
  border: 1px solid rgba(55, 207, 232, 0.3);
  display: flex;
  flex-direction: column;
}

.panel-title {
  font-size: 18px;
  font-weight: bold;
  color: #37cfe8;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(55, 207, 232, 0.3);
}

.chart-container {
  flex: 1;
  min-height: 300px;
}

.metrics-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
}

.metric-card {
  background: linear-gradient(135deg, rgba(55, 207, 232, 0.2) 0%, rgba(55, 207, 232, 0.05) 100%);
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  border: 1px solid rgba(55, 207, 232, 0.3);
}

.metric-label {
  font-size: 14px;
  color: #aaa;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 28px;
  font-weight: bold;
  color: #ffd700;
}

.metric-unit {
  font-size: 12px;
  color: #888;
  margin-top: 5px;
}

.trend-chart {
  flex: 1;
  margin-bottom: 20px;
}

.trend-container {
  height: 180px;
}

.datav-decoration {
  flex: 1;
}

.decoration-content {
  padding: 20px;
}

.location-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.location-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 5px;
}

.location-name {
  color: #37cfe8;
  font-weight: bold;
}

.location-status {
  padding: 3px 10px;
  border-radius: 3px;
  font-size: 12px;
}

.location-status.normal {
  background: rgba(103, 230, 139, 0.3);
  color: #67e68b;
}

.tenant-list {
  flex: 1;
  overflow-y: auto;
}

.tenant-item {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  border: 1px solid rgba(55, 207, 232, 0.2);
}

.tenant-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.tenant-name {
  font-size: 16px;
  font-weight: bold;
  color: #ffd700;
}

.tenant-id {
  font-size: 12px;
  color: #888;
}

.delay-paths {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.delay-path {
  background: rgba(255, 255, 255, 0.05);
  padding: 8px;
  border-radius: 5px;
}

.path-nodes {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
  font-size: 12px;
}

.node {
  padding: 2px 6px;
  border-radius: 3px;
  background: rgba(55, 207, 232, 0.2);
}

.node.from {
  border-left: 3px solid #67e68b;
}

.node.to {
  border-right: 3px solid #f87171;
}

.arrow {
  color: #37cfe8;
  font-weight: bold;
}

.delay-bar-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.delay-bar {
  height: 8px;
  background: linear-gradient(90deg, #67e68b 0%, #facc14 50%, #f87171 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.delay-value {
  font-size: 12px;
  color: #ffd700;
  min-width: 60px;
}

.footer {
  padding: 15px 40px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 2px solid #37cfe8;
  display: flex;
  justify-content: center;
}

/* 滚动条样式 */
.tenant-list::-webkit-scrollbar {
  width: 6px;
}

.tenant-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
}

.tenant-list::-webkit-scrollbar-thumb {
  background: rgba(55, 207, 232, 0.5);
  border-radius: 3px;
}

.tenant-list::-webkit-scrollbar-thumb:hover {
  background: rgba(55, 207, 232, 0.8);
}
</style>
