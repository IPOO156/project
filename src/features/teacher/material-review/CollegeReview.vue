<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { Check, ClipboardList, TrendingUp, X } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useUserStore } from '@/app/stores/stores'
import { APPLICATION_TYPE_MAP } from '@/shared/constants/dict'
import PageContainer from '@/shared/ui/PageContainer.vue'
import PageHeader from '@/shared/ui/PageHeader.vue'
import ReviewDetailPanel from './components/ReviewDetailPanel.vue'
import ReviewList from './components/ReviewList.vue'
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

const filters = ref({ grade: '', major: '', className: '', type: '', keyword: '' })
// 申报类型选项：统一从 APPLICATION_TYPE_MAP 派生，禁止在页面内重复定义字典
const typeOptions = Object.entries(APPLICATION_TYPE_MAP).map(([value, label]) => ({
  label,
  value,
}))

const pendingList = ref([
  {
    id: 1,
    name: '张三',
    studentId: '2024060001',
    className: '计科2401班',
    type: 'competition',
    typeLabel: '学科竞赛',
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
    history: [],
  },
  {
    id: 2,
    name: '李四',
    studentId: '2024060002',
    className: '计科2401班',
    type: 'socialPractice',
    typeLabel: '社会实践',
    major: '计算机科学与技术',
    grade: '2024级',
    duplicate: true,
    submitDate: '2026-07-14',
    attachments: [{ name: '实践报告.pdf', url: '#', type: 'pdf' }],
    formData: { activityName: '暑期三下乡社会实践', location: '湖南湘西' },
    history: [],
  },
  {
    id: 3,
    name: '王五',
    studentId: '2024060003',
    className: '计科2402班',
    type: 'scholarship',
    typeLabel: '奖学金',
    major: '计算机科学与技术',
    grade: '2024级',
    duplicate: false,
    submitDate: '2026-07-13',
    attachments: [{ name: '奖学金申请表.pdf', url: '#', type: 'pdf' }],
    formData: { awardName: '国家奖学金', scholarshipLevel: 'national' },
    history: [],
  },
  {
    id: 4,
    name: '赵六',
    studentId: '2024060004',
    className: '软件2401班',
    type: 'competitionStar',
    typeLabel: '竞赛之星',
    major: '软件工程',
    grade: '2024级',
    duplicate: false,
    submitDate: '2026-07-12',
    attachments: [],
    formData: { competitionName: 'ACM 程序设计竞赛', awardLevel: 'second' },
    history: [],
  },
  {
    id: 5,
    name: '孙七',
    studentId: '2024060005',
    className: '软件2401班',
    type: 'research',
    typeLabel: '学术研究',
    major: '软件工程',
    grade: '2024级',
    duplicate: true,
    submitDate: '2026-07-11',
    attachments: [],
    formData: { projectName: '基于深度学习的图像识别研究', projectLevel: 'national' },
    history: [],
  },
  {
    id: 6,
    name: '周八',
    studentId: '2024060006',
    className: '计科2402班',
    type: 'training',
    typeLabel: '实训项目',
    major: '计算机科学与技术',
    grade: '2024级',
    duplicate: false,
    submitDate: '2026-07-10',
    attachments: [],
    formData: { projectName: 'Vue3 企业级开发实训' },
    history: [
      { reviewer: '刘老师', time: '2026-07-15 10:30', action: 'rejected', comment: '材料不完整' },
    ],
  },
])

