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
      {
        path: 'growth-timeline',
        name: 'GrowthTimeline',
        component: () => import('@/features/growth-timeline/GrowthTimeline.vue'),
        meta: { title: '成长时间轴', fullBleed: true },
      },
      // ─── AI 助手 ───
      {
        path: 'ai-chat',
        name: 'AIChat',
        component: () => import('@/features/ai-chat/AIChat.vue'),
        meta: { title: 'AI 助手', fullBleed: true },
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
        children: [
          {
            path: '',
            name: 'ApplicationsHub',
            component: () => import('@/features/applications/ApplicationHub.vue'),
            meta: { title: '个人档案信息申报' },
          },
          {
            path: 'competition',
            redirect: '/applications?tab=competition',
          },
          {
            path: 'innovation',
            redirect: '/applications?tab=innovation',
          },
          {
            path: 'research',
            redirect: '/applications?tab=research',
          },
          {
            path: 'scholarship',
            redirect: '/applications?tab=scholarship',
          },
          {
            path: 'certificate',
            redirect: '/applications?tab=certificate',
          },
          {
            path: 'internship',
            redirect: '/applications?tab=internship',
          },
          {
            path: 'organization',
            redirect: '/applications?tab=organization',
          },
          {
            path: 'training',
            redirect: '/applications?tab=training',
          },
          {
            path: 'social-practice',
            redirect: '/applications?tab=social-practice',
          },
          {
            path: 'book-report',
            redirect: '/applications?tab=book-report',
          },
        ],
      },
      // ─── 奖项报名 ───
      {
        path: 'awards',
        children: [
          {
            path: '',
            name: 'AwardOverview',
            component: () => import('@/features/awards/AwardOverview.vue'),
            meta: { title: '奖项总览' },
          },
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
      // ─── 消息中心 ───
      {
        path: 'messages',
        children: [
          {
            path: '',
            name: 'MessageCenter',
            component: () => import('@/features/messages/MessageCenter.vue'),
            meta: { title: '消息中心' },
          },
          {
            path: 'activities',
            name: 'MessageActivities',
            component: () => import('@/features/messages/activities/ActivityList.vue'),
            meta: { title: '全部动态' },
          },
        ],
      },
      // ─── 我的申报 ───
      {
        path: 'approval',
        children: [
          {
            path: 'pending',
            name: 'ApprovalPending',
            component: () => import('@/features/approval/PendingApproval.vue'),
            meta: { title: '申报看板' },
          },
          {
            path: 'award-review',
            name: 'AwardReview',
            component: () => import('@/features/approval/AwardReview.vue'),
            meta: { title: '奖项看板' },
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
    return
  }

  if (to.name === 'Login' && token) {
    next({ path: '/dashboard' })
    return
  }

  next()
})

export default router
