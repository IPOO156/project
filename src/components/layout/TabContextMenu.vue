<script setup lang="ts">
/**
 * TabContextMenu - 标签栏右键上下文菜单（关闭当前 / 关闭其他 / 关闭全部）
 *
 * 纯展示子组件：只负责菜单定位与渲染，具体的关闭/导航动作由父组件 NavTabs 处理。
 */
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  visible: boolean
  x: number
  y: number
  /** 右键命中的标签是否可关闭（决定「关闭当前」是否可用） */
  closable: boolean
  /** 是否存在可关闭的标签（决定「关闭全部」是否可用） */
  hasClosableTabs: boolean
}>()

const emit = defineEmits<{
  closeCurrent: []
  closeOthers: []
  closeAll: []
  /** 请求关闭菜单（Escape 或焦点离开时由父组件收起） */
  close: []
}>()

const menuRef = ref<HTMLElement>()

/** 当前可用菜单项：跳过 disabled 项，方向键只在可操作项之间移动 */
function focusableItems(): HTMLButtonElement[] {
  return Array.from(
    menuRef.value?.querySelectorAll<HTMLButtonElement>('.nav-tabs__menu-item:not(:disabled)') ?? [],
  )
}

watch(
  () => props.visible,
  async (visible) => {
    if (!visible) return
    await nextTick()
    focusableItems()[0]?.focus()
  },
)

function onKeydown(event: KeyboardEvent) {
  if (!props.visible) return
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
    return
  }
  const items = focusableItems()
  if (items.length === 0) return
  const index = items.indexOf(document.activeElement as HTMLButtonElement)
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    items[(index + 1) % items.length]?.focus()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    items[(index - 1 + items.length) % items.length]?.focus()
  } else if (event.key === 'Home') {
    event.preventDefault()
    items[0]?.focus()
  } else if (event.key === 'End') {
    event.preventDefault()
    items[items.length - 1]?.focus()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="menuRef"
      class="nav-tabs__menu"
      :style="{ top: `${y}px`, left: `${x}px` }"
      role="menu"
      @contextmenu.prevent
    >
      <button
        type="button"
        class="nav-tabs__menu-item"
        role="menuitem"
        :disabled="!closable"
        @click.stop="$emit('closeCurrent')"
      >
        关闭当前
      </button>
      <button
        type="button"
        class="nav-tabs__menu-item"
        role="menuitem"
        @click.stop="$emit('closeOthers')"
      >
        关闭其他
      </button>
      <button
        type="button"
        class="nav-tabs__menu-item"
        role="menuitem"
        :disabled="!hasClosableTabs"
        @click.stop="$emit('closeAll')"
      >
        关闭全部
      </button>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.nav-tabs__menu {
  position: fixed;
  z-index: $z-popover;
  min-width: 112px;
  padding: 4px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: $radius-base;
  background: var(--el-bg-color-overlay);
  box-shadow: $shadow-lg;
}

.nav-tabs__menu-item {
  display: block;
  width: 100%;
  padding: 6px 12px;
  border: 0;
  border-radius: $radius-sm;
  background: transparent;
  color: var(--el-text-color-primary);
  font-size: $font-size-base;
  line-height: 1.5;
  text-align: left;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--el-fill-color-light);
    color: var(--el-color-primary);
  }

  &:disabled {
    color: var(--el-text-color-disabled);
    cursor: not-allowed;
  }
}
</style>
