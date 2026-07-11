<script setup lang="ts">
import type { TagProps } from 'element-plus'
import { ElMessage } from 'element-plus'
import { AlertTriangle, Download, Eye, Plus, Sparkles } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref } from 'vue'
import { useArchiveStore, useCareerPlanStore } from '@/app/stores/stores'
import AIChatDrawer from '@/features/ai-chat/components/AIChatDrawer.vue'
import { useDict } from '@/shared/composables/composables'
import { useFormDraft } from '@/shared/composables/useFormDraft'
import { APPLICATION_STATUS, SEMESTER_OPTIONS } from '@/shared/constants/dict'

// ── 响应式数据 ──
const archiveStore = useArchiveStore()
const careerPlanStore = useCareerPlanStore()

const planForm = reactive({
  semester: '',
  title: '',
  content: '',
})
const { clearDraft } = useFormDraft('career-plan', planForm)

const planFiles = ref<{ name: string; url: string }[]>([])

// 规划记录来自 store（数据由 API 层填充）
const planRecords = computed(() => careerPlanStore.plans)

// 短板识别与改进建议：由 AI 助手生成 → 写入 careerPlanStore.aiAnalysis → 此处响应式读取
// 数据链路：useAIChat.simulateAIReply 命中职业规划关键词 → analyzeCareer 读真实档案数据
//          → careerPlanStore.setAIAnalysis → 本 computed 更新 → 模板渲染
const aiAnalysis = computed(() => careerPlanStore.aiAnalysis)

const loading = ref(false)
const dialogVisible = ref(false)
const aiDrawerVisible = ref(false)
const aiDrawerKey = ref(0)
const aiInitialQuestion = '请分析我的职业规划短板并给出改进建议'

/**
 * 打开 AI 抽屉并强制重新挂载：
 * - 自增 aiDrawerKey → AIChatDrawer 销毁旧实例、创建新实例（messages 重置为欢迎语）
 * - 配合 AIChatDrawer 的 watch(visible, { immediate: true })，挂载即 visible=true 时自动发送 initialQuestion
 * - 每次「AI 深度分析 / 重新分析」都会触发一次全新的 AI 回复 → 写入 store → 页面短板区域更新
 */
function openAIDrawer() {
  aiDrawerKey.value++
  aiDrawerVisible.value = true
}

// ── Computed ──
const { getColor, getLabel } = useDict(APPLICATION_STATUS)

const getStatusType = computed(() => (status: 'draft' | 'submitted'): TagProps['type'] => {
  return (getColor(status) as TagProps['type']) ?? 'info'
})

// ── 方法函数 ──
async function handleSubmit() {
  if (!planForm.semester || !planForm.title) {
    ElMessage.warning('请填写完整信息')
    return
  }
  loading.value = true
  try {
    await careerPlanStore.submitPlan({
      semester: planForm.semester,
      title: planForm.title,
    })
    clearDraft()
    dialogVisible.value = false
    planForm.semester = ''
    planForm.title = ''
    planForm.content = ''
    planFiles.value = []
  } catch {
    ElMessage.error('提交失败，请重试')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  careerPlanStore.fetchPlans()
  if (archiveStore.dimensions.length === 0) archiveStore.fetchArchive()
})
</script>

