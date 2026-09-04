<script setup lang="ts">
import type { StarRecord } from '@/shared/types/types'
import { computed, reactive, ref, watch } from 'vue'
import { useAwardReviewStore } from '@/app/stores/stores'
import {
  AWARD_LEVELS,
  COMPETITION_TYPES,
  INDUSTRY_TYPES,
  PROJECT_LEVELS,
  SEMESTER_OPTIONS,
} from '@/shared/constants/dict'
import StatusTag from '@/shared/ui/StatusTag.vue'

interface Props {
  modelValue: boolean
  record: StarRecord | null
  mode: 'view' | 'edit'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: [id: string]
}>()

const awardReviewStore = useAwardReviewStore()

const editForm = reactive<Record<string, any>>({})
const saving = ref(false)

const statusLabel: Record<string, string> = {
  draft: '草稿',
  submitted: '待审核',
  approved: '已通过',
  rejected: '已驳回',
}

function dictLabel(dict: readonly { label: string; value: string }[], value: string): string {
  return dict.find((d) => d.value === value)?.label || value
}

const detailFields = computed(() => {
  const r = props.record
  if (!r) return []

  const base = [
    { label: '报名人', value: r.applicant },
    { label: '提交日期', value: r.submitDate || '-' },
    { label: '学期', value: r.semester },
  ]

  let typeFields: { label: string; value: string }[] = []

  if (r.type === 'competitionStar') {
    typeFields = [
      { label: '竞赛名称', value: r.competitionName || r.title.replace(' - 竞赛之星报名', '') },
      { label: '竞赛时间', value: r.competitionDate || '-' },
      { label: '竞赛级别', value: dictLabel(COMPETITION_TYPES, r.competitionLevel || '') },
      { label: '获奖等级', value: dictLabel(AWARD_LEVELS, r.awardLevel || '') },
    ]
  } else if (r.type === 'scientificProject') {
    typeFields = [
      { label: '项目名称', value: r.projectName || r.title.replace(' - 科研之星报名', '') },
      { label: '项目级别', value: dictLabel(PROJECT_LEVELS, r.projectLevel || '') },
      { label: '申报人排名', value: r.ranking || '-' },
      { label: '项目时间', value: r.projectDate || '-' },
    ]
  } else if (r.type === 'softwareCopyright') {
    typeFields = [
      { label: '软件名称', value: r.softName || r.title.replace(' - 科研之星报名', '') },
      { label: '颁发单位', value: r.issuer || '-' },
      { label: '申报人排名', value: r.ranking || '-' },
      { label: '批准日期', value: r.approveDate || '-' },
    ]
  } else if (r.type === 'paper') {
    typeFields = [
      { label: '论文名称', value: r.paperName || r.title.replace(' - 科研之星报名', '') },
      { label: '发表期刊', value: r.journalName || '-' },
      { label: '申报人排名', value: r.ranking || '-' },
      { label: '发表日期', value: r.publishDate || '-' },
    ]
  } else if (r.type === 'innovationStar') {
    typeFields = [
      { label: '公司名称', value: r.companyName || r.title.replace(' - 双创之星报名', '') },
      { label: '行业类型', value: dictLabel(INDUSTRY_TYPES, r.industryType || '') },
      { label: '申报人排名', value: r.ranking || '-' },
      { label: '注册时间', value: r.registerDate || '-' },
    ]
  }

  return [
    { label: '报名类型', value: r.typeLabel },
    ...typeFields,
    ...base,
    { label: '当前状态', value: statusLabel[r.status] || r.status, isStatus: true },
  ]
})

