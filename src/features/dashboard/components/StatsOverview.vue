<script setup lang="ts">
import type { Component } from 'vue'
import { computed } from 'vue'

interface StatCard {
  label: string
  value: string | number
  /** 数值单位（次 / GPA） */
  unit: string
  /** 卡片脚注：由父级按真实数据是否齐全决定文案 */
  foot: string
  icon: Component
  color: string
  path?: string
}

/** 指标派生所需的真实计数；缺数据时对应字段为 null（不补 0、不编造） */
interface StatSnapshot {
  total: number | null
  approved: number | null
  pending: number | null
  rejected: number | null
  gpa: number | null
}

const props = defineProps<{
  cards: StatCard[]
  snapshot: StatSnapshot
  meta: { ruleVersion: string; calculatedAt: string; completeness: string }
}>()

const emit = defineEmits<{
  (e: 'cardClick', path: string): void
}>()

/** 完整度环：仅当文案是百分数时才画环，否则画虚线占位 */
const completenessPercent = computed<number | null>(() => {
  const raw = props.meta.completeness
  if (!raw.endsWith('%')) return null
  const value = Number.parseInt(raw, 10)
  return Number.isFinite(value) ? value : null
})

const hasTotal = computed(() => props.snapshot.total !== null)

/**
 * 12 格点阵：把「通过 / 待审 / 其他」按真实计数等比映射到 12 格。
 * 只是把已有三个计数画成图形，不引入新口径；无总数时全部落空。
 */
const dots = computed<string[]>(() => {
  const { total, approved, pending, rejected } = props.snapshot
  if (total === null || total <= 0) return Array.from({ length: 12 }, () => '')
  const other = Math.max(
    (rejected ?? 0) + Math.max(total - (approved ?? 0) - (pending ?? 0) - (rejected ?? 0), 0),
    0,
  )
  const boundaries = [
    approved ?? 0,
    (approved ?? 0) + (pending ?? 0),
    (approved ?? 0) + (pending ?? 0) + other,
  ]
  return Array.from({ length: 12 }, (_, index) => {
    const position = ((index + 1) / 12) * total
    if (position <= boundaries[0]) return 'on'
    if (position <= boundaries[1]) return 'wait'
    return 'other'
  })
})

/** 待审批点阵：固定 5 格，点亮格数 = min(待审批数, 5) */
const pendingSegments = computed<number>(() => Math.min(props.snapshot.pending ?? 0, 5))

/** 学期均绩刻度：0–4.0 口径，映射到 0–100% */
const gpaPercent = computed<number | null>(() => {
  const gpa = props.snapshot.gpa
  if (gpa === null) return null
  return Math.max(0, Math.min(100, (gpa / 4) * 100))
})

function handleCardClick(path?: string) {
  if (path) emit('cardClick', path)
}

function handleCardKeydown(event: KeyboardEvent, path?: string) {
  if (!path) return
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    emit('cardClick', path)
  }
}
</script>

