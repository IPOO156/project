/**
 * 后端 API 测试
 * 测试后端服务：http://localhost:8080
 */
import { expect, test } from '@playwright/test'

const API_BASE = 'http://localhost:8080'

test.describe('认证接口', () => {
  test.beforeEach(() => {
    test.info().annotations.push({
      type: 'API',
      description: `Base URL: ${API_BASE}`,
    })
  })

  test('POST /api/auth/login - 学生登录成功', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/auth/login`, {
      data: {
        username: '202401002',
        password: '123456',
      },
    })

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.code).toBe(200)
    expect(data.data).toHaveProperty('token')
    expect(data.data).toHaveProperty('userInfo')
  })

  test('POST /api/auth/login - 教师登录成功', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/auth/login`, {
      data: {
        username: 'T00003',
        password: '123456',
      },
    })

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.code).toBe(200)
    expect(data.data).toHaveProperty('token')
    expect(data.data).toHaveProperty('userInfo')
  })

  test('POST /api/auth/login - 管理员登录成功', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/auth/login`, {
      data: {
        username: 'A00002',
        password: '123456',
      },
    })

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.code).toBe(200)
    expect(data.data).toHaveProperty('token')
    expect(data.data).toHaveProperty('userInfo')
  })

  test('POST /api/auth/login - 密码错误', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/auth/login`, {
      data: {
        username: '202401002',
        password: 'wrongpassword',
      },
    })

    expect(response.status()).toBe(401)
    const data = await response.json()
    expect(data.code).toBe(401)
  })

  test('POST /api/auth/login - 账号不存在', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/auth/login`, {
      data: {
        username: 'nonexistent',
        password: '123456',
      },
    })

    expect(response.status()).toBe(401)
    const data = await response.json()
    expect(data.code).toBe(401)
  })

  test('GET /api/auth/me - 获取当前用户信息', async ({ request }) => {
    // 先登录获取 token
    const loginResponse = await request.post(`${API_BASE}/api/auth/login`, {
      data: {
        username: '202401002',
        password: '123456',
      },
    })

    expect(loginResponse.status()).toBe(200)
    const loginData = await loginResponse.json()
    const token = loginData.data.token

    // 使用 token 获取用户信息
    const response = await request.get(`${API_BASE}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.code).toBe(200)
    expect(data.data).toHaveProperty('userId')
    expect(data.data).toHaveProperty('username')
    expect(data.data).toHaveProperty('role')
  })
})

