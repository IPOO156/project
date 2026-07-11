<script setup lang="ts">
/**
 * DefaultLayout - 全局页面级布局容器
 *
 * 设计目标
 *  1. 一个 Layout 满足绝大多数业务页面（列表/详情/表单/审批/统计）
 *  2. 通过 slot + meta 解耦菜单、标题、工具栏、内容区
 *  3. 与 .cursor 规则中的 ui-ux-pro-max 设计语言保持一致：
 *     - 8pt 间距网格（$spacing-xs..$spacing-2xl）
 *     - 圆角 6/8/12（$radius-base / $radius-lg / $radius-xl）
 *     - 三层阴影（$shadow-sm / $shadow-base / $shadow-lg）
 *     - 主色深海蓝 + 琥珀金（$color-primary / $color-accent）
 *  4. 响应式：≥992 三栏、<992 自动折叠侧边栏为抽屉
 *  5. A11y：role/aria-label/aria-live + prefers-reduced-motion 支持
 *  6. 动画：4 套统一过渡（sidebar 滑入 / header 淡入 / route 切换 / loading 出场）
 *     - 全部使用 transform + opacity（合成层，GPU 加速）
 *     - 时长 200-280ms（命中 skill §6 区间）
 *     - will-change 在动画结束后立即释放（避免常驻内存）
 */
import { computed, nextTick, ref, useSlots, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore, useUserStore } from '@/app/stores/stores'
import AIChatDrawer from '@/features/ai-chat/components/AIChatDrawer.vue'
import AIFloatingBall from '@/features/ai-chat/components/AIFloatingBall.vue'
import { useGreeting } from '@/features/dashboard/composables/useGreeting'
import { useTabs } from '@/shared/composables/composables'
import GreetingToast from '@/shared/ui/GreetingToast.vue'
import HeaderBar from './components/HeaderBar.vue'
import Sidebar from './components/Sidebar.vue'

defineOptions({ name: 'DefaultLayout' })

const route = useRoute()
const appStore = useAppStore()
const userStore = useUserStore()
const slots = useSlots()

const drawerVisible = ref(false)

// 启动 tab 状态监听：路由切换时把已访问页面写入 useTabsStore
useTabs()

// 人性化问候弹窗（useGreeting 内部已处理挂载与登录状态监听）
const { visible, dismissing, greeting, theme, dismiss } = useGreeting()

const hasHeader = computed(() => !!slots.header)
const hasToolbar = computed(() => !!slots.toolbar)
const hasPageHeader = computed(() => hasHeader.value || hasToolbar.value)
const hasFooter = computed(() => !!slots.footer)
const isLoading = computed(() => appStore.pageLoading)

/** 从路由 meta 中推断页面标题，用于文档标题与无障碍属性 */
const pageTitle = computed(() => (route.meta?.title as string) || '')

/** 是否全宽出血页面（如成长时间轴），需要去掉内容区 padding 与最大宽度限制 */
const isFullBleed = computed(() => !!route.meta?.fullBleed)

// 同步文档标题 → 屏幕阅读器在路由切换时能播报新页面
watch(
  () => pageTitle.value,
  (title) => {
    if (typeof document !== 'undefined' && title) {
      document.title = `${title} · 学生档案管理系统`
    }
  },
  { immediate: true },
)

