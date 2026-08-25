import type { Award, Grade, Interest, ProfileDimension, TimelineNode } from '@/shared/types/types'
import { ElMessage } from 'element-plus'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  addAward as apiAddAward,
  deleteAward as apiDeleteAward,
  updateAward as apiUpdateAward,
  getAwards,
  getDimensions,
  getGrades,
  getTimelineEvents,
} from '@/shared/api/archive'
import {
  deleteInterest as apiDeleteInterest,
  updateInterests as apiUpdateInterests,
  getGrowthTimeline,
  getProfileInfo,
} from '@/shared/api/student'

/**
 * 档案信息流转 Store
 * 集中管理个人档案数据（画像、兴趣、成绩、奖项、时间线）
 * 优先对接后端 /profile/info 与 /profile/growth-timeline，接口异常时回退本地 Mock。
 */
export const useArchiveStore = defineStore('archive', () => {
  const interests = ref<Interest[]>([])
  const grades = ref<Grade[]>([])
  const awards = ref<Award[]>([])
  const dimensions = ref<ProfileDimension[]>([])
  const timelineEvents = ref<TimelineNode[]>([])
  const loading = ref(false)

  /** 从后端 /profile/info 拉取画像数据（失败回退 Mock） */
  async function fetchArchive(): Promise<void> {
    loading.value = true
    try {
      const profile = await getProfileInfo()
      applyProfileInfo(profile)
    } catch {
      await fetchArchiveMock()
    } finally {
      loading.value = false
    }
  }

  function applyProfileInfo(profile: any) {
    // 维度画像
    if (Array.isArray(profile.dimensionProfile)) {
      dimensions.value = profile.dimensionProfile.map((d: any) => ({
        label: d.dimensionName,
        current: d.score,
        target: d.targetScore,
        previous: d.score - parseTrend(d.trend),
      }))
    }
    // 兴趣标签
    if (Array.isArray(profile.interests)) {
      interests.value = profile.interests.map((i: any) => ({
        id: i.id,
        tagName: i.tagName,
        proficiencyLevel: i.proficiencyLevel,
        detailContent: i.detailContent || '',
        isDetail: i.isDetail,
      }))
    }
    // 学期成绩 → Grade
    if (Array.isArray(profile.semesterGrades)) {
      grades.value = profile.semesterGrades.flatMap((s: any) =>
        Array.from({ length: s.courseCount ?? 0 }, (_, i) => ({
          id: `${s.semesterId}-${i}`,
          semester: s.semesterName || s.semester,
          courseName: `${s.semesterName || '学期'} 课程${i + 1}`,
          score: s.averageScore,
          gpa: s.gpa,
          credits: s.totalCredit / Math.max(s.courseCount ?? 1, 1),
        })),
      )
    }
    // 个人奖项
    if (Array.isArray(profile.personalAwards)) {
      awards.value = profile.personalAwards.map((a: any, i: number) => ({
        id: `award-${i}`,
        name: a.category,
        level: a.maxLevel,
        type: 'other',
        date: a.latestTime,
      }))
    }
  }

  function parseTrend(trend: string | undefined): number {
    const v = Number(String(trend ?? '0').replace(/[^0-9-]/g, ''))
    return Number.isFinite(v) ? v : 0
  }

  /** 从后端 /profile/growth-timeline 拉取时间线（失败回退 Mock） */
  async function fetchTimeline(): Promise<void> {
    try {
      const data = await getGrowthTimeline()
      if (data.timeline && data.timeline.length > 0) {
        timelineEvents.value = data.timeline.map((e: any) => ({
          id: String(e.id),
          semester: e.semesterName || '',
          type: mapEventType(e.eventType),
          title: e.eventName,
          description: e.content || '',
          date: e.eventAt,
          recordId: e.sourceId ? String(e.sourceId) : undefined,
        }))
        return
      }
    } catch {
      /* 回退 Mock */
    }
    try {
      timelineEvents.value = await getTimelineEvents()
    } catch {
      timelineEvents.value = []
    }
  }

  function mapEventType(type: number | undefined): TimelineNode['type'] {
    const map: Record<number, TimelineNode['type']> = {
      1: 'award',
      2: 'grade',
      3: 'practice',
      4: 'other',
      5: 'other',
      6: 'other',
    }
    return map[type ?? 0] || 'other'
  }

  // 兴趣标签已切到后端真实接口（/profile/info + PUT/DELETE /profile/interests），无独立 Mock 回填
  async function fetchArchiveMock() {
    try {
      const [gradeData, awardData, dimensionData] = await Promise.all([
        getGrades(),
        getAwards(),
        getDimensions(),
      ])
      grades.value = gradeData
      awards.value = awardData
      dimensions.value = dimensionData
    } catch {
      /* 全部失败静默 */
    }
  }

  /** 从已通过的提交记录同步档案数据 */
  function syncFromSubmissions(
    records: { type: string; title: string; submitDate: string; status: string }[],
  ) {
    const approved = records.filter((r) => r.status === 'approved')
    const newAwards = approved
      .filter((r) => ['competition', 'innovation', 'competitionStar'].includes(r.type))
      .map((r, i) => ({
        id: `award-${Date.now()}-${i}`,
        name: r.title,
        level: 'school' as const,
        type: 'competition' as const,
        date: r.submitDate,
      }))
    if (newAwards.length > 0) awards.value = [...newAwards, ...awards.value]

    const newEvents = approved.map((r, i) => ({
      id: `tl-${Date.now()}-${i}`,
      semester: '2024-2025-1',
      type: 'award' as const,
      title: r.title,
      description: `${r.type} 申报已通过`,
      date: r.submitDate,
    }))
    if (newEvents.length > 0) timelineEvents.value = [...newEvents, ...timelineEvents.value]
  }

  // ── 兴趣 CRUD（PUT /profile/interests 整组提交 + DELETE /profile/interests/{id}）──
  interface InterestUpsert {
    id?: number
    tagName: string
    proficiencyLevel: number
    detailContent: string
    isDetail: number
  }

  function toInterestUpsert(i: Interest): InterestUpsert {
    return {
      id: i.id,
      tagName: i.tagName,
      proficiencyLevel: i.proficiencyLevel,
      detailContent: i.detailContent,
      isDetail: i.isDetail ?? 1,
    }
  }

  /** 写入成功后回读 /profile/info，保证 id、isDetail 等字段与后端一致 */
  async function refreshInterests(): Promise<void> {
    const profile = await getProfileInfo()
    if (Array.isArray(profile.interests)) {
      interests.value = profile.interests.map((i: any) => ({
        id: i.id,
        tagName: i.tagName,
        proficiencyLevel: i.proficiencyLevel,
        detailContent: i.detailContent || '',
        isDetail: i.isDetail,
      }))
    }
  }

  async function createInterest(data: Omit<Interest, 'id'>): Promise<void> {
    const payload: InterestUpsert[] = interests.value.map(toInterestUpsert)
    payload.push({
      tagName: data.tagName,
      proficiencyLevel: data.proficiencyLevel,
      detailContent: data.detailContent,
      isDetail: data.isDetail ?? 1,
    })
    await apiUpdateInterests({ interests: payload })
    await refreshInterests()
    ElMessage.success('兴趣已添加')
  }

  async function editInterest(id: number, data: Omit<Interest, 'id'>): Promise<void> {
    const payload: InterestUpsert[] = interests.value.map((i) => {
      const upsert = toInterestUpsert(i)
      if (i.id !== id) return upsert
      return {
        ...upsert,
        tagName: data.tagName,
        proficiencyLevel: data.proficiencyLevel,
        detailContent: data.detailContent,
      }
    })
    await apiUpdateInterests({ interests: payload })
    await refreshInterests()
    ElMessage.success('兴趣已更新')
  }

  async function removeInterest(id: number): Promise<void> {
    await apiDeleteInterest(id)
    interests.value = interests.value.filter((i) => i.id !== id)
    ElMessage.success('兴趣已删除')
  }

  // ── 奖项 CRUD ──
  async function createAward(data: Omit<Award, 'id'>): Promise<void> {
    const item = await apiAddAward(data)
    awards.value.push(item)
    ElMessage.success('奖项已添加')
  }

  async function editAward(id: string, data: Partial<Award>): Promise<void> {
    const item = await apiUpdateAward(id, data)
    const idx = awards.value.findIndex((a) => a.id === id)
    if (idx >= 0) awards.value[idx] = { ...awards.value[idx], ...item }
    ElMessage.success('奖项已更新')
  }

  async function removeAward(id: string): Promise<void> {
    await apiDeleteAward(id)
    awards.value = awards.value.filter((a) => a.id !== id)
    ElMessage.success('奖项已删除')
  }

  return {
    interests,
    grades,
    awards,
    dimensions,
    timelineEvents,
    loading,
    fetchArchive,
    fetchTimeline,
    syncFromSubmissions,
    createInterest,
    editInterest,
    removeInterest,
    createAward,
    editAward,
    removeAward,
  }
})
