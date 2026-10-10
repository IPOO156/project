<script setup lang="ts">
import type { AuditHistoryItem, AuditHistoryQuery } from '@/shared/types/teacher'
import { RefreshCw, Search } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref } from 'vue'
import { listAuditHistory } from '@/shared/api/teacher'
import { AUDIT_ACTIONS, AUDIT_BUSINESS_TYPES } from '@/shared/constants/dict'
import { formatDateTime } from '@/shared/utils/time'

/**
 * 材料审核 - 我的审核记录（教师端）
 * 数据来源：GET /teacher/audits/history
 * 返回当前教师在 audit_logs 中的操作记录（通过/退回/撤回/转交），标题与学生信息按业务主数据反解。
 */

const actionOptions = [
  { value: '', label: '全部动作' },
  ...Object.entries(AUDIT_ACTIONS).map(([value, meta]) => ({
    value: Number(value),
    label: meta.label,
  })),
]

const typeOptions = computed(() => [
  { value: '', label: '全部业务' },
  ...Object.entries(AUDIT_BUSINESS_TYPES).map(([value, label]) => ({ value, label })),
])

const filters = reactive({
  type: '' as string,
  action: '' as number | '',
  dateRange: [] as string[],
  keyword: '',
})

const loading = ref(false)
const list = ref<AuditHistoryItem[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(20)

function buildQuery(): AuditHistoryQuery {
  return {
    type: filters.type || undefined,
    action: filters.action || undefined,
    startDate: filters.dateRange?.[0] ?? undefined,
    endDate: filters.dateRange?.[1] ?? undefined,
    keyword: filters.keyword.trim() || undefined,
    page: page.value,
    per_page: perPage.value,
  }
}

async function loadList() {
  loading.value = true
  try {
    const res = await listAuditHistory(buildQuery())
    list.value = res?.list ?? []
    total.value = res?.pagination?.total ?? list.value.length
  } catch {
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  void loadList()
}

function handleReset() {
  filters.type = ''
  filters.action = ''
  filters.dateRange = []
  filters.keyword = ''
  handleSearch()
}

function businessLabel(row: AuditHistoryItem): string {
  if (row.type && AUDIT_BUSINESS_TYPES[row.type]) {
    return AUDIT_BUSINESS_TYPES[row.type]
  }
  return row.archiveType || row.type || '-'
}

function actionTag(action: number) {
  return AUDIT_ACTIONS[action]?.tag ?? 'info'
}

function actionLabel(row: AuditHistoryItem): string {
  return row.actionLabel || AUDIT_ACTIONS[row.action]?.label || String(row.action)
}

onMounted(() => void loadList())
</script>

<template>
  <div class="mc-page">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <h2 class="mc-page-head__title">审核记录</h2>
        <p class="mc-page-head__desc">
          查看本人处理过的全部审核记录，含通过、退回与撤销操作，便于回溯处理结果。
        </p>
      </div>
    </div>

    <div class="mc-filter-bar">
      <el-form inline @submit.prevent>
        <el-form-item label="业务类型">
          <el-select v-model="filters.type" clearable style="width: 140px">
            <el-option
              v-for="opt in typeOptions"
              :key="String(opt.value)"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="审核动作">
          <el-select v-model="filters.action" clearable style="width: 120px">
            <el-option
              v-for="opt in actionOptions"
              :key="String(opt.value)"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="处理时间">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="filters.keyword"
            placeholder="标题 / 姓名 / 学号"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="RefreshCw" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="mc-card">
      <div class="mc-card__head">
        <span class="mc-card__title">审核记录列表</span>
        <span class="history-count">{{ total }} 条</span>
      </div>
      <div class="mc-card__body">
        <el-table v-loading="loading" :data="list" stripe>
          <el-table-column label="业务类型" width="130">
            <template #default="{ row }">
              <el-tag type="info" size="small" effect="plain">
                {{ businessLabel(row as AuditHistoryItem) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="申报标题" min-width="220">
            <template #default="{ row }">{{ (row as AuditHistoryItem).title ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="学生" width="150">
            <template #default="{ row }">
              <div class="history-student">
                <span>{{ (row as AuditHistoryItem).studentName ?? '-' }}</span>
                <span class="history-student__no">{{ (row as AuditHistoryItem).studentNo }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="动作" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="actionTag((row as AuditHistoryItem).action)" size="small">
                {{ actionLabel(row as AuditHistoryItem) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="备注" min-width="200">
            <template #default="{ row }">
              <span class="history-comment">{{ (row as AuditHistoryItem).comment ?? '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="处理时间" width="160">
            <template #default="{ row }">
              {{ formatDateTime((row as AuditHistoryItem).auditedAt) }}
            </template>
          </el-table-column>
        </el-table>

        <div class="history-pagination">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="perPage"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @current-change="loadList"
            @size-change="handleSearch"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.history-count {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.history-student {
  display: flex;
  flex-direction: column;
  line-height: 1.4;

  &__no {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }
}

.history-comment {
  display: block;
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: $spacing-lg;
}
</style>
