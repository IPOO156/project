import type { StarRecord } from '@/features/approval/composables/starRecords'
import { describe, expect, it } from 'vitest'
import {
  canEditStar,
  filterStarRecords,
  SCIENTIFIC_SUB_TYPES,
} from '@/features/approval/composables/starRecords'

function record(id: string, type: string): StarRecord {
  return {
    id,
    type,
    typeLabel: type,
    title: id,
    submitDate: '2026-10-01',
    semester: '2026-2027-1',
    status: 'submitted',
    sourcePath: '',
    applicant: '',
  }
}

const RECORDS = [
  record('1', 'competitionStar'),
  record('2', 'innovationStar'),
  record('3', 'scientificProject'),
  record('4', 'softwareCopyright'),
  record('5', 'paper'),
]

describe('filterStarRecords', () => {
  it('all 返回全部', () => {
    expect(filterStarRecords(RECORDS, 'all')).toHaveLength(5)
  })

  it('竞赛之星 / 创新之星按单一类型过滤', () => {
    expect(filterStarRecords(RECORDS, 'competitionStar').map((r) => r.id)).toEqual(['1'])
    expect(filterStarRecords(RECORDS, 'innovationStar').map((r) => r.id)).toEqual(['2'])
  })

  it('科研之星聚合科研项目 / 软著 / 论文三个子类型', () => {
    expect(filterStarRecords(RECORDS, 'scientificStar').map((r) => r.id)).toEqual(['3', '4', '5'])
    expect(SCIENTIFIC_SUB_TYPES).toEqual(['scientificProject', 'softwareCopyright', 'paper'])
  })

  it('未知类型原样返回（避免误清空列表）', () => {
    expect(filterStarRecords(RECORDS, 'unknown')).toHaveLength(5)
  })
})

describe('canEditStar', () => {
  it('仅已提交与已退回可编辑', () => {
    expect(canEditStar('submitted')).toBe(true)
    expect(canEditStar('rejected')).toBe(true)
  })

  it('草稿 / 通过 / 已撤回不可编辑', () => {
    expect(canEditStar('draft')).toBe(false)
    expect(canEditStar('approved')).toBe(false)
    expect(canEditStar('withdrawn')).toBe(false)
  })
})
