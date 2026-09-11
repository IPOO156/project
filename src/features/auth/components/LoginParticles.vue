<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useThemeStore } from '@/app/stores/stores'

const emit = defineEmits<{
  mousemove: [pos: { x: number; y: number }]
}>()

const themeStore = useThemeStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationId: number | null = null
let particles: Particle[] = []
const mouseX = ref(0)
const mouseY = ref(0)

/* ===================== 粒子系统 ===================== */
class Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  hue: number
  canvas: HTMLCanvasElement
  twinkleSpeed: number
  twinkleOffset: number

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.x = Math.random() * canvas.width
    this.y = Math.random() * canvas.height
    this.size = Math.random() * 1.8 + 0.4
    this.speedX = (Math.random() - 0.5) * 0.15
    this.speedY = Math.random() * 0.2 + 0.04
    this.opacity = Math.random() * 0.4 + 0.12
    this.hue = Math.random() * 30 + 35
    this.twinkleSpeed = Math.random() * 0.018 + 0.004
    this.twinkleOffset = Math.random() * Math.PI * 2
  }

  update(mx: number, my: number, time: number) {
    const dx = this.x - mx
    const dy = this.y - my
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 140) {
      const force = (140 - dist) / 140
      this.speedX += (dx / dist) * force * 0.03
      this.speedY += (dy / dist) * force * 0.03
    }
    this.speedX *= 0.986
    this.speedY *= 0.986
    this.speedY += 0.004
    this.x += this.speedX
    this.y += this.speedY
    this.opacity = 0.12 + Math.sin(time * this.twinkleSpeed + this.twinkleOffset) * 0.18 + 0.08
    if (this.y > this.canvas.height + 10) {
      this.y = -10
      this.x = Math.random() * this.canvas.width
    }
    if (this.x > this.canvas.width + 10) this.x = -10
    if (this.x < -10) this.x = this.canvas.width + 10
  }

  draw(ctx: CanvasRenderingContext2D, isDark: boolean) {
    const alpha = Math.max(0.06, Math.min(0.6, this.opacity))
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    const c = isDark
      ? `hsla(${this.hue}, 85%, 78%, ${alpha})`
      : `hsla(215, 90%, 58%, ${alpha * 0.7})`
    ctx.fillStyle = c
    ctx.fill()
  }
}

function resizeCanvas() {
  const c = canvasRef.value
  if (!c) return
  c.width = window.innerWidth
  c.height = window.innerHeight
}

function initParticles() {
  const c = canvasRef.value
  if (!c) return
  particles = []
  const count = Math.floor((c.width * c.height) / 20000)
  for (let i = 0; i < Math.min(count, 70); i++) particles.push(new Particle(c))
}

let animTime = 0
function animate() {
  const c = canvasRef.value
  if (!c) return
  const ctx = c.getContext('2d')
  if (!ctx) return
  animTime += 1
  ctx.clearRect(0, 0, c.width, c.height)
  particles.forEach((p) => {
    p.update(mouseX.value, mouseY.value, animTime)
    p.draw(ctx, themeStore.isDark)
  })
  animationId = requestAnimationFrame(animate)
}

function handleMouseMove(e: MouseEvent) {
  mouseX.value = e.clientX
  mouseY.value = e.clientY
  emit('mousemove', { x: e.clientX, y: e.clientY })
}

/* ===================== 生命周期 ===================== */
onMounted(() => {
  nextTick(() => {
    resizeCanvas()
    initParticles()
    animate()
  })
  window.addEventListener('resize', resizeCanvas)
  window.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('mousemove', handleMouseMove)
})
</script>

<template>
  <canvas ref="canvasRef" class="login__particles"></canvas>
</template>

<style scoped lang="scss">
.login__particles {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
</style>
