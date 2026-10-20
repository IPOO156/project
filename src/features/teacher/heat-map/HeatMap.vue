<script setup lang="ts">
import type { HeatmapStatistics, SemesterItem } from '@/shared/types/teacher'
/**
 * HeatMap - 成果热力图（管理员与教师共用同一页面，按角色切换端点）
 * 持 statistics:view（或 admin 角色）→ /admin/statistics/heatmap（全校数据，指标含「兴趣」）；
 * 教师 → /teacher/statistics/heatmap（本人 role_scopes 范围，指标仅 gpa/award/practice/archive）。
 * 组织 × 学期 指标矩阵，values 为 0-100 归一化值，rawValues 为原始值，maxValue/minValue 为原始值范围。
 * 学期与学院/专业/班级范围来自 /common/semesters + /auth/me scopes。
 */
import { ArrowDownAZ, Flame, Search, Sigma } from 'lucide-vue-next'

import { computed, onMounted, reactive, ref } from 'vue'
import { getAdminStatisticsHeatmap, getSemesters, getStatisticsHeatmap } from '@/shared/api/teacher'
import { scopeCascade, useScopeFilter } from '@/shared/composables/useScopeFilter'
import { useTeacherAuthz } from '@/shared/composables/useTeacherAuthz'

// 与后端 AdminStatisticsService 的 statistics:view 同码；admin 角色直通（其权限码可能为空）
const { canAccessAny } = useTeacherAuthz()
const useAdminHeatmap = computed(() => canAccessAny(['statistics:view']))

const semesters = ref<SemesterItem[]>([])
const loadingSemesters = ref(false)

/** 组织范围下拉项（学院/专业/班级，来自 /auth/me 的 scopes） */
const { colleges, majors, classes } = useScopeFilter()

interface MetricOption {
  value: string
  label: string
  unit: string
  decimals: number
  /** 仅管理端端点支持；教师端后端白名单不含该项，选了会被拒（见 metricOptions） */
  adminOnly?: boolean
}

const METRIC_OPTIONS: MetricOption[] = [
  { value: 'gpa', label: '绩点', unit: '', decimals: 2 },
  { value: 'award', label: '获奖', unit: '项', decimals: 0 },
  { value: 'practice', label: '实践', unit: '次', decimals: 0 },
  { value: 'interest', label: '兴趣', unit: '项', decimals: 0, adminOnly: true },
  { value: 'archive', label: '档案', unit: '份', decimals: 0 },
]

/**
 * 指标下拉按角色过滤 —— 后端两个端点的 metric 白名单不同：
 * 管理端 /admin/statistics/heatmap 支持 gpa/award/practice/interest/archive，
 * 教师端 /teacher/statistics/heatmap 仅 gpa/award/practice/archive
 * （教师端接口文档注明为「子集」，对应 AdminStatisticsService.TEACHER_HEATMAP_METRICS）。
 * 教师若选中「兴趣」，请求会被后端以 code 10001「metric 仅支持 gpa/award/practice/archive」拒绝，
 * 故选项跟随端点一起收窄 —— 与 load() 里 useAdminHeatmap 选端点的判断保持同一口径。
 */
const metricOptions = computed(() =>
  useAdminHeatmap.value ? METRIC_OPTIONS : METRIC_OPTIONS.filter((m) => !m.adminOnly),
)

const ORG_TYPE_OPTIONS = [
  { value: 2, label: '学院' },
  { value: 3, label: '专业' },
  { value: 4, label: '班级' },
]

function metricMeta(metric: string) {
  return METRIC_OPTIONS.find((m) => m.value === metric)
}

function metricLabel(metric: string) {
  return metricMeta(metric)?.label ?? metric
}

const filters = reactive({
  metric: 'award',
  orgType: 2,
  collegeId: undefined as number | undefined,
  majorId: undefined as number | undefined,
  classId: undefined as number | undefined,
  semesterId: undefined as number | undefined,
})

/** 组织维度 → 学院/专业/班级下拉显隐 */
const cascade = computed(() => scopeCascade(filters.orgType))

