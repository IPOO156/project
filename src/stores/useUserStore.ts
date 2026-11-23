import type { UserInfo } from '@/shared/types/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { changePassword as apiChangePassword, getCurrentUser } from '@/shared/api/auth'
import { uploadAvatar as apiUpload } from '@/shared/api/common'
import { updateProfileContact } from '@/shared/api/student'
import { logout as apiLogout } from '@/shared/api/user'
import { useTeacherMe } from '@/shared/composables/useTeacherMe'
import {
  USER_AVATAR_CACHE_KEY,
  USER_AVATAR_LOCAL_CACHE_KEY,
  USER_INFO_CACHE_KEY,
  USER_SCOPED_PREFIXES,
} from '@/shared/constants/storageKeys'
import { clearMustChangePassword } from '@/shared/utils/forcePasswordChange'
import { clearCurrentUserScopedStorage } from '@/shared/utils/storageScope'
import { clearAuth, getToken, setToken as persistToken } from '@/shared/utils/token'
import { resetUserScopedStores } from './sessionReset'

/** MIME → 文件扩展名（头像裁剪固定输出 JPEG，但按实际 MIME 取后缀，避免与内容不一致） */
const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/**
 * 将 base64 data URL 转为 File 对象（头像上传用）。
 * 文件名后缀必须与图片真实内容一致：后端按扩展名做魔数校验，
 * 裁剪结果始终是 JPEG，若沿用 .png 文件名会被拒为「文件内容与扩展名不匹配」。
 */
function dataUrlToFile(dataUrl: string): File {
  const [meta, data] = dataUrl.split(',')
  const mime = meta.match(/data:(.*?);/)?.[1] || 'image/png'
  const ext = MIME_EXTENSIONS[mime] ?? 'png'
  const bin = atob(data)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new File([arr], `avatar-${Date.now()}.${ext}`, { type: mime })
}

function readAvatarCache(): string | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    return localStorage.getItem(USER_AVATAR_CACHE_KEY) || undefined
  } catch {
    return undefined
  }
}

function writeAvatarCache(avatar: string | undefined) {
  if (typeof window === 'undefined') return
  try {
    if (avatar) {
      localStorage.setItem(USER_AVATAR_CACHE_KEY, avatar)
    } else {
      localStorage.removeItem(USER_AVATAR_CACHE_KEY)
    }
  } catch {
    // 隐私模式或存储已满时静默失败
  }
}

/**
 * 本机头像图片缓存：保存本机上传的裁剪图 base64 与后端 objectKey。
 * 只缓存图片本体，不承担跨设备同步；objectKey 用于后端头像被其他端替换时判定失效。
 */
interface LocalAvatarCache {
  dataUrl: string
  objectKey?: string
}

function readLocalAvatarCache(): LocalAvatarCache | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(USER_AVATAR_LOCAL_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<LocalAvatarCache>
    if (!parsed.dataUrl?.startsWith('data:image/')) return null
    return { dataUrl: parsed.dataUrl, objectKey: parsed.objectKey }
  } catch {
    return null
  }
}

function writeLocalAvatarCache(cache: LocalAvatarCache | null) {
  if (typeof window === 'undefined') return
  try {
    if (cache) {
      localStorage.setItem(USER_AVATAR_LOCAL_CACHE_KEY, JSON.stringify(cache))
    } else {
      localStorage.removeItem(USER_AVATAR_LOCAL_CACHE_KEY)
    }
  } catch {
    // 隐私模式或存储已满时静默失败：不影响头像地址本身
  }
}

