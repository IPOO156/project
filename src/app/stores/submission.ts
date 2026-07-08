import type { ApplicationType, SubmissionFilters, SubmissionRecord } from '@/shared/types/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { APPLICATION_TYPE_MAP } from '@/shared/constants/dict'

/**
 * 统一提交记录 Store
 * 聚合所有申报模块与奖项模块的提交记录，支持筛选/搜索/分页
 */
export const useSubmissionStore = defineStore('submission', () => {
  const records = ref<SubmissionRecord[]>([])
  const filteredRecords = ref<SubmissionRecord[]>([])
  const loading = ref(false)

  const MODULE_PATH_MAP: Record<string, string> = {
    competition: '/applications/competition',
    innovation: '/applications/innovation',
    research: '/applications/research',
    scholarship: '/applications/scholarship',
    certificate: '/applications/certificate',
    internship: '/applications/internship',
    organization: '/applications/organization',
    training: '/applications/training',
    socialPractice: '/applications/social-practice',
    bookReport: '/applications/book-report',
    competitionStar: '/awards/competition-star',
    innovationStar: '/awards/innovation-star',
    scientificProject: '/awards/scientific-star',
    softwareCopyright: '/awards/scientific-star',
    paper: '/awards/scientific-star',
  }

  function generateMockData(): SubmissionRecord[] {
    const types = Object.keys(APPLICATION_TYPE_MAP) as ApplicationType[]
    const statuses: SubmissionRecord['status'][] = ['draft', 'submitted', 'approved', 'rejected']
    const semesters = ['2022-2023-2', '2023-2024-1', '2023-2024-2', '2024-2025-1']
    const mockTitles: Record<string, string[]> = {
      competition: ['全国大学生数学建模竞赛', 'ACM 程序设计竞赛', '蓝桥杯大赛'],
      innovation: ['校园文创项目', '智能硬件创业计划'],
      research: ['基于深度学习的图像识别研究', '区块链技术在档案管理中的应用'],
      scholarship: ['国家奖学金申请', '校级一等奖学金'],
      certificate: ['CET-6 证书登记', '计算机二级证书'],
      internship: ['字节跳动前端开发实习', '腾讯云运维实习'],
      organization: ['校学生会组织部', 'ACM 社团'],
      training: ['Vue3 企业级开发实训', '云计算架构实训'],
      socialPractice: ['暑期三下乡社会实践', '社区志愿服务'],
      bookReport: ['《深入理解计算机系统》读书心得', '《算法导论》读书笔记'],
      competitionStar: ['竞赛之星报名-数学建模', '竞赛之星报名-ACM'],
      innovationStar: ['双创之星报名-文创项目'],
      scientificProject: ['省自然基金科研项目', '校级创新实验项目'],
      softwareCopyright: ['档案管理软件 V1.0', '数据分析工具软件'],
      paper: ['基于 Vue3 的前端架构研究', '深度学习在档案分类中的应用'],
    }

    const result: SubmissionRecord[] = []
    let id = 1
    for (const type of types) {
      const titles = mockTitles[type] ?? ['默认申报']
      const modulePath = MODULE_PATH_MAP[type] ?? '/dashboard'
      for (const title of titles) {
        const semester = semesters[id % semesters.length]
        const status = statuses[id % statuses.length]
        const day = 10 + (id % 20)
        const month = 3 + (id % 9)
        result.push({
          id: String(id++),
          type,
          typeLabel: APPLICATION_TYPE_MAP[type] ?? type,
          title,
          submitDate: `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          semester,
          status,
          sourcePath: modulePath,
        })
      }
    }
    return result.sort((a, b) => b.submitDate.localeCompare(a.submitDate))
  }

  function fetchRecords(filters?: SubmissionFilters): Promise<void> {
    loading.value = true
    return new Promise((resolve) => {
      setTimeout(() => {
        if (records.value.length === 0) records.value = generateMockData()

        let filtered = [...records.value]
        if (filters) {
          if (filters.keyword) {
            const kw = filters.keyword.toLowerCase()
            filtered = filtered.filter(
              (r) => r.title.toLowerCase().includes(kw) || r.typeLabel.toLowerCase().includes(kw),
            )
          }
          if (filters.type) filtered = filtered.filter((r) => r.type === filters.type)
          if (filters.status) filtered = filtered.filter((r) => r.status === filters.status)
          if (filters.dateRange) {
            const [start, end] = filters.dateRange
            if (start) filtered = filtered.filter((r) => r.submitDate >= start)
            if (end) filtered = filtered.filter((r) => r.submitDate <= end)
          }
        }
        filteredRecords.value = filtered
        loading.value = false
        resolve()
      }, 300)
    })
  }

  function withdrawRecord(id: string) {
    const idx = records.value.findIndex((r) => r.id === id)
    if (idx >= 0) {
      records.value[idx] = { ...records.value[idx], status: 'draft' }
    }
    const fIdx = filteredRecords.value.findIndex((r) => r.id === id)
    if (fIdx >= 0) {
      filteredRecords.value[fIdx] = { ...filteredRecords.value[fIdx], status: 'draft' }
    }
  }

  return { records, filteredRecords, loading, fetchRecords, withdrawRecord }
})
