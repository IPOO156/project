<script setup lang="ts">
import { computed } from 'vue'
import {
  APPLICATION_STATUS,
  AWARD_LEVELS,
  CERTIFICATE_TYPES,
  COMPETITION_LEVELS,
  COMPETITION_TYPE_DISPLAY_OPTIONS,
  INDUSTRY_TYPE_DISPLAY_OPTIONS,
  ORGANIZATION_LEVEL_DISPLAY_OPTIONS,
  PROJECT_LEVELS,
  PROJECT_TYPE_DISPLAY_OPTIONS,
  RESEARCH_TYPE_DISPLAY_OPTIONS,
  ROLE_OPTIONS,
  SCHOLARSHIP_GRADES,
  SCHOLARSHIP_LEVEL_DISPLAY_OPTIONS,
} from '@/shared/constants/dict'
import { FIELD_LABELS } from '@/shared/constants/fieldLabels'

/**
 * RecordDetailDialog - 申报/奖项记录「查看」详情弹窗
 *
 * 仅展示记录中**用户填写的关键字段**：
 *  - 白名单 FIELD_LABELS 过滤：id、后端内部下划线字段（archive_type/submit_time/can_edit 等）、
 *    canXxx 标志等无用信息一律不展示；
 *  - 字段名统一中文标签，按白名单定义顺序排列；
 *  - 空值 / 空数组字段自动隐藏（只显示已填写的信息）；
 *  - status 经 APPLICATION_STATUS 字典转中文（草稿/待审核/已驳回/已通过/已撤销）；
 *  - 数组字段（如 proofMaterials 证明材料）以「、」分隔，对象字段 JSON 序列化。
 */
/** 详情记录：业务字段由后端动态返回，此处仅约定弹窗内部使用的展示字段 */
interface DetailRecord extends Record<string, unknown> {
  type?: string
  status?: string
  __detailUnavailable?: boolean
  __detailUnavailableText?: string
}

interface Props {
  visible: boolean
  record?: DetailRecord | null
  /** 加载详情数据中的 loading 态（真实后端记录需先拉详情接口） */
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
}>()

/**
 * 枚举字段 → 字典（key 与 FIELD_LABELS 对齐）。
 *
 * 「查看」展示的是后端详情原值（competitionType=academic、awardLevel=special 等），
 * 不翻译会把枚举码直接暴露给学生（2026-11-12 反馈）。字典统一取自 businessDict，
 * 与表单下拉同源；找不到时原样展示，不做猜测。
 */
const ENUM_OPTIONS: Record<string, readonly { label: string; value: string }[]> = {
  competitionType: COMPETITION_TYPE_DISPLAY_OPTIONS,
  competitionLevel: COMPETITION_LEVELS,
  awardLevel: AWARD_LEVELS,
  projectLevel: PROJECT_LEVELS,
  researchType: RESEARCH_TYPE_DISPLAY_OPTIONS,
  organizationLevel: ORGANIZATION_LEVEL_DISPLAY_OPTIONS,
  industryType: INDUSTRY_TYPE_DISPLAY_OPTIONS,
  companyType: PROJECT_TYPE_DISPLAY_OPTIONS,
  scholarshipLevel: SCHOLARSHIP_LEVEL_DISPLAY_OPTIONS,
  scholarshipGrade: SCHOLARSHIP_GRADES,
  certType: CERTIFICATE_TYPES,
  role: ROLE_OPTIONS,
}

function handleClose() {
  emit('update:visible', false)
  emit('close')
}

function isEmpty(v: unknown): boolean {
  if (v === undefined || v === null || v === '') return true
  if (Array.isArray(v) && v.length === 0) return true
  return false
}

/**
 * 证明材料：只展示文件名，不展示上传组件的内部结构（uid/url/status/fileId）。
 * 列表接口可能把附件原样返回为对象数组，历史数据还可能是 JSON 字符串，两种都要兼容。
 */
function formatProofMaterials(val: unknown): string {
  // 兼容三种形态：UploadUserFile 对象数组（前端提交前）、JSON 字符串（历史/列表接口）、普通字符串数组
  let parsedVal = val
  if (typeof parsedVal === 'string') {
    try {
      parsedVal = JSON.parse(parsedVal)
    } catch {
      /* 非 JSON 字符串按原文展示 */
    }
  }
  const rawList = Array.isArray(parsedVal) ? parsedVal : [parsedVal]
  const names = rawList
    .map((item) => {
      let entry = item
      if (typeof entry === 'string') {
        try {
          entry = JSON.parse(entry)
        } catch {
          return entry
        }
      }
      if (entry && typeof entry === 'object') {
        const obj = entry as Record<string, unknown>
        return String(obj.name ?? obj.fileName ?? obj.file_name ?? '')
      }
      return entry == null ? '' : String(entry)
    })
    .filter((name) => name !== '')
  return names.join('、')
}

function formatValue(key: string, val: unknown): string {
  if (key === 'status') {
    return APPLICATION_STATUS[val as keyof typeof APPLICATION_STATUS]?.label ?? String(val)
  }
  // 获奖时间只精确到月份：后端存的是当月 1 日，详情展示不应出现“具体到日”的假精度
  if (key === 'awardDate') return String(val).slice(0, 7)
  if (key === 'proofMaterials') return formatProofMaterials(val)
  if (Array.isArray(val))
    return val.map((i) => (typeof i === 'object' ? JSON.stringify(i) : String(i))).join('、')
  const options = ENUM_OPTIONS[key]
  if (options) {
    const hit = options.find((option) => String(option.value) === String(val))
    if (hit) return hit.label
  }
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

/** location 在实习与实践中含义不同：按记录类型取对应标签（报告 #11） */
const locationLabel = computed(() =>
  props.record?.type === 'internship' ? '实习地点' : '活动地点',
)

/** 仅保留白名单内且非空的用户填写字段，按 FIELD_LABELS 定义顺序展示 */
const displayItems = computed(() => {
  if (!props.record) return []
  const order = Object.fromEntries(Object.keys(FIELD_LABELS).map((k, i) => [k, i]))
  return (
    Object.entries(props.record)
      // title 是后端派生的展示标题，和业务名称（竞赛名称/项目名称等）重复，详情里不再渲染
      .filter(([key, val]) => key !== 'title' && FIELD_LABELS[key] && !isEmpty(val))
      .sort(([a], [b]) => order[a] - order[b])
      .map(([key, val]) => ({
        key,
        label: key === 'location' ? locationLabel.value : FIELD_LABELS[key],
        value: formatValue(key, val),
      }))
  )
})
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="记录详情"
    width="560px"
    @update:model-value="handleClose"
  >
    <el-alert
      v-if="record?.__detailUnavailable"
      :title="record?.__detailUnavailableText || '详情加载失败，以下仅为列表摘要，部分字段可能缺失'"
      type="warning"
      :closable="false"
      show-icon
      class="detail-fallback-alert"
    />
    <template v-if="displayItems.length || loading">
      <el-descriptions v-loading="loading" :column="1" border>
        <el-descriptions-item v-for="item in displayItems" :key="item.key" :label="item.label">
          {{ item.value }}
        </el-descriptions-item>
      </el-descriptions>
    </template>
    <el-empty v-else description="暂无记录详情" :image-size="80" />
    <template #footer><el-button @click="handleClose">关闭</el-button></template>
  </el-dialog>
</template>

<style scoped>
.detail-fallback-alert {
  margin-bottom: 12px;
}
</style>
