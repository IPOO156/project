import type { ComputedRef } from 'vue'
import type { AuthScope } from '@/shared/types/teacher'
import { computed } from 'vue'
import { useTeacherMe } from './useTeacherMe'

/**
 * 组织范围筛选 —— 从 /auth/me 的 scopes 派生「学院 / 专业 / 班级」下拉选项。
 *
 * 背景：档案查看、统计看板、档案导出、成果热力图等页面各自维护了一份**逐字相同**的
 * colleges/majors/classes 计算属性（scopeType 2/3/4 → 学院/专业/班级），在此统一。
 *
 * 说明：只抽逻辑、不抽模板。各页的这三个下拉与学期/年级等其他筛选器混在同一个容器里
 * （archive-view__filter-group / heat-map__filter-row / 各自独立的 el-form-item），
 * 容器与宽度控制是页面专属的视觉决策，抽成组件会把容器切碎，故保留各页自己的模板。
 */

/** 组织范围选项（id 为 scopeId，name 为 scopeName） */
export interface ScopeOption {
  id: number
  name: string
}

/**
 * 组织维度码（与各页既有的 DIMENSION_ORG_TYPE / SCOPE_TYPE 同源）：
 * 2 学院 · 3 专业 · 4 班级；「全校」「年级」等非组织维度不在其中。
 */
const SCOPE_TYPE_COLLEGE = 2
const SCOPE_TYPE_MAJOR = 3
const SCOPE_TYPE_CLASS = 4

/** 取某一级组织范围的可选项 */
function pickOptions(
  scopes: ComputedRef<AuthScope[] | undefined>,
  scopeType: number,
  fallbackPrefix: string,
): ComputedRef<ScopeOption[]> {
  return computed(() =>
    (scopes.value ?? [])
      .filter((s) => s.scopeType === scopeType && s.scopeId != null)
      .map((s) => ({ id: s.scopeId, name: s.scopeName ?? `${fallbackPrefix} ${s.scopeId}` })),
  )
}

/**
 * 组织范围筛选项。
 *
 * 用法：
 * ```ts
 * const { colleges, majors, classes } = useScopeFilter()
 * ```
 */
export function useScopeFilter(): {
  colleges: ComputedRef<ScopeOption[]>
  majors: ComputedRef<ScopeOption[]>
  classes: ComputedRef<ScopeOption[]>
} {
  const { me } = useTeacherMe()
  const scopes = computed(() => me.value?.scopes)

  return {
    colleges: pickOptions(scopes, SCOPE_TYPE_COLLEGE, '学院'),
    majors: pickOptions(scopes, SCOPE_TYPE_MAJOR, '专业'),
    classes: pickOptions(scopes, SCOPE_TYPE_CLASS, '班级'),
  }
}

/**
 * 组织维度 → 三级下拉显隐（与各页既有的 v-if 条件同源，勿改判定顺序）。
 *
 * 学院 显示 ⟺ 维度 ∈ {学院, 专业, 班级}
 * 专业 显示 ⟺ 维度 ∈ {专业, 班级}
 * 班级 显示 ⟺ 维度 = 班级
 *
 * 非组织维度（「全校」映射为 1 或 undefined、「年级」映射为 6 等）一律全隐。
 *
 * 用法：
 * ```ts
 * const cascade = computed(() => scopeCascade(DIMENSION_ORG_TYPE[dimension.value]))
 * ```
 * 模板：`v-if="cascade.college"`
 */
export function scopeCascade(scopeType?: number | null): {
  college: boolean
  major: boolean
  class: boolean
} {
  return {
    college:
      scopeType === SCOPE_TYPE_COLLEGE ||
      scopeType === SCOPE_TYPE_MAJOR ||
      scopeType === SCOPE_TYPE_CLASS,
    major: scopeType === SCOPE_TYPE_MAJOR || scopeType === SCOPE_TYPE_CLASS,
    class: scopeType === SCOPE_TYPE_CLASS,
  }
}
