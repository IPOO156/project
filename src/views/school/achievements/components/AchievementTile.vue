<script setup lang="ts">
import type { AchievementListItem } from '@/shared/api/achievements'
import { Plus } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { categoryLabelOf, formatEventMonth } from '../composables/useAchievementWall'

const props = defineProps<{
  item: AchievementListItem
}>()

defineEmits<{
  (e: 'open', item: AchievementListItem): void
}>()

const imageFailed = ref(false)

const categoryText = computed(() => categoryLabelOf(props.item))
const isMissingCard = computed(
  () => !props.item.thumbnailUrl && props.item.materialStatus === 'missing',
)
const hasImage = computed(
  () => !!props.item.thumbnailUrl && !imageFailed.value && !isMissingCard.value,
)
const showFlag = computed(() => !isMissingCard.value && props.item.materialStatus === 'missing')

const coverIssuer = computed(() => {
  const year = props.item.eventAt ? props.item.eventAt.slice(0, 4) : ''
  return [props.item.issuer, year].filter(Boolean).join(' · ')
})
const sealText = computed(() => props.item.materialLabel || categoryText.value)

const metaText = computed(() => {
  if (isMissingCard.value) {
    return props.item.materialLabel || '待补充材料'
  }
  const parts = [props.item.level, formatEventMonth(props.item.eventAt)].filter(Boolean)
  return parts.join(' · ') || props.item.materialLabel || ''
})

const tagText = computed(() => (isMissingCard.value ? '待补' : categoryText.value))
</script>

<template>
  <button
    type="button"
    class="tile"
    :class="{ 'tile--missing': isMissingCard }"
    :aria-label="`查看成果：${item.title}`"
    @click="$emit('open', item)"
  >
    <span class="tile__thumb">
      <span v-if="isMissingCard" class="missing">
        <span class="missing__icon"><Plus :size="18" /></span>
        <span class="missing__text">待补充材料</span>
        <span class="missing__hint">上传后自动归档</span>
      </span>

      <img
        v-else-if="hasImage"
        class="tile__image"
        :src="item.thumbnailUrl ?? ''"
        :alt="item.title"
        loading="lazy"
        @error="imageFailed = true"
      />

      <span v-else class="cover" :class="{ 'cover--photo': item.category === 'practice' }">
        <span class="cover__kicker">{{ categoryText }}</span>
        <span class="cover__title">
          <span class="cover__title-main">{{ item.title }}</span>
          <span v-if="item.level" class="cover__title-level">{{ item.level }}</span>
        </span>
        <span class="cover__rule"></span>
        <span class="cover__issuer">{{ coverIssuer }}</span>
        <span class="cover__seal">{{ sealText }}</span>
      </span>

      <span v-if="showFlag" class="tile__flag">{{ item.materialLabel || '缺材料' }}</span>
    </span>

    <span class="tile__body">
      <span class="tile__title">{{ item.title }}</span>
      <span class="tile__meta">
        <span class="tile__meta-text">{{ metaText }}</span>
        <span class="tile__cat">{{ tagText }}</span>
      </span>
    </span>
  </button>
</template>

<style scoped lang="scss">
.tile {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 0;
  border: 1px solid var(--mc-border);
  /* 学生端卡片圆角 8，不要统一到 $radius-card(9)：9 属教师/管理员端档位 */
  border-radius: $radius-lg;
  background: var(--mc-card);
  color: var(--mc-text);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  transition:
    border-color $duration-base $ease-standard,
    box-shadow $duration-base $ease-standard;

  &:hover {
    border-color: var(--mc-gold);
    box-shadow: var(--mc-shadow);
  }

  &:focus-visible {
    outline: 2px solid var(--mc-wood);
    outline-offset: 2px;
  }
}

.tile__thumb {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 148px;
  padding: 12px;
  border-bottom: 1px solid var(--mc-border);
  background: linear-gradient(160deg, var(--mc-cream), transparent 58%), var(--mc-bg);
  overflow: hidden;
}

.tile__image {
  width: 100%;
  height: 100%;
  border-radius: $radius-sm;
  object-fit: cover;
  display: block;
}

