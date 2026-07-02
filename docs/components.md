# 通用组件清单

> 按《前端开发规范与最佳实践（优化版）》2.4 / claude.md 2.6 要求维护。
> 预计被 ≥2 个页面/模块使用的组件，开发前必须在团队群同步，并登记到本文档。

## 登记格式

| 组件名 | 路径                          | 用途         | Props/Emits/Slots | 使用示例 | 负责人 |
| ------ | ----------------------------- | ------------ | ----------------- | -------- | ------ |
| 示例   | `src/shared/ui/AppButton.vue` | 统一按钮封装 | ...               | ...      | ...    |

## 当前通用组件

| 组件名                | 路径                                      | 用途                     | Props/Emits/Slots                                                                                                                          | 使用示例                                                 | 负责人   |
| --------------------- | ----------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- | -------- |
| StatusTag             | `src/shared/ui/StatusTag.vue`             | 统一显示申请状态标签     | `status: string`, `size?: TagProps['size']`                                                                                                | `<StatusTag :status="row.status" />`                     | 前端团队 |
| ApplicationFormRecord | `src/shared/ui/ApplicationFormRecord.vue` | 报名表单 + 记录列表模板  | `alertTitle`, `alertDescription`, `isEditing`, `submitting`, `records`, `showAlert?` / `submit`, `cancel`, `view`, `edit`, `remove` / `#form`, `#columns` | `<ApplicationFormRecord ...><template #form>...</template> | 前端团队 |
| RecordActionButtons   | `src/shared/ui/RecordActionButtons.vue`   | 记录操作按钮（查看/编辑/删除） | `row: T` / `view`, `edit`, `remove`                                                                                                        | `<RecordActionButtons :row="row" @edit="edit" />`       | 前端团队 |
| DictColumn            | `src/shared/ui/DictColumn.vue`            | 表格字典值转标签显示     | `value: string`, `options: Option[]`                                                                                                       | `<DictColumn :value="row.type" :options="TYPES" />`    | 前端团队 |
| ProofUpload           | `src/shared/ui/ProofUpload.vue`           | 佐证材料上传区域         | `modelValue?`, `accept?`, `tip?` / `update:modelValue`                                                                                     | `<ProofUpload v-model:file-list="form.files" />`         | 前端团队 |

## 全局组件说明

本项目使用 `unplugin-vue-components` + `ElementPlusResolver` 自动按需引入 Element Plus 组件，无需在 `main.ts` 中手动注册 Element Plus 组件。
自定义全局组件注册需同时满足：

1. 在 ≥5 个不同页面/模块中使用
2. 与具体业务逻辑解耦
3. 仅通过 Props / Slots 与父组件交互
