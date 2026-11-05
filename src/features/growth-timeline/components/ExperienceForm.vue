<script setup lang="ts">
import type { GrowthExperienceInput } from '../timelineConstants'
import { ElMessage } from 'element-plus'
import { Plus } from 'lucide-vue-next'
import { computed, reactive, ref, watch } from 'vue'
import { useSubmissionStore } from '@/app/stores/stores'
import { getAbilityDimensionOptions } from '@/shared/api/archive'
import { activityCategoryOf } from '@/shared/api/submission'
import { inferSemester } from '../timelineConstants'

interface Props {
  visible: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'submit', payload: GrowthExperienceInput, done: (ok: boolean) => void): void
}>()

interface SkillForm {
  /** 能力维度编码（后端 abilityData.dimensionCode，不能提交用户自由输入的名称） */
  dimensionCode: string
  name: string
  growth: number
}

interface FormState {
  title: string
  date: string
  description: string
  tags: string
  skills: SkillForm[]
  /**
   * 关联来源的唯一键（sourceType:id）。
   * 申报记录与奖项报名是两张表，数字 id 可能重复，直接用 id 会选错来源。
   */
  sourceKey: string
}

const submissionStore = useSubmissionStore()
const form = reactive<FormState>({
  title: '',
  date: '',
  description: '',
  tags: '',
  skills: [{ dimensionCode: '', name: '', growth: 0 }],
  sourceKey: '',
})

const submitting = ref(false)

// ── 能力维度选项（GET /archive/dimensions）──
const dimensions = ref<Array<{ dimensionCode: string; dimensionName: string }>>([])
const dimensionLoading = ref(false)
const dimensionLoadFailed = ref(false)

async function loadDimensions() {
  if (dimensions.value.length || dimensionLoading.value) return
  dimensionLoading.value = true
  dimensionLoadFailed.value = false
  try {
    dimensions.value = await getAbilityDimensionOptions()
  } catch {
    // 拉取失败时禁用能力选择，避免提交无法映射的假编码
    dimensionLoadFailed.value = true
  } finally {
    dimensionLoading.value = false
  }
}

/** 可关联来源：已提交（待审核/已通过）的申报/报名记录，按 activityCategoryOf 归类为 4.2.1 的 archives / award_applications */
const sourceOptions = computed(() =>
  submissionStore.records
    .filter((r) => r.status === 'approved' || r.status === 'pending')
    .map((r) => {
      const sourceType = activityCategoryOf(r.type) === 'award' ? 'award_applications' : 'archives'
      return {
        key: `${sourceType}:${r.id}`,
        id: Number(r.id),
        sourceType,
        label: `${r.title}（${r.typeLabel} · ${r.status === 'approved' ? '已通过' : '待审核'}）`,
      }
    }),
)

function reset() {
  form.title = ''
  form.date = ''
  form.description = ''
  form.tags = ''
  form.skills = [{ dimensionCode: '', name: '', growth: 0 }]
  form.sourceKey = ''
}

function addSkill() {
  form.skills.push({ dimensionCode: '', name: '', growth: 0 })
}

function removeSkill(index: number) {
  form.skills.splice(index, 1)
}

function onDimensionChange(skill: SkillForm, code: string) {
  const dimension = dimensions.value.find((d) => d.dimensionCode === code)
  skill.name = dimension?.dimensionName ?? code
}

function handleSubmit() {
  if (!form.title.trim() || !form.date) {
    ElMessage.warning('请填写经历标题和发生日期')
    return
  }
  const skills = form.skills.filter((s) => s.dimensionCode)
  const codes = skills.map((s) => s.dimensionCode)
  if (new Set(codes).size !== codes.length) {
    ElMessage.warning('同一能力维度只能填写一次')
    return
  }
  if (submitting.value) return

  const selected = sourceOptions.value.find((o) => o.key === form.sourceKey)
  if (!selected) {
    ElMessage.warning('请选择关联来源记录：成长经历必须关联一条已提交的申报/报名记录')
    return
  }
  submitting.value = true
  emit(
    'submit',
    {
      title: form.title.trim(),
      date: form.date,
      description: form.description,
      tags: form.tags
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean),
      skills,
      ...(selected ? { sourceId: selected.id, sourceType: selected.sourceType } : {}),
    },
    (ok) => {
      submitting.value = false
      if (!ok) {
        // 保存失败：保留弹窗与已填内容，用户可修改后重试
        return
      }
      reset()
      emit('update:visible', false)
    },
  )
}

