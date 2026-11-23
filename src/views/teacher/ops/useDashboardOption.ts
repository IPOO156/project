import type { Ref } from 'vue'
import type { TeacherDashboardOverview } from '@/shared/types/teacher'
import { ClipboardCheck, Download, Eye, Settings, TrendingUp, Users } from 'lucide-vue-next'
import { computed } from 'vue'

/**
 * 教师端工作台展示配置 —— 待办 KPI、快捷入口与日期。
 *
 * 页面 SFC 只保留数据请求、刷新与跳转；这里集中维护文案与入口清单，
 * 快捷入口按模块权限过滤，与侧栏菜单同源（teacherModuleRegistry）。
 */
export function useDashboardOption(params: {
  dashboardOverview: Ref<TeacherDashboardOverview | null>
  canAccessModule: (moduleId: string) => boolean
}) {
  const { dashboardOverview, canAccessModule } = params

  const pendingItems = computed(() => [
    {
      label: '档案待审',
      value: dashboardOverview.value?.pendingStats?.archivePending ?? '—',
    },
    {
      label: '奖项待审',
      value: dashboardOverview.value?.pendingStats?.awardPending ?? '—',
    },
    {
      label: '规划待审',
      value: dashboardOverview.value?.pendingStats?.careerPlanPending ?? '—',
    },
    {
      label: '今日审核',
      value: dashboardOverview.value?.todayAudited ?? '—',
    },
  ])

  /**
   * 快捷入口：每项按对应模块的权限码判定，与侧边栏菜单同源（teacherModuleRegistry），
   * 避免「菜单里没有、首页快捷方式却能进」的不一致。
   */
  const quickLinkCandidates = [
    {
      moduleId: 'archive-view',
      label: '学生档案',
      icon: Eye,
      path: '/teacher/archive-view',
      desc: '查看学生档案信息',
    },
    {
      moduleId: 'export-center',
      label: '档案导出',
      icon: Download,
      path: '/teacher/export-center',
      desc: '导出学生档案数据',
    },
    {
      moduleId: 'material-review',
      label: '材料审核',
      icon: ClipboardCheck,
      path: '/teacher/material-review',
      desc: '审核学生提交的材料',
    },
    {
      moduleId: 'heat-map',
      label: '成果热力图',
      icon: TrendingUp,
      path: '/teacher/heat-map',
      desc: '学生成果数据可视化',
    },
    {
      moduleId: 'account-role',
      label: '账号与角色',
      icon: Users,
      path: '/teacher/account-role',
      desc: '管理账号、角色与数据范围',
    },
    {
      moduleId: 'system-settings',
      label: '系统设置',
      icon: Settings,
      path: '/teacher/system-settings',
      desc: '字典、学期、任务与日志',
    },
  ]

  const quickLinks = computed(() =>
    quickLinkCandidates.filter((link) => canAccessModule(link.moduleId)),
  )

  const todayDate = computed(() =>
    new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }),
  )

  return { pendingItems, quickLinks, todayDate }
}
