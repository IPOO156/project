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

<style scoped lang="scss">
@use '@/features/messages/styles/theme' as *;

.aw-lightbox {
  @include message-theme-vars;

  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  background: rgba(15, 23, 42, 0.52);

  /* 深色底上叠同色系遮罩几乎看不出变化，深色单独用更深的底；浅色保持原值 */
  html.dark &,
  [data-theme='dark'] & {
    background: rgba(0, 0, 0, 0.66);
  }
}

.aw-lightbox__panel {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  width: min(920px, 100%);
  height: min(600px, 100%);
  border: 1px solid var(--mc-border);
  border-radius: $radius-xl;
  background: var(--mc-card);
  box-shadow: var(--mc-shadow-hover);
  overflow: hidden;
}

.aw-lightbox__close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--mc-border);
  border-radius: $radius-sm;
  background: var(--mc-card);
  color: var(--mc-text-secondary);
  cursor: pointer;

  &:hover {
    color: var(--mc-text);
    border-color: var(--mc-wood);
  }
}

.aw-lightbox__stage {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  border-right: 1px solid var(--mc-border);
  background: linear-gradient(160deg, var(--mc-cream), transparent 60%), var(--mc-bg);
  overflow: auto;
}

.aw-lightbox__image {
  max-width: 100%;
  max-height: 100%;
  border-radius: $radius-sm;
  object-fit: contain;
  display: block;
}

.stage-paper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: min(420px, 100%);
  height: min(330px, 100%);
  padding: 24px;
  border: 1px solid var(--mc-gold);
  border-radius: $radius-sm;
  background: linear-gradient(180deg, var(--mc-card), var(--mc-bg));

  &::before {
    content: '';
    position: absolute;
    inset: 8px;
    border: 1px solid var(--mc-gold);
    border-radius: 2px;
    opacity: 0.3;
    pointer-events: none;
  }
}

.stage-paper__kicker {
  font-family: 'JetBrains Mono', 'SFMono-Regular', Consolas, monospace;
  font-size: 9px;
  letter-spacing: 3px;
  color: var(--mc-text-secondary);
}

.stage-paper__title {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 100%;
  min-width: 0;
  font-family: 'Noto Serif SC', serif;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: 1.5px;
  text-align: center;
  color: var(--mc-wood);
}

.stage-paper__title-main,
.stage-paper__title-level {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.stage-paper__title-level {
  font-weight: 500;
  color: var(--mc-text-secondary);
}

.stage-paper__rule {
  width: 56px;
  height: 1px;
  background: var(--mc-gold);
}

.stage-paper__issuer {
  max-width: 100%;
  font-size: 11px;
  color: var(--mc-text-secondary);
  text-align: center;
}

.stage-paper__seal {
  position: absolute;
  right: 20px;
  bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--mc-danger);
  border-radius: 50%;
  color: var(--mc-danger);
  font-family: 'Noto Serif SC', serif;
  font-size: 9px;
  line-height: 1.1;
  text-align: center;
  transform: rotate(-10deg);
  opacity: 0.85;
}

/* 与卡片缩略区同一规则：只用背景类变量，深色下不能翻成亮块 */
.stage-paper--photo {
  border-color: var(--mc-border);
  background:
    radial-gradient(120% 90% at 18% 0%, var(--mc-primary-fade) 0%, transparent 62%),
    linear-gradient(160deg, var(--mc-row-hover) 0%, var(--mc-cream) 55%, var(--mc-bg) 100%);

  /* 深色的暖色 tint 会让纸面比面板亮，深色只叠卡片色→页面底色 */
  html.dark &,
  [data-theme='dark'] & {
    background: linear-gradient(160deg, var(--mc-card) 0%, var(--mc-bg) 100%);
  }

  &::before {
    border-color: var(--mc-border);
    opacity: 0.9;
  }

  .stage-paper__kicker,
  .stage-paper__issuer,
  .stage-paper__title-level {
    color: var(--mc-text-secondary);
  }

  .stage-paper__title,
  .stage-paper__title-main {
    color: var(--mc-text);
  }

  .stage-paper__rule {
    background: var(--mc-wood-light);
  }

  .stage-paper__seal {
    border-color: var(--mc-wood);
    color: var(--mc-wood);
  }
}

.aw-lightbox__side {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px 22px;
  overflow-y: auto;
}

.aw-lightbox__kicker {
  font-family: 'JetBrains Mono', 'SFMono-Regular', Consolas, monospace;
  font-size: 10px;
  letter-spacing: 1.5px;
  color: var(--mc-text-secondary);
}

.aw-lightbox__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--mc-text);
}

.aw-lightbox__rows {
  margin: 0;
}

.lrow {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 9px 0;
  border-bottom: 1px solid var(--mc-border);
  font-size: 13px;

  dt {
    flex-shrink: 0;
    color: var(--mc-text-secondary);
  }

  dd {
    margin: 0;
    max-width: 62%;
    color: var(--mc-text);
    text-align: right;
    word-break: break-word;
  }
}

.lb-status {
  font-size: 12px;
  color: var(--mc-text-secondary);
}

.lb-status--error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border: 1px solid var(--mc-border);
  border-radius: $radius-base;
  background: var(--mc-danger-fade);
  color: var(--mc-text);

  button {
    padding: 0;
    border: none;
    background: none;
    color: var(--mc-danger);
    font-family: inherit;
    font-size: 12px;
    text-decoration: underline;
    cursor: pointer;
  }
}

.lb-audit {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border: 1px solid var(--mc-border);
  border-radius: $radius-base;
  background: var(--mc-bg);
  font-size: 12px;
  color: var(--mc-text-secondary);
}

.lb-audit__status {
  color: var(--mc-wood);
  font-weight: 600;
}

.lb-files__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.lb-files__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--mc-text);
}

.lb-files__privacy {
  font-size: 10px;
  color: var(--mc-text-secondary);
}

.lb-files__error {
  margin: 6px 0 0;
  font-size: 11px;
  color: var(--mc-danger);
}

.lb-file {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.lb-file > a {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.lb-file__download {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
  height: 22px;
  padding: 0 8px;
  border: 1px solid var(--mc-border);
  border-radius: $radius-sm;
  background: var(--mc-card);
  color: var(--mc-wood);
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: var(--mc-wood);
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
}

.lb-files__empty {
  margin: 0;
  font-size: 12px;
  color: var(--mc-text-secondary);
}

.lb-files__list {
  margin: 0;
  padding: 0;
  list-style: none;

  li + li {
    margin-top: 4px;
  }

  a {
    font-size: 12px;
    color: var(--mc-wood);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.aw-lightbox__actions {
  margin-top: auto;
  padding-top: 8px;
}

.lb-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  padding: 0 18px;
  border: none;
  border-radius: $radius-base;
  font-family: inherit;
  font-size: 13px;
  text-decoration: none;
  cursor: pointer;
  transition: background-color $duration-fast $ease-standard;

  &:disabled {
    cursor: default;
    opacity: 0.7;
  }
}

.lb-btn--primary {
  background: var(--mc-wood);
  color: var(--mc-card);

  &:hover {
    background: var(--mc-wood-light);
  }
}

@media (max-width: 860px) {
  .aw-lightbox {
    padding: 24px;
  }

  .aw-lightbox__panel {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: 220px minmax(0, 1fr);
    height: min(680px, 100%);
  }

  .aw-lightbox__stage {
    border-right: none;
    border-bottom: 1px solid var(--mc-border);
    padding: 20px;
  }
}
</style>
