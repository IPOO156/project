import type { ProfileDimension, TimelineNode } from '@/shared/types/types'
import request from './request'
import { getGrowthTimeline } from './student'

/* ===================== 成长时间轴（文档 4.2.x） ===================== */

/** 能力维度得分项（growth_timeline_abilities 子表） */
export interface TimelineAbility {
  /** 能力维度编码（对应 ability_dimensions.dimension_code，写接口传） */
  dimensionCode: string
  /** 维度名称（接口返回，写接口不传） */
  dimensionName?: string
  /** 该事件带来的维度得分变化，0-100，默认 0 */
  score: number
}

/** 成长时间轴事件请求体（4.2.1 新增 / 4.2.3 修改，字段对齐接口文档） */
export interface TimelineEventPayload {
  /** 学期 ID（growth_timelines.semester_id），需为有效学期 */
  semesterId?: number
  /** 事件类型：1=奖项 2=成绩 3=实践 4=职业规划 5=短板改进 6=能力提升 */
  eventType: number
  /** 事件名称，最长 255 字符 */
  eventName: string
  /** 事件详细描述/富文本 */
  content?: string
  /** 封面图片 URL，先通过 POST /common/upload/cover（2.1.5）上传获取 */
  coverImage?: string
  /** 发生时间，格式 YYYY-MM-DD */
  eventAt: string
  /** 来源记录 ID（后端必填，与 sourceType 同时提供，须关联已有且归属本人的来源记录） */
  sourceId?: number
  /** 来源模型类型（后端必填，与 sourceId 配对，如 archives / award_applications） */
  sourceType?: string
  /** 业务去重键，同用户下唯一（uk_gt_event_key） */
  eventKey?: string
  /** 能力维度得分列表 */
  abilityData?: TimelineAbility[]
  /** 事件标签列表（growth_timeline_tags），自动去重 */
  tags?: string[]
}

/** 成长时间轴事件详情（4.2.1 新增 / 4.2.2 详情 / 4.2.3 修改 响应） */
export interface TimelineEventDetail {
  id: number
  semesterId?: number
  semesterName?: string
  eventAt: string
  eventName: string
  content?: string
  eventType: number
  eventTypeLabel?: string
  status: number
  statusLabel?: string
  coverImage?: string
  sourceId?: number
  sourceType?: string
  eventKey?: string
  abilityData?: TimelineAbility[]
  tags?: string[]
  createdAt?: string
  updatedAt?: string
}

/**
 * 新增成长时间轴事件（4.2.1 POST /profile/growth-timeline）
 * 后端 create 强制要求 sourceId+sourceType（须对应已有且归属本人的来源记录），
 * 并对同一来源做 uk_gt_source 唯一校验；status 由后端强制置为已通过。
 */
export function addTimelineEvent(data: TimelineEventPayload): Promise<TimelineEventDetail> {
  return request.post('/profile/growth-timeline', data)
}

/**
 * 获取成长时间轴事件详情（4.2.2 GET /profile/growth-timeline/{id}）
 */
export function getTimelineEventDetail(id: number | string): Promise<TimelineEventDetail> {
  return request.get(`/profile/growth-timeline/${id}`)
}

/**
 * 修改成长时间轴事件（4.2.3 PUT /profile/growth-timeline/{id}）
 * 全部字段可选，仅更新传入的非空字段；abilityData / tags 传入（含空数组）时整体替换
 */
export function updateTimelineEvent(
  id: number | string,
  data: Partial<TimelineEventPayload>,
): Promise<TimelineEventDetail> {
  return request.put(`/profile/growth-timeline/${id}`, data)
}

/**
 * 删除成长时间轴事件（4.2.4 DELETE /profile/growth-timeline/{id}，软删除）
 */
export function deleteTimelineEvent(id: number | string): Promise<void> {
  return request.delete(`/profile/growth-timeline/${id}`)
}

/**
 * 获取多维度画像
 * 对接后端 GET /archive/dimensions（见 docs/api.md 3.4）。
 * 后端返回 { userId, semesterId, totalScore, dimensions: [{ dimensionCode, dimensionName,
 * score, ratio, sort }] }，此处映射为页面使用的 ProfileDimension：
 * label=dimensionName、current=score。响应不含单项满分，target 记 0（页面据此只显示原始分，
 * 不编造得分率）；previous 无数据同样记 0。
 */
export async function getDimensions(): Promise<ProfileDimension[]> {
  const res = (await request.get('/archive/dimensions')) as unknown as {
    dimensions?: Array<{
      dimensionCode?: string
      dimensionName?: string
      score?: number | string | null
      ratio?: number | string | null
    }>
  } | null
  const list = Array.isArray(res?.dimensions) ? res.dimensions : []
  return list.map((d) => ({
    label: d.dimensionName || d.dimensionCode || '',
    current: Number(d.score ?? 0),
    target: 0,
    previous: 0,
  }))
}

/**
 * 获取能力维度选项（GET /archive/dimensions）。
 * 成长时间轴写接口的 abilityData 要求传 dimensionCode（对应 ability_dimensions.dimension_code），
 * 页面不能把用户自由输入的能力名称直接当编码提交，故此处保留编码供下拉选择。
 */
export async function getAbilityDimensionOptions(): Promise<
  Array<{ dimensionCode: string; dimensionName: string; description?: string }>
> {
  const res = (await request.get('/archive/dimensions')) as unknown as {
    dimensions?: Array<{
      dimensionCode?: string
      dimensionName?: string
      description?: string
    }>
  } | null
  const list = Array.isArray(res?.dimensions) ? res.dimensions : []
  return list
    .filter((d) => Boolean(d.dimensionCode))
    .map((d) => ({
      dimensionCode: d.dimensionCode as string,
      dimensionName: d.dimensionName || (d.dimensionCode as string),
      description: d.description,
    }))
}

/** 后端 eventType(1-6) → 前端 TimelineNode.type 映射（与档案概览时间线面板共用口径） */
function mapBackendEventType(type: number | undefined): TimelineNode['type'] {
  const map: Record<number, TimelineNode['type']> = {
    1: 'award',
    2: 'grade',
    3: 'practice',
    4: 'other',
    5: 'other',
    6: 'other',
  }
  return map[type ?? 0] || 'other'
}

/**
 * 获取成长时间轴事件列表（GET /profile/growth-timeline，viewType=list）
 * 复用 student.ts getGrowthTimeline（已解包），此处映射为 TimelineNode，
 * 供档案 Store fetchTimeline 消费（成长发展页「成长记录」/ 成长数据来源统计）
 */
export async function getTimelineEvents(): Promise<TimelineNode[]> {
  const data = await getGrowthTimeline({ viewType: 'list' })
  const list = data.timeline ?? []
  return list.map((e) => ({
    id: String(e.id),
    semester: e.semesterName || '',
    type: mapBackendEventType(e.eventType),
    title: e.eventName,
    description: e.content || '',
    date: e.eventAt,
    recordId: e.sourceId != null ? String(e.sourceId) : undefined,
  }))
}
