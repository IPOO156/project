<script setup lang="ts">
import type { OrgOverviewRow, SemesterItem, StatisticsParentOrg } from '@/shared/types/teacher'
import { ElMessage } from 'element-plus'
import { Search } from 'lucide-vue-next'

import { computed, onMounted, reactive, ref } from 'vue'
import { getSemesters, getStatisticsOverview } from '@/shared/api/teacher'
import { useTeacherMe } from '@/shared/composables/useTeacherMe'

/**
 * StatisticsOverview - 统计看板（/admin/statistics/overview）
 * 组织维度聚合：学生/档案/获奖/平均绩点/平均得分/实践次数/兴趣 TOP/画像维度分。
 * 自包含筛选（学期/维度/组织/年级），不依赖父组件 ArchiveView 的筛选状态。
 */
const { me } = useTeacherMe()

/* ── 筛选选项 ── */

const semesterOptions = ref<SemesterItem[]>([])
const loadingSemesters = ref(false)

const dimensionOptions = ['全校', '学院', '专业', '班级']
const DIMENSION_ORG_TYPE: Record<string, number | undefined> = {
  全校: undefined,
  学院: 2,
  专业: 3,
  班级: 4,
}

const colleges = computed(() =>
  (me.value?.scopes ?? [])
    .filter((s) => s.scopeType === 2 && s.scopeId != null)
    .map((s) => ({ id: s.scopeId, name: s.scopeName ?? `学院 ${s.scopeId}` })),
)
const majors = computed(() =>
  (me.value?.scopes ?? [])
    .filter((s) => s.scopeType === 3 && s.scopeId != null)
    .map((s) => ({ id: s.scopeId, name: s.scopeName ?? `专业 ${s.scopeId}` })),
)
const classes = computed(() =>
  (me.value?.scopes ?? [])
    .filter((s) => s.scopeType === 4 && s.scopeId != null)
    .map((s) => ({ id: s.scopeId, name: s.scopeName ?? `班级 ${s.scopeId}` })),
)

const dimension = ref('全校')
const filters = reactive({
  semesterId: undefined as number | undefined,
  collegeId: undefined as number | undefined,
  majorId: undefined as number | undefined,
  classId: undefined as number | undefined,
  grade: '',
})
const filterOpen = ref(false)

/* ── 数据（/admin/statistics/overview）── */

const overviewLoading = ref(false)
const statsRows = ref<OrgOverviewRow[]>([])
const parentOrg = ref<StatisticsParentOrg | null>(null)
const cacheHit = ref<boolean | null>(null)

const parentOrgText = computed(() =>
  parentOrg.value?.orgName ? `上级组织：${parentOrg.value.orgName}` : '',
)
const hasRows = computed(() => statsRows.value.length > 0)

type SumKey = 'studentCount' | 'archiveCount' | 'awardCount' | 'practiceCount'
type AvgKey = 'avgGpa' | 'avgScore'

function sumBy(rows: OrgOverviewRow[], key: SumKey): number {
  return rows.reduce((sum, r) => sum + (r[key] ?? 0), 0)
}