<template>
  <div class="career-plan">
    <el-card>
      <template #header>
        <div class="career-plan__header">
          <span class="card-title">职业规划与材料填写</span>
          <el-button type="primary" :icon="Plus" @click="dialogVisible = true">
            新增规划
          </el-button>
        </div>
      </template>

      <!-- 规划列表 -->
      <el-table :data="planRecords" stripe class="career-plan__table">
        <el-table-column prop="semester" label="学期" width="130" />
        <el-table-column prop="title" label="规划名称" min-width="160" />
        <el-table-column prop="submitDate" label="提交时间" width="110" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default>
            <div class="action-btns">
              <el-button text type="primary" :icon="Eye" size="small">查看</el-button>
              <el-button text type="primary" :icon="Download" size="small">下载</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 短板识别与改进建议（数据来源：AI 助手生成 → careerPlanStore.aiAnalysis） -->
    <el-card class="career-plan__section">
      <template #header>
        <div class="career-plan__header">
          <div class="section-title">
            <AlertTriangle :size="18" />
            <span>短板识别与改进建议</span>
          </div>
          <div class="section-actions">
            <el-button type="primary" size="small" plain :icon="Sparkles" @click="openAIDrawer">
              {{ aiAnalysis ? '重新分析' : 'AI 深度分析' }}
            </el-button>
            <el-tag size="small" type="warning">AI 生成</el-tag>
          </div>
        </div>
      </template>

      <!-- 有分析结果：渲染 AI 生成的短板列表 -->
      <template v-if="aiAnalysis">
        <p class="career-plan__summary">{{ aiAnalysis.summary }}</p>
        <p class="career-plan__generated">生成时间：{{ aiAnalysis.generatedAt }}</p>
        <div v-for="item in aiAnalysis.weaknesses" :key="item.dimension" class="weakness-item">
          <div class="weakness-item__header">
            <span class="weakness-item__dim">{{ item.dimension }}</span>
            <div class="weakness-item__meta">
              <span class="weakness-item__score"
                >当前 {{ item.score }} / 目标 {{ item.target }}</span
              >
              <el-tag size="small" type="danger">差距 {{ item.gap }}</el-tag>
            </div>
          </div>
          <el-progress
            :percentage="item.score"
            :stroke-width="8"
            class="progress-fixed"
            status="exception"
            :format="() => `${item.score}分`"
          />
          <el-alert
            :title="`短板：${item.weakness}`"
            type="warning"
            :closable="false"
            show-icon
            class="mb-8"
          />
          <el-alert
            :title="`建议：${item.suggestion}`"
            type="success"
            :closable="false"
            show-icon
          />
        </div>
      </template>

      <!-- 无分析结果：引导空状态 -->
      <el-empty
        v-else
        description="尚未生成 AI 分析。点击右上角「AI 深度分析」，AI 将根据你的档案数据生成个性化短板识别与改进建议。"
        :image-size="120"
      />
    </el-card>

    <!-- 新增规划弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      title="填写职业规划"
      width="640px"
      :close-on-click-modal="false"
    >
      <el-form :model="planForm" label-width="100px">
        <el-form-item label="学期" required>
          <el-select v-model="planForm.semester" placeholder="请选择学期" class="form-select">
            <el-option
              v-for="s in SEMESTER_OPTIONS"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="规划标题" required>
          <el-input v-model="planForm.title" placeholder="请输入规划标题" />
        </el-form-item>
        <el-form-item label="规划内容">
          <el-input
            v-model="planForm.content"
            type="textarea"
            :rows="6"
            placeholder="请描述你的职业规划、学习目标..."
          />
        </el-form-item>
        <el-form-item label="规划文件">
          <el-upload v-model:file-list="planFiles" action="#" :auto-upload="false" list-type="text">
            <el-button type="primary" plain>选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 pdf、doc、docx 格式</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">提交</el-button>
      </template>
    </el-dialog>

    <AIChatDrawer
      :key="aiDrawerKey"
      :visible="aiDrawerVisible"
      :initial-question="aiInitialQuestion"
      @close="aiDrawerVisible = false"
    />
  </div>
</template>

<style scoped lang="scss">
.career-plan {
  display: flex;
  flex-direction: column;
  gap: 16px;
  user-select: none;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__section {
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
    }
  }
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.form-select {
  width: 200px;
}

.action-btns {
  display: flex;
  align-items: center;
  gap: 4px;
}

.career-plan__table {
  :deep(td.el-table__cell:first-child) {
    white-space: nowrap;
  }
}

.weakness-item {
  margin-bottom: 20px;
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;

  &:last-child {
    margin-bottom: 0;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    gap: 12px;
  }

  &__dim {
    font-weight: 600;
    font-size: 15px;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  &__score {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  .progress-fixed {
    margin-bottom: 12px;
  }
}

.career-plan__summary {
  margin: 0 0 4px;
  padding: 12px 16px;
  background: color-mix(in srgb, var(--mc-primary) 4%, transparent);
  border-left: 3px solid var(--mc-primary);
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
}

.career-plan__generated {
  margin: 0 0 16px;
  padding: 0 16px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
</style>
