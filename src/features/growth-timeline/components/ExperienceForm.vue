<script setup lang="ts">
import type { GrowthExperience, GrowthExperienceInput } from '../timelineConstants'
import { ElMessage } from 'element-plus'
import { computed, reactive, ref, watch } from 'vue'
import { useSubmissionStore } from '@/app/stores/stores'
import { activityCategoryOf } from '@/shared/api/submission'

interface Props {
  visible: boolean
  /** 传入时为编辑模式：表单回填该经历，提交走修改接口；不传为新增 */
  editing?: GrowthExperience | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'submit', payload: GrowthExperienceInput, done: (ok: boolean) => void): void
}>()

interface FormState {
  title: string
  date: string
  description: string
  tags: string
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
  sourceKey: '',
})

const submitting = ref(false)
const isEdit = computed(() => Boolean(props.editing))

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
  form.sourceKey = ''
}

/** 编辑模式回填：来源关联不在编辑时改动，故不回填 sourceKey */
function prefill(experience: GrowthExperience) {
  form.title = experience.title
  form.date = experience.date
  form.description = experience.description
  form.tags = experience.tags.join(', ')
  form.sourceKey = ''
}

function handleSubmit() {
  if (!form.title.trim() || !form.date) {
    ElMessage.warning('请填写经历标题和发生日期')
    return
  }
  if (submitting.value) return

  const selected = sourceOptions.value.find((o) => o.key === form.sourceKey)
  if (!isEdit.value && !selected) {
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
    if (!val) return
    if (props.editing) {
      prefill(props.editing)
    } else {
      reset()
    }
    if (!props.editing && submissionStore.records.length === 0) {
      // 打开弹窗时确保来源记录已加载（成长时间轴页本身不拉申报列表）
      await submissionStore.fetchRecords()
    }
  },
)
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? '编辑成长经历' : '添加成长经历'"
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

      <el-form-item v-if="!isEdit" label="关联来源" required>
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
    </el-form>

    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button
        type="primary"
        :loading="submitting"
        :disabled="!isEdit && sourceOptions.length === 0"
        @click="handleSubmit"
        >确定</el-button
      >
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
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
