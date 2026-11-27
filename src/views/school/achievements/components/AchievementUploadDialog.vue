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
  ACHIEVEMENT_MAX_PAGES,
  createAchievement,
  getAchievements,
} from '@/shared/api/achievements'
import { CATEGORY_LABELS } from '../composables/useAchievementWall'
import {
  fileSizeText,
  isFutureDate,
  isImageFile as isImage,
  moveFile,
  validateAchievementFiles,
} from './achievementUploadRules'

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

const categoryOptions = computed(() =>
  UPLOAD_CATEGORIES.map((value) => ({ value, label: CATEGORY_LABELS[value] })),
)

/** 手动调整页序：第一页自动作封面 */
function movePage(index: number, delta: number) {
  files.value = moveFile(files.value, index, delta)
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
  const fileError = validateAchievementFiles(files.value)
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

<style scoped lang="scss" src="./achievement-upload-dialog.scss"></style>
