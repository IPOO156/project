import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { ACCOUNTS, collectPageErrors, login } from './helpers/login'

test.describe('教师端登录', () => {
  test('登录成功后进入教师首页', async ({ page }) => {
    // 注意：教师走「管理员登录」Tab —— 登录页没有「教师登录」Tab
    await login(page, 'admin', ACCOUNTS.teacher)

    await expect(page).toHaveURL(/\/teacher\/dashboard/)
    await expect(page.locator('.sidebar__el-menu .el-menu-item').first()).toBeVisible()
  })

  test('密码错误时停留登录页并给出提示', async ({ page }) => {
    await page.goto('/login')
    await page.locator('button.login__tab', { hasText: '管理员登录' }).click()

    const form = page.locator('.login__form')
    await form.locator('input.el-input__inner').first().fill(ACCOUNTS.teacher.userNo)
    await form.locator('input[type="password"]').first().fill('wrong-password')
    await page.locator('button.login__btn').click()

    // 用 .first()：一次失败可能弹出多条提示，不加会触发 strict mode 报错
    await expect(page.locator('.el-message--error').first()).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })
})

/**
 * 核心页冒烟。
 *
 * 整个 describe 共用一次登录（beforeAll 里建页）而非每个用例重登：
 * 联调后端走 natapp 免费隧道，有每分钟连接数限流，重复登录会显著提高
 * 触发限流的概率（表现为接口空 body 500）。代价是放弃了用例间的状态隔离，
 * 对「页面能否打开」这类冒烟断言可以接受。
 */
test.describe('教师端核心页冒烟', () => {
  test.describe.configure({ mode: 'serial' })

  const PAGES = [
    { path: '/teacher/dashboard', name: '首页' },
    // ⚠️ 本页当前只验「能打开、无 JS 报错」，不验数据。
    // 原因：该页调的是管理端 /admin/archives 等端点，教师身份一律 403，
    // 页面稳定显示「覆盖学生 0 人 / 档案总数 0 份」。这是已知缺陷，
    // 详见 docs/2026-09-23-三端接口与假数据审计报告.md §七-4②。
    // 待前端改接 GET /teacher/students 后，再补数据断言。
    { path: '/teacher/archive-view', name: '档案查看（数据待修复）' },
    { path: '/teacher/material-review/pending', name: '材料审核' },
    { path: '/teacher/delegation', name: '审批委托' },
    { path: '/teacher/messages', name: '消息中心' },
  ]

  let page: Page
  let pageErrors: string[]

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
    pageErrors = collectPageErrors(page)
    await login(page, 'admin', ACCOUNTS.teacher)
  })

  test.afterAll(async () => {
    await page.close()
  })

  for (const item of PAGES) {
    test(`${item.name}（${item.path}）可正常打开`, async () => {
      await page.goto(item.path)

      await expect(page).toHaveURL(new RegExp(`${item.path.replace(/\//g, '\\/')}$`))
      await expect(page.locator('.layout')).toBeVisible()
      await expect(page.locator('.sidebar__el-menu .el-menu-item').first()).toBeVisible()

      expect(pageErrors, `${item.path} 出现未捕获异常`).toEqual([])
    })
  }
})
