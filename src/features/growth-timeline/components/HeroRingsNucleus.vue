<script setup lang="ts">
import { Plus } from 'lucide-vue-next'

const emit = defineEmits<{
  add: []
}>()
</script>

<template>
  <div class="hero-rings__nucleus" @click="emit('add')">
    <div class="hero-rings__nucleus-ring hero-rings__nucleus-ring--1" />
    <div class="hero-rings__nucleus-ring hero-rings__nucleus-ring--2" />
    <div class="hero-rings__nucleus-ring hero-rings__nucleus-ring--3" />
    <button class="hero-rings__nucleus-core" aria-label="添加经历" @click.stop="emit('add')">
      <Plus :size="20" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.hero-rings__nucleus {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80px;
  height: 80px;
  transform: translate(-50%, -50%);
  cursor: pointer;
  z-index: 5;
}

.hero-rings__nucleus-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1.5px solid var(--bark-light, #8b6340);
  opacity: 0.4;
  animation: nucleusBreath 4s ease-in-out infinite;
}

.hero-rings__nucleus-ring--2 {
  inset: 8px;
  opacity: 0.25;
  animation-delay: 1s;
}

.hero-rings__nucleus-ring--3 {
  inset: 16px;
  opacity: 0.15;
  animation-delay: 2s;
}

@keyframes nucleusBreath {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.4;
  }
  50% {
    transform: scale(1.08);
    opacity: 0.2;
  }
}

.hero-rings__nucleus-core {
  position: absolute;
  inset: 22px;
  border-radius: 50%;
  border: none;
  background: radial-gradient(
    circle at 30% 30%,
    var(--bark-soft, #a88560),
    var(--bark-mid, #5c3d28)
  );
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bg-parchment, #f4efe6);
  box-shadow: 0 4px 20px rgba(92, 61, 40, 0.25);
  transition: transform 0.3s ease;
  cursor: pointer;
}

.hero-rings__nucleus:hover .hero-rings__nucleus-core,
.hero-rings__nucleus-core:hover {
  transform: scale(1.1);
}
</style>
