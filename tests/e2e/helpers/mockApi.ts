import type { Page } from '@playwright/test'

/**
 * 接口 mock 工具（让 E2E 不依赖后端与 natapp 隧道）。
 *
 * 约定：后端统一响应 `{ code: 0, message: 'ok', data }`，request.ts 拦截器只解包 data。
 * 未显式声明的路径统一返回空对象，避免页面因某个次要接口 404 而整体失败；
 * 需要断言的接口在下方 switch 中给出稳定数据。
 */

const STUDENT_USER = {
  userId: 1,
  userNo: '202401002',
  name: '测试学生',
  email: 'student@example.com',
  gender: 1,
  genderLabel: '男',
  schoolId: 1,
  schoolName: '测试大学',
  roles: ['student'],
  roleNames: ['学生'],
  avatar: null,
}

/** 用于断言「提交记录 / 申报看板能看到数据」的固定记录 */
export const MOCK_ACTIVITY = {
  id: 9001,
  title: 'E2E 模拟竞赛申报',
  archive_type: 'competition',
  archive_type_label: '学科竞赛',
  status: 1,
  submit_time: '2026-10-20 10:00:00',
  semester_name: '2026-2027-1',
  can_withdraw: true,
  can_edit: true,
  can_delete: true,
}

const EMPTY_PROFILE = {
  academicInfo: {
    userId: 1,
    name: '测试学生',
    studentNo: '202401002',
    grade: '2024级',
    major: '计算机科学与技术',
    degreeType: 'bachelor',
    degreeTypeLabel: '本科',
    className: '计算机2201班',
    collegeName: '计算机学院',
    gender: 1,
    genderLabel: '男',
    politicalStatus: 'masses',
    politicalStatusLabel: '群众',
    studentStatus: 'enrolled',
    studentStatusLabel: '在读',
    birthDate: '2004-01-01',
  },
  contactInfo: {},
  selfEvaluation: {},
  dimensionProfile: [],
  interests: [],
  semesterGrades: [],
  personalAwards: [],
}

export async function mockApi(page: Page): Promise<void> {
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.replace(/^\/api\/v1/, '')
    const method = request.method()

    const reply = (data: unknown) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 0, message: 'ok', data }),
      })

    // ── 认证 ──
    if (path === '/auth/captcha') return reply({ captchaKey: 'mock-key', captchaImage: '' })
    if (path === '/auth/login') {
      return reply({
        accessToken: 'mock-access-token',
        tokenType: 'Bearer',
        expiresIn: 7200,
        refreshToken: 'mock-refresh-token',
        user: STUDENT_USER,
      })
    }
    if (path === '/auth/me') {
      return reply({ ...STUDENT_USER, phone: null, permissions: [], scopes: [] })
    }

    // ── 学生端主链路数据 ──
    if (path === '/activities' && method === 'GET') {
      return reply({
        list: [MOCK_ACTIVITY],
        total: 1,
        page: 1,
        per_page: 200,
        pagination: { page: 1, per_page: 200, total: 1, total_pages: 1 },
      })
    }
    if (path === '/profile/info') return reply(EMPTY_PROFILE)
    if (path === '/profile/growth-timeline') return reply({ list: [], total: 0 })
    if (path === '/archive/dimensions') return reply([])
    if (path === '/home/dashboard') return reply({})
    if (path.startsWith('/messages') || path.startsWith('/notifications')) {
      return reply({ list: [], total: 0 })
    }

    // 其余接口统一成功空数据，保证页面可渲染
    return reply({})
  })
}
