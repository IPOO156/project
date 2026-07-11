import type { Award, Grade, Interest, ProfileDimension, TimelineNode } from '@/shared/types/types'

let idCounter = 100

function nextId(): string {
  return String(++idCounter)
}

/**
 * 获取兴趣列表
 * 后端就绪后替换为：return request.get<Interest[]>('/archive/interests')
 */
export function getInterests(): Promise<Interest[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: '1',
          category: '编程开发',
          content: 'Web 前端开发、人工智能应用',
          level: 'proficient',
        },
        { id: '2', category: '语言能力', content: '英语（CET-6）、日语（N3）', level: 'good' },
        { id: '3', category: '运动爱好', content: '篮球、跑步', level: 'general' },
      ])
    }, 300)
  })
}

/**
 * 添加成长时间轴节点
 * 后端就绪后替换为：return request.post<TimelineNode>('/archive/timeline', data)
 */
export function addTimelineEvent(data: Omit<TimelineNode, 'id'>): Promise<TimelineNode> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ id: String(Date.now()), ...data })
    }, 200)
  })
}

/**
 * 删除成长时间轴节点
 * 后端就绪后替换为：return request.delete(`/archive/timeline/${id}`)
 */
export function deleteTimelineEvent(_id: string): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 200)
  })
}

export function addInterest(data: Omit<Interest, 'id'>): Promise<Interest> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ ...data, id: nextId() }), 200)
  })
}

export function updateInterest(id: string, data: Partial<Interest>): Promise<Interest> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ ...data, id } as Interest), 200)
  })
}

export function deleteInterest(_id: string): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 200)
  })
}

/**
 * 获取成绩列表
 * 后端就绪后替换为：return request.get<Grade[]>('/archive/grades')
 */
export function getGrades(): Promise<Grade[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: '1',
          semester: '2022-2023-1',
          courseName: '高等数学',
          score: 85,
          gpa: 3.2,
          credits: 5,
        },
        {
          id: '2',
          semester: '2022-2023-2',
          courseName: '线性代数',
          score: 87,
          gpa: 3.4,
          credits: 4,
        },
        {
          id: '3',
          semester: '2023-2024-1',
          courseName: '数据结构',
          score: 90,
          gpa: 3.6,
          credits: 5,
        },
        {
          id: '4',
          semester: '2023-2024-2',
          courseName: '操作系统',
          score: 91,
          gpa: 3.8,
          credits: 4,
        },
      ])
    }, 300)
  })
}

/**
 * 获取奖项列表
 * 后端就绪后替换为：return request.get<Award[]>('/archive/awards')
 */
export function getAwards(): Promise<Award[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: '1',
          name: '全国大学生数学建模竞赛',
          level: 'provincial',
          type: 'competition',
          date: '2025-09',
          prize: '二等奖',
        },
        {
          id: '2',
          name: '校级优秀学生干部',
          level: 'school',
          type: 'other',
          date: '2025-06',
          prize: '优秀干部',
        },
        {
          id: '3',
          name: 'ACM 程序设计竞赛',
          level: 'school',
          type: 'competition',
          date: '2025-05',
          prize: '一等奖',
        },
      ])
    }, 300)
  })
}

export function addAward(data: Omit<Award, 'id'>): Promise<Award> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ ...data, id: nextId() }), 200)
  })
}

export function updateAward(id: string, data: Partial<Award>): Promise<Award> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ ...data, id } as Award), 200)
  })
}

export function deleteAward(_id: string): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 200)
  })
}

/**
 * 获取多维度画像
 * 后端就绪后替换为：return request.get<ProfileDimension[]>('/archive/dimensions')
 */
export function getDimensions(): Promise<ProfileDimension[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { label: '学业成绩', current: 88, target: 92, previous: 81 },
        { label: '竞赛实践', current: 75, target: 90, previous: 68 },
        { label: '科研创新', current: 60, target: 82, previous: 52 },
        { label: '社会工作', current: 85, target: 88, previous: 78 },
        { label: '综合素质', current: 80, target: 90, previous: 72 },
      ])
    }, 300)
  })
}

/**
 * 获取时间线节点
 * 后端就绪后替换为：return request.get<TimelineNode[]>('/archive/timeline')
 */
export function getTimelineEvents(): Promise<TimelineNode[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: '1',
          semester: '2022-2023-1',
          type: 'grade',
          title: '入学',
          description: '进入计算机科学与技术专业学习',
          date: '2024-09',
        },
        {
          id: '2',
          semester: '2022-2023-1',
          type: 'grade',
          title: '第一学期期末',
          description: 'GPA: 3.2',
          date: '2025-01',
        },
        {
          id: '3',
          semester: '2022-2023-2',
          type: 'competition',
          title: '加入ACM社团',
          description: '开始参加编程竞赛训练',
          date: '2025-03',
        },
        {
          id: '4',
          semester: '2022-2023-2',
          type: 'award',
          title: '通过CET-4',
          description: '英语四级考试: 532分',
          date: '2025-06',
        },
        {
          id: '5',
          semester: '2023-2024-1',
          type: 'award',
          title: '校ACM竞赛一等奖',
          description: '团队赛获得校级一等奖',
          date: '2025-09',
        },
        {
          id: '6',
          semester: '2023-2024-1',
          type: 'practice',
          title: '成为社团部长',
          description: '担任ACM社团技术部部长',
          date: '2025-11',
        },
        {
          id: '7',
          semester: '2023-2024-2',
          type: 'practice',
          title: '暑期社会实践',
          description: '参与"科技下乡"活动',
          date: '2026-03',
        },
        {
          id: '8',
          semester: '2023-2024-2',
          type: 'award',
          title: '数学建模省二等奖',
          description: '全国大学生数学建模竞赛省二等奖',
          date: '2026-05',
        },
        {
          id: '9',
          semester: '2024-2025-1',
          type: 'grade',
          title: 'GPA创新高',
          description: 'GPA: 3.82',
          date: '2026-09',
        },
      ])
    }, 300)
  })
}
