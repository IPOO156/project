<script setup lang="ts">
import type { ExportLogItem, LoginLogItem, SystemLogItem } from '@/shared/types/teacher'
/**
 * LogView - 日志查看
 * 对接后端：GET /admin/logs/system（管理员版，log:view 权限）
 *          GET /admin/logs/login（登录日志）
 *          GET /admin/logs/exports（导出日志）
 * 三个 tab 各自独立的筛选表单、分页、loading 与 total，切换 tab 时分别加载。
 * 说明：后端 /admin/logs/system 不提供「年级/学院/专业」维度过滤，
 * 教师授权范围由 role_scopes 在后端按登录人决定，前端不额外伪造维度。
 */
import { RefreshCw, Search } from 'lucide-vue-next'

import { computed, onMounted, reactive, ref, watch } from 'vue'
import { getExportLogs, getLoginLogs, getSystemLogs } from '@/shared/api/teacher'
import { LOG_ACTION_TYPES, LOG_MODULES } from '@/shared/constants/dict'
import ExportLogTable from './components/ExportLogTable.vue'
import LoginLogTable from './components/LoginLogTable.vue'
import LogTable from './components/LogTable.vue'

// ── 操作日志（系统日志）：筛选与分页 ──
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

// ── 登录日志：筛选与分页 ──
const loginFilters = reactive({
  loginStatus: '' as '' | 1 | 0,
  ipAddress: '',
  dateRange: [] as string[],
})
const loginStatusOptions = [
  { value: '', label: '全部状态' },
  { value: 1, label: '成功' },
  { value: 0, label: '失败' },
]

const loginLogs = ref<LoginLogItem[]>([])
const loginTotal = ref(0)
const loginPage = ref(1)
const loginPerPage = ref(10)
const loginLoading = ref(false)

// ── 导出日志：筛选与分页 ──
const exportFilters = reactive({
  exportType: '',
  isAnonymized: '' as '' | 1 | 0,
  dateRange: [] as string[],
})
const anonymizedOptions = [
  { value: '', label: '全部' },
  { value: 1, label: '匿名' },
  { value: 0, label: '非匿名' },
]

const exportLogs = ref<ExportLogItem[]>([])
const exportTotal = ref(0)
const exportPage = ref(1)
const exportPerPage = ref(10)
const exportLoading = ref(false)

// ── tab 切换：登录/导出首次激活时懒加载 ──
const activeTab = ref('system')
const loginLoaded = ref(false)
const exportLoaded = ref(false)

const isLoading = computed(() => loading.value || loginLoading.value || exportLoading.value)

watch(activeTab, (tab) => {
  if (tab === 'login' && !loginLoaded.value) {
    loginLoaded.value = true
    void loadLogin()
  }
  if (tab === 'export' && !exportLoaded.value) {
    exportLoaded.value = true
    void loadExport()
  }
})

onMounted(() => {
  void load()
})

// ── 操作日志（系统日志）加载与事件 ──
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

// ── 登录日志加载与事件 ──
async function loadLogin() {
  loginLoading.value = true
  try {
    const [start, end] = loginFilters.dateRange
    const res = await getLoginLogs({
      page: loginPage.value,
      per_page: loginPerPage.value,
      loginStatus: loginFilters.loginStatus === '' ? undefined : loginFilters.loginStatus,
      ipAddress: loginFilters.ipAddress.trim() || undefined,
      startTime: start || undefined,
      endTime: end || undefined,
    })
    loginLogs.value = res.list
    loginTotal.value = res.total
  } catch {
    loginLogs.value = []
    loginTotal.value = 0
  } finally {
    loginLoading.value = false
  }
}

function handleLoginSearch() {
  loginPage.value = 1
  void loadLogin()
}

function handleLoginReset() {
  loginFilters.loginStatus = ''
  loginFilters.ipAddress = ''
  loginFilters.dateRange = []
  loginPage.value = 1
  void loadLogin()
}

function handleLoginSizeChange(size: number) {
  loginPerPage.value = size
  loginPage.value = 1
  void loadLogin()
}

function handleLoginPageChange(p: number) {
  loginPage.value = p
  void loadLogin()
}

// ── 导出日志加载与事件 ──
async function loadExport() {
  exportLoading.value = true
  try {
    const [start, end] = exportFilters.dateRange
    const res = await getExportLogs({
      page: exportPage.value,
      per_page: exportPerPage.value,
      exportType: exportFilters.exportType.trim() || undefined,
      isAnonymized: exportFilters.isAnonymized === '' ? undefined : exportFilters.isAnonymized,
      startTime: start || undefined,
      endTime: end || undefined,
    })
    exportLogs.value = res.list
    exportTotal.value = res.total
  } catch {
    exportLogs.value = []
    exportTotal.value = 0
  } finally {
    exportLoading.value = false
  }
}

function handleExportSearch() {
  exportPage.value = 1
  void loadExport()
}

