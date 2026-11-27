import type { AISuggestion } from '@/features/ai-chat/ai-chat.types'

export interface DisplaySuggestion {
  key: number
  content: string
  warning: string
  status: string
  sources: string
}

/** 后端建议 → 模板展示形状（模板只读加工后字段，避免复杂表达式） */
export function toDisplaySuggestions(list: AISuggestion[]): DisplaySuggestion[] {
  return list.map((s) => ({
    key: s.suggestionId,
    content: s.content,
    warning: s.aiWarning ?? '',
    status: s.teacherActionLabel ?? '',
    sources: s.sourceArchives?.map((a) => a.title).join('、') ?? '',
  }))
}

/** 空态文案：分析中 / 建议加载中 / 初始引导 */
export function emptySuggestionText(analyzing: boolean, loading: boolean): string {
  if (analyzing) return '正在分析你的档案数据…'
  if (loading) return '正在加载 AI 建议…'
  return '点击「开始分析」获取个性化改进建议'
}
