import type { ComputedRef, Ref } from 'vue'
import type { TeacherDashboardOverview } from '@/shared/types/teacher'
import {
  Activity,
  Bell,
  BookOpen,
  ClipboardCheck,
  Download,
  Eye,
  MapPin,
  TrendingUp,
  Users,
} from 'lucide-vue-next'
import { computed } from 'vue'

/**
 * 教师端首页展示配置 —— 统计卡片、待办 KPI、快捷入口与日期。
 *
 * 说明：本页不含 ECharts 图表，此处集中承载等价于「图表 option」的展示配置
 * （卡片文案 / 颜色 / 图标、KPI 字段映射、快捷入口清单），
 * 页面 SFC 只保留数据请求、刷新与跳转等交互回调。所有字段与文案与原实现逐字一致。
 */
export function useDashboardOption(params: {
  canViewSystemLogs: ComputedRef<boolean>
  unreadCount: Ref<number | null>
  scopeText: Ref<string>
  recentTotal: Ref<number | null>
  roleLabel: ComputedRef<string>
  dashboardOverview: Ref<TeacherDashboardOverview | null>
  canAccessModule: (moduleId: string) => boolean
}) {
  const {
    canViewSystemLogs,
    unreadCount,
    scopeText,
    recentTotal,
    roleLabel,
    dashboardOverview,
    canAccessModule,
  } = params

  const pendingItems = computed(() => [
    {
      label: '档案待审',
      value: dashboardOverview.value?.pendingStats.archivePending ?? '—',
      icon: BookOpen,
      color: 'var(--el-color-primary)',
    },
    {
      label: '奖项待审',
      value: dashboardOverview.value?.pendingStats.awardPending ?? '—',
      icon: TrendingUp,
      color: 'var(--el-color-warning)',
    },
    {
      label: '规划待审',
      value: dashboardOverview.value?.pendingStats.careerPlanPending ?? '—',
      icon: ClipboardCheck,
      color: 'var(--el-color-danger)',
    },
    {
      label: '今日审核',
      value: dashboardOverview.value?.todayAudited ?? '—',
      icon: Activity,
      color: 'var(--el-color-success)',
    },
  ])

  const statsCards = computed(() => [
    {
      label: '未读消息',
      value: unreadCount.value ?? '—',
      icon: Bell,
      color: 'var(--el-color-primary)',
    },
    {
      label: '数据范围',
      value: scopeText.value || '—',
      icon: MapPin,
      color: 'var(--el-color-success)',
    },
    {
      label: canViewSystemLogs.value ? '系统操作' : '消息总数',
      value: recentTotal.value ?? '—',
      icon: Activity,
      color: 'var(--el-color-warning)',
    },
    { label: '当前角色', value: roleLabel.value, icon: Users, color: 'var(--el-color-danger)' },
  ])

  /**
   * 快捷入口：每项按对应模块的权限码判定，与侧边栏菜单同源（teacherModuleRegistry），
   * 避免「菜单里没有、首页快捷方式却能进」的不一致。
   */
  const quickLinkCandidates = [
    {
      moduleId: 'archive-view',
      label: '档案查看',
      icon: Eye,
      path: '/teacher/archive-view',
      desc: '查看学生档案信息',
    },
    {
      moduleId: 'export-center',
      label: '导出中心',
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
      desc: '管理学生与教师账号',
    },
    {
      moduleId: 'form-customization',
      label: '表单自定义',
      icon: BookOpen,
      path: '/teacher/form-customization',
      desc: '维护申报菜单与模板',
    },
  ]

  const quickLinks = computed(() =>
    quickLinkCandidates.filter((link) => canAccessModule(link.moduleId)),
  )

  const todayDate = computed(() => {
    return new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    })
  })

  return { pendingItems, statsCards, quickLinks, todayDate }
}
