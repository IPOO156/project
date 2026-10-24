<script setup lang="ts">
/**
 * 职业规划详情中的「目标 / 行动 / 里程碑」列表区块。
 * 行内删除、里程碑勾选、行动状态更新等写操作在此完成，成功后 emit('refresh') 通知父级重新拉取详情。
 */
import type { TagProps } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ref } from 'vue'
import {
  deleteCareerAction,
  deleteCareerGoal,
  deleteCareerMilestone,
  updateCareerActionStatus,
  updateCareerMilestone,
} from '@/shared/api/career-plan'
import { CAREER_ACTION_STATUS_OPTIONS } from '@/shared/constants/dict'

const props = defineProps<{
  /** 目标列表（详情接口的 goals） */
  goals?: any[]
  /** 当前规划 id（写操作寻址） */
  planId: number | null
  /** 仅草稿(0)或已退回(3)可编辑，其余状态只读 */
  editable: boolean
}>()

const emit = defineEmits<{
  (e: 'editGoal', goal?: any): void
  (e: 'editAction', goal: any, action?: any): void
  (e: 'editMilestone', action: any, milestone?: any): void
  (e: 'uploadAction', action: any): void
  (e: 'refresh'): void
}>()

// ─── 目标 / 行动 / 里程碑行内删除 Loading（记录正在删除的行 id，防连点） ───
const deletingId = ref<number | null>(null)

function actionStatusType(status: number): TagProps['type'] {
  return status === 2 ? 'success' : status === 1 ? 'warning' : 'info'
}

function reload() {
  emit('refresh')
}

async function confirmDelete(message: string, id: number, action: () => Promise<unknown>) {
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
  deletingId.value = id
  try {
    await action()
    ElMessage.success('已删除')
    reload()
  } catch {
    // 接口失败已由请求拦截器统一提示
  } finally {
    deletingId.value = null
  }
}

function handleDeleteGoal(goal: any) {
  if (props.planId == null) return
  const planId = props.planId
  confirmDelete('确定删除该目标吗？其下行动与里程碑将被一并删除。', goal.id, async () => {
    await deleteCareerGoal(planId, goal.id)
  })
}

function handleDeleteAction(action: any) {
  if (props.planId == null) return
  const planId = props.planId
  confirmDelete('确定删除该行动吗？其下里程碑将被一并删除。', action.id, async () => {
    await deleteCareerAction(planId, action.id)
  })
}

function handleDeleteMilestone(milestone: any) {
  if (props.planId == null) return
  const planId = props.planId
  confirmDelete('确定删除该里程碑吗？', milestone.id, async () => {
    await deleteCareerMilestone(planId, milestone.id)
  })
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
    reload()
  } catch {
    // 接口失败已由请求拦截器统一提示
  }
}

async function changeActionStatus(action: any, status: number) {
  if (props.planId == null) return
  try {
    await updateCareerActionStatus(props.planId, action.id, status as 0 | 1 | 2)
    ElMessage.success('行动状态已更新')
    reload()
  } catch {
    // 接口失败已由请求拦截器统一提示
  }
}
</script>

<template>
  <div class="goals">
    <div v-for="goal in goals || []" :key="goal.id" class="goal">
      <div class="goal__head">
        <div class="goal__title-line">
          <span class="goal__title">{{ goal.goalTitle }}</span>
          <el-tag :type="actionStatusType(goal.status)" size="small">{{ goal.statusLabel }}</el-tag>
          <span v-if="goal.targetDate" class="goal__date">{{ goal.targetDate }}</span>
        </div>
        <div v-if="editable" class="goal__ops">
          <el-button link type="primary" size="small" @click="emit('editGoal', goal)"
            >编辑</el-button
          >
          <el-button
            link
            type="danger"
            size="small"
            :loading="deletingId === goal.id"
            :disabled="deletingId !== null"
            @click="handleDeleteGoal(goal)"
          >
            删除
          </el-button>
        </div>
      </div>
      <p v-if="goal.goalDesc" class="goal__desc">{{ goal.goalDesc }}</p>

      <!-- 行动列表 -->
      <div class="actions">
        <div v-for="action in goal.actions || []" :key="action.id" class="action">
          <div class="action__head">
            <div class="action__title-line">
              <span class="action__title">{{ action.actionTitle }}</span>
              <el-tag v-if="!editable" :type="actionStatusType(action.status)" size="small">{{
                action.statusLabel
              }}</el-tag>
              <el-select
                v-else
                :model-value="action.status"
                size="small"
                class="action__status"
                @change="(s) => changeActionStatus(action, s)"
              >
                <el-option
                  v-for="opt in CAREER_ACTION_STATUS_OPTIONS"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </div>
            <div v-if="editable" class="action__ops">
              <el-button link type="primary" size="small" @click="emit('editAction', goal, action)"
                >编辑</el-button
              >
              <el-button link type="success" size="small" @click="emit('uploadAction', action)"
                >上传成果</el-button
              >
              <el-button
                link
                type="danger"
                size="small"
                :loading="deletingId === action.id"
                :disabled="deletingId !== null"
                @click="handleDeleteAction(action)"
              >
                删除
              </el-button>
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
                :disabled="!editable"
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
              <span v-if="editable" class="milestone__ops">
                <el-button
                  link
                  type="primary"
                  size="small"
                  @click="emit('editMilestone', action, milestone)"
                  >编辑</el-button
                >
                <el-button
                  link
                  type="danger"
                  size="small"
                  :loading="deletingId === milestone.id"
                  :disabled="deletingId !== null"
                  @click="handleDeleteMilestone(milestone)"
                >
                  删除
                </el-button>
              </span>
            </div>
          </div>
          <el-button
            v-if="editable"
            link
            type="primary"
            size="small"
            class="action__add"
            @click="emit('editMilestone', action)"
            >+ 添加里程碑</el-button
          >
        </div>
      </div>

      <el-button
        v-if="editable"
        link
        type="primary"
        size="small"
        class="goal__add"
        @click="emit('editAction', goal)"
        >+ 添加行动</el-button
      >
    </div>

    <el-button
      v-if="editable"
      type="primary"
      plain
      size="small"
      class="goals__add"
      @click="emit('editGoal')"
      >+ 添加目标</el-button
    >
  </div>
</template>

<style scoped lang="scss">
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
</style>
