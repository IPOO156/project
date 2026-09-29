import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import { useTeacherMe } from '@/shared/composables/useTeacherMe'
import { isModuleAllowed } from '@/shared/config/teacherModuleRegistry'
import { getToken } from '@/shared/utils/token'
import teacherRoutes from './teacher-routes'

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
    // 学生端路由组标记：供守卫拦截非学生登录（如教师用 URL 直接打开学生页）。
    // 与下方 /teacher 的 meta.teacher 对称，声明在父路由上、由子路由继承。
    meta: { student: true },
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
            meta: { title: '档案概览' },
          },
          {
            path: 'career-plan',
            name: 'CareerPlan',
            component: () => import('@/features/profile/CareerPlan.vue'),
            meta: { title: '成长发展' },
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
            // 本页用 ?tab=xxx 切换 10 个申报子模块（见同文件的 redirect 子项），
            // singleTab 让它们共用顶栏一个标签（useTabs 据此判定），避免每切一个子模块裂一个标签。
            meta: { title: '个人档案信息申报', singleTab: true },
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
            // 奖项总览已并入「我的申报 - 奖项看板」，此处重定向避免悬空路由
            path: '',
            redirect: '/approval/award-review',
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
  // ─── 教师端路由 ───
  {
    path: '/teacher',
    component: () => import('@/app/layouts/DefaultLayout.vue'),
    redirect: '/teacher/dashboard',
    meta: { teacher: true },
    children: teacherRoutes,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

/**
 * /auth/me 身份缓存（teacher_me）缺失时的补拉标记。
 * 教师端菜单与模块授权全部依赖 permissions，缓存丢失会导致侧边栏为空，
 * 故每次会话首次进入时补拉一次；仅一次，避免接口异常时每次跳转都等待网络。
 */
let meRecovered = false

// 路由守卫
router.beforeEach(async (to, _from, next) => {
  const token = getToken()

  if (to.name !== 'Login' && !token) {
    next({ name: 'Login' })
    return
  }

  if (to.name === 'Login' && token) {
    next({ path: '/dashboard' })
    return
  }

  // 学生端路由需 student 登录类型（与下方教师端守卫对称）。
  //
  // 此前只守了 to.path === '/dashboard' 一条：教师/管理员登录后手动敲 URL 仍能打开
  // /profile/info、/applications 等其余学生页，在教师外壳里渲染出学生内容。
  // 现改为按路由组的 meta.student 判定，覆盖学生端全部路由。
  if (to.meta?.student) {
    const userCache = localStorage.getItem('user_info_cache')
    if (userCache) {
      let loginType: string | undefined
      try {
        loginType = JSON.parse(userCache).loginType
      } catch {
        // 解析失败按学生端处理（与改造前一致）
        loginType = undefined
      }
      // 只在**明确**是教师端账号时重定向。不可写成 `!== 'student'` 一律重定向：
      // loginType 缺失时会被送往 /teacher/dashboard，而教师端守卫见 loginType 非 teacher
      // 又会送回 /dashboard，两端守卫互相重定向形成死循环。
      if (loginType === 'teacher') {
        next({ path: '/teacher/dashboard' })
        return
      }
    }
  }

  // 教师端路由需 teacher 登录类型 + 模块权限校验
  if (to.meta?.teacher) {
    const userCache = localStorage.getItem('user_info_cache')
    if (userCache) {
      let loginType: string | undefined
      try {
        loginType = JSON.parse(userCache).loginType
      } catch {
        next({ path: '/login' })
        return
      }
      if (loginType !== 'teacher') {
        next({ path: '/dashboard' })
        return
      }
      // 模块权限校验：直接输入 URL 绕过菜单时重定向回教师首页。
      // meta.permission 为模块 id（对应 teacherModuleRegistry 的 id），
      // 判定依据是 /auth/me 的 permissionCode，不再是前端角色枚举。
      const moduleId = to.meta?.permission
      if (typeof moduleId === 'string' && moduleId) {
        const { me, refresh } = useTeacherMe()
        if (!me.value && !meRecovered) {
          meRecovered = true
          await refresh()
        }
        // 与侧边栏菜单同源判定：持 admin 角色直通（镜像后端 AdminAuthService），
        // 否则按 module 声明的权限码（any-of）判定。
        if (!isModuleAllowed(moduleId, me.value?.permissions ?? [], me.value?.roles ?? [])) {
          next({ path: '/teacher/dashboard' })
          return
        }
      }
    } else {
      next({ path: '/login' })
      return
    }
  }

  next()
})

export default router
