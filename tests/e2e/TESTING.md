# E2E 测试文档

> 学生端档案管理系统 - 端到端测试指南

---

## 一、测试环境

### 1.1 测试账号

| 角色     | 账号      | 密码   |
| -------- | --------- | ------ |
| 学生端   | 202401002 | 123456 |
| 教师端   | T00003    | 123456 |
| 管理员端 | A00002    | 123456 |

### 1.2 服务地址

- **前端服务**：`http://localhost:5173`
- **后端服务**：`http://localhost:8080`

### 1.3 测试工具

- **Playwright**：E2E 测试框架
- **Jest**：断言库
- **Junit Reporter**：测试结果报告

---

## 二、安装与配置

### 2.1 安装依赖

```bash
# 安装 Playwright
npm install -D @playwright/test

# 安装浏览器驱动
npx playwright install chromium

# 安装测试依赖
npm install -D jest-junit
```

### 2.2 配置文件

配置文件位于 `tests/e2e/playwright.config.ts`：

- 测试目录：`./e2e`
- 浏览器：Chromium（桌面版 Chrome）
- 并行测试：允许
- 失败重试：CI 环境重试 2 次
- 报告：HTML + Junit XML

### 2.3 启动测试

```bash
# 运行所有测试
npm run test:e2e

# 运行单个测试文件
npx playwright test student.spec.ts

# 运行指定测试
npx playwright test --grep "学生端登录"

# 以 UI 模式运行（推荐调试时使用）
npx playwright test --ui

# 唯一失败模式
npx playwright test --only-failed

# 失败时录制视频
npx playwright test --video on

# 查看测试报告
npx playwright show-report
```

---

## 三、测试覆盖范围

### 3.1 学生端测试

#### 文件：`student.spec.ts`

**1. 登录模块（2 个测试）**

- [x] 登录成功
- [x] 登录失败 - 密码错误

**2. 首页模块（3 个测试）**

- [x] 首页显示正常
- [x] 查看档案信息
- [x] 修改个人密码

**3. 成绩管理模块（2 个测试）**

- [x] 查看成绩列表
- [x] 按学期筛选成绩

**4. 课程选课模块（2 个测试）**

- [x] 查看可选课程
- [x] 选课功能

**5. 通知公告模块（2 个测试）**

- [x] 查看通知公告列表
- [x] 查看公告详情

**6. 退出登录模块（1 个测试）**

- [x] 正常退出登录

**小计：12 个测试用例**

---

### 3.2 教师端测试

#### 文件：`teacher.spec.ts`

**1. 登录模块（2 个测试）**

- [x] 登录成功
- [x] 登录失败 - 密码错误

**2. 首页模块（2 个测试）**

- [x] 首页显示正常
- [x] 查看教学任务

**3. 学生管理模块（3 个测试）**

- [x] 查看学生列表
- [x] 按专业/班级筛选学生
- [x] 查看学生详情

**4. 成绩管理模块（2 个测试）**

- [x] 录入成绩
- [x] 查看成绩统计

**5. 教学评价模块（1 个测试）**

- [x] 查看评价统计

**6. 退出登录模块（1 个测试）**

- [x] 正常退出登录

**小计：11 个测试用例**

---

### 3.3 后端 API 测试

#### 文件：`backend-api.spec.ts`

**1. 认证接口（6 个测试）**

- [x] 学生登录成功
- [x] 教师登录成功
- [x] 管理员登录成功
- [x] 密码错误
- [x] 账号不存在
- [x] 获取当前用户信息

**2. 学生接口（3 个测试）**

- [x] 获取学生档案
- [x] 获取学生成绩
- [x] 获取可选课程

**3. 教师接口（4 个测试）**

- [x] 获取学生列表
- [x] 获取成绩列表
- [x] 录入成绩
- [x] 获取统计数据

**4. 公共接口（3 个测试）**

- [x] 获取字典数据
- [x] 健康检查
- [x] 获取版本信息

**5. 错误处理（4 个测试）**

- [x] 404 处理
- [x] 500 处理
- [x] 未授权访问 - 缺少 token
- [x] 未授权访问 - 无效 token

**小计：20 个测试用例**

---

### 3.4 总计

- **测试文件数**：3 个
- **测试用例数**：43 个
- **覆盖模块**：
  - 学生端登录、首页、档案、成绩、选课、通知
  - 教师端登录、首页、学生管理、成绩、评价
  - 后端 API（认证、学生、教师、公共接口）

