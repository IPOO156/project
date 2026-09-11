import {
  BarChart3,
  Building2,
  Calculator,
  ClipboardCheck,
  Eye,
  Handshake,
  History,
  Layers,
  LayoutDashboard,
  LayoutTemplate,
  Settings,
  Settings2,
  SlidersHorizontal,
  Timer,
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
 * 基线取值 = 改造前 ROLE_PERMISSIONS 的实际可见集合（折算为第四轮合并后的模块 id）：
 *   teacher   → 首页 / 档案查看 / 导出中心 / 成果热力图 / 日志查看 —— 原 5 项
 *   counselor → 首页 / 材料审核 / 日志查看 / 成果热力图 —— 原 4 项（当年映射到 reviewer）
 * 即「改造前能看到的，改造后在数据缺失时至少还能看到」，只减不增，不放开新模块。
 */
export const ROLE_BASELINE_MODULES: Record<string, string[]> = {
  teacher: ['teacher-dashboard', 'archive-view', 'export-center', 'log-view', 'heat-map'],
  counselor: ['teacher-dashboard', 'material-review', 'log-view', 'heat-map'],
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

/** 教师端菜单项 */
export interface TeacherMenuItem {
  label: string
  icon?: any
  path?: string
  children?: TeacherMenuItem[]
}

/** 教师端已注册模块列表 */
export interface TeacherModule {
  id: string
  label: string
  icon: any
  order: number
  routePrefix: string
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
    label: '首页',
    icon: LayoutDashboard,
    order: 10,
    routePrefix: '/teacher/dashboard',
    // 教师/辅导员持 dashboard:view；管理员无此码，走过渡代理码
    permissions: ['dashboard:view', ADMIN_MENU_CODE],
    description: '教师首页仪表盘',
    menuItems: [{ label: '首页', icon: LayoutDashboard, path: '/teacher/dashboard' }],
  },
  {
    id: 'archive-view',
    label: '档案查看',
    icon: Eye,
    order: 20,
    routePrefix: '/teacher/archive-view',
    // 教师/辅导员持 teacher:archive:view / student:view；
    // data:manage 为管理员侧过渡码（后端 /admin/archives 校验的 archive:view 尚未入库）
    permissions: ['teacher:archive:view', 'student:view', 'data:manage'],
    description: '查看学生档案信息',
    menuItems: [{ label: '档案查看', icon: Eye, path: '/teacher/archive-view' }],
  },
  {
    id: 'material-review',
    label: '材料审核',
    icon: ClipboardCheck,
    order: 30,
    routePrefix: '/teacher/material-review',
    // 审核业务码由教师/辅导员持有；管理员侧走过渡代理码
    permissions: ['audit:pending', 'audit:approve', 'audit:batch', ADMIN_MENU_CODE],
    description: '审核学生提交的材料',
    menuItems: [
      {
        label: '材料审核',
        icon: ClipboardCheck,
        children: [
          { label: '待审核', icon: ClipboardCheck, path: '/teacher/material-review/pending' },
          { label: '审核记录', icon: History, path: '/teacher/material-review/history' },
        ],
      },
    ],
  },
  {
    id: 'delegation',
    label: '审批委托',
    icon: Handshake,
    order: 33,
    routePrefix: '/teacher/delegation',
    /*
     * 业务口径：审批委托只能「管理员 → 教师」，教师之间不可互相委托，
     * 故本条只对管理端开放，不挂 delegate:manage。
     *
     * 注意后端现状与业务口径不一致（已列入待后端处理清单）：
     *   1) 种子 seed_teachers.sql 把 delegate:manage(id=36) 授予了 teacher(3) 与 counselor(4)，
     *      却未授予 admin(2) —— 与「仅管理员可委托」正好相反；
     *   2) TeacherDelegationController 的 Javadoc 标注权限码 delegate:manage，
     *      但代码未做任何权限码校验，/teacher/** 在 SecurityConfig 中仅要求登录，
     *      因此任何登录用户都能对该接口创建/取消自己的委托（后端安全缺口）。
     * 后端修正为「仅管理员可调用、仅可委托给教师」后，本条改用其专属权限码。
     */
    permissions: [ADMIN_MENU_CODE],
    description: '管理员将审批职责临时委托给教师',
    menuItems: [{ label: '审批委托', icon: Handshake, path: '/teacher/delegation' }],
  },
  {
    id: 'heat-map',
    label: '成果热力图',
    icon: BarChart3,
    order: 35,
    routePrefix: '/teacher/heat-map',
    // statistics:view 尚未入库；教师/辅导员经 student:view、管理员经 data:manage 放行
    permissions: ['statistics:view', 'student:view', 'data:manage'],
    description: '学生成果数据热力图',
    menuItems: [{ label: '成果热力图', icon: BarChart3, path: '/teacher/heat-map' }],
  },
  {
    id: 'log-view',
    label: '日志查看',
    icon: History,
    order: 40,
    routePrefix: '/teacher/log-view',
    // 管理员持 log:view / log:audit；教师端 GET /teacher/logs 无权限码，过渡期通配放行
    permissions: ['log:view', 'log:audit', ANY_CODE],
    description: '系统操作日志',
    menuItems: [{ label: '日志查看', icon: History, path: '/teacher/log-view' }],
  },
  {
    // 原「能力维度」与「指标配置」两个一级菜单合并（两模块 permissions 完全相同，
    // 且能力维度页自述「供指标体系引用」、指标列表带 dimensionName 列，属同一业务对象）。
    // 两个叶子页原地保留，由 IndicatorSystem.vue 以 Tab 聚合。
    id: 'indicator-system',
    label: '指标体系',
    icon: Layers,
    order: 45,
    routePrefix: '/teacher/indicator-system',
    permissions: ['indicator:manage'],
    description: '能力维度与指标配置',
    menuItems: [{ label: '指标体系', icon: Layers, path: '/teacher/indicator-system' }],
  },
  {
    id: 'score-recalculate',
    label: '评分重算',
    icon: Calculator,
    order: 46,
    routePrefix: '/teacher/score-recalculate',
    permissions: ['score:recalculate'],
    description: '评分重算',
    menuItems: [{ label: '评分重算', icon: Calculator, path: '/teacher/score-recalculate' }],
  },
  {
    // 原「档案导出」与「导出模板」两个一级菜单合并（同一业务对象的「用模板」与「管模板」）。
    // permissions 取两者并集：模块级 isModuleAllowed 是 any-of，故导出中心对持任一码的人可见，
    // 页内再按 tab 各自的码收窄（见 ExportCenter.vue 的 visibleTabs）。
    id: 'export-center',
    label: '导出中心',
    icon: LayoutTemplate,
    order: 47,
    routePrefix: '/teacher/export-center',
    permissions: ['export:execute', 'export:manage', 'export:template:manage'],
    description: '档案导出与导出模板',
    menuItems: [{ label: '导出中心', icon: LayoutTemplate, path: '/teacher/export-center' }],
  },
  {
    id: 'approval-flow',
    label: '审批流程',
    icon: Workflow,
    order: 49,
    routePrefix: '/teacher/approval-flow',
    permissions: ['approval:flow:manage'],
    description: '审批流程配置',
    menuItems: [{ label: '审批流程', icon: Workflow, path: '/teacher/approval-flow' }],
  },
  {
    id: 'system-management',
    label: '系统管理',
    icon: Settings,
    order: 80,
    routePrefix: '/teacher/system-management',
    // 该页含字典/角色/学期三个 Tab，持有任一子管理码即可进入
    permissions: ['system:role:manage', 'dictionary:manage', 'semester:manage', 'org:manage'],
    description: '字典/角色/学期统一管理',
    menuItems: [{ label: '系统管理', icon: Settings, path: '/teacher/system-management' }],
  },
  {
    // 原「角色选择」「账号管理」两个一级菜单合并（两组都在调 listUsers / createUser，
    // 属同一业务对象：账号的「列表与管理」与「新增」被切成了两个入口）。
    // 4 个子页收进页内 Tab，故原侧边栏 el-sub-menu 消失 —— 属预期 IA 变化，功能未减。
    id: 'account-role',
    label: '账号与角色',
    icon: Users,
    order: 50,
    routePrefix: '/teacher/account-role',
    permissions: ['system:user:manage'],
    description: '学生/教师账号管理与职位调整',
    menuItems: [{ label: '账号与角色', icon: Users, path: '/teacher/account-role' }],
  },
  {
    id: 'form-customization',
    label: '表单自定义',
    icon: SlidersHorizontal,
    order: 55,
    routePrefix: '/teacher/form-customization',
    // form:template:manage 尚未入库，暂以管理员代理码放行
    permissions: ['form:template:manage', ADMIN_MENU_CODE],
    description: '自定义表单与发布信息',
    menuItems: [
      { label: '表单自定义', icon: SlidersHorizontal, path: '/teacher/form-customization' },
    ],
  },
  {
    id: 'system-config',
    label: '系统配置',
    icon: Settings2,
    order: 56,
    routePrefix: '/teacher/system-config',
    // 后端 /admin/settings 走 requireAdmin，无权限码，暂以管理员代理码放行
    permissions: [ADMIN_MENU_CODE],
    description: '系统参数与公告管理',
    menuItems: [{ label: '系统配置', icon: Settings2, path: '/teacher/system-config' }],
  },
  {
    id: 'scheduled-task',
    label: '定时任务',
    icon: Timer,
    order: 57,
    routePrefix: '/teacher/scheduled-task',
    // 后端定时任务接口走 requireAdmin，无权限码，暂以管理员代理码放行
    permissions: [ADMIN_MENU_CODE],
    description: '定时任务运行管理',
    menuItems: [{ label: '定时任务', icon: Timer, path: '/teacher/scheduled-task' }],
  },
  {
    id: 'org-management',
    label: '组织架构',
    icon: Building2,
    order: 63,
    routePrefix: '/teacher/org-management',
    permissions: ['org:manage'],
    description: '维护学校/学院/专业/班级层级架构',
    menuItems: [{ label: '组织架构', icon: Building2, path: '/teacher/org-management' }],
  },
  // ── 以下两个模块未注册：后端暂无对应监控接口，页面为写死的假数据 ──
  // 'system-maintenance'（系统维护：硬件/软件）与 'info-security'（信息安全：网络/数据）
  // 路由与页面文件保留（teacher-routes.ts + features/teacher/system-maintenance|info-security），
  // 待后端提供监控接口后再在此注册。
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
    .filter((mod) => isModuleAllowed(mod.id, permissions, roles))
    .sort((a, b) => a.order - b.order)
    .map((mod) => mod.menuItems[0])
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
