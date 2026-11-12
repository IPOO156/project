<script setup lang="ts">
import type { UploadFile, UploadInstance, UploadUserFile } from 'element-plus'
import type { PickedAchievementFile } from '@/shared/api/achievements'
import { ElImageViewer, ElMessage } from 'element-plus'
import { Eye, FolderOpen, Trash2, Upload } from 'lucide-vue-next'
import { reactive, ref } from 'vue'
import { deleteFile, previewFile, uploadFile } from '@/shared/api/common'
import AchievementPickerDialog from '@/shared/ui/AchievementPickerDialog.vue'

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
  /** 来自成果墙的附件：提交时随 achievementEvidence 一起冻结快照 */
  achievementId?: string
  achievementVersion?: number
  achievementFileId?: string
  sourceUrl?: string
}

const uploadRef = ref<UploadInstance>()
const uploading = ref(false)
/** 各文件实时上传百分比（uid → 0~100） */
const progressMap = reactive<Record<number, number>>({})
const previewing = ref(false)
const imageViewerVisible = ref(false)
const imageViewerUrl = ref('')
const pickerVisible = ref(false)

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']

/** 与组件 tip 文案一致的上传限制；仅拦截浏览器选择层拦不住的文件（拖拽/改选"所有文件"） */
const MAX_FILE_SIZE_MB = 10
const ALLOWED_EXTS = [...IMAGE_EXTS, 'pdf']
const ALLOWED_MIMES = ['application/pdf']

/** 返回不合规原因，null 表示通过 */
function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `「${file.name}」超过 ${MAX_FILE_SIZE_MB}MB，请压缩后重试`
  }
  const type = (file.type || '').toLowerCase()
  const typeOk =
    ALLOWED_EXTS.includes(extOf(file.name)) ||
    type.startsWith('image/') ||
    ALLOWED_MIMES.includes(type)
  if (!typeOk) {
    return `「${file.name}」格式不支持，仅支持 jpg / png / pdf`
  }
  return null
}

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

/** 来自成果墙的条目只从本次申报里移除，不删除成果原件 */
function isAchievementFile(file: UploadFile | UploadUserFile): boolean {
  return typeof (file as EvidenceUploadFile).achievementId === 'string'
}

/** 移除文件（el-upload internal handleRemove 触发）：调用 DELETE 并回写父级列表 */
function handleRemove(file: UploadFile, list: UploadFile[]) {
  const fileId = getFileId(file)
  if (typeof fileId === 'number' && !isAchievementFile(file)) {
    deleteFile(fileId).catch(() => {
      // 删除失败（如文件已被业务关联，仅未关联可删）：静默处理
    })
  }
  fileList.value = [...list]
}

/** 成果墙选材：把选中成果的附件并入当前附件列表，与手动上传的文件共存 */
function handlePicked(files: PickedAchievementFile[]) {
  // 去重键必须与下方 key 同构（achievementId:fileId）。
  // 只存 achievementFileId 会与复合 key 永远不相等，导致重复选同一份附件时重复入列。
  const existing = new Set(
    fileList.value
      .map((file) => {
        const item = file as EvidenceUploadFile
        return typeof item.achievementId === 'string' && typeof item.achievementFileId === 'string'
          ? `${item.achievementId}:${item.achievementFileId}`
          : null
      })
      .filter((key): key is string => key !== null),
  )
  const base = Date.now()
  const appended: UploadUserFile[] = []
  files.forEach((file, index) => {
    const key = `${file.achievementId}:${file.fileId}`
    if (existing.has(key)) return
    existing.add(key)
    const numericId = Number(file.fileId)
    appended.push({
      uid: base + index,
      name: `${file.achievementTitle} · ${file.fileName}`,
      status: 'success',
      fileId: Number.isFinite(numericId) ? numericId : undefined,
      achievementId: file.achievementId,
      achievementVersion: file.achievementVersion,
      achievementFileId: file.fileId,
      sourceUrl: file.previewUrl || file.url,
    } as UploadUserFile)
  })
  fileList.value = [...fileList.value, ...appended]
  pickerVisible.value = false
  if (appended.length === 0) ElMessage.info('所选证书已在附件列表中')
}

/**
 * 文件选中后逐个真实上传（POST /common/upload），成功后回填 fileId，
 * 提交映射（submission.ts toEvidenceFileIds）据此生成 evidenceFileIds。
 */
async function handleChange(_file: UploadFile, list: UploadUserFile[]) {
  // accept 只是选择器过滤，拖拽或手动切「所有文件」仍可绕过；上传前在此兜底校验类型与大小
  const accepted = list.filter((f) => {
    if (!f.raw || f.status === 'success' || getFileId(f) !== undefined) return true
    const reason = validateFile(f.raw)
    if (reason) ElMessage.warning(reason)
    return !reason
  })
  const target = accepted.length === list.length ? list : accepted
  const pending = target.filter((f) => getFileId(f) === undefined && f.status !== 'uploading')
  if (pending.length === 0) {
    fileList.value = [...target]
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
      fileList.value = [...target]
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
        fileList.value = [...target]
      } catch (e) {
        f.status = 'fail'
        // 响应拦截器已 toast 业务错误；这里仅兜底"静默 404"等无 message 的场景，避免重复弹窗
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (e as Error)?.message
        if (!msg) ElMessage.error('文件上传失败，请重试')
        fileList.value = [...target]
      } finally {
        if (typeof uid === 'number') delete progressMap[uid]
      }
    }
  } finally {
    uploading.value = false
    // 失败文件移出列表，避免把未上传成功的文件带进 evidenceFileIds
    const kept = target.filter(
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

/** 是否可预览：手动上传的看 fileId，成果墙来源的看本地/签名地址 */
function canPreview(file: UploadFile | UploadUserFile): boolean {
  return getFileId(file) !== undefined || Boolean((file as EvidenceUploadFile).sourceUrl)
}

/** 预览：图片走 el-image-viewer，PDF 等走新窗口打开 */
async function handlePreview(file: UploadFile) {
  const sourceUrl = (file as EvidenceUploadFile).sourceUrl
  if (sourceUrl) {
    if (/\.pdf$/i.test(file.name)) {
      window.open(sourceUrl, '_blank', 'noopener')
    } else {
      imageViewerUrl.value = sourceUrl
      imageViewerVisible.value = true
    }
    return
  }
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
    <div class="proof-upload__bar">
      <span class="proof-upload__bar-tip">可直接选成果墙里已有的证书，也可继续另传其他文件</span>
      <button type="button" class="proof-upload__pick" @click="pickerVisible = true">
        <FolderOpen :size="14" />
        从成果墙选择
      </button>
    </div>

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
            v-if="file.status === 'success' && canPreview(file)"
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

    <AchievementPickerDialog
      v-if="pickerVisible"
      @close="pickerVisible = false"
      @confirm="handlePicked"
    />
  </div>
</template>

<style scoped lang="scss">
.proof-upload__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.proof-upload__bar-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.proof-upload__pick {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: var(--el-fill-color-blank);
  color: var(--el-color-primary);
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;

  &:hover {
    border-color: var(--el-color-primary);
  }
}

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
    @include transition-ui;

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
    @include transition-ui;

    &:hover {
      color: var(--el-color-danger);
      background: var(--el-fill-color-light);
    }
  }
}
</style>
