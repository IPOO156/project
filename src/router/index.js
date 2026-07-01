import { createRouter, createWebHistory } from 'vue-router'

import LoginPage from '../views/login/LoginPage.vue'

import StudentLayout from '../views/student/StudentLayout.vue'
import StudentDashboard from '../views/student/pages/StudentDashboard.vue'
import StudentTimeline from '../views/student/pages/StudentTimeline.vue'
import StudentArchiveCategory from '../views/student/pages/StudentArchiveCategory.vue'
import StudentSubmissions from '../views/student/pages/StudentSubmissions.vue'
import StudentProfile from '../views/student/pages/StudentProfile.vue'

import TeacherLayout from '../views/teacher/TeacherLayout.vue'
import TeacherDashboard from '../views/teacher/pages/TeacherDashboard.vue'
import TeacherReview from '../views/teacher/pages/TeacherReview.vue'
import TeacherStats from '../views/teacher/pages/TeacherStats.vue'
import TeacherExport from '../views/teacher/pages/TeacherExport.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },

    // ── 登录页 ──
    { path: '/login', component: LoginPage, meta: { title: '登录' } },

    // ── 学生端 ──
    {
      path: '/student',
      component: StudentLayout,
      children: [
        {
          path: 'dashboard',
          component: StudentDashboard,
          meta: { title: '我的档案概览', section: '学生端' },
        },
        {
          path: 'timeline',
          component: StudentTimeline,
          meta: { title: '成长时间轴', section: '学生端' },
        },
        {
          path: 'archive/:category',
          component: StudentArchiveCategory,
          meta: { title: '成长档案', section: '学生端' },
        },
        {
          path: 'submissions',
          component: StudentSubmissions,
          meta: { title: '提交记录', section: '学生端' },
        },
        {
          path: 'profile',
          component: StudentProfile,
          meta: { title: '个人中心', section: '学生端' },
        },
      ],
    },

    // ── 教师端 ──
    {
      path: '/teacher',
      component: TeacherLayout,
      children: [
        {
          path: 'dashboard',
          component: TeacherDashboard,
          meta: { title: '审核总览', section: '教师端' },
        },
        {
          path: 'review',
          component: TeacherReview,
          meta: { title: '审核管理', section: '教师端' },
        },
        {
          path: 'stats',
          component: TeacherStats,
          meta: { title: '统计分析', section: '教师端' },
        },
        {
          path: 'export',
          component: TeacherExport,
          meta: { title: '导出管理', section: '教师端' },
        },
      ],
    },

    { path: '/:pathMatch(.*)*', redirect: '/login' },
  ],
})

export default router
