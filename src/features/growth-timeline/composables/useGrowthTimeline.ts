import type { GrowthExperience } from '../timeline-constants'
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

  async function addExperience(payload: Omit<GrowthExperience, 'id' | 'semester'>) {
    const semester = inferSemester(payload.date)
    const newExperience: GrowthExperience = {
      ...payload,
      id: `local-${Date.now()}`,
      semester,
    }
    // 同步到后端
    addTimelineEvent({
      semester,
      type: 'other',
      title: payload.title,
      description: payload.description,
      date: payload.date,
    }).catch(() => {})
    localExperiences.value = [...localExperiences.value, newExperience]
    rebuildExperiences()
  }

  function deleteExperience(id: string) {
    localExperiences.value = localExperiences.value.filter((e) => e.id !== id)
    backendExperiences.value = backendExperiences.value.filter((e) => e.id !== id)
    deleteTimelineEvent(id).catch(() => {})
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
