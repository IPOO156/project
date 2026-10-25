# 学生端档案管理系统（前端）

> 面向学生用户的档案信息管理平台前端工程。

---

## 技术栈

| 层级       | 技术选型     | 版本 |
| ---------- | ------------ | ---- |
| 前端框架   | Vue          | 3    |
| 状态管理   | Pinia        | 3    |
| UI 组件库  | Element Plus | 2.9  |
| 类型系统   | TypeScript   | 5.7  |
| 构建工具   | Vite         | 6    |
| 样式预处理 | SCSS         | 1.86 |

---

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器（默认端口 5173，见 vite.config.ts）
npm run dev

# 类型检查
npm run type-check

# 单元测试（vitest）
npm run test:unit

# 构建生产包
npm run build

# 本地预览生产包
npm run preview
```

---

## 项目结构

```
archive-system-student/
├── src/
│   ├── app/                 # 应用入口（路由、布局、Pinia store：useXxxStore.ts）
│   ├── assets/              # 静态资源与全局 SCSS（含原子工具类 u-*）
│   ├── features/            # 按业务模块划分的页面与逻辑
│   │   ├── ai-chat/         # AI 助手会话
│   │   ├── applications/    # 各类申报模块
│   │   ├── approval/        # 审批与提交记录
│   │   ├── auth/            # 登录认证
│   │   ├── awards/          # 奖项与荣誉
│   │   ├── dashboard/       # 首页仪表盘
│   │   ├── error/           # 404 等兜底页
│   │   ├── growth-timeline/ # 成长时间线
│   │   ├── messages/        # 消息中心与全部动态
│   │   ├── profile/         # 个人中心
│   │   ├── submission-records/ # 提交记录
│   │   └── teacher/         # 教师端，按域分组：archive / review / org / ops（组内页面与子组件同级）
│   ├── shared/              # 全局共享资源
│   │   ├── api/             # 请求封装（submission 等大模块按域拆分到同名目录）
│   │   ├── composables/     # 通用组合式函数（含 useDebounce）
│   │   ├── constants/       # 常量与字典（storageKeys / dict）
│   │   ├── types/           # 全局类型（teacher/ 下为 *-types.ts）
│   │   ├── ui/              # 通用 UI 组件
│   │   └── utils/           # 工具函数
│   └── App.vue
├── tests/
│   ├── unit/                # vitest 单元测试（纯逻辑）
│   └── e2e/                 # Playwright 端到端用例
├── docs/                    # 项目文档
├── 代码修改记录/            # 代码变更记录
├── claude.md                # AI 开发上下文规范
├── 开发手册.md              # 开发手册
├── 前端开发规范与最佳实践（优化版）.md
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 开发规范

本项目以以下三本手册为约束依据，开发前请先阅读：

1. [`claude.md`](./claude.md) —— AI 辅助开发上下文规范
2. [`开发手册.md`](./开发手册.md) —— 整体开发规则与对接原则
3. [`前端开发规范与最佳实践（优化版）.md`](./前端开发规范与最佳实践（优化版）.md) —— 前端代码规范与最佳实践

### 命名约定

- 文件夹：`kebab-case`
- Vue 组件文件：`PascalCase`
- 路径别名：`@/` 指向 `src/`

### 代码提交

项目已配置 `husky` + `lint-staged`，提交前会自动执行：

- `eslint --fix`
- `prettier --write`

提交信息格式参考：`YYYY/MM/DD-方向-操作内容`，例如 `2026/07/01-前端-修复奖学金列表字典维护方式`。

---

## 常用脚本

| 脚本                                                   | 说明                                             |
| ------------------------------------------------------ | ------------------------------------------------ |
| `npm run dev`                                          | 启动开发服务器（端口 5173）                      |
| `npm run type-check`                                   | 类型检查（vue-tsc）                              |
| `npm run build`                                        | 构建生产包（纯 vite build，不含类型检查）        |
| `npm run preview`                                      | 预览生产包                                       |
| `npm run lint`                                         | 运行 ESLint 并自动修复                           |
| `npm run lint:check`                                   | 运行 ESLint，有警告即失败                        |
| `npm run test:unit`                                    | 单元测试（vitest，纯逻辑）                       |
| `npm run test:unit:coverage`                           | 单元测试 + 覆盖率门槛                            |
| `npm run test:e2e`                                     | Playwright E2E（需要后端与 `VITE_E2E_PASSWORD`） |
| `npx playwright test tests/e2e/student-mocked.spec.ts` | 全接口 mock 的 E2E，无需后端                     |

> 环境变量：复制 `.env.example` 为 `.env.local` 后填写（该文件已被忽略，不入库）。
> 本机若已有失效的 dev server 占用 5173，可用 `E2E_PORT=5174` 让 Playwright 另起干净实例。

---

## 代理配置

开发环境下，接口请求以 `/api` 开头会被代理到 `http://localhost:8080`，详见 [`vite.config.ts`](./vite.config.ts)。
