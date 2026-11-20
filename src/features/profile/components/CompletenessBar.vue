<script setup lang="ts">
// 档案数据完整度进度条：百分比大号突出显示，进度条颜色与页面主色一致（蓝色 #4a7fb5，同 ProfileInfo DIMENSION_COLORS_LIGHT）
// 数据源：GET /profile/data-completeness → overallRate（后端评分重算 recalculateForStudent 写入 data_completeness 表）
// 明细同样来自该接口的 dimensions[]：只展示后端返回的 rate / missingItems，不在前端重算完整度。
import type { CompletenessDimension } from '@/shared/api/student'
import { ChevronDown } from 'lucide-vue-next'
import { computed, ref } from 'vue'

const props = defineProps<{
  rate: number
  /** 各维度明细；接口未返回或为空时不展示「查看详情」入口 */
  dimensions?: CompletenessDimension[]
}>()

/** 与页面主色一致的进度条颜色 */
const BAR_COLOR = '#4a7fb5'

const dimensionList = computed(() => props.dimensions ?? [])
const hasDetail = computed(() => dimensionList.value.length > 0)
const expanded = ref(false)

/**
 * 学校维护、学生端只读的项：不能提示学生“还差”，否则会出现“提示缺学历层次但无处可填”的矛盾。
 * 单独标注“由学校维护”，学生可补充的项仍显示“还差”。
 */
const SYSTEM_MAINTAINED_ITEMS = new Set(['学历层次', '政治面貌', '学生状态'])

const dimensionRows = computed(() =>
  dimensionList.value.map((dim) => {
    const missing = dim.missingItems ?? []
    return {
      ...dim,
      studentMissing: missing.filter((item) => !SYSTEM_MAINTAINED_ITEMS.has(item)),
      systemMissing: missing.filter((item) => SYSTEM_MAINTAINED_ITEMS.has(item)),
    }
  }),
)
</script>

<template>
  <div class="completeness">
    <div class="completeness-bar">
      <span class="completeness-bar__label">档案数据完整度</span>
      <el-progress
        :percentage="rate"
        :stroke-width="14"
        :color="BAR_COLOR"
        class="completeness-bar__progress"
        :show-text="false"
      />
      <span class="completeness-bar__value">{{ rate }}%</span>
    </div>

    <div v-if="hasDetail" class="completeness__toggle-row">
      <el-button link type="primary" size="small" @click="expanded = !expanded">
        {{ expanded ? '收起' : '查看详情' }}
        <ChevronDown :size="14" class="completeness__chevron" :class="{ 'is-open': expanded }" />
      </el-button>
    </div>

    <div v-if="expanded" class="completeness-detail">
      <div v-for="dim in dimensionRows" :key="dim.dimensionCode" class="completeness-detail__item">
        <div class="completeness-detail__head">
          <span class="completeness-detail__name">{{ dim.dimensionName }}</span>
          <span class="completeness-detail__rate">{{ dim.rate }}%</span>
        </div>
        <el-progress
          :percentage="dim.rate"
          :stroke-width="6"
          :color="BAR_COLOR"
          :show-text="false"
          class="completeness-detail__progress"
        />
        <div class="completeness-detail__missing">
          <template v-if="dim.studentMissing.length">
            <span class="completeness-detail__hint">还差</span>
            <el-tag
              v-for="item in dim.studentMissing"
              :key="item"
              size="small"
              type="info"
              effect="plain"
              >{{ item }}</el-tag
            >
          </template>
          <template v-if="dim.systemMissing.length">
            <span class="completeness-detail__hint completeness-detail__hint--system"
              >由学校维护</span
            >
            <el-tag
              v-for="item in dim.systemMissing"
              :key="item"
              size="small"
              type="info"
              effect="plain"
              >{{ item }}</el-tag
            >
          </template>
          <span
            v-if="!dim.studentMissing.length && !dim.systemMissing.length"
            class="completeness-detail__done"
            >已完善</span
          >
        </div>
      </div>
      <p class="completeness-detail__note">
        同一项若在多个维度中重复出现，只按一次计分，重复出现不代表需要重复补充。
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.completeness {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.completeness-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;

  &__label {
    font-size: 13px;
    color: #475569;
    white-space: nowrap;
  }

  &__progress {
    flex: 1;
    min-width: 200px;
  }

  &__value {
    min-width: 52px;
    font-size: 18px;
    font-weight: 700;
    color: #1e293b;
    text-align: right;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }

  /* 375 宽度下「标签 + 200px 最小进度条 + 百分比」会超出容器，裁掉百分比；
     移动端允许进度条继续收缩，保证 100% 数值完整可见 */
  @media (max-width: 640px) {
    &__progress {
      min-width: 0;
    }

    &__value {
      min-width: 46px;
      font-size: 16px;
    }
  }
}

.completeness__toggle-row {
  display: flex;
  justify-content: flex-end;

  :deep(.el-button.is-link) {
    height: auto;
    padding: 0;
    font-size: 13px;
    color: #4a7fb5;

    &:hover {
      color: #3a6a9a;
    }
  }
}

.completeness__chevron {
  margin-left: 2px;
  transition: transform $duration-base $ease-standard;

  &.is-open {
    transform: rotate(180deg);
  }
}

.completeness-detail {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #f1f5f9;
}

.completeness-detail__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 6px;
}

.completeness-detail__name {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

.completeness-detail__rate {
  font-size: 13px;
  font-weight: 600;
  color: #4a7fb5;
  font-variant-numeric: tabular-nums;
}

.completeness-detail__progress {
  margin-bottom: 8px;
}

.completeness-detail__missing {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.completeness-detail__hint {
  font-size: 12px;
  color: #94a3b8;
}

.completeness-detail__hint--system {
  margin-left: 8px;
  color: #b45309;
}

.completeness-detail__done {
  font-size: 12px;
  color: #10b981;
}

.completeness-detail__note {
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
  font-size: 12px;
  line-height: 1.6;
  color: #94a3b8;
}

// 夜间模式适配：盒子降为卡片层深色，文字亮化保证可读
html.dark .completeness-bar {
  background: #0f172a;
  border-color: #334155;

  &__label {
    color: #94a3b8;
  }

  &__value {
    color: #f1f5f9;
  }
}

html.dark {
  .completeness__toggle-row :deep(.el-button.is-link) {
    color: #7fb0e0;

    &:hover {
      color: #a9c9e8;
    }
  }

  .completeness-detail {
    background: #0f172a;
    border-color: #334155;
  }

  .completeness-detail__name {
    color: #cbd5e1;
  }

  .completeness-detail__rate {
    color: #7fb0e0;
  }

  .completeness-detail__hint {
    color: #64748b;
  }

  .completeness-detail__done {
    color: #34d399;
  }

  .completeness-detail__note {
    border-top-color: #334155;
    color: #64748b;
  }
}
</style>