test.describe('学生接口', () => {
  test.beforeEach(() => {
    test.info().annotations.push({
      type: 'API',
      description: `Base URL: ${API_BASE}`,
    })
  })

  test('GET /api/student/profile - 获取学生档案', async ({ request }) => {
    // 先登录获取 token
    const loginResponse = await request.post(`${API_BASE}/api/auth/login`, {
      data: {
        username: '202401002',
        password: '123456',
      },
    })

    expect(loginResponse.status()).toBe(200)
    const loginData = await loginResponse.json()
    const token = loginData.data.token

    // 获取学生档案
    const response = await request.get(`${API_BASE}/api/student/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.code).toBe(200)
    expect(data.data).toHaveProperty('studentId')
    expect(data.data).toHaveProperty('name')
    expect(data.data).toHaveProperty('className')
  })

  test('GET /api/student/grades - 获取学生成绩', async ({ request }) => {
    // 先登录获取 token
    const loginResponse = await request.post(`${API_BASE}/api/auth/login`, {
      data: {
        username: '202401002',
        password: '123456',
      },
    })

    expect(loginResponse.status()).toBe(200)
    const loginData = await loginResponse.json()
    const token = loginData.data.token

    // 获取成绩列表
    const response = await request.get(`${API_BASE}/api/student/grades`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.code).toBe(200)
    expect(Array.isArray(data.data)).toBe(true)
  })

  test('GET /api/student/courses - 获取可选课程', async ({ request }) => {
    // 先登录获取 token
    const loginResponse = await request.post(`${API_BASE}/api/auth/login`, {
      data: {
        username: '202401002',
        password: '123456',
      },
    })

    expect(loginResponse.status()).toBe(200)
    const loginData = await loginResponse.json()
    const token = loginData.data.token

    // 获取可选课程
    const response = await request.get(`${API_BASE}/api/student/courses`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.code).toBe(200)
    expect(Array.isArray(data.data)).toBe(true)
  })
})

test.describe('教师接口', () => {
  test.beforeEach(() => {
    test.info().annotations.push({
      type: 'API',
      description: `Base URL: ${API_BASE}`,
    })
  })

  test('GET /api/teacher/students - 获取学生列表', async ({ request }) => {
    // 先登录获取 token
    const loginResponse = await request.post(`${API_BASE}/api/auth/login`, {
      data: {
        username: 'T00003',
        password: '123456',
      },
    })

    expect(loginResponse.status()).toBe(200)
    const loginData = await loginResponse.json()
    const token = loginData.data.token

    // 获取学生列表
    const response = await request.get(`${API_BASE}/api/teacher/students`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.code).toBe(200)
    expect(Array.isArray(data.data)).toBe(true)
  })

  test('GET /api/teacher/grades - 获取成绩列表', async ({ request }) => {
    // 先登录获取 token
    const loginResponse = await request.post(`${API_BASE}/api/auth/login`, {
      data: {
        username: 'T00003',
        password: '123456',
      },
    })

    expect(loginResponse.status()).toBe(200)
    const loginData = await loginResponse.json()
    const token = loginData.data.token

    // 获取成绩列表
    const response = await request.get(`${API_BASE}/api/teacher/grades`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.code).toBe(200)
    expect(Array.isArray(data.data)).toBe(true)
  })

  test('POST /api/teacher/grades - 录入成绩', async ({ request }) => {
    // 先登录获取 token
    const loginResponse = await request.post(`${API_BASE}/api/auth/login`, {
      data: {
        username: 'T00003',
        password: '123456',
      },
    })

    expect(loginResponse.status()).toBe(200)
    const loginData = await loginResponse.json()
    const token = loginData.data.token

    // 录入成绩
    const response = await request.post(`${API_BASE}/api/teacher/grades`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        studentId: '202401002',
        courseId: 'C001',
        score: 85,
        semester: '2023-2024-1',
      },
    })

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.code).toBe(200)
  })

  test('GET /api/teacher/statistics - 获取统计数据', async ({ request }) => {
    // 先登录获取 token
    const loginResponse = await request.post(`${API_BASE}/api/auth/login`, {
      data: {
        username: 'T00003',
        password: '123456',
      },
    })

    expect(loginResponse.status()).toBe(200)
    const loginData = await loginResponse.json()
    const token = loginData.data.token

    // 获取统计数据
    const response = await request.get(`${API_BASE}/api/teacher/statistics`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.code).toBe(200)
  })
})

test.describe('公共接口', () => {
  test.beforeEach(() => {
    test.info().annotations.push({
      type: 'API',
      description: `Base URL: ${API_BASE}`,
    })
  })

  test('GET /api/dict - 获取字典数据', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/dict`)

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.code).toBe(200)
    expect(data.data).toHaveProperty('roles')
    expect(data.data).toHaveProperty('classes')
  })

  test('GET /api/health - 健康检查', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health`)

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.code).toBe(200)
  })

  test('GET /api/version - 获取版本信息', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/version`)

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.code).toBe(200)
    expect(data.data).toHaveProperty('version')
  })
})

test.describe('错误处理', () => {
  test.beforeEach(() => {
    test.info().annotations.push({
      type: 'API',
      description: `Base URL: ${API_BASE}`,
    })
  })

  test('404 处理', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/nonexistent`)

    expect(response.status()).toBe(404)
    const data = await response.json()
    expect(data.code).toBe(404)
  })

  test('500 处理', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/error`)

    expect(response.status()).toBe(500)
    const data = await response.json()
    expect(data.code).toBe(500)
  })

  test('未授权访问 - 缺少 token', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/student/profile`)

    expect(response.status()).toBe(401)
    const data = await response.json()
    expect(data.code).toBe(401)
  })

  test('未授权访问 - 无效 token', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/student/profile`, {
      headers: {
        Authorization: `Bearer invalid-token`,
      },
    })

    expect(response.status()).toBe(401)
    const data = await response.json()
    expect(data.code).toBe(401)
  })
})
