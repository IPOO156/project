import type { WeaknessAnalysis } from '@/shared/types/types'

interface AwardBubble {
  name: string
  level: string
  score: number
  date: string
}

interface GpaPoint {
  semester: string
  gpa: number
  score: number
}

export interface DashboardMockData {
  gpaTrend: GpaPoint[]
  awards: AwardBubble[]
  weaknesses: WeaknessAnalysis[]
  teacherSuggestions: { type: string; content: string }[]
}

export const dashboardMockData: DashboardMockData = {
  gpaTrend: [
    { semester: '2022-2023-1', gpa: 3.2, score: 82 },
    { semester: '2022-2023-2', gpa: 3.4, score: 85 },
    { semester: '2023-2024-1', gpa: 3.6, score: 88 },
    { semester: '2023-2024-2', gpa: 3.8, score: 91 },
  ],
  awards: [
    { name: '全国大学生数学建模竞赛', level: '国家级', score: 95, date: '2025-09' },
    { name: 'ACM 程序设计竞赛', level: '校级', score: 70, date: '2025-05' },
    { name: '校级优秀学生干部', level: '校级', score: 65, date: '2025-06' },
    { name: '暑期三下乡社会实践', level: '省部级', score: 85, date: '2024-08' },
    { name: '计算机二级证书', level: '院级', score: 45, date: '2024-03' },
  ],
  weaknesses: [
    {
      id: '1',
      dimension: '科研创新',
      score: 60,
      weakness: '科研项目与论文成果较少，科研经历不足。',
      suggestion: '主动参与导师课题，尝试申报大学生创新创业训练计划。',
    },
    {
      id: '2',
      dimension: '竞赛实践',
      score: 65,
      weakness: '竞赛参与广度尚可，但高影响力赛事获奖有限。',
      suggestion: '聚焦 1-2 项核心竞赛，制定备赛计划并组建稳定团队。',
    },
  ],
  teacherSuggestions: [
    {
      type: '学业',
      content: '大三学年课程难度提升，建议提前预习专业核心课，保持 GPA 稳步上升。',
    },
    {
      type: '竞赛',
      content: '重点关注与专业相关的 A 类竞赛，争取在毕业前获得省级以上奖项。',
    },
    {
      type: '综合素质',
      content: '适当参与学生组织与社会实践，提升沟通协作与领导力。',
    },
  ],
}
