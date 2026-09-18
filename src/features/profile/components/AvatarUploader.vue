<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { Upload, User, X, ZoomIn, ZoomOut } from 'lucide-vue-next'
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    size?: number
  }>(),
  {
    modelValue: '',
    size: 96,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'upload', value: string): void
}>()

const ACCEPT_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE_MB = 5
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024
const PREVIEW_SIZE = 320
const CROP_FRAME_SIZE = 200
const OUTPUT_SIZE = 256

const inputRef = ref<HTMLInputElement | null>(null)
const previewVisible = ref(false)
const originalImage = ref<HTMLImageElement | null>(null)
const cropScale = ref(1)
const minScale = ref(0.5)
const maxScale = ref(3)
const isDragging = ref(false)
const dragPosition = ref({ x: 0, y: 0 })
const startDrag = ref({ x: 0, y: 0 })

const hasAvatar = computed(() => !!props.modelValue)

const avatarStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  borderRadius: '50%',
  // 动态尺寸使用内联样式并注释说明
}))

function triggerSelect() {
  inputRef.value?.click()
}

function validateFile(file: File): boolean {
  if (!ACCEPT_TYPES.includes(file.type)) {
    ElMessage.error('仅支持 jpg、jpeg、png、webp 格式的图片')
    return false
  }
  if (file.size > MAX_SIZE_BYTES) {
    ElMessage.error(`图片大小不能超过 ${MAX_SIZE_MB}MB`)
    return false
  }
  return true
}

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  processFile(file)
  target.value = ''
}

function processFile(file: File) {
  if (!validateFile(file)) return

  const reader = new FileReader()
  reader.onload = (event) => {
    const result = event.target?.result as string
    loadImage(result)
  }
  reader.readAsDataURL(file)
}

function loadImage(src: string) {
  const img = new Image()
  img.onload = () => {
    originalImage.value = img
    calculateMinScale(img)
    // 初始让图片中心对准裁剪框中心
    const scaledW = img.width * cropScale.value
    const scaledH = img.height * cropScale.value
    dragPosition.value = {
      x: PREVIEW_SIZE / 2 - scaledW / 2,
      y: PREVIEW_SIZE / 2 - scaledH / 2,
    }
    previewVisible.value = true
  }
  img.src = src
}

function calculateMinScale(img: HTMLImageElement) {
  // 裁剪框固定为 CROP_FRAME_SIZE，最小缩放需保证图片能覆盖裁剪框
  const minW = CROP_FRAME_SIZE / img.width
  const minH = CROP_FRAME_SIZE / img.height
  minScale.value = Math.max(minW, minH, 0.3)
  cropScale.value = Math.max(minScale.value, 1)
}

function handleWheel(e: WheelEvent) {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  cropScale.value = Math.max(minScale.value, Math.min(maxScale.value, cropScale.value + delta))
}

function handlePointerDown(e: PointerEvent) {
  isDragging.value = true
  startDrag.value = {
    x: e.clientX - dragPosition.value.x,
    y: e.clientY - dragPosition.value.y,
  }
}

function handlePointerMove(e: PointerEvent) {
  if (!isDragging.value || !originalImage.value) return
  dragPosition.value = {
    x: e.clientX - startDrag.value.x,
    y: e.clientY - startDrag.value.y,
  }
}

function handlePointerUp() {
  isDragging.value = false
}

function zoomIn() {
  cropScale.value = Math.min(maxScale.value, cropScale.value + 0.2)
}

function zoomOut() {
  cropScale.value = Math.max(minScale.value, cropScale.value - 0.2)
}

function clampPosition() {
  if (!originalImage.value) return
  const scaledW = originalImage.value.width * cropScale.value
  const scaledH = originalImage.value.height * cropScale.value
  const frameOffset = (PREVIEW_SIZE - CROP_FRAME_SIZE) / 2

  // 图片必须覆盖 200x200 的裁剪框，因此图片左上角的可移动范围为：
  // [PREVIEW_SIZE - CROP_FRAME_SIZE - scaledW, frameOffset] 即 [120 - scaledW, 60]
  const minX = PREVIEW_SIZE - CROP_FRAME_SIZE - scaledW
  const maxX = frameOffset
  const minY = PREVIEW_SIZE - CROP_FRAME_SIZE - scaledH
  const maxY = frameOffset

  dragPosition.value = {
    x: Math.max(minX, Math.min(maxX, dragPosition.value.x)),
    y: Math.max(minY, Math.min(maxY, dragPosition.value.y)),
  }
}

function generateCroppedAvatar(): string {
  if (!originalImage.value) return ''
  clampPosition()

  // 1. 在 320x320 预览画布上绘制与预览完全一致的图像
  const previewCanvas = document.createElement('canvas')
  previewCanvas.width = PREVIEW_SIZE
  previewCanvas.height = PREVIEW_SIZE
  const previewCtx = previewCanvas.getContext('2d')
  if (!previewCtx) return ''

  const img = originalImage.value

  // 与预览完全一致：图片左上角位于 dragPosition
  previewCtx.drawImage(
    img,
    dragPosition.value.x,
    dragPosition.value.y,
    img.width * cropScale.value,
    img.height * cropScale.value,
  )

  // 2. 裁剪出 200x200 圆形区域
  previewCtx.globalCompositeOperation = 'destination-in'
  previewCtx.beginPath()
  previewCtx.arc(PREVIEW_SIZE / 2, PREVIEW_SIZE / 2, CROP_FRAME_SIZE / 2, 0, Math.PI * 2)
  previewCtx.fill()
  previewCtx.globalCompositeOperation = 'source-over'

  // 3. 输出为 256x256
  const outputCanvas = document.createElement('canvas')
  outputCanvas.width = OUTPUT_SIZE
  outputCanvas.height = OUTPUT_SIZE
  const outputCtx = outputCanvas.getContext('2d')
  if (!outputCtx) return ''

  const cropOffset = (PREVIEW_SIZE - CROP_FRAME_SIZE) / 2
  outputCtx.drawImage(
    previewCanvas,
    cropOffset,
    cropOffset,
    CROP_FRAME_SIZE,
    CROP_FRAME_SIZE,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  )

  return outputCanvas.toDataURL('image/jpeg', 0.92)
}

