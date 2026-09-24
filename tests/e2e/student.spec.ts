import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { ACCOUNTS, collectPageErrors, login } from './helpers/login'

test.describe('学生端登录', () => {
  test('登录成功后进入学生首页', async ({ page }) => {
    await login(page, 'student', ACCOUNTS.student)

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.locator('.sidebar__el-menu .el-menu-item').first()).toBeVisible()
  })

  test('密码错误时停留登录页并给出提示', async ({ page }) => {
    await page.goto('/login')

    const form = page.locator('.login__form')
    await form.locator('input.el-input__inner').first().fill(ACCOUNTS.student.userNo)
    await form.locator('input[type="password"]').first().fill('wrong-password')
    await page.locator('button.login__btn').click()

    // 错误提示走 Element Plus 的 ElMessage 浮层，不是表单内的 .error-message。
    // 用 .first()：一次失败可能弹出多条提示，不加会触发 strict mode 报错。
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
test.describe('学生端核心页冒烟', () => {
  test.describe.configure({ mode: 'serial' })

  const PAGES = [
    { path: '/dashboard', name: '首页' },
    { path: '/growth-timeline', name: '成长时间轴' },
    { path: '/profile/info', name: '档案概览' },
    { path: '/applications', name: '个人档案信息申报' },
    { path: '/messages', name: '消息中心' },
    { path: '/approval/pending', name: '申报看板' },
  ]

  let page: Page
  let pageErrors: string[]

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
    pageErrors = collectPageErrors(page)
    await login(page, 'student', ACCOUNTS.student)
  })

  test.afterAll(async () => {
    await page.close()
  })

  for (const item of PAGES) {
    test(`${item.name}（${item.path}）可正常打开`, async () => {
      await page.goto(item.path)

      await expect(page).toHaveURL(new RegExp(`${item.path.replace(/\//g, '\\/')}$`))
      // 布局与侧边栏渲染出来，说明路由与菜单权限均正常
      await expect(page.locator('.layout')).toBeVisible()
      await expect(page.locator('.sidebar__el-menu .el-menu-item').first()).toBeVisible()

      expect(pageErrors, `${item.path} 出现未捕获异常`).toEqual([])
    })
  }
})