function handleExportReset() {
  exportFilters.exportType = ''
  exportFilters.isAnonymized = ''
  exportFilters.dateRange = []
  exportPage.value = 1
  void loadExport()
}

function handleExportSizeChange(size: number) {
  exportPerPage.value = size
  exportPage.value = 1
  void loadExport()
}

function handleExportPageChange(p: number) {
  exportPage.value = p
  void loadExport()
}

// ── 顶部刷新：刷新当前激活 tab ──
function handleRefresh() {
  if (activeTab.value === 'login') void loadLogin()
  else if (activeTab.value === 'export') void loadExport()
  else void load()
}
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
        <el-button :icon="RefreshCw" :loading="isLoading" @click="handleRefresh">刷新</el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="log-view__tabs">
      <!-- 操作日志 -->
      <el-tab-pane label="操作日志" name="system">
        <div class="mc-filter-bar">
          <el-form inline @submit.prevent="handleSearch">
            <el-form-item label="操作类型">
              <el-select
                v-model="filters.action"
                placeholder="全部类型"
                clearable
                style="width: 140px"
              >
                <el-option
                  v-for="opt in actionOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="模块">
              <el-select
                v-model="filters.module"
                placeholder="全部模块"
                clearable
                style="width: 140px"
              >
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
            <div v-loading="loading" class="log-view__body">
              <template v-if="logs.length">
                <LogTable :data="logs" />
              </template>
              <el-empty v-else description="暂无操作日志" />
            </div>
            <div v-if="total > 0" class="log-view__pagination">
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
      </el-tab-pane>

      <!-- 登录日志 -->
      <el-tab-pane label="登录日志" name="login">
        <div class="mc-filter-bar">
          <el-form inline @submit.prevent="handleLoginSearch">
            <el-form-item label="登录状态">
              <el-select v-model="loginFilters.loginStatus" style="width: 120px">
                <el-option
                  v-for="opt in loginStatusOptions"
                  :key="opt.label"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="IP 地址">
              <el-input
                v-model="loginFilters.ipAddress"
                placeholder="请输入 IP"
                clearable
                style="width: 170px"
              />
            </el-form-item>
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="loginFilters.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                value-format="YYYY-MM-DDTHH:mm:ss"
                style="width: 260px"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :icon="Search"
                :loading="loginLoading"
                @click="handleLoginSearch"
              >
                查询
              </el-button>
              <el-button @click="handleLoginReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="mc-card">
          <div class="mc-card__head">
            <span class="mc-card__title">登录记录</span>
            <span class="log-view__total">共 {{ loginTotal }} 条记录</span>
          </div>
          <div class="mc-card__body">
            <div v-loading="loginLoading" class="log-view__body">
              <template v-if="loginLogs.length">
                <LoginLogTable :data="loginLogs" />
              </template>
              <el-empty v-else description="暂无登录日志" />
            </div>
            <div v-if="loginTotal > 0" class="log-view__pagination">
              <el-pagination
                :current-page="loginPage"
                :page-size="loginPerPage"
                :total="loginTotal"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next"
                @current-change="handleLoginPageChange"
                @size-change="handleLoginSizeChange"
              />
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 导出日志 -->
      <el-tab-pane label="导出日志" name="export">
        <div class="mc-filter-bar">
          <el-form inline @submit.prevent="handleExportSearch">
            <el-form-item label="导出类型">
              <el-input
                v-model="exportFilters.exportType"
                placeholder="请输入导出类型"
                clearable
                style="width: 170px"
              />
            </el-form-item>
            <el-form-item label="是否匿名">
              <el-select v-model="exportFilters.isAnonymized" style="width: 120px">
                <el-option
                  v-for="opt in anonymizedOptions"
                  :key="opt.label"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="exportFilters.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                value-format="YYYY-MM-DDTHH:mm:ss"
                style="width: 260px"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :icon="Search"
                :loading="exportLoading"
                @click="handleExportSearch"
              >
                查询
              </el-button>
              <el-button @click="handleExportReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="mc-card">
          <div class="mc-card__head">
            <span class="mc-card__title">导出记录</span>
            <span class="log-view__total">共 {{ exportTotal }} 条记录</span>
          </div>
          <div class="mc-card__body">
            <div v-loading="exportLoading" class="log-view__body">
              <template v-if="exportLogs.length">
                <ExportLogTable :data="exportLogs" />
              </template>
              <el-empty v-else description="暂无导出日志" />
            </div>
            <div v-if="exportTotal > 0" class="log-view__pagination">
              <el-pagination
                :current-page="exportPage"
                :page-size="exportPerPage"
                :total="exportTotal"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next"
                @current-change="handleExportPageChange"
                @size-change="handleExportSizeChange"
              />
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="scss">
.log-view {
  &__tabs {
    :deep(.el-tabs__header) {
      margin-bottom: $spacing-lg;
    }
  }

  &__body {
    min-height: 180px;
  }

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
}
</style>
