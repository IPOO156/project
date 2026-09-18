/**
 * 学生端 E2E 测试
 * 测试账号：202401002 / 123456
 */
import { expect, test } from '@playwright/test'

test.describe('学生端登录', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('登录成功', async ({ page }) => {
    // 输入账号
    await page.locator('input[placeholder*="学号"]').fill('202401002')
    // 输入密码
    await page.locator('input[placeholder*="密码"]').fill('123456')
    // 点击登录
    await page.locator('button:has-text("登录")').click()
    // 等待跳转到首页
    await expect(page).toHaveURL(/\/student/)
    // 验证用户信息显示
    await expect(page.locator('.user-name')).toBeVisible()
  })

  test('登录失败 - 密码错误', async ({ page }) => {
    await page.locator('input[placeholder*="学号"]').fill('202401002')
    await page.locator('input[placeholder*="密码"]').fill('wrongpassword')
    await page.locator('button:has-text("登录")').click()
    // 验证错误提示
    await expect(page.locator('.error-message')).toBeVisible()
  })
})

test.describe('学生端首页', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/student')
    // 登录
    await page.locator('input[placeholder*="学号"]').fill('202401002')
    await page.locator('input[placeholder*="密码"]').fill('123456')
    await page.locator('button:has-text("登录")').click()
    await page.waitForURL(/\/student/)
  })

  test('首页显示正常', async ({ page }) => {
    // 验证导航菜单显示
    await expect(page.locator('.student-menu')).toBeVisible()
    // 验证欢迎信息
    await expect(page.locator('.welcome-message')).toBeVisible()
  })

  test('查看档案信息', async ({ page }) => {
    // 点击档案管理
    await page.locator('.nav-item:has-text("档案管理")').click()
    await expect(page).toHaveURL(/.*student\/profile/)
    // 验证档案信息显示
    await expect(page.locator('.profile-card')).toBeVisible()
  })

  test('修改个人密码', async ({ page }) => {
    // 进入个人中心
    await page.locator('.user-menu').click()
    await page.locator('.user-menu:has-text("个人中心")').click()

    // 修改密码
    await page.locator('input[name="oldPassword"]').fill('123456')
    await page.locator('input[name="newPassword"]').fill('newpass123')
    await page.locator('input[name="confirmPassword"]').fill('newpass123')
    await page.locator('button:has-text("确定")').click()

    // 验证密码修改成功提示
    await expect(page.locator('.success-message')).toBeVisible()
  })
})

test.describe('学生端成绩管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/student')
    // 登录
    await page.locator('input[placeholder*="学号"]').fill('202401002')
    await page.locator('input[placeholder*="密码"]').fill('123456')
    await page.locator('button:has-text("登录")').click()
    await page.waitForURL(/\/student/)
  })

  test('查看成绩列表', async ({ page }) => {
    // 点击成绩管理
    await page.locator('.nav-item:has-text("成绩查询")').click()
    await expect(page).toHaveURL(/.*student\/grades/)

    // 验证成绩表格显示
    await expect(page.locator('table')).toBeVisible()
    // 验证至少有一条成绩记录
    const rows = await page.locator('table tbody tr').count()
    expect(rows).toBeGreaterThan(0)
  })

  test('按学期筛选成绩', async ({ page }) => {
    await page.locator('.nav-item:has-text("成绩查询")').click()
    await page.waitForURL(/.*student\/grades/)

    // 选择学期
    await page.locator('select[name="semester"]').selectOption('2023-2024-1')
    // 点击查询
    await page.locator('button:has-text("查询")').click()

    // 验证筛选后的结果
    await expect(page.locator('table')).toBeVisible()
  })
})

test.describe('学生端课程选课', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/student')
    // 登录
    await page.locator('input[placeholder*="学号"]').fill('202401002')
    await page.locator('input[placeholder*="密码"]').fill('123456')
    await page.locator('button:has-text("登录")').click()
    await page.waitForURL(/\/student/)
  })

  test('查看可选课程', async ({ page }) => {
    // 点击选课中心
    await page.locator('.nav-item:has-text("选课中心")').click()
    await expect(page).toHaveURL(/.*student\/courses/)

    // 验证课程列表显示
    await expect(page.locator('.course-list')).toBeVisible()
  })

  test('选课功能', async ({ page }) => {
    await page.locator('.nav-item:has-text("选课中心")').click()
    await page.waitForURL(/.*student\/courses/)

    // 找到可选课程并点击选课
    const firstCourse = page.locator('.course-card').first()
    await firstCourse.locator('.btn-select').click()

    // 验证选课成功提示
    await expect(page.locator('.toast-success')).toBeVisible()
  })
})

test.describe('学生端通知公告', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/student')
    // 登录
    await page.locator('input[placeholder*="学号"]').fill('202401002')
    await page.locator('input[placeholder*="密码"]').fill('123456')
    await page.locator('button:has-text("登录")').click()
    await page.waitForURL(/\/student/)
  })

  test('查看通知公告列表', async ({ page }) => {
    // 点击通知公告
    await page.locator('.nav-item:has-text("通知公告")').click()
    await expect(page).toHaveURL(/.*student\/announcements/)

    // 验证通知列表显示
    await expect(page.locator('.announcement-list')).toBeVisible()
  })

  test('查看公告详情', async ({ page }) => {
    await page.locator('.nav-item:has-text("通知公告")').click()
    await page.waitForURL(/.*student\/announcements/)

    // 点击第一条公告
    await page.locator('.announcement-item').first().click()

    // 验证公告详情显示
    await expect(page.locator('.announcement-detail')).toBeVisible()
  })
})

test.describe('学生端退出登录', () => {
  test('正常退出登录', async ({ page }) => {
    await page.goto('/student')
    // 登录
    await page.locator('input[placeholder*="学号"]').fill('202401002')
    await page.locator('input[placeholder*="密码"]').fill('123456')
    await page.locator('button:has-text("登录")').click()
    await page.waitForURL(/\/student/)

    // 点击退出
    await page.locator('.user-menu').click()
    await page.locator('.user-menu:has-text("退出登录")').click()

    // 验证跳转到登录页
    await expect(page).toHaveURL('/')
    // 验证输入框被清空
    await expect(page.locator('input[placeholder*="学号"]').inputValue()).toBe('')
  })
})
