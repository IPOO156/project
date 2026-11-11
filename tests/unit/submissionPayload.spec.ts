import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * payload.ts 的契约映射是纯函数逻辑，但 semesterIdMap 是模块级缓存，
 * 每个用例重建模块，避免「拉取失败后缓存空映射」污染后续用例。
 */
const api = vi.hoisted(() => ({ getSemesters: vi.fn() }))

vi.mock('@/shared/api/common', () => ({ getSemesters: api.getSemesters }))

type PayloadModule = typeof import('@/shared/api/submission/payload')

let payload: PayloadModule

beforeEach(async () => {
  vi.resetModules()
  api.getSemesters.mockReset()
  payload = await import('@/shared/api/submission/payload')
})

describe('toDateString', () => {
  it('空值返回 undefined', () => {
    expect(payload.toDateString(undefined)).toBeUndefined()
    expect(payload.toDateString(null)).toBeUndefined()
    expect(payload.toDateString('')).toBeUndefined()
    expect(payload.toDateString('   ')).toBeUndefined()
  })

  it('时间串截取日期前缀（ISO 与空格分隔）', () => {
    expect(payload.toDateString('2025-09-01T12:34:56Z')).toBe('2025-09-01')
    expect(payload.toDateString('2025-9-1 12:00:00')).toBe('2025-09-01')
  })

  it('仅年月补全为当月 01 日', () => {
    expect(payload.toDateString('2024-3')).toBe('2024-03-01')
  })

  it('日期对象按本地时区格式化，非法值返回 undefined', () => {
    expect(payload.toDateString(new Date(2025, 0, 5))).toBe('2025-01-05')
    expect(payload.toDateString(new Date('invalid'))).toBeUndefined()
  })

  it('无法识别的字符串与非字符串返回 undefined', () => {
    expect(payload.toDateString('2025/09/01')).toBeUndefined()
    expect(payload.toDateString(20250901)).toBeUndefined()
  })
})

describe('normalizeRole', () => {
  it('individual 映射为契约的 solo', () => {
    expect(payload.normalizeRole('individual')).toBe('solo')
    expect(payload.normalizeRole('leader')).toBe('leader')
    expect(payload.normalizeRole('member')).toBe('member')
    expect(payload.normalizeRole('solo')).toBe('solo')
  })

  it('未知角色返回 undefined', () => {
    expect(payload.normalizeRole('owner')).toBeUndefined()
    expect(payload.normalizeRole(undefined)).toBeUndefined()
  })
})

describe('toEvidenceFileIds', () => {
  it('非数组返回空数组', () => {
    expect(payload.toEvidenceFileIds(undefined)).toEqual([])
    expect(payload.toEvidenceFileIds({ fileId: 1 })).toEqual([])
  })

  it('支持裸数字与含 fileId/id 的对象，忽略其余项', () => {
    expect(
      payload.toEvidenceFileIds([
        11,
        { fileId: 12 },
        { id: 13 },
        { fileId: null, id: 14 },
        { fileId: '15' },
        null,
        'x',
      ]),
    ).toEqual([11, 12, 13, 14])
  })
})

describe('toAchievementEvidence', () => {
  it('非数组返回空数组', () => {
    expect(payload.toAchievementEvidence('x')).toEqual([])
  })

  it('缺少成果 id 或版本号非法的项被跳过', () => {
    expect(
      payload.toAchievementEvidence([
        { achievementVersion: 2, achievementFileId: 'f1' },
        { achievementId: 'a1', achievementVersion: 0, achievementFileId: 'f1' },
        { achievementId: 'a2', achievementFileId: 'f1' },
        { achievementId: 123, achievementVersion: 1 },
        null,
        'x',
      ]),
    ).toEqual([])
  })

  it('没有附件 id 时 fileIds 为空，字符串才算有效附件', () => {
    expect(payload.toAchievementEvidence([{ achievementId: 'a1', achievementVersion: 1 }])).toEqual(
      [{ achievementId: 'a1', version: 1, fileIds: [] }],
    )
    expect(
      payload.toAchievementEvidence([
        { achievementId: 'a1', achievementVersion: 1, achievementFileId: 9 },
      ]),
    ).toEqual([{ achievementId: 'a1', version: 1, fileIds: [] }])
  })

  it('同一成果的多份附件合并去重，不同成果各自成组', () => {
    expect(
      payload.toAchievementEvidence([
        { achievementId: 'a1', achievementVersion: 3, achievementFileId: 'f1' },
        { achievementId: 'a2', achievementVersion: 1, achievementFileId: 'f2' },
        { achievementId: 'a1', achievementVersion: 3, achievementFileId: 'f1' },
        { achievementId: 'a1', achievementVersion: 3, achievementFileId: 'f3' },
        { achievementId: 'a1', achievementVersion: 3 },
      ]),
    ).toEqual([
      { achievementId: 'a1', version: 3, fileIds: ['f1', 'f3'] },
      { achievementId: 'a2', version: 1, fileIds: ['f2'] },
    ])
  })
})

