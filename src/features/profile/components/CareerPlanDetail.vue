<script setup lang="ts">
import type { TagProps } from 'element-plus'
import { ElMessage } from 'element-plus'
import { computed, ref, watch } from 'vue'
import {
  downloadCareerPlanFile,
  getCareerPlanDetail,
  previewCareerPlanFile,
} from '@/shared/api/career-plan'
import { useDict } from '@/shared/composables/composables'
import { APPLICATION_STATUS, APPLICATION_STATUS_CODE_MAP } from '@/shared/constants/dict'
import CareerPlanActionUpload from './CareerPlanActionUpload.vue'
import CareerPlanDetailHead from './CareerPlanDetailHead.vue'
import CareerPlanEditDialog from './CareerPlanEditDialog.vue'
import CareerPlanGoalList from './CareerPlanGoalList.vue'
import CareerPlanInsights from './CareerPlanInsights.vue'

interface Props {
  visible: boolean
  planId: number | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'refresh'): void
}>()

/** 后端 career_plans.status(0-4) → 前端字典 key */
const STATUS_KEY_MAP = APPLICATION_STATUS_CODE_MAP

const { getColor, getLabel } = useDict(APPLICATION_STATUS)

const loading = ref(false)
const detail = ref<any>(null)

const statusKey = computed(() => STATUS_KEY_MAP[detail.value?.status] ?? 'draft')
const statusType = computed(() => (getColor(statusKey.value) as TagProps['type']) ?? 'info')
const statusLabel = computed(() => detail.value?.statusLabel || getLabel(statusKey.value))
/** 仅草稿(0)或已退回(3)可编辑，已通过等状态只读 */
const isEditable = computed(() => {
  const s = detail.value?.status
  return s === 0 || s === 3
})

async function fetchDetail() {
  if (props.planId == null) return
  loading.value = true
  try {
    detail.value = await getCareerPlanDetail(props.planId)
  } catch (e) {
    // 404 走拦截器静默降级（接口未实现），此处兜底提示；其余错误拦截器已统一提示
    if ((e as { response?: { status?: number } })?.response?.status === 404) {
      ElMessage.error('详情加载失败')
    }
    detail.value = null
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.visible, props.planId],
  ([visible]) => {
    if (visible && props.planId != null) fetchDetail()
  },
)

async function reload() {
  await fetchDetail()
  emit('refresh')
}

/* ===================== 编辑弹窗（目标 / 行动 / 里程碑） ===================== */

const editDialogRef = ref<InstanceType<typeof CareerPlanEditDialog> | null>(null)

function openGoalDialog(goal?: any) {
  editDialogRef.value?.open({ mode: 'goal', goal })
}

function openActionDialog(goal: any, action?: any) {
  editDialogRef.value?.open({ mode: 'action', goal, action })
}

function openMilestoneDialog(action: any, milestone?: any) {
  editDialogRef.value?.open({ mode: 'milestone', action, milestone })
}

/* ===================== 行动成果上传 ===================== */

const uploadDialogVisible = ref(false)
const uploadTarget = ref<{ actionId: number } | null>(null)

function openUploadDialog(action: any) {
  uploadTarget.value = { actionId: action.id }
  uploadDialogVisible.value = true
}

function handleUploadSuccess() {
  uploadDialogVisible.value = false
  reload()
}

/* ===================== 文件下载 / 预览 ===================== */

const fileLoading = ref(false)

async function handleDownload() {
  if (props.planId == null) return
  fileLoading.value = true
  try {
    // downloadCareerPlanFile 声明返回 void，实际响应可携带签名下载链接（downloadUrl）
    const res = (await downloadCareerPlanFile(props.planId, 'internal')) as unknown
    const resObj = typeof res === 'object' && res !== null ? (res as Record<string, unknown>) : null
    const downloadUrl = resObj?.downloadUrl
    if (typeof downloadUrl === 'string') {
      window.open(downloadUrl, '_blank', 'noopener')
    }
  } catch {
    // 接口失败已由请求拦截器统一提示
  } finally {
    fileLoading.value = false
  }
}

async function handlePreview() {
  if (props.planId == null) return
  fileLoading.value = true
  try {
    const res = await previewCareerPlanFile(props.planId, 'internal')
    if (res?.previewUrl) {
      window.open(res.previewUrl, '_blank', 'noopener')
    }
  } catch {
    // 接口失败已由请求拦截器统一提示
  } finally {
    fileLoading.value = false
  }
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <el-drawer
    :model-value="visible"
    :title="detail?.title || '职业规划详情'"
    size="560px"
    direction="rtl"
    destroy-on-close
    @close="handleClose"
  >
    <div v-loading="loading" class="plan-detail">
      <template v-if="detail">
        <!-- 详情信息 -->
        <CareerPlanDetailHead
          :detail="detail"
          :status-type="statusType"
          :status-label="statusLabel"
          :file-loading="fileLoading"
          @download="handleDownload"
          @preview="handlePreview"
        />

        <!-- 目标 / 行动 / 里程碑 -->
        <CareerPlanGoalList
          :goals="detail.goals"
          :plan-id="planId"
          :editable="isEditable"
          @edit-goal="openGoalDialog"
          @edit-action="openActionDialog"
          @edit-milestone="openMilestoneDialog"
          @upload-action="openUploadDialog"
          @refresh="reload"
        />

        <!-- 阶段反思 / 教师反馈 / 版本历史 -->
        <CareerPlanInsights
          :plan="detail"
          :plan-id="planId"
          :editable="isEditable"
          @refresh="reload"
        />
      </template>

      <div v-else-if="!loading" class="plan-detail__empty">暂无规划详情</div>
    </div>
  </el-drawer>

  <CareerPlanEditDialog ref="editDialogRef" :plan-id="planId" @saved="reload" />

  <CareerPlanActionUpload
    :visible="uploadDialogVisible"
    :plan-id="planId"
    :action-id="uploadTarget?.actionId ?? null"
    @close="uploadDialogVisible = false"
    @success="handleUploadSuccess"
  />
</template>

<style scoped lang="scss">
.plan-detail {
  min-height: 200px;
}

.plan-detail__empty {
  padding: 48px 0;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}
</style>
