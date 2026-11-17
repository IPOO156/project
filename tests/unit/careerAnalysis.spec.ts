import type { Award, Grade, ProfileDimension } from '@/shared/types/types'
import { describe, expect, it } from 'vitest'
import { analyzeCareer } from '@/features/ai-chat/composables/useCareerAnalysis'

const DIMMS: ProfileDimension[] = [{ label: '科研创新', current: 60, target: 90, previous: 60 }]

describe('analyzeCareer 成绩口径', () => {
  it('只有学期汇总时按学期描述，不把汇总当课程', () => {
    const grades: Grade[] = [
      {
        id: 'semester-1',
        semester: '2024-2025-1',
        courseName: '2024-2025-1 学期汇总',
        score: 75,
        gpa: 2.8,
        credits: 10,
        courseCount: 4,
        isAggregate: true,
      },
      {
        id: 'semester-2',
        semester: '2024-2025-2',
        courseName: '2024-2025-2 学期汇总',
        score: 85,
        gpa: 3.5,
        credits: 10,
        courseCount: 2,
        isAggregate: true,
      },
    ]

    const result = analyzeCareer(DIMMS, [], grades, [])

    expect(result?.materials).toContain('课程成绩（6 门 / 2 个学期汇总）')
    expect(result?.weaknesses[0].weakness).toContain('学期加权平均 80 分')
    expect(result?.weaknesses[0].weakness).toContain('1 个学期均分低于 80 分（2024-2025-1）')
    expect(result?.weaknesses[0].weakness).not.toContain('门课程低于')
  })

  it('有真实逐课行时仍按课程描述', () => {
    const grades: Grade[] = [
      {
        id: 'c1',
        semester: '2024-2025-1',
        courseName: '高等数学',
        score: 70,
        gpa: 2.2,
        credits: 2,
      },
      {
        id: 'c2',
        semester: '2024-2025-1',
        courseName: '大学英语',
        score: 90,
        gpa: 3.8,
        credits: 2,
      },
    ]

    const result = analyzeCareer(DIMMS, [], grades, [])

    expect(result?.materials).toContain('课程成绩（2 门）')
    expect(result?.weaknesses[0].weakness).toContain('平均成绩 80 分')
    expect(result?.weaknesses[0].weakness).toContain('1 门课程低于 80 分（高等数学）')
  })
})

describe('analyzeCareer 奖项汇总口径', () => {
  it('按 totalCount 统计类别内奖项，不再恒为 0', () => {
    const awards: Award[] = [
      {
        id: 'a1',
        name: '学科竞赛',
        level: '国家级',
        type: 'competition',
        date: '2026-05-01',
        category: '学科竞赛',
        count: 3,
        isAggregate: true,
      },
      {
        id: 'a2',
        name: '学术研究',
        level: '省级',
        type: 'research',
        date: '2026-06-01',
        category: '学术研究',
        count: 2,
        isAggregate: true,
      },
    ]

    const result = analyzeCareer(DIMMS, awards, [], [])

    expect(result?.materials).toContain('获奖记录（5 项）')
    expect(result?.weaknesses[0].weakness).toContain('共 3 个竞赛奖项（其中国家/省级 3 个）')
    expect(result?.weaknesses[0].weakness).toContain('科研类成果 2 项')
    expect(result?.weaknesses[0].weakness).not.toContain('暂无竞赛奖项记录')
    expect(result?.weaknesses[0].weakness).not.toContain('暂无科研类成果')
  })

  it('汇总类别确实没有竞赛/科研时仍如实提示暂无', () => {
    const awards: Award[] = [
      {
        id: 'a1',
        name: '奖学金',
        level: '校级',
        type: 'other',
        date: '2026-06-01',
        category: '奖学金',
        count: 1,
        isAggregate: true,
      },
    ]

    const result = analyzeCareer(DIMMS, awards, [], [])

    expect(result?.materials).toContain('获奖记录（1 项）')
    expect(result?.weaknesses[0].weakness).toContain('暂无竞赛奖项记录')
    expect(result?.weaknesses[0].weakness).toContain('暂无科研类成果')
  })
})
