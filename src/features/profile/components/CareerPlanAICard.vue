<script setup lang="ts">
/**
 * 职业规划「AI 深度分析」卡片（含 AI 对话抽屉）。
 * - 后端 AI 辅助建议：GET /ai/suggestions，sourceType=career_plan，按最新一条规划拉取
 * - 本地短板分析：来自 useCareerPlanStore.aiAnalysis（AI 助手回流）
 */
import type { AISuggestion } from '@/features/ai-chat/ai-chat.types'
import { AlertTriangle, Sparkles } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useCareerPlanStore } from '@/app/stores/stores'
import AIChatDrawer from '@/features/ai-chat/components/AIChatDrawer.vue'
import { getAISuggestions } from '@/shared/api/ai-chat'

const props = defineProps<{
  /** 最新一条规划的 id（后端建议以它为 sourceId）；无记录时为 null */
  planId: string | null
}>()

const careerPlanStore = useCareerPlanStore()
const aiAnalysis = computed(() => careerPlanStore.aiAnalysis)

const backendSuggestions = ref<AISuggestion[]>([])
const suggestionsLoading = ref(false)
/** 后端建议展示形状：模板只读加工后字段，避免复杂表达式 */
const displaySuggestions = computed(() =>
  backendSuggestions.value.map((s) => ({
    key: s.suggestionId,
    content: s.content,
    warning: s.aiWarning ?? '',
    status: s.teacherActionLabel ?? '',
    sources: s.sourceArchives?.map((a) => a.title).join('、') ?? '',
  })),
)
const emptyText = computed(() =>
  suggestionsLoading.value ? '正在加载 AI 建议…' : '点击「开始分析」获取个性化改进建议',
)

/** 拉取最新规划的后端 AI 建议；后端不可用时清空，回退现有本地分析 */
async function loadAISuggestions() {
  if (!props.planId) return
  suggestionsLoading.value = true
  try {
    const res = await getAISuggestions({
      sourceType: 'career_plan',
      sourceId: Number(props.planId),
    })
    backendSuggestions.value = res.list ?? []
  } catch {
    backendSuggestions.value = []
  } finally {
    suggestionsLoading.value = false
  }
}

/** 最新规划变化（首次加载 / 新提交）时自动刷新后端建议 */
watch(
  () => props.planId,
  (id) => {
    if (id) void loadAISuggestions()
  },
)

const aiDrawerVisible = ref(false)
const aiDrawerKey = ref(0)
const aiInitialQuestion = '请分析我的职业规划短板并给出改进建议'

function openAIDrawer() {
  aiDrawerKey.value++
  aiDrawerVisible.value = true
}
</script>

<template>
  <el-card class="gd-card gd-card--ai">
    <template #header>
      <div class="card-space">
        <span class="card-title">AI 深度分析</span>
        <el-button size="small" type="primary" :icon="Sparkles" @click="openAIDrawer"
          >开始分析</el-button
        >
      </div>
    </template>
    <!-- 后端 AI 辅助建议（GET /ai/suggestions，sourceType=career_plan） -->
    <div v-if="displaySuggestions.length" class="ai-result ai-suggestions">
      <div class="ai-result__head">
        <Sparkles :size="16" class="ai-result__icon" />
        <h4 class="ai-result__title">AI 辅助建议</h4>
        <span class="ai-result__time">AI 系统生成</span>
      </div>
      <div v-for="s in displaySuggestions" :key="s.key" class="ai-suggestion">
        <p class="ai-suggestion__content">{{ s.content }}</p>
        <div class="ai-suggestion__meta">
          <span v-if="s.sources" class="ai-suggestion__chip">依据：{{ s.sources }}</span>
          <span v-if="s.warning" class="ai-suggestion__warn">{{ s.warning }}</span>
          <span v-if="s.status" class="ai-suggestion__status">{{ s.status }}</span>
        </div>
      </div>
    </div>
    <div v-if="aiAnalysis" class="ai-result">
      <div class="ai-result__head">
        <Sparkles :size="16" class="ai-result__icon" />
        <h4 class="ai-result__title">个人化短板分析</h4>
        <span class="ai-result__time">{{ aiAnalysis.generatedAt }}</span>
      </div>
      <p v-if="aiAnalysis.summary" class="ai-result__summary">
        {{ aiAnalysis.summary }}
      </p>
      <div v-if="aiAnalysis.materials?.length" class="ai-result__materials">
        <span class="ai-result__materials-label">依据材料：</span>
        <span v-for="(m, i) in aiAnalysis.materials" :key="i" class="ai-result__chip">
          {{ m }}
        </span>
      </div>
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
      <!-- TODO(待后端契约字段)：当前 AI 分析由前端本地生成，未携带 aiSuggestionId，
           无法调用 /profile/career-plans/ai-add 一键加入计划。待后端补充 aiSuggestionId 后，
           在此新增「采纳为计划」按钮并二次确认后提交。 -->
    </div>
    <div v-else-if="!displaySuggestions.length" class="ai-empty">
      <Sparkles :size="28" class="ai-empty__icon" />
      <p class="ai-empty__text">{{ emptyText }}</p>
    </div>
  </el-card>

  <AIChatDrawer
    :key="aiDrawerKey"
    :visible="aiDrawerVisible"
    :initial-question="aiInitialQuestion"
    @close="aiDrawerVisible = false"
  />
