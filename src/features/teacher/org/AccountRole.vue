<script setup lang="ts">
/**
 * AccountRole - 账号与角色（教师端）
 *
 * 将原「角色选择」（教师职位调整 / 新增账号）「账号管理」（学生账号 / 教师账号）
 * 以及原「系统管理」中的角色管理聚合为单页 Tabs：账号、角色与数据范围属同一
 * 人员权限配置域，教师账号的「新增」与「列表」此前被切在两个入口，用户需来回跳。
 *
 * 五个叶子页原地保留（各自维护数据与操作），tab 首次激活时懒加载，
 * 切换不销毁已加载的 tab，子页状态得以保留。
 */
import type { Component, ComputedRef } from 'vue'
import { computed } from 'vue'

import { useTabRoute } from '@/shared/composables/useTabRoute'
import { useTeacherAuthz } from '@/shared/composables/useTeacherAuthz'
import RoleAdd from './RoleAdd.vue'
import RoleAdjust from './RoleAdjust.vue'
import RoleManagement from './RoleManagement.vue'
import StudentAccount from './StudentAccount.vue'
import TeacherAccount from './TeacherAccount.vue'

type TabKey = 'student' | 'teacher' | 'adjust' | 'add' | 'role'

interface HubTab {
  key: TabKey
  label: string
  /** 该 tab 所需权限码，任一命中即可见 */
  permissions: string[]
  component: Component
}

/**
 * 账号相关四个 tab 均包含写操作（新增账号、改角色/范围、重置密码、启停账号），
 * 后端 UserManageService 对这些接口统一校验 user:manage（读列表也接受 user:view）。
 * 页面没有做按钮级权限收窄，故这四个 tab 按 user:manage 判定，避免只读角色看到
 * 必然返回 403 的操作按钮；角色管理 tab 单独使用 system:role:manage。
 *
 * 注意：此前这里写的是 'system:user:manage'，该权限码在后端权限字典中不存在，
 * 导致非 admin 角色永远看不到本页。
 */
const TABS: HubTab[] = [
  {
    key: 'student',
    label: '学生账号',
    permissions: ['user:manage'],
    component: StudentAccount,
  },
  {
    key: 'teacher',
    label: '教师账号',
    permissions: ['user:manage'],
    component: TeacherAccount,
  },
  {
    key: 'adjust',
    label: '教师职位调整',
    permissions: ['user:manage'],
    component: RoleAdjust,
  },
  {
    key: 'add',
    label: '新增账号',
    permissions: ['user:manage'],
    component: RoleAdd,
  },
  {
    // 原「系统管理」中的角色页迁移至此：角色与数据范围决定账号能看到什么，
    // 与账号管理属同一人员权限配置域。
    key: 'role',
    label: '角色管理',
    permissions: ['system:role:manage'],
    component: RoleManagement,
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
  <div class="mc-page hub-page account-role">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <h2 class="mc-page-head__title">账号与角色</h2>
        <p class="mc-page-head__desc">
          管理学生与教师账号、职位调整、新增账号，以及角色权限与数据范围。
        </p>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="account-role__tabs">
      <el-tab-pane
        v-for="tab in visibleTabs"
        :key="tab.key"
        :label="tab.label"
        :name="tab.key"
        lazy
      >
        <component :is="tab.component" :embed="true" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="scss">
.account-role {
  // 子页面作为 hub 嵌入时不再渲染自己的 mc-page-head，
  // tab 内容直接跟下方的搜索栏 / 卡片衔接，无需额外 padding。
}
</style>
