import type { ComputedRef, Ref } from 'vue'
import type { HeatmapStatistics, SemesterItem } from '@/shared/types/teacher'
import { computed } from 'vue'

/**
 * 热力图展示配置 —— 指标元数据、学期排序、矩阵对齐、色阶与格式化。
 *
 * 说明：本页的热力图由 CSS Grid 渲染（非 ECharts），此处集中承载等价于「图表 option」的
 * 全部派生配置（指标元数据 / 色阶 / 表头排序 / 单元格取值与格式化），
 * 页面 SFC 只保留筛选、请求与交互回调。所有字段、颜色与文案与原实现逐字一致。
 */

interface MetricOption {
  value: string
  label: string
  unit: string
  decimals: number
  accent: string
  /** 仅管理端端点支持；教师端后端白名单不含该项，选了会被拒（见 metricOptions） */
  adminOnly?: boolean
}

const METRIC_OPTIONS: MetricOption[] = [
  { value: 'gpa', label: '绩点', unit: '', decimals: 2, accent: '#1e3a5f' },
  { value: 'award', label: '获奖', unit: '项', decimals: 0, accent: '#d4a574' },
  { value: 'practice', label: '实践', unit: '次', decimals: 0, accent: '#10b981' },
  { value: 'interest', label: '兴趣', unit: '项', decimals: 0, accent: '#8b5cf6', adminOnly: true },
  { value: 'archive', label: '档案', unit: '份', decimals: 0, accent: '#3b82f6' },
]

/** 热力图筛选条件（与页面 filters 响应式对象同源） */
export interface HeatMapFilters {
  metric: string
  orgType: number
  collegeId?: number
  majorId?: number
  classId?: number
  semesterId?: number
}

/**
 * 把后端返回的学期名拆成 (学年, 学期序号)，用于表头两行排版与排序。
 * 支持 "2026-2027-1" / "2024-2025-2" / "2026 秋" / "2026秋季" 等格式。
 */
export function parseSemester(name: string): { year: string; term: string } | null {
  const m = String(name).match(/(\d{4})[-/年\s]*(\d{2,4})?[-/年\s]*(\d)?/)
  if (!m) return null
  const y = m[1]
  const tail = (m[3] ?? m[2] ?? '').toString()
  let term = tail
  // 末尾 1 / 2 → 上下学期
  if (/^[12]$/.test(term)) term = term === '1' ? '上' : '下'
  // 末尾出现"秋""春"字样
  if (name.includes('秋') || name.includes('第一')) term = '上'
  if (name.includes('春') || name.includes('第二')) term = '下'
  return { year: y, term }
}

/**
 * 归一化值 0-100 → 5 段插值色阶（冷蓝 → 深海蓝 → 琥珀金）。
 * 50 以下偏冷（深海蓝），50 以上开始渗入琥珀金，让"高"自然变暖。
 */
function lerpColor(a: [number, number, number], b: [number, number, number], t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t)
  const g = Math.round(a[1] + (b[1] - a[1]) * t)
  const bl = Math.round(a[2] + (b[2] - a[2]) * t)
  return `rgb(${r}, ${g}, ${bl})`
}

const HEAT_STOPS: Array<{ at: number; rgb: [number, number, number] }> = [
  { at: 0, rgb: [234, 240, 247] }, // 极淡蓝灰（冷起点）
  { at: 25, rgb: [148, 178, 213] }, // 柔钢蓝
  { at: 50, rgb: [55, 115, 175] }, // 深海蓝（主色锚点）
  { at: 75, rgb: [218, 162, 82] }, // 琥珀金（暖注入）
  { at: 100, rgb: [231, 111, 48] }, // 暖橙（高热端，更通透）
]

function heatColor(norm: number | undefined): string {
  const v = Math.max(0, Math.min(100, norm ?? 0))
  // 找到 v 所在的两个 stop
  let lo = HEAT_STOPS[0]
  let hi = HEAT_STOPS[HEAT_STOPS.length - 1]
  for (let i = 0; i < HEAT_STOPS.length - 1; i += 1) {
    if (v >= HEAT_STOPS[i].at && v <= HEAT_STOPS[i + 1].at) {
      lo = HEAT_STOPS[i]
      hi = HEAT_STOPS[i + 1]
      break
    }
  }
  if (lo.at === hi.at) return lerpColor(lo.rgb, hi.rgb, 0)
  const t = (v - lo.at) / (hi.at - lo.at)
  return lerpColor(lo.rgb, hi.rgb, t)
}

/**
 * 热力图展示配置（等价于图表 option 的派生配置集合）。
 *
 * 用法：
 * ```ts
 * const { orderedSemesters, matrixRows, globalStats } = useHeatMapOption({
 *   heatmap, filters, isAdmin, semesters,
 * })
 * ```
 */
