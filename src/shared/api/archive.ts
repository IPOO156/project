import type { Award, Grade, ProfileDimension, TimelineNode } from '@/shared/types/types'
import request from './request'
import { getGrowthTimeline } from './student'

let idCounter = 100

function nextId(): string {
  return String(++idCounter)
}

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
  /** 来源记录 ID（与 sourceType 配对，来源记录必填，须关联已有来源记录） */
  sourceId?: number
  /** 来源模型类型（与 sourceId 配对，如 archive_social_practices / award_applications） */
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
 * 后端 create：status 不传时默认 0=草稿（列表接口不按状态过滤，刷新可见）；
 * sourceId+sourceType 可空，但携带 sourceType 时必须同时提供 sourceId（uk_gt_source 唯一）
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
 * 获取成绩列表
 * 后端就绪后替换为：return request.get<Grade[]>('/archive/grades')
 */
export function getGrades(): Promise<Grade[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: '1',
          semester: '2022-2023-1',
          courseName: '高等数学',
          score: 85,
          gpa: 3.2,
          credits: 5,
        },
        {
          id: '2',
          semester: '2022-2023-2',
          courseName: '线性代数',
          score: 87,
          gpa: 3.4,
          credits: 4,
        },
        {
          id: '3',
          semester: '2023-2024-1',
          courseName: '数据结构',
          score: 90,
          gpa: 3.6,
          credits: 5,
        },
        {
          id: '4',
          semester: '2023-2024-2',
          courseName: '操作系统',
          score: 91,
          gpa: 3.8,
          credits: 4,
        },
      ])
    }, 300)
  })
}

/**
 * 获取奖项列表
 * 后端就绪后替换为：return request.get<Award[]>('/archive/awards')
 */
export function getAwards(): Promise<Award[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: '1',
          name: '全国大学生数学建模竞赛',
          level: 'provincial',
          type: 'competition',
          date: '2025-09',
          prize: '二等奖',
        },
        {
          id: '2',
          name: '校级优秀学生干部',
          level: 'school',
          type: 'other',
          date: '2025-06',
          prize: '优秀干部',
        },
        {
          id: '3',
          name: 'ACM 程序设计竞赛',
          level: 'school',
          type: 'competition',
          date: '2025-05',
          prize: '一等奖',
        },
      ])
    }, 300)
  })
}

export function addAward(data: Omit<Award, 'id'>): Promise<Award> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ ...data, id: nextId() }), 200)
  })
}

export function updateAward(id: string, data: Partial<Award>): Promise<Award> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ ...data, id } as Award), 200)
  })
}

export function deleteAward(_id: string): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 200)
  })
}

/**
 * 获取多维度画像
 * 对接后端 GET /archive/dimensions（见 docs/api.md 3.4）
 */
export function getDimensions(): Promise<ProfileDimension[]> {
  return request.get('/archive/dimensions')
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
 * 复用 student.ts getGrowthTimeline（已解包），此处映射为 TimelineNode 供档案概览「时间线」面板消费
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
