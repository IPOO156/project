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
  // 撤回失败必须上抛：调用方只有拿到成功结果才能把本地状态改为「已撤回」，
  // 否则接口失败仍显示已撤回，刷新后记录又变回草稿，属于伪成功。
  await withdrawActivity(Number(id), category)
}
