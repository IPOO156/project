import { useTeacherAuthz } from './useTeacherAuthz'

/**
 * 权限判定统一入口（模板指令 v-permission 与组件内分支共用）。
 *
 * 说明：权限来源为 GET /auth/me 的 permissions / roles，底层判定逻辑收敛在
 * `useTeacherAuthz`（菜单、路由守卫、组件三处同源），本 composable 只做
 * 「权限语义」层面的门面，避免各页面自行拼 hasPermission 判断。
 *
 * 学生端目前无权限码体系：调用方应先确认当前处于教师端上下文。
 */
export function usePermission() {
  const { hasPermission, isAdmin, canAccessAny, canAccessModule } = useTeacherAuthz()

  // 注意：isAdmin / canAccess* 内部已处理 admin 角色直通，无需调用方重复判断

  return { hasPermission, isAdmin, canAccessAny, canAccessModule }
}
