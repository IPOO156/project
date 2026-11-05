<script setup lang="ts">
import type { LoadingTip, LoadingTipCategory } from '@/shared/constants/loadingTips'
import { computed, ref, watch } from 'vue'
import {
  getFavoriteTips,
  getHiddenTipCategories,
  LOADING_TIP_CATEGORY_LABELS,
  restoreTipCategory,
  toggleFavoriteTip,
} from '@/shared/constants/loadingTips'

/**
 * 学习建议管理：收藏夹 + 已屏蔽主题。
 * 入口在 HeaderBar 用户菜单，避免加载页这种瞬时场景无法管理偏好。
 */
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const favorites = ref<LoadingTip[]>([])
const hiddenCategories = ref<LoadingTipCategory[]>([])

function refreshState(): void {
  favorites.value = getFavoriteTips()
  hiddenCategories.value = getHiddenTipCategories()
}

// 每次打开时读取最新偏好（提示卡里的操作可能已改动）
watch(
  () => props.modelValue,
  (open) => {
    if (open) refreshState()
  },
)

function removeFavorite(id: string): void {
  toggleFavoriteTip(id)
  refreshState()
}

function restore(category: LoadingTipCategory): void {
  restoreTipCategory(category)
  refreshState()
}
</script>

<template>
  <el-dialog v-model="visible" title="学习建议" width="560px">
    <div class="study-tips">
      <section class="study-tips__section">
        <h4 class="study-tips__title">
          已收藏
          <span class="study-tips__count">{{ favorites.length }}</span>
        </h4>
        <el-empty v-if="!favorites.length" description="还没有收藏的建议" :image-size="56" />
        <ul v-else class="study-tips__list">
          <li v-for="item in favorites" :key="item.id" class="study-tips__item">
            <span class="study-tips__category">{{
              LOADING_TIP_CATEGORY_LABELS[item.category]
            }}</span>
            <p class="study-tips__text">{{ item.text }}</p>
            <el-button link type="primary" size="small" @click="removeFavorite(item.id)">
              取消收藏
            </el-button>
          </li>
        </ul>
      </section>

      <section class="study-tips__section">
        <h4 class="study-tips__title">
          已屏蔽的主题
          <span class="study-tips__count">{{ hiddenCategories.length }}</span>
        </h4>
        <el-empty v-if="!hiddenCategories.length" description="没有屏蔽任何主题" :image-size="56" />
        <div v-else class="study-tips__hidden">
          <el-tag
            v-for="category in hiddenCategories"
            :key="category"
            closable
            type="info"
            @close="restore(category)"
          >
            {{ LOADING_TIP_CATEGORY_LABELS[category] }}
          </el-tag>
          <p class="study-tips__hint">点击标签上的 × 即可恢复该类提示</p>
        </div>
      </section>
    </div>
  </el-dialog>
</template>

<style scoped lang="scss">
.study-tips {
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;
  max-height: 60vh;
  overflow-y: auto;
}

.study-tips__title {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin: 0 0 $spacing-md;
  color: var(--el-text-color-primary);
  font-size: $font-size-base;
  font-weight: 600;
}

.study-tips__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  font-size: $font-size-xs;
  font-weight: 400;
}

.study-tips__list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  margin: 0;
  padding: 0;
  list-style: none;
}

.study-tips__item {
  position: relative;
  padding: $spacing-md $spacing-lg;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: $radius-lg;
  background: var(--el-fill-color-lighter);
}

.study-tips__category {
  color: var(--el-color-primary);
  font-size: $font-size-xs;
}

.study-tips__text {
  margin: $spacing-xs 0 $spacing-sm;
  color: var(--el-text-color-primary);
  font-size: $font-size-sm;
  line-height: 1.7;
}

.study-tips__hidden {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $spacing-sm;
}

.study-tips__hint {
  width: 100%;
  margin: $spacing-xs 0 0;
  color: var(--el-text-color-secondary);
  font-size: $font-size-xs;
}
</style>
