<script setup lang="ts">
import type { UploadFile } from 'element-plus'
import type { SemesterSelectOption } from '@/shared/composables/useSemesters'
/**
 * 职业规划「填写规划」表单卡片。
 * 表单状态与草稿逻辑随表单一起内聚；提交走 useCareerPlanStore（与父页面共用同一实例，不重复请求）。
 */
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'
import { deleteFile, uploadFile } from '@/shared/api/common'
import { useFormDraft } from '@/shared/composables/useFormDraft'
import { useCareerPlanStore } from '@/stores/stores'

defineProps<{
  /** 学期下拉选项（useSemesters：仅后端真实学期） */
  semesterOptions: SemesterSelectOption[]
}>()

const careerPlanStore = useCareerPlanStore()

/** 里程碑/行动/目标三层草稿：与接口 4.4 的 goals→actions→milestones 嵌套结构一一对应 */
interface MilestoneDraft {
  milestoneTitle: string
  milestoneDate: string
}
interface ActionDraft {
  actionTitle: string
  actionDesc: string
  startDate: string
  endDate: string
  milestones: MilestoneDraft[]
}
interface GoalDraft {
  goalTitle: string
  goalDesc: string
  targetDate: string
  actions: ActionDraft[]
}
/** 规划附件：先调 /common/upload 拿 fileId，提交时随 evidenceFileIds 一起上报 */
interface EvidenceFile {
  fileId: number
  fileName: string
}

const planForm = reactive({
  semester: '',
  title: '',
  content: '',
  requirement: '',
  goals: [] as GoalDraft[],
  evidenceFiles: [] as EvidenceFile[],
})
// 职业规划草稿走后端 POST（isDraft=1），由「保存草稿」按钮显式调用；
// 关闭 useFormDraft 的通用后端自动保存（其契约类型为档案/奖项申报，不适用于职业规划）
const { clearDraft } = useFormDraft('career-plan', planForm, { enableBackend: false })

const loading = ref(false)
const draftLoading = ref(false)
const evidenceUploading = ref(false)

const EVIDENCE_ACCEPT = '.pdf,.doc,.docx,.jpg,.jpeg,.png'
const EVIDENCE_MAX_SIZE = 20 * 1024 * 1024

/** 上传规划附件（选中即传，列表内手工展示）；删除时尽力清理未绑定的上传文件 */
async function handleEvidenceChange(file: UploadFile) {
  const raw = file.raw
  if (!raw) return
  if (raw.size > EVIDENCE_MAX_SIZE) {
    ElMessage.warning('佐证材料单个文件不能超过 20MB')
    return
  }
  evidenceUploading.value = true
  try {
    const uploaded = await uploadFile({ file: raw, type: 'evidence', module: 'career_plan' })
    planForm.evidenceFiles.push({ fileId: uploaded.fileId, fileName: uploaded.fileName })
  } catch {
    // 接口失败已由请求拦截器统一提示
  } finally {
    evidenceUploading.value = false
  }
}

async function removeEvidence(index: number) {
  const [removed] = planForm.evidenceFiles.splice(index, 1)
  if (!removed) return
  try {
    await deleteFile(removed.fileId)
  } catch {
    // 已绑定到草稿的文件后端可能拒绝删除；本地移除即可，避免阻塞用户操作
  }
}

function resetForm() {
  planForm.semester = ''
  planForm.title = ''
  planForm.content = ''
  planForm.requirement = ''
  planForm.goals = []
  planForm.evidenceFiles = []
  clearDraft()
}

function evidenceIds(): number[] {
  return planForm.evidenceFiles.map((f) => f.fileId)
}

function addGoal() {
  planForm.goals.push({ goalTitle: '', goalDesc: '', targetDate: '', actions: [] })
}
function removeGoal(index: number) {
  planForm.goals.splice(index, 1)
}
function addAction(goal: GoalDraft) {
  goal.actions.push({ actionTitle: '', actionDesc: '', startDate: '', endDate: '', milestones: [] })
}
function removeAction(goal: GoalDraft, index: number) {
  goal.actions.splice(index, 1)
}
function addMilestone(action: ActionDraft) {
  action.milestones.push({ milestoneTitle: '', milestoneDate: '' })
}
function removeMilestone(action: ActionDraft, index: number) {
  action.milestones.splice(index, 1)
}

/**
 * 组装接口 goals 载荷：逐层丢弃标题为空的行（空行视为没填），空描述/日期不传 undefined 占位。
 * 返回 undefined 表示没有目标，提交时该字段整体不传。
 */
