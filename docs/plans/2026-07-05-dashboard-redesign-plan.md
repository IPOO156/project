# Dashboard Bento 重构与主题修复实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Dashboard 改造为 Bento Grid 配置化布局，移除首页 AI 识别与建议/奖项可视化模块，并修复日间/夜间模式全局生效、过渡动画与系统偏好跟随。

**Architecture:** 新增业务级 `BentoTile` 容器组件，`Dashboard.vue` 通过 `tiles` 配置数组渲染首页各模块；主题层接入 Element Plus 官方 `html.dark` 暗色类，扩展 `useThemeStore` 支持 `system` 模式；CSS 变量集中维护于 `themes.css`。

**Tech Stack:** Vue 3 + TypeScript + Element Plus + Pinia + ECharts + SCSS

---

## 文件结构

| 文件                                              | 职责                                          | 操作                 |
| ------------------------------------------------- | --------------------------------------------- | -------------------- |
| `src/features/dashboard/components/BentoTile.vue` | Bento 卡片容器（标题、圆角、hover、主题适配） | 新建                 |
| `src/app/stores/theme.ts`                         | 主题状态管理，支持 light/dark/system          | 修改                 |
| `src/app/layouts/components/HeaderBar.vue`        | 主题切换按钮 UI，支持 system                  | 修改                 |
| `src/assets/styles/themes.css`                    | 明暗主题 CSS 变量、过渡动画                   | 修改                 |
| `src/main.ts`                                     | 引入 Element Plus 官方 dark css-vars          | 修改                 |
| `src/features/dashboard/Dashboard.vue`            | Bento 网格布局、tile 配置                     | 修改                 |
| `src/features/dashboard/dashboard-mock.ts`        | 移除 awards/weaknesses 等不再使用的 mock 数据 | 修改                 |
| `代码修改记录/2026-07-05.md`                      | 按项目规范记录本次变更                        | 新建（需用户审批后） |

---

## Task 1: 扩展主题 Store 支持 system 模式

**Files:**

- Modify: `src/app/stores/theme.ts`
- Test: 手动验证 + 后续 `npx vue-tsc --noEmit`

- [ ] **Step 1: 替换 ThemeMode 类型并增加系统偏好读取逻辑**

```typescript
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'app-theme-mode'

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function readTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {}
  return 'system'
}

function writeTheme(mode: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {}
}

function applyTheme(mode: ThemeMode): void {
  const effective = mode === 'system' ? getSystemTheme() : mode
  const html = document.documentElement
  if (effective === 'dark') {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<ThemeMode>(readTheme())
  const isDark = computed(() => {
    return theme.value === 'dark' || (theme.value === 'system' && getSystemTheme() === 'dark')
  })

  function setTheme(mode: ThemeMode) {
    theme.value = mode
    writeTheme(mode)
    applyTheme(mode)
  }

  function toggleTheme() {
    setTheme(isDark.value ? 'light' : 'dark')
  }

  // 初始化与系统偏好监听
  function init() {
    applyTheme(theme.value)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener?.('change', () => {
      if (theme.value === 'system') applyTheme('system')
    })
  }

  return { theme, isDark, setTheme, toggleTheme, init }
})
```

- [ ] **Step 2: 在 `src/app/App.vue` 或 `src/main.ts` 中调用 `init()`**

在 `App.vue` 的 `onMounted` 中（若不存在则创建）：

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useThemeStore } from '@/app/stores/theme'

