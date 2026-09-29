<script setup lang="ts">
/**
 * IndicatorSystem - 指标体系（教师端）
 *
 * 将原「能力维度」「指标配置」两个一级菜单聚合为单页 Tabs：
 * 两者 permissions 完全相同（indicator:manage），能力维度页自述「供指标体系引用」，
 * 指标列表也带 dimensionName 列 —— 属同一业务对象的配置与引用关系。
 *
 * 两个叶子页原地保留（各自维护数据与操作），tab 首次激活时懒加载，
 * 切换不销毁已加载的 tab，子页状态得以保留。
 */
import type { Component, ComputedRef } from 'vue'
import { computed } from 'vue'

import { useTabRoute } from '@/shared/composables/useTabRoute'
import { useTeacherAuthz } from '@/shared/composables/useTeacherAuthz'
import AbilityDimension from '../ability-dimension/AbilityDimension.vue'
import Indicator from '../indicator/Indicator.vue'

type TabKey = 'dimension' | 'indicator'

interface HubTab {
  key: TabKey
  label: string
  /** 该 tab 所需权限码，任一命中即可见 */
  permissions: string[]
  component: Component
}

/**
 * 两个 tab 目前同码；仍统一走权限过滤，保证与 isModuleAllowed 的判定顺序一致
 * （admin 角色直通），后端日后拆分权限码时本文件无需改动。
 */
const TABS: HubTab[] = [
  {
    key: 'dimension',
    label: '能力维度',
    permissions: ['indicator:manage'],
    component: AbilityDimension,
  },
  { key: 'indicator', label: '指标配置', permissions: ['indicator:manage'], component: Indicator },
]

const { canAccessAny } = useTeacherAuthz()

const visibleTabs: ComputedRef<HubTab[]> = computed(() =>
  TABS.filter((tab) => canAccessAny(tab.permissions)),
)

const availableKeys: ComputedRef<TabKey[]> = computed(() => visibleTabs.value.map((t) => t.key))

const { activeTab } = useTabRoute<TabKey>(availableKeys, 'dimension')
</script>

<template>
  <div class="mc-page indicator-system">
    <el-tabs v-model="activeTab" class="indicator-system__tabs">
      <el-tab-pane
        v-for="tab in visibleTabs"
        :key="tab.key"
        :label="tab.label"
        :name="tab.key"
        lazy
      >
        <component :is="tab.component" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="scss">
.indicator-system {
  // 子页面自带 mc-page-head（含标题与操作按钮），Tabs 内容区顶部留白衔接
  &__tabs {
    :deep(.el-tabs__content) {
      padding-top: $spacing-md;
    }
  }
}
</style>