function buildGoalsPayload() {
  const goals = planForm.goals
    .filter((g) => g.goalTitle.trim())
    .map((g) => ({
      goalTitle: g.goalTitle.trim(),
      goalDesc: g.goalDesc.trim() || undefined,
      targetDate: g.targetDate || undefined,
      actions: g.actions
        .filter((a) => a.actionTitle.trim())
        .map((a) => ({
          actionTitle: a.actionTitle.trim(),
          actionDesc: a.actionDesc.trim() || undefined,
          startDate: a.startDate || undefined,
          endDate: a.endDate || undefined,
          milestones: a.milestones
            .filter((m) => m.milestoneTitle.trim())
            .map((m) => ({
              milestoneTitle: m.milestoneTitle.trim(),
              milestoneDate: m.milestoneDate || undefined,
            })),
        })),
    }))
  return goals.length > 0 ? goals : undefined
}

/** 校验：填了内容却没填标题的行要明确提示序号，避免静默丢弃用户已填内容 */
function validateGoals(): boolean {
  for (const [gi, goal] of planForm.goals.entries()) {
    const goalFilled = goal.goalDesc.trim() || goal.targetDate || goal.actions.length > 0
    if (!goal.goalTitle.trim() && goalFilled) {
      ElMessage.warning(`第 ${gi + 1} 个目标请填写目标标题`)
      return false
    }
    for (const [ai, action] of goal.actions.entries()) {
      const actionFilled =
        action.actionDesc.trim() ||
        action.startDate ||
        action.endDate ||
        action.milestones.length > 0
      if (!action.actionTitle.trim() && actionFilled) {
        ElMessage.warning(`「${goal.goalTitle}」的第 ${ai + 1} 个行动请填写行动标题`)
        return false
      }
      for (const [mi, milestone] of action.milestones.entries()) {
        if (!milestone.milestoneTitle.trim() && milestone.milestoneDate) {
          ElMessage.warning(`「${action.actionTitle}」的第 ${mi + 1} 个里程碑请填写里程碑标题`)
          return false
        }
      }
    }
  }
  return true
}

/** 学期/标题为后端必填（草稿同样校验），附件上传中禁止提交 */
function baseInvalid(): boolean {
  if (!planForm.semester || !planForm.title) {
    ElMessage.warning('请填写学期和标题')
    return true
  }
  if (evidenceUploading.value) {
    ElMessage.warning('佐证材料正在上传，请稍候')
    return true
  }
  return false
}

async function handleSubmit() {
  if (baseInvalid()) return
  if (!validateGoals()) return
  loading.value = true
  try {
    await careerPlanStore.submitPlan({
      semester: planForm.semester,
      title: planForm.title,
      content: planForm.content,
      requirement: planForm.requirement,
      goals: buildGoalsPayload(),
      evidenceFileIds: evidenceIds(),
    })
    resetForm()
    ElMessage.success('规划已提交')
  } catch (e) {
    // 「未找到学期」为前端本地校验错误（未经拦截器），需就地明确提示；其余错误拦截器已提示
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('未找到学期')) ElMessage.warning(msg)
  } finally {
    loading.value = false
  }
}

/** 保存后端草稿（isDraft=1）：允许目标为空，但已填一半的行仍按提交规则校验，避免草稿内容被静默丢弃 */
async function handleSaveDraft() {
  if (baseInvalid()) return
  if (!validateGoals()) return
  draftLoading.value = true
  try {
    await careerPlanStore.saveDraftPlan({
      semester: planForm.semester,
      title: planForm.title,
      content: planForm.content,
      requirement: planForm.requirement,
      goals: buildGoalsPayload(),
      evidenceFileIds: evidenceIds(),
    })
    resetForm()
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('未找到学期')) ElMessage.warning(msg)
  } finally {
    draftLoading.value = false
  }
}
</script>

