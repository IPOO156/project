<script setup lang="ts">
import type {
  Activity,
  ActivityFilters,
  ApplicationType,
  SubmissionFilters,
  SubmissionRecord,
} from '@/shared/types/types'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, Eye, Filter, Search, Undo2, X } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useActivityStore, useSubmissionStore } from '@/app/stores/stores'
import { APPLICATION_STATUS, APPLICATION_TYPE_MAP } from '@/shared/constants/dict'
import StatusTag from '@/shared/ui/StatusTag.vue'
import ActivityCenterHeader from '../components/ActivityCenterHeader.vue'
import ActivityRecordDialog from '../components/ActivityRecordDialog.vue'

/**
 * 动态中心页面
 * 整合「动态记录」与「报名记录」，采用蓝白配色自定义卡片风格。
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

// ─── 弹窗 ───
const dialogVisible = ref(false)
const editingId = ref<string | null>(null)
const isViewMode = ref(false)
const editingActivity = ref<Activity | null>(null)

// ─── 表格逐行刷入动画触发 ───
// 通过改变 key 强制 Element Plus 表格重新渲染，使 CSS animation 在每次数据加载、标签切换、分页变化时重新触发
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

// 分页切换时数据直接切片变化，没有 loading，需要手动触发重渲染以播放逐行动画
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
  Object.entries(APPLICATION_STATUS).map(([value, config]) => ({ value, label: config.label })),
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

function openEditDialog(row: Activity) {
  isViewMode.value = row.status === 'approved'
  editingId.value = row.id
  editingActivity.value = row
  dialogVisible.value = true
}

function handleSave(payload: Omit<Activity, 'id'>) {
  if (editingId.value) {
    activityStore.updateActivity(editingId.value, payload)
  }
  dialogVisible.value = false
}

function handleRemove(row: Activity) {
  if (row.status === 'approved') {
    ElMessage.warning('已通过审核的记录不可删除')
    return
  }
  ElMessageBox.confirm(`确定删除动态 "${row.text}" 吗？`, '提示', { type: 'warning' })
    .then(() => activityStore.deleteActivity(row.id))
    .catch(() => {})
}

function handleActivitySearch() {
  activityPageNum.value = 1
  const filters: ActivityFilters = {}
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

async function handleWithdrawSubmission(row: SubmissionRecord) {
  try {
    await ElMessageBox.confirm(`确定要撤回"${row.title}"吗？撤回后状态将变为草稿。`, '撤回确认', {
      confirmButtonText: '撤回',
      cancelButtonText: '取消',
      type: 'warning',
    })
    submissionStore.withdrawRecord(row.id)
    ElMessage.success('已撤回')
  } catch {
    // 用户取消
  }
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

    <!-- 动态记录 -->
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
          <el-select
            v-model="activityStatus"
            placeholder="全部状态"
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
          <button type="button" class="mc-btn mc-btn--secondary" @click="handleActivitySearch">
            <Filter :size="14" /> 筛选
          </button>
          <button type="button" class="mc-btn mc-btn--ghost" @click="handleActivityReset">
            <X :size="14" /> 重置
          </button>
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
          <el-table-column prop="text" label="动态内容" min-width="260" show-overflow-tooltip />
          <el-table-column label="状态" width="110" align="center">
            <template #default="{ row }">
              <StatusTag :status="(row as Activity).status" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="时间" width="160" align="center">
            <template #default="{ row }">
              <span class="mc-time">{{ (row as Activity).time }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="240" fixed="right" align="center">
            <template #default="{ row }">
              <div class="action-group">
                <button
                  type="button"
                  class="action-btn action-btn--view"
                  @click="openEditDialog(row as Activity)"
                >
                  <Eye :size="14" /> 查看
                </button>
                <template v-if="(row as Activity).status !== 'approved'">
                  <button
                    type="button"
                    class="action-btn action-btn--edit"
                    @click="openEditDialog(row as Activity)"
                  >
                    <Edit :size="14" /> 编辑
                  </button>
                  <button
                    type="button"
                    class="action-btn action-btn--delete"
                    @click="handleRemove(row as Activity)"
                  >
                    <Delete :size="14" /> 删除
                  </button>
                </template>
              </div>
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
          <el-select
            v-model="submissionType"
            placeholder="全部类型"
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
          <el-select
            v-model="submissionStatus"
            placeholder="全部状态"
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
          <button type="button" class="mc-btn mc-btn--secondary" @click="handleSubmissionSearch">
            <Filter :size="14" /> 筛选
          </button>
          <button type="button" class="mc-btn mc-btn--ghost" @click="handleSubmissionReset">
            <X :size="14" /> 重置
          </button>
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
          <el-table-column label="操作" width="200" fixed="right" align="center">
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
              <el-button
                v-if="(row as SubmissionRecord).status === 'submitted'"
                type="warning"
                link
                size="small"
                :icon="Undo2"
                @click="handleWithdrawSubmission(row as SubmissionRecord)"
              >
                撤回
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

    <ActivityRecordDialog
      v-model="dialogVisible"
      :editing-id="editingId"
      :is-view-mode="isViewMode"
      :initial-data="editingActivity"
      @save="handleSave"
    />
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

.center-panel {
  @include mc-fade-in(0.1s);

  margin-top: 28px;
}

.panel-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
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

.mc-select {
  @include mc-select(150px);
}

.mc-btn {
  &--primary {
    @include mc-btn-primary;
  }

  &--secondary {
    @include mc-btn-secondary;
  }

  &--ghost {
    @include mc-btn-ghost;
  }
}

.mc-card {
  @include mc-card;
}

.mc-table {
  @include mc-table;
}

:deep(.mc-table--staggered) {
  --mc-row-duration: 0.6s;
  --mc-row-delay: 0.08s;
  --mc-row-offset: -60px;

  @include table-row-staggered(50);
}

.mc-pagination {
  @include mc-pagination;
}

.mc-empty {
  @include mc-empty;
}

.mc-time {
  font-size: 13px;
  color: var(--mc-text-secondary);
}

.action-group {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 64px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid var(--mc-border);
  background: var(--mc-card);
  font-family: $mc-font-body;

  &--view {
    color: var(--mc-wood);
    border-color: var(--mc-wood);

    &:hover {
      background: var(--mc-cream);
      border-color: var(--mc-wood);
      color: var(--mc-wood);
    }
  }

  &--edit {
    color: var(--mc-text-secondary);

    &:hover {
      background: var(--mc-bg);
      border-color: var(--mc-wood);
      color: var(--mc-wood);
    }
  }

  &--delete {
    color: var(--mc-danger);
    border-color: var(--mc-danger-light);

    &:hover {
      background: var(--mc-danger-fade);
      border-color: var(--mc-danger);
    }
  }
}

@media (max-width: 768px) {
  .panel-toolbar {
    flex-direction: column;
    align-items: stretch;

    &__filters {
      width: 100%;
    }
  }

  .mc-input-wrap,
  .mc-select {
    width: 100%;
  }
}
</style>
