import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

/**
 * 教师端「权限码 → 模块 / 页内 Tab」回归（全接口 mock，不需要后端隧道）。
 *
 * 与 teacher-authz.spec.ts 的区别：那份用例依赖真实后端登录与 VITE_E2E_PASSWORD，
 * 只能在本机联调环境跑；本文件用 addInitScript 预置登录态（token + 身份缓存 +
 * /auth/me 缓存），接口由 page.route 接管，可在本地与 CI 稳定执行。
 *
 * 断言目标完全一致：权限码决定模块能否进入、页内 Tab 是否展示。
 */

interface TeacherMeOptions {
  permissions: string[]
  roles?: string[]
  roleNames?: string[]
}

function buildMe({ permissions, roles = ['teacher'], roleNames }: TeacherMeOptions) {
  return {
    userId: 1,
    userNo: 'T0001',
    name: '测试教师',
    email: null,
    phone: null,
    gender: 0,
    genderLabel: '',
    schoolId: 1,
    schoolName: '测试大学',
    roles,
    roleNames: roleNames ?? [roles[0]],
    permissions,
    scopes: [],
    avatar: null,
  }
}

/** 预置登录态：token、端级身份缓存、/auth/me 缓存（含权限码） */
async function presetTeacherState(page: Page, me: TeacherMeOptions): Promise<void> {
  await page.addInitScript((user) => {
    sessionStorage.setItem('token', 'mock-access-token')
    if (!localStorage.getItem('user_info_cache')) {
      localStorage.setItem(
        'user_info_cache',
        JSON.stringify({
          id: '1',
          username: 'T0001',
          realName: user.name,
          email: '',
          phone: '',
          loginType: 'teacher',
        }),
      )
    }
    // 仅在缺失时写入：同一条用例内可通过 evaluate 覆盖权限后重新加载
    if (!localStorage.getItem('teacher_me')) {
      localStorage.setItem('teacher_me', JSON.stringify(user))
    }
  }, me)
}

/** 覆盖 /auth/me 缓存，用于同一用例内切换权限码 */
async function overrideMe(page: Page, me: TeacherMeOptions): Promise<void> {
  await page.evaluate(
    (user) => localStorage.setItem('teacher_me', JSON.stringify(user)),
    buildMe(me),
  )
}

const EMPTY_LIST = {
  list: [],
  total: 0,
  records: [],
  pagination: { page: 1, per_page: 10, total: 0, total_pages: 0 },
}

/** 接管 /api/v1/**：只保证页面可渲染，不伪造业务断言 */
async function mockTeacherApi(page: Page, me: TeacherMeOptions): Promise<void> {
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api\/v1/, '')
    const data = path === '/auth/me' ? buildMe(me) : EMPTY_LIST
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
  })
}

/** 以指定权限进入教师端（首次加载前预置登录态与接口 mock） */
async function enterAs(page: Page, me: TeacherMeOptions, path: string): Promise<void> {
  await mockTeacherApi(page, me)
  await presetTeacherState(page, me)
  await page.goto(path)
}

test.describe('教师端权限码驱动入口（mock）', () => {
  // 首次访问时 Vite 需现场编译页面，默认 10s 动作超时在冷启动时会误判失败
  test.use({ actionTimeout: 20000 })

  test('系统管理按 Tab 权限收窄：仅字典权限只显示「字典管理」', async ({ page }) => {
    await enterAs(page, { permissions: ['dictionary:manage'] }, '/teacher/system-management')

    const tabs = page.locator('.system-management .el-tabs__item')
    await expect(tabs).toHaveCount(1)
    await expect(tabs.first()).toHaveText('字典管理')
  })

  test('仅持学期导入权限时，系统管理只显示「学期管理」Tab', async ({ page }) => {
    await enterAs(page, { permissions: ['semester:import'] }, '/teacher/system-management')

    const tabs = page.locator('.system-management .el-tabs__item')
    await expect(tabs).toHaveCount(1)
    await expect(tabs.first()).toHaveText('学期管理')
  })

  test('组织架构权限不进入系统管理（该页没有组织 Tab）', async ({ page }) => {
    await enterAs(page, { permissions: ['org:manage'] }, '/teacher/system-management')

    // 模块判定不通过，守卫回落到教师首页；组织架构是独立模块
    await expect(page).toHaveURL(/\/teacher\/dashboard/)
  })

  test('账号与角色使用真实权限码 user:manage 时可进入', async ({ page }) => {
    await enterAs(page, { permissions: ['user:manage'] }, '/teacher/account-role')

    await expect(page).toHaveURL(/\/teacher\/account-role/)
    await expect(page.locator('.account-role .el-tabs__item')).toHaveCount(4)
  })

  test('回归：不存在的 system:user:manage 不再放行账号与角色', async ({ page }) => {
    await enterAs(page, { permissions: ['system:user:manage'] }, '/teacher/account-role')

    // 模块判定不通过，守卫回落到教师首页
    await expect(page).toHaveURL(/\/teacher\/dashboard/)
  })

  test('日志查看只认后端真实码 log:view，log:audit 不单独放行', async ({ page }) => {
    await enterAs(page, { permissions: ['log:audit'] }, '/teacher/log-view')
    await expect(page).toHaveURL(/\/teacher\/dashboard/)

    await overrideMe(page, { permissions: ['log:view'] })
    await page.goto('/teacher/log-view')
    await expect(page).toHaveURL(/\/teacher\/log-view/)
  })

  test('管理员（admin 角色）可看到系统管理全部 Tab', async ({ page }) => {
    await enterAs(
      page,
      { permissions: [], roles: ['admin'], roleNames: ['管理员'] },
      '/teacher/system-management',
    )

    const tabs = page.locator('.system-management .el-tabs__item')
    await expect(tabs).toHaveCount(3)
    await expect(tabs.nth(0)).toHaveText('字典管理')
    await expect(tabs.nth(1)).toHaveText('角色管理')
    await expect(tabs.nth(2)).toHaveText('学期管理')
  })
})
