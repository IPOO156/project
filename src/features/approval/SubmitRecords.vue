<script setup lang="ts">
import { Eye } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { APPLICATION_TYPE_MAP, APPROVAL_STATUS_OPTIONS, SEMESTER_OPTIONS } from '@/shared/constants/dict'
import StatusTag from '@/shared/ui/StatusTag.vue'

interface SubmitRecord {
  id: string
  type: string
  title: string
  submitDate: string
  semester: string
  status: 'approved' | 'rejected' | 'pending'
  remark?: string
}

// ── 响应式数据 ──
const semesterFilter = ref('')
const statusFilter = ref('')
const detailVisible = ref(false)
const currentRecord = ref<SubmitRecord | null>(null)

// ── Mock 数据（接口联调后替换） ──
const allRecords = ref<SubmitRecord[]>([
  { id: '1', type: 'competition', title: '全国大学生数学建模竞赛', submitDate: '2025-10-01', semester: '大二上', status: 'approved' },
  { id: '2', type: 'innovation', title: '智创科技工作室', submitDate: '2025-07-01', semester: '大二下', status: 'approved' },
  { id: '3', type: 'scholarship', title: '校级一等奖学金', submitDate: '2026-01-15', semester: '大二上', status: 'rejected', remark: '材料不完整，请补充后重新提交' },
  { id: '4', type: 'socialPractice', title: '科技下乡志愿服务', submitDate: '2025-09-01', semester: '大二下', status: 'pending' },
  { id: '5', type: 'certificate', title: '大学英语四级证书', submitDate: '2025-07-01', semester: '大一下', status: 'approved' },
  { id: '6', type: 'competition', title: '校ACM程序设计竞赛', submitDate: '2025-06-01', semester: '大二上', status: 'pending' },
])

// ── Computed ──
const filteredRecords = computed(() => {
  return allRecords.value.filter((r) => {
    if (semesterFilter.value && r.semester !== semesterFilter.value)
      return false
    if (statusFilter.value && r.status !== statusFilter.value)
      return false
    return true
  })
})

const statusCount = computed(() => (status: SubmitRecord['status']) => {
  return allRecords.value.filter(r => r.status === status).length
})

// ── 方法函数 ──
function viewDetail(record: SubmitRecord) {
  currentRecord.value = record
  detailVisible.value = true
}

// Element Plus 表格 slot 的 row 类型为 DefaultRow，通过脚本层函数做安全断言
function statusOf(row: unknown): SubmitRecord['status'] {
  return (row as SubmitRecord).status
}

function viewDetailByRow(row: unknown) {
  viewDetail(row as SubmitRecord)
}
</script>

<template>
  <div class="records-page">
    <el-card>
      <template #header>
        <span class="card-title">提交记录</span>
      </template>

      <!-- 筛选 -->
      <div class="records-page__filters">
        <el-select v-model="semesterFilter" placeholder="按学期筛选" clearable class="filter-select filter-select--semester">
          <el-option v-for="s in SEMESTER_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
        <el-select v-model="statusFilter" placeholder="按状态筛选" clearable class="filter-select filter-select--status">
          <el-option v-for="s in APPROVAL_STATUS_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
      </div>

      <!-- 统计 -->
      <div class="records-page__stats">
        <span>共 <strong>{{ filteredRecords.length }}</strong> 条记录</span>
        <span>已通过 <strong class="stat-approved">{{ statusCount('approved') }}</strong></span>
        <span>待审批 <strong class="stat-pending">{{ statusCount('pending') }}</strong></span>
        <span>已驳回 <strong class="stat-rejected">{{ statusCount('rejected') }}</strong></span>
      </div>

      <!-- 记录列表 -->
      <el-table :data="filteredRecords" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column label="申报类型" width="120">
          <template #default="{ row }">{{ APPLICATION_TYPE_MAP[row.type] || row.type }}</template>
        </el-table-column>
        <el-table-column prop="title" label="申报内容" min-width="200" show-overflow-tooltip />
        <el-table-column prop="semester" label="学期" width="100" />
        <el-table-column prop="submitDate" label="提交时间" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <StatusTag :status="statusOf(row)" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" :icon="Eye" size="small" @click="viewDetailByRow(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="申报详情" width="560px">
      <template v-if="currentRecord">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="申报类型">{{ APPLICATION_TYPE_MAP[currentRecord.type] }}</el-descriptions-item>
          <el-descriptions-item label="申报内容">{{ currentRecord.title }}</el-descriptions-item>
          <el-descriptions-item label="所属学期">{{ currentRecord.semester }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ currentRecord.submitDate }}</el-descriptions-item>
          <el-descriptions-item label="审批状态">
            <StatusTag :status="currentRecord.status" size="small" />
          </el-descriptions-item>
          <el-descriptions-item v-if="currentRecord.remark" label="审批备注">{{ currentRecord.remark }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.card-title {
  font-size: 16px;
  font-weight: 600;
}

.records-page {
  &__filters {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
  }

  &__stats {
    display: flex;
    gap: 20px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin-bottom: 16px;
    padding: 12px 16px;
    background: var(--el-fill-color-lighter);
    border-radius: 6px;

    strong { font-size: 16px; }
    .stat-approved { color: var(--el-color-success); }
    .stat-pending { color: var(--el-color-warning); }
    .stat-rejected { color: var(--el-color-danger); }
  }
}

.filter-select {
  &--semester,
  &--status {
    width: 160px;
  }
}
</style>
