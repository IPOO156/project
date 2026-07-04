import type { Component } from 'vue'
import {
  BarChart3,
  Clock,
  Compass,
  FilePen,
  GraduationCap,
  Home,
  IdCard,
  Lightbulb,
  ShieldCheck,
  Star,
  Trophy,
  User,
} from 'lucide-vue-next'

export interface MenuItem {
  label: string
  icon?: Component
  path?: string
  children?: MenuItem[]
}

/**
 * 侧边栏菜单配置（集中维护，避免 Sidebar 与 Tab 栏分别硬编码）。
 * 原则：
 *  - 仅描述菜单结构，不包含交互/路由跳转逻辑
 *  - icon 使用 lucide-vue-next 组件，供 Sidebar 和标签栏共用
 */
export const menuItems: MenuItem[] = [
  { label: '首页', icon: Home, path: '/dashboard' },
  { label: '成长时间轴', icon: Clock, path: '/growth-timeline' },
  {
    label: '个人中心',
    icon: User,
    children: [
      { label: '个人档案信息', icon: IdCard, path: '/profile/info' },
      { label: '职业规划', icon: Compass, path: '/profile/career-plan' },
    ],
  },
  {
    label: '个人档案信息申报',
    icon: FilePen,
    path: '/applications',
  },
  {
    label: '奖项报名',
    icon: Star,
    children: [
      { label: '奖项总览', icon: BarChart3, path: '/awards' },
      { label: '竞赛之星报名', icon: Trophy, path: '/awards/competition-star' },
      { label: '科研之星报名', icon: GraduationCap, path: '/awards/scientific-star' },
      { label: '双创之星报名', icon: Lightbulb, path: '/awards/innovation-star' },
    ],
  },
  {
    label: '审批与记录',
    icon: ShieldCheck,
    children: [{ label: '待审批信息', icon: Clock, path: '/approval/pending' }],
  },
]

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
