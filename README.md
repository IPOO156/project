# 卓越学生成长档案系统 · 前端

> 面向 **学生 / 教师 / 管理员** 三端的成长档案与成果管理系统前端工程，基于 Vue 3 + TypeScript + Vite 构建的单页应用。

---

## 一、项目简介

系统按「端」划分页面：

| 端       | 入口                               | 说明                                                                                        |
| -------- | ---------------------------------- | ------------------------------------------------------------------------------------------- |
| 学生端   | `/`（登录后默认进入 `/dashboard`） | 档案、成长、申报、成果、消息等学生侧全部功能                                                |
| 教师端   | `/teacher`                         | 学生档案、材料审核、指标体系、导出、组织与系统管理                                          |
| 管理员端 | `/teacher`                         | **与教师端复用同一套页面与布局**，通过角色权限码决定可见模块；持 `admin` 角色可直通模块校验 |

登录页仅有两个 Tab：「学生登录」与「管理员登录」——教师账号也从「管理员登录」入口进入。

主要能力：

- **学生端**：首页仪表盘、成长时间轴、成果墙、AI 助手、个人中心（档案概览 / 成长发展 / 修改密码）、申报中心（10 类申报）、奖项报名（竞赛之星 / 科研之星 / 双创之星）、消息中心与动态、申报看板与奖项看板。
- **教师 / 管理端**：工作台、学生档案、材料审核（待审 / 历史 / 审批委托）、审批流程、指标体系与评分重算、档案导出与模板、成果热力图、组织架构、账号与角色、系统设置、消息中心。

---

## 二、技术栈

| 层级       | 技术选型                                  | 版本  |
| ---------- | ----------------------------------------- | ----- |
| 前端框架   | Vue 3（`<script setup>` + TS）            | 3.5   |
| 路由       | Vue Router                                | 4.5   |
| 状态管理   | Pinia                                     | 3     |
| UI 组件库  | Element Plus（按需引入）                  | 2.9   |
| 图标       | lucide-vue-next / @element-plus/icons-vue | -     |
| 图表       | ECharts / vue-echarts                     | 5 / 7 |
| 构建工具   | Vite                                      | 6     |
| 样式预处理 | SCSS                                      | 1.86  |
| 类型系统   | TypeScript（strict）                      | 5.7   |
| 单元测试   | Vitest                                    | 5     |
| 端到端测试 | Playwright                                | 1.61  |
| 代码规范   | ESLint（@antfu）+ Prettier + Stylelint    | -     |

---

## 三、快速开始

### 环境要求

- Node.js >= 20（`.nvmrc` 指定 22）
- npm >= 10

### 安装与启动

```bash
npm install

# 启动开发服务器，默认 http://localhost:5173
npm run dev

# 类型检查
npm run type-check

# 单元测试
npm run test:unit

# 生产构建 / 本地预览
npm run build
npm run preview
```

> 开发端口必须是后端 CORS 白名单内的地址（3000 / 5173 / 8080），否则登录等带 `Origin` 的请求会被后端以 403 拒绝。

### 环境变量

复制 `.env.example` 为 `.env.local` 后按需填写（`*.local` 已被忽略，不入库）：

| 变量                         | 作用                                 | 备注                                                            |
| ---------------------------- | ------------------------------------ | --------------------------------------------------------------- |
| `VITE_CAPTCHA_SKIP_ACCOUNTS` | 允许免图形验证码的账号，英文逗号分隔 | 默认关闭；需与后端 `auth.captcha.skip-users` 同步               |
| `VITE_CAPTCHA_SKIP_SECRET`   | 免验证码密钥                         | 必须与后端 `CAPTCHA_SKIP_SECRET` 完全一致，仅在上一项配置后需要 |
| `VITE_E2E_PASSWORD`          | Playwright E2E 测试账号密码          | 读取的是**进程环境变量**，不读 `.env` 文件                      |

> 接口基地址固定为 `/api/v1`（见 [request.ts](./src/shared/api/request.ts) 的 `API_BASE_URL`），不通过环境变量切换；开发环境由 Vite 代理转发，生产环境由 Nginx 转发。

### 接口代理

开发环境下，以 `/api` 开头的请求会由 Vite 代理到已部署后端 `http://111.228.56.207:8089`（见 [vite.config.ts](./vite.config.ts)）。生产环境由 Nginx 反向代理 `/api` 到后端，并需为 SPA 配置 `try_files $uri $uri/ /index.html` 回退。

