# ADR-004：禁止同名 barrel 文件，统一使用描述性文件名

## 状态

已采纳

## 背景

项目初期多个目录使用 `index.ts` 作为 barrel 文件导出（router、stores、api、composables、constants、types、utils）。根据 claude.md 2.1 与前端开发规范 1.1，同一项目内禁止出现同名文件，以避免搜索、调试和维护时的歧义。

## 决策

将所有 barrel 文件重命名为描述性名称：

| 原路径 | 新路径 |
| ------ | ------ |
| `src/app/router/index.ts` | `src/app/router/routes.ts` |
| `src/app/stores/index.ts` | `src/app/stores/stores.ts` |
| `src/shared/api/index.ts` | `src/shared/api/api.ts` |
| `src/shared/composables/index.ts` | `src/shared/composables/composables.ts` |
| `src/shared/constants/index.ts` | `src/shared/constants/constants.ts` |
| `src/shared/types/index.ts` | `src/shared/types/types.ts` |
| `src/shared/utils/index.ts` | `src/shared/utils/utils.ts` |

## 理由

- 消除同名文件带来的搜索与跳转歧义。
- import 路径显式指向 barrel 文件名，增强可读性。
- 与团队规范保持一致。

## 影响

- 所有引用方需同步更新 import 路径。
- 后续新增 barrel 文件时，避免命名为 `index.ts`。
