import type { MenuItem } from '@/shared/config/moduleRegistry'
import { getMenuItems } from '@/shared/config/moduleRegistry'

/**
 * 侧边栏菜单配置（集中维护，避免 Sidebar 与 Tab 栏分别硬编码）。
 * 当前菜单由模块注册表（moduleRegistry.ts）派生，新增模块只需在注册表中配置一处。
 */
export const menuItems: MenuItem[] = getMenuItems()

export type { MenuItem }

/**
 * 根据路径查找对应的菜单项（递归查找子菜单）。
 * 用于标签栏根据当前路由匹配图标。
 */
export function findMenuItemByPath(
  path: string,
  items: MenuItem[] = menuItems,
): MenuItem | undefined {
  for (const item of items) {
    if (item.path === path) {
      return item
    }
    if (item.children) {
      const found = findMenuItemByPath(path, item.children)
      if (found) {
        return found
      }
    }
  }
  return undefined
}
