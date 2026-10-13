import request from './request'

/**
 * 用户资料 API
 * 管理个人信息修改、头像上传、密码修改
 *
 * 已对接真实后端：
 *   - logout       → POST /auth/logout
 *   - changePassword → PUT /auth/password（原密码 + 新密码 + 确认密码）
 *   - uploadAvatar → POST /common/upload/avatar（multipart，返回 OSS 签名 URL）
 */

/** 上传头像（Base64 dataURL → File → POST /common/upload/avatar） */
export async function uploadAvatar(base64: string): Promise<string> {
  const blob = await (await fetch(base64)).blob()
  const file = new File([blob], 'avatar.png', { type: blob.type || 'image/png' })
  const formData = new FormData()
  formData.append('file', file)
  const res: { avatarUrl: string } = await request.post('/common/upload/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.avatarUrl
}

/** 修改密码 */
export function changePassword(payload: {
  oldPassword: string
  newPassword: string
}): Promise<void> {
  return request.put('/auth/password', {
    oldPassword: payload.oldPassword,
    newPassword: payload.newPassword,
    confirmPassword: payload.newPassword,
  })
}

/**
 * 退出登录（通知后端失效令牌）。
 * @param token 调用方快照的令牌。登录态清除后请求拦截器不再自动附带 Authorization，
 *              若不显式传入，后端会对匿名 /auth/logout 返回 401 且令牌不会真正失效，
 *              故由调用方（user store logout）先 getToken() 快照再传入。
 */
export function logout(token?: string): Promise<void> {
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
  return request.post('/auth/logout', null, config)
}
