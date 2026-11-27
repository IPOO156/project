<script setup lang="ts">
import type {
  AchievementAttachment,
  AchievementDetail,
  AchievementListItem,
} from '@/shared/api/achievements'
import { Download, X } from 'lucide-vue-next'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getAchievementFileDownload } from '@/shared/api/achievements'
import { downloadFromUrl } from '@/shared/utils/download'
import { categoryLabelOf, formatEventDate } from '../composables/useAchievementWall'

const props = defineProps<{
  item: AchievementListItem | null
  detail: AchievementDetail | null
  loading: boolean
  error: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'retry'): void
}>()

const panelRef = ref<HTMLElement | null>(null)
const closeRef = ref<HTMLButtonElement | null>(null)
const imageFailed = ref(false)
const downloadingId = ref('')
const downloadError = ref('')

const titleId = 'aw-lightbox-title'

const categoryText = computed(() => (props.item ? categoryLabelOf(props.item) : ''))
const primaryFile = computed<AchievementAttachment | null>(() => {
  const files = props.detail?.attachments ?? []
  if (files.length === 0) return null
  return files.find((file) => file.isPrimary) ?? files[0]
})
const coverIssuer = computed(() => {
  if (!props.item) return ''
  const year = props.item.eventAt ? props.item.eventAt.slice(0, 4) : ''
  return [props.item.issuer, year].filter(Boolean).join(' · ')
})

watch(
  () => props.item?.id,
  () => {
    imageFailed.value = false
    downloadingId.value = ''
    downloadError.value = ''
    if (props.item) {
      void nextTick(() => closeRef.value?.focus())
    }
  },
  { immediate: true },
)

const previousOverflow = document.body.style.overflow

watch(
  () => !!props.item,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : previousOverflow
  },
  { immediate: true },
)

/** 原图下载：先取短时效地址，再交给浏览器落盘；失败保持弹窗并给可重试提示 */
async function handleDownload(file: AchievementAttachment) {
  if (!props.item || downloadingId.value) return
  downloadingId.value = file.fileId
  downloadError.value = ''
  try {
    const ticket = await getAchievementFileDownload(props.item.id, file.fileId)
    downloadFromUrl(ticket.url, ticket.fileName || file.fileName)
  } catch {
    downloadError.value = '下载失败，请稍后重试'
  } finally {
    downloadingId.value = ''
  }
}

function focusables(): HTMLElement[] {
  const root = panelRef.value
  if (!root) return []
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => element.offsetParent !== null)
}

function onKeydown(event: KeyboardEvent) {
  if (!props.item) return
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
    return
  }
  if (event.key !== 'Tab') return

  const nodes = focusables()
  if (nodes.length === 0) {
    event.preventDefault()
    return
  }
  const first = nodes[0]
  const last = nodes[nodes.length - 1]
  const active = document.activeElement as HTMLElement | null

  if (event.shiftKey && (active === first || !panelRef.value?.contains(active))) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && (active === last || !panelRef.value?.contains(active))) {
    event.preventDefault()
    first.focus()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = previousOverflow
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="item"
      class="aw-lightbox"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      @click.self="emit('close')"
    >
      <div ref="panelRef" class="aw-lightbox__panel">
        <button
          ref="closeRef"
          type="button"
          class="aw-lightbox__close"
          aria-label="关闭"
          @click="emit('close')"
        >
          <X :size="14" />
        </button>

        <div class="aw-lightbox__stage">
          <img
            v-if="item.thumbnailUrl && !imageFailed"
            class="aw-lightbox__image"
            :src="item.thumbnailUrl"
            :alt="item.title"
            @error="imageFailed = true"
          />
          <div
            v-else
            class="stage-paper"
            :class="{ 'stage-paper--photo': item.category === 'practice' }"
          >
            <span class="stage-paper__kicker">{{ categoryText }}</span>
            <span class="stage-paper__title">
              <span class="stage-paper__title-main">{{ item.title }}</span>
              <span v-if="item.level" class="stage-paper__title-level">{{ item.level }}</span>
            </span>
            <span class="stage-paper__rule"></span>
            <span class="stage-paper__issuer">{{ coverIssuer }}</span>
            <span class="stage-paper__seal">{{ item.materialLabel || categoryText }}</span>
          </div>
        </div>

        <aside class="aw-lightbox__side">
          <div class="aw-lightbox__kicker">{{ categoryText }} · 归档材料</div>
          <h2 :id="titleId" class="aw-lightbox__title">{{ item.title }}</h2>

          <dl class="aw-lightbox__rows">
            <div class="lrow">
              <dt>级别</dt>
              <dd>{{ item.level || '—' }}</dd>
            </div>
            <div class="lrow">
              <dt>时间</dt>
              <dd>{{ formatEventDate(item.eventAt) || '—' }}</dd>
            </div>
            <div class="lrow">
              <dt>颁发 / 来源</dt>
              <dd>{{ item.issuer || '—' }}</dd>
            </div>
            <div class="lrow">
              <dt>材料状态</dt>
              <dd>{{ item.materialLabel || '—' }}</dd>
            </div>
            <div v-if="detail?.description" class="lrow">
              <dt>档案备注</dt>
              <dd>{{ detail.description }}</dd>
            </div>
            <div v-if="detail?.semester" class="lrow">
              <dt>学期</dt>
              <dd>{{ detail.semester.name }}</dd>
            </div>
            <div v-for="field in detail?.fields ?? []" :key="field.label" class="lrow">
              <dt>{{ field.label }}</dt>
              <dd>{{ field.value }}</dd>
            </div>
          </dl>

          <div v-if="loading" class="lb-status">详情加载中…</div>
          <div v-else-if="error" class="lb-status lb-status--error">
            <span>详情加载失败</span>
            <button type="button" @click="emit('retry')">重试</button>
          </div>

          <div v-if="detail?.audit" class="lb-audit">
            <span class="lb-audit__status">{{ detail.audit.statusLabel }}</span>
            <span
              >{{ detail.audit.reviewerName }} ·
              {{ formatEventDate(detail.audit.reviewedAt) }}</span
            >
          </div>

          <div v-if="detail" class="lb-files">
            <div class="lb-files__head">
              <span class="lb-files__title">附件</span>
              <span class="lb-files__privacy">证书含个人信息，请勿随意外传</span>
            </div>
            <p v-if="detail.attachments.length === 0" class="lb-files__empty">
              暂无证书原件，请先补充材料
            </p>
            <ul v-else class="lb-files__list">
              <li v-for="file in detail.attachments" :key="file.fileId" class="lb-file">
                <a
                  :href="file.previewUrl || file.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  :title="file.fileName"
                >
                  {{ file.fileName }}
                </a>
                <button
                  type="button"
                  class="lb-file__download"
                  :disabled="downloadingId !== ''"
                  @click="handleDownload(file)"
                >
                  <Download :size="12" />
                  {{ downloadingId === file.fileId ? '下载中' : '下载' }}
                </button>
              </li>
            </ul>
            <p v-if="downloadError" class="lb-files__error">{{ downloadError }}</p>
          </div>

          <div v-if="detail" class="aw-lightbox__actions">
            <button
              v-if="primaryFile"
              type="button"
              class="lb-btn lb-btn--primary"
              :disabled="downloadingId !== ''"
              @click="handleDownload(primaryFile)"
            >
              <Download :size="14" />
              {{ downloadingId === primaryFile.fileId ? '下载中…' : '下载证书' }}
            </button>
            <span v-else class="lb-files__empty">该成果暂无可下载的证书</span>
          </div>
        </aside>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss" src="./achievement-lightbox.scss"></style>