watch(
  () => [props.record, props.mode],
  () => {
    if (props.record && props.mode === 'edit') {
      Object.keys(editForm).forEach((k) => delete (editForm as Record<string, unknown>)[k])
      const r = props.record
      if (r.type === 'competitionStar') {
        editForm.competitionName = r.competitionName || r.title.replace(' - 竞赛之星报名', '')
        editForm.competitionDate = r.competitionDate || ''
        editForm.competitionLevel = r.competitionLevel || ''
        editForm.awardLevel = r.awardLevel || ''
        editForm.semester = r.semester || ''
      } else if (r.type === 'scientificProject') {
        editForm.projectName = r.projectName || r.title.replace(' - 科研之星报名', '')
        editForm.projectLevel = r.projectLevel || ''
        editForm.ranking = r.ranking || ''
        editForm.projectDate = r.projectDate || ''
        editForm.semester = r.semester || ''
      } else if (r.type === 'softwareCopyright') {
        editForm.softName = r.softName || r.title.replace(' - 科研之星报名', '')
        editForm.issuer = r.issuer || ''
        editForm.ranking = r.ranking || ''
        editForm.approveDate = r.approveDate || ''
        editForm.semester = r.semester || ''
      } else if (r.type === 'paper') {
        editForm.paperName = r.paperName || r.title.replace(' - 科研之星报名', '')
        editForm.journalName = r.journalName || ''
        editForm.ranking = r.ranking || ''
        editForm.publishDate = r.publishDate || ''
        editForm.semester = r.semester || ''
      } else if (r.type === 'innovationStar') {
        editForm.companyName = r.companyName || r.title.replace(' - 双创之星报名', '')
        editForm.industryType = r.industryType || ''
        editForm.ranking = r.ranking || ''
        editForm.registerDate = r.registerDate || ''
        editForm.semester = r.semester || ''
      }
    }
  },
  { immediate: true },
)

