# 前端架构可扩展性设计文档

## 1. 目标与范围

本文档说明学生端档案管理系统前端架构的可扩展性设计，目标是在不破坏现有 `features + shared + app` 三层分层的前提下：

- 将菜单、模块元数据集中配置化，新增模块只需修改一处。
- 明确各层扩展点（菜单、路由、Store、共享 UI、共享能力）。
- 提供新增功能模块的标准操作流程（SOP）。
- 为后续权限控制、主题定制、微前端拆分预留扩展接口。

## 2. 当前架构回顾

项目采用 `features + shared + app` 混合目录结构：

| 目录            | 职责                                               | 约束                               |
| --------------- | -------------------------------------------------- | ---------------------------------- |
| `src/app/`      | 应用入口：路由、布局、全局 Store                   | 可被 `features/` 与 `shared/` 引用 |
| `src/features/` | 按业务域划分的功能模块                             | 禁止直接引用其他 feature 内部实现  |
| `src/shared/`   | 全局共享：API、Composables、配置、常量、类型、工具 | 禁止引用 `features/` 内部实现      |

核心约束：

- 路径嵌套不超过 4 层。
- 单文件 ≤600 行（含注释/空行 ≤650 行）。
- 组件样式 `scoped`。
- 字典、常量集中维护。

## 3. 扩展点清单

### 3.1 菜单扩展

- **位置**：`src/shared/config/moduleRegistry.ts`
- **说明**：新增模块时，在 `registeredModules` 数组中添加 `AppModule` 条目，填写 `menuItems`。
- **消费方**：`src/shared/constants/menu.ts` 调用 `getMenuItems()` 生成侧边栏菜单。
- **影响**：侧边栏、Tab 栏图标同步更新。

### 3.2 路由扩展

- **位置**：`src/app/router/routes.ts`
- **说明**：路由表继续作为路由权威来源。新增模块页面时，在此注册路由。
- **关联**：路由 `meta.title` 与 `moduleRegistry.ts` 中的 `label` 保持一致。

### 3.3 Store 扩展

- **位置**：`src/app/stores/`
- **说明**：按业务域拆分 Store，单 Store 文件 ≤200 行。
- **导出**：在 `src/app/stores/stores.ts` 中统一导出。
- **通信**：跨模块状态通过 Pinia Store 或 URL 参数完成，禁止直接修改其他模块状态。

### 3.4 共享 UI 扩展

- **位置**：`src/shared/ui/`
- **说明**：预计被 ≥2 个页面/模块使用的组件下沉到此处。
- **登记**：全局组件需登记到 `docs/components.md`。
- **现有组件**：`PageContainer`、`PageHeader`、`PageToolbar`、`RecordActionButtons`、`StatusTag`、`DictColumn` 等。

### 3.5 共享能力扩展

- **位置**：`src/shared/composables/`、`src/shared/utils/`、`src/shared/api/`
- **说明**：通用逻辑封装为 Composable 或工具函数。
- **现有能力**：`usePagination`、`useTableQuery`、`useDict` 等。

## 4. 模块注册表契约

```ts
// src/shared/config/moduleRegistry.ts
export interface AppModule {
  /** 模块唯一标识 */
  id: string
  /** 模块中文名 */
  label: string
  /** 模块默认图标 */
  icon: Component
  /** 侧边栏排序，数值越小越靠前 */
  order: number
  /** 路由前缀，如 /messages */
  routePrefix: string
  /** 该模块贡献的菜单项 */
  menuItems: MenuItem[]
  /** 模块说明 */
  description?: string
}
```

关键原则：

- 每个模块独立维护自身菜单项。
- 模块间不互相引用内部实现。
- 路由表继续作为路由权威来源，注册表仅描述菜单与模块元数据。

## 5. 新增模块标准操作流程（SOP）

以新增一个 "XX 管理" 模块为例：

1. **创建业务目录**
   - 在 `src/features/xx-management/` 下创建页面组件（如 `XxList.vue`、`XxForm.vue`）。

