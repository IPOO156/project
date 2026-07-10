import type { CareerPlanRecord } from '@/shared/types/types'

let idCounter = 10

function nextId(): string {
  return String(++idCounter)
}

/**
 * 获取职业规划记录
 * 后端就绪后替换为：return request.get<CareerPlanRecord[]>('/career-plan')
 */
export function getCareerPlans(): Promise<CareerPlanRecord[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: '1',
          semester: '2023-2024-1',
          title: '大二学年成长规划',
          submitDate: '2025-09-15',
          status: 'submitted',
        },
        {
          id: '2',
          semester: '2022-2023-2',
          title: '大一学年总结与规划',
          submitDate: '2025-03-10',
          status: 'submitted',
        },
      ])
    }, 300)
  })
}

/**
 * 提交职业规划
 * 后端就绪后替换为：return request.post<CareerPlanRecord>('/career-plan', data)
 */
export function submitCareerPlan(
  data: Pick<CareerPlanRecord, 'semester' | 'title'>,
): Promise<CareerPlanRecord> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ...data,
        id: nextId(),
        submitDate: new Date().toISOString().slice(0, 10),
        status: 'submitted',
      })
    }, 600)
  })
}
