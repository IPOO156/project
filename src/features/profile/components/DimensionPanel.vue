<script setup lang="ts">
import { TrendingUp } from 'lucide-vue-next'
import { computed } from 'vue'
import { useScoreIndicator } from '@/shared/composables/useScoreIndicator'
import ScoreIndicatorDialog from '@/shared/ui/ScoreIndicatorDialog.vue'
import { calcAggregateScore } from '@/shared/utils/score'

const props = defineProps<{
  dimensions: Array<{
    label: string
    score: number
    /** 该维度满分（/profile/info 的 targetScore）；0 表示后端未给出，此时不展示满分 */
    maxScore: number
    /** 得分率百分比（0-100），供进度条绘制 */
    percent: number
    /** 分值展示文案，由父组件按「有无满分」预拼，避免模板内写分支（§2.2） */
    scoreText: string
    color: string
  }>
}>()

// 口径与空值语义统一在 shared/utils/score.ts（null = 尚无计算结果，不显示 0 分）
const avgScore = computed<number | null>(() =>
  calcAggregateScore(props.dimensions.map((d) => ({ score: d.score, maxScore: d.maxScore }))),
)

// 无计算结果时 /profile/info 的 dimensionProfile 为空数组，
// 此时卡片不能只留一个空壳（此前整块空白、且标题栏误显「综合评分 0分」）
const hasDimensions = computed(() => props.dimensions.length > 0)

const {
  indicators,
  indicatorVisible,
  indicatorLoading,
  indicatorTitle,
  indicatorCalculationId,
  openIndicator,
  closeIndicator,
} = useScoreIndicator()

function openCalcDetail(label: string) {
  openIndicator(label, `${label} · 计算说明`)
}
</script>

<template>
  <el-card class="profile-card dimension-panel">
    <template #header>
      <div class="card-header">
        <div class="card-header__left">
          <TrendingUp :size="16" />
          <span>多维度画像</span>
        </div>
        <span v-if="avgScore !== null" class="card-header__tag">综合评分 {{ avgScore }}分</span>
        <span v-else class="card-header__tag">暂无评分</span>
      </div>
    </template>
    <el-empty
      v-if="!hasDimensions"
      class="dimension-panel__empty"
      description="暂无画像评分数据，请联系管理员完成评分计算"
      :image-size="60"
    />
    <div v-else class="dimension-list">
      <div v-for="dim in dimensions" :key="dim.label" class="dimension-item">
        <div class="dimension-item__head">
          <span class="dimension-item__label">{{ dim.label }}</span>
          <div class="dimension-item__aside">
            <span class="dimension-item__score" :style="{ color: dim.color }">{{
              dim.scoreText
            }}</span>
            <el-button link type="primary" size="small" @click="openCalcDetail(dim.label)">
              查看计算说明
            </el-button>
          </div>
        </div>
        <!-- 进度条画「得分率」（而非原始分）：各维度满分 50/30/20 不同，用原始分会让维度间不可比 -->
        <el-progress
          :percentage="dim.percent"
          :color="dim.color"
          :stroke-width="8"
          :format="() => ''"
          class="dimension-item__bar"
        />
      </div>
    </div>

    <ScoreIndicatorDialog
      :visible="indicatorVisible"
      :title="indicatorTitle"
      :indicators="indicators"
      :loading="indicatorLoading"
      :calculation-id="indicatorCalculationId"
      @close="closeIndicator"
    />
  </el-card>
</template>

<style scoped lang="scss">
.dimension-panel {
  margin-bottom: 0;

  :deep(.el-card__body) {
    padding: 16px 20px;
  }

  // 空态：el-empty 默认上下留白 40px，在卡片内过于空旷；收紧留白并弱化说明文字层级
  // （deep 仅用于覆盖 el-empty 内部说明文案，作用域仍限定在本卡片内）
  &__empty {
    padding: 8px 0;

    :deep(.el-empty__description p) {
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 15px;
  font-weight: 600;

  &__left {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--el-text-color-primary);
  }

  &__tag {
    font-size: 12px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
    padding: 2px 10px;
    border-radius: 4px;
    background: var(--el-fill-color-light);
  }
}

.dimension-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dimension-item {
  &__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  &__aside {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__label {
    font-size: 13px;
    color: var(--el-text-color-primary);
  }

  &__score {
    font-size: 13px;
    font-weight: 600;
  }

  &__bar {
    :deep(.el-progress-bar__outer) {
      background-color: var(--el-fill-color-light);
    }
  }
}
</style>
