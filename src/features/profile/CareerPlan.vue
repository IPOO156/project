<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import { useArchiveStore, useCareerPlanStore } from '@/app/stores/stores'
import { withdrawActivity } from '@/shared/api/activities'
import { deleteCareerPlan } from '@/shared/api/career-plan'
import { useSemesters } from '@/shared/composables/useSemesters'
import CareerPlanAICard from './components/CareerPlanAICard.vue'
import CareerPlanFormCard from './components/CareerPlanFormCard.vue'
import CareerPlanProgressCard from './components/CareerPlanProgressCard.vue'
import CareerPlanRecordsCard from './components/CareerPlanRecordsCard.vue'
import GrowthRecords from './components/GrowthRecords.vue'

const archiveStore = useArchiveStore()
const careerPlanStore = useCareerPlanStore()

const planRecords = computed(() => careerPlanStore.plans)

/** 最新一条规划（后端建议以此记录的 planId 为 sourceId） */
const latestPlan = computed(
  () =>
    [...planRecords.value].sort((a, b) =>
      (b.submitDate || '').localeCompare(a.submitDate || ''),
    )[0],
)

/** 已填写的学期（去重，用于学期切换查看与进度统计） */
const availableSemesters = computed(() => [
  ...new Set(planRecords.value.map((p) => p.semester).filter((s) => s)),
])

/** 记录表空态文案：区分「加载失败」与「确实没有记录」，避免用户误以为自己的记录丢了 */
const planEmptyText = computed(() =>
  careerPlanStore.loadError ? '规划记录加载失败，请稍后重试' : '暂无规划记录',
)

// 「已完成进度」统一使用后端 progressRate（由行动/里程碑完成度重算），
// 不再用「已填学期数 ÷ 总学期数」另造一套口径；后者仅作为学期覆盖度展示。
const filledSemesterCount = computed(() => availableSemesters.value.length)
// 学期下拉与「总学期数」共用同一数据源（useSemesters，仅后端真实学期），
// 避免下拉可选而分母不含、或反之的口径不一致。
const { semesterOptions, load: loadSemesters } = useSemesters()
const totalSemesterCount = computed(() => semesterOptions.value.length)
const averageProgress = computed(() => {
  const rates = planRecords.value
    .map((p) => p.progressRate)
    .filter((rate): rate is number => typeof rate === 'number')
  if (rates.length === 0) return 0
  return Math.round(rates.reduce((sum, rate) => sum + rate, 0) / rates.length)
})

const activeTab = ref<'plan' | 'growth'>('plan')

/** 删除整份规划：调用后端 DELETE /profile/career-plans/{planId}，成功后强制刷新列表 */
async function handleRemove(id: string) {
  try {
    await ElMessageBox.confirm('确定删除该职业规划吗？删除后不可恢复。', '删除确认', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await deleteCareerPlan(Number(id))
    await careerPlanStore.fetchPlans(true)
    ElMessage.success('已删除')
  } catch {
    /* 失败提示由请求拦截器统一给出，列表保持不变 */
  }
}

/** 撤回待审批规划：走统一活动接口，后端置 status=4（已撤销）并关闭审核任务 */
async function handleWithdraw(id: string) {
  try {
    await ElMessageBox.confirm('撤回后该规划将不再处于待审批状态，确定撤回吗？', '撤回确认', {
      confirmButtonText: '确定撤回',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await withdrawActivity(Number(id), 'career_plan')
    await careerPlanStore.fetchPlans(true)
    ElMessage.success('已撤回')
  } catch {
    /* 失败提示由请求拦截器统一给出，列表保持不变 */
  }
}

onMounted(() => {
  careerPlanStore.fetchPlans()
  loadSemesters()
  if (archiveStore.timelineEvents.length === 0) archiveStore.fetchTimeline()
})
</script>

<template>
  <div class="growth-dev page-enter">
    <div class="gd-header">
      <h1 class="gd-header__title">成长发展</h1>
      <p class="gd-header__subtitle">职业规划与成长记录管理</p>
    </div>

    <el-tabs v-model="activeTab" class="gd-tabs">
      <el-tab-pane label="职业规划" name="plan">
        <div class="gd-two-col">
          <!-- 左侧：表单 -->
          <CareerPlanFormCard :semester-options="semesterOptions" />

          <!-- 右侧：AI 分析 -->
          <CareerPlanAICard :plan-id="latestPlan?.id ?? null" />
        </div>

        <!-- 计划完成进度（后端 progressRate 口径） -->
        <CareerPlanProgressCard
          :filled-semester-count="filledSemesterCount"
          :total-semester-count="totalSemesterCount"
          :average-progress="averageProgress"
          :plan-count="planRecords.length"
        />

        <!-- 规划记录 -->
        <CareerPlanRecordsCard
          :records="planRecords"
          :semesters="availableSemesters"
          :loading="careerPlanStore.loading"
          :empty-text="planEmptyText"
          @remove="handleRemove"
          @withdraw="handleWithdraw"
          @refresh="careerPlanStore.fetchPlans(true)"
        />
      </el-tab-pane>

      <!-- Tab 2: 成长记录 -->
      <el-tab-pane label="成长记录" name="growth">
        <el-card class="gd-card">
          <template #header><span class="card-title">成长时间轴</span></template>
          <GrowthRecords :events="archiveStore.timelineEvents" />
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="scss">
.page-enter {
  @include page-enter;
}

.growth-dev {
  display: flex;
  flex-direction: column;
  gap: 20px;
  user-select: none;
}

.gd-header {
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.gd-header__title {
  font-size: 26px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 6px;
}

.gd-header__subtitle {
  font-size: 16px;
  color: #64748b;
  margin: 0;
}

.gd-tabs {
  margin-top: 0;

  :deep(.el-tabs__item) {
    font-size: 16px;
    height: 44px;
    line-height: 44px;
  }

  :deep(.el-tabs__nav-wrap::after) {
    height: 1px;
  }
}

.gd-two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

// 成长记录 Tab 内的通用卡片（其余卡片样式随各自区块组件内聚）
.gd-card {
  :deep(.el-card__body) {
    padding: 16px 20px;
  }
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

@media (max-width: 900px) {
  .gd-two-col {
    grid-template-columns: 1fr;
  }
}

// ─── 夜间模式适配 ───
// AI 诊断卡白天为橙白/绿白大面积浅色渐变，夜间改为低透明度叠色渐变，
// chips 同步降亮度；硬编码深色文字亮化保证可读
html.dark {
  .card-title {
    color: #f1f5f9;
  }
}
</style>