function handleConfirm() {
  const result = generateCroppedAvatar()
  if (!result) return
  emit('update:modelValue', result)
  emit('upload', result)
  previewVisible.value = false
  originalImage.value = null
}

function handleCancel() {
  previewVisible.value = false
  originalImage.value = null
}

function handleRemove(e: Event) {
  e.stopPropagation()
  emit('update:modelValue', '')
  emit('upload', '')
}

const previewImageStyle = computed(() => {
  if (!originalImage.value) return {}
  return {
    width: `${originalImage.value.width * cropScale.value}px`,
    height: `${originalImage.value.height * cropScale.value}px`,
    transform: `translate(${dragPosition.value.x}px, ${dragPosition.value.y}px)`,
    // 拖拽位置使用内联样式动态计算
  }
})
</script>

<template>
  <div class="avatar-uploader">
    <div
      class="avatar-preview"
      :style="avatarStyle"
      role="button"
      tabindex="0"
      aria-label="点击更换头像"
      @click="triggerSelect"
      @keydown.enter="triggerSelect"
      @keydown.space.prevent="triggerSelect"
    >
      <img v-if="hasAvatar" :src="modelValue" class="avatar-preview__image" alt="用户头像" />
      <User v-else :size="size * 0.4" class="avatar-preview__placeholder" />
      <div class="avatar-preview__overlay">
        <Upload :size="20" />
        <span>更换头像</span>
      </div>
      <button
        v-if="hasAvatar"
        class="avatar-preview__remove"
        type="button"
        aria-label="删除头像"
        @click="handleRemove"
      >
        <X :size="14" />
      </button>
    </div>

    <input
      ref="inputRef"
      type="file"
      accept="image/jpeg,image/jpg,image/png,image/webp"
      class="avatar-uploader__input"
      @change="handleFileChange"
    />

    <el-dialog
      v-model="previewVisible"
      title="裁剪头像"
      width="400px"
      :close-on-click-modal="false"
      destroy-on-close
      @closed="handleCancel"
    >
      <div
        class="crop-canvas"
        @wheel.prevent="handleWheel"
        @pointerdown="handlePointerDown"
        @pointermove="handlePointerMove"
        @pointerup="handlePointerUp"
        @pointerleave="handlePointerUp"
      >
        <img
          v-if="originalImage"
          :src="originalImage.src"
          :style="previewImageStyle"
          class="crop-canvas__image"
          alt="裁剪预览"
          draggable="false"
        />
        <div class="crop-canvas__mask" />
        <div class="crop-canvas__frame" />
      </div>

      <div class="crop-toolbar">
        <el-button text :icon="ZoomOut" aria-label="缩小" @click="zoomOut" />
        <span class="crop-toolbar__scale">{{ Math.round(cropScale * 100) }}%</span>
        <el-button text :icon="ZoomIn" aria-label="放大" @click="zoomIn" />
      </div>

      <template #footer>
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.avatar-uploader {
  display: inline-block;
}

.avatar-preview {
  position: relative;
  overflow: hidden;
  border: 2px solid var(--el-border-color);
  background: var(--el-fill-color-light);
  cursor: pointer;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;

  &:hover,
  &:focus-visible {
    border-color: var(--el-color-primary);
    outline: none;

    .avatar-preview__overlay {
      opacity: 1;
    }
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__placeholder {
    color: var(--el-text-color-placeholder);
    position: absolute;
    inset: 0;
    margin: auto;
  }

  &__overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    background: rgba(0, 0, 0, 0.45);
    color: #fff;
    font-size: 12px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  &__remove {
    position: absolute;
    top: 0;
    right: 0;
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 50%;
    background: rgba(239, 68, 68, 0.9);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transform: translate(30%, -30%);
    transition: background-color 0.2s;

    &:hover {
      background: rgba(220, 38, 38, 0.95);
    }
  }
}

.avatar-uploader__input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.crop-canvas {
  position: relative;
  width: 320px;
  height: 320px;
  margin: 0 auto;
  overflow: hidden;
  border-radius: $radius-lg;
  background: var(--el-fill-color);
  cursor: grab;
  touch-action: none;

  &:active {
    cursor: grabbing;
  }

  &__image {
    position: absolute;
    top: 0;
    left: 0;
    max-width: none;
    user-select: none;
  }

  &__mask {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    pointer-events: none;
  }

  &__frame {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 200px;
    height: 200px;
    transform: translate(-50%, -50%);
    border: 2px dashed #fff;
    border-radius: 50%;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.4);
    pointer-events: none;
  }
}

.crop-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;

  &__scale {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    min-width: 48px;
    text-align: center;
  }
}
</style>
