<script setup lang="ts">
/**
 * 职业规划「AI 深度分析」卡片（含 AI 对话抽屉）。
 * - 后端 AI 辅助建议：GET /ai/suggestions，sourceType=career_plan，按最新一条规划拉取
 * - 本地短板分析：来自 useCareerPlanStore.aiAnalysis（AI 助手回流）
 */
import type { AISuggestion } from '@/features/ai-chat/ai-chat.types'
import type { CareerAnalysis } from '@/shared/types/types'
import { ElMessage } from 'element-plus'
import { AlertTriangle, Sparkles } from 'lucide-vue-next'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useArchiveStore, useCareerPlanStore } from '@/app/stores/stores'
import AIChatDrawer from '@/features/ai-chat/components/AIChatDrawer.vue'
import { analyzeCareer } from '@/features/ai-chat/composables/useCareerAnalysis'
import { getAISuggestions } from '@/shared/api/ai-chat'
import { aiAddCareerPlan, getSemesterIdByName } from '@/shared/api/career-plan'
import { useSemesters } from '@/shared/composables/useSemesters'

const props = defineProps<{
  /** 最新一条规划的 id（后端建议以它为 sourceId）；无记录时为 null */
  planId: string | null
}>()

const careerPlanStore = useCareerPlanStore()
const archiveStore = useArchiveStore()
const aiAnalysis = computed(() => careerPlanStore.aiAnalysis)
/** 卡片内展示的分析：逐字流式填充；store 里保留完整结果供其他页面使用 */
const displayAnalysis = ref<CareerAnalysis | null>(careerPlanStore.aiAnalysis)
const streaming = ref(false)
let streamTimer: ReturnType<typeof setInterval> | null = null
let streamVersion = 0

const backendSuggestions = ref<AISuggestion[]>([])
const suggestionsLoading = ref(false)
/** 卡片内联分析加载态（不再跳转 AI 抽屉） */
const analyzing = ref(false)
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
  analyzing.value
    ? '正在分析你的档案数据…'
    : suggestionsLoading.value
      ? '正在加载 AI 建议…'
      : '点击「开始分析」获取个性化改进建议',
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

function stopStream() {
  streamVersion++
  if (streamTimer) {
    clearInterval(streamTimer)
    streamTimer = null
  }
  streaming.value = false
}

/**
 * 模拟流式输出：摘要逐字出现，每条短板的“问题/建议”也逐字输出，
 * 短板之间留出停顿，最后补依据材料。
 * 后端 AI 接口目前没有 SSE/流式端点，这里用前端渐进渲染实现“边分析边输出”的观感。
 */
function streamAnalysis(analysis: CareerAnalysis): Promise<void> {
  stopStream()
  const version = ++streamVersion
  const summary = analysis.summary ?? ''
  const weaknesses = analysis.weaknesses ?? []
  displayAnalysis.value = { ...analysis, summary: '', weaknesses: [], materials: [] }
  streaming.value = true
  type Phase = 'summary' | 'weakness' | 'suggestion' | 'pause' | 'done'
  type WeaknessItem = NonNullable<CareerAnalysis['weaknesses']>[number]
  let phase: Phase = 'summary'
  let summaryIndex = 0
  let weaknessIndex = 0
  let charIndex = 0
  let pause = 0

  function addWeakness(item: WeaknessItem) {
    displayAnalysis.value = {
      ...analysis,
      summary,
      weaknesses: [
        ...(displayAnalysis.value?.weaknesses ?? []),
        { ...item, weakness: '', suggestion: '' },
      ],
      materials: [],
    }
  }

  function updateWeakness(index: number, patch: Partial<WeaknessItem>) {
    const current = displayAnalysis.value
    if (!current) return
    displayAnalysis.value = {
      ...current,
      weaknesses: (current.weaknesses ?? []).map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    }
  }

  return new Promise((resolve) => {
    function finish() {
      displayAnalysis.value = { ...analysis }
      streaming.value = false
      phase = 'done'
      if (streamTimer) {
        clearInterval(streamTimer)
        streamTimer = null
      }
      resolve()
    }

    streamTimer = setInterval(() => {
      if (version !== streamVersion) {
        if (streamTimer) {
          clearInterval(streamTimer)
          streamTimer = null
        }
        resolve()
        return
      }
      if (phase === 'done') return

      if (phase === 'summary') {
        if (summaryIndex < summary.length) {
          summaryIndex++
          displayAnalysis.value = {
            ...analysis,
            summary: summary.slice(0, summaryIndex),
            weaknesses: [],
            materials: [],
          }
          return
        }
        if (weaknesses.length) {
          weaknessIndex = 0
          addWeakness(weaknesses[0])
          charIndex = 0
          phase = 'weakness'
        } else {
          finish()
        }
        return
      }

      if (phase === 'weakness') {
        const item = weaknesses[weaknessIndex]
        if (!item) {
          finish()
          return
        }
        if (charIndex < item.weakness.length) {
          charIndex++
          updateWeakness(weaknessIndex, { weakness: item.weakness.slice(0, charIndex) })
          return
        }
        charIndex = 0
        phase = 'suggestion'
        return
      }

      if (phase === 'suggestion') {
        const item = weaknesses[weaknessIndex]
        if (!item) {
          finish()
          return
        }
        if (charIndex < item.suggestion.length) {
          charIndex++
          updateWeakness(weaknessIndex, { suggestion: item.suggestion.slice(0, charIndex) })
          return
        }
        phase = 'pause'
        pause = 8
        return
      }

      if (phase === 'pause') {
        if (pause > 0) {
          pause--
          return
        }
        weaknessIndex++
        if (weaknessIndex < weaknesses.length) {
          addWeakness(weaknesses[weaknessIndex])
          charIndex = 0
          phase = 'weakness'
        } else {
          finish()
        }
      }
    }, 20)
  })
}

