<script setup lang="ts">
import { ElMessage } from 'element-plus'
/**
 * HardwareMaintenance - 硬件维护
 * 服务器、网络设备、终端外设、机房环境
 */
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-vue-next'
import { ref } from 'vue'

const hardwareStatus = ref([
  {
    category: '服务器',
    items: [
      {
        name: '主数据库服务器',
        status: 'normal',
        ip: '192.168.1.10',
        uptime: '128天',
        cpu: '23%',
        mem: '45%',
      },
      {
        name: '应用服务器',
        status: 'normal',
        ip: '192.168.1.11',
        uptime: '128天',
        cpu: '35%',
        mem: '62%',
      },
      {
        name: '备份服务器',
        status: 'warning',
        ip: '192.168.1.12',
        uptime: '30天',
        cpu: '12%',
        mem: '78%',
        alarm: '磁盘空间不足',
      },
    ],
  },
  {
    category: '网络设备',
    items: [
      { name: '核心交换机', status: 'normal', ip: '192.168.1.1', uptime: '365天', cpu: '8%' },
      { name: '防火墙', status: 'normal', ip: '192.168.1.2', uptime: '365天', cpu: '15%' },
      { name: '无线控制器', status: 'normal', ip: '192.168.1.3', uptime: '200天', cpu: '5%' },
    ],
  },
  {
    category: '终端与外设',
    items: [
      { name: '打印机-行政楼3F', status: 'normal', location: '行政楼3楼' },
      { name: '扫描仪-档案室', status: 'fault', location: '档案室', alarm: '需更换耗材' },
    ],
  },
  {
    category: '机房环境',
    items: [
      { name: '精密空调', status: 'normal', value: '温度 22°C / 湿度 45%' },
      { name: 'UPS电源', status: 'normal', value: '负载 35% / 续航 45min' },
      { name: '门禁系统', status: 'normal', value: '运行正常' },
    ],
  },
])

const statusIcon: Record<string, any> = {
  normal: CheckCircle2,
  warning: AlertTriangle,
  fault: AlertTriangle,
}
const statusColor: Record<string, string> = {
  normal: '#67c23a',
  warning: '#e6a23c',
  fault: '#f56c6c',
}
const statusLabel: Record<string, string> = { normal: '正常', warning: '告警', fault: '故障' }

function handleRefresh(item: any) {
  ElMessage.success(`${item.name || '设备'} 状态已刷新`)
}
</script>

<template>
  <div class="hardware-maint">
    <el-card class="hardware-maint__header">
      <el-row justify="space-between" align="middle">
        <el-col :span="12"><span class="section-title">硬件设备状态总览</span></el-col>
        <el-col :span="12" style="text-align: right">
          <el-button :icon="RefreshCw" @click="ElMessage.success('状态已刷新')">刷新状态</el-button>
        </el-col>
      </el-row>
    </el-card>

    <div v-for="group in hardwareStatus" :key="group.category" class="hardware-maint__group">
      <el-card>
        <template #header
          ><span class="section-title">{{ group.category }}</span></template
        >
        <div class="hardware-items">
          <div
            v-for="item in group.items"
            :key="item.name"
            class="hardware-item"
            :class="`hardware-item--${(item as any).status}`"
          >
            <div class="hardware-item__left">
              <component
                :is="statusIcon[(item as any).status]"
                :size="20"
                :color="statusColor[(item as any).status]"
              />
              <div class="hardware-item__info">
                <span class="hardware-item__name">{{ (item as any).name }}</span>
                <span class="hardware-item__meta">{{
                  (item as any).ip || (item as any).location || (item as any).value || ''
                }}</span>
              </div>
            </div>
            <div class="hardware-item__right">
              <span
                class="hardware-item__status"
                :style="{ color: statusColor[(item as any).status] }"
              >
                {{ statusLabel[(item as any).status] }}
              </span>
              <span v-if="(item as any).cpu" class="hardware-item__metric"
                >CPU {{ (item as any).cpu }}</span
              >
              <span v-if="(item as any).mem" class="hardware-item__metric"
                >内存 {{ (item as any).mem }}</span
              >
              <span v-if="(item as any).uptime" class="hardware-item__uptime"
                >运行 {{ (item as any).uptime }}</span
              >
              <span v-if="(item as any).alarm" class="hardware-item__alarm">{{
                (item as any).alarm
              }}</span>
              <el-button size="small" text @click="handleRefresh(item)">刷新</el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped lang="scss">
.hardware-maint {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
  &__header {
    margin-bottom: 0;
  }
  &__group {
    margin-bottom: 0;
  }
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
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
    border-left: 3px solid #e6a23c;
  }
  &--fault {
    border-left: 3px solid #f56c6c;
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
    min-width: 36px;
  }
  &__metric,
  &__uptime {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color);
    padding: 2px 8px;
    border-radius: 4px;
  }
  &__alarm {
    font-size: 12px;
    color: #e6a23c;
    background: #fef3c7;
    padding: 2px 8px;
    border-radius: 4px;
  }
}
</style>
