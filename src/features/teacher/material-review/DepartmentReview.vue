<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { Check, ClipboardList, TrendingUp, X } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useUserStore } from '@/app/stores/stores'
import ReviewDetailPanel from './components/ReviewDetailPanel.vue'
// import ReviewHistory from './components/ReviewHistory.vue'
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

const _u_filters = ref({ grade: '', major: '', className: '', type: '', keyword: '' })
const pendingList = ref([
  {
    id: 1,
    name: '刘一',
    studentId: '2024070001',
    className: '计科2402班',
    type: '学科竞赛',
    submitDate: '2026-07-14',
    major: '计算机科学与技术',
    grade: '2024级',
    duplicate: false,
    attachments: [{ name: '竞赛证书.pdf', url: '#', type: 'pdf' }],
    formData: { competitionName: '蓝桥杯大赛', awardLevel: 'third' },
  },
  {
    id: 2,
    name: '陈二',
    studentId: '2024070002',
    className: '计科2402班',
    type: '实训项目',
    submitDate: '2026-07-13',
    major: '计算机科学与技术',
    grade: '2024级',
    duplicate: false,
    attachments: [{ name: '实训报告.pdf', url: '#', type: 'pdf' }],
    formData: { projectName: '云计算架构实训' },
  },
  {
    id: 3,
    name: '黄三',
    studentId: '2024070003',
    className: '软件2402班',
    type: '社会实践',
    submitDate: '2026-07-12',
    major: '软件工程',
    grade: '2024级',
    duplicate: true,
    attachments: [{ name: '实践总结.docx', url: '#', type: 'docx' }],
    formData: { activityName: '社区志愿服务' },
  },
])
const filteredList = computed(() => pendingList.value)
const currentItem = computed(() => filteredList.value[currentIndex.value] || null)
const detailVisible = ref(false)
const selectedIds = ref<Set<string | number>>(new Set())
const _u_studentArchiveVisible = ref(false)
const stats = computed(() => ({
  total: pendingList.value.length,
  today: 1,
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
    ElMessage.warning('请填写驳回原因')
    return
  }
  const items = filteredList.value.filter((r) => selectedIds.value.has(r.id))
  const n = await batchReject(items, pendingList.value, batchRejectReason.value)
  if (n > 0) {
    selectedIds.value.clear()
    batchRejectReason.value = ''
  }
}
function _u_toggleSelect(id: string | number) {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id)
  else selectedIds.value.add(id)
}
function handleSelectAll(checked: any) {
  if (checked) filteredList.value.forEach((i) => selectedIds.value.add(i.id))
  else selectedIds.value.clear()
}
</script>

<template>
  <div class="dept-review">
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
          placeholder="驳回原因…"
          size="small"
          class="batch-reject-input"
        /><el-button
          type="danger"
          size="small"
          :disabled="selectedIds.size === 0 || !batchRejectReason.trim()"
          @click="handleBatchReject"
          >批量驳回</el-button
        ><el-button
          type="success"
          size="small"
          :disabled="selectedIds.size === 0"
          @click="handleBatchApprove"
          >批量通过</el-button
        >
      </div>
    </div>
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
          @change="(val) => (reviewComment = val)"
          ><el-option v-for="t in templates" :key="t.text" :label="t.label" :value="t.text"
        /></el-select>
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
          :disabled="!reviewComment.trim()"
          :loading="isProcessing"
          @click="currentItem && handleReject(currentItem)"
          >驳回</el-button
        >
        <el-button
          v-if="isAdmin"
          type="success"
          :loading="isProcessing"
          @click="currentItem && handleApprove(currentItem)"
          >通过</el-button
        >
      </template>
    </ReviewDetailPanel>
  </div>
</template>

<style scoped lang="scss">
.dept-review {
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
  }
}
.batch-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
.reject-template {
  width: 200px;
}
.reject-input {
  width: 240px;
}
.batch-reject-input {
  width: 240px;
}
</style>
