import { createRouter, createWebHistory } from 'vue-router'

import StudentLayout from '../views/student/StudentLayout.vue'

import StudentDashboard from '../views/student/pages/StudentDashboard.vue'
import StudentTimeline from '../views/student/pages/StudentTimeline.vue'
import StudentArchiveCategory from '../views/student/pages/StudentArchiveCategory.vue'
import StudentSubmissions from '../views/student/pages/StudentSubmissions.vue'
import StudentProfile from '../views/student/pages/StudentProfile.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/student/dashboard' },
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
    { path: '/:pathMatch(.*)*', redirect: '/student/dashboard' },
  ],
})

export default router
