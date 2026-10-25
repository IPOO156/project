import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

/**
 * 安全回归（全接口 mock，不需要后端隧道）。
 *
 * 与 security-regression.spec.ts 的区别：那份用例依赖真实后端登录与
 * VITE_E2E_PASSWORD；本文件预置学生登录态，接口由 page.route 接管，
 * 可在本地与 CI 稳定执行。
 *
 * 用例目标一致：登出必须清除当前用户命名空间下的表单草稿与撤回标记，
 * 且不误删其他账号命名空间的数据。
 */

const STUDENT_ME = {
  userId: 1,
  userNo: '202401002',
  name: '测试学生',
  email: 'student@example.com',
  phone: null,
  gender: 1,
  genderLabel: '男',
  schoolId: 1,
  schoolName: '测试大学',
  roles: ['student'],
  roleNames: ['学生'],
  permissions: [],
  scopes: [],
  avatar: null,
}

async function presetStudentState(page: Page): Promise<void> {
  // addInitScript 在每次导航时都会执行：登出后跳 /login 会再次注入，
  // 让「登出已清空身份缓存」的断言永远看不到真实结果。用一次性标记只在首屏注入。
  await page.addInitScript((user) => {
    if (sessionStorage.getItem('e2e:seeded')) return
    sessionStorage.setItem('e2e:seeded', '1')
    sessionStorage.setItem('token', 'mock-access-token')
    localStorage.setItem(
      'user_info_cache',
      JSON.stringify({
        id: String(user.userId),
        username: user.userNo,
        realName: user.name,
        email: user.email,
        phone: '',
        loginType: 'student',
      }),
    )
  }, STUDENT_ME)
}

async function mockApi(page: Page): Promise<void> {
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api\/v1/, '')
    const data =
      path === '/auth/me'
        ? STUDENT_ME
        : {
            list: [],
            total: 0,
            records: [],
            pagination: { page: 1, per_page: 10, total: 0, total_pages: 0 },
          }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data }),
    })
  })
}

test.describe('登出清理（mock）', () => {
  test.use({ actionTimeout: 20000 })

  test('登出清理当前用户草稿与撤回标记，不误删其他账号', async ({ page }) => {
    await mockApi(page)
    await presetStudentState(page)
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard/)

    const scope = await page.evaluate(() => {
      const raw = localStorage.getItem('user_info_cache')
      const info = raw ? (JSON.parse(raw) as { id?: string | number; studentId?: string }) : {}
      return String(info.id ?? info.studentId ?? '')
    })
    expect(scope).not.toBe('')

    const ownDraft = `form_draft_security_regression::u${scope}`
    const ownWithdrawn = `submission:withdrawnIds::u${scope}`
    const otherDraft = 'form_draft_security_regression::u999999'

    await page.evaluate(
      ({ ownDraft, ownWithdrawn, otherDraft }) => {
        localStorage.setItem(ownDraft, JSON.stringify({ name: '测试草稿' }))
        localStorage.setItem(ownWithdrawn, JSON.stringify(['1']))
        localStorage.setItem(otherDraft, JSON.stringify({ name: '其他账号草稿' }))
      },
      { ownDraft, ownWithdrawn, otherDraft },
    )

    await page.locator('.header__user').click()
    await page.getByText('退出登录', { exact: true }).click()

    await expect(page).toHaveURL(/\/login/)

    const result = await page.evaluate(
      ({ ownDraft, ownWithdrawn, otherDraft }) => ({
        ownDraft: localStorage.getItem(ownDraft),
        ownWithdrawn: localStorage.getItem(ownWithdrawn),
        otherDraft: localStorage.getItem(otherDraft),
        userCache: localStorage.getItem('user_info_cache'),
      }),
      { ownDraft, ownWithdrawn, otherDraft },
    )

    expect(result.ownDraft).toBeNull()
    expect(result.ownWithdrawn).toBeNull()
    expect(result.otherDraft).not.toBeNull()
    expect(result.userCache).toBeNull()
  })
})
