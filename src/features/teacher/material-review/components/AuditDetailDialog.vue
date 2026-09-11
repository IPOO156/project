<script setup lang="ts">
import type {
  AuditEvidenceFile,
  AuditPendingDetail,
  AuditPendingQuery,
  AuditRejectTemplate,
} from '@/shared/types/teacher'
import { ElMessage } from 'element-plus'
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  ImageIcon,
  XCircle,
} from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import {
  approveAuditTask,
  getAuditPendingDetail,
  getAuditRejectTemplates,
  rejectAuditTask,
} from '@/shared/api/teacher'
import { AUDIT_ACTIONS, AUDIT_DETAIL_LABELS } from '@/shared/constants/dict'
import { formatDateTime } from '@/shared/utils/time'

const props = defineProps<{
  modelValue: boolean
  taskId: number | null
  query?: AuditPendingQuery
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'processed'): void
  (e: 'openTask', taskId: number): void
}>()

const loading = ref(false)
const detail = ref<AuditPendingDetail | null>(null)
const opLoading = ref(false)

// ── 预览 ──
const previewVisible = ref(false)
const previewUrl = ref('')
const previewName = ref('')

// ── 退回弹窗 ──
const rejectVisible = ref(false)
const rejectComment = ref('')
const rejectTemplate = ref('')
const rejectTemplates = ref<AuditRejectTemplate[]>([])
const rejectSaving = ref(false)

async function fetchDetail() {
  if (props.taskId == null) return
  loading.value = true
  detail.value = null
  try {
    detail.value = await getAuditPendingDetail(props.taskId, props.query)
  } catch {
    // 拦截器已统一提示；此处保留弹窗以便重试
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.modelValue, props.taskId] as const,
  ([visible, taskId]) => {
    if (visible && taskId != null) {
      void fetchDetail()
    }
  },
  { immediate: true },
)

/** 关闭弹窗 */
function handleClose() {
  rejectVisible.value = false
  emit('update:modelValue', false)
}

/** 填报内容/基础信息字段展开 */
function detailEntries(): { key: string; label: string; value: unknown }[] {
  const map = detail.value?.detail ?? {}
  const skip = new Set(['id', 'status', 'semesterId', 'submitTime', 'applicantId'])
  return Object.entries(map)
    .filter(([k]) => !skip.has(k) && !isInBaseInfo(k))
    .map(([k, v]) => ({ key: k, label: fieldLabel(k), value: v }))
}

function isInBaseInfo(key: string): boolean {
  const base = detail.value?.baseInfo
  return base != null && key in base
}

