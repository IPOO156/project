<script setup lang="ts">
/**
 * TeacherBreadcrumb - 教师端 / 管理员端顶栏面包屑
 *
 * 替代多标签栏：只展示「分组 / 当前页」，档案详情再补一层「学生档案」父级。
 * 分组与页面名取自教师端模块注册表，与侧栏同源，避免两处名称不一致。
 */
import { ChevronRight } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTeacherAuthz } from '@/shared/composables/useTeacherAuthz'

const route = useRoute()
const { menuGroups } = useTeacherAuthz()

const currentTitle = computed(() => (route.meta?.title as string) || '页面')

/** 档案详情归到「学生档案」入口下 */
const activePath = computed(() =>
  route.path.startsWith('/teacher/student-detail') ? '/teacher/archive-view' : route.path,
)

const activeEntry = computed(() => {
  for (const entry of menuGroups.value) {
    const item = entry.items.find((candidate) => candidate.path === activePath.value)
    if (item) return { group: entry.group.label, item }
  }
  return null
})

const groupLabel = computed(() => activeEntry.value?.group ?? '')

/** 详情页额外显示父级入口；列表页本身不再重复显示 */
const parentPath = computed(() => {
  if (!route.path.startsWith('/teacher/student-detail')) return ''
  return activeEntry.value?.item.path ?? ''
})

const parentLabel = computed(() => activeEntry.value?.item.label ?? '')

/** 工作台与消息中心不显示分组，减少无意义的层级 */
const showGroup = computed(
  () =>
    !!groupLabel.value &&
    activePath.value !== '/teacher/dashboard' &&
    !route.path.startsWith('/teacher/messages'),
)
</script>

<template>
  <nav class="teacher-crumb" aria-label="面包屑">
    <template v-if="showGroup">
      <span class="teacher-crumb__group">{{ groupLabel }}</span>
      <ChevronRight :size="13" class="teacher-crumb__sep" aria-hidden="true" />
    </template>

    <template v-if="parentPath && parentLabel !== currentTitle">
      <router-link :to="parentPath" class="teacher-crumb__link">{{ parentLabel }}</router-link>
      <ChevronRight :size="13" class="teacher-crumb__sep" aria-hidden="true" />
    </template>

    <span class="teacher-crumb__current" aria-current="page">{{ currentTitle }}</span>
  </nav>
</template>

<style scoped lang="scss">
.teacher-crumb {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);

  &__group {
    white-space: nowrap;
  }

  &__sep {
    flex-shrink: 0;
    color: var(--el-text-color-placeholder);
  }

  &__link {
    color: var(--el-text-color-secondary);
    text-decoration: none;
    white-space: nowrap;

    &:hover {
      color: var(--el-color-primary);
    }
  }

  &__current {
    color: var(--el-text-color-primary);
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
