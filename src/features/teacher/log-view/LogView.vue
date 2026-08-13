<script setup lang="ts">
import { ElMessage } from 'element-plus'
/**
 * LogView - 日志查看
 * 管理员：筛选条件（年级→学院→专业→时间）→ 查看操作记录
 * 审核员/课任教师：筛选时间 → 查看全部操作记录
 */
import { RefreshCw, Search } from 'lucide-vue-next'
import { computed, ref } from 'vue'

import { useUserStore } from '@/app/stores/stores'
import { LOG_ACTION_TYPES } from '@/shared/constants/dict'
import LogTable from './components/LogTable.vue'

const userStore = useUserStore()
const isAdmin = computed(() => userStore.isAdmin || userStore.isSuperAdmin)

const filters = ref({
  grade: '',
  college: '',
  major: '',
  dateRange: [] as string[],
  actionType: '',
})

// 操作类型选项：统一从 LOG_ACTION_TYPES 派生，与 LogTable 共享同一字典
const actionTypeOptions = [
  { value: '', label: '全部类型' },
  ...Object.entries(LOG_ACTION_TYPES).map(([value, { label }]) => ({ value, label })),
]

const logList = ref([
  {
    id: 1,
    user: '管理员-李老师',
    role: '管理员',
    actionType: 'export',
    action: '导出2024级学生基本信息',
    target: '2024级全校',
    targetId: '',
    ip: '192.168.1.100',
    time: '2026-07-08 10:32:15',
    status: 'success',
    beforeSnapshot: null,
    afterSnapshot: { type: 'export', fields: ['name', 'studentId', 'class'], count: 356 },
  },
  {
    id: 2,
    user: '审核员-王老师',
    role: '审核员',
    actionType: 'review',
    action: '通过张三的竞赛之星申报',
    target: '张三',
    targetId: '2024060001',
    ip: '192.168.1.101',
    time: '2026-07-08 10:15:42',
    status: 'approved',
    beforeSnapshot: { status: 'pending' },
    afterSnapshot: { status: 'approved', reviewer: '王老师' },
  },
  {
    id: 3,
    user: '课任教师-刘老师',
    role: '课任教师',
    actionType: 'login',
    action: '查看计科2401班档案',
    target: '计科2401班',
    targetId: '',
    ip: '192.168.1.102',
    time: '2026-07-08 09:48:20',
    status: 'info',
    beforeSnapshot: null,
    afterSnapshot: null,
  },
  {
    id: 4,
    user: '管理员-赵老师',
    role: '管理员',
    actionType: 'update',
    action: '修改学生密码',
    target: '李四',
    targetId: '2024060002',
    ip: '192.168.1.103',
    time: '2026-07-08 09:22:05',
    status: 'success',
    beforeSnapshot: null,
    afterSnapshot: { action: 'password_reset' },
  },
  {
    id: 5,
    user: '审核员-钱老师',
    role: '审核员',
    actionType: 'review',
    action: '驳回王五的社会实践申报',
    target: '王五',
    targetId: '2024060003',
    ip: '192.168.1.104',
    time: '2026-07-08 08:55:33',
    status: 'rejected',
    beforeSnapshot: { status: 'pending' },
    afterSnapshot: { status: 'rejected', reason: '材料不齐全' },
  },
  {
    id: 6,
    user: '管理员-李老师',
    role: '管理员',
    actionType: 'create',
    action: '新增管理员账号',
    target: '孙老师',
    targetId: '',
    ip: '192.168.1.100',
    time: '2026-07-07 17:20:10',
    status: 'success',
    beforeSnapshot: null,
    afterSnapshot: { role: 'admin', username: 'sun' },
  },
  {
    id: 7,
    user: '系统',
    role: '系统',
    actionType: 'export',
    action: '每日数据备份完成',
    target: '数据库',
    targetId: '',
    ip: '-',
    time: '2026-07-08 03:00:00',
    status: 'info',
    beforeSnapshot: null,
    afterSnapshot: { backupSize: '2.3GB', tables: 24 },
  },
  {
    id: 8,
    user: '课任教师-刘老师',
    role: '课任教师',
    actionType: 'export',
    action: '下载成绩汇总表',
    target: '软件2401班',
    targetId: '',
    ip: '192.168.1.102',
    time: '2026-07-07 16:10:45',
    status: 'success',
    beforeSnapshot: null,
    afterSnapshot: { format: 'xlsx', records: 42 },
  },
])

const gradeOptions = ['2024级', '2023级', '2022级', '2021级']
const collegeOptions = ['计算机学院', '数学学院', '物理学院', '外语学院']

