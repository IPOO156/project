import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E 测试配置
 *
 * 【位置】本文件必须位于仓库根目录。
 * Playwright 只在「当前工作目录」查找 playwright.config.ts。此前它放在 tests/e2e/ 下，
 * 从根目录执行 `npx playwright test` 时配置根本不被加载，baseURL 缺失会让
 * page.goto('/teacher') 这类相对路径变成非法 URL（报 Cannot navigate to invalid URL）。
 *
 * 测试账号：
 * - 学生端：202401002 / 123456  （「学生登录」Tab）
 * - 教师端：T00003   / 123456  （「管理员登录」Tab —— 登录页只有学生/管理员两个 Tab）
 * - 管理员端：A00002 / 123456  （「管理员登录」Tab）
 */
export default defineConfig({
  testDir: './tests/e2e',

  // 串行执行。联调后端走 natapp 免费隧道，有「每分钟连接数」限流，
  // 并发请求会触发隧道返回畸形响应，经 Vite 代理表现为空 body 500，造成假失败。
  fullyParallel: false,
  workers: 1,

  forbidOnly: !!process.env.CI,
  // 本地也开 1 次重试：联调后端在 natapp 免费隧道后面，偶发的空 body 500 会让
  // 「整页重载时应用初始化接口失败 → 守卫弹回 /login」这类用例假失败（非代码缺陷）。
  // 真实缺陷两次都会失败，不会因此漏检。Playwright 会把重试通过的用例单列为 flaky。
  retries: process.env.CI ? 2 : 1,

  reporter: [
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: true,
    navigationTimeout: 30000,
    actionTimeout: 10000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    // 本项目用 npm（原配置写的 pnpm dev，本机无 pnpm，dev server 未启动时会拉起失败）
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
