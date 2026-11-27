import { USER_AVATAR_CACHE_KEY, USER_AVATAR_LOCAL_CACHE_KEY } from '@/shared/constants/storageKeys'

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
export function dataUrlToFile(dataUrl: string): File {
  const [meta, data] = dataUrl.split(',')
  const mime = meta.match(/data:(.*?);/)?.[1] || 'image/png'
  const ext = MIME_EXTENSIONS[mime] ?? 'png'
  const bin = atob(data)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new File([arr], `avatar-${Date.now()}.${ext}`, { type: mime })
}

export function readAvatarCache(): string | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    return localStorage.getItem(USER_AVATAR_CACHE_KEY) || undefined
  } catch {
    return undefined
  }
}

export function writeAvatarCache(avatar: string | undefined) {
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
export interface LocalAvatarCache {
  dataUrl: string
  objectKey?: string
}

export function readLocalAvatarCache(): LocalAvatarCache | null {
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

export function writeLocalAvatarCache(cache: LocalAvatarCache | null) {
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
