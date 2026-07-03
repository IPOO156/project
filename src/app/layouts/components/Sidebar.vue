<script setup lang="ts">
import {
  Award,
  BarChart3,
  BookOpen,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Clock,
  FilePen,
  FileText,
  FlaskConical,
  GraduationCap,
  HeartHandshake,
  Home,
  Lightbulb,
  Medal,
  ShieldCheck,
  Star,
  Trophy,
  User,
  Users,
} from 'lucide-vue-next'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/app/stores/stores'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()


interface MenuItem {
  label: string
  icon?: any
  path?: string
  children?: MenuItem[]
}

const menuItems: MenuItem[] = [
  { label: '首页', icon: Home, path: '/dashboard' },
  { label: '成长时间轴', icon: Clock, path: '/growth-timeline' },
  {
    label: '个人中心',
    icon: User,
    children: [
      { label: '个人档案信息', path: '/profile/info' },
      { label: '职业规划', path: '/profile/career-plan' },
    ],
  },
  {
    label: '个人档案信息申报',
    icon: FilePen,
    children: [
      { label: '学科竞赛', icon: Trophy, path: '/applications/competition' },
      { label: '创新创业', icon: Lightbulb, path: '/applications/innovation' },
      { label: '学术研究', icon: FlaskConical, path: '/applications/research' },
      { label: '奖学金', icon: Medal, path: '/applications/scholarship' },
      { label: '荣誉证书', icon: Award, path: '/applications/certificate' },
      { label: '实习经历', icon: Briefcase, path: '/applications/internship' },
      { label: '组织履历', icon: Users, path: '/applications/organization' },
      { label: '实训项目', icon: BarChart3, path: '/applications/training' },
      { label: '社会实践', icon: HeartHandshake, path: '/applications/social-practice' },
      { label: '图书心得', icon: BookOpen, path: '/applications/book-report' },
    ],
  },
  {
    label: '奖项报名',
    icon: Star,
    children: [
      { label: '奖项总览', icon: BarChart3, path: '/awards' },
      { label: '竞赛之星报名', icon: Trophy, path: '/awards/competition-star' },
      { label: '科研之星报名', icon: GraduationCap, path: '/awards/scientific-star' },
      { label: '双创之星报名', icon: Lightbulb, path: '/awards/innovation-star' },
    ],
  },
  {
    label: '审批与记录',
    icon: ShieldCheck,
    children: [
      { label: '待审批信息', icon: Clock, path: '/approval/pending' },
    ],
  },
]

// 当前路由所属的顶级菜单，用于 el-menu 的 default-active
const activeMenu = computed(() => {
  const path = route.path
  if (path === '/dashboard') return '/dashboard'
  // 返回当前路由 path，让 el-menu 高亮
  return path
})

function handleMenuSelect(index: string) {
  router.push(index)
}
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar--collapsed': appStore.isSidebarCollapsed }">
    <!-- Logo -->
    <div class="sidebar__logo">
      <div class="sidebar__logo-icon">
        <GraduationCap :size="28" />
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
        router
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
  // 移除 el-menu 默认背景和边框
  :deep(.sidebar__el-menu) {
    border-right: none !important;
    background: transparent !important;
  }

  // 菜单项
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

  // 子菜单标题
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

  // 子菜单弹出层
  :deep(.el-menu--collapse .el-sub-menu__title) {
    justify-content: center;
    padding: 0 !important;
  }

  :deep(.el-sub-menu .el-menu) {
    background: transparent !important;
  }

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
