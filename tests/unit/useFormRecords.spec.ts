// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DRAFT_LOCAL_ID, useFormRecords } from '@/shared/composables/useFormRecords'

const api = vi.hoisted(() => ({ getActivities: vi.fn() }))

vi.mock('@/shared/api/activities', () => ({ getActivities: api.getActivities }))

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

function activity(over: Record<string, unknown> = {}) {
  return {
    id: 1,
    type: 'archive',
    title: '蓝桥杯',
    content: '',
    status: 1,
    ...over,
  }
}

beforeEach(() => {
  api.getActivities.mockReset()
  localStorage.clear()
})

describe('useFormRecords 列表映射', () => {
  it('按下划线字段与别名过滤，并映射为记录结构', async () => {
    api.getActivities.mockResolvedValue({
      total: 1,
      list: [
        activity({
          id: 7,
          archive_type: 'academic_competition',
          archive_type_label: '学科竞赛',
          submit_time: '2025-09-01T12:00:00',
          semester_name: '2024-2025-1',
          status: 1,
        }),
      ],
    })

    const { records, loading } = useFormRecords('competition')
    await flush()

    expect(loading.value).toBe(false)
    expect(records.value).toEqual([
      {
        id: '7',
        type: 'competition',
        typeLabel: '学科竞赛',
        title: '蓝桥杯',
        submitDate: '2025-09-01',
        semester: '2024-2025-1',
        status: 'pending',
        content: '',
        archive_type: 'academic_competition',
        archive_type_label: '学科竞赛',
        submit_time: '2025-09-01T12:00:00',
        semester_name: '2024-2025-1',
      },
    ])
  })

  it('兼容驼峰字段，标题空时回退 content，未知状态回落 pending', async () => {
    api.getActivities.mockResolvedValue({
      total: 1,
      list: [
        activity({
          id: 8,
          title: '',
          content: '证书内容',
          archiveType: 'honor_certificate',
          submitTime: '2025-01-02T00:00:00',
          semesterName: '2023-2024-2',
          status: 99,
        }),
      ],
    })

    const { records } = useFormRecords('certificate')
    await flush()

    expect(records.value[0]).toMatchObject({
      id: '8',
      typeLabel: '荣誉证书',
      title: '证书内容',
      submitDate: '2025-01-02',
      semester: '2023-2024-2',
      status: 'pending',
    })
  })

  it('科研之星主记录按标题中的子类中文名归属子页签', async () => {
    api.getActivities.mockResolvedValue({
      total: 3,
      list: [
        activity({ id: 1, archive_type: 'research_star', title: '科研之星-科研项目' }),
        activity({ id: 2, archive_type: 'research_star', title: '科研之星-发表论文' }),
        activity({ id: 3, archive_type: 'research_star', title: '科研之星-软件著作权' }),
      ],
    })

    const project = useFormRecords('scientificProject')
    await flush()
    expect(project.records.value.map((r) => r.id)).toEqual(['1'])

    api.getActivities.mockResolvedValue({
      total: 3,
      list: [
        activity({ id: 1, archive_type: 'research_star', title: '科研之星-科研项目' }),
        activity({ id: 2, archive_type: 'research_star', title: '科研之星-发表论文' }),
        activity({ id: 3, archive_type: 'research_star', title: '科研之星-软件著作权' }),
      ],
    })
    const paper = useFormRecords('paper')
    await flush()
    expect(paper.records.value.map((r) => r.id)).toEqual(['2'])
  })

  it('分页拉全量，直到本页为空或已覆盖总数', async () => {
    const firstPage = Array.from({ length: 100 }, (_, i) => {
      return activity({ id: i + 1, archive_type: 'academic_competition', title: `记录 ${i + 1}` })
    })
    const secondPage = Array.from({ length: 20 }, (_, i) => {
      return activity({
        id: 101 + i,
        archive_type: 'academic_competition',
        title: `记录 ${101 + i}`,
      })
    })
    api.getActivities
      .mockResolvedValueOnce({ total: 120, list: firstPage })
      .mockResolvedValueOnce({ total: 120, list: secondPage })

    const { records } = useFormRecords('competition')
    await flush()

    expect(api.getActivities).toHaveBeenCalledTimes(2)
    expect(api.getActivities).toHaveBeenNthCalledWith(1, { page: 1, perPage: 100 })
    expect(api.getActivities).toHaveBeenNthCalledWith(2, { page: 2, perPage: 100 })
    expect(records.value).toHaveLength(120)
  })

  it('空页直接停止翻页', async () => {
    api.getActivities.mockResolvedValueOnce({ total: 50, list: [] })

    const { records } = useFormRecords('competition')
    await flush()

    expect(api.getActivities).toHaveBeenCalledTimes(1)
    expect(records.value).toEqual([])
  })

  it('接口异常时保持空列表且复位加载态', async () => {
    api.getActivities.mockRejectedValue(new Error('boom'))

    const { records, loading } = useFormRecords('competition')
    await flush()

    expect(records.value).toEqual([])
    expect(loading.value).toBe(false)
  })
})

