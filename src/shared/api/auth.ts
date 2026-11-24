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

/* ===================== 学生自助注册 ===================== */

export interface RegisterPayload {
  userNo: string
  name: string
  gender: number
  email: string
  phone: string
  /** 所属专业 ID：学院/学校由后端按专业逐级推导 */
  majorId: number
  /** 班级名称（手填），后端按「专业 + 名称」复用或自动建档 */
  className: string
  password: string
  confirmPassword: string
  captchaKey: string
  captchaCode: string
}

/** 注册页组织选项节点（学校 → 学院 → 专业 → 班级） */
export interface RegisterOptionNode {
  id: number
  name: string
  children?: RegisterOptionNode[]
}

export interface RegisterOptionsResult {
  schools: RegisterOptionNode[]
}

/**
 * 获取学生注册页可选的组织架构（对接 GET /auth/register/options）
 */
export function getRegisterOptions(): Promise<RegisterOptionsResult> {
  return request.get('/auth/register/options')
}

/**
 * 学生自助注册（对接 POST /auth/register）
 * 注册成功直接返回登录态（accessToken + 用户信息），无需再次输入验证码登录。
 */
export function registerStudent(payload: RegisterPayload): Promise<LoginResult> {
  return request.post('/auth/register', payload)
}

/**
 * 登出（对接后端 POST /auth/logout）
 */
export function logout(all?: boolean): Promise<void> {
  return request.post('/auth/logout', { all })
}

/* ===================== 忘记密码（邮箱验证码） ===================== */

/**
 * 发送密码重置验证码邮件（对接 POST /auth/password/reset）
 */
export function sendPasswordResetCode(email: string): Promise<void> {
  return request.post('/auth/password/reset', { email })
}

export interface PasswordResetConfirmPayload {
  email: string
  verificationCode: string
  newPassword: string
  confirmPassword: string
}

/**
 * 校验邮箱验证码并重置密码（对接 POST /auth/password/reset/confirm）
 */
export function confirmPasswordReset(payload: PasswordResetConfirmPayload): Promise<void> {
  return request.post('/auth/password/reset/confirm', payload)
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
