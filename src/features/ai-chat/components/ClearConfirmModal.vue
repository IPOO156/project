<script setup lang="ts">
/**
 * ClearConfirmModal - 清空对话确认弹窗
 *
 * 定制图标 + 标题 + 描述 + 取消/确定，贴合参考页视觉
 * （不使用 ElMessageBox 以保持与参考页一致的卡片样式）
 */
import { AlertTriangle } from 'lucide-vue-next'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Transition name="modal">
    <div v-if="visible" class="ccm" @click.self="emit('cancel')">
      <div class="ccm__dialog">
        <div class="ccm__icon">
          <AlertTriangle :size="28" />
        </div>
        <h3 class="ccm__title">清空当前对话？</h3>
        <p class="ccm__desc">
          清空后将保留欢迎语，当前对话内容将被移除。如需保存，请先导出或新建对话后再清空。
        </p>
        <div class="ccm__actions">
          <button class="ccm__btn ccm__btn--ghost" @click="emit('cancel')">取消</button>
          <button class="ccm__btn ccm__btn--primary" @click="emit('confirm')">确认清空</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.ccm {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: $z-modal;

  &__dialog {
    width: 380px;
    max-width: calc(100vw - 32px);
    background: var(--el-bg-color);
    border-radius: $radius-xl;
    box-shadow: $shadow-lg;
    padding: $spacing-xl;
    text-align: center;
  }

  &__icon {
    width: 56px;
    height: 56px;
    margin: 0 auto $spacing-md;
    border-radius: 50%;
    background: rgba($color-warning, 0.12);
    color: $color-warning;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__title {
    margin: 0 0 $spacing-sm;
    font-size: $font-size-lg;
    color: var(--el-text-color-primary);
  }

  &__desc {
    margin: 0 0 $spacing-lg;
    font-size: $font-size-sm;
    color: var(--el-text-color-secondary);
    line-height: 1.6;
  }

  &__actions {
    display: flex;
    gap: $spacing-sm;
    justify-content: center;
  }

  &__btn {
    flex: 1;
    padding: $spacing-sm $spacing-md;
    border-radius: $radius-base;
    font-size: $font-size-sm;
    cursor: pointer;
    transition: all $duration-fast $ease-standard;
    border: 1px solid transparent;

    &--ghost {
      background: var(--el-fill-color-light);
      color: var(--el-text-color-regular);

      &:hover {
        background: var(--el-fill-color);
      }
    }

    &--primary {
      background: $color-danger;
      color: #fff;

      &:hover {
        opacity: 0.9;
      }
    }
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity $duration-base $ease-standard;

  .ccm__dialog {
    transition: all $duration-base $ease-emphasized;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .ccm__dialog {
    transform: scale(0.92) translateY(8px);
  }
}
</style>
