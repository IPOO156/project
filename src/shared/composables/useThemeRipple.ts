import { useThemeStore } from '@/app/stores/stores'

export function useThemeRipple() {
  const themeStore = useThemeStore()

  function toggleThemeWithRipple(e: MouseEvent, onToggle?: () => void) {
    const el = e.currentTarget as HTMLElement
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const nextIsDark = !themeStore.isDark
    const rippleColor = nextIsDark ? '#0d0e1a' : '#f0ebe2'
    const size = Math.max(window.innerWidth, window.innerHeight) * 2.5

    const ripple = document.createElement('div')
    ripple.style.cssText = `
      position: fixed;
      left: ${cx - size / 2}px;
      top: ${cy - size / 2}px;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${rippleColor};
      pointer-events: none;
      z-index: 9999;
      transform: scale(0);
      opacity: 0;
      filter: blur(4px);
      transition:
        transform 0.9s cubic-bezier(0.22, 1, 0.36, 1),
        opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1),
        filter 0.9s ease;
    `
    document.body.appendChild(ripple)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ripple.style.transform = 'scale(1)'
        ripple.style.opacity = '0.7'
        ripple.style.filter = 'blur(0px)'
      })
    })

    setTimeout(() => {
      themeStore.toggleTheme()
      onToggle?.()
    }, 350)

    setTimeout(() => {
      ripple.style.opacity = '0'
      ripple.style.filter = 'blur(8px)'
    }, 450)

    setTimeout(() => {
      ripple.remove()
    }, 1200)
  }

  return {
    toggleThemeWithRipple,
  }
}
