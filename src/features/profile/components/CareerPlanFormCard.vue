<script setup lang="ts">
import type { SemesterSelectOption } from '@/shared/composables/useSemesters'
/**
 * 职业规划「填写规划」表单卡片。
 * 表单状态与草稿逻辑随表单一起内聚；提交走 useCareerPlanStore（与父页面共用同一实例，不重复请求）。
 */
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'
import { useCareerPlanStore } from '@/app/stores/stores'
import { useFormDraft } from '@/shared/composables/useFormDraft'

defineProps<{
  /** 学期下拉选项（useSemesters：后端学期 ∪ 本地生成区间的并集） */
  semesterOptions: SemesterSelectOption[]
}>()

const careerPlanStore = useCareerPlanStore()

const planForm = reactive({
  semester: '',
  title: '',
  content: '',
  requirement: '',
  goals: [] as Array<Record<string, unknown>>,
  evidenceFileIds: [] as number[],
})
const { clearDraft } = useFormDraft('career-plan', planForm)

const loading = ref(false)

async function handleSubmit() {
  if (!planForm.semester || !planForm.title) {
    ElMessage.warning('请填写学期和标题')
    return
  }
  loading.value = true
  try {
    await careerPlanStore.submitPlan({
      semester: planForm.semester,
      title: planForm.title,
      content: planForm.content,
      requirement: planForm.requirement,
      goals: planForm.goals,
      evidenceFileIds: planForm.evidenceFileIds,
    })
    clearDraft()
    planForm.semester = ''
    planForm.title = ''
    planForm.content = ''
    planForm.requirement = ''
    planForm.goals = []
    planForm.evidenceFileIds = []
    ElMessage.success('规划已提交')
  } catch (e) {
    // 「未找到学期」为前端本地校验错误（未经拦截器），需就地明确提示；其余错误拦截器已提示
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('未找到学期')) ElMessage.warning(msg)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-card class="gd-card">
    <template #header><span class="card-title">填写规划</span></template>
    <el-form :model="planForm" label-width="70px" size="default">
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
      <el-form-item>
        <el-button type="primary" :loading="loading" @click="handleSubmit">提交规划</el-button>
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

// ─── 夜间模式适配 ───
html.dark {
  .card-title {
    color: #f1f5f9;
  }
}
</style>