<template>
  <el-card class="gd-card">
    <template #header><span class="card-title">填写规划</span></template>
    <!-- 70px 放不下「要求/目标」4 个汉字加斜杠，1024 宽会折行；84px 可保持单行 -->
    <el-form :model="planForm" label-width="84px" size="default">
      <el-form-item label="学期" required>
        <el-select v-model="planForm.semester" placeholder="请选择学期" class="form-w">
          <el-option
            v-for="s in semesterOptions"
            :key="s.value"
            :label="s.label"
            :value="s.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="标题" required>
        <el-input v-model="planForm.title" placeholder="如：大二下学期学习规划" class="form-w" />
      </el-form-item>
      <el-form-item label="内容">
        <el-input
          v-model="planForm.content"
          type="textarea"
          :rows="5"
          placeholder="请描述你的规划目标与具体措施..."
        />
      </el-form-item>
      <el-form-item label="要求/目标">
        <el-input
          v-model="planForm.requirement"
          type="textarea"
          :rows="3"
          placeholder="如：GPA达到3.5以上，参与至少一项科研项目"
        />
      </el-form-item>
      <el-form-item label="佐证材料">
        <div class="evidence">
          <div v-for="(f, i) in planForm.evidenceFiles" :key="f.fileId" class="evidence__item">
            <span class="evidence__name">{{ f.fileName }}</span>
            <el-button link type="danger" size="small" @click="removeEvidence(i)">删除</el-button>
          </div>
          <el-upload
            :auto-upload="false"
            :show-file-list="false"
            :accept="EVIDENCE_ACCEPT"
            :disabled="evidenceUploading"
            :on-change="handleEvidenceChange"
          >
            <el-button :loading="evidenceUploading">上传附件</el-button>
          </el-upload>
          <span class="evidence__hint">支持 PDF / Word / 图片，单个不超过 20MB</span>
        </div>
      </el-form-item>
      <!-- 目标 → 行动 → 里程碑：对应接口 4.4 的级联写入，创建时一次性落实「具体目标/行动/结果」 -->
      <el-form-item label="具体目标">
        <div class="goal-editor">
          <div v-for="(goal, gi) in planForm.goals" :key="gi" class="goal-block">
            <div class="block-head">
              <span class="block-title">目标 {{ gi + 1 }}</span>
              <el-button link type="danger" @click="removeGoal(gi)">删除目标</el-button>
            </div>
            <el-input v-model="goal.goalTitle" placeholder="目标标题（必填）" />
            <el-input v-model="goal.goalDesc" placeholder="目标描述（选填）" />
            <el-date-picker
              v-model="goal.targetDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="目标日期"
              class="date-w"
            />
            <div v-for="(action, ai) in goal.actions" :key="ai" class="action-block">
              <div class="block-head">
                <span class="block-title">行动 {{ ai + 1 }}</span>
                <el-button link type="danger" @click="removeAction(goal, ai)">删除行动</el-button>
              </div>
              <el-input v-model="action.actionTitle" placeholder="行动标题（必填）" />
              <el-input v-model="action.actionDesc" placeholder="行动描述（选填）" />
              <div class="date-pair">
                <el-date-picker
                  v-model="action.startDate"
                  type="date"
                  value-format="YYYY-MM-DD"
                  placeholder="开始日期"
                  class="date-w"
                />
                <el-date-picker
                  v-model="action.endDate"
                  type="date"
                  value-format="YYYY-MM-DD"
                  placeholder="结束日期"
                  class="date-w"
                />
              </div>
              <div v-for="(milestone, mi) in action.milestones" :key="mi" class="milestone-row">
                <el-input v-model="milestone.milestoneTitle" placeholder="里程碑标题（必填）" />
                <el-date-picker
                  v-model="milestone.milestoneDate"
                  type="date"
                  value-format="YYYY-MM-DD"
                  placeholder="预计达成日期"
                  class="date-w"
                />
                <el-button link type="danger" @click="removeMilestone(action, mi)">删除</el-button>
              </div>
              <el-button link type="primary" @click="addMilestone(action)">+ 添加里程碑</el-button>
            </div>
            <el-button link type="primary" @click="addAction(goal)">+ 添加行动</el-button>
          </div>
          <el-button type="primary" plain @click="addGoal">+ 添加目标</el-button>
        </div>
      </el-form-item>
      <el-form-item>
        <el-button
          :loading="draftLoading"
          :disabled="loading || evidenceUploading"
          @click="handleSaveDraft"
        >
          保存草稿
        </el-button>
        <el-button
          type="primary"
          :loading="loading"
          :disabled="draftLoading || evidenceUploading"
          @click="handleSubmit"
        >
          提交规划
        </el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<style scoped lang="scss">
.gd-card {
  :deep(.el-card__body) {
    padding: 16px 20px;
  }
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.form-w {
  width: 100%;
  max-width: 400px;
}

.goal-editor {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.goal-block,
.action-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 6px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.action-block {
  background: #f1f5f9;
}

.block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.block-title {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.date-pair {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.date-w {
  width: 180px;
}

.milestone-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.evidence {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  width: 100%;

  &__item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 10px;
    border-radius: 6px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  &__name {
    font-size: 13px;
    color: #334155;
    word-break: break-all;
  }

  &__hint {
    font-size: 12px;
    color: #94a3b8;
  }
}

// ─── 夜间模式适配 ───
html.dark {
  .card-title {
    color: #f1f5f9;
  }

  .goal-block,
  .action-block {
    background: #1e293b;
    border-color: #334155;
  }

  .evidence__item {
    background: #1e293b;
    border-color: #334155;
  }

  .evidence__name {
    color: #cbd5e1;
  }

  .block-title {
    color: #cbd5e1;
  }
}
</style>
