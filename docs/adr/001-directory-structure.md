# ADR-001：采用 features + shared + app 混合目录结构

## 状态

已采纳

## 背景

项目初期需要确定统一的源码目录组织方式，以支撑后续多个申报模块的并行开发，并降低模块间耦合。

## 决策

采用 `features + shared + app` 的混合模式：

- `src/app/`：应用入口、路由、布局、全局 Store。
- `src/features/`：按业务域划分的模块（auth、dashboard、profile、applications、approval）。
- `src/shared/`：全局共享的 API 封装、Composables、常量、类型、工具函数。

## 理由

- 与 Vue/Vite 社区主流实践一致，便于新成员上手。
- 明确分层：业务模块与通用能力解耦，避免跨模块直接引用。
- 路径嵌套控制在 4 层以内，减少 `../../../` 问题。

## 影响

- 新增业务模块优先放入 `src/features/`。
- 预计被 ≥2 个模块使用的逻辑需下沉到 `src/shared/`。
- 禁止 `features/*` 之间直接 import 内部实现。
