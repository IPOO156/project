import type { GrowthExperience } from '../timeline-constants'
import { computed, ref } from 'vue'
import { inferSemester, INITIAL_EXPERIENCES } from '../timeline-constants'
import { useGrowthDataSources } from './useGrowthDataSources'

function sortExperiencesByDate(list: GrowthExperience[]): GrowthExperience[] {
  return [...list].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export function useGrowthTimeline() {
  const experiences = ref<GrowthExperience[]>(sortExperiencesByDate(INITIAL_EXPERIENCES))
  const selectedId = ref<string | null>(null)
  const formVisible = ref(false)
  const { sync, autoSync, setAutoSync, isSyncing } = useGrowthDataSources()

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

  function addExperience(payload: Omit<GrowthExperience, 'id' | 'semester'>) {
    const semester = inferSemester(payload.date)
    const newExperience: GrowthExperience = {
      ...payload,
      id: `${Date.now()}`,
      semester,
    }
    experiences.value = sortExperiencesByDate([...experiences.value, newExperience])
  }

  function deleteExperience(id: string) {
    experiences.value = sortExperiencesByDate(experiences.value.filter((e) => e.id !== id))
    if (selectedId.value === id) {
      selectedId.value = null
    }
  }

  async function syncFromSources() {
    try {
      const { added, experiences: synced } = await sync(experiences.value)
      if (added > 0) {
        experiences.value = sortExperiencesByDate([...experiences.value, ...synced])
      }
      return added
    } catch {
      return 0
    }
  }

  // 首次加载时若开启自动同步，则自动拉取其他模块数据
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
