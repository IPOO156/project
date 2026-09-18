<script setup lang="ts">
import type { TeacherDelegationItem } from '@/shared/types/teacher'
/**
 * DelegationManage - 审批委托管理（教师端）
 * 数据来源：
 *   - GET  /teacher/delegations            委托列表
 *   - POST /teacher/delegations            新建委托
 *   - PUT  /teacher/delegations/{id}/cancel 取消委托
 * 被委托人下拉使用 /admin/users?roleId=3（教师端暂无「教师列表」接口，见后端缺口清单）。
 */
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, RefreshCw, Search, XCircle } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref } from 'vue'

import {
  cancelTeacherDelegation,
  createTeacherDelegation,
  listTeacherDelegations,
  listUsers,
} from '@/shared/api/teacher'
import { useTeacherMe } from '@/shared/composables/useTeacherMe'

const { me } = useTeacherMe()
const myUserId = me.value?.userId

const directionOptions = [
  { value: '', label: '全部方向' },
  { value: 1, label: '我发出的' },
  { value: 2, label: '我收到的' },
]
const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 0, label: '待生效' },
  { value: 1, label: '生效中' },
  { value: 2, label: '已过期' },
  { value: 3, label: '已取消' },
]
const scopeOptions = [
  { value: 2, label: '学院' },
  { value: 3, label: '专业' },
  { value: 4, label: '班级' },
]

function statusTagType(status: number): 'success' | 'warning' | 'info' | 'danger' {
  if (status === 1) return 'success'
  if (status === 0) return 'warning'
  if (status === 2) return 'info'
  return 'danger'
}

