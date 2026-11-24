/**
 * 邮箱格式校验（与后端 @Email 大致对齐，不追求 RFC 全量）。
 *
 * 用逐段定长域名 + 顶级域的正则，避免「任意字符 + 任意字符」这类
 * 可交换量词导致的正则回溯（eslint regexp/no-super-linear-backtracking）。
 *
 * 个人资料页联系邮箱的格式校验使用本函数，与后端 @Email 规则保持一致。
 */
const EMAIL_PATTERN = /^[\w.%+-]+@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim())
}
