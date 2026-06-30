<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/app/stores'

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

<style lang="scss">
// 全局重置样式
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  font-family:
    'PingFang SC',
    'Microsoft YaHei',
    'Helvetica Neue',
    Helvetica,
    Arial,
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  height: 100%;
}

a {
  color: inherit;
  text-decoration: none;
}
</style>