const themeStore = useThemeStore()
onMounted(() => themeStore.init())
</script>
```

若 `App.vue` 无 script 块，直接新增。

- [ ] **Step 3: 提交**

```bash
git add src/app/stores/theme.ts src/app/App.vue
git commit -m "2026/07/05-前端-扩展主题 Store 支持 system 模式与 html.dark"
```

---

## Task 2: 引入 Element Plus 官方暗色变量

**Files:**

- Modify: `src/main.ts`
- Test: `npx vite build`

- [ ] **Step 1: 在 main.ts 引入 dark css-vars**

```typescript
// 在现有 element-plus 样式导入之后添加
import 'element-plus/theme-chalk/dark/css-vars.css'
```

注意保留现有导入顺序：

```typescript
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
```

- [ ] **Step 2: 提交**

```bash
git add src/main.ts
git commit -m "2026/07/05-前端-引入 Element Plus 官方暗色 CSS 变量"
```

---

## Task 3: 重写 themes.css 明暗变量与过渡动画

**Files:**

- Modify: `src/assets/styles/themes.css`
- Test: 手动切换主题观察效果

- [ ] **Step 1: 覆盖为基于 html.dark 的变量**

```css
/* 全局过渡 */
html,
body,
.el-card,
.el-button,
.el-input__wrapper,
.el-table,
.el-menu {
  transition:
    background-color 0.3s ease,
    color 0.3s ease,
    border-color 0.3s ease;
}

:root {
  /* 页面背景 */
  --mc-bg-page: #f5f7fa;
  --mc-bg-card: #ffffff;
  --mc-bg-hover: #f2f3f5;
  --mc-bg-elevated: #ffffff;

  /* 文字 */
  --mc-text-primary: #1f2937;
  --mc-text-secondary: #4b5563;
  --mc-text-tertiary: #9ca3af;

  /* 边框 */
  --mc-border-color: #e5e7eb;

  /* 语义色（降低饱和度，避免刺眼） */
  --mc-color-primary: #2563eb;
  --mc-color-success: #16a34a;
  --mc-color-warning: #d97706;
  --mc-color-danger: #dc2626;
}

html.dark {
  --mc-bg-page: #121212;
  --mc-bg-card: #1e1e1e;
  --mc-bg-hover: #2d2d2d;
  --mc-bg-elevated: #252525;

  --mc-text-primary: #f3f4f6;
  --mc-text-secondary: #d1d5db;
  --mc-text-tertiary: #6b7280;

  --mc-border-color: #333333;

  /* 暗色下降低亮度 */
  --mc-color-primary: #60a5fa;
  --mc-color-success: #4ade80;
  --mc-color-warning: #fbbf24;
  --mc-color-danger: #f87171;
}

/* 应用背景 */
body {
  background-color: var(--mc-bg-page);
  color: var(--mc-text-primary);
}
```

- [ ] **Step 2: 删除旧的 data-theme 选择器**

确认文件中不再使用 `[data-theme="dark"]`，统一改为 `html.dark`。

- [ ] **Step 3: 提交**

```bash
git add src/assets/styles/themes.css
git commit -m "2026/07/05-前端-重构主题变量与全局过渡动画"
```

---

## Task 4: 更新 HeaderBar 主题切换 UI

**Files:**

- Modify: `src/app/layouts/components/HeaderBar.vue`

- [ ] **Step 1: 把切换按钮改为下拉选择（light/dark/system）**

```vue
<template>
  <!-- 在 HeaderBar 合适位置插入 -->
  <el-dropdown @command="themeStore.setTheme">
    <el-button text>
      <Sun v-if="themeStore.theme === 'light'" :size="18" />
      <Moon v-else-if="themeStore.theme === 'dark'" :size="18" />
      <Monitor v-else :size="18" />
    </el-button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="light">日间模式</el-dropdown-item>
        <el-dropdown-item command="dark">夜间模式</el-dropdown-item>
        <el-dropdown-item command="system">跟随系统</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>
```

- [ ] **Step 2: 导入图标**

```typescript
import { Monitor, Moon, Sun } from 'lucide-vue-next'
```

- [ ] **Step 3: 提交**

```bash
git add src/app/layouts/components/HeaderBar.vue
git commit -m "2026/07/05-前端-HeaderBar 主题切换支持 light/dark/system"
```

---

## Task 5: 创建 BentoTile 容器组件

**Files:**

- Create: `src/features/dashboard/components/BentoTile.vue`
- Test: `npx vue-tsc --noEmit`

- [ ] **Step 1: 编写组件**

```vue
<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title?: string
  colSpan?: number
}

