import type { ApplicationType } from '@/shared/types/types'

/* ===================== 申报/报名契约映射（对齐 7.x 档案申报 / 8.x 奖项报名接口文档） ===================== */

/** 前端表单字段 → 后端契约字段。key=后端字段名，value=前端表单字段名 */
interface TypeContract {
  endpoint: string
  mapping: Record<string, string>
  dateFields: string[]
  /** 后端仅接受 ASCII/枚举码的字段（中文会触发 10003 格式错误），提交时非 ASCII 置空串 */
  asciiFields?: string[]
  /** 后端枚举字段：前端中文 label → 后端枚举码 */
  enumMap?: Record<string, Record<string, string>>
}

/** 8.3 科研之星：走"主记录 + 子项目"流程，不走简单 POST 提交 */
export const RESEARCH_STAR_TYPES: ApplicationType[] = [
  'scientificProject',
  'softwareCopyright',
  'paper',
]

/** 8.3 科研之星子项目契约（子项目端点路径 + 字段映射） */
export const RESEARCH_STAR_SUB_CONTRACTS: Record<
  string,
  { path: string; mapping: Record<string, string>; dateFields: string[] }
> = {
  scientificProject: {
    path: 'projects',
    mapping: {
      projectName: 'projectName',
      projectLevel: 'projectLevel',
      rankTotal: 'ranking',
      establishedTime: 'startDate',
    },
    dateFields: ['establishedTime'],
  },
  softwareCopyright: {
    path: 'software',
    mapping: { softwareName: 'softName', rankTotal: 'ranking', approvedTime: 'approveDate' },
    dateFields: ['approvedTime'],
  },
  paper: {
    path: 'papers',
    mapping: {
      journalName: 'journalName',
      paperTitle: 'paperName',
      rankTotal: 'ranking',
      publishedTime: 'publishDate',
    },
    dateFields: ['publishedTime'],
  },
}

/** 7.x / 8.x 各申报类型的接口端点与字段映射（字段名以接口文档为准） */
export const APPLICATION_CONTRACTS: Record<string, TypeContract> = {
  competition: {
    endpoint: '/applications/competition',
    mapping: {
      competitionName: 'competitionName',
      competitionType: 'competitionType',
      awardLevel: 'awardLevel',
      obtainedTime: 'awardDate',
    },
    dateFields: ['obtainedTime'],
  },
  scholarship: {
    endpoint: '/applications/scholarship',
    mapping: {
      scholarshipName: 'awardName',
      scholarshipCategory: 'scholarshipLevel',
      awardLevel: 'scholarshipGrade',
      obtainedTime: 'acquireDate',
    },
    dateFields: ['obtainedTime'],
  },
  certificate: {
    endpoint: '/applications/certificate',
    mapping: { certificateType: 'certType', certificateName: 'certName', obtainedTime: 'certDate' },
    dateFields: ['obtainedTime'],
  },
  innovation: {
    endpoint: '/applications/innovation',
    mapping: {
      companyName: 'companyName',
      industryType: 'industryType',
      projectType: 'companyType',
      registeredTime: 'registerDate',
    },
    dateFields: ['registeredTime'],
    // 实测：projectType 仅接受枚举码（practice/plan/registered/other），中文"创业实践"会 10003
    enumMap: {
      projectType: {
        创业实践: 'practice',
        创业计划: 'plan',
        实体注册: 'registered',
        其他: 'other',
      },
    },
  },
  research: {
    // 注意：契约要求 startDate/endDate 两个必填，前端表单仅有 projectDate（单月份），endDate 缺失会导致提交被后端校验拒绝
    endpoint: '/applications/research',
    mapping: {
      projectName: 'projectName',
      projectLevel: 'projectLevel',
      projectType: 'researchType',
      startDate: 'projectDate',
      endDate: 'endDate',
    },
    dateFields: ['startDate', 'endDate'],
    // 实测：projectType 为必填枚举，仅接受 ASCII 码（basic/applied/development…），表单已改下拉
    enumMap: { projectType: { 基础研究: 'basic', 应用研究: 'applied', 试验发展: 'development' } },
  },
  internship: {
    endpoint: '/applications/internship',
    mapping: {
      companyName: 'company',
      location: 'location',
      position: 'position',
      startDate: 'startDate',
      endDate: 'endDate',
    },
    dateFields: ['startDate', 'endDate'],
    // 实测：location/position 仅接受 ASCII/数字（中文 10003），非 ASCII 置空串
    asciiFields: ['location', 'position'],
  },
  organization: {
    endpoint: '/applications/organization',
    mapping: {
      orgLevel: 'organizationLevel',
      department: 'department',
      positionTitle: 'position',
      startDate: 'startDate',
      endDate: 'endDate',
    },
    dateFields: ['startDate', 'endDate'],
    enumMap: { orgLevel: { 校级: 'school', 院级: 'college', 社团级: 'club', 班级: 'class' } },
    // 实测：positionTitle 必填但仅接受 ASCII 枚举（leader/member/solo…），中文 10003
    asciiFields: ['positionTitle'],
  },
  training: {
    endpoint: '/applications/training',
    mapping: {
      projectName: 'projectName',
      projectContent: 'projectContent',
      startDate: 'startDate',
      endDate: 'endDate',
    },
    dateFields: ['startDate', 'endDate'],
    // 实测：projectContent 带中文会 10003（空值/ASCII 可存），非 ASCII 置空串
    asciiFields: ['projectContent'],
  },
  socialPractice: {
    endpoint: '/applications/practice',
    mapping: {
      activityName: 'activityName',
      practiceLocation: 'location',
      practiceUnit: 'organization',
      startDate: 'startDate',
      endDate: 'endDate',
      volunteerHours: 'volunteerHours',
    },
    dateFields: ['startDate', 'endDate'],
    // 实测：practiceLocation/practiceUnit 仅接受 ASCII/数字，中文 10003
    asciiFields: ['practiceLocation', 'practiceUnit'],
  },
  bookReport: {
    endpoint: '/applications/book-review',
    mapping: { bookName: 'bookName', readMonth: 'bookDate', reviewContent: 'review' },
    dateFields: ['readMonth'],
  },
  competitionStar: {
    endpoint: '/awards/competition-star',
    mapping: {
      competitionName: 'competitionName',
      participatedTime: 'competitionDate',
      competitionLevel: 'competitionLevel',
      awardLevel: 'awardLevel',
    },
    dateFields: ['participatedTime'],
  },
  innovationStar: {
    endpoint: '/awards/innovation-star',
    mapping: {
      companyName: 'companyName',
      industryType: 'industryType',
      applicantRank: 'ranking',
      registeredTime: 'registerDate',
    },
    dateFields: ['registeredTime'],
  },
}
