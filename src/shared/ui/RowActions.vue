<script setup lang="ts">
/**
 * RowActions - 表格行操作统一容器
 *
 * 高频、需要一眼看到的操作放在默认插槽；
 * 低频或高风险操作放在 more 插槽，由「更多」下拉承载。
 * 所有原操作保持不变，只调整呈现层级，避免操作列换行、挤压和误点。
 */
import { ChevronDown } from 'lucide-vue-next'

defineOptions({ name: 'RowActions' })

const props = withDefaults(
  defineProps<{
    /** 是否渲染「更多」入口；用于所有附加操作都被权限/状态隐藏的行 */
    more?: boolean
  }>(),
  { more: true },
)
</script>

<template>
  <div class="row-actions">
    <div v-if="$slots.default" class="row-actions__inline">
      <slot />
    </div>
    <el-dropdown
      v-if="props.more && $slots.more"
      trigger="click"
      placement="bottom-end"
      popper-class="row-actions-menu"
    >
      <el-button text size="small" class="row-actions__more" aria-label="更多操作">
        更多<ChevronDown :size="14" />
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <slot name="more" />
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<style scoped lang="scss">
.row-actions {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  // 行内操作与「更多」之间保留 4px，避免文字按钮内边距相抵后看起来连在一起
  gap: 4px;
  max-width: 100%;
  white-space: nowrap;

  &__inline {
    display: inline-flex;
    align-items: center;
    min-width: 0;

    // Element Plus 默认给相邻按钮 12px 间距，行内操作统一收紧到 4px
    :deep(.el-button + .el-button) {
      margin-left: 4px;
    }

    :deep(.el-button) {
      margin-left: 0;
    }
  }

  &__more {
    flex-shrink: 0;
    padding: 0 6px;
    color: var(--el-text-color-secondary);

    &:hover,
    &:focus {
      color: var(--el-color-primary);
    }

    :deep(.lucide) {
      margin-left: 2px;
    }
  }
}
</style>

<style lang="scss">
// 下拉菜单默认 Teleport 到 body，无法被 scoped 样式命中；
// 统一用 row-actions-menu 命名空间限定，仅影响行操作菜单。
.row-actions-menu {
  .row-actions__danger {
    color: var(--el-color-danger);
  }

  .el-dropdown-menu__item.is-disabled .row-actions__danger {
    color: var(--el-text-color-disabled);
  }
}
</style>
