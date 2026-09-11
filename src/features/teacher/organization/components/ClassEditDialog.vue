<script setup lang="ts">
/**
 * ClassEditDialog - 新增 / 编辑班级弹窗（组织架构页子组件）
 * 新建：POST /admin/classes；编辑（含启停）：PUT /admin/classes/{id}。
 * 通过父组件 ref 暴露 openCreate(majorId?) / openEdit(row) 打开。
 */
import type { OrgClassItem, OrgClassSavePayload, OrgMajorItem } from '@/shared/types/teacher'
import { ElMessage } from 'element-plus'
import { computed, reactive, ref } from 'vue'

import { createClass, updateClass } from '@/shared/api/teacher'

const props = defineProps<{ majors: OrgMajorItem[] }>()

const emit = defineEmits<{ (e: 'saved'): void }>()

const visible = ref(false)
const saving = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({
  majorId: undefined as number | undefined,
  className: '',
  grade: '',
  status: 1,
})

const title = computed(() => (editingId.value != null ? '编辑班级' : '新增班级'))
const confirmText = computed(() => (editingId.value != null ? '保存修改' : '新增班级'))

function openCreate(majorId?: number) {
  editingId.value = null
  form.majorId = majorId
  form.className = ''
  form.grade = ''
  form.status = 1
  visible.value = true
}

function openEdit(row: OrgClassItem) {
  editingId.value = row.classId
  form.majorId = row.majorId ?? undefined
  form.className = row.className
  form.grade = row.grade ?? ''
  form.status = row.status === 0 ? 0 : 1
  visible.value = true
}

async function submit() {
  if (!form.majorId) {
    ElMessage.warning('请选择所属专业')
    return
  }
  const className = form.className.trim()
  if (!className) {
    ElMessage.warning('请填写班级名称')
    return
  }
  const payload: OrgClassSavePayload = {
    majorId: form.majorId,
    className,
    grade: form.grade.trim() || undefined,
    status: form.status,
  }
  saving.value = true
  try {
    if (editingId.value != null) {
      await updateClass(editingId.value, payload)
      ElMessage.success('班级信息已更新')
    } else {
      await createClass(payload)
      ElMessage.success('班级已创建')
    }
    visible.value = false
    emit('saved')
  } catch {
    /* 拦截器已提示 */
  } finally {
    saving.value = false
  }
}

defineExpose({ openCreate, openEdit })
</script>

<template>
  <el-dialog v-model="visible" :title="title" width="520px">
    <el-form label-width="96px" @submit.prevent>
      <el-form-item label="所属专业" required>
        <el-select
          v-model="form.majorId"
          placeholder="选择该班级所属专业"
          filterable
          style="width: 100%"
        >
          <el-option
            v-for="item in props.majors"
            :key="item.majorId"
            :label="item.majorName"
            :value="item.majorId"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="班级名称" required>
        <el-input
          v-model="form.className"
          placeholder="如 计科2401班"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="入学年级">
        <el-input
          v-model="form.grade"
          class="class-edit-dialog__short"
          placeholder="如 2024"
          maxlength="10"
        />
        <span class="class-edit-dialog__tip">年级非必填，填写入学年份即可</span>
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
        {{ confirmText }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.class-edit-dialog {
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