onBeforeUnmount(stopStream)

/**
 * 开始分析：直接在卡片内生成结构化短板分析并写入 store。
 * 此前面板按钮只打开 AI 抽屉，分析结果留在对话里，卡片区域一直是空的。
 */
async function startAnalysis() {
  if (analyzing.value) return
  analyzing.value = true
  stopStream()
  displayAnalysis.value = null
  try {
    if (archiveStore.dimensions.length === 0) {
      await archiveStore.fetchArchive()
    }
    const analysis = analyzeCareer(
      archiveStore.dimensions,
      archiveStore.awards,
      archiveStore.grades,
      careerPlanStore.plans,
    )
    if (!analysis) {
      ElMessage.warning('档案数据尚未加载完成，请稍后再试')
      return
    }
    careerPlanStore.setAIAnalysis(analysis)
    void loadAISuggestions()
    await streamAnalysis(analysis)
  } catch {
    ElMessage.error('分析失败，请稍后重试')
  } finally {
    analyzing.value = false
  }
}

/* ===================== AI 建议一键采纳（4.15） ===================== */

const { semesterOptions, load: loadSemesters } = useSemesters()
const adoptVisible = ref(false)
const adoptTarget = ref<{ key: number; content: string } | null>(null)
const adoptSemester = ref('')
const adoptTitle = ref('')
const adopting = ref(false)

function openAdoptDialog(s: { key: number; content: string }) {
  adoptTarget.value = s
  // 默认选最近学期（useSemesters 按学期名升序排列）
  adoptSemester.value = semesterOptions.value[semesterOptions.value.length - 1]?.value ?? ''
  adoptTitle.value = ''
  adoptVisible.value = true
  void loadSemesters()
}

/** 采纳为草稿（requireConfirm=1）：后端按建议内容生成目标与行动，学生可在规划记录中继续完善 */
async function confirmAdopt() {
  if (!adoptTarget.value) return
  if (!adoptSemester.value) {
    ElMessage.warning('请选择目标学期')
    return
  }
  adopting.value = true
  try {
    const semesterId = await getSemesterIdByName(adoptSemester.value)
    await aiAddCareerPlan({
      aiSuggestionId: adoptTarget.value.key,
      semesterId,
      title: adoptTitle.value.trim() || undefined,
      requireConfirm: 1,
    })
    ElMessage.success('已生成规划草稿，可在规划记录中查看')
    adoptVisible.value = false
    await careerPlanStore.fetchPlans(true)
  } catch (e) {
    // 「未找到学期」为本地映射错误；其余接口错误拦截器已提示
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('未找到学期')) ElMessage.warning(msg)
  } finally {
    adopting.value = false
  }
}
</script>

