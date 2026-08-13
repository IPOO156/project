<script setup lang="ts">
/**
 * SoftwareMaintenance - 软件维护
 * 覆盖：纠错性维护、环境适配、预防性运维、优化迭代
 * 说明：本页为运维台账，组件状态由运维平台同步。
 */
import { Bug, CheckCircle2, RefreshCw, ShieldCheck, Sparkles } from 'lucide-vue-next'
import { ref } from 'vue'

const maintenanceTypes = [
  { icon: Bug, label: '纠错性维护', desc: '修复已发现的错误与异常', color: '#f59e0b' },
  { icon: ShieldCheck, label: '环境适配', desc: '适配服务器与中间件环境变更', color: '#2d5a87' },
  { icon: RefreshCw, label: '预防性运维', desc: '主动排查并消除潜在风险', color: '#10b981' },
  { icon: Sparkles, label: '优化迭代', desc: '功能优化与性能提升', color: '#8b5cf6' },
]

const softwareItems = ref([
  {
    name: '档案管理系统主程序',
    type: '核心系统',
    lastUpdate: '2026-06-15',
    nextUpdate: '2026-08-01',
  },
  { name: '数据库中间件', type: '基础组件', lastUpdate: '2026-05-20', nextUpdate: '2026-07-30' },
  {
    name: '文件存储服务',
    type: '基础组件',
    lastUpdate: '2026-04-10',
    nextUpdate: '2026-07-15',
    alarm: '版本过旧，建议升级',
  },
  { name: '安全防护模块', type: '安全组件', lastUpdate: '2026-07-01', nextUpdate: '2026-08-15' },
  { name: '日志采集服务', type: '辅助服务', lastUpdate: '2026-06-28', nextUpdate: '2026-09-01' },
])
</script>

<template>
  <div class="mc-page">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <p class="mc-page-head__eyebrow">系统维护 · Software</p>
        <h2 class="mc-page-head__title">软件维护</h2>
        <p class="mc-page-head__desc">软件的四类维护方式，以及各基础组件的版本与更新计划。</p>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col v-for="mt in maintenanceTypes" :key="mt.label" :xs="12" :sm="6">
        <div class="maint-type-card mc-card">
          <div class="mc-card__body maint-type-card__body">
            <div class="maint-type-card__icon" :style="{ '--chip': mt.color }">
              <component :is="mt.icon" :size="26" />
            </div>
            <span class="maint-type-card__label">{{ mt.label }}</span>
            <span class="maint-type-card__desc">{{ mt.desc }}</span>
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="mc-card">
      <div class="mc-card__head">
        <span class="mc-card__title">组件状态</span>
      </div>
      <div class="mc-card__body">
        <div class="software-items">
          <div v-for="item in softwareItems" :key="item.name" class="software-item">
            <div class="software-item__left">
              <component :is="CheckCircle2" :size="20" color="var(--el-color-success)" />
              <div class="software-item__info">
                <span class="software-item__name">{{ item.name }}</span>
                <el-tag size="small" type="info" effect="plain">{{ item.type }}</el-tag>
              </div>
            </div>
            <div class="software-item__right">
              <span class="software-item__update">上次更新 {{ item.lastUpdate }}</span>
              <span class="software-item__next">下次计划 {{ item.nextUpdate }}</span>
              <span v-if="item.alarm" class="software-item__alarm">{{ item.alarm }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.maint-type-card {
  height: 100%;
  &__body {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-sm;
    text-align: center;
  }
  &__icon {
    width: 52px;
    height: 52px;
    border-radius: $radius-xl;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--chip, var(--el-color-primary));
    background: color-mix(in srgb, var(--chip, var(--el-color-primary)) 12%, transparent);
    box-shadow: inset 0 0 0 1px
      color-mix(in srgb, var(--chip, var(--el-color-primary)) 18%, transparent);
  }
  &__label {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
  &__desc {
    font-size: 12px;
    line-height: 1.6;
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
    color: var(--el-text-color-primary);
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
