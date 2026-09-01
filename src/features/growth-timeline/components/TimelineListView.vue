<script setup lang="ts">
import type { GrowthExperience } from '../timeline-constants'
import { Plus, Trash2 } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { findRingBySemester, getSemesterLabel } from '../timeline-constants'

interface Props {
  experiences: GrowthExperience[]
  selectedId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  selectedId: null,
})

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'add'): void
  (e: 'delete', id: string): void
}>()

interface TypeMeta {
  label: string
  color: string
}

/** 经历类型元信息：与 GrowthCard 中已有的类型关键词保持一套口径，仅用作展示与筛选 */
const TYPE_LIST: TypeMeta[] = [
  { label: '竞赛', color: '#d4a574' },
  { label: '科研', color: '#8b6340' },
  { label: '实践', color: '#a67c52' },
  { label: '学业', color: '#5a7c5a' },
  { label: '技术', color: '#9a8474' },
  { label: '其他', color: '#8b6340' },
]

function inferTypeLabel(tags: string[]): string {
  const text = tags.join(' ')
  if (text.includes('竞赛') || text.includes('比赛')) return '竞赛'
  if (text.includes('科研') || text.includes('学术') || text.includes('论文')) return '科研'
  if (text.includes('实践') || text.includes('志愿') || text.includes('公益')) return '实践'
  if (text.includes('学业') || text.includes('奖学金') || text.includes('证书')) return '学业'
  if (text.includes('技术') || text.includes('编程')) return '技术'
  return '其他'
}

function typeColorOf(tags: string[]): string {
  const label = inferTypeLabel(tags)
  return TYPE_LIST.find((t) => t.label === label)?.color ?? TYPE_LIST[TYPE_LIST.length - 1]!.color
}

/** 学期筛选选项：复用 experiences 里的 semester 字段，按年轮 level 排序 */
const semesterOptions = computed(() => {
  const seen = new Set<string>()
  const list: { code: string; label: string; level: number }[] = []
  for (const exp of props.experiences) {
    if (!exp.semester || seen.has(exp.semester)) continue
    seen.add(exp.semester)
    list.push({
      code: exp.semester,
      label: getSemesterLabel(exp.semester),
      level: findRingBySemester(exp.semester)?.level ?? 999,
    })
  }
  return list.sort((a, b) => a.level - b.level)
})

/** 类型筛选选项：仅列出数据中实际出现的类型 */
const typeOptions = computed(() => {
  const labels = new Set(props.experiences.map((exp) => inferTypeLabel(exp.tags)))
  return TYPE_LIST.filter((t) => labels.has(t.label))
})

const semesterFilter = ref('')
const typeFilter = ref('')

const filteredExperiences = computed(() => {
  return props.experiences.filter((exp) => {
    if (semesterFilter.value && exp.semester !== semesterFilter.value) return false
    if (typeFilter.value && inferTypeLabel(exp.tags) !== typeFilter.value) return false
    return true
  })
})

function clearFilters() {
  semesterFilter.value = ''
  typeFilter.value = ''
}

function handleSelect(id: string) {
  emit('select', id)
}

function handleAdd() {
  emit('add')
}

/** 撤回/删除经历：交由父级（GrowthTimeline）统一弹确认框并调 deleteExperience */
function handleDelete(id: string) {
  emit('delete', id)
}
</script>

