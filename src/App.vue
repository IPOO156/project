<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/app/stores/stores'

const userStore = useUserStore()

onMounted(() => {
  // 如果有 token，尝试获取用户信息
  if (userStore.isLoggedIn) {
    // 实际项目中这里会调接口获取用户信息
  }
})
</script>

<template>
  <router-view />
</template>

<style scoped lang="scss">
/* 全局重置样式 - 使用 :global() 导出到全局 */
:global(*) {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:global(*::before),
:global(*::after) {
  box-sizing: border-box;
}

:global(html),
:global(body) {
  height: 100%;
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

:global(#app) {
  height: 100%;
}

:global(a) {
  color: inherit;
  text-decoration: none;
}
</style>