---

## 四、目录结构

```
frontend/
├── src/
│   ├── views/                        # 页面（按端划分）
│   │   ├── school/                   # 学生端
│   │   │   ├── dashboard/            # 首页仪表盘
│   │   │   ├── growth-timeline/      # 成长时间轴
│   │   │   ├── achievements/         # 成果墙
│   │   │   ├── ai-chat/              # AI 助手
│   │   │   ├── profile/              # 个人中心
│   │   │   ├── applications/         # 申报中心（10 个子模块）
│   │   │   ├── awards/               # 三类奖项报名
│   │   │   ├── messages/             # 消息中心 / 动态中心
│   │   │   ├── approval/             # 申报看板 / 奖项看板
│   │   │   └── submission-records/   # 提交记录（预留页，暂未接入路由）
│   │   ├── teacher/                  # 教师端 + 管理端
│   │   │   ├── archive/              # 学生档案 / 导出中心
│   │   │   ├── ops/                  # 工作台 / 热力图 / 日志 / 消息
│   │   │   ├── org/                  # 组织架构 / 账号角色 / 系统设置
│   │   │   └── review/               # 材料审核 / 指标体系 / 审批流程
│   │   ├── auth/                     # 登录（三端共用）
│   │   └── error/                    # 404
│   ├── components/                   # 跨端通用组件
│   │   ├── ui/                       # PageHeader、StatusTag、EmptyState 等通用 UI
│   │   └── layout/                   # HeaderBar、Sidebar、NavTabs、TabContextMenu、面包屑、命令面板
│   ├── layouts/
│   │   └── DefaultLayout.vue         # 全局布局骨架（侧边栏 / 顶部栏 / 标签页 / 内容区）
│   ├── router/
│   │   ├── routes.ts                 # 路由表 + 全局守卫（登录态、端级分流、强制改密）
│   │   ├── teacher-routes.ts         # 教师 / 管理端路由
│   │   └── loadingIndicator.ts       # 慢导航加载提示
│   ├── stores/                       # Pinia Store（useXxxStore.ts，纯逻辑拆到同级 helper）
│   ├── composables/                  # 依赖应用状态的组合式能力（useTabs / useThemeRipple）
│   ├── shared/                       # 全局共享
│   │   ├── api/                      # Axios 封装与按域拆分的接口（request.ts 是唯一入口）
│   │   ├── composables/              # 通用组合式函数
│   │   ├── config/                   # 模块注册表等配置化接口
│   │   ├── constants/                # 常量、字典、存储键
│   │   ├── types/                    # 全局类型（teacher/ 下按域拆分）
│   │   ├── utils/                    # 纯函数工具
│   │   ├── directives/               # v-permission 等指令
│   │   └── data/                     # 静态数据（如行政区划）
│   ├── assets/
│   │   ├── logo/                     # 品牌 logo
│   │   └── styles/                   # 全局 SCSS、主题变量、共享主题
│   ├── App.vue
│   ├── main.ts
│   └── style.css
├── public/                           # favicon 等静态资源（原样拷贝）
├── tests/
│   ├── unit/                         # Vitest 单元测试
│   └── e2e/                          # Playwright 端到端测试（含 mock 用例）
├── scripts/ci/                       # CI 门禁脚本
├── docs/                             # 架构、接口、组件、样式等文档
├── prototype/、prototypes/           # 历史设计原型（非运行代码）
├── index.html
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── eslint.config.js
├── tsconfig.json
└── package.json
```

> `auto-imports.d.ts`、`components.d.ts` 由 unplugin 自动生成，**不要手动修改**。放在 `src/components/` 下的组件会被自动扫描注册。

---

## 五、路由与权限

### 学生端（`meta.student`）

