# 原子成长时间轴设计文档

## 1. 背景与目标

把现有的「成长时间轴」概念从 `timeline-organic.html` 的平面年轮滚动页，升级为**项目内的独立 3D 可视化页面**。

核心隐喻：

- **年轮** = 时间分层，每一圈代表一个学期（大一上 → 大四下）。
- **原子核** = 个人成长核心，点击可添加新经历。
- **电子** = 每一条个人经历，沿对应学期的年轮轨道运动。
- **星系** = 点击电子后，右侧浮现的经历详情卡片。

目标：让用户一眼看到自己大学四年的成长轨迹像树木年轮一样扩散，同时保留原子/星系的科技感与互动性。

## 2. 范围

### 第一版包含

1. 新增路由 `/growth-timeline`，与「个人中心」「各类申报」「奖项报名」同级。
2. 使用 Three.js 构建 3D 年轮原子模型。
3. 6~8 条 mock 经历数据写死在组件中。
4. 点击原子核弹出表单，添加新经历。
5. 根据经历日期自动计算学期，分配到对应年轮轨道。
6. 点击电子后相机平移，右侧浮现详情卡片。
7. 响应式适配：PC 为主，移动端能正常查看。

### 第一版不包含

- 后端接口对接（后续迭代）。
- 经历的编辑与删除。
- AI 生成经历。
- 复杂的状态过渡动画。

## 3. 架构与组件

### 3.1 页面结构

```
src/features/growth-timeline/
├── GrowthTimeline.vue          # 页面入口，组装 3D 场景与详情面板
├── components/
│   ├── AtomScene.vue           # Three.js 3D 原子场景
│   ├── ExperienceDetail.vue    # 经历详情卡片（星系）
│   └── ExperienceForm.vue      # 添加经历表单弹窗
├── composables/
│   └── useGrowthTimeline.ts    # 数据与业务逻辑
└── constants.ts                # 学期轨道配置、颜色等常量
```

### 3.2 依赖

- `three`：3D 渲染核心。
- `@types/three`：TypeScript 类型支持。

## 4. 数据结构

### 4.1 经历数据

```ts
interface GrowthExperience {
  id: string
  title: string
  date: string // 发生日期，格式 YYYY-MM-DD
  semester: string // 自动计算，如 2023-2024-1
  description: string
  tags: string[] // 竞赛、科研、实践、荣誉、志愿...
  skills: {
    name: string
    growth: number // 0-100
  }[]
}
```

### 4.2 学期轨道配置

```ts
interface SemesterOrbit {
  level: number // 1-8，对应大一上到大四下
  label: string // "大一上"
  code: string // "2023-2024-1"
  radius: number // 3D 场景中的轨道半径
  tilt: number // 轨道倾斜角度，制造 3D 感
  color: string // 轨道颜色
}

const SEMESTER_ORBITS: SemesterOrbit[] = [
  { level: 1, label: '大一上', code: '2023-2024-1', radius: 80, tilt: 0.15, color: '#8b6340' },
  { level: 2, label: '大一下', code: '2023-2024-2', radius: 110, tilt: -0.2, color: '#a88560' },
  { level: 3, label: '大二上', code: '2024-2025-1', radius: 140, tilt: 0.25, color: '#5a7c5a' },
  { level: 4, label: '大二下', code: '2024-2025-2', radius: 170, tilt: -0.15, color: '#6b8e5b' },
  { level: 5, label: '大三上', code: '2025-2026-1', radius: 200, tilt: 0.2, color: '#c8943e' },
  { level: 6, label: '大三下', code: '2025-2026-2', radius: 230, tilt: -0.25, color: '#ddb05a' },
  { level: 7, label: '大四上', code: '2026-2027-1', radius: 260, tilt: 0.1, color: '#3a5c3a' },
  { level: 8, label: '大四下', code: '2026-2027-2', radius: 290, tilt: -0.1, color: '#5c3d28' },
]
```

### 4.3 学期自动计算规则

根据 `date` 字段中的月份判断：

- 9 月 ~ 次年 1 月：第一学期（-1）
- 2 月 ~ 7 月：第二学期（-2）
- 学年起始年根据入学年份倒推：大一上为入学当年 9 月。

第一版简化处理：以 `2023-09-01` 作为大一上起点，后续每半年一级。

## 5. 交互设计

### 5.1 初始状态

- 页面加载后，3D 场景居中显示年轮原子。
- 原子核缓慢自转，电子沿各自轨道匀速运动。
- 右下角显示操作提示：「点击原子核添加经历 · 点击电子查看详情」。

