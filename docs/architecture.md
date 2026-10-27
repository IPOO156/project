# 架构文档

> 按《前端开发规范与最佳实践（优化版）》八、模块间连接与架构 / claude.md 八、项目文档结构 维护。

## 技术栈

- 前端框架：Vue 3（`<script setup>` + TypeScript）
- 状态管理：Pinia
- UI 组件库：Element Plus
- 构建工具：Vite
- 样式预处理：SCSS
- 路由：Vue Router
- 图标：lucide-vue-next / @element-plus/icons-vue

## 目录结构

```
src/
├── app/               # 应用入口：路由、布局、全局 Store（useXxxStore.ts）
│   ├── composables/   # 依赖 app 状态的组合式能力（useTabs / useThemeRipple）
│   ├── layouts/
│   ├── router/
│   └── stores/        # 每个 Store ≤200 行；纯逻辑与写操作拆到同级 xxxHelpers/Mutations
├── assets/            # 静态资源、全局样式、SCSS 变量、原子工具类（u-*）
├── features/          # 按业务模块划分
│   ├── ai-chat/       # AI 助手会话
│   ├── applications/  # 各类申报模块
│   ├── approval/      # 审批/提交记录
│   ├── auth/          # 登录认证
│   ├── awards/        # 奖项与荣誉
│   ├── dashboard/     # 首页仪表盘
│   ├── error/         # 404 等兜底页
│   ├── growth-timeline/ # 成长时间线
│   ├── messages/      # 消息中心（通知 + 动态记录）
│   ├── profile/       # 个人档案、成长时间轴、职业规划
│   ├── submission-records/ # 提交记录（功能预留页，暂未接入路由）
│   └── teacher/       # 教师端按域分组：archive / review / org / ops（组内页面与子组件同级，路径 ≤4 层）
└── shared/            # 全局共享
    ├── api/           # Axios 请求封装（submission 等大模块按域拆分到同名目录）
    ├── composables/   # 公共 Composables（含 useDebounce）
    ├── config/        # 模块注册表等配置化接口
    ├── constants/     # 全局常量、字典、存储键
    ├── types/         # 全局 TypeScript 类型（teacher/ 下为 *-types.ts）
    ├── ui/            # 跨模块通用 UI 组件
    └── utils/         # 工具函数
```

## 分层模型对照

参照通用五层前后端分离分层（页面 / 组件 / 服务 / 数据 / 工具），本项目落地如下，
另多出「装配层」与「状态层」两层：

| 参考层         | 职责                     | 本项目落地                                                                                    | 说明                                                       |
| -------------- | ------------------------ | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 页面层         | 交互入口与业务编排       | `src/features/<domain>/*.vue`、`src/app/layouts/`                                             | 页面按业务域分目录，教师端再按 archive/review/org/ops 分组 |
| 组件层         | 可复用 UI 元素           | `src/features/<domain>/components/`、`src/shared/ui/`                                         | 页面私有组件随域存放；跨域通用组件进 `shared/ui`           |
| 服务层         | 统一网络请求与接口调用   | `src/shared/api/`（`request.ts` 是唯一 axios 入口，其余按域拆分）                             | 拦截器统一注入 token、统一错误提示、401 强制登出           |
| 数据层         | 数据结构与类型定义       | `src/shared/types/`（学生端 `types.ts` + 教师端 `teacher/*.ts`）                              | 接口出入参与字典取值集中定义，禁止页面内散落裸接口         |
| 工具层         | 网络工具 / 工具类 / 常量 | `src/shared/utils/`、`src/shared/constants/`、`src/shared/composables/`、`src/shared/config/` | 无业务耦合的纯函数、常量、组合式能力                       |
| 装配层（额外） | 应用骨架                 | `src/app/`（router / layouts）                                                                | 路由守卫、端级分流（student/teacher）、布局骨架            |
| 状态层（额外） | 跨页面共享状态           | `src/app/stores/`（Pinia）                                                                    | 请求缓存、登录态、用户级重置；单个 Store ≤200 行           |

