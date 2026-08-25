<script setup lang="ts">
import type { TagProps } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, ref, watch } from 'vue'
import {
  deleteCareerAction,
  deleteCareerGoal,
  deleteCareerMilestone,
  downloadCareerPlanFile,
  getCareerPlanDetail,
  previewCareerPlanFile,
  updateCareerActionStatus,
  updateCareerMilestone,
} from '@/shared/api/career-plan'
import { useDict } from '@/shared/composables/composables'
import { APPLICATION_STATUS } from '@/shared/constants/dict'
import CareerPlanActionUpload from './CareerPlanActionUpload.vue'
import CareerPlanEditDialog from './CareerPlanEditDialog.vue'
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
const STATUS_KEY_MAP: Record<number, keyof typeof APPLICATION_STATUS> = {
  0: 'draft',
  1: 'pending',
  2: 'approved',
  3: 'rejected',
  4: 'withdrawn',
}

const ACTION_STATUS_OPTIONS = [
  { label: '未开始', value: 0 },
  { label: '进行中', value: 1 },
  { label: '已完成', value: 2 },
] as const

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

function actionStatusType(status: number): TagProps['type'] {
  return status === 2 ? 'success' : status === 1 ? 'warning' : 'info'
}

async function fetchDetail() {
  if (props.planId == null) return
  loading.value = true
  try {
    detail.value = await getCareerPlanDetail(props.planId)
  } catch {
    ElMessage.error('详情加载失败')
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
    const res = (await downloadCareerPlanFile(props.planId, 'internal')) as any
    if (res?.downloadUrl) {
      window.open(res.downloadUrl, '_blank', 'noopener')
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

async function confirmDelete(message: string, action: () => Promise<unknown>) {
  if (props.planId == null) return
  try {
    await ElMessageBox.confirm(message, '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await action()
    ElMessage.success('已删除')
    await reload()
  } catch {
    // 接口失败已由请求拦截器统一提示
  }
}

function handleDeleteGoal(goal: any) {
  if (props.planId == null) return
  const planId = props.planId
  confirmDelete('确定删除该目标吗？其下行动与里程碑将被一并删除。', () =>
    deleteCareerGoal(planId, goal.id),
  )
}

function handleDeleteAction(action: any) {
  if (props.planId == null) return
  const planId = props.planId
  confirmDelete('确定删除该行动吗？其下里程碑将被一并删除。', () =>
    deleteCareerAction(planId, action.id),
  )
}

function handleDeleteMilestone(milestone: any) {
  if (props.planId == null) return
  const planId = props.planId
  confirmDelete('确定删除该里程碑吗？', () => deleteCareerMilestone(planId, milestone.id))
}

async function toggleMilestone(milestone: any, checked: string | number | boolean) {
  if (props.planId == null) return
  const achieved = Boolean(checked)
  try {
    await updateCareerMilestone(props.planId, milestone.id, {
      milestoneTitle: milestone.milestoneTitle,
      milestoneDate: milestone.milestoneDate ?? undefined,
      isAchieved: achieved ? 1 : 0,
      proofFileId: milestone.proofFileId ?? undefined,
    })
    ElMessage.success(achieved ? '里程碑已标记完成' : '里程碑已标记未完成')
    await reload()
  } catch {
    // 接口失败已由请求拦截器统一提示
  }
}

async function changeActionStatus(action: any, status: number) {
  if (props.planId == null) return
  try {
    await updateCareerActionStatus(props.planId, action.id, status as 0 | 1 | 2)
    ElMessage.success('行动状态已更新')
    await reload()
  } catch {
    // 接口失败已由请求拦截器统一提示
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
        <!-- 头部信息 -->
        <div class="plan-detail__head">
          <div class="head-title-row">
            <h2 class="head-title">{{ detail.title }}</h2>
            <el-tag :type="statusType" size="small">{{ statusLabel }}</el-tag>
          </div>
          <div class="head-actions">
            <el-button size="small" :loading="fileLoading" @click="handleDownload">下载</el-button>
            <el-button
              size="small"
              type="primary"
              plain
              :loading="fileLoading"
              @click="handlePreview"
            >
              预览
            </el-button>
          </div>
          <div class="head-meta">
            <span class="meta-item">{{ detail.semesterName || '-' }}</span>
            <span v-if="detail.sourceLabel" class="meta-item">来源：{{ detail.sourceLabel }}</span>
          </div>
          <el-progress
            :percentage="detail.progressRate ?? 0"
            :stroke-width="8"
            class="head-progress"
          />
          <div v-if="detail.auditorName" class="head-audit">审核人：{{ detail.auditorName }}</div>
          <div v-if="detail.rejectedReason" class="head-reject">
            退回原因：{{ detail.rejectedReason }}
          </div>
        </div>

        <!-- 目标列表 -->
        <div class="goals">
          <div v-for="goal in detail.goals || []" :key="goal.id" class="goal">
            <div class="goal__head">
              <div class="goal__title-line">
                <span class="goal__title">{{ goal.goalTitle }}</span>
                <el-tag :type="actionStatusType(goal.status)" size="small">{{
                  goal.statusLabel
                }}</el-tag>
                <span v-if="goal.targetDate" class="goal__date">{{ goal.targetDate }}</span>
              </div>
              <div v-if="isEditable" class="goal__ops">
                <el-button link type="primary" size="small" @click="openGoalDialog(goal)"
                  >编辑</el-button
                >
                <el-button link type="danger" size="small" @click="handleDeleteGoal(goal)"
                  >删除</el-button
                >
              </div>
            </div>
            <p v-if="goal.goalDesc" class="goal__desc">{{ goal.goalDesc }}</p>

            <!-- 行动列表 -->
            <div class="actions">
              <div v-for="action in goal.actions || []" :key="action.id" class="action">
                <div class="action__head">
                  <div class="action__title-line">
                    <span class="action__title">{{ action.actionTitle }}</span>
                    <el-tag
                      v-if="!isEditable"
                      :type="actionStatusType(action.status)"
                      size="small"
                      >{{ action.statusLabel }}</el-tag
                    >
                    <el-select
                      v-else
                      :model-value="action.status"
                      size="small"
                      class="action__status"
                      @change="(s) => changeActionStatus(action, s)"
                    >
                      <el-option
                        v-for="opt in ACTION_STATUS_OPTIONS"
                        :key="opt.value"
                        :label="opt.label"
                        :value="opt.value"
                      />
                    </el-select>
                  </div>
                  <div v-if="isEditable" class="action__ops">
                    <el-button
                      link
                      type="primary"
                      size="small"
                      @click="openActionDialog(goal, action)"
                      >编辑</el-button
                    >
                    <el-button link type="success" size="small" @click="openUploadDialog(action)"
                      >上传成果</el-button
                    >
                    <el-button link type="danger" size="small" @click="handleDeleteAction(action)"
                      >删除</el-button
                    >
                  </div>
                </div>
                <p v-if="action.actionDesc" class="action__desc">{{ action.actionDesc }}</p>
                <div v-if="action.startDate || action.endDate" class="action__range">
                  {{ action.startDate || '-' }} ~ {{ action.endDate || '-' }}
                </div>
                <el-progress
                  v-if="action.completionRate != null"
                  :percentage="action.completionRate"
                  :stroke-width="6"
                  class="action__progress"
                />
                <div v-if="action.files?.length" class="action__files">
                  <span class="action__files-label">成果文件：</span>
                  <a
                    v-for="f in action.files"
                    :key="f.fileId"
                    :href="f.fileUrl"
                    target="_blank"
                    rel="noopener"
                    class="action__file"
                    >{{ f.fileName }}</a
                  >
                </div>

                <!-- 里程碑列表 -->
                <div v-if="action.milestones?.length" class="milestones">
                  <div v-for="milestone in action.milestones" :key="milestone.id" class="milestone">
                    <el-switch
                      :model-value="milestone.isAchieved === 1"
                      :disabled="!isEditable"
                      size="small"
                      @change="(v) => toggleMilestone(milestone, v)"
                    />
                    <span
                      class="milestone__title"
                      :class="{ 'is-achieved': milestone.isAchieved === 1 }"
                      >{{ milestone.milestoneTitle }}</span
                    >
                    <span v-if="milestone.milestoneDate" class="milestone__date">{{
                      milestone.milestoneDate
                    }}</span>
                    <span v-if="milestone.proofFileName" class="milestone__proof">{{
                      milestone.proofFileName
                    }}</span>
                    <span v-if="isEditable" class="milestone__ops">
                      <el-button
                        link
                        type="primary"
                        size="small"
                        @click="openMilestoneDialog(action, milestone)"
                        >编辑</el-button
                      >
                      <el-button
                        link
                        type="danger"
                        size="small"
                        @click="handleDeleteMilestone(milestone)"
                        >删除</el-button
                      >
                    </span>
                  </div>
                </div>
                <el-button
                  v-if="isEditable"
                  link
                  type="primary"
                  size="small"
                  class="action__add"
                  @click="openMilestoneDialog(action)"
                  >+ 添加里程碑</el-button
                >
              </div>
            </div>

            <el-button
              v-if="isEditable"
              link
              type="primary"
              size="small"
              class="goal__add"
              @click="openActionDialog(goal)"
              >+ 添加行动</el-button
            >
          </div>

          <el-button
            v-if="isEditable"
            type="primary"
            plain
            size="small"
            class="goals__add"
            @click="openGoalDialog()"
            >+ 添加目标</el-button
          >
        </div>

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

.plan-detail__head {
  padding: 8px 4px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.head-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.head-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.head-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.head-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.meta-item {
  color: var(--el-text-color-regular);
}

.head-progress {
  margin-top: 2px;
}

.head-audit {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.head-reject {
  font-size: 13px;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  border-radius: 6px;
  padding: 8px 12px;
}

.goals {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 0 8px;
}

.goal {
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  padding: 12px 14px;
  background: var(--el-bg-color);
}

.goal__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.goal__title-line,
.action__title-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.goal__title {
  font-size: 15px;
  font-weight: 600;
  color: #d4a574;
}

.goal__date {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.goal__ops,
.action__ops {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.goal__desc {
  margin: 8px 0 4px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
  padding-left: 8px;
  border-left: 2px solid var(--el-border-color-light);
}

.action {
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
}

.action__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.action__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.action__status {
  width: 96px;
}

.action__desc {
  margin: 6px 0 4px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}

.action__range {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
}

.action__progress {
  margin-bottom: 8px;
}

.action__files {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 12px;
}

.action__files-label {
  color: var(--el-text-color-secondary);
}

.action__file {
  color: var(--el-color-primary);
}

.milestones {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 8px 0;
}

.milestone {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 13px;
}

.milestone__title {
  color: var(--el-text-color-regular);

  &.is-achieved {
    color: var(--el-text-color-secondary);
    text-decoration: line-through;
  }
}

.milestone__date,
.milestone__proof {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.milestone__proof {
  color: #d4a574;
}

.milestone__ops {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
}

.goal__add,
.action__add {
  margin-top: 6px;
}

.goals__add {
  align-self: flex-start;
}

.plan-detail__empty {
  padding: 48px 0;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}
</style>
