# 学生端档案管理系统（前端）

> 面向学生用户的档案信息管理平台前端工程。

---

## 技术栈

| 层级        | 技术选型     | 版本   |
| ----------- | ------------ | ------ |
| 前端框架    | Vue          | 3      |
| 状态管理    | Pinia        | 3      |
| UI 组件库   | Element Plus | 2.9    |
| 类型系统    | TypeScript   | 5.7    |
| 构建工具    | Vite         | 6      |
| 样式预处理  | SCSS         | 1.86   |

---

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器（默认端口 5175）
npm run dev

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
│   ├── app/                 # 应用入口（路由、布局、全局样式）
│   ├── assets/              # 静态资源与全局 SCSS
│   ├── features/            # 按业务模块划分的页面与逻辑
│   │   ├── applications/    # 各类申报模块
│   │   ├── approval/        # 审批与提交记录
│   │   ├── auth/            # 登录认证
│   │   ├── dashboard/       # 首页仪表盘
│   │   └── profile/         # 个人中心
│   ├── shared/              # 全局共享资源
│   │   ├── api/             # 请求封装
│   │   ├── composables/     # 通用组合式函数
│   │   ├── constants/       # 常量与字典
│   │   ├── types/           # 全局类型
│   │   ├── ui/              # 通用 UI 组件
│   │   └── utils/           # 工具函数
│   └── App.vue
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

| 脚本              | 说明                           |
| ----------------- | ------------------------------ |
| `npm run dev`     | 启动开发服务器                 |
| `npm run build`   | 类型检查并构建生产包           |
| `npm run preview` | 预览生产包                     |
| `npm run lint`    | 运行 ESLint 并自动修复         |
| `npm run lint:check` | 运行 ESLint，有警告即失败   |

---

## 代理配置

开发环境下，接口请求以 `/api` 开头会被代理到 `http://localhost:8080`，详见 [`vite.config.ts`](./vite.config.ts)。
