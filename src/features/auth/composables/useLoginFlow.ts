import type { UserInfo } from '@/shared/types/types'
import { ElMessage } from 'element-plus'
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeStore, useUserStore } from '@/app/stores/stores'
import { getCaptcha, teacherLogin } from '@/shared/api/teacher-api'
import { useTeacherMe } from '@/shared/composables/useTeacherMe'
import { setRefreshToken } from '@/shared/utils/token'

/** 登录入口页签：学生端 / 管理端（教师走管理端入口） */
export type LoginType = 'student' | 'admin'

// 免验证码测试账号名单。
//
// 原先此处硬编码了一份测试账号清单，与 request.ts 的 CAPTCHA_SKIP_ACCOUNTS、
// 后端 application-dev.yml 的 auth.captcha.skip-users 三处各自维护、极易发散。
// 现按要求移除：前端不再内置任何测试账号，开发时一律走图形验证码登录。
// 本清单控制「是否放行不填验证码」，request.ts 那份控制「是否发送跳过头」，两者同源。
const SKIP_ACCOUNTS = import.meta.env.DEV
  ? (import.meta.env.VITE_CAPTCHA_SKIP_ACCOUNTS || '')
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean)
  : []

export interface LoginFlowOptions {
  /**
   * 登录入口与账号角色的匹配判定。
   * 判定逻辑留在调用方（Login.vue），本 composable 只负责在写 token **之前**调用它。
   */
  isRoleMatched: (roles: string[], tab: LoginType) => boolean
}

// 教师端身份不再映射为前端角色枚举：权限码由 /auth/me 的 permissions 提供，
// 菜单与路由授权见 shared/composables/useTeacherAuthz.ts。
function toUserInfo(user: {
  userId: number
  userNo: string
  name: string
  email: string | null
  phone?: string | null
  schoolName: string | null
  roles: string[]
  avatar: string | null
}): UserInfo {
  return {
    id: String(user.userId),
    username: user.userNo,
    realName: user.name,
    avatar: user.avatar ?? undefined,
    studentId: '',
    grade: '',
    major: '',
    className: '',
    email: user.email ?? '',
    phone: user.phone ?? '',
    college: user.schoolName ?? '',
    department: '',
    loginType: 'teacher',
  }
}

function toStudentUserInfo(user: {
  userId: number
  userNo: string
  name: string
  email: string | null
  phone?: string | null
  schoolName: string | null
  roles: string[]
  avatar: string | null
}): UserInfo {
  return {
    id: String(user.userId),
    username: user.userNo,
    realName: user.name,
    avatar: user.avatar ?? undefined,
    studentId: user.userNo,
    grade: '',
    major: '',
    className: '',
    email: user.email ?? '',
    phone: user.phone ?? '',
    college: user.schoolName ?? '',
    department: '',
    loginType: 'student',
  }
}

/**
 * 登录页核心流程：验证码加载 / 续期、登录提交、记住我、登录后角色回跳。
 * 页面只保留视图态（聚焦、入场动画等）与模板。
 */
