/**
 * 教师端/管理端 API 类型 —— 组织架构（/admin/schools|colleges|majors|classes）
 */
import type { PageQuery } from './common-types'

export interface OrgSchoolItem {
  schoolId: number
  schoolName: string
  code: string | null
  status: number | null
}

export interface OrgCollegeItem {
  collegeId: number
  collegeName: string
  code: string | null
  schoolId: number | null
  status: number | null
}

export interface OrgMajorItem {
  majorId: number
  majorName: string
  code: string | null
  collegeId: number | null
  status: number | null
}

export interface OrgClassItem {
  classId: number
  className: string
  grade: string | null
  majorId: number | null
  studentCount: number | null
  status: number | null
}

export interface OrgClassQuery extends PageQuery {
  majorId?: number
  collegeId?: number
  schoolId?: number
  grade?: string
  status?: number
  keyword?: string
}

/** 创建/更新班级（11.5/11.6） */
export interface OrgClassSavePayload {
  majorId: number
  className: string
  grade?: string
  status?: number
}

/** 创建专业（11.7） */
export interface OrgMajorCreatePayload {
  collegeId: number
  majorName: string
  majorCode?: string
  status?: number
}

/** 创建班级/专业响应（classId 或 majorId 二选一） */
export interface OrgCreateIdResult {
  classId?: number
  majorId?: number
}
