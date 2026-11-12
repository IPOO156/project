<script setup lang="ts">
import type { AuditPendingDetail } from '@/shared/types/teacher'
import { computed } from 'vue'
import {
  formatArchiveValue as displayValue,
  archiveFieldLabel as fieldLabel,
  translateArchiveEnum as translateEnum,
} from '@/shared/utils/archiveDetailDisplay'

const props = defineProps<{ detail: AuditPendingDetail }>()

/**
 * 填报内容字段展开。
 *
 * 后端 detail 会同时返回枚举码（competitionType）与其中文标签（competitionTypeLabel），
 * 两者都渲染会出现「竞赛类型：学科类」重复两行，且 Label 字段的 key 不在字典表里时会
 * 直接以 `competitionTypeLabel` 作为行标题（见 2026-11-12 审核详情截图）。
 * 因此成对字段只保留一行：前端有字典能翻译枚举码时丢掉 Label 行；没有字典时丢掉原始码行、
 * 保留后端返回的中文标签。
 */
function detailEntries(): { key: string; label: string; value: unknown }[] {
  const map = props.detail?.detail ?? {}
  const skip = new Set(['id', 'status', 'semesterId', 'submitTime', 'applicantId'])
  return Object.entries(map)
    .filter(([k, v]) => {
      if (skip.has(k)) return false
      if (isInBaseInfo(k)) return false

      if (k.endsWith('Label')) {
        // 空标签没有展示价值，也避免前端 fallback 到原始 key
        if (v == null || v === '') return false
        const baseKey = k.slice(0, -'Label'.length)
        // 原始字段已能由前端字典翻译时，Label 行是重复信息
        return translateEnum(baseKey, map[baseKey]) == null
      }

      // 原始码前端无法翻译、但后端给了中文标签时，交由 *Label 行展示
      const labelValue = map[`${k}Label`]
      if (labelValue != null && labelValue !== '' && translateEnum(k, v) == null) return false
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

/** 学期展示：取自基础信息的 semesterName */
function semesterDisplay(): string {
  return props.detail?.baseInfo?.semesterName ?? ''
}

/**
 * 审批进度。
 *
 * 详情接口只返回审批历史（已完成的节点），不返回当前节点号/名称，
 * 因此不能用 history.length 冒充「当前环节」——否则多级流程走到第 3 级时，
 * 页面上会显示「当前环节 2 步」，让人误以为 2 级通过就已审完（2026-11-12 反馈）。
 * 这里改为只陈述事实：已通过几级、仍在等待后续审核。
 */
const approvedStepCount = computed(
  () => props.detail?.approvalHistory?.filter((item) => item.action === 1).length ?? 0,
)

const progressText = computed(() =>
  approvedStepCount.value > 0 ? `已通过 ${approvedStepCount.value} 级，待后续审核` : '待审批',
)
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
      <el-descriptions-item label="审批进度">
        {{ progressText }}
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
    padding: 4px 8px;
    border-radius: 6px;
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
