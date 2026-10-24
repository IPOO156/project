<script setup lang="ts">
import type { ScopeOption } from '@/shared/composables/useScopeFilter'
import type { SemesterItem } from '@/shared/types/teacher'
import { Filter, RefreshCw, Search } from 'lucide-vue-next'
import { computed } from 'vue'
import { statusOptions } from './archiveStatus'

/** 档案明细筛选条件（组织维度由页面单独维护） */
interface ArchiveFilterFields {
  semesterId?: number
  collegeId?: number
  majorId?: number
  classId?: number
  grade: string
  keyword: string
  status: number | ''
}

interface Props {
  /** 当前组织维度：全校 / 学院 / 专业 / 班级 */
  dimension: string
  /** 档案明细筛选条件 */
  filters: ArchiveFilterFields
  semesters: SemesterItem[]
  loadingSemesters: boolean
  colleges: ScopeOption[]
  majors: ScopeOption[]
  classes: ScopeOption[]
  /** 组织维度 → 学院/专业/班级下拉显隐 */
  cascade: { college: boolean; major: boolean; class: boolean }
  hasActiveFilter: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:dimension', v: string): void
  (e: 'update:filters', patch: Partial<ArchiveFilterFields>): void
  (e: 'search'): void
  (e: 'reset'): void
}>()

const dimensionOptions = ['全校', '学院', '专业', '班级']

/** 筛选字段统一通过 update:filters 回传补丁，子组件不直接改写父级状态 */
function patch(p: Partial<ArchiveFilterFields>) {
  emit('update:filters', p)
}

const dimension = computed({
  get: () => props.dimension,
  set: (v: string) => emit('update:dimension', v),
})
const semesterId = computed({
  get: () => props.filters.semesterId,
  set: (v?: number) => patch({ semesterId: v }),
})
const collegeId = computed({
  get: () => props.filters.collegeId,
  set: (v?: number) => patch({ collegeId: v }),
})
const majorId = computed({
  get: () => props.filters.majorId,
  set: (v?: number) => patch({ majorId: v }),
})
const classId = computed({
  get: () => props.filters.classId,
  set: (v?: number) => patch({ classId: v }),
})
const grade = computed({
  get: () => props.filters.grade,
  set: (v: string) => patch({ grade: v }),
})
const keyword = computed({
  get: () => props.filters.keyword,
  set: (v: string) => patch({ keyword: v }),
})
const status = computed({
  get: () => props.filters.status,
  set: (v: number | '') => patch({ status: v }),
})
</script>

<template>
  <!-- 筛选区 -->
  <section class="mc-card archive-view__filters">
    <div class="mc-card__head archive-view__filters-head">
      <span class="mc-card__title">
        <Filter :size="14" />
        筛选条件
      </span>
      <div class="archive-view__filters-meta">
        <span v-if="hasActiveFilter" class="archive-view__filters-tag">已应用筛选</span>
        <span v-else class="archive-view__filters-tag is-muted">未筛选</span>
      </div>
    </div>
    <div class="mc-card__body archive-view__filters-body">
      <div class="archive-view__filter-group">
        <p class="archive-view__filter-group-title">组织范围</p>
        <div class="archive-view__filter-row">
          <el-select v-model="dimension" class="archive-view__select archive-view__select--narrow">
            <el-option v-for="d in dimensionOptions" :key="d" :label="d" :value="d" />
          </el-select>
          <el-select
            v-model="semesterId"
            placeholder="全部学期"
            clearable
            :loading="loadingSemesters"
            class="archive-view__select"
          >
            <el-option v-for="s in semesters" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
          <el-select
            v-if="cascade.college"
            v-model="collegeId"
            clearable
            placeholder="全部学院"
            class="archive-view__select"
          >
            <el-option v-for="c in colleges" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
          <el-select
            v-if="cascade.major"
            v-model="majorId"
            clearable
            placeholder="全部专业"
            class="archive-view__select"
          >
            <el-option v-for="m in majors" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
          <el-select
            v-if="cascade.class"
            v-model="classId"
            clearable
            placeholder="全部班级"
            class="archive-view__select"
          >
            <el-option v-for="c in classes" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
          <el-input
            v-model="grade"
            clearable
            placeholder="年级，如 2023级"
            class="archive-view__select archive-view__select--narrow"
          />
        </div>
      </div>

      <div class="archive-view__filter-group">
        <p class="archive-view__filter-group-title">档案明细</p>
        <div class="archive-view__filter-row">
          <el-select v-model="status" class="archive-view__select archive-view__select--narrow">
            <el-option
              v-for="s in statusOptions"
              :key="String(s.value)"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
          <el-input
            v-model="keyword"
            placeholder="姓名 / 学号 / 档案标题"
            clearable
            class="archive-view__select archive-view__select--wide"
          >
            <template #prefix>
              <Search :size="14" />
            </template>
          </el-input>
          <div class="archive-view__filter-actions">
            <el-button type="primary" :icon="Search" @click="emit('search')">查询</el-button>
            <el-button :icon="RefreshCw" @click="emit('reset')">重置</el-button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.archive-view {
  /* ── 筛选区：分组视觉 ── */
  &__filters-head {
    .mc-card__title {
      gap: 6px;
    }
  }
  &__filters-meta {
    display: inline-flex;
    align-items: center;
    gap: $spacing-sm;
  }
  &__filters-tag {
    font-size: 12px;
    padding: 2px 10px;
    border-radius: 999px;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-weight: 500;
    &.is-muted {
      background: var(--el-fill-color-light);
      color: var(--el-text-color-secondary);
    }
  }
  &__filters-body {
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;
    padding-top: 14px;
    padding-bottom: 18px;
  }
  &__filter-group {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }
  &__filter-group-title {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--el-text-color-secondary);
  }
  &__filter-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: $spacing-md;
    align-items: center;
  }
  &__filter-actions {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    justify-content: flex-end;
    grid-column: span 2;
    @media (max-width: 900px) {
      grid-column: span 1;
      justify-content: flex-start;
    }
  }
  &__select {
    width: 100%;
    &--narrow {
      max-width: 180px;
    }
    &--wide {
      grid-column: span 2;
    }
  }
}
</style>
