<script setup lang="ts">
import { Compass, Home } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

/**
 * 404 兜底页
 * 路由表末尾的 `/:pathMatch(.*)*` 指向本页，覆盖：手输错误 URL、
 * 页面合并后遗留的旧书签、以及未知深链。
 * 说明：未登录用户仍会被路由守卫先送到登录页（与整体鉴权模型一致）。
 */
const router = useRouter()

function goHome() {
  router.push('/dashboard')
}

function goBack() {
  // 有历史记录则回退，否则回首页，避免直接打开深链时 history 为空导致无响应
  if (window.history.length > 1) router.back()
  else goHome()
}
</script>

<template>
  <div class="not-found">
    <div class="not-found__card">
      <div class="not-found__icon"><Compass :size="30" /></div>
      <p class="not-found__code">404</p>
      <h1 class="not-found__title">页面不存在</h1>
      <p class="not-found__desc">该地址可能已被合并或调整，请从菜单重新进入。</p>
      <div class="not-found__actions">
        <el-button type="primary" :icon="Home" @click="goHome">回到首页</el-button>
        <el-button @click="goBack">返回上一页</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.not-found {
  min-height: 100svh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--el-bg-color-page, #f5f7fa);

  &__card {
    width: min(420px, 100%);
    padding: 40px 32px;
    text-align: center;
    border-radius: 16px;
    background: var(--el-bg-color, #fff);
    box-shadow: var(--el-box-shadow-light, 0 2px 12px rgb(0 0 0 / 8%));
  }

  &__icon {
    width: 56px;
    height: 56px;
    margin: 0 auto 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    color: var(--el-color-primary, #2c5282);
    background: var(--el-color-primary-light-9, #eef4fa);
  }

  &__code {
    margin: 0;
    font-size: 13px;
    letter-spacing: 0.16em;
    color: var(--el-text-color-secondary, #8a94a6);
  }

  &__title {
    margin: 6px 0 8px;
    font-size: 22px;
    color: var(--el-text-color-primary, #1f2937);
  }

  &__desc {
    margin: 0 0 24px;
    font-size: 14px;
    line-height: 1.7;
    color: var(--el-text-color-regular, #4b5563);
  }

  &__actions {
    display: flex;
    gap: 12px;
    justify-content: center;
  }
}
</style>
