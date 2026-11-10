// @vitest-environment jsdom
import type { UserInfo } from '@/shared/types/types'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  logoutApi: vi.fn(),
  changePassword: vi.fn(),
  getCurrentUser: vi.fn(),
  uploadAvatar: vi.fn(),
  updateProfileContact: vi.fn(),
  teacherClear: vi.fn(),
  resetStores: vi.fn(),
}))

vi.mock('@/shared/api/user', () => ({ logout: mocks.logoutApi }))
vi.mock('@/shared/api/auth', () => ({
  changePassword: mocks.changePassword,
  getCurrentUser: mocks.getCurrentUser,
}))
vi.mock('@/shared/api/common', () => ({ uploadAvatar: mocks.uploadAvatar }))
vi.mock('@/shared/api/student', () => ({ updateProfileContact: mocks.updateProfileContact }))
vi.mock('@/shared/composables/useTeacherMe', () => ({
  useTeacherMe: () => ({ clear: mocks.teacherClear }),
}))
vi.mock('@/app/stores/sessionReset', () => ({ resetUserScopedStores: mocks.resetStores }))

const { useUserStore } = await import('@/app/stores/useUserStore')

/** 构造完整 UserInfo（接口要求必填字段齐全，避免用类型断言绕过检查） */
function userInfo(overrides: Partial<UserInfo> = {}): UserInfo {
  return {
    id: '1',
    username: 'u',
    realName: '张三',
    studentId: 'S1',
    grade: '',
    major: '',
    className: '',
    email: '',
    phone: '',
    ...overrides,
  }
}

