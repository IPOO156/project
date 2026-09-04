<script setup lang="ts">
import { Sparkles, User } from 'lucide-vue-next'

defineOptions({ name: 'ChatAvatar' })

const props = withDefaults(
  defineProps<{
    src?: string
    role: 'user' | 'ai'
  }>(),
  {
    src: undefined,
  },
)
</script>

<template>
  <div class="ca" :class="{ 'ca--ai': props.role === 'ai', 'ca--user': props.role === 'user' }">
    <template v-if="props.role === 'ai'">
      <Sparkles :size="16" class="ca__icon" />
    </template>
    <template v-else>
      <img v-if="props.src" :src="props.src" alt="用户头像" class="ca__img" />
      <User v-else :size="16" class="ca__icon" />
    </template>
  </div>
</template>

<style scoped lang="scss">
.ca {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;

  &--ai {
    background: linear-gradient(135deg, var(--mc-primary) 0%, var(--mc-primary-light) 100%);
    color: #fff;
  }

  &--user {
    background: var(--mc-primary);
    color: #fff;
  }

  &__icon {
    display: block;
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
</style>
