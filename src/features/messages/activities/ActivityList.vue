<script setup lang="ts">
import type {
  Activity,
  ApplicationType,
  SubmissionFilters,
  SubmissionRecord,
} from '@/shared/types/types'
import { Filter, Search, X } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useActivityStore, useSubmissionStore } from '@/app/stores/stores'
import { APPLICATION_STATUS, APPLICATION_TYPE_MAP } from '@/shared/constants/dict'
import StatusTag from '@/shared/ui/StatusTag.vue'
import ActivityCenterHeader from '../components/ActivityCenterHeader.vue'

/**
 * 动态中心页面（学生端）
 * 整合「动态记录」与「报名记录」，学生仅可查看，不可编辑或删除。
 */

type TabKey = 'activity' | 'submission'

const router = useRouter()
const activityStore = useActivityStore()
const submissionStore = useSubmissionStore()

const activeTab = ref<TabKey>('activity')

// ─── 动态记录 ───
const activityKeyword = ref('')
const activityStatus = ref('')
const activityPageNum = ref(1)
const activityPageSize = ref(10)

// ─── 报名记录 ───
const submissionKeyword = ref('')
const submissionType = ref<ApplicationType | ''>('')
const submissionStatus = ref('')
const submissionPageNum = ref(1)
const submissionPageSize = ref(10)

// ─── 表格逐行刷入动画触发 ───
const activityTableKey = ref(0)
const submissionTableKey = ref(0)

function bumpActivityAnimation() {
  activityTableKey.value++
}

function bumpSubmissionAnimation() {
  submissionTableKey.value++
}

watch(
  () => activityStore.loading,
  (loading) => {
    if (!loading) {
      bumpActivityAnimation()
    }
  },
)

watch(
  () => submissionStore.loading,
  (loading) => {
    if (!loading) {
      bumpSubmissionAnimation()
    }
  },
)

watch(activeTab, (tab) => {
  if (tab === 'activity' && !activityStore.loading) {
    bumpActivityAnimation()
  } else if (tab === 'submission' && !submissionStore.loading) {
    bumpSubmissionAnimation()
  }
})

watch(
  [activityPageNum, activityPageSize],
  () => {
    if (activeTab.value === 'activity') {
      bumpActivityAnimation()
    }
  },
  { flush: 'post' },
)

watch(
  [submissionPageNum, submissionPageSize],
  () => {
    if (activeTab.value === 'submission') {
      bumpSubmissionAnimation()
    }
  },
  { flush: 'post' },
)

const statusOptions = computed(() =>
  Object.entries(APPLICATION_STATUS)
    .filter(([value]) => value !== 'draft')
    .map(([value, config]) => ({ value, label: config.label })),
)

const typeOptions = computed(() =>
  Object.entries(APPLICATION_TYPE_MAP).map(([value, label]) => ({ value, label })),
)

const activityPaginated = computed(() => {
  const start = (activityPageNum.value - 1) * activityPageSize.value
  return activityStore.filteredActivities.slice(start, start + activityPageSize.value)
})

const submissionPaginated = computed(() => {
  const start = (submissionPageNum.value - 1) * submissionPageSize.value
  return submissionStore.filteredRecords.slice(start, start + submissionPageSize.value)
})

function handleActivitySearch() {
  activityPageNum.value = 1
  const filters: any = {}
  if (activityKeyword.value) filters.keyword = activityKeyword.value
  if (activityStatus.value) filters.status = activityStatus.value
  activityStore.fetchActivities(filters)
}

function handleActivityReset() {
  activityKeyword.value = ''
  activityStatus.value = ''
  activityPageNum.value = 1
  activityStore.fetchActivities()
}

function handleSubmissionSearch() {
  submissionPageNum.value = 1
  const filters: SubmissionFilters = {}
  if (submissionKeyword.value) filters.keyword = submissionKeyword.value
  if (submissionType.value) filters.type = submissionType.value
  if (submissionStatus.value) filters.status = submissionStatus.value
  submissionStore.fetchRecords(filters)
}

function handleSubmissionReset() {
  submissionKeyword.value = ''
  submissionType.value = ''
  submissionStatus.value = ''
  submissionPageNum.value = 1
  submissionStore.fetchRecords()
}

function handleActivitySizeChange(size: number) {
  activityPageSize.value = size
  activityPageNum.value = 1
}

function handleSubmissionSizeChange(size: number) {
  submissionPageSize.value = size
  submissionPageNum.value = 1
}

function viewSubmission(path: string) {
  router.push(path)
}

function formatSemester(semester: string) {
  return semester.replace(/-(\d)$/g, '第$1学期').replace(/-/g, '-')
}

onMounted(() => {
  activityStore.fetchActivities()
  submissionStore.fetchRecords()
})
</script>

