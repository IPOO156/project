<script setup lang="ts">
import {
  Award,
  BarChart3,
  BookOpen,
  Briefcase,
  FlaskConical,
  HeartHandshake,
  Lightbulb,
  Medal,
  Trophy,
  Users,
} from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BookReportList from './book-report/BookReportList.vue'
import CertificateList from './certificate/CertificateList.vue'
import CompetitionList from './competition/CompetitionList.vue'
import InnovationList from './innovation/InnovationList.vue'
import InternshipList from './internship/InternshipList.vue'
import OrganizationList from './organization/OrganizationList.vue'
import ResearchList from './research/ResearchList.vue'
import ScholarshipList from './scholarship/ScholarshipList.vue'
import SocialPracticeList from './social-practice/SocialPracticeList.vue'
import TrainingList from './training/TrainingList.vue'

const route = useRoute()
const router = useRouter()

const modules = [
  {
    key: 'competition',
    label: '学科竞赛',
    icon: Trophy,
    component: CompetitionList,
    desc: '竞赛成果与过程材料',
    count: 0,
  },
  {
    key: 'innovation',
    label: '创新创业',
    icon: Lightbulb,
    component: InnovationList,
    desc: '双创项目与实践记录',
    count: 0,
  },
  {
    key: 'research',
    label: '学术研究',
    icon: FlaskConical,
    component: ResearchList,
    desc: '科研成果与研究经历',
    count: 0,
  },
  {
    key: 'scholarship',
    label: '奖学金',
    icon: Medal,
    component: ScholarshipList,
    desc: '奖助学金申报信息',
    count: 0,
  },
  {
    key: 'certificate',
    label: '荣誉证书',
    icon: Award,
    component: CertificateList,
    desc: '荣誉与资格证明',
    count: 0,
  },
  {
    key: 'internship',
    label: '实习经历',
    icon: Briefcase,
    component: InternshipList,
    desc: '岗位实践与企业经历',
    count: 0,
  },
  {
    key: 'organization',
    label: '组织履历',
    icon: Users,
    component: OrganizationList,
    desc: '学生工作与组织任职',
    count: 0,
  },
  {
    key: 'training',
    label: '实训项目',
    icon: BarChart3,
    component: TrainingList,
    desc: '课程实训与项目训练',
    count: 0,
  },
  {
    key: 'social-practice',
    label: '社会实践',
    icon: HeartHandshake,
    component: SocialPracticeList,
    desc: '社会实践与志愿服务',
    count: 0,
  },
  {
    key: 'book-report',
    label: '图书心得',
    icon: BookOpen,
    component: BookReportList,
    desc: '阅读记录与心得沉淀',
    count: 0,
  },
] as const

function resolveKeyFromRoute(tab: unknown): string {
  const key = typeof tab === 'string' ? tab : 'competition'
  return modules.some((item) => item.key === key) ? key : 'competition'
}

const activeKey = ref(resolveKeyFromRoute(route.query.tab))
const activeModule = computed(() => modules.find((item) => item.key === activeKey.value)!)

watch(
  () => route.query.tab,
  (tab) => {
    activeKey.value = resolveKeyFromRoute(tab)
  },
)

function switchModule(key: string) {
  if (key === activeKey.value) return
  activeKey.value = key
  router.replace({ path: '/applications', query: { tab: key } }).catch(() => {})
}
</script>

<template>
  <div class="application-hub">
    <div class="application-hub__grid">
      <button
        v-for="item in modules"
        :key="item.key"
        type="button"
        class="application-hub__tab"
        :class="{ 'is-active': item.key === activeKey }"
        @click="switchModule(item.key)"
      >
        <div v-if="item.count > 0" class="application-hub__tab-badge">{{ item.count }}</div>
        <div class="application-hub__tab-icon">
          <component :is="item.icon" :size="18" />
        </div>
        <div class="application-hub__tab-body">
          <div class="application-hub__tab-title">{{ item.label }}</div>
          <div class="application-hub__tab-desc">{{ item.desc }}</div>
        </div>
      </button>
    </div>

    <section class="application-hub__panel">
      <Transition name="module-fade" mode="out-in">
        <div :key="activeKey" class="application-hub__panel-item is-active" aria-hidden="false">
          <component :is="activeModule.component" :key="activeKey" />
        </div>
      </Transition>
    </section>
  </div>
</template>

<style scoped lang="scss">
.application-hub {
  display: flex;
  flex-direction: column;
  gap: 16px;

  :deep(.page-container) {
    user-select: none;
  }
}

.application-hub__grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.application-hub__tab {
  position: relative;
  min-height: 84px;
  padding: 14px 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-bg-color);
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.application-hub__tab:hover {
  border-color: #d4a574;
  box-shadow: 0 4px 12px rgba(30, 58, 95, 0.06);
}

.application-hub__tab.is-active {
  border-color: var(--el-color-primary);
  background: rgba(var(--el-color-primary-rgb, 30 58 95), 0.03);
}

.application-hub__tab.is-active .application-hub__tab-title {
  color: var(--el-color-primary);
}

.application-hub__tab-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 10px;
  background: var(--el-color-primary);
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}

.application-hub__tab-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(var(--el-color-primary-rgb, 30 58 95), 0.06);
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.application-hub__tab-body {
  min-width: 0;
  flex: 1;
}

.application-hub__tab-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  transition: color 0.25s ease;
}

.application-hub__tab-desc {
  margin-top: 3px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
}

.application-hub__panel {
  position: relative;
  min-width: 0;
  min-height: 55vh;
  overflow: visible;
}

.application-hub__panel-item {
  width: 100%;
}

@media (max-width: 1200px) {
  .application-hub__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .application-hub__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 480px) {
  .application-hub__grid {
    grid-template-columns: 1fr;
  }
}

.module-fade-enter-active,
.module-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.module-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.module-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (prefers-reduced-motion: reduce) {
  .application-hub__tab,
  .application-hub__panel-item {
    transition: none !important;
  }

  .module-fade-enter-active,
  .module-fade-leave-active {
    transition: none !important;
  }
}
</style>
