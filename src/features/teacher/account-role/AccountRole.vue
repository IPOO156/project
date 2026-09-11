<script setup lang="ts">
/**
 * AccountRole - 账号与角色（教师端）
 *
 * 将原「角色选择」（教师职位调整 / 新增账号）与「账号管理」（学生账号 / 教师账号）
 * 两个一级菜单聚合为单页 Tabs：两组都在调 listUsers / createUser，属同一业务对象 ——
 * 教师账号的「新增」在角色选择、「列表与管理」在账号管理，用户要在菜单间来回跳。
 *
 * 四个叶子页原地保留（各自维护数据与操作），tab 首次激活时懒加载，
 * 切换不销毁已加载的 tab，子页状态得以保留。
 */
import type { Component, ComputedRef } from 'vue'
import { computed } from 'vue'

import { useTabRoute } from '@/shared/composables/useTabRoute'
import { useTeacherAuthz } from '@/shared/composables/useTeacherAuthz'
import StudentAccount from '../account-management/StudentAccount.vue'
import TeacherAccount from '../account-management/TeacherAccount.vue'
import RoleAdd from '../role-selection/RoleAdd.vue'
import RoleAdjust from '../role-selection/RoleAdjust.vue'

type TabKey = 'student' | 'teacher' | 'adjust' | 'add'

interface HubTab {
  key: TabKey
  label: string
  /** 该 tab 所需权限码，任一命中即可见 */
  permissions: string[]
  component: Component
}

/**
 * 四个 tab 目前同码；仍统一走权限过滤，保证与 isModuleAllowed 的判定顺序一致
 * （admin 角色直通），后端日后给「新增账号」单独收紧码时本文件无需改动。
 */
const TABS: HubTab[] = [
  {
    key: 'student',
    label: '学生账号',
    permissions: ['system:user:manage'],
    component: StudentAccount,
  },
  {
    key: 'teacher',
    label: '教师账号',
    permissions: ['system:user:manage'],
    component: TeacherAccount,
  },
  {
    key: 'adjust',
    label: '教师职位调整',
    permissions: ['system:user:manage'],
    component: RoleAdjust,
  },
  {
    key: 'add',
    label: '新增账号',
    permissions: ['system:user:manage'],
    component: RoleAdd,
  },
]

const { canAccessAny } = useTeacherAuthz()

const visibleTabs: ComputedRef<HubTab[]> = computed(() =>
  TABS.filter((tab) => canAccessAny(tab.permissions)),
)

const availableKeys: ComputedRef<TabKey[]> = computed(() => visibleTabs.value.map((t) => t.key))

// 默认落「学生账号」：与旧 /teacher/account-management 的 redirect 目标、
// 首页快捷入口的历史行为一致。
const { activeTab } = useTabRoute<TabKey>(availableKeys, 'student')
</script>

<template>
  <div class="mc-page account-role">
    <el-tabs v-model="activeTab" class="account-role__tabs">
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
.account-role {
  // 子页面自带 mc-page-head（含标题与操作按钮），Tabs 内容区顶部留白衔接
  &__tabs {
    :deep(.el-tabs__content) {
      padding-top: $spacing-md;
    }
  }
}
</style>