### 5.2 悬停电子

- 电子放大 1.5 倍。
- 显示 tooltip，展示经历标题与学期。
- 所在轨道高亮。

### 5.3 点击电子

- 相机平滑移动到该电子侧面（约 400ms）。
- 右侧滑出 `ExperienceDetail` 详情卡片。
- 详情卡片展示：标题、学期、日期、标签、描述、能力成长条。
- 再次点击空白处或关闭按钮，相机复位，卡片收回。

### 5.4 点击原子核

- 弹出 `ExperienceForm` 表单弹窗。
- 用户填写标题、日期、描述、标签、能力成长。
- 提交后根据日期自动计算学期，生成新电子并放入对应轨道。
- 新电子生成时有一个从原子核向外"跃迁"到轨道的动画。

### 5.5 添加新经历的跃迁动画

- 表单提交后，先在地核位置生成一个高亮粒子。
- 粒子沿螺旋路径向外移动到目标轨道。
- 到达轨道后稳定为普通电子并开始匀速圆周运动。

## 6. 视觉设计

### 6.1 整体风格

延续 `timeline-organic.html` 的纸质/自然/复古科学风格：

- 背景色：`#f4efe6`（羊皮纸色）+ 噪点纹理。
- 字体：保持项目现有字体，标题使用衬线体。

### 6.2 原子核

- 使用带纹理的球体，表面渲染同心圆环，模拟年轮。
- 颜色：木质色 `#5c3d28` → `#8b6340` 渐变。
- 中心微微发光，有呼吸脉动效果。
- 尺寸：半径约 25~30。

### 6.3 轨道

- 每个轨道是一个细圆环。
- 轨道从里到外半径递增，颜色随层级渐变。
- 轨道半透明，营造电子云/年轮的朦胧感。
- 轨道有一定倾斜，增强 3D 立体感。

### 6.4 电子

- 小球体，带自发光和暖色光晕。
- 颜色从木质/自然色谱中选取：
  - 默认态：琥珀金 `#c8943e`
  - 悬停态：秋叶橙 `#d9944a`
  - 高亮态：暖白 `#f4efe6`
- 光晕颜色与所在轨道颜色呼应（木质棕、苔藓绿、秋叶橙交替）。
- 同一轨道上的多个电子自动均匀分布角度。
- 运动速度随轨道层级略有差异，外层稍慢。

### 6.5 详情卡片

- 位置：页面右侧，占约 30% 宽度。
- 样式：毛玻璃卡片 `rgba(255, 252, 247, 0.85)` + `backdrop-filter: blur(12px)`。
- 圆角 16px，边框 1px `rgba(61, 43, 31, 0.08)`。
- 内容与 `timeline-organic.html` 的 growth-card 风格一致。

## 7. 路由与导航

### 7.1 路由注册

```ts
{
  path: '/growth-timeline',
  name: 'GrowthTimeline',
  component: () => import('@/features/growth-timeline/GrowthTimeline.vue'),
  meta: { title: '成长时间轴', icon: 'Clock' }
}
```

### 7.2 侧边栏入口

在 `Sidebar.vue` 的导航列表中，与「个人中心」「各类申报」「奖项报名」同级添加：

- 图标：Clock 或类似图标
- 文字：成长时间轴
- 路由：`/growth-timeline`

## 8. 文件清单

新增文件：

- `src/features/growth-timeline/GrowthTimeline.vue`
- `src/features/growth-timeline/components/AtomScene.vue`
- `src/features/growth-timeline/components/ExperienceDetail.vue`
- `src/features/growth-timeline/components/ExperienceForm.vue`
- `src/features/growth-timeline/composables/useGrowthTimeline.ts`
- `src/features/growth-timeline/constants.ts`
- `docs/superpowers/specs/2026-07-02-atomic-growth-timeline-design.md`

修改文件：

- `src/app/router/routes.ts`
- `src/app/layouts/components/Sidebar.vue`
- `package.json`（新增 `three` 和 `@types/three` 依赖）

## 9. 风险与后续

### 9.1 风险

- Three.js 包体积较大，首屏加载会增加约 500KB~1MB。
- 低端设备/WebGL 不支持时可能无法显示，需要添加降级提示。

### 9.2 后续迭代

- 对接后端接口，持久化经历数据。
- 支持编辑、删除经历。
- 接入 AI，根据经历自动生成「星系故事」文案。
- 支持导出/分享时间轴图片。
