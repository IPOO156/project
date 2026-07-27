<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { Check, ClipboardList, Eye, FileText, TrendingUp, X } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useUserStore } from '@/app/stores/stores'
import ReviewDetailPanel from './components/ReviewDetailPanel.vue'
import ReviewHistory from './components/ReviewHistory.vue'
import { useReviewOperations } from './composables/useReviewOperations'

const userStore = useUserStore()
const isAdmin = computed(() => userStore.isAdmin || userStore.isSuperAdmin || userStore.isReviewer)
const {
  reviewComment,
  templates,
  isProcessing,
  currentIndex,
  approve,
  reject,
  batchApprove,
  batchReject,
  goPrev,
  goNext,
  clearComment,
} = useReviewOperations()

const batchRejectReason = ref('')
const filters = ref({ grade: '', major: '', className: '', type: '', keyword: '' })

const typeOptions = [
  { label: '全部类型', value: '' },
  { label: '学科竞赛', value: 'competition' },
  { label: '创新创业', value: 'innovation' },
  { label: '学术研究', value: 'research' },
  { label: '奖学金', value: 'scholarship' },
  { label: '荣誉证书', value: 'certificate' },
  { label: '实习经历', value: 'internship' },
  { label: '组织履历', value: 'organization' },
  { label: '实训项目', value: 'training' },
  { label: '社会实践', value: 'socialPractice' },
  { label: '图书心得', value: 'bookReport' },
  { label: '竞赛之星', value: 'competitionStar' },
  { label: '双创之星', value: 'innovationStar' },
  { label: '科研项目', value: 'scientificProject' },
  { label: '软件著作权', value: 'softwareCopyright' },
  { label: '发表论文', value: 'paper' },
]

const pendingList = ref([
  {
    id: 1,
    name: '张三',
    studentId: '2024060001',
    className: '计科2401班',
    type: '学科竞赛',
    major: '计算机科学与技术',
    grade: '2024级',
    duplicate: false,
    submitDate: '2026-07-15',
    attachments: [{ name: '竞赛获奖证书.pdf', url: '#', type: 'pdf' }],
    formData: {
      competitionName: '全国大学生数学建模竞赛',
      competitionType: 'national',
      awardLevel: 'first',
      awardDate: '2026-06',
    },
  },
  {
    id: 2,
    name: '李四',
    studentId: '2024060002',
    className: '计科2401班',
    type: '社会实践',
    major: '计算机科学与技术',
    grade: '2024级',
    duplicate: true,
    submitDate: '2026-07-14',
    attachments: [{ name: '实践报告.pdf', url: '#', type: 'pdf' }],
    formData: { activityName: '暑期三下乡社会实践', location: '湖南湘西' },
  },
  {
    id: 3,
    name: '王五',
    studentId: '2024060003',
    className: '计科2402班',
    type: '奖学金',
    major: '计算机科学与技术',
    grade: '2024级',
    duplicate: false,
    submitDate: '2026-07-13',
    attachments: [{ name: '奖学金申请表.pdf', url: '#', type: 'pdf' }],
    formData: { awardName: '国家奖学金', scholarshipLevel: 'national' },
  },
  {
    id: 4,
    name: '赵六',
    studentId: '2024060004',
    className: '软件2401班',
    type: '竞赛之星',
    major: '软件工程',
    grade: '2024级',
    duplicate: false,
    submitDate: '2026-07-12',
    attachments: [],
    formData: { competitionName: 'ACM 程序设计竞赛', awardLevel: 'second' },
  },
  {
    id: 5,
    name: '孙七',
    studentId: '2024060005',
    className: '软件2401班',
    type: '学术研究',
    major: '软件工程',
    grade: '2024级',
    duplicate: true,
    submitDate: '2026-07-11',
    attachments: [],
    formData: { projectName: '基于深度学习的图像识别研究', projectLevel: 'national' },
  },
  {
    id: 6,
    name: '周八',
    studentId: '2024060006',
    className: '计科2402班',
    type: '实训项目',
    major: '计算机科学与技术',
    grade: '2024级',
    duplicate: false,
    submitDate: '2026-07-10',
    attachments: [],
    formData: { projectName: 'Vue3 企业级开发实训' },
  },
])

const reviewHistoryMap: Record<string | number, any[]> = {
  1: [{ reviewer: '刘老师', time: '2026-07-15 10:30', action: 'rejected', comment: '材料不完整' }],
}
const filteredList = computed(() =>
  pendingList.value.filter((r) => {
    if (filters.value.type && r.type !== filters.value.type) return false
    if (filters.value.className && !r.className.includes(filters.value.className)) return false
    if (
      filters.value.keyword &&
      !r.name.includes(filters.value.keyword) &&
      !r.studentId.includes(filters.value.keyword)
    )
      return false
    return true
  }),
)
const currentItem = computed(() => filteredList.value[currentIndex.value] || null)
const detailVisible = ref(false)
const selectedIds = ref<Set<string | number>>(new Set())
const studentArchiveVisible = ref(false)
const stats = computed(() => ({
  total: pendingList.value.length,
  today: pendingList.value.filter((r) => r.submitDate === '2026-07-15').length,
  approved: 0,
  rejected: 0,
}))

