<script setup lang="ts">
/**
 * TeacherCommandPalette - 教师端 / 管理员端页内搜索（Ctrl / ⌘ + K）
 *
 * 首期只做页面跳转：条目来源与侧栏同源（已按权限过滤），
 * 支持按页面名、所属分组与模块说明模糊筛选，不请求后端。
 */
import type { Component } from 'vue'
import { CornerDownLeft, Search } from 'lucide-vue-next'
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTeacherAuthz } from '@/shared/composables/useTeacherAuthz'
import { teacherModules } from '@/shared/config/teacherModuleRegistry'

interface CommandItem {
  label: string
  sub: string
  path: string
  icon?: Component
}

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const router = useRouter()
const { menuGroups, canAccessModule } = useTeacherAuthz()

const query = ref('')
const activeIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)

const commands = computed<CommandItem[]>(() => {
  const items: CommandItem[] = menuGroups.value.flatMap((entry) =>
    entry.items.map((item) => {
      const mod = teacherModules.find((candidate) => candidate.id === item.moduleId)
      return {
        label: item.label,
        sub: mod?.description ?? entry.group.label,
        path: item.path ?? '',
        icon: item.icon,
      }
    }),
  )
  if (canAccessModule('messages')) {
    items.push({
      label: '消息中心',
      sub: teacherModules.find((mod) => mod.id === 'messages')?.description ?? '系统通知与提醒',
      path: '/teacher/messages',
    })
  }
  return items.filter((item) => item.path)
})

const results = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  if (!keyword) return commands.value
  return commands.value.filter((item) =>
    `${item.label} ${item.sub}`.toLowerCase().includes(keyword),
  )
})

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) return
    query.value = ''
    activeIndex.value = 0
    void nextTick(() => inputRef.value?.focus())
  },
)

watch(results, () => {
  activeIndex.value = 0
})

function close() {
  emit('update:modelValue', false)
}

function run(index: number) {
  const item = results.value[index]
  if (!item) return
  close()
  void router.push(item.path)
}

function onInputKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    close()
    return
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = Math.min(results.value.length - 1, activeIndex.value + 1)
    return
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = Math.max(0, activeIndex.value - 1)
    return
  }
  if (event.key === 'Enter') {
    event.preventDefault()
    run(activeIndex.value)
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="cmd-fade">
      <div v-if="modelValue" class="cmd-overlay" @click.self="close">
        <div class="cmd-panel" role="dialog" aria-modal="true" aria-label="页内搜索">
          <div class="cmd-input-row">
            <Search :size="17" class="cmd-input-row__icon" aria-hidden="true" />
            <input
              ref="inputRef"
              v-model="query"
              class="cmd-input"
              type="text"
              placeholder="搜索页面…"
              autocomplete="off"
              spellcheck="false"
              @keydown="onInputKeydown"
            />
            <kbd>Esc</kbd>
          </div>

          <div class="cmd-list">
            <button
              v-for="(item, index) in results"
              :key="item.path"
              type="button"
              class="cmd-item"
              :class="{ 'is-active': index === activeIndex }"
              @mouseenter="activeIndex = index"
              @click="run(index)"
            >
              <component :is="item.icon" v-if="item.icon" :size="16" class="cmd-item__icon" />
              <span v-else class="cmd-item__icon" />
              <span class="cmd-item__main">
                <span class="cmd-item__label">{{ item.label }}</span>
                <span class="cmd-item__sub">{{ item.sub }}</span>
              </span>
              <CornerDownLeft :size="14" class="cmd-item__enter" aria-hidden="true" />
            </button>

            <div v-if="!results.length" class="cmd-empty">
              没有找到匹配的页面
              <span>试试「档案」「导出」「审核」</span>
            </div>
          </div>

          <div class="cmd-foot">
            <span><kbd>↑</kbd> <kbd>↓</kbd> 选择</span>
            <span><kbd>Enter</kbd> 打开</span>
            <span><kbd>Esc</kbd> 关闭</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.cmd-overlay {
  position: fixed;
  inset: 0;
  z-index: $z-modal;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 14vh;
  background: rgba(15, 23, 42, 0.36);
}

.cmd-panel {
  width: min(560px, calc(100vw - 32px));
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.18);
  overflow: hidden;
}

.cmd-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);

  &__icon {
    color: var(--el-text-color-secondary);
    flex-shrink: 0;
  }

  kbd {
    flex-shrink: 0;
  }
}

.cmd-input {
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--el-text-color-primary);
  font-size: 14px;
  line-height: 22px;

  &::placeholder {
    color: var(--el-text-color-placeholder);
  }
}

.cmd-list {
  max-height: 360px;
  overflow-y: auto;
  padding: 6px;
}

.cmd-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  color: var(--el-text-color-primary);

  &.is-active {
    background: var(--el-color-primary-light-9);
  }

  &__icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    color: var(--el-text-color-secondary);
  }

  &__main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  &__label {
    font-size: 13px;
    line-height: 20px;
  }

  &__sub {
    font-size: 12px;
    line-height: 16px;
    color: var(--el-text-color-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__enter {
    flex-shrink: 0;
    color: var(--el-text-color-placeholder);
    opacity: 0;
  }

  &.is-active &__enter {
    opacity: 1;
  }
}

.cmd-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 28px 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);

  span {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }
}

.cmd-foot {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 14px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border: 1px solid var(--el-border-color);
  border-radius: 3px;
  background: var(--el-bg-color);
  font-family: inherit;
  font-size: 11px;
  line-height: 1;
  color: var(--el-text-color-secondary);
}

.cmd-fade-enter-active,
.cmd-fade-leave-active {
  transition: opacity 0.12s ease;
}

.cmd-fade-enter-from,
.cmd-fade-leave-to {
  opacity: 0;
}
</style>
