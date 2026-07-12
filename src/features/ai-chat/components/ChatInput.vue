<script setup lang="ts">
/**
 * ChatInput - 输入区
 *
 * - textarea 自适应高度（max 120px）
 * - 附件上传（10MB 限制，预览/删除）
 * - 语音输入（useVoiceInput，实时回显 transcript，权限/不支持降级提示）
 * - Enter 发送 / Shift+Enter 换行
 */
import { ElMessage } from 'element-plus'
import { Mic, Paperclip, Send, X } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useVoiceInput } from '../composables/useVoiceInput'

const props = defineProps<{
  loading: boolean
}>()

const emit = defineEmits<{
  send: [text: string, files: File[]]
  voiceToggle: []
}>()

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const inputValue = ref('')
const attachments = ref<File[]>([])
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const {
  isRecording,
  transcript,
  isSupported: voiceSupported,
  toggle: toggleVoice,
} = useVoiceInput({
  onFinal: (text) => {
    if (!text) return
    inputValue.value = inputValue.value ? `${inputValue.value} ${text}`.trim() : text
  },
  onError: (msg) => ElMessage.warning(msg),
})

const displayText = computed(() => (isRecording.value ? transcript.value : inputValue.value))

function onInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  inputValue.value = target.value
  autoResize()
}

const canSend = computed(() => inputValue.value.trim().length > 0 && !props.loading)

/** textarea 自适应高度 */
function autoResize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 120)}px`
}

function handleKeydown(e: KeyboardEvent) {
  // Enter 发送，Shift+Enter 换行
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function handleSend() {
  const text = inputValue.value.trim()
  if (!text || props.loading) return
  emit('send', text, attachments.value)
  // 清空
  inputValue.value = ''
  attachments.value = []
  nextTickReset()
}

function nextTickReset() {
  // 重置 textarea 高度
  requestAnimationFrame(() => {
    const el = textareaRef.value
    if (el) el.style.height = 'auto'
  })
}

/** 附件选择 */
function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  const files = Array.from(input.files)
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      ElMessage.error(`文件「${file.name}」超过 10MB 限制`)
      continue
    }
    attachments.value.push(file)
  }
  // 重置 input 以便重复选择同一文件
  input.value = ''
}

function removeAttachment(idx: number) {
  attachments.value.splice(idx, 1)
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function handleVoiceClick() {
  if (!voiceSupported.value) {
    ElMessage.warning('当前环境不支持语音输入，请使用 HTTPS/localhost 下的最新版 Chrome 或 Edge')
    return
  }
  toggleVoice()
  emit('voiceToggle')
}
</script>

<template>
  <div class="ci">
    <!-- 语音录制状态条 -->
    <Transition name="voice">
      <div v-if="isRecording" class="ci__voice-status">
        <span class="ci__voice-dot" />
        正在聆听…{{ transcript ? `「${transcript}」` : '' }}
      </div>
    </Transition>

    <!-- 附件预览条 -->
    <Transition name="attach">
      <div v-if="attachments.length" class="ci__attach">
        <div v-for="(file, i) in attachments" :key="i" class="ci__attach-item">
          <Paperclip :size="13" />
          <span class="ci__attach-name" :title="file.name">{{ file.name }}</span>
          <span class="ci__attach-size">{{ formatSize(file.size) }}</span>
          <button class="ci__attach-remove" title="移除" @click="removeAttachment(i)">
            <X :size="12" />
          </button>
        </div>
      </div>
    </Transition>

    <!-- 输入栏 -->
    <div class="ci__bar" :class="{ 'is-recording': isRecording }">
      <!-- 附件按钮 -->
      <button class="ci__btn" title="添加附件" @click="fileInputRef?.click()">
        <Paperclip :size="18" />
      </button>
      <input
        ref="fileInputRef"
        type="file"
        multiple
        class="ci__file-input"
        @change="handleFileChange"
      />

      <!-- 语音按钮 -->
      <button
        class="ci__btn"
        :class="{ 'is-recording': isRecording }"
        :title="voiceSupported ? '语音输入' : '当前环境不支持语音输入'"
        @click="handleVoiceClick"
      >
        <Mic :size="18" />
      </button>

      <!-- textarea -->
      <textarea
        ref="textareaRef"
        :value="displayText"
        class="ci__textarea"
        rows="1"
        placeholder="输入你的问题…（Enter 发送，Shift+Enter 换行）"
        @input="onInput"
        @keydown="handleKeydown"
      />

      <!-- 发送按钮 -->
      <button class="ci__send" :disabled="!canSend" title="发送" @click="handleSend">
        <Send :size="18" />
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.ci {
  flex-shrink: 0;
  padding: $spacing-sm $spacing-xl $spacing-md;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);

  &__voice-status {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-xs $spacing-md;
    margin-bottom: $spacing-sm;
    background: rgba($color-danger, 0.08);
    border-radius: $radius-base;
    font-size: $font-size-sm;
    color: $color-danger;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__voice-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: $color-danger;
    flex-shrink: 0;
    animation: voicePulse 1s $ease-standard infinite;
  }

  &__attach {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
    margin-bottom: $spacing-sm;
  }

  &__attach-item {
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-xs $spacing-sm;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: $radius-base;
    font-size: $font-size-xs;
    color: var(--el-text-color-regular);
    max-width: 240px;
  }

  &__attach-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__attach-size {
    color: var(--el-text-color-secondary);
    flex-shrink: 0;
  }

  &__attach-remove {
    border: none;
    background: transparent;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    display: flex;
    padding: 0;

    &:hover {
      color: $color-danger;
    }
  }

  &__bar {
    display: flex;
    align-items: flex-end;
    gap: $spacing-sm;
    padding: $spacing-sm;
    background: var(--el-bg-color-page);
    border: 1px solid var(--el-border-color);
    border-radius: $radius-xl;
    transition: border-color $duration-fast $ease-standard;

    &:focus-within {
      border-color: var(--mc-primary);
    }

    &.is-recording {
      border-color: $color-danger;
    }
  }

  &__file-input {
    display: none;
  }

  &__btn {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    border-radius: $radius-base;
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

    &.is-recording {
      color: $color-danger;
      background: rgba($color-danger, 0.1);
    }
  }

  &__textarea {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    resize: none;
    font-family: inherit;
    font-size: $font-size-base;
    line-height: 1.6;
    color: var(--el-text-color-primary);
    max-height: 120px;
    padding: $spacing-xs $spacing-xs 0;
    min-width: 0;

    &::placeholder {
      color: var(--el-text-color-placeholder);
    }
  }

  &__send {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--mc-accent), var(--mc-accent-light));
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all $duration-fast $ease-standard;

    &:hover:not(:disabled) {
      transform: scale(1.05);
    }

    &:disabled {
      background: var(--el-fill-color);
      color: var(--el-text-color-placeholder);
      cursor: not-allowed;
    }
  }
}

/* 语音录制状态脉冲（状态指示，非装饰发光） */
@keyframes voicePulse {
  0%,
  100% {
    opacity: 0.5;
    transform: scale(1);
  }

  50% {
    opacity: 1;
    transform: scale(1.3);
  }
}

.voice-enter-active,
.voice-leave-active,
.attach-enter-active,
.attach-leave-active {
  transition: all $duration-fast $ease-standard;
}

.voice-enter-from,
.voice-leave-to,
.attach-enter-from,
.attach-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
