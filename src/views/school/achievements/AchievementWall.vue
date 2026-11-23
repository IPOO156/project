<script setup lang="ts">
/**
 * 成果墙（开发中）
 *
 * 功能尚未上线：页面只展示占位状态，不发起任何成果接口请求，
 * 避免出现空列表、半成品筛选器或接口报错。
 * 路由（/achievements）与侧边栏入口保持不变，上线时直接恢复原页面实现。
 */
import { Hammer } from 'lucide-vue-next'
</script>

<template>
  <div class="achievement-wall">
    <header class="wall-head">
      <div class="wall-head__top">
        <h1 class="wall-head__title">成果墙</h1>
        <span class="wall-badge">开发中</span>
      </div>
    </header>

    <section class="wall-placeholder" aria-labelledby="wall-placeholder-title">
      <div class="wall-placeholder__icon" aria-hidden="true">
        <Hammer :size="20" :stroke-width="1.8" />
      </div>
      <h2 id="wall-placeholder-title" class="wall-placeholder__title">成果墙正在开发中</h2>
      <p class="wall-placeholder__desc">
        该功能尚未上线。上线后，你可以在这一页集中查看与归档荣誉、竞赛、科研、实践等成果材料。
      </p>
    </section>
  </div>
</template>

<style scoped lang="scss">
@use 'messages-theme' as *;

.achievement-wall {
  @include message-theme-vars;

  display: flex;
  flex-direction: column;
  gap: 16px;
  color: var(--mc-text);
}

.wall-head__top {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 页头尺寸对齐动态中心（ActivityCenterHeader）：26 / 700 / margin 0 */
.wall-head__title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--mc-text);
}

.wall-badge {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 8px;
  border: 1px solid var(--mc-wood-light);
  border-radius: $radius-sm;
  color: var(--mc-wood);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.04em;
  line-height: 1;
}

.wall-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 360px;
  padding: 48px 24px;
  border: 1px solid var(--mc-border);
  border-radius: $radius-base;
  background: var(--mc-card);
  text-align: center;
}

.wall-placeholder__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin-bottom: 2px;
  border: 1px solid var(--mc-border);
  border-radius: $radius-base;
  background: var(--mc-primary-faint);
  color: var(--mc-wood);
}

.wall-placeholder__title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--mc-text);
}

.wall-placeholder__desc {
  max-width: 420px;
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--mc-text-secondary);
}

@media (max-width: 640px) {
  .wall-placeholder {
    min-height: 280px;
    padding: 36px 18px;
  }
}
</style>
