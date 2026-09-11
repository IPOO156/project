import type { RouteRecordRaw } from 'vue-router'

/**
 * 教师端路由配置
 * 所有路由前缀为 /teacher，由 TeacherLayout 包裹
 *
 * meta.permission 承载的是**模块 id**（对应 shared/config/teacherModuleRegistry.ts 的 id，
 * 如 'archive-view'），不是后端权限码 —— 守卫据此在注册表里查出该模块所需的权限码再判定。
 * 因此模块 id 写错等于未授权（守卫按未知模块处理，重定向回 /teacher/dashboard）。
 */
const teacherRoutes: RouteRecordRaw[] = [
  {
    path: 'dashboard',
    name: 'TeacherDashboard',
    component: () => import('@/features/teacher/dashboard/TeacherDashboard.vue'),
    meta: { title: '首页', affix: true, teacher: true },
  },
  {
    path: 'archive-view',
    name: 'TeacherArchiveView',
    component: () => import('@/features/teacher/archive-view/ArchiveView.vue'),
    meta: { title: '档案查看', teacher: true, permission: 'archive-view' },
  },
  {
    path: 'student-detail/:userId',
    name: 'TeacherStudentDetail',
    component: () => import('@/features/teacher/student-detail/StudentDetail.vue'),
    meta: { title: '学生成长档案', teacher: true, permission: 'archive-view' },
  },
  {
    path: 'material-review',
    redirect: '/teacher/material-review/pending',
    children: [
      {
        path: 'pending',
        name: 'TeacherMaterialReviewPending',
        component: () => import('@/features/teacher/material-review/AuditPendingList.vue'),
        meta: { title: '材料审核', teacher: true, permission: 'material-review' },
      },
      {
        path: 'history',
        name: 'TeacherMaterialReviewHistory',
        component: () => import('@/features/teacher/material-review/AuditHistory.vue'),
        meta: { title: '审核记录', teacher: true, permission: 'material-review' },
      },
    ],
  },
  {
    path: 'messages',
    name: 'TeacherMessageCenter',
    component: () => import('@/features/teacher/messages/TeacherMessageCenter.vue'),
    meta: { title: '消息中心', teacher: true },
  },
  {
    path: 'org-management',
    name: 'TeacherOrgManagement',
    component: () => import('@/features/teacher/organization/OrganizationManagement.vue'),
    meta: { title: '组织架构', teacher: true, permission: 'org-management' },
  },
  {
    path: 'heat-map',
    name: 'TeacherHeatMap',
    component: () => import('@/features/teacher/heat-map/HeatMap.vue'),
    meta: { title: '成果热力图', teacher: true, permission: 'heat-map' },
  },
  {
    // 审批委托：业务口径为「管理员 → 教师」，教师不可互相委托。
    // 对应注册表模块 delegation 目前只挂管理员菜单码，教师访问会被守卫拦回教师首页。
    path: 'delegation',
    name: 'TeacherDelegation',
    component: () => import('@/features/teacher/delegation/DelegationManage.vue'),
    meta: { title: '审批委托管理', teacher: true, permission: 'delegation' },
  },
  {
    path: 'log-view',
    name: 'TeacherLogView',
    component: () => import('@/features/teacher/log-view/LogView.vue'),
    meta: { title: '日志查看', teacher: true, permission: 'log-view' },
  },
  {
    // 能力维度 + 指标配置合并为单页 Tab（原两个一级菜单，permissions 相同）。
    // singleTab：页内用 ?tab=xxx 切换，顶栏共用一个标签（见 useTabs.resolveSingleTab）。
    path: 'indicator-system',
    name: 'TeacherIndicatorSystem',
    component: () => import('@/features/teacher/indicator-system/IndicatorSystem.vue'),
    meta: { title: '指标体系', teacher: true, permission: 'indicator-system', singleTab: true },
  },
  {
    path: 'score-recalculate',
    name: 'TeacherScoreRecalculate',
    component: () => import('@/features/teacher/score-recalculate/ScoreRecalculate.vue'),
    meta: { title: '评分重算', teacher: true, permission: 'score-recalculate' },
  },
  {
    // 档案导出 + 导出模板合并为单页 Tab（原两个一级菜单，同一业务对象的两端）。
    // singleTab：页内用 ?tab=xxx 切换，顶栏共用一个标签（见 useTabs.resolveSingleTab）。
    path: 'export-center',
    name: 'TeacherExportCenter',
    component: () => import('@/features/teacher/export-center/ExportCenter.vue'),
    meta: { title: '导出中心', teacher: true, permission: 'export-center', singleTab: true },
  },
  {
    path: 'approval-flow',
    name: 'TeacherApprovalFlow',
    component: () => import('@/features/teacher/approval-flow/ApprovalFlow.vue'),
    meta: { title: '审批流程', teacher: true, permission: 'approval-flow' },
  },
  {
    path: 'system-management',
    name: 'TeacherSystemManagement',
    component: () => import('@/features/teacher/system-management/SystemManagement.vue'),
    meta: { title: '系统管理', teacher: true, permission: 'system-management' },
  },
  {
    // 角色选择（职位调整 / 新增账号）+ 账号管理（学生 / 教师）合并为单页 Tab。
    // 子页收进页内 Tab，故原侧边栏 el-sub-menu 消失 —— 属预期 IA 变化，功能未减。
    // singleTab：页内用 ?tab=xxx 切换，顶栏共用一个标签（见 useTabs.resolveSingleTab）。
    path: 'account-role',
    name: 'TeacherAccountRole',
    component: () => import('@/features/teacher/account-role/AccountRole.vue'),
    meta: { title: '账号与角色', teacher: true, permission: 'account-role', singleTab: true },
  },
  {
    path: 'form-customization',
    name: 'TeacherFormCustomization',
    component: () => import('@/features/teacher/form-customization/FormCustomization.vue'),
    meta: { title: '表单自定义', teacher: true, permission: 'form-customization' },
  },
  {
    path: 'system-config',
    name: 'TeacherSystemConfig',
    component: () => import('@/features/teacher/system-config/SystemConfig.vue'),
    meta: { title: '系统配置', teacher: true, permission: 'system-config' },
  },
  {
    path: 'scheduled-task',
    name: 'TeacherScheduledTask',
    component: () => import('@/features/teacher/scheduled-task/ScheduledTask.vue'),
    meta: { title: '定时任务', teacher: true, permission: 'scheduled-task' },
  },
  {
    path: 'system-maintenance',
    redirect: '/teacher/system-maintenance/hardware',
    children: [
      {
        path: 'hardware',
        name: 'TeacherHardwareMaintenance',
        component: () => import('@/features/teacher/system-maintenance/HardwareMaintenance.vue'),
        meta: { title: '硬件维护', teacher: true, permission: 'system-maintenance' },
      },
      {
        path: 'software',
        name: 'TeacherSoftwareMaintenance',
        component: () => import('@/features/teacher/system-maintenance/SoftwareMaintenance.vue'),
        meta: { title: '软件维护', teacher: true, permission: 'system-maintenance' },
      },
    ],
  },
  {
    path: 'info-security',
    redirect: '/teacher/info-security/network',
    children: [
      {
        path: 'network',
        name: 'TeacherNetworkSecurity',
        component: () => import('@/features/teacher/info-security/NetworkSecurity.vue'),
        meta: { title: '网络安全', teacher: true, permission: 'info-security' },
      },
      {
        path: 'data',
        name: 'TeacherDataSecurity',
        component: () => import('@/features/teacher/info-security/DataSecurity.vue'),
        meta: { title: '数据安全', teacher: true, permission: 'info-security' },
      },
    ],
  },

  /* ===================== 旧路径兜底 =====================
   * 页面框架合并后，原一级菜单的 URL 变为 query 形式的 tab。
   * 这些 redirect 记录是为了让旧书签 / 旧 sessionStorage 标签 / 浏览器历史仍能落地，
   * 属纯跳转记录：不需要 meta.permission（vue-router 在导航解析阶段先解 redirect，
   * 守卫只对最终目标跑一次，权限判定落在目标路由上）。
   */
  { path: 'archive-export', redirect: '/teacher/export-center?tab=export' },
  { path: 'export-template', redirect: '/teacher/export-center?tab=template' },
  { path: 'ability-dimension', redirect: '/teacher/indicator-system?tab=dimension' },
  { path: 'indicator', redirect: '/teacher/indicator-system?tab=indicator' },
  { path: 'role-selection', redirect: '/teacher/account-role?tab=adjust' },
  { path: 'role-selection/adjust', redirect: '/teacher/account-role?tab=adjust' },
  { path: 'role-selection/add', redirect: '/teacher/account-role?tab=add' },
  { path: 'account-management', redirect: '/teacher/account-role?tab=student' },
  { path: 'account-management/student', redirect: '/teacher/account-role?tab=student' },
  { path: 'account-management/teacher', redirect: '/teacher/account-role?tab=teacher' },
]

export default teacherRoutes
