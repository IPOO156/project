<script setup lang="ts">
import type {
  TeacherCareerPlanDetail,
  TeacherGrowthTimeline,
  TeacherStudentProfile,
  TeacherTimelineItem,
  TeacherWeaknessItem,
} from '@/shared/types/teacher'
/**
 * StudentDetail - 学生成长档案详情（教师端）
 * 数据来源（均为教师端真实接口）：
 *   - GET /teacher/students/{userId}/profile           学生基本信息 + 能力画像
 *   - GET /teacher/students/{userId}/growth-timeline   成长时间轴
 *   - GET /teacher/students/{userId}/weaknesses        短板分析
 *   - GET /teacher/students/{userId}/career-plans/{id} 职业规划详情
 * 教师反馈与改进建议通过弹窗组件提交。
 */
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Lightbulb,
  ListChecks,
  UserRound,
} from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  getTeacherStudentCareerPlan,
  getTeacherStudentProfile,
  getTeacherStudentTimeline,
  getTeacherStudentWeaknesses,
} from '@/shared/api/teacher'
import CareerPlanDialog from './components/CareerPlanDialog.vue'
import SuggestionDialog from './components/SuggestionDialog.vue'

const route = useRoute()
const router = useRouter()
const userId = Number(route.params.userId)

const loading = ref(false)
const profile = ref<TeacherStudentProfile | null>(null)
const timeline = ref<TeacherGrowthTimeline | null>(null)
const weaknesses = ref<TeacherWeaknessItem[]>([])

// ── 成长时间轴 ──
const eventTypeFilter = ref<number | ''>('')
const EVENT_TYPE_OPTIONS = [
  { value: '', label: '全部' },
  { value: 1, label: '奖项' },
  { value: 2, label: '成绩' },
  { value: 3, label: '实践' },
  { value: 4, label: '职业规划' },
  { value: 5, label: '短板改进' },
  { value: 6, label: '能力提升' },
]
const filteredTimeline = computed(() => {
  const list = timeline.value?.timeline ?? []
  if (!eventTypeFilter.value) return list
  return list.filter((t) => t.eventType === eventTypeFilter.value)
})

const summaryItems = computed(() => {
  const s = timeline.value?.summary
  return [
    { label: '经历数量', value: s?.experiences ?? '—' },
    { label: '技能掌握', value: s?.skills ?? '—' },
    { label: '平均成长', value: s?.averageGrowth ?? '—' },
    { label: '成长潜力', value: s?.potential ?? '—' },
  ]
})

// ── 职业规划详情弹窗 ──
const careerDialogVisible = ref(false)
const careerLoading = ref(false)
const careerPlan = ref<TeacherCareerPlanDetail | null>(null)

async function openCareerPlan(event: TeacherTimelineItem) {
  if (!event.sourceId) return
  careerDialogVisible.value = true
  careerLoading.value = true
  careerPlan.value = null
  try {
    careerPlan.value = await getTeacherStudentCareerPlan(userId, event.sourceId)
  } catch {
    careerPlan.value = null
  } finally {
    careerLoading.value = false
  }
}

// ── 改进建议弹窗 ──
const suggestionDialogVisible = ref(false)
const suggestionWeaknessId = ref<number | undefined>(undefined)

function openSuggestion(weakness?: TeacherWeaknessItem) {
  suggestionWeaknessId.value = weakness?.id
  suggestionDialogVisible.value = true
}

// ── 能力画像进度 ──
function dimPercent(score: number | null, target: number | null): number {
  if (score == null) return 0
  if (target && target > 0) return Math.max(0, Math.min(100, Math.round((score / target) * 100)))
  return score
}

function weaknessTagType(severity: number | null): 'danger' | 'warning' | 'info' {
  if (severity == null) return 'info'
  if (severity >= 3) return 'danger'
  if (severity === 2) return 'warning'
  return 'info'
}

