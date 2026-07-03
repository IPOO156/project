<script setup lang="ts">
import type { GrowthExperience } from '../timeline-constants'
import { Plus } from 'lucide-vue-next'
import { reactive, ref, watch } from 'vue'
import { inferSemester } from '../timeline-constants'

interface Props {
  visible: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'submit', payload: Omit<GrowthExperience, 'id' | 'semester'>): void
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
}

const form = reactive<FormState>({
  title: '',
  date: '',
  description: '',
  tags: '',
  skills: [{ name: '', growth: 0 }],
})

const submitting = ref(false)

function reset() {
  form.title = ''
  form.date = ''
  form.description = ''
  form.tags = ''
  form.skills = [{ name: '', growth: 0 }]
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
    })
    submitting.value = false
    reset()
    emit('update:visible', false)
  }, 400)
}

watch(
  () => props.visible,
  (val) => {
    if (!val) reset()
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
</style>
