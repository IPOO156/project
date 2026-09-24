<script setup lang="ts">
import type { UploadFile, UploadInstance, UploadUserFile } from 'element-plus'
import { ElImageViewer, ElMessage } from 'element-plus'
import { Eye, Trash2, Upload } from 'lucide-vue-next'
import { reactive, ref } from 'vue'
import { deleteFile, previewFile, uploadFile } from '@/shared/api/common'

interface Props {
  accept?: string
  tip?: string
  /** 所属模块（POST /common/upload 的 module），如 competition/scholarship/practice…，缺省 archive */
  module?: string
  /** 记录状态：''（新建）/draft/rejected/withdrawn 允许删除附件；pending/approved 禁止（2.1.3） */
  status?: string
}

const props = withDefaults(defineProps<Props>(), {
  accept: '',
  tip: '支持 jpg、png、pdf 格式，单个文件不超过 10MB',
  module: 'archive',
  status: '',
})

/** 附件列表（对外契约 fileList / update:fileList，调用方以 v-model:file-list 绑定） */
const fileList = defineModel<UploadUserFile[]>('fileList', { default: () => [] })

/** 上传附件（运行时由上传结果回填 fileId，提交映射据此生成 evidenceFileIds） */
interface EvidenceUploadFile extends UploadUserFile {
  fileId?: number
}

const uploadRef = ref<UploadInstance>()
const uploading = ref(false)
/** 各文件实时上传百分比（uid → 0~100） */
const progressMap = reactive<Record<number, number>>({})
const previewing = ref(false)
const imageViewerVisible = ref(false)
const imageViewerUrl = ref('')

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']

/** 读取文件回填的 fileId（后端返回后写入，未上传成功则为 undefined） */
function getFileId(file: UploadFile | UploadUserFile): number | undefined {
  const fileId = (file as EvidenceUploadFile).fileId
  return typeof fileId === 'number' ? fileId : undefined
}

/** 2.1.3：仅"未关联 / 草稿 / 已退回"记录允许删除附件，已通过禁止 */
function canDeleteFile() {
  return (
    !props.status ||
    props.status === 'draft' ||
    props.status === 'rejected' ||
    props.status === 'withdrawn'
  )
}

/** 移除文件（el-upload internal handleRemove 触发）：调用 DELETE 并回写父级列表 */
function handleRemove(file: UploadFile, list: UploadFile[]) {
  const fileId = getFileId(file)
  if (typeof fileId === 'number') {
    deleteFile(fileId).catch(() => {
      // 删除失败（如文件已被业务关联，仅未关联可删）：静默处理
    })
  }
  fileList.value = [...list]
}

/**
 * 文件选中后逐个真实上传（POST /common/upload），成功后回填 fileId，
 * 提交映射（submission.ts toEvidenceFileIds）据此生成 evidenceFileIds。
 */
async function handleChange(_file: UploadFile, list: UploadUserFile[]) {
  const pending = list.filter((f) => getFileId(f) === undefined && f.status !== 'uploading')
  if (pending.length === 0) {
    fileList.value = [...list]
    return
  }
  uploading.value = true
  try {
    for (const f of pending) {
      const raw = f.raw
      const uid = f.uid
      if (!raw) continue
      f.status = 'uploading'
      if (typeof uid === 'number') progressMap[uid] = 0
      fileList.value = [...list]
      try {
        const res = await uploadFile({
          file: raw,
          type: 'evidence',
          module: props.module,
          onUploadProgress: (e) => {
            if (typeof uid === 'number' && e.total && e.total > 0) {
              progressMap[uid] = Math.round((e.loaded / e.total) * 100)
            }
          },
        })
        ;(f as EvidenceUploadFile).fileId = res.fileId
        f.status = 'success'
        fileList.value = [...list]
      } catch (e) {
        f.status = 'fail'
        // 响应拦截器已 toast 业务错误；这里仅兜底"静默 404"等无 message 的场景，避免重复弹窗
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (e as Error)?.message
        if (!msg) ElMessage.error('文件上传失败，请重试')
        fileList.value = [...list]
      } finally {
        if (typeof uid === 'number') delete progressMap[uid]
      }
    }
  } finally {
    uploading.value = false
    // 失败文件移出列表，避免把未上传成功的文件带进 evidenceFileIds
    const kept = list.filter(
      (f) => f.status === 'success' || f.status === 'uploading' || getFileId(f) !== undefined,
    )
    fileList.value = kept
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

/** 取文件扩展名（小写） */
function extOf(name: string): string {
  const idx = name.lastIndexOf('.')
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : name.toLowerCase()
}

/** 判断文件是否为图片（按扩展名 / MIME 前缀） */
function isImageFile(fileName: string, fileType: string): boolean {
  const ext = extOf(fileName)
  const type = fileType.toLowerCase()
  return IMAGE_EXTS.includes(ext) || IMAGE_EXTS.includes(type) || type.startsWith('image/')
}

/** 预览：图片走 el-image-viewer，PDF 等走新窗口打开 */
async function handlePreview(file: UploadFile) {
  const fileId = getFileId(file)
  if (typeof fileId !== 'number' || previewing.value) return
  previewing.value = true
  try {
    const info = await previewFile(fileId)
    const url = info.previewUrl || info.fileUrl
    if (!url) {
      ElMessage.warning('该文件暂不支持预览')
      return
    }
    if (isImageFile(info.fileName, info.fileType)) {
      imageViewerUrl.value = url
      imageViewerVisible.value = true
    } else {
      window.open(url, '_blank', 'noopener')
    }
  } catch {
    ElMessage.error('预览失败，请稍后重试')
  } finally {
    previewing.value = false
  }
}
</script>

<template>
  <div class="proof-upload">
    <el-upload
      ref="uploadRef"
      action="#"
      :auto-upload="false"
      list-type="text"
      drag
      :disabled="uploading"
      :file-list="fileList"
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

      <template #file="{ file }">
        <div class="pf-item">
          <span class="pf-item__name" :title="file.name">{{ file.name }}</span>
          <span v-if="file.status === 'uploading'" class="pf-item__pct">
            {{ progressMap[file.uid] ?? 0 }}%
          </span>
          <button
            v-if="file.status === 'success' && getFileId(file) !== undefined"
            type="button"
            class="pf-item__preview"
            :disabled="previewing"
            @click="handlePreview(file)"
          >
            <Eye :size="13" />
            <span>预览</span>
          </button>
          <button
            v-if="canDeleteFile()"
            type="button"
            class="pf-item__remove"
            aria-label="删除"
            @click="uploadRef?.handleRemove(file)"
          >
            <Trash2 :size="13" />
          </button>
        </div>
      </template>
    </el-upload>

    <ElImageViewer
      v-if="imageViewerVisible"
      :url-list="[imageViewerUrl]"
      @close="imageViewerVisible = false"
    />
  </div>
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

.pf-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  line-height: 1.5;

  &__name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    color: var(--el-text-color-primary);
  }

  &__pct {
    flex-shrink: 0;
    font-size: 12px;
    color: var(--el-color-primary);
  }

  &__preview {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
    padding: 2px 8px;
    border: 1px solid var(--el-border-color);
    border-radius: $radius-sm;
    background: var(--el-bg-color);
    color: var(--el-color-primary);
    font-size: 12px;
    cursor: pointer;
    transition: all $duration-fast $ease-standard;

    &:hover:not(:disabled) {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    border: none;
    border-radius: $radius-sm;
    background: transparent;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    transition: all $duration-fast $ease-standard;

    &:hover {
      color: var(--el-color-danger);
      background: var(--el-fill-color-light);
    }
  }
}
</style>
