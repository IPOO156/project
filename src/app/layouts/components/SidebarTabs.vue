<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/app/stores/stores'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

interface TabItem {
  label: string
  icon?: any
  path: string
}

interface SectionConfig {
  label: string
  icon?: string
  children: TabItem[]
}

const sections: SectionConfig[] = [
  {
    label: '个人中心',
    children: [
      { label: '个人档案信息', path: '/profile/info' },
      { label: '成长时间轴', path: '/profile/timeline' },
      { label: '职业规划', path: '/profile/career-plan' },
    ],
  },
  {
    label: '各类申报',
    children: [
      { label: '学科竞赛', path: '/applications/competition' },
      { label: '创新创业', path: '/applications/innovation' },
      { label: '学术研究', path: '/applications/research' },
      { label: '奖学金', path: '/applications/scholarship' },
      { label: '荣誉证书', path: '/applications/certificate' },
      { label: '实习经历', path: '/applications/internship' },
      { label: '组织履历', path: '/applications/organization' },
      { label: '实训项目', path: '/applications/training' },
      { label: '社会实践', path: '/applications/social-practice' },
      { label: '图书心得', path: '/applications/book-report' },
    ],
  },
  {
    label: '奖项报名',
    children: [
      { label: '竞赛之星报名', path: '/awards/competition-star' },
      { label: '科研之星报名', path: '/awards/scientific-star' },
      { label: '双创之星报名', path: '/awards/innovation-star' },
    ],
  },
  {
    label: '审批与记录',
    children: [
      { label: '待审批信息', path: '/approval/pending' },
    ],
  },
]

// 找出当前路由所属的 section
const activeSection = computed<SectionConfig | null>(() => {
  const path = route.path
  return sections.find(s => s.children.some(c => path.startsWith(c.path))) ?? null
})

// 当前选中的 tab path
const activeTab = computed(() => route.path)

function isActive(section: SectionConfig): boolean {
  return activeSection.value?.label === section.label
}

function handleTabClick(path: string) {
  router.push(path)
}
</script>

<template>
  <Transition name="tab-slide">
    <aside
      v-if="activeSection && !appStore.isSidebarCollapsed"
      class="sidebar-tabs"
    >
      <!-- 区域标题 -->
      <div class="sidebar-tabs__header">
        <span class="sidebar-tabs__title">{{ activeSection.label }}</span>
      </div>

      <!-- Tab 列表 -->
      <nav class="sidebar-tabs__nav">
        <button
          v-for="tab in activeSection.children"
          :key="tab.path"
          class="sidebar-tabs__tab"
          :class="{ 'is-active': activeTab === tab.path }"
          @click="handleTabClick(tab.path)"
        >
          <span class="sidebar-tabs__tab-text">{{ tab.label }}</span>
        </button>
      </nav>
    </aside>
  </Transition>
</template>

<style scoped lang="scss">
.sidebar-tabs {
  position: fixed;
  top: 0;
  left: $sidebar-width;
  width: 200px;
  height: 100vh;
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
  z-index: 99;
  overflow: hidden;

  // 侧边栏折叠时隐藏
  .layout--collapsed & {
    left: $sidebar-collapsed-width;
  }

  &__header {
    height: 56px;
    display: flex;
    align-items: center;
    padding: 0 16px;
    border-bottom: 1px solid var(--el-border-color-light);
    flex-shrink: 0;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__nav {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__tab {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    margin: 0 8px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--el-text-color-secondary);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    width: auto;

    &:hover {
      background-color: var(--el-fill-color-light);
      color: var(--el-text-color-primary);
    }

    &.is-active {
      color: var(--el-color-primary);
      background-color: var(--el-color-primary-light-9);
      font-weight: 500;
    }

    &-text {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

// 滑入滑出动画
.tab-slide-enter-active,
.tab-slide-leave-active {
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.28s ease;
}

.tab-slide-enter-from,
.tab-slide-leave-to {
  transform: translateX(-16px);
  opacity: 0;
}
</style>
