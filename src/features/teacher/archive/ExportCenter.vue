<script setup lang="ts">
/**
 * ExportCenter - 导出中心（教师端）
 *
 * 将原「档案导出」「导出模板」「表单自定义」三个一级菜单聚合为单页 Tabs：
 * 导出页的模板下拉取自 getTeacherExportTemplates，模板页对**同一业务对象**做 CRUD /
 * 设默认 / 启停；表单模板决定档案字段结构，同属模板维护。
 *
 * 三个叶子页原地保留（各自维护数据与操作），tab 首次激活时懒加载，
 * 切换不销毁已加载的 tab，子页状态得以保留。
 */
import type { Component, ComputedRef } from 'vue'
import { computed } from 'vue'

import { useTabRoute } from '@/shared/composables/useTabRoute'
import { useTeacherAuthz } from '@/shared/composables/useTeacherAuthz'
import { ADMIN_MENU_CODE } from '@/shared/config/teacherModuleRegistry'
import ArchiveExport from './ArchiveExport.vue'
import ExportTemplate from './ExportTemplate.vue'
import FormCustomization from './FormCustomization.vue'

type TabKey = 'export' | 'template' | 'forms'

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
   * 没有这一项的话，教师（permissions 为空）虽能经模块基线进入本页，但各 tab 都过不了
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
 *
 * 「档案导出」tab 对应三个后端码：教师端列表/提交/模板为 export:execute，
 * 研究数据导出为 export:research，成绩导入为 grade:import。export:manage 只约束
 * /admin/exports/{jobId} 单任务查询，不代表能使用教师端导出，故不放入本 tab。
 */
const TABS: HubTab[] = [
  {
    key: 'export',
    label: '档案导出',
    permissions: ['export:execute', 'export:research', 'grade:import'],
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
  {
    // 原「表单自定义」入口：表单模板决定档案字段结构，与导出模板同属模板维护。
    // 后端 /admin/form-templates 无专属权限码，暂以表单模板码 + 管理员代理码放行。
    key: 'forms',
    label: '表单模板',
    permissions: ['form:template:manage', ADMIN_MENU_CODE],
    baselineVisible: false,
    component: FormCustomization,
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
  <div class="mc-page hub-page export-center">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <h2 class="mc-page-head__title">档案导出</h2>
        <p class="mc-page-head__desc">创建学生档案导出任务，维护导出模板与表单字段模板。</p>
      </div>
    </div>

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