async function loadAll() {
  if (!userId) return
  loading.value = true
  try {
    const [p, tl, w] = await Promise.all([
      getTeacherStudentProfile(userId),
      getTeacherStudentTimeline(userId),
      getTeacherStudentWeaknesses(userId),
    ])
    profile.value = p
    timeline.value = tl
    weaknesses.value = Array.isArray(w) ? w : []
  } catch {
    profile.value = null
    timeline.value = null
    weaknesses.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => void loadAll())
</script>

<template>
  <div class="mc-page student-detail">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <el-button text :icon="ArrowLeft" class="student-detail__back" @click="router.back()">
          返回
        </el-button>
        <h2 class="mc-page-head__title">
          {{ profile?.academicInfo?.name ?? '学生档案' }}
        </h2>
        <p class="mc-page-head__desc">
          {{
            [
              profile?.academicInfo?.studentNo,
              profile?.academicInfo?.collegeName,
              profile?.academicInfo?.className,
            ]
              .filter(Boolean)
              .join(' · ') || '查看学生成长档案详情'
          }}
        </p>
      </div>
      <div class="mc-page-head__actions">
        <el-button :icon="Lightbulb" type="primary" plain @click="openSuggestion()">
          添加改进建议
        </el-button>
      </div>
    </div>

    <div v-loading="loading">
      <template v-if="profile">
        <el-alert
          v-if="!profile.isInScope"
          class="student-detail__scope-alert"
          type="warning"
          :closable="false"
          show-icon
          title="该学生不在您当前管辖范围内，以下数据可能受限"
        />

        <!-- 基本信息 -->
        <div class="mc-card">
          <div class="mc-card__head">
            <span class="mc-card__title">基本信息</span>
          </div>
          <div class="mc-card__body">
            <el-descriptions :column="3" border size="default" class="student-detail__descriptions">
              <el-descriptions-item label="学号">{{
                profile.academicInfo?.studentNo ?? '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="姓名">{{
                profile.academicInfo?.name ?? '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="性别">{{
                profile.academicInfo?.genderLabel ?? '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="年级">{{
                profile.academicInfo?.grade ?? '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="学院">{{
                profile.academicInfo?.collegeName ?? '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="专业">{{
                profile.academicInfo?.major ?? '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="班级">{{
                profile.academicInfo?.className ?? '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="学籍状态">{{
                profile.academicInfo?.studentStatusLabel ?? '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="政治面貌">{{
                profile.academicInfo?.politicalStatusLabel ?? '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="出生日期">{{
                profile.academicInfo?.birthDate ?? '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="联系电话">{{
                profile.contactInfo?.phone ?? '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="邮箱">{{
                profile.contactInfo?.email ?? '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="联系地址" :span="2">{{
                profile.contactInfo?.address ?? '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="紧急联系人">
                {{
                  [
                    profile.contactInfo?.emergencyName,
                    profile.contactInfo?.emergencyRelation,
                    profile.contactInfo?.emergencyPhone,
                  ]
                    .filter(Boolean)
                    .join(' · ') || '-'
                }}
              </el-descriptions-item>
              <el-descriptions-item label="志愿服务时长">
                <span class="mc-num">{{ profile.totalVolunteerHours ?? 0 }}</span> 小时
              </el-descriptions-item>
              <el-descriptions-item label="个人兴趣" :span="2">
                {{ profile.interests?.length ? profile.interests.join('、') : '-' }}
              </el-descriptions-item>
            </el-descriptions>
            <p v-if="profile.selfEvaluation" class="student-detail__eval">
              自我评价：{{ profile.selfEvaluation }}
            </p>
          </div>
        </div>

        <!-- 能力画像 -->
        <div class="mc-card">
          <div class="mc-card__head">
            <span class="mc-card__title"><UserRound :size="15" /> 能力画像</span>
          </div>
          <div class="mc-card__body">
            <div v-if="profile.dimensionProfile?.length" class="student-detail__dims">
              <div
                v-for="d in profile.dimensionProfile"
                :key="d.dimensionCode"
                class="student-detail__dim"
              >
                <div class="student-detail__dim-label">
                  <span>{{ d.dimensionName }}</span>
                  <span class="mc-num">{{ d.score ?? '-' }} / {{ d.targetScore ?? '-' }}</span>
                </div>
                <el-progress
                  :percentage="dimPercent(d.score, d.targetScore)"
                  :stroke-width="8"
                  :color="d.gap && d.gap < 0 ? 'var(--el-color-danger)' : undefined"
                />
              </div>
            </div>
            <el-empty v-else description="暂无数画像数据" :image-size="72" />
          </div>
        </div>

        <!-- 成长时间轴 -->
        <div class="mc-card">
          <div class="mc-card__head">
            <span class="mc-card__title"><GraduationCap :size="15" /> 成长时间轴</span>
            <el-radio-group v-model="eventTypeFilter" size="small">
              <el-radio-button v-for="o in EVENT_TYPE_OPTIONS" :key="o.label" :value="o.value">
                {{ o.label }}
              </el-radio-button>
            </el-radio-group>
          </div>
          <div class="mc-card__body">
            <div class="student-detail__summary">
              <div v-for="s in summaryItems" :key="s.label" class="student-detail__summary-item">
                <span class="student-detail__summary-value mc-num">{{ s.value }}</span>
                <span class="student-detail__summary-label">{{ s.label }}</span>
              </div>
            </div>
            <div v-if="filteredTimeline.length" class="student-detail__timeline">
              <div v-for="item in filteredTimeline" :key="item.id" class="student-detail__tl-item">
                <div class="student-detail__tl-rail">
                  <span class="student-detail__tl-dot" :class="`is-type-${item.eventType}`" />
                </div>
                <div class="student-detail__tl-card">
                  <div class="student-detail__tl-head">
                    <span class="student-detail__tl-type">{{ item.eventTypeLabel }}</span>
                    <span class="student-detail__tl-date">{{
                      item.eventAt || item.semesterName || ''
                    }}</span>
                  </div>
                  <p class="student-detail__tl-name">{{ item.eventName }}</p>
                  <p v-if="item.content" class="student-detail__tl-content">{{ item.content }}</p>
                  <div v-if="item.tags?.length" class="student-detail__tl-tags">
                    <el-tag v-for="t in item.tags" :key="t" size="small" effect="plain">{{
                      t
                    }}</el-tag>
                  </div>
                  <el-button
                    v-if="item.eventType === 4 && item.sourceId != null"
                    class="student-detail__tl-action"
                    text
                    type="primary"
                    size="small"
                    :icon="BookOpen"
                    @click="openCareerPlan(item)"
                  >
                    查看职业规划
                  </el-button>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无成长记录" :image-size="72" />
          </div>
        </div>

        <!-- 短板分析与改进建议 -->
        <div class="mc-card">
          <div class="mc-card__head">
            <span class="mc-card__title"><ListChecks :size="15" /> 短板分析与改进建议</span>
          </div>
          <div class="mc-card__body">
            <el-table v-if="weaknesses.length" :data="weaknesses" stripe>
              <el-table-column prop="weaknessType" label="短板类型" width="140" />
              <el-table-column prop="weaknessDesc" label="短板描述" min-width="200" />
              <el-table-column label="严重程度" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="weaknessTagType(row.severityLevel)" size="small">
                    {{ row.severityLevel ?? '-' }} 级
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="sourceLabel" label="来源" width="90" align="center" />
              <el-table-column prop="createdAt" label="创建时间" width="170" />
              <el-table-column label="操作" width="110" align="center">
                <template #default="{ row }">
                  <el-button
                    text
                    type="primary"
                    size="small"
                    @click="openSuggestion(row as TeacherWeaknessItem)"
                  >
                    添加建议
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="暂无短板分析数据" :image-size="72" />
          </div>
        </div>
      </template>

      <el-empty v-else-if="!loading" description="学生档案加载失败" :image-size="96">
        <el-button type="primary" @click="router.back()">返回</el-button>
      </el-empty>
    </div>

    <CareerPlanDialog
      v-model="careerDialogVisible"
      :plan="careerPlan"
      :loading="careerLoading"
      @submitted="careerDialogVisible = false"
    />
    <SuggestionDialog
      v-model="suggestionDialogVisible"
      :user-id="userId"
      :weakness-id="suggestionWeaknessId"
      @submitted="suggestionDialogVisible = false"
    />
  </div>
</template>

<style scoped lang="scss">
.student-detail {
  &__back {
    padding-left: 0;
    margin-bottom: $spacing-xs;
    color: var(--el-text-color-secondary);
  }

  &__scope-alert {
    margin-bottom: $spacing-lg;
  }

  &__descriptions {
    :deep(.el-descriptions__label) {
      width: 110px;
      color: var(--el-text-color-secondary);
      font-weight: 500;
    }
  }

  &__eval {
    margin-top: $spacing-lg;
    padding-top: $spacing-md;
    border-top: 1px solid var(--el-border-color-lighter);
    font-size: 13px;
    line-height: 1.8;
    color: var(--el-text-color-secondary);
  }

  &__dims {
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;
  }

  &__dim-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  &__summary {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: $spacing-md;
    margin-bottom: $spacing-xl;
  }

  &__summary-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: $spacing-md;
    border-radius: $radius-lg;
    background: var(--el-fill-color-light);
  }

  &__summary-value {
    font-size: $font-size-2xl;
    font-weight: 700;
    color: var(--el-color-primary);
  }

  &__summary-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__timeline {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__tl-item {
    display: flex;
    gap: $spacing-md;
  }

  &__tl-rail {
    position: relative;
    flex-shrink: 0;
    width: 18px;
    display: flex;
    justify-content: center;

    &::after {
      content: '';
      position: absolute;
      top: 20px;
      bottom: -12px;
      width: 1px;
      background: var(--el-border-color-lighter);
    }
  }

  &__tl-dot {
    position: relative;
    z-index: 1;
    margin-top: 6px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--el-color-primary);
    border: 3px solid var(--el-bg-color);
    box-shadow: 0 0 0 2px var(--el-color-primary-light-7);

    &.is-type-2 {
      background: var(--el-color-success);
      box-shadow: 0 0 0 2px var(--el-color-success-light-7);
    }
    &.is-type-3 {
      background: var(--el-color-warning);
      box-shadow: 0 0 0 2px var(--el-color-warning-light-7);
    }
    &.is-type-4 {
      background: $color-accent;
      box-shadow: 0 0 0 2px rgba($color-accent, 0.4);
    }
    &.is-type-5 {
      background: var(--el-color-danger);
      box-shadow: 0 0 0 2px var(--el-color-danger-light-7);
    }
    &.is-type-6 {
      background: var(--el-color-info);
      box-shadow: 0 0 0 2px var(--el-color-info-light-7);
    }
  }

  &__tl-card {
    flex: 1;
    min-width: 0;
    padding: $spacing-md $spacing-lg;
    margin-bottom: $spacing-sm;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: $radius-lg;
    background: var(--el-bg-color);
    transition:
      border-color 0.2s $ease-standard,
      box-shadow 0.2s $ease-standard;

    &:hover {
      border-color: rgba($color-accent, 0.3);
      box-shadow: $shadow-sm;
    }
  }

  &__tl-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-sm;
    margin-bottom: 4px;
  }

  &__tl-type {
    font-size: 12px;
    font-weight: 600;
    color: var(--el-color-primary);
  }

  &__tl-date {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }

  &__tl-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 4px;
  }

  &__tl-content {
    font-size: 13px;
    line-height: 1.7;
    color: var(--el-text-color-secondary);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__tl-tags {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
    margin-top: $spacing-sm;
  }

  &__tl-action {
    margin-top: $spacing-sm;
  }

  @media (max-width: 768px) {
    &__summary {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}
</style>
