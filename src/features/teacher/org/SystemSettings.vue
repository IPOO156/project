<script setup lang="ts">
/**
 * SystemSettings - 系统设置聚合页（教师端）
 *
 * 将原「系统管理（字典 / 学期）」「系统配置」「定时任务」「日志查看」四个一级菜单
 * 合并为单页 Tabs：都属于系统级、低频的维护与审计操作。
 * 角色管理迁至「账号与角色」页（与账号同属人员权限配置）。
 *
 * 叶子页原地保留（各自维护数据与操作），tab 首次激活时懒加载，
 * 切换不销毁已加载的 tab，子页状态得以保留。
 */
import type { Component, ComputedRef } from 'vue'
import { computed } from 'vue'

import LogView from '@/features/teacher/ops/LogView.vue'
import ScheduledTask from '@/features/teacher/ops/ScheduledTask.vue'
import { useTabRoute } from '@/shared/composables/useTabRoute'
import { useTeacherAuthz } from '@/shared/composables/useTeacherAuthz'
import { ADMIN_MENU_CODE } from '@/shared/config/teacherModuleRegistry'

import DictManagement from './DictManagement.vue'
import SemesterManagement from './SemesterManagement.vue'
import SystemConfig from './SystemConfig.vue'

type TabKey = 'dict' | 'semester' | 'config' | 'tasks' | 'logs'

interface HubTab {
  key: TabKey
  label: string
  /** 该 tab 所需权限码，任一命中即可见（admin 角色直通） */
  permissions: string[]
  /** 授权数据未就绪时是否仍展示（取舍依据：改造前该入口对教师/辅导员是否可见） */
  baselineVisible: boolean
  component: Component
}

/**
 * 模块入口权限是下列码的并集（任一即可进入本页），故页内必须按各自 tab 的码收窄，
 * 否则持单一码的角色会看到必然返回 403 的其他 tab。
 * 系统配置 / 定时任务在后端走 requireAdmin，无专属权限码，沿用管理员代理码。
 */
const TABS: HubTab[] = [
  {
    key: 'dict',
    label: '数据字典',
    permissions: ['dictionary:manage', ADMIN_MENU_CODE],
    baselineVisible: false,
    component: DictManagement,
  },
  {
    key: 'semester',
    label: '学期设置',
    // semester:import 是学期导入/模板下载的独立码，只持该码也应看到学期页
    permissions: ['semester:manage', 'semester:import'],
    baselineVisible: false,
    component: SemesterManagement,
  },
  {
    key: 'config',
    label: '系统配置',
    permissions: [ADMIN_MENU_CODE],
    baselineVisible: false,
    component: SystemConfig,
  },
  {
    key: 'tasks',
    label: '定时任务',
    permissions: [ADMIN_MENU_CODE],
    baselineVisible: false,
    component: ScheduledTask,
  },
  {
    key: 'logs',
    label: '操作日志',
    // 后端 AdminLogService 只校验 log:view，admin 角色直通。
    // 改造前「日志查看」对 teacher / counselor 即可见，故基线状态下保留本 tab。
    permissions: ['log:view'],
    baselineVisible: true,
    component: LogView,
  },
]

const { canAccessAny, baselineFallback } = useTeacherAuthz()

const visibleTabs: ComputedRef<HubTab[]> = computed(() =>
  TABS.filter(
    (tab) => canAccessAny(tab.permissions) || (baselineFallback.value && tab.baselineVisible),
  ),
)

const availableKeys: ComputedRef<TabKey[]> = computed(() => visibleTabs.value.map((t) => t.key))

const { activeTab } = useTabRoute<TabKey>(availableKeys, 'dict')
</script>

<template>
  <div class="mc-page hub-page system-settings">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <h2 class="mc-page-head__title">系统设置</h2>
        <p class="mc-page-head__desc">
          维护数据字典、学期与系统参数，管理后台定时任务，并查看系统操作日志。
        </p>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="system-settings__tabs">
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
.system-settings {
  &__tabs {
    :deep(.el-tabs__content) {
      padding-top: $spacing-lg;
    }
  }
}
</style>
