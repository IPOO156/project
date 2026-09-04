/**
 * AI 智能助手模块类型定义
 *
 * - ChatMessage 向后兼容：content 保持 string，richContent/feedback 为可选新增字段
 *   （AIChatDrawer 仅用 content 显示纯文本摘要，新增字段对其无影响）
 * - RichContent 采用结构化数据，由 RichContentRenderer 模板渲染，避免 v-html 的 XSS 风险
 */

/** 消息角色 */
export type ChatRole = 'user' | 'ai'

/** 消息反馈（有用/无用） */
export type MessageFeedback = 'useful' | 'useless' | null

/** 单条聊天消息 */
export interface ChatMessage {
  id: string
  role: ChatRole
  /** 纯文本内容（兼容 AIChatDrawer 显示 + 导出），AI 富文本回复时为摘要 */
  content: string
  /** 发送时间 HH:mm */
  time: string
  /** AI 结构化富文本回复（可选）；存在时独立页优先渲染此字段 */
  richContent?: RichContent
  /** 消息反馈（可选） */
  feedback?: MessageFeedback
  /** 是否离线模式回复（后端不可用时本地模拟，标注“离线模式”） */
  offline?: boolean
}

/** 富文本高亮片段（splitHighlight 产出的切分单元） */
export interface HighlightSegment {
  text: string
  isHighlight: boolean
}

/** 富文本内容 */
export interface RichContent {
  /** 标题问候语（可选） */
  greeting?: string
  /** 依据材料 chips（职业规划分析等场景展示引用的档案材料，可选） */
  materials?: string[]
  /** 内容块序列 */
  blocks: RichBlock[]
}

/** 富文本块（联合类型，按 type 分流渲染） */
export type RichBlock = ParagraphBlock | ListBlock | StepsBlock | CardBlock

/** 段落块 */
export interface ParagraphBlock {
  type: 'paragraph'
  text: string
  /** 需高亮的关键词列表 */
  highlights?: string[]
}

/** 列表块 */
export interface ListBlock {
  type: 'list'
  items: ListItem[]
}

export interface ListItem {
  /** 加粗前缀（如"申报表"） */
  strong?: string
  /** 正文 */
  text: string
}

/** 步骤块 */
export interface StepsBlock {
  type: 'steps'
  items: StepItem[]
}

export interface StepItem {
  /** 步骤序号 */
  num: number
  /** 步骤标题（加粗） */
  strong: string
  /** 步骤说明 */
  text: string
}

/** 信息卡块 */
export interface CardBlock {
  type: 'card'
  /** 卡片标题 */
  title: string
  /** 标题图标标识 */
  icon?: CardIcon
  /** 卡片正文 */
  body: string
  /** 正文中需高亮的关键词 */
  highlights?: string[]
}

export type CardIcon = 'info' | 'shield' | 'clock' | 'success'

/** 历史对话（后端会话列表项，GET /ai/conversations） */
export interface Conversation {
  id: number
  /** 会话标题 */
  title: string
  /** 状态枚举（1=正常） */
  status: number
  /** 状态文案 */
  statusLabel: string
  /** 最后消息时间（可选） */
  lastMessageTime?: string
  /** 创建时间 */
  createdAt: string
}

/** 后端 AI 消息（GET /ai/conversations/{id}/messages 列表项） */
export interface AIConversationMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  modelName?: string
  tokenUsage?: number
  generationTimeMs?: number
  createdAt: string
  /**
   * 当前用户对该消息的反馈（可选，待后端消息列表 DTO 补 feedback 字段后回显）
   * 未反馈或后端未返回时为 undefined → 映射为 null，图标不激活
   */
  feedback?: MessageFeedback
}

/** 建议操作（后端运行时组装，如跳转个人档案） */
export interface AISuggestedAction {
  label: string
  jumpUrl: string
  actionType: string
}

/** 发送消息响应（POST /ai/conversations/{id}/messages） */
export interface AISendMessageResult {
  messageId: number
  role: 'assistant'
  content: string
  modelName?: string
  tokenUsage?: number
  generationTimeMs?: number
  createdAt: string
  suggestedActions?: AISuggestedAction[]
}

/** 重新生成响应（POST /ai/conversations/{id}/messages/{messageId}/regenerate） */
export interface AIRegenerateResult {
  messageId: number
  role: 'assistant'
  content: string
  modelName?: string
  modelVersion?: string
  tokenUsage?: number
  generationTimeMs?: number
  callStatus: number
  isRetry: boolean
  createdAt: string
}

/** AI 辅助建议（GET /ai/suggestions 列表项，数据来源：improvement_suggestions 表） */
export interface AISuggestion {
  /** 建议ID */
  suggestionId: number
  /** 建议内容（improvement_suggestions.suggestion_content） */
  content: string
  /** 关联档案来源（如某条竞赛获奖记录） */
  sourceArchives?: Array<{ archiveId: number; title: string }>
  /** 是否 AI 自动生成 */
  aiGenerated: boolean
  /** AI 生成告警（如「AI辅助生成，请教师复核」） */
  aiWarning?: string
  /** 教师处理状态枚举 */
  teacherAction?: number
  /** 教师处理状态文案（如「待处理」） */
  teacherActionLabel?: string
  createdAt: string
}

/** 知识库条目 */
export interface KnowledgeEntry {
  /** 主题标识 */
  topic: string
  /** 触发关键词 */
  keywords: string[]
  /** 结构化富文本回复 */
  rich: RichContent
}

/** 快捷问题项 */
export interface QuickQuestion {
  /** 显示文案 */
  label: string
  /** 点击后发送的提问 */
  question: string
  /** 图标标识（lucide 图标名映射） */
  icon: string
}

/** 助手设置项 */
export interface ChatSettings {
  /** 思考动画 */
  thinking: boolean
  /** 快捷问题 */
  quick: boolean
  /** 消息反馈（有用/无用/复制） */
  feedback: boolean
}

/** 导出格式 */
export type ExportFormat = 'txt' | 'md' | 'pdf'