---

## 四、测试数据

### 4.1 学生数据

| 学号      | 姓名     | 班级         | 密码   |
| --------- | -------- | ------------ | ------ |
| 202401002 | 测试学生 | 计算机2201班 | 123456 |

### 4.2 教师数据

| 工号   | 姓名     | 职称 | 密码   |
| ------ | -------- | ---- | ------ |
| T00003 | 测试教师 | 讲师 | 123456 |

### 4.3 管理员数据

| 工号   | 姓名       | 角色       | 密码   |
| ------ | ---------- | ---------- | ------ |
| A00002 | 测试管理员 | 超级管理员 | 123456 |

---

## 五、测试报告

### 5.1 本地报告

运行测试后，测试报告会自动生成在 `tests/e2e/test-results/` 目录：

- **HTML 报告**：`html-report/`（直接打开 `html-report/index.html` 查看）
- **Junit 报告**：`test-results/junit.xml`

### 5.2 CI/CD 报告

在 CI 环境中，Junit XML 报告会自动上传到测试平台。

---

## 六、测试最佳实践

### 6.1 Page Object Model

建议将页面元素封装为 Page Objects，提高代码可维护性：

```typescript
// pages/StudentLoginPage.ts
export class StudentLoginPage {
  constructor(private page: Page) {}

  async login(studentId: string, password: string) {
    await this.page.locator('input[placeholder*="学号"]').fill(studentId)
    await this.page.locator('input[placeholder*="密码"]').fill(password)
    await this.page.locator('button:has-text("登录")').click()
  }
}
```

### 6.2 数据清理

测试完成后需要清理数据：

```typescript
test.afterEach(async ({ request }) => {
  // 清理测试数据
})
```

### 6.3 并发测试

Playwright 默认支持并发测试，每个测试实例独立的浏览器上下文，无需担心数据污染。

### 6.4 等待策略

优先使用 `waitForURL()`、`waitForSelector()` 显式等待，避免使用 `page.waitForTimeout()`。

---

## 七、故障排查

### 7.1 测试失败

**症状**：测试执行失败

**排查步骤**：

1. 查看 Playwright 报错信息
2. 检查浏览器驱动是否安装：`npx playwright install chromium`
3. 检查服务是否启动（前端 5173、后端 8080）
4. 查看测试报告了解详细错误

### 7.2 服务未启动

**症状**：测试提示 `net::ERR_CONNECTION_REFUSED`

**解决方案**：

```bash
# 启动前端服务
pnpm dev

# 启动后端服务
cd backend && php artisan serve
```

### 7.3 超时问题

**症状**：测试超时或页面加载缓慢

**解决方案**：

- 增加超时时间：`navigationTimeout: 30000`
- 检查网络连接
- 优化前端资源加载

### 7.4 元素定位失败

**症状**：`locator()` 找不到元素

**解决方案**：

- 使用更精确的选择器（如 `data-testid`）
- 增加等待时间
- 使用 `page.waitForSelector()`

---

## 八、持续集成

### 8.1 GitHub Actions 示例

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Start services
        run: |
          docker-compose up -d backend
          npm run dev &

      - name: Run E2E tests
        run: npx playwright test

      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: tests/e2e/html-report/
```

---

## 九、测试维护

### 9.1 添加新测试

1. 在对应测试文件中添加测试用例
2. 使用测试账号执行测试验证
3. 更新本文档的测试覆盖范围

### 9.2 测试用例优先级

| 优先级 | 说明               | 示例               |
| ------ | ------------------ | ------------------ |
| P0     | 核心功能、关键路径 | 登录、数据查询     |
| P1     | 重要功能           | 数据录入、数据修改 |
| P2     | 辅助功能           | 详情查看、个人中心 |

---

## 十、注意事项

1. **测试账号安全**：测试完成后请清理测试数据，不要保留在环境中。
2. **测试数据隔离**：每个测试应独立运行，避免数据污染。
3. **资源清理**：测试完成后确保关闭浏览器、清理临时文件。
4. **环境依赖**：测试前确保前端和后端服务正常运行。
5. **性能优化**：避免使用硬编码的等待时间，使用显式等待。

---

## 十一、联系与反馈

如有问题或建议，请联系：

- **测试负责人**：[待填写]
- **技术支持**：[待填写]
- **问题反馈**：[Issue 跟踪地址]

---

**最后更新**：2026-09-16
**文档版本**：v1.0.0