<template>
  <section class="timeline-list-view">
    <header class="tlv-header">
      <h2 class="tlv-title">成长记录</h2>
      <p class="tlv-subtitle">按学期或类型，快速回顾每一段成长。</p>
    </header>

    <div class="tlv-filters">
      <div class="tlv-filter-group">
        <span class="tlv-filter-label">学期</span>
        <div class="tlv-chips">
          <button
            type="button"
            class="tlv-chip"
            :class="{ 'tlv-chip--active': semesterFilter === '' }"
            @click="semesterFilter = ''"
          >
            全部
          </button>
          <button
            v-for="opt in semesterOptions"
            :key="opt.code"
            type="button"
            class="tlv-chip"
            :class="{ 'tlv-chip--active': semesterFilter === opt.code }"
            @click="semesterFilter = opt.code"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <div class="tlv-filter-group">
        <span class="tlv-filter-label">类型</span>
        <div class="tlv-chips">
          <button
            type="button"
            class="tlv-chip"
            :class="{ 'tlv-chip--active': typeFilter === '' }"
            @click="typeFilter = ''"
          >
            全部
          </button>
          <button
            v-for="opt in typeOptions"
            :key="opt.label"
            type="button"
            class="tlv-chip"
            :class="{ 'tlv-chip--active': typeFilter === opt.label }"
            @click="typeFilter = opt.label"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- 空数据引导 -->
    <div v-if="experiences.length === 0" class="tlv-empty">
      <div class="tlv-empty-mark" aria-hidden="true">年</div>
      <p class="tlv-empty-text">还没有成长记录，点击添加第一条经历</p>
      <button type="button" class="tlv-add-primary" @click="handleAdd">
        <Plus :size="16" />
        <span>添加第一条经历</span>
      </button>
    </div>

    <!-- 筛选后无结果 -->
    <div v-else-if="filteredExperiences.length === 0" class="tlv-empty">
      <p class="tlv-empty-text">没有符合当前筛选条件的记录</p>
      <button type="button" class="tlv-add-primary tlv-add-primary--ghost" @click="clearFilters">
        清除筛选
      </button>
    </div>

    <ul v-else class="tlv-list">
      <li v-for="exp in filteredExperiences" :key="exp.id" class="tlv-row">
        <button
          type="button"
          class="tlv-item"
          :class="{ 'tlv-item--selected': selectedId === exp.id }"
          @click="handleSelect(exp.id)"
        >
          <span
            class="tlv-type"
            :style="{ color: typeColorOf(exp.tags), borderColor: typeColorOf(exp.tags) }"
          >
            {{ inferTypeLabel(exp.tags) }}
          </span>
          <span class="tlv-main">
            <span class="tlv-item-title">{{ exp.title }}</span>
            <span class="tlv-item-date">{{ exp.date }}</span>
          </span>
          <span class="tlv-item-semester">{{ getSemesterLabel(exp.semester) }}</span>
        </button>
        <button
          type="button"
          class="tlv-delete"
          aria-label="撤回该经历"
          title="撤回"
          @click.stop="handleDelete(exp.id)"
        >
          <Trash2 :size="14" />
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped lang="scss">
.timeline-list-view {
  position: relative;
  z-index: 2;
  max-width: 760px;
  margin: 0 auto;
  padding: 5rem 1.5rem 6rem;
}

.tlv-header {
  margin-bottom: 2rem;
}