describe('resolveSemesterId', () => {
  it('数字直接透传，空字符串返回 undefined', async () => {
    expect(await payload.resolveSemesterId(12)).toBe(12)
    expect(await payload.resolveSemesterId('  ')).toBeUndefined()
    expect(await payload.resolveSemesterId(undefined)).toBeUndefined()
    expect(api.getSemesters).not.toHaveBeenCalled()
  })

  it('按名称与字符串化 ID 解析，学期列表只拉取一次', async () => {
    api.getSemesters.mockResolvedValue([
      { value: 7, name: '2024-2025-1', label: '2024-2025 学年第一学期', isCurrent: 1 },
      { value: 8, name: '2024-2025-2', label: '2024-2025 学年第二学期', isCurrent: 0 },
    ])

    expect(await payload.resolveSemesterId('2024-2025-2')).toBe(8)
    expect(await payload.resolveSemesterId('7')).toBe(7)
    expect(api.getSemesters).toHaveBeenCalledTimes(1)
  })

  it('名称未匹配时告警并返回 undefined', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    api.getSemesters.mockResolvedValue([
      { value: 1, name: '2024-2025-1', label: 'x', isCurrent: 1 },
    ])

    expect(await payload.resolveSemesterId('1999-2000-1')).toBeUndefined()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('1999-2000-1'))
    warn.mockRestore()
  })

  it('学期列表拉取失败时静默返回 undefined', async () => {
    api.getSemesters.mockRejectedValue(new Error('network'))

    expect(await payload.resolveSemesterId('2024-2025-1')).toBeUndefined()
  })
})

describe('buildContractPayload', () => {
  it('未配置的类型直接抛错', async () => {
    await expect(payload.buildContractPayload('unknown', {})).rejects.toThrow(
      '未配置申报类型契约：unknown',
    )
  })

  it('按契约重命名字段、归一化日期并带上附件 id', async () => {
    const result = await payload.buildContractPayload('competition', {
      semester: 3,
      isDraft: 1,
      competitionName: '蓝桥杯',
      competitionType: '',
      awardLevel: '国家级',
      awardDate: '2025-09-01T10:00:00',
      proofMaterials: [{ fileId: 21 }, 22],
    })

    expect(result).toEqual({
      semesterId: 3,
      isDraft: 1,
      evidenceFileIds: [21, 22],
      competitionName: '蓝桥杯',
      awardLevel: '国家级',
      obtainedTime: '2025-09-01',
    })
  })

  it('isDraft 缺省为 0，学期名称通过学期列表解析', async () => {
    api.getSemesters.mockResolvedValue([
      { value: 5, name: '2023-2024-1', label: '2023-2024 学年第一学期', isCurrent: 0 },
    ])

    const result = await payload.buildContractPayload('certificate', {
      semester: '2023-2024-1',
      certType: '技能证书',
      certName: 'CET-6',
    })

    expect(result.semesterId).toBe(5)
    expect(result.isDraft).toBe(0)
    expect(result.certificateType).toBe('技能证书')
    expect(result.certificateName).toBe('CET-6')
  })

  it('枚举字段按映射转码，未知中文值置空串，ASCII 原值保留', async () => {
    const mapped = await payload.buildContractPayload('innovation', {
      companyType: '创业实践',
    })
    expect(mapped.projectType).toBe('practice')

    const unknown = await payload.buildContractPayload('innovation', {
      companyType: '未配置的枚举',
    })
    expect(unknown.projectType).toBe('')

    const ascii = await payload.buildContractPayload('innovation', {
      companyType: 'plan',
    })
    expect(ascii.projectType).toBe('plan')
  })

  it('仅接受 ASCII 的字段把中文置空串，ASCII 值保留', async () => {
    const result = await payload.buildContractPayload('internship', {
      company: '字节跳动',
      location: '北京',
      position: 'Backend Intern',
      startDate: '2025-07',
    })

    expect(result.companyName).toBe('字节跳动')
    expect(result.location).toBe('')
    expect(result.position).toBe('Backend Intern')
    expect(result.startDate).toBe('2025-07-01')
  })

  it('成果墙引用只在存在合法项时写入 achievementEvidence', async () => {
    const withEvidence = await payload.buildContractPayload('competition', {
      competitionName: 'x',
      proofMaterials: [{ achievementId: 'a1', achievementVersion: 2, achievementFileId: 'f1' }],
    })
    expect(withEvidence.achievementEvidence).toEqual([
      { achievementId: 'a1', version: 2, fileIds: ['f1'] },
    ])

    const withoutEvidence = await payload.buildContractPayload('competition', {
      competitionName: 'x',
      proofMaterials: [1],
    })
    expect(withoutEvidence.achievementEvidence).toBeUndefined()
  })

  it('通用字段只有非空才附加，acquisitionDate 作为 obtainedTime 兜底', async () => {
    const result = await payload.buildContractPayload('certificate', {
      role: 'individual',
      certNumber: 'C-001',
      issuingAuthority: '教育部',
      validityPeriod: '2030-06',
      acquisitionDate: '2025-05-06',
    })

    expect(result.participantRole).toBe('solo')
    expect(result.certificateNo).toBe('C-001')
    expect(result.issuingUnit).toBe('教育部')
    expect(result.validUntil).toBe('2030-06-01')
    expect(result.obtainedTime).toBe('2025-05-06')
  })

  it('契约已映射 obtainedTime 时不被 acquisitionDate 覆盖', async () => {
    const result = await payload.buildContractPayload('competition', {
      competitionName: 'x',
      awardDate: '2025-01-02',
      acquisitionDate: '2025-09-09',
    })

    expect(result.obtainedTime).toBe('2025-01-02')
  })
})
