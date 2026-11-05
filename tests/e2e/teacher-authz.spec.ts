import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { ACCOUNTS, login } from './helpers/login'

/**
 * 教师端「权限码 → 模块 / 页内 Tab」回归。
 *
 * 只改写本地 `teacher_me` 缓存来模拟不同授权数据，不拦截或伪造任何业务接口：
 * 断言的是页面是否展示入口，接口是否成功仍由真实后端决定。
 */
async function overrideMe(page: Page, permissions: string[], roles: string[] = ['teacher']) {
  await page.evaluate(
    ({ permissions, roles }) => {
      const key = 'teacher_me'
      const raw = localStorage.getItem(key)
      const me = raw ? JSON.parse(raw) : {}
      localStorage.setItem(
        key,
        JSON.stringify({ ...me, roles, roleNames: [roles[0]], permissions }),
      )
    },
    { permissions, roles },
  )
}

test.describe('教师端权限码驱动入口', () => {
  test('系统设置按 Tab 权限收窄：仅字典权限只显示「数据字典」', async ({ page }) => {
    await login(page, 'admin', ACCOUNTS.teacher)
    await overrideMe(page, ['dictionary:manage'])
    await page.goto('/teacher/system-settings')

    const tabs = page.locator('.system-settings .el-tabs__item')
    await expect(tabs).toHaveCount(1)
    await expect(tabs.first()).toHaveText('数据字典')
  })

  test('仅持学期导入权限时，系统设置只显示「学期设置」Tab', async ({ page }) => {
    await login(page, 'admin', ACCOUNTS.teacher)
    await overrideMe(page, ['semester:import'])
    await page.goto('/teacher/system-settings')

    const tabs = page.locator('.system-settings .el-tabs__item')
    await expect(tabs).toHaveCount(1)
    await expect(tabs.first()).toHaveText('学期设置')
  })

  test('组织架构权限不进入系统设置（该页没有组织 Tab）', async ({ page }) => {
    await login(page, 'admin', ACCOUNTS.teacher)
    await overrideMe(page, ['org:manage'])
    await page.goto('/teacher/system-settings')

    // 模块判定不通过，守卫回落到教师首页；组织架构是独立模块
    await expect(page).toHaveURL(/\/teacher\/dashboard/)
  })

  test('账号与角色使用真实权限码 user:manage 时可进入', async ({ page }) => {
    await login(page, 'admin', ACCOUNTS.teacher)
    await overrideMe(page, ['user:manage'])
    await page.goto('/teacher/account-role')

    await expect(page).toHaveURL(/\/teacher\/account-role/)
    await expect(page.locator('.account-role .el-tabs__item')).toHaveCount(4)
  })

  test('回归：不存在的 system:user:manage 不再放行账号与角色', async ({ page }) => {
    await login(page, 'admin', ACCOUNTS.teacher)
    await overrideMe(page, ['system:user:manage'])
    await page.goto('/teacher/account-role')

    // 模块判定不通过，守卫回落到教师首页
    await expect(page).toHaveURL(/\/teacher\/dashboard/)
  })

  test('操作日志只认后端真实码 log:view，log:audit 不单独放行', async ({ page }) => {
    await login(page, 'admin', ACCOUNTS.teacher)
    await overrideMe(page, ['log:audit'])
    await page.goto('/teacher/log-view')
    await expect(page).toHaveURL(/\/teacher\/dashboard/)

    await overrideMe(page, ['log:view'])
    await page.goto('/teacher/log-view')
    await expect(page).toHaveURL(/\/teacher\/system-settings/)
    await expect(page).toHaveURL(/tab=logs/)
  })

  test('管理员（admin 角色）可看到系统设置全部 5 个 Tab', async ({ page }) => {
    await login(page, 'admin', ACCOUNTS.admin)
    await page.goto('/teacher/system-settings')

    const tabs = page.locator('.system-settings .el-tabs__item')
    await expect(tabs).toHaveCount(5)
    await expect(tabs.nth(0)).toHaveText('数据字典')
    await expect(tabs.nth(1)).toHaveText('学期设置')
    await expect(tabs.nth(2)).toHaveText('系统配置')
    await expect(tabs.nth(3)).toHaveText('定时任务')
    await expect(tabs.nth(4)).toHaveText('操作日志')
  })
})
