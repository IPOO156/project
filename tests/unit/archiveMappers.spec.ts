// @vitest-environment jsdom
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  mapAwards,
  mapDimensions,
  mapGrades,
  mapInterests,
  syncAcademicToUser,
} from '@/app/stores/archiveMappers'
import { useUserStore } from '@/app/stores/useUserStore'

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
})

describe('mapDimensions', () => {
  it('字段缺失时返回 null（本次不覆盖）', () => {
    expect(mapDimensions({})).toBeNull()
    expect(mapDimensions(null)).toBeNull()
  })

  it('映射维度画像，previous 与 current 相同（不编造趋势）', () => {
    const result = mapDimensions({
      dimensionProfile: [{ dimensionName: '专业能力', score: 80, targetScore: 90 }],
    })

    expect(result).toEqual([{ label: '专业能力', current: 80, target: 90, previous: 80 }])
  })
})

describe('mapInterests', () => {
  it('detailContent 缺省填空串', () => {
    const result = mapInterests({ interests: [{ id: 1, tagName: '足球', proficiencyLevel: 3 }] })

    expect(result).toEqual([
      { id: 1, tagName: '足球', proficiencyLevel: 3, detailContent: '', isDetail: undefined },
    ])
  })

  it('非数组时返回 null', () => {
    expect(mapInterests({ interests: 'x' })).toBeNull()
  })
})

describe('mapGrades', () => {
  it('按学期聚合成一行，不再按 courseCount 造课程', () => {
    const result = mapGrades({
      semesterGrades: [
        {
          semesterId: 1,
          semesterName: '2026-2027-1',
          courseCount: 2,
          averageScore: 88,
          gpa: 3.7,
          totalCredit: 8,
        },
      ],
    })

    expect(result).toHaveLength(1)
    expect(result?.[0]).toMatchObject({
      id: 'semester-1',
      semester: '2026-2027-1',
      courseName: '2026-2027-1 学期汇总',
      score: 88,
      gpa: 3.7,
      credits: 8,
      courseCount: 2,
      isAggregate: true,
    })
  })

  it('courseCount 缺失时仍保留学期汇总行，不丢成绩', () => {
    const result = mapGrades({
      semesterGrades: [{ semesterId: 2, semester: '2025-2026-2', totalCredit: 6 }],
    })

    expect(result).toHaveLength(1)
    expect(result?.[0]).toMatchObject({
      id: 'semester-2',
      courseName: '2025-2026-2 学期汇总',
      credits: 6,
      isAggregate: true,
    })
  })

  it('非数组时返回 null', () => {
    expect(mapGrades({})).toBeNull()
  })
})

describe('mapAwards', () => {
  it('按类别汇总映射，保留类别与数量并归类', () => {
    const result = mapAwards({
      personalAwards: [
        { category: '学科竞赛', totalCount: 3, maxLevel: '国家级', latestTime: '2026-05-01' },
        { category: '奖学金', totalCount: 1, maxLevel: '校级', latestTime: '2026-06-01' },
      ],
    })

    expect(result).toEqual([
      {
        id: 'award-0',
        name: '学科竞赛',
        level: '国家级',
        type: 'competition',
        date: '2026-05-01',
        category: '学科竞赛',
        count: 3,
        isAggregate: true,
      },
      {
        id: 'award-1',
        name: '奖学金',
        level: '校级',
        type: 'other',
        date: '2026-06-01',
        category: '奖学金',
        count: 1,
        isAggregate: true,
      },
    ])
  })

  it('类别名缺失时仍可展示，数量至少为 1', () => {
    const result = mapAwards({ personalAwards: [{}] })

    expect(result?.[0]).toMatchObject({ name: '', type: 'other', count: 1, isAggregate: true })
  })

  it('非数组时返回 null', () => {
    expect(mapAwards(undefined)).toBeNull()
  })
})

describe('syncAcademicToUser', () => {
  it('未登录（无 userInfo）时不做任何写入', () => {
    const userStore = useUserStore()

    syncAcademicToUser({ academicInfo: { grade: '大二' } })

    expect(userStore.userInfo).toBeNull()
  })

  it('只同步学籍与头像，不覆盖账号邮箱/手机号', () => {
    const userStore = useUserStore()
    userStore.setUserInfo({
      id: '1',
      username: '202401002',
      realName: '张三',
      email: 'account@example.com',
      phone: '13800000000',
      grade: '大一',
      major: '计算机',
      className: '1班',
      studentId: 'S1',
      college: '信息学院',
      avatar: 'old.png',
    })

    syncAcademicToUser({
      academicInfo: {
        grade: '大二',
        major: '软件工程',
        className: '2班',
        studentNo: 'S2',
        collegeName: '软件学院',
      },
      contactInfo: { avatar: 'new.png', email: 'contact@example.com', phone: '13900000000' },
    })

    expect(userStore.userInfo).toMatchObject({
      grade: '大二',
      major: '软件工程',
      className: '2班',
      studentId: 'S2',
      college: '软件学院',
      avatar: 'new.png',
      email: 'account@example.com',
      phone: '13800000000',
    })
  })

  it('后端未返回的字段保留原值', () => {
    const userStore = useUserStore()
    userStore.setUserInfo({
      id: '1',
      username: 'u',
      realName: '张三',
      email: 'a@b.c',
      phone: '1',
      grade: '大一',
      major: '计算机',
      className: '1班',
      studentId: 'S1',
    })

    syncAcademicToUser({})

    expect(userStore.userInfo).toMatchObject({ grade: '大一', major: '计算机' })
  })
})
