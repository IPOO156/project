import type { GrowthExperience } from '../timeline-constants'
import { computed, ref } from 'vue'
import { useActivityStore } from '@/app/stores/activity'
import { useArchiveStore, useSubmissionStore } from '@/app/stores/stores'
import { inferSemester } from '../timeline-constants'

interface SyncOptions {
  /** 是否只同步已审核通过的数据 */
  approvedOnly?: boolean
}

interface SyncResult {
  added: number
  skipped: number
  experiences: GrowthExperience[]
}

const STORAGE_KEY = 'growth-timeline:auto-sync'

function normalizeDate(dateStr: string): string {
  // 支持 YYYY-MM 或 YYYY-MM-DD 或 YYYY-MM-DD HH:mm
  const d = dateStr.trim().split(' ')[0]
  if (/^\d{4}-\d{2}$/.test(d)) return `${d}-01`
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d
  return d
}

/**
 * 清洗同步来源的文本，移除 URL 路径、纯英文片段等不适合显示在卡片上的内容
 */
function sanitizeSyncedText(text: string): string {
  if (!text) return ''
  return (
    text
      // 移除 /applications/competition 等路径
      .replace(/\/[\w-]+(?:\/[\w-]+)*/g, '')
      // 移除连续英文/数字混合的片段（保留中文及常见标点）
      .replace(/[\w.-]{2,}/g, '')
      // 合并多余空格
      .replace(/\s+/g, ' ')
      .trim()
  )
}

function inferSkillsByType(type: string): { name: string; growth: number }[] {
  const lower = type.toLowerCase()
  if (lower.includes('competition') || lower.includes('竞赛')) {
    return [
      { name: '竞赛能力', growth: 75 },
      { name: '团队协作', growth: 60 },
    ]
  }
  if (
    lower.includes('research') ||
    lower.includes('科研') ||
    lower.includes('paper') ||
    lower.includes('project')
  ) {
    return [
      { name: '研究能力', growth: 70 },
      { name: '学术写作', growth: 55 },
    ]
  }
  if (lower.includes('innovation') || lower.includes('创业') || lower.includes('双创')) {
    return [
      { name: '创新思维', growth: 72 },
      { name: '项目执行', growth: 65 },
    ]
  }
  if (lower.includes('internship') || lower.includes('实习')) {
    return [
      { name: '实践能力', growth: 78 },
      { name: '职场素养', growth: 68 },
    ]
  }
  if (
    lower.includes('social') ||
    lower.includes('practice') ||
    lower.includes('实践') ||
    lower.includes('志愿')
  ) {
    return [
      { name: '社会责任', growth: 70 },
      { name: '沟通能力', growth: 65 },
    ]
  }
  if (lower.includes('scholarship') || lower.includes('奖学金')) {
    return [
      { name: '学业成绩', growth: 80 },
      { name: '综合素质', growth: 70 },
    ]
  }
  if (lower.includes('certificate') || lower.includes('证书')) {
    return [
      { name: '专业技能', growth: 65 },
      { name: '自主学习', growth: 60 },
    ]
  }
  if (
    lower.includes('organization') ||
    lower.includes('组织') ||
    lower.includes('社团') ||
    lower.includes('学生干部')
  ) {
    return [
      { name: '组织协调', growth: 72 },
      { name: '领导力', growth: 60 },
    ]
  }
  if (lower.includes('training') || lower.includes('实训')) {
    return [
      { name: '专业技能', growth: 70 },
      { name: '动手能力', growth: 65 },
    ]
  }
  if (lower.includes('book') || lower.includes('读书') || lower.includes('心得')) {
    return [
      { name: '阅读思考', growth: 68 },
      { name: '表达能力', growth: 55 },
    ]
  }
  return [
    { name: '综合能力', growth: 60 },
    { name: '成长记录', growth: 55 },
  ]
}

function makeDedupeKey(experience: GrowthExperience): string {
  return `${experience.title}|${experience.semester}|${experience.date}`
}

