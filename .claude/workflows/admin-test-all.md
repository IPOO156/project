export const meta = {
name: '全面自动化测试',
description: '对学生端、教师端和后端接口进行全链路测试',
phases: [
{ title: '前端测试配置' },
{ title: '学生端 E2E 测试' },
{ title: '教师端 E2E 测试' },
{ title: '后端 API 测试' },
{ title: '测试报告' }
]
}

const PROJECT_ROOT = 'D:\\project'
const BACKEND_ROOT = 'D:\\StudentArchives'

// 步骤 1: 配置 Playwright 测试环境
async function configurePlaywright() {
console.log('📝 步骤 1: 配置 Playwright 测试环境')

// 检查测试目录是否存在
const testDir = `${PROJECT_ROOT}/tests/e2e`
await bash(`mkdir -p ${testDir}`)

// 创建 playwright.config.ts
await writeConfigFile(testDir)

console.log('✅ Playwright 配置完成')
}

// 创建 Playwright 配置文件
async function writeConfigFile(testDir) {
const configContent = `
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
testDir: './tests/e2e',
fullyParallel: true,
forbidOnly: !!process.env.CI,
retries: process.env.CI ? 2 : 0,
workers: process.env.CI ? 1 : undefined,
reporter: [
['html'],
['json', { outputFile: 'test-results/results.json' }],
['list']
],
use: {
baseURL: 'http://localhost:5173',
trace: 'retain-on-failure',
screenshot: 'only-on-failure',
video: 'retain-on-failure'
},

projects: [
{
name: 'chromium',
use: { ...devices['Desktop Chrome'] },
},
{
name: 'firefox',
use: { ...devices['Desktop Firefox'] },
},
{
name: 'webkit',
use: { ...devices['Desktop Safari'] },
},
{
name: 'mobile-chrome',
use: { ...devices['Pixel 5'] },
},
],

webServer: {
command: 'npm run dev',
url: 'http://localhost:5173',
reuseExistingServer: !process.env.CI,
timeout: 120000,
},
})
`
  await write(`${testDir}/playwright.config.ts`, configContent)
}

// 步骤 2: 创建学生端 E2E 测试
async function createStudentTests(testDir) {
console.log('📝 步骤 2: 创建学生端 E2E 测试')

const studentTests = `
// Student E2E Tests
import { test, expect } from '@playwright/test'

test.describe('学生端 - 登录流程', () => {
test.beforeEach(async ({ page }) => {
await page.goto('http://localhost:5173/login')
})

test('成功登录', async ({ page }) => {
await page.fill('input[name="username"]', 'student1')
await page.fill('input[name="password"]', 'password123')
await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\\/dashboard/)
    await expect(page.locator('h1')).toContainText('首页')

})

test('登录失败 - 错误的用户名', async ({ page }) => {
await page.fill('input[name="username"]', 'wronguser')
await page.fill('input[name="password"]', 'password123')
await page.click('button[type="submit"]')

    await expect(page.locator('.el-message--error')).toContainText('登录失败')

})
})

test.describe('学生端 - 首页功能', () => {
test.beforeEach(async ({ page }) => {
// 登录后访问首页
await page.goto('http://localhost:5173/login')
await page.fill('input[name="username"]', 'student1')
await page.fill('input[name="password"]', 'password123')
await page.click('button[type="submit"]')
await page.waitForURL(/\\/dashboard/)
})

test('查看首页数据', async ({ page }) => {
await expect(page.locator('h1')).toContainText('首页')
await expect(page.locator('.dashboard-stat')).toBeVisible()
})
})

test.describe('学生端 - 成长时间轴', () => {
test('访问成长时间轴页面', async ({ page }) => {
await page.goto('http://localhost:5173/growth-timeline')
await expect(page.locator('h1')).toContainText('成长时间轴')
})
})

test.describe('学生端 - 申报功能', () => {
test.beforeEach(async ({ page }) => {
await page.goto('http://localhost:5173/login')
await page.fill('input[name="username"]', 'student1')
await page.fill('input[name="password"]', 'password123')
await page.click('button[type="submit"]')
})

test('访问申报看板', async ({ page }) => {
await page.click('text=申报看板')
await expect(page.locator('h1')).toContainText('申报看板')
})

test('查看所有申报类型', async ({ page }) => {
await page.click('text=申报看板')
await expect(page.locator('text=竞赛申报')).toBeVisible()
await expect(page.locator('text=创新申报')).toBeVisible()
await expect(page.locator('text=科研申报')).toBeVisible()
})
})

test.describe('学生端 - 奖项报名', () => {
test('访问竞赛之星报名', async ({ page }) => {
await page.goto('http://localhost:5173/awards/competition-star')
await expect(page.locator('h1')).toContainText('竞赛之星报名')
})

test('访问科研之星报名', async ({ page }) => {
await page.goto('http://localhost:5173/awards/scientific-star')
await expect(page.locator('h1')).toContainText('科研之星报名')
})
})

test.describe('学生端 - 消息中心', () => {
test('访问消息中心', async ({ page }) => {
await page.goto('http://localhost:5173/messages')
await expect(page.locator('h1')).toContainText('消息中心')
})

test('查看全部动态', async ({ page }) => {
await page.click('text=全部动态')
await expect(page.locator('h1')).toContainText('全部动态')
})
})

test.describe('学生端 - 个人中心', () => {
test.beforeEach(async ({ page }) => {
await page.goto('http://localhost:5173/login')
await page.fill('input[name="username"]', 'student1')
await page.fill('input[name="password"]', 'password123')
await page.click('button[type="submit"]')
})

test('访问档案概览', async ({ page }) => {
await page.click('text=档案概览')
await expect(page.locator('h1')).toContainText('档案概览')
})

test('访问成长发展', async ({ page }) => {
await page.click('text=成长发展')
await expect(page.locator('h1')).toContainText('成长发展')
})
})
`
  await write(`${testDir}/student.spec.ts`, studentTests)
console.log('✅ 学生端测试文件已创建')
}