| 路径                                                             | 页面                                                                                                                                               |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dashboard`                                                     | 首页仪表盘                                                                                                                                         |
| `/growth-timeline`                                               | 成长时间轴                                                                                                                                         |
| `/achievements`                                                  | 成果墙                                                                                                                                             |
| `/ai-chat`                                                       | AI 助手                                                                                                                                            |
| `/profile/info`                                                  | 档案概览                                                                                                                                           |
| `/profile/career-plan`                                           | 成长发展                                                                                                                                           |
| `/profile/edit-password`                                         | 修改密码                                                                                                                                           |
| `/applications?tab=...`                                          | 申报中心（competition / innovation / research / scholarship / certificate / internship / organization / training / social-practice / book-report） |
| `/awards?tab=competition-star\|scientific-star\|innovation-star` | 奖项报名                                                                                                                                           |
| `/messages`、`/messages/activities`                              | 消息中心 / 动态中心                                                                                                                                |
| `/approval/pending`、`/approval/award-review`                    | 申报看板 / 奖项看板                                                                                                                                |

### 教师 / 管理端（`/teacher`，`meta.teacher`）

| 路径                                                               | 页面         | 模块权限（`meta.permission`） |
| ------------------------------------------------------------------ | ------------ | ----------------------------- |
| `/teacher/dashboard`                                               | 工作台       | -                             |
| `/teacher/archive-view`                                            | 学生档案     | `archive-view`                |
| `/teacher/student-detail/:userId`                                  | 学生成长档案 | `archive-view`                |
| `/teacher/material-review?tab=pending\|history\|delegation`        | 材料审核     | `material-review`             |
| `/teacher/messages`                                                | 消息中心     | `messages`                    |
| `/teacher/org-management`                                          | 组织架构     | `org-management`              |
| `/teacher/heat-map`                                                | 成果热力图   | `heat-map`                    |
| `/teacher/indicator-system?tab=dimension\|indicator\|recalculate`  | 指标体系     | `indicator-system`            |
| `/teacher/export-center?tab=export\|template\|forms`               | 档案导出     | `export-center`               |
| `/teacher/approval-flow`                                           | 审批流程     | `approval-flow`               |
| `/teacher/account-role?tab=student\|teacher\|adjust\|add\|role`    | 账号与角色   | `account-role`                |
| `/teacher/system-settings?tab=dict\|semester\|config\|tasks\|logs` | 系统设置     | `system-settings`             |

### 守卫行为（[routes.ts](./src/router/routes.ts)）

1. 无 token 一律回登录页。
2. 强制改密期间只允许停留在登录页（登录页会切换为改密表单）。
3. 学生端路由校验登录类型为 `student`，教师账号访问会被送回 `/teacher/dashboard`。
4. 教师端路由校验登录类型为 `teacher`，并按 `meta.permission` 对照 `shared/config/teacherModuleRegistry` 判定模块权限；持 `admin` 角色直通。
5. 聚合页统一用 `?tab=` 承载页内页签，并标记 `meta.singleTab`，旧 URL 在路由文件末尾保留 `redirect` 兜底。

---

## 六、架构分层与约束

| 层     | 目录                                                                     | 职责                                                 |
| ------ | ------------------------------------------------------------------------ | ---------------------------------------------------- |
| 页面层 | `src/views/<端>/<域>/`                                                   | 页面入口与业务编排                                   |
| 组件层 | `src/views/**/components/`、`src/components/ui`、`src/components/layout` | 页面私有组件随页面存放；跨端通用组件进 `components/` |
| 装配层 | `src/layouts/`、`src/router/`                                            | 布局骨架、路由守卫、端级分流                         |
| 状态层 | `src/stores/`                                                            | Pinia 跨页面状态，单 Store 建议 ≤200 行              |
| 服务层 | `src/shared/api/`                                                        | 唯一 axios 入口，统一注入 token、错误提示、401 登出  |
| 数据层 | `src/shared/types/`                                                      | 接口出入参与字典取值类型                             |
| 工具层 | `src/shared/utils`、`constants`、`composables`、`config`                 | 无业务耦合的纯函数、常量与组合式能力                 |

依赖红线（已由 ESLint `no-restricted-imports` 固化，CI 以 `--max-warnings 0` 执行）：

- `views/`、`components/`、`layouts/` 禁止直接 `import axios`，请求必须走 `@/shared/api`。
- `shared/` 不得反向依赖 `views/`、`components/`、`stores/`、`router/`、`layouts/`（仅类型导入放行）。
- 页面模块之间通过 Pinia Store 或路由参数通信，不直接引用彼此内部状态。

---

## 七、开发规范

### 命名

- 文件夹：`kebab-case`
- Vue 组件文件：`PascalCase`
- Composable：`useXxx`
- Pinia Store：`useXxxStore`
- 路径别名：`@/` → `src/`

### 约定

- 通用 UI 组件放 `src/components/ui`，布局级组件放 `src/components/layout`，页面私有组件放对应页面的 `components/`。
- 字典与枚举值统一走 `shared/constants/dict`、`shared/constants/businessDict`，禁止在页面里散落中文字面量映射。
- 所有请求经 `shared/api`，接口类型定义放 `shared/types`。
- 样式优先复用 `assets/styles` 中的变量与全局类（`variables.scss` 已通过 Vite 自动注入，无需重复 `@use`）。
- TypeScript 开启 `strict`，提交前需通过 `npm run type-check`。

### 提交

项目已配置 Husky + lint-staged，提交前自动执行 `eslint --fix` 与 `prettier --write`。

提交信息格式：`YYYY/MM/DD-方向-操作内容`，例如 `2026/07/01-前端-修复奖学金列表字典维护方式`。

---

## 八、测试

### 单元测试（Vitest）

```bash
npm run test:unit            # 全量执行
npm run test:unit:coverage   # 带覆盖率门槛
```

- 用例位于 `tests/unit/**/*.spec.ts`，默认 `node` 环境；需要浏览器存储的用例在文件头声明 `// @vitest-environment jsdom`。
- 覆盖率统计范围为状态与纯逻辑层（`stores`、`shared/utils`、`shared/constants`、`shared/composables`、`views/**/*.ts`），`.vue` 组件由 E2E 与人工回归保障。
- 全局门槛：lines 28 / statements 28 / functions 29 / branches 25（只升不降）；`notificationHelpers.ts`、`token.ts`、`session.ts`、`loadingTips.ts` 维持 80/80/80/70。