const filteredList = computed(() =>
  pendingList.value.filter((r) => {
    if (filters.value.type && r.type !== filters.value.type) return false
    if (filters.value.className && !r.className.includes(filters.value.className)) return false
    if (
      filters.value.keyword &&
      !r.name.includes(filters.value.keyword) &&
      !r.studentId.includes(filters.value.keyword)
    ) {
      return false
    }
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
async function handleBatchReject(reason: string) {
  if (!reason.trim()) {
    ElMessage.warning('请填写驳回原因')
    return
  }
  const items = filteredList.value.filter((r) => selectedIds.value.has(r.id))
  const count = await batchReject(items, pendingList.value, reason)
  if (count > 0) {
    selectedIds.value.clear()
  }
}
function toggleSelect(id: string | number) {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id)
  else selectedIds.value.add(id)
}
function handleSelectAll(checked: boolean) {
  if (checked) filteredList.value.forEach((i) => selectedIds.value.add(i.id))
  else selectedIds.value.clear()
}
function openDetail(item: any) {
  currentIndex.value = filteredList.value.indexOf(item)
  detailVisible.value = true
}
function openArchive(item: any) {
  currentIndex.value = filteredList.value.indexOf(item)
  studentArchiveVisible.value = true
}
</script>

<template>
  <PageContainer>
    <PageHeader title="材料审核" subtitle="审核学生提交的各类申报材料，支持批量操作与快速审阅">
      <template #actions>
        <el-tag v-if="!isAdmin" type="warning" effect="plain" size="small">只读模式</el-tag>
      </template>
    </PageHeader>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card__inner">
          <div>
            <p class="stat-card__label">待审核</p>
            <p class="stat-card__value">{{ stats.total }}</p>
          </div>
          <div class="stat-card__icon stat-card__icon--blue"><ClipboardList :size="20" /></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__inner">
          <div>
            <p class="stat-card__label">今日新增</p>
            <p class="stat-card__value">{{ stats.today }}</p>
          </div>
          <div class="stat-card__icon stat-card__icon--green"><TrendingUp :size="20" /></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__inner">
          <div>
            <p class="stat-card__label">已通过</p>
            <p class="stat-card__value">{{ stats.approved }}</p>
          </div>
          <div class="stat-card__icon stat-card__icon--purple"><Check :size="20" /></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__inner">
          <div>
            <p class="stat-card__label">已驳回</p>
            <p class="stat-card__value">{{ stats.rejected }}</p>
          </div>
          <div class="stat-card__icon stat-card__icon--orange"><X :size="20" /></div>
        </div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <el-card shadow="never" class="filter-card">
      <div class="filter-row">
        <el-select
          v-model="filters.grade"
          placeholder="年级"
          clearable
          size="small"
          class="filter-item"
        >
          <el-option label="全部" value="" /><el-option label="2024级" value="2024级" />
        </el-select>
        <el-select
          v-model="filters.className"
          placeholder="班级"
          clearable
          size="small"
          class="filter-item"
        >
          <el-option label="全部" value="" /><el-option
            label="计科2401班"
            value="计科2401班"
          /><el-option label="计科2402班" value="计科2402班" /><el-option
            label="软件2401班"
            value="软件2401班"
          />
        </el-select>
        <el-select
          v-model="filters.type"
          placeholder="申报类型"
          clearable
          size="small"
          class="filter-item"
        >
          <el-option v-for="t in typeOptions" :key="t.value" :label="t.label" :value="t.value" />
        </el-select>
        <el-input
          v-model="filters.keyword"
          placeholder="姓名/学号搜索"
          clearable
          size="small"
          class="filter-item filter-item--keyword"
        />
      </div>
    </el-card>

    <!-- 待审核列表（含批量操作） -->
    <el-card shadow="never" class="list-card">
      <template #header>
        <div class="list-card__header">
          <span class="list-card__title">待审核材料</span>
          <el-tag type="info" size="small" effect="plain">{{ filteredList.length }} 条</el-tag>
        </div>
      </template>

      <ReviewList
        :items="filteredList"
        :selected-ids="selectedIds"
        :is-admin="isAdmin"
        :is-processing="isProcessing"
        @toggle="toggleSelect"
        @toggle-all="handleSelectAll"
        @batch-reject="handleBatchReject"
        @batch-approve="handleBatchApprove"
        @view-detail="openDetail"
        @view-archive="openArchive"
        @approve="handleApprove"
        @reject="handleReject"
      />
    </el-card>

    <!-- 双栏审核弹窗 -->
    <ReviewDetailPanel
      :record="currentItem"
      :visible="detailVisible"
      @close="detailVisible = false"
      @prev="goPrev"
      @next="goNext(filteredList.length)"
    >
      <template #actions>
        <el-select
          v-model="reviewComment"
          placeholder="常用驳回原因…"
          size="small"
          class="reject-template"
          @change="(val: string) => (reviewComment = val)"
        >
          <el-option v-for="t in templates" :key="t.text" :label="t.label" :value="t.text" />
        </el-select>
        <el-input
          v-model="reviewComment"
          type="textarea"
          :rows="2"
          placeholder="驳回原因（必填）…"
          class="reject-input"
        />
        <el-button
          v-if="isAdmin"
          type="danger"
          plain
          :disabled="!reviewComment.trim()"
          :loading="isProcessing"
          @click="currentItem && handleReject(currentItem)"
          >驳回</el-button
        >
        <el-button
          v-if="isAdmin"
          type="success"
          plain
          :loading="isProcessing"
          @click="currentItem && handleApprove(currentItem)"
          >通过</el-button
        >
      </template>
    </ReviewDetailPanel>

    <!-- 学生档案弹窗 -->
    <el-dialog
      v-model="studentArchiveVisible"
      title="学生档案"
      width="520px"
      :close-on-click-modal="false"
    >
      <div class="archive-dialog">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="姓名">{{ currentItem?.name }}</el-descriptions-item>
          <el-descriptions-item label="学号">{{ currentItem?.studentId }}</el-descriptions-item>
          <el-descriptions-item label="班级">{{ currentItem?.className }}</el-descriptions-item>
          <el-descriptions-item label="专业">{{ currentItem?.major }}</el-descriptions-item>
          <el-descriptions-item label="GPA">3.82</el-descriptions-item>
          <el-descriptions-item label="申报次数">6</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer
        ><el-button @click="studentArchiveVisible = false">关闭</el-button></template
      >
    </el-dialog>
  </PageContainer>
</template>

<style scoped lang="scss">
// ── 统计卡片 ──
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
}
.stat-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: $radius-lg;
  padding: $spacing-lg;
  transition: box-shadow 0.2s;
  &:hover {
    box-shadow: $shadow-sm;
  }
  &__inner {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  &__label {
    font-size: $font-size-sm;
    color: var(--el-text-color-secondary);
    margin-bottom: $spacing-xs;
  }
  &__value {
    font-size: $font-size-2xl;
    font-weight: 700;
    color: $color-text-primary;
    line-height: 1.2;
  }
  &__icon {
    width: 40px;
    height: 40px;
    border-radius: $radius-xl;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
    &--blue {
      background: linear-gradient(145deg, #e8f0fe 0%, #d7e4f6 100%);
      color: $color-primary-lighter;
    }
    &--green {
      background: linear-gradient(145deg, #e6f7ee 0%, #d2efe0 100%);
      color: $color-success;
    }
    &--purple {
      background: linear-gradient(145deg, #f0e6ff 0%, #e4d4fb 100%);
      color: #8b5cf6;
    }
    &--orange {
      background: linear-gradient(145deg, #fef3e2 0%, #fbe8c9 100%);
      color: $color-warning;
    }
  }
}

// ── 筛选栏 ──
.filter-card {
  margin-bottom: $spacing-md;
}
.filter-row {
  display: flex;
  gap: $spacing-sm;
  flex-wrap: wrap;
}
.filter-item {
  width: 140px;
  &--keyword {
    width: 200px;
    flex: 1;
  }
}

// ── 列表卡片 ──
.list-card {
  margin-bottom: $spacing-lg;
}
.list-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.list-card__title {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $color-text-primary;
}

.reject-template {
  width: 200px;
}
.reject-input {
  width: 240px;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .filter-item {
    width: 100%;
  }
}
</style>
