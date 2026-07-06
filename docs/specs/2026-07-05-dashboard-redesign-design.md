# Dashboard 重构与主题修复设计文档

- **日期**：2026-07-05
- **主题**：Dashboard Bento 网格重构 + 日间/夜间模式全局修复
- **状态**：已确认

---

## 1. 背景与问题

当前 Dashboard 存在以下问题：

1. **AI 短板识别重复**：Dashboard 的「AI 识别与建议」与职业规划页面的「短板识别与改进建议」内容高度重合。
2. **奖项可视化位置冗余**：奖项气泡图已在 Dashboard 中，但用户认为该功能更适合放在奖项相关页面，首页应聚焦核心数据。
3. **首页布局传统**：当前左右两栏布局信息密度不均，重点不突出。
4. **主题模式效果不佳**：
   - 切换后部分组件未跟随变暗
   - 暗色模式颜色生硬、对比度不佳
   - 缺少切换过渡动画
   - 不支持跟随系统设置

---

## 2. 设计目标

1. 将 Dashboard 改造为 **Bento Grid（模块化网格）** 布局，信息层级清晰，支持响应式。
2. 从首页移除 **AI 识别与建议** 和 **个人奖项可视化** 模块。
3. 修复日间/夜间模式：全局生效、颜色柔和、支持过渡动画与系统偏好跟随。
4. 保留并复用现有组件，不删除 `ProfileInsights.vue` 和 `AwardBubbleChart.vue`，仅调整使用位置。

---

## 3. 架构设计

### 3.1 Bento Tile 组件

新增业务级容器组件（Dashboard 专用，后续复用范围扩大后再迁入 `src/shared/ui`）：

```
src/features/dashboard/components/BentoTile.vue
```

职责：

- 提供统一卡片外壳（圆角、边框、背景、hover 效果）
- 接收 `colSpan`、`rowSpan` 等布局属性
- 提供标题插槽与默认内容插槽
- 自动适配 light/dark 主题

### 3.2 Dashboard 配置化

`Dashboard.vue` 内部维护一个 `tiles` 配置数组：

```ts
interface BentoTileConfig {
  id: string
  title: string
  colSpan: number
  rowSpan?: number // 预留，暂不实现
  component: Component
  props?: Record<string, unknown>
}
```

首页 tile 配置（桌面端 12 列，避免跨行高度不对齐，采用大小列混排）：

| ID       | 标题         | colSpan | 组件            |
| -------- | ------------ | ------- | --------------- |
| welcome  | 欢迎         | 12      | WelcomeBar      |
| stats    | 数据概览     | 3×4     | StatCards       |
| radar    | 多维度画像   | 7       | RadarPanel      |
| gpa      | 个人绩点趋势 | 5       | GpaTrendChart   |
| quick    | 快捷入口     | 7       | QuickEntryPanel |
| activity | 最近动态     | 5       | ActivityPanel   |

> `rowSpan` 暂不支持，因 CSS Grid 自动行高跨行对齐困难；后续如引入固定行高可再扩展。

### 3.3 响应式策略

- **≥1200px**：12 列网格，按上述配置排布
- **768px - 1200px**：6 列网格，大格子自动占满
- **<768px**：单列垂直堆叠

---

## 4. 主题系统修复

### 4.1 接入 Element Plus 官方暗色变量

在 `main.ts` 中引入：

```ts
import 'element-plus/theme-chalk/dark/css-vars.css'
```

### 4.2 切换类名统一

将 `html[data-theme="dark"]` 切换为 `html.dark`，与 Element Plus 官方暗色模式保持一致。

### 4.3 自定义变量覆盖

在 `themes.css` 中：

- 保留 `--mc-*` 项目自定义变量
- 暗色背景使用层级灰：
  - 页面背景：`#121212`
  - 卡片背景：`#1e1e1e`
  - 悬浮/高亮层：`#2d2d2d`
- 降低语义色饱和度，避免暗色下刺眼

### 4.4 全局过渡动画

给 `html`、`body`、卡片、按钮等关键元素添加：

```css
transition:
  background-color 0.3s ease,
  color 0.3s ease,
  border-color 0.3s ease;
```

### 4.5 系统偏好跟随

`useThemeStore` 支持三种模式：

```ts
type ThemeMode = 'light' | 'dark' | 'system'
```

- `system` 模式下监听 `prefers-color-scheme` 变化
- 初始化默认值为 `system`

### 4.6 图表适配

ECharts 图表继续通过 `isDark` prop 动态调整颜色，确保在 dark 模式下可读。

---

## 5. 数据流

1. `useThemeStore` 读取/写入 `localStorage`，应用 `html.dark` 类
2. `themes.css` 变量随类名变化自动切换
3. `BentoTile` 使用 Element Plus 与项目自定义变量渲染外壳
4. Dashboard 通过 `tiles` 配置渲染各业务模块
5. 业务组件（如 `GpaTrendChart`）通过 `themeStore.isDark` 调整图表颜色

---

## 6. 错误处理

- `localStorage` 不可用时主题切换静默降级
- `prefers-color-scheme` 不支持时回退到 `light`
- 拖拽排序、刷新快捷入口等交互保留现有错误处理

---

## 7. 测试与验证

- `npx eslint . --max-warnings 0`
- `npx vue-tsc --noEmit`
- `npx vite build`
- 手动验证：light/dark 切换、系统偏好跟随、响应式布局

---

## 8. 后续可选扩展

- 将 `AwardBubbleChart` 整合到奖项总览页面
- 将 `ProfileInsights` 整合到职业规划页面（当前 CareerPlan 已有类似功能，可统一）
- 支持更多主题色（护眼暖色、高对比度）
