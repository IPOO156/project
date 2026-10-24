<script setup lang="ts">
import type { UploadFile } from 'element-plus'
import type { SemesterItem } from '@/shared/types/teacher'
import { Upload } from 'lucide-vue-next'

defineProps<{
  semesters: SemesterItem[]
  importing: boolean
}>()

const emit = defineEmits<{
  (e: 'fileChange', file: UploadFile): void
  (e: 'fileRemove'): void
  (e: 'submit'): void
}>()
const visible = defineModel<boolean>({ required: true })
const semesterId = defineModel<number | null>('semesterId', { required: true })
const overwrite = defineModel<boolean>('overwrite', { required: true })

function handleFileChange(file: UploadFile) {
  emit('fileChange', file)
}

function handleFileRemove() {
  emit('fileRemove')
}
</script>

<template>
  <el-dialog v-model="visible" title="导入学生成绩" width="480px">
    <el-form label-width="90px">
      <el-form-item label="所属学期" required>
        <el-select
          v-model="semesterId"
          class="u-w-full"
          placeholder="请选择学期"
          :loading="!semesters.length"
        >
          <el-option v-for="s in semesters" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="成绩文件" required>
        <el-upload
          class="u-w-full"
          drag
          :auto-upload="false"
          :limit="1"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          accept=".xlsx,.csv"
        >
          <div class="grade-import__upload">
            <Upload :size="36" class="grade-import__upload-icon" />
            <p class="grade-import__upload-title">拖拽文件到此处，或点击选择</p>
            <p class="grade-import__upload-desc">仅支持 .xlsx / .csv 格式</p>
          </div>
        </el-upload>
      </el-form-item>
      <el-form-item label="覆盖已存在">
        <el-switch v-model="overwrite" />
        <span class="grade-import__hint">开启后同学生同课程已有成绩将被覆盖</span>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="importing" @click="emit('submit')">
        {{ importing ? '正在上传并创建任务…' : '开始导入' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.grade-import {
  &__upload {
    padding: $spacing-lg;
    text-align: center;
    &-icon {
      color: var(--el-color-primary);
      margin-bottom: 6px;
    }
    &-title {
      font-size: 14px;
      color: var(--el-text-color-primary);
      margin-bottom: 4px;
    }
    &-desc {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
  &__hint {
    margin-left: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>
