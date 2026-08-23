import type { TeacherRole, UserInfo } from '@/shared/types/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { changePassword as apiChangePassword } from '@/shared/api/auth'
import { uploadAvatar as apiUpload } from '@/shared/api/common'
import { updateProfileContact } from '@/shared/api/student'
import { logout as apiLogout } from '@/shared/api/user'
import { ROLE_PERMISSIONS } from '@/shared/types/types'
import { clearAuth, getToken, setToken as persistToken } from '@/shared/utils/token'
import { useTabsStore } from './tabs'

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

  // ── 教师端角色相关 ──
  /** 是否为教师端登录 */
  const isTeacher = computed(() => userInfo.value?.loginType === 'teacher')
  /** 是否为超级管理员 */
  const isSuperAdmin = computed(() => userInfo.value?.role === 'super_admin')
  /** 是否为管理员 */
  const isAdmin = computed(() => userInfo.value?.role === 'admin')
  /** 是否为审核员 */
  const isReviewer = computed(() => userInfo.value?.role === 'reviewer')
  /** 是否为课任教师 */
  const isTeacherRole = computed(() => userInfo.value?.role === 'teacher')
  /** 当前角色标识 */
  const currentRole = computed<TeacherRole | undefined>(() => userInfo.value?.role)
  /** 当前角色拥有的模块权限列表 */
  const permissions = computed<string[]>(() => {
    const role = userInfo.value?.role
    return role ? (ROLE_PERMISSIONS[role] ?? []) : []
  })

  /** 检查是否有指定模块的权限 */
  function hasPermission(moduleKey: string): boolean {
    return permissions.value.includes(moduleKey)
  }

  /** 设置角色（用于管理员登录后选择） */
  function setRole(role: TeacherRole) {
    if (userInfo.value) {
      userInfo.value.role = role
      userInfo.value.loginType = 'teacher'
      localStorage.setItem('user_info_cache', JSON.stringify(userInfo.value))
    }
  }

  /** 设置登录类型 */
  function setLoginType(type: 'student' | 'teacher') {
    if (userInfo.value) {
      userInfo.value.loginType = type
      localStorage.setItem('user_info_cache', JSON.stringify(userInfo.value))
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
      localStorage.setItem('user_info_cache', JSON.stringify(userInfo.value))
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

  async function updateUserInfo(partial: Partial<UserInfo>) {
    const base = userInfo.value ?? ({ id: '', username: '' } as UserInfo)
    const updated = { ...base, ...partial }
    userInfo.value = updated
    // 同步到后端（仅联系信息字段，对接 PUT /profile/contact）
    updateProfileContact({
      email: partial.email || undefined,
      phone: partial.phone || undefined,
    }).catch(() => {})
    // 持久化到 localStorage
    try {
      localStorage.setItem('user_info_cache', JSON.stringify(userInfo.value))
    } catch {
      /* noop */
    }
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
      const raw = localStorage.getItem('user_info_cache')
      return raw ? (JSON.parse(raw) as UserInfo) : null
    } catch {
      return null
    }
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    cachedAvatar.value = undefined
    clearAuth()
    localStorage.removeItem(AVATAR_CACHE_KEY)
    // 通知后端使令牌失效（fire-and-forget，本地登出不依赖其成功）
    apiLogout().catch(() => {})
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
    isSuperAdmin,
    isAdmin,
    isReviewer,
    isTeacherRole,
    currentRole,
    permissions,
    hasPermission,
    setRole,
    setLoginType,
    setToken,
    setUserInfo,
    updateAvatar,
    updateUserInfo,
    changePassword,
    logout,
  }
})
