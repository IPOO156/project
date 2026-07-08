<script setup lang="ts">
import { ref } from 'vue'
import { APPLICATION_TYPE_MAP } from '@/shared/constants/dict'

interface PendingItem {
  id: string
  type: string
  applicant: string
  title: string
  submitDate: string
  content: string
}

// ── Mock 数据（接口联调后替换） ──
const list = ref<PendingItem[]>([
  {
    id: '1',
    type: 'competition',
    applicant: '李四',
    title: '全国大学生英语竞赛',
    submitDate: '2026-06-28',
    content: '申请登记全国大学生英语竞赛参赛信息',
  },
  {
    id: '2',
    type: 'innovation',
    applicant: '王五',
    title: '智创科技工作室',
    submitDate: '2026-06-27',
    content: '申请登记创新创业项目信息',
  },
  {
    id: '3',
    type: 'scholarship',
    applicant: '赵六',
    title: '校级一等奖学金',
    submitDate: '2026-06-25',
    content: '申请校级一等奖学金认定',
  },
])

const detailVisible = ref(false)
const currentItem = ref<PendingItem | null>(null)

function viewDetail(item: PendingItem) {
  currentItem.value = item
  detailVisible.value = true
}
</script>

<template>
  <div class="approval-page">
    <el-card>
      <template #header>
        <span class="card-title">待审批信息</span>
      </template>

      <el-empty v-if="list.length === 0" description="暂无待审批事项" />

      <div v-for="item in list" :key="item.id" class="approval-card">
        <div class="approval-card__left">
          <div class="approval-card__type">
            <el-tag size="small" effect="plain">
              {{ APPLICATION_TYPE_MAP[item.type] || item.type }}
            </el-tag>
          </div>
          <div class="approval-card__body">
            <p class="approval-card__title">{{ item.title }}</p>
            <div class="approval-card__meta">
              <span>申请人：{{ item.applicant }}</span>
              <span>提交时间：{{ item.submitDate }}</span>
            </div>
          </div>
        </div>
        <div class="approval-card__actions">
          <el-button text type="primary" @click="viewDetail(item)">查看详情</el-button>
        </div>
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="申报详情" width="560px">
      <template v-if="currentItem">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="申报类型">{{
            APPLICATION_TYPE_MAP[currentItem.type]
          }}</el-descriptions-item>
          <el-descriptions-item label="申请人">{{ currentItem.applicant }}</el-descriptions-item>
          <el-descriptions-item label="申报标题">{{ currentItem.title }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ currentItem.submitDate }}</el-descriptions-item>
          <el-descriptions-item label="申报内容">{{ currentItem.content }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.approval-page {
  user-select: none;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.approval-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  margin-bottom: 12px;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  &__left {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }

  &__type {
    flex-shrink: 0;
  }

  &__title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 4px;
  }

  &__meta {
    display: flex;
    gap: 16px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  &__actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
    margin-left: 16px;
  }
}
</style>