const props = withDefaults(defineProps<Props>(), {
  colSpan: 12,
})

const gridClass = computed(() => `bento-tile--span-${props.colSpan}`)
</script>

<template>
  <el-card class="bento-tile" :class="gridClass" shadow="hover">
    <template v-if="title" #header>
      <span class="bento-tile__title">{{ title }}</span>
    </template>
    <div class="bento-tile__body">
      <slot />
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.bento-tile {
  height: 100%;
  background-color: var(--mc-bg-card);
  border-color: var(--mc-border-color);
  transition:
    background-color 0.3s ease,
    border-color 0.3s ease,
    transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }

  &--span-3 {
    grid-column: span 3;
  }
  &--span-5 {
    grid-column: span 5;
  }
  &--span-7 {
    grid-column: span 7;
  }
  &--span-12 {
    grid-column: span 12;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--mc-text-primary);
  }

  &__body {
    color: var(--mc-text-secondary);
  }
}

@media (max-width: 1200px) {
  .bento-tile {
    &--span-3,
    &--span-5,
    &--span-7 {
      grid-column: span 6;
    }
  }
}

@media (max-width: 768px) {
  .bento-tile {
    &--span-3,
    &--span-5,
    &--span-7,
    &--span-12 {
      grid-column: span 12;
    }
  }
}
</style>
```

- [ ] **Step 2: 提交**

```bash
git add src/features/dashboard/components/BentoTile.vue
git commit -m "2026/07/05-前端-新增 BentoTile 容器组件"
```

---

## Task 6: 重构 Dashboard.vue 为 Bento Grid

**Files:**

- Modify: `src/features/dashboard/Dashboard.vue`
- Modify: `src/features/dashboard/dashboard-mock.ts`

- [ ] **Step 1: 移除首页不需要的模块**

从 `Dashboard.vue` 中删除：

- `AwardBubbleChart` 引用与模板
- `ProfileInsights` 引用与模板
- 对应的 import

- [ ] **Step 2: 移除 dashboard-mock.ts 中不再使用数据**

删除 `awards`、`weaknesses`、`teacherSuggestions` 等 mock 数据导出，保留 `gpaTrend`。

- [ ] **Step 3: 重构 Dashboard.vue 模板为 Bento Grid**

```vue
<template>
  <div class="dashboard">
    <div class="bento-grid">
      <BentoTile :col-span="12" class="dashboard__welcome-tile">
        <!-- 欢迎区内容 -->
      </BentoTile>

      <BentoTile v-for="card in statsCards" :key="card.label" :title="card.label" :col-span="3">
        <!-- 统计卡片内容 -->
      </BentoTile>

      <BentoTile title="多维度画像评估" :col-span="7">
        <div class="radar-panel">
          <VChart class="radar-panel__chart" :option="radarOption" autoresize />
          <div class="radar-panel__summary">
            <!-- 指标摘要 -->
          </div>
        </div>
      </BentoTile>

      <BentoTile title="个人绩点趋势" :col-span="5">
        <GpaTrendChart :data="dashboardMockData.gpaTrend" :is-dark="themeStore.isDark" />
      </BentoTile>

      <BentoTile title="快捷入口" :col-span="7">
        <!-- 快捷入口网格 -->
      </BentoTile>

      <BentoTile title="最近动态" :col-span="5">
        <!-- 最近动态列表 -->
      </BentoTile>
    </div>
  </div>