// 加载态切换时，给 spinner/遮罩加 will-change，结束后释放
const loadingEl = ref<HTMLElement | null>(null)
watch(isLoading, async (loading) => {
  if (!loading) {
    return
  }
  await nextTick()
  if (loadingEl.value) {
    loadingEl.value.style.willChange = 'transform, opacity'
    // 动画结束后（约 320ms）立即释放 will-change，避免常驻图层占内存
    setTimeout(() => {
      if (loadingEl.value) {
        loadingEl.value.style.willChange = ''
      }
    }, 320)
  }
})
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
    <!-- 侧边栏（折叠/展开动画：280ms 横向滑入） -->
    <Transition name="layout-sidebar" mode="out-in">
      <Sidebar
        v-if="!appStore.isMobile || !appStore.isSidebarCollapsed"
        :key="String(appStore.isSidebarCollapsed)"
      />
    </Transition>

    <!-- 右侧主区域 -->
    <div class="layout__main">
      <!-- 顶部栏：保持挂载，内部 NavTabs 自行响应路由变化 -->
      <HeaderBar />

      <!-- 多标签页导航（由 NavTabs 接管） -->

      <!-- 内容区 -->
      <main
        class="layout__content"
        :class="{ 'layout__content--full-bleed': isFullBleed }"
        :aria-busy="isLoading"
        :aria-label="pageTitle || '主内容区'"
      >
        <div
          class="layout__content-inner"
          :class="{ 'layout__content-inner--full-bleed': isFullBleed }"
        >
          <!-- 页面头：仅当页面显式使用 header / toolbar 插槽时渲染 -->
          <Transition name="layout-fade">
            <section v-if="hasPageHeader" class="layout__page-header">
              <div class="layout__page-header-row">
                <div v-if="hasHeader" class="layout__page-header-main">
                  <slot name="header" />
                </div>
                <div v-if="hasToolbar" class="layout__page-header-toolbar">
                  <slot name="toolbar" />
                </div>
              </div>
            </section>
          </Transition>

          <!-- 主内容：路由出口 / 自定义内容 -->
          <section class="layout__page-body">
            <router-view v-slot="{ Component, route: routeSlot }">
              <keep-alive :max="20">
                <component :is="Component" :key="routeSlot.fullPath" />
              </keep-alive>
            </router-view>
          </section>

          <!-- 可选底部 -->
          <Transition name="layout-fade">
            <footer v-if="hasFooter" class="layout__page-footer">
              <slot name="footer" />
            </footer>
          </Transition>
        </div>
      </main>
    </div>

    <!-- 全局遮罩（移动端抽屉式侧边栏使用） -->
    <Transition name="layout-mask">
      <div
        v-if="appStore.isMobile && !appStore.isSidebarCollapsed"
        class="layout__mask"
        aria-hidden="true"
        @click="appStore.setSidebarCollapsed(true)"
      />
    </Transition>

    <!-- 页面级全局加载（aria-live 区域：屏幕阅读器会播报；强调入场 220ms） -->
    <Transition name="layout-loading">
      <div
        v-if="isLoading"
        ref="loadingEl"
        class="layout__loading"
        role="status"
        aria-live="polite"
        aria-label="页面加载中"
      >
        <div class="layout__loading-spinner" aria-hidden="true" />
        <span class="layout__loading-text">加载中…</span>
      </div>
    </Transition>

    <!-- 调试用：暴露给 E2E -->
    <div v-if="false" aria-hidden="true" data-test="layout-user">
      {{ userStore.userName }}
    </div>

    <!-- AI 悬浮球 -->
    <AIFloatingBall :open="drawerVisible" @toggle="drawerVisible = !drawerVisible" />
    <AIChatDrawer :visible="drawerVisible" @close="drawerVisible = false" />

    <!-- 人性化问候通知条 -->
    <GreetingToast
      :visible="visible"
      :dismissing="dismissing"
      :greeting="greeting"
      :theme="theme"
      @close="dismiss"
    />
  </div>
</template>

<style scoped lang="scss">
// =============================================================================
// 1. 主布局（基础样式 + 折叠/移动端 margin 切换）
// =============================================================================
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
    transition: margin-left $duration-slow $ease-standard;
    min-width: 0;
  }

  // 折叠侧边栏
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
    // 滚动使用 passive 滚动（浏览器原生优化，避免阻塞主线程）
    overscroll-behavior: contain;
    // 预留垂直滚动条空间，避免滚动条显隐导致居中内容左右偏移
    scrollbar-gutter: stable;
  }

  &__content-inner {
    max-width: $content-max-width;
    margin: 0 auto;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: $spacing-xl;
  }

  // 全宽出血页面：去掉内容区 padding 与最大宽度限制，让页面背景能顶满可视区域
  &__content--full-bleed {
    padding: 0;
  }

  &__content-inner--full-bleed {
    max-width: none;
    margin: 0;
    gap: 0;
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

  // 移动端遮罩（z-index 使用项目统一比例尺：modal-backdrop 层）
  &__mask {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.32);
    z-index: $z-modal-backdrop;
    cursor: pointer;
  }

  // 全局加载（z-index 使用项目统一比例尺：modal 层）
  &__loading {
    position: fixed;
    inset: 0;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(2px);
    z-index: $z-modal;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $spacing-md;
  }

  &__loading-spinner {
    width: 36px;
    height: 36px;
    border: 3px solid var(--el-color-primary-light-8);
    border-top-color: var(--el-color-primary);
    border-radius: 50%;
    // 旋转动画：只动 transform（合成层）；自带 will-change 由 JS 注入，结束即释放
    animation: layout-spin 0.8s linear infinite;
  }

  &__loading-text {
    color: var(--el-text-color-secondary);
    font-size: $font-size-sm;
  }
}

// =============================================================================
// 2. 动画系统（ui-ux-design skill §6：transform + opacity，150-280ms）
//    所有动画使用合成层属性；时长统一从 $duration-* 取
//    will-change 由 JS 按需注入，避免常驻图层
// =============================================================================

