<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
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
const formRef = ref<FormInstance>()

/**
 * 表单项校验：关联来源必须有已通过记录可选。
 * 之前只靠 ElMessage 提示，3 秒后消失，用户会觉得「点确定没反应」。
 */
const rules: FormRules<FormState> = {
  title: [{ required: true, whitespace: true, message: '请填写经历标题', trigger: 'blur' }],
  date: [{ required: true, message: '请选择发生日期', trigger: 'change' }],
  sourceKey: [{ required: true, message: '请选择关联来源记录', trigger: 'change' }],
}

/**
 * 活动分类 → 后端 4.2.1 支持的来源模型类型（sourceType）。
 * 职业规划来自 career_plans 表，必须用 career_plans：此前一并归到 archives，
 * 后端按 archives 查不到该 sourceId，创建失败（页面表现为点「确定」没反应）。
 */
const SOURCE_TYPE_BY_CATEGORY: Record<string, string> = {
  archive: 'archives',
  award: 'award_applications',
  career_plan: 'career_plans',
}

/**
 * 可关联来源：只允许「已通过」的申报/奖项/职业规划记录。
 * 后端 4.2.1 明确带审批态的来源仅 status=2(已通过) 可加入成长轴，
 * 待审批/已退回/已撤销会返回 40002，因此这里不能把待审核记录列成可选项。
 */
const sourceOptions = computed(() =>
  submissionStore.records.flatMap((r) => {
    if (r.status !== 'approved') return []
    const sourceType = SOURCE_TYPE_BY_CATEGORY[activityCategoryOf(r.type)]
    // 兜底：后端未声明支持的来源类型不列入选项，避免带错 sourceId 提交
    if (!sourceType) return []
    return [
      {
        key: `${sourceType}:${r.id}`,
        id: Number(r.id),
        sourceType,
        label: `${r.title}（${r.typeLabel} · 已通过）`,
      },
    ]
  }),
)

function reset() {
  form.title = ''
  form.date = ''
  form.description = ''
  form.tags = ''
  form.sourceKey = ''
  formRef.value?.clearValidate()
}

/** 编辑模式回填：来源关联不在编辑时改动，故不回填 sourceKey */
function prefill(experience: GrowthExperience) {
  form.title = experience.title
  form.date = experience.date
  form.description = experience.description
  form.tags = experience.tags.join(', ')
  form.sourceKey = ''
}

async function handleSubmit() {
  if (submitting.value) return

  if (!isEdit.value && sourceOptions.value.length === 0) {
    ElMessage.warning('暂无可关联的来源记录：仅审批通过的申报/奖项/职业规划记录可加入成长轴')
    return
  }
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  const selected = sourceOptions.value.find((o) => o.key === form.sourceKey)
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
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-form-item label="经历标题" prop="title">
        <el-input v-model="form.title" placeholder="例如：第一次竞赛获奖" />
      </el-form-item>

      <el-form-item label="发生日期" prop="date">
        <el-date-picker
          v-model="form.date"
          type="date"
          placeholder="选择日期"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item v-if="!isEdit" label="关联来源" prop="sourceKey">
        <el-select
          v-model="form.sourceKey"
          :placeholder="
            sourceOptions.length
              ? '选择已审批通过的申报/奖项/职业规划记录'
              : '暂无可关联的已通过记录'
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
          仅「已审批通过」的申报/奖项/职业规划记录可关联，选择后便于在详情中追溯。
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
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
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
