import request from './request'

export interface LoginPayload {
  userNo: string
  password: string
  // 字段名 captchaKey：curl 实测后端 POST /auth/login 读取 captchaKey（非 key）
  captchaKey: string
  captchaCode: string
  rememberMe?: boolean
}

export interface LoginResult {
  accessToken: string
  tokenType: string
  expiresIn: number
  refreshToken?: string
  user: {
    userId: number
    userNo: string
    name: string
    email: string
    gender?: number
    genderLabel?: string
    schoolId?: number
    schoolName?: string
    roles: string[]
    roleNames: string[]
    avatar: string | null
  }
}

/**
 * 用户登录（学生端，对接后端 POST /auth/login）
 */
export function login(payload: LoginPayload): Promise<LoginResult> {
  return request.post('/auth/login', payload)
}

/**
 * 登出（对接后端 POST /auth/logout）
 */
export function logout(all?: boolean): Promise<void> {
  return request.post('/auth/logout', { all })
}

/** /auth/me 返回的数据范围（来源 role_scopes，status=1，教师/辅导员返回授权范围，学生/管理员为空数组） */
export interface AuthScope {
  scopeType: number
  scopeTypeLabel: string
  scopeId: number
  scopeName: string | null
  semesterId: number | null
}

/**
 * 获取当前用户信息（对接后端 GET /auth/me）
 */
export function getCurrentUser(): Promise<
  LoginResult['user'] & {
    phone: string | null
    permissions: string[]
    scopes: AuthScope[]
  }
> {
  return request.get('/auth/me')
}

/**
 * 修改密码（对接后端 PUT /auth/password）
 */
export function changePassword(payload: {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}): Promise<void> {
  return request.put('/auth/password', payload)
}

/**
 * 请求重置密码（发送邮件验证码，对接后端 POST /auth/password/reset）
 */
export function requestPasswordReset(email: string): Promise<void> {
  return request.post('/auth/password/reset', { email })
}

/**
 * 确认重置密码（对接后端 POST /auth/password/reset/confirm）
 */
export function confirmPasswordReset(payload: {
  verificationCode: string
  email: string
  newPassword: string
  confirmPassword: string
}): Promise<void> {
  return request.post('/auth/password/reset/confirm', payload)
}

/**
 * 刷新访问令牌（对接后端 POST /auth/refresh）
 */
export function refreshToken(refreshToken: string): Promise<{
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}> {
  return request.post('/auth/refresh', { refreshToken })
}
