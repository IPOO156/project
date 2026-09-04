<script setup lang="ts">
/**
 * HardwareMaintenance - 硬件维护
 * 覆盖：服务器维护、网络设备维护、终端和外设维护、机房环境配套
 * 说明：本页为运维台账，数据由监控平台提供，后端暂无专门接口。
 */
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-vue-next'
import { ref } from 'vue'

interface HardwareItem {
  name: string
  status: 'normal' | 'warning' | 'fault'
  meta?: string
  metric?: string
  alarm?: string
}

interface HardwareGroup {
  category: string
  desc: string
  items: HardwareItem[]
}

const hardwareStatus = ref<HardwareGroup[]>([
  {
    category: '服务器维护',
    desc: '应用、数据库与备份服务器的运行状态',
    items: [
      {
        name: '主数据库服务器',
        status: 'normal',
        meta: '应用运行 128 天',
        metric: 'CPU 23% · 内存 45%',
      },
      {
        name: '应用服务器',
        status: 'normal',
        meta: '应用运行 128 天',
        metric: 'CPU 35% · 内存 62%',
      },
      {
        name: '备份服务器',
        status: 'warning',
        meta: '应用运行 30 天',
        metric: '内存 78%',
        alarm: '磁盘空间不足',
      },
    ],
  },
  {
    category: '网络设备维护',
    desc: '核心交换、防火墙与无线设备的连通与负载',
    items: [
      { name: '核心交换机', status: 'normal', meta: '持续运行 365 天', metric: 'CPU 8%' },
      { name: '边界防火墙', status: 'normal', meta: '持续运行 365 天', metric: 'CPU 15%' },
      { name: '无线控制器', status: 'normal', meta: '持续运行 200 天', metric: 'CPU 5%' },
    ],
  },
  {
    category: '终端和外设维护',
    desc: '打印机、扫描仪等办公外设的可用状态',
    items: [
      { name: '打印机 · 行政楼3F', status: 'normal', meta: '就绪' },
      { name: '扫描仪 · 档案室', status: 'fault', meta: '离线', alarm: '需更换耗材' },
    ],
  },
  {
    category: '机房环境配套',
    desc: '温湿度、供电与门禁等环境保障',
    items: [
      { name: '精密空调', status: 'normal', meta: '温度 22°C · 湿度 45%' },
      { name: 'UPS 电源', status: 'normal', meta: '负载 35% · 续航约 45 分钟' },
      { name: '机房门禁', status: 'normal', meta: '运行正常' },
    ],
  },
])

const statusIcon: Record<string, any> = {
  normal: CheckCircle2,
  warning: AlertTriangle,
  fault: AlertTriangle,
}
const statusColor: Record<string, string> = {
  normal: 'var(--el-color-success)',
  warning: 'var(--el-color-warning)',
  fault: 'var(--el-color-danger)',
}
const statusLabel: Record<string, string> = { normal: '正常', warning: '告警', fault: '故障' }

const refreshing = ref(false)
function handleRefreshAll() {
  refreshing.value = true
  setTimeout(() => {
    refreshing.value = false
  }, 500)
}
</script>

<template>
  <div class="mc-page">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <p class="mc-page-head__eyebrow">系统维护 · Hardware</p>
        <h2 class="mc-page-head__title">硬件维护</h2>
        <p class="mc-page-head__desc">
          服务器、网络设备、终端外设与机房环境的运维台账。状态数据由监控平台同步，后端暂未提供专门接口。
        </p>
      </div>
      <div class="mc-page-head__actions">
        <el-button :icon="RefreshCw" :loading="refreshing" @click="handleRefreshAll">
          刷新状态
        </el-button>
      </div>
    </div>

    <div v-for="group in hardwareStatus" :key="group.category" class="mc-card">
      <div class="mc-card__head">
        <span class="mc-card__title">{{ group.category }}</span>
        <span class="hardware-maint__desc">{{ group.desc }}</span>
      </div>
      <div class="mc-card__body">
        <div class="hardware-items">
          <div
            v-for="item in group.items"
            :key="item.name"
            class="hardware-item"
            :class="`hardware-item--${item.status}`"
          >
            <div class="hardware-item__left">
              <component
                :is="statusIcon[item.status]"
                :size="20"
                :color="statusColor[item.status]"
              />
              <div class="hardware-item__info">
                <span class="hardware-item__name">{{ item.name }}</span>
                <span class="hardware-item__meta">{{ item.meta }}</span>
              </div>
            </div>
            <div class="hardware-item__right">
              <span v-if="item.metric" class="hardware-item__metric">{{ item.metric }}</span>
              <span v-if="item.alarm" class="hardware-item__alarm">{{ item.alarm }}</span>
              <span class="hardware-item__status" :style="{ color: statusColor[item.status] }">
                {{ statusLabel[item.status] }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.hardware-maint__desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.hardware-items {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}
.hardware-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md $spacing-lg;
  border: 1px solid var(--el-border-color-light);
  border-radius: $radius-base;
  transition: all 0.2s;
  &:hover {
    background: var(--el-fill-color-light);
  }
  &--warning {
    background: var(--el-color-warning-light-9);
    border-color: var(--el-color-warning-light-7);
  }
  &--fault {
    background: var(--el-color-danger-light-9);
    border-color: var(--el-color-danger-light-7);
  }
  &__left {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }
  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  &__name {
    font-weight: 600;
    font-size: 14px;
    color: var(--el-text-color-primary);
  }
  &__meta {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
  &__right {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }
  &__status {
    font-weight: 600;
    font-size: 13px;
    min-width: 32px;
  }
  &__metric {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color);
    padding: 2px 8px;
    border-radius: 4px;
    font-variant-numeric: tabular-nums;
  }
  &__alarm {
    font-size: 12px;
    color: var(--el-color-warning);
    background: var(--el-color-warning-light-9);
    padding: 2px 8px;
    border-radius: 4px;
  }
}
</style>
