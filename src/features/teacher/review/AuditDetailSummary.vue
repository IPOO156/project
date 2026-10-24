<script setup lang="ts">
import type { AuditPendingDetail } from '@/shared/types/teacher'
import {
  APPLICATION_TYPE_MAP,
  AUDIT_DETAIL_LABELS,
  AWARD_LEVELS,
  CERTIFICATE_TYPES,
  COMPETITION_TYPES,
  INDUSTRY_TYPES,
  ORGANIZATION_LEVELS,
  PROJECT_LEVELS,
  RESEARCH_TYPES,
  ROLE_OPTIONS,
  SCHOLARSHIP_GRADES,
  SCHOLARSHIP_LEVELS,
} from '@/shared/constants/dict'

const props = defineProps<{ detail: AuditPendingDetail }>()

/** 填报内容字段 → 枚举字典（用于 displayValue 翻译原始枚举码） */
const DETAIL_ENUM_MAP: Record<string, readonly { label: string; value: string }[]> = {
  competitionType: COMPETITION_TYPES,
  awardLevel: AWARD_LEVELS,
  projectLevel: PROJECT_LEVELS,
  participantRole: ROLE_OPTIONS,
  scholarshipGrade: SCHOLARSHIP_GRADES,
  scholarshipLevel: SCHOLARSHIP_LEVELS,
  researchType: RESEARCH_TYPES,
  projectType: RESEARCH_TYPES,
  certType: CERTIFICATE_TYPES,
  organizationLevel: ORGANIZATION_LEVELS,
  industryType: INDUSTRY_TYPES,
  companyType: [
    { label: '创业实践', value: '创业实践' },
    { label: '创业计划', value: '创业计划' },
    { label: '实体注册', value: '实体注册' },
    { label: '其他', value: '其他' },
  ],
}

/** 填报内容/基础信息字段展开 */
function detailEntries(): { key: string; label: string; value: unknown }[] {
  const map = props.detail?.detail ?? {}
  const skip = new Set(['id', 'status', 'semesterId', 'submitTime', 'applicantId'])
  return Object.entries(map)
    .filter(([k, v]) => {
      if (skip.has(k)) return false
      if (isInBaseInfo(k)) return false
      // 跳过后端返回的空 Label 字段（如 competitionTypeLabel=null），避免前端 fallback 到原始 key
      if (k.endsWith('Label') && (v == null || v === '')) return false
      return true
    })
    .map(([k, v]) => ({ key: k, label: fieldLabel(k), value: v }))
}

function isInBaseInfo(key: string): boolean {
  const base = props.detail?.baseInfo
  return base != null && key in base
}

function baseInfoEntries(): { label: string; value: string }[] {
  const b = props.detail?.baseInfo
  if (!b) return []
  const entries: [string, string | null][] = [
    ['semesterName', b.semesterName],
    ['obtainTime', b.obtainTime],
    ['certificateNo', b.certificateNo],
    ['issuingUnit', b.issuingUnit],
    ['validUntil', b.validUntil],
    ['participantRoleLabel', b.participantRoleLabel],
  ]
  return entries.filter(([, v]) => v).map(([k, v]) => ({ label: fieldLabel(k), value: v ?? '-' }))
}

function fieldLabel(key: string): string {
  return AUDIT_DETAIL_LABELS[key] ?? key
}

/**
 * 枚举码 → 中文标签：优先查 DETAIL_ENUM_MAP，再查 APPLICATION_TYPE_MAP
 * 支持：字符串枚举（national）、数字索引枚举（1/2/3）、以及后端复合 key（academic_competition → competition）
 */
function translateEnum(key: string, val: unknown): string | null {
  if (val == null || val === '') return null
  const strVal = String(val)
  const numVal = Number(val)

  // 1) 先查 DETAIL_ENUM_MAP 中的字典（按字符串或数字索引都支持）
  const dict = DETAIL_ENUM_MAP[key]
  if (dict) {
    // 字符串匹配
    const found = dict.find((o) => String(o.value) === strVal || o.label === strVal)
    if (found) return found.label
    // 数字索引兜底（后端返回 1/2/3 而字典 value 是 national/provincial 时）
    if (!Number.isNaN(numVal) && numVal >= 1 && numVal <= dict.length) {
      const indexed = dict[numVal - 1]
      if (indexed && String(indexed.value) !== strVal) return indexed.label
    }
  }

  // 2) 再查 APPLICATION_TYPE_MAP —— 包含后端复合 key（academic_competition → 学科竞赛）
  const appTypeKeyMap: Record<string, string> = {
    academic_competition: 'competition',
    academic_research: 'research',
    innovation_entrepreneurship: 'innovation',
    social_practice: 'socialPractice',
    honor_certificate: 'certificate',
    training_project: 'training',
    // 直接 key 也能命中
    competition: 'competition',
    innovation: 'innovation',
    research: 'research',
    scholarship: 'scholarship',
    certificate: 'certificate',
    internship: 'internship',
    organization: 'organization',
    training: 'training',
  }
  const mappedKey = appTypeKeyMap[strVal] ?? strVal
  const appType = APPLICATION_TYPE_MAP[mappedKey] ?? APPLICATION_TYPE_MAP[strVal]
  if (appType) return appType

  return null
}

