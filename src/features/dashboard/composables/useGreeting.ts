import { computed, onMounted, ref, watch } from 'vue'
import { useUserStore } from '@/app/stores/stores'

export interface GreetingInfo {
  /** 问候语前缀，如"早上好" */
  prefix: string
  /** 完整问候文案 */
  message: string
  /** 时间段标识：morning | noon | afternoon | evening | night */
  period: 'morning' | 'noon' | 'afternoon' | 'evening' | 'night'
}

const GREETING_STORAGE_KEY = 'greeting_last_shown_date'

/** 今日日期字符串 (yyyy-MM-dd)，用于判断当天是否已展示过 */
function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 检查今天是否已展示过问候弹窗 */
function hasShownToday(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return localStorage.getItem(GREETING_STORAGE_KEY) === todayKey()
  } catch {
    return false
  }
}

/** 标记今天已展示 */
function markShownToday() {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(GREETING_STORAGE_KEY, todayKey())
  } catch {
    // 静默失败
  }
}

/** 根据当前小时获取问候信息 */
export function getGreetingByHour(username: string): GreetingInfo {
  const hour = new Date().getHours()

  if (hour >= 6 && hour < 12) {
    return {
      prefix: '早上好',
      period: 'morning',
      message: `早上好，${username}`,
    }
  }

  if (hour >= 12 && hour < 14) {
    return {
      prefix: '中午好',
      period: 'noon',
      message: `中午好，${username}`,
    }
  }

  if (hour >= 14 && hour < 18) {
    return {
      prefix: '下午好',
      period: 'afternoon',
      message: `下午好，${username}`,
    }
  }

  if (hour >= 18 && hour < 23) {
    return {
      prefix: '晚上好',
      period: 'evening',
      message: `晚上好，${username}`,
    }
  }

  // 23:00 - 6:00
  return {
    prefix: '夜深了',
    period: 'night',
    message: `夜深了，${username}，注意休息`,
  }
}

/**
 * 问候提示的视觉主题。
 *
 * 所有时段统一使用品牌深蓝，不用不同色相区分早晚：
 * 这类提示是背景信息，颜色不应与状态色/主操作争抢注意力。
 */
export function getPeriodTheme(period: GreetingInfo['period']) {
  const themes: Record<GreetingInfo['period'], { gradient: string }> = {
    morning: { gradient: 'linear-gradient(180deg, #1e3a5f 0%, #2d5a87 100%)' },
    noon: { gradient: 'linear-gradient(180deg, #1e3a5f 0%, #2d5a87 100%)' },
    afternoon: { gradient: 'linear-gradient(180deg, #1e3a5f 0%, #2d5a87 100%)' },
    evening: { gradient: 'linear-gradient(180deg, #1e3a5f 0%, #2d5a87 100%)' },
    night: { gradient: 'linear-gradient(180deg, #1e3a5f 0%, #2d5a87 100%)' },
  }
  return themes[period]
}

/**
 * 人性化问候弹窗逻辑
 * - 每天仅首次访问时展示一次
 * - 根据时间段（早上/中午/下午/晚上/深夜）展示不同文案
 */
const AUTO_CLOSE_MS = 5000

export function useGreeting() {
  const userStore = useUserStore()

  const visible = ref(false)
  const dismissing = ref(false)
  let autoCloseTimer: ReturnType<typeof setTimeout> | null = null

  const greeting = computed<GreetingInfo>(() => {
    return getGreetingByHour(userStore.userName || '同学')
  })

  const theme = computed(() => getPeriodTheme(greeting.value.period))

  function clearAutoCloseTimer() {
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer)
      autoCloseTimer = null
    }
  }

  watch(visible, (isVisible) => {
    clearAutoCloseTimer()
    if (isVisible) {
      autoCloseTimer = setTimeout(() => {
        dismiss()
      }, AUTO_CLOSE_MS)
    }
  })

  function checkAndShow() {
    if (hasShownToday()) return
    if (!userStore.isLoggedIn) return
    // 给一个微小延迟，让页面先渲染完成再弹出
    setTimeout(() => {
      visible.value = true
    }, 600)
  }

  // 监听登录状态：登录成功后若当天未展示过，则自动弹出问候
  watch(
    () => userStore.isLoggedIn,
    (loggedIn) => {
      if (loggedIn) checkAndShow()
    },
  )

  // 组件挂载时也尝试触发一次，兼容刷新页面时已经登录的场景
  onMounted(() => {
    checkAndShow()
  })

  function dismiss() {
    clearAutoCloseTimer()
    dismissing.value = true
    markShownToday()
    setTimeout(() => {
      visible.value = false
      dismissing.value = false
    }, 300)
  }

  return {
    visible,
    dismissing,
    greeting,
    theme,
    checkAndShow,
    dismiss,
  } as const
}
