export interface PasswordStrengthResult {
  valid: boolean
  message: string
}

/**
 * 密码强度校验
 * 后端规则（POST /auth/password/reset/confirm、PUT /auth/password）：
 * 长度 6-32 位，必须同时包含大写字母、小写字母、数字和特殊字符。
 */
export function validatePasswordStrength(password: string): PasswordStrengthResult {
  if (password.length < 6 || password.length > 32) {
    return { valid: false, message: '密码长度需为 6-32 位' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: '密码需包含大写字母' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: '密码需包含小写字母' }
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: '密码需包含数字' }
  }
  if (!/[^a-z0-9]/i.test(password)) {
    return { valid: false, message: '密码需包含特殊字符（如 !@#）' }
  }
  return { valid: true, message: '' }
}
