<script setup lang="ts">
/**
 * CollegeReview - 材料审核
 *
 * 后端现状：待审核列表、审核通过/驳回、批量操作等接口（/teacher/audits/**）尚未实现，
 * 列表区展示待后端就绪的空态；筛选维度（学院/专业/班级）来自登录者数据范围。
 */
import { Check, ClipboardList, Search, TrendingUp, X } from 'lucide-vue-next'
import { computed, reactive } from 'vue'

import { useTeacherMe } from '@/shared/composables/useTeacherMe'
import { APPLICATION_TYPE_MAP } from '@/shared/constants/dict'

const { me } = useTeacherMe()

const colleges = computed(
  () =>
    [
      ...new Set(
        (me.value?.scopes ?? [])
          .filter((s) => s.scopeType === 2)
          .map((s) => s.scopeName)
          .filter(Boolean),
      ),
    ] as string[],
)
const classes = computed(
  () =>
    [
      ...new Set(
        (me.value?.scopes ?? [])
          .filter((s) => s.scopeType === 4)
          .map((s) => s.scopeName)
          .filter(Boolean),
      ),
    ] as string[],
)

const typeOptions = Object.entries(APPLICATION_TYPE_MAP).map(([value, label]) => ({ label, value }))

const filters = reactive({ college: '', className: '', type: '', keyword: '' })

// 审核统计（后端就绪后填充）
const stats = [
  {
    label: '待审核',
    value: null as number | null,
    icon: ClipboardList,
    color: 'var(--el-color-warning)',
  },
  {
    label: '今日新增',
    value: null as number | null,
    icon: TrendingUp,
    color: 'var(--el-color-primary)',
  },
  { label: '已通过', value: null as number | null, icon: Check, color: 'var(--el-color-success)' },
  { label: '已驳回', value: null as number | null, icon: X, color: 'var(--el-color-danger)' },
]
</script>

<template>
  <div class="mc-page">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <p class="mc-page-head__eyebrow">材料审核 · Review</p>
        <h2 class="mc-page-head__title">材料审核</h2>
        <p class="mc-page-head__desc">
          审核学生提交的申报材料，支持查看个人与材料详情、通过或驳回。 待审核数据由后端
          /teacher/audits/** 提供。
        </p>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col v-for="s in stats" :key="s.label" :xs="12" :sm="6">
        <div class="mc-card review-stat">
          <div class="mc-card__body review-stat__body">
            <div>
              <p class="review-stat__label">{{ s.label }}</p>
              <p class="review-stat__value mc-num">{{ s.value ?? '—' }}</p>
            </div>
            <div class="review-stat__icon" :style="{ '--chip': s.color }">
              <component :is="s.icon" :size="20" />
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="mc-filter-bar">
      <el-form inline @submit.prevent>
        <el-form-item label="学院">
          <el-select
            v-model="filters.college"
            placeholder="全部学院"
            clearable
            style="width: 150px"
          >
            <el-option v-for="c in colleges" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="班级">
          <el-select
            v-model="filters.className"
            placeholder="全部班级"
            clearable
            style="width: 150px"
          >
            <el-option v-for="c in classes" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="申报类型">
          <el-select v-model="filters.type" placeholder="全部类型" clearable style="width: 150px">
            <el-option v-for="t in typeOptions" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="filters.keyword"
            placeholder="姓名 / 学号"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search">查询</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="mc-card">
      <div class="mc-card__head">
        <span class="mc-card__title">待审核材料</span>
      </div>
      <div class="mc-card__body">
        <div class="mc-empty">
          <div class="mc-empty__icon"><ClipboardList :size="24" /></div>
          <p class="mc-empty__title">待审核数据待后端就绪</p>
          <p class="mc-empty__desc">
            待审核列表、审核详情、通过/驳回与批量操作依赖后端 /teacher/audits/** 接口，
            接口就绪后自动加载。审核操作界面已按契约预留。
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.review-stat {
  height: 100%;
  &__body {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  &__label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin-bottom: 6px;
  }
  &__value {
    font-size: 26px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }
  &__icon {
    width: 44px;
    height: 44px;
    border-radius: $radius-xl;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--chip, var(--el-color-primary));
    background: color-mix(in srgb, var(--chip, var(--el-color-primary)) 12%, transparent);
    box-shadow: inset 0 0 0 1px
      color-mix(in srgb, var(--chip, var(--el-color-primary)) 18%, transparent);
  }
}
</style>
