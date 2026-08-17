<script setup lang="ts">
import type { SystemLogItem } from '@/shared/types/teacher'
/**
 * LogView - 日志查看
 * 对接后端：GET /admin/logs/system（管理员版，log:view 权限）
 * 支持按操作类型 / 模块 / 时间范围服务端筛选与分页。
 * 说明：后端 /admin/logs/system 不提供「年级/学院/专业」维度过滤，
 * 教师授权范围由 role_scopes 在后端按登录人决定，前端不额外伪造维度。
 */
import { RefreshCw, Search } from 'lucide-vue-next'

import { onMounted, reactive, ref } from 'vue'
import { getSystemLogs } from '@/shared/api/teacher'
import { LOG_ACTION_TYPES, LOG_MODULES } from '@/shared/constants/dict'
import LogTable from './components/LogTable.vue'

const filters = reactive({
  action: '',
  module: '',
  dateRange: [] as string[],
})

const actionOptions = [
  { value: '', label: '全部类型' },
  ...Object.entries(LOG_ACTION_TYPES).map(([value, { label }]) => ({ value, label })),
]
const moduleOptions = [
  { value: '', label: '全部模块' },
  ...Object.entries(LOG_MODULES).map(([value, label]) => ({ value, label })),
]

const logs = ref<SystemLogItem[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(10)
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const [start, end] = filters.dateRange
    const res = await getSystemLogs({
      page: page.value,
      per_page: perPage.value,
      action: filters.action || undefined,
      module: filters.module || undefined,
      startTime: start || undefined,
      endTime: end || undefined,
    })
    logs.value = res.list
    total.value = res.total
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
  filters.dateRange = []
  page.value = 1
  void load()
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

// ── 数据快照弹窗 ──
const snapshotVisible = ref(false)
const snapshotData = ref<{ before: unknown; after: unknown; title: string } | null>(null)

function handleViewSnapshot(row: SystemLogItem) {
  snapshotData.value = {
    before: row.beforeData,
    after: row.afterData,
    title: row.description ?? '操作记录',
  }
  snapshotVisible.value = true
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="mc-page log-view">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <p class="mc-page-head__eyebrow">系统运维 · Audit Logs</p>
        <h2 class="mc-page-head__title">操作日志</h2>
        <p class="mc-page-head__desc">
          查看授权范围内的系统操作记录。操作人、学号与 IP 按角色脱敏展示。
        </p>
      </div>
      <div class="mc-page-head__actions">
        <el-button :icon="RefreshCw" :loading="loading" @click="handleReset">刷新</el-button>
      </div>
    </div>

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
          <el-select v-model="filters.module" placeholder="全部模块" clearable style="width: 140px">
            <el-option
              v-for="opt in moduleOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" :loading="loading" @click="handleSearch">
            查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="mc-card">
      <div class="mc-card__head">
        <span class="mc-card__title">操作记录</span>
        <span class="log-view__total">共 {{ total }} 条记录</span>
      </div>
      <div class="mc-card__body">
        <LogTable v-loading="loading" :data="logs" @view="handleViewSnapshot" />

        <div class="log-view__pagination">
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

    <el-dialog
      v-model="snapshotVisible"
      title="数据快照"
      width="640px"
      @close="snapshotData = null"
    >
      <template v-if="snapshotData">
        <h4 class="log-view__snapshot-title">{{ snapshotData.title }}</h4>
        <el-tabs>
          <el-tab-pane label="变更前">
            <template v-if="snapshotData.before">
              <pre class="log-view__json">{{ JSON.stringify(snapshotData.before, null, 2) }}</pre>
            </template>
            <el-empty v-else description="无变更前数据" />
          </el-tab-pane>
          <el-tab-pane label="变更后">
            <template v-if="snapshotData.after">
              <pre class="log-view__json">{{ JSON.stringify(snapshotData.after, null, 2) }}</pre>
            </template>
            <el-empty v-else description="无变更后数据" />
          </el-tab-pane>
        </el-tabs>
      </template>
      <template #footer>
        <el-button @click="snapshotVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.log-view {
  &__total {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  &__masked {
    color: var(--el-text-color-secondary);
  }

  &__pagination {
    margin-top: $spacing-lg;
    display: flex;
    justify-content: flex-end;
  }

  &__snapshot-title {
    margin: 0 0 16px;
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__json {
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-light);
    border-radius: 6px;
    padding: 16px;
    font-size: 13px;
    line-height: 1.6;
    overflow-x: auto;
    max-height: 360px;
    color: var(--el-text-color-regular);
  }
}
</style>
