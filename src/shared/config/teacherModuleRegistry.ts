import {
  Archive,
  BarChart3,
  Bell,
  Building2,
  ClipboardCheck,
  Eye,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  LayoutTemplate,
  Settings,
  Users,
  Workflow,
} from 'lucide-vue-next'

/**
 * 管理员角色码（GET /auth/me 的 roles 元素，对应 roles.code）。
 *
 * 后端管理端鉴权是**角色直通**：AdminAuthService.requireAdminOrPermission 在
 * 「持有 admin 角色」时直接放行，不校验任何权限码；因此线上库并未给 admin
 * 角色授予权限码（/auth/me.permissions 为空）。前端镜像这一口径 —— 持 admin
 * 角色即放行全部模块，否则会出现「后端放行、前端不显示」的两套口径割裂。
 */
export const ADMIN_ROLE_CODE = 'admin'

/**
 * 学生角色码（GET /auth/login 与 /auth/me 的 roles 元素，对应 roles.code）。
 *
 * 登录入口鉴权的判据：学生登录页签只接受持本码的账号，其余页签一律拒绝本码。
 * 后端目前**不接收登录入口信息**（POST /auth/login 请求体只有 userNo/password/captcha*），
 * 因此无法在服务端拒绝错配，前端这层是唯一的一道（详见 Login.vue 的 handleLogin）。
 */
export const STUDENT_ROLE_CODE = 'student'

/**
 * 教师端（含管理员）可登录角色码。
 *
 * 与 ROLE_BASELINE_MODULES 的键同源：能进教师端的角色 = 管理员 / 教师 / 辅导员 / 系主任 / 院长。
 * 注意这是**登录入口**的判据，与模块级授权是两回事 —— 后者仍以 /auth/me 的
 * permissionCode 为准（见 useTeacherAuthz），本常量只用来回答「这个账号能不能从这个页签进」。
 *
 * 后端登录按角色 level 判定（student=1，其余为管理端），前端此前只列到 counselor，
 * 导致 department_head / college_dean 账号后端允许登录、前端却提示「不是管理端账号」。
 * 新增教师侧角色时必须同步本名单（数据库 roles 表新增角色不会自动进入前端白名单）。
 */
export const TEACHER_SIDE_ROLE_CODES: readonly string[] = [
  ADMIN_ROLE_CODE,
  'teacher',
  'counselor',
  'department_head',
  'college_dean',
]

/** 账号角色是否匹配所选登录入口（student 页签 / 教师端页签） */
export function isRoleMatchedLoginTab(roles: string[], tab: 'student' | 'admin'): boolean {
  return tab === 'student'
    ? roles.includes(STUDENT_ROLE_CODE)
    : roles.some((r) => TEACHER_SIDE_ROLE_CODES.includes(r))
}

/**
 * 过渡代理码：管理员菜单码（permissions.code = system:manage）。
 *
 * 上面 ADMIN_ROLE_CODE 的直通已覆盖管理员场景，本码在当前阶段是冗余兜底
 * （防止 /auth/me 的 roles 缺失/口径变化时管理员菜单再次塌空）。
 * 待后端为管理端模块逐个补建专属权限码后，连同本码一起删除。
 */
export const ADMIN_MENU_CODE = 'system:manage'

/**
 * 过渡通配码：该模块后端完全无权限码（如教师端 GET /teacher/logs）。
 * 过渡期对所有能进入教师端的用户放行，保持改造前的可见范围。
 * 待后端补码后替换为真实权限码并删除本码引用。
 */
export const ANY_CODE = '*'

/**
 * 授权数据未就绪时的**角色基线菜单**（过渡措施，后端补齐授权数据后删除）。
 *
 * 背景（已实测确认）：部署库对 teacher 角色没有任何 role_permissions 授权记录，
 * `GET /auth/me` 返回 HTTP 200 且 `roles: ['teacher']`、`permissions: []` —— 请求
 * 本身是成功的，是授权数据没有下发。此时权限码驱动的菜单只剩唯一挂通配码的
 * 「日志查看」，侧边栏整体塌空。
 *
 * 触发判据是「**空**」而不是「不含」：permissions 为空 = 数据没下发（不可判定），
 * 与「下发了但不含某码」= 明确无权，是两回事。故仅在空数据时回退，非空时一律
 * 按权限码判定，不改动既有口径；下发了但只含无关码的情况不回退（属真实无权）。
 *
 * 基线取值 = 改造前 ROLE_PERMISSIONS 的实际可见集合（折算为合并后的模块 id）：
 *   teacher   → 首页 / 档案查看 / 导出中心 / 成果热力图 / 日志查看 —— 原 5 项；
 *               日志查看合并进「系统设置」（基线只展示其中的操作日志 tab）
 *   counselor → 首页 / 材料审核 / 日志查看 / 成果热力图 —— 原 4 项
 * 另：消息中心原本就从顶栏铃铛进入，不属于这 5/4 项，但同样需要在基线状态下可达。
 * 即「改造前能看到的，改造后在数据缺失时至少还能看到」，只减不增，不放开新模块。
 */