// ── 列表 ──
const loading = ref(false)
const list = ref<TeacherDelegationItem[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(10)
const filters = reactive({
  direction: '' as number | '',
  status: '' as number | '',
})

async function loadList() {
  loading.value = true
  try {
    const res = await listTeacherDelegations({
      direction: filters.direction || undefined,
      status: filters.status || undefined,
      page: page.value,
      per_page: perPage.value,
    })
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
  filters.direction = ''
  filters.status = ''
  handleSearch()
}

// ── 新建委托 ──
const createVisible = ref(false)
const creating = ref(false)
const delegatees = ref<{ userId: number; name: string; userNo: string }[]>([])
const delegateeLoading = ref(false)
const form = reactive({
  delegateeId: undefined as number | undefined,
  scopeType: undefined as number | undefined,
  scopeId: undefined as number | undefined,
  timeRange: [] as string[],
  reason: '',
})

const scopes = computed(() =>
  (me.value?.scopes ?? [])
    .filter((s) => s.scopeType === form.scopeType && s.scopeId != null)
    .map((s) => ({ scopeId: s.scopeId, scopeName: s.scopeName ?? '' })),
)

async function loadDelegatees() {
  delegateeLoading.value = true
  try {
    const res = await listUsers({ roleId: 3, status: 1, per_page: 100 })
    delegatees.value = (res?.list ?? []).map((u) => ({
      userId: u.userId,
      name: u.name,
      userNo: u.userNo,
    }))
  } catch {
    delegatees.value = []
  } finally {
    delegateeLoading.value = false
  }
}

function openCreate() {
  form.delegateeId = undefined
  form.scopeType = undefined
  form.scopeId = undefined
  form.timeRange = []
  form.reason = ''
  void loadDelegatees()
  createVisible.value = true
}

async function handleCreate() {
  if (!form.delegateeId) {
    ElMessage.warning('请选择被委托人')
    return
  }
  if (form.delegateeId === myUserId) {
    ElMessage.warning('不能委托给自己')
    return
  }
  if (!form.scopeType) {
    ElMessage.warning('请选择委托范围类型')
    return
  }
  if (!form.scopeId) {
    ElMessage.warning('请选择具体范围')
    return
  }
  if (form.timeRange.length !== 2 || !form.timeRange[0] || !form.timeRange[1]) {
    ElMessage.warning('请选择委托起止时间')
    return
  }
  if (form.reason.trim().length > 200) {
    ElMessage.warning('委托原因不超过 200 字')
    return
  }
  creating.value = true
  try {
    await createTeacherDelegation({
      delegateeId: form.delegateeId,
      scopeType: form.scopeType,
      scopeId: form.scopeId,
      startTime: form.timeRange[0],
      endTime: form.timeRange[1],
      reason: form.reason.trim() || undefined,
    })
    ElMessage.success('委托已创建')
    createVisible.value = false
    handleSearch()
  } catch {
    /* 拦截器已提示 */
  } finally {
    creating.value = false
  }
}

// ── 取消委托 ──
const cancelReason = ref('')

async function handleCancel(row: TeacherDelegationItem) {
  try {
    await ElMessageBox.confirm(
      `确认取消委托「${row.delegatee?.name ?? '被委托人'}」？`,
      '取消委托',
      {
        confirmButtonText: '确认取消',
        cancelButtonText: '暂不取消',
        type: 'warning',
      },
    )
  } catch {
    return
  }
  const { value } = await ElMessageBox.prompt('请填写取消原因（可选）', '取消委托', {
    inputValue: '',
    inputPlaceholder: '取消原因，最多 200 字',
    inputType: 'textarea',
    confirmButtonText: '确认',
    cancelButtonText: '取消',
  }).catch(() => ({ value: '' }))
  cancelReason.value = value ?? ''
  if (cancelReason.value.length > 200) {
    ElMessage.warning('取消原因不超过 200 字')
    return
  }
  try {
    await cancelTeacherDelegation(row.delegationId, {
      cancelReason: cancelReason.value.trim() || undefined,
    })
    ElMessage.success('委托已取消')
    void loadList()
  } catch {
    /* 拦截器已提示 */
  }
}

onMounted(() => void loadList())
</script>

<template>
  <div class="mc-page delegation">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <h2 class="mc-page-head__title">审批委托管理</h2>
        <p class="mc-page-head__desc">
          将您在学院 / 专业 / 班级范围内的审批职责临时委托给其他教师，支持随时取消。
        </p>
      </div>
      <div class="mc-page-head__actions">
        <el-button :icon="Plus" type="primary" @click="openCreate">新建委托</el-button>
      </div>
    </div>

    <div class="mc-filter-bar">
      <el-form inline @submit.prevent>
        <el-form-item label="方向">
          <el-select v-model="filters.direction" clearable style="width: 140px">
            <el-option
              v-for="d in directionOptions"
              :key="String(d.value)"
              :label="d.label"
              :value="d.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" clearable style="width: 130px">
            <el-option
              v-for="s in statusOptions"
              :key="String(s.value)"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="RefreshCw" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="mc-card">
      <div class="mc-card__head">
        <span class="mc-card__title">委托列表</span>
        <span class="delegation__count">{{ total }} 条</span>
      </div>
      <div class="mc-card__body">
        <el-table v-loading="loading" :data="list" stripe>
          <el-table-column prop="delegationId" label="委托ID" width="90" />
          <el-table-column label="委托方" width="150">
            <template #default="{ row }">
              {{ row.delegator?.name ?? '-'
              }}<span class="delegation__no">{{ row.delegator?.userNo }}</span>
            </template>
          </el-table-column>
          <el-table-column label="被委托人" width="150">
            <template #default="{ row }">
              {{ row.delegatee?.name ?? '-'
              }}<span class="delegation__no">{{ row.delegatee?.userNo }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="scopeTypeLabel" label="范围" width="120" />
          <el-table-column prop="scopeName" label="范围详情" min-width="140">
            <template #default="{ row }">{{ row.scopeName ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="有效期" min-width="200">
            <template #default="{ row }"
              >{{ row.startTime ?? '-' }} 至 {{ row.endTime ?? '-' }}</template
            >
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.status)" size="small">{{ row.statusLabel }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="reason" label="原因" min-width="140">
            <template #default="{ row }">{{ row.reason ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.status === 0 || row.status === 1"
                text
                type="danger"
                size="small"
                :icon="XCircle"
                @click="handleCancel(row as TeacherDelegationItem)"
              >
                取消
              </el-button>
              <span v-else class="delegation__nodata">-</span>
            </template>
          </el-table-column>
        </el-table>
        <div class="delegation__pagination">
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
        <el-empty
          v-if="!loading && !list.length"
          class="delegation__empty"
          description="暂无委托记录"
          :image-size="72"
        />
      </div>
    </div>

    <el-dialog v-model="createVisible" title="新建审批委托" width="560px" destroy-on-close>
      <el-form label-width="100px">
        <el-form-item label="被委托人" required>
          <el-select
            v-model="form.delegateeId"
            filterable
            placeholder="搜索并选择教师"
            style="width: 100%"
            :loading="delegateeLoading"
          >
            <el-option
              v-for="d in delegatees"
              :key="d.userId"
              :label="`${d.name}（${d.userNo}）`"
              :value="d.userId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="委托范围" required>
          <div class="delegation__scope-row">
            <el-select v-model="form.scopeType" placeholder="范围类型" style="width: 130px">
              <el-option
                v-for="s in scopeOptions"
                :key="s.value"
                :label="s.label"
                :value="s.value"
              />
            </el-select>
            <el-select
              v-model="form.scopeId"
              placeholder="具体范围"
              style="width: 180px"
              :disabled="!form.scopeType"
            >
              <el-option
                v-for="s in scopes"
                :key="s.scopeId"
                :label="s.scopeName"
                :value="s.scopeId"
              />
            </el-select>
          </div>
        </el-form-item>
        <el-form-item label="有效期" required>
          <el-date-picker
            v-model="form.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="委托原因">
          <el-input
            v-model="form.reason"
            type="textarea"
            :rows="2"
            maxlength="200"
            show-word-limit
            placeholder="说明委托原因（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreate">创建委托</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.delegation {
  &__count {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  &__no {
    margin-left: 6px;
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }

  &__scope-row {
    display: flex;
    gap: $spacing-sm;
    width: 100%;
  }

  &__pagination {
    display: flex;
    justify-content: flex-end;
    padding-top: $spacing-lg;
  }

  &__empty {
    margin-top: $spacing-lg;
  }

  &__nodata {
    color: var(--el-text-color-placeholder);
  }
}
</style>
