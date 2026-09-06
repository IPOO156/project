<script setup lang="ts">
import type { AuditPendingItem, AuditPendingQuery } from '@/shared/types/teacher'
import { ElMessage } from 'element-plus'
import { CheckCheck, RefreshCw, Search, ShieldCheck } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref } from 'vue'
import { batchApproveAuditTasks, listAuditPending } from '@/shared/api/teacher'
import { AUDIT_BUSINESS_TYPES } from '@/shared/constants/dict'
import { formatDateTime } from '@/shared/utils/time'
import AuditDetailDialog from './components/AuditDetailDialog.vue'

/**
 * 材料审核 - 待审核（教师端）
 * 数据来源：
 *   - GET /teacher/audits/pending                    待审核列表（范围自动按当前教师）
 *   - GET /teacher/audits/pending/{taskId}           详情（AuditDetailDialog 内部拉取）
 *   - POST /teacher/audits/{taskId}/approve|reject   通过/退回（AuditDetailDialog 内部执行）
 *   - POST /teacher/audits/batch/approve             批量通过
 *   - GET /teacher/audits/reject-templates           退回模板（AuditDetailDialog 内部拉取）
 */

// ── 筛选 ──
const typeOptions = computed(() => [
  { value: '', label: '全部业务' },
  ...Object.entries(AUDIT_BUSINESS_TYPES).map(([value, label]) => ({ value, label })),
])

const filters = reactive({
  type: '' as string,
  keyword: '',
})

