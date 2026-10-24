/**
 * 教师端/管理端 API 类型 —— 认证（/auth）
 */

export interface CaptchaResponse {
  key: string
  image: string
  /**
   * 验证码有效期（秒）。**后端尚未返回，已提需求待补**（GET /auth/captcha 目前只回 key/image）。
   * 后端补上之前，前端按 CAPTCHA_TTL_FALLBACK_SEC 兜底倒计时；字段到位后自动生效，无需再改。
   */
  expiresIn?: number
}

export interface LoginPayload {
  userNo: string
  password: string
  // 字段名 captchaKey：已通过 curl 实测后端（POST /auth/login）读取的是 captchaKey，
  // 传 key 会被视为缺失并返回「验证码标识不能为空」。key 是验证码接口的返回字段，不是登录请求字段。
  captchaKey: string
  captchaCode: string
  rememberMe?: boolean
}

export interface LoginResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
  refreshToken: string | null
  user: {
    userId: number
    userNo: string
    name: string
    email: string | null
    gender: number
    genderLabel: string
    schoolId: number
    schoolName: string | null
    roles: string[]
    roleNames: string[]
    avatar: string | null
  }
}

/** /auth/me 返回的数据范围 */
export interface AuthScope {
  scopeType: number
  scopeTypeLabel: string
  scopeId: number
  scopeName: string | null
  semesterId: number | null
}

export interface CurrentUser {
  userId: number
  userNo: string
  name: string
  email: string | null
  phone: string | null
  gender: number
  genderLabel: string
  schoolId: number
  schoolName: string | null
  roles: string[]
  roleNames: string[]
  permissions: string[]
  scopes: AuthScope[]
  avatar: string | null
}

/* ===================== 密码重置 / 令牌刷新（/auth）===================== */

export interface PasswordResetPayload {
  email: string
}

export interface PasswordResetConfirmPayload {
  verificationCode: string
  email: string
  newPassword: string
  confirmPassword: string
}

export interface TokenRefreshResult {
  accessToken: string
  tokenType: string
  expiresIn: number
  refreshToken: string | null
}