function displayValue(key: string, value: unknown): string {
  if (value == null || value === '') return '-'
  if (typeof value === 'object') return JSON.stringify(value)
  // 枚举翻译优先于原始值
  const translated = translateEnum(key, value)
  if (translated) return translated
  return String(value)
}

/** 学期展示：取自基础信息的 semesterName */
function semesterDisplay(): string {
  return props.detail?.baseInfo?.semesterName ?? ''
}
</script>

<template>
  <!-- 顶部摘要 -->
  <div class="audit-detail__summary">
    <div class="audit-detail__summary-head">
      <span class="audit-detail__type-tag">{{
        translateEnum('archiveType', detail.archiveType || detail.type) ||
        detail.archiveType ||
        detail.type
      }}</span>
      <h3 class="audit-detail__title">{{ detail.title }}</h3>
    </div>
    <el-descriptions :column="2" size="small" border class="audit-detail__desc">
      <el-descriptions-item label="申请人">
        {{ detail.applicant?.name ?? '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="学号">
        {{ detail.applicant?.studentNo ?? '-' }}
      </el-descriptions-item>
      <el-descriptions-item v-if="detail.applicant?.className" label="班级">
        {{ detail.applicant?.className }}
      </el-descriptions-item>
      <el-descriptions-item v-if="detail.applicant?.majorName" label="专业">
        {{ detail.applicant?.majorName }}
      </el-descriptions-item>
      <el-descriptions-item v-if="semesterDisplay()" label="学期">
        {{ semesterDisplay() }}
      </el-descriptions-item>
      <el-descriptions-item label="当前环节">
        {{ detail.approvalHistory?.length ? `${detail.approvalHistory.length} 步` : '待审批' }}
      </el-descriptions-item>
    </el-descriptions>
    <el-tag
      v-if="detail.duplicateInfo?.isDuplicate"
      type="danger"
      effect="light"
      size="small"
      class="audit-detail__dup"
    >
      检测到疑似重复申报，请重点核对
    </el-tag>
  </div>

  <!-- 申报基础信息 -->
  <div v-if="baseInfoEntries().length" class="audit-detail__section">
    <div class="audit-detail__section-title">申报基础信息</div>
    <el-descriptions :column="2" border size="small">
      <el-descriptions-item v-for="item in baseInfoEntries()" :key="item.label" :label="item.label">
        {{ item.value }}
      </el-descriptions-item>
    </el-descriptions>
  </div>

  <!-- 填报内容 -->
  <div v-if="detailEntries().length" class="audit-detail__section">
    <div class="audit-detail__section-title">填报内容</div>
    <el-descriptions :column="2" border size="small">
      <el-descriptions-item v-for="item in detailEntries()" :key="item.key" :label="item.label">
        {{ displayValue(item.key, item.value) }}
      </el-descriptions-item>
    </el-descriptions>
  </div>
</template>

<style scoped lang="scss">
.audit-detail {
  &__summary {
    &-head {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      margin-bottom: $spacing-md;
    }
    &-desc {
      margin-bottom: $spacing-sm;
    }
  }

  &__type-tag {
    flex-shrink: 0;
    padding: 2px 10px;
    border-radius: $radius-lg;
    background: $color-primary-lightest;
    color: $color-primary;
    font-size: 12px;
    font-weight: 600;
  }

  &__title {
    font-size: 16px;
    color: $color-text-primary;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__dup {
    margin-top: $spacing-sm;
  }

  &__section {
    margin-top: $spacing-lg;
    &-title {
      font-size: $font-size-base;
      font-weight: 600;
      color: $color-text-primary;
      margin-bottom: $spacing-sm;
      padding-left: 8px;
      border-left: 3px solid $color-accent;
    }
  }
}
</style>
