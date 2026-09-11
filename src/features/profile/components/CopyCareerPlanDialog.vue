<script setup lang="ts">
import type { SemesterOption } from '@/shared/api/common'
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { copyCareerPlan } from '@/shared/api/career-plan'
import { getSemesters } from '@/shared/api/common'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

const loading = ref(false)
const submitting = ref(false)
const semesters = ref<SemesterOption[]>([])

const form = reactive({
  sourceSemesterId: null as number | null,
  targetSemesterId: null as number | null,
  title: '',
})

const valid = computed(() => form.sourceSemesterId != null && form.targetSemesterId != null)

async function fetchSemesters() {
  loading.value = true
  try {
    semesters.value = await getSemesters()
  } catch {
    // 接口失败已由请求拦截器统一提示
  } finally {
    loading.value = false
  }
}

onMounted(fetchSemesters)

async function handleSubmit() {
  if (form.sourceSemesterId == null || form.targetSemesterId == null) {
    ElMessage.warning('请选择源学期与目标学期')
    return
  }
  if (form.sourceSemesterId === form.targetSemesterId) {
    ElMessage.warning('源学期与目标学期不能相同')
    return
  }
  submitting.value = true
  try {
    await copyCareerPlan({
      sourceSemesterId: form.sourceSemesterId,
      targetSemesterId: form.targetSemesterId,
      title: form.title.trim() || undefined,
    })
    ElMessage.success('已复制上一学期计划，生成草稿')
    emit('success')
    handleClose()
  } catch {
    // 接口失败已由请求拦截器统一提示
  } finally {
    submitting.value = false
  }
}

function handleClose() {
  form.sourceSemesterId = null
  form.targetSemesterId = null
  form.title = ''
  emit('close')
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="复制上一学期计划"
    width="480px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form v-loading="loading" label-width="90px">
      <el-form-item label="源学期" required>
        <el-select v-model="form.sourceSemesterId" placeholder="请选择要复制的学期" class="form-w">
          <el-option v-for="s in semesters" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="目标学期" required>
        <el-select v-model="form.targetSemesterId" placeholder="请选择复制到的学期" class="form-w">
          <el-option v-for="s in semesters" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="新标题">
        <el-input v-model="form.title" placeholder="不填则自动生成标题" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" :disabled="!valid" @click="handleSubmit">
        复制
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.form-w {
  width: 100%;
}
</style>
