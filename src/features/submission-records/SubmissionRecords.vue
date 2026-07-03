<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSubmissionStore } from '@/app/stores/stores'
import { APPLICATION_TYPE_MAP, APPLICATION_STATUS } from '@/shared/constants/dict'
import type { ApplicationType, SubmissionFilters } from '@/shared/types/types'
import PageContainer from '@/shared/ui/PageContainer.vue'
import PageHeader from '@/shared/ui/PageHeader.vue'
import StatusTag from '@/shared/ui/StatusTag.vue'
import DictColumn from '@/shared/ui/DictColumn.vue'

const router = useRouter()
const submissionStore = useSubmissionStore()

const keyword = ref('')
const typeFilter = ref<ApplicationType | ''>('')
const statusFilter = ref('')
const filters = ref<SubmissionFilters>({})

const pageNum = ref(1)
const pageSize = ref(10)

const paginatedList = computed(() => {
  const start = (pageNum.value - 1) * pageSize.value
  return submissionStore.filteredRecords.slice(start, start + pageSize.value)
})

const total = computed(() => submissionStore.filteredRecords.length)

const typeOptions = computed(() =>
  Object.entries(APPLICATION_TYPE_MAP as Record<string, string>).map(([value, label]) => ({ value, label })),
)

const statusOptions = computed(() =>
  Object.entries(APPLICATION_STATUS as Record<string, { label: string }>).map(([value, config]) => ({ value, label: config.label })),
)

let debounceTimer: ReturnType<typeof setTimeout>
watch(keyword, (val) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    filters.value = { ...filters.value, keyword: val || undefined }
    fetchWithFilters()
  }, 300)
})

function handleTypeChange(val: ApplicationType | '') {
  filters.value = { ...filters.value, type: val || undefined }
  fetchWithFilters()
}

function handleStatusChange(val: string) {
  filters.value = { ...filters.value, status: val || undefined }
  fetchWithFilters()
}

function fetchWithFilters() {
  pageNum.value = 1
  submissionStore.fetchRecords(filters.value)
}

function handleReset() {
  keyword.value = ''
  typeFilter.value = ''
  statusFilter.value = ''
  filters.value = {}
  pageNum.value = 1
  submissionStore.fetchRecords()
}

function handlePageChange(page: number) {
  pageNum.value = page
}

function handleSizeChange(size: number) {
  pageSize.value = size
  pageNum.value = 1
}

function viewRecord(path: string) {
  router.push(path)
}

onMounted(() => {
  submissionStore.fetchRecords()
})
</script>

<template>
  <PageContainer>
    <PageHeader title="提交记录" subtitle="查看所有申报与奖项报名的提交历史" />

    <el-card class="filter-card">
      <el-row :gutter="16" align="middle">
        <el-col :span="6">
          <el-input v-model="keyword" placeholder="搜索关键词" :prefix-icon="Search" clearable />
        </el-col>
        <el-col :span="5">
          <el-select v-model="typeFilter" placeholder="模块类型" clearable style="width: 100%" @change="handleTypeChange">
            <el-option v-for="opt in typeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-col>
        <el-col :span="5">
          <el-select v-model="statusFilter" placeholder="状态" clearable style="width: 100%" @change="handleStatusChange">
            <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button @click="handleReset">重置</el-button>
        </el-col>
      </el-row>
    </el-card>

    <el-card>
      <el-table v-loading="submissionStore.loading" :data="paginatedList" stripe style="width: 100%">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column label="模块类型" width="120">
          <template #default="{ row }">
            <DictColumn :value="row.type" :options="typeOptions as any" />
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="submitDate" label="提交日期" width="120" />
        <el-table-column prop="semester" label="学期" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <StatusTag :status="row.status" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewRecord(row.sourcePath)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="total > 0" class="pagination-wrap">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>
  </PageContainer>
</template>

<style scoped lang="scss">
.filter-card {
  margin-bottom: 16px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
