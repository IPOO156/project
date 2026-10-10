<script setup lang="ts">
/**
 * MajorCreateDialog - 新增专业弹窗（组织架构页子组件）
 * 新建：POST /admin/majors。通过父组件 ref 暴露 open(collegeId?) 打开。
 */
import type { OrgCollegeItem, OrgMajorCreatePayload } from '@/shared/types/teacher'
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'

import { createMajor } from '@/shared/api/teacher'

const props = defineProps<{ colleges: OrgCollegeItem[] }>()

const emit = defineEmits<{ (e: 'saved'): void }>()

const visible = ref(false)
const saving = ref(false)
const form = reactive({
  collegeId: undefined as number | undefined,
  majorName: '',
  majorCode: '',
  status: 1,
})

function open(collegeId?: number) {
  form.collegeId = collegeId
  form.majorName = ''
  form.majorCode = ''
  form.status = 1
  visible.value = true
}

async function submit() {
  if (!form.collegeId) {
    ElMessage.warning('请选择所属学院')
    return
  }
  const majorName = form.majorName.trim()
  if (!majorName) {
    ElMessage.warning('请填写专业名称')
    return
  }
  const payload: OrgMajorCreatePayload = {
    collegeId: form.collegeId,
    majorName,
    majorCode: form.majorCode.trim() || undefined,
    status: form.status,
  }
  saving.value = true
  try {
    await createMajor(payload)
    ElMessage.success('专业已创建')
    visible.value = false
    emit('saved')
  } catch {
    /* 拦截器已提示 */
  } finally {
    saving.value = false
  }
}

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="visible" title="新增专业" width="520px">
    <el-form label-width="96px" @submit.prevent>
      <el-form-item label="所属学院" required>
        <el-select
          v-model="form.collegeId"
          placeholder="选择该专业所属学院"
          filterable
          style="width: 100%"
        >
          <el-option
            v-for="item in props.colleges"
            :key="item.collegeId"
            :label="item.collegeName"
            :value="item.collegeId"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="专业名称" required>
        <el-input v-model="form.majorName" placeholder="如 计算机科学与技术" maxlength="50" />
      </el-form-item>
      <el-form-item label="专业代码">
        <el-input
          v-model="form.majorCode"
          class="major-create-dialog__short"
          placeholder="如 08xx"
          maxlength="20"
        />
        <span class="major-create-dialog__tip">专业代码非必填</span>
      </el-form-item>
      <el-form-item label="状态">
        <el-switch
          v-model="form.status"
          :active-value="1"
          :inactive-value="0"
          active-text="启用"
          inactive-text="禁用"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="saving" @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" :disabled="saving" @click="submit">
        新增专业
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.major-create-dialog {
  &__short {
    width: 120px;
  }

  &__tip {
    margin-left: $spacing-md;
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }
}
</style>
