import type { RouteRecordRaw } from 'vue-router'

/**
 * 教师端路由配置
 * 所有路由前缀为 /teacher，由 TeacherLayout 包裹
 */
const teacherRoutes: RouteRecordRaw[] = [
  {
    path: 'dashboard',
    name: 'TeacherDashboard',
    component: () => import('@/features/teacher/dashboard/TeacherDashboard.vue'),
    meta: { title: '教师首页', affix: true, teacher: true },
  },
  {
    path: 'archive-view',
    name: 'TeacherArchiveView',
    component: () => import('@/features/teacher/archive-view/ArchiveView.vue'),
    meta: { title: '档案查看', teacher: true, permission: 'archive-view' },
  },
  {
    path: 'archive-export',
    name: 'TeacherArchiveExport',
    component: () => import('@/features/teacher/archive-export/ArchiveExport.vue'),
    meta: { title: '档案导出', teacher: true, permission: 'archive-export' },
  },
  {
    path: 'material-review',
    redirect: '/teacher/material-review/college',
    children: [
      {
        path: 'college',
        name: 'TeacherMaterialReviewCollege',
        component: () => import('@/features/teacher/material-review/CollegeReview.vue'),
        meta: { title: '院领导审核', teacher: true, permission: 'material-review' },
      },
      {
        path: 'department',
        name: 'TeacherMaterialReviewDepartment',
        component: () => import('@/features/teacher/material-review/DepartmentReview.vue'),
        meta: { title: '系领导审核', teacher: true, permission: 'material-review' },
      },
    ],
  },
  {
    path: 'heat-map',
    name: 'TeacherHeatMap',
    component: () => import('@/features/teacher/heat-map/HeatMap.vue'),
    meta: { title: '成果热力图', teacher: true, permission: 'heat-map' },
  },
  {
    path: 'log-view',
    name: 'TeacherLogView',
    component: () => import('@/features/teacher/log-view/LogView.vue'),
    meta: { title: '日志查看', teacher: true, permission: 'log-view' },
  },
  {
    path: 'role-selection',
    redirect: '/teacher/role-selection/adjust',
    children: [
      {
        path: 'adjust',
        name: 'TeacherRoleAdjust',
        component: () => import('@/features/teacher/role-selection/RoleAdjust.vue'),
        meta: { title: '教师职位调整', teacher: true, permission: 'role-selection' },
      },
      {
        path: 'add',
        name: 'TeacherRoleAdd',
        component: () => import('@/features/teacher/role-selection/RoleAdd.vue'),
        meta: { title: '新增账号', teacher: true, permission: 'role-selection' },
      },
    ],
  },
  {
    path: 'form-customization',
    name: 'TeacherFormCustomization',
    component: () => import('@/features/teacher/form-customization/FormCustomization.vue'),
    meta: { title: '表单自定义', teacher: true, permission: 'form-customization' },
  },
  {
    path: 'account-management',
    redirect: '/teacher/account-management/student',
    children: [
      {
        path: 'student',
        name: 'TeacherAccountStudent',
        component: () => import('@/features/teacher/account-management/StudentAccount.vue'),
        meta: { title: '学生账号管理', teacher: true, permission: 'account-management' },
      },
      {
        path: 'teacher',
        name: 'TeacherAccountTeacher',
        component: () => import('@/features/teacher/account-management/TeacherAccount.vue'),
        meta: { title: '教师账号管理', teacher: true, permission: 'account-management' },
      },
    ],
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
]

export default teacherRoutes
