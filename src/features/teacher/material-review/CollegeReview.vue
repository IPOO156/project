<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
/**
 * CollegeReview - 院领导审核通道
 * 筛选：年级→学院→专业→班级→学生信息
 * 查看个人信息 → 查看相关材料 → 审批操作：通过 / 驳回
 */
import { Check, Eye, X } from 'lucide-vue-next'
import { ref } from 'vue'
import StudentSelector from '@/features/teacher-shared/StudentSelector.vue'

const activeTab = ref<'pending' | 'history'>('pending')

// ── Mock 待审核列表 ──
const pendingList = ref([
  {
    id: 1,
    name: '张三',
    studentId: '2024060001',
    className: '计科2401班',
    type: '竞赛之星报名',
    submitDate: '2026-07-05',
    status: 'pending',
  },
  {
    id: 2,
    name: '李四',
    studentId: '2024060002',
    className: '计科2401班',
    type: '社会实践申报',
    submitDate: '2026-07-06',
    status: 'pending',
  },
  {
    id: 3,
    name: '王五',
    studentId: '2024060003',
    className: '计科2401班',
    type: '科研之星报名',
    submitDate: '2026-07-07',
    status: 'pending',
  },
  {
    id: 4,
    name: '赵六',
    studentId: '2024060004',
    className: '软件2401班',
    type: '奖学金申请',
    submitDate: '2026-07-07',
    status: 'pending',
  },
])

// ── Mock 已审核列表 ──
const historyList = ref([
  {
    id: 5,
    name: '孙七',
    studentId: '2024060005',
    className: '软件2401班',
    type: '竞赛之星报名',
    submitDate: '2026-07-03',
    reviewDate: '2026-07-04',
    result: 'approved',
    comment: '符合条件，同意推荐',
  },
  {
    id: 6,
    name: '周八',
    studentId: '2024060006',
    className: '计科2402班',
    type: '社会实践申报',
    submitDate: '2026-07-02',
    reviewDate: '2026-07-03',
    result: 'rejected',
    comment: '证明材料不充分',
  },
])

const detailDialogVisible = ref(false)
const currentReview = ref<any>(null)
const reviewComment = ref('')

// ── Mock 学生详情 ──
const studentDetail = ref({
  name: '',
  studentId: '',
  grade: '',
  major: '',
  className: '',
  email: '',
  phone: '',
  gpa: 3.82,
})

function viewDetail(item: any) {
  currentReview.value = item
  studentDetail.value = {
    name: item.name,
    studentId: item.studentId,
    grade: '2024级',
    major: '计算机科学与技术',
    className: item.className,
    email: `${item.studentId}@edu.cn`,
    phone: '138****0000',
    gpa: 3.82,
  }
  reviewComment.value = ''
  detailDialogVisible.value = true
}

