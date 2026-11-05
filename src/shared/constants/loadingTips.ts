import type { GradeStage, LoadingTip, LoadingTipCategory } from '@/shared/constants/loadingTipsData'
import {
  LOADING_TIP_CATEGORY_LABELS,
  LOADING_TIPS,
  TIPS_BY_CATEGORY,
} from '@/shared/constants/loadingTipsData'
import {
  LOADING_TIP_FAVORITES_KEY,
  LOADING_TIP_HIDDEN_KEY,
  LOADING_TIP_LAST_ID_KEY,
} from '@/shared/constants/storageKeys'

/**
 * 加载页温馨提示：偏好（屏蔽/收藏）与随机选池逻辑。
 *
 * 文案与类型等静态数据见 ./loadingTipsData，此处统一再导出，
 * 保证外部既有的 import 路径与符号保持不变。
 */
export type { GradeStage, LoadingTip, LoadingTipCategory }
export { LOADING_TIP_CATEGORY_LABELS, LOADING_TIPS }

const ALL_CATEGORIES = Object.keys(LOADING_TIP_CATEGORY_LABELS) as LoadingTipCategory[]
/** 本科四阶段，用于「2023级」这类只有入学年份时的推算 */
const UNDERGRAD_STAGES: GradeStage[] = ['freshman', 'sophomore', 'junior', 'senior']
/** 研究生阶段：不推送本科专属主题（大学生活 / 考研升学） */
const GRADUATE_STAGES: GradeStage[] = ['master', 'phd']

function readLastTipId(): string | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    return sessionStorage.getItem(LOADING_TIP_LAST_ID_KEY) || undefined
  } catch {
    return undefined
  }
}

function readStringList(key: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : []
  } catch {
    return []
  }
}

function writeStringList(key: string, values: string[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(values))
  } catch {
    // 隐私模式或存储已满时静默失败
  }
}

/**
 * 从年级/学历文本解析学习阶段。
 * 兼容本科（大一/2023级/Junior）、硕士（硕士/研究生/研一/Master）、
 * 博士（博士/博士生/博一/PhD）等写法；无法识别返回 null（只展示通用建议）。
 */
export function resolveGradeStage(grade?: string | null): GradeStage | null {
  if (!grade) return null
  const text = grade.trim()
  if (!text) return null

  // 博士必须先判：「博士研究生」也含「研究生」，否则会被误判为硕士
  if (/博士|博一|博二|博三|博四|博五|phd|doctor/i.test(text)) return 'phd'
  if (/硕士|研究生|研一|研二|研三|master|postgraduate/i.test(text)) return 'master'

  if (/大一|一年级|freshman/i.test(text)) return 'freshman'
  if (/大二|二年级|sophomore/i.test(text)) return 'sophomore'
  if (/大三|三年级|junior/i.test(text)) return 'junior'
  if (/大四|四年级|senior/i.test(text)) return 'senior'

  // 只有入学年份时按本科四年制推算；超出范围（已毕业）视为无法识别
  const cohort = text.match(/20\d{2}/)
  if (cohort) {
    const stage = new Date().getFullYear() - Number(cohort[0]) + 1
    if (stage >= 1 && stage <= 4) return UNDERGRAD_STAGES[stage - 1]
  }
  return null
}

/** 已屏蔽的主题（只保留合法分类，避免脏数据导致空池） */
export function getHiddenTipCategories(): LoadingTipCategory[] {
  return readStringList(LOADING_TIP_HIDDEN_KEY).filter((value): value is LoadingTipCategory =>
    ALL_CATEGORIES.includes(value as LoadingTipCategory),
  )
}

/** 屏蔽某类提示；若会导致全部主题被屏蔽，则拒绝并返回 false（至少要保留一类） */
export function hideTipCategory(category: LoadingTipCategory): boolean {
  const hidden = getHiddenTipCategories()
  if (hidden.includes(category)) return true
  const next = [...hidden, category]
  if (ALL_CATEGORIES.every((item) => next.includes(item))) return false
  writeStringList(LOADING_TIP_HIDDEN_KEY, next)
  return true
}

export function restoreTipCategory(category: LoadingTipCategory): void {
  writeStringList(
    LOADING_TIP_HIDDEN_KEY,
    getHiddenTipCategories().filter((item) => item !== category),
  )
}

