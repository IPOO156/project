# ADR-003：字典字段集中维护

## 状态

已采纳

## 背景

多个申报模块存在相同或类似的下拉选项（如奖学金等级、企业类型、申报状态），分散维护会导致不一致。

## 决策

所有字典常量统一维护在 `src/shared/constants/constants.ts`（实际字典定义在 `src/shared/constants/dict.ts`），通过 `useDict` 读取。

## 理由

- 保证全项目字典定义一致。
- 便于后续对接后端字典接口时统一替换。
- 避免在组件内部重复定义映射表。

## 影响

- 新增字典优先登记到 `src/shared/constants/dict.ts`。
- 组件内不再出现局部 `xxxMap` 字典映射。
