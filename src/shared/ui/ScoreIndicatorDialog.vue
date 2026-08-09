<script setup lang="ts">
/**
 * ScoreIndicatorDialog - 评分指标弹窗
 *
 * 展示申报/报名的各项评分指标及得分，用于查看审核评分详情。
 * 配合 useScoreIndicator composable 使用。
 */
import type { IndicatorItem } from '@/shared/composables/useScoreIndicator'

interface Props {
  visible: boolean
  title: string
  indicators: IndicatorItem[]
  loading?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

/** 计算总分 */
function calcTotal(items: IndicatorItem[]): number {
  return items.reduce((sum, item) => sum + item.score * item.weight, 0)
}

/** 计算满分 */
function calcMaxTotal(items: IndicatorItem[]): number {
  return items.reduce((sum, item) => sum + item.maxScore * item.weight, 0)
}

/** 格式化百分比 */
function formatPercent(score: number, maxScore: number): string {
  if (!maxScore) return '0%'
  return `${Math.round((score / maxScore) * 100)}%`
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="title"
    width="560px"
    :close-on-click-modal="false"
    @close="emit('close')"
  >
    <el-alert
      v-if="indicators.length === 0 && !loading"
      title="暂无评分数据"
      type="info"
      :closable="false"
      center
    />

    <div v-loading="loading" class="score-indicator">
      <table v-if="indicators.length > 0" class="score-indicator__table">
        <thead>
          <tr>
            <th class="score-indicator__th">指标</th>
            <th class="score-indicator__th score-indicator__th--center">得分</th>
            <th class="score-indicator__th score-indicator__th--center">满分</th>
            <th class="score-indicator__th score-indicator__th--center">权重</th>
            <th class="score-indicator__th score-indicator__th--center">得分率</th>
            <th class="score-indicator__th">备注</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in indicators" :key="index">
            <td class="score-indicator__td">{{ item.label }}</td>
            <td class="score-indicator__td score-indicator__td--center">
              <span
                class="score-indicator__score"
                :class="{
                  'score-indicator__score--high': item.score / item.maxScore >= 0.8,
                  'score-indicator__score--mid':
                    item.score / item.maxScore >= 0.6 && item.score / item.maxScore < 0.8,
                  'score-indicator__score--low': item.score / item.maxScore < 0.6,
                }"
              >
                {{ item.score }}
              </span>
            </td>
            <td class="score-indicator__td score-indicator__td--center">{{ item.maxScore }}</td>
            <td class="score-indicator__td score-indicator__td--center">
              {{ Math.round(item.weight * 100) }}%
            </td>
            <td class="score-indicator__td score-indicator__td--center">
              {{ formatPercent(item.score, item.maxScore) }}
            </td>
            <td class="score-indicator__td">{{ item.remark || '-' }}</td>
          </tr>
        </tbody>
      </table>

      <div v-if="indicators.length > 0" class="score-indicator__total">
        <span class="score-indicator__total-label">加权总分</span>
        <span class="score-indicator__total-value">
          {{ calcTotal(indicators).toFixed(1) }}
          / {{ calcMaxTotal(indicators).toFixed(1) }}
        </span>
      </div>
    </div>

    <template #footer>
      <el-button @click="emit('close')">关闭</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.score-indicator {
  min-height: 80px;

  &__table {
    width: 100%;
    border-collapse: collapse;
  }

  &__th {
    text-align: left;
    padding: 10px 8px;
    font-size: 13px;
    color: #606266;
    background: #f5f7fa;
    border-bottom: 1px solid #e4e7ed;
    font-weight: 600;

    &--center {
      text-align: center;
    }
  }

  &__td {
    padding: 10px 8px;
    font-size: 14px;
    color: #303133;
    border-bottom: 1px solid #ebeef5;

    &--center {
      text-align: center;
    }
  }

  &__score {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 4px;
    font-weight: 600;

    &--high {
      color: #67c23a;
      background: #f0f9eb;
    }

    &--mid {
      color: #e6a23c;
      background: #fdf6ec;
    }

    &--low {
      color: #f56c6c;
      background: #fef0f0;
    }
  }

  &__total {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 2px solid #409eff;

    &-label {
      font-size: 14px;
      color: #606266;
      font-weight: 600;
    }

    &-value {
      font-size: 18px;
      color: #409eff;
      font-weight: 700;
    }
  }
}
</style>
