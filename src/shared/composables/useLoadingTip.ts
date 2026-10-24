import type { LoadingTip } from '@/shared/constants/loadingTips'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/app/stores/stores'
import {
  pickLoadingTip,
  resolveGradeStage,
  resolveLoadingTipCategories,
} from '@/shared/constants/loadingTips'

/**
 * 学习建议：按当前路由/角色挑主题，并按年级收敛专属文案。
 * 加载遮罩与空状态共用本 composable，口径一致。
 */
export function useLoadingTip() {
  const route = useRoute()
  const userStore = useUserStore()

  const categories = computed(() =>
    resolveLoadingTipCategories(route.path, Boolean(route.meta?.teacher)),
  )
  // /profile/info 加载后会把学籍年级同步进 userStore；未识别时返回 null，只取通用建议
  const stage = computed(() => resolveGradeStage(userStore.userInfo?.grade))
  const tip = ref<LoadingTip>(pickLoadingTip(categories.value, { stage: stage.value }))

  /** 重新抽取一条（排除当前这条） */
  function refresh(): void {
    tip.value = pickLoadingTip(categories.value, {
      stage: stage.value,
      excludeId: tip.value.id,
    })
  }

  return { tip, categories, stage, refresh }
}
