import type { Ref } from 'vue'
/**
 * 奖项审核 - 之星报名 Mock 数据
 */
import { ref } from 'vue'

/** 之星报名记录（含各类型特有字段） */
export interface StarRecord {
  id: string
  type: string
  typeLabel: string
  title: string
  submitDate: string
  semester: string
  status: string
  sourcePath: string
  applicant: string
  // 竞赛之星
  competitionName?: string
  competitionDate?: string
  competitionLevel?: string
  awardLevel?: string
  // 科研项目
  projectName?: string
  projectLevel?: string
  // 软著
  softName?: string
  issuer?: string
  // 论文
  paperName?: string
  journalName?: string
  // 公共
  ranking?: string
  projectDate?: string
  approveDate?: string
  publishDate?: string
  // 双创之星
  companyName?: string
  industryType?: string
  registerDate?: string
}

const semesters = ['2023-2024-1', '2023-2024-2', '2024-2025-1', '2024-2025-2']

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateStarData(): StarRecord[] {
  return [
    // ── 竞赛之星 ──
    {
      id: 'star-cmp-1',
      type: 'competitionStar',
      typeLabel: '竞赛之星报名',
      title: '全国大学生数学建模竞赛 - 竞赛之星报名',
      semester: pick(semesters),
      status: 'submitted',
      submitDate: '2026-06-15',
      sourcePath: '/awards/competition-star',
      applicant: '张三',
      competitionName: '全国大学生数学建模竞赛',
      competitionDate: '2025-09',
      competitionLevel: 'national',
      awardLevel: 'first',
    },
    {
      id: 'star-cmp-2',
      type: 'competitionStar',
      typeLabel: '竞赛之星报名',
      title: 'ACM 程序设计竞赛 - 竞赛之星报名',
      semester: pick(semesters),
      status: 'approved',
      submitDate: '2026-05-20',
      sourcePath: '/awards/competition-star',
      applicant: '张三',
      competitionName: 'ACM 程序设计竞赛',
      competitionDate: '2025-06',
      competitionLevel: 'provincial',
      awardLevel: 'second',
    },
    {
      id: 'star-cmp-3',
      type: 'competitionStar',
      typeLabel: '竞赛之星报名',
      title: '蓝桥杯大赛 - 竞赛之星报名',
      semester: pick(semesters),
      status: 'rejected',
      submitDate: '2026-04-10',
      sourcePath: '/awards/competition-star',
      applicant: '张三',
      competitionName: '蓝桥杯大赛',
      competitionDate: '2025-04',
      competitionLevel: 'national',
      awardLevel: 'third',
    },
    // ── 科研之星 - 科研项目 ──
    {
      id: 'star-sc-1',
      type: 'scientificProject',
      typeLabel: '科研之星报名',
      title: '省自然基金科研项目 - 科研之星报名',
      semester: pick(semesters),
      status: 'submitted',
      submitDate: '2026-06-20',
      sourcePath: '/awards/scientific-star',
      applicant: '张三',
      projectName: '省自然基金科研项目',
      projectLevel: 'provincial',
      ranking: '1/5',
      projectDate: '2025-01',
    },
    // ── 科研之星 - 软著 ──
    {
      id: 'star-sc-2',
      type: 'softwareCopyright',
      typeLabel: '科研之星报名',
      title: '档案管理软件 V1.0 - 科研之星报名',
      semester: pick(semesters),
      status: 'approved',
      submitDate: '2026-03-15',
      sourcePath: '/awards/scientific-star',
      applicant: '张三',
      softName: '档案管理软件 V1.0',
      issuer: '国家版权局',
      ranking: '1/3',
      approveDate: '2025-12',
    },
    // ── 科研之星 - 论文 ──
    {
      id: 'star-sc-3',
      type: 'paper',
      typeLabel: '科研之星报名',
      title: '基于 Vue3 的前端架构研究 - 科研之星报名',
      semester: pick(semesters),
      status: 'rejected',
      submitDate: '2026-05-01',
      sourcePath: '/awards/scientific-star',
      applicant: '张三',
      paperName: '基于 Vue3 的前端架构研究',
      journalName: '计算机工程与应用',
      ranking: '1/3',
      publishDate: '2025-08',
    },
    // ── 双创之星 ──
    {
      id: 'star-inn-1',
      type: 'innovationStar',
      typeLabel: '双创之星报名',
      title: '智创未来科技有限公司 - 双创之星报名',
      semester: pick(semesters),
      status: 'submitted',
      submitDate: '2026-07-01',
      sourcePath: '/awards/innovation-star',
      applicant: '张三',
      companyName: '智创未来科技有限公司',
      industryType: 'it',
      ranking: '1/2',
      registerDate: '2025-06',
    },
    {
      id: 'star-inn-2',
      type: 'innovationStar',
      typeLabel: '双创之星报名',
      title: '校园文创项目 - 双创之星报名',
      semester: pick(semesters),
      status: 'approved',
      submitDate: '2026-01-20',
      sourcePath: '/awards/innovation-star',
      applicant: '张三',
      companyName: '校园文创项目',
      industryType: 'media',
      ranking: '负责人',
      registerDate: '2025-03',
    },
  ]
}

export const SCIENTIFIC_SUB_TYPES = ['scientificProject', 'softwareCopyright', 'paper']

/** 获取之星报名的 Mock 数据 */
export function useStarMockData(): Ref<StarRecord[]> {
  return ref(generateStarData())
}

/** 按类型筛选之星报名数据 */
export function filterStarRecords(records: StarRecord[], typeKey: string): StarRecord[] {
  if (typeKey === 'all') return records
  if (typeKey === 'competitionStar') return records.filter((r) => r.type === 'competitionStar')
  if (typeKey === 'innovationStar') return records.filter((r) => r.type === 'innovationStar')
  if (typeKey === 'scientificStar')
    return records.filter((r) => SCIENTIFIC_SUB_TYPES.includes(r.type))
  return records
}

/** 判断之星报名记录是否可编辑 */
export function canEditStar(status: string): boolean {
  return status === 'submitted' || status === 'rejected'
}
