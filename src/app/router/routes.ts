import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/features/auth/Login.vue'),
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
        component: () => import('@/features/dashboard/Dashboard.vue'),
        meta: { title: '首页', affix: true },
      },
      // ─── 个人中心 ───
      {
        path: 'profile',
        redirect: '/profile/info',
        children: [
          {
            path: 'edit-password',
            name: 'EditPassword',
            component: () => import('@/features/profile/EditPassword.vue'),
            meta: { title: '修改密码' },
          },
          {
            path: 'info',
            name: 'ProfileInfo',
            component: () => import('@/features/profile/ProfileInfo.vue'),
            meta: { title: '个人档案信息' },
          },
          {
            path: 'timeline',
            name: 'Timeline',
            component: () => import('@/features/profile/Timeline.vue'),
            meta: { title: '成长时间轴' },
          },
          {
            path: 'career-plan',
            name: 'CareerPlan',
            component: () => import('@/features/profile/CareerPlan.vue'),
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
            component: () => import('@/features/applications/competition/CompetitionList.vue'),
            meta: { title: '学科竞赛' },
          },
          {
            path: 'innovation',
            name: 'Innovation',
            component: () => import('@/features/applications/innovation/InnovationList.vue'),
            meta: { title: '创新创业' },
          },
          {
            path: 'research',
            name: 'AcademicResearch',
            component: () => import('@/features/applications/research/ResearchList.vue'),
            meta: { title: '学术研究' },
          },
          {
            path: 'scholarship',
            name: 'Scholarship',
            component: () => import('@/features/applications/scholarship/ScholarshipList.vue'),
            meta: { title: '奖学金' },
          },
          {
            path: 'certificate',
            name: 'HonorCertificate',
            component: () => import('@/features/applications/certificate/CertificateList.vue'),
            meta: { title: '荣誉证书' },
          },
          {
            path: 'internship',
            name: 'Internship',
            component: () => import('@/features/applications/internship/InternshipList.vue'),
            meta: { title: '实习经历' },
          },
          {
            path: 'organization',
            name: 'OrganizationExp',
            component: () => import('@/features/applications/organization/OrganizationList.vue'),
            meta: { title: '组织履历' },
          },
          {
            path: 'training',
            name: 'TrainingProject',
            component: () => import('@/features/applications/training/TrainingList.vue'),
            meta: { title: '实训项目' },
          },
          {
            path: 'social-practice',
            name: 'SocialPractice',
            component: () => import('@/features/applications/social-practice/SocialPracticeList.vue'),
            meta: { title: '社会实践' },
          },
          {
            path: 'book-report',
            name: 'BookReport',
            component: () => import('@/features/applications/book-report/BookReportList.vue'),
            meta: { title: '图书心得' },
          },
        ],
      },
      // ─── 奖项报名 ───
      {
        path: 'awards',
        redirect: '/awards/competition-star',
        children: [
          {
            path: 'competition-star',
            name: 'CompetitionStar',
            component: () => import('@/features/awards/competition-star/CompetitionStarList.vue'),
            meta: { title: '竞赛之星报名' },
          },
          {
            path: 'scientific-star',
            name: 'ScientificStar',
            component: () => import('@/features/awards/scientific-star/ScientificStarList.vue'),
            meta: { title: '科研之星报名' },
          },
          {
            path: 'innovation-star',
            name: 'InnovationStar',
            component: () => import('@/features/awards/innovation-star/InnovationStarList.vue'),
            meta: { title: '双创之星报名' },
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
            component: () => import('@/features/approval/PendingApproval.vue'),
            meta: { title: '待审批信息' },
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
