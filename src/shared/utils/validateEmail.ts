/**
 * 邮箱格式校验（与后端 @Email 大致对齐，不追求 RFC 全量）。
 *
 * 用逐段定长域名 + 顶级域的正则，避免「任意字符 + 任意字符」这类
 * 可交换量词导致的正则回溯（eslint regexp/no-super-linear-backtracking）。
 *
 * 该邮箱在本系统里同时是「忘记密码」的验证码接收地址，
 * 登录页找回密码弹窗与个人资料页联系邮箱共用同一套判定，避免两处规则漂移。
 */
const EMAIL_PATTERN = /^[\w.%+-]+@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim())
}
