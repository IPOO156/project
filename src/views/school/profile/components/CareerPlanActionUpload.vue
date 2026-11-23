<script setup lang="ts">
import type { UploadFile } from 'element-plus'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'
import { uploadCareerActionFile } from '@/shared/api/career-plan'
import { uploadFile } from '@/shared/api/common'

const props = defineProps<{
  visible: boolean
  planId: number | null
  actionId: number | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

const selectedFile = ref<File | null>(null)
const submitting = ref(false)

function handleFileChange(file: UploadFile) {
  selectedFile.value = file.raw ?? null
}

function handleFileRemove() {
  selectedFile.value = null
}

async function handleSubmit() {
  if (props.planId == null || props.actionId == null) return
  if (!selectedFile.value) {
    ElMessage.warning('请先选择要上传的成果文件')
    return
  }
  submitting.value = true
  try {
    const uploaded = await uploadFile({
      file: selectedFile.value,
      type: 'plan',
      module: 'career_plan',
    })
    await uploadCareerActionFile(props.planId, props.actionId, uploaded.fileId)
    ElMessage.success('行动成果上传成功')
    emit('success')
    handleClose()
  } catch {
    // 接口失败已由请求拦截器统一提示
  } finally {
    submitting.value = false
  }
}

function handleClose() {
  selectedFile.value = null
  emit('close')
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="上传行动成果"
    width="480px"
    :close-on-click-modal="false"
    destroy-on-close
    @close="handleClose"
  >
    <el-upload
      drag
      :auto-upload="false"
      :limit="1"
      :on-change="handleFileChange"
      :on-remove="handleFileRemove"
    >
      <div class="upload-tip">点击或拖拽文件到此处上传行动成果</div>
    </el-upload>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button
        type="primary"
        :loading="submitting"
        :disabled="!selectedFile"
        @click="handleSubmit"
      >
        上传
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.upload-tip {
  padding: 16px 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  text-align: center;
}
</style>
