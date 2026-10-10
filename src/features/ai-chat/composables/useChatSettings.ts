import type { ChatSettings } from '../types'
/**
 * useChatSettings - AI 助手设置项持久化
 *
 * 三个 toggle（thinking / quick / feedback）通过 localStorage 持久化，
 * 刷新后保留。读写在 try/catch 中静默降级（隐私模式无 localStorage）。
 */
import { ref } from 'vue'

const STORAGE_KEY = 'ai_chat_settings'

const DEFAULT_SETTINGS: ChatSettings = {
  thinking: true,
  quick: true,
  feedback: true,
}

function load(): ChatSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<ChatSettings>
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function useChatSettings() {
  const settings = ref<ChatSettings>(load())

  function update(key: keyof ChatSettings, value: boolean) {
    settings.value[key] = value
    persist()
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value))
    } catch {
      // 静默降级
    }
  }

  return { settings, update }
}