<template>
  <section class="stats-band" aria-label="本期概览">
    <header class="stats-band__head">
      <h2 class="stats-band__title">本期概览</h2>
      <div class="stats-band__meta">
        <span>规则版本 {{ meta.ruleVersion }}</span>
        <span>计算时间 {{ meta.calculatedAt }}</span>
        <span>数据完整度 {{ meta.completeness }}</span>
      </div>
      <div class="stats-band__ring">
        <svg
          v-if="completenessPercent !== null"
          width="44"
          height="44"
          viewBox="0 0 44 44"
          role="img"
          :aria-label="`数据完整度 ${completenessPercent}%`"
        >
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="var(--el-border-color-lighter)"
            stroke-width="3"
          />
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="#2d5a87"
            stroke-width="3"
            pathLength="100"
            :stroke-dasharray="`${completenessPercent} ${100 - completenessPercent}`"
            stroke-linecap="round"
            transform="rotate(-90 22 22)"
          />
          <text
            x="22"
            y="25"
            text-anchor="middle"
            font-size="12"
            fill="var(--el-text-color-primary)"
          >
            {{ completenessPercent }}%
          </text>
        </svg>
        <svg
          v-else
          width="44"
          height="44"
          viewBox="0 0 44 44"
          role="img"
          aria-label="数据完整度暂无"
        >
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="var(--el-border-color)"
            stroke-width="1"
            stroke-dasharray="3 4"
          />
          <text
            x="22"
            y="25"
            text-anchor="middle"
            font-size="12"
            fill="var(--el-text-color-placeholder)"
          >
            --
          </text>
        </svg>
      </div>
    </header>

    <div class="stats-band__grid">
      <div
        v-for="(card, index) in cards"
        :key="card.label"
        class="kpi"
        :class="{ 'kpi--clickable': card.path }"
        role="button"
        :tabindex="card.path ? 0 : undefined"
        @click="handleCardClick(card.path)"
        @keydown="handleCardKeydown($event, card.path)"
      >
        <div class="kpi__row">
          <div class="kpi__info">
            <p class="kpi__label">{{ card.label }}</p>
            <p class="kpi__num">
              <b class="kpi__value">{{ card.value }}</b>
              <span class="kpi__unit">{{ card.unit }}</span>
            </p>
          </div>
          <span class="kpi__icon" :style="{ color: card.color, background: `${card.color}15` }">
            <component :is="card.icon" :size="24" />
          </span>
        </div>

        <div class="kpi__viz">
          <!-- 申报总数：通过 / 待审 / 其他 三色点阵 -->
          <div v-if="index === 0" class="dots12" :class="{ 'dots12--empty': !hasTotal }">
            <i v-for="(state, dotIndex) in dots" :key="dotIndex" :class="state" />
          </div>

          <!-- 已通过：三色图例（数值取自真实计数） -->
          <div v-else-if="index === 1" class="dotlegend">
            <span v-if="snapshot.approved !== null">
              <i class="dotlegend__sq dotlegend__sq--pass" />通过 {{ snapshot.approved }}
            </span>
            <span v-if="snapshot.pending !== null">
              <i class="dotlegend__sq dotlegend__sq--wait" />待审 {{ snapshot.pending }}
            </span>
            <span v-if="snapshot.rejected !== null">
              <i class="dotlegend__sq dotlegend__sq--other" />其他 {{ snapshot.rejected }}
            </span>
            <span v-if="snapshot.approved === null" class="dotlegend__empty">
              <i class="dotlegend__sq dotlegend__sq--empty" />暂无通过记录
            </span>
          </div>

          <!-- 待审批：固定 5 格，按真实待审数点亮 -->
          <div
            v-else-if="index === 2"
            class="pend"
            :aria-label="`${snapshot.pending ?? 0} 项待审批`"
          >
            <i v-for="n in 5" :key="n" :class="{ on: n <= pendingSegments }" />
          </div>

          <!-- 学期均绩：0–4.0 刻度 -->
          <div v-else class="gscale-wrap">
            <div class="gscale" :class="{ 'gscale--empty': gpaPercent === null }">
              <span
                v-if="gpaPercent !== null"
                class="gscale__fill"
                :style="{ width: `${gpaPercent}%` }"
              />
              <span
                v-if="gpaPercent !== null"
                class="gscale__mk"
                :style="{ left: `${gpaPercent}%` }"
              />
            </div>
            <div class="gscale__lab"><span>0</span><span>4.0</span></div>
          </div>
        </div>

        <div class="kpi__foot">{{ card.foot }}</div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
