import type { ApplicationType } from '@/shared/types/types'
import { ElMessage, ElMessageBox } from 'element-plus'
import { duplicateCheck } from '@/shared/api/applications'
import { awardDuplicateCheck } from '@/shared/api/awards'
import {
  activityCategoryOf,
  ARCHIVE_TYPE_ALIASES,
  awardTypeCodeOf,
  deriveRecordTitle,
} from '@/shared/api/submission'
import { APPLICATION_CONTRACTS } from '@/shared/api/submission/contracts'
import { toDateString } from '@/shared/api/submission/payload'
import { asText } from '@/shared/utils/unknown'

/** 查重接口（档案 7.0.1 / 奖项 8.1.2）响应的字段并集：两份响应字段名不同，统一归一化读取 */
interface DuplicateCheckResult {
  isDuplicate?: boolean
  hasDuplicate?: boolean
  duplicateRecords?: Array<{ title: string; similarity?: number }>
  similarItems?: Array<{ title: string; similarity?: number }>
  suggestion?: string
}

/**
 * 提交前查重：奖项走 8.1.2，档案走 7.0.1；命中时弹纯文本提示并返回 false。
 * 查重服务异常不阻塞提交，但会告知用户本次未检测。
 */
export async function checkDuplicateBeforeSubmit(
  type: string,
  data: Record<string, unknown>,
): Promise<boolean> {
  try {
    const title = deriveRecordTitle(data)
    // 档案侧查重需要「证书编号 + 获得时间」才有意义：获得时间按该类型的契约映射取表单字段
    // （学科竞赛 awardDate、奖学金 acquireDate、证书 certDate……），不能只读 acquisitionDate。
    const obtainedFrontKey = Object.entries(APPLICATION_CONTRACTS[type]?.mapping ?? {}).find(
      ([backendKey]) => backendKey === 'obtainedTime',
    )?.[1]
    const obtainedTime = toDateString(
      (obtainedFrontKey ? data[obtainedFrontKey] : undefined) ?? data.acquisitionDate,
    )
    const certNumber = data.certNumber == null ? undefined : asText(data.certNumber)
    // 奖项报名走 8.1.2 POST /awards/duplicate-check；档案申报走 POST /applications/duplicate-check
    const r: DuplicateCheckResult =
      activityCategoryOf(type as ApplicationType) === 'award'
        ? await awardDuplicateCheck({
            // 后端按 award_type 枚举码严格相等匹配（competition_star / innovation_star / research_star）
            awardType: awardTypeCodeOf(type),
            certificateNo: certNumber,
            title,
            // 月份选择器原值是 YYYY-MM，契约要求 YYYY-MM-DD：统一补全为当月 01 日（报告 #9）
            participatedTime: toDateString(
              data.competitionDate ||
                data.approveDate ||
                data.publishDate ||
                data.registerDate ||
                undefined,
            ),
          })
        : await duplicateCheck({
            archiveType: ARCHIVE_TYPE_ALIASES[type]?.[0] ?? type,
            // 后端 DuplicateCheckRequest 为 { archiveType, fields: Map }，检测字段取自
            // duplicate_detection_rules.detect_fields，需放在 fields 内；平铺字段会被忽略。
            fields: {
              ...(data.certNumber ? { certificateNo: asText(data.certNumber) } : {}),
              ...(obtainedTime ? { obtainedTime } : {}),
              title,
            },
          })
    // 奖项(8.x)返回 isDuplicate/duplicateRecords；档案(7.0.1)实测返回 hasDuplicate/similarItems/suggestion，统一归一化读取
    const hasDuplicate = r?.isDuplicate ?? r?.hasDuplicate
    const duplicateList = r?.duplicateRecords ?? r?.similarItems ?? []
    if (hasDuplicate) {
      // title/suggestion 均为后端/用户输入，禁止拼进 HTML：改用纯文本弹窗，
      // 由文本节点自动转义，避免 dangerouslyUseHTMLString 引入 XSS。
      const items = duplicateList
        .map((d) => {
          // 后端 similarity 为 0-1 小数（文档示例 0.92），展示时换算成百分比（报告 #10）
          const percent =
            d.similarity == null
              ? null
              : d.similarity <= 1
                ? Math.round(d.similarity * 100)
                : Math.round(d.similarity)
          return `${d.title}${percent != null ? `（相似度 ${percent}%）` : ''}`
        })
        .join('；')
      const suggestion = r?.suggestion ? `。建议：${r.suggestion}` : ''
      const content = `${items || '检测到可能重复的申报记录'}${suggestion}`
      ElMessageBox.alert(content, '检测到重复申报', {
        confirmButtonText: '知道了',
        type: 'warning',
      }).catch(() => {})
      return false
    }
    return true
  } catch {
    // 查重服务失败不阻塞提交，但需明确告知用户本次未执行重复检测
    ElMessage.warning('查重服务暂不可用，本次未执行重复检测')
    return true
  }
}
