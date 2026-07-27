<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { Check, ClipboardList, Eye, FileText, TrendingUp, X } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useUserStore } from '@/app/stores/stores'
import PageContainer from '@/shared/ui/PageContainer.vue'
import PageHeader from '@/shared/ui/PageHeader.vue'
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

function getTypeColor(type: string) {
  if (type.includes('竞赛') || type.includes('之星')) return '#e6a23c'
  if (type.includes('社会')) return '#10b981'
  if (type.includes('科研') || type.includes('论文')) return '#8b5cf6'
  if (type.includes('奖学金')) return '#ef4444'
  if (type.includes('实训')) return '#1e3a5f'
  return '#64748b'
}

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
    ElMessage.warning('请填写驳回原因')
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
  if (checked) filteredList.value.forEach((i) => selectedIds.value.add(i.id))
  else selectedIds.value.clear()
}
function openDetail(item: any) {
  currentIndex.value = filteredList.value.indexOf(item)
  detailVisible.value = true
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

    <!-- 批量操作栏 -->
    <div class="batch-bar">
      <div class="batch-bar__left">
        <el-checkbox
          :indeterminate="selectedIds.size > 0 && selectedIds.size < filteredList.length"
          :checked="selectedIds.size === filteredList.length"
          @change="handleSelectAll"
          >全选</el-checkbox
        >
        <span v-if="selectedIds.size > 0" class="batch-bar__count"
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

    <!-- 待审核列表 -->
    <el-card shadow="never" class="list-card">
      <template #header>
        <div class="list-card__header">
          <span class="list-card__title">待审核材料</span>
          <el-tag type="info" size="small" effect="plain">{{ filteredList.length }} 条</el-tag>
        </div>
      </template>

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
            <div class="review-card__top">
              <div class="review-card__student">
                <el-avatar :size="36" class="review-card__avatar">{{
                  item.name.charAt(0)
                }}</el-avatar>
                <div>
                  <div class="review-card__name">{{ item.name }}</div>
                  <div class="review-card__meta">{{ item.className }} · {{ item.studentId }}</div>
                </div>
              </div>
              <el-tag
                :color="getTypeColor(item.type)"
                effect="dark"
                size="small"
                style="color: #fff; border: 0"
                >{{ item.type }}</el-tag
              >
            </div>
            <div class="review-card__info">
              <span>提交：{{ item.submitDate }}</span>
              <el-tag
                v-if="item.duplicate"
                type="warning"
                size="small"
                effect="plain"
                class="dup-tag"
                >有同类重复</el-tag
              >
            </div>
            <ReviewHistory :history="reviewHistoryMap[item.id] || []" />
            <div class="review-card__actions">
              <el-button type="primary" size="small" plain :icon="Eye" @click="openDetail(item)"
                >审核</el-button
              >
              <el-button size="small" plain :icon="FileText" @click="studentArchiveVisible = true"
                >档案</el-button
              >
              <el-button
                v-if="isAdmin"
                type="success"
                size="small"
                plain
                :icon="Check"
                :loading="isProcessing"
                @click="handleApprove(item)"
                >通过</el-button
              >
              <el-button
                v-if="isAdmin"
                type="danger"
                size="small"
                plain
                :icon="X"
                :loading="isProcessing"
                @click="handleReject(item)"
                >驳回</el-button
              >
            </div>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无待审核材料" :image-size="80" />
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
    border-radius: $radius-lg;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    &--blue {
      background: #e8f0fe;
      color: $color-primary-lighter;
    }
    &--green {
      background: #e6f7ee;
      color: $color-success;
    }
    &--purple {
      background: #f0e6ff;
      color: #8b5cf6;
    }
    &--orange {
      background: #fef3e2;
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

// ── 批量操作 ──
.batch-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-sm $spacing-lg;
  background: #f0f4ff;
  border: 1px solid #d0d9f5;
  border-radius: $radius-lg;
  margin-bottom: $spacing-md;
  &__left {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }
  &__right {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }
  &__count {
    font-size: $font-size-sm;
    color: $color-primary-lighter;
    font-weight: 600;
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

// ── 审核卡片 ──
.review-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: $spacing-md;
}
.review-card {
  position: relative;
  border: 1px solid var(--el-border-color-light);
  border-radius: $radius-lg;
  padding: $spacing-lg;
  background: var(--el-bg-color);
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  &:hover {
    border-color: $color-accent;
    box-shadow: $shadow-sm;
  }
  &.is-duplicate {
    border-color: $color-warning;
    background: #fffbeb;
  }
  &__checkbox {
    position: absolute;
    top: $spacing-md;
    left: $spacing-md;
  }
  &__main {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }
  &__top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: $spacing-md;
  }
  &__student {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }
  &__avatar {
    background: $color-primary-lightest;
    color: $color-primary;
    font-weight: 600;
  }
  &__name {
    font-size: $font-size-base;
    font-weight: 600;
    color: $color-text-primary;
  }
  &__meta {
    font-size: $font-size-xs;
    color: var(--el-text-color-secondary);
    margin-top: 1px;
  }
  &__info {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    font-size: $font-size-sm;
    color: var(--el-text-color-secondary);
  }
  &__actions {
    display: flex;
    gap: $spacing-sm;
    flex-wrap: wrap;
    padding-top: $spacing-sm;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}
.dup-tag {
  font-size: $font-size-xs;
}

.reject-template {
  width: 200px;
}
.reject-input {
  width: 240px;
}
.batch-reject-input {
  width: 220px;
}

@media (max-width: 768px) {
  .stats-grid {
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
