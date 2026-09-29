import type { Ref } from 'vue'
import { onBeforeUnmount, onMounted, ref } from 'vue'

export interface UseScrollRevealOptions {
  threshold?: number
  rootMargin?: string
  once?: boolean
}

function findScrollRoot(): Element | null {
  if (typeof document === 'undefined') return null
  // 页面实际滚动容器为 DefaultLayout 的 .layout__content，优先以其为观察根
  return document.querySelector('.layout__content')
}

export function useScrollReveal(
  elementRef: Ref<HTMLElement | null>,
  options: UseScrollRevealOptions = {},
) {
  const { threshold = 0.1, rootMargin = '0px 0px -40px 0px', once = false } = options

  const isVisible = ref(false)
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    const el = elementRef.value
    if (!el) return

    // 降级：当前环境不支持 IntersectionObserver 时直接视为可见
    if (!('IntersectionObserver' in window)) {
      isVisible.value = true
      return
    }

    const root = findScrollRoot()

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 双 rAF：确保浏览器先绘制 opacity:0 的初始态，再触发 visible 过渡
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                isVisible.value = true
              })
            })
            if (once && observer) {
              observer.disconnect()
              observer = null
            }
          } else if (!once) {
            isVisible.value = false
          }
        })
      },
      { threshold, rootMargin, root },
    )

    // 延迟 observe：确保 DOM 布局稳定后再监听，避免首屏卡片初始 CSS 未绘制就触发回调
    setTimeout(() => {
      if (observer) {
        observer.observe(el)
      }
    }, 80)
  })

  onBeforeUnmount(() => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  })

  return { isVisible }
}
