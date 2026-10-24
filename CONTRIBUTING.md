# 贡献指南

> 本项目为「学生端档案管理系统（前端）」，所有贡献者须遵守 claude.md、开发手册.md、前端开发规范与最佳实践（优化版）.md。

## 技术栈

- Vue 3 + TypeScript
- Pinia
- Element Plus
- Vite
- SCSS

## 目录与命名

- 文件夹：`kebab-case`
- 组件文件：`PascalCase.vue`
- Composables / Stores：`camelCase` 且以 `use` 开头

## 开发流程

1. 分析需求，确认是否涉及数据库/接口变更。
2. 涉及接口变更时，先与后端沟通确认，更新接口文档。
3. 编码，遵循 Vue 文件 9 步结构。
4. 本地执行 `npm run lint:check`、`npm run type-check` 与 `npm run build`。
5. 提交前 husky + lint-staged 会自动格式化。
6. 按 `时间 + 方向 + 具体操作内容` 格式书写 commit message。
7. 在 `代码修改记录/YYYY-MM-DD.md` 留痕后提 PR。

## 分支与合并

- 常驻分支：`main`（服务端上线主分支）、`new-main`、`nine`（开发主分支）。三者均在 CI 触发范围内。
- 日常开发一律走 PR，禁止直接向常驻分支推送业务代码。
- 仓库默认合并方式为 **Squash merge**：一个 PR 只产生一个 commit，避免 merge commit 污染历史。
- PR 标题即最终 commit message，必须为 `YYYY/MM/DD-前端-具体操作内容`；多个操作以「，」分割。
  禁止「补充」「优化」「修改」这类无法定位内容的标题。
- 合并前必须同步目标分支（`git pull origin <分支名>`），禁止以 `--no-verify` 或放宽 ESLint/TS 规则绕过门禁。

## 文件体量

- 单文件硬上限 **600 行**（不含注释与空行可放宽至 650 行）。
- SFC **超过 300 行**，Code Review 必须提出拆分意见；**超过 600 行**，当季度必须完成拆分。
- 拆分优先级：弹窗 → 独立组件；查询表单 → `SearchForm.vue`；复杂表格 → `DataTable.vue`；重复模板 → 子组件或 slot。

## 本地存储与字典

- 新增 localStorage / sessionStorage 键必须先在 `src/shared/constants/storageKeys.ts` 登记，
  并标明是「用户级」（登出清理）还是「设备级偏好」（登出保留），禁止在业务代码里写字面量。
- 枚举 / 字典映射统一放 `src/shared/constants/dict.ts`，禁止在组件内重复定义。

## 代码修改记录

- 所有代码修改必须记录到指定位置。
- 文件命名：`YYYY-MM-DD.md`。
- 一次用户请求对应一份记录。
- 必须先记录删除范围，再记录新增范围。

## 绝对禁止

- 大范围重构无关代码
- 随意改变已有业务逻辑
- 删除注释中的重要业务说明
- 引入未经确认的新依赖
- 伪造接口字段
- 把 Mock 数据当真实字段
- 绕过类型检查（`as any`、`@ts-ignore`）