/* KPI 带：标题行 + 四张互不共享外框的独立卡（卡间仅用 gap 留白，无分隔线） */
.stats-band {
  flex: 0 0 auto;
  // 与上一版一致的 190px：标题行 44 + 8 间距 + 四张卡 138
  height: 190px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.stats-band__head {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 0 16px;
}

.stats-band__title {
  margin: 0;
  font-size: $font-size-lg;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.stats-band__meta {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  font-size: $font-size-xs;
  color: var(--el-text-color-secondary);

  span {
    white-space: nowrap;
  }
}

.stats-band__ring {
  margin-left: auto;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  flex: 0 0 44px;
}

.stats-band__grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-auto-rows: minmax(0, 1fr);
  gap: 12px;
  min-width: 0;
}

.kpi {
  display: flex;
  flex-direction: column;
  // 卡片撑满本带剩余高度，富余留白均分到「标签区→图区→脚注」之间，不堆在顶部
  justify-content: space-between;
  min-width: 0;
  padding: 10px 16px 8px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  // 与页面卡片同档位（$radius-card = 9px），不另起圆角
  border-radius: $radius-card;
  box-shadow: $shadow-sm;
  transition: background-color $duration-fast $ease-standard;

  &--clickable {
    cursor: pointer;
    // 与 HEAD 的 .stat-card--clickable 一致：抬升 150ms 标准曲线，按压 100ms 收窄
    transition:
      transform $duration-fast $ease-standard,
      background-color $duration-fast $ease-standard,
      box-shadow $duration-fast $ease-standard;

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        transform: translateY(-2px);
        // --el-box-shadow-light 在本项目被映射为与静止态相同的 $shadow-sm，
        // 悬停改用高一级的现有档位 --el-box-shadow（$shadow-base），保证阴影可见
        box-shadow: var(--el-box-shadow);
      }
    }

    &:active {
      transform: scale(0.97);
      transition-duration: $duration-instant;
    }
  }

  &--clickable:hover,
  &--clickable:focus-visible {
    background: var(--el-fill-color-lighter);
  }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  &__info {
    min-width: 0;
  }

  &__label {
    margin: 0;
    font-size: $font-size-base;
    color: var(--el-text-color-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__num {
    display: flex;
    align-items: baseline;
    gap: 4px;
    margin: 1px 0 0;
  }

  &__value {
    font-size: $font-size-3xl;
    font-weight: 700;
    // 与源码一致：不额外收紧行高
    line-height: normal;
    color: var(--el-text-color-primary);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  &__unit {
    font-size: $font-size-xs;
    color: var(--el-text-color-placeholder);
  }

  /* StatsOverview 原值：48×48 / 圆角 8 / 24px 图标 / #RRGGBB15 底色 */
  &__icon {
    width: 48px;
    height: 48px;
    flex: 0 0 48px;
    border-radius: $radius-lg;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__viz {
    height: 24px;
    margin-top: 6px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  &__foot {
    margin-top: 4px;
    font-size: $font-size-xs;
    line-height: 18px;
    color: var(--el-text-color-placeholder);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.dots12 {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 3px;

  i {
    height: 7px;
    border-radius: 2px;
    background: var(--el-fill-color-light);

    &.on {
      background: #67c23a;
    }

    &.wait {
      background: #e6a23c;
    }

    &.other {
      background: var(--el-border-color);
    }
  }

  &--empty i {
    border: 1px dashed var(--el-border-color);
    background: transparent;
  }
}

.dotlegend {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: $font-size-xs;
  color: var(--el-text-color-secondary);

  span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }

  &__sq {
    width: 7px;
    height: 7px;
    border-radius: 2px;
    display: inline-block;

    &--pass {
      background: #67c23a;
    }

    &--wait {
      border: 1px solid #e6a23c;
    }

    &--other {
      background: var(--el-border-color);
    }

    &--empty {
      border: 1px dashed var(--el-border-color-dark);
    }
  }

  &__empty {
    color: var(--el-text-color-secondary);
  }
}

.pend {
  display: flex;
  gap: 4px;

  i {
    width: 14px;
    height: 7px;
    border-radius: 2px;
    border: 1px dashed #e6a23c;

    &.on {
      background: #e6a23c;
      border-style: solid;
    }
  }
}

.gscale-wrap {
  min-width: 0;
}

.gscale {
  position: relative;
  height: 6px;
  border-radius: 999px;
  background: var(--el-fill-color-light);

  &--empty {
    border: 1px dashed var(--el-border-color);
    background: transparent;
  }

  &__fill {
    position: absolute;
    inset: 0 auto 0 0;
    border-radius: 999px;
    background: $color-accent-light;
  }

  &__mk {
    position: absolute;
    top: -2px;
    width: 2px;
    height: 10px;
    background: $color-accent;
  }

  &__lab {
    display: flex;
    justify-content: space-between;
    margin-top: 2px;
    font-size: $font-size-xs;
    color: var(--el-text-color-placeholder);
  }
}

@media (max-width: 1199px) {
  .stats-band {
    height: auto;
  }

  .stats-band__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-rows: auto;
  }

  .stats-band__meta {
    display: none;
  }
}

@media (max-width: 767px) {
  .stats-band__grid {
    grid-template-columns: 1fr;
  }
}
</style>