async function handleSave() {
  if (!props.record) return
  saving.value = true
  try {
    const type = props.record.type
    const suffixMap: Record<string, string> = {
      competitionStar: ' - 竞赛之星报名',
      scientificProject: ' - 科研之星报名',
      softwareCopyright: ' - 科研之星报名',
      paper: ' - 科研之星报名',
      innovationStar: ' - 双创之星报名',
    }
    const suffix = suffixMap[type] || ''
    const titleField =
      type === 'competitionStar'
        ? editForm.competitionName
        : type === 'scientificProject'
          ? editForm.projectName
          : type === 'softwareCopyright'
            ? editForm.softName
            : type === 'paper'
              ? editForm.paperName
              : editForm.companyName

    const payload: Record<string, any> = { ...editForm, semester: editForm.semester }
    if (titleField) payload.title = titleField + suffix

    await awardReviewStore.resubmit(props.record.id, payload)
    emit('saved', props.record.id)
    emit('update:modelValue', false)
  } catch {
    // ElMessage 已在 store 中处理
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="mode === 'edit' ? '编辑报名信息' : '报名详情'"
    width="560px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <!-- 查看模式 -->
    <template v-if="record && mode === 'view'">
      <el-descriptions :column="1" border>
        <el-descriptions-item v-for="f in detailFields" :key="f.label" :label="f.label">
          <template v-if="f.isStatus">
            <StatusTag :status="record.status" size="small" />
          </template>
          <span v-else>{{ f.value }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </template>

    <!-- 编辑模式 -->
    <template v-if="record && mode === 'edit'">
      <el-alert title="编辑说明" type="warning" :closable="false" show-icon class="mb-16">
        <p>修改后提交将进入待审核状态。</p>
      </el-alert>
      <el-form :model="editForm" label-width="120px">
        <!-- 竞赛之星 -->
        <template v-if="record.type === 'competitionStar'">
          <el-form-item label="竞赛名称" required>
            <el-input
              v-model="editForm.competitionName"
              placeholder="请输入竞赛名称"
              class="form-control"
            />
          </el-form-item>
          <el-form-item label="参赛时间">
            <el-date-picker
              v-model="editForm.competitionDate"
              type="month"
              placeholder="选择年月"
              class="form-control"
            />
          </el-form-item>
          <el-form-item label="竞赛级别">
            <el-select
              v-model="editForm.competitionLevel"
              placeholder="请选择"
              class="form-control"
            >
              <el-option
                v-for="t in COMPETITION_TYPES"
                :key="t.value"
                :label="t.label"
                :value="t.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="获奖等级">
            <el-select v-model="editForm.awardLevel" placeholder="请选择" class="form-control">
              <el-option
                v-for="t in AWARD_LEVELS"
                :key="t.value"
                :label="t.label"
                :value="t.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="学期">
            <el-select v-model="editForm.semester" placeholder="请选择" class="form-control">
              <el-option
                v-for="s in SEMESTER_OPTIONS"
                :key="s.value"
                :label="s.label"
                :value="s.value"
              />
            </el-select>
          </el-form-item>
        </template>

        <!-- 科研项目 -->
        <template v-if="record.type === 'scientificProject'">
          <el-form-item label="项目名称" required>
            <el-input
              v-model="editForm.projectName"
              placeholder="请输入科研项目名称"
              class="form-control"
            />
          </el-form-item>
          <el-form-item label="项目级别">
            <el-select v-model="editForm.projectLevel" placeholder="请选择" class="form-control">
              <el-option
                v-for="t in PROJECT_LEVELS"
                :key="t.value"
                :label="t.label"
                :value="t.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="申报人排名">
            <el-input v-model="editForm.ranking" placeholder="如：1/3" class="form-control" />
          </el-form-item>
          <el-form-item label="项目时间">
            <el-date-picker
              v-model="editForm.projectDate"
              type="month"
              placeholder="选择年月"
              class="form-control"
            />
          </el-form-item>
          <el-form-item label="学期">
            <el-select v-model="editForm.semester" placeholder="请选择" class="form-control">
              <el-option
                v-for="s in SEMESTER_OPTIONS"
                :key="s.value"
                :label="s.label"
                :value="s.value"
              />
            </el-select>
          </el-form-item>
        </template>

        <!-- 软件著作权 -->
        <template v-if="record.type === 'softwareCopyright'">
          <el-form-item label="软件名称" required>
            <el-input
              v-model="editForm.softName"
              placeholder="请输入软件名称"
              class="form-control"
            />
          </el-form-item>
          <el-form-item label="颁发单位">
            <el-input v-model="editForm.issuer" placeholder="请输入颁发单位" class="form-control" />
          </el-form-item>
          <el-form-item label="申报人排名">
            <el-input v-model="editForm.ranking" placeholder="如：1/3" class="form-control" />
          </el-form-item>
          <el-form-item label="批准日期">
            <el-date-picker
              v-model="editForm.approveDate"
              type="month"
              placeholder="选择年月"
              class="form-control"
            />
          </el-form-item>
          <el-form-item label="学期">
            <el-select v-model="editForm.semester" placeholder="请选择" class="form-control">
              <el-option
                v-for="s in SEMESTER_OPTIONS"
                :key="s.value"
                :label="s.label"
                :value="s.value"
              />
            </el-select>
          </el-form-item>
        </template>

        <!-- 发表论文 -->
        <template v-if="record.type === 'paper'">
          <el-form-item label="论文名称" required>
            <el-input
              v-model="editForm.paperName"
              placeholder="请输入论文名称"
              class="form-control"
            />
          </el-form-item>
          <el-form-item label="发表期刊">
            <el-input
              v-model="editForm.journalName"
              placeholder="请输入期刊名称"
              class="form-control"
            />
          </el-form-item>
          <el-form-item label="申报人排名">
            <el-input v-model="editForm.ranking" placeholder="如：1/3" class="form-control" />
          </el-form-item>
          <el-form-item label="发表日期">
            <el-date-picker
              v-model="editForm.publishDate"
              type="month"
              placeholder="选择年月"
              class="form-control"
            />
          </el-form-item>
          <el-form-item label="学期">
            <el-select v-model="editForm.semester" placeholder="请选择" class="form-control">
              <el-option
                v-for="s in SEMESTER_OPTIONS"
                :key="s.value"
                :label="s.label"
                :value="s.value"
              />
            </el-select>
          </el-form-item>
        </template>

        <!-- 双创之星 -->
        <template v-if="record.type === 'innovationStar'">
          <el-form-item label="公司名称" required>
            <el-input
              v-model="editForm.companyName"
              placeholder="请输入公司名称"
              class="form-control"
            />
          </el-form-item>
          <el-form-item label="行业类型">
            <el-select v-model="editForm.industryType" placeholder="请选择" class="form-control">
              <el-option
                v-for="t in INDUSTRY_TYPES"
                :key="t.value"
                :label="t.label"
                :value="t.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="申报人排名">
            <el-input v-model="editForm.ranking" placeholder="如：1/3" class="form-control" />
          </el-form-item>
          <el-form-item label="注册时间">
            <el-date-picker
              v-model="editForm.registerDate"
              type="month"
              placeholder="选择年月"
              class="form-control"
            />
          </el-form-item>
          <el-form-item label="学期">
            <el-select v-model="editForm.semester" placeholder="请选择" class="form-control">
              <el-option
                v-for="s in SEMESTER_OPTIONS"
                :key="s.value"
                :label="s.label"
                :value="s.value"
              />
            </el-select>
          </el-form-item>
        </template>
      </el-form>
    </template>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">关闭</el-button>
      <el-button v-if="mode === 'edit'" type="primary" :loading="saving" @click="handleSave"
        >保存修改</el-button
      >
    </template>
  </el-dialog>
</template>

<style scoped>
.form-control {
  width: 360px;
}
:deep(.mb-16) {
  margin-bottom: 16px;
}
</style>
