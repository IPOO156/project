import type { Ref } from 'vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const STORAGE_KEY = 'ai_floating_ball_position'
const BALL_SIZE = 56
const BALL_SIZE_MOBILE = 48
const EDGE_GAP = 24
const DRAG_THRESHOLD = 4

export interface FloatingBallPosition {
  x: Ref<number>
  y: Ref<number>
  ballSize: Ref<number>
  isDragging: Ref<boolean>
  wasDragging: Ref<boolean>
  onPointerDown: (e: PointerEvent) => void
  onPointerUp: (e: PointerEvent) => void
}

function isMobileDevice(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= 768
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val))
}

interface SavedPosition {
  left: number
  bottom: number
}

function loadPosition(): SavedPosition | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SavedPosition
  } catch {
    return null
  }
}

function savePosition(pos: SavedPosition): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos))
  } catch {
    // 静默失败
  }
}

export function useFloatingBallPosition(): FloatingBallPosition {
  const isMobile = ref(isMobileDevice())
  const isDragging = ref(false)
  const wasDragging = ref(false)

  const saved = loadPosition()
  const defaultLeft = typeof window !== 'undefined' ? window.innerWidth - EDGE_GAP - BALL_SIZE : 0

  const x = ref(saved?.left ?? defaultLeft)
  const y = ref(saved?.bottom ?? EDGE_GAP)

  const ballSize = computed(() => (isMobile.value ? BALL_SIZE_MOBILE : BALL_SIZE))

  // 拖拽内部状态
  let dragStartX = 0
  let dragStartY = 0
  let dragStartLeft = 0
  let dragStartBottom = 0

  function updateBoundaries() {
    if (typeof window === 'undefined') return
    const size = ballSize.value
    const maxLeft = window.innerWidth - size
    const maxBottom = window.innerHeight - size

    x.value = clamp(x.value, 0, maxLeft)
    y.value = clamp(y.value, EDGE_GAP, maxBottom)
  }

  function snapToEdge() {
    if (typeof window === 'undefined') return
    const size = ballSize.value
    const centerX = x.value + size / 2
    const viewportCenter = window.innerWidth / 2

    if (centerX < viewportCenter) {
      x.value = EDGE_GAP
    } else {
      x.value = window.innerWidth - EDGE_GAP - size
    }

    savePosition({ left: x.value, bottom: y.value })
  }

  function onPointerDown(e: PointerEvent) {
    if (isMobile.value) return
    wasDragging.value = false
    isDragging.value = true
    dragStartX = e.clientX
    dragStartY = e.clientY
    dragStartLeft = x.value
    dragStartBottom = y.value

    const target = e.currentTarget as HTMLElement | null
    if (target) {
      target.setPointerCapture(e.pointerId)
    }
  }

  function onPointerMove(e: PointerEvent) {
    if (!isDragging.value) return
    const dx = e.clientX - dragStartX
    const dy = dragStartY - e.clientY
    const size = ballSize.value

    // 超过阈值才标记为拖拽（区分点击和拖拽）
    if (!wasDragging.value && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
      wasDragging.value = true
    }

    x.value = clamp(dragStartLeft + dx, 0, window.innerWidth - size)
    y.value = clamp(dragStartBottom + dy, EDGE_GAP, window.innerHeight - size)
  }

  function onPointerUp(_e: PointerEvent) {
    if (!isDragging.value) return
    isDragging.value = false
    if (wasDragging.value) {
      snapToEdge()
    }
  }

  function onResize() {
    isMobile.value = isMobileDevice()
    updateBoundaries()
  }

  onMounted(() => {
    updateBoundaries()
    window.addEventListener('resize', onResize)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', onResize)
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
  })

  return {
    x,
    y,
    ballSize,
    isDragging,
    wasDragging,
    onPointerDown,
    onPointerUp,
  }
}
