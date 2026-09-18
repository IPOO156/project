/**
 * useCareerAnalysis - 职业规划短板分析引擎
 *
 * 基于「真实档案数据」生成个性化短板分析与改进建议：
 *  - 读 archiveStore 的 dimensions（多维度画像分数）+ awards（奖项）+ grades（成绩）
 *  - 读 careerPlanStore 的 plans（已提交规划数）
 *  - 按维度差距（target - current）降序取短板，结合真实数据生成弱点描述与建议
 *
 * 数据流：useAIChat 命中职业规划关键词 → 调 analyzeCareer → 写入 careerPlanStore.aiAnalysis
 *        → CareerPlan.vue 读 store.aiAnalysis 渲染短板区域（AI 回复回流页面）
 *
 * 后端 AI 就绪后，将 analyzeCareer 替换为真实 API 调用即可，上下游零改动。
 */
import type { RichBlock } from '../types'
import type {
  Award,
  CareerAnalysis,
  CareerPlanRecord,
  Grade,
  ProfileDimension,
  WeaknessItem,
} from '@/shared/types/types'

/** 高级别奖项 level 标识（用于"竞赛实践"短板描述） */
const HIGH_LEVELS = ['national', 'provincial']

/**
 * 基于真实档案数据生成职业规划短板分析
 *
 * @param dimensions 多维度画像（current/target/previous）
 * @param awards     奖项列表（type/level/name）
 * @param grades     成绩列表（courseName/score/gpa）
 * @param plans      已提交职业规划记录
 * @returns 结构化分析结果；dimensions 为空时返回 null（数据未加载）
 */
export function analyzeCareer(
  dimensions: ProfileDimension[],
  awards: Award[],
  grades: Grade[],
  plans: CareerPlanRecord[],
): CareerAnalysis | null {
  if (dimensions.length === 0) return null

  // 按差距降序排列，取差距 > 10 的维度作为短板（不足则取差距最大的 2 个）
  const sorted = [...dimensions]
    .map((d) => ({ d, gap: d.target - d.current }))
    .sort((a, b) => b.gap - a.gap)

  const weakGaps = sorted.filter((x) => x.gap > 10)
  const picked = (weakGaps.length >= 1 ? weakGaps : sorted.slice(0, 2)).slice(0, 3)

  const weaknesses: WeaknessItem[] = picked.map(({ d, gap }) => ({
    dimension: d.label,
    score: d.current,
    target: d.target,
    gap,
    weakness: describeWeakness(d, gap, awards, grades),
    suggestion: suggestImprovement(awards, grades),
  }))

  const weakCount = weaknesses.length
  const topDim = weaknesses[0]?.dimension ?? '—'
  const summary =
    weakCount === 0
      ? `共分析 ${dimensions.length} 个维度，各维度均接近目标，整体发展均衡。建议持续保持并追求突破。`
      : `共分析 ${dimensions.length} 个维度，其中 ${weakCount} 个维度距目标差距较大（>10分）。已提交职业规划 ${plans.length} 份，建议优先突破「${topDim}」维度。`

  // 本次分析实际引用的档案材料（供界面以"依据材料"chips 展示）
  const materials: string[] = []
  if (dimensions.length > 0) materials.push(`多维度画像（${dimensions.length} 项）`)
  if (grades.length > 0) materials.push(`课程成绩（${grades.length} 门）`)
  if (awards.length > 0) materials.push(`获奖记录（${awards.length} 项）`)
  if (plans.length > 0) materials.push(`职业规划（${plans.length} 份）`)

  return {
    greeting: '职业规划短板分析 🎯',
    summary,
    weaknesses,
    materials,
    generatedAt: new Date().toLocaleString('zh-CN'),
  }
}

// ── 短板描述：基于真实数据动态生成个性化文本 ──

function describeWeakness(
  d: ProfileDimension,
  gap: number,
  awards: Award[],
  grades: Grade[],
): string {
  const base = `${d.current} 分（目标 ${d.target}，差 ${gap} 分）`
  const facts: string[] = []

  if (grades.length > 0) {
    const avg = Math.round(grades.reduce((s, g) => s + g.score, 0) / grades.length)
    facts.push(`平均成绩 ${avg} 分`)
    const low = grades.filter((g) => g.score < 80)
    if (low.length > 0) {
      facts.push(`${low.length} 门课程低于 80 分（${low.map((g) => g.courseName).join('、')}）`)
    }
  }

  const competitions = awards.filter((a) => a.type === 'competition')
  if (competitions.length === 0) {
    facts.push('暂无竞赛奖项记录')
  } else {
    const high = competitions.filter((a) => HIGH_LEVELS.includes(a.level))
    facts.push(
      `共 ${competitions.length} 个竞赛奖项${high.length ? `（其中国家/省级 ${high.length} 个）` : ''}`,
    )
  }

  const research = awards.filter((a) => a.type === 'research' || a.type === 'innovation')
  facts.push(research.length > 0 ? `科研类成果 ${research.length} 项` : '暂无科研类成果')

  return facts.length > 0 ? `${base}，${facts.join('，')}` : base
}

// ── 改进建议：基于真实数据动态生成可操作建议 ──

function suggestImprovement(awards: Award[], grades: Grade[]): string {
  const tips: string[] = []

  const low = grades.filter((g) => g.score < 80)
  if (low.length > 0) {
    tips.push(`重点复习「${low.map((g) => g.courseName).join('、')}」等薄弱课程，稳步缩小差距`)
  }

  if (awards.filter((a) => a.type === 'competition').length === 0) {
    tips.push('从校级竞赛起步积累实践经验，逐步挑战更高级别赛事')
  }

  if (awards.filter((a) => a.type === 'research' || a.type === 'innovation').length === 0) {
    tips.push('主动联系导师参与课题研究，尝试撰写论文积累科研产出')
  }

  if (tips.length === 0) return '保持当前投入节奏，向目标分稳步推进'
  return tips.slice(0, 2).join('；')
}

/**
 * 将 CareerAnalysis 格式化为 RichContent（供 AI 聊天界面渲染富文本）
 * 同时提示用户分析已同步至职业规划页
 */
export function analysisToRichBlocks(analysis: CareerAnalysis): {
  greeting: string
  materials: string[]
  blocks: RichBlock[]
} {
  return {
    greeting: analysis.greeting,
    materials: analysis.materials ?? [],
    blocks: [
      { type: 'paragraph', text: analysis.summary },
      {
        type: 'list',
        items: analysis.weaknesses.map((w) => ({
          strong: `${w.dimension}（${w.score}分，差 ${w.gap} 分）`,
          text: `${w.weakness}。建议：${w.suggestion}`,
        })),
      },
      {
        type: 'card',
        title: '已同步至职业规划',
        icon: 'success',
        body: '本次分析已写入「个人中心 → 职业规划」短板识别区域，前往该页面可查看完整建议与进度条。',
        highlights: ['职业规划'],
      },
    ],
  }
}