2. **注册路由**
   - 在 `src/app/router/routes.ts` 中添加路由，例如：
     ```ts
     {
       path: 'xx-management',
       children: [
         {
           path: '',
           name: 'XxManagement',
           component: () => import('@/features/xx-management/XxList.vue'),
           meta: { title: 'XX 管理' },
         },
       ],
     }
     ```

3. **注册模块**
   - 在 `src/shared/config/moduleRegistry.ts` 的 `registeredModules` 中添加：
     ```ts
     {
       id: 'xx-management',
       label: 'XX 管理',
       icon: SomeIcon,
       order: 45,
       routePrefix: '/xx-management',
       description: 'XX 业务管理模块',
       menuItems: [{ label: 'XX 管理', icon: SomeIcon, path: '/xx-management' }],
     }
     ```

4. **新增 Store（如需要）**
   - 在 `src/app/stores/xx-management.ts` 中定义 Store。
   - 在 `src/app/stores/stores.ts` 中导出。

5. **下沉共享能力（如需要）**
   - 若新增组件/工具被 ≥2 个模块使用，下沉到 `src/shared/ui/` 或 `src/shared/composables/`。
   - 在 `docs/components.md` 或 `docs/COMPOSABLES_GUIDE.md` 登记。

6. **验证**
   - 运行 `npx eslint . --max-warnings 0`。
   - 运行 `npx vue-tsc --noEmit`。
   - 运行 `npx vite build`。

## 6. 配置化菜单实现说明

`src/shared/constants/menu.ts` 现在从模块注册表派生：

```ts
import type { MenuItem } from '@/shared/config/moduleRegistry'
import { getMenuItems } from '@/shared/config/moduleRegistry'

export const menuItems: MenuItem[] = getMenuItems()
export type { MenuItem }

export function findMenuItemByPath(
  path: string,
  items: MenuItem[] = menuItems,
): MenuItem | undefined {
  /* ... */
}
```

这样：

- `Sidebar.vue` 直接消费 `menuItems`。
- `NavTabs.vue` 通过 `findMenuItemByPath` 根据路由匹配图标。
- 新增/调整菜单只需修改 `moduleRegistry.ts`。

## 7. 消息中心作为扩展示例

消息中心模块按上述 SOP 实现：

1. **业务目录**：`src/features/messages/`
   - `MessageCenter.vue`：通知列表与管理。
   - `activities/ActivityList.vue`：动态记录（从原 `src/features/activities/` 迁移）。

2. **路由**：`src/app/router/routes.ts` 中新增 `/messages` 与 `/messages/activities`。

3. **模块注册**：`moduleRegistry.ts` 中新增 `messages` 模块，贡献 "消息中心" 父菜单及 "通知"、"动态记录" 子菜单。

4. **Store**：新增 `useNotificationStore`，管理通知数据、未读计数、已读/删除操作。

5. **入口**：HeaderBar 铃铛图标点击跳转 `/messages`，badge 显示未读数。

## 8. 约束与红线

- **禁止跨 feature 引用**：`features/*` 之间禁止直接 `import` 组件内部方法或响应式变量。
- **禁止跨层反向引用**：`shared/` 不能引用 `features/`。
- **字典集中维护**：禁止在组件中重复定义枚举映射。
- **样式 scoped**：组件样式必须 `scoped`；覆盖第三方组件内部类名需使用 `:deep()` 并说明理由。
- **文件行数**：单文件 ≤600 行，必要时拆分组件。

## 9. 演进路线

| 阶段 | 目标                   | 关键动作                                                            |
| ---- | ---------------------- | ------------------------------------------------------------------- |
| 当前 | 配置化菜单与模块元数据 | `moduleRegistry.ts` + `menu.ts` 派生                                |
| 近期 | 权限感知菜单           | 在 `AppModule` 中增加 `permissions` 字段，菜单渲染时按权限过滤      |
| 中期 | 模块级懒加载策略       | 按 `routePrefix` 自动拆分 chunk，减少首屏包体积                     |
| 远期 | 微前端或插件化         | 将 `registeredModules` 扩展为远程模块注册接口，支持运行时加载子应用 |

## 10. 相关文档

- `docs/architecture.md`
- `docs/adr/001-directory-structure.md`
- `docs/components.md`
- `docs/COMPOSABLES_GUIDE.md`