const loading = ref(false)
const heatmap = ref<HeatmapStatistics | null>(null)

function drillOrgId() {
  if (filters.orgType === 2) return filters.collegeId
  if (filters.orgType === 3) return filters.majorId
  if (filters.orgType === 4) return filters.classId
  return undefined
}

async function load() {
  loading.value = true
  try {
    // 管理员调 /admin/statistics/heatmap（全校数据），教师调 /teacher/statistics/heatmap（学院范围）
    const fn = useAdminHeatmap.value ? getAdminStatisticsHeatmap : getStatisticsHeatmap
    heatmap.value = await fn({
      semesterId: filters.semesterId,
      orgType: filters.orgType,
      orgId: drillOrgId(),
      metric: filters.metric,
    })
  } catch {
    heatmap.value = null
  } finally {
    loading.value = false
  }
}

/**
 * 把后端返回的学期名拆成 (学年, 学期序号)，用于表头两行排版与排序。
 * 支持 "2026-2027-1" / "2024-2025-2" / "2026 秋" / "2026秋季" 等格式。
 */
function parseSemester(name: string): { year: string; term: string } | null {
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

function handleSearch() {
  void load()
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

onMounted(async () => {
  loadingSemesters.value = true
  try {
    semesters.value = await getSemesters()
  } catch {
    semesters.value = []
  } finally {
    loadingSemesters.value = false
  }
  void load()
})
</script>

<template>
  <div class="mc-page heat-map">
    <header class="mc-page-head">
      <div class="mc-page-head__left">
        <h2 class="mc-page-head__title">成果热力图</h2>
        <p class="mc-page-head__desc">
          以组织为行、学期为列，查看各指标的成果分布（数值按全校该指标最大值归一化到 0-100）。
        </p>
      </div>
    </header>

    <!-- 筛选区 -->
    <div class="mc-filter-bar">
      <el-form inline @submit.prevent="handleSearch">
        <el-form-item label="指标">
          <el-select v-model="filters.metric" style="width: 140px">
            <el-option
              v-for="m in metricOptions"
              :key="m.value"
              :label="m.label"
              :value="m.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="行维度">
          <el-select v-model="filters.orgType" style="width: 120px">
            <el-option
              v-for="t in ORG_TYPE_OPTIONS"
              :key="t.value"
              :label="t.label"
              :value="t.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="cascade.college" label="学院">
          <el-select
            v-model="filters.collegeId"
            clearable
            placeholder="全部学院"
            style="width: 170px"
          >
            <el-option v-for="c in colleges" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="cascade.major" label="专业">
          <el-select
            v-model="filters.majorId"
            clearable
            placeholder="全部专业"
            style="width: 170px"
          >
            <el-option v-for="m in majors" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="cascade.class" label="班级">
          <el-select
            v-model="filters.classId"
            clearable
            placeholder="全部班级"
            style="width: 170px"
          >
            <el-option v-for="c in classes" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="学期">
          <el-select
            v-model="filters.semesterId"
            clearable
            placeholder="全部学期"
            :loading="loadingSemesters"
            style="width: 180px"
          >
            <el-option v-for="s in semesters" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 概览统计 -->
    <section v-if="hasData" class="heat-map__stats">
      <article class="heat-map__stat">
        <p class="heat-map__stat-label">最高值</p>
        <p class="heat-map__stat-value mc-num">
          {{ formatRaw(globalStats.maxRaw) }}
          <span class="heat-map__stat-unit">{{ metricMeta(filters.metric)?.unit || '' }}</span>
        </p>
        <p class="heat-map__stat-foot">全部单格中的最高原始值</p>
      </article>
      <article class="heat-map__stat">
        <p class="heat-map__stat-label">合计</p>
        <p class="heat-map__stat-value mc-num">
          {{ formatRaw(globalStats.totalRaw) }}
          <span class="heat-map__stat-unit">{{ metricMeta(filters.metric)?.unit || '' }}</span>
        </p>
        <p class="heat-map__stat-foot">矩阵内全部原始值求和</p>
      </article>
      <article class="heat-map__stat">
        <p class="heat-map__stat-label">平均热度</p>
        <p class="heat-map__stat-value mc-num">
          {{ globalStats.avgNorm }}
          <span class="heat-map__stat-unit">/ 100</span>
        </p>
        <p class="heat-map__stat-foot">按归一化值平均</p>
      </article>
      <article class="heat-map__stat">
        <p class="heat-map__stat-label">单元格</p>
        <p class="heat-map__stat-value mc-num">
          {{ globalStats.cellCount }}
          <span class="heat-map__stat-unit">格</span>
        </p>
        <p class="heat-map__stat-foot">
          {{ orderedSemesters.length }} 学期 × {{ matrixRows.length }} 组织
        </p>
      </article>
    </section>

    <!-- 热力图矩阵 -->
    <section class="mc-card heat-map__matrix-card">
      <div class="mc-card__head">
        <span class="mc-card__title">
          学期成果分布
          <span v-if="heatmap" class="heat-map__matrix-title-metric">
            {{ metricLabel(heatmap.metric) }}
          </span>
        </span>
        <div v-if="hasData" class="heat-map__legend">
          <span class="heat-map__legend-text">冷</span>
          <div class="heat-map__legend-track" :style="{ background: legendGradient }" />
          <span class="heat-map__legend-text">热</span>
          <span class="heat-map__legend-divider" />
          <span class="heat-map__legend-hint">
            <ArrowDownAZ :size="14" />
            最新
          </span>
        </div>
      </div>
      <div class="mc-card__body heat-map__matrix-body">
        <div v-loading="loading" class="heat-map__matrix-wrap">
          <!-- 表头 + 矩阵用同一个 grid 容器，列数固定以便对齐 -->
          <div
            v-if="hasData"
            class="heat-map__matrix"
            :style="{ '--cols': orderedSemesters.length }"
          >
            <!-- 列头：学年 + 学期 两行 -->
            <div class="heat-map__corner">
              <span class="heat-map__corner-label">组织</span>
              <span class="heat-map__corner-hint">
                <Sigma :size="12" />
                合计
              </span>
            </div>
            <div
              v-for="(s, idx) in orderedSemesters"
              :key="`head-${s.semesterId}`"
              class="heat-map__col-head"
              :class="{ 'is-newest': idx === 0 }"
              :title="s.semesterName"
            >
              <span class="heat-map__col-head-year">
                {{ parseSemester(s.semesterName)?.year ?? '—' }}
              </span>
              <span class="heat-map__col-head-term">
                {{
                  parseSemester(s.semesterName)?.term
                    ? `${parseSemester(s.semesterName)?.term}学期`
                    : s.semesterName
                }}
              </span>
            </div>
            <div class="heat-map__total-head">合计</div>

            <!-- 数据行 -->
            <template v-for="(row, rowIdx) in matrixRows" :key="row.orgId">
              <div class="heat-map__row-name" :title="row.orgName">
                <span class="heat-map__row-name-index">{{ rowIdx + 1 }}</span>
                <span class="heat-map__row-name-text">{{ row.orgName }}</span>
              </div>
              <div
                v-for="cell in row.cells"
                :key="`${row.orgId}-${cell.semesterId}`"
                class="heat-map__cell"
                :style="{ background: cellBg(cell.norm), color: cellTextColor(cell.norm) }"
                :title="`${row.orgName} · ${cell.semesterName}：${formatRaw(cell.raw)}${metricMeta(filters.metric)?.unit || ''}（归一化 ${Math.round(cell.norm)}）`"
              >
                <span class="heat-map__cell-num mc-num">{{ formatRaw(cell.raw) }}</span>
              </div>
              <div class="heat-map__cell is-total mc-num">
                {{ formatRaw(rowTotalRaw(row.cells)) }}
              </div>
            </template>
          </div>

          <!-- 空态 -->
          <div v-else-if="!loading" class="mc-empty heat-map__empty">
            <div class="mc-empty__icon"><Flame :size="24" /></div>
            <p class="mc-empty__title">暂无热力图数据</p>
            <p class="mc-empty__desc">
              所选维度 / 指标下暂无数据，可调整筛选条件后重试。
              <span v-if="isFiltered">已应用额外筛选。</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.heat-map {
  /* ── 概览统计：一条汇总栏，避免四张彩色卡片分散注意力 ── */
  &__stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1px;
    background: var(--el-border-color-lighter);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: $radius-lg;
    overflow: hidden;

    @media (max-width: 1100px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  &__stat {
    padding: 14px 20px;
    background: var(--el-bg-color);
  }
  &__stat-label {
    margin: 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    letter-spacing: 0.04em;
  }
  &__stat-value {
    margin: 4px 0 2px;
    font-size: 24px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    line-height: 1.15;
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
  }
  &__stat-unit {
    font-size: 12px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
  }
  &__stat-foot {
    margin: 0;
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    line-height: 1.5;
  }

  /* ── 卡片头部 ── */
  &__matrix-title-metric {
    margin-left: 6px;
    font-size: 12px;
    font-weight: 500;
    color: var(--el-text-color-regular);
  }

  /* ── 图例 ── */
  &__legend {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
  &__legend-text {
    color: var(--el-text-color-secondary);
  }
  &__legend-track {
    position: relative;
    width: 160px;
    height: 12px;
    border-radius: 999px;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.6),
      0 0 0 1px var(--el-border-color-light);

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      pointer-events: none;
      box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.06);
    }
  }
  &__legend-divider {
    width: 1px;
    height: 14px;
    background: var(--el-border-color-light);
    margin: 0 4px;
  }
  &__legend-hint {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--el-color-primary);
  }

  /* ── 矩阵（CSS Grid） ── */
  &__matrix-body {
    padding-top: 14px;
    padding-bottom: 18px;
  }
  &__matrix-wrap {
    min-height: 240px;
    overflow-x: auto;
  }
  &__matrix {
    display: grid;
    grid-template-columns:
      minmax(180px, 220px)
      repeat(var(--cols), minmax(96px, 1fr))
      minmax(80px, 100px);
    gap: 6px;
    align-items: stretch;
    min-width: 100%;
  }
  &__corner {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding: 8px 12px;
    border-radius: $radius-base;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-weight: 600;
  }
  &__corner-label {
    font-size: 13px;
  }
  &__corner-hint {
    margin-top: 2px;
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    font-weight: 400;
    color: var(--el-text-color-secondary);
  }

  &__col-head {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8px 6px 10px;
    border-radius: $radius-base;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    text-align: center;
    color: var(--el-text-color-secondary);

    &.is-newest {
      background: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary-light-7);
    }
  }
  &__col-head-year {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    line-height: 1.2;
    letter-spacing: 0.01em;
  }
  &__col-head-term {
    margin-top: 2px;
    font-size: 11px;
    letter-spacing: 0.04em;
  }

  &__total-head {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 6px;
    border-radius: $radius-base;
    background: var(--el-fill-color-light);
    font-size: 12px;
    color: var(--el-text-color-secondary);
    font-weight: 500;
  }

  &__row-name {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 12px;
    min-height: 56px;
    border-radius: $radius-base;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
  }
  &__row-name-index {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-size: 11px;
    font-weight: 600;
  }
  &__row-name-text {
    font-size: 13px;
    color: var(--el-text-color-primary);
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__cell {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 56px;
    padding: 0 6px;
    border-radius: $radius-base;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.2;
    transition:
      transform 0.18s $ease-standard,
      box-shadow 0.18s $ease-standard;
    cursor: default;

    &.is-total {
      background: var(--el-bg-color);
      border: 1px solid var(--el-border-color-light);
      color: var(--el-text-color-primary);
      font-weight: 700;
      font-size: 14px;
    }

    &:not(.is-total):hover {
      transform: scale(1.04);
      box-shadow: 0 6px 16px -4px rgba($color-primary, 0.35);
      z-index: 1;
    }
  }
  &__cell-num {
    display: inline-block;
  }

  &__empty {
    padding: 48px 24px;
  }
}
</style>
