<script setup lang="ts">
/**
 * PageTabs - 多标签页导航栏
 *
 * 仿浏览器/IDE 标签风格，位于 HeaderBar 下方、页面内容上方。
 * 点击侧边栏自动添加标签，支持点击切换、关闭当前/其他/全部。
 */
import { useRouter } from 'vue-router'
import { useAppStore } from '@/app/stores/stores'
import { X } from 'lucide-vue-next'

const router = useRouter()
const appStore = useAppStore()

function handleTabClick(path: string) {
  if (appStore.activeTabPath !== path) {
    appStore.activeTabPath = path
    router.push(path)
  }
}

function handleCloseTab(e: MouseEvent, path: string) {
  e.stopPropagation()
  const currentActive = appStore.activeTabPath
  appStore.closeTab(path)
  // 若关闭的是当前标签，导航到相邻标签
  if (currentActive === path && appStore.activeTabPath) {
    router.push(appStore.activeTabPath)
  }
}

function handleCloseOthers() {
  const path = appStore.activeTabPath
  if (!path) return
  appStore.closeOtherTabs(path)
}

function handleCloseAll() {
  appStore.closeAllTabs()
  if (appStore.activeTabPath) {
    router.push(appStore.activeTabPath)
  }
}

function handleContextMenu(path: string) {
  appStore.closeOtherTabs(path)
}

function handleDropdownCommand(cmd: string) {
  if (cmd === 'close-others') handleCloseOthers()
  else if (cmd === 'close-all') handleCloseAll()
}
</script>

<template>
  <div class="page-tabs" :class="{ 'page-tabs--empty': appStore.tabs.length === 0 }">
    <!-- 标签卡容器 -->
    <div class="page-tabs__scroll">
      <div class="page-tabs__list">
        <div
          v-for="tab in appStore.tabs"
          :key="tab.path"
          class="page-tabs__tab"
          :class="{ 'is-active': appStore.activeTabPath === tab.path }"
          @click="handleTabClick(tab.path)"
          @contextmenu.prevent="handleContextMenu(tab.path)"
        >
          <span class="page-tabs__tab-title">{{ tab.title }}</span>
          <button
            v-if="tab.closable"
            class="page-tabs__tab-close"
            @click="handleCloseTab($event, tab.path)"
            title="关闭标签"
          >
            <X :size="12" />
          </button>
        </div>
      </div>
    </div>

    <!-- 右侧操作区 -->
    <div v-if="appStore.tabs.length > 0" class="page-tabs__actions">
      <el-dropdown trigger="click" @command="handleDropdownCommand">
        <el-button text class="page-tabs__more">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="close-others">关闭其他标签</el-dropdown-item>
            <el-dropdown-item command="close-all">关闭全部标签</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-tabs {
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 8px;
  background: #fff;
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
  overflow: hidden;
  gap: 6px;

  &--empty {
    height: 0;
    padding: 0;
    border-bottom: none;
  }

  &__scroll {
    flex: 1;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    -ms-overflow-style: none;
    height: 100%;
    display: flex;
    align-items: center;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &__list {
    display: flex;
    align-items: center;
    gap: 4px;
    height: 32px;
  }

  &__tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 14px;
    min-width: 100px;
    max-width: 220px;
    height: 32px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    border: 1px solid var(--el-border-color-light);
    border-radius: 6px;
    background: var(--el-fill-color-lighter);
    position: relative;
    transition: all 0.15s;
    user-select: none;
    white-space: nowrap;
    flex-shrink: 0;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);

    &:hover {
      background-color: var(--el-fill-color);
      color: var(--el-text-color-primary);
      border-color: var(--el-border-color);

      .page-tabs__tab-close {
        opacity: 1;
        visibility: visible;
      }
    }

    &.is-active {
      background-color: #fff;
      color: var(--el-color-primary);
      font-weight: 500;
      border-color: var(--el-color-primary);
      box-shadow: 0 1px 3px rgba(30, 58, 95, 0.1);

      .page-tabs__tab-close {
        opacity: 1;
        visibility: visible;
        color: var(--el-color-primary);
      }
    }
  }

  &__tab-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__tab-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--el-text-color-placeholder);
    cursor: pointer;
    opacity: 0;
    visibility: hidden;
    transition: all 0.15s;
    flex-shrink: 0;
    padding: 0;

    &:hover {
      background-color: var(--el-fill-color);
      color: var(--el-text-color-primary);
    }
  }

  &__actions {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding: 0 2px;
    height: 32px;
  }

  &__more {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 !important;
    border-radius: 6px !important;
    color: var(--el-text-color-secondary);

    &:hover {
      background-color: var(--el-fill-color) !important;
    }
  }
}
</style>
