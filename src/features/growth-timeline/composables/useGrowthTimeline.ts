import type { GrowthExperience, GrowthExperienceInput } from '../timeline-constants'
import { computed, ref } from 'vue'
import { addTimelineEvent, deleteTimelineEvent } from '@/shared/api/archive'
import { getGrowthTimeline } from '@/shared/api/student'
import { inferSemester, INITIAL_EXPERIENCES, mapTimelineEventType } from '../timeline-constants'
import { useGrowthDataSources } from './useGrowthDataSources'

function sortExperiencesByDate(list: GrowthExperience[]): GrowthExperience[] {
  return [...list].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

/** 将后端成长时间轴事件映射为前端 GrowthExperience 结构（eventName→title、content→description、eventAt→date、sourceId→recordId） */
function mapBackendEvent(e: Record<string, any>): GrowthExperience {
  const abilities = Array.isArray(e.abilityData) ? e.abilityData : []
  return {
    id: `backend-${e.id}`,
    title: e.eventName ?? '',
    description: e.content ?? '',
    date: e.eventAt ?? '',
    semester: e.semesterName || (e.eventAt ? inferSemester(e.eventAt) : ''),
    tags: [mapTimelineEventType(e.eventType), ...(Array.isArray(e.tags) ? e.tags : [])],
    skills: abilities.map((a: any) => ({ name: a.dimensionName, growth: a.score ?? 0 })),
    recordId: e.sourceId != null ? String(e.sourceId) : undefined,
    statusLabel: e.statusLabel || undefined,
  }
}

export function useGrowthTimeline() {
  const experiences = ref<GrowthExperience[]>(sortExperiencesByDate(INITIAL_EXPERIENCES))
  const selectedId = ref<string | null>(null)
  const formVisible = ref(false)
  const { sync, autoSync, setAutoSync, isSyncing } = useGrowthDataSources()

  // 本地新增（含从其他模块同步）的经历，与后端时间轴事件合并展示
  const localExperiences = ref<GrowthExperience[]>([])
  // 后端时间轴事件；后端不可用时为空，页面回退到本地初始经历
  const backendExperiences = ref<GrowthExperience[]>([])
  const backendLoaded = ref(false)

  const selectedExperience = computed(() => {
    return experiences.value.find((e) => e.id === selectedId.value) ?? null
  })

  function selectExperience(id: string | null) {
    selectedId.value = id
  }

  function openForm() {
    formVisible.value = true
  }

  function closeForm() {
    formVisible.value = false
  }

  function rebuildExperiences() {
    const base = backendLoaded.value ? backendExperiences.value : INITIAL_EXPERIENCES
    experiences.value = sortExperiencesByDate([...base, ...localExperiences.value])
  }

  /** 页面加载时拉取成长时间轴；失败时保留现有本地数据行为 */
  async function loadBackendTimeline() {
    try {
      const data = await getGrowthTimeline()
      backendExperiences.value = (data.timeline ?? []).map(mapBackendEvent)
      backendLoaded.value = true
    } catch {
      // 后端不可用：保留现有本地数据行为（初始示例经历 + 本地新增经历）
      backendLoaded.value = false
    } finally {
      rebuildExperiences()
    }
  }

  async function addExperience(payload: GrowthExperienceInput) {
    const semester = inferSemester(payload.date)
    const newExperience: GrowthExperience = {
      ...payload,
      id: `local-${Date.now()}`,
      semester,
      // 有关联来源时同步记录来源 ID，便于详情展示来源关联
      ...(payload.sourceId != null ? { recordId: String(payload.sourceId) } : {}),
    }
    localExperiences.value = [...localExperiences.value, newExperience]
    rebuildExperiences()

    // 同步到后端（4.2.1 POST /profile/growth-timeline）。
    // 后端 create 不强制来源：仅当携带 sourceType 时才要求 sourceId 并做 uk_gt_source 唯一校验；
    // 未选来源时正常落库（status 默认 0=草稿，列表接口不按状态过滤，刷新仍可见）。
    // 成功后用真实 id 回填，失败（网络/参数校验）保留本地经历。
    try {
      const created = await addTimelineEvent({
        // 奖项报名来源归类为奖项事件（eventType=1），其余默认能力提升（eventType=6）
        eventType: payload.sourceType === 'award_applications' ? 1 : 6,
        eventName: payload.title,
        content: payload.description,
        eventAt: payload.date,
        tags: payload.tags,
        ...(payload.sourceId != null && payload.sourceType
          ? { sourceId: payload.sourceId, sourceType: payload.sourceType }
          : {}),
      })
      if (created?.id != null) {
        localExperiences.value = localExperiences.value.map((e) =>
          e.id === newExperience.id ? { ...e, id: `backend-${created.id}` } : e,
        )
        rebuildExperiences()
      }
    } catch {
      /* 静默：保持本地经历 */
    }
  }

  async function deleteExperience(id: string) {
    // 仅对后端已持久化的事件（id 形如 backend-<真实id>）调用删除接口（4.2.4 DELETE）；
    // 本地未同步事件不请求后端，避免把前端前缀当真实 id 发出。
    // 删除成功后才移除本地展示：失败（网络/20005 无权限/30001 不存在）时保留记录，
    // 错误提示已由 request 拦截器弹出，避免「本地假删除、刷新后记录复活」的伪删除。
    const backendId = /^backend-(\d+)$/.exec(id)?.[1]
    if (backendId) {
      try {
        await deleteTimelineEvent(Number(backendId))
      } catch {
        return
      }
    }
    localExperiences.value = localExperiences.value.filter((e) => e.id !== id)
    backendExperiences.value = backendExperiences.value.filter((e) => e.id !== id)
    if (selectedId.value === id) {
      selectedId.value = null
    }
    rebuildExperiences()
  }

  async function syncFromSources() {
    try {
      const { added, experiences: synced } = await sync(experiences.value)
      if (added > 0) {
        localExperiences.value = [...localExperiences.value, ...synced]
        rebuildExperiences()
      }
      return added
    } catch {
      return 0
    }
  }

  // 页面加载：先拉取后端成长时间轴，再按开关自动同步其他模块数据
  loadBackendTimeline()
  if (autoSync.value) {
    syncFromSources()
  }

  return {
    experiences,
    selectedId,
    selectedExperience,
    formVisible,
    isSyncing,
    autoSync,
    selectExperience,
    openForm,
    closeForm,
    addExperience,
    deleteExperience,
    syncFromSources,
    setAutoSync,
  }
}
