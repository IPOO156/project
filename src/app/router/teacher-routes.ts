import type { RouteRecordRaw } from 'vue-router'

/**
 * 教师端路由配置
 * 所有路由前缀为 /teacher，由 DefaultLayout 包裹
 *
 * meta.permission 承载的是**模块 id**（对应 shared/config/teacherModuleRegistry.ts 的 id，
 * 如 'archive-view'），不是后端权限码 —— 守卫据此在注册表里查出该模块所需的权限码再判定。
 * 因此模块 id 写错等于未授权（守卫按未知模块处理，重定向回 /teacher/dashboard）。
 *
 * 聚合页统一使用 `?tab=` 承载页内页签，并标记 meta.singleTab（见 useTabs / useTabRoute）。
 * 合并后原入口的 URL 在文件末尾保留 redirect，旧书签仍能落到对应页签。
 */
const teacherRoutes: RouteRecordRaw[] = [
  {
    path: 'dashboard',
    name: 'TeacherDashboard',
    component: () => import('@/features/teacher/ops/TeacherDashboard.vue'),
    meta: { title: '工作台', affix: true, teacher: true },
  },
  {
    path: 'archive-view',
    name: 'TeacherArchiveView',
    component: () => import('@/features/teacher/archive/ArchiveView.vue'),
    meta: { title: '学生档案', teacher: true, permission: 'archive-view' },
  },
  {
    path: 'student-detail/:userId',
    name: 'TeacherStudentDetail',
    component: () => import('@/features/teacher/archive/StudentDetail.vue'),
    meta: { title: '学生成长档案', teacher: true, permission: 'archive-view' },
  },
  {
    // 待审核 + 审核记录 + 审批委托合并为单页 Tab（原三个独立入口）。
    path: 'material-review',
    name: 'TeacherMaterialReview',
    component: () => import('@/features/teacher/review/MaterialReview.vue'),
    meta: { title: '材料审核', teacher: true, permission: 'material-review', singleTab: true },
  },
  {
    path: 'messages',
    name: 'TeacherMessageCenter',
    component: () => import('@/features/teacher/ops/TeacherMessageCenter.vue'),
    meta: { title: '消息中心', teacher: true, permission: 'messages' },
  },
  {
    path: 'org-management',
    name: 'TeacherOrgManagement',
    component: () => import('@/features/teacher/org/OrganizationManagement.vue'),
    meta: { title: '组织架构', teacher: true, permission: 'org-management' },
  },
  {
    path: 'heat-map',
    name: 'TeacherHeatMap',
    component: () => import('@/features/teacher/ops/HeatMap.vue'),
    meta: { title: '成果热力图', teacher: true, permission: 'heat-map' },
  },
  {
    // 能力维度 + 指标配置 + 评分重算合并为单页 Tab。
    path: 'indicator-system',
    name: 'TeacherIndicatorSystem',
    component: () => import('@/features/teacher/review/IndicatorSystem.vue'),
    meta: { title: '指标体系', teacher: true, permission: 'indicator-system', singleTab: true },
  },
  {
    // 档案导出 + 导出模板 + 表单模板合并为单页 Tab。
    path: 'export-center',
    name: 'TeacherExportCenter',
    component: () => import('@/features/teacher/archive/ExportCenter.vue'),
    meta: { title: '档案导出', teacher: true, permission: 'export-center', singleTab: true },
  },
  {
    path: 'approval-flow',
    name: 'TeacherApprovalFlow',
    component: () => import('@/features/teacher/review/ApprovalFlow.vue'),
    meta: { title: '审批流程', teacher: true, permission: 'approval-flow' },
  },
  {
    // 学生账号 / 教师账号 / 教师职位调整 / 新增账号 / 角色管理合并为单页 Tab。
    path: 'account-role',
    name: 'TeacherAccountRole',
    component: () => import('@/features/teacher/org/AccountRole.vue'),
    meta: { title: '账号与角色', teacher: true, permission: 'account-role', singleTab: true },
  },
  {
    // 数据字典 / 学期 / 系统配置 / 定时任务 / 操作日志合并为单页 Tab。
    path: 'system-settings',
    name: 'TeacherSystemSettings',
    component: () => import('@/features/teacher/org/SystemSettings.vue'),
    meta: { title: '系统设置', teacher: true, permission: 'system-settings', singleTab: true },
  },
  /* 硬件维护 / 软件维护 / 网络安全 / 数据安全台账 四条路由已删除：
   * 后端无任何对应接口，页面 100% 为写死的假数据（原问题清单 B-15）。
   * 产品口径已定「删页」（2026-10-10），故连带路由与页面一并移除，
   * 避免注册即可由 URL 直达的假数据页。 */

  /* ===================== 旧路径兜底 =====================
   * 页面框架合并后，原一级菜单的 URL 变为 query 形式的 tab。
   * 这些 redirect 记录是为了让旧书签 / 旧 sessionStorage 标签 / 浏览器历史仍能落地，
   * 属纯跳转记录：不需要 meta.permission（vue-router 在导航解析阶段先解 redirect，
   * 守卫只对最终目标跑一次，权限判定落在目标路由上）。
   */
  { path: 'material-review/pending', redirect: '/teacher/material-review?tab=pending' },
  { path: 'material-review/history', redirect: '/teacher/material-review?tab=history' },
  { path: 'delegation', redirect: '/teacher/material-review?tab=delegation' },

  { path: 'archive-export', redirect: '/teacher/export-center?tab=export' },
  { path: 'export-template', redirect: '/teacher/export-center?tab=template' },
  { path: 'form-customization', redirect: '/teacher/export-center?tab=forms' },

  { path: 'ability-dimension', redirect: '/teacher/indicator-system?tab=dimension' },
  { path: 'indicator', redirect: '/teacher/indicator-system?tab=indicator' },
  { path: 'score-recalculate', redirect: '/teacher/indicator-system?tab=recalculate' },

  { path: 'role-selection', redirect: '/teacher/account-role?tab=adjust' },
  { path: 'role-selection/adjust', redirect: '/teacher/account-role?tab=adjust' },
  { path: 'role-selection/add', redirect: '/teacher/account-role?tab=add' },
  { path: 'account-management', redirect: '/teacher/account-role?tab=student' },
  { path: 'account-management/student', redirect: '/teacher/account-role?tab=student' },
  { path: 'account-management/teacher', redirect: '/teacher/account-role?tab=teacher' },

  {
    // 原系统管理内含角色 Tab，合并后角色管理迁到「账号与角色」。
    path: 'system-management',
    redirect: (to) => {
      const tab = typeof to.query.tab === 'string' ? to.query.tab : 'dict'
      return tab === 'role'
        ? { path: '/teacher/account-role', query: { tab: 'role' } }
        : { path: '/teacher/system-settings', query: { tab } }
    },
  },
  { path: 'system-config', redirect: '/teacher/system-settings?tab=config' },
  { path: 'scheduled-task', redirect: '/teacher/system-settings?tab=tasks' },
  { path: 'log-view', redirect: '/teacher/system-settings?tab=logs' },
]

export default teacherRoutes
