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

  /** api 为可选的「核心数据接口」断言：必须成功，且必须是教师端端点（防回退到 /admin/* ⇒ 教师 403） */
  const PAGES: { path: string; name: string; api?: RegExp }[] = [
    { path: '/teacher/dashboard', name: '首页' },
    // 列表与汇总已改接 /teacher/archives、/teacher/archives/overview（按 role_scopes 限域），故断言列表接口 200。
    // 详情仍调 /admin/archives/{archiveId} ⇒ 教师点「详情」403，待后端补 /teacher/archives/{archiveId}
    // （见 docs/2026-10-09-后端需处理问题清单.md B-2），故详情暂不纳入断言。
    { path: '/teacher/archive-view', name: '档案查看', api: /\/teacher\/archives(\?|$)/ },
    // 评分重算页进页即拉学生候选；候选必须来自 /teacher/archives —— 若退回 /admin/archives，
    // 教师（仅持 teacher:archive:view）会 403，断言即失败
    { path: '/teacher/score-recalculate', name: '评分重算', api: /\/teacher\/archives(\?|$)/ },
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
      const api = item.api
      const waitApi = api
        ? page.waitForResponse((r) => api.test(r.url()) && r.request().method() === 'GET', {
            timeout: 20_000,
          })
        : null

      await page.goto(item.path)

      await expect(page).toHaveURL(new RegExp(`${item.path.replace(/\//g, '\\/')}$`))
      await expect(page.locator('.layout')).toBeVisible()
      await expect(page.locator('.sidebar__el-menu .el-menu-item').first()).toBeVisible()

      if (waitApi) {
        // 回退到 /admin/archives 时教师身份得到 403，此断言即失败
        expect((await waitApi).status(), `${item.name} 核心接口应返回 200`).toBe(200)
      }
      expect(pageErrors, `${item.path} 出现未捕获异常`).toEqual([])
    })
  }
})
