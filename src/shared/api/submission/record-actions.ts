import type { ActivityType } from '../activities'
import { withdrawActivity } from '../activities'

/**
 * 撤回提交记录
 * 数据源：PUT /activities/{id}/withdraw?type=（6.5 撤销动态记录）。
 * @param id 记录 ID
 * @param category 活动分类（archive|award|career_plan），由调用方从记录类型推导传入。
 */
export async function withdrawSubmission(
  id: string,
  category: ActivityType = 'archive',
): Promise<void> {
  try {
    await withdrawActivity(Number(id), category)
  } catch {
    // 撤回失败：本地状态由 store 兜底更新，不阻断交互
  }
}
