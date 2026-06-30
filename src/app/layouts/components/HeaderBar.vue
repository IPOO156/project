<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore, useAppStore } from '@/app/stores'
import { Bell, User, Settings, LogOut } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()

const breadcrumbs = computed(() => {
  const matched = route.matched.filter((r) => r.meta?.title)
  return matched.map((r) => ({
    label: (r.meta?.title as string) || '',
    path: r.path === '/' ? undefined : r.path,
  }))
})

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<template>
  <header class="header">
    <div class="header__left">
      <el-breadcrumb>
        <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item
          v-for="crumb in breadcrumbs"
          :key="crumb.label"
          :to="crumb.path ? { path: crumb.path } : undefined"
        >
          {{ crumb.label }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="header__right">
      <!-- 通知 -->
      <el-badge :value="3" class="header__action">
        <el-button text>
          <Bell :size="18" />
        </el-button>
      </el-badge>

      <!-- 用户信息 -->
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
  height: 56px;
  background: #fff;
  border-bottom: 1px solid var(--el-border-color-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;

  &__left {
    display: flex;
    align-items: center;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__action {
    cursor: pointer;
  }

  &__user {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: background-color 0.2s;

    &:hover {
      background-color: var(--el-fill-color-light);
    }

    &-name {
      font-size: 14px;
      color: var(--el-text-color-primary);
    }
  }
}
</style>
