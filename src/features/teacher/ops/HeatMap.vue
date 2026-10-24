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
import {
  getAdminStatisticsHeatmap,
  getSemesters,
  getStatisticsHeatmap,
} from '@/shared/api/teacher-api'
import { scopeCascade, useScopeFilter } from '@/shared/composables/useScopeFilter'
import { useTeacherAuthz } from '@/shared/composables/useTeacherAuthz'
import { useHeatMapOption } from './useHeatMapOption'

// 与后端 AdminStatisticsService 的 statistics:view 同码；admin 角色直通（其权限码可能为空）
const { canAccessAny } = useTeacherAuthz()
const useAdminHeatmap = computed(() => canAccessAny(['statistics:view']))

const semesters = ref<SemesterItem[]>([])
const loadingSemesters = ref(false)

/** 组织范围下拉项（学院/专业/班级，来自 /auth/me 的 scopes） */
const { colleges, majors, classes } = useScopeFilter()

const ORG_TYPE_OPTIONS = [
  { value: 2, label: '学院' },
  { value: 3, label: '专业' },
  { value: 4, label: '班级' },
]

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

// 指标元数据、学期排序、矩阵对齐、色阶与格式化统一由 composable 提供（与原实现逐字一致）
const {
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
} = useHeatMapOption({ heatmap, filters, useAdminHeatmap })

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

function handleSearch() {
  void load()
}

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

<style scoped lang="scss" src="./HeatMap.scss"></style>
