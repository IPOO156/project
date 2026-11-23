import type { SaveCareerPlanDraftPayload, SubmitCareerPlanPayload } from '@/shared/api/career-plan'
import type { CareerAnalysis, CareerPlanRecord } from '@/shared/types/types'
import { ElMessage } from 'element-plus'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getCareerPlans, saveCareerPlanDraft, submitCareerPlan } from '@/shared/api/career-plan'

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
  /** 规划列表加载失败（供页面展示错误空态；不回退示例数据） */
  const loadError = ref(false)
  /** AI 短板分析结果（null = 尚未分析） */
  const aiAnalysis = ref<CareerAnalysis | null>(null)

  let pendingFetch: Promise<void> | null = null
  let lastFetchedAt = 0
  const CACHE_TTL_MS = 60_000

  async function fetchPlans(force = false): Promise<void> {
    if (!force && pendingFetch) return pendingFetch
    // 强制刷新时先等在途请求结束再重新拉取，避免提交后回查命中提交前的旧请求（报告 #13）
    let inflight = pendingFetch
    while (inflight) {
      await inflight
      inflight = pendingFetch
    }
    if (!force && Date.now() - lastFetchedAt < CACHE_TTL_MS && plans.value.length > 0) return
    loading.value = true
    pendingFetch = (async () => {
      try {
        plans.value = await getCareerPlans()
        lastFetchedAt = Date.now()
        loadError.value = false
      } catch {
        // 错误提示由 request.ts 响应拦截器统一给出；这里只置错误态供页面渲染空态，
        // 且不清空已有数据（刷新失败时保留上一次成功的列表，避免用户看到"记录消失"）。
        loadError.value = true
      } finally {
        loading.value = false
      }
    })()
    try {
      await pendingFetch
    } finally {
      pendingFetch = null
    }
  }

  async function submitPlan(data: SubmitCareerPlanPayload): Promise<void> {
    await submitCareerPlan(data)
    // POST 响应只有 planId/status/currentVersion/submitCount（文档 4.4），
    // 不含 submittedAt/progressRate；提交后回查列表，用 GET 4.3 的权威数据刷新记录。
    await fetchPlans(true)
    ElMessage.success('规划材料提交成功')
  }

  /** 保存后端草稿（isDraft=1）：草稿不出现在「待审批」，会随列表刷新回到规划记录中 */
  async function saveDraftPlan(data: SaveCareerPlanDraftPayload): Promise<void> {
    await saveCareerPlanDraft(data)
    await fetchPlans(true)
    ElMessage.success('草稿已保存')
  }

  /** AI 助手写入短板分析结果（触发 CareerPlan.vue 短板区域更新） */
  function setAIAnalysis(analysis: CareerAnalysis): void {
    aiAnalysis.value = analysis
  }

  function clearAIAnalysis(): void {
    aiAnalysis.value = null
  }

  /**
   * 重置用户级状态（登出/换账号时调用）。
   * 除清空 state 外，复位模块级请求缓存变量（pendingFetch / lastFetchedAt）：
   * 否则换账号后 60s TTL 内仍会命中上一账号的规划列表缓存。
   */
  function reset(): void {
    pendingFetch = null
    lastFetchedAt = 0
    plans.value = []
    loading.value = false
    loadError.value = false
    aiAnalysis.value = null
  }

  return {
    plans,
    loading,
    loadError,
    aiAnalysis,
    fetchPlans,
    submitPlan,
    saveDraftPlan,
    setAIAnalysis,
    clearAIAnalysis,
    reset,
  }
})
