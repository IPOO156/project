<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/app/stores/stores'
import logoIcon from '@/assets/logo/logo-icon.jpg'
import { menuItems } from '@/shared/constants/menu'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

// 当前路由所属的顶级菜单，用于 el-menu 的 default-active
const activeMenu = computed(() => {
  const path = route.path
  if (path === '/dashboard') {
    return '/dashboard'
  }
  // 返回当前路由 path，让 el-menu 高亮
  return path
})

function handleMenuSelect(index: string) {
  if (index === route.fullPath) {
    return
  }

  router.push(index)
}
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar--collapsed': appStore.isSidebarCollapsed }">
    <!-- Logo -->
    <div class="sidebar__logo">
      <div class="sidebar__logo-icon">
        <img :src="logoIcon" alt="档案管理系统" class="sidebar__logo-img" />
      </div>
      <transition name="fade">
        <span v-show="!appStore.isSidebarCollapsed" class="sidebar__logo-text">档案管理系统</span>
      </transition>
    </div>

    <!-- 菜单：使用 el-menu + router 模式 -->
    <el-scrollbar class="sidebar__menu">
      <el-menu
        :default-active="activeMenu"
        :collapse="appStore.isSidebarCollapsed"
        :collapse-transition="false"
        :unique-opened="true"
        class="sidebar__el-menu"
        @select="handleMenuSelect"
      >
        <template v-for="item in menuItems" :key="item.label">
          <!-- 无子菜单 -->
          <el-menu-item v-if="!item.children && item.path" :index="item.path">
            <component :is="item.icon" v-if="item.icon" :size="18" />
            <template #title>
              <span>{{ item.label }}</span>
            </template>
          </el-menu-item>

          <!-- 有子菜单 -->
          <el-sub-menu v-else :index="item.label">
            <template #title>
              <component :is="item.icon" v-if="item.icon" :size="18" />
              <span>{{ item.label }}</span>
            </template>
            <el-menu-item
              v-for="child in item.children"
              :key="child.label + (child.path || '')"
              :index="child.path!"
            >
              <component :is="child.icon" v-if="child.icon" :size="16" />
              <template #title>
                <span>{{ child.label }}</span>
              </template>
            </el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
    </el-scrollbar>

    <!-- 折叠按钮 -->
    <div class="sidebar__footer">
      <el-button text class="sidebar__collapse-btn" @click="appStore.toggleSidebar()">
        <component :is="appStore.isSidebarCollapsed ? ChevronRight : ChevronLeft" :size="16" />
        <span v-show="!appStore.isSidebarCollapsed">收起</span>
      </el-button>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: $sidebar-width;
  height: 100vh;
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
  z-index: 100;
  transition:
    width 0.28s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  &--collapsed {
    width: $sidebar-collapsed-width;
  }

  &__logo {
    height: 56px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 16px;
    border-bottom: 1px solid var(--el-border-color-light);
    flex-shrink: 0;

    &-icon {
      color: var(--el-color-primary);
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      overflow: hidden;
    }

    &-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    &-text {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      white-space: nowrap;
    }
  }

  &__menu {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  // === Element Plus el-menu 自定义样式 ===
  // Element Plus 未暴露这些内部样式的 props，需通过 :deep() 覆盖以统一侧边栏视觉风格。
  // 移除 el-menu 默认背景和边框
  :deep(.sidebar__el-menu) {
    border-right: none !important;
    background: transparent !important;
  }

  // 菜单项：Element Plus 未提供对应样式 props，需覆盖内部类名以统一侧边栏尺寸与交互色。
  :deep(.el-menu-item) {
    height: 42px;
    line-height: 42px;
    padding: 0 16px !important;
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--el-text-color-secondary);
    font-size: 14px;
    border-radius: 0;
    background: transparent !important;

    &:hover {
      background-color: var(--el-fill-color-light) !important;
      color: var(--el-text-color-primary) !important;
    }

    &.is-active {
      color: var(--el-color-primary) !important;
      background-color: var(--el-color-primary-light-9) !important;
      font-weight: 500;
      position: relative;

      &::after {
        content: '';
        position: absolute;
        right: 0;
        top: 6px;
        bottom: 6px;
        width: 3px;
        background: var(--el-color-primary);
        border-radius: 2px;
      }
    }

    // 折叠时居中
    .el-menu--collapse & {
      justify-content: center;
      padding: 0 !important;
    }
  }

  // 子菜单标题：Element Plus 未提供对应样式 props，需覆盖内部类名以统一侧边栏尺寸与交互色。
  :deep(.el-sub-menu__title) {
    height: 42px;
    line-height: 42px;
    padding: 0 16px !important;
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--el-text-color-secondary);
    font-size: 14px;
    border-radius: 0;
    background: transparent !important;

    &:hover {
      background-color: var(--el-fill-color-light) !important;
      color: var(--el-text-color-primary) !important;
    }
  }

  // 子菜单弹出层：折叠状态下 Element Plus 内部标题仍使用默认 padding，需覆盖以保持居中。
  :deep(.el-menu--collapse .el-sub-menu__title) {
    justify-content: center;
    padding: 0 !important;
  }

  // 子菜单面板背景：Element Plus 默认背景色与侧边栏主题不符，需覆盖内部类名。
  :deep(.el-sub-menu .el-menu) {
    background: transparent !important;
  }

  // 子菜单项缩进：Element Plus 默认缩进尺寸与侧边栏设计规范不一致，需覆盖内部类名。
  :deep(.el-sub-menu .el-menu .el-menu-item) {
    padding: 0 16px 0 44px !important;
    font-size: 13px;
    min-width: auto;
  }

  &__footer {
    flex-shrink: 0;
    border-top: 1px solid var(--el-border-color-light);
    padding: 8px;
  }

  &__collapse-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }
}

// 移动端：抽屉式
@media (max-width: 991px) {
  .sidebar {
    transform: translateX(-100%);
    box-shadow: $shadow-lg;
  }
  .sidebar:not(.sidebar--collapsed) {
    transform: translateX(0);
  }
}

// 折叠动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<style lang="scss">
/* 夜间模式：logo 图标容器使用深色背景，避免白色 logo 背景过于突兀 */
html.dark .sidebar__logo-icon {
  background: rgba(30, 41, 59, 0.8);
  border-radius: 6px;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.2);
}
</style>