### 端到端测试（Playwright）

```bash
# 需要可用后端，并先设置密码环境变量
$env:VITE_E2E_PASSWORD="<密码>"
npm run test:e2e

# 全接口 mock，无需后端
npx playwright test tests/e2e/student-mocked.spec.ts
```

- 测试账号：学生 `202401002`、教师 `T00003`、管理员 `A00002`（密码不入库）。
- 默认串行执行（后端走免费隧道有连接数限流）；断言超时 15s，失败自动保留 trace / 截图 / 视频。
- 若本机 5173 被旧 dev server 占用，可用 `E2E_PORT=5174` 另起实例。

---

## 九、构建与部署

```bash
npm run build
```

- 产物输出到 `dist/`，按依赖域拆分 chunk：`vue`、`element-plus`、`echarts`、`pdf`。
- 部署时需将 `dist/` 作为静态站点根目录，并为 SPA 配置 history 回退（`try_files $uri $uri/ /index.html`）。
- 接口请求以 `/api` 开头，生产环境由 Nginx 反向代理到后端服务。

---

## 十、常用脚本

| 脚本                         | 说明                                    |
| ---------------------------- | --------------------------------------- |
| `npm run dev`                | 启动开发服务器（端口 5173）             |
| `npm run build`              | 生产构建（纯 vite build，不含类型检查） |
| `npm run preview`            | 预览生产包                              |
| `npm run type-check`         | 类型检查（vue-tsc）                     |
| `npm run lint`               | ESLint 并自动修复                       |
| `npm run lint:check`         | ESLint 检查，有警告即失败（CI 使用）    |
| `npm run test:unit`          | 单元测试                                |
| `npm run test:unit:coverage` | 单元测试 + 覆盖率门槛                   |
| `npm run test:e2e`           | Playwright E2E                          |
| `npm run test:e2e:ui`        | Playwright UI 模式                      |
| `npm run test:e2e:report`    | 查看 E2E 报告                           |

---

## 十一、相关文档

- [开发手册.md](./开发手册.md) —— 整体开发规则与对接原则
- [前端开发规范与最佳实践（优化版）.md](./前端开发规范与最佳实践（优化版）.md) —— 前端代码规范
- [CONTRIBUTING.md](./CONTRIBUTING.md) —— 协作与提交规范
- [CLAUDE.md](./CLAUDE.md) —— AI 辅助开发上下文规范
- [docs/architecture.md](./docs/architecture.md) —— 架构分层
- [docs/api.md](./docs/api.md) —— 接口封装与约定
- [docs/components.md](./docs/components.md) —— 通用组件清单
- [docs/style-guide.md](./docs/style-guide.md) —— 样式规范
- [docs/COMPOSABLES_GUIDE.md](./docs/COMPOSABLES_GUIDE.md) —— Composable 使用指南
- [docs/adr/](./docs/adr) —— 架构决策记录
- [tests/e2e/TESTING.md](./tests/e2e/TESTING.md) —— E2E 测试说明

> 注：`docs/architecture.md` 等部分文档仍保留重构前的 `app/`、`features/` 路径描述，以本文档的「目录结构」为准。
