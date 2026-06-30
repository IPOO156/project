import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/features/auth/pages/Login.vue'),
    meta: { title: '登录', noLayout: true },
  },
  {
    path: '/',
    component: () => import('@/app/layouts/DefaultLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/features/dashboard/pages/Dashboard.vue'),
        meta: { title: '首页' },
      },
      // ─── 个人中心 ───
      {
        path: 'profile',
        redirect: '/profile/info',
        children: [
          {
            path: 'edit-password',
            name: 'EditPassword',
            component: () => import('@/features/profile/pages/EditPassword.vue'),
            meta: { title: '修改密码' },
          },
          {
            path: 'info',
            name: 'ProfileInfo',
            component: () => import('@/features/profile/pages/ProfileInfo.vue'),
            meta: { title: '个人档案信息' },
          },
          {
            path: 'timeline',
            name: 'Timeline',
            component: () => import('@/features/profile/pages/Timeline.vue'),
            meta: { title: '成长时间轴' },
          },
          {
            path: 'career-plan',
            name: 'CareerPlan',
            component: () => import('@/features/profile/pages/CareerPlan.vue'),
            meta: { title: '职业规划' },
          },
        ],
      },
      // ─── 各类申报板块 ───
      {
        path: 'applications',
        redirect: '/applications/competition',
        children: [
          {
            path: 'competition',
            name: 'Competition',
            component: () => import('@/features/applications/competition/pages/CompetitionList.vue'),
            meta: { title: '学科竞赛' },
          },
          {
            path: 'innovation',
            name: 'Innovation',
            component: () => import('@/features/applications/innovation/pages/InnovationList.vue'),
            meta: { title: '创新创业' },
          },
          {
            path: 'research',
            name: 'AcademicResearch',
            component: () => import('@/features/applications/research/pages/ResearchList.vue'),
            meta: { title: '学术研究' },
          },
          {
            path: 'scholarship',
            name: 'Scholarship',
            component: () => import('@/features/applications/scholarship/pages/ScholarshipList.vue'),
            meta: { title: '奖学金' },
          },
          {
            path: 'certificate',
            name: 'HonorCertificate',
            component: () => import('@/features/applications/certificate/pages/CertificateList.vue'),
            meta: { title: '荣誉证书' },
          },
          {
            path: 'internship',
            name: 'Internship',
            component: () => import('@/features/applications/internship/pages/InternshipList.vue'),
            meta: { title: '实习经历' },
          },
          {
            path: 'organization',
            name: 'OrganizationExp',
            component: () => import('@/features/applications/organization/pages/OrganizationList.vue'),
            meta: { title: '组织履历' },
          },
          {
            path: 'training',
            name: 'TrainingProject',
            component: () => import('@/features/applications/training/pages/TrainingList.vue'),
            meta: { title: '实训项目' },
          },
          {
            path: 'social-practice',
            name: 'SocialPractice',
            component: () => import('@/features/applications/social-practice/pages/SocialPracticeList.vue'),
            meta: { title: '社会实践' },
          },
          {
            path: 'book-report',
            name: 'BookReport',
            component: () => import('@/features/applications/book-report/pages/BookReportList.vue'),
            meta: { title: '图书心得' },
          },
          {
            path: 'competition-star',
            name: 'CompetitionStar',
            component: () => import('@/features/applications/competition-star/pages/CompetitionStarList.vue'),
            meta: { title: '竞赛之星报名' },
          },
          {
            path: 'scientific-project',
            name: 'ScientificProject',
            component: () => import('@/features/applications/scientific-project/pages/ScientificProjectList.vue'),
            meta: { title: '科研项目' },
          },
          {
            path: 'scientific-star',
            name: 'ScientificStar',
            component: () => import('@/features/applications/scientific-star/pages/ScientificStarList.vue'),
            meta: { title: '科研之星报名' },
          },
        ],
      },
      // ─── 审批与记录 ───
      {
        path: 'approval',
        children: [
          {
            path: 'pending',
            name: 'ApprovalPending',
            component: () => import('@/features/approval/pages/PendingApproval.vue'),
            meta: { title: '待审批信息' },
          },
          {
            path: 'records',
            name: 'ApprovalRecords',
            component: () => import('@/features/approval/pages/SubmitRecords.vue'),
            meta: { title: '提交记录' },
          },
        ],
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  if (to.name !== 'Login' && !token) {
    next({ name: 'Login' })
  }
  else if (to.name === 'Login' && token) {
    next({ path: '/dashboard' })
  }
  else {
    next()
  }
})

export default router
