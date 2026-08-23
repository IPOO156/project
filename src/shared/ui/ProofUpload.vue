<script setup lang="ts">
import type { UploadFile, UploadUserFile } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Upload } from 'lucide-vue-next'
import { ref } from 'vue'
import { deleteFile, uploadFile } from '@/shared/api/common'

interface Props {
  modelValue?: UploadUserFile[]
  accept?: string
  tip?: string
  /** 所属模块（POST /common/upload 的 module），如 competition/scholarship/practice…，缺省 archive */
  module?: string
  /** 记录状态：''（新建）/draft/rejected/withdrawn 允许删除附件；pending/approved 禁止（2.1.3） */
  status?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  accept: '',
  tip: '支持 jpg、png、pdf 格式，单个文件不超过 10MB',
  module: 'archive',
  status: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: UploadUserFile[]): void
}>()

const uploading = ref(false)

/** 2.1.3：仅"未关联 / 草稿 / 已退回"记录允许删除附件，已通过禁止 */
function canDeleteFile() {
  return (
    !props.status ||
    props.status === 'draft' ||
    props.status === 'rejected' ||
    props.status === 'withdrawn'
  )
}

/** 移除已上传文件时调用 DELETE /common/files/{fileId}（2.1.3） */
function handleRemove(file: UploadFile) {
  const fileId = (file as any).fileId
  if (typeof fileId === 'number') {
    deleteFile(fileId).catch(() => {
      // 删除失败（如文件已被业务关联，仅未关联可删）：静默处理
    })
  }
}

/**
 * 文件选中后逐个真实上传（POST /common/upload），成功后回填 fileId，
 * 提交映射（submission.ts toEvidenceFileIds）据此生成 evidenceFileIds。
 */
async function handleChange(_file: UploadFile, fileList: UploadUserFile[]) {
  const pending = fileList.filter((f) => !(f as any).fileId && f.status !== 'uploading')
  if (pending.length === 0) {
    emit('update:modelValue', [...fileList])
    return
  }
  uploading.value = true
  try {
    for (const f of pending) {
      const raw = f.raw
      if (!raw) continue
      f.status = 'uploading'
      emit('update:modelValue', [...fileList])
      try {
        const res = await uploadFile({ file: raw, type: 'evidence', module: props.module })
        ;(f as any).fileId = res.fileId
        f.status = 'success'
        emit('update:modelValue', [...fileList])
      } catch (e: any) {
        f.status = 'fail'
        // 响应拦截器已 toast 业务错误；这里仅兜底"静默 404"等无 message 的场景，避免重复弹窗
        const msg = (e as any)?.response?.data?.message || (e as Error)?.message
        if (!msg) ElMessage.error('文件上传失败，请重试')
        emit('update:modelValue', [...fileList])
      }
    }
  } finally {
    uploading.value = false
    // 失败文件移出列表，避免把未上传成功的文件带进 evidenceFileIds
    const kept = fileList.filter(
      (f) => f.status === 'success' || f.status === 'uploading' || (f as any).fileId,
    )
    emit('update:modelValue', kept)
  }
}

/** 禁止删除时拦截（2.1.3：已提交/已通过记录不可删附件） */
function handleBeforeRemove() {
  if (!canDeleteFile()) {
    ElMessage.warning('该记录已提交或已通过，附件不可删除（如需调整请走"更正"流程）')
    return false
  }
  return true
}
</script>

<template>
  <el-upload
    action="#"
    :auto-upload="false"
    list-type="text"
    drag
    :disabled="uploading"
    :file-list="modelValue"
    :accept="accept"
    :before-remove="handleBeforeRemove"
    @change="handleChange"
    @remove="handleRemove"
  >
    <div class="upload-dragger">
      <Upload :size="36" class="upload-dragger__icon" />
      <p class="upload-dragger__title">
        {{ uploading ? '文件上传中…' : '点击或拖拽文件到此区域上传' }}
      </p>
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
