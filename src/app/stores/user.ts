import type { TeacherRole, UserInfo } from '@/shared/types/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { ROLE_PERMISSIONS } from '@/shared/types/types'
import { useTabsStore } from './tabs'

const AVATAR_CACHE_KEY = 'user_avatar_cache'

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
  const token = ref(localStorage.getItem('token') || '')
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
  function setToken(val: string) {
    token.value = val
    localStorage.setItem('token', val)
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

  function updateAvatar(avatarUrl: string | undefined) {
    cachedAvatar.value = avatarUrl
    writeAvatarCache(avatarUrl)
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, avatar: avatarUrl }
    }
  }

  function updateUserInfo(partial: Partial<UserInfo>) {
    const base = userInfo.value ?? ({ id: '', username: '' } as UserInfo)
    userInfo.value = { ...base, ...partial }
    // 持久化到 localStorage，避免刷新后丢失
    try {
      localStorage.setItem('user_info_cache', JSON.stringify(userInfo.value))
    } catch {
      // 隐私模式或存储已满时静默失败
    }
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
    localStorage.removeItem('token')
    localStorage.removeItem(AVATAR_CACHE_KEY)
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
    logout,
  }
})
