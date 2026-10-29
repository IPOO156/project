// @vitest-environment jsdom
import type { Interest } from '@/shared/types/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

const mocks = vi.hoisted(() => ({
  getProfileInfo: vi.fn(),
  updateInterests: vi.fn(),
  deleteInterest: vi.fn(),
  success: vi.fn(),
}))

vi.mock('@/shared/api/student', () => ({
  getProfileInfo: mocks.getProfileInfo,
  updateInterests: mocks.updateInterests,
  deleteInterest: mocks.deleteInterest,
  // archiveMappers → useUserStore 会 import 该函数，保持模块导出完整
  updateProfileContact: vi.fn(),
}))
vi.mock('element-plus', () => ({ ElMessage: { success: mocks.success } }))

const { createInterestActions } = await import('@/app/stores/archiveInterests')

function interest(id: number, tagName = '足球'): Interest {
  return { id, tagName, proficiencyLevel: 3, detailContent: '爱好', isDetail: 1 }
}

beforeEach(() => {
  mocks.getProfileInfo.mockReset()
  mocks.updateInterests.mockReset().mockResolvedValue(undefined)
  mocks.deleteInterest.mockReset().mockResolvedValue(undefined)
  mocks.success.mockReset()
})

describe('createInterestActions', () => {
  it('新增：整组提交现有兴趣 + 新兴趣，并回读后端结果', async () => {
    const interests = ref<Interest[]>([interest(1)])
    mocks.getProfileInfo.mockResolvedValue({ interests: [interest(1), interest(2, '篮球')] })
    const { createInterest } = createInterestActions(interests)

    await createInterest({ tagName: '篮球', proficiencyLevel: 2, detailContent: '校队' })

    expect(mocks.updateInterests).toHaveBeenCalledWith({
      interests: [
        { id: 1, tagName: '足球', proficiencyLevel: 3, detailContent: '爱好', isDetail: 1 },
        { tagName: '篮球', proficiencyLevel: 2, detailContent: '校队', isDetail: 1 },
      ],
    })
    expect(interests.value.map((i) => i.id)).toEqual([1, 2])
    expect(mocks.success).toHaveBeenCalledWith('兴趣已添加')
  })

  it('编辑：只替换目标 id 的字段，其余原样提交', async () => {
    const interests = ref<Interest[]>([interest(1), interest(2, '篮球')])
    mocks.getProfileInfo.mockResolvedValue({
      interests: [interest(1, '足球'), interest(2, '篮球')],
    })
    const { editInterest } = createInterestActions(interests)

    await editInterest(2, { tagName: '排球', proficiencyLevel: 5, detailContent: '院队' })

    expect(mocks.updateInterests).toHaveBeenCalledWith({
      interests: [
        { id: 1, tagName: '足球', proficiencyLevel: 3, detailContent: '爱好', isDetail: 1 },
        { id: 2, tagName: '排球', proficiencyLevel: 5, detailContent: '院队', isDetail: 1 },
      ],
    })
    expect(mocks.success).toHaveBeenCalledWith('兴趣已更新')
  })

  it('删除：调用接口后本地移除并提示', async () => {
    const interests = ref<Interest[]>([interest(1), interest(2, '篮球')])
    const { removeInterest } = createInterestActions(interests)

    await removeInterest(1)

    expect(mocks.deleteInterest).toHaveBeenCalledWith(1)
    expect(interests.value.map((i) => i.id)).toEqual([2])
    expect(mocks.success).toHaveBeenCalledWith('兴趣已删除')
  })

  it('回读失败时不覆盖本地列表', async () => {
    const interests = ref<Interest[]>([interest(1)])
    mocks.getProfileInfo.mockResolvedValue({ interests: null })
    const { createInterest } = createInterestActions(interests)

    await createInterest({ tagName: '篮球', proficiencyLevel: 2, detailContent: '' })

    expect(interests.value.map((i) => i.id)).toEqual([1])
  })
})