export function useLoginFlow(options: LoginFlowOptions) {
  const router = useRouter()
  const userStore = useUserStore()
  const themeStore = useThemeStore()
  const { refresh: refreshTeacherMe } = useTeacherMe()

  // ── 登录：后端验证码（学生端与管理员端共用 /auth/captcha）──
  const isAdminLogin = computed(() => loginType.value === 'admin')
  const backendCaptcha = ref<{ key: string; image: string } | null>(null)
  const captchaFailed = ref(false)
  let captchaKey = ''
  let captchaPending: Promise<void> | null = null

  /**
   * 验证码续期参数。
   * 后端 /auth/captcha 目前只返回 key/image，未返回 expiresIn（已提需求待补，见 CaptchaResponse）。
   * 兜底值取保守下限：偏小只会导致提前换一张（无害），偏大则续期无意义。
   */
  const CAPTCHA_TTL_FALLBACK_SEC = 60
  /** 到期前多少秒触发续期，给用户留出重新输入的时间 */
  const CAPTCHA_REFRESH_AHEAD_SEC = 30
  /** 用户正在输入验证码时的延后重试间隔 */
  const CAPTCHA_DEFER_SEC = 15

  let captchaTimer = 0
  /** 当前验证码的失效时刻（ms），用于判断续期时是否已真过期 */
  let captchaExpiresAt = 0

  /** 按有效期安排续期定时器 */
  function scheduleCaptchaRefresh(ttlSec: number) {
    window.clearTimeout(captchaTimer)
    captchaExpiresAt = Date.now() + ttlSec * 1000
    captchaTimer = window.setTimeout(
      handleCaptchaDue,
      Math.max(ttlSec - CAPTCHA_REFRESH_AHEAD_SEC, 0) * 1000,
    )
  }

  /**
   * 到期前的续期。
   * 用户已开始输入时不换图（换图会让已输入的码作废），延后 CAPTCHA_DEFER_SEC 再查；
   * 越过有效期后则无论是否已输入都换 —— 旧 key 在后端已失效，留着只会让本次提交必然失败。
   */
  function handleCaptchaDue() {
    const expired = Date.now() >= captchaExpiresAt
    if (loginForm.captcha && !expired) {
      captchaTimer = window.setTimeout(handleCaptchaDue, CAPTCHA_DEFER_SEC * 1000)
      return
    }
    void loadBackendCaptcha({ notifyExpired: expired })
  }

  async function loadBackendCaptcha(opts: { notifyExpired?: boolean } = {}) {
    if (captchaPending) return captchaPending
    captchaPending = (async () => {
      captchaFailed.value = false
      try {
        const res = await getCaptcha()
        if (res?.key && res?.image) {
          const hadCode = !!loginForm.captcha
          backendCaptcha.value = res
          captchaKey = res.key
          // 换图后旧码必然失配，清空输入框；因过期被动换图且用户已输入时，说明原因
          loginForm.captcha = ''
          if (opts.notifyExpired && hadCode) {
            ElMessage.info('验证码已过期，已为你刷新，请重新输入')
          }
          scheduleCaptchaRefresh(res.expiresIn ?? CAPTCHA_TTL_FALLBACK_SEC)
        } else {
          backendCaptcha.value = null
          captchaFailed.value = true
        }
      } catch {
        backendCaptcha.value = null
        captchaFailed.value = true
      }
    })()
    try {
      await captchaPending
    } finally {
      captchaPending = null
    }
  }

  const loginForm = reactive({ username: '', password: '', captcha: '', remember: false })
  const loading = ref(false)
  const loginSuccess = ref(false)
  const loginType = ref<LoginType>('student')
  const capsLockOn = ref(false)
  const captchaRefreshKey = ref(0)
  const usernameInputRef = ref<{ input: HTMLInputElement } | null>(null)
  const passwordInputRef = ref<{ input: HTMLInputElement } | null>(null)
  const captchaInputRef = ref<{ input: HTMLInputElement } | null>(null)

  /* ===================== 验证码 ===================== */
  function refreshCaptcha() {
    void loadBackendCaptcha()
  }

  /* ===================== 交互 ===================== */
  function switchLoginType(type: LoginType) {
    if (loginType.value !== type) {
      loginType.value = type
      void loadBackendCaptcha()
    }
  }
  function checkCapsLock(event: KeyboardEvent) {
    capsLockOn.value = event.getModifierState?.('CapsLock') ?? false
  }
  async function handleLogin() {
    // Enter 隐式提交不经过按钮禁用态，需在此兜底防止重复提交
    if (loading.value || loginSuccess.value) return
    if (!loginForm.username) {
      ElMessage.warning('请输入用户名')
      usernameInputRef.value?.input?.focus()
      return
    }
    if (!loginForm.password) {
      ElMessage.warning('请输入密码')
      passwordInputRef.value?.input?.focus()
      return
    }

    const userNo = loginForm.username
    const isSkipAccount = SKIP_ACCOUNTS.includes(userNo)

    if (isAdminLogin.value && !backendCaptcha.value && !isSkipAccount) {
      ElMessage.warning('验证码加载中，请稍候再试')
      void loadBackendCaptcha()
      return
    }

    if (!isSkipAccount && !loginForm.captcha) {
      ElMessage.warning('请输入验证码')
      captchaInputRef.value?.input?.focus()
      return
    }
    loading.value = true

    // ── 登录：学生端与管理员端统一对接后端 POST /auth/login（含后端验证码）──
    try {
      const res = await teacherLogin({
        userNo: loginForm.username,
        password: loginForm.password,
        // captchaKey：curl 实测后端 POST /auth/login 读取的是 captchaKey（不是 key），
        // captchaKey 的值来自验证码接口返回的 key
        captchaKey,
        captchaCode: loginForm.captcha,
        rememberMe: loginForm.remember,
        // 管理端页签同时承载教师与管理员账号，后端统一按 admin 入口校验。
        loginType: loginType.value,
      })
      // ── 登录入口与账号角色必须匹配 ──
      // 必须在写 token **之前**校验：一旦落下 token，路由守卫就会放行，页面已经切走了。
      // 服务端已接收 loginType 并在签发令牌前拦截错配；这里保留兜底提示，
      // 防止旧版后端或异常响应绕过入口校验。
      if (!options.isRoleMatched(res.user.roles ?? [], loginType.value)) {
        loading.value = false
        // 已弹过一次图形验证码，失败后换一张，避免用户重试时用的是已消费的 key
        refreshCaptcha()
        ElMessage.warning(
          loginType.value === 'student'
            ? '该账号不是学生账号，请改用管理员登录'
            : '该账号不是管理端账号，请改用学生登录',
        )
        return
      }

      // token 存储遵循「记住我」：默认仅当前会话（sessionStorage），勾选记住我才持久化
      userStore.setToken(res.accessToken, loginForm.remember)
      setRefreshToken(res.refreshToken ?? '', loginForm.remember)

      if (loginType.value === 'admin') {
        userStore.setUserInfo(toUserInfo(res.user))
        // 拉取完整身份（roles / permissions / scopes）。
        // 必须 await：教师端菜单与路由授权依据 /auth/me 的 permissions 渲染，
        // 未拿到就跳转会导致侧边栏为空、模块页被守卫拦截。
        const teacherMe = await refreshTeacherMe()
        if (teacherMe) userStore.setUserInfo(toUserInfo(teacherMe))
        themeStore.applyTimeBasedTheme()
        setTimeout(() => router.push('/teacher/dashboard'), 300)
      } else {
        userStore.setUserInfo(toStudentUserInfo(res.user))
        setTimeout(() => router.push('/dashboard'), 600)
      }
      loading.value = false
      loginSuccess.value = true
    } catch {
      loading.value = false
      refreshCaptcha()
    }
  }

  onMounted(() => {
    nextTick(() => void loadBackendCaptcha())
    // 浏览器自动填充（记住密码）会在 mounted 之后异步写入原生 input 的 value，
    // 此时 Vue 的 v-model 未同步，导致 loginForm 为空但 DOM 已显示文字，
    // 浮动标签 .has-value 判断失真，与实际填入内容重叠。
    // 延迟读取原生 input DOM 值并回写 loginForm，保证状态一致。
    setTimeout(() => {
      const u = usernameInputRef.value?.input?.value
      const p = passwordInputRef.value?.input?.value
      if (u && !loginForm.username) loginForm.username = u
      if (p && !loginForm.password) loginForm.password = p
    }, 200)
  })
  onUnmounted(() => {
    // 清理验证码续期定时器：组件卸载后不得再发起请求
    window.clearTimeout(captchaTimer)
  })

  return {
    loginForm,
    loading,
    loginSuccess,
    loginType,
    capsLockOn,
    backendCaptcha,
    captchaFailed,
    captchaRefreshKey,
    usernameInputRef,
    passwordInputRef,
    captchaInputRef,
    loadBackendCaptcha,
    refreshCaptcha,
    switchLoginType,
    checkCapsLock,
    handleLogin,
  } as const
}
