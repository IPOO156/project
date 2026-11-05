import type { Award, Grade, Interest, ProfileDimension } from '@/shared/types/types'
import { useUserStore } from './useUserStore'

/**
 * /profile/info 响应的字段映射（纯函数，便于单测）。
 * 从 useArchiveStore 抽出，避免单个 Store 文件超 200 行。
 * 原则：后端未返回的字段一律不编造，返回 null 表示「本次不覆盖」。
 */

/** 维度画像 */
export function mapDimensions(profile: any): ProfileDimension[] | null {
  if (!Array.isArray(profile?.dimensionProfile)) return null
  return profile.dimensionProfile.map((d: any) => ({
    label: d.dimensionName,
    current: d.score,
    target: d.targetScore,
    // /profile/info 未返回上阶段分数，无环比数据时 previous 与 current 相同（前端不编造趋势）
    previous: d.score,
  }))
}

/** 兴趣标签 */
export function mapInterests(profile: any): Interest[] | null {
  if (!Array.isArray(profile?.interests)) return null
  return profile.interests.map((i: any) => ({
    id: i.id,
    tagName: i.tagName,
    proficiencyLevel: i.proficiencyLevel,
    detailContent: i.detailContent || '',
    isDetail: i.isDetail,
  }))
}

/** 学期成绩 → Grade */
export function mapGrades(profile: any): Grade[] | null {
  if (!Array.isArray(profile?.semesterGrades)) return null
  return profile.semesterGrades.flatMap((s: any) =>
    Array.from({ length: s.courseCount ?? 0 }, (_, i) => ({
      id: `${s.semesterId}-${i}`,
      semester: s.semesterName || s.semester,
      courseName: `${s.semesterName || '学期'} 课程${i + 1}`,
      score: s.averageScore,
      gpa: s.gpa,
      credits: s.totalCredit / Math.max(s.courseCount ?? 1, 1),
    })),
  )
}

/**
 * 个人奖项（只读）：后端无个人奖项 CRUD 接口，奖项由申报/奖项报名审核通过后
 * 聚合进 /profile/info.personalAwards（类别汇总）。面板只读展示，无新增/编辑/删除。
 */
export function mapAwards(profile: any): Award[] | null {
  if (!Array.isArray(profile?.personalAwards)) return null
  return profile.personalAwards.map((a: any, i: number) => ({
    id: `award-${i}`,
    name: a.category,
    level: a.maxLevel,
    type: 'other',
    date: a.latestTime,
  }))
}

/**
 * 学籍信息同步到 userStore（档案概览页「基本资料」的展示来源）。
 * 只同步学籍与头像：联系邮箱/手机号属 /profile/contact 的数据，展示直接读 profileData.contactInfo，
 * 不写入 userInfo —— 否则会把「联系邮箱」覆盖到账号邮箱（userInfo.email）上，
 * 用户误以为注册邮箱已改，忘记密码却仍提示「邮箱未注册」。
 */
export function syncAcademicToUser(profile: any): void {
  const a = profile?.academicInfo ?? {}
  const c = profile?.contactInfo ?? {}
  const userStore = useUserStore()
  const base = userStore.userInfo
  if (!base) return
  userStore.setUserInfo({
    ...base,
    grade: a.grade ?? base.grade,
    major: a.major ?? base.major,
    className: a.className ?? base.className,
    studentId: a.studentNo ?? base.studentId,
    college: a.collegeName ?? base.college,
    avatar: c.avatar ?? base.avatar,
  })
}
