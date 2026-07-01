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
4. 本地执行 `npm run lint:check` 与 `npm run build`。
5. 提交前 husky + lint-staged 会自动格式化。
6. 按 `时间 + 方向 + 具体操作内容` 格式书写 commit message。

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
