// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { useChatSettings } from '@/features/ai-chat/composables/useChatSettings'

const STORAGE_KEY = 'ai_chat_settings'

beforeEach(() => localStorage.clear())

describe('useChatSettings', () => {
  it('无本地记录时返回三项默认开启', () => {
    const { settings } = useChatSettings()

    expect(settings.value).toEqual({ thinking: true, quick: true, feedback: true })
  })

  it('读取本地记录并与默认值合并（缺字段用默认）', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ feedback: false }))

    const { settings } = useChatSettings()

    expect(settings.value).toEqual({ thinking: true, quick: true, feedback: false })
  })

  it('更新后立即写入本地存储', () => {
    const { settings, update } = useChatSettings()

    update('thinking', false)

    expect(settings.value.thinking).toBe(false)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toMatchObject({
      thinking: false,
      quick: true,
      feedback: true,
    })
  })

  it('本地记录损坏时回退默认值', () => {
    localStorage.setItem(STORAGE_KEY, '{bad json')

    const { settings } = useChatSettings()

    expect(settings.value).toEqual({ thinking: true, quick: true, feedback: true })
  })
})
