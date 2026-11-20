<script setup lang="ts">
/**
 * AwardHub - 奖项中心
 *
 * 合并原「我的奖项」（奖项看板）与「奖项报名」（三类之星）两个菜单入口。
 * 与申报中心同一套交互：默认进入「竞赛之星」报名页，顶部用卡片页签切换 4 个子页面；
 * 「奖项看板」只做总览，进入后不展示页签，可经「参与度总览」的绿色入口回到报名页。
 */
import { GraduationCap, LayoutDashboard, Lightbulb, Trophy } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AwardReview from '@/features/approval/AwardReview.vue'
import { getAwardsOverview } from '@/shared/api/awards'
import CompetitionStarList from './competition-star/CompetitionStarList.vue'
import InnovationStarList from './innovation-star/InnovationStarList.vue'
import ScientificStarList from './scientific-star/ScientificStarList.vue'

const route = useRoute()
const router = useRouter()

const modules = [
  {
    key: 'award-review',
    label: '奖项看板',
    icon: LayoutDashboard,
    component: AwardReview,
    desc: '总览三类之星报名情况',
  },
  {
    key: 'competition-star',
    label: '竞赛之星',
    icon: Trophy,
    component: CompetitionStarList,
    desc: '学科竞赛类奖项报名',
  },
  {
    key: 'scientific-star',
    label: '科研之星',
    icon: GraduationCap,
    component: ScientificStarList,
    desc: '科研项目、软著与论文',
  },
  {
    key: 'innovation-star',
    label: '双创之星',
    icon: Lightbulb,
    component: InnovationStarList,
    desc: '创新创业项目与实践',
  },
] as const

/** 看板页：只做总览，不展示页签卡片 */
const BOARD_KEY = 'award-review'
/** 无 tab 参数时落到报名页（与申报中心默认进入「学科竞赛」一致），而不是看板 */
const DEFAULT_KEY = 'competition-star'

/** 页签 key → /awards/overview 的 typeDistribution key */
const COUNT_KEY_OF_MODULE: Record<string, string> = {
  'competition-star': 'competition_star',
  'scientific-star': 'research_star',
  'innovation-star': 'innovation_star',
}

function resolveKeyFromRoute(tab: unknown): string {
  const key = typeof tab === 'string' ? tab : DEFAULT_KEY
  return modules.some((item) => item.key === key) ? key : DEFAULT_KEY
}

const activeKey = ref(resolveKeyFromRoute(route.query.tab))
const activeModule = computed(() => modules.find((item) => item.key === activeKey.value)!)

/** 各页签的报名数量，用于卡片右上角徽标（与申报中心同一视觉口径） */
const overview = ref<Awaited<ReturnType<typeof getAwardsOverview>> | null>(null)

function countOf(key: string): number {
  if (!overview.value) return 0
  if (key === BOARD_KEY) return overview.value.totalSubmissions ?? 0
  return overview.value.typeDistribution?.[COUNT_KEY_OF_MODULE[key]] ?? 0
}

onMounted(async () => {
  try {
    overview.value = await getAwardsOverview()
  } catch {
    // 徽标属于辅助信息，失败时静默不展示，不影响报名流程
  }
})

watch(
  () => route.query.tab,
  (tab) => {
    activeKey.value = resolveKeyFromRoute(tab)
  },
)

/** 切换页签只保留 tab，丢弃 sub / edit 等子页面参数，避免跨页签串状态 */
function switchModule(key: string) {
  if (key === activeKey.value) return
  activeKey.value = key
  router.replace({ path: '/awards', query: { tab: key } }).catch(() => {})
}
</script>

<template>
  <div class="award-hub">
    <!-- 看板页保持「只看总览」；进入任一之星报名页后顶部才出现页签，可互相切换或回到看板 -->
    <div v-if="activeKey !== BOARD_KEY" class="award-hub__grid">
      <button
        v-for="item in modules"
        :key="item.key"
        type="button"
        class="award-hub__tab"
        :class="{ 'is-active': item.key === activeKey }"
        @click="switchModule(item.key)"
      >
        <div v-if="countOf(item.key) > 0" class="award-hub__tab-badge">
          {{ countOf(item.key) }}
        </div>
        <div class="award-hub__tab-icon">
          <component :is="item.icon" :size="18" />
        </div>
        <div class="award-hub__tab-body">
          <div class="award-hub__tab-title">{{ item.label }}</div>
          <div class="award-hub__tab-desc">{{ item.desc }}</div>
        </div>
      </button>
    </div>

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

.award-hub__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.award-hub__tab {
  position: relative;
  min-height: 84px;
  padding: 14px 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-bg-color);
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.award-hub__tab:hover {
  border-color: #d4a574;
  box-shadow: 0 4px 12px rgba(30, 58, 95, 0.06);
}

.award-hub__tab.is-active {
  border-color: var(--el-color-primary);
  background: rgba(var(--el-color-primary-rgb, 30 58 95), 0.03);
}

.award-hub__tab.is-active .award-hub__tab-title {
  color: var(--el-color-primary);
}

.award-hub__tab-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 10px;
  background: var(--el-color-primary);
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}

.award-hub__tab-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(var(--el-color-primary-rgb, 30 58 95), 0.06);
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.award-hub__tab-body {
  min-width: 0;
  flex: 1;
}

.award-hub__tab-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  transition: color 0.25s ease;
}

.award-hub__tab-desc {
  margin-top: 3px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
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

@media (max-width: 1200px) {
  .award-hub__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 480px) {
  .award-hub__grid {
    grid-template-columns: 1fr;
  }
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
