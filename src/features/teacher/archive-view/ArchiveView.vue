<script setup lang="ts">
import type { SemesterItem } from '@/shared/types/teacher'
/**
 * ArchiveView - 档案查看 / 学校整体档案汇总总览
 *
 * 后端现状：档案聚合汇总接口（/admin/archives/school 等）尚未实现，
 * 学期下拉、学院/专业/班级范围已接入真实数据（/common/semesters + /auth/me scopes），
 * 聚合数据区展示待后端就绪的空态。
 */
import { BarChart3, Search } from 'lucide-vue-next'

import { computed, onMounted, reactive, ref } from 'vue'
import { getSemesters } from '@/shared/api/teacher'
import { useTeacherMe } from '@/shared/composables/useTeacherMe'

const { me } = useTeacherMe()

const semesters = ref<SemesterItem[]>([])
const loadingSemesters = ref(false)

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
const majors = computed(
  () =>
    [
      ...new Set(
        (me.value?.scopes ?? [])
          .filter((s) => s.scopeType === 3)
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

const filters = reactive({
  semester: '',
  college: '',
  major: '',
  className: '',
  keyword: '',
})

onMounted(async () => {
  loadingSemesters.value = true
  try {
    semesters.value = await getSemesters()
  } catch {
    semesters.value = []
  } finally {
    loadingSemesters.value = false
  }
})

// 档案价值分级（后端聚合接口就绪后填充数值）
const tiers = [
  { label: '卓越档案', color: 'var(--el-color-danger)', count: null as number | null },
  { label: '优秀档案', color: 'var(--el-color-warning)', count: null as number | null },
  { label: '良好档案', color: 'var(--el-color-primary)', count: null as number | null },
  { label: '待完善', color: 'var(--el-text-color-secondary)', count: null as number | null },
]
</script>

<template>
  <div class="mc-page">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <p class="mc-page-head__eyebrow">档案查看 · Overview</p>
        <h2 class="mc-page-head__title">档案汇总总览</h2>
        <p class="mc-page-head__desc">
          按年级、学院、专业、班级查看档案分级与多维度汇总数据。聚合数据由后端
          /admin/archives/school 提供，接口就绪后自动加载。
        </p>
      </div>
    </div>

    <div class="mc-filter-bar">
      <el-form inline @submit.prevent>
        <el-form-item label="学期">
          <el-select
            v-model="filters.semester"
            placeholder="全部学期"
            clearable
            :loading="loadingSemesters"
            style="width: 180px"
          >
            <el-option v-for="s in semesters" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
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
        <el-form-item label="专业">
          <el-select v-model="filters.major" placeholder="全部专业" clearable style="width: 170px">
            <el-option v-for="m in majors" :key="m" :label="m" :value="m" />
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

    <el-row :gutter="16">
      <el-col v-for="tier in tiers" :key="tier.label" :xs="12" :sm="6">
        <div class="mc-card tier-card">
          <div class="mc-card__body tier-card__body">
            <span class="tier-card__label">{{ tier.label }}</span>
            <span class="tier-card__value mc-num" :style="{ color: tier.color }">
              {{ tier.count ?? '—' }}
            </span>
            <span class="tier-card__unit">人</span>
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="mc-card">
      <div class="mc-card__head">
        <span class="mc-card__title">多维度汇总</span>
      </div>
      <div class="mc-card__body">
        <div class="mc-empty">
          <div class="mc-empty__icon"><BarChart3 :size="24" /></div>
          <p class="mc-empty__title">档案聚合数据待后端就绪</p>
          <p class="mc-empty__desc">
            学科成绩、个人奖项、社会实践、兴趣爱好的多维度可视化，以及档案价值分级统计，
            依赖后端聚合接口（/admin/archives/school），接口就绪后自动呈现。
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tier-card {
  height: 100%;
  &__body {
    display: flex;
    align-items: baseline;
    gap: $spacing-sm;
  }
  &__label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
  &__value {
    font-size: 28px;
    font-weight: 700;
  }
  &__unit {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>
