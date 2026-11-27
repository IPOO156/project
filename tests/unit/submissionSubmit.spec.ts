import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  post: vi.fn(),
  updateActivity: vi.fn(),
  deleteActivity: vi.fn(),
}))

vi.mock('@/shared/api/request', () => ({
  default: {
    post: api.post,
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))
vi.mock('@/shared/api/activities', () => ({
  updateActivity: api.updateActivity,
  deleteActivity: api.deleteActivity,
}))

const { createDraft, submitApplication } = await import('@/shared/api/submission/submit')

beforeEach(() => {
  api.post.mockReset()
  api.updateActivity.mockReset()
  api.deleteActivity.mockReset().mockResolvedValue(undefined)
})

describe('submitApplication 提交入口', () => {
  it('带 recordId 时走 PUT 更新并正式提交，不再新建记录', async () => {
    api.updateActivity.mockResolvedValue({ archiveId: 77, status: 1, statusLabel: '待审核' })
    const record = await submitApplication({
      type: 'competition',
      recordId: '77',
      semester: 6,
      competitionName: '数学建模竞赛',
      competitionType: '学科类',
      awardLevel: '国家级',
      awardDate: '2025-10-01',
    })

    expect(api.updateActivity).toHaveBeenCalledWith(
      77,
      'archive',
      expect.objectContaining({ semesterId: 6, isDraft: 0, competitionName: '数学建模竞赛' }),
    )
    expect(api.post).not.toHaveBeenCalled()
    expect(record.id).toBe('77')
    expect(record.status).toBe('pending')
  })

  it('无 recordId 时走原 POST 新建', async () => {
    api.post.mockResolvedValue({ archiveId: 88 })
    const record = await submitApplication({
      type: 'competition',
      semester: 6,
      competitionName: '数学建模竞赛',
    })

    expect(api.updateActivity).not.toHaveBeenCalled()
    expect(api.post).toHaveBeenCalledWith(
      '/applications/competition',
      expect.objectContaining({ semesterId: 6 }),
    )
    expect(record.id).toBe('88')
  })

  it('科研之星不走单端点草稿创建（主记录 + 子项多步流程）', async () => {
    expect(await createDraft('paper', { semester: 6 })).toBeUndefined()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('科研之星子项失败时删除已创建的主记录草稿', async () => {
    api.post
      .mockResolvedValueOnce({ applicationId: 134, researchStarId: 88 })
      .mockRejectedValueOnce(new Error('sub item failed'))

    await expect(
      submitApplication({
        type: 'scientificProject',
        semester: 6,
        projectName: '校园二手交易平台',
      }),
    ).rejects.toThrow('sub item failed')

    // 主记录已创建、子项失败：补偿删除，避免留下不完整申报
    expect(api.deleteActivity).toHaveBeenCalledWith(134, 'award')
  })
})