function handleApprove() {
  ElMessageBox.confirm('确认通过该审批？', '审批确认', {
    confirmButtonText: '确定通过',
    cancelButtonText: '取消',
    type: 'success',
  })
    .then(() => {
      ElMessage.success('已通过审批')
      detailDialogVisible.value = false
      pendingList.value = pendingList.value.filter((p) => p.id !== currentReview.value?.id)
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
  pendingList.value = pendingList.value.filter((p) => p.id !== currentReview.value?.id)
}

function getTypeColor(type: string) {
  if (type.includes('竞赛')) return 'var(--el-color-warning)'
  if (type.includes('社会')) return 'var(--el-color-success)'
  if (type.includes('科研')) return 'var(--el-color-purple)'
  if (type.includes('奖学金')) return 'var(--el-color-danger)'
  return 'var(--el-color-primary)'
}
</script>

<template>
  <div class="college-review">
    <!-- 筛选器 -->
    <StudentSelector title="院领导审核" @search="() => {}" @reset="() => {}" />

    <!-- 标签切换 -->
    <el-tabs v-model="activeTab" class="college-review__tabs">
      <el-tab-pane label="待审核" name="pending">
        <el-card>
          <template #header>
            <span class="section-title">待审核列表（{{ pendingList.length }}）</span>
          </template>

          <div v-if="pendingList.length > 0" class="review-cards">
            <div v-for="item in pendingList" :key="item.id" class="review-card">
              <div class="review-card__header">
                <div class="review-card__student">
                  <el-avatar :size="40">{{ item.name.charAt(0) }}</el-avatar>
                  <div class="review-card__info">
                    <span class="review-card__name">{{ item.name }}</span>
                    <span class="review-card__class"
                      >{{ item.className }} · {{ item.studentId }}</span
                    >
                  </div>
                </div>
                <el-tag
                  :color="getTypeColor(item.type)"
                  effect="dark"
                  size="small"
                  style="color: #fff"
                >
                  {{ item.type }}
                </el-tag>
              </div>
              <div class="review-card__body">
                <span class="review-card__date">提交时间：{{ item.submitDate }}</span>
              </div>
              <div class="review-card__actions">
                <el-button type="primary" :icon="Eye" size="small" @click="viewDetail(item)">
                  查看详情
                </el-button>
                <el-button type="success" :icon="Check" size="small" @click="handleApprove">
                  通过
                </el-button>
                <el-button type="danger" :icon="X" size="small" @click="handleReject">
                  驳回
                </el-button>
              </div>
            </div>
          </div>

          <el-empty v-else description="暂无待审核材料" :image-size="100" />
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="已审核" name="history">
        <el-card>
          <template #header>
            <span class="section-title">已审核列表</span>
          </template>
          <el-table :data="historyList" stripe style="width: 100%">
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column prop="studentId" label="学号" width="130" />
            <el-table-column prop="className" label="班级" width="120" />
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
            <el-table-column prop="comment" label="审核意见" min-width="160" />
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="`审核详情 — ${currentReview?.name}`"
      width="650px"
      :close-on-click-modal="false"
    >
      <template v-if="currentReview">
        <el-descriptions title="个人信息" :column="2" border size="small">
          <el-descriptions-item label="姓名">{{ studentDetail.name }}</el-descriptions-item>
          <el-descriptions-item label="学号">{{ studentDetail.studentId }}</el-descriptions-item>
          <el-descriptions-item label="年级">{{ studentDetail.grade }}</el-descriptions-item>
          <el-descriptions-item label="专业">{{ studentDetail.major }}</el-descriptions-item>
          <el-descriptions-item label="班级">{{ studentDetail.className }}</el-descriptions-item>
          <el-descriptions-item label="GPA">{{ studentDetail.gpa }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ studentDetail.email }}</el-descriptions-item>
          <el-descriptions-item label="手机">{{ studentDetail.phone }}</el-descriptions-item>
        </el-descriptions>

        <el-divider />

        <el-form-item label="申报材料">
          <div class="review-materials">
            <div class="review-materials__file">
              <Eye :size="16" />
              <span>申报表.pdf</span>
            </div>
            <div class="review-materials__file">
              <Eye :size="16" />
              <span>获奖证书.pdf</span>
            </div>
            <div class="review-materials__file">
              <Eye :size="16" />
              <span>证明材料.zip</span>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="审核意见">
          <el-input
            v-model="reviewComment"
            type="textarea"
            :rows="3"
            placeholder="请填写审核意见（驳回时必填）…"
          />
        </el-form-item>
      </template>

      <template #footer>
        <el-button @click="detailDialogVisible = false">取消</el-button>
        <el-button type="danger" :icon="X" :disabled="!reviewComment.trim()" @click="handleReject">
          驳回
        </el-button>
        <el-button type="success" :icon="Check" @click="handleApprove"> 通过 </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.college-review {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;

  &__tabs {
    :deep(.el-tabs__header) {
      margin-bottom: $spacing-lg;
    }
  }
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.review-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: $spacing-lg;
}

.review-card {
  border: 1px solid var(--el-border-color-light);
  border-radius: $radius-lg;
  padding: $spacing-lg;
  transition: all 0.2s;

  &:hover {
    box-shadow: $shadow-base;
    border-color: var(--el-color-primary-light-7);
  }

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: $spacing-md;
    margin-bottom: $spacing-md;
  }

  &__student {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__name {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__class {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__body {
    margin-bottom: $spacing-md;
  }

  &__date {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  &__actions {
    display: flex;
    gap: $spacing-sm;
    padding-top: $spacing-md;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

.review-materials {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;

  &__file {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: 8px 12px;
    background: var(--el-fill-color-light);
    border-radius: $radius-base;
    cursor: pointer;
    color: var(--el-color-primary);
    font-size: 14px;
    transition: background 0.2s;

    &:hover {
      background: var(--el-color-primary-light-9);
    }
  }
}
</style>
