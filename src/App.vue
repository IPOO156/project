<script setup lang="ts">
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { onMounted } from 'vue'
import { useUserStore } from '@/app/stores/stores'

const userStore = useUserStore()

onMounted(() => {
  // 有 token 时刷新一次头像：后端只存 objectKey、读取时现签 7 天有效的 URL，
  // 本地缓存的旧签名 URL 过期后会让顶部栏/基本资料显示破图。
  // 不 await：头像刷新不应阻塞首屏渲染。
  if (userStore.isLoggedIn) {
    userStore.refreshAvatar()
  }
})
</script>

<template>
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
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
