/**
 * 登录令牌存储工具
 *
 * 登录态默认仅存 sessionStorage（关闭浏览器/标签页即失效，重新打开应用显示登录页）；
 * 勾选「记住我」时改存 localStorage（跨会话保持登录）。
 * 读取时优先 sessionStorage（当前会话最新），其次 localStorage（记住我）。
 *
 * 历史版本（2026-08-23 之前）无条件把 token 写入 localStorage 且无「记住我」标记，
 * 这类孤立令牌会在 initAuthState() 启动清理中被清除，避免未登录直接进入系统。
 */

const TOKEN_KEY = 'token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const REMEMBER_KEY = 'remember_me'

function storageOf(remember: boolean): Storage {
  return remember ? localStorage : sessionStorage
}

/** 读取当前 token（sessionStorage 优先，其次 localStorage） */
export function getToken(): string {
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || ''
}

/** 读取当前 refresh_token */
export function getRefreshToken(): string {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY) || ''
}

/** 写入 token；remember=true 持久化到 localStorage，否则仅当前会话（sessionStorage） */
export function setToken(token: string, remember = false): void {
  // 写前清空两处，避免历史 localStorage 遗留 token 被再次读回
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  storageOf(remember).setItem(TOKEN_KEY, token)
  syncRememberMark(remember)
}

/** 写入 refresh_token（与 token 使用同一存储策略） */
export function setRefreshToken(token: string, remember = false): void {
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
  storageOf(remember).setItem(REFRESH_TOKEN_KEY, token)
  syncRememberMark(remember)
}

/** 令牌刷新成功后回写：沿用旧 token 所在存储，避免把「记住我」降级为会话级 */
export function writeTokenPreservingSource(
  accessToken: string,
  refreshToken?: string | null,
): void {
  const remembered = localStorage.getItem(REMEMBER_KEY) === '1'
  setToken(accessToken, remembered)
  if (refreshToken) setRefreshToken(refreshToken, remembered)
}

function syncRememberMark(remember: boolean): void {
  if (remember) localStorage.setItem(REMEMBER_KEY, '1')
  else localStorage.removeItem(REMEMBER_KEY)
}

/** 清除全部令牌（登出 / 强制登出） */
export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(REMEMBER_KEY)
}

/**
 * 应用启动时调用（router 安装前）：
 * 清理历史遗留的孤立令牌。旧版本无条件写 localStorage，若其中的 token 未带「记住我」标记，
 * 说明是残留而非用户主动记住，直接清除，避免未登录直接进入系统。
 */
export function initAuthState(): void {
  const localToken = localStorage.getItem(TOKEN_KEY)
  const remembered = localStorage.getItem(REMEMBER_KEY) === '1'
  if (localToken && !remembered) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }
}