export function useGrowthDataSources() {
  const submissionStore = useSubmissionStore()
  const archiveStore = useArchiveStore()
  const activityStore = useActivityStore()

  const isSyncing = ref(false)
  const autoSync = ref(localStorage.getItem(STORAGE_KEY) === 'true')

  const sourceCount = computed(() => {
    return (
      submissionStore.records.length +
      archiveStore.awards.length +
      archiveStore.timelineEvents.length +
      activityStore.activities.length
    )
  })

  function setAutoSync(enabled: boolean) {
    autoSync.value = enabled
    localStorage.setItem(STORAGE_KEY, String(enabled))
  }

  function mapSubmissionRecords(options: SyncOptions = {}): GrowthExperience[] {
    const records =
      options.approvedOnly !== false
        ? submissionStore.records.filter((r) => r.status === 'approved')
        : submissionStore.records

    return records.map((record) => {
      const date = normalizeDate(record.submitDate)
      const skills = inferSkillsByType(record.type)
      return {
        id: `sub-${record.id}`,
        title: sanitizeSyncedText(record.title),
        date,
        semester: record.semester || inferSemester(date),
        description: `${sanitizeSyncedText(record.typeLabel)}申报已记录。`,
        tags: [sanitizeSyncedText(record.typeLabel), '申报'],
        skills,
      }
    })
  }

  function mapAwards(options: SyncOptions = {}): GrowthExperience[] {
    const awards = options.approvedOnly !== false ? archiveStore.awards : archiveStore.awards

    return awards.map((award) => {
      const date = normalizeDate(award.date)
      const skills = inferSkillsByType(award.type)
      const cleanedType = sanitizeSyncedText(award.type ?? '')
      const cleanedLevel = sanitizeSyncedText(award.level ?? '')
      return {
        id: `award-${award.id}`,
        title: sanitizeSyncedText(award.name ?? ''),
        date,
        semester: inferSemester(date),
        description:
          sanitizeSyncedText(award.description ?? '') ||
          `获得${cleanedLevel}级${cleanedType}奖项。`,
        tags: ['奖项', cleanedType],
        skills,
      }
    })
  }

  function mapTimelineEvents(): GrowthExperience[] {
    return archiveStore.timelineEvents.map((node) => {
      const skills = inferSkillsByType(node.type)
      return {
        id: `archive-node-${node.id}`,
        title: sanitizeSyncedText(node.title),
        date: normalizeDate(node.date),
        semester: node.semester,
        description: sanitizeSyncedText(node.description),
        tags: [sanitizeSyncedText(node.type)],
        skills,
      }
    })
  }

  function mapActivities(options: SyncOptions = {}): GrowthExperience[] {
    const activities =
      options.approvedOnly !== false
        ? activityStore.activities.filter((a) => a.status === 'approved')
        : activityStore.activities

    return activities
      .filter((activity) => !activity.text.includes('已通过'))
      .map((activity) => {
        const date = normalizeDate(activity.time)
        const cleanedText = sanitizeSyncedText(activity.text)
        if (!cleanedText) return null
        return {
          id: `activity-${activity.id}`,
          title: cleanedText,
          date,
          semester: inferSemester(date),
          description: `来自最近动态：${cleanedText}。`,
          tags: ['动态'],
          skills: inferSkillsByType('other'),
        }
      })
      .filter((item): item is GrowthExperience => item !== null)
  }

  /**
   * 将其他模块数据同步为成长经历
   * @param currentExperiences 当前已存在的经历列表（用于去重）
   * @param options 同步选项
   * @returns 新增数量与跳过数量
   */
  async function sync(
    currentExperiences: GrowthExperience[],
    options: SyncOptions = {},
  ): Promise<SyncResult> {
    isSyncing.value = true

    // 确保各 store 已加载数据
    await Promise.all([
      submissionStore.fetchRecords(),
      archiveStore.fetchArchive(),
      activityStore.fetchActivities(),
    ])

    const existingKeys = new Set(currentExperiences.map(makeDedupeKey))
    const candidates: GrowthExperience[] = [
      ...mapSubmissionRecords(options),
      ...mapAwards(options),
      ...mapTimelineEvents(),
      ...mapActivities(options),
    ]

    // 过滤掉状态性描述（如"已报名"、"已记录"）的经历，只保留有实质内容的记录
    const filteredCandidates = candidates.filter((candidate) => {
      const text = `${candidate.title} ${candidate.description}`.toLowerCase()
      return !text.includes('已报名') && !text.includes('已记录')
    })

    const added: GrowthExperience[] = []
    let skipped = candidates.length - filteredCandidates.length

    for (const candidate of filteredCandidates) {
      const key = makeDedupeKey(candidate)
      if (existingKeys.has(key)) {
        skipped++
        continue
      }
      existingKeys.add(key)
      added.push(candidate)
    }

    isSyncing.value = false
    return { added: added.length, skipped, experiences: added }
  }

  return {
    isSyncing,
    autoSync,
    sourceCount,
    setAutoSync,
    sync,
  }
}
