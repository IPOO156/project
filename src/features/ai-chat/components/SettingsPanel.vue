<script setup lang="ts">
import type { Component } from 'vue'
import type { ChatSettings } from '../types'
/**
 * SettingsPanel - 右侧滑入设置面板
 *
 * 三个 toggle：思考动画 / 快捷问题 / 消息反馈
 * 切换即 emit update，父组件负责持久化（useChatSettings）
 */
import { Brain, MessageSquare, Sparkles, X } from 'lucide-vue-next'

const props = defineProps<{
  visible: boolean
  settings: ChatSettings
}>()

const emit = defineEmits<{
  update: [key: keyof ChatSettings, value: boolean]
  close: []
}>()

interface ToggleItem {
  key: keyof ChatSettings
  label: string
  desc: string
  icon: Component
}

const toggles: ToggleItem[] = [
  { key: 'thinking', label: '思考动画', desc: 'AI 回复前显示思考动效', icon: Brain },
  { key: 'quick', label: '快捷问题', desc: '显示常见问题推荐', icon: Sparkles },
  { key: 'feedback', label: '消息反馈', desc: '显示有用/无用/复制操作', icon: MessageSquare },
]

function onToggle(key: keyof ChatSettings, value: boolean) {
  emit('update', key, value)
}
</script>

<template>
  <Transition name="panel">
    <aside v-if="props.visible" class="sp">
      <header class="sp__header">
        <h3 class="sp__title">助手设置</h3>
        <button class="sp__close" title="关闭" @click="emit('close')">
          <X :size="18" />
        </button>
      </header>

      <div class="sp__body">
        <section class="sp__section">
          <h4 class="sp__section-title">显示偏好</h4>
          <div class="sp__list">
            <div v-for="item in toggles" :key="item.key" class="sp__item">
              <div class="sp__item-icon"><component :is="item.icon" :size="18" /></div>
              <div class="sp__item-text">
                <span class="sp__item-label">{{ item.label }}</span>
                <span class="sp__item-desc">{{ item.desc }}</span>
              </div>
              <label class="sp__switch">
                <input
                  type="checkbox"
                  :checked="props.settings[item.key]"
                  @change="onToggle(item.key, ($event.target as HTMLInputElement).checked)"
                />
                <span class="sp__slider" />
              </label>
            </div>
          </div>
        </section>

        <section class="sp__section">
          <h4 class="sp__section-title">关于</h4>
          <div class="sp__about">
            <p>档案智能助手 V2.0</p>
            <p class="sp__about-sub">
              基于学生端档案管理系统知识库，提供档案申报、成长记录、审批流程等智能问答。
            </p>
          </div>
        </section>
      </div>
    </aside>
  </Transition>
</template>

<style scoped lang="scss">
.sp {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 320px;
  max-width: 90vw;
  background: var(--el-bg-color);
  box-shadow: $shadow-lg;
  z-index: $z-modal;
  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-md $spacing-lg;
    border-bottom: 1px solid var(--el-border-color-lighter);
    flex-shrink: 0;
  }

  &__title {
    margin: 0;
    font-size: $font-size-lg;
    color: var(--el-text-color-primary);
  }

  &__close {
    width: 32px;
    height: 32px;
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
      color: var(--el-text-color-primary);
    }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: $spacing-lg;
    display: flex;
    flex-direction: column;
    gap: $spacing-xl;
  }

  &__section-title {
    margin: 0 0 $spacing-sm;
    font-size: $font-size-xs;
    color: var(--el-text-color-secondary);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md;
    border-radius: $radius-lg;
    background: var(--el-fill-color-light);
  }

  &__item-icon {
    color: var(--mc-primary);
    display: flex;
  }

  &__item-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  &__item-label {
    font-size: $font-size-sm;
    color: var(--el-text-color-primary);
    font-weight: 500;
  }

  &__item-desc {
    font-size: $font-size-xs;
    color: var(--el-text-color-secondary);
  }

  &__about {
    padding: $spacing-md;
    background: var(--el-fill-color-light);
    border-radius: $radius-lg;
    font-size: $font-size-sm;
    color: var(--el-text-color-regular);
    line-height: 1.7;

    p {
      margin: 0;
    }
  }

  &__about-sub {
    margin-top: $spacing-xs !important;
    font-size: $font-size-xs;
    color: var(--el-text-color-secondary);
  }

  /* 自定义开关 */
  &__switch {
    position: relative;
    display: inline-block;
    width: 38px;
    height: 22px;
    flex-shrink: 0;
    cursor: pointer;

    input {
      opacity: 0;
      width: 0;
      height: 0;
    }
  }

  &__slider {
    position: absolute;
    inset: 0;
    background: var(--el-border-color);
    border-radius: 11px;
    transition: background $duration-fast $ease-standard;

    &::before {
      content: '';
      position: absolute;
      width: 16px;
      height: 16px;
      left: 3px;
      top: 3px;
      background: #fff;
      border-radius: 50%;
      transition: transform $duration-fast $ease-standard;
      box-shadow: $shadow-sm;
    }
  }

  &__switch input:checked + &__slider {
    background: var(--mc-accent);
  }

  &__switch input:checked + &__slider::before {
    transform: translateX(16px);
  }
}

.panel-enter-active,
.panel-leave-active {
  transition: transform $duration-slow $ease-emphasized;
}

.panel-enter-from,
.panel-leave-to {
  transform: translateX(100%);
}
</style>
