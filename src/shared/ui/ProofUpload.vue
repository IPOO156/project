<script setup lang="ts">
import type { UploadFile, UploadUserFile } from 'element-plus'

interface Props {
  modelValue?: UploadUserFile[]
  accept?: string
  tip?: string
}

withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  accept: '',
  tip: '支持 jpg、png、pdf 格式',
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
    :file-list="modelValue"
    :accept="accept"
    @change="handleChange"
  >
    <el-button type="primary" plain>上传文件</el-button>
    <template #tip>
      <div class="el-upload__tip">{{ tip }}</div>
    </template>
  </el-upload>
</template>
