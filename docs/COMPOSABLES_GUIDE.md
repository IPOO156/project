# Composable 指南

> 按《前端开发规范与最佳实践（优化版）》五、公共能力抽离 / claude.md 2.1 目录结构推荐 维护。

## 已提供的公共 Composables

| 路径                                        | 名称              | 职责                                          | 状态      |
| ------------------------------------------- | ----------------- | --------------------------------------------- | --------- |
| `src/shared/composables/useDict.ts`         | `useDict`         | 字典值 → 文本/颜色/选项转换                   | ✅ 已提供 |
| `src/shared/composables/usePagination.ts`   | `usePagination`   | 分页状态 + 分页事件 + 数据获取                | ✅ 已提供 |
| `src/shared/composables/useTableQuery.ts`   | `useTableQuery`   | 整合 searchForm + pagination + loading + list | ✅ 已提供 |
| `src/shared/composables/useUpload.ts`       | `useUpload`       | 文件上传封装                                  | ✅ 已提供 |
| `src/shared/composables/useApplication.ts`  | `useApplication`  | 通用申报表单/弹窗状态管理                     | ✅ 已提供 |
| `src/shared/composables/usePermission.ts`   | `usePermission`   | 权限判断（待实现）                            | 🚧 占位   |
| `src/shared/composables/useExport.ts`       | `useExport`       | 导入/导出逻辑（待实现）                       | 🚧 占位   |
| `src/shared/composables/useFormValidate.ts` | `useFormValidate` | 表单校验复用（待实现）                        | 🚧 占位   |

## 命名与编码规范

- 文件名使用 `camelCase`，以 `use` 开头。
- 单一职责：每个 Composable 仅负责一类逻辑。
- 禁止在 Composable 中直接操作 DOM 或路由跳转。
- 返回响应式引用或普通函数，避免返回无意义的对象包装。

## 使用示例

```ts
import { useDict } from '@/shared/composables'
import { APPLICATION_STATUS } from '@/shared/constants/dict'

const { getLabel, getColor, getOptions } = useDict(APPLICATION_STATUS)
```
