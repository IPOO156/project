/**
 * useScoreIndicator - 评分指标 composable
 *
 * 管理评分指标弹窗的状态和数据加载。
 * 配合 ScoreIndicatorDialog 使用。
 */
import { ref } from 'vue'
import { getScoreIndicators } from '@/shared/api/submission'

/** 评分指标项 */
export interface IndicatorItem {
  label: string
  score: number
  maxScore: number
  weight: number
  remark?: string
}

export function useScoreIndicator() {
  const indicators = ref<IndicatorItem[]>([])
  const indicatorVisible = ref(false)
  const indicatorLoading = ref(false)
  const indicatorTitle = ref('')

  /** 打开评分指标弹窗 */
  async function openIndicator(type: string, title: string) {
    indicatorTitle.value = title
    indicatorLoading.value = true
    indicatorVisible.value = true
    try {
      const data = await getScoreIndicators(type)
      indicators.value = data
    } catch {
      indicators.value = []
    } finally {
      indicatorLoading.value = false
    }
  }

  /** 关闭评分指标弹窗 */
  function closeIndicator() {
    indicatorVisible.value = false
    indicators.value = []
    indicatorTitle.value = ''
  }

  return {
    indicators,
    indicatorVisible,
    indicatorLoading,
    indicatorTitle,
    openIndicator,
    closeIndicator,
  }
}