export const ROLE_BASELINE_MODULES: Record<string, string[]> = {
  teacher: [
    'teacher-dashboard',
    'messages',
    'archive-view',
    'export-center',
    'heat-map',
    'system-settings',
  ],
  counselor: ['teacher-dashboard', 'messages', 'material-review', 'heat-map', 'system-settings'],
  // 系主任 / 院长为多级审批流的中间与终审节点（数据库 role_permissions 尚未授权）。
  // 授权数据为空时至少保证其能进入工作台并处理材料审核，与辅导员同口径；
  // 后端补齐角色权限码后本基线不再生效（非空数据一律按 permissions 判定）。
  department_head: [
    'teacher-dashboard',
    'messages',
    'material-review',
    'heat-map',
    'system-settings',
  ],
  college_dean: ['teacher-dashboard', 'messages', 'material-review', 'heat-map', 'system-settings'],
}

/**
 * 是否处于「授权数据未就绪」状态：权限码为空，且不持 admin 角色
 * （admin 由角色直通覆盖，见 ADMIN_ROLE_CODE，其 permissions 本就可能为空）。
 */
export function isAuthzDataMissing(permissions: string[], roles: string[] = []): boolean {
  return permissions.length === 0 && !roles.includes(ADMIN_ROLE_CODE)
}

/** 当前角色持有的基线模块 id（去重；无匹配角色时为空数组） */
export function getBaselineModuleIds(roles: string[]): string[] {
  return [...new Set(roles.flatMap((code) => ROLE_BASELINE_MODULES[code] ?? []))]
}

/** 教师端侧栏分组 */
export interface TeacherNavGroup {
  key: string
  label: string
  icon: any
  order: number
}

/**
 * 侧栏分组（5 组）：从原 17 个平铺入口压缩而来。
 * 分组只影响展示顺序，不影响路由与权限判定。
 */
export const teacherNavGroups: TeacherNavGroup[] = [
  { key: 'overview', label: '概览', icon: LayoutGrid, order: 10 },
  { key: 'archive', label: '档案业务', icon: Archive, order: 20 },
  { key: 'review', label: '审核与评估', icon: ClipboardCheck, order: 30 },
  { key: 'org', label: '组织与人员', icon: Users, order: 40 },
  { key: 'system', label: '系统', icon: Settings, order: 50 },
]

/** 教师端菜单项 */
export interface TeacherMenuItem {
  label: string
  icon?: any
  path?: string
  children?: TeacherMenuItem[]
  /** 所属侧栏分组（由注册表注入，菜单配置本身无需重复填写） */
  group?: string
  /** 来源模块 id，用于侧栏高亮与权限判定 */
  moduleId?: string
}

/** 教师端已注册模块列表 */
export interface TeacherModule {
  id: string
  label: string
  icon: any
  order: number
  routePrefix: string
  /** 所属侧栏分组（见 teacherNavGroups） */
  group: string
  /**
   * 不在侧栏展示。用于消息中心等只从顶栏进入的模块；
   * 模块仍保留，路由守卫与权限判定继续生效。
   */
  hidden?: boolean
  /**
   * 访问该模块所需的权限码（any-of：持有任一即可见）。
   *
   * 权限码取自后端 GET /auth/me 返回的 permissions，与前端角色枚举无关 ——
   * 在后台「角色管理」里调整角色权限即可改变菜单显隐与页面可访问性。
   */
  permissions: string[]
  description: string
  menuItems: TeacherMenuItem[]
}