// ─── 数据快照弹窗 ───
const snapshotVisible = ref(false)
const snapshotData = ref<{ before: any; after: any; title: string } | null>(null)

function handleViewSnapshot(row: any) {
  snapshotData.value = {
    before: row.beforeSnapshot,
    after: row.afterSnapshot,
    title: `${row.action} - ${row.target}`,
  }
  snapshotVisible.value = true
}

/** 按筛选条件过滤日志（Mock 阶段基于 target/time/actionType 匹配，接口就绪后替换） */
const filteredLogs = computed(() => {
  let list = logList.value
  if (filters.value.grade) {
    list = list.filter((l) => (l.target || l.action || '').includes(filters.value.grade))
  }
  if (filters.value.college) {
    list = list.filter((l) => (l.target || l.action || '').includes(filters.value.college))
  }
  if (filters.value.major) {
    list = list.filter((l) => (l.target || l.action || '').includes(filters.value.major))
  }
  if (filters.value.actionType) {
    list = list.filter((l) => l.actionType === filters.value.actionType)
  }
  if (filters.value.dateRange?.length === 2) {
    const [start, end] = filters.value.dateRange
    if (start && end) {
      list = list.filter((l) => l.time.slice(0, 10) >= start && l.time.slice(0, 10) <= end)
    }
  }
  return list
})

function handleSearch() {
  ElMessage.success(`查询到 ${filteredLogs.value.length} 条记录`)
}

function handleReset() {
  filters.value = { grade: '', college: '', major: '', dateRange: [], actionType: '' }
  ElMessage.success('筛选条件已重置')
}
</script>

<template>
  <div class="log-view">
    <!-- 筛选条件 -->
    <el-card class="log-view__filters">
      <el-row :gutter="16">
        <el-col v-if="isAdmin" :xs="12" :sm="6" :md="4">
          <el-form-item label="年级">
            <el-select v-model="filters.grade" placeholder="选择年级" clearable style="width: 100%">
              <el-option v-for="g in gradeOptions" :key="g" :label="g" :value="g" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col v-if="isAdmin" :xs="12" :sm="6" :md="5">
          <el-form-item label="学院">
            <el-select
              v-model="filters.college"
              placeholder="选择学院"
              clearable
              style="width: 100%"
            >
              <el-option v-for="c in collegeOptions" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col v-if="isAdmin && filters.college" :xs="12" :sm="6" :md="4">
          <el-form-item label="专业">
            <el-select v-model="filters.major" placeholder="选择专业" clearable style="width: 100%">
              <el-option label="计算机科学与技术" value="计算机科学与技术" />
              <el-option label="软件工程" value="软件工程" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="12" :sm="6" :md="4">
          <el-form-item label="操作类型">
            <el-select
              v-model="filters.actionType"
              placeholder="操作类型"
              clearable
              style="width: 100%"
            >
              <el-option
                v-for="opt in actionTypeOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="12" :sm="8" :md="6">
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="filters.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :xs="12" :sm="4" :md="3">
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        </el-col>
        <el-col :xs="12" :sm="4" :md="2">
          <el-button :icon="RefreshCw" @click="handleReset">刷新</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 日志列表 -->
    <el-card class="log-view__list">
      <template #header>
        <div class="log-view__header">
          <span class="section-title">操作记录</span>
          <span class="log-view__total">共 {{ filteredLogs.length }} 条记录</span>
        </div>
      </template>

      <LogTable :data="filteredLogs" @view="handleViewSnapshot" />

      <div class="log-view__pagination">
        <el-pagination
          :total="filteredLogs.length"
          :page-size="10"
          layout="prev, pager, next, total"
          small
        />
      </div>
    </el-card>

    <!-- 数据快照弹窗 -->
    <el-dialog
      v-model="snapshotVisible"
      title="数据快照"
      width="640px"
      @close="snapshotData = null"
    >
      <template v-if="snapshotData">
        <h4 class="snapshot-title">{{ snapshotData.title }}</h4>
        <el-tabs>
          <el-tab-pane label="变更前">
            <template v-if="snapshotData.before">
              <pre class="snapshot-json">{{ JSON.stringify(snapshotData.before, null, 2) }}</pre>
            </template>
            <el-empty v-else description="无变更前数据" />
          </el-tab-pane>
          <el-tab-pane label="变更后">
            <template v-if="snapshotData.after">
              <pre class="snapshot-json">{{ JSON.stringify(snapshotData.after, null, 2) }}</pre>
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
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;

  &__filters {
    margin-bottom: 0;
  }

  &__list {
    margin-bottom: 0;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
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

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.snapshot-title {
  margin: 0 0 16px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.snapshot-json {
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
</style>
