<script setup lang="ts">
/**
 * 规划记录卡片：学期筛选 + 记录表格 + 详情抽屉 / 复制计划弹窗入口。
 * 数据由父页面从 useCareerPlanStore 取得后传入；删除与刷新通过事件回传父级处理。
 */
import type { TagProps } from 'element-plus'
import type { CareerPlanRecord } from '@/shared/types/types'
import { computed, ref } from 'vue'
import { useDict } from '@/shared/composables/composables'
import { APPLICATION_STATUS } from '@/shared/constants/dict'
import CareerPlanDetail from './CareerPlanDetail.vue'
import CopyCareerPlanDialog from './CopyCareerPlanDialog.vue'

const props = defineProps<{
  /** 全部规划记录（未筛选） */
  records: CareerPlanRecord[]
  /** 已填写的学期（去重，供下拉筛选） */
  semesters: string[]
  /** 列表加载中 */
  loading: boolean
  /** 空态文案（区分加载失败与确实没有记录） */
  emptyText: string
}>()

const emit = defineEmits<{
  (e: 'remove', id: string): void
  (e: 'refresh'): void
}>()

const semesterFilter = ref('')
const filteredRecords = computed(() =>
  semesterFilter.value
    ? props.records.filter((p) => p.semester === semesterFilter.value)
    : props.records,
)

const detailVisible = ref(false)
const detailPlanId = ref<number | null>(null)
const copyDialogVisible = ref(false)

function openDetail(row: any) {
  detailPlanId.value = Number(row.id)
  detailVisible.value = true
}

function openCopyDialog() {
  copyDialogVisible.value = true
}

const { getColor, getLabel } = useDict(APPLICATION_STATUS)
const getStatusType = computed(
  () =>
    (status: string): TagProps['type'] =>
      (getColor(status) as TagProps['type']) ?? 'info',
)
</script>

<template>
  <el-card class="gd-card gd-card--table">
    <template #header>
      <div class="card-space">
        <span class="card-title">规划记录</span>
        <div class="card-space__ops">
          <el-button size="small" @click="openCopyDialog">复制上一学期计划</el-button>
          <el-select
            v-model="semesterFilter"
            placeholder="全部学期"
            size="small"
            clearable
            class="semester-filter"
          >
            <el-option label="全部学期" value="" />
            <el-option v-for="s in semesters" :key="s" :label="s" :value="s" />
          </el-select>
        </div>
      </div>
    </template>
    <el-table
      v-loading="loading"
      class="u-w-full"
      :data="filteredRecords"
      :empty-text="emptyText"
      stripe
      size="small"
    >
      <el-table-column prop="semester" label="学期" width="160" />
      <el-table-column prop="title" label="标题" min-width="200" />
      <el-table-column prop="submitDate" label="提交时间" width="120" />
      <el-table-column label="进度" width="120">
        <template #default="{ row }">
          <el-progress
            v-if="row.progressRate != null"
            :percentage="row.progressRate"
            :stroke-width="8"
          />
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }"
          ><el-tag :type="getStatusType(row.status)" size="small">{{
            row.statusLabel || getLabel(row.status)
          }}</el-tag></template
        >
      </el-table-column>
      <!-- TODO(待后端契约字段)：教师反馈(teacherFeedback)、学生反思(reflection) 尚未在
           CareerPlanRecord 契约中定义，待后端补充后在此新增两列展示 -->
      <el-table-column label="操作" width="130" align="center">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
          <el-button type="danger" link size="small" @click="emit('remove', row.id)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <CareerPlanDetail
      :visible="detailVisible"
      :plan-id="detailPlanId"
      @close="detailVisible = false"
      @refresh="emit('refresh')"
    />

    <CopyCareerPlanDialog
      :visible="copyDialogVisible"
      @close="copyDialogVisible = false"
      @success="emit('refresh')"
    />
  </el-card>
</template>

<style scoped lang="scss">
.gd-card {
  :deep(.el-card__body) {
    padding: 16px 20px;
  }

  &--table :deep(.el-card__body) {
    padding: 0;
  }
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.card-space {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-space__ops {
  display: flex;
  align-items: center;
  gap: 8px;
}

.semester-filter {
  width: 180px;
}

// ─── 夜间模式适配 ───
html.dark {
  .card-title {
    color: #f1f5f9;
  }
}
</style>
