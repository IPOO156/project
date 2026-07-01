import { computed, ref, watch } from 'vue'
import { getStudentArchiveCategory, studentArchiveCategories } from './nav'

export const semesterOptions = [
  '2025-2026 第2学期',
  '2025-2026 第1学期',
  '2024-2025 第2学期',
  '2024-2025 第1学期',
]

export const statusMeta = {
  draft: { label: '草稿', tone: 'neutral', icon: 'edit' },
  wait: { label: '审核中', tone: 'warning', icon: 'clock' },
  ok: { label: '已通过', tone: 'success', icon: 'check' },
  no: { label: '已驳回', tone: 'danger', icon: 'close' },
}

export const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'draft', label: statusMeta.draft.label },
  { value: 'wait', label: statusMeta.wait.label },
  { value: 'ok', label: statusMeta.ok.label },
  { value: 'no', label: statusMeta.no.label },
]

const seedRecords = [
  {
    id: 'competition-20260412',
    category: 'competition',
    title: '程序设计竞赛省级选拔赛二等奖',
    organization: '计算机学院',
    date: '2026-04-12',
    semester: '2025-2026 第2学期',
    files: ['获奖证书.pdf', '参赛名单.xlsx', '现场照片.jpg'],
    status: 'ok',
    review: '证明材料完整，奖项信息与学院备案一致。',
  },
  {
    id: 'practice-20260303',
    category: 'practice',
    title: '社区敬老院志愿服务活动',
    organization: '青年志愿者协会',
    date: '2026-03-03',
    semester: '2025-2026 第2学期',
    files: ['活动证明.pdf', '服务时长截图.png', '活动照片-1.jpg', '活动照片-2.jpg'],
    status: 'wait',
    review: '辅导员审核中。',
  },
  {
    id: 'research-20260201',
    category: 'research',
    title: '基于深度学习的图像识别算法研究',
    organization: '智能计算实验室',
    date: '2026-02-01',
    semester: '2025-2026 第2学期',
    files: ['论文初稿.docx'],
    status: 'draft',
    review: '草稿尚未提交审核。',
  },
  {
    id: 'internship-20260525',
    category: 'internship',
    title: '某某科技前端研发实习证明',
    organization: '某某科技有限公司',
    date: '2026-05-25',
    semester: '2025-2026 第2学期',
    files: ['实习证明.pdf', '实习合同.pdf', '导师评价.docx'],
    status: 'wait',
    review: '等待学院实践办复核。',
  },
  {
    id: 'honor-20260528',
    category: 'honor',
    title: '校级优秀学生干部',
    organization: '学生工作部',
    date: '2026-05-28',
    semester: '2025-2026 第2学期',
    files: ['荣誉证书.pdf', '公示截图.png'],
    status: 'ok',
    review: '证书编号有效。',
  },
  {
    id: 'training-20260116',
    category: 'training',
    title: '企业级 Web 工程实训项目',
    organization: '软件工程系',
    date: '2026-01-16',
    semester: '2025-2026 第1学期',
    files: ['结项报告.pdf', '项目仓库截图.png'],
    status: 'ok',
    review: '项目成果与课程记录一致。',
  },
  {
    id: 'scholarship-20251220',
    category: 'scholarship',
    title: '2025 年度学业一等奖学金',
    organization: '教务处',
    date: '2025-12-20',
    semester: '2025-2026 第1学期',
    files: ['奖学金证明.pdf'],
    status: 'ok',
    review: '已通过奖学金名单核验。',
  },
  {
    id: 'organization-20251102',
    category: 'organization',
    title: '学生会技术部部长任职记录',
    organization: '校学生会',
    date: '2025-11-02',
    semester: '2025-2026 第1学期',
    files: ['任职证明.pdf', '工作总结.docx'],
    status: 'ok',
    review: '任职时间清晰，材料完整。',
  },
  {
    id: 'innovation-20251018',
    category: 'innovation',
    title: '校园低碳数据平台创业训练项目',
    organization: '创新创业学院',
    date: '2025-10-18',
    semester: '2025-2026 第1学期',
    files: ['项目申报书.pdf', '中期检查表.docx'],
    status: 'wait',
    review: '等待创新创业学院确认项目级别。',
  },
  {
    id: 'reflection-20250920',
    category: 'reflection',
    title: '大三学年成长复盘',
    organization: '个人记录',
    date: '2025-09-20',
    semester: '2025-2026 第1学期',
    files: ['成长复盘.md'],
    status: 'no',
    review: '内容偏简略，请补充目标达成情况和佐证材料。',
  },
  {
    id: 'research-20250508',
    category: 'research',
    title: '本科生科研训练结题材料',
    organization: '智能计算实验室',
    date: '2025-05-08',
    semester: '2024-2025 第2学期',
    files: ['结题报告.pdf', '导师评语.pdf'],
    status: 'no',
    review: '缺少结题验收表盖章页。',
  },
  {
    id: 'competition-20250409',
    category: 'competition',
    title: '数学建模校赛一等奖',
    organization: '数学学院',
    date: '2025-04-09',
    semester: '2024-2025 第2学期',
    files: ['获奖证书.pdf', '参赛论文.pdf'],
    status: 'ok',
    review: '竞赛等级和获奖名单一致。',
  },
]

const storageKey = 'sa.archiveRecords'

