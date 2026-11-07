import type { MenuItem } from '@/shared/config/moduleRegistry'
import { findModuleByRoutePrefix, getMenuItems } from '@/shared/config/moduleRegistry'

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

/** 取菜单树里第一个带 path 的项（折叠组本身通常没有 path） */
function firstMenuEntry(items: MenuItem[]): MenuItem | undefined {
  for (const item of items) {
    if (item.path) return item
    if (item.children) {
      const found = firstMenuEntry(item.children)
      if (found) return found
    }
  }
  return undefined
}

/**
 * 按路由路径解析菜单项：先精确匹配，再按模块 routePrefix 兜底。
 *
 * 缘由：菜单入口可能被指向模块内的另一页（例如申报模块入口指向申报看板），
 * 此时路由 `/applications` 无法精确命中任何菜单项，侧栏高亮与页签图标会整块丢失。
 * 兜底完全基于 moduleRegistry 的 routePrefix 与菜单数据，不硬编码具体路径，
 * `/applications` 与模块内其它路径都能解析到同一个模块入口项。
 */
export function findMenuItemByRoute(
  path: string,
  items: MenuItem[] = menuItems,
): MenuItem | undefined {
  const exact = findMenuItemByPath(path, items)
  if (exact) return exact
  const module = findModuleByRoutePrefix(path)
  return module ? firstMenuEntry(module.menuItems) : undefined
}
