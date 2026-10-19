import { clearUserScopedStorage } from '@/shared/utils/session'
import { useActivityStore } from './activity'
import { useArchiveStore } from './archive'
import { useAwardReviewStore } from './award-review'
import { useCareerPlanStore } from './career-plan'
import { useHomeStore } from './home'
import { useNotificationStore } from './notification'
import { useReviewStore } from './review'
import { useSubmissionStore } from './submission'
import { useTabsStore } from './tabs'
import { useTeacherMessageStore } from './teacherMessage'

/**
 * 重置全部「用户级」业务 store 与用户级本地存储（登出时调用）。
 *
 * 为何必须集中重置而不能只清 token：
 *  1. 业务 store 均为 setup 写法 `defineStore('x', () => {...})`，Pinia 的 `$reset` 对其无效；
 *  2. 多数 store 在模块作用域持有 `pendingFetch` / `lastFetchedAt` 等请求缓存变量与
 *     60s TTL，只清 state 不够——换账号登录后 TTL 窗口内仍会命中上一账号的缓存数据，
 *     因此各 store 的 `reset()` 必须同时复位其模块级缓存变量。
 *
 * 注意：本模块**不得** import `./user`（user.ts 会反向 import 本模块，形成循环依赖）。
 * 循环链 `user.ts → sessionReset.ts → archive.ts → user.ts` 是允许的：
 * 相关引用均发生在函数体内、运行时才取值，不会触发「Cannot access before initialization」。
 */
export function resetUserScopedStores(): void {
  useArchiveStore().reset()
  useNotificationStore().reset()
  useActivityStore().reset()
  useSubmissionStore().reset()
  useCareerPlanStore().reset()
  useReviewStore().reset()
  useHomeStore().reset()
  useTeacherMessageStore().reset()
  useAwardReviewStore().reset()

  // tabsStore 必须延迟获取：避免 store 初始化时 tabs store 未注册
  try {
    useTabsStore().clearAll()
  } catch {
    // tabs store 未注册（极少数场景）—— 静默降级
  }

  // 用户级 localStorage（身份缓存 / 头像 / 教师身份 / 撤回标记 / 表单草稿）
  clearUserScopedStorage()
}
