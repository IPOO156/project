<script setup lang="ts">
import type { ExportFormat } from '../types'
/**
 * ExportMenu - 导出格式下拉菜单（TXT / MD / PDF）
 *
 * 点击外部自动关闭；选中后 emit select 并关闭
 */
import { FileText, FileType2, Printer } from 'lucide-vue-next'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  select: [format: ExportFormat]
  close: []
}>()

const rootRef = ref<HTMLElement | null>(null)

const options: Array<{ format: ExportFormat; label: string; desc: string; icon: typeof FileText }> =
  [
    { format: 'txt', label: '导出为 TXT', desc: '纯文本格式', icon: FileText },
    { format: 'md', label: '导出为 Markdown', desc: '.md 格式', icon: FileType2 },
    { format: 'pdf', label: '导出为 PDF', desc: '打印另存', icon: Printer },
  ]

function handleSelect(format: ExportFormat) {
  emit('select', format)
  emit('close')
}

function handleClickOutside(e: MouseEvent) {
  if (props.visible && rootRef.value && !rootRef.value.contains(e.target as Node)) {
    emit('close')
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>

<template>
  <div ref="rootRef" class="em">
    <Transition name="em">
      <div v-if="props.visible" class="em__panel">
        <button
          v-for="opt in options"
          :key="opt.format"
          class="em__item"
          @click="handleSelect(opt.format)"
        >
          <span class="em__icon"><component :is="opt.icon" :size="16" /></span>
          <span class="em__text">
            <span class="em__label">{{ opt.label }}</span>
            <span class="em__desc">{{ opt.desc }}</span>
          </span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.em {
  position: relative;

  &__panel {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    min-width: 200px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-light);
    border-radius: $radius-lg;
    box-shadow: $shadow-lg;
    padding: $spacing-xs;
    z-index: $z-popover;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md;
    border: none;
    background: transparent;
    border-radius: $radius-base;
    cursor: pointer;
    text-align: left;
    transition: background $duration-fast $ease-standard;

    &:hover {
      background: var(--el-fill-color-light);
    }
  }

  &__icon {
    color: var(--mc-accent);
    display: flex;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  &__label {
    font-size: $font-size-sm;
    color: var(--el-text-color-primary);
    font-weight: 500;
  }

  &__desc {
    font-size: $font-size-xs;
    color: var(--el-text-color-secondary);
  }
}

.em-enter-active,
.em-leave-active {
  transition: all $duration-fast $ease-standard;
}

.em-enter-from,
.em-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
