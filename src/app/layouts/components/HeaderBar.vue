<script setup lang="ts">
/**
 * HeaderBar - 顶部栏
 *  - 面包屑改由 DefaultLayout 统一渲染（保持布局一致）
 *  - 移动端自动出现"侧边栏开关"按钮
 *  - 用户下拉：个人中心 / 修改密码 / 退出登录
 */
import { Bell, LogOut, Menu, Settings, User } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useAppStore, useUserStore } from '@/app/stores/stores'

const userStore = useUserStore()
const appStore = useAppStore()
const router = useRouter()

function handleLogout() {
  userStore.logout()
  router.push('/login')
}

function openSidebar() {
  appStore.setSidebarCollapsed(false)
}
</script>

<template>
  <header class="header">
    <div class="header__left">
      <!-- 移动端菜单按钮 -->
      <el-button
        v-if="appStore.isMobile"
        text
        class="header__menu-btn"
        aria-label="打开侧边栏"
        @click="openSidebar"
      >
        <Menu :size="20" />
      </el-button>
    </div>

    <div class="header__right">
      <el-badge :value="3" class="header__action">
        <el-button text aria-label="通知">
          <Bell :size="18" />
        </el-button>
      </el-badge>

      <el-dropdown trigger="click">
        <span class="header__user">
          <el-avatar :size="32" :icon="User" />
          <span class="header__user-name">{{ userStore.userName || '用户' }}</span>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="router.push('/profile/info')">
              <User :size="14" /> 个人中心
            </el-dropdown-item>
            <el-dropdown-item @click="router.push('/profile/edit-password')">
              <Settings :size="14" /> 修改密码
            </el-dropdown-item>
            <el-dropdown-item divided @click="handleLogout">
              <LogOut :size="14" /> 退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<style scoped lang="scss">
.header {
  height: $header-height;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 $spacing-xl;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 10;

  &__left {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }

  &__menu-btn {
    color: var(--el-text-color-primary);
  }

  &__right {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }

  &__action {
    cursor: pointer;
  }

  &__user {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    cursor: pointer;
    padding: $spacing-xs $spacing-sm;
    border-radius: $radius-base;
    transition: background-color 0.2s;

    &:hover {
      background-color: var(--el-fill-color-light);
    }

    &-name {
      font-size: $font-size-base;
      color: var(--el-text-color-primary);
    }
  }
}

@media (max-width: 768px) {
  .header {
    padding: 0 $spacing-md;
  }
  .header__user-name {
    display: none;
  }
}
</style>
