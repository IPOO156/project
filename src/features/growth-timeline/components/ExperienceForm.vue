<script setup lang="ts">
import type { GrowthExperienceInput } from '../timeline-constants'
import { Plus } from 'lucide-vue-next'
import { computed, reactive, ref, watch } from 'vue'
import { useSubmissionStore } from '@/app/stores/stores'
import { activityCategoryOf } from '@/shared/api/submission'
import { inferSemester } from '../timeline-constants'

interface Props {
  visible: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'submit', payload: GrowthExperienceInput): void
}>()

interface SkillForm {
  name: string
  growth: number
}

interface FormState {
  title: string
  date: string
  description: string
  tags: string
  skills: SkillForm[]
  /** 关联来源记录 ID（4.2.1 sourceId） */
  sourceId?: number
}

const submissionStore = useSubmissionStore()
const form = reactive<FormState>({
  title: '',
  date: '',
  description: '',
  tags: '',
  skills: [{ name: '', growth: 0 }],
  sourceId: undefined,
})

const submitting = ref(false)

/** 可关联来源：已提交（待审核/已通过）的申报/报名记录，按 activityCategoryOf 归类为 4.2.1 的 archives / award_applications */
const sourceOptions = computed(() =>
  submissionStore.records
    .filter((r) => r.status === 'approved' || r.status === 'pending')
    .map((r) => ({
      id: Number(r.id),
      sourceType: activityCategoryOf(r.type) === 'award' ? 'award_applications' : 'archives',
      label: `${r.title}（${r.typeLabel} · ${r.status === 'approved' ? '已通过' : '待审核'}）`,
    })),
)

function reset() {
  form.title = ''
  form.date = ''
  form.description = ''
  form.tags = ''
  form.skills = [{ name: '', growth: 0 }]
  form.sourceId = undefined
}

function addSkill() {
  form.skills.push({ name: '', growth: 0 })
}

function removeSkill(index: number) {
  form.skills.splice(index, 1)
}

function handleSubmit() {
  if (!form.title || !form.date) return
  submitting.value = true

  const selected = sourceOptions.value.find((o) => o.id === form.sourceId)
  setTimeout(() => {
    emit('submit', {
      title: form.title,
      date: form.date,
      description: form.description,
      tags: form.tags
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean),
      skills: form.skills.filter((s) => s.name),
      ...(selected ? { sourceId: selected.id, sourceType: selected.sourceType } : {}),
    })
    submitting.value = false
    reset()
    emit('update:visible', false)
  }, 400)
}

watch(
  () => props.visible,
  async (val) => {
    reset()
    if (val && submissionStore.records.length === 0) {
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

      <el-form-item label="关联来源">
        <el-select
          v-model="form.sourceId"
          placeholder="选择已提交的申报/报名记录（可选）"
          clearable
          class="source-select"
        >
          <el-option
            v-for="opt in sourceOptions"
            :key="opt.id"
            :label="opt.label"
            :value="opt.id"
          />
        </el-select>
        <div class="source-hint">
          选择后该经历关联所选记录并提交至后端落库；不选择时仅保留在本地（接口要求来源必填）。
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
          <el-input v-model="skill.name" placeholder="能力名称" />
          <el-slider v-model="skill.growth" :min="0" :max="100" show-stops class="skill-slider" />
          <el-button v-if="form.skills.length > 1" text type="danger" @click="removeSkill(index)">
            删除
          </el-button>
        </div>
        <el-button text type="primary" :icon="Plus" @click="addSkill">添加能力</el-button>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
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
