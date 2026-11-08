<script setup lang="ts">
/**
 * IndicatorSystem - 指标体系（教师端）
 *
 * 将原「能力维度」「指标配置」「评分重算」三个一级菜单聚合为单页 Tabs：
 * 能力维度与指标配置同属指标体系的配置与引用关系；评分重算是配置后的执行动作。
 *
 * 三个叶子页原地保留（各自维护数据与操作），tab 首次激活时懒加载，
 * 切换不销毁已加载的 tab，子页状态得以保留。
 */
import type { Component, ComputedRef } from 'vue'
import { computed } from 'vue'

import { useTabRoute } from '@/shared/composables/useTabRoute'
import { useTeacherAuthz } from '@/shared/composables/useTeacherAuthz'
import AbilityDimension from './AbilityDimension.vue'
import Indicator from './Indicator.vue'
import ScoreRecalculate from './ScoreRecalculate.vue'

type TabKey = 'dimension' | 'indicator' | 'recalculate'

interface HubTab {
  key: TabKey
  label: string
  /** 该 tab 所需权限码，任一命中即可见 */
  permissions: string[]
  component: Component
}

/**
 * 能力维度 / 指标配置目前同码（indicator:manage），评分重算使用 score:recalculate；
 * 仍统一走权限过滤，保证与 isModuleAllowed 的判定顺序一致（admin 角色直通）。
 */
const TABS: HubTab[] = [
  {
    key: 'dimension',
    label: '能力维度',
    permissions: ['indicator:manage'],
    component: AbilityDimension,
  },
  { key: 'indicator', label: '指标配置', permissions: ['indicator:manage'], component: Indicator },
  {
    // 原「评分重算」入口：重算的范围与规则来自指标体系，是配置后的执行动作。
    key: 'recalculate',
    label: '评分重算',
    permissions: ['score:recalculate'],
    component: ScoreRecalculate,
  },
]

const { canAccessAny } = useTeacherAuthz()

const visibleTabs: ComputedRef<HubTab[]> = computed(() =>
  TABS.filter((tab) => canAccessAny(tab.permissions)),
)

const availableKeys: ComputedRef<TabKey[]> = computed(() => visibleTabs.value.map((t) => t.key))

const { activeTab } = useTabRoute<TabKey>(availableKeys, 'dimension')
</script>

<template>
  <div class="mc-page hub-page indicator-system page-enter">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <h2 class="mc-page-head__title">指标体系</h2>
        <p class="mc-page-head__desc">维护能力维度与评分指标，并在指标调整后发起学生评分重算。</p>
      </div>
    </div>

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
