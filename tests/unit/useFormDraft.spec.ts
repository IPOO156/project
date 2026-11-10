// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h } from 'vue'

const api = vi.hoisted(() => ({
  createDraft: vi.fn(),
  autosaveApplication: vi.fn(),
  autosaveAward: vi.fn(),
  buildContractPayload: vi.fn(),
}))

vi.mock('@/shared/api/submission', () => ({
  activityCategoryOf: () => 'archive',
  buildContractPayload: api.buildContractPayload,
  createDraft: api.createDraft,
}))
vi.mock('@/shared/api/applications', () => ({ autosaveApplication: api.autosaveApplication }))
vi.mock('@/shared/api/awards', () => ({ autosaveAward: api.autosaveAward }))

const { useFormDraft } = await import('@/shared/composables/useFormDraft')

/** 当前用户（id=2）命名空间下的竞赛草稿键 */
const DRAFT_KEY = 'form_draft_competition::u2'

let app: ReturnType<typeof createApp> | undefined

/**
 * 通过真实组件挂载获取 setup 上下文（onMounted/watch 才能正常工作）。
 * 表单用普通对象即可：本测试只手动调用 saveNow，不依赖深层 watch 的防抖。
 */
function mountDraft(form: Record<string, unknown>) {
  let draft!: ReturnType<typeof useFormDraft>
  app = createApp({
    setup() {
      draft = useFormDraft('competition', form, {
        enableBackend: true,
        enableLeaveGuard: false,
        autoRestore: false,
        type: 'competition',
        minDraftFields: ['competitionName'],
      })
      return () => h('div')
    },
  })
  app.mount(document.createElement('div'))
  return draft
}

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('user_info_cache', JSON.stringify({ id: 2 }))
  api.createDraft.mockReset()
  api.autosaveApplication.mockReset()
  api.autosaveAward.mockReset()
  api.buildContractPayload.mockReset().mockResolvedValue({})
  app = undefined
})

describe('useFormDraft 保存草稿与后端联动', () => {
  it('首次保存建后端草稿成功后删除本地副本，表单记录后端 id', async () => {
    api.createDraft.mockResolvedValue(12)
    const form: Record<string, unknown> = { competitionName: '草稿杯' }
    const draft = mountDraft(form)

    const saved = await draft.saveNow()

    expect(saved).toBe(true)
    expect(api.createDraft).toHaveBeenCalledWith(
      'competition',
      expect.objectContaining({ competitionName: '草稿杯' }),
    )
    expect(form.archiveId).toBe(12)
    // 后端已有该草稿，本地副本删除后列表不会出现「本地 + 后端」两行
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull()
    app?.unmount()
  })

  it('建后端草稿失败时保留本地草稿，并返回未同步后端', async () => {
    api.createDraft.mockRejectedValue(new Error('boom'))
    const form: Record<string, unknown> = { competitionName: '草稿杯' }
    const draft = mountDraft(form)

    const saved = await draft.saveNow()

    expect(saved).toBe(false)
    expect(form.archiveId).toBeUndefined()
    const raw = JSON.parse(localStorage.getItem(DRAFT_KEY) as string)
    expect(raw.competitionName).toBe('草稿杯')
    expect(raw.__backendId).toBeUndefined()
    app?.unmount()
  })

  it('必填字段不齐时不调建草稿接口，仅本地保存', async () => {
    const form: Record<string, unknown> = { school: '某学院' }
    const draft = mountDraft(form)

    const saved = await draft.saveNow()

    expect(saved).toBe(false)
    expect(api.createDraft).not.toHaveBeenCalled()
    expect(JSON.parse(localStorage.getItem(DRAFT_KEY) as string).school).toBe('某学院')
    app?.unmount()
  })

  it('已有后端 id 时走 autosave，成功后删除本地副本', async () => {
    api.autosaveApplication.mockResolvedValue(undefined)
    const form: Record<string, unknown> = { competitionName: '草稿杯', archiveId: 5 }
    const draft = mountDraft(form)

    const saved = await draft.saveNow()

    expect(saved).toBe(true)
    expect(api.createDraft).not.toHaveBeenCalled()
    expect(api.autosaveApplication).toHaveBeenCalledWith(5, expect.anything())
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull()
    app?.unmount()
  })

  it('autosave 失败时保留本地副本并记录关联的后端 id', async () => {
    api.autosaveApplication.mockRejectedValue(new Error('boom'))
    const form: Record<string, unknown> = { competitionName: '草稿杯', archiveId: 5 }
    const draft = mountDraft(form)

    const saved = await draft.saveNow()

    expect(saved).toBe(false)
    const raw = JSON.parse(localStorage.getItem(DRAFT_KEY) as string)
    expect(raw.competitionName).toBe('草稿杯')
    // 列表据此识别本地草稿与后端记录为同一份，避免重复展示
    expect(raw.__backendId).toBe(5)
    app?.unmount()
  })
})
