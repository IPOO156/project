import type { GrowthExperience, GrowthExperienceInput } from '../timelineConstants'
import { computed, ref } from 'vue'
import {
  addTimelineEvent,
  deleteTimelineEvent,
  getTimelineEventDetail,
  updateTimelineEvent,
} from '@/shared/api/archive'
import { getGrowthTimeline } from '@/shared/api/student'
import { asArray, asNumber, asRecord, asText } from '@/shared/utils/unknown'
import { mapTimelineEventType } from '../timelineConstants'

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
  const abilities = asArray<unknown>(raw)
  return abilities.map((item) => {
    const a = asRecord(item)
    return {
      name: a.dimensionName == null ? asText(a.dimensionCode) : asText(a.dimensionName),
      growth: asNumber(a.score),
      dimensionCode: a.dimensionCode == null ? undefined : asText(a.dimensionCode),
    }
  })
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
function mapBackendEvent(e: Record<string, unknown>): GrowthExperience {
  const eventType = typeof e.eventType === 'number' ? e.eventType : undefined
  return {
    id: `backend-${asText(e.id)}`,
    title: asText(e.eventName),
    description: asText(e.content),
    date: asText(e.eventAt),
    // 学期只认后端返回值（后端按 eventAt 归集 semester_id 后回传 semesterName），前端不推导
    semester: asText(e.semesterName),
    // tags 只保留用户自填标签：事件类型是独立只读字段，不能混进标签里展示
    tags: [...new Set(asArray<string>(e.tags))],
    eventType,
    eventTypeLabel:
      asText(e.eventTypeLabel) || (eventType != null ? mapTimelineEventType(eventType) : undefined),
    skills: mapAbilities(e.abilityData),
    recordId: e.sourceId != null ? String(e.sourceId) : undefined,
    statusLabel: asText(e.statusLabel) || undefined,
  }
}

export function useGrowthTimeline() {
  const experiences = ref<GrowthExperience[]>([])
  const selectedId = ref<string | null>(null)
  const formVisible = ref(false)

  // 本地新增的经历，与后端时间轴事件合并展示
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
  async function backfillMissingAbilities(rawTimeline: Array<Record<string, unknown>>) {
    const targets = rawTimeline
      .filter((raw) => !Array.isArray(raw.abilityData) || raw.abilityData.length === 0)
      .slice(0, 20)
    if (!targets.length) return

    const results = await Promise.allSettled(
      targets.map(async (raw) => ({
        id: Number(raw.id),
        skills: mapAbilities((await getTimelineEventDetail(Number(raw.id)))?.abilityData),
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
      // 能力成长与事件类型都由后端推导后回传，新增时本地为空，保存成功后会用后端详情替换
      skills: [],
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
    // 能力成长（abilityData）由后端按来源类型套用管理端计分规则生成，前端不再提交。
    try {
      const created = await addTimelineEvent({
        // 事件类型（eventType）由后端按来源记录推导，前端不再提交：
        // 前端按 sourceType 硬编码 1/4/6 既不准确（如成绩类来源），又会让类型混进展示层
        eventName: payload.title,
        content: payload.description,
        eventAt: payload.date,
        tags: payload.tags,
        ...(payload.sourceId != null && payload.sourceType
          ? { sourceId: payload.sourceId, sourceType: payload.sourceType }
          : {}),
      })
      if (created?.id != null) {
        // 用后端返回的完整详情替换本地乐观记录：新增接口已回传学期、状态、
        // 事件类型标签由后端 abilityData 规则生成的能力项，若只改本地 id，
        // 卡片会停留在「缺学期/缺状态/无能力项」的过渡态，刷新后内容才补齐。
        const mapped = mapBackendEvent(created as unknown as Record<string, unknown>)
        localExperiences.value = localExperiences.value.filter((e) => e.id !== localId)
        backendExperiences.value = [
          ...backendExperiences.value.filter((e) => e.id !== mapped.id),
          mapped,
        ]
        // POST 成功说明后端可用：即使页面首次加载失败（backendLoaded=false），
        // 也要把新记录并入展示，否则本地乐观记录被移除后卡片会直接消失
        backendLoaded.value = true
        rebuildExperiences()
        done?.(true)
        // 新增响应不保证带后端推导的学期/状态/能力项，且右侧汇总（经历数/能力项数/平均成长）
        // 由列表接口计算：重拉一次，使新增后立即展示的内容与刷新后完全一致
        await loadBackendTimeline()
        return
      }
      // 响应成功但没有 id：后端未真正落库，按失败处理并撤回本地乐观记录，
      // 避免页面显示成功、刷新后记录消失（伪成功）
      localExperiences.value = localExperiences.value.filter((e) => e.id !== localId)
      rebuildExperiences()
      done?.(false)
    } catch {
      // 保存失败：撤回本地乐观记录，避免「页面上有、刷新后消失」的假成功。
      // 具体错误信息由 request 拦截器提示。
      localExperiences.value = localExperiences.value.filter((e) => e.id !== localId)
      rebuildExperiences()
      done?.(false)
    }
  }

  /**
   * 修改已持久化的成长经历（4.2.3 PUT /profile/growth-timeline/{id}）。
   * 只提交表单可编辑的字段；来源关联沿用原值，编辑时不改动，避免唯一校验冲突。
   * 修改日期后后端会按新日期重新归集学期。
   */
  async function updateExperience(
    id: string,
    payload: GrowthExperienceInput,
    done?: (ok: boolean) => void,
  ) {
    const backendId = /^backend-(\d+)$/.exec(id)?.[1]
    // 未持久化的本地记录无法修改，避免把前端前缀当真实 id 发出
    if (!backendId) {
      done?.(false)
      return
    }
    try {
      const updated = await updateTimelineEvent(backendId, {
        eventName: payload.title,
        content: payload.description,
        eventAt: payload.date,
        tags: payload.tags,
      })
      backendExperiences.value = backendExperiences.value.map((e) =>
        e.id === id ? mapBackendEvent(updated as unknown as Record<string, unknown>) : e,
      )
      rebuildExperiences()
      // 汇总（能力/标签统计）由列表接口返回，改动后重拉一次，避免右侧汇总与卡片不一致
      void loadBackendTimeline()
      done?.(true)
    } catch {
      // 修改失败：保留弹窗与已填内容，具体错误由 request 拦截器提示
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

  // 页面加载：拉取后端成长时间轴
  loadBackendTimeline()

  return {
    experiences,
    summary: backendSummary,
    selectedId,
    selectedExperience,
    formVisible,
    selectExperience,
    openForm,
    closeForm,
    addExperience,
    updateExperience,
    deleteExperience,
  }
}