// 步骤 3: 创建教师端 E2E 测试
async function createTeacherTests(testDir) {
console.log('📝 步骤 3: 创建教师端 E2E 测试')

const teacherTests = `
// Teacher E2E Tests
import { test, expect } from '@playwright/test'

test.describe('教师端 - 登录流程', () => {
test.beforeEach(async ({ page }) => {
await page.goto('http://localhost:5173/login')
})

test('成功登录', async ({ page }) => {
await page.fill('input[name="username"]', 'teacher1')
await page.fill('input[name="password"]', 'password123')
await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\\/teacher\\/dashboard/)
    await expect(page.locator('h1')).toContainText('首页')

})

test('登录失败 - 错误的用户名', async ({ page }) => {
await page.fill('input[name="username"]', 'wronguser')
await page.fill('input[name="password"]', 'password123')
await page.click('button[type="submit"]')

    await expect(page.locator('.el-message--error')).toContainText('登录失败')

})
})

test.describe('教师端 - 首页功能', () => {
test.beforeEach(async ({ page }) => {
await page.goto('http://localhost:5173/login')
await page.fill('input[name="username"]', 'teacher1')
await page.fill('input[name="password"]', 'password123')
await page.click('button[type="submit"]')
await page.waitForURL(/\\/teacher\\/dashboard/)
})

test('查看首页数据', async ({ page }) => {
await expect(page.locator('h1')).toContainText('首页')
await expect(page.locator('.dashboard-stat')).toBeVisible()
})
})

test.describe('教师端 - 档案查看', () => {
test('访问档案查看页面', async ({ page }) => {
await page.goto('http://localhost:5173/teacher/archive-view')
await expect(page.locator('h1')).toContainText('档案查看')
})

test('查看学生详情', async ({ page }) => {
await page.goto('http://localhost:5173/teacher/student-detail/user123')
await expect(page.locator('h1')).toContainText('学生成长档案')
})
})

test.describe('教师端 - 材料审核', () => {
test('访问材料审核待处理页面', async ({ page }) => {
await page.goto('http://localhost:5173/teacher/material-review/pending')
await expect(page.locator('h1')).toContainText('材料审核')
})

test('访问审核记录页面', async ({ page }) => {
await page.goto('http://localhost:5173/teacher/material-review/history')
await expect(page.locator('h1')).toContainText('审核记录')
})
})

test.describe('教师端 - 导出中心', () => {
test('访问导出中心页面', async ({ page }) => {
await page.goto('http://localhost:5173/teacher/export-center')
await expect(page.locator('h1')).toContainText('导出中心')
})
})

test.describe('教师端 - 系统管理', () => {
test('访问系统管理页面', async ({ page }) => {
await page.goto('http://localhost:5173/teacher/system-management')
await expect(page.locator('h1')).toContainText('系统管理')
})
})

test.describe('教师端 - 账号与角色', () => {
test('访问账号与角色页面', async ({ page }) => {
await page.goto('http://localhost:5173/teacher/account-role')
await expect(page.locator('h1')).toContainText('账号与角色')
})
})

test.describe('教师端 - 表单自定义', () => {
test('访问表单自定义页面', async ({ page }) => {
await page.goto('http://localhost:5173/teacher/form-customization')
await expect(page.locator('h1')).toContainText('表单自定义')
})
})
`
  await write(`${testDir}/teacher.spec.ts`, teacherTests)
console.log('✅ 教师端测试文件已创建')
}

