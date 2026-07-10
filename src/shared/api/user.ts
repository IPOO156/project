import type { UserInfo } from '@/shared/types/types'

/**
 * 用户资料 API
 * 管理个人信息修改、头像上传、密码修改
 *
 * 后端就绪后：
 *   - getUserInfo    → request.get<UserInfo>('/user/info')
 *   - updateUserInfo → request.put<UserInfo>('/user/info', payload)
 *   - uploadAvatar   → request.post<string>('/user/avatar', { base64 })
 *   - changePassword → request.put('/user/password', payload)
 */

/** 获取当前用户信息 */
export function getUserInfo(): Promise<UserInfo> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock 从 localStorage 恢复（实际由 Login 后写入）
      const raw = localStorage.getItem('user_info_cache')
      resolve(raw ? JSON.parse(raw) : ({ id: '', username: '' } as UserInfo))
    }, 200)
  })
}

/** 更新用户资料 */
export function updateUserInfo(payload: Partial<UserInfo>): Promise<UserInfo> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(payload as UserInfo), 200)
  })
}

/** 上传头像（Base64） */
export function uploadAvatar(base64: string): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(base64), 300)
  })
}

/** 修改密码 */
export function changePassword(_payload: {
  oldPassword: string
  newPassword: string
}): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 400)
  })
}
