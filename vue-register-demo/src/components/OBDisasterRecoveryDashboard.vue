<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <h1>OB 容灾监控大屏</h1>
      <div class="tenant-selector">
        <label for="tenant-select">选择租户：</label>
        <select id="tenant-select" v-model="selectedTenant" @change="loadTenantData">
          <option v-for="tenant in tenants" :key="tenant.id" :value="tenant.id">
            {{ tenant.name }}
          </option>
        </select>
      </div>
    </header>

    <main class="dashboard-main">
      <!-- 灾备复制状态区域 -->
      <section class="disaster-recovery-section">
        <h2>灾备复制状态 (1 主 2 备)</h2>
        <div class="cluster-grid">
          <div 
            v-for="(cluster, index) in clusterStatus" 
            :key="cluster.id"
            class="cluster-card"
            :class="['role-' + cluster.role, 'status-' + cluster.status]"
          >
            <div class="cluster-header">
              <span class="cluster-role-badge" :class="'role-' + cluster.role">
                {{ getRoleLabel(cluster.role) }}
              </span>
              <span class="cluster-status-dot" :class="'status-' + cluster.status"></span>
              <span class="cluster-status-text">{{ getStatusText(cluster.status) }}</span>
            </div>
            
            <div class="cluster-info">
              <div class="info-row">
                <span class="label">集群名称：</span>
                <span class="value">{{ cluster.name }}</span>
              </div>
              <div class="info-row">
                <span class="label">集群 ID：</span>
                <span class="value">{{ cluster.id }}</span>
              </div>
              <div class="info-row">
                <span class="label">Region：</span>
                <span class="value">{{ cluster.region }}</span>
              </div>
              <div class="info-row delay-row" v-if="cluster.role !== 'primary'">
                <span class="label">同步延迟：</span>
                <span class="value delay-value" :class="getDelayClass(cluster.delay)">
                  {{ formatDelay(cluster.delay) }}
                </span>
              </div>
            </div>

            <div class="replication-indicator" v-if="index > 0">
              <div class="arrow">⬇</div>
              <div class="delay-info">
                <span>延迟：{{ formatDelay(cluster.delay) }}</span>
                <span class="delay-status" :class="getDelayClass(cluster.delay)">
                  {{ getDelayStatusText(cluster.delay) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 资源监控区域 -->
      <section class="resources-section">
        <h2>集群资源监控</h2>
        <div class="resources-grid">
          <div v-for="cluster in clusterStatus" :key="cluster.id" class="resource-card">
            <h3 class="resource-title">{{ cluster.name }} ({{ getRoleLabel(cluster.role) }})</h3>
            
            <div class="resource-charts">
              <!-- CPU 资源 -->
              <div class="resource-item">
                <div class="resource-header">
                  <span>CPU</span>
                  <span class="resource-values">
                    {{ cluster.resources.cpu.allocated }} / {{ cluster.resources.cpu.total }} 核
                    <span class="remaining">剩余：{{ cluster.resources.cpu.remaining }} 核</span>
                  </span>
                </div>
                <div class="progress-bar-container">
                  <div 
                    class="progress-bar cpu-bar" 
                    :style="{ width: getPercentage(cluster.resources.cpu.allocated, cluster.resources.cpu.total) + '%' }"
                  ></div>
                </div>
                <div class="resource-chart" :ref="el => setChartRef(el, cluster.id, 'cpu')"></div>
              </div>

              <!-- 内存资源 -->
              <div class="resource-item">
                <div class="resource-header">
                  <span>内存</span>
                  <span class="resource-values">
                    {{ formatSize(cluster.resources.memory.allocated) }} / {{ formatSize(cluster.resources.memory.total) }}
                    <span class="remaining">剩余：{{ formatSize(cluster.resources.memory.remaining) }}</span>
                  </span>
                </div>
                <div class="progress-bar-container">
                  <div 
                    class="progress-bar memory-bar" 
                    :style="{ width: getPercentage(cluster.resources.memory.allocated, cluster.resources.memory.total) + '%' }"
                  ></div>
                </div>
                <div class="resource-chart" :ref="el => setChartRef(el, cluster.id, 'memory')"></div>
              </div>

              <!-- 磁盘资源 -->
              <div class="resource-item">
                <div class="resource-header">
                  <span>磁盘</span>
                  <span class="resource-values">
                    {{ formatSize(cluster.resources.disk.allocated) }} / {{ formatSize(cluster.resources.disk.total) }}
                    <span class="remaining">剩余：{{ formatSize(cluster.resources.disk.remaining) }}</span>
                  </span>
                </div>
                <div class="progress-bar-container">
                  <div 
                    class="progress-bar disk-bar" 
                    :style="{ width: getPercentage(cluster.resources.disk.allocated, cluster.resources.disk.total) + '%' }"
                  ></div>
                </div>
                <div class="resource-chart" :ref="el => setChartRef(el, cluster.id, 'disk')"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="dashboard-footer">
      <span>最后更新：{{ lastUpdateTime }}</span>
      <button @click="refreshData" class="refresh-btn">刷新数据</button>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'

// 租户列表
const tenants = ref([
  { id: 'tenant_001', name: '生产租户 A' },
  { id: 'tenant_002', name: '生产租户 B' },
  { id: 'tenant_003', name: '测试租户 C' }
])

const selectedTenant = ref('tenant_001')
const lastUpdateTime = ref(new Date().toLocaleString())
const chartInstances = reactive({})
const chartRefs = reactive({})

// 集群状态数据
const clusterStatus = ref([])

// 获取角色标签
const getRoleLabel = (role) => {
  const roleMap = {
    primary: '主集群',
    standby1: '备集群 1',
    standby2: '备集群 2'
  }
  return roleMap[role] || role
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    normal: '正常',
    syncing: '同步中',
    delayed: '延迟',
    error: '异常',
    disconnected: '断开'
  }
  return statusMap[status] || status
}

// 格式化延迟时间
const formatDelay = (delayMs) => {
  if (delayMs === undefined || delayMs === null) return '--'
  if (delayMs < 1000) return `${delayMs}ms`
  const seconds = Math.floor(delayMs / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m${remainingSeconds}s`
}

// 获取延迟样式类
const getDelayClass = (delayMs) => {
  if (delayMs === undefined || delayMs === null) return ''
  if (delayMs < 1000) return 'delay-good'
  if (delayMs < 5000) return 'delay-warning'
  return 'delay-danger'
}

// 获取延迟状态文本
const getDelayStatusText = (delayMs) => {
  if (delayMs === undefined || delayMs === null) return '--'
  if (delayMs < 1000) return '优秀'
  if (delayMs < 5000) return '正常'
  return '偏高'
}

// 计算百分比
const getPercentage = (allocated, total) => {
  if (!total || total === 0) return 0
  return Math.min((allocated / total) * 100, 100)
}

// 格式化大小
const formatSize = (sizeInGB) => {
  if (sizeInGB >= 1024) {
    return `${(sizeInGB / 1024).toFixed(2)} TB`
  }
  return `${sizeInGB.toFixed(2)} GB`
}

// 设置图表引用
const setChartRef = (el, clusterId, resourceType) => {
  if (el) {
    const key = `${clusterId}-${resourceType}`
    chartRefs[key] = el
    nextTick(() => {
      initChart(clusterId, resourceType)
    })
  }
}

// 初始化图表
const initChart = (clusterId, resourceType) => {
  const key = `${clusterId}-${resourceType}`
  const el = chartRefs[key]
  if (!el) return

  // 销毁旧实例
  if (chartInstances[key]) {
    chartInstances[key].dispose()
  }

  const cluster = clusterStatus.value.find(c => c.id === clusterId)
  if (!cluster) return

  const resources = cluster.resources[resourceType]
  
  const chart = echarts.init(el)
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    series: [
      {
        name: resourceType.toUpperCase(),
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 5,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'center',
          formatter: () => {
            const percentage = getPercentage(resources.allocated, resources.total).toFixed(1)
            return `{value|${percentage}%}\n{label|已分配}`
          },
          rich: {
            value: {
              fontSize: 18,
              fontWeight: 'bold',
              color: '#333'
            },
            label: {
              fontSize: 12,
              color: '#666'
            }
          }
        },
        emphasis: {
          label: {
            show: true
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { 
            value: resources.allocated, 
            name: '已分配',
            itemStyle: {
              color: getResourceColor(resourceType, 'allocated')
            }
          },
          { 
            value: resources.remaining, 
            name: '剩余',
            itemStyle: {
              color: getResourceColor(resourceType, 'remaining')
            }
          }
        ]
      }
    ]
  }

  chart.setOption(option)
  chartInstances[key] = chart
}

// 获取资源颜色
const getResourceColor = (resourceType, type) => {
  const colors = {
    cpu: {
      allocated: '#409EFF',
      remaining: '#E4E7ED'
    },
    memory: {
      allocated: '#67C23A',
      remaining: '#E8F5E9'
    },
    disk: {
      allocated: '#E6A23C',
      remaining: '#FFF8E1'
    }
  }
  return colors[resourceType]?.[type] || '#909399'
}

// 加载租户数据（模拟）
const loadTenantData = () => {
  // 模拟从后端获取数据
  generateMockData()
  lastUpdateTime.value = new Date().toLocaleString()
  
  nextTick(() => {
    // 重新初始化所有图表
    clusterStatus.value.forEach(cluster => {
      ['cpu', 'memory', 'disk'].forEach(resourceType => {
        initChart(cluster.id, resourceType)
      })
    })
  })
}

// 生成模拟数据
const generateMockData = () => {
  const mockClusters = [
    {
      id: 'cluster_primary_001',
      name: '上海主集群',
      role: 'primary',
      status: 'normal',
      region: '华东 - 上海',
      delay: 0,
      resources: {
        cpu: { total: 1000, allocated: 650, remaining: 350 },
        memory: { total: 2048, allocated: 1200, remaining: 848 },
        disk: { total: 10240, allocated: 5600, remaining: 4640 }
      }
    },
    {
      id: 'cluster_standby1_001',
      name: '北京备集群 1',
      role: 'standby1',
      status: 'syncing',
      region: '华北 - 北京',
      delay: Math.floor(Math.random() * 3000),
      resources: {
        cpu: { total: 800, allocated: 520, remaining: 280 },
        memory: { total: 1536, allocated: 900, remaining: 636 },
        disk: { total: 8192, allocated: 4200, remaining: 3992 }
      }
    },
    {
      id: 'cluster_standby2_001',
      name: '广州备集群 2',
      role: 'standby2',
      status: Math.random() > 0.8 ? 'delayed' : 'normal',
      region: '华南 - 广州',
      delay: Math.floor(Math.random() * 8000),
      resources: {
        cpu: { total: 800, allocated: 480, remaining: 320 },
        memory: { total: 1536, allocated: 850, remaining: 686 },
        disk: { total: 8192, allocated: 3800, remaining: 4392 }
      }
    }
  ]
  
  clusterStatus.value = mockClusters
}

// 刷新数据
const refreshData = () => {
  loadTenantData()
}

// 监听窗口大小变化，重绘图表
const handleResize = () => {
  Object.values(chartInstances).forEach(chart => {
    if (chart && typeof chart.resize === 'function') {
      chart.resize()
    }
  })
}

onMounted(() => {
  generateMockData()
  window.addEventListener('resize', handleResize)
  
  nextTick(() => {
    clusterStatus.value.forEach(cluster => {
      ['cpu', 'memory', 'disk'].forEach(resourceType => {
        initChart(cluster.id, resourceType)
      })
    })
  })
  
  // 定时刷新（可选）
  // setInterval(() => {
  //   generateMockData()
  //   nextTick(() => {
  //     clusterStatus.value.forEach(cluster => {
  //       ['cpu', 'memory', 'disk'].forEach(resourceType => {
  //         initChart(cluster.id, resourceType)
  //       })
  //     })
  //   })
  // }, 30000)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  Object.values(chartInstances).forEach(chart => {
    if (chart && typeof chart.dispose === 'function') {
      chart.dispose()
    }
  })
})
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: #fff;
  padding: 20px;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  backdrop-filter: blur(10px);
}

.dashboard-header h1 {
  margin: 0;
  font-size: 28px;
  background: linear-gradient(90deg, #00dbde, #fc00ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tenant-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tenant-selector label {
  font-size: 16px;
  color: #ccc;
}

.tenant-selector select {
  padding: 10px 20px;
  font-size: 16px;
  border: 2px solid #00dbde;
  border-radius: 5px;
  background: rgba(0, 219, 222, 0.1);
  color: #fff;
  cursor: pointer;
  outline: none;
}

.tenant-selector select option {
  background: #1a1a2e;
  color: #fff;
}

.dashboard-main {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.disaster-recovery-section,
.resources-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 25px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.disaster-recovery-section h2,
.resources-section h2 {
  margin: 0 0 20px 0;
  font-size: 22px;
  color: #00dbde;
  border-left: 4px solid #00dbde;
  padding-left: 15px;
}

.cluster-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
}

.cluster-card {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 20px;
  position: relative;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.cluster-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 219, 222, 0.3);
}

.cluster-card.role-primary {
  border-color: #409EFF;
  background: rgba(64, 158, 255, 0.1);
}

.cluster-card.role-standby1,
.cluster-card.role-standby2 {
  border-color: #67C23A;
  background: rgba(103, 194, 58, 0.1);
}

.cluster-card.status-normal {
  box-shadow: 0 0 20px rgba(103, 194, 58, 0.3);
}

.cluster-card.status-delayed {
  box-shadow: 0 0 20px rgba(230, 162, 60, 0.3);
}

.cluster-card.status-error,
.cluster-card.status-disconnected {
  box-shadow: 0 0 20px rgba(245, 108, 108, 0.3);
}

.cluster-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.cluster-role-badge {
  padding: 5px 15px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
}

.cluster-role-badge.role-primary {
  background: #409EFF;
  color: #fff;
}

.cluster-role-badge.role-standby1,
.cluster-role-badge.role-standby2 {
  background: #67C23A;
  color: #fff;
}

.cluster-status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.cluster-status-dot.status-normal {
  background: #67C23A;
}

.cluster-status-dot.status-syncing {
  background: #409EFF;
}

.cluster-status-dot.status-delayed {
  background: #E6A23C;
}

.cluster-status-dot.status-error,
.cluster-status-dot.status-disconnected {
  background: #F56C6C;
}

.cluster-status-text {
  font-size: 14px;
  color: #ccc;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.cluster-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-row .label {
  color: #aaa;
  font-size: 14px;
}

.info-row .value {
  color: #fff;
  font-size: 15px;
  font-weight: 500;
}

.delay-row .value {
  font-family: 'Courier New', monospace;
}

.delay-value.delay-good {
  color: #67C23A;
}

.delay-value.delay-warning {
  color: #E6A23C;
}

.delay-value.delay-danger {
  color: #F56C6C;
}

.replication-indicator {
  position: absolute;
  bottom: -25px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #aaa;
}

.replication-indicator .arrow {
  font-size: 20px;
  color: #00dbde;
}

.delay-info {
  display: flex;
  gap: 10px;
  align-items: center;
}

.delay-status.delay-good {
  color: #67C23A;
}

.delay-status.delay-warning {
  color: #E6A23C;
}

.delay-status.delay-danger {
  color: #F56C6C;
}

.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 25px;
}

.resource-card {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.resource-title {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #00dbde;
  text-align: center;
}

.resource-charts {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.resource-item {
  background: rgba(0, 0, 0, 0.2);
  padding: 15px;
  border-radius: 8px;
}

.resource-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.resource-header span:first-child {
  font-weight: bold;
  color: #fff;
}

.resource-values {
  font-size: 13px;
  color: #ccc;
}

.resource-values .remaining {
  margin-left: 10px;
  color: #67C23A;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.cpu-bar {
  background: linear-gradient(90deg, #409EFF, #66b1ff);
}

.memory-bar {
  background: linear-gradient(90deg, #67C23A, #85ce61);
}

.disk-bar {
  background: linear-gradient(90deg, #E6A23C, #ebb563);
}

.resource-chart {
  width: 100%;
  height: 150px;
}

.dashboard-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  backdrop-filter: blur(10px);
}

.dashboard-footer span {
  color: #aaa;
  font-size: 14px;
}

.refresh-btn {
  padding: 10px 25px;
  font-size: 16px;
  background: linear-gradient(90deg, #00dbde, #fc00ff);
  border: none;
  border-radius: 5px;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 5px 20px rgba(0, 219, 222, 0.4);
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 15px;
  }
  
  .cluster-grid,
  .resources-grid {
    grid-template-columns: 1fr;
  }
  
  .dashboard-footer {
    flex-direction: column;
    gap: 15px;
  }
}
</style>