<template>
  <el-card class="gd-card gd-card--ai">
    <template #header>
      <div class="card-space">
        <span class="card-title">AI 深度分析</span>
        <div class="card-actions">
          <el-button
            size="small"
            type="primary"
            :icon="Sparkles"
            :loading="analyzing"
            @click="startAnalysis"
            >{{ aiAnalysis ? '重新分析' : '开始分析' }}</el-button
          >
          <el-button size="small" link @click="openAIDrawer">和 AI 深入聊</el-button>
        </div>
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
          <el-button
            type="primary"
            plain
            size="small"
            class="ai-suggestion__adopt"
            @click="openAdoptDialog(s)"
          >
            采纳为计划
          </el-button>
        </div>
      </div>
    </div>
    <div v-if="displayAnalysis" class="ai-result">
      <div class="ai-result__head">
        <Sparkles :size="16" class="ai-result__icon" />
        <h4 class="ai-result__title">个人化短板分析</h4>
        <span v-if="streaming" class="ai-result__time ai-result__time--live">正在生成…</span>
        <span v-else class="ai-result__time">{{ displayAnalysis.generatedAt }}</span>
      </div>
      <p
        v-if="displayAnalysis.summary"
        class="ai-result__summary"
        :class="{ 'is-streaming': streaming }"
      >
        {{ displayAnalysis.summary }}
      </p>
      <div v-if="displayAnalysis.materials?.length" class="ai-result__materials">
        <span class="ai-result__materials-label">依据材料：</span>
        <span v-for="(m, i) in displayAnalysis.materials" :key="i" class="ai-result__chip">
          {{ m }}
        </span>
      </div>
      <div v-if="displayAnalysis.weaknesses?.length" class="ai-result__list">
        <div
          v-for="(item, i) in displayAnalysis.weaknesses"
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

  <el-dialog v-model="adoptVisible" title="采纳为计划" width="440px" append-to-body>
    <el-form label-width="80px">
      <el-form-item label="目标学期" required>
        <el-select v-model="adoptSemester" placeholder="请选择学期" class="adopt-w">
          <el-option
            v-for="s in semesterOptions"
            :key="s.value"
            :label="s.label"
            :value="s.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="规划标题">
        <el-input v-model="adoptTitle" maxlength="255" placeholder="不填则自动生成" />
      </el-form-item>
    </el-form>
    <p class="adopt-tip">采纳后将按建议内容自动生成目标与行动，并保存为草稿（不直接提交审核）。</p>
    <template #footer>
      <el-button @click="adoptVisible = false">取消</el-button>
      <el-button type="primary" :loading="adopting" @click="confirmAdopt">确定采纳</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.gd-card {
  :deep(.el-card__body) {
    padding: 16px 20px;
  }

  &--ai {
    background: #fff;
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

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
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

.ai-result__time--live {
  color: #b8864f;
  font-weight: 600;
  animation: ai-pulse 1.4s ease-in-out infinite;
}

.ai-result__summary {
  margin: 0;
  padding: 10px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  color: #475569;
  line-height: 1.6;

  &.is-streaming::after {
    content: '▍';
    margin-left: 2px;
    color: #d4a574;
    animation: ai-blink 0.9s steps(2, start) infinite;
  }
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
  color: #7c5a2e;
  background: #fdf6ec;
  border: 1px solid #f0dcc0;
}

.ai-result__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ai-item {
  padding: 12px 14px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-left: 3px solid #d4a574;
  animation: ai-fade-in 0.24s ease both;

  &__head {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    color: #64748b;
  }

  &__dim {
    font-size: 15px;
    font-weight: 600;
    color: #1e293b;
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

@keyframes ai-blink {
  50% {
    opacity: 0;
  }
}

@keyframes ai-pulse {
  50% {
    opacity: 0.45;
  }
}

@keyframes ai-fade-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 后端 AI 辅助建议块（绿色描边，与本地分析的金色描边区分，但保持同一套白底样式）
.ai-suggestion {
  padding: 12px 14px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-left: 3px solid #22c55e;
  animation: ai-fade-in 0.24s ease both;

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

  &__adopt {
    margin-left: auto;
  }
}

.adopt-w {
  width: 100%;
}

.adopt-tip {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
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
