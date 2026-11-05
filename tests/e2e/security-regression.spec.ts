import { expect, test } from '@playwright/test'
import { ACCOUNTS, login } from './helpers/login'

/**
 * 安全回归：登出时必须清除当前用户命名空间下的表单草稿与撤回标记。
 *
 * 这些键包含学生未提交的个人信息；共享浏览器场景下若残留，下一个使用者可通过
 * 开发者工具读取。用例只操作本地 localStorage 与真实登出按钮，不伪造接口。
 */
test('登出清理当前用户草稿与撤回标记，不误删其他账号', async ({ page }) => {
  await login(page, 'student', ACCOUNTS.student)

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

  // 清理用例自身写入的其他账号键，避免污染后续运行
  await page.evaluate((key) => localStorage.removeItem(key), otherDraft)
})
