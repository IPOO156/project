// @vitest-environment jsdom
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  logoutApi: vi.fn(),
  changePassword: vi.fn(),
  uploadAvatar: vi.fn(),
  updateProfileContact: vi.fn(),
  teacherClear: vi.fn(),
  resetStores: vi.fn(),
}))

vi.mock('@/shared/api/user', () => ({ logout: mocks.logoutApi }))
vi.mock('@/shared/api/auth', () => ({ changePassword: mocks.changePassword }))
vi.mock('@/shared/api/common', () => ({ uploadAvatar: mocks.uploadAvatar }))
vi.mock('@/shared/api/student', () => ({ updateProfileContact: mocks.updateProfileContact }))
vi.mock('@/shared/composables/useTeacherMe', () => ({
  useTeacherMe: () => ({ clear: mocks.teacherClear }),
}))
vi.mock('@/app/stores/sessionReset', () => ({ resetUserScopedStores: mocks.resetStores }))

const { useUserStore } = await import('@/app/stores/useUserStore')

beforeEach(() => {
  sessionStorage.clear()
  localStorage.clear()
  setActivePinia(createPinia())
  mocks.logoutApi.mockReset().mockResolvedValue(undefined)
  mocks.changePassword.mockReset().mockResolvedValue(undefined)
  mocks.uploadAvatar.mockReset()
  mocks.updateProfileContact.mockReset().mockResolvedValue(undefined)
  mocks.teacherClear.mockReset()
  mocks.resetStores.mockReset()
})

describe('useUserStore 登录态', () => {
  it('setToken 写入会话存储并驱动 isLoggedIn', () => {
    const store = useUserStore()
    expect(store.isLoggedIn).toBe(false)

    store.setToken('tk-1')

    expect(store.token).toBe('tk-1')
    expect(store.isLoggedIn).toBe(true)
    expect(sessionStorage.getItem('token')).toBe('tk-1')
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('记住我时写入 localStorage 并带标记', () => {
    const store = useUserStore()
    store.setToken('tk-2', true)

    expect(localStorage.getItem('token')).toBe('tk-2')
    expect(localStorage.getItem('remember_me')).toBe('1')
  })

  it('setUserInfo 持久化并计算展示字段', () => {
    const store = useUserStore()
    store.setUserInfo({ id: 1, username: 'zhangsan', realName: '张三', studentId: 'S1' } as any)

    expect(store.userName).toBe('张三')
    expect(store.studentId).toBe('S1')
    expect(store.isTeacher).toBe(false)
    expect(JSON.parse(localStorage.getItem('user_info_cache') as string).realName).toBe('张三')
  })

  it('后端未返回头像时回落到本地缓存', () => {
    localStorage.setItem('user_avatar_cache', 'cached.png')
    const store = useUserStore()

    store.setUserInfo({ id: 1, realName: '张三' } as any)

    expect(store.avatar).toBe('cached.png')
  })

  it('setLoginType 同步写入身份缓存，教师端判定生效', () => {
    const store = useUserStore()
    store.setUserInfo({ id: 1, realName: '李老师' } as any)

    store.setLoginType('teacher')

    expect(store.isTeacher).toBe(true)
    expect(JSON.parse(localStorage.getItem('user_info_cache') as string).loginType).toBe('teacher')
  })
})

describe('useUserStore 资料与密码', () => {
  it('changePassword 自动补齐 confirmPassword', async () => {
    const store = useUserStore()
    await store.changePassword({ oldPassword: 'old', newPassword: 'New123!' })

    expect(mocks.changePassword).toHaveBeenCalledWith({
      oldPassword: 'old',
      newPassword: 'New123!',
      confirmPassword: 'New123!',
    })
  })

  it('updateUserInfo 整体提交联系信息，不回写账号邮箱', async () => {
    const store = useUserStore()
    store.setUserInfo({ id: 1, email: 'account@example.com' } as any)

    await store.updateUserInfo({
      email: 'contact@example.com',
      phone: '13800000000',
      address: '某地',
      emergencyName: '张三',
      emergencyRelation: '父亲',
      emergencyPhone: '13900000000',
    })

    expect(mocks.updateProfileContact).toHaveBeenCalled()
    expect(store.userInfo?.email).toBe('account@example.com')
  })

  it('updateAvatar 非 data URL 直接缓存，接口失败时保留本地值', async () => {
    const store = useUserStore()
    store.setUserInfo({ id: 1 } as any)

    mocks.uploadAvatar.mockRejectedValueOnce(new Error('upload failed'))
    await store.updateAvatar('data:image/png;base64,AAAA')

    expect(store.avatar).toBe('data:image/png;base64,AAAA')
    expect(localStorage.getItem('user_avatar_cache')).toBe('data:image/png;base64,AAAA')
  })
})

describe('useUserStore 登出', () => {
  it('先带旧 token 调后端，再清空身份、头像与用户级草稿', async () => {
    localStorage.setItem('user_info_cache', JSON.stringify({ id: 2, loginType: 'student' }))
    localStorage.setItem('user_avatar_cache', 'cached.png')
    localStorage.setItem('form_draft_x::u2', '{}')
    localStorage.setItem('submission:withdrawnIds::u2', '[]')
    const store = useUserStore()
    store.setToken('tk-3')

    await store.logout()

    // 必须用登出前的 token 快照调用，否则请求变匿名导致服务端令牌不失效
    expect(mocks.logoutApi).toHaveBeenCalledWith('tk-3')
    expect(store.token).toBe('')
    expect(store.userInfo).toBeNull()
    expect(sessionStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user_info_cache')).toBeNull()
    expect(localStorage.getItem('user_avatar_cache')).toBeNull()
    expect(localStorage.getItem('form_draft_x::u2')).toBeNull()
    expect(localStorage.getItem('submission:withdrawnIds::u2')).toBeNull()
    expect(mocks.teacherClear).toHaveBeenCalled()
    expect(mocks.resetStores).toHaveBeenCalled()
  })

  it('后端登出失败也要完成本地清理', async () => {
    const store = useUserStore()
    store.setToken('tk-4')
    mocks.logoutApi.mockRejectedValueOnce(new Error('network'))

    await store.logout()

    expect(store.isLoggedIn).toBe(false)
    expect(mocks.resetStores).toHaveBeenCalled()
  })
})
