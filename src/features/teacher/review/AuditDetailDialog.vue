<script setup lang="ts">
import type {
  AuditEvidenceFile,
  AuditPendingDetail,
  AuditPendingQuery,
  AuditRejectTemplate,
} from '@/shared/types/teacher'
import { ElMessage } from 'element-plus'
import { Check } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import {
  approveAuditTask,
  getAuditPendingDetail,
  getAuditRejectTemplates,
  rejectAuditTask,
} from '@/shared/api/teacher-api'
import AuditDetailActions from './AuditDetailActions.vue'
import AuditDetailMaterials from './AuditDetailMaterials.vue'
import AuditDetailSummary from './AuditDetailSummary.vue'

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
        <AuditDetailSummary :detail="detail" />
        <AuditDetailMaterials :detail="detail" @preview="previewFile" />
      </template>
      <el-empty v-else-if="!loading" description="未加载到详情" />
    </div>

    <template #footer>
      <AuditDetailActions
        :can-prev="canPrev"
        :can-next="canNext"
        :has-detail="!!detail"
        :op-loading="opLoading"
        @prev="goPrev"
        @next="goNext"
        @reject="openReject"
        @approve="handleApprove"
      />
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
          class="u-w-full"
          placeholder="选择常用退回原因模板"
          clearable
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