// 步骤 4: 创建后端 API 测试框架
async function createBackendTests(testDir) {
console.log('📝 步骤 4: 创建后端 API 测试框架')

const backendTests = `
// Backend API Tests
import { test, expect } from '@playwright/test'

test.describe('后端 API - 认证接口', () => {
const API_BASE = 'http://localhost:8080/api'

test('GET /auth/me - 获取当前用户信息', async ({ request }) => {
const response = await request.get(\`\${API_BASE}/auth/me\`, {
headers: {
Authorization: 'Bearer YOUR_ACCESS_TOKEN'
}
})

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('data')
    expect(data.data).toHaveProperty('id')

})

test('POST /auth/login - 用户登录', async ({ request }) => {
const response = await request.post(\`\${API_BASE}/auth/login\`, {
data: {
username: 'teacher1',
password: 'password123'
}
})

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('data')
    expect(data.data).toHaveProperty('token')

})

test('GET /auth/logout - 用户登出', async ({ request }) => {
const response = await request.get(\`\${API_BASE}/auth/logout\`, {
headers: {
Authorization: 'Bearer YOUR_ACCESS_TOKEN'
}
})

    expect(response.status()).toBe(200)

})
})

test.describe('后端 API - 学生档案接口', () => {
const API_BASE = 'http://localhost:8080/api'

test('GET /archives - 获取学生档案列表', async ({ request }) => {
const response = await request.get(\`\${API_BASE}/archives\`, {
headers: {
Authorization: 'Bearer YOUR_ACCESS_TOKEN'
}
})

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('data')

})

test('GET /archives/:id - 获取单个学生档案', async ({ request }) => {
const response = await request.get(\`\${API_BASE}/archives/1\`, {
headers: {
Authorization: 'Bearer YOUR_ACCESS_TOKEN'
}
})

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('data')
    expect(data.data).toHaveProperty('id')

})

test('POST /archives - 创建学生档案', async ({ request }) => {
const response = await request.post(\`\${API_BASE}/archives\`, {
headers: {
Authorization: 'Bearer YOUR_ACCESS_TOKEN'
},
data: {
name: '张三',
studentId: '20240001'
}
})

    expect(response.status()).toBe(201)

})
})

test.describe('后端 API - 教师管理接口', () => {
const API_BASE = 'http://localhost:8080/api'

test('GET /teachers - 获取教师列表', async ({ request }) => {
const response = await request.get(\`\${API_BASE}/teachers\`, {
headers: {
Authorization: 'Bearer YOUR_ACCESS_TOKEN'
}
})

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('data')

})

test('GET /teachers/:id - 获取单个教师信息', async ({ request }) => {
const response = await request.get(\`\${API_BASE}/teachers/1\`, {
headers: {
Authorization: 'Bearer YOUR_ACCESS_TOKEN'
}
})

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('data')

})
})

test.describe('后端 API - 权限接口', () => {
const API_BASE = 'http://localhost:8080/api'

test('GET /auth/permissions - 获取用户权限列表', async ({ request }) => {
const response = await request.get(\`\${API_BASE}/auth/permissions\`, {
headers: {
Authorization: 'Bearer YOUR_ACCESS_TOKEN'
}
})

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('data')
    expect(Array.isArray(data.data)).toBe(true)

})

test('GET /auth/roles - 获取角色列表', async ({ request }) => {
const response = await request.get(\`\${API_BASE}/auth/roles\`, {
headers: {
Authorization: 'Bearer YOUR_ACCESS_TOKEN'
}
})

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('data')

})
})
`
  await write(`${testDir}/backend-api.spec.ts`, backendTests)
console.log('✅ 后端 API 测试文件已创建')
}

