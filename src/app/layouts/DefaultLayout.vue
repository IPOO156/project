<script setup lang="ts">
/**
 * DefaultLayout - 全局页面级布局容器
 *
 * 设计目标
 *  1. 一个 Layout 满足绝大多数业务页面（列表/详情/表单/审批/统计）
 *  2. 通过 slot + meta 解耦菜单、面包屑、标题、工具栏、内容区
 *  3. 与 .cursor 规则中的 ui-ux-pro-max 设计语言保持一致：
 *     - 8pt 间距网格（$spacing-xs..$spacing-2xl）
 *     - 圆角 6/8/12（$radius-base / $radius-lg / $radius-xl）
 *     - 三层阴影（$shadow-sm / $shadow-base / $shadow-lg）
 *     - 主色深海蓝 + 琥珀金（$color-primary / $color-accent）
 *  4. 响应式：≥992 三栏、<992 自动折叠侧边栏为抽屉
 */
import { computed, useSlots } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore, useUserStore } from '@/app/stores/stores'
import { PageHeader } from '@/shared/ui'
import HeaderBar from './components/HeaderBar.vue'
import Sidebar from './components/Sidebar.vue'

defineOptions({ name: 'DefaultLayout' })

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()
const slots = useSlots()

const hasHeader = computed(() => !!slots.header)
const hasToolbar = computed(() => !!slots.toolbar)
const hasBreadcrumb = computed(() => !!slots.breadcrumb)
const hasPageHeader = computed(() => hasHeader.value || hasToolbar.value || hasBreadcrumb.value || !!route.meta?.title)
const hasFooter = computed(() => !!slots.footer)
const isLoading = computed(() => appStore.pageLoading)

/** 从路由 meta 中推断页面标题（fallback） */
const pageTitle = computed(() => (route.meta?.title as string) || '')
const pageSubtitle = computed(() => (route.meta?.subtitle as string) || '')

/** 面包屑：基于 matched 路由栈 */
const breadcrumbs = computed(() => {
  const matched = route.matched.filter(r => r.meta?.title && r.path !== '/')
  return matched.map(r => ({
    label: (r.meta?.title as string) || '',
    path: r.path,
  }))
})

function goHome() {
  router.push('/dashboard')
}
</script>

<template>
  <div
    class="layout"
    :class="{
      'layout--collapsed': appStore.isSidebarCollapsed,
      'layout--mobile': appStore.isMobile,
      'layout--has-footer': hasFooter,
    }"
  >
    <!-- 侧边栏 -->
    <Sidebar />

    <!-- 右侧主区域 -->
    <div class="layout__main">
      <!-- 顶部栏 -->
      <HeaderBar />

      <!-- 内容区 -->
      <main class="layout__content" :aria-busy="isLoading">
        <div class="layout__content-inner">
          <!-- 页面头：标题区 + 工具栏 -->
          <section v-if="hasPageHeader" class="layout__page-header">
            <!-- 面包屑：自定义 > 默认（meta 推断） -->
            <div v-if="hasBreadcrumb || breadcrumbs.length > 0" class="layout__breadcrumb">
              <slot name="breadcrumb">
                <el-breadcrumb separator="/">
                  <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
                  <el-breadcrumb-item
                    v-for="crumb in breadcrumbs"
                    :key="crumb.path"
                  >
                    {{ crumb.label }}
                  </el-breadcrumb-item>
                </el-breadcrumb>
              </slot>
            </div>

            <!-- 页面级标题 + 工具栏 -->
            <div class="layout__page-header-row">
              <div class="layout__page-header-main">
                <slot name="header">
                  <PageHeader
                    v-if="pageTitle"
                    :title="pageTitle"
                    :subtitle="pageSubtitle"
                    size="md"
                    :decoration="true"
                    @click="goHome"
                  />
                </slot>
              </div>
              <div v-if="hasToolbar" class="layout__page-header-toolbar">
                <slot name="toolbar" />
              </div>
            </div>
          </section>

          <!-- 主内容：路由出口 / 自定义内容 -->
          <section class="layout__page-body">
            <router-view v-slot="{ Component, route: routeSlot }">
              <transition name="layout-fade" mode="out-in">
                <component :is="Component" :key="routeSlot.fullPath" />
              </transition>
            </router-view>
          </section>

          <!-- 可选底部 -->
          <footer v-if="hasFooter" class="layout__page-footer">
            <slot name="footer" />
          </footer>
        </div>
      </main>
    </div>

    <!-- 全局遮罩（移动端抽屉式侧边栏使用） -->
    <div
      v-if="appStore.isMobile && !appStore.isSidebarCollapsed"
      class="layout__mask"
      @click="appStore.setSidebarCollapsed(true)"
    />

    <!-- 页面级全局加载 -->
    <transition name="layout-fade">
      <div v-if="isLoading" class="layout__loading">
        <div class="layout__loading-spinner" />
      </div>
    </transition>

    <!-- 调试用：暴露给 E2E -->
    <div v-if="false" aria-hidden="true" data-test="layout-user">
      {{ userStore.userName }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background-color: var(--el-bg-color-page);

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    margin-left: $sidebar-width;
    transition: margin-left 0.28s cubic-bezier(0.4, 0, 0.2, 1);
    min-width: 0;
  }

  &--collapsed &__main {
    margin-left: $sidebar-collapsed-width;
  }

  &--mobile &__main {
    margin-left: 0;
  }

  &__content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: $spacing-xl;
    background-color: var(--el-bg-color-page);
    position: relative;
  }

  &__content-inner {
    max-width: $content-max-width;
    margin: 0 auto;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: $spacing-xl;
  }

  // 页面级标题区
  &__page-header {
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-light);
    border-radius: $radius-lg;
    padding: $spacing-xl;
    box-shadow: $shadow-sm;
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;
  }

  &__breadcrumb {
    color: var(--el-text-color-secondary);
  }

  &__page-header-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: $spacing-xl;
    flex-wrap: wrap;
  }

  &__page-header-main {
    flex: 1 1 auto;
    min-width: 0;
  }

  &__page-header-toolbar {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    flex-wrap: wrap;
  }

  // 主内容
  &__page-body {
    display: flex;
    flex-direction: column;
    gap: $spacing-xl;
    min-height: 200px;
  }

  &__page-footer {
    color: var(--el-text-color-secondary);
    font-size: $font-size-sm;
    text-align: center;
    padding: $spacing-xl 0 $spacing-sm;
  }

  // 移动端遮罩
  &__mask {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.32);
    z-index: 99;
    animation: layout-fade-in 0.2s ease;
  }

  // 全局加载
  &__loading {
    position: fixed;
    inset: 0;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(2px);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__loading-spinner {
    width: 36px;
    height: 36px;
    border: 3px solid var(--el-color-primary-light-8);
    border-top-color: var(--el-color-primary);
    border-radius: 50%;
    animation: layout-spin 0.8s linear infinite;
  }
}

// 路由过渡
.layout-fade-enter-active,
.layout-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.layout-fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.layout-fade-leave-to {
  opacity: 0;
  transform: translateY(-2px);
}

@keyframes layout-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes layout-spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 1199px) {
  .layout__content {
    padding: $spacing-lg;
  }
}

@media (max-width: 768px) {
  .layout__content {
    padding: $spacing-md;
  }
  .layout__page-header {
    padding: $spacing-lg;
  }
}
</style>