async function handleApprove(item: any) {
  await approve(item, pendingList.value)
}
async function handleReject(item: any) {
  await reject(item, pendingList.value)
  clearComment()
}
async function handleBatchApprove() {
  const items = filteredList.value.filter((r) => selectedIds.value.has(r.id))
  await batchApprove(items, pendingList.value)
  selectedIds.value.clear()
}
async function handleBatchReject() {
  if (!batchRejectReason.value.trim()) {
    ElMessage.warning('请填写批量驳回原因')
    return
  }
  const items = filteredList.value.filter((r) => selectedIds.value.has(r.id))
  const count = await batchReject(items, pendingList.value, batchRejectReason.value)
  if (count > 0) {
    selectedIds.value.clear()
    batchRejectReason.value = ''
  }
}
function toggleSelect(id: string | number) {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id)
  else selectedIds.value.add(id)
}
function handleSelectAll(checked: any) {
  if (checked) {
    filteredList.value.forEach((item) => selectedIds.value.add(item.id))
  } else {
    selectedIds.value.clear()
  }
}
function openDetail(item: any) {
  currentIndex.value = filteredList.value.indexOf(item)
  detailVisible.value = true
}
</script>

<template>
  <div class="college-review">
    <div class="stats-row">
      <el-card shadow="hover" class="stat-card"
        ><div class="stat-card__body">
          <div>
            <p class="stat-card__label">待审核</p>
            <p class="stat-card__value">{{ stats.total }}</p>
          </div>
          <div class="stat-card__icon" style="background: #e8f0fe; color: #4a7fb5">
            <ClipboardList :size="22" />
          </div></div
      ></el-card>
      <el-card shadow="hover" class="stat-card"
        ><div class="stat-card__body">
          <div>
            <p class="stat-card__label">今日新增</p>
            <p class="stat-card__value">{{ stats.today }}</p>
          </div>
          <div class="stat-card__icon" style="background: #e6f7ee; color: #10b981">
            <TrendingUp :size="22" />
          </div></div
      ></el-card>
      <el-card shadow="hover" class="stat-card"
        ><div class="stat-card__body">
          <div>
            <p class="stat-card__label">已通过</p>
            <p class="stat-card__value">{{ stats.approved }}</p>
          </div>
          <div class="stat-card__icon" style="background: #f0e6ff; color: #8b5cf6">
            <Check :size="22" />
          </div></div
      ></el-card>
      <el-card shadow="hover" class="stat-card"
        ><div class="stat-card__body">
          <div>
            <p class="stat-card__label">已驳回</p>
            <p class="stat-card__value">{{ stats.rejected }}</p>
          </div>
          <div class="stat-card__icon" style="background: #fef3e2; color: #f59e0b">
            <X :size="22" />
          </div></div
      ></el-card>
    </div>

    <el-card shadow="never"
      ><div class="filter-row">
        <el-select v-model="filters.grade" placeholder="年级" clearable class="filter-item"
          ><el-option label="全部" value="" /><el-option label="2024级" value="2024级"
        /></el-select>
        <el-select v-model="filters.className" placeholder="班级" clearable class="filter-item"
          ><el-option label="全部" value="" /><el-option
            label="计科2401班"
            value="计科2401班" /><el-option label="计科2402班" value="计科2402班" /><el-option
            label="软件2401班"
            value="软件2401班"
        /></el-select>
        <el-select v-model="filters.type" placeholder="申报类型" clearable class="filter-item"
          ><el-option v-for="t in typeOptions" :key="t.value" :label="t.label" :value="t.value"
        /></el-select>
        <el-input
          v-model="filters.keyword"
          placeholder="姓名/学号"
          clearable
          class="filter-item filter-item--keyword"
        /></div
    ></el-card>

    <div class="batch-bar">
      <div class="batch-bar__left">
        <el-checkbox
          :indeterminate="selectedIds.size > 0 && selectedIds.size < filteredList.length"
          :checked="selectedIds.size === filteredList.length"
          @change="handleSelectAll"
          >全选</el-checkbox
        ><span v-if="selectedIds.size > 0" class="batch-bar__count"
          >已选 {{ selectedIds.size }} 条</span
        >
      </div>
      <div class="batch-bar__right">
        <el-input
          v-model="batchRejectReason"
          placeholder="批量驳回原因…"
          size="small"
          class="batch-reject-input"
        />
        <el-button
          type="danger"
          size="small"
          :disabled="selectedIds.size === 0 || !batchRejectReason.trim()"
          @click="handleBatchReject"
          >批量驳回</el-button
        >
        <el-button
          type="success"
          size="small"
          :disabled="selectedIds.size === 0"
          @click="handleBatchApprove"
          >批量通过</el-button
        >
      </div>
    </div>

    <el-card shadow="never">
      <template #header
        ><span>待审核（{{ filteredList.length }}）</span></template
      >
      <div v-if="filteredList.length > 0" class="review-cards">
        <div
          v-for="item in filteredList"
          :key="item.id"
          class="review-card"
          :class="{ 'is-duplicate': item.duplicate }"
        >
          <el-checkbox
            v-if="isAdmin"
            :checked="selectedIds.has(item.id)"
            class="review-card__checkbox"
            @change="toggleSelect(item.id)"
          />
          <div class="review-card__main">
            <div class="review-card__header">
              <div class="review-card__student">
                <el-avatar :size="40">{{ item.name.charAt(0) }}</el-avatar>
                <div>
                  <span class="review-card__name">{{ item.name }}</span
                  ><span class="review-card__meta">
                    {{ item.className }} · {{ item.studentId }}</span
                  >
                </div>
              </div>
              <el-tag color="#e6a23c" effect="dark" size="small" style="color: #fff">{{
                item.type
              }}</el-tag>
            </div>
            <div class="review-card__body">
              <span>提交：{{ item.submitDate }}</span
              ><el-tag v-if="item.duplicate" type="warning" size="small" effect="plain"
                >有重复</el-tag
              >
            </div>
            <ReviewHistory :history="reviewHistoryMap[item.id] || []" />
            <div class="review-card__actions">
              <el-button type="primary" :icon="Eye" size="small" @click="openDetail(item)"
                >审核</el-button
              >
              <el-button :icon="FileText" size="small" @click="studentArchiveVisible = true"
                >档案</el-button
              >
              <el-button
                v-if="isAdmin"
                type="success"
                :icon="Check"
                size="small"
                :loading="isProcessing"
                @click="handleApprove(item)"
                >通过</el-button
              >
              <el-button
                v-if="isAdmin"
                type="danger"
                :icon="X"
                size="small"
                :loading="isProcessing"
                @click="handleReject(item)"
                >驳回</el-button
              >
            </div>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无待审核材料" />
    </el-card>

    <ReviewDetailPanel
      :record="currentItem"
      :visible="detailVisible"
      @close="detailVisible = false"
      @prev="goPrev"
      @next="goNext(filteredList.length)"
    >
      <template #actions>
        <el-select
          v-if="isAdmin"
          v-model="reviewComment"
          placeholder="常用驳回原因…"
          size="small"
          class="reject-template"
          @change="(val: string) => (reviewComment = val)"
        >
          <el-option v-for="t in templates" :key="t.text" :label="t.label" :value="t.text" />
        </el-select>
        <el-input
          v-if="isAdmin"
          v-model="reviewComment"
          type="textarea"
          :rows="2"
          placeholder="驳回原因（必填）…"
          class="reject-input"
        />
        <el-button
          v-if="isAdmin"
          type="danger"
          :icon="X"
          :disabled="!reviewComment.trim()"
          :loading="isProcessing"
          @click="currentItem && handleReject(currentItem)"
          >驳回</el-button
        >
        <el-button
          v-if="isAdmin"
          type="success"
          :icon="Check"
          :loading="isProcessing"
          @click="currentItem && handleApprove(currentItem)"
          >通过</el-button
        >
      </template>
    </ReviewDetailPanel>

    <el-dialog v-model="studentArchiveVisible" title="学生档案" width="520px">
      <el-descriptions :column="1" border size="small">
        <el-descriptions-item label="姓名">{{ currentItem?.name }}</el-descriptions-item>
        <el-descriptions-item label="学号">{{ currentItem?.studentId }}</el-descriptions-item>
        <el-descriptions-item label="班级">{{ currentItem?.className }}</el-descriptions-item>
      </el-descriptions>
      <template #footer
        ><el-button @click="studentArchiveVisible = false">关闭</el-button></template
      >
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.college-review {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.stat-card {
  &__body {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  &__label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin-bottom: 4px;
  }
  &__value {
    font-size: 24px;
    font-weight: 700;
    color: #1e293b;
  }
  &__icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
}
.filter-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.filter-item {
  width: 150px;
  &--keyword {
    width: 200px;
    flex: 1;
  }
}
.batch-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-5);
  border-radius: 8px;
  &__left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  &__right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  &__count {
    font-size: 13px;
    color: var(--el-color-primary);
    font-weight: 600;
  }
}
.review-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 14px;
}
.review-card {
  position: relative;
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  padding: 16px;
  transition: all 0.2s;
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }
  &.is-duplicate {
    border-color: #f59e0b;
    background: #fffbeb;
  }
  &__checkbox {
    position: absolute;
    top: 12px;
    left: 12px;
  }
  &__main {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }
  &__student {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  &__name {
    font-size: 15px;
    font-weight: 600;
  }
  &__meta {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
  &__body {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
  &__actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    padding-top: 10px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}
.reject-template {
  width: 200px;
}
.reject-input {
  width: 240px;
}
.batch-reject-input {
  width: 240px;
}
@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  .review-cards {
    grid-template-columns: 1fr;
  }
  .filter-item {
    width: 100%;
  }
}
</style>
