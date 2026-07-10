import type { CareerAnalysis, CareerPlanRecord } from '@/shared/types/types'
import { ElMessage } from 'element-plus'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getCareerPlans, submitCareerPlan } from '@/shared/api/career-plan'

/**
 * 职业规划 Store
 * 管理职业规划材料提交记录 + AI 短板分析结果
 *
 * 数据来源：
 *  - plans：careerPlanApi（后端就绪后只需改 API 层）
 *  - aiAnalysis：AI 助手生成（useAIChat 命中职业规划关键词时写入，
 *    CareerPlan.vue 读取渲染短板区域，实现 AI 回复回流页面）
 */
export const useCareerPlanStore = defineStore('career-plan', () => {
  const plans = ref<CareerPlanRecord[]>([])
  const loading = ref(false)
  /** AI 短板分析结果（null = 尚未分析） */
  const aiAnalysis = ref<CareerAnalysis | null>(null)

  async function fetchPlans(): Promise<void> {
    loading.value = true
    try {
      plans.value = await getCareerPlans()
    } finally {
      loading.value = false
    }
  }

  async function submitPlan(data: Pick<CareerPlanRecord, 'semester' | 'title'>): Promise<void> {
    const item = await submitCareerPlan(data)
    plans.value.unshift(item)
    ElMessage.success('规划材料提交成功')
  }

  /** AI 助手写入短板分析结果（触发 CareerPlan.vue 短板区域更新） */
  function setAIAnalysis(analysis: CareerAnalysis): void {
    aiAnalysis.value = analysis
  }

  function clearAIAnalysis(): void {
    aiAnalysis.value = null
  }

  return { plans, loading, aiAnalysis, fetchPlans, submitPlan, setAIAnalysis, clearAIAnalysis }
})
