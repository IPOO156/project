import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { TimelineNode, Award, Grade, Interest } from '@/shared/types/types'

interface ProfileDimension {
  label: string
  score: number
  color: string
}

/**
 * 档案信息流转 Store
 * 集中管理个人档案数据（画像、兴趣、成绩、奖项、时间线）
 * 支持从提交记录同步数据
 */
export const useArchiveStore = defineStore('archive', () => {
  const interests = ref<Interest[]>([])
  const grades = ref<Grade[]>([])
  const awards = ref<Award[]>([])
  const dimensions = ref<ProfileDimension[]>([])
  const timelineEvents = ref<TimelineNode[]>([])
  const loading = ref(false)

  // ── 集中 Mock 数据 ──
  function generateMockData() {
    interests.value = [
      { id: '1', category: '编程开发', content: 'Web 前端开发、人工智能应用', level: 'proficient' },
      { id: '2', category: '语言能力', content: '英语（CET-6）、日语（N3）', level: 'good' },
      { id: '3', category: '运动爱好', content: '篮球、跑步', level: 'general' },
    ]

    grades.value = [
      { id: '1', semester: '2022-2023-1', courseName: '高等数学', score: 85, gpa: 3.2, credits: 5 },
      { id: '2', semester: '2022-2023-2', courseName: '线性代数', score: 87, gpa: 3.4, credits: 4 },
      { id: '3', semester: '2023-2024-1', courseName: '数据结构', score: 90, gpa: 3.6, credits: 5 },
      { id: '4', semester: '2023-2024-2', courseName: '操作系统', score: 91, gpa: 3.8, credits: 4 },
    ]

    awards.value = [
      { id: '1', name: '全国大学生数学建模竞赛', level: 'provincial', type: 'competition', date: '2025-09' },
      { id: '2', name: '校级优秀学生干部', level: 'school', type: 'other', date: '2025-06' },
      { id: '3', name: 'ACM 程序设计竞赛', level: 'school', type: 'competition', date: '2025-05' },
    ]

    dimensions.value = [
      { label: '学业成绩', score: 88, color: '#409eff' },
      { label: '竞赛实践', score: 65, color: '#67c23a' },
      { label: '科研创新', score: 60, color: '#e6a23c' },
      { label: '社会工作', score: 85, color: '#f56c6c' },
      { label: '综合素质', score: 80, color: '#9b59b6' },
    ]

    timelineEvents.value = [
      { id: '1', semester: '2022-2023-1', type: 'grade', title: '入学', description: '进入计算机科学与技术专业学习', date: '2024-09' },
      { id: '2', semester: '2022-2023-1', type: 'grade', title: '第一学期期末', description: 'GPA: 3.2，班级排名前30%', date: '2025-01' },
      { id: '3', semester: '2022-2023-2', type: 'competition', title: '加入ACM社团', description: '开始参加编程竞赛训练', date: '2025-03' },
      { id: '4', semester: '2022-2023-2', type: 'award', title: '通过CET-4', description: '英语四级考试: 532分', date: '2025-06' },
      { id: '5', semester: '2023-2024-1', type: 'award', title: '校ACM竞赛一等奖', description: '团队赛获得校级一等奖', date: '2025-09' },
      { id: '6', semester: '2023-2024-1', type: 'practice', title: '成为社团部长', description: '担任ACM社团技术部部长', date: '2025-11' },
      { id: '7', semester: '2023-2024-2', type: 'practice', title: '暑期社会实践', description: '参与"科技下乡"社会实践活动', date: '2026-03' },
      { id: '8', semester: '2023-2024-2', type: 'award', title: '数学建模省二等奖', description: '全国大学生数学建模竞赛省二等奖', date: '2026-05' },
      { id: '9', semester: '2024-2025-1', type: 'grade', title: 'GPA创新高', description: 'GPA: 3.82，班级排名前10%', date: '2026-09' },
    ]
  }

  // ── 从已通过的提交记录同步档案数据 ──
  function syncFromSubmissions(records: { type: string, title: string, submitDate: string, status: string }[]) {
    const approved = records.filter(r => r.status === 'approved')

    // 从已通过记录推导奖项
    const newAwards = approved
      .filter(r => ['competition', 'innovation', 'competitionStar'].includes(r.type))
      .map((r, i) => ({
        id: `award-${Date.now()}-${i}`,
        name: r.title,
        level: 'school' as const,
        type: 'competition' as const,
        date: r.submitDate,
      }))
    if (newAwards.length > 0) {
      awards.value = [...newAwards, ...awards.value]
    }

    // 从已通过记录推导时间线事件
    const newEvents = approved.map((r, i) => ({
      id: `tl-${Date.now()}-${i}`,
      semester: '2024-2025-1',
      type: 'award' as const,
      title: r.title,
      description: `${r.type} 申报已通过`,
      date: r.submitDate,
    }))
    if (newEvents.length > 0) {
      timelineEvents.value = [...newEvents, ...timelineEvents.value]
    }
  }

  // ── 加载档案数据 ──
  function fetchArchive(): Promise<void> {
    loading.value = true
    return new Promise((resolve) => {
      setTimeout(() => {
        if (interests.value.length === 0)
          generateMockData()
        loading.value = false
        resolve()
      }, 300)
    })
  }

  return {
    interests,
    grades,
    awards,
    dimensions,
    timelineEvents,
    loading,
    fetchArchive,
    syncFromSubmissions,
  }
})
