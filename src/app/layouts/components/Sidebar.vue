<script setup lang="ts">
import type { MenuInstance } from 'element-plus'
import { ElMessage } from 'element-plus'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore, useUserStore } from '@/app/stores/stores'
import logoIcon from '@/assets/logo/logo-icon.png'
import { useTeacherAuthz } from '@/shared/composables/useTeacherAuthz'
import { menuItems } from '@/shared/constants/menu'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()
// 教师端菜单按 /auth/me 的权限码过滤（见 teacherModuleRegistry）
const { menuGroups, baselineFallback } = useTeacherAuthz()

/**
 * 授权数据未就绪时的非阻断提示（每次进入应用至多一次）。
 *
 * 菜单此时是「按角色基线」降级展示的，用户看到的功能集可能比应有权限少；
 * 不提示的话会误判成「系统坏了/我的功能被删了」。用 watch 而非 onMounted：
 * /auth/me 可能在侧边栏挂载之后才拿到（登录后拉取、或守卫补拉），
 * immediate 保证刷新后直接用缓存渲染的场景也能提示到。
 */
let hasWarnedFallback = false
watch(
  baselineFallback,
  (fallback) => {
    if (!fallback || hasWarnedFallback) return
    hasWarnedFallback = true
    ElMessage.warning({
      message: '暂未同步到你的权限信息，菜单已按你的角色展示默认项；如缺少需要的功能，请联系管理员',
      duration: 6000,
    })
  },
  { immediate: true },
)

// 是否为教师端
const isTeacher = computed(() => userStore.isTeacher)

// 当前菜单：学生端保持原平铺菜单；教师端为 5 组折叠菜单
const currentMenuItems = computed(() => menuItems)

// 当前路由所属的菜单路径，用于 el-menu 的 default-active
const activeMenu = computed(() => {
  const path = route.path
  if (isTeacher.value) {
    // 档案详情从「学生档案」进入，侧栏保持该入口高亮
    if (path.startsWith('/teacher/student-detail')) return '/teacher/archive-view'
    return path
  }
  return path
})

/** 当前路由所在分组（用于自动展开） */
const activeGroupKey = computed(() => {
  const current = activeMenu.value
  const group = menuGroups.value.find((entry) => entry.items.some((item) => item.path === current))
  return group ? `group:${group.group.key}` : ''
})

const menuRef = ref<MenuInstance | null>(null)

// 路由变化后展开当前分组：Element Plus 的 default-openeds 只在初始化时读取，
// 命令面板跳转 / 深链进入时需要主动 open，否则高亮项藏在折叠分组里看不见。
watch(
  activeGroupKey,
  (key) => {
    if (!key || appStore.isSidebarCollapsed) return
    void nextTick(() => menuRef.value?.open(key))
  },
  { immediate: true, flush: 'post' },
)

// 从折叠态展开时补开当前分组
watch(
  () => appStore.isSidebarCollapsed,
  (collapsed) => {
    if (collapsed || !isTeacher.value || !activeGroupKey.value) return
    void nextTick(() => menuRef.value?.open(activeGroupKey.value))
  },
)

// 侧栏保留统一品牌名；管理员 / 教师身份由顶栏角色标签区分，避免出现不自然的拼接标题。
const sidebarTitle = '档鉴未来'

function handleMenuSelect(index: string) {
  // 聚合页点击当前入口时保留页内 ?tab=；仅在不同页面间跳转
  if (index === route.path) return
  router.push(index)
}
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar--collapsed': appStore.isSidebarCollapsed }">
    <!-- Logo -->
    <div class="sidebar__logo">
      <div class="sidebar__logo-icon">
        <img :src="logoIcon" alt="档鉴未来" class="sidebar__logo-img" />
      </div>
      <transition name="fade">
        <span v-show="!appStore.isSidebarCollapsed" class="sidebar__logo-text">{{
          sidebarTitle
        }}</span>
      </transition>
    </div>

    <!-- 菜单：使用 el-menu + router 模式 -->
    <el-scrollbar class="sidebar__menu">
      <!-- 教师端：5 组折叠菜单 -->
      <el-menu
        v-if="isTeacher"
        ref="menuRef"
        :default-active="activeMenu"
        :collapse="appStore.isSidebarCollapsed"
        :collapse-transition="false"
        :unique-opened="true"
        class="sidebar__el-menu sidebar__el-menu--grouped"
        @select="handleMenuSelect"
      >
        <el-sub-menu
          v-for="entry in menuGroups"
          :key="entry.group.key"
          :index="`group:${entry.group.key}`"
          class="sidebar__group"
        >
          <template #title>
            <component :is="entry.group.icon" :size="16" />
            <span>{{ entry.group.label }}</span>
          </template>
          <el-menu-item v-for="item in entry.items" :key="item.path" :index="item.path!">
            <template #title>
              <span>{{ item.label }}</span>
            </template>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>

      <!-- 学生端：保持原平铺菜单 -->
      <el-menu
        v-else
        :default-active="activeMenu"
        :collapse="appStore.isSidebarCollapsed"
        :collapse-transition="false"
        :unique-opened="true"
        class="sidebar__el-menu"
        @select="handleMenuSelect"
      >
        <template v-for="item in currentMenuItems" :key="item.label">
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

    <!-- 折叠 -->
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
  height: 100dvh;
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
  z-index: 100;
  transition:
    width 0.28s $ease-standard,
    transform 0.28s $ease-standard;
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
      width: 32px;
      height: 32px;
      overflow: hidden;
    }

    &-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    &-text {
      font-size: 15px;
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

  // ── 教师端分组菜单：较小的行高、无右侧高亮条，子项以圆点引导 ──
  :deep(.sidebar__el-menu--grouped) {
    padding: 8px 0;

    .el-sub-menu {
      margin-bottom: 4px;
    }

    .el-sub-menu__title {
      height: 40px;
      line-height: 1.5;
      margin: 0 8px;
      padding: 0 8px !important;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      color: var(--el-text-color-primary);

      .el-sub-menu__icon-arrow {
        color: var(--el-text-color-placeholder);
      }
    }

    .el-menu-item {
      height: 40px;
      line-height: 1.5;
      margin: 0 8px;
      padding: 0 8px 0 24px !important;
      border-radius: 6px;
      font-size: 13px;
      gap: 0;

      &.is-active {
        font-weight: 500;
        background-color: var(--el-color-primary-light-9) !important;

        &::after {
          display: none;
        }
      }
    }

    .el-menu--collapse & {
      .el-sub-menu__title {
        margin: 0;
      }

      .el-menu-item {
        margin: 1px 8px;
        padding: 0 8px !important;
      }
    }
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
/* 夜间模式：logo 图标容器使用浅色背景 + 发光效果，避免 logo 看不清 */
html.dark .sidebar__logo-icon {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  box-shadow:
    0 0 12px rgba(148, 163, 184, 0.3),
    inset 0 0 0 1px rgba(148, 163, 184, 0.25);
}
html.dark .sidebar__logo-img {
  filter: brightness(1.3);
}
</style>
