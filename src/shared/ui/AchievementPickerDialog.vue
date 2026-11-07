<script setup lang="ts">
import type {
  AchievementDetail,
  AchievementListItem,
  PickedAchievementFile,
} from '@/shared/api/achievements'
import { Check, Search, X } from 'lucide-vue-next'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { getAchievementDetail, getAchievements } from '@/shared/api/achievements'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', files: PickedAchievementFile[]): void
}>()

const items = ref<AchievementListItem[]>([])
const loading = ref(true)
const error = ref(false)
const keyword = ref('')
const selected = ref<string[]>([])
const confirming = ref(false)
const confirmError = ref('')

const visibleItems = computed(() => {
  const text = keyword.value.trim()
  if (!text) return items.value
  return items.value.filter((item) => item.title.includes(text) || item.issuer.includes(text))
})

function isSelectable(item: AchievementListItem): boolean {
  return item.materialStatus !== 'missing' && item.fileCount > 0
}

function toggle(id: string) {
  selected.value = selected.value.includes(id)
    ? selected.value.filter((item) => item !== id)
    : [...selected.value, id]
}

function formatDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-')
  return year && month && day ? `${year}.${month}.${day}` : value
}

async function load() {
  loading.value = true
  error.value = false
  try {
    const data = await getAchievements({ category: 'all', status: 'archived', per_page: 50 })
    items.value = (data.list ?? []).filter(isSelectable)
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

async function confirm() {
  if (selected.value.length === 0 || confirming.value) return
  confirming.value = true
  confirmError.value = ''
  try {
    const details = await Promise.all(
      selected.value.map((id) => getAchievementDetail(id).catch(() => null)),
    )
    const files = details
      .filter((detail): detail is AchievementDetail => !!detail)
      .flatMap((detail) =>
        detail.attachments.map((file) => ({
          achievementId: detail.id,
          achievementVersion: detail.version,
          achievementTitle: detail.title,
          fileId: file.fileId,
          fileName: file.fileName,
          mimeType: file.mimeType,
          url: file.url,
          previewUrl: file.previewUrl,
        })),
      )

    if (files.length === 0) {
      confirmError.value = '所选成果没有可引用的附件，请先到成果墙补充材料'
      return
    }
    emit('confirm', files)
  } catch {
    confirmError.value = '读取成果附件失败，请重试'
  } finally {
    confirming.value = false
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  void load()
})

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div class="ap-mask" @click.self="emit('close')">
      <div class="ap-panel" role="dialog" aria-modal="true" aria-labelledby="ap-title">
        <header class="ap-head">
          <div>
            <h2 id="ap-title" class="ap-head__title">从成果墙选择</h2>
            <p class="ap-head__desc">
              选中的证书按当前版本冻结快照，提交后成果再有改动也不影响本次申报。
            </p>
          </div>
          <button type="button" class="ap-close" aria-label="关闭" @click="emit('close')">
            <X :size="14" />
          </button>
        </header>

        <div class="ap-search">
          <Search :size="14" />
          <input v-model="keyword" class="ap-search__input" placeholder="搜索成果名称或颁发单位" />
        </div>

        <div class="ap-body">
          <p v-if="loading" class="ap-hint">正在读取成果墙…</p>
          <p v-else-if="error" class="ap-hint ap-hint--error">
            读取失败，<button type="button" class="ap-link" @click="load">重试</button>
          </p>
          <p v-else-if="visibleItems.length === 0" class="ap-hint">
            没有可选的成果，请先在成果墙归档证书。
          </p>
          <ul v-else class="ap-list">
            <li v-for="item in visibleItems" :key="item.id">
              <button
                type="button"
                class="ap-item"
                :class="{ 'ap-item--active': selected.includes(item.id) }"
                :aria-pressed="selected.includes(item.id)"
                @click="toggle(item.id)"
              >
                <span class="ap-check">
                  <Check v-if="selected.includes(item.id)" :size="12" />
                </span>
                <span class="ap-item__main">
                  <span class="ap-item__title">{{ item.title }}</span>
                  <span class="ap-item__meta">
                    {{ item.categoryLabel }} · {{ item.level || '未定级' }} · {{ item.issuer }} ·
                    {{ formatDate(item.eventAt) }} · {{ item.fileCount }} 份附件
                  </span>
                </span>
              </button>
            </li>
          </ul>
          <p v-if="confirmError" class="ap-hint ap-hint--error">{{ confirmError }}</p>
        </div>

        <footer class="ap-foot">
          <span class="ap-count">已选 {{ selected.length }} 项</span>
          <div class="ap-foot__actions">
            <button type="button" class="ap-btn" @click="emit('close')">取消</button>
            <button
              type="button"
              class="ap-btn ap-btn--primary"
              :disabled="selected.length === 0 || confirming"
              @click="confirm"
            >
              {{ confirming ? '读取中…' : '加入附件' }}
            </button>
          </div>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.ap-mask {
  position: fixed;
  inset: 0;
  z-index: 2100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: rgba(15, 23, 42, 0.52);
  font-family: inherit;
}

.ap-panel {
  display: flex;
  flex-direction: column;
  width: min(620px, 100%);
  max-height: min(660px, 100%);
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-bg-color);
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.18);
  overflow: hidden;
}

.ap-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.ap-head__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.ap-head__desc {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.ap-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
}

.ap-search {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 12px 18px 0;
  padding: 0 10px;
  height: 30px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  color: var(--el-text-color-placeholder);

  &__input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    font-family: inherit;
    font-size: 13px;
    color: var(--el-text-color-primary);
  }
}

.ap-body {
  flex: 1;
  min-height: 180px;
  padding: 10px 18px;
  overflow-y: auto;
}

.ap-hint {
  margin: 12px 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);

  &--error {
    color: var(--el-color-danger);
  }
}

.ap-link {
  padding: 0;
  border: none;
  background: transparent;
  color: var(--el-color-primary);
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
}

.ap-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ap-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-bg-color);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease;

  &:hover {
    border-color: var(--el-color-primary-light-5);
  }

  &--active {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}

.ap-check {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-top: 2px;
  border: 1px solid var(--el-border-color);
  border-radius: 3px;
  background: var(--el-bg-color);
  color: #fff;
}

.ap-item--active .ap-check {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
}

.ap-item__main {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.ap-item__title {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.ap-item__meta {
  font-size: 11px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.ap-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 18px 14px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.ap-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.ap-foot__actions {
  display: flex;
  gap: 8px;
}

.ap-btn {
  height: 30px;
  padding: 0 14px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }

  &--primary {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary);
    color: #fff;
  }
}
</style>