export const teacherModules: TeacherModule[] = [
  {
    id: 'teacher-dashboard',
    label: '工作台',
    icon: LayoutDashboard,
    order: 10,
    routePrefix: '/teacher/dashboard',
    group: 'overview',
    // 教师/辅导员持 dashboard:view；管理员无此码，走过渡代理码
    permissions: ['dashboard:view', ADMIN_MENU_CODE],
    description: '教师首页工作台',
    menuItems: [{ label: '工作台', icon: LayoutDashboard, path: '/teacher/dashboard' }],
  },
  {
    id: 'messages',
    label: '消息中心',
    icon: Bell,
    order: 15,
    routePrefix: '/teacher/messages',
    group: 'overview',
    // 只从顶栏铃铛进入，不占侧栏入口。
    // 消息中心读取的是本人收件箱，后端无独立权限码；能进教师端即可查看，
    // 因此挂通配码，避免「待办可见、提醒进不去」。
    hidden: true,
    permissions: [ANY_CODE],
    description: '查看系统通知、审批提醒、导出完成消息',
    menuItems: [{ label: '消息中心', icon: Bell, path: '/teacher/messages' }],
  },
  {
    id: 'archive-view',
    label: '学生档案',
    icon: Eye,
    order: 20,
    routePrefix: '/teacher/archive-view',
    group: 'archive',
    // 教师/辅导员持 teacher:archive:view / student:view；
    // data:manage 为管理员侧过渡码（后端 /admin/archives 校验的 archive:view 尚未入库）
    permissions: ['teacher:archive:view', 'student:view', 'data:manage'],
    description: '查看学生档案信息',
    menuItems: [{ label: '学生档案', icon: Eye, path: '/teacher/archive-view' }],
  },
  {
    id: 'material-review',
    label: '材料审核',
    icon: ClipboardCheck,
    order: 30,
    routePrefix: '/teacher/material-review',
    group: 'review',
    // 审核业务码由教师/辅导员持有；delegate:manage 为「审批委托」页签的码。
    // 页签再按各自权限收窄，持任一码即可进入本页。
    permissions: [
      'audit:pending',
      'audit:approve',
      'audit:batch',
      'delegate:manage',
      ADMIN_MENU_CODE,
    ],
    description: '待审核、审核记录与审批委托',
    menuItems: [{ label: '材料审核', icon: ClipboardCheck, path: '/teacher/material-review' }],
  },
  {
    id: 'heat-map',
    label: '成果热力图',
    icon: BarChart3,
    order: 35,
    routePrefix: '/teacher/heat-map',
    group: 'review',
    // statistics:view 尚未入库；教师/辅导员经 student:view、管理员经 data:manage 放行
    permissions: ['statistics:view', 'student:view', 'data:manage'],
    description: '学生成果数据热力图',
    menuItems: [{ label: '成果热力图', icon: BarChart3, path: '/teacher/heat-map' }],
  },
  {
    // 原「能力维度」「指标配置」「评分重算」三个入口合并为一个聚合页，
    // 页内以 Tab 切换；旧路径 /teacher/score-recalculate 保留跳转。
    id: 'indicator-system',
    label: '指标体系',
    icon: Layers,
    order: 45,
    routePrefix: '/teacher/indicator-system',
    group: 'review',
    permissions: ['indicator:manage', 'score:recalculate'],
    description: '能力维度、指标配置与评分重算',
    menuItems: [{ label: '指标体系', icon: Layers, path: '/teacher/indicator-system' }],
  },
  {
    // 原「档案导出」「导出模板」「表单自定义」三个入口合并；
    // permissions 取并集（any-of），页内再按 tab 的码收窄。
    id: 'export-center',
    label: '档案导出',
    icon: LayoutTemplate,
    order: 47,
    routePrefix: '/teacher/export-center',
    group: 'archive',
    permissions: [
      'export:execute',
      'export:research',
      'grade:import',
      'export:template:manage',
      'form:template:manage',
      ADMIN_MENU_CODE,
    ],
    description: '档案导出、导出模板与表单模板',
    menuItems: [{ label: '档案导出', icon: LayoutTemplate, path: '/teacher/export-center' }],
  },
  {
    id: 'approval-flow',
    label: '审批流程',
    icon: Workflow,
    order: 49,
    routePrefix: '/teacher/approval-flow',
    group: 'review',
    permissions: ['approval:flow:manage'],
    description: '审批流程配置',
    menuItems: [{ label: '审批流程', icon: Workflow, path: '/teacher/approval-flow' }],
  },
  {
    // 原「角色选择」「账号管理」「角色管理」合并；旧系统管理中的角色 Tab 也迁入本页。
    id: 'account-role',
    label: '账号与角色',
    icon: Users,
    order: 50,
    routePrefix: '/teacher/account-role',
    group: 'org',
    // 账号写操作走 user:manage；角色管理走 system:role:manage。持任一码即可进入。
    permissions: ['user:manage', 'system:role:manage'],
    description: '学生/教师账号、职位调整与角色权限',
    menuItems: [{ label: '账号与角色', icon: Users, path: '/teacher/account-role' }],
  },
  {
    id: 'org-management',
    label: '组织架构',
    icon: Building2,
    order: 63,
    routePrefix: '/teacher/org-management',
    group: 'org',
    permissions: ['org:manage'],
    description: '维护学校/学院/专业/班级层级架构',
    menuItems: [{ label: '组织架构', icon: Building2, path: '/teacher/org-management' }],
  },
  {
    // 原「系统管理」「系统配置」「定时任务」「日志查看」四个入口合并为一个系统设置页。
    // 模块权限取并集；页内 Tab 再按各自权限码收窄。
    id: 'system-settings',
    label: '系统设置',
    icon: Settings,
    order: 80,
    routePrefix: '/teacher/system-settings',
    group: 'system',
    permissions: [
      'dictionary:manage',
      'semester:manage',
      'semester:import',
      'log:view',
      ADMIN_MENU_CODE,
    ],
    description: '数据字典、学期、系统配置、定时任务与操作日志',
    menuItems: [{ label: '系统设置', icon: Settings, path: '/teacher/system-settings' }],
  },
  // ── 「运维监控 / 信息安全」两个模块不在此注册，且其页面已于 2026-10-10 删除：
  //    后端 V5.7 接口文档（ringg）与前端 shared/api/ 均无任何运维/监控/安全接口，
  //    原 4 个页面（硬件维护 / 软件维护 / 网络安全 / 数据安全台账）为 100% 写死的假数据，
  //    不属于「学生档案管理系统」的业务域。产品口径已定「删页」（原问题清单 B-15），
  //    故路由（teacher-routes.ts）与 .vue 文件（features/teacher/system-maintenance、
  //    features/teacher/info-security）一并移除，不留可由 URL 直达的假数据页。
  //    若后端将来补齐接口，需连同页面与路由一并重新实现后再在此注册。
]

