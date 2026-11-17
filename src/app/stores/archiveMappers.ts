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

/** 学期成绩 → Grade（后端暂无逐课字段，按学期聚合展示，不编造课程行） */
export function mapGrades(profile: any): Grade[] | null {
  if (!Array.isArray(profile?.semesterGrades)) return null
  return profile.semesterGrades.map((s: any, i: number) => {
    const semesterName = s.semesterName || s.semester || '学期'
    return {
      id: `semester-${s.semesterId ?? i}`,
      semester: semesterName,
      courseName: `${semesterName} 学期汇总`,
      score: s.averageScore ?? 0,
      gpa: s.gpa ?? 0,
      credits: s.totalCredit ?? 0,
      courseCount: s.courseCount,
      isAggregate: true,
    }
  })
}

/**
 * 按类别名归类奖项。
 * 后端 personalAwards 只给中文类别名，没有稳定类型码；这里仅做展示层归类，
 * 新增/改名类别时不会自动识别，最终应由后端补 categoryCode（见后端配合说明）。
 */
export function classifyAwardCategory(category: string): Award['type'] {
  if (/竞赛|比赛|赛事/.test(category)) return 'competition'
  if (/创新|创业|双创/.test(category)) return 'innovation'
  if (/科研|学术|论文|专利|软著|著作/.test(category)) return 'research'
  return 'other'
}

/**
 * 个人奖项（只读）：后端无个人奖项 CRUD 接口，奖项由申报/奖项报名审核通过后
 * 聚合进 /profile/info.personalAwards（类别汇总）。面板只读展示，无新增/编辑/删除。
 */
export function mapAwards(profile: any): Award[] | null {
  if (!Array.isArray(profile?.personalAwards)) return null
  return profile.personalAwards.map((a: any, i: number) => {
    const category = String(a.category ?? '')
    return {
      id: `award-${i}`,
      name: category,
      level: a.maxLevel,
      type: classifyAwardCategory(category),
      date: a.latestTime,
      category,
      count: Number(a.totalCount) || 1,
      isAggregate: true,
    }
  })
}

/**
 * 学籍信息同步到 userStore（档案概览页「基本资料」的展示来源）。
 * 只同步学籍与头像：/profile/info 的联系邮箱/手机号是脱敏值，不能写入 userInfo；
 * 未脱敏的最新联系方式由「保存联系信息」后 updateUserInfo 回写到 userInfo。
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
