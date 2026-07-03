# 风格指南

> 按 claude.md 2.4 / 前端开发规范与最佳实践 1.2 维护。

## ESLint

- 使用 `@antfu/eslint-config`。
- 禁止任何形式的 `// eslint-disable` 注释（确需例外需提交 CR 由前端负责人批准）。
- 本地提交前通过 `lint-staged` 自动执行 `eslint --fix`。
- CI 门禁执行 `eslint . --max-warnings 0`。

## Prettier

```json
{
  "printWidth": 100,
  "singleQuote": true,
  "semi": false,
  "trailingComma": "all"
}
```

## 命名规范

- 文件夹：`kebab-case`（如 `user-profile`）
- 组件文件：`PascalCase`（如 `UserProfile.vue`）
- Composable：`camelCase` 且以 `use` 开头（如 `usePagination.ts`）
- Store：`camelCase` 且以 `use` 开头（如 `useUserStore.ts`）

## Vue 文件结构

```vue
<script setup lang="ts">
// 1. 外部依赖导入
// 2. 类型/接口定义
// 3. Props & Emits
// 4. Store / Composable
// 5. 响应式数据
// 6. Computed
// 7. Watch
// 8. 生命周期
// 9. 方法函数
</script>

<template>
  <!-- 模板内容 -->
</template>

<style scoped lang="scss">
/* 组件样式 */
</style>
```

## 样式规范

- 禁止大量内联样式；统一使用 class。
- 设计 Token 使用 `src/assets/styles/variables.scss`。
- 组件样式必须加 `scoped`；全局样式使用 `:global()` 并注释说明。
