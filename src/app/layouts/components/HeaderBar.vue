<script setup lang="ts">
/**
 * HeaderBar - 顶部栏
 *  - 左侧：移动端菜单按钮 + 已访问页面 tab 栏（NavTabs）
 *  - 右侧：通知 + 用户下拉（个人中心 / 修改密码 / 退出登录）
 */
import {
  Bell,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  SwitchCamera,
  User,
} from 'lucide-vue-next'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore, useNotificationStore, useThemeStore, useUserStore } from '@/app/stores/stores'
import { useThemeRipple } from '@/shared/composables/useThemeRipple'
import NavTabs from './NavTabs.vue'

const userStore = useUserStore()
const appStore = useAppStore()
const notificationStore = useNotificationStore()
const themeStore = useThemeStore()
const router = useRouter()
const route = useRoute()
const { toggleThemeWithRipple } = useThemeRipple()
const isGrowthTimeline = computed(() => route.path.startsWith('/growth-timeline'))
const isTeacher = computed(() => userStore.isTeacher)

const roleLabel = computed(() => {
  if (!isTeacher.value) return ''
  if (userStore.isSuperAdmin) return '超级管理员'
  if (userStore.isAdmin) return '管理员'
  if (userStore.isReviewer) return '审核员'
  if (userStore.isTeacherRole) return '课任教师'
  return ''
})

function handleLogout() {
  userStore.logout()
  router.push('/login')
}

function openSidebar() {
  appStore.setSidebarCollapsed(false)
}

function switchToStudent() {
  userStore.logout()
  router.push('/login')
}
</script>

<template>
  <header class="header" :class="{ 'header--warm': isGrowthTimeline }">
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

      <!-- 已访问页面 tab 栏 -->
      <NavTabs />
    </div>

    <div class="header__right">
      <el-badge
        :value="notificationStore.unreadCount"
        :hidden="notificationStore.unreadCount === 0"
        class="header__action"
      >
        <el-button
          text
          :aria-label="`消息中心，未读消息 ${notificationStore.unreadCount} 条`"
          @click="router.push('/messages')"
        >
          <Bell :size="18" />
        </el-button>
      </el-badge>

      <el-tooltip
        :content="themeStore.isDark ? '切换至日间模式' : '切换至夜间模式'"
        placement="bottom"
      >
        <el-button
          text
          class="header__action"
          :aria-label="themeStore.isDark ? '切换至日间模式' : '切换至夜间模式'"
          @click="toggleThemeWithRipple"
        >
          <component :is="themeStore.isDark ? Sun : Moon" :size="18" />
        </el-button>
      </el-tooltip>

      <el-dropdown trigger="click">
        <span class="header__user">
          <el-avatar :size="32" :src="userStore.avatar" :icon="User" />
          <span class="header__user-name">{{ userStore.userName || '用户' }}</span>
          <el-tag
            v-if="isTeacher"
            size="small"
            type="warning"
            effect="light"
            class="header__role-tag"
          >
            {{ roleLabel }}
          </el-tag>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <template v-if="isTeacher">
              <el-dropdown-item @click="router.push('/teacher/dashboard')">
                <LayoutDashboard :size="14" /> 教师首页
              </el-dropdown-item>
              <el-dropdown-item divided @click="switchToStudent">
                <SwitchCamera :size="14" /> 切换学生端
              </el-dropdown-item>
            </template>
            <template v-else>
              <el-dropdown-item @click="router.push('/profile/info')">
                <User :size="14" /> 个人中心
              </el-dropdown-item>
              <el-dropdown-item @click="router.push('/profile/edit-password')">
                <Settings :size="14" /> 修改密码
              </el-dropdown-item>
            </template>
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
  z-index: $z-sticky;
  // 固定栏位的稳定上下文：避免 NavTabs 滚动时 header 抖动
  contain: layout;

  &__left {
    display: flex;
    align-items: center;
    // 关键：与右侧用户区视觉重量平衡 → tab 区域呼吸感更强
    gap: $spacing-lg;
    flex: 1 1 auto;
    min-width: 0;
    height: 100%;
  }

  &__menu-btn {
    color: var(--el-text-color-primary);
    flex: 0 0 auto;
    // 与 NavTabs 中轴对齐：菜单按钮图标 20px + 按钮 padding 8px ≈ 36px
    // 让按钮视觉中心 ≈ tab 视觉中心
    height: 32px;
    padding: 0 $spacing-xs;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    flex: 0 0 auto;
    // 防止用户区被 NavTabs 挤压消失
    padding-left: $spacing-lg;
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
    transition: background-color $duration-fast $ease-standard;

    &:hover {
      background-color: var(--el-fill-color-light);
    }

    &-name {
      font-size: $font-size-base;
      color: var(--el-text-color-primary);
    }

    &-role-tag {
      margin-left: $spacing-xs;
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
  .header__right {
    padding-left: $spacing-md;
  }
}

@media (max-width: 375px) {
  .header {
    padding: 0 $spacing-sm;
  }
  .header__left {
    gap: $spacing-sm;
  }
  .header__right {
    padding-left: $spacing-sm;
  }
}

.header--warm {
  border-bottom-color: var(--gt-ring-soft, #a88560);
}
</style>
