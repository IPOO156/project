import type { Ref } from 'vue'
import { onBeforeUnmount, onMounted, ref } from 'vue'

export interface UseScrollRevealOptions {
  threshold?: number
  rootMargin?: string
  once?: boolean
}

export function useScrollReveal(
  elementRef: Ref<HTMLElement | null>,
  options: UseScrollRevealOptions = {},
) {
  const { threshold = 0.25, rootMargin = '0px 0px -60px 0px', once = false } = options

  const isVisible = ref(false)
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    const el = elementRef.value
    if (!el) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isVisible.value = true
            if (once && observer) {
              observer.disconnect()
              observer = null
            }
          } else if (!once) {
            isVisible.value = false
          }
        })
      },
      { threshold, rootMargin },
    )

    observer.observe(el)
  })

  onBeforeUnmount(() => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  })

  return { isVisible }
}
