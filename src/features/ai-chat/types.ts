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

/** 历史对话 */
export interface Conversation {
  id: string
  /** 对话标题（取首条用户消息前 14 字） */
  title: string
  /** 对话消息列表（深拷贝快照） */
  messages: ChatMessage[]
  /** 创建时间 */
  createTime: string
}

/** 对话列表摘要（轻量，不含 message 列表） */
export interface ConversationSummary {
  id: string
  title: string
  createTime: string
  messageCount: number
}

/** 发送消息响应（POST /ai/chat） */
export interface SendMessageResult {
  message: ChatMessage
  conversationId: string
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
