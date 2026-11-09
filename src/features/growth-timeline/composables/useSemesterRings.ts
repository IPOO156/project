import type { GrowthExperience, SemesterRing } from '../timelineConstants'
import { computed } from 'vue'
import { useUserStore } from '@/app/stores/useUserStore'
import {
  buildSemesterRings,
  findRingBySemester,
  inferRingLevelByDate,
  resolveCohortYear,
} from '../timelineConstants'

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

  /**
   * 经历 → 年轮。学期只认后端 semesterName；后端未回传（semesterName 为 null）时
   * 按事件日期推导入学年轮，仅用于年轮小球的圆周定位，不改变 semester 字段本身。
   */
  function findRingForExperience(
    experience: Pick<GrowthExperience, 'semester' | 'date'>,
  ): SemesterRing | undefined {
    const ring = experience.semester ? findRing(experience.semester) : undefined
    if (ring) return ring

    const level = inferRingLevelByDate(experience.date, cohortYear.value)
    return level ? rings.value[level - 1] : undefined
  }

  return { cohortYear, rings, findRing, findRingForExperience, semesterLabel, semesterIndex }
}
