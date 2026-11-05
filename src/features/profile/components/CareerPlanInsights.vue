<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { ref } from 'vue'
import { addCareerReflection } from '@/shared/api/career-plan'

interface ReflectionItem {
  id: number
  reflectionContent: string
  createdAt: string
}

interface FeedbackItem {
  id: number
  teacherName: string
  feedbackContent: string
  createdAt: string
}

interface VersionItem {
  version: number
  status: number
  statusLabel: string
  createdAt: string
}

interface PlanInsights {
  reflections?: ReflectionItem[]
  feedbacks?: FeedbackItem[]
  versionHistory?: VersionItem[]
}

const props = defineProps<{
  plan: PlanInsights
  planId: number | null
  editable: boolean
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const reflectionInput = ref('')
const submittingReflection = ref(false)

/** 时间格式化：ISO 时间 → "YYYY-MM-DD HH:mm" */
function formatTime(iso?: string): string {
  return (iso || '').slice(0, 16).replace('T', ' ')
}

async function submitReflection() {
  if (props.planId == null) return
  const content = reflectionInput.value.trim()
  if (!content) {
    ElMessage.warning('请输入反思内容')
    return
  }
  submittingReflection.value = true
  try {
    await addCareerReflection(props.planId, content)
    ElMessage.success('反思已添加')
    reflectionInput.value = ''
    emit('refresh')
  } catch {
    // 接口失败已由请求拦截器统一提示
  } finally {
    submittingReflection.value = false
  }
}
</script>

<template>
  <div class="insights">
    <!-- 阶段反思 -->
    <section class="insight">
      <h4 class="insight__title">阶段反思</h4>
      <div v-if="plan.reflections?.length" class="insight__list">
        <div v-for="r in plan.reflections || []" :key="r.id" class="insight__item">
          <p class="insight__content">{{ r.reflectionContent }}</p>
          <span class="insight__time">{{ formatTime(r.createdAt) }}</span>
        </div>
      </div>
      <div v-else class="insight__empty">暂无反思</div>
      <template v-if="editable">
        <el-input
          v-model="reflectionInput"
          type="textarea"
          :rows="2"
          placeholder="记录本阶段的收获、不足与改进方向..."
          class="insight__input"
        />
        <el-button
          size="small"
          type="primary"
          plain
          :loading="submittingReflection"
          class="insight__add"
          @click="submitReflection"
        >
          添加反思
        </el-button>
      </template>
    </section>

    <!-- 教师反馈 -->
    <section class="insight">
      <h4 class="insight__title">教师反馈</h4>
      <div v-if="plan.feedbacks?.length" class="insight__list">
        <div v-for="f in plan.feedbacks || []" :key="f.id" class="insight__item">
          <div class="insight__teacher-name">{{ f.teacherName }}</div>
          <p class="insight__content">{{ f.feedbackContent }}</p>
          <span class="insight__time">{{ formatTime(f.createdAt) }}</span>
        </div>
      </div>
      <div v-else class="insight__empty">暂无教师反馈</div>
    </section>

    <!-- 版本历史 -->
    <section class="insight">
      <h4 class="insight__title">版本历史</h4>
      <div v-if="plan.versionHistory?.length" class="insight__list">
        <div v-for="v in plan.versionHistory || []" :key="v.version" class="insight__version">
          <span class="insight__version-no">V{{ v.version }}</span>
          <span class="insight__version-status">{{ v.statusLabel }}</span>
          <span class="insight__time">{{ formatTime(v.createdAt) }}</span>
        </div>
      </div>
      <div v-else class="insight__empty">暂无版本记录</div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.insights {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 0 8px;
  margin-top: 16px;
  border-top: 1px solid var(--el-border-color-light);
}

.insight {
  &__title {
    margin: 0 0 8px;
    font-size: 15px;
    font-weight: 600;
    color: #d4a574;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__item {
    padding: 10px 12px;
    border-radius: 8px;
    background: var(--el-fill-color-light);
  }

  &__empty {
    padding: 8px 0;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  &__content {
    margin: 0 0 4px;
    font-size: 13px;
    color: var(--el-text-color-regular);
    line-height: 1.6;
  }

  &__teacher-name {
    margin-bottom: 4px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__time {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__input {
    margin-bottom: 8px;
  }

  &__version {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 8px;
    background: var(--el-fill-color-light);
  }

  &__version-no {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__version-status {
    font-size: 12px;
    color: var(--el-color-primary);
  }
}
</style>
