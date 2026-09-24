import type { UserInfo } from '@/shared/types/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { changePassword as apiChangePassword } from '@/shared/api/auth'
import { uploadAvatar as apiUpload } from '@/shared/api/common'
import { updateProfileContact } from '@/shared/api/student'
import { logout as apiLogout } from '@/shared/api/user'
import { useTeacherMe } from '@/shared/composables/useTeacherMe'
import { clearAuth, getToken, setToken as persistToken } from '@/shared/utils/token'
import { useTabsStore } from './tabs'

/** 身份缓存 key：登录后写入，供标签栏/守卫读取 loginType（端级分流） */
const USER_INFO_CACHE_KEY = 'user_info_cache'

const AVATAR_CACHE_KEY = 'user_avatar_cache'

/** 将 base64 data URL 转为 File 对象（头像上传用） */
function dataUrlToFile(dataUrl: string): File {
  const [meta, data] = dataUrl.split(',')
  const mime = meta.match(/data:(.*?);/)?.[1] || 'image/png'
  const bin = atob(data)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new File([arr], `avatar-${Date.now()}.png`, { type: mime })
}

function readAvatarCache(): string | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    return localStorage.getItem(AVATAR_CACHE_KEY) || undefined
  } catch {
    return undefined
  }
}

function writeAvatarCache(avatar: string | undefined) {
  if (typeof window === 'undefined') return
  try {
    if (avatar) {
      localStorage.setItem(AVATAR_CACHE_KEY, avatar)
    } else {
      localStorage.removeItem(AVATAR_CACHE_KEY)
    }
  } catch {
    // 隐私模式或存储已满时静默失败
  }
}

export const useUserStore = defineStore('user', () => {
  // state
  const token = ref(getToken())
  const userInfo = ref<UserInfo | null>(loadUserInfoCache())

  // 头像本地缓存（接口未就绪前使用 Base64 本地存储）
  const cachedAvatar = ref<string | undefined>(readAvatarCache())

  // getters
  const isLoggedIn = computed(() => !!token.value)
  const userName = computed(() => userInfo.value?.realName ?? userInfo.value?.username ?? '')
  const studentId = computed(() => userInfo.value?.studentId ?? '')
  const avatar = computed(() => userInfo.value?.avatar || cachedAvatar.value)

  // ── 教师端登录类型 ──
  // 模块级权限判定（菜单/守卫/组件分支）统一走 useTeacherAuthz()，
  // 权限码来源为 GET /auth/me 的 permissions，不在此处按角色枚举推导。
  /** 是否为教师端登录（仅用于端级分流：教师端 /teacher/* ↔ 学生端 /） */
  const isTeacher = computed(() => userInfo.value?.loginType === 'teacher')

  /** 设置登录类型 */
  function setLoginType(type: 'student' | 'teacher') {
    if (userInfo.value) {
      userInfo.value.loginType = type
      localStorage.setItem(USER_INFO_CACHE_KEY, JSON.stringify(userInfo.value))
    }
  }

  // actions
  /** 写入令牌；remember=true 持久化到 localStorage，否则仅存 sessionStorage（关闭浏览器失效） */
  function setToken(val: string, remember = false) {
    token.value = val
    persistToken(val, remember)
  }

  function setUserInfo(info: UserInfo) {
    userInfo.value = info
    // 若后端返回头像则优先使用，否则合并本地缓存
    if (!info.avatar && cachedAvatar.value) {
      userInfo.value = { ...info, avatar: cachedAvatar.value }
    }
    // 持久化到 localStorage，避免刷新后基本资料丢失
    try {
      localStorage.setItem(USER_INFO_CACHE_KEY, JSON.stringify(userInfo.value))
    } catch {
      // 隐私模式或存储已满时静默失败
    }
  }

  async function updateAvatar(avatarUrl: string | undefined) {
    let effective = avatarUrl
    if (avatarUrl) {
      try {
        // 本地选择的 base64 头像需先转 File 上传，成功后使用后端返回的 OSS 签名 URL
        if (avatarUrl.startsWith('data:')) {
          const res = await apiUpload(dataUrlToFile(avatarUrl))
          effective = res.avatarUrl || avatarUrl
        } else {
          effective = avatarUrl
        }
      } catch {
        /* 上传失败保留本地缓存 */
      }
    }
    cachedAvatar.value = effective
    writeAvatarCache(effective)
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, avatar: effective }
    }
  }

  /**
   * 更新联系信息（对接 PUT /profile/contact）。
   *
   * 注意：邮箱/手机号属于「档案联系信息」，与登录账号的注册邮箱不是同一份数据 ——
   * 账号邮箱用于登录与找回密码，由后端在账号上维护，前端不提供修改入口。
   * 因此这里只提交联系信息，**不回写 userInfo.email/phone**，避免把联系邮箱污染成账号邮箱
   * （联系信息展示改由档案概览读取 archive store 的 /profile/info.contactInfo）。
   * 接口失败向上抛出，由调用方决定是否提示「已保存」。
   */
  async function updateUserInfo(partial: Partial<UserInfo>) {
    await updateProfileContact({
      email: partial.email || undefined,
      phone: partial.phone || undefined,
    })
  }

  async function changePassword(payload: {
    oldPassword: string
    newPassword: string
  }): Promise<void> {
    // 对接 PUT /auth/password（confirmPassword 与 newPassword 一致）
    await apiChangePassword({
      oldPassword: payload.oldPassword,
      newPassword: payload.newPassword,
      confirmPassword: payload.newPassword,
    })
  }

  function loadUserInfoCache(): UserInfo | null {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(USER_INFO_CACHE_KEY)
      return raw ? (JSON.parse(raw) as UserInfo) : null
    } catch {
      return null
    }
  }

  async function logout() {
    // 通知后端使令牌失效。
    // 请求拦截器在微任务中异步读取 token，故必须先 getToken() 快照并作为显式
    // Authorization 传给 apiLogout —— 否则 clearAuth 后请求变匿名，/auth/logout
    // 会返回 401，令牌在服务端也不会真正失效。
    const tokenSnapshot = getToken()
    try {
      await apiLogout(tokenSnapshot)
    } catch {}
    token.value = ''
    userInfo.value = null
    cachedAvatar.value = undefined
    clearAuth()
    localStorage.removeItem(AVATAR_CACHE_KEY)
    // 登出必须清空身份缓存，否则换账号登录会读到上一个账号的 loginType / 权限码：
    //   - user_info_cache：loginType 决定端级分流
    //   - teacher_me：/auth/me 的 permissions 决定菜单与页面可访问性
    localStorage.removeItem(USER_INFO_CACHE_KEY)
    useTeacherMe().clear()
    // 登出时清理已访问 tab（防止跨账号污染）
    // tabsStore 必须延迟获取：避免 user store 初始化时 tabs store 未注册
    try {
      useTabsStore().clearAll()
    } catch {
      // tabs store 未注册（极少数场景）—— 静默降级
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    userName,
    studentId,
    avatar,
    isTeacher,
    setLoginType,
    setToken,
    setUserInfo,
    updateAvatar,
    updateUserInfo,
    changePassword,
    logout,
  }
})
