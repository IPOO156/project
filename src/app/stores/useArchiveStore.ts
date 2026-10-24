import type { Award, Grade, Interest, ProfileDimension, TimelineNode } from '@/shared/types/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getDimensions, getTimelineEvents } from '@/shared/api/archive'
import { getProfileInfo } from '@/shared/api/student'
import { createInterestActions } from './archiveInterests'
import {
  mapAwards,
  mapDimensions,
  mapGrades,
  mapInterests,
  syncAcademicToUser,
} from './archiveMappers'

/**
 * 档案信息流转 Store
 * 集中管理个人档案数据（画像、兴趣、成绩、奖项、时间线）
 * 优先对接后端 /profile/info 与 /profile/growth-timeline，接口异常时展示空态（不注入编造数据）。
 * 字段映射见 ./archiveMappers.ts，兴趣 CRUD 见 ./archiveInterests.ts
 */
export const useArchiveStore = defineStore('archive', () => {
  const interests = ref<Interest[]>([])
  const grades = ref<Grade[]>([])
  const awards = ref<Award[]>([])
  const dimensions = ref<ProfileDimension[]>([])
  const timelineEvents = ref<TimelineNode[]>([])
  /** GET /profile/info 原始响应（学籍/联系/自我评价等字段供页面直接消费） */
  const profileData = ref<any>(null)
  const loading = ref(false)
  /**
   * /profile/info 是否**加载失败**（区别于「后端确实没有数据」）。
   *
   * 两者必须分开：失败时 grades/awards 被兜底清空，页面若照常渲染就会把「没拿到数据」
   * 显示成「平均绩点 0.00 / 获奖总数 0」——学生读到的是自己考了 0 分，而非加载失败（§3.4）。
   * 页面据此显示占位符与重试入口，而不是 0。
   */
  const loadFailed = ref(false)

  // ── 去重：pending 防并发重入，lastFetchedAt 防跨页冗余 ──
  let pendingFetch: Promise<void> | null = null
  let pendingTimeline: Promise<void> | null = null
  let lastArchiveFetchAt = 0
  let lastTimelineFetchAt = 0
  const CACHE_TTL_MS = 60_000

  /** 把 /profile/info 的字段写入 state（保留原始响应供页面消费） */
  function applyProfileInfo(profile: any) {
    profileData.value = profile
    syncAcademicToUser(profile)
    const mappedDimensions = mapDimensions(profile)
    if (mappedDimensions) dimensions.value = mappedDimensions
    const mappedInterests = mapInterests(profile)
    if (mappedInterests) interests.value = mappedInterests
    const mappedGrades = mapGrades(profile)
    if (mappedGrades) grades.value = mappedGrades
    const mappedAwards = mapAwards(profile)
    if (mappedAwards) awards.value = mappedAwards
  }

  /**
   * 从后端 /profile/info 拉取画像数据。
   * 失败时走 fetchArchiveFallback：清空成绩/奖项、改取 /archive/dimensions，
   * 不注入任何编造数据（详见该函数注释）。
   */
  async function fetchArchive(force = false): Promise<void> {
    if (pendingFetch) return pendingFetch
    if (!force && Date.now() - lastArchiveFetchAt < CACHE_TTL_MS && dimensions.value.length > 0) {
      return
    }
    loading.value = true
    pendingFetch = (async () => {
      try {
        const profile = await getProfileInfo()
        applyProfileInfo(profile)
        lastArchiveFetchAt = Date.now()
        loadFailed.value = false
      } catch {
        // 置位后再兜底：兜底会把 grades/awards 清空，页面需要靠该标记区分「空」与「失败」
        loadFailed.value = true
        await fetchArchiveFallback()
      } finally {
        loading.value = false
      }
    })()
    try {
      await pendingFetch
    } finally {
      pendingFetch = null
    }
  }

  /**
   * 从后端 /profile/growth-timeline（viewType=list）拉取成长时间线
   * 单一数据源：复用 api 层 getTimelineEvents 的统一映射（eventType 1-6 → TimelineNode.type）
   * 成功写入 timelineEvents；失败置空，不阻塞页面渲染。
   */
  async function fetchTimeline(force = false): Promise<void> {
    if (pendingTimeline) return pendingTimeline
    if (
      !force &&
      Date.now() - lastTimelineFetchAt < CACHE_TTL_MS &&
      timelineEvents.value.length > 0
    ) {
      return
    }
    pendingTimeline = (async () => {
      try {
        timelineEvents.value = await getTimelineEvents()
        lastTimelineFetchAt = Date.now()
      } catch {
        timelineEvents.value = []
      }
    })()
    try {
      await pendingTimeline
    } finally {
      pendingTimeline = null
    }
  }

  /**
   * /profile/info 失败时的兜底：只清理状态、展示空态，不注入编造成绩/奖项
   * （编造记录会被用户误认为自己的真实档案）。维度画像另有独立真实接口 /archive/dimensions 可兜底。
   */
  async function fetchArchiveFallback() {
    grades.value = []
    awards.value = []
    try {
      dimensions.value = await getDimensions()
    } catch {
      dimensions.value = []
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

  const { createInterest, editInterest, removeInterest } = createInterestActions(interests)
  /**
   * 重置用户级状态（登出/换账号时调用）。
   * 除清空 state 外，必须复位模块级请求缓存变量（pendingFetch / pendingTimeline 与
   * 两个 lastFetchAt 时间戳）：否则换账号后 60s TTL 内仍会命中上一账号的档案数据。
   */
  function reset(): void {
    pendingFetch = null
    pendingTimeline = null
    lastArchiveFetchAt = 0
    lastTimelineFetchAt = 0
    interests.value = []
    grades.value = []
    awards.value = []
    dimensions.value = []
    timelineEvents.value = []
    profileData.value = null
    loading.value = false
    loadFailed.value = false
  }

  return {
    interests,
    grades,
    awards,
    dimensions,
    timelineEvents,
    profileData,
    loading,
    loadFailed,
    fetchArchive,
    fetchTimeline,
    syncFromSubmissions,
    createInterest,
    editInterest,
    removeInterest,
    reset,
  }
})
