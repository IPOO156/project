/**
 * 教师端 E2E 测试
 * 测试账号：T00003 / 123456
 */
import { expect, test } from '@playwright/test'

test.describe('教师端登录', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('登录成功', async ({ page }) => {
    // 输入账号
    await page.locator('input[placeholder*="工号"]').fill('T00003')
    // 输入密码
    await page.locator('input[placeholder*="密码"]').fill('123456')
    // 点击登录
    await page.locator('button:has-text("登录")').click()
    // 等待跳转到首页
    await expect(page).toHaveURL(/\/teacher/)
    // 验证用户信息显示
    await expect(page.locator('.user-name')).toBeVisible()
  })

  test('登录失败 - 密码错误', async ({ page }) => {
    await page.locator('input[placeholder*="工号"]').fill('T00003')
    await page.locator('input[placeholder*="密码"]').fill('wrongpassword')
    await page.locator('button:has-text("登录")').click()
    // 验证错误提示
    await expect(page.locator('.error-message')).toBeVisible()
  })
})

test.describe('教师端首页', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/teacher')
    // 登录
    await page.locator('input[placeholder*="工号"]').fill('T00003')
    await page.locator('input[placeholder*="密码"]').fill('123456')
    await page.locator('button:has-text("登录")').click()
    await page.waitForURL(/\/teacher/)
  })

  test('首页显示正常', async ({ page }) => {
    // 验证导航菜单显示
    await expect(page.locator('.teacher-menu')).toBeVisible()
    // 验证工作台信息
    await expect(page.locator('.dashboard-summary')).toBeVisible()
  })

  test('查看教学任务', async ({ page }) => {
    // 点击教学任务
    await page.locator('.nav-item:has-text("教学任务")').click()
    await expect(page).toHaveURL(/.*teacher\/teaching-tasks/)

    // 验证任务列表显示
    await expect(page.locator('.task-list')).toBeVisible()
    // 验证至少有一条任务记录
    const rows = await page.locator('table tbody tr').count()
    expect(rows).toBeGreaterThan(0)
  })
})

test.describe('教师端学生管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/teacher')
    // 登录
    await page.locator('input[placeholder*="工号"]').fill('T00003')
    await page.locator('input[placeholder*="密码"]').fill('123456')
    await page.locator('button:has-text("登录")').click()
    await page.waitForURL(/\/teacher/)
  })

  test('查看学生列表', async ({ page }) => {
    // 点击学生管理
    await page.locator('.nav-item:has-text("学生管理")').click()
    await expect(page).toHaveURL(/.*teacher\/students/)

    // 验证学生列表显示
    await expect(page.locator('.student-table')).toBeVisible()
    // 验证至少有一个学生
    const rows = await page.locator('.student-table tbody tr').count()
    expect(rows).toBeGreaterThan(0)
  })

  test('按专业/班级筛选学生', async ({ page }) => {
    await page.locator('.nav-item:has-text("学生管理")').click()
    await page.waitForURL(/.*teacher\/students/)

    // 选择专业
    await page.locator('select[name="major"]').selectOption('计算机科学与技术')
    // 选择班级
    await page.locator('select[name="class"]').selectOption('计算机2201班')
    // 点击查询
    await page.locator('button:has-text("查询")').click()

    // 验证筛选后的结果
    await expect(page.locator('.student-table')).toBeVisible()
  })

  test('查看学生详情', async ({ page }) => {
    await page.locator('.nav-item:has-text("学生管理")').click()
    await page.waitForURL(/.*teacher\/students/)

    // 点击第一个学生
    await page.locator('.student-table tbody tr').first().click()

    // 验证学生详情显示
    await expect(page.locator('.student-detail')).toBeVisible()
  })
})

test.describe('教师端成绩管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/teacher')
    // 登录
    await page.locator('input[placeholder*="工号"]').fill('T00003')
    await page.locator('input[placeholder*="密码"]').fill('123456')
    await page.locator('button:has-text("登录")').click()
    await page.waitForURL(/\/teacher/)
  })

  test('录入成绩', async ({ page }) => {
    // 点击成绩管理
    await page.locator('.nav-item:has-text("成绩录入")').click()
    await expect(page).toHaveURL(/.*teacher\/grades/)

    // 点击新增成绩
    await page.locator('button:has-text("新增")').click()

    // 填写成绩表单
    await page.locator('select[name="course"]').selectOption('高等数学')
    await page.locator('input[name="studentId"]').fill('202401002')
    await page.locator('input[name="score"]').fill('85')
    await page.locator('input[name="semester"]').fill('2023-2024-1')

    // 提交成绩
    await page.locator('button:has-text("确定")').click()

    // 验证录入成功提示
    await expect(page.locator('.toast-success')).toBeVisible()
  })

  test('查看成绩统计', async ({ page }) => {
    await page.locator('.nav-item:has-text("成绩统计")').click()
    await expect(page).toHaveURL(/.*teacher\/grade-statistics/)

    // 验证统计图表显示
    await expect(page.locator('.grade-chart')).toBeVisible()
    // 验证统计表格显示
    await expect(page.locator('.stat-table')).toBeVisible()
  })
})

test.describe('教师端教学评价', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/teacher')
    // 登录
    await page.locator('input[placeholder*="工号"]').fill('T00003')
    await page.locator('input[placeholder*="密码"]').fill('123456')
    await page.locator('button:has-text("登录")').click()
    await page.waitForURL(/\/teacher/)
  })

  test('查看评价统计', async ({ page }) => {
    // 点击教学评价
    await page.locator('.nav-item:has-text("教学评价")').click()
    await expect(page).toHaveURL(/.*teacher\/evaluation/)

    // 验证评价数据展示
    await expect(page.locator('.evaluation-summary')).toBeVisible()
    // 验证评价列表
    await expect(page.locator('.evaluation-list')).toBeVisible()
  })
})

test.describe('教师端退出登录', () => {
  test('正常退出登录', async ({ page }) => {
    await page.goto('/teacher')
    // 登录
    await page.locator('input[placeholder*="工号"]').fill('T00003')
    await page.locator('input[placeholder*="密码"]').fill('123456')
    await page.locator('button:has-text("登录")').click()
    await page.waitForURL(/\/teacher/)

    // 点击退出
    await page.locator('.user-menu').click()
    await page.locator('.user-menu:has-text("退出登录")').click()

    // 验证跳转到登录页
    await expect(page).toHaveURL('/')
    // 验证输入框被清空
    await expect(page.locator('input[placeholder*="工号"]').inputValue()).toBe('')
  })
})
