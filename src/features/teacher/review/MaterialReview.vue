<script setup lang="ts">
/**
 * MaterialReview - 材料审核聚合页（教师端）
 *
 * 将原「材料审核（待审核 / 审核记录）」与「审批委托」合并为单页 Tabs：
 * 三页都围绕「审核人处理材料」这一个业务对象 —— 当天审什么、审过什么、
 * 临时把审批职责交给谁。
 *
 * 叶子页原地保留（各自维护数据与操作），tab 首次激活时懒加载，
 * 切换不销毁已加载的 tab，子页状态得以保留。
 */
import type { Component, ComputedRef } from 'vue'
import { computed } from 'vue'

import DelegationManage from '@/features/teacher/org/DelegationManage.vue'
import { useTabRoute } from '@/shared/composables/useTabRoute'
import { useTeacherAuthz } from '@/shared/composables/useTeacherAuthz'
import { ADMIN_MENU_CODE } from '@/shared/config/teacherModuleRegistry'

import AuditHistory from './AuditHistory.vue'
import AuditPendingList from './AuditPendingList.vue'

type TabKey = 'pending' | 'history' | 'delegation'

interface HubTab {
  key: TabKey
  label: string
  /** 该 tab 所需权限码，任一命中即可见 */
  permissions: string[]
  /** 授权数据未就绪时是否仍展示（取值依据：改造前该入口对教师/辅导员是否可见） */
  baselineVisible: boolean
  component: Component
}

const TABS: HubTab[] = [
  {
    key: 'pending',
    label: '待审核',
    permissions: ['audit:pending', 'audit:approve', 'audit:batch', ADMIN_MENU_CODE],
    baselineVisible: true,
    component: AuditPendingList,
  },
  {
    key: 'history',
    label: '审核记录',
    permissions: ['audit:pending', 'audit:approve', 'audit:batch', ADMIN_MENU_CODE],
    baselineVisible: true,
    component: AuditHistory,
  },
  {
    key: 'delegation',
    label: '审批委托',
    // 审批委托为教师专属（delegate:manage 仅授给 teacher/counselor），
    // 管理员按角色直通查看；教师基线回退时该入口改造前不可见，故不展示。
    permissions: ['delegate:manage'],
    baselineVisible: false,
    component: DelegationManage,
  },
]

const { canAccessAny, baselineFallback } = useTeacherAuthz()

const visibleTabs: ComputedRef<HubTab[]> = computed(() =>
  TABS.filter(
    (tab) => canAccessAny(tab.permissions) || (baselineFallback.value && tab.baselineVisible),
  ),
)

const availableKeys: ComputedRef<TabKey[]> = computed(() => visibleTabs.value.map((t) => t.key))

const { activeTab } = useTabRoute<TabKey>(availableKeys, 'pending')
</script>

<template>
  <div class="mc-page hub-page material-review page-enter">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <h2 class="mc-page-head__title">材料审核</h2>
        <p class="mc-page-head__desc">
          处理学生提交的待审核材料，查看历史审核记录，或将本人审批职责临时委托给其他教师。
        </p>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="material-review__tabs">
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
.material-review {
  &__tabs {
    :deep(.el-tabs__content) {
      padding-top: $spacing-lg;
    }
  }
}
</style>
