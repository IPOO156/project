<script setup lang="ts">
import type { TagProps } from 'element-plus'
import { ElMessage } from 'element-plus'
import { computed, reactive, ref, watch } from 'vue'
import { updateActivity } from '@/shared/api/activities'
import {
  downloadCareerPlanFile,
  getCareerPlanDetail,
  getCareerPlanPreviewBlob,
  getSemesterIdByName,
} from '@/shared/api/career-plan'
import { useDict } from '@/shared/composables/composables'
import { useSemesters } from '@/shared/composables/useSemesters'
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
    // 学生端导出按接口文档默认走 external（无水印，用于对外投递）；
    // 后端 302 到 OSS 签名 URL，downloadCareerPlanFile 已按 blob 接收并触发本地保存
    await downloadCareerPlanFile(
      props.planId,
      'external',
      `${detail.value?.title || '职业规划'}.pdf`,
    )
  } catch {
    // 接口失败已由请求拦截器统一提示
  } finally {
    fileLoading.value = false
  }
}

async function handlePreview() {
  if (props.planId == null) return
  // 预览接口需携带 Authorization（无状态 JWT），不能把后端地址直接交给 window.open；
  // 先在点击事件内同步打开空白窗口，待 blob 就绪后再导航——await 之后开窗会被浏览器拦截。
  const previewWindow = window.open('', '_blank')
  if (previewWindow) previewWindow.opener = null
  fileLoading.value = true
  try {
    const blob = await getCareerPlanPreviewBlob(props.planId, 'external')
    if (!previewWindow) {
      ElMessage.warning('预览窗口被浏览器拦截，请允许本站弹出窗口后重试')
      return
    }
    // 后端已返回 application/pdf；个别浏览器 blob.type 缺失时显式补上，保证内嵌渲染而非下载
    const pdfBlob =
      blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' })
    const url = URL.createObjectURL(pdfBlob)
    previewWindow.location.href = url
    // 新窗口加载 PDF 需要时间，延迟释放；立即 revoke 会导致标签页打开空白地址
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch {
    previewWindow?.close()
    // 接口失败已由请求拦截器统一提示
  } finally {
    fileLoading.value = false
  }
}

/* ===================== 编辑规划正文 ===================== */

const { semesterOptions, load: loadSemesters } = useSemesters()
const bodyEditVisible = ref(false)
const bodySaving = ref(false)
const bodyForm = reactive({ semester: '', title: '', content: '', requirement: '' })

function openBodyEditor() {
  if (!detail.value) return
  bodyForm.semester = detail.value.semesterName || ''
  bodyForm.title = detail.value.title || ''
  bodyForm.content = detail.value.content || ''
  bodyForm.requirement = detail.value.requirement || ''
  bodyEditVisible.value = true
  void loadSemesters()
}

/**
 * 规划正文更新走统一活动编辑接口（后端无 PUT /profile/career-plans/{id}）。
 * 注意：该接口保存后会置为待审批并升版本，语义是「修改后重新提交」。
 */
async function submitBodyEdit() {
  if (props.planId == null) return
  if (!bodyForm.title.trim()) {
    ElMessage.warning('请填写规划标题')
    return
  }
  bodySaving.value = true
  try {
    const semesterId = bodyForm.semester ? await getSemesterIdByName(bodyForm.semester) : undefined
    await updateActivity(props.planId, 'career_plan', {
      title: bodyForm.title.trim(),
      semesterId,
      content: bodyForm.content,
      requirement: bodyForm.requirement,
    })
    ElMessage.success('规划已保存并重新提交审核')
    bodyEditVisible.value = false
    await reload()
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('未找到学期')) ElMessage.warning(msg)
  } finally {
    bodySaving.value = false
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
          :editable="isEditable"
          @download="handleDownload"
          @preview="handlePreview"
          @edit="openBodyEditor"
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

  <el-dialog
    v-model="bodyEditVisible"
    title="编辑规划正文"
    width="520px"
    :close-on-click-modal="false"
    destroy-on-close
    append-to-body
  >
    <el-form label-width="84px">
      <el-form-item label="学期" required>
        <el-select v-model="bodyForm.semester" placeholder="请选择学期" class="body-w">
          <el-option
            v-for="s in semesterOptions"
            :key="s.value"
            :label="s.label"
            :value="s.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="标题" required>
        <el-input v-model="bodyForm.title" maxlength="255" placeholder="请输入规划标题" />
      </el-form-item>
      <el-form-item label="规划总述">
        <el-input
          v-model="bodyForm.content"
          type="textarea"
          :rows="4"
          placeholder="请描述你的规划目标与具体措施..."
        />
      </el-form-item>
      <el-form-item label="要求/目标">
        <el-input
          v-model="bodyForm.requirement"
          type="textarea"
          :rows="3"
          placeholder="如：GPA达到3.5以上，参与至少一项科研项目"
        />
      </el-form-item>
    </el-form>
    <p class="body-edit__tip">保存后会重新提交审核，规划版本号将加一。</p>
    <template #footer>
      <el-button @click="bodyEditVisible = false">取消</el-button>
      <el-button type="primary" :loading="bodySaving" @click="submitBodyEdit">保存并提交</el-button>
    </template>
  </el-dialog>
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

.body-w {
  width: 100%;
}

.body-edit__tip {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