function avgBy(rows: OrgOverviewRow[], key: AvgKey): number | null {
  const values = rows.map((r) => r[key]).filter((v): v is number => v != null)
  if (!values.length) return null
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

function formatAvg(value: number | null | undefined): string {
  return value == null ? '—' : value.toFixed(2)
}

const kpis = computed(() => {
  const rows = statsRows.value
  return {
    studentCount: sumBy(rows, 'studentCount'),
    archiveCount: sumBy(rows, 'archiveCount'),
    awardCount: sumBy(rows, 'awardCount'),
    practiceCount: sumBy(rows, 'practiceCount'),
    avgGpa: avgBy(rows, 'avgGpa'),
    avgScore: avgBy(rows, 'avgScore'),
  }
})

const kpiCards = computed(() => [
  { label: '学生数', value: String(kpis.value.studentCount), unit: '人' },
  { label: '档案数', value: String(kpis.value.archiveCount), unit: '份' },
  { label: '获奖数', value: String(kpis.value.awardCount), unit: '项' },
  { label: '平均绩点', value: formatAvg(kpis.value.avgGpa), unit: '' },
  { label: '平均得分', value: formatAvg(kpis.value.avgScore), unit: '' },
  { label: '实践次数', value: String(kpis.value.practiceCount), unit: '次' },
])

async function loadOverview() {
  overviewLoading.value = true
  try {
    const scopeType = DIMENSION_ORG_TYPE[dimension.value]
    let scopeId: number | undefined
    if (dimension.value === '学院') scopeId = filters.collegeId
    else if (dimension.value === '专业') scopeId = filters.majorId
    else if (dimension.value === '班级') scopeId = filters.classId

    const res = await getStatisticsOverview({
      semesterId: filters.semesterId,
      scopeType,
      scopeId,
      grade: filters.grade || undefined,
    })
    statsRows.value = res.rows
    parentOrg.value = res.parentOrg
    cacheHit.value = res.cacheHit
  } catch {
    statsRows.value = []
    parentOrg.value = null
    cacheHit.value = null
  } finally {
    overviewLoading.value = false
  }
}

function handleSearch() {
  void loadOverview()
}

function handleReset() {
  dimension.value = '全校'
  filters.semesterId = undefined
  filters.collegeId = undefined
  filters.majorId = undefined
  filters.classId = undefined
  filters.grade = ''
  void loadOverview()
}

onMounted(async () => {
  loadingSemesters.value = true
  try {
    semesterOptions.value = await getSemesters()
  } catch {
    semesterOptions.value = []
    ElMessage.warning('学期加载失败')
  } finally {
    loadingSemesters.value = false
  }
  void loadOverview()
})
</script>

<template>
  <div class="statistics-overview">
    <div class="mc-card statistics-overview__card">
      <div class="mc-card__head">
        <span class="mc-card__title">统计看板</span>
        <span class="statistics-overview__head-meta">
          <span v-if="parentOrgText" class="statistics-overview__parent">{{ parentOrgText }}</span>
          <el-tag v-if="cacheHit" type="success" size="small" effect="plain">缓存</el-tag>
          <el-button
            size="small"
            text
            type="primary"
            class="statistics-overview__toggle"
            @click="filterOpen = !filterOpen"
          >
            {{ filterOpen ? '收起筛选' : '展开筛选' }}
          </el-button>
        </span>
      </div>
      <transition name="el-fade-in-linear">
        <div v-show="filterOpen" class="statistics-overview__filter">
          <el-form inline @submit.prevent>
            <el-form-item label="学期">
              <el-select
                v-model="filters.semesterId"
                placeholder="全部学期"
                clearable
                :loading="loadingSemesters"
                style="width: 160px"
              >
                <el-option
                  v-for="s in semesterOptions"
                  :key="s.value"
                  :label="s.label"
                  :value="s.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="维度">
              <el-select v-model="dimension" style="width: 92px">
                <el-option v-for="d in dimensionOptions" :key="d" :label="d" :value="d" />
              </el-select>
            </el-form-item>
            <el-form-item
              v-if="dimension === '学院' || dimension === '专业' || dimension === '班级'"
              label="学院"
            >
              <el-select
                v-model="filters.collegeId"
                clearable
                placeholder="全部学院"
                style="width: 140px"
              >
                <el-option v-for="c in colleges" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="dimension === '专业' || dimension === '班级'" label="专业">
              <el-select
                v-model="filters.majorId"
                clearable
                placeholder="全部专业"
                style="width: 150px"
              >
                <el-option v-for="m in majors" :key="m.id" :label="m.name" :value="m.id" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="dimension === '班级'" label="班级">
              <el-select
                v-model="filters.classId"
                clearable
                placeholder="全部班级"
                style="width: 140px"
              >
                <el-option v-for="c in classes" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="年级">
              <el-input
                v-model="filters.grade"
                clearable
                placeholder="如 2023级"
                style="width: 110px"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </transition>
      <div v-loading="overviewLoading" class="mc-card__body">
        <el-row :gutter="16" class="statistics-overview__kpis">
          <el-col v-for="kpi in kpiCards" :key="kpi.label" :xs="12" :sm="8" :md="4">
            <div class="kpi-item">
              <span class="kpi-item__label">{{ kpi.label }}</span>
              <div class="kpi-item__value-row">
                <span class="kpi-item__value mc-num">{{ kpi.value }}</span>
                <span v-if="kpi.unit" class="kpi-item__unit">{{ kpi.unit }}</span>
              </div>
            </div>
          </el-col>
        </el-row>

        <el-table v-if="hasRows" :data="statsRows" stripe style="width: 100%">
          <el-table-column prop="orgName" label="组织" min-width="140" />
          <el-table-column prop="studentCount" label="学生数" width="80" align="center" />
          <el-table-column prop="archiveCount" label="档案数" width="80" align="center" />
          <el-table-column prop="awardCount" label="获奖数" width="80" align="center" />
          <el-table-column label="平均绩点" width="90" align="center">
            <template #default="{ row }">{{ formatAvg(row.avgGpa) }}</template>
          </el-table-column>
          <el-table-column label="平均得分" width="90" align="center">
            <template #default="{ row }">{{ formatAvg(row.avgScore) }}</template>
          </el-table-column>
          <el-table-column prop="practiceCount" label="实践次数" width="90" align="center" />
          <el-table-column label="兴趣 TOP" min-width="180">
            <template #default="{ row }">
              <template v-if="row.topInterests?.length">
                <el-tag
                  v-for="interest in row.topInterests"
                  :key="interest"
                  size="small"
                  class="statistics-overview__tag"
                >
                  {{ interest }}
                </el-tag>
              </template>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="画像维度分" min-width="200">
            <template #default="{ row }">
              <template v-if="row.dimensionAvgScores?.length">
                <el-tag
                  v-for="d in row.dimensionAvgScores"
                  :key="d.dimensionCode"
                  size="small"
                  effect="plain"
                  class="statistics-overview__tag"
                >
                  {{ d.dimensionName }} {{ d.avgScore ?? '-' }}
                </el-tag>
              </template>
              <span v-else>-</span>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else-if="!overviewLoading" description="暂无统计数据" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.statistics-overview {
  &__card {
    /* 与 ArchiveView 的卡片节奏一致 */
  }
  &__head-meta {
    display: inline-flex;
    align-items: center;
    gap: $spacing-sm;
  }
  &__toggle {
    margin-left: $spacing-sm;
  }
  &__filter {
    padding: 12px 20px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .el-form-item {
      margin-bottom: 12px;
    }
    .el-form-item__label {
      color: var(--el-text-color-secondary);
      font-weight: 500;
    }
  }
  &__parent {
    font-size: $font-size-sm;
    color: var(--el-text-color-secondary);
  }
  &__kpis {
    margin-bottom: $spacing-lg;
  }
  &__tag {
    margin: 2px 6px 2px 0;
  }

  .kpi-item {
    height: 100%;
    margin-bottom: $spacing-md;
    padding: $spacing-md $spacing-lg;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: $radius-lg;
    background: var(--el-fill-color-lighter);

    &__label {
      display: block;
      margin-bottom: $spacing-xs;
      font-size: $font-size-sm;
      color: var(--el-text-color-secondary);
    }
    &__value-row {
      display: flex;
      align-items: baseline;
      gap: 2px;
    }
    &__value {
      font-size: $font-size-2xl;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }
    &__unit {
      font-size: $font-size-xs;
      color: var(--el-text-color-secondary);
    }
  }
}
</style>
