export interface GrowthExperience {
  id: string
  title: string
  date: string
  semester: string
  description: string
  tags: string[]
  skills: { name: string; growth: number }[]
}

export interface SemesterRing {
  level: number
  label: string
  code: string
  color: string
}

export const SEMESTER_RINGS: SemesterRing[] = [
  { level: 1, label: '大一上', code: '2023-2024-1', color: '#5a7c5a' },
  { level: 2, label: '大一下', code: '2023-2024-2', color: '#c8943e' },
  { level: 3, label: '大二上', code: '2024-2025-1', color: '#6b8e5b' },
  { level: 4, label: '大二下', code: '2024-2025-2', color: '#a88560' },
  { level: 5, label: '大三上', code: '2025-2026-1', color: '#5a7c5a' },
  { level: 6, label: '大三下', code: '2025-2026-2', color: '#c8943e' },
  { level: 7, label: '大四上', code: '2026-2027-1', color: '#6b8e5b' },
  { level: 8, label: '大四下', code: '2026-2027-2', color: '#a88560' },
]

export const INITIAL_EXPERIENCES: GrowthExperience[] = [
  {
    id: '1',
    title: '第一粒种子',
    date: '2023-09-15',
    semester: '2023-2024-1',
    description: '高中毕业后的暑假，读到了一本改变认知的书，埋下了好奇的种子。',
    tags: ['阅读', '认知'],
    skills: [
      { name: '好奇心', growth: 90 },
      { name: '阅读', growth: 50 },
    ],
  },
  {
    id: '2',
    title: '图书馆的冬天与夏天',
    date: '2024-03-10',
    semester: '2023-2024-2',
    description: '大一下学期几乎住在了图书馆，广泛阅读哲学、心理学、经济学。',
    tags: ['阅读', '跨学科'],
    skills: [
      { name: '跨学科思维', growth: 75 },
      { name: '阅读量', growth: 80 },
    ],
  },
  {
    id: '3',
    title: '第一次竞赛获奖',
    date: '2024-11-20',
    semester: '2024-2025-1',
    description: '参加校级程序设计竞赛获得二等奖，找到了技术热情。',
    tags: ['竞赛', '技术'],
    skills: [
      { name: '编程', growth: 70 },
      { name: '团队协作', growth: 60 },
    ],
  },
  {
    id: '4',
    title: '暑期社会实践',
    date: '2025-07-05',
    semester: '2024-2025-2',
    description: '参与乡村支教项目，学会了与不同背景的人沟通。',
    tags: ['实践', '公益'],
    skills: [
      { name: '沟通能力', growth: 80 },
      { name: '责任心', growth: 85 },
    ],
  },
  {
    id: '5',
    title: '科研项目立项',
    date: '2025-10-12',
    semester: '2025-2026-1',
    description: '加入导师课题组，开始接触学术研究和论文写作。',
    tags: ['科研', '学术'],
    skills: [
      { name: '研究能力', growth: 65 },
      { name: '写作', growth: 55 },
    ],
  },
]

export function inferSemester(dateStr: string): string {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const isFirstTerm = month >= 9 || month <= 1
  const startYear = isFirstTerm ? year : year - 1
  const term = isFirstTerm ? 1 : 2
  return `${startYear}-${startYear + 1}-${term}`
}

export function findRingBySemester(semester: string): SemesterRing | undefined {
  return SEMESTER_RINGS.find((r) => r.code === semester)
}

export function getSemesterIndex(semester: string): number {
  return findRingBySemester(semester)?.level ?? 0
}

export function getSemesterDisplayLabel(semester: string): string {
  const index = getSemesterIndex(semester)
  return index > 0 ? `第${index}学期` : semester
}

export function getSemesterLabel(semester: string): string {
  return findRingBySemester(semester)?.label ?? semester
}
