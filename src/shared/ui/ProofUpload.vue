<script setup lang="ts">
import type { UploadFile, UploadUserFile } from 'element-plus'
import { Upload } from 'lucide-vue-next'

interface Props {
  modelValue?: UploadUserFile[]
  accept?: string
  tip?: string
}

withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  accept: '',
  tip: '支持 jpg、png、pdf 格式，单个文件不超过 10MB',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: UploadUserFile[]): void
}>()

function handleChange(_file: UploadFile, fileList: UploadUserFile[]) {
  emit('update:modelValue', fileList)
}
</script>

<template>
  <el-upload
    action="#"
    :auto-upload="false"
    list-type="text"
    drag
    :file-list="modelValue"
    :accept="accept"
    @change="handleChange"
  >
    <div class="upload-dragger">
      <Upload :size="36" class="upload-dragger__icon" />
      <p class="upload-dragger__title">点击或拖拽文件到此区域上传</p>
      <p class="upload-dragger__tip">{{ tip }}</p>
    </div>
  </el-upload>
</template>

<style scoped lang="scss">
.upload-dragger {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 0;

  &__icon {
    color: var(--el-color-primary);
    opacity: 0.6;
  }

  &__title {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin: 0;
  }

  &__tip {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    margin: 0;
  }
}
</style>
