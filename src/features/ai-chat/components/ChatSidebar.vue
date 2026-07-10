<script setup lang="ts">
import type { Conversation } from '../types'
/**
 * ChatSidebar - 左侧历史对话栏
 *
 * - 顶部品牌标识
 * - 新建对话按钮
 * - 历史对话列表（active 高亮 + 左侧金条 + hover 删除）
 * - 底部用户信息 + 设置入口
 */
import { MessageSquare, Plus, Settings, Sparkles, Trash2 } from 'lucide-vue-next'

const props = defineProps<{
  conversations: Conversation[]
  currentId: string | null
  userName: string
  userAvatar?: string
  userRole?: string
}>()

const emit = defineEmits<{
  newchat: []
  switch: [id: string]
  delete: [id: string]
  opensettings: []
}>()

function handleDelete(e: MouseEvent, id: string) {
  e.stopPropagation()
  emit('delete', id)
}
</script>

<template>
  <aside class="cs">
    <!-- 品牌标识 -->
    <div class="cs__brand">
      <div class="cs__brand-icon">
        <Sparkles :size="18" />
      </div>
      <div class="cs__brand-text">
        <div class="cs__brand-title">档案智能助手</div>
        <div class="cs__brand-sub">Smart Archive Assistant</div>
      </div>
    </div>

    <!-- 新建对话 -->
    <button class="cs__new" @click="emit('newchat')">
      <Plus :size="16" />
      <span>新建对话</span>
    </button>

    <!-- 历史列表 -->
    <div class="cs__history">
      <div class="cs__history-label">
        <MessageSquare :size="13" />
        历史对话
      </div>

      <div v-if="props.conversations.length === 0" class="cs__empty">暂无历史对话</div>

      <ul v-else class="cs__list">
        <li
          v-for="conv in props.conversations"
          :key="conv.id"
          class="cs__item"
          :class="{ 'is-active': conv.id === props.currentId }"
          :title="conv.title"
          @click="emit('switch', conv.id)"
        >
          <span class="cs__item-title">{{ conv.title }}</span>
          <span class="cs__item-time">{{ conv.createTime }}</span>
          <button class="cs__item-del" title="删除" @click="handleDelete($event, conv.id)">
            <Trash2 :size="13" />
          </button>
        </li>
      </ul>
    </div>

    <!-- 底部用户信息 + 设置 -->
    <div class="cs__footer">
      <div class="cs__user">
        <div class="cs__user-avatar">
          <img v-if="props.userAvatar" :src="props.userAvatar" alt="头像" />
          <span v-else>{{ (props.userName || '我').charAt(0) }}</span>
        </div>
        <div class="cs__user-info">
          <div class="cs__user-name">
            {{ props.userName || '同学' }}
          </div>
          <div class="cs__user-role">
            {{ props.userRole || '学生' }}
          </div>
        </div>
        <button class="cs__settings" title="设置" @click="emit('opensettings')">
          <Settings :size="16" />
        </button>
      </div>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.cs {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-lighter);
  overflow: hidden;

  &__brand {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-lg $spacing-md;
    flex-shrink: 0;
  }

  &__brand-icon {
    width: 36px;
    height: 36px;
    border-radius: $radius-lg;
    background: linear-gradient(135deg, var(--mc-primary), var(--mc-primary-light));
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__brand-title {
    font-size: $font-size-sm;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__brand-sub {
    font-size: 10px;
    color: var(--el-text-color-secondary);
    letter-spacing: 0.3px;
  }

  &__new {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    margin: 0 $spacing-md $spacing-sm;
    padding: $spacing-sm $spacing-md;
    border: 1px dashed var(--el-border-color);
    background: var(--el-bg-color);
    border-radius: $radius-base;
    font-size: $font-size-sm;
    color: var(--el-text-color-regular);
    cursor: pointer;
    transition: all $duration-fast $ease-standard;
    flex-shrink: 0;

    &:hover {
      border-color: var(--mc-accent);
      color: var(--mc-primary);
      background: color-mix(in srgb, var(--mc-accent) 6%, transparent);
    }
  }

  &__history {
    flex: 1;
    overflow-y: auto;
    padding: 0 $spacing-sm;
    min-height: 0;
  }

  &__history-label {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-sm $spacing-sm $spacing-xs;
    font-size: $font-size-xs;
    color: var(--el-text-color-secondary);
    font-weight: 500;
  }

  &__empty {
    padding: $spacing-xl $spacing-md;
    text-align: center;
    font-size: $font-size-xs;
    color: var(--el-text-color-placeholder);
  }

  &__list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__item {
    position: relative;
    padding: $spacing-sm $spacing-md;
    padding-right: 32px;
    border-radius: $radius-base;
    cursor: pointer;
    transition: background $duration-fast $ease-standard;
    display: flex;
    flex-direction: column;
    gap: 2px;

    &:hover {
      background: var(--el-fill-color-light);
    }

    &.is-active {
      background: var(--el-fill-color);

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 60%;
        background: var(--mc-accent);
        border-radius: 2px;
      }
    }
  }

  &__item-title {
    font-size: $font-size-sm;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__item-time {
    font-size: $font-size-xs;
    color: var(--el-text-color-secondary);
  }

  &__item-del {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    width: 22px;
    height: 22px;
    border: none;
    background: transparent;
    border-radius: $radius-sm;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: all $duration-fast $ease-standard;

    &:hover {
      background: rgba($color-danger, 0.1);
      color: $color-danger;
    }
  }

  &__item:hover &__item-del {
    opacity: 1;
  }

  &__footer {
    flex-shrink: 0;
    padding: $spacing-sm;
    border-top: 1px solid var(--el-border-color-lighter);
  }

  &__user {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-xs $spacing-sm;
    border-radius: $radius-base;
  }

  &__user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--mc-accent), var(--mc-accent-light));
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: $font-size-sm;
    font-weight: 600;
    overflow: hidden;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__user-info {
    flex: 1;
    min-width: 0;
  }

  &__user-name {
    font-size: $font-size-sm;
    color: var(--el-text-color-primary);
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__user-role {
    font-size: $font-size-xs;
    color: var(--el-text-color-secondary);
  }

  &__settings {
    width: 30px;
    height: 30px;
    border: none;
    background: transparent;
    border-radius: $radius-base;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all $duration-fast $ease-standard;

    &:hover {
      background: var(--el-fill-color-light);
      color: var(--mc-primary);
    }
  }
}
</style>
