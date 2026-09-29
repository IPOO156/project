import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * 登录页只有「学生登录」与「管理员登录」两个 Tab
 * （Login.vue:165 的 loginType 只有 'student' | 'admin'）。
 * 没有「教师登录」Tab —— 教师走「管理员登录」入口，登录后再由 /auth/me 的权限决定菜单。
 */
export type LoginTab = 'student' | 'admin'

/** 测试账号。前三个账号在 Login.vue:221 的 SKIP_ACCOUNTS 白名单内，验证码可留空 */
export const ACCOUNTS = {
  student: { userNo: '202401002', password: '123456' },
  teacher: { userNo: 'T00003', password: '123456' },
  admin: { userNo: 'A00002', password: '123456' },
} as const

const TAB_TEXT: Record<LoginTab, string> = {
  student: '学生登录',
  admin: '管理员登录',
}

/**
 * 真实登录流程。
 *
 * 选择器依据 Login.vue 的实际结构，有三处与直觉不同（旧用例正是踩在这三点上）：
 *
 * 1. 三个输入框的 placeholder 都是单空格 `" "`（浮动标签写法，Login.vue:449/468/492）。
 *    因此 `input[placeholder*="学号"]` 匹配不到任何元素。
 * 2. 提交按钮文字是「立即进入系统」（Login.vue:539），
 *    `button:has-text("登录")` 会命中 Tab 按钮而非提交按钮，strict mode 下报错。
 * 3. 验证码留空即可 —— 测试账号走免验证码链路。
 */
export async function login(
  page: Page,
  tab: LoginTab,
  account: { userNo: string; password: string },
): Promise<void> {
  await page.goto('/login')

  await page.locator('button.login__tab', { hasText: TAB_TEXT[tab] }).click()

  const form = page.locator('.login__form')
  await form.locator('input.el-input__inner').first().fill(account.userNo)
  await form.locator('input[type="password"]').first().fill(account.password)

  await page.locator('button.login__btn').click()

  // 登录成功即离开 /login（路由守卫会把已登录用户从 /login 弹走）
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20000 })
}

/**
 * 收集页面未捕获的 JS 运行时错误，供导航后断言「页面无报错」。
 *
 * 用 `pageerror` 而非 `console.error`：后者会混入接口 4xx/5xx 这类环境噪声
 * （例如 natapp 免费隧道限流造成的空 body 500 会打进 console），
 * 拿它作断言依据会让用例假失败。
 */
export function collectPageErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  return errors
}