function baseInfoEntries(): { label: string; value: string }[] {
  const b = detail.value?.baseInfo
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

function displayValue(value: unknown): string {
  if (value == null || value === '') return '-'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function formatTime(value: string | null | undefined, withSeconds = false): string {
  return formatDateTime(value, withSeconds)
}

function isImage(name: string | undefined): boolean {
  return /\.(?:jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(name ?? '')
}

function previewFile(file: AuditEvidenceFile) {
  previewUrl.value = file.previewUrl || file.fileUrl
  previewName.value = file.fileName
  previewVisible.value = true
}

// ── 审核通过 ──
async function handleApprove() {
  if (!detail.value) return
  opLoading.value = true
  try {
    await approveAuditTask(detail.value.taskId, {})
    ElMessage.success('已审核通过')
    handleClose()
    emit('processed')
  } catch {
    /* 拦截器已提示 */
  } finally {
    opLoading.value = false
  }
}

// ── 审核退回 ──
function openReject() {
  if (!detail.value) return
  rejectVisible.value = true
  rejectComment.value = ''
  rejectTemplate.value = ''
  if (rejectTemplates.value.length === 0) {
    void getAuditRejectTemplates()
      .then((list) => {
        rejectTemplates.value = list ?? []
      })
      .catch(() => undefined)
  }
}

async function handleReject() {
  const comment = rejectComment.value.trim()
  if (!comment) {
    ElMessage.warning('请填写退回原因')
    return
  }
  if (!detail.value) return
  rejectSaving.value = true
  try {
    await rejectAuditTask(detail.value.taskId, {
      comment,
      templateCode: rejectTemplate.value || undefined,
    })
    ElMessage.success('已退回，学生将收到修改通知')
    rejectVisible.value = false
    handleClose()
    emit('processed')
  } catch {
    /* 拦截器已提示 */
  } finally {
    rejectSaving.value = false
  }
}

function useTemplate(code: string) {
  rejectTemplate.value = code
  const tpl = rejectTemplates.value.find((t) => t.templateCode === code)
  if (tpl) {
    rejectComment.value = tpl.templateContent
  }
}

// ── 上一条 / 下一条 ──
const canPrev = computed(() => detail.value?.cursor?.prevTaskId != null)
const canNext = computed(() => detail.value?.cursor?.nextTaskId != null)
function goPrev() {
  const id = detail.value?.cursor?.prevTaskId
  if (id != null) emit('openTask', id)
}
function goNext() {
  const id = detail.value?.cursor?.nextTaskId
  if (id != null) emit('openTask', id)
}

const actionTag = (action: number) => AUDIT_ACTIONS[action]?.tag ?? 'info'
const actionLabel = (action: number) => AUDIT_ACTIONS[action]?.label ?? String(action)

/** 学期展示：取自基础信息的 semesterName */
function semesterDisplay(): string {
  return detail.value?.baseInfo?.semesterName ?? ''
}

function updateVisible(value: boolean) {
  if (!value) {
    rejectVisible.value = false
    previewVisible.value = false
  }
  emit('update:modelValue', value)
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="审核详情"
    width="760px"
    top="6vh"
    :close-on-click-modal="false"
    :destroy-on-close="false"
    class="audit-detail"
    @update:model-value="updateVisible"
  >
    <div v-loading="loading" class="audit-detail__wrap">
      <template v-if="detail">
        <!-- 顶部摘要 -->
        <div class="audit-detail__summary">
          <div class="audit-detail__summary-head">
            <span class="audit-detail__type-tag">{{ detail.archiveType || detail.type }}</span>
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
              {{
                detail.approvalHistory?.length ? `${detail.approvalHistory.length} 步` : '待审批'
              }}
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
            <el-descriptions-item
              v-for="item in baseInfoEntries()"
              :key="item.label"
              :label="item.label"
            >
              {{ item.value }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 填报内容 -->
        <div v-if="detailEntries().length" class="audit-detail__section">
          <div class="audit-detail__section-title">填报内容</div>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item
              v-for="item in detailEntries()"
              :key="item.key"
              :label="item.label"
            >
              {{ displayValue(item.value) }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 佐证材料 -->
        <div class="audit-detail__section">
          <div class="audit-detail__section-title">佐证材料</div>
          <div v-if="detail.evidenceFiles?.length" class="audit-detail__files">
            <div
              v-for="file in detail.evidenceFiles"
              :key="file.fileId"
              class="audit-detail__file"
              @click="previewFile(file)"
            >
              <component
                :is="isImage(file.fileName) ? ImageIcon : FileText"
                :size="22"
                class="audit-detail__file-icon"
              />
              <span class="audit-detail__file-name">{{ file.fileName }}</span>
              <ExternalLink :size="14" class="audit-detail__file-link" />
            </div>
          </div>
          <div v-else class="audit-detail__no-file">暂无佐证材料</div>
        </div>

        <!-- 审批历史 -->
        <div v-if="detail.approvalHistory?.length" class="audit-detail__section">
          <div class="audit-detail__section-title">审批历史</div>
          <el-timeline class="audit-detail__timeline">
            <el-timeline-item
              v-for="node in detail.approvalHistory"
              :key="node.nodeId"
              :timestamp="formatTime(node.createdAt)"
              placement="top"
            >
              <div class="audit-detail__node">
                <el-tag :type="actionTag(node.action)" size="small" effect="light">
                  {{ actionLabel(node.action) }}
                </el-tag>
                <span class="audit-detail__node-step">{{ node.stepName }}</span>
                <span class="audit-detail__node-auditor">{{ node.auditorName }}</span>
              </div>
              <div v-if="node.comment" class="audit-detail__node-comment">{{ node.comment }}</div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </template>
      <el-empty v-else-if="!loading" description="未加载到详情" />
    </div>

    <template #footer>
      <div class="audit-detail__footer">
        <div class="audit-detail__nav">
          <el-button size="small" :disabled="!canPrev" :icon="ChevronLeft" @click="goPrev">
            上一条
          </el-button>
          <el-button size="small" :disabled="!canNext" @click="goNext">
            下一条<el-icon class="el-icon--right"><ChevronRight :size="14" /></el-icon>
          </el-button>
        </div>
        <div class="audit-detail__actions">
          <el-button
            v-if="detail"
            type="danger"
            :icon="XCircle"
            :loading="opLoading"
            @click="openReject"
          >
            退回
          </el-button>
          <el-button
            v-if="detail"
            type="primary"
            :icon="CheckCircle2"
            :loading="opLoading"
            @click="handleApprove"
          >
            通过
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>

  <!-- 文件预览 -->
  <el-dialog v-model="previewVisible" :title="previewName" width="720px" top="6vh">
    <div class="audit-detail__preview">
      <img v-if="isImage(previewName)" :src="previewUrl" alt="佐证材料预览" />
      <iframe v-else :src="previewUrl" />
    </div>
    <template #footer>
      <el-button type="primary" @click="previewVisible = false">关闭</el-button>
    </template>
  </el-dialog>

  <!-- 退回原因 -->
  <el-dialog v-model="rejectVisible" title="退回原因" width="460px" append-to-body>
    <el-form label-position="top">
      <el-form-item label="选择常用模板">
        <el-select
          v-model="rejectTemplate"
          placeholder="选择常用退回原因模板"
          clearable
          style="width: 100%"
          @change="useTemplate"
        >
          <el-option
            v-for="tpl in rejectTemplates"
            :key="tpl.templateCode"
            :label="tpl.templateContent"
            :value="tpl.templateCode"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="退回原因" required>
        <el-input
          v-model="rejectComment"
          type="textarea"
          :rows="3"
          maxlength="200"
          show-word-limit
          placeholder="请填写退回原因，学生将据此修改后重新提交"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="rejectVisible = false">取消</el-button>
      <el-button type="danger" :icon="Check" :loading="rejectSaving" @click="handleReject">
        确认退回
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.audit-detail {
  &__wrap {
    min-height: 240px;
    max-height: 68vh;
    overflow-y: auto;
    padding-right: 4px;
  }

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

  &__files {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
  }

  &__file {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 220px;
    padding: 6px 12px;
    border: 1px solid var(--el-border-color-light);
    border-radius: $radius-base;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: $color-accent;
      background: $color-primary-lightest;
    }

    &-icon {
      flex-shrink: 0;
      color: $color-primary-lighter;
    }

    &-name {
      font-size: 13px;
      color: $color-text-primary;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &-link {
      flex-shrink: 0;
      color: var(--el-text-color-secondary);
    }
  }

  &__no-file {
    padding: $spacing-lg;
    text-align: center;
    color: var(--el-text-color-secondary);
    font-size: $font-size-base;
    background: var(--el-fill-color-light);
    border-radius: $radius-base;
  }

  &__node {
    display: flex;
    align-items: center;
    gap: $spacing-sm;

    &-step {
      font-weight: 600;
      color: $color-text-primary;
      font-size: 13px;
    }

    &-auditor {
      color: var(--el-text-color-secondary);
      font-size: 12px;
    }
  }

  &__node-comment {
    margin-top: 4px;
    font-size: 13px;
    color: var(--el-text-color-regular);
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  &__nav,
  &__actions {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__preview {
    display: flex;
    justify-content: center;
    background: #f5f5f5;
    border-radius: $radius-base;
    overflow: hidden;
    min-height: 60vh;
    max-height: 76vh;

    img {
      max-width: 100%;
      object-fit: contain;
    }

    iframe {
      width: 100%;
      min-height: 60vh;
      border: none;
    }
  }
}

:deep(.el-dialog__body) {
  padding-top: $spacing-sm;
}
</style>
