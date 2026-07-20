<script setup lang="ts">
import type { TagProps } from 'element-plus'
import { ElMessage } from 'element-plus'
import { AlertTriangle, Sparkles } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref } from 'vue'
import { useArchiveStore, useCareerPlanStore } from '@/app/stores/stores'
import AIChatDrawer from '@/features/ai-chat/components/AIChatDrawer.vue'
import { useDict } from '@/shared/composables/composables'
import { useFormDraft } from '@/shared/composables/useFormDraft'
import { APPLICATION_STATUS, SEMESTER_OPTIONS } from '@/shared/constants/dict'
import GrowthRecords from './components/GrowthRecords.vue'

const archiveStore = useArchiveStore()
const careerPlanStore = useCareerPlanStore()

const planForm = reactive({ semester: '', title: '', content: '' })
const { clearDraft } = useFormDraft('career-plan', planForm)
const planFiles = ref<{ name: string; url: string }[]>([])
const planRecords = computed(() => careerPlanStore.plans)
const aiAnalysis = computed(() => careerPlanStore.aiAnalysis)
const loading = ref(false)
const dialogVisible = ref(false)
const aiDrawerVisible = ref(false)
const aiDrawerKey = ref(0)
const aiInitialQuestion = '请分析我的职业规划短板并给出改进建议'

const activeTab = ref<'plan' | 'growth'>('plan')

function openAIDrawer() {
  aiDrawerKey.value++
  aiDrawerVisible.value = true
}

const { getColor, getLabel } = useDict(APPLICATION_STATUS)
const getStatusType = computed(
  () =>
    (status: string): TagProps['type'] =>
      (getColor(status) as TagProps['type']) ?? 'info',
)

async function handleSubmit() {
  if (!planForm.semester || !planForm.title) {
    ElMessage.warning('请填写学期和标题')
    return
  }
  loading.value = true
  try {
    await careerPlanStore.submitPlan({ semester: planForm.semester, title: planForm.title })
    clearDraft()
    planForm.semester = ''
    planForm.title = ''
    planForm.content = ''
    ElMessage.success('规划已提交')
  } catch {
    ElMessage.error('提交失败')
  } finally {
    loading.value = false
  }
}

function handleRemove(id: string) {
  careerPlanStore.plans = careerPlanStore.plans.filter((p: any) => p.id !== id)
  ElMessage.success('已删除')
}

onMounted(() => {
  careerPlanStore.fetchPlans()
  if (archiveStore.timelineEvents.length === 0) archiveStore.fetchArchive()
})
</script>

