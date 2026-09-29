<script setup lang="ts">
/**
 * ExportCenter - 导出中心（教师端）
 *
 * 将原「档案导出」「导出模板」两个一级菜单聚合为单页 Tabs：
 * 导出页的模板下拉取自 getTeacherExportTemplates，模板页对**同一业务对象**做 CRUD /
 * 设默认 / 启停，属同一流程的「用模板」与「管模板」两端。
 *
 * 两个叶子页原地保留（各自维护数据与操作），tab 首次激活时懒加载，
 * 切换不销毁已加载的 tab，子页状态得以保留。
 */
import type { Component, ComputedRef } from 'vue'
import { computed } from 'vue'

import { useTabRoute } from '@/shared/composables/useTabRoute'
import { useTeacherAuthz } from '@/shared/composables/useTeacherAuthz'
import ArchiveExport from '../archive-export/ArchiveExport.vue'
import ExportTemplate from '../export-template/ExportTemplate.vue'

type TabKey = 'export' | 'template'

interface HubTab {
  key: TabKey
  label: string
  /** 该 tab 所需权限码，任一命中即可见 */
  permissions: string[]
  /**
   * 授权数据未就绪（permissions 为空，见 ROLE_BASELINE_MODULES）时是否仍展示本 tab。
   * 取值依据 = **改造前该入口是否对教师可见**：档案导出 = 可见（原 `archive-export` 模块
   * 在改造前的前端教师菜单里），导出模板 = 不可见（原 `export-template` 仅管理员）。
   *
   * 没有这一项的话，教师（permissions 为空）虽能经模块基线进入本页，但两个 tab 都过不了
   * canAccessAny，页面会渲染成一个**没有任何 tab 的空白页**。
   */
  baselineVisible: boolean
  component: Component
}

/**
 * 两个 tab 权限码不同：模块级 isModuleAllowed 是 any-of，持 export:execute 的教师
 * 能进本页但不应对其显示「导出模板」tab，故按 tab 过滤。
 * canAccessAny 与 isModuleAllowed 同序（admin 角色直通），不会误伤 permissions 为空的
 * 线上管理员 —— 裸用 hasPermission 会把管理员的「导出模板」tab 隐藏掉。
 */
const TABS: HubTab[] = [
  {
    key: 'export',
    label: '档案导出',
    permissions: ['export:execute', 'export:manage'],
    baselineVisible: true,
    component: ArchiveExport,
  },
  {
    key: 'template',
    label: '导出模板',
    permissions: ['export:template:manage'],
    baselineVisible: false,
    component: ExportTemplate,
  },
]

const { canAccessAny, baselineFallback } = useTeacherAuthz()

const visibleTabs: ComputedRef<HubTab[]> = computed(() =>
  TABS.filter(
    (tab) => canAccessAny(tab.permissions) || (baselineFallback.value && tab.baselineVisible),
  ),
)

const availableKeys: ComputedRef<TabKey[]> = computed(() => visibleTabs.value.map((t) => t.key))

const { activeTab } = useTabRoute<TabKey>(availableKeys, 'export')
</script>

<template>
  <div class="mc-page export-center">
    <el-tabs v-model="activeTab" class="export-center__tabs">
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
.export-center {
  // 子页面自带 mc-page-head（含标题与操作按钮），Tabs 内容区顶部留白衔接
  &__tabs {
    :deep(.el-tabs__content) {
      padding-top: $spacing-md;
    }
  }
}
</style>