<template>
  <PageContainer class="activity-center">
    <ActivityCenterHeader
      v-model:active-tab="activeTab"
      :activity-count="activityStore.activities.length"
      :submission-count="submissionStore.records.length"
    />

    <!-- 动态记录（学生只读） -->
    <section v-if="activeTab === 'activity'" class="center-panel" aria-labelledby="activity-tab">
      <div class="panel-toolbar">
        <div class="panel-toolbar__filters">
          <div class="mc-input-wrap">
            <Search :size="16" class="mc-input-wrap__icon" />
            <el-input
              v-model="activityKeyword"
              placeholder="搜索动态内容"
              clearable
              @keyup.enter="handleActivitySearch"
              @clear="handleActivitySearch"
            />
          </div>
          <span class="filter-label">状态：</span>
          <el-select
            v-model="activityStatus"
            placeholder="全部"
            clearable
            class="mc-select"
            @change="handleActivitySearch"
          >
            <el-option
              v-for="opt in statusOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-button type="primary" size="default" @click="handleActivitySearch">
            <Filter :size="14" style="margin-right: 4px" />筛选
          </el-button>
          <el-button @click="handleActivityReset">
            <X :size="14" style="margin-right: 4px" />重置
          </el-button>
        </div>
      </div>

      <div v-loading="activityStore.loading" class="mc-card">
        <el-table
          :key="activityTableKey"
          :data="activityPaginated"
          class="mc-table mc-table--staggered"
          style="width: 100%"
        >
          <el-table-column type="index" label="序号" width="64" align="center" />
          <el-table-column prop="text" label="动态内容" min-width="360" show-overflow-tooltip />
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <StatusTag :status="(row as Activity).status" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="时间" width="160" align="center">
            <template #default="{ row }">
              <span class="mc-time">{{ (row as Activity).time }}</span>
            </template>
          </el-table-column>
        </el-table>

        <div v-if="activityPaginated.length > 0" class="mc-pagination">
          <el-pagination
            v-model:current-page="activityPageNum"
            v-model:page-size="activityPageSize"
            :total="activityStore.filteredActivities.length"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @current-change="activityPageNum = $event"
            @size-change="handleActivitySizeChange"
          />
        </div>
        <el-empty v-else-if="!activityStore.loading" description="暂无动态记录" class="mc-empty" />
      </div>
    </section>

    <!-- 报名记录 -->
    <section v-else class="center-panel" aria-labelledby="submission-tab">
      <div class="panel-toolbar">
        <div class="panel-toolbar__filters">
          <div class="mc-input-wrap">
            <Search :size="16" class="mc-input-wrap__icon" />
            <el-input
              v-model="submissionKeyword"
              placeholder="搜索名称或类型"
              clearable
              @keyup.enter="handleSubmissionSearch"
              @clear="handleSubmissionSearch"
            />
          </div>
          <span class="filter-label">类型：</span>
          <el-select
            v-model="submissionType"
            placeholder="全部"
            clearable
            class="mc-select"
            @change="handleSubmissionSearch"
          >
            <el-option
              v-for="opt in typeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <span class="filter-label">状态：</span>
          <el-select
            v-model="submissionStatus"
            placeholder="全部"
            clearable
            class="mc-select"
            @change="handleSubmissionSearch"
          >
            <el-option
              v-for="opt in statusOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-button type="primary" size="default" @click="handleSubmissionSearch">
            <Filter :size="14" style="margin-right: 4px" />筛选
          </el-button>
          <el-button @click="handleSubmissionReset">
            <X :size="14" style="margin-right: 4px" />重置
          </el-button>
        </div>
      </div>

      <div v-loading="submissionStore.loading" class="mc-card">
        <el-table
          :key="submissionTableKey"
          :data="submissionPaginated"
          class="mc-table mc-table--staggered"
          style="width: 100%"
        >
          <el-table-column type="index" label="序号" width="64" align="center" />
          <el-table-column prop="title" label="名称" min-width="220" show-overflow-tooltip />
          <el-table-column label="类型" width="130" align="center">
            <template #default="{ row }">
              <span class="mc-time">{{ (row as SubmissionRecord).typeLabel }}</span>
            </template>
          </el-table-column>
          <el-table-column label="提交时间" width="120" align="center">
            <template #default="{ row }">
              <span class="mc-time">{{ (row as SubmissionRecord).submitDate }}</span>
            </template>
          </el-table-column>
          <el-table-column label="学期" width="120" align="center">
            <template #default="{ row }">
              <span class="mc-time">{{ formatSemester((row as SubmissionRecord).semester) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="110" align="center">
            <template #default="{ row }">
              <StatusTag :status="(row as SubmissionRecord).status" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right" align="center">
            <template #default="{ row }">
              <el-button
                type="primary"
                link
                :icon="Search"
                size="small"
                @click="viewSubmission((row as SubmissionRecord).sourcePath)"
              >
                查看
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div v-if="submissionPaginated.length > 0" class="mc-pagination">
          <el-pagination
            v-model:current-page="submissionPageNum"
            v-model:page-size="submissionPageSize"
            :total="submissionStore.filteredRecords.length"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @current-change="submissionPageNum = $event"
            @size-change="handleSubmissionSizeChange"
          />
        </div>
        <el-empty
          v-else-if="!submissionStore.loading"
          description="暂无报名记录"
          class="mc-empty"
        />
      </div>
    </section>
  </PageContainer>
</template>

<style scoped lang="scss">
@use '../styles/theme' as *;

.activity-center {
  @include message-theme-vars;

  font-family: $mc-font-body;
  color: var(--mc-text);
  user-select: none;
}

.panel-toolbar {
  @include mc-fade-in(0.1s);

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 12px;
  margin-bottom: 20px;

  &__filters {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
}

.mc-input-wrap {
  @include mc-input-wrap(240px);
}

.filter-label {
  font-size: 13px;
  color: var(--mc-text-secondary);
  white-space: nowrap;
  flex-shrink: 0;
}

.mc-select {
  @include mc-select(150px);
}

.mc-card {
  @include mc-card;
}

.mc-pagination {
  @include mc-pagination;
}

.mc-empty {
  @include mc-empty;
}

.mc-table {
  @include mc-table;
}
</style>