beforeEach(() => {
  sessionStorage.clear()
  localStorage.clear()
  setActivePinia(createPinia())
  mocks.logoutApi.mockReset().mockResolvedValue(undefined)
  mocks.changePassword.mockReset().mockResolvedValue(undefined)
  mocks.getCurrentUser.mockReset().mockResolvedValue({ avatar: null })
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
    store.setUserInfo(
      userInfo({ id: '1', username: 'zhangsan', realName: '张三', studentId: 'S1' }),
    )

    expect(store.userName).toBe('张三')
    expect(store.studentId).toBe('S1')
    expect(store.isTeacher).toBe(false)
    expect(JSON.parse(localStorage.getItem('user_info_cache') as string).realName).toBe('张三')
  })

  it('后端未返回头像时回落到本地缓存', () => {
    localStorage.setItem('user_avatar_cache', 'cached.png')
    const store = useUserStore()

    store.setUserInfo(userInfo({ realName: '张三' }))

    expect(store.avatar).toBe('cached.png')
  })

  it('setLoginType 同步写入身份缓存，教师端判定生效', () => {
    const store = useUserStore()
    store.setUserInfo(userInfo({ realName: '李老师' }))

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

  it('updateUserInfo 整体提交联系信息，并回写同源邮箱/手机号', async () => {
    const store = useUserStore()
    store.setUserInfo(userInfo({ email: 'old@example.com', phone: '13700000000' }))

    await store.updateUserInfo({
      email: 'contact@example.com',
      phone: '13800000000',
      address: '某地',
      emergencyName: '张三',
      emergencyRelation: '父亲',
      emergencyPhone: '13900000000',
    })

    expect(mocks.updateProfileContact).toHaveBeenCalled()
    // 后端只有一份邮箱/手机号（user_contact_info），保存后 userInfo 同步为最新值并落缓存
    expect(store.userInfo?.email).toBe('contact@example.com')
    expect(store.userInfo?.phone).toBe('13800000000')
    expect(JSON.parse(localStorage.getItem('user_info_cache') as string).email).toBe(
      'contact@example.com',
    )
  })

  it('updateAvatar 非 data URL 直接写入缓存，不调上传接口', async () => {
    const store = useUserStore()
    store.setUserInfo(userInfo())

    await store.updateAvatar('https://oss.example.com/avatar.jpg')

    expect(mocks.uploadAvatar).not.toHaveBeenCalled()
    expect(store.avatar).toBe('https://oss.example.com/avatar.jpg')
    expect(localStorage.getItem('user_avatar_cache')).toBe('https://oss.example.com/avatar.jpg')
  })

  it('data URL 上传成功后缓存后端返回地址，文件名后缀与 JPEG 内容一致', async () => {
    const store = useUserStore()
    store.setUserInfo(userInfo())
    mocks.uploadAvatar.mockResolvedValueOnce({
      avatarUrl: 'https://oss.example.com/new.jpg',
      objectKey: 'avatar/new.jpg',
    })

    await store.updateAvatar('data:image/jpeg;base64,AAAA')

    const file = mocks.uploadAvatar.mock.calls[0]?.[0] as File
    expect(file.type).toBe('image/jpeg')
    expect(file.name.endsWith('.jpg')).toBe(true)
    // 头像地址仍缓存 OSS 签名 URL，但展示优先用本机裁剪图（见下一个用例）
    expect(localStorage.getItem('user_avatar_cache')).toBe('https://oss.example.com/new.jpg')
    expect(store.avatar).toBe('data:image/jpeg;base64,AAAA')
    expect(JSON.parse(localStorage.getItem('user_avatar_local_cache') as string)).toEqual({
      dataUrl: 'data:image/jpeg;base64,AAAA',
      objectKey: 'avatar/new.jpg',
    })
  })

  it('刷新后（重建 store）本机上传的头像仍优先展示', async () => {
    const store = useUserStore()
    store.setUserInfo(userInfo())
    mocks.uploadAvatar.mockResolvedValueOnce({
      avatarUrl: 'https://oss.example.com/new.jpg',
      objectKey: 'avatar/new.jpg',
    })
    await store.updateAvatar('data:image/jpeg;base64,AAAA')

    // 模拟页面刷新：重新创建 Pinia 与 store，只能从 localStorage 恢复
    setActivePinia(createPinia())
    const reloaded = useUserStore()

    expect(reloaded.avatar).toBe('data:image/jpeg;base64,AAAA')
  })

  it('删除头像时清掉本机图片缓存', async () => {
    const store = useUserStore()
    store.setUserInfo(userInfo())
    mocks.uploadAvatar.mockResolvedValueOnce({
      avatarUrl: 'https://oss.example.com/new.jpg',
      objectKey: 'avatar/new.jpg',
    })
    await store.updateAvatar('data:image/jpeg;base64,AAAA')

    await store.updateAvatar(undefined)

    expect(store.avatar).toBeUndefined()
    expect(localStorage.getItem('user_avatar_local_cache')).toBeNull()
  })

  it('refreshAvatar 发现后端头像已换（objectKey 不同）时清掉本机图片', async () => {
    const store = useUserStore()
    store.setToken('tk-avatar')
    store.setUserInfo(userInfo())
    mocks.uploadAvatar.mockResolvedValueOnce({
      avatarUrl: 'https://oss.example.com/avatar/old.jpg',
      objectKey: 'avatar/old.jpg',
    })
    await store.updateAvatar('data:image/jpeg;base64,AAAA')

    mocks.getCurrentUser.mockResolvedValueOnce({
      avatar: 'https://oss.example.com/avatar/new.jpg?x-oss-expires=1',
    })
    await store.refreshAvatar()

    expect(localStorage.getItem('user_avatar_local_cache')).toBeNull()
    expect(store.avatar).toBe('https://oss.example.com/avatar/new.jpg?x-oss-expires=1')
  })

  it('refreshAvatar 仍是同一张图时保留本机图片', async () => {
    const store = useUserStore()
    store.setToken('tk-avatar')
    store.setUserInfo(userInfo())
    mocks.uploadAvatar.mockResolvedValueOnce({
      avatarUrl: 'https://oss.example.com/avatar/new.jpg?x-oss-expires=old',
      objectKey: 'avatar/new.jpg',
    })
    await store.updateAvatar('data:image/jpeg;base64,AAAA')

    mocks.getCurrentUser.mockResolvedValueOnce({
      avatar: 'https://oss.example.com/avatar/new.jpg?x-oss-expires=new',
    })
    await store.refreshAvatar()

    expect(store.avatar).toBe('data:image/jpeg;base64,AAAA')
    expect(localStorage.getItem('user_avatar_local_cache')).not.toBeNull()
  })

  it('上传失败向上抛出，不写入 base64、不改变原头像', async () => {
    const store = useUserStore()
    store.setUserInfo(userInfo({ avatar: 'https://oss.example.com/old.jpg' }))
    mocks.uploadAvatar.mockRejectedValueOnce(new Error('文件内容与扩展名不匹配: png'))

    await expect(store.updateAvatar('data:image/jpeg;base64,AAAA')).rejects.toThrow(
      '文件内容与扩展名不匹配',
    )

    expect(store.avatar).toBe('https://oss.example.com/old.jpg')
    expect(localStorage.getItem('user_avatar_cache')).toBeNull()
    expect(localStorage.getItem('user_avatar_local_cache')).toBeNull()
  })

  it('updateAvatar 成功后把新地址同步进 user_info_cache', async () => {
    const store = useUserStore()
    store.setUserInfo(userInfo({ avatar: 'https://oss.example.com/old.jpg' }))

    await store.updateAvatar('https://oss.example.com/new.jpg')

    const cachedUser = JSON.parse(localStorage.getItem('user_info_cache') as string)
    expect(cachedUser.avatar).toBe('https://oss.example.com/new.jpg')
  })

  it('refreshAvatar 用 /auth/me 的现签地址覆盖本地缓存', async () => {
    const store = useUserStore()
    store.setToken('tk-avatar')
    store.setUserInfo(userInfo({ avatar: 'https://oss.example.com/expired.jpg' }))
    mocks.getCurrentUser.mockResolvedValueOnce({ avatar: 'https://oss.example.com/fresh.jpg' })

    await store.refreshAvatar()

    expect(store.avatar).toBe('https://oss.example.com/fresh.jpg')
    expect(localStorage.getItem('user_avatar_cache')).toBe('https://oss.example.com/fresh.jpg')
    expect(JSON.parse(localStorage.getItem('user_info_cache') as string).avatar).toBe(
      'https://oss.example.com/fresh.jpg',
    )
  })

  it('refreshAvatar 接口失败时保留本地缓存，不打断启动', async () => {
    const store = useUserStore()
    store.setToken('tk-avatar')
    store.setUserInfo(userInfo({ avatar: 'https://oss.example.com/cached.jpg' }))
    localStorage.setItem('user_avatar_cache', 'https://oss.example.com/cached.jpg')
    mocks.getCurrentUser.mockRejectedValueOnce(new Error('OSS 未启用'))

    await expect(store.refreshAvatar()).resolves.toBeUndefined()

    expect(store.avatar).toBe('https://oss.example.com/cached.jpg')
    expect(localStorage.getItem('user_avatar_cache')).toBe('https://oss.example.com/cached.jpg')
  })

  it('refreshAvatar 后端已无头像时清空本地缓存', async () => {
    const store = useUserStore()
    store.setToken('tk-avatar')
    store.setUserInfo(userInfo({ avatar: 'https://oss.example.com/removed.jpg' }))

    await store.refreshAvatar()

    expect(store.avatar).toBeUndefined()
    expect(localStorage.getItem('user_avatar_cache')).toBeNull()
  })

  it('未登录时不请求 /auth/me', async () => {
    const store = useUserStore()

    await store.refreshAvatar()

    expect(mocks.getCurrentUser).not.toHaveBeenCalled()
  })
})

describe('useUserStore 登出', () => {
  it('先带旧 token 调后端，再清空身份、头像与用户级草稿', async () => {
    localStorage.setItem('user_info_cache', JSON.stringify({ id: 2, loginType: 'student' }))
    localStorage.setItem('user_avatar_cache', 'cached.png')
    localStorage.setItem('user_avatar_local_cache', '{"dataUrl":"data:image/jpeg;base64,AAAA"}')
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
    expect(localStorage.getItem('user_avatar_local_cache')).toBeNull()
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
