/**
 * 奖项审核 API · 类型定义
 *
 * 真实数据源：GET /activities（动态记录，后端 ActivityController）
 * 所有业务函数已迁移至 activities.ts，本文件仅保留 store 使用的 Filter 类型。
 */
export interface AwardReviewFilters {
  type?: string // competitionStar | innovationStar | scientificStar
}
