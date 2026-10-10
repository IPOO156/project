/**
 * 评分聚合口径 —— 综合评分（加权总分）的唯一计算入口。
 *
 * 背景（2026-09-28 巡检）：同一份维度数据在项目里有 3 处**逐字重复**的聚合实现
 * （ProfileInfo.vue 的 dimAvg、DimensionPanel.vue 的 avgScore、ResumeTemplate.vue 的 dimAvg），
 * 且其算法为 `round(Σ原始分 / 维度数)` —— 把满分各不相同的维度（如 50/30/20）当同量纲求平均，
 * 得不出有意义的分值（李四：学业 20/50、竞赛 10/30、综合 0/20 → 该算法得 10 分）。
 *
 * 现统一为本文件的 calcAggregateScore，口径为「加权总分（百分制）」：
 *
 *     Σ得分 / Σ满分 × 100
 *
 * 为什么这是对的（2026-09-28 用 /profile/scores/{id}/details 的**指标级**权重实证）：
 * 后端指标级 weight 之和为 1、rawScore 为 0-100，维度得分 = Σ(weight × rawScore)；
 * 于是维度满分 targetScore = Σ(该维度指标权重) × 100 —— 实测 学业/竞赛/综合 为
 * 0.5/0.3/0.2 → 50/30/20，Σ = 100，与接口返回的 targetScore 完全吻合。
 * 因此「得分」已是乘过权重的结果，`Σ得分` 即以 100 为满分的加权总分，
 * 上式同时等价于 `Σ(维度得分率 × 维度权重) × 100`，两个口径给出同一个数（李四 = 30）。
 *
 * ⚠️ 口径结论已由数据自洽验证，仍建议后端书面确认后写入接口文档；
 * 若口径变动，**只改本文件**即可，三处调用方无需改动。
 */

/** 参与聚合的单个维度（字段名兼容 /profile/info 与 /home/dashboard 两种响应） */
export interface AggregateScoreDimension {
  /** 该维度得分 */
  score: number
  /** 该维度满分；0 或缺失表示后端未给出，该维度不参与聚合 */
  maxScore: number
}

/**
 * 计算综合评分（加权总分，百分制，四舍五入取整）。
 *
 * 返回 `null`（而非 0）表示**无法计算** —— 无维度数据，或所有维度满分均缺失。
 * 调用方须据此显示占位符：显示 0 会让学生误读为「本次得分就是 0 分」，
 * 而实际含义是「尚无计算结果」。
 */
export function calcAggregateScore(dimensions: AggregateScoreDimension[]): number | null {
  // 满分为 0/缺失的维度不参与聚合：它既不能提供得分率，也会把 Σ满分 拉小导致结果虚高
  const valid = dimensions.filter((d) => d.maxScore > 0)
  if (valid.length === 0) return null

  const totalScore = valid.reduce((sum, d) => sum + d.score, 0)
  const totalMaxScore = valid.reduce((sum, d) => sum + d.maxScore, 0)

  return Math.round((totalScore / totalMaxScore) * 100)
}
