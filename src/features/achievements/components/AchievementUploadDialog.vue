<script setup lang="ts">
import type {
  AchievementCategory,
  AchievementCreateInput,
  AchievementListItem,
  AchievementPracticeTag,
} from '@/shared/api/achievements'
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Image as ImageIcon,
  Trash2,
  Upload,
  X,
} from 'lucide-vue-next'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  ACHIEVEMENT_MAX_PAGE_SIZE,
  ACHIEVEMENT_MAX_PAGES,
  createAchievement,
  getAchievements,
} from '@/shared/api/achievements'
import { CATEGORY_LABELS } from '../composables/useAchievementWall'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created', item: AchievementListItem): void
}>()

/** 只允许学生上传证书类成果，「其他」仍由系统兜底，不开放手工选择 */
const UPLOAD_CATEGORIES: Array<Exclude<AchievementCategory, 'all' | 'other'>> = [
  'honor',
  'contest',
  'research',
  'practice',
  'completion',
]

const PRACTICE_TAGS: Array<{ value: AchievementPracticeTag; label: string }> = [
  { value: 'volunteer', label: '志愿' },
  { value: 'activity', label: '活动' },
  { value: 'internship', label: '实习' },
  { value: 'social_practice', label: '社会实践' },
]

const ACCEPT = '.jpg,.jpeg,.png,.pdf'

const title = ref('')
const category = ref<Exclude<AchievementCategory, 'all' | 'other'>>('completion')
const practiceTag = ref<AchievementPracticeTag>('volunteer')
const issuer = ref('')
const eventAt = ref('')
const level = ref('')
const description = ref('')
const files = ref<File[]>([])
const errors = ref<Record<string, string>>({})
const submitting = ref(false)
const submitError = ref('')
const duplicate = ref<AchievementListItem | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

/** 获得日期不允许选未来（保留原生 date 输入时的 max=today 行为） */
function isFutureDate(date: Date): boolean {
  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)
  return date.getTime() > endOfToday.getTime()
}

const categoryOptions = computed(() =>
  UPLOAD_CATEGORIES.map((value) => ({ value, label: CATEGORY_LABELS[value] })),
)

function extOf(name: string): string {
  return name.slice(name.lastIndexOf('.') + 1).toLowerCase()
}

function isImage(file: File): boolean {
  return file.type.startsWith('image/') || ['jpg', 'jpeg', 'png'].includes(extOf(file.name))
}

