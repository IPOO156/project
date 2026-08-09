<script setup lang="ts">
import { AlertTriangle, Bug, CheckCircle2, RefreshCw, Shield, Zap } from 'lucide-vue-next'
import { ref } from 'vue'

const softwareItems = ref([
  {
    name: '档鉴未来 v3.2.1',
    type: '核心系统',
    status: 'normal',
    lastUpdate: '2026-06-15',
    nextUpdate: '2026-08-01',
  },
  {
    name: '数据库中间件',
    type: '基础组件',
    status: 'normal',
    lastUpdate: '2026-05-20',
    nextUpdate: '2026-07-30',
  },
  {
    name: '文件存储服务',
    type: '基础组件',
    status: 'warning',
    lastUpdate: '2026-04-10',
    nextUpdate: '2026-07-15',
    alarm: '版本过旧，建议升级',
  },
  {
    name: '安全防护模块',
    type: '安全组件',
    status: 'normal',
    lastUpdate: '2026-07-01',
    nextUpdate: '2026-08-15',
  },
  {
    name: '日志采集服务',
    type: '辅助服务',
    status: 'normal',
    lastUpdate: '2026-06-28',
    nextUpdate: '2026-09-01',
  },
])

const maintenanceTypes = [
  { icon: Bug, label: '纠错性维护', desc: '修复已知错误与异常', color: '#f59e0b' },
  { icon: Shield, label: '环境适配', desc: '适配服务器环境变更', color: '#2d5a87' },
  { icon: Zap, label: '提前防故障', desc: '主动发现潜在风险', color: '#10b981' },
  { icon: RefreshCw, label: '优化迭代', desc: '功能优化与性能提升', color: '#8b5cf6' },
]
</script>

<template>
  <div class="software-maint">
    <!-- 维护类别 -->
    <el-row :gutter="16">
      <el-col v-for="mt in maintenanceTypes" :key="mt.label" :span="6">
        <el-card shadow="hover" class="maint-type-card">
          <div
            class="maint-type-card__icon"
            :style="{ background: `${mt.color}15`, color: mt.color }"
          >
            <component :is="mt.icon" :size="28" />
          </div>
          <span class="maint-type-card__label">{{ mt.label }}</span>
          <span class="maint-type-card__desc">{{ mt.desc }}</span>
        </el-card>
      </el-col>
    </el-row>

    <!-- 软件列表 -->
    <el-card>
      <template #header><span class="section-title">组件状态</span></template>
      <div class="software-items">
        <div
          v-for="item in softwareItems"
          :key="item.name"
          class="software-item"
          :class="`software-item--${item.status}`"
        >
          <div class="software-item__left">
            <component
              :is="item.status === 'normal' ? CheckCircle2 : AlertTriangle"
              :size="20"
              :color="
                item.status === 'normal' ? 'var(--el-color-success)' : 'var(--el-color-warning)'
              "
            />
            <div class="software-item__info">
              <span class="software-item__name">{{ item.name }}</span>
              <el-tag size="small" type="info" effect="plain">{{ item.type }}</el-tag>
            </div>
          </div>
          <div class="software-item__right">
            <span class="software-item__update">上次更新：{{ item.lastUpdate }}</span>
            <span class="software-item__next">下次计划：{{ item.nextUpdate }}</span>
            <span v-if="item.alarm" class="software-item__alarm">{{ item.alarm }}</span>
            <el-button size="small" type="primary" plain>更新</el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.software-maint {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.maint-type-card {
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-base;
  }
  &__icon {
    width: 52px;
    height: 52px;
    border-radius: $radius-lg;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto $spacing-md;
  }
  &__label {
    display: block;
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 4px;
  }
  &__desc {
    display: block;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
.software-items {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}
.software-item {
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
  &__left {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }
  &__info {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }
  &__name {
    font-weight: 600;
    font-size: 14px;
  }
  &__right {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }
  &__update,
  &__next {
    font-size: 12px;
    color: var(--el-text-color-secondary);
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
