<script setup lang="ts">
import type { Component } from 'vue'
import { Activity, CheckCircle2, Clock, FileText, XCircle } from 'lucide-vue-next'
import { computed } from 'vue'

/**
 * 申报 / 奖项中心通用的「审核进度」条。
 * 不做 4 张 KPI 卡（避免与首页仪表盘重复），只把当前提交处在哪一步压成一条分段进度。
 */
interface Props {
  total: number
  pending: number
  approved: number
  rejected: number
  /** 表头总数后的补充说明，例如「本学期新增 5 项」 */
  note?: string
}

const props = defineProps<Props>()

interface Segment {
  key: string
  label: string
  value: number
  icon: Component
  tone: 'success' | 'warning' | 'danger' | 'muted'
}

const segments = computed<Segment[]>(() => [
  {
    key: 'approved',
    label: '已通过',
    value: props.approved,
    icon: CheckCircle2,
    tone: 'success',
  },
  { key: 'pending', label: '待审核', value: props.pending, icon: Clock, tone: 'warning' },
  { key: 'rejected', label: '被退回', value: props.rejected, icon: XCircle, tone: 'danger' },
  {
    key: 'other',
    label: '草稿及其他',
    value: Math.max(props.total - props.approved - props.pending - props.rejected, 0),
    icon: FileText,
    tone: 'muted',
  },
])

const ariaText = computed(() =>
  segments.value.map((item) => `${item.label} ${item.value} 条`).join('，'),
)
</script>

<template>
  <section class="submission-progress" aria-label="申报审核进度">
    <div class="submission-progress__head">
      <span class="submission-progress__title"><Activity :size="15" />审核进度</span>
      <span class="submission-progress__meta">
        共 <b>{{ total }}</b> 条申报记录<template v-if="note"> · {{ note }}</template>
      </span>
    </div>

    <div
      class="submission-progress__bar"
      role="img"
      :aria-label="`共 ${total} 条申报：${ariaText}`"
    >
      <span
        v-for="seg in segments"
        v-show="seg.value > 0"
        :key="seg.key"
        class="submission-progress__seg"
        :class="`is-${seg.tone}`"
        :style="{ flexGrow: seg.value }"
      />
    </div>

    <ul class="submission-progress__legend">
      <li
        v-for="seg in segments"
        :key="seg.key"
        :class="[`is-${seg.tone}`, { 'is-zero': !seg.value }]"
      >
        <component :is="seg.icon" :size="14" />
        <span>{{ seg.label }}</span>
        <b>{{ seg.value }}</b>
      </li>
    </ul>
  </section>
</template>

<style scoped lang="scss">
.submission-progress {
  padding: 14px 18px;
  border: 1px solid var(--el-border-color);
  border-radius: $radius-lg;
  background: var(--el-bg-color);
  box-shadow: $shadow-sm;
}

.submission-progress__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px 16px;
  flex-wrap: wrap;
}

.submission-progress__title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);

  svg {
    color: var(--el-color-primary);
  }
}

.submission-progress__meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;

  b {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

/* 分段条：用占比宽度表达构成，颜色只承担状态区分，数值由下方图例给出 */
.submission-progress__bar {
  display: flex;
  gap: 2px;
  height: 10px;
  margin-top: 12px;
  border-radius: 999px;
  background: var(--el-fill-color-light);
  overflow: hidden;
}

.submission-progress__seg {
  flex: 0 1 0;
  min-width: 6px;
  border-radius: 2px;
  background: var(--seg-color);
  transition: flex-grow 0.3s ease;

  &:first-child {
    border-radius: 999px 2px 2px 999px;
  }
  &:last-child {
    border-radius: 2px 999px 999px 2px;
  }
  &:only-child {
    border-radius: 999px;
  }
}

.submission-progress__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 20px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;

  li {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: var(--el-text-color-secondary);

    &.is-zero {
      opacity: 0.55;
    }
  }

  svg {
    color: var(--seg-color);
  }

  b {
    font-weight: 600;
    color: var(--el-text-color-primary);
    font-variant-numeric: tabular-nums;
  }
}

.submission-progress .is-success {
  --seg-color: var(--el-color-success);
}
.submission-progress .is-warning {
  --seg-color: var(--el-color-warning);
}
.submission-progress .is-danger {
  --seg-color: var(--el-color-danger);
}
.submission-progress .is-muted {
  --seg-color: var(--el-text-color-placeholder);
}
</style>
