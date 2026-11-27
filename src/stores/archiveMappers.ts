import type { Award, Grade, Interest, ProfileDimension } from '@/shared/types/types'
import { asArray, asNumber, asRecord, asText } from '@/shared/utils/unknown'
import { useUserStore } from './useUserStore'

/**
 * /profile/info 响应的字段映射（纯函数，便于单测）。
 * 从 useArchiveStore 抽出，避免单个 Store 文件超 200 行。
 * 原则：后端未返回的字段一律不编造，返回 null 表示「本次不覆盖」。
 */

/** 维度画像 */
export function mapDimensions(profile: unknown): ProfileDimension[] | null {
  const p = asRecord(profile)
  if (!Array.isArray(p.dimensionProfile)) return null
  return asArray<unknown>(p.dimensionProfile).map((raw) => {
    const d = asRecord(raw)
    // BigDecimal 可能序列化为字符串（"3.40"），统一转数字后再透传
    const gap = Number(d.gap)
    return {
      label: asText(d.dimensionName),
      current: asNumber(d.score),
      target: asNumber(d.targetScore),
      // /profile/info 未返回上阶段分数，无环比数据时 previous 与 current 相同（前端不编造趋势）
      previous: asNumber(d.score),
      // 后端 gap 为权威值，有值直接透传，避免档案/AI 路径用浮点重算（报告 #16）
      gap: d.gap != null && Number.isFinite(gap) ? gap : undefined,
    }
  })
}

/** 兴趣标签 */
export function mapInterests(profile: unknown): Interest[] | null {
  const p = asRecord(profile)
  if (!Array.isArray(p.interests)) return null
  return asArray<unknown>(p.interests).map((raw) => {
    const i = asRecord(raw)
    return {
      id: asNumber(i.id),
      tagName: asText(i.tagName),
      proficiencyLevel: asNumber(i.proficiencyLevel),
      detailContent: asText(i.detailContent),
      isDetail: i.isDetail == null ? undefined : asNumber(i.isDetail),
    }
  })
}

/**
 * 学期成绩 → Grade（仅学期汇总行）。
 * 逐课明细（semesterGrades[].courses）不在这里展开，避免影响 AI 分析/简历等按学期聚合的消费方；
 * 档案页成绩卡直接读 profileData.semesterGrades[].courses 逐科展示。
 */
export function mapGrades(profile: unknown): Grade[] | null {
  const p = asRecord(profile)
  if (!Array.isArray(p.semesterGrades)) return null
  return asArray<unknown>(p.semesterGrades).map((raw, i: number) => {
    const s = asRecord(raw)
    const semesterName = asText(s.semesterName) || asText(s.semester) || '学期'
    return {
      id: `semester-${s.semesterId != null ? String(s.semesterId) : String(i)}`,
      semester: semesterName,
      courseName: `${semesterName} 学期汇总`,
      score: asNumber(s.averageScore),
      gpa: asNumber(s.gpa),
      credits: asNumber(s.totalCredit),
      courseCount: s.courseCount == null ? undefined : asNumber(s.courseCount),
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
export function mapAwards(profile: unknown): Award[] | null {
  const p = asRecord(profile)
  if (!Array.isArray(p.personalAwards)) return null
  return asArray<unknown>(p.personalAwards).map((raw, i: number) => {
    const a = asRecord(raw)
    const category = asText(a.category)
    return {
      id: `award-${i}`,
      name: category,
      level: asText(a.maxLevel),
      type: classifyAwardCategory(category),
      date: asText(a.latestTime),
      category,
      count: asNumber(a.totalCount) || 1,
      isAggregate: true,
    }
  })
}

/**
 * 学籍信息同步到 userStore（档案概览页「基本资料」的展示来源）。
 * 只同步学籍与头像：/profile/info 的联系邮箱/手机号是脱敏值，不能写入 userInfo；
 * 未脱敏的最新联系方式由「保存联系信息」后 updateUserInfo 回写到 userInfo。
 */
export function syncAcademicToUser(profile: unknown): void {
  const p = asRecord(profile)
  const a = asRecord(p.academicInfo)
  const c = asRecord(p.contactInfo)
  const userStore = useUserStore()
  const base = userStore.userInfo
  if (!base) return
  userStore.setUserInfo({
    ...base,
    grade: asText(a.grade, base.grade),
    major: asText(a.major, base.major),
    className: asText(a.className, base.className),
    studentId: asText(a.studentNo, base.studentId),
    college: a.collegeName == null ? base.college : asText(a.collegeName),
    avatar: c.avatar == null ? base.avatar : asText(c.avatar),
  })
}