export const useUserStore = defineStore('user', () => {
  // state
  const token = ref(getToken())
  const userInfo = ref<UserInfo | null>(loadUserInfoCache())

  // 头像本地缓存：上传接口（POST /common/upload/avatar）成功返回 OSS URL 后写入本地；
  // 上传失败不写缓存、保留原头像，由调用方提示失败（避免把未落库的 Base64 当成功）
  const cachedAvatar = ref<string | undefined>(readAvatarCache())

  // 本机上传的图片本体：刷新后优先展示，避免 OSS 预签名地址加载不出来时头像空白
  const localAvatarCache = ref<LocalAvatarCache | null>(readLocalAvatarCache())

  // getters
  const isLoggedIn = computed(() => !!token.value)
  const userName = computed(() => userInfo.value?.realName ?? userInfo.value?.username ?? '')
  const studentId = computed(() => userInfo.value?.studentId ?? '')
  const avatar = computed(
    () => localAvatarCache.value?.dataUrl || userInfo.value?.avatar || cachedAvatar.value,
  )

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

  /**
   * 更新头像：base64 先上传换取后端 OSS 地址，成功后才写本地缓存。
   * 上传失败必须向上抛出（接口错误已由请求拦截器统一提示）：
   * 此前吞掉异常并把 base64 写进缓存，调用方仍提示「头像更新成功」，
   * 用户看到的是未落库的本地预览，刷新后头像丢失且全程没有任何失败提示。
   */
  async function updateAvatar(avatarUrl: string | undefined) {
    let effective = avatarUrl
    if (avatarUrl?.startsWith('data:')) {
      // 本地选择的 base64 头像需先转 File 上传，成功后使用后端返回的 OSS 签名 URL
      const res = await apiUpload(dataUrlToFile(avatarUrl))
      if (!res?.avatarUrl) throw new Error('头像上传未返回地址')
      effective = res.avatarUrl
      // 本机上传：留存裁剪图本体，刷新后即使 OSS 地址暂时加载不出来也能显示
      localAvatarCache.value = { dataUrl: avatarUrl, objectKey: res.objectKey }
      writeLocalAvatarCache(localAvatarCache.value)
    } else {
      // 删除头像，或外部直接传入地址（非本机上传）：旧的本机图片不再对应当前头像
      localAvatarCache.value = null
      writeLocalAvatarCache(null)
    }
    cachedAvatar.value = effective
    writeAvatarCache(effective)
    // 同步写入 user_info_cache：否则刷新后 userInfo 仍是旧头像地址，
    // 虽然 avatar getter 回退到 cachedAvatar 仍能显示，但两处数据会长期不一致。
    if (userInfo.value) {
      setUserInfo({ ...userInfo.value, avatar: effective })
    }
  }

  /**
   * 从 GET /auth/me 刷新头像地址（应用启动时调用一次）。
   *
   * 后端头像只存 OSS objectKey，读取时现签预签名 URL（有效期 7 天），
   * 本地缓存或 user_info_cache 里的旧签名 URL 过期后 <img> 会变成破图。
   * 刷新失败不阻断启动：401 由请求拦截器统一处理，其余异常保留本地缓存。
   */
  async function refreshAvatar() {
    if (!isLoggedIn.value) return
    const me = await getCurrentUser().catch(() => null)
    if (!me) return
    const fresh = me.avatar || undefined
    if (!fresh) {
      // 后端已无头像（如在其他端删除）：同步清掉本地缓存，避免继续展示旧图
      cachedAvatar.value = undefined
      writeAvatarCache(undefined)
      localAvatarCache.value = null
      writeLocalAvatarCache(null)
      if (userInfo.value?.avatar) setUserInfo({ ...userInfo.value, avatar: undefined })
      return
    }
    // 后端头像对象已更换（在其他设备重新上传）时，本机旧图不再有效：
    // 预签名 URL 路径中包含 objectKey（avatar/<uuid>.jpg），据此判断是否仍是同一张图。
    const localKey = localAvatarCache.value?.objectKey
    if (localKey && !fresh.includes(localKey.replace(/^\//, ''))) {
      localAvatarCache.value = null
      writeLocalAvatarCache(null)
    }
    cachedAvatar.value = fresh
    writeAvatarCache(fresh)
    if (userInfo.value) setUserInfo({ ...userInfo.value, avatar: fresh })
  }

  /**
   * 更新联系信息（对接 PUT /profile/contact）。
   *
   * 后端 PUT /profile/contact 为整体覆盖且六个字段都必填，因此必须接收完整联系信息，
   * 而不是只传邮箱/手机号。
   * 后端只有一份邮箱/手机号（user_contact_info），登录响应的 user.email/phone 也取自该表，
   * 不存在独立的「账号邮箱」：邮箱用于找回密码与系统邮件，登录本身只认学号/工号。
   * 因此保存成功后同步回写 userInfo，避免简历页等仍展示旧联系方式。
   * 接口失败向上抛出，由调用方决定是否提示「已保存」。
   */
  async function updateUserInfo(contact: {
    email: string
    phone: string
    address: string
    emergencyName: string
    emergencyRelation: string
    emergencyPhone: string
  }) {
    await updateProfileContact(contact)
    // 后端 userInfo.email/phone 与联系信息同源，保存后同步缓存（含 localStorage）
    if (userInfo.value) {
      setUserInfo({ ...userInfo.value, email: contact.email, phone: contact.phone })
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
      const raw = localStorage.getItem(USER_INFO_CACHE_KEY)
      return raw ? (JSON.parse(raw) as UserInfo) : null
    } catch {
      return null
    }
  }

  async function logout(options: { notifyServer?: boolean } = {}) {
    // 通知后端使令牌失效。
    // 请求拦截器在微任务中异步读取 token，故必须先 getToken() 快照并作为显式
    // Authorization 传给 apiLogout —— 否则 clearAuth 后请求变匿名，/auth/logout
    // 会返回 401，令牌在服务端也不会真正失效。
    // 改密成功后后端已吊销全部令牌，此时跳过该请求（notifyServer=false），避免必然的 401。
    const tokenSnapshot = getToken()
    if (options.notifyServer !== false) {
      try {
        await apiLogout(tokenSnapshot)
      } catch {}
    }
    token.value = ''
    userInfo.value = null
    cachedAvatar.value = undefined
    localAvatarCache.value = null
    clearAuth()
    localStorage.removeItem(USER_AVATAR_CACHE_KEY)
    localStorage.removeItem(USER_AVATAR_LOCAL_CACHE_KEY)
    // 清理当前用户的表单草稿与撤回标记（含 PII）。必须在删除 user_info_cache 之前，
    // 否则 storageScope 已退化为 anonymous，找不到 ::u<id> 键。
    clearCurrentUserScopedStorage(USER_SCOPED_PREFIXES)
    // 登出必须清空身份缓存，否则换账号登录会读到上一个账号的 loginType / 权限码：
    //   - user_info_cache：loginType 决定端级分流
    //   - teacher_me：/auth/me 的 permissions 决定菜单与页面可访问性
    localStorage.removeItem(USER_INFO_CACHE_KEY)
    // 强制改密标记属账号级状态：不清理会让下一位登录的账号被误送改密页
    clearMustChangePassword()
    // 教师身份为模块级 ref，需显式清空（clearUserScopedStorage 只清 localStorage）
    useTeacherMe().clear()
    // 重置全部用户级业务 store 与用户级本地存储（身份缓存 / 头像 / 草稿 / 撤回标记 / tabs）：
    // 防止换账号登录后 60s TTL 窗口内命中上一账号的缓存数据，或读到上一账号的 loginType / 权限码。
    resetUserScopedStores()
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
    refreshAvatar,
    updateUserInfo,
    changePassword,
    logout,
  }
})