export function getFavoriteTipIds(): string[] {
  return readStringList(LOADING_TIP_FAVORITES_KEY)
}

export function isTipFavorited(id: string): boolean {
  return getFavoriteTipIds().includes(id)
}

/** 切换收藏状态，返回切换后的状态 */
export function toggleFavoriteTip(id: string): boolean {
  const ids = getFavoriteTipIds()
  const index = ids.indexOf(id)
  if (index >= 0) {
    ids.splice(index, 1)
    writeStringList(LOADING_TIP_FAVORITES_KEY, ids)
    return false
  }
  ids.push(id)
  writeStringList(LOADING_TIP_FAVORITES_KEY, ids)
  return true
}

/** 按收藏顺序返回完整文案（已下线的 id 自动忽略） */
export function getFavoriteTips(): LoadingTip[] {
  return getFavoriteTipIds()
    .map((id) => LOADING_TIPS.find((tip) => tip.id === id))
    .filter((tip): tip is LoadingTip => Boolean(tip))
}

/** 按页面/角色决定提示主题：只推当前场景相关的，避免泛泛而谈 */
export function resolveLoadingTipCategories(
  path: string,
  isTeacher: boolean,
): LoadingTipCategory[] {
  if (isTeacher) return ['teaching', 'college', 'growth']
  if (path.startsWith('/growth-timeline')) return ['growth']
  if (path.startsWith('/applications') || path.startsWith('/awards'))
    return ['paper', 'internship', 'growth']
  if (path.startsWith('/profile/career-plan')) return ['postgrad', 'abroad', 'career', 'startup']
  if (path.startsWith('/ai-chat')) return ['postgrad', 'abroad', 'career', 'startup', 'paper']
  if (path.startsWith('/dashboard')) return ['platform', 'college', 'growth']
  if (path.startsWith('/profile')) return ['platform', 'growth', 'college']
  return ['platform', 'growth', 'college']
}

export interface PickLoadingTipOptions {
  /** 当前年级；识别不到时不展示年级专属文案 */
  stage?: GradeStage | null
  /** 排除项，默认取上一次展示过的 id，避免连续重复 */
  excludeId?: string
}

/**
 * 随机取一条提示。
 *  - 先剔除用户屏蔽的主题；若全部被屏蔽则回落到「平台使用」，保证永远有内容；
 *  - 研究生/博士生不推「大学生活」「考研升学」两个本科专属主题；
 *  - 有年级时：通用建议 + 该年级专属建议；无年级时：只取通用建议；
 *  - 默认排除上一次展示过的 id（sessionStorage 持久化）。
 */
export function pickLoadingTip(
  categories: LoadingTipCategory[],
  options: PickLoadingTipOptions = {},
): LoadingTip {
  const hidden = new Set(getHiddenTipCategories())
  let visible = categories.filter((category) => !hidden.has(category))

  // 研究生/博士生：过滤本科专属主题；若过滤后为空（例如该页只配了 postgrad），保留原主题
  if (options.stage && GRADUATE_STAGES.includes(options.stage)) {
    const graduateAware = visible.filter(
      (category) => category !== 'college' && category !== 'postgrad',
    )
    if (graduateAware.length) visible = graduateAware
  }

  const effective = visible.length ? visible : (['platform'] as LoadingTipCategory[])

  let pool = effective.flatMap((category) => TIPS_BY_CATEGORY[category])
  pool = options.stage
    ? pool.filter((tip) => !tip.stages?.length || tip.stages.includes(options.stage as GradeStage))
    : pool.filter((tip) => !tip.stages?.length)
  if (!pool.length) pool = TIPS_BY_CATEGORY.platform

  const excludeId = options.excludeId ?? readLastTipId()
  const candidates =
    excludeId && pool.length > 1 ? pool.filter((tip) => tip.id !== excludeId) : pool
  const picked = candidates[Math.floor(Math.random() * candidates.length)] ?? LOADING_TIPS[0]
  try {
    sessionStorage.setItem(LOADING_TIP_LAST_ID_KEY, picked.id)
  } catch {
    // 隐私模式下静默降级：不记录上次提示，允许重复
  }
  return picked
}
