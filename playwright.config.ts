import { defineConfig, devices } from '@playwright/test'

/**
 * 端口可通过 E2E_PORT 覆盖：本机若已有旧的 dev server 占用 5173（常见于 HMR 失效的
 * 残留进程），可用 `E2E_PORT=5174 npx playwright test` 另起一个干净的实例。
 */
const PORT = Number(process.env.E2E_PORT ?? 5173)
const BASE_URL = `http://localhost:${PORT}`

/**
 * Playwright E2E 测试配置
 *
 * 【位置】本文件必须位于仓库根目录。
 * Playwright 只在「当前工作目录」查找 playwright.config.ts。此前它放在 tests/e2e/ 下，
 * 从根目录执行 `npx playwright test` 时配置根本不被加载，baseURL 缺失会让
 * page.goto('/teacher') 这类相对路径变成非法 URL（报 Cannot navigate to invalid URL）。
 *
 * 测试账号：
 * - 学生端：202401002（「学生登录」Tab）
 * - 教师端：T00003  （「管理员登录」Tab —— 登录页只有学生/管理员两个 Tab）
 * - 管理员端：A00002（「管理员登录」Tab）
 * 密码不写入仓库，运行前通过环境变量 VITE_E2E_PASSWORD（或 E2E_PASSWORD）提供。
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
    baseURL: BASE_URL,
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
    command: `npm run dev -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    // 测试用 dev server 注入免验证码账号：与后端 application-test.yml 的 skip-users 对齐。
    // 说明：仅影响 Playwright 拉起的测试实例，不影响生产构建（request.ts 另有 DEV 门控）。
    env: {
      VITE_CAPTCHA_SKIP_ACCOUNTS: process.env.E2E_CAPTCHA_ACCOUNTS ?? '202401002,T00003,A00002',
    },
  },
})
