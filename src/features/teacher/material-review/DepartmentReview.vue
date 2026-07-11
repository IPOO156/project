<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
/**
 * DepartmentReview - 系领导审核通道
 * 与院领导审核结构一致，但筛选路径和权限不同
 */
import { Check, Eye, X } from 'lucide-vue-next'
import { ref } from 'vue'
import StudentSelector from '@/features/teacher-shared/StudentSelector.vue'

const activeTab = ref<'pending' | 'history'>('pending')

const pendingList = ref([
  {
    id: 1,
    name: '刘一',
    studentId: '2024070001',
    className: '计科2402班',
    type: '学科竞赛申报',
    submitDate: '2026-07-06',
    status: 'pending',
  },
  {
    id: 2,
    name: '陈二',
    studentId: '2024070002',
    className: '计科2402班',
    type: '实训项目申报',
    submitDate: '2026-07-07',
    status: 'pending',
  },
])

const historyList = ref([
  {
    id: 3,
    name: '张三',
    studentId: '2024060001',
    className: '计科2401班',
    type: '竞赛之星报名',
    submitDate: '2026-07-04',
    reviewDate: '2026-07-05',
    result: 'approved',
    comment: '同意推荐',
  },
])

const detailDialogVisible = ref(false)
const currentReview = ref<any>(null)
const reviewComment = ref('')

function viewDetail(item: any) {
  currentReview.value = item
  reviewComment.value = ''
  detailDialogVisible.value = true
}

function handleApprove() {
  ElMessageBox.confirm('确认通过该审批？', '审批确认')
    .then(() => {
      ElMessage.success('已通过审批')
      detailDialogVisible.value = false
    })
    .catch(() => {})
}

function handleReject() {
  if (!reviewComment.value.trim()) {
    ElMessage.warning('请填写驳回原因')
    return
  }
  ElMessage.success('已驳回')
  detailDialogVisible.value = false
}
</script>

<template>
  <div class="dept-review">
    <StudentSelector title="系领导审核" @search="() => {}" @reset="() => {}" />

    <el-tabs v-model="activeTab">
      <el-tab-pane label="待审核" name="pending">
        <el-card>
          <template #header>
            <span class="section-title">待审核列表（{{ pendingList.length }}）</span>
          </template>
          <el-table :data="pendingList" stripe>
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column prop="studentId" label="学号" width="130" />
            <el-table-column prop="className" label="班级" width="130" />
            <el-table-column prop="type" label="申报类型" width="140" />
            <el-table-column prop="submitDate" label="提交时间" width="110" />
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="{ row }">
                <el-button size="small" :icon="Eye" @click="viewDetail(row)">查看</el-button>
                <el-button size="small" type="success" :icon="Check" @click="handleApprove"
                  >通过</el-button
                >
                <el-button size="small" type="danger" :icon="X" @click="handleReject"
                  >驳回</el-button
                >
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="已审核" name="history">
        <el-card>
          <template #header>
            <span class="section-title">已审核列表</span>
          </template>
          <el-table :data="historyList" stripe>
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column prop="studentId" label="学号" width="130" />
            <el-table-column prop="type" label="申报类型" width="140" />
            <el-table-column prop="submitDate" label="提交时间" width="110" />
            <el-table-column prop="reviewDate" label="审核时间" width="110" />
            <el-table-column label="结果" width="80">
              <template #default="{ row }">
                <el-tag :type="row.result === 'approved' ? 'success' : 'danger'" size="small">
                  {{ row.result === 'approved' ? '通过' : '驳回' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="comment" label="意见" min-width="160" />
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="detailDialogVisible" title="审核详情" width="600px">
      <el-descriptions v-if="currentReview" :column="2" border size="small">
        <el-descriptions-item label="姓名">{{ currentReview.name }}</el-descriptions-item>
        <el-descriptions-item label="学号">{{ currentReview.studentId }}</el-descriptions-item>
        <el-descriptions-item label="班级">{{ currentReview.className }}</el-descriptions-item>
        <el-descriptions-item label="申报类型">{{ currentReview.type }}</el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ currentReview.submitDate }}</el-descriptions-item>
      </el-descriptions>
      <el-divider />
      <el-form-item label="审核意见">
        <el-input v-model="reviewComment" type="textarea" :rows="3" placeholder="请填写审核意见…" />
      </el-form-item>
      <template #footer>
        <el-button @click="detailDialogVisible = false">取消</el-button>
        <el-button type="danger" :icon="X" :disabled="!reviewComment.trim()" @click="handleReject"
          >驳回</el-button
        >
        <el-button type="success" :icon="Check" @click="handleApprove">通过</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.dept-review {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
</style>