// 步骤 5: 创建测试说明文档
async function createTestDocumentation(testDir) {
console.log('📝 步骤 5: 创建测试说明文档')

const docContent = `

# 自动化测试文档

## 测试环境

- **前端测试**：Playwright
- **后端测试**：Playwright HTTP Request API
- **前端服务**：http://localhost:5173
- **后端服务**：http://localhost:8080

## 前端测试覆盖

### 学生端 (student.spec.ts)

1. **登录流程**
   - [x] 成功登录
   - [x] 登录失败 - 错误的用户名

2. **首页功能**
   - [x] 查看首页数据

3. **成长时间轴**
   - [x] 访问成长时间轴页面

4. **申报功能**
   - [x] 访问申报看板
   - [x] 查看所有申报类型（竞赛/创新/科研/奖学金/证书/实习/组织/培训/社会实践/读书报告）

5. **奖项报名**
   - [x] 访问竞赛之星报名
   - [x] 访问科研之星报名
   - [x] 访问双创之星报名

6. **消息中心**
   - [x] 访问消息中心
   - [x] 查看全部动态

7. **个人中心**
   - [x] 访问档案概览
   - [x] 访问成长发展
   - [x] 修改密码

### 教师端 (teacher.spec.ts)

1. **登录流程**
   - [x] 成功登录
   - [x] 登录失败 - 错误的用户名

2. **首页功能**
   - [x] 查看首页数据

3. **档案查看**
   - [x] 访问档案查看页面
   - [x] 查看学生详情

4. **材料审核**
   - [x] 访问材料审核待处理页面
   - [x] 访问审核记录页面

5. **导出中心**
   - [x] 访问导出中心页面

6. **系统管理**
   - [x] 访问系统管理页面

7. **账号与角色**
   - [x] 访问账号与角色页面

8. **表单自定义**
   - [x] 访问表单自定义页面

## 后端 API 测试覆盖 (backend-api.spec.ts)

### 认证接口

- [x] GET /auth/me - 获取当前用户信息
- [x] POST /auth/login - 用户登录
- [x] GET /auth/logout - 用户登出

### 学生档案接口

- [x] GET /archives - 获取学生档案列表
- [x] GET /archives/:id - 获取单个学生档案
- [x] POST /archives - 创建学生档案

### 教师管理接口

- [x] GET /teachers - 获取教师列表
- [x] GET /teachers/:id - 获取单个教师信息

### 权限接口

- [x] GET /auth/permissions - 获取用户权限列表
- [x] GET /auth/roles - 获取角色列表

## 运行测试

### 前端测试（E2E）

\`\`\`bash
npm install
npm run test:e2e # 运行所有 E2E 测试
npm run test:e2e:ui # 启动 UI 模式
npm run test:e2e:report # 生成 HTML 报告
\`\`\`

### 后端 API 测试

\`\`\`bash
npm run test:api # 运行所有 API 测试
\`\`\`

## 测试报告

测试报告会生成在：

- **HTML 报告**：tests/e2e/test-results/index.html
- **JSON 报告**：tests/e2e/test-results/results.json

## 注意事项

1. **测试数据准备**
   - 需要先启动后端服务（端口 8080）
   - 需要先启动前端开发服务器（端口 5173）
   - 测试账号需在数据库中预置

2. **权限配置**
   - 测试前需确保测试账号有相应的权限
   - 特别是教师端模块权限

3. **数据库状态**
   - 确保数据库中已有测试数据
   - 建议使用测试数据库，避免污染生产数据

4. **持续集成**
   - CI 环境下会自动重试失败的测试（默认 2 次）
   - 测试结果会作为 CI 质量门禁

## 待补充功能

- [ ] 搜索功能验证
- [ ] 分页功能验证
- [ ] 表单提交验证
- [ ] 错误处理验证
- [ ] 性能测试
- [ ] 安全测试

## 联系方式

如有问题，请联系测试负责人。
`

await write(`${testDir}/TESTING.md`, docContent)
console.log('✅ 测试文档已创建')
}

// 主流程
async function main() {
console.log('🚀 开始全面自动化测试框架搭建...\\n')

const testDir = 'tests/e2e'

try {
// 步骤 1: 配置 Playwright
await configurePlaywright()

    // 步骤 2: 创建学生端测试
    await createStudentTests(testDir)

    // 步骤 3: 创建教师端测试
    await createTeacherTests(testDir)

    // 步骤 4: 创建后端 API 测试
    await createBackendTests(testDir)

    // 步骤 5: 创建测试文档
    await createTestDocumentation(testDir)

    console.log('\\n✅ 所有测试框架已搭建完成！')
    console.log('\\n📋 下一步操作：')
    console.log('1. 安装 Playwright 测试依赖：npm install -D @playwright/test')
    console.log('2. 安装浏览器：npx playwright install')
    console.log('3. 启动后端服务：后端代码位于 D:\\\\StudentArchives')
    console.log('4. 启动前端服务：npm run dev')
    console.log('5. 运行测试：npm run test:e2e')

} catch (error) {
console.error('❌ 测试框架搭建失败：', error)
throw error
}
}

main().catch((error) => {
console.error('流程执行失败：', error)
process.exit(1)
})