/**
 * 判断当前登录者是否可访问指定模块。
 *
 * 判定顺序（镜像后端 AdminAuthService 的鉴权口径）：
 *   1. 持 admin 角色 → 全部放行（后端管理端即为此直通逻辑，不校验权限码）；
 *   2. 模块挂了通配码 * → 放行（后端该接口完全无权限码，见 ANY_CODE 注释）；
 *   3. 持有模块所需权限码中的任意一个 → 放行；
 *   4. 授权数据未就绪（permissions 为空且非 admin）→ 按角色基线放行（见
 *      ROLE_BASELINE_MODULES），避免授权数据没下发时菜单与路由一起塌空。
 *
 * 侧边栏菜单、路由守卫、首页快捷入口全部经本函数判定，**四处必须同源** ——
 * 否则会出现「菜单可见但点进去被守卫弹回」的割裂。
 *
 * 未知模块 id 一律不放行（路由 meta.permission 若与模块 id 对不上即视为未授权），
 * 因此从注册表移除的模块，其遗留路由会自动回到不可访问状态。
 */
export function isModuleAllowed(
  moduleId: string,
  permissions: string[],
  roles: string[] = [],
): boolean {
  const mod = teacherModules.find((m) => m.id === moduleId)
  if (!mod) return false
  if (roles.includes(ADMIN_ROLE_CODE)) return true
  if (mod.permissions.includes(ANY_CODE)) return true
  if (mod.permissions.some((code) => permissions.includes(code))) return true
  // 授权数据未就绪 → 回退角色基线（仅空数据时生效，见 ROLE_BASELINE_MODULES 注释）
  return isAuthzDataMissing(permissions, roles) && getBaselineModuleIds(roles).includes(moduleId)
}

/**
 * 根据权限码集合获取有权限的菜单项
 *
 * 权限过滤在模块（module）粒度进行：子菜单项共享所属模块的权限，
 * 因此模块通过过滤后其 children 一并保留，无需重复做子项过滤。
 *
 * 判定全部委托给 isModuleAllowed，故守卫与首页快捷入口的可达性与本菜单天然一致。
 */
export function getTeacherMenuItems(
  permissions: string[],
  roles: string[] = [],
): TeacherMenuItem[] {
  return [...teacherModules]
    .filter((mod) => !mod.hidden && isModuleAllowed(mod.id, permissions, roles))
    .sort((a, b) => a.order - b.order)
    .map((mod) => ({ ...mod.menuItems[0], group: mod.group, moduleId: mod.id }))
}

/** 按侧栏分组聚合已授权菜单项（空分组由侧栏自行过滤） */
export function getTeacherGroupedMenuItems(
  permissions: string[],
  roles: string[] = [],
): Array<{ group: TeacherNavGroup; items: TeacherMenuItem[] }> {
  const items = getTeacherMenuItems(permissions, roles)
  return [...teacherNavGroups]
    .sort((a, b) => a.order - b.order)
    .map((group) => ({ group, items: items.filter((item) => item.group === group.key) }))
    .filter((entry) => entry.items.length > 0)
}

/**
 * 根据路径查找教师端菜单项（递归查找子菜单）。
 * 用于标签栏根据当前路由匹配图标（教师端路由以 /teacher 为前缀）。
 */
export function findTeacherMenuItemByPath(
  path: string,
  items: TeacherMenuItem[] = teacherModules.map((m) => m.menuItems[0]),
): TeacherMenuItem | undefined {
  for (const item of items) {
    if (item.path === path) {
      return item
    }
    if (item.children) {
      const found = findTeacherMenuItemByPath(path, item.children)
      if (found) {
        return found
      }
    }
  }
  return undefined
}
