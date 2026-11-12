import type { GrowthExperience, GrowthExperienceInput } from '../timelineConstants'
import { computed, ref } from 'vue'
import { addTimelineEvent, deleteTimelineEvent, getTimelineEventDetail } from '@/shared/api/archive'
import { getGrowthTimeline } from '@/shared/api/student'
import { mapTimelineEventType } from '../timelineConstants'
import { useGrowthDataSources } from './useGrowthDataSources'

/** 后端成长时间轴 summary；字段缺失/非法时为 null，表示「无数据」而不是 0 */
export interface GrowthSummary {
  experiences: number | null
  skills: number | null
  averageGrowth: number | null
  potential: string | null
}

function sortExperiencesByDate(list: GrowthExperience[]): GrowthExperience[] {
  return [...list].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

/** 能力项映射：列表与详情共用（后端字段为 dimensionCode/dimensionName/score） */
function mapAbilities(raw: unknown): GrowthExperience['skills'] {
  const abilities = Array.isArray(raw) ? raw : []
  return abilities.map((a: any) => ({
    name: a.dimensionName ?? a.dimensionCode ?? '',
    growth: a.score ?? 0,
    dimensionCode: a.dimensionCode ?? undefined,
  }))
}

/** 字符串数字（如 "63"、""）统一归一化为 number | null，避免 NaN 混入展示 */
function toNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const text = value.trim().replace(/%$/, '')
    if (!text) return null
    const parsed = Number(text)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

/**
 * 归一化后端 summary：兼容空对象、字段为字符串数字、字段为 null。
 * 四个字段全空时返回 null，交由前端本地计算/占位符兜底。
 */
function normalizeSummary(raw: unknown): GrowthSummary | null {
  if (!raw || typeof raw !== 'object') return null
  const source = raw as Record<string, unknown>
  const potential =
    typeof source.potential === 'string'
      ? source.potential.trim() || null
      : source.potential == null
        ? null
        : String(source.potential)
  const summary: GrowthSummary = {
    experiences: toNumberOrNull(source.experiences),
    skills: toNumberOrNull(source.skills),
    averageGrowth: toNumberOrNull(source.averageGrowth),
    potential,
  }
  const hasValue = Object.values(summary).some((v) => v !== null)
  return hasValue ? summary : null
}

/** 将后端成长时间轴事件映射为前端 GrowthExperience 结构（eventName→title、content→description、eventAt→date、sourceId→recordId） */
function mapBackendEvent(e: Record<string, any>): GrowthExperience {
  return {
    id: `backend-${e.id}`,
    title: e.eventName ?? '',
    description: e.content ?? '',
    date: e.eventAt ?? '',
    // 学期只认后端返回值（后端按 eventAt 归集 semester_id 后回传 semesterName），前端不推导
    semester: e.semesterName ?? '',
    // 事件类型标签与后端 tags 可能重复（如「实践」既是类型又被后端回传），去重避免卡片出现重复标签
    tags: [
      ...new Set([mapTimelineEventType(e.eventType), ...(Array.isArray(e.tags) ? e.tags : [])]),
    ],
    skills: mapAbilities(e.abilityData),
    recordId: e.sourceId != null ? String(e.sourceId) : undefined,
    statusLabel: e.statusLabel || undefined,
  }
}

export function useGrowthTimeline() {
  const experiences = ref<GrowthExperience[]>([])
  const selectedId = ref<string | null>(null)
  const formVisible = ref(false)
  const { sync, autoSync, setAutoSync, isSyncing } = useGrowthDataSources()

  // 本地新增（含从其他模块同步）的经历，与后端时间轴事件合并展示
  const localExperiences = ref<GrowthExperience[]>([])
  // 后端时间轴事件；后端不可用时为空，页面展示空态
  const backendExperiences = ref<GrowthExperience[]>([])
  // 后端 summary（列表接口汇总）；为 null 时由前端本地计算兜底
  const backendSummary = ref<GrowthSummary | null>(null)
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
    // 后端时间轴为唯一数据源；后端不可用时只展示本地新增经历，不注入示例数据
    const base = backendLoaded.value ? backendExperiences.value : []
    experiences.value = sortExperiencesByDate([...base, ...localExperiences.value])
  }

  /**
   * 列表接口未下发 abilityData 时，按 4.2.2 详情接口补齐能力项。
   * 详情也为空则说明该事件本身没有能力记录，保持空状态。
   */
  async function backfillMissingAbilities(rawTimeline: Record<string, any>[]) {
    const targets = rawTimeline
      .filter((raw) => !Array.isArray(raw.abilityData) || raw.abilityData.length === 0)
      .slice(0, 20)
    if (!targets.length) return

    const results = await Promise.allSettled(
      targets.map(async (raw) => ({
        id: Number(raw.id),
        skills: mapAbilities((await getTimelineEventDetail(raw.id))?.abilityData),
      })),
    )
    const patched = new Map<number, GrowthExperience['skills']>()
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.skills.length) {
        patched.set(result.value.id, result.value.skills)
      }
    })
    if (!patched.size) return

    backendExperiences.value = backendExperiences.value.map((e) => {
      const id = Number(e.id.replace('backend-', ''))
      return patched.has(id) ? { ...e, skills: patched.get(id)! } : e
    })
    rebuildExperiences()
  }

  /** 页面加载时拉取成长时间轴；失败时保留本地新增经历 */
  async function loadBackendTimeline() {
    try {
      const data = await getGrowthTimeline()
      const rawTimeline = Array.isArray(data.timeline) ? data.timeline : []
      backendSummary.value = normalizeSummary(data.summary)
      backendExperiences.value = rawTimeline.map(mapBackendEvent)
      backendLoaded.value = true
      rebuildExperiences()
      await backfillMissingAbilities(rawTimeline)
    } catch {
      // 后端不可用：仅保留本地新增经历，展示空态而非编造记录
      backendLoaded.value = false
      backendSummary.value = null
    } finally {
      rebuildExperiences()
    }
  }

  /**
   * 保存成长经历。
   * @param payload 表单提交的经历内容
   * @param done 回调通知表单是否保存成功：失败时表单保持打开、用户输入不丢失。
   */
  async function addExperience(payload: GrowthExperienceInput, done?: (ok: boolean) => void) {
    const localId = `local-${Date.now()}`
    const newExperience: GrowthExperience = {
      ...payload,
      id: localId,
      // 后端按 eventAt 归集学期并在响应中回传 semesterName，前端不本地推导
      semester: '',
      // 有关联来源时同步记录来源 ID，便于详情展示来源关联
      ...(payload.sourceId != null ? { recordId: String(payload.sourceId) } : {}),
    }
    // 先乐观展示，失败时再撤回，避免接口往返期间列表看起来没反应
    localExperiences.value = [...localExperiences.value, newExperience]
    rebuildExperiences()

    // 同步到后端（4.2.1 POST /profile/growth-timeline）。
    // 后端要求 sourceId + sourceType 必填（并校验来源存在且归属本人），表单已强制选择。
    // 能力成长必须传 dimensionCode（后端 abilityData.dimensionCode 必填），
    // 仅填写名称的自由文本无法落库；此处按已选维度映射为 abilityData。
    const abilityData = payload.skills
      .filter((s) => s.dimensionCode)
      .map((s) => ({ dimensionCode: s.dimensionCode as string, score: s.growth }))
    try {
      const created = await addTimelineEvent({
        // 奖项报名来源归类为奖项事件（eventType=1），其余默认能力提升（eventType=6）
        eventType: payload.sourceType === 'award_applications' ? 1 : 6,
        eventName: payload.title,
        content: payload.description,
        eventAt: payload.date,
        tags: payload.tags,
        ...(abilityData.length ? { abilityData } : {}),
        ...(payload.sourceId != null && payload.sourceType
          ? { sourceId: payload.sourceId, sourceType: payload.sourceType }
          : {}),
      })
      if (created?.id != null) {
        localExperiences.value = localExperiences.value.map((e) =>
          e.id === localId
            ? { ...e, id: `backend-${created.id}`, semester: created.semesterName ?? e.semester }
            : e,
        )
        rebuildExperiences()
      }
      done?.(true)
    } catch {
      // 保存失败：撤回本地乐观记录，避免「页面上有、刷新后消失」的假成功。
      // 具体错误信息由 request 拦截器提示。
      localExperiences.value = localExperiences.value.filter((e) => e.id !== localId)
      rebuildExperiences()
      done?.(false)
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
    summary: backendSummary,
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