</template>

<style scoped lang="scss">
.gd-card {
  :deep(.el-card__body) {
    padding: 16px 20px;
  }

  &--ai {
    background: #f8fafc;
    border-color: #e2e8f0;
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

.ai-result__materials {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.ai-result__materials-label {
  font-size: 12px;
  color: #94a3b8;
}

.ai-result__chip {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  color: #c2410c;
  background: #fff7ed;
  border: 1px solid #fed7aa;
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

// 后端 AI 辅助建议块（绿色系，与本地短板分析橙色区分）
.ai-suggestion {
  padding: 12px 14px;
  border-radius: 8px;
  background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 60%);
  border: 1px solid #bbf7d0;
  border-left: 3px solid #22c55e;

  &__content {
    margin: 0 0 8px;
    font-size: 14px;
    color: #1e293b;
    line-height: 1.6;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__chip {
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 12px;
    color: #c2410c;
    background: #fff7ed;
    border: 1px solid #fed7aa;
  }

  &__warn {
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 12px;
    color: #92400e;
    background: #fffbeb;
    border: 1px solid #fde68a;
  }

  &__status {
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 12px;
    color: #1d4ed8;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
  }
}

// ─── 夜间模式适配 ───
// AI 诊断卡白天为橙白/绿白大面积浅色渐变，夜间改为低透明度叠色渐变，
// chips 同步降亮度；硬编码深色文字亮化保证可读
html.dark {
  .gd-card--ai {
    background: #0f172a;
    border-color: #334155;
  }

  .card-title,
  .ai-result__title {
    color: #f1f5f9;
  }

  .ai-result__summary {
    background: #1e293b;
    color: #cbd5e1;
  }

  .ai-result__chip,
  .ai-suggestion__chip {
    color: #fdba74;
    background: rgba(249, 115, 22, 0.1);
    border-color: rgba(249, 115, 22, 0.3);
  }

  .ai-item {
    background: linear-gradient(180deg, rgba(249, 115, 22, 0.09) 0%, rgba(249, 115, 22, 0.02) 60%);
    border-color: rgba(249, 115, 22, 0.28);

    &__head {
      color: #fb923c;
    }

    &__desc {
      color: #cbd5e1;
    }

    &__suggest {
      color: #f1f5f9;
    }
  }

  .ai-suggestion {
    background: linear-gradient(180deg, rgba(34, 197, 94, 0.09) 0%, rgba(34, 197, 94, 0.02) 60%);
    border-color: rgba(34, 197, 94, 0.28);

    &__content {
      color: #f1f5f9;
    }

    &__warn {
      color: #fcd34d;
      background: rgba(251, 191, 36, 0.1);
      border-color: rgba(251, 191, 36, 0.3);
    }

    &__status {
      color: #93c5fd;
      background: rgba(96, 165, 250, 0.1);
      border-color: rgba(96, 165, 250, 0.3);
    }
  }
}
</style>
