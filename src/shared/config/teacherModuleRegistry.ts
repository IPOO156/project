import type { TeacherRole } from '@/shared/types/types'
import {
  BarChart3,
  ClipboardCheck,
  Database,
  Download,
  Eye,
  FileWarning,
  History,
  LayoutDashboard,
  Server,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
} from 'lucide-vue-next'
import { ROLE_PERMISSIONS } from '@/shared/types/types'

/**
 * 教师端菜单项
 */
export interface TeacherMenuItem {
  label: string
  icon?: any
  path?: string
  permission?: string
  children?: TeacherMenuItem[]
}

/**
 * 教师端已注册模块列表
 */
export interface TeacherModule {
  id: string
  label: string
  icon: any
  order: number
  routePrefix: string
  permission: string
  description: string
  menuItems: TeacherMenuItem[]
}

export const teacherModules: TeacherModule[] = [
  {
    id: 'teacher-dashboard',
    label: '首页',
    icon: LayoutDashboard,
    order: 10,
    routePrefix: '/teacher/dashboard',
    permission: '',
    description: '教师首页仪表盘',
    menuItems: [{ label: '首页', icon: LayoutDashboard, path: '/teacher/dashboard' }],
  },
  {
    id: 'archive-view',
    label: '档案查看',
    icon: Eye,
    order: 20,
    routePrefix: '/teacher/archive-view',
    permission: 'archive-view',
    description: '查看学生档案信息',
    menuItems: [{ label: '档案查看', icon: Eye, path: '/teacher/archive-view' }],
  },
  {
    id: 'archive-export',
    label: '档案导出',
    icon: Download,
    order: 25,
    routePrefix: '/teacher/archive-export',
    permission: 'archive-export',
    description: '导出学生档案数据',
    menuItems: [{ label: '档案导出', icon: Download, path: '/teacher/archive-export' }],
  },
  {
    id: 'material-review',
    label: '材料审核',
    icon: ClipboardCheck,
    order: 30,
    routePrefix: '/teacher/material-review',
    permission: 'material-review',
    description: '审核学生提交的材料',
    menuItems: [
      {
        label: '材料审核',
        icon: ClipboardCheck,
        children: [
          { label: '院领导审核', icon: UserCheck, path: '/teacher/material-review/college' },
          { label: '系领导审核', icon: UserCog, path: '/teacher/material-review/department' },
        ],
      },
    ],
  },
  {
    id: 'heat-map',
    label: '成果热力图',
    icon: BarChart3,
    order: 35,
    routePrefix: '/teacher/heat-map',
    permission: 'heat-map',
    description: '学生成果数据热力图',
    menuItems: [{ label: '成果热力图', icon: BarChart3, path: '/teacher/heat-map' }],
  },
  {
    id: 'log-view',
    label: '日志查看',
    icon: History,
    order: 40,
    routePrefix: '/teacher/log-view',
    permission: 'log-view',
    description: '系统操作日志',
    menuItems: [{ label: '日志查看', icon: History, path: '/teacher/log-view' }],
  },
  {
    id: 'role-selection',
    label: '角色选择',
    icon: UserCog,
    order: 50,
    routePrefix: '/teacher/role-selection',
    permission: 'role-selection',
    description: '教师职位调整与新增账号',
    menuItems: [
      {
        label: '角色选择',
        icon: UserCog,
        children: [
          { label: '教师职位调整', icon: Users, path: '/teacher/role-selection/adjust' },
          { label: '新增账号', icon: UserPlus, path: '/teacher/role-selection/add' },
        ],
      },
    ],
  },
  {
    id: 'form-customization',
    label: '表单自定义',
    icon: SlidersHorizontal,
    order: 55,
    routePrefix: '/teacher/form-customization',
    permission: 'form-customization',
    description: '自定义表单与发布信息',
    menuItems: [
      { label: '表单自定义', icon: SlidersHorizontal, path: '/teacher/form-customization' },
    ],
  },
  {
    id: 'account-management',
    label: '账号管理',
    icon: Users,
    order: 60,
    routePrefix: '/teacher/account-management',
    permission: 'account-management',
    description: '管理学生与教师账号',
    menuItems: [
      {
        label: '账号管理',
        icon: Users,
        children: [
          { label: '学生账号', icon: UserCheck, path: '/teacher/account-management/student' },
          { label: '教师账号', icon: UserCog, path: '/teacher/account-management/teacher' },
        ],
      },
    ],
  },
  {
    id: 'system-maintenance',
    label: '系统维护',
    icon: Server,
    order: 70,
    routePrefix: '/teacher/system-maintenance',
    permission: 'system-maintenance',
    description: '硬件与软件系统维护',
    menuItems: [
      {
        label: '系统维护',
        icon: Server,
        children: [
          { label: '硬件维护', icon: Server, path: '/teacher/system-maintenance/hardware' },
          { label: '软件维护', icon: FileWarning, path: '/teacher/system-maintenance/software' },
        ],
      },
    ],
  },
  {
    id: 'info-security',
    label: '信息安全',
    icon: Shield,
    order: 75,
    routePrefix: '/teacher/info-security',
    permission: 'info-security',
    description: '网络安全与数据安全',
    menuItems: [
      {
        label: '信息安全',
        icon: Shield,
        children: [
          { label: '网络安全', icon: ShieldCheck, path: '/teacher/info-security/network' },
          { label: '数据安全', icon: Database, path: '/teacher/info-security/data' },
        ],
      },
    ],
  },
]

/**
 * 根据角色获取有权限的菜单项
 */
export function getTeacherMenuItems(role: TeacherRole | undefined): TeacherMenuItem[] {
  const allowedPermissions = role ? (ROLE_PERMISSIONS[role] ?? []) : []

  return [...teacherModules]
    .filter((mod) => {
      if (mod.id === 'teacher-dashboard') return true
      if (!mod.permission) return true
      return allowedPermissions.includes(mod.permission)
    })
    .sort((a, b) => a.order - b.order)
    .map((mod) => ({
      ...mod.menuItems[0],
      children: mod.menuItems[0].children?.filter((child) => {
        if (!child.permission) return true
        return allowedPermissions.includes(child.permission)
      }),
    }))
}