function fileSizeText(size: number): string {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`
  return `${Math.max(1, Math.round(size / 1024))} KB`
}

function validateFiles(): string {
  if (files.value.length === 0) return '请至少添加一页证书'
  if (files.value.length > ACHIEVEMENT_MAX_PAGES) {
    return `一份证书最多 ${ACHIEVEMENT_MAX_PAGES} 页，请删减后再保存`
  }
  for (const file of files.value) {
    const ext = extOf(file.name)
    if (!['jpg', 'jpeg', 'png', 'pdf'].includes(ext)) {
      return `「${file.name}」格式不支持，仅支持 jpg / png / pdf`
    }
    if (file.size > ACHIEVEMENT_MAX_PAGE_SIZE) {
      return `「${file.name}」超过 5MB，请压缩到单页 5MB 以内`
    }
  }
  return ''
}

/** 手动调整页序：第一页自动作封面 */
function movePage(index: number, delta: number) {
  const target = index + delta
  if (target < 0 || target >= files.value.length) return
  const next = [...files.value]
  const [moved] = next.splice(index, 1)
  next.splice(target, 0, moved)
  files.value = next
}

function handleFiles(event: Event) {
  const input = event.target as HTMLInputElement
  const picked = Array.from(input.files ?? [])
  files.value = [...files.value, ...picked]
  input.value = ''
  errors.value.file =
    files.value.length > ACHIEVEMENT_MAX_PAGES
      ? `一份证书最多 ${ACHIEVEMENT_MAX_PAGES} 页，当前已选 ${files.value.length} 页`
      : ''
}

function removeFile(index: number) {
  files.value = files.value.filter((_, i) => i !== index)
}

function validate(): boolean {
  const next: Record<string, string> = {}
  if (!title.value.trim()) next.title = '请填写证书名称'
  if (!issuer.value.trim()) next.issuer = '请填写颁发单位'
  if (!eventAt.value) next.eventAt = '请选择获得日期'
  const fileError = validateFiles()
  if (fileError) next.file = fileError
  errors.value = next
  return Object.keys(next).length === 0
}

async function findDuplicate(): Promise<AchievementListItem | null> {
  const keyword = title.value.trim()
  const result = await getAchievements({ keyword, per_page: 50 })
  return (
    result.list.find(
      (item) =>
        item.category === category.value &&
        item.title.trim() === keyword &&
        item.eventAt.slice(0, 10) === eventAt.value,
    ) ?? null
  )
}

async function submit(force = false) {
  if (submitting.value) return
  submitError.value = ''
  if (!validate()) return

  submitting.value = true
  try {
    if (!force) {
      const matched = await findDuplicate()
      if (matched) {
        duplicate.value = matched
        return
      }
    }

    const input: AchievementCreateInput = {
      title: title.value.trim(),
      category: category.value,
      issuer: issuer.value.trim(),
      eventAt: eventAt.value,
      level: level.value.trim(),
      description: description.value.trim(),
      tags: category.value === 'practice' ? [practiceTag.value] : [],
      files: files.value,
    }
    const item = await createAchievement(input)
    emit('created', item)
  } catch (error) {
    submitError.value = (error as Error)?.message || '上传失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div class="au-mask" @click.self="emit('close')">
      <div class="au-panel" role="dialog" aria-modal="true" aria-labelledby="au-title">
        <header class="au-head">
          <div>
            <h2 id="au-title" class="au-head__title">上传证书</h2>
            <p class="au-head__desc">保存后直接归档到成果墙，可用于评奖评优和申报佐证。</p>
          </div>
          <button type="button" class="au-close" aria-label="关闭" @click="emit('close')">
            <X :size="14" />
          </button>
        </header>

        <div class="au-body">
          <label class="au-field">
            <span class="au-label">证书名称 <em>*</em></span>
            <input
              v-model="title"
              class="au-input"
              placeholder="如：志愿服务证书 / Python 实训结业证书"
            />
            <span v-if="errors.title" class="au-error">{{ errors.title }}</span>
          </label>

          <div class="au-field">
            <span class="au-label">类别 <em>*</em></span>
            <div class="au-chips">
              <button
                v-for="option in categoryOptions"
                :key="option.value"
                type="button"
                class="au-chip"
                :class="{ 'au-chip--active': category === option.value }"
                @click="category = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div v-if="category === 'practice'" class="au-field">
            <span class="au-label">实践类型 <em>*</em></span>
            <div class="au-chips">
              <button
                v-for="option in PRACTICE_TAGS"
                :key="option.value"
                type="button"
                class="au-chip"
                :class="{ 'au-chip--active': practiceTag === option.value }"
                @click="practiceTag = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div class="au-row">
            <label class="au-field">
              <span class="au-label">颁发单位 <em>*</em></span>
              <input v-model="issuer" class="au-input" placeholder="如：校团委 / 江苏省教育厅" />
              <span v-if="errors.issuer" class="au-error">{{ errors.issuer }}</span>
            </label>
            <label class="au-field">
              <span class="au-label">获得日期 <em>*</em></span>
              <span class="au-date-wrap">
                <el-date-picker
                  v-model="eventAt"
                  class="au-date"
                  type="date"
                  placeholder="请选择日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  :disabled-date="isFutureDate"
                />
              </span>
              <span v-if="errors.eventAt" class="au-error">{{ errors.eventAt }}</span>
            </label>
          </div>

          <label class="au-field">
            <span class="au-label">级别（选填）</span>
            <input v-model="level" class="au-input" placeholder="如：国家级 / 省级 / 校级 / 院级" />
          </label>

          <label class="au-field">
            <span class="au-label">说明（选填）</span>
            <textarea
              v-model="description"
              class="au-textarea"
              rows="2"
              placeholder="补充说明证书用途或服务时长等"
            />
          </label>

          <div class="au-field">
            <span class="au-label">证书文件 <em>*</em></span>
            <input
              ref="fileInputRef"
              class="au-file-input"
              type="file"
              multiple
              :accept="ACCEPT"
              @change="handleFiles"
            />
            <button type="button" class="au-picker" @click="fileInputRef?.click()">
              <Upload :size="16" />
              添加页
            </button>
            <p class="au-hint">
              支持 jpg / png / pdf，单页不超过 5MB、最多 6 页；第一页自动作封面，可调整页序。
            </p>
            <ul v-if="files.length" class="au-files">
              <li v-for="(file, index) in files" :key="`${file.name}-${index}`" class="au-file">
                <span class="au-file__index">{{ index + 1 }}</span>
                <ImageIcon v-if="isImage(file)" :size="14" />
                <FileText v-else :size="14" />
                <span class="au-file__name" :title="file.name">{{ file.name }}</span>
                <span v-if="index === 0" class="au-file__cover">封面</span>
                <span class="au-file__size">{{ fileSizeText(file.size) }}</span>
                <button
                  type="button"
                  class="au-file__move"
                  aria-label="上移"
                  :disabled="index === 0"
                  @click="movePage(index, -1)"
                >
                  <ChevronUp :size="13" />
                </button>
                <button
                  type="button"
                  class="au-file__move"
                  aria-label="下移"
                  :disabled="index === files.length - 1"
                  @click="movePage(index, 1)"
                >
                  <ChevronDown :size="13" />
                </button>
                <button
                  type="button"
                  class="au-file__remove"
                  aria-label="移除"
                  @click="removeFile(index)"
                >
                  <Trash2 :size="13" />
                </button>
              </li>
            </ul>
            <span v-if="errors.file" class="au-error">{{ errors.file }}</span>
          </div>

          <div v-if="duplicate" class="au-duplicate" role="alert">
            <p>
              成果墙已有一条同名成果「{{ duplicate.title }}」（{{
                duplicate.eventAt.slice(0, 10)
              }}）。 为避免重复，建议先到成果墙确认或补充原成果。
            </p>
            <div class="au-duplicate__actions">
              <button type="button" class="au-btn" @click="duplicate = null">返回修改</button>
              <button type="button" class="au-btn au-btn--ghost" @click="submit(true)">
                仍然新建
              </button>
            </div>
          </div>

          <p v-if="submitError" class="au-error">{{ submitError }}</p>
        </div>

        <footer class="au-foot">
          <button type="button" class="au-btn" @click="emit('close')">取消</button>
          <button
            type="button"
            class="au-btn au-btn--primary"
            :disabled="submitting"
            @click="submit()"
          >
            {{ submitting ? '保存中…' : '保存并归档' }}
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/features/messages/styles/theme' as *;

.au-mask {
  @include message-theme-vars;

  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: rgba(15, 23, 42, 0.52);
}

.au-panel {
  display: flex;
  flex-direction: column;
  width: min(560px, 100%);
  max-height: min(720px, 100%);
  border: 1px solid var(--mc-border);
  border-radius: $radius-xl;
  background: var(--mc-card);
  box-shadow: var(--mc-shadow-hover);
  overflow: hidden;
}

.au-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px 12px;
  border-bottom: 1px solid var(--mc-border);
}

.au-head__title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: var(--mc-text);
}

.au-head__desc {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--mc-text-secondary);
}

.au-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid var(--mc-border);
  border-radius: $radius-sm;
  background: var(--mc-card);
  color: var(--mc-text-secondary);
  cursor: pointer;

  &:hover {
    color: var(--mc-text);
  }
}

.au-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px 20px;
  overflow-y: auto;
}

.au-row {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 12px;
}

.au-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.au-label {
  font-size: 12px;
  color: var(--mc-text-secondary);

  em {
    color: var(--mc-danger);
    font-style: normal;
  }
}

.au-input,
.au-textarea {
  width: 100%;
  padding: 7px 10px;
  border: 1px solid var(--mc-border);
  border-radius: $radius-base;
  background: var(--mc-card);
  color: var(--mc-text);
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;

  &:focus {
    border-color: var(--mc-wood);
    outline: none;
  }
}

.au-textarea {
  resize: vertical;
}

/* 日期控件沿用 .au-input 的外壳尺寸与配色，仅替换占位符/展示格式 */
.au-date-wrap {
  display: block;
  width: 100%;

  :deep(.au-date) {
    --el-input-height: 35px;
    width: 100%;
    height: 35px;
  }

  :deep(.el-input__wrapper) {
    height: 35px;
    padding: 0 10px;
    border-radius: $radius-base;
    background: var(--mc-card);
    box-shadow: 0 0 0 1px var(--mc-border) inset;
  }

  :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 1px var(--mc-wood) inset;
  }

  :deep(.el-input__inner) {
    color: var(--mc-text);
    font-family: inherit;
    font-size: 13px;
    line-height: 1.5;
  }

  :deep(.el-input__prefix),
  :deep(.el-input__suffix) {
    color: var(--mc-text-secondary);
  }
}

.au-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.au-chip {
  height: 28px;
  padding: 0 12px;
  border: 1px solid var(--mc-border);
  border-radius: $radius-base;
  background: var(--mc-card);
  color: var(--mc-text-secondary);
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;

  &--active {
    border-color: var(--mc-wood-light);
    background: var(--mc-primary-faint);
    color: var(--mc-wood);
  }
}

.au-file-input {
  display: none;
}

.au-picker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  height: 30px;
  padding: 0 12px;
  border: 1px dashed var(--mc-wood-light);
  border-radius: $radius-base;
  background: var(--mc-bg);
  color: var(--mc-wood);
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
}

.au-hint {
  margin: 0;
  font-size: 11px;
  line-height: 1.5;
  color: var(--mc-text-secondary);
}

.au-files {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 2px 0 0;
  padding: 0;
  list-style: none;
}

.au-file {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border: 1px solid var(--mc-border);
  border-radius: $radius-sm;
  background: var(--mc-bg);
  color: var(--mc-text-secondary);
  font-size: 12px;
}

.au-file__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--mc-text);
}

.au-file__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--mc-primary-faint);
  color: var(--mc-wood);
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 10px;
}

.au-file__cover {
  flex-shrink: 0;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--mc-primary-faint);
  color: var(--mc-wood);
  font-size: 10px;
}

.au-file__size {
  flex-shrink: 0;
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 11px;
}

.au-file__move {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  border-radius: $radius-sm;
  background: transparent;
  color: var(--mc-text-secondary);
  cursor: pointer;

  &:hover:not(:disabled) {
    color: var(--mc-wood);
  }

  &:disabled {
    cursor: default;
    opacity: 0.35;
  }
}

.au-file__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: $radius-sm;
  background: transparent;
  color: var(--mc-text-secondary);
  cursor: pointer;

  &:hover {
    color: var(--mc-danger);
  }
}

.au-error {
  font-size: 12px;
  color: var(--mc-danger);
}

.au-duplicate {
  padding: 10px 12px;
  border: 1px solid var(--mc-gold);
  border-radius: $radius-base;
  background: var(--mc-primary-faint);
  font-size: 12px;
  line-height: 1.6;
  color: var(--mc-text);

  p {
    margin: 0 0 8px;
  }
}

.au-duplicate__actions {
  display: flex;
  gap: 8px;
}

.au-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px 16px;
  border-top: 1px solid var(--mc-border);
}

.au-btn {
  height: 32px;
  padding: 0 16px;
  border: 1px solid var(--mc-border);
  border-radius: $radius-base;
  background: var(--mc-card);
  color: var(--mc-text);
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;

  &:hover {
    border-color: var(--mc-wood);
    color: var(--mc-wood);
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }

  &--primary {
    border-color: var(--mc-wood);
    background: var(--mc-wood);
    color: var(--mc-card);

    &:hover {
      background: var(--mc-wood-light);
      border-color: var(--mc-wood-light);
      color: var(--mc-card);
    }
  }

  &--ghost {
    background: transparent;
  }
}
</style>
