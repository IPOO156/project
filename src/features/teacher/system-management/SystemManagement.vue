<script setup lang="ts">
/**
 * SystemManagement - 系统管理（教师端）
 * 将字典管理 / 角色管理 / 学期管理 三个子模块聚合为单页 Tabs，
 * 侧边栏与路由只保留「系统管理」一个入口。
 * 子模块组件保持独立（各自维护数据与操作），tab 首次激活时懒加载，
 * 切换不会销毁已加载的 tab，子页状态得以保留。
 */

// ── 1. 外部依赖导入 ──
import type { Component, ComputedRef } from 'vue'
import { computed } from 'vue'

import { useTabRoute } from '@/shared/composables/useTabRoute'
import { useTeacherAuthz } from '@/shared/composables/useTeacherAuthz'

import DictManagement from '../dict-management/DictManagement.vue'
import RoleManagement from '../role-management/RoleManagement.vue'
import SemesterManagement from '../semester-management/SemesterManagement.vue'

// ── 2. 类型/接口定义 ──
type SystemTabName = 'dict' | 'role' | 'semester'

interface SystemTab {
  key: SystemTabName
  label: string
  /** 该 tab 对应的后端权限码，任一命中即可见（admin 角色直通） */
  permissions: string[]
  component: Component
}

/**
 * 三个 tab 分别对应后端三个 Service 的鉴权码：
 *   DictionaryManageService → dictionary:manage
 *   RoleManageService       → system:role:manage
 *   SemesterManageService   → semester:manage
 * 模块入口权限是三者并集（任一即可进入本页），故页内必须再按各自 tab 的码收窄，
 * 否则持单一码的角色会看到必然返回 403 的其他 tab。
 */
const TABS: SystemTab[] = [
  {
    key: 'dict',
    label: '字典管理',
    permissions: ['dictionary:manage'],
    component: DictManagement,
  },
  {
    key: 'role',
    label: '角色管理',
    permissions: ['system:role:manage'],
    component: RoleManagement,
  },
  {
    key: 'semester',
    label: '学期管理',
    // semester:import 是学期导入/模板下载的独立码（SemesterManageService 分别校验），
    // 只持该码的角色也应看到学期 Tab；页内按钮会再按该码收窄。
    permissions: ['semester:manage', 'semester:import'],
    component: SemesterManagement,
  },
]

// ── 5. 响应式数据（通过 useTabRoute 与 URL ?tab=xxx 双向同步） ──
const { canAccessAny } = useTeacherAuthz()

const visibleTabs: ComputedRef<SystemTab[]> = computed(() =>
  TABS.filter((tab) => canAccessAny(tab.permissions)),
)

const availableKeys: ComputedRef<SystemTabName[]> = computed(() =>
  visibleTabs.value.map((tab) => tab.key),
)

const { activeTab } = useTabRoute(availableKeys, 'dict')
</script>

<template>
  <div class="mc-page system-management">
    <el-tabs v-model="activeTab" class="system-management__tabs">
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
.system-management {
  // 子页面自带 mc-page-head（含标题与操作按钮），Tabs 内容区顶部留白衔接
  &__tabs {
    :deep(.el-tabs__content) {
      padding-top: $spacing-md;
    }
  }
}
</style>