.tlv-title {
  font-family: 'Instrument Serif', serif;
  font-size: 2rem;
  font-weight: 500;
  color: var(--bark-dark, #2d1e12);
  margin: 0 0 0.5rem;
}

.tlv-subtitle {
  font-size: 0.9rem;
  color: var(--text-mid, #6b5443);
  margin: 0;
}

.tlv-filters {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.tlv-filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.tlv-filter-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--text-light, #9a8474);
}

.tlv-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tlv-chip {
  padding: 0.4rem 0.9rem;
  border-radius: 100px;
  border: 1px solid rgba(var(--gt-bark-rgb, 61 43 31), 0.1);
  background: rgba(var(--gt-card-rgb, 255 252 247), 0.7);
  color: var(--text-mid, #6b5443);
  font-size: 0.8rem;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
}

.tlv-chip:hover {
  border-color: var(--ring-color, var(--bark-light, #8b6340));
  color: var(--ring-color, var(--bark-light, #8b6340));
}

.tlv-chip--active {
  background: var(--gt-accent, #d4a574);
  border-color: var(--gt-accent, #d4a574);
  color: #fff;
}

.tlv-chip--active:hover {
  color: #fff;
  border-color: var(--gt-accent, #d4a574);
}

.tlv-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* 列表行：记录卡片 + 撤回按钮并排（记录占满剩余宽度） */
.tlv-row {
  display: flex;
  align-items: stretch;
  gap: 0.5rem;

  .tlv-item {
    flex: 1;
    min-width: 0;
  }
}

/* 撤回按钮：与年轮视图 GrowthCard 的 delete-btn 同风格（hover 才显示，触摸常显） */
.tlv-delete {
  flex-shrink: 0;
  align-self: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(var(--gt-bark-rgb, 61 43 31), 0.12);
  background: rgba(var(--gt-card-rgb, 255 252 247), 0.8);
  color: var(--ring-color, var(--bark-light, #8b6340));
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0.55;
  transition:
    opacity 0.25s ease,
    background 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.tlv-row:hover .tlv-delete,
.tlv-delete:focus-visible {
  opacity: 1;
}

.tlv-delete:hover {
  background: #b94e4e;
  color: #fff;
  transform: scale(1.1);
}

.tlv-delete:active {
  transform: scale(0.96);
}

@media (hover: none) {
  .tlv-delete {
    opacity: 1;
  }
}

[data-theme='dark'] .tlv-delete {
  background: rgba(var(--gt-card-rgb, 30 28 26), 0.85);
  border-color: rgba(var(--gt-bark-rgb, 200 180 160), 0.2);
  color: var(--ring-color, var(--bark-light, #d4a574));
}

[data-theme='dark'] .tlv-delete:hover {
  background: #b94e4e;
  color: #fff;
}

.tlv-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-radius: $radius-xl;
  border: 1px solid rgba(var(--gt-bark-rgb, 61 43 31), 0.1);
  background: rgba(var(--gt-card-rgb, 255 252 247), 0.75);
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.25s ease,
    background 0.25s ease,
    box-shadow 0.25s ease;
}

.tlv-item:hover {
  border-color: rgba(var(--gt-bark-rgb, 61 43 31), 0.2);
  background: rgba(var(--gt-card-rgb, 255 252 247), 0.95);
  box-shadow: 0 8px 24px rgba(var(--gt-shadow-rgb, 26 18 10), 0.08);
}

.tlv-item--selected {
  border-color: var(--ring-color, var(--bark-light, #8b6340));
  box-shadow: 0 0 0 1.5px var(--ring-color, var(--bark-light, #8b6340));
}

.tlv-type {
  flex-shrink: 0;
  min-width: 2.5rem;
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  letter-spacing: 1px;
  padding: 0.3rem 0.6rem;
  border: 1px solid;
  border-radius: 100px;
}

.tlv-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.tlv-item-title {
  font-size: 1rem;
  color: var(--bark-dark, #2d1e12);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tlv-item-date {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 1px;
  color: var(--text-light, #9a8474);
}

.tlv-item-semester {
  flex-shrink: 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  letter-spacing: 1px;
  color: var(--text-light, #9a8474);
}

.tlv-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem 1.5rem;
  text-align: center;
}

.tlv-empty-mark {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.5rem;
  color: var(--gt-accent, #d4a574);
  border: 1.5px dashed rgba(var(--gt-bark-rgb, 61 43 31), 0.25);
}

.tlv-empty-text {
  color: var(--text-mid, #6b5443);
  font-size: 0.95rem;
  margin: 0;
}

.tlv-add-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.4rem;
  border-radius: 100px;
  border: 1px solid var(--gt-accent, #d4a574);
  background: var(--gt-accent, #d4a574);
  color: #fff;
  font-size: 0.85rem;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.tlv-add-primary:hover {
  background: var(--gt-gold, #c8943e);
  border-color: var(--gt-gold, #c8943e);
}

.tlv-add-primary--ghost {
  background: transparent;
  border-color: rgba(var(--gt-bark-rgb, 61 43 31), 0.2);
  color: var(--text-mid, #6b5443);
}

.tlv-add-primary--ghost:hover {
  background: rgba(var(--gt-bark-rgb, 61 43 31), 0.05);
  color: var(--ring-color, var(--bark-light, #8b6340));
}

@media (max-width: 768px) {
  .timeline-list-view {
    padding: 6.5rem 1rem 4rem;
  }

  .tlv-title {
    font-size: 1.6rem;
  }

  .tlv-item {
    gap: 0.75rem;
    padding: 0.9rem 1rem;
  }

  .tlv-item-semester {
    display: none;
  }
}
</style>
