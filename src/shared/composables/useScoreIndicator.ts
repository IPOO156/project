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
  /** 该维度权重 = 维度满分 / Σ维度满分。后端未给出满分时为 0（不编造） */
  weight: number
  remark?: string
}

export function useScoreIndicator() {
  const indicators = ref<IndicatorItem[]>([])
  const indicatorVisible = ref(false)
  const indicatorLoading = ref(false)
  const indicatorTitle = ref('')
  // 本次画像分数计算的计算说明 ID（GET /profile/scores 响应中的 calculationId）
  const indicatorCalculationId = ref<number | null>(null)

  /** 打开评分指标弹窗（对接 GET /profile/scores，4.1.2） */
  async function openIndicator(_type: string, title: string) {
    indicatorTitle.value = title
    indicatorLoading.value = true
    indicatorVisible.value = true
    try {
      const data = await getProfileScores()
      indicatorCalculationId.value = data?.calculationId ?? null
      const list = data?.list ?? []
      /**
       * 维度权重 = 维度满分 / Σ维度满分。
       *
       * 后端口径（2026-09-28 用 /profile/scores/{id}/details 的**指标级**权重实证）：
       * 指标级 weight 之和为 1、rawScore 为 0-100，维度得分 = Σ(weight × rawScore)，
       * 于是维度满分 targetScore = Σ(该维度指标权重) × 100 —— 实测 0.5/0.3/0.2 → 50/30/20，Σ=100，
       * 与 targetsScore 完全吻合。故按满分占比反推即可得到真权重，不需要后端额外补字段；
       * 此前用 `score / targetScore`（即得分率）冒充权重，使「权重」列与「得分率」列数字恒等（§5.2）。
       */
      const totalTargetScore = list.reduce((sum: number, d: any) => sum + (d.targetScore ?? 0), 0)
      indicators.value = list.map((d: any) => ({
        label: d.dimensionName,
        score: d.score,
        // 不编造满分：后端未给出时按 0 处理（此前写死 100，会让「加权总分」的满分数值虚高）
        maxScore: d.targetScore ?? 0,
        weight: totalTargetScore > 0 ? (d.targetScore ?? 0) / totalTargetScore : 0,
        remark: `当前 ${d.score} / 目标 ${d.targetScore}，差距 ${d.gap}${d.unit || '分'}`,
      }))
    } catch {
      indicators.value = []
      indicatorCalculationId.value = null
    } finally {
      indicatorLoading.value = false
    }
  }

  /** 关闭评分指标弹窗 */
  function closeIndicator() {
    indicatorVisible.value = false
    indicators.value = []
    indicatorTitle.value = ''
    indicatorCalculationId.value = null
  }

  return {
    indicators,
    indicatorVisible,
    indicatorLoading,
    indicatorTitle,
    indicatorCalculationId,
    openIndicator,
    closeIndicator,
  }
}