</template>
```

- [ ] **Step 4: 添加 Bento Grid 样式**

```scss
.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 16px;
}
```

- [ ] **Step 5: 提交**

```bash
git add src/features/dashboard/Dashboard.vue src/features/dashboard/dashboard-mock.ts
git commit -m "2026/07/05-前端-Dashboard 改造为 Bento Grid 并移除 AI/奖项模块"
```

---

## Task 7: 修复剩余主题相关组件与图表

**Files:**

- Modify: `src/features/dashboard/components/GpaTrendChart.vue`
- Modify: 其他仍使用旧变量的组件

- [ ] **Step 1: 更新 GpaTrendChart 暗色配色**

确保 `tooltipBg`、`axisColor`、`splitColor` 等基于 `isDark` 计算的值使用新的层级灰。

```typescript
const tooltipBg = computed(() =>
  props.isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(17, 24, 39, 0.92)',
)
const axisColor = computed(() => (props.isDark ? '#333333' : 'rgba(148, 163, 184, 0.18)'))
const splitColor = computed(() => (props.isDark ? '#252525' : 'rgba(148, 163, 184, 0.12)'))
const textColor = computed(() => (props.isDark ? '#d1d5db' : '#334155'))
```

- [ ] **Step 2: 检查并替换旧的 `--el-bg-color` 等直接依赖**

通过 Grep 搜索 `data-theme`、`--el-bg-color` 等项目变量使用，确保全部迁移到 `var(--mc-*)` 或 Element Plus 官方 dark 变量。

- [ ] **Step 3: 提交**

```bash
git add src/features/dashboard/components/GpaTrendChart.vue
git commit -m "2026/07/05-前端-更新图表暗色配色与主题变量引用"
```

---

## Task 8: 代码质量验证

**Files:** 全部改动文件

- [ ] **Step 1: ESLint 检查并自动修复**

```bash
npx eslint . --fix --max-warnings 0
```

- [ ] **Step 2: TypeScript 类型检查**

```bash
npx vue-tsc --noEmit
```

- [ ] **Step 3: 生产构建验证**

```bash
npx vite build
```

- [ ] **Step 4: 提交修复（如有）**

```bash
git add .
git commit -m "2026/07/05-前端-修复 lint 与类型检查问题"
```

---

## Task 9: 手动验收清单

- [ ] 日间/夜间/跟随系统三种模式均可切换
- [ ] 切换时所有卡片、按钮、菜单、表格有 0.3s 颜色过渡
- [ ] 暗色下无纯黑背景，卡片背景为 `#1e1e1e`
- [ ] 首页不再显示「AI 识别与建议」和「个人奖项可视化」
- [ ] 首页呈现 Bento 网格布局：统计卡片区、雷达图、绩点趋势、快捷入口、最近动态
- [ ] 缩小窗口到 768px 以下，各模块垂直堆叠无重叠
- [ ] 图表在暗色下文字/轴线/网格线清晰可读

---

## Task 10: 编写代码修改记录（需用户审批）

**Files:**

- Create: `代码修改记录/2026-07-05.md`

- [ ] **Step 1: 按项目模板撰写修改记录**

模板要点：

- 修改原因：Dashboard 布局优化与主题修复
- 删除范围：Dashboard 中的 AI 识别与建议、奖项可视化
- 新增范围：BentoTile 组件、themes.css 变量、主题 system 模式
- 影响范围：Dashboard、HeaderBar、主题 Store、全局样式
- 验证命令：`npx eslint . --max-warnings 0 && npx vue-tsc --noEmit && npx vite build`

- [ ] **Step 2: 提交用户审批后再写入文件**

> 由于项目规范要求「必须获得用户批准后才能写入代码修改记录」，本步骤需在用户明确同意后方可执行。

---

## 自检清单

- [x] Spec 覆盖：Bento 布局 ✓、移除 AI/奖项 ✓、主题 system 模式 ✓、过渡动画 ✓、图表适配 ✓
- [x] 无占位符：所有步骤包含具体代码或命令
- [x] 类型一致：`ThemeMode` 在 Store 与 HeaderBar 中统一使用
- [x] 路径符合项目约定：Vue 文件 PascalCase，业务组件放在 `features/dashboard/components/`
