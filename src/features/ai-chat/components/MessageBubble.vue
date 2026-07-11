<script setup lang="ts">
import type { ChatMessage } from '../types'
/**
 * MessageBubble - 单条消息气泡
 *
 * - ai 消息：左侧头像（Sparkles 图标），有 richContent 时渲染 RichContentRenderer，否则纯文本
 * - user 消息：右侧头像（取姓名首字），气泡右对齐
 * - hover 显示操作：复制 / 有用 / 无用（由 showFeedback 控制后三项）
 */
import { Copy, Sparkles, ThumbsDown, ThumbsUp } from 'lucide-vue-next'
import { computed } from 'vue'
import RichContentRenderer from './RichContentRenderer.vue'

const props = defineProps<{
  message: ChatMessage
  /** 用户姓名（取首字作头像） */
  userName: string
  /** 是否显示反馈操作（有用/无用/复制） */
  showFeedback: boolean
}>()

const emit = defineEmits<{
  feedback: [type: 'useful' | 'useless']
  copy: []
}>()

const isAi = computed(() => props.message.role === 'ai')

/** 用户头像首字 */
const userInitial = computed(() => {
  const name = props.userName || '我'
  return name.trim().charAt(0).toUpperCase()
})

const showActions = computed(() => isAi.value && props.showFeedback)

async function handleCopy() {
  try {
    const text = props.message.richContent
      ? props.message.content // content 已是 richToPlain 生成的纯文本摘要
      : props.message.content
    await navigator.clipboard.writeText(text)
  } catch {
    // 降级：不阻断，仍触发 copy 事件让父组件提示
  }
  emit('copy')
}
</script>

<template>
  <div class="mb" :class="{ 'mb--ai': isAi, 'mb--user': !isAi }">
    <!-- 头像 -->
    <div class="mb__avatar" :class="isAi ? 'mb__avatar--ai' : 'mb__avatar--user'">
      <Sparkles v-if="isAi" :size="18" />
      <span v-else>{{ userInitial }}</span>
    </div>

    <!-- 气泡 + meta + actions -->
    <div class="mb__col">
      <div class="mb__bubble" :class="isAi ? 'mb__bubble--ai' : 'mb__bubble--user'">
        <RichContentRenderer v-if="isAi && message.richContent" :content="message.richContent" />
        <p v-else class="mb__text">{{ message.content }}</p>
      </div>

      <div class="mb__footer">
        <span class="mb__time">{{ message.time }}</span>

        <!-- 操作区（仅 ai 消息且开启反馈时显示） -->
        <div v-if="showActions" class="mb__actions">
          <button
            class="mb__action"
            :class="{ 'is-active': message.feedback === 'useful' }"
            title="有用"
            @click="emit('feedback', 'useful')"
          >
            <ThumbsUp :size="13" />
          </button>
          <button
            class="mb__action"
            :class="{ 'is-active': message.feedback === 'useless' }"
            title="无用"
            @click="emit('feedback', 'useless')"
          >
            <ThumbsDown :size="13" />
          </button>
          <button class="mb__action" title="复制" @click="handleCopy">
            <Copy :size="13" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mb {
  display: flex;
  gap: $spacing-sm;
  max-width: 78%;

  &--user {
    flex-direction: row-reverse;
    margin-left: auto;
  }

  &__avatar {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: $font-size-sm;
    font-weight: 600;

    &--ai {
      background: linear-gradient(135deg, var(--mc-primary), var(--mc-primary-light));
    }

    &--user {
      background: linear-gradient(135deg, var(--mc-accent), var(--mc-accent-light));
    }
  }

  &__col {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
    min-width: 0;
  }

  &--user &__col {
    align-items: flex-end;
  }

  &__bubble {
    padding: $spacing-sm $spacing-md;
    border-radius: $radius-lg;
    word-break: break-word;

    &--ai {
      background: var(--el-bg-color);
      border: 1px solid var(--el-border-color-light);
      border-top-left-radius: $radius-sm;
      box-shadow: $shadow-sm;
    }

    &--user {
      background: linear-gradient(135deg, var(--mc-primary), var(--mc-primary-light));
      color: #fff;
      border-top-right-radius: $radius-sm;
    }
  }

  &__text {
    margin: 0;
    line-height: 1.7;
  }

  &__footer {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    min-height: 18px;
  }

  &__time {
    font-size: $font-size-xs;
    color: var(--el-text-color-placeholder);
  }

  &__actions {
    display: flex;
    gap: 2px;
    opacity: 0;
    transition: opacity $duration-fast $ease-standard;
  }

  &:hover &__actions {
    opacity: 1;
  }

  &__action {
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    border-radius: $radius-sm;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all $duration-fast $ease-standard;

    &:hover {
      background: var(--el-fill-color-light);
      color: var(--mc-primary);
    }

    &.is-active {
      color: var(--mc-accent);
    }
  }
}
</style>
