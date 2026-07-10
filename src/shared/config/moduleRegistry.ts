import type { Component } from 'vue'
import {
  BarChart3,
  Bell,
  Clock,
  Compass,
  FilePen,
  FileText,
  GraduationCap,
  Home,
  IdCard,
  Inbox,
  Lightbulb,
  MessageSquare,
  Star,
  Trophy,
  User,
} from 'lucide-vue-next'

/**
 * 侧边栏菜单项
 * 仅描述菜单结构，不包含交互/路由跳转逻辑。
 */
export interface MenuItem {
  label: string
  icon?: Component
  path?: string
  children?: MenuItem[]
}

/**
 * 应用模块注册项
 * 新增业务模块时，在此处添加一处配置即可同步菜单、图标与排序。
 */
export interface AppModule {
  /** 模块唯一标识 */
  id: string
  /** 模块中文名 */
  label: string
  /** 模块默认图标 */
  icon: Component
  /** 侧边栏排序，数值越小越靠前 */
  order: number
  /** 路由前缀，如 /messages */
  routePrefix: string
  /** 该模块贡献的菜单项 */
  menuItems: MenuItem[]
  /** 模块说明 */
  description?: string
}

/**
 * 已注册的应用模块列表
 * 原则：
 *  - 每个模块独立维护自身菜单项
 *  - 模块间不互相引用内部实现
 *  - 路由表（routes.ts）继续作为路由权威来源，此处仅描述菜单与模块元数据
 */
export const registeredModules: AppModule[] = [
  {
    id: 'dashboard',
    label: '首页',
    icon: Home,
    order: 10,
    routePrefix: '/dashboard',
    description: '首页仪表盘与快捷入口',
    menuItems: [{ label: '首页', icon: Home, path: '/dashboard' }],
  },
  {
    id: 'growth-timeline',
    label: '成长时间轴',
    icon: Clock,
    order: 20,
    routePrefix: '/growth-timeline',
    description: '成长经历时间轴可视化',
    menuItems: [{ label: '成长时间轴', icon: Clock, path: '/growth-timeline' }],
  },
  {
    id: 'profile',
    label: '个人中心',
    icon: User,
    order: 70,
    routePrefix: '/profile',
    description: '个人档案信息与职业规划',
    menuItems: [
      {
        label: '个人中心',
        icon: User,
        children: [
          { label: '个人档案信息', icon: IdCard, path: '/profile/info' },
          { label: '职业规划', icon: Compass, path: '/profile/career-plan' },
        ],
      },
    ],
  },
  {
    id: 'messages',
    label: '消息中心',
    icon: Inbox,
    order: 60,
    routePrefix: '/messages',
    description: '系统通知、审批提醒与动态记录',
    menuItems: [
      {
        label: '消息中心',
        icon: Inbox,
        children: [
          { label: '通知', icon: Bell, path: '/messages' },
          { label: '动态记录', icon: Clock, path: '/messages/activities' },
        ],
      },
    ],
  },
  {
    id: 'ai-chat',
    label: 'AI 助手',
    icon: MessageSquare,
    order: 38,
    routePrefix: '/ai-chat',
    description: 'AI 智能问答助手',
    menuItems: [{ label: 'AI 助手', icon: MessageSquare, path: '/ai-chat' }],
  },
  {
    id: 'applications',
    label: '个人档案信息申报',
    icon: FilePen,
    order: 30,
    routePrefix: '/applications',
    description: '各类档案信息申报入口',
    menuItems: [{ label: '个人档案信息申报', icon: FilePen, path: '/applications' }],
  },
  {
    id: 'awards',
    label: '奖项报名',
    icon: Star,
    order: 40,
    routePrefix: '/awards',
    description: '奖项总览与各类奖项报名',
    menuItems: [
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
    ],
  },
  {
    id: 'approval',
    label: '我的申报',
    icon: FileText,
    order: 50,
    routePrefix: '/approval',
    description: '查看与管理个人申报与奖项报名记录',
    menuItems: [
      {
        label: '我的申报',
        icon: FileText,
        children: [
          { label: '申报看板', icon: Clock, path: '/approval/pending' },
          { label: '奖项看板', icon: Star, path: '/approval/award-review' },
        ],
      },
    ],
  },
]

/**
 * 按 order 排序并扁平化所有模块贡献的菜单项
 */
export function getMenuItems(): MenuItem[] {
  return [...registeredModules]
    .sort((a, b) => a.order - b.order)
    .flatMap((module) => module.menuItems)
}

/**
 * 根据模块 ID 查找已注册模块
 */
export function findModuleById(id: string): AppModule | undefined {
  return registeredModules.find((module) => module.id === id)
}
