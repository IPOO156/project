import type { Ref } from 'vue'
import type { Interest } from '@/shared/types/types'
import { ElMessage } from 'element-plus'
import {
  deleteInterest as apiDeleteInterest,
  updateInterests as apiUpdateInterests,
  getProfileInfo,
} from '@/shared/api/student'
import { mapInterests } from './archiveMappers'

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

/**
 * 兴趣 CRUD（PUT /profile/interests 整组提交 + DELETE /profile/interests/{id}）。
 * 以工厂形式接收 state ref，保持 useArchiveStore 只负责状态与编排。
 */
export function createInterestActions(interests: Ref<Interest[]>) {
  /** 写入成功后回读 /profile/info，保证 id、isDetail 等字段与后端一致 */
  async function refreshInterests(): Promise<void> {
    const profile = await getProfileInfo()
    const mapped = mapInterests(profile)
    if (mapped) interests.value = mapped
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

  return { createInterest, editInterest, removeInterest }
}