function toFile(value) {
  if (typeof value === 'string') {
    return { name: value, size: '--', type: value.split('.').pop()?.toUpperCase() ?? 'FILE' }
  }

  return {
    name: value.name,
    size: value.size ?? '--',
    type: value.type ?? value.name?.split('.').pop()?.toUpperCase() ?? 'FILE',
  }
}

function normalizeRecord(record) {
  return {
    ...record,
    files: (record.files ?? []).map(toFile),
    updatedAt: record.updatedAt ?? `${record.date}T09:00:00.000Z`,
  }
}

function getStorage() {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

function loadRecords() {
  const storage = getStorage()
  if (!storage) return seedRecords.map(normalizeRecord)

  try {
    const saved = JSON.parse(storage.getItem(storageKey) || '[]')
    return Array.isArray(saved) && saved.length ? saved.map(normalizeRecord) : seedRecords.map(normalizeRecord)
  } catch {
    return seedRecords.map(normalizeRecord)
  }
}

const records = ref(loadRecords())

watch(
  records,
  (value) => {
    const storage = getStorage()
    if (storage) storage.setItem(storageKey, JSON.stringify(value))
  },
  { deep: true },
)

function today() {
  return new Date().toISOString().slice(0, 10)
}

function byDateDesc(a, b) {
  return new Date(b.date).getTime() - new Date(a.date).getTime()
}

function fileSizeLabel(size) {
  if (size === '--' || size == null) return '--'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function escapeCsv(value) {
  const text = String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

function recordsToCsv(items) {
  const header = ['分类', '标题', '组织/项目', '日期', '学期', '材料数', '状态', '审核意见']
  const rows = items.map((record) => {
    const category = getStudentArchiveCategory(record.category)?.label ?? record.category
    return [
      category,
      record.title,
      record.organization,
      record.date,
      record.semester,
      record.files.length,
      statusMeta[record.status]?.label ?? record.status,
      record.review,
    ]
  })

  return [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')
}

export function downloadText(filename, content, type = 'text/plain;charset=utf-8') {
  if (typeof window === 'undefined') return
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function exportRecords(items, filename = '成长档案.csv') {
  downloadText(filename, `\ufeff${recordsToCsv(items)}`, 'text/csv;charset=utf-8')
}

export function exportTemplate(categoryLabel = '成长档案') {
  const rows = [
    ['标题', '组织/项目', '日期', '学期', '材料文件名', '备注'],
    [`${categoryLabel}示例`, '填写组织或项目名称', today(), semesterOptions[0], '证书.pdf;证明材料.jpg', '可选'],
  ]
  downloadText('档案导入模板.csv', `\ufeff${rows.map((row) => row.map(escapeCsv).join(',')).join('\n')}`, 'text/csv;charset=utf-8')
}

export function useArchiveStore() {
  const sortedRecords = computed(() => [...records.value].sort(byDateDesc))

  const stats = computed(() => {
    const total = records.value.length
    const wait = records.value.filter((item) => item.status === 'wait').length
    const ok = records.value.filter((item) => item.status === 'ok').length
    const no = records.value.filter((item) => item.status === 'no').length
    const draft = records.value.filter((item) => item.status === 'draft').length
    const fileTotal = records.value.reduce((sum, item) => sum + item.files.length, 0)
    const completion = total ? Math.round((ok / total) * 100) : 0

    return { total, wait, ok, no, draft, fileTotal, completion }
  })

  const categorySummary = computed(() =>
    studentArchiveCategories.map((category) => {
      const items = records.value.filter((item) => item.category === category.key)
      const status = items.some((item) => item.status === 'no')
        ? 'no'
        : items.some((item) => item.status === 'wait')
          ? 'wait'
          : items.length
            ? 'ok'
            : 'draft'

      return {
        ...category,
        count: items.length,
        files: items.reduce((sum, item) => sum + item.files.length, 0),
        status,
      }
    }),
  )

  const recentSubmissions = computed(() =>
    sortedRecords.value.filter((item) => item.status !== 'draft').slice(0, 5),
  )

  function addRecord(payload) {
    const record = normalizeRecord({
      id: `local-${Date.now()}`,
      category: payload.category,
      title: payload.title,
      organization: payload.organization || '个人提交',
      date: payload.date || today(),
      semester: payload.semester || semesterOptions[0],
      files: payload.files || [],
      status: payload.status || 'draft',
      review: payload.status === 'wait' ? '已提交，等待审核。' : payload.review || '草稿尚未提交审核。',
      updatedAt: new Date().toISOString(),
    })

    records.value.unshift(record)
    return record
  }

  function updateRecord(id, patch) {
    const index = records.value.findIndex((item) => item.id === id)
    if (index < 0) return null

    records.value[index] = normalizeRecord({
      ...records.value[index],
      ...patch,
      updatedAt: new Date().toISOString(),
    })
    return records.value[index]
  }

  function submitRecord(id) {
    return updateRecord(id, {
      status: 'wait',
      review: '已提交，等待审核。',
      date: today(),
    })
  }

  function resubmitRecord(id) {
    return updateRecord(id, {
      status: 'wait',
      review: '已根据审核意见重新提交。',
      date: today(),
    })
  }

  function resetRecords() {
    records.value = seedRecords.map(normalizeRecord)
  }

  return {
    records,
    sortedRecords,
    stats,
    categorySummary,
    recentSubmissions,
    addRecord,
    updateRecord,
    submitRecord,
    resubmitRecord,
    resetRecords,
    fileSizeLabel,
  }
}
