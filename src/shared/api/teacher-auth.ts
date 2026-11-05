import type {
  CaptchaResponse,
  CurrentUser,
  LoginPayload,
  LoginResponse,
  PasswordResetConfirmPayload,
  PasswordResetPayload,
  TokenRefreshResult,
} from '@/shared/types/teacher'
import request from './request'

/* ===================== 认证 ===================== */

export function getCaptcha(): Promise<CaptchaResponse> {
  return request.get('/auth/captcha')
}

/**
 * 登录（学生端与教师/管理端共用）。
 *
 * 免验证码请求头 `X-Captcha-Skip-Token` 不在此处拼装 —— 由 request.ts 的请求拦截器
 * 统一按 body/params 里的 userNo 命中白名单后注入。曾在此重复实现一份，两份白名单
 * 与密钥各自维护、易发散（§2.6/§5.2）。
 */
export function teacherLogin(payload: LoginPayload): Promise<LoginResponse> {
  return request.post('/auth/login', payload)
}

export function getCurrentUser(): Promise<CurrentUser> {
  return request.get('/auth/me')
}

export function teacherLogout(): Promise<void> {
  return request.post('/auth/logout')
}

export function requestPasswordReset(payload: PasswordResetPayload): Promise<void> {
  return request.post('/auth/password/reset', payload)
}

export function confirmPasswordReset(payload: PasswordResetConfirmPayload): Promise<void> {
  return request.post('/auth/password/reset/confirm', payload)
}

export function refreshAccessToken(refreshToken: string): Promise<TokenRefreshResult> {
  return request.post('/auth/refresh', { refreshToken })
}
