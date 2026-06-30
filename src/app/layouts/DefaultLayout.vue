<script setup lang="ts">
import { useAppStore } from '@/app/stores'
import HeaderBar from './components/HeaderBar.vue'
import Sidebar from './components/Sidebar.vue'

const appStore = useAppStore()
</script>

<template>
  <div class="layout" :class="{ 'layout--collapsed': appStore.isSidebarCollapsed }">
    <!-- 侧边栏 -->
    <Sidebar />
    <!-- 右侧主区域 -->
    <div class="layout__main">
      <!-- 顶部栏 -->
      <HeaderBar />
      <!-- 内容区 -->
      <main class="layout__content">
        <div class="layout__content-inner">
          <router-view />
        </div>
      </main>
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
    margin-left: 240px;
    transition: margin-left 0.3s ease-in-out;
    min-width: 0;
  }

  &--collapsed &__main {
    margin-left: 64px;
  }

  &__content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    background-color: var(--el-bg-color-page);
  }

  &__content-inner {
    max-width: 1440px;
    margin: 0 auto;
    width: 100%;
  }
}
</style>
