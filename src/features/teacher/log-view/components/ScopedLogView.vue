<script setup lang="ts">
import type { SystemLogItem } from '@/shared/types/teacher'
import { RefreshCw, Search } from 'lucide-vue-next'
import { onMounted, reactive, ref } from 'vue'
import { listTeacherLogs } from '@/shared/api/teacher'
import { LOG_ACTION_TYPES, LOG_MODULES } from '@/shared/constants/dict'
import LogTable from './LogTable.vue'

/**
 * ScopedLogView - 教师/审核员的「授权范围内操作日志」
 * 数据来源：GET /teacher/logs（LogItem == SystemLogItem 结构）
 * 范围由后端按当前登录教师决定：返回本人操作 + role_scopes 授权范围内学生相关操作。
 */
const actionOptions = [
  { value: '', label: '全部类型' },
  ...Object.entries(LOG_ACTION_TYPES).map(([value, { label }]) => ({ value, label })),
]
const moduleOptions = [
  { value: '', label: '全部模块' },
  ...Object.entries(LOG_MODULES).map(([value, label]) => ({ value, label })),
]

const filters = reactive({
  action: '',
  module: '',
  grade: '',
  keyword: '',
  dateRange: [] as string[],
})

const logs = ref<SystemLogItem[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(10)
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const [start, end] = filters.dateRange
    const res = await listTeacherLogs({
      page: page.value,
      per_page: perPage.value,
      action: filters.action || undefined,
      module: filters.module || undefined,
      grade: filters.grade.trim() || undefined,
      keyword: filters.keyword.trim() || undefined,
      startTime: start || undefined,
      endTime: end || undefined,
    })
    logs.value = res.list ?? []
    total.value = res.total ?? logs.value.length
  } catch {
    logs.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  void load()
}

function handleReset() {
  filters.action = ''
  filters.module = ''
  filters.grade = ''
  filters.keyword = ''
  filters.dateRange = []
  handleSearch()
}

function handleSizeChange(size: number) {
  perPage.value = size
  page.value = 1
  void load()
}

function handlePageChange(p: number) {
  page.value = p
  void load()
}

onMounted(() => void load())
</script>

<template>
  <div class="scoped-log">
    <div class="mc-filter-bar">
      <el-form inline @submit.prevent="handleSearch">
        <el-form-item label="操作类型">
          <el-select v-model="filters.action" placeholder="全部类型" clearable style="width: 140px">
            <el-option
              v-for="opt in actionOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="模块">
          <el-select v-model="filters.module" placeholder="全部模块" clearable style="width: 130px">
            <el-option
              v-for="opt in moduleOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="年级">
          <el-input v-model="filters.grade" placeholder="如 2024" clearable style="width: 110px" />
        </el-form-item>
        <el-form-item label="学生">
          <el-input
            v-model="filters.keyword"
            placeholder="姓名 / 学号 / 描述"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 250px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" :loading="loading" @click="handleSearch">
            查询
          </el-button>
          <el-button :icon="RefreshCw" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="mc-card">
      <div class="mc-card__head">
        <span class="mc-card__title">授权范围内操作记录</span>
        <span class="scoped-log__total">共 {{ total }} 条记录</span>
      </div>
      <div class="mc-card__body">
        <div v-loading="loading" class="scoped-log__body">
          <template v-if="logs.length">
            <LogTable :data="logs" />
          </template>
          <el-empty v-else description="暂无操作记录" />
        </div>
        <div v-if="total > 0" class="scoped-log__pagination">
          <el-pagination
            :current-page="page"
            :page-size="perPage"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.scoped-log {
  &__body {
    min-height: 180px;
  }

  &__total {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  &__pagination {
    margin-top: $spacing-lg;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
