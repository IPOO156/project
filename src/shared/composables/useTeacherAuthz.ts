import { computed } from 'vue'
import {
  ADMIN_ROLE_CODE,
  getBaselineModuleIds,
  getTeacherMenuItems,
  isAuthzDataMissing,
  isModuleAllowed,
} from '@/shared/config/teacherModuleRegistry'
import { useTeacherMe } from './useTeacherMe'

/**
 * 教师端授权判定 —— 菜单、路由守卫、组件内分支的唯一入口。
 *
 * 权限来源统一为 GET /auth/me 返回的 permissions（permissionCode），
 * 不再依赖前端硬编码的角色枚举：后端「角色管理」里调整权限码后，
 * 用户重新登录即可看到菜单与可访问页面随之变化。
 */
export function useTeacherAuthz() {
  const { me } = useTeacherMe()

  /** 当前登录者持有的权限码（/auth/me.permissions） */
  const permissions = computed<string[]>(() => me.value?.permissions ?? [])

  /** 当前登录者的角色码（/auth/me.roles，如 ['admin'] / ['teacher','counselor']） */
  const roles = computed<string[]>(() => me.value?.roles ?? [])

  /** 是否持有指定权限码 */
  function hasPermission(code: string): boolean {
    return permissions.value.includes(code)
  }

  /**
   * 是否持 admin 角色。
   * 后端管理端鉴权是角色直通（AdminAuthService.requireAdminOrPermission 对 admin 角色
   * 直接放行、不校验权限码），线上管理员的 /auth/me.permissions 因此为空 —— 组件内
   * 做「单码」判定时必须先走这里，否则会把管理员的功能误判为无权限。
   */
  const isAdmin = computed(() => roles.value.includes(ADMIN_ROLE_CODE))

  /**
   * 是否持有指定权限码集合中的任意一个（admin 角色直通）。
   * 与 isModuleAllowed 同序：① admin 直通 → ② 命中任一码。
   * 用于模块内更细粒度的入口/子页判定（如聚合页的 tab 显隐）。
   */
  function canAccessAny(codes: string[]): boolean {
    return isAdmin.value || codes.some((code) => hasPermission(code))
  }

  /** 是否可访问指定模块（按 teacherModuleRegistry 的模块 id 判定，admin 角色直通） */
  function canAccessModule(moduleId: string): boolean {
    return isModuleAllowed(moduleId, permissions.value, roles.value)
  }

  /** 侧边栏菜单项（按当前角色 + 权限码过滤） */
  const menuItems = computed(() => getTeacherMenuItems(permissions.value, roles.value))

  /**
   * 是否已按「角色基线菜单」回退展示。
   *
   * 为 true 说明 `/auth/me` 没下发权限码（授权数据未就绪），菜单与路由已从
   * 权限码判定降级为角色基线判定（见 ROLE_BASELINE_MODULES）。仅用于给用户
   * 一条非阻断提示，**不参与任何鉴权判定** —— 判定入口只有 isModuleAllowed。
   */
  const baselineFallback = computed(
    () =>
      isAuthzDataMissing(permissions.value, roles.value) &&
      getBaselineModuleIds(roles.value).length > 0,
  )

  /** 角色中文名（/auth/me.roleNames，如 ['管理员']；双角色为 ['教师', '辅导员']） */
  const roleLabel = computed(() => (me.value?.roleNames ?? []).join(' / '))

  return {
    permissions,
    roles,
    hasPermission,
    isAdmin,
    canAccessAny,
    canAccessModule,
    menuItems,
    baselineFallback,
    roleLabel,
  }
}
