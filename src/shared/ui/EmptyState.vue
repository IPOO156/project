<script setup lang="ts">
/**
 * EmptyState - 通用空状态组件
 *
 * 用法：
 * <EmptyState text="暂无申报记录">
 *   <el-button type="primary" @click="handleAdd">立即新增</el-button>
 * </EmptyState>
 */
import { FileSearch } from 'lucide-vue-next'
import { computed } from 'vue'
import { USER_INFO_CACHE_KEY } from '@/shared/constants/storageKeys'
import StudyTipInline from './StudyTipInline.vue'

interface Props {
  /** 文案 */
  text?: string
  /** 是否紧凑模式（用于卡片内） */
  compact?: boolean
  /** 是否展示一条情境化学习建议（默认展示；教师端 / 管理员端不展示） */
  showTip?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  text: '暂无数据',
  compact: false,
  showTip: true,
})

/**
 * 教师 / 管理员身份：从登录后写入的身份缓存读 loginType，
 * 避免 shared 层反向依赖 app 层 store（分层红线）。
 * 只在本实例创建时读一次即可——换账号会重建页面组件。
 */
function readIsStaff(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem(USER_INFO_CACHE_KEY)
    return raw ? JSON.parse(raw).loginType === 'teacher' : false
  } catch {
    return false
  }
}

const isStaff = readIsStaff()

/**
 * 学生小贴士（「社团、竞赛、实习都可以试」）只服务于学生端。
 * 教师 / 管理员看的是待办队列与治理数据，空态需要的是「一句说明 + 一个出路按钮」，
 * 多一段面向学生的话术只会增加噪声，因此按角色直接关闭，学生端渲染保持原样。
 */
const showTipVisible = computed(() => props.showTip && !isStaff)
</script>

<template>
  <div
    class="empty-state"
    :class="{ 'empty-state--compact': compact, 'empty-state--staff': isStaff }"
  >
    <div class="empty-state__icon-wrap">
      <FileSearch
        :size="isStaff ? (compact ? 24 : 32) : compact ? 40 : 56"
        class="empty-state__icon"
      />
    </div>
    <p class="empty-state__text">{{ text }}</p>

    <!-- 空状态停留时间比加载页长，适合放一条情境化建议（仅学生端） -->
    <StudyTipInline v-if="showTipVisible" />

    <div v-if="$slots.default" class="empty-state__action">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-2xl;
  gap: $spacing-md;

  &--compact {
    padding: $spacing-xl;
  }

  /* 教师 / 管理员：扁平、小图标、单行说明，去掉圆形色块与多层留白 */
  &--staff {
    padding: $spacing-xl $spacing-lg;
    gap: $spacing-sm;

    .empty-state__icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 6px;
      background: var(--el-fill-color-light);
    }

    .empty-state__icon {
      opacity: 0.75;
    }

    .empty-state__text {
      font-size: 14px;
      color: var(--el-text-color-regular);
    }
  }

  &__icon-wrap {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: rgba(139, 99, 64, 0.04);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__icon {
    color: var(--el-text-color-placeholder);
    opacity: 0.6;
  }

  &__text {
    margin: 0;
    color: var(--el-text-color-secondary);
    font-size: $font-size-base;
  }

  &__action {
    margin-top: $spacing-sm;
  }
}
</style>
