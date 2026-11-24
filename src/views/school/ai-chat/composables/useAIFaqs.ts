/**
 * useAIFaqs - AI 助手常见问题（GET /ai/faqs）
 *
 * 聊天页与悬浮球抽屉共用同一份模块级缓存：
 *  - 首次调用 load() 发一次请求，成功后缓存，后续调用直接复用；
 *  - 并发 load() 复用同一个 in-flight Promise，避免首屏双请求；
 *  - 失败时置空且不缓存（下次挂载可重试），由调用方静默隐藏快捷区。
 *
 * 不把 onMounted 写在 composable 内：页面挂载即拉取，抽屉在首次打开时拉取，
 * 这样单测也能直接调用 load()，无需组件上下文。
 */
import type { QuickQuestion } from '../ai-chat.types'
import type { AIFaqItem } from '@/shared/api/ai-chat'
import { ref } from 'vue'
import { getAIFaqs } from '@/shared/api/ai-chat'

const questions = ref<QuickQuestion[]>([])
const loading = ref(false)
let loaded = false
let inflight: Promise<void> | null = null

/** FAQ 全量映射；是否截断由展示层决定（聊天页 6 条、抽屉 4 条） */
export function toQuickQuestions(list: AIFaqItem[] | null | undefined): QuickQuestion[] {
  if (!Array.isArray(list)) return []
  return list
    .filter((item) => typeof item?.question === 'string' && item.question.trim().length > 0)
    .map((item) => ({
      id: item.id,
      label: item.question,
      question: item.question,
      // 后端没有图标字段，统一用 Sparkles；QuickQuestions 的 iconMap 已登记
      icon: 'sparkles',
    }))
}

async function load(): Promise<void> {
  if (loaded) return
  if (inflight) return inflight
  loading.value = true
  inflight = getAIFaqs()
    .then((list) => {
      questions.value = toQuickQuestions(list)
      loaded = true
    })
    .catch(() => {
      // 接口失败按空处理，不缓存 loaded，下次调用可重试；错误提示由 silent 请求关闭
      questions.value = []
    })
    .finally(() => {
      loading.value = false
      inflight = null
    })
  return inflight
}

export function useAIFaqs() {
  return { questions, loading, load }
}
