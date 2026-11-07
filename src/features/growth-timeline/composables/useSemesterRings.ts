import type { SemesterRing } from '../timelineConstants'
import { computed } from 'vue'
import { useUserStore } from '@/app/stores/useUserStore'
import { buildSemesterRings, findRingBySemester, resolveCohortYear } from '../timelineConstants'

/**
 * 年轮 ↔ 学期的映射，按当前登录学生的入学年份动态生成。
 * 入学年优先取 /profile/info 的 grade（如「2024级」），无法解析时回退到学号前四位 / 当年入学。
 */
export function useSemesterRings() {
  const userStore = useUserStore()

  const cohortYear = computed(() =>
    resolveCohortYear(userStore.userInfo?.grade, userStore.userInfo?.studentId),
  )
  const rings = computed<SemesterRing[]>(() => buildSemesterRings(cohortYear.value))

  function findRing(semester: string): SemesterRing | undefined {
    return findRingBySemester(semester, cohortYear.value)
  }

  function semesterLabel(semester: string): string {
    return findRing(semester)?.label ?? semester
  }

  function semesterIndex(semester: string): number {
    return findRing(semester)?.level ?? 0
  }

  return { cohortYear, rings, findRing, semesterLabel, semesterIndex }
}
