<script setup lang="ts">
/**
 * AwardHub - 奖项中心
 *
 * 合并原「我的奖项」（奖项看板）与「奖项报名」（三类之星）两个菜单入口。
 * 默认展示「奖项看板」；三个之星的报名页由看板内「参与度总览」的入口进入，
 * 因此这里不再渲染顶部分类页签网格，仅按 ?tab= 动态渲染对应子页面。
 */
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AwardReview from '@/features/approval/AwardReview.vue'
import CompetitionStarList from './competition-star/CompetitionStarList.vue'
import InnovationStarList from './innovation-star/InnovationStarList.vue'
import ScientificStarList from './scientific-star/ScientificStarList.vue'

const route = useRoute()

const modules = [
  { key: 'award-review', component: AwardReview },
  { key: 'competition-star', component: CompetitionStarList },
  { key: 'scientific-star', component: ScientificStarList },
  { key: 'innovation-star', component: InnovationStarList },
] as const

const DEFAULT_KEY = 'award-review'

function resolveKeyFromRoute(tab: unknown): string {
  const key = typeof tab === 'string' ? tab : DEFAULT_KEY
  return modules.some((item) => item.key === key) ? key : DEFAULT_KEY
}

const activeKey = ref(resolveKeyFromRoute(route.query.tab))
const activeModule = computed(() => modules.find((item) => item.key === activeKey.value)!)

watch(
  () => route.query.tab,
  (tab) => {
    activeKey.value = resolveKeyFromRoute(tab)
  },
)
</script>

<template>
  <div class="award-hub">
    <section class="award-hub__panel">
      <Transition name="module-fade">
        <div :key="activeKey" class="award-hub__panel-item is-active" aria-hidden="false">
          <component :is="activeModule.component" :key="activeKey" />
        </div>
      </Transition>
    </section>
  </div>
</template>

<style scoped lang="scss">
.award-hub {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.award-hub__panel {
  position: relative;
  min-width: 0;
  min-height: 55vh;
  overflow: visible;
}

.award-hub__panel-item {
  width: 100%;
}

/* 原地交叉淡入：离场侧脱离文档流，进出可重叠，不再有 out-in 的纯空白帧 */
.module-fade-enter-active,
.module-fade-leave-active {
  transition: opacity 0.16s ease;
}

.module-fade-leave-active {
  position: absolute;
  inset: 0;
}

.module-fade-enter-from,
.module-fade-leave-to {
  opacity: 0;
}
</style>
