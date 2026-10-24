import type { Directive } from 'vue'
import { usePermission } from '@/shared/composables/usePermission'

/**
 * 元素级权限指令：无权限时隐藏元素（保留 DOM 占位，权限异步到达后可恢复）。
 *
 * 用法：
 * ```vue
 * <el-button v-permission="'archive:export'">导出</el-button>
 * <el-button v-permission="['archive:export', 'archive:manage']">编辑</el-button>
 * <el-button v-permission="{ module: 'archive-export' }">导出中心</el-button>
 * ```
 * - 字符串 / 数组：按权限码判定（数组为「任一命中」）
 * - 对象 `{ module }`：按 teacherModuleRegistry 的模块 id 判定
 * - admin 角色直通（与路由守卫、菜单同源）
 *
 * 采用 `hidden` 属性而非移除节点：权限数据由 /auth/me 异步下发，
 * 移除后无法在权限到达时恢复。
 */
export type PermissionValue = string | string[] | { module: string }

function isAllowed(value: PermissionValue): boolean {
  const { hasPermission, isAdmin, canAccessModule } = usePermission()
  if (isAdmin.value) return true
  if (typeof value === 'object' && !Array.isArray(value)) return canAccessModule(value.module)
  const codes = Array.isArray(value) ? value : [value]
  return codes.some((code) => hasPermission(code))
}

function apply(el: HTMLElement, value: PermissionValue): void {
  const allowed = isAllowed(value)
  if (allowed) el.removeAttribute('hidden')
  else el.setAttribute('hidden', '')
}

export const vPermission: Directive<HTMLElement, PermissionValue> = {
  mounted(el, binding) {
    apply(el, binding.value)
  },
  updated(el, binding) {
    apply(el, binding.value)
  },
}
