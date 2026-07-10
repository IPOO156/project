import type { Award, Grade, Interest, ProfileDimension, TimelineNode } from '@/shared/types/types'
import { ElMessage } from 'element-plus'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  addAward as apiAddAward,
  addInterest as apiAddInterest,
  deleteAward as apiDeleteAward,
  deleteInterest as apiDeleteInterest,
  updateAward as apiUpdateAward,
  updateInterest as apiUpdateInterest,
  getAwards,
  getDimensions,
  getGrades,
  getInterests,
  getTimelineEvents,
} from '@/shared/api/archive'

/**
 * 档案信息流转 Store
 * 集中管理个人档案数据（画像、兴趣、成绩、奖项、时间线）
 * 数据来源：archiveApi（后端就绪后只需改 API 层）
 */
export const useArchiveStore = defineStore('archive', () => {
  const interests = ref<Interest[]>([])
  const grades = ref<Grade[]>([])
  const awards = ref<Award[]>([])
  const dimensions = ref<ProfileDimension[]>([])
  const timelineEvents = ref<TimelineNode[]>([])
  const loading = ref(false)

  async function fetchArchive(): Promise<void> {
    loading.value = true
    try {
      const [interestData, gradeData, awardData, dimensionData, timelineData] = await Promise.all([
        getInterests(),
        getGrades(),
        getAwards(),
        getDimensions(),
        getTimelineEvents(),
      ])
      interests.value = interestData
      grades.value = gradeData
      awards.value = awardData
      dimensions.value = dimensionData
      timelineEvents.value = timelineData
    } finally {
      loading.value = false
    }
  }

  // ── 兴趣 CRUD ──
  async function createInterest(data: Omit<Interest, 'id'>): Promise<void> {
    const item = await apiAddInterest(data)
    interests.value.push(item)
    ElMessage.success('兴趣已添加')
  }

  async function editInterest(id: string, data: Partial<Interest>): Promise<void> {
    const item = await apiUpdateInterest(id, data)
    const idx = interests.value.findIndex((i) => i.id === id)
    if (idx >= 0) interests.value[idx] = { ...interests.value[idx], ...item }
    ElMessage.success('兴趣已更新')
  }

  async function removeInterest(id: string): Promise<void> {
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
    createInterest,
    editInterest,
    removeInterest,
    createAward,
    editAward,
    removeAward,
  }
})
