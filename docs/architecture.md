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
├── app/               # 应用入口：路由、布局、全局 Store
│   ├── layouts/
│   ├── router/
│   └── stores/
├── assets/            # 静态资源、全局样式、SCSS 变量
├── features/          # 按业务模块划分
│   ├── auth/          # 登录认证
│   ├── dashboard/     # 首页仪表盘
│   ├── messages/      # 消息中心（通知 + 动态记录）
│   ├── profile/       # 个人档案、成长时间轴、职业规划
│   ├── applications/  # 各类申报模块
│   └── approval/      # 审批/提交记录
└── shared/            # 全局共享
    ├── api/           # Axios 请求封装
    ├── composables/   # 公共 Composables
    ├── config/        # 模块注册表等配置化接口
    ├── constants/     # 全局常量、字典
    ├── types/         # 全局 TypeScript 类型
    └── utils/         # 工具函数
```

## 模块依赖关系

- `features/*` 只允许引用 `shared/*` 和 `app/*`（stores / router）。
- `features/*` 之间禁止直接 `import` 组件内部方法或响应式变量。
- 跨模块通信通过 Pinia Store 或路由参数完成。

## Store 依赖

| Store                  | 路径                             | 用途                 | 依赖模块      |
| ---------------------- | -------------------------------- | -------------------- | ------------- |
| `useUserStore`         | `src/app/stores/user.ts`         | 用户登录态、用户信息 | 全局          |
| `useAppStore`          | `src/app/stores/app.ts`          | 应用级状态（待扩展） | 全局          |
| `useNotificationStore` | `src/app/stores/notification.ts` | 消息中心通知数据     | 消息中心      |
| `useActivityStore`     | `src/app/stores/activity.ts`     | 动态记录数据         | 消息中心/首页 |

## 路由关系

见 `src/app/router/routes.ts`。

## 模块注册表

为提升系统可扩展性，菜单与模块元数据由 `src/shared/config/moduleRegistry.ts` 集中管理。新增业务模块时，只需在注册表中添加 `AppModule` 条目，即可同步影响侧边栏菜单、模块图标与排序。

- 路由表（`routes.ts`）继续作为路由权威来源。
- `src/shared/constants/menu.ts` 从注册表派生，不再硬编码菜单项。
- 详见 `docs/architecture/extensibility-design.md`。