// A. Sidebar 折叠/展开 → 横向滑入 + 淡入（280ms Material 强调曲线）
.layout-sidebar-enter-active,
.layout-sidebar-leave-active {
  transition:
    transform $duration-slow $ease-standard,
    opacity $duration-slow $ease-standard;
}

.layout-sidebar-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.layout-sidebar-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

// B. 移动端遮罩 → 仅淡入（180ms，避免视觉抢占）
.layout-mask-enter-active,
.layout-mask-leave-active {
  transition: opacity $duration-fast $ease-standard;
}

.layout-mask-enter-from,
.layout-mask-leave-to {
  opacity: 0;
}

// E. 通用淡入（页面头、页脚存在/消失时使用，180ms）
.layout-fade-enter-active,
.layout-fade-leave-active {
  transition:
    transform $duration-base $ease-decelerate,
    opacity $duration-base $ease-decelerate;
}

.layout-fade-enter-from {
  transform: translateY(4px);
  opacity: 0;
}

.layout-fade-leave-to {
  transform: translateY(-2px);
  opacity: 0;
}

// F. Loading 强调出场（220ms 弹性曲线 + 缩放，给用户"加载启动"反馈）
.layout-loading-enter-active {
  transition:
    transform $duration-slow $ease-emphasized,
    opacity $duration-slow $ease-emphasized;
}

.layout-loading-leave-active {
  transition:
    transform $duration-base $ease-accelerate,
    opacity $duration-fast $ease-accelerate;
}

.layout-loading-enter-from {
  transform: scale(0.96);
  opacity: 0;
}

.layout-loading-leave-to {
  transform: scale(1.02);
  opacity: 0;
}

// 关键帧
@keyframes layout-spin {
  to {
    transform: rotate(360deg);
  }
}

// =============================================================================
// 3. 响应式断点（覆盖 skill 要求的 4 个标准断点：375 / 768 / 1024 / 1440）
// =============================================================================

// 平板：1199px 以下缩小内边距
@media (max-width: 1199px) {
  .layout__content {
    padding: $spacing-lg;
  }
}

// 移动端横屏：768px 以下
@media (max-width: 768px) {
  .layout__content {
    padding: $spacing-md;
  }
  .layout__page-header {
    padding: $spacing-lg;
  }
  // 移动端动画时长减半（更短的视距 = 更短的过渡）
  .layout-sidebar-enter-active,
  .layout-sidebar-leave-active {
    transition-duration: $duration-base;
  }
}

// 移动端竖屏：375px 以下（紧凑间距，禁止横向滚动）
@media (max-width: 375px) {
  .layout__content {
    padding: $spacing-sm;
  }
  .layout__page-header {
    padding: $spacing-md;
  }
  .layout__page-header-row {
    flex-direction: column;
    align-items: stretch;
  }
  .layout__page-header-toolbar {
    justify-content: flex-start;
  }
  // 极小屏：禁用 transform 位移，仅保留 opacity（避免低端机卡顿）
  .layout-fade-enter-from,
  .layout-fade-leave-to {
    transform: none;
  }
}

// =============================================================================
// 4. 无障碍：尊重用户的减少动画偏好（ui-ux-design skill §3 / §6）
//    系统层开关：彻底关闭所有过渡 + 动画 + 缩放
// =============================================================================
@media (prefers-reduced-motion: reduce) {
  // 主布局过渡（sidebar margin 切换等）
  .layout,
  .layout__main {
    transition: none !important;
  }

  // 所有 transition 类：禁用过渡 + 清除初始/结束状态
  .layout-sidebar-enter-active,
  .layout-sidebar-leave-active,
  .layout-mask-enter-active,
  .layout-mask-leave-active,
  .layout-fade-enter-active,
  .layout-fade-leave-active,
  .layout-loading-enter-active,
  .layout-loading-leave-active {
    transition: none !important;
  }

  // 初始/结束状态：直接显示，无 transform
  .layout-sidebar-enter-from,
  .layout-sidebar-leave-to,
  .layout-mask-enter-from,
  .layout-mask-leave-to,
  .layout-fade-enter-from,
  .layout-fade-leave-to,
  .layout-route-enter-from,
  .layout-route-leave-to,
  .layout-loading-enter-from,
  .layout-loading-leave-to {
    transform: none !important;
    filter: none !important;
  }

  // spinner 旋转也停掉
  .layout__loading-spinner {
    animation: none !important;
  }

  // 清理由 JS 注入的 will-change（避免残留图层占内存）
  .layout__loading {
    will-change: auto !important;
  }
}
</style>