// ── 列表 ──
const loading = ref(false)
const list = ref<AuditPendingItem[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(20)
const selected = ref<AuditPendingItem[]>([])
let keywordTimer = 0

function buildQuery(): AuditPendingQuery {
  return {
    type: filters.type || undefined,
    keyword: filters.keyword.trim() || undefined,
    page: page.value,
    per_page: perPage.value,
  }
}

async function loadList() {
  loading.value = true
  try {
    const res = await listAuditPending(buildQuery())
    list.value = res?.list ?? []
    total.value = res?.pagination?.total ?? list.value.length
    // 当前页被审批空后回退一页
    if (page.value > 1 && list.value.length === 0) {
      page.value -= 1
      void loadList()
    }
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
  filters.keyword = ''
  handleSearch()
}

function onKeywordInput() {
  window.clearTimeout(keywordTimer)
  keywordTimer = window.setTimeout(() => {
    handleSearch()
  }, 300)
}

// ── 展示辅助 ──
function businessLabel(row: AuditPendingItem): string {
  if (row.archiveTypeLabel) return row.archiveTypeLabel
  return AUDIT_BUSINESS_TYPES[row.type] ?? row.type
}

function statusTagType(status: number): 'success' | 'warning' | 'info' | 'danger' {
  // 待审批=1 走 warning；其余状态按信息展示
  return status === 1 ? 'warning' : 'info'
}

function submitTime(row: AuditPendingItem): string {
  return formatDateTime(row.submitTime)
}

// ── 审核弹窗 ──
const detailVisible = ref(false)
const activeTaskId = ref<number | null>(null)

function openDetail(row: AuditPendingItem) {
  activeTaskId.value = row.taskId
  detailVisible.value = true
}

function handleOpenTask(taskId: number) {
  activeTaskId.value = taskId
}

function handleProcessed() {
  detailVisible.value = false
  selected.value = []
  void loadList()
}

// ── 批量通过 ──
const batchVisible = ref(false)
const batchComment = ref('')
const batchSaving = ref(false)

function openBatch() {
  batchComment.value = ''
  batchVisible.value = true
}

async function confirmBatch() {
  if (!selected.value.length) return
  batchSaving.value = true
  try {
    const res = await batchApproveAuditTasks({
      taskIds: selected.value.map((row) => row.taskId),
      comment: batchComment.value.trim() || undefined,
    })
    const succeeded = res?.success ?? 0
    const failed = res?.failed ?? 0
    if (failed > 0) {
      ElMessage.warning(`批量通过完成：成功 ${succeeded} 条，失败 ${failed} 条`)
    } else {
      ElMessage.success(`批量通过完成：成功 ${succeeded} 条`)
    }
    batchVisible.value = false
    selected.value = []
    void loadList()
  } catch {
    /* 拦截器已提示 */
  } finally {
    batchSaving.value = false
  }
}

function onSelectionChange(rows: AuditPendingItem[]) {
  selected.value = rows
}

const selectionLabel = computed(() =>
  selected.value.length ? `（已选 ${selected.value.length} 项）` : '',
)

onMounted(() => void loadList())
</script>

<template>
  <div class="mc-page">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <h2 class="mc-page-head__title">材料审核</h2>
        <p class="mc-page-head__desc">
          审核授权范围内学生提交的档案 / 奖项 / 职业规划申报材料，处理结果将实时反馈给学生。
        </p>
      </div>
    </div>

    <div class="mc-filter-bar">
      <el-form inline @submit.prevent>
        <el-form-item label="业务类型">
          <el-select v-model="filters.type" clearable style="width: 150px">
            <el-option
              v-for="opt in typeOptions"
              :key="String(opt.value)"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="学生">
          <el-input
            v-model="filters.keyword"
            placeholder="姓名 / 学号 / 标题"
            clearable
            style="width: 220px"
            @input="onKeywordInput"
            @clear="handleSearch"
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
        <span class="mc-card__title">待审核列表</span>
        <div class="mc-card__actions">
          <span class="audit-count">{{ total }} 条</span>
          <el-button
            v-if="selected.length"
            type="success"
            plain
            size="small"
            :icon="CheckCheck"
            @click="openBatch"
          >
            批量通过{{ selectionLabel }}
          </el-button>
        </div>
      </div>
      <div class="mc-card__body">
        <el-table
          v-loading="loading"
          :data="list"
          stripe
          row-key="taskId"
          @selection-change="onSelectionChange"
        >
          <el-table-column type="selection" width="44" />
          <el-table-column label="申报内容" min-width="240">
            <template #default="{ row }">
              <div class="audit-title">
                <el-tag size="small" type="info" effect="plain" class="audit-title__tag">
                  {{ businessLabel(row as AuditPendingItem) }}
                </el-tag>
                <span class="audit-title__text">{{ (row as AuditPendingItem).title }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="申请人" width="150">
            <template #default="{ row }">
              <div class="audit-applicant">
                <span>{{ (row as AuditPendingItem).applicantName }}</span>
                <span class="audit-applicant__no">{{ (row as AuditPendingItem).applicantNo }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="班级 / 专业" min-width="170">
            <template #default="{ row }">
              <span>{{ (row as AuditPendingItem).className ?? '-' }}</span>
              <span class="audit-applicant__no">{{ (row as AuditPendingItem).majorName }}</span>
            </template>
          </el-table-column>
          <el-table-column label="学期" width="130">
            <template #default="{ row }">{{
              (row as AuditPendingItem).semesterName ?? '-'
            }}</template>
          </el-table-column>
          <el-table-column label="提交时间" width="140">
            <template #default="{ row }">{{ submitTime(row as AuditPendingItem) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="statusTagType((row as AuditPendingItem).status)" size="small">
                {{ (row as AuditPendingItem).statusLabel }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="重复" width="76" align="center">
            <template #default="{ row }">
              <el-tag
                v-if="(row as AuditPendingItem).duplicateCheckStatus === 1"
                type="danger"
                size="small"
                effect="light"
              >
                疑似
              </el-tag>
              <span v-else class="audit-nodata">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90" align="center" fixed="right">
            <template #default="{ row }">
              <el-button
                text
                type="primary"
                size="small"
                :icon="ShieldCheck"
                @click="openDetail(row as AuditPendingItem)"
              >
                审核
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="audit-pagination">
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

    <AuditDetailDialog
      v-model="detailVisible"
      :task-id="activeTaskId"
      :query="buildQuery()"
      @open-task="handleOpenTask"
      @processed="handleProcessed"
    />

    <el-dialog v-model="batchVisible" title="批量通过" width="440px" append-to-body>
      <p class="batch-tip">
        将批量通过选中的 {{ selected.length }} 条申报（无需逐条查看佐证材料）。
      </p>
      <el-input
        v-model="batchComment"
        type="textarea"
        :rows="3"
        maxlength="200"
        show-word-limit
        placeholder="批量通过备注（可选）"
      />
      <template #footer>
        <el-button @click="batchVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchSaving" @click="confirmBatch">确认通过</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.audit-count {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-right: $spacing-md;
}

.mc-card__actions {
  display: flex;
  align-items: center;
}

.audit-title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  &__tag {
    flex-shrink: 0;
  }

  &__text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.audit-applicant {
  display: flex;
  flex-direction: column;
  line-height: 1.4;

  &__no {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }
}

.audit-nodata {
  color: var(--el-text-color-placeholder);
}

.audit-pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: $spacing-lg;
}

.batch-tip {
  margin: 0 0 $spacing-md;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
