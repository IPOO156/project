import { computed } from 'vue'

/**
 * 权限判断 Composable（占位实现）
 * 后续根据实际权限接口扩展
 */
export function usePermission() {
  function hasPermission(_permission: string): boolean {
    // TODO: 接入实际权限数据
    return true
  }

  const isAdmin = computed(() => hasPermission('admin'))

  return {
    hasPermission,
    isAdmin,
  }
}