watch(
  () => props.visible,
  async (val) => {
    reset()
    if (!val) return
    void loadDimensions()
    if (submissionStore.records.length === 0) {
      // 打开弹窗时确保来源记录已加载（成长时间轴页本身不拉申报列表）
      await submissionStore.fetchRecords()
    }
  },
)
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="添加成长经历"
    width="560px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:visible', $event)"
  >
    <el-form :model="form" label-width="90px">
      <el-form-item label="经历标题" required>
        <el-input v-model="form.title" placeholder="例如：第一次竞赛获奖" />
      </el-form-item>

      <el-form-item label="发生日期" required>
        <el-date-picker
          v-model="form.date"
          type="date"
          placeholder="选择日期"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item label="学期">
        <el-input :value="form.date ? inferSemester(form.date) : ''" disabled />
      </el-form-item>

      <el-form-item label="关联来源" required>
        <el-select
          v-model="form.sourceKey"
          :placeholder="
            sourceOptions.length ? '选择已提交的申报/报名记录' : '暂无可关联的申报/报名记录'
          "
          :disabled="sourceOptions.length === 0"
          clearable
          class="source-select"
        >
          <el-option
            v-for="opt in sourceOptions"
            :key="opt.key"
            :label="opt.label"
            :value="opt.key"
          />
        </el-select>
        <div class="source-hint">
          每条成长经历必须关联一条已有的申报/报名记录，选择后便于在详情中追溯。
        </div>
      </el-form-item>

      <el-form-item label="经历描述">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="4"
          placeholder="描述这段经历带给你的成长..."
        />
      </el-form-item>

      <el-form-item label="标签">
        <el-input v-model="form.tags" placeholder="用逗号分隔，如：竞赛, 技术, 团队" />
      </el-form-item>

      <el-form-item label="能力成长">
        <div v-for="(skill, index) in form.skills" :key="index" class="skill-input-row">
          <el-select
            v-model="skill.dimensionCode"
            placeholder="选择能力维度"
            clearable
            filterable
            :loading="dimensionLoading"
            :disabled="dimensionLoadFailed"
            class="skill-select"
            @change="(code: string) => onDimensionChange(skill, code)"
          >
            <el-option
              v-for="d in dimensions"
              :key="d.dimensionCode"
              :label="d.dimensionName"
              :value="d.dimensionCode"
            />
          </el-select>
          <el-slider v-model="skill.growth" :min="0" :max="100" show-stops class="skill-slider" />
          <el-button v-if="form.skills.length > 1" text type="danger" @click="removeSkill(index)">
            删除
          </el-button>
        </div>
        <el-button
          text
          type="primary"
          :icon="Plus"
          :disabled="dimensionLoadFailed"
          @click="addSkill"
          >添加能力</el-button
        >
        <div v-if="dimensionLoadFailed" class="source-hint">
          能力维度加载失败，可暂不填写能力成长，稍后重试。
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button
        type="primary"
        :loading="submitting"
        :disabled="sourceOptions.length === 0"
        @click="handleSubmit"
        >确定</el-button
      >
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.skill-input-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.skill-select {
  width: 180px;
  flex-shrink: 0;
}

.skill-slider {
  width: 160px;
}

.source-select {
  width: 100%;
}

.source-hint {
  width: 100%;
  font-size: 12px;
  line-height: 1.5;
  margin-top: 4px;
  color: var(--el-text-color-secondary);
}
</style>
