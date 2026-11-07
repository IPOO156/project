/**
 * 首次登录强制改密状态。
 *
 * 后端口径（JwtAuthenticationFilter）：must_change_password=1 时仅放行
 * /auth/password、/auth/me、/auth/logout，其余接口一律 403「首次登录请先修改初始密码」。
 *
 * 登录响应返回 user.mustChangePassword；而刷新页面后只能重新调 /auth/me，该接口
 * 不返回此标记，故用本地标记贯穿一次强制改密流程：
 *   - 登录时按响应写入/清除；
 *   - 任意接口收到上述 403 时补写（覆盖旧令牌、其他设备等本地标记缺失的场景）；
 *   - 改密成功、登出时清除。
 *
 * 仅存布尔标记，不含任何身份信息；隐私模式下写失败时静默降级（本次仍可改密，
 * 刷新后靠 403 兜底重新判定）。
 */
import { MUST_CHANGE_PASSWORD_KEY } from '@/shared/constants/storageKeys'

export function markMustChangePassword(): void {
  try {
    localStorage.setItem(MUST_CHANGE_PASSWORD_KEY, '1')
  } catch {
    /* 隐私模式存储不可用：忽略 */
  }
}

export function clearMustChangePassword(): void {
  try {
    localStorage.removeItem(MUST_CHANGE_PASSWORD_KEY)
  } catch {
    /* 隐私模式存储不可用：忽略 */
  }
}

export function isMustChangePassword(): boolean {
  try {
    return localStorage.getItem(MUST_CHANGE_PASSWORD_KEY) === '1'
  } catch {
    return false
  }
}