<template>
  <div class="growth-dev">
    <div class="gd-header">
      <h1 class="gd-header__title">成长发展</h1>
      <p class="gd-header__subtitle">职业规划与成长记录管理</p>
    </div>

    <el-tabs v-model="activeTab" class="gd-tabs">
      <el-tab-pane label="职业规划" name="plan">
        <div class="gd-two-col">
          <!-- 左侧：表单 -->
          <el-card class="gd-card">
            <template #header><span class="card-title">填写规划</span></template>
            <el-form :model="planForm" label-width="70px" size="default">
              <el-form-item label="学期" required>
                <el-select v-model="planForm.semester" placeholder="请选择学期" class="form-w">
                  <el-option
                    v-for="s in SEMESTER_OPTIONS"
                    :key="s.value"
                    :label="s.label"
                    :value="s.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="标题" required>
                <el-input
                  v-model="planForm.title"
                  placeholder="如：大二下学期学习规划"
                  class="form-w"
                />
              </el-form-item>
              <el-form-item label="内容">
                <el-input
                  v-model="planForm.content"
                  type="textarea"
                  :rows="5"
                  placeholder="请描述你的规划目标与具体措施..."
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="loading" @click="handleSubmit"
                  >提交规划</el-button
                >
              </el-form-item>
            </el-form>
          </el-card>

          <!-- 右侧：AI 分析 -->
          <el-card class="gd-card gd-card--ai">
            <template #header>
              <div class="card-space">
                <span class="card-title">AI 深度分析</span>
                <el-button size="small" type="primary" :icon="Sparkles" @click="openAIDrawer"
                  >开始分析</el-button
                >
              </div>
            </template>
            <div v-if="aiAnalysis" class="ai-result">
              <div class="ai-result__head">
                <Sparkles :size="16" class="ai-result__icon" />
                <h4 class="ai-result__title">个人化短板分析</h4>
                <span class="ai-result__time">{{ aiAnalysis.generatedAt }}</span>
              </div>
              <p v-if="aiAnalysis.summary" class="ai-result__summary">
                {{ aiAnalysis.summary }}
              </p>
              <div v-if="aiAnalysis.weaknesses?.length" class="ai-result__list">
                <div
                  v-for="(item, i) in aiAnalysis.weaknesses"
                  :key="`${item.dimension}-${i}`"
                  class="ai-item"
                >
                  <div class="ai-item__head">
                    <AlertTriangle :size="14" />
                    <span class="ai-item__dim">{{ item.dimension }}</span>
                    <span class="ai-item__score"
                      >{{ item.score }} / {{ item.target }}（差 {{ item.gap }}）</span
                    >
                  </div>
                  <p class="ai-item__desc">{{ item.weakness }}</p>
                  <p class="ai-item__suggest"><strong>建议：</strong>{{ item.suggestion }}</p>
                </div>
              </div>
            </div>
            <div v-else class="ai-empty">
              <Sparkles :size="28" class="ai-empty__icon" />
              <p class="ai-empty__text">点击「开始分析」获取个性化改进建议</p>
            </div>
          </el-card>
        </div>

        <!-- 规划记录 -->
        <el-card class="gd-card gd-card--table">
          <template #header><span class="card-title">规划记录</span></template>
          <el-table
            v-loading="careerPlanStore.loading"
            :data="planRecords"
            stripe
            style="width: 100%"
            size="small"
          >
            <el-table-column prop="semester" label="学期" width="160" />
            <el-table-column prop="title" label="标题" min-width="200" />
            <el-table-column prop="submitDate" label="提交时间" width="120" />
            <el-table-column label="状态" width="90">
              <template #default="{ row }"
                ><el-tag :type="getStatusType(row.status)" size="small">{{
                  getLabel(row.status)
                }}</el-tag></template
              >
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template #default="{ row }"
                ><el-button type="danger" link size="small" @click="handleRemove(row.id)"
                  >删除</el-button
                ></template
              >
            </el-table-column>
          </el-table>
        </el-card>

        <AIChatDrawer
          :key="aiDrawerKey"
          :visible="aiDrawerVisible"
          :initial-question="aiInitialQuestion"
          @close="aiDrawerVisible = false"
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

.gd-card {
  :deep(.el-card__body) {
    padding: 16px 20px;
  }

  &--ai {
    background: #f8fafc;
    border-color: #e2e8f0;
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

.form-w {
  width: 100%;
  max-width: 400px;
}

.ai-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 0;
  color: #94a3b8;
  font-size: 14px;

  &__icon {
    color: #d4a574;
    opacity: 0.5;
  }
}

.ai-result {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ai-result__head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-result__icon {
  color: var(--el-color-primary);
}

.ai-result__title {
  flex: 1;
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.ai-result__time {
  font-size: 12px;
  color: #94a3b8;
}

.ai-result__summary {
  margin: 0;
  padding: 10px 14px;
  background: #f1f5f9;
  border-radius: 6px;
  font-size: 14px;
  color: #475569;
  line-height: 1.6;
}

.ai-result__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ai-item {
  padding: 12px 14px;
  border-radius: 8px;
  background: linear-gradient(180deg, #fff7ed 0%, #ffffff 60%);
  border: 1px solid #fed7aa;
  border-left: 3px solid #f97316;

  &__head {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    color: #c2410c;
  }

  &__dim {
    font-size: 15px;
    font-weight: 600;
  }

  &__score {
    margin-left: auto;
    font-size: 12px;
    color: #94a3b8;
    font-weight: 500;
  }

  &__desc {
    margin: 0 0 6px;
    font-size: 14px;
    color: #475569;
    line-height: 1.6;
  }

  &__suggest {
    margin: 0;
    font-size: 14px;
    color: #1e293b;
    line-height: 1.6;
  }
}

@media (max-width: 900px) {
  .gd-two-col {
    grid-template-columns: 1fr;
  }
}
</style>