export function useHeatMapOption(params: {
  heatmap: Ref<HeatmapStatistics | null>
  filters: HeatMapFilters
  isAdmin: ComputedRef<boolean>
  semesters: Ref<SemesterItem[]>
}) {
  const { heatmap, filters, isAdmin, semesters } = params

  /**
   * 指标下拉按角色过滤 —— 后端两个端点的 metric 白名单不同：
   * 管理端 /admin/statistics/heatmap 支持 gpa/award/practice/interest/archive，
   * 教师端 /teacher/statistics/heatmap 仅 gpa/award/practice/archive
   * （教师端接口文档注明为「子集」，对应 AdminStatisticsService.TEACHER_HEATMAP_METRICS）。
   * 教师若选中「兴趣」，请求会被后端以 code 10001「metric 仅支持 gpa/award/practice/archive」拒绝，
   * 故选项跟随端点一起收窄 —— 与 load() 里 isAdmin 选端点的判断保持同一口径。
   */
  const metricOptions = computed(() =>
    isAdmin.value ? METRIC_OPTIONS : METRIC_OPTIONS.filter((m) => !m.adminOnly),
  )

  function metricMeta(metric: string) {
    return METRIC_OPTIONS.find((m) => m.value === metric)
  }

  function metricLabel(metric: string) {
    return metricMeta(metric)?.label ?? metric
  }

  /**
   * 默认按"最新 → 最旧"展示。学期顺序由 parseSemester 推断，无解析结果时按原顺序兜底。
   */
  const orderedSemesters = computed(() => {
    const raw = heatmap.value?.semesters ?? []
    const indexed = raw.map((s, idx) => ({ ...s, idx }))
    const parsed = indexed.map((s) => {
      const p = parseSemester(s.semesterName)
      if (!p) return { ...s, sortKey: '' }
      return { ...s, sortKey: `${p.year}-${p.term}` }
    })
    return [...parsed].sort((a, b) => {
      if (!a.sortKey && !b.sortKey) return a.idx - b.idx
      if (!a.sortKey) return 1
      if (!b.sortKey) return -1
      return b.sortKey.localeCompare(a.sortKey)
    })
  })

  /**
   * 把行原始数据按"学期列展示顺序"重新对齐，让 cell 渲染和 header 一一对应。
   */
  const matrixRows = computed(() => {
    const rows = heatmap.value?.rows ?? []
    const order = orderedSemesters.value
    return rows.map((row) => {
      const cells = order.map((s) => ({
        semesterId: s.semesterId,
        semesterName: s.semesterName,
        norm: row.values?.[s.idx] ?? 0,
        raw: row.rawValues?.[s.idx] ?? 0,
      }))
      return {
        orgId: row.orgId,
        orgName: row.orgName,
        total: row.total ?? 0,
        cells,
      }
    })
  })

  /**
   * 行聚合（按矩阵重排后的列顺序求每行合计 raw）。
   */
  function rowTotalRaw(cells: { raw: number }[]) {
    return cells.reduce((sum, c) => sum + (c.raw ?? 0), 0)
  }

  /** 全局聚合 */
  const globalStats = computed(() => {
    const rows = matrixRows.value
    if (!rows.length) return { maxRaw: 0, totalRaw: 0, cellCount: 0, avgNorm: 0 }
    let maxRaw = 0
    let totalRaw = 0
    let cellCount = 0
    let normSum = 0
    rows.forEach((row) => {
      row.cells.forEach((c) => {
        if (c.raw > maxRaw) maxRaw = c.raw
        totalRaw += c.raw
        cellCount += 1
        normSum += c.norm
      })
    })
    return {
      maxRaw,
      totalRaw,
      cellCount,
      avgNorm: cellCount ? Math.round(normSum / cellCount) : 0,
    }
  })

  function cellBg(norm: number | undefined) {
    return heatColor(norm)
  }

  function cellTextColor(norm: number | undefined) {
    const v = Math.max(0, Math.min(100, norm ?? 0))
    // 75 段以后底色偏暖（琥珀/橙），文字用白色；之前保持深色文字
    return v >= 75 ? '#ffffff' : 'var(--el-text-color-primary)'
  }

  function formatRaw(raw: number) {
    const m = metricMeta(filters.metric)
    if (!m || m.decimals === 0) return raw.toString()
    return raw.toFixed(m.decimals)
  }

  const hasData = computed(
    () => (heatmap.value?.rows?.length ?? 0) > 0 && orderedSemesters.value.length > 0,
  )

  const isFiltered = computed(() =>
    Boolean(filters.collegeId || filters.majorId || filters.classId || filters.semesterId),
  )

  const legendGradient = computed(() => {
    const stops = HEAT_STOPS.map((s) => `${lerpColor(s.rgb, s.rgb, 1)} ${s.at}%`).join(', ')
    return `linear-gradient(90deg, ${stops})`
  })

  /** 页头「学期」chip：契约无统计时间字段，按当前学期筛选标注（默认为全部学期） */
  const semesterChipText = computed(() => {
    if (filters.semesterId == null) return '全部学期'
    return semesters.value.find((s) => s.value === filters.semesterId)?.label ?? '全部学期'
  })

  return {
    metricOptions,
    metricMeta,
    metricLabel,
    parseSemester,
    orderedSemesters,
    matrixRows,
    rowTotalRaw,
    globalStats,
    cellBg,
    cellTextColor,
    formatRaw,
    hasData,
    isFiltered,
    legendGradient,
    semesterChipText,
  }
}
