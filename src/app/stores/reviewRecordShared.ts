import { ElMessage } from 'element-plus'
import { updateActivity } from '@/shared/api/activities'

/**
 * 申报审核 / 奖项审核两个 Store 的公共逻辑。
 *
 * 两个模块的数据源相同（GET /activities），只是过滤条件与附加字段不同；
 * 此前映射、重新提交、成功提示在三处各写一遍，改一处容易漏另一处。
 */

/** 重新提交成功提示（两个审核模块共用，修改文案只改这里） */
export const RESUBMIT_SUCCESS_MESSAGE = '修改已保存，等待重新审核'

/** /activities 返回记录的最小字段集（后端字段名与前端模型不一致，统一在此容错） */
export interface ActivityLike {
  id: number | string
  type?: string
  typeLabel?: string
  text?: string
  title?: string
  time?: string
  semester?: string
  status?: string
}

/** 动态记录 → 审核记录的公共字段映射 */
export function mapActivityBase(a: ActivityLike) {
  return {
    // 类型声明为 string，且重新提交时按字符串 id 查找，统一转字符串避免类型与查找不一致
    id: String(a.id),
    type: a.type || '',
    typeLabel: a.typeLabel || '',
    title: a.text || a.title || '',
    submitDate: a.time || '',
    semester: a.semester || '',
    status: a.status || 'pending',
  }
}

/** 重新提交后把记录就地更新为 pending（接口失败时不会走到这里） */
export function applyResubmitted<T extends { id: string }>(
  list: T[],
  id: string,
  data: Record<string, any>,
): void {
  const idx = list.findIndex((r) => r.id === id)
  if (idx >= 0) list[idx] = { ...list[idx], ...data, status: 'pending' }
}

/**
 * 重新提交审核记录（对接 PUT /activities/{id}）。
 * 接口失败时错误向上抛出（拦截器已统一提示），禁止本地伪造 pending 状态与假成功提示。
 */
export async function resubmitActivity(
  id: string,
  scope: 'archive' | 'award',
  data: Record<string, any>,
): Promise<void> {
  await updateActivity(Number(id), scope, data)
  ElMessage.success(RESUBMIT_SUCCESS_MESSAGE)
}
