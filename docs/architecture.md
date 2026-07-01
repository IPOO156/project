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
│   ├── profile/       # 个人档案、成长时间轴、职业规划
│   ├── applications/  # 各类申报模块
│   └── approval/      # 审批/提交记录
└── shared/            # 全局共享
    ├── api/           # Axios 请求封装
    ├── composables/   # 公共 Composables
    ├── constants/     # 全局常量、字典
    ├── types/         # 全局 TypeScript 类型
    └── utils/         # 工具函数
```

## 模块依赖关系

- `features/*` 只允许引用 `shared/*` 和 `app/*`（stores / router）。
- `features/*` 之间禁止直接 `import` 组件内部方法或响应式变量。
- 跨模块通信通过 Pinia Store 或路由参数完成。

## Store 依赖

| Store          | 路径                     | 用途                 | 依赖模块 |
| -------------- | ------------------------ | -------------------- | -------- |
| `useUserStore` | `src/app/stores/user.ts` | 用户登录态、用户信息 | 全局     |
| `useAppStore`  | `src/app/stores/app.ts`  | 应用级状态（待扩展） | 全局     |

## 路由关系

见 `src/app/router/routes.ts`。
