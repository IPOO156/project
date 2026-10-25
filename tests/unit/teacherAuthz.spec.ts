// @vitest-environment jsdom
import type { CurrentUser } from '@/shared/types/teacher'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ADMIN_MENU_CODE,
  getBaselineModuleIds,
  getTeacherMenuItems,
  isAuthzDataMissing,
  isModuleAllowed,
} from '@/shared/config/teacherModuleRegistry'

const mocks = vi.hoisted(() => ({ getCurrentUser: vi.fn() }))

vi.mock('@/shared/api/teacher-api', () => ({ getCurrentUser: mocks.getCurrentUser }))

const { useTeacherMe } = await import('@/shared/composables/useTeacherMe')
const { useTeacherAuthz } = await import('@/shared/composables/useTeacherAuthz')
const { usePermission } = await import('@/shared/composables/usePermission')

function makeUser(overrides: Partial<CurrentUser> = {}): CurrentUser {
  return {
    userId: 1,
    userNo: 'T0001',
    name: '测试教师',
    email: null,
    phone: null,
    gender: 0,
    genderLabel: '',
    schoolId: 1,
    schoolName: null,
    roles: ['teacher'],
    roleNames: ['教师'],
    permissions: [],
    scopes: [],
    avatar: null,
    ...overrides,
  }
}

async function loginAs(overrides: Partial<CurrentUser>) {
  mocks.getCurrentUser.mockResolvedValueOnce(makeUser(overrides))
  await useTeacherMe().refresh()
}

beforeEach(() => {
  localStorage.clear()
  mocks.getCurrentUser.mockReset()
  useTeacherMe().clear()
})

describe('isModuleAllowed 判定顺序', () => {
  it('未知模块 id 一律不放行', () => {
    expect(isModuleAllowed('not-exists', [], ['admin'])).toBe(false)
  })

  it('admin 角色直通，即便 permissions 为空', () => {
    expect(isModuleAllowed('system-config', [], ['admin'])).toBe(true)
    expect(isModuleAllowed('system-management', [], ['admin'])).toBe(true)
  })

  it('命中模块所需任一权限码即放行，缺失则拒绝', () => {
    expect(isModuleAllowed('system-management', ['semester:manage'], ['teacher'])).toBe(true)
    expect(isModuleAllowed('system-management', ['log:view'], ['teacher'])).toBe(false)
  })

  it('授权数据为空时按角色基线兜底，非空时不兜底', () => {
    // teacher 基线：首页 / 档案查看 / 导出中心 / 热力图
    expect(isModuleAllowed('archive-view', [], ['teacher'])).toBe(true)
    expect(isModuleAllowed('material-review', [], ['teacher'])).toBe(false)
    // counselor 基线含材料审核
    expect(isModuleAllowed('material-review', [], ['counselor'])).toBe(true)
    // 下发了权限码但不含所需码：属真实无权，不回退基线
    expect(isModuleAllowed('archive-view', ['log:view'], ['teacher'])).toBe(false)
  })
})

describe('授权数据就绪判定与基线', () => {
  it('isAuthzDataMissing 只在权限为空且非 admin 时为真', () => {
    expect(isAuthzDataMissing([], ['teacher'])).toBe(true)
    expect(isAuthzDataMissing([], ['admin'])).toBe(false)
    expect(isAuthzDataMissing(['log:view'], ['teacher'])).toBe(false)
  })

  it('基线模块按角色去重合并', () => {
    expect(getBaselineModuleIds(['teacher', 'counselor'])).toEqual([
      'teacher-dashboard',
      'archive-view',
      'export-center',
      'heat-map',
      'material-review',
    ])
    expect(getBaselineModuleIds(['unknown'])).toEqual([])
  })
})

describe('getTeacherMenuItems', () => {
  it('按 order 升序返回有权限的菜单项', () => {
    const items = getTeacherMenuItems(['log:view'], ['teacher'])
    expect(items.map((item) => item.path)).toEqual(['/teacher/log-view'])
  })

  it('admin 角色拿到全部模块菜单', () => {
    const items = getTeacherMenuItems([], ['admin'])
    expect(items.length).toBeGreaterThanOrEqual(5)
    expect(items.some((item) => item.path?.startsWith('/teacher/system-management'))).toBe(true)
  })
})

describe('useTeacherAuthz / usePermission', () => {
  it('权限码判定与 admin 直通', async () => {
    await loginAs({ permissions: ['log:view'], roles: ['teacher'] })
    const authz = useTeacherAuthz()

    expect(authz.permissions.value).toEqual(['log:view'])
    expect(authz.hasPermission('log:view')).toBe(true)
    expect(authz.hasPermission('system:role:manage')).toBe(false)
    expect(authz.isAdmin.value).toBe(false)
    expect(authz.canAccessAny(['system:role:manage'])).toBe(false)
    expect(authz.canAccessAny(['system:role:manage', 'log:view'])).toBe(true)
    expect(authz.canAccessModule('log-view')).toBe(true)
    expect(authz.canAccessModule('system-management')).toBe(false)
    expect(authz.roleLabel.value).toBe('教师')
  })

  it('admin 角色 canAccessAny 直通', async () => {
    await loginAs({ permissions: [], roles: ['admin'], roleNames: ['管理员'] })
    const authz = useTeacherAuthz()

    expect(authz.isAdmin.value).toBe(true)
    expect(authz.canAccessAny(['anything:code'])).toBe(true)
    expect(authz.canAccessModule('system-management')).toBe(true)
    expect(authz.baselineFallback.value).toBe(false)
  })

  it('授权数据缺失时给出基线兜底提示', async () => {
    await loginAs({ permissions: [], roles: ['teacher'] })
    const authz = useTeacherAuthz()

    expect(authz.baselineFallback.value).toBe(true)
    expect(authz.menuItems.value.map((item) => item.path)).toContain('/teacher/archive-view')
  })

  it('usePermission 与 useTeacherAuthz 判定同源', async () => {
    await loginAs({ permissions: [ADMIN_MENU_CODE], roles: ['teacher'] })
    const permission = usePermission()

    expect(permission.hasPermission(ADMIN_MENU_CODE)).toBe(true)
    // system-config 模块只挂 ADMIN_MENU_CODE，持有该码即可访问
    expect(permission.canAccessModule('system-config')).toBe(true)
  })
})
