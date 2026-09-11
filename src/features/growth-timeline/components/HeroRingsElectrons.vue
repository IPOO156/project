<script setup lang="ts">
import type { ElectronItem } from './HeroRings.types'

interface Props {
  electrons: ElectronItem[]
  selectedId?: string | null
  visible: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selectedId: null,
})

const emit = defineEmits<{
  enter: [event: MouseEvent, electron: ElectronItem]
  move: [event: MouseEvent]
  leave: []
  click: [event: MouseEvent, id: string]
}>()
</script>

<template>
  <div class="hero-rings__electrons-layer">
    <div
      v-for="electron in electrons"
      :key="electron.id"
      class="hero-rings__electron-orbit"
      :class="{
        'is-selected': props.selectedId === electron.id,
        'is-visible': visible,
      }"
      :style="{
        // 每个电子的轨道半径、旋转角度、学期层级均为动态计算，只能用内联样式注入 CSS 变量
        '--orbit-radius': `${electron.radius}px`,
        '--electron-angle': `${electron.angle}deg`,
        '--electron-level': electron.level,
      }"
    >
      <button
        class="hero-rings__electron"
        :style="{
          // 电子颜色随所属学期环动态变化
          '--electron-color': electron.color,
        }"
        @click.stop="emit('click', $event, electron.id)"
        @mouseenter="emit('enter', $event, electron)"
        @mousemove="emit('move', $event)"
        @mouseleave="emit('leave')"
      >
        <span class="hero-rings__electron-visual" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.hero-rings__electrons-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 4;
}

.hero-rings__electron-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  transform: translate(-50%, -50%) rotate(var(--electron-angle, 0deg));
  pointer-events: none;
}

.hero-rings__electron {
  --electron-y: calc(var(--orbit-radius, 100px) * var(--hero-scale) * -1);
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  pointer-events: auto;
  background: transparent;
  opacity: 0;
  transform: translate(-50%, -50%) translateY(var(--electron-y)) scale(0);
}

.hero-rings__electron-orbit.is-visible .hero-rings__electron {
  animation: electronPopIn 0.55s cubic-bezier(0.16, 1.6, 0.3, 1) forwards;
  animation-delay: calc((var(--electron-level, 1) - 1) * 0.12s);
}

@keyframes electronPopIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) translateY(var(--electron-y)) scale(0);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) translateY(var(--electron-y)) scale(1);
  }
}

.hero-rings__electron::after {
  content: '';
  position: absolute;
  inset: -14px;
  border-radius: 50%;
  background: transparent;
}

.hero-rings__electron-visual {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
    radial-gradient(ellipse at 22% 16%, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0) 28%),
    radial-gradient(ellipse at 28% 24%, rgba(255, 252, 247, 0.78) 0%, rgba(255, 252, 247, 0) 46%),
    radial-gradient(
      circle at 34% 34%,
      #fff8e8 0%,
      var(--electron-color, #c8943e) 45%,
      #7a5235 80%,
      #3d2416 100%
    );
  box-shadow:
    inset -5px -5px 12px rgba(0, 0, 0, 0.42),
    inset 4px 4px 10px rgba(255, 252, 247, 0.68),
    inset 0 0 8px rgba(0, 0, 0, 0.14),
    0 0 0 1.5px rgba(255, 252, 247, 0.5),
    0 0 0 3px rgba(255, 252, 247, 0.22),
    0 6px 14px rgba(0, 0, 0, 0.18);
  transition:
    transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.4s ease;
  will-change: transform, box-shadow;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-rings__electron-visual::before {
  content: '';
  position: absolute;
  top: 12%;
  left: 16%;
  width: 34%;
  height: 26%;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 255, 255, 0) 70%
  );
  filter: blur(0.4px);
  transform: rotate(-40deg);
  pointer-events: none;
}

.hero-rings__electron:hover .hero-rings__electron-visual,
.hero-rings__electron-orbit.is-selected .hero-rings__electron-visual {
  transform: scale(1.45);
  box-shadow:
    inset -5px -5px 14px rgba(0, 0, 0, 0.34),
    inset 4px 4px 12px rgba(255, 252, 247, 0.72),
    inset 0 0 10px rgba(0, 0, 0, 0.12),
    0 0 0 2px rgba(255, 252, 247, 0.65),
    0 0 0 5px rgba(255, 252, 247, 0.25),
    0 8px 20px rgba(0, 0, 0, 0.2);
}

html.dark .hero-rings__electron-visual {
  filter: brightness(1.15);
}
</style>
