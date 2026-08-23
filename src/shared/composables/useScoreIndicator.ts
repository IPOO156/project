/**
 * useScoreIndicator - 评分指标 composable
 *
 * 管理评分指标弹窗的状态和数据加载。
 * 配合 ScoreIndicatorDialog 使用。
 */
import { ref } from 'vue'
import { getProfileScores } from '@/shared/api/student'

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

  /** 打开评分指标弹窗（对接 GET /profile/scores，4.1.2） */
  async function openIndicator(_type: string, title: string) {
    indicatorTitle.value = title
    indicatorLoading.value = true
    indicatorVisible.value = true
    try {
      const data = await getProfileScores()
      indicators.value = (data?.list ?? []).map((d: any) => ({
        label: d.dimensionName,
        score: d.score,
        maxScore: d.targetScore || 100,
        weight: d.targetScore ? d.score / d.targetScore : 0,
        remark: `当前 ${d.score} / 目标 ${d.targetScore}，差距 ${d.gap}${d.unit || '分'}`,
      }))
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
