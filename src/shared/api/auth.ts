import type { UserInfo } from '@/shared/types/types'

export interface LoginPayload {
  username: string
  password: string
  loginType: 'student' | 'admin'
}

export interface LoginResult {
  token: string
  userInfo: UserInfo
}

/**
 * 登录
 * 后端就绪后替换为：return request.post<LoginResult>('/auth/login', payload)
 */
export function login(payload: LoginPayload): Promise<LoginResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        token: `mock-token-${Date.now()}`,
        userInfo: {
          id: '1',
          username: payload.username,
          realName: '张三',
          studentId: '2024060001',
          grade: '2024级',
          major: '计算机科学与技术',
          className: '计科2401班',
          email: 'zhangsan@edu.cn',
          phone: '138****0000',
        },
      })
    }, 800)
  })
}

/**
 * 登出
 * 后端就绪后替换为：return request.post('/auth/logout')
 */
export function logout(): Promise<void> {
  return Promise.resolve()
}