/* ---------- 无图占位：纸面 ---------- */
.cover {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 88%;
  height: 100%;
  padding: 10px 8px;
  border: 1px solid var(--mc-gold);
  border-radius: $radius-sm;
  background: linear-gradient(180deg, var(--mc-card), var(--mc-bg));

  &::before {
    content: '';
    position: absolute;
    inset: 5px;
    border: 1px solid var(--mc-gold);
    border-radius: 2px;
    opacity: 0.3;
    pointer-events: none;
  }
}

.cover__kicker {
  font-family: 'JetBrains Mono', 'SFMono-Regular', Consolas, monospace;
  font-size: 10px;
  letter-spacing: 2.5px;
  color: var(--mc-text-secondary);
}

.cover__title {
  display: flex;
  flex-direction: column;
  gap: 1px;
  max-width: 100%;
  min-width: 0;
  font-family: 'Noto Serif SC', serif;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.35;
  letter-spacing: 0.5px;
  text-align: center;
  color: var(--mc-wood);
}

/* 每行独立省略：第二行 level 不会被第一行标题挤出可视区 */
.cover__title-main,
.cover__title-level {
  display: block;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cover__title-level {
  font-weight: 500;
  color: var(--mc-text-secondary);
}

.cover__rule {
  width: 42px;
  height: 1px;
  background: var(--mc-gold);
}

.cover__issuer {
  max-width: calc(100% - 28px);
  padding-right: 8px;
  font-size: 10px;
  line-height: 1.4;
  color: var(--mc-text-secondary);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cover__seal {
  position: absolute;
  right: 6px;
  bottom: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
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

/* ---------- 无图占位：实践影像 ---------- */
/* 只用背景类变量，避免深色模式下随主题反转的前景色把缩略区翻成亮块 */
.cover--photo {
  border-color: var(--mc-border);
  background:
    radial-gradient(120% 90% at 18% 0%, var(--mc-primary-fade) 0%, transparent 62%),
    linear-gradient(160deg, var(--mc-row-hover) 0%, var(--mc-cream) 55%, var(--mc-bg) 100%);

  /* 深色的暖色 tint 会让缩略区比卡片亮，深色只叠卡片色→页面底色 */
  html.dark &,
  [data-theme='dark'] & {
    background: linear-gradient(160deg, var(--mc-card) 0%, var(--mc-bg) 100%);
  }

  &::before {
    border-color: var(--mc-border);
    opacity: 0.9;
  }

  .cover__kicker,
  .cover__issuer,
  .cover__title-level {
    color: var(--mc-text-secondary);
  }

  .cover__title,
  .cover__title-main {
    color: var(--mc-text);
  }

  .cover__rule {
    background: var(--mc-wood-light);
  }

  .cover__seal {
    border-color: var(--mc-wood);
    color: var(--mc-wood);
  }
}

/* ---------- 缺失材料 ---------- */
.tile--missing {
  border-style: dashed;
  border-color: var(--mc-gold);
  background: var(--mc-bg);

  .tile__thumb {
    border-bottom-style: dashed;
    border-bottom-color: var(--mc-gold);
    background: repeating-linear-gradient(135deg, var(--mc-cream) 0 10px, transparent 10px 20px);
  }

  .tile__title {
    color: var(--mc-text-secondary);
  }
}

.missing {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--mc-wood);
}

.missing__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px dashed var(--mc-gold);
  border-radius: 50%;
}

.missing__text {
  font-size: 12px;
  letter-spacing: 1px;
  color: var(--mc-text);
}

.missing__hint {
  font-family: 'JetBrains Mono', 'SFMono-Regular', Consolas, monospace;
  font-size: 10px;
  letter-spacing: 1.5px;
  color: var(--mc-text-secondary);
}

.tile__flag {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
  padding: 3px 7px;
  border-radius: $radius-sm;
  background: var(--mc-danger);
  color: var(--mc-card);
  font-size: 10px;
  letter-spacing: 0.5px;
}

.tile__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  min-width: 0;
}

.tile__title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.45;
  color: var(--mc-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tile__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  color: var(--mc-text-secondary);
  min-width: 0;
}

.tile__meta-text {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tile__cat {
  flex-shrink: 0;
  padding: 2px 6px;
  border: 1px solid var(--mc-border);
  border-radius: $radius-tag;
  background: var(--mc-bg);
  color: var(--mc-wood);
  font-family: 'JetBrains Mono', 'SFMono-Regular', Consolas, monospace;
  font-size: 10px;
  letter-spacing: 0.5px;
  line-height: 1.2;
}
</style>
