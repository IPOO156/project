import type { LoadingTip } from '@/shared/constants/loadingTips'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/app/stores/stores'
import { useTeacherAuthz } from '@/shared/composables/useTeacherAuthz'
import {
  pickLoadingTip,
  resolveGradeStage,
  resolveLoadingTipCategories,
} from '@/shared/constants/loadingTips'

type LoadingRole = 'student' | 'teacher' | 'admin'

/** 加载主文案：按身份轮换，只说系统正在做的事（档案 / 申报 / 审核 / 权限） */
const LOADING_MESSAGES: Record<LoadingRole, readonly string[]> = {
  student: [
    '正在校验申报材料…',
    '正在读取你的档案…',
    '正在整理成长记录…',
    '正在同步本学期的审核结果…',
    '正在汇总申报进度…',
  ],
  teacher: [
    '正在汇总待审核任务…',
    '正在加载学生申报材料…',
    '正在同步院系审核范围…',
    '正在统计今日审核进度…',
  ],
  admin: [
    '正在加载账号与权限…',
    '正在校验角色配置…',
    '正在同步治理总览数据…',
    '正在读取操作审计日志…',
  ],
}

/** 温馨提示：单行、可执行，只讲手边能做的事，不写鸡汤 */
const LOADING_HINTS: Record<LoadingRole, readonly string[]> = {
  student: [
    '申报材料会自动保存草稿，刷新不会丢失。',
    '退回原因在「消息中心 → 报名记录」里能看到。',
    '审核通过的记录会自动汇入成长时间轴。',
  ],
  teacher: [
    '待审任务按提交时间排序，先处理等待最久的。',
    '退回时写清原因，学生能在消息中心直接看到。',
    '批量审核前建议先按申报类别核对。',
  ],
  admin: [
    '角色变更需二次确认，误操作可在审计日志追溯。',
    '导出账号数据前先确认数据范围。',
    '权限调整即时生效，无需通知用户重新登录。',
  ],
}

/**
 * 加载页文案：按当前路由/角色挑学习建议（沿用原口径），
 * 并为加载遮罩提供按身份轮换的主文案与单行提示。
 */
export function useLoadingTip() {
  const route = useRoute()
  const userStore = useUserStore()
  const { isAdmin } = useTeacherAuthz()

  const categories = computed(() =>
    resolveLoadingTipCategories(route.path, Boolean(route.meta?.teacher)),
  )
  // /profile/info 加载后会把学籍年级同步进 userStore；未识别时返回 null，只取通用建议
  const stage = computed(() => resolveGradeStage(userStore.userInfo?.grade))
  const tip = ref<LoadingTip>(pickLoadingTip(categories.value, { stage: stage.value }))

  /** 身份优先按角色判定：管理员 → 教师 → 学生 */
  const role = computed<LoadingRole>(() => {
    if (isAdmin.value) return 'admin'
    return userStore.isTeacher ? 'teacher' : 'student'
  })

  // 每次出现加载页递增一次，主文案与提示同步换条；随机起点避免每个会话都从第一条开始
  const cursor = ref(Math.floor(Math.random() * 1000))

  const message = computed(() => {
    const pool = LOADING_MESSAGES[role.value]
    return pool[cursor.value % pool.length]
  })

  const hint = computed(() => {
    const pool = LOADING_HINTS[role.value]
    return pool[cursor.value % pool.length]
  })

  /** 重新抽取一条学习建议（排除当前这条），并推进加载主文案/提示 */
  function refresh(): void {
    tip.value = pickLoadingTip(categories.value, {
      stage: stage.value,
      excludeId: tip.value.id,
    })
    cursor.value += 1
  }

  return { tip, categories, stage, role, message, hint, refresh }
}
