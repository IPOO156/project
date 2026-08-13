<script setup lang="ts">
/**
 * HeatMap - 成果热力图
 *
 * 后端现状：成果聚合与热力图接口（/teacher/statistics/heatmap）尚未实现，
 * 筛选维度（学院/专业/班级）来自登录者数据范围，数据区展示待后端就绪的空态。
 */
import { Flame, Search } from 'lucide-vue-next'
import { computed, reactive } from 'vue'

import { useTeacherMe } from '@/shared/composables/useTeacherMe'

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

const filters = reactive({ college: '', major: '', className: '', keyword: '' })
</script>

<template>
  <div class="mc-page">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <p class="mc-page-head__eyebrow">成果热力图 · Heatmap</p>
        <h2 class="mc-page-head__title">成果热力图</h2>
        <p class="mc-page-head__desc">
          以学期为节点（大一至大四），查看学生的奖项、社会实践与成绩分布。 数据由后端
          /teacher/statistics/heatmap 提供。
        </p>
      </div>
    </div>

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
        <el-form-item label="学生">
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
        <span class="mc-card__title">学期成果分布</span>
      </div>
      <div class="mc-card__body">
        <div class="mc-empty">
          <div class="mc-empty__icon"><Flame :size="24" /></div>
          <p class="mc-empty__title">成果热力图数据待后端就绪</p>
          <p class="mc-empty__desc">
            各学期节点的奖项、社会实践与成绩热力展示，依赖后端聚合接口
            （/teacher/statistics/heatmap），接口就绪后自动呈现。
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