## 模块依赖关系

- `features/*` 只允许引用 `shared/*` 和 `app/*`（stores / router）。
- `features/*` 之间禁止直接 `import` 组件内部方法或响应式变量。
- `shared/*` 不得反向依赖 `app/*`、`features/*`（仅类型导入放行）。
- 页面与组件层禁止直接 `import axios`，请求必须经 `shared/api`。
- 跨模块通信通过 Pinia Store 或路由参数完成。

## 分层约束（已由 ESLint 固化）

`eslint.config.js` 中两条 `no-restricted-imports` 规则在 CI 生效（`--max-warnings 0`）：

| 规则                              | 作用域            | 拦截内容                                               |
| --------------------------------- | ----------------- | ------------------------------------------------------ |
| `project/layer-boundary-features` | `src/features/**` | `import axios`（绕过服务层）                           |
| `project/layer-boundary-shared`   | `src/shared/**`   | `@/app/*`、`@/features/*` 的运行时导入（类型导入放行） |

已知分层例外（技术债，规则里以 `ignores` 放行，**只减不增**）：

| 文件                                      | 反向依赖              | 后续处理方向                                                                               |
| ----------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------ |
| `src/shared/composables/useLoadingTip.ts` | `@/app/stores/stores` | 先把 `shared/ui/StudyTipInline.vue` 改为 props 注入的纯展示组件，再迁到 `app/composables/` |

## Store 依赖

| Store                    | 路径                                       | 用途                                 |
| ------------------------ | ------------------------------------------ | ------------------------------------ |
| `useUserStore`           | `src/app/stores/useUserStore.ts`           | 登录态、用户信息、登出清理           |
| `useAppStore`            | `src/app/stores/useAppStore.ts`            | 侧边栏折叠、移动端断点、全局 loading |
| `useThemeStore`          | `src/app/stores/useThemeStore.ts`          | 明暗主题与本地偏好                   |
| `useTabsStore`           | `src/app/stores/useTabsStore.ts`           | 已访问页面标签栏                     |
| `useHomeStore`           | `src/app/stores/useHomeStore.ts`           | 首页看板（60s TTL 缓存）             |
| `useActivityStore`       | `src/app/stores/useActivityStore.ts`       | 全部动态记录                         |
| `useNotificationStore`   | `src/app/stores/useNotificationStore.ts`   | 消息中心通知                         |
| `useSubmissionStore`     | `src/app/stores/useSubmissionStore.ts`     | 提交记录、撤回标记（按用户命名空间） |
| `useArchiveStore`        | `src/app/stores/useArchiveStore.ts`        | 个人档案（画像/兴趣/成绩/奖项）      |
| `useCareerPlanStore`     | `src/app/stores/useCareerPlanStore.ts`     | 职业规划记录与 AI 分析结果           |
| `useReviewStore`         | `src/app/stores/useReviewStore.ts`         | 教师端档案审核                       |
| `useAwardReviewStore`    | `src/app/stores/useAwardReviewStore.ts`    | 教师端奖项审核                       |
| `useTeacherMessageStore` | `src/app/stores/useTeacherMessageStore.ts` | 教师端消息                           |

> 登出时由 `sessionReset.ts#resetUserScopedStores` 统一重置上述用户级 Store。

## 路由关系

见 `src/app/router/routes.ts`。

## 模块注册表

为提升系统可扩展性，菜单与模块元数据由 `src/shared/config/moduleRegistry.ts` 集中管理。新增业务模块时，只需在注册表中添加 `AppModule` 条目，即可同步影响侧边栏菜单、模块图标与排序。

- 路由表（`routes.ts`）继续作为路由权威来源。
- `src/shared/constants/menu.ts` 从注册表派生，不再硬编码菜单项。
- 详见 `docs/architecture/extensibility-design.md`。
