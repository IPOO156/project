import { expect, test } from '@playwright/test'
import { login } from './helpers/login'
import { MOCK_ACTIVITY, mockApi } from './helpers/mockApi'

/**
 * 学生端主链路（全接口 mock，不需要后端隧道）。
 *
 * 与 student.spec.ts 的区别：那份用例依赖真实后端，只能在本机联调环境跑；
 * 本文件用 mockApi 把 /api/v1/** 全部接管，可在本地与 CI 稳定执行。
 * 覆盖：登录 → 首页 → 申报看板 → 404 兜底。
 */
test.describe('学生端主链路（mock）', () => {
  // 首次访问时 Vite 需现场编译页面，默认 10s 动作超时在冷启动时会误判失败
  test.use({ actionTimeout: 20000 })

  test.beforeEach(async ({ page }) => {
    await mockApi(page)
  })

  test('登录后进入学生首页', async ({ page }) => {
    // mock 场景下密码不参与校验，用显式假值，避免脚手架要求真实凭据
    await login(page, 'student', { userNo: '202401002', password: 'mock-password' })
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('全部动态展示接口返回的记录', async ({ page }) => {
    await login(page, 'student', { userNo: '202401002', password: 'mock-password' })
    await page.goto('/messages/activities')

    await expect(page.getByText(MOCK_ACTIVITY.title).first()).toBeVisible({ timeout: 15000 })
  })

  test('申报看板统计包含 mock 记录', async ({ page }) => {
    await login(page, 'student', { userNo: '202401002', password: 'mock-password' })
    await page.goto('/approval/pending')

    // 看板是聚合视图，不逐条展示标题；断言总数与分类卡片即可证明数据已流入
    await expect(page.getByText('申报总数')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('学科竞赛').first()).toBeVisible()
  })

  test('未知路径落到 404 兜底页', async ({ page }) => {
    await login(page, 'student', { userNo: '202401002', password: 'mock-password' })
    await page.goto('/this-path-does-not-exist')

    await expect(page.getByRole('heading', { name: '页面不存在' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('button', { name: /回到首页/ })).toBeVisible()
  })
})
