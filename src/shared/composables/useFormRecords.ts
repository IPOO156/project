import type { Ref } from 'vue'
/**
 * useFormRecords - 表单提交记录管理
 *
 * 统一管理各申报/报名类型的提交记录，支持 add/edit/remove/view。
 * 每个类型有独立的 Mock 数据集，提交后自动添加到记录列表。
 */
import { ref } from 'vue'

/** 通用提交记录（无状态，学生自主管理） */
export interface FormRecord {
  id: string
  type: string
  typeLabel: string
  title: string
  submitDate: string
  semester: string
  [key: string]: any
}

/** 各类型的 Mock 标题映射 */
const MOCK_TITLES: Record<string, string[]> = {
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
  competitionStar: ['全国大学生数学建模竞赛', 'ACM 程序设计竞赛'],
  innovationStar: ['智创未来科技有限公司', '校园文创项目'],
  scientificProject: ['省自然基金科研项目', '校级创新实验项目'],
  softwareCopyright: ['档案管理软件 V1.0', '数据分析工具软件'],
  paper: ['基于 Vue3 的前端架构研究', '深度学习在档案分类中的应用'],
}

const semesters = ['2023-2024-1', '2023-2024-2', '2024-2025-1', '2024-2025-2']

function genId(): string {
  return `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randDate(): string {
  const m = 1 + Math.floor(Math.random() * 12)
  const d = 1 + Math.floor(Math.random() * 28)
  return `2026-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** 各类型的额外 Mock 字段 */
const MOCK_EXTRA: Record<string, Record<string, string>> = {
  competition: {
    competitionName: '全国大学生数学建模竞赛',
    competitionType: 'national',
    awardLevel: 'first',
    awardDate: '2025-09',
  },
  innovation: {
    companyName: '校园文创项目',
    industryType: 'media',
    companyType: '创业计划',
    teamRole: '负责人',
    registerDate: '2025-03',
  },
  research: {
    projectName: '基于深度学习的图像识别研究',
    projectLevel: 'national',
    researchType: '基础研究',
    teamRole: '参与人',
    projectDate: '2025-01',
  },
  scholarship: {
    awardName: '国家奖学金',
    scholarshipLevel: 'national',
    scholarshipGrade: 'first',
    acquireDate: '2025-09',
  },
  certificate: { certName: 'CET-6 证书', certType: 'language', certDate: '2025-06' },
  internship: {
    company: '字节跳动',
    position: '前端开发实习生',
    location: '北京',
    startDate: '2025-03',
    endDate: '2025-08',
  },
  organization: {
    department: '校学生会',
    position: '部长',
    organizationLevel: 'school',
    startDate: '2024-09',
    endDate: '2025-06',
  },
  training: {
    projectName: 'Vue3 企业级开发实训',
    projectContent: '基于 Vue3 + TypeScript 开发',
    startDate: '2025-03',
    endDate: '2025-06',
  },
  socialPractice: {
    activityName: '暑期三下乡社会实践',
    location: '湖南湘西',
    organization: '校团委',
    startDate: '2025-07',
    endDate: '2025-08',
    volunteerHours: '120',
  },
  bookReport: { bookName: '深入理解计算机系统', bookDate: '2025-06' },
  competitionStar: {
    competitionName: '全国大学生数学建模竞赛',
    competitionDate: '2025-09',
    competitionLevel: 'national',
    awardLevel: 'first',
  },
  innovationStar: {
    companyName: '智创未来科技有限公司',
    industryType: 'it',
    ranking: '1/2',
    registerDate: '2025-06',
  },
  scientificProject: {
    projectName: '省自然基金科研项目',
    projectLevel: 'provincial',
    ranking: '1/5',
    projectDate: '2025-01',
  },
  softwareCopyright: {
    softName: '档案管理软件 V1.0',
    issuer: '国家版权局',
    ranking: '1/3',
    approveDate: '2025-12',
  },
  paper: {
    paperName: '基于 Vue3 的前端架构研究',
    journalName: '计算机工程与应用',
    ranking: '1/3',
    publishDate: '2025-08',
  },
}

function generateMockRecords(type: string, typeLabel: string): FormRecord[] {
  const titles = MOCK_TITLES[type] || ['默认记录']
  const extra = MOCK_EXTRA[type] || {}
  return titles.map((title, i) => ({
    id: `mock-${type}-${i}`,
    type,
    typeLabel,
    title,
    submitDate: randDate(),
    semester: pick(semesters),
    ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, i > 0 ? `${v}(${i + 1})` : v])),
  }))
}

/** 各类型的中文名称 */
const TYPE_LABELS: Record<string, string> = {
  competition: '学科竞赛',
  innovation: '创新创业',
  research: '学术研究',
  scholarship: '奖学金',
  certificate: '荣誉证书',
  internship: '实习经历',
  organization: '组织履历',
  training: '实训项目',
  socialPractice: '社会实践',
  bookReport: '图书心得',
  competitionStar: '竞赛之星报名',
  innovationStar: '双创之星报名',
  scientificProject: '科研项目',
  softwareCopyright: '软件著作权',
  paper: '发表论文',
}

/**
 * 管理指定类型的提交记录
 * @param type 类型 key
 */
export function useFormRecords(type: string) {
  const label = TYPE_LABELS[type] || type
  const records: Ref<FormRecord[]> = ref(generateMockRecords(type, label))

  function addRecord(title: string, extra: Record<string, any> = {}) {
    records.value.unshift({
      id: genId(),
      type,
      typeLabel: label,
      title,
      submitDate: new Date().toISOString().slice(0, 10),
      semester: pick(semesters),
      ...extra,
    })
  }

  function updateRecord(id: string, data: Partial<FormRecord>) {
    const idx = records.value.findIndex((r) => r.id === id)
    if (idx > -1) {
      records.value[idx] = { ...records.value[idx], ...data }
    }
  }

  function removeRecord(id: string) {
    records.value = records.value.filter((r) => r.id !== id)
  }

  function getRecord(id: string): FormRecord | undefined {
    return records.value.find((r) => r.id === id)
  }

  return {
    records,
    addRecord,
    updateRecord,
    removeRecord,
    getRecord,
  }
}