describe('useFormRecords 本地草稿', () => {
  it('读取当前用户命名空间下的草稿并排在真实记录之前', async () => {
    api.getActivities.mockResolvedValue({
      total: 1,
      list: [activity({ id: 2, archive_type: 'academic_competition' })],
    })
    localStorage.setItem(
      'form_draft_competition::anonymous',
      JSON.stringify({
        competitionName: '草稿杯',
        semester: '2024-2025-1',
        proofMaterials: [],
      }),
    )

    const { records } = useFormRecords('competition', 'form_draft_competition')
    await flush()

    expect(records.value.map((r) => r.id)).toEqual([DRAFT_LOCAL_ID, '2'])
    expect(records.value[0]).toMatchObject({
      type: 'competition',
      typeLabel: '学科竞赛',
      title: '草稿杯',
      submitDate: '',
      semester: '2024-2025-1',
      status: 'draft',
    })
  })

  it('草稿只有学期或空附件时不展示', async () => {
    api.getActivities.mockResolvedValue({ total: 0, list: [] })
    localStorage.setItem(
      'form_draft_competition::anonymous',
      JSON.stringify({ semester: '2024-2025-1', proofMaterials: [] }),
    )

    const { records } = useFormRecords('competition', 'form_draft_competition')
    await flush()

    expect(records.value).toEqual([])
  })

  it('草稿无法推导标题时用「类型名草稿」兜底', async () => {
    api.getActivities.mockResolvedValue({ total: 0, list: [] })
    localStorage.setItem(
      'form_draft_competition::anonymous',
      JSON.stringify({ competitionType: '个人赛' }),
    )

    const { records } = useFormRecords('competition', 'form_draft_competition')
    await flush()

    expect(records.value[0].title).toBe('学科竞赛草稿')
  })

  it('草稿 JSON 损坏时忽略，不影响真实记录', async () => {
    api.getActivities.mockResolvedValue({
      total: 1,
      list: [activity({ id: 2, archive_type: 'academic_competition' })],
    })
    localStorage.setItem('form_draft_competition::anonymous', '{not-json')

    const { records } = useFormRecords('competition', 'form_draft_competition')
    await flush()

    expect(records.value.map((r) => r.id)).toEqual(['2'])
  })

  it('未传草稿键时不读取 localStorage', async () => {
    api.getActivities.mockResolvedValue({ total: 0, list: [] })
    localStorage.setItem(
      'form_draft_competition::anonymous',
      JSON.stringify({ competitionName: '草稿杯' }),
    )

    const { records } = useFormRecords('competition')
    await flush()

    expect(records.value).toEqual([])
  })
})

describe('useFormRecords 本地增删改查', () => {
  it('addRecord / updateRecord / removeRecord / getRecord 操作同一列表', async () => {
    api.getActivities.mockResolvedValue({ total: 0, list: [] })
    const { records, addRecord, updateRecord, removeRecord, getRecord } =
      useFormRecords('competition')
    await flush()

    addRecord('新增记录', { id: 'rec-1', semester: '2024-2025-1' })
    expect(records.value[0]).toMatchObject({
      id: 'rec-1',
      type: 'competition',
      typeLabel: '学科竞赛',
      title: '新增记录',
      semester: '2024-2025-1',
    })
    expect(records.value[0].submitDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)

    updateRecord('rec-1', { title: '改名后' })
    expect(getRecord('rec-1')?.title).toBe('改名后')

    updateRecord('missing', { title: 'x' })
    expect(records.value).toHaveLength(1)

    removeRecord('rec-1')
    expect(getRecord('rec-1')).toBeUndefined()
    expect(records.value).toEqual([])
  })

  it('loadRecords 重新拉取失败时保留已有记录', async () => {
    api.getActivities.mockResolvedValueOnce({
      total: 1,
      list: [activity({ id: 2, archive_type: 'academic_competition' })],
    })
    const { records, loadRecords } = useFormRecords('competition')
    await flush()
    expect(records.value).toHaveLength(1)

    api.getActivities.mockRejectedValueOnce(new Error('boom'))
    await loadRecords()

    expect(records.value.map((r) => r.id)).toEqual(['2'])
  })
})
