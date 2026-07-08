<script setup lang="ts">
import type { NotificationCategory, NotificationStatus } from '@/shared/types/types'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Bell, CheckCheck, Filter, Mail, MailOpen, Search, Trash2, X } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore, useThemeStore } from '@/app/stores/stores'
import { NOTIFICATION_CATEGORY } from '@/shared/constants/dict'
import PageContainer from '@/shared/ui/PageContainer.vue'

/**
 * 消息中心通知页面
 * 采用蓝白配色的自定义卡片风格，与系统页面布局一致。
 */

const router = useRouter()
const notificationStore = useNotificationStore()
const themeStore = useThemeStore()

const keyword = ref('')
const categoryFilter = ref<NotificationCategory | ''>('')
const statusFilter = ref<NotificationStatus | ''>('')

const pageNum = ref(1)
const pageSize = ref(10)

// ─── 批量操作 ───
const batchMode = ref(false)
const selectedIds = ref<string[]>([])

function toggleSelect(id: string) {
  const idx = selectedIds.value.indexOf(id)
  if (idx > -1) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
}

function handleBatchRead() {
  selectedIds.value.forEach((id) => notificationStore.markAsRead(id))
  selectedIds.value = []
  batchMode.value = false
}

function handleBatchDelete() {
  ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.length} 条通知吗？`, '批量删除确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      selectedIds.value.forEach((id) => notificationStore.deleteNotification(id))
      selectedIds.value = []
      batchMode.value = false
      ElMessage.success('已删除')
    })
    .catch(() => {})
}

function handleCancelBatchMode() {
  batchMode.value = false
  selectedIds.value = []
}

// ─── 卡片逐行刷入动画触发 ───
// 通过改变 key 强制消息列表重新渲染，使 CSS animation 在每次数据加载、筛选、分页变化时重新触发
const listKey = ref(0)

function bumpListAnimation() {
  listKey.value++
}

watch(
  () => notificationStore.loading,
  (loading) => {
    if (!loading) {
      bumpListAnimation()
    }
  },
)

watch(
  [pageNum, pageSize],
  () => {
    bumpListAnimation()
  },
  { flush: 'post' },
)

const categoryOptions = computed(() => [
  { value: '', label: '全部分类' },
  ...Object.entries(NOTIFICATION_CATEGORY).map(([value, config]) => ({
    value,
    label: config.label,
  })),
])

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'unread', label: '未读' },
  { value: 'read', label: '已读' },
]

const stats = computed(() => [
  {
    label: '未读消息',
    value: notificationStore.unreadCount,
    icon: Mail,
  },
  {
    label: '消息总数',
    value: notificationStore.notifications.length,
    icon: Bell,
  },
])

const paginatedList = computed(() => {
  const start = (pageNum.value - 1) * pageSize.value
  return notificationStore.filteredNotifications.slice(start, start + pageSize.value)
})

const total = computed(() => notificationStore.filteredNotifications.length)

function handleSearch() {
  pageNum.value = 1
  notificationStore.fetchNotifications({
    keyword: keyword.value || undefined,
    category: categoryFilter.value || undefined,
    status: statusFilter.value || undefined,
  })
}

function handleReset() {
  keyword.value = ''
  categoryFilter.value = ''
  statusFilter.value = ''
  pageNum.value = 1
  notificationStore.fetchNotifications()
}

function handlePageChange(page: number) {
  pageNum.value = page
}

function handleSizeChange(size: number) {
  pageSize.value = size
  pageNum.value = 1
}

function categoryLabel(category: NotificationCategory) {
  return NOTIFICATION_CATEGORY[category]?.label ?? category
}

function categoryStyle(category: NotificationCategory) {
  const lightMap: Record<NotificationCategory, { backgroundColor: string; color: string }> = {
    system: { backgroundColor: 'rgba(30, 136, 229, 0.10)', color: '#1e88e5' },
    approval: { backgroundColor: 'rgba(255, 167, 38, 0.14)', color: '#f57c00' },
    activity: { backgroundColor: 'rgba(67, 160, 71, 0.12)', color: '#388e3c' },
    message: { backgroundColor: 'rgba(96, 125, 139, 0.12)', color: '#546e7a' },
  }
  const darkMap: Record<NotificationCategory, { backgroundColor: string; color: string }> = {
    system: { backgroundColor: 'rgba(96, 165, 250, 0.15)', color: '#93c5fd' },
    approval: { backgroundColor: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24' },
    activity: { backgroundColor: 'rgba(74, 222, 128, 0.15)', color: '#4ade80' },
    message: { backgroundColor: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8' },
  }
  const map = themeStore.isDark ? darkMap : lightMap
  return map[category] ?? lightMap.system
}

function markAsRead(id: string) {
  notificationStore.markAsRead(id)
}

function deleteItem(id: string) {
  ElMessageBox.confirm('确定删除该通知吗？', '删除确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      notificationStore.deleteNotification(id)
      ElMessage.success('已删除')
    })
    .catch(() => {})
}

function markAllAsRead() {
  if (notificationStore.unreadCount === 0) return
  notificationStore.markAllAsRead()
}

function navigateToActivities() {
  router.push('/messages/activities')
}

onMounted(() => {
  notificationStore.fetchNotifications()
})
</script>

<template>
  <PageContainer class="message-center">
    <!-- 页面标题区 -->
    <header class="message-header">
      <div class="message-header__main">
        <div class="message-header__icon">
          <Bell :size="28" />
        </div>
        <div>
          <h1 class="message-header__title">消息中心</h1>
          <p class="message-header__subtitle">集中查看系统通知、审批提醒与动态记录</p>
        </div>
      </div>

      <div class="message-header__stats">
        <div v-for="stat in stats" :key="stat.label" class="message-header__stat">
          <div class="message-header__stat-main">
            <component :is="stat.icon" :size="18" />
            <span class="message-header__stat-value">{{ stat.value }}</span>
          </div>
          <span class="message-header__stat-label">{{ stat.label }}</span>
        </div>
        <el-button
          type="primary"
          :disabled="notificationStore.unreadCount === 0"
          @click="markAllAsRead"
        >
          <CheckCheck :size="16" style="margin-right: 4px" />一键已读
        </el-button>
      </div>
    </header>

    <!-- 工具栏 -->
    <div class="panel-toolbar">
      <div class="panel-toolbar__filters">
        <div class="mc-input-wrap">
          <Search :size="16" class="mc-input-wrap__icon" />
          <el-input
            v-model="keyword"
            placeholder="搜索通知标题或内容"
            clearable
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
        </div>
        <el-select
          v-model="categoryFilter"
          placeholder="全部分类"
          clearable
          class="mc-select"
          @change="handleSearch"
        >
          <el-option
            v-for="opt in categoryOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-select
          v-model="statusFilter"
          placeholder="全部状态"
          clearable
          class="mc-select"
          @change="handleSearch"
        >
          <el-option
            v-for="opt in statusOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-button type="primary" size="default" @click="handleSearch">
          <Filter :size="14" style="margin-right: 4px" />筛选
        </el-button>
        <el-button @click="handleReset"> <X :size="14" style="margin-right: 4px" />重置 </el-button>
      </div>

      <div class="panel-toolbar__batch">
        <el-button v-if="!batchMode" size="small" @click="batchMode = true"> 批量操作 </el-button>
        <template v-else>
          <span class="panel-toolbar__batch-count">已选 {{ selectedIds.length }} 条</span>
          <el-button size="small" @click="handleCancelBatchMode">取消</el-button>
          <el-button
            size="small"
            type="primary"
            :disabled="selectedIds.length === 0"
            @click="handleBatchRead"
          >
            批量已读
          </el-button>
          <el-button
            size="small"
            type="danger"
            :disabled="selectedIds.length === 0"
            @click="handleBatchDelete"
          >
            批量删除
          </el-button>
        </template>
      </div>

      <el-button @click="navigateToActivities">
        <Mail :size="16" style="margin-right: 4px" />查看动态记录
      </el-button>
    </div>

    <!-- 通知列表 -->
    <div
      :key="listKey"
      v-loading="notificationStore.loading"
      class="mc-card message-list message-list--staggered"
    >
      <div
        v-for="item in paginatedList"
        :key="item.id"
        class="message-card"
        :class="{ 'is-unread': !item.isRead }"
      >
        <label v-if="batchMode" class="message-card__checkbox">
          <input
            type="checkbox"
            :checked="selectedIds.includes(item.id)"
            @change="toggleSelect(item.id)"
          />
        </label>
        <div class="message-card__accent" />
        <div class="message-card__icon" :style="categoryStyle(item.category)">
          <Mail :size="20" />
        </div>

        <div class="message-card__main">
          <div class="message-card__header-row">
            <span class="message-card__category">{{ categoryLabel(item.category) }}</span>
            <h3 class="message-card__title">{{ item.title }}</h3>
          </div>
          <p class="message-card__content">{{ item.content }}</p>
          <div class="message-card__meta">
            <span class="message-card__time">
              <MailOpen v-if="item.isRead" :size="12" />
              <Mail v-else :size="12" />
              {{ item.createdAt }}
            </span>
            <span v-if="item.sender" class="message-card__sender">来自：{{ item.sender }}</span>
          </div>
        </div>

        <div class="message-card__actions">
          <el-tooltip v-if="!item.isRead" content="标为已读" placement="top">
            <button
              type="button"
              class="action-icon action-icon--read"
              @click="markAsRead(item.id)"
            >
              <MailOpen :size="16" />
            </button>
          </el-tooltip>
          <el-tooltip content="删除" placement="top">
            <button
              type="button"
              class="action-icon action-icon--delete"
              @click="deleteItem(item.id)"
            >
              <Trash2 :size="16" />
            </button>
          </el-tooltip>
        </div>
      </div>

      <div v-if="paginatedList.length > 0" class="mc-pagination">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>

      <el-empty
        v-else-if="!notificationStore.loading"
        description="暂无通知消息"
        class="mc-empty"
      />
    </div>
  </PageContainer>
</template>

<style scoped lang="scss">
@use './styles/theme' as *;

.message-center {
  @include message-theme-vars;

  font-family: $mc-font-body;
  color: var(--mc-text);
  user-select: none;
}

.message-header {
  @include mc-fade-in;

  background: var(--mc-card);
  border: 1px solid var(--mc-border);
  border-radius: var(--mc-radius);
  padding: 24px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 16px;

  &__main {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    background: var(--el-color-primary);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__title {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  &__subtitle {
    margin: 4px 0 0;
    font-size: 14px;
    color: var(--mc-text-secondary);
  }

  &__stats {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  &__stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    min-width: 80px;
    padding: 10px 14px;
    background: var(--mc-bg);
    border: 1px solid var(--mc-border);
    border-radius: 8px;
  }

  &__stat-main {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #1e3a5f;
  }

  &__stat-value {
    font-size: 20px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  &__stat-label {
    font-size: 12px;
    color: var(--mc-text-secondary);
  }

  &__read-all {
    align-self: stretch;
  }
}

.panel-toolbar {
  @include mc-fade-in(0.1s);

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;

  &__filters {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__batch {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__batch-count {
    font-size: 13px;
    color: var(--mc-text-secondary);
  }
}

.mc-input-wrap {
  @include mc-input-wrap(240px);
}

.mc-select {
  @include mc-select(150px);
}

.mc-card {
  @include mc-card;
}

.mc-pagination {
  @include mc-pagination;
}

.mc-empty {
  @include mc-empty;
}

.message-list {
  @include mc-fade-in(0.15s);

  display: flex;
  flex-direction: column;
  gap: 12px;

  &--staggered {
    --mc-row-duration: 0.5s;
    --mc-row-delay: 0.07s;
    --mc-row-offset: -40px;

    @include list-item-staggered(50);
  }
}

.message-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 8px;
  background: var(--mc-card);
  border: 1px solid var(--mc-border);
  transition:
    box-shadow 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    border-color: #d4a574;
  }

  &.is-unread {
    background: var(--el-fill-color-light);
    border-color: var(--el-border-color);

    .message-card__title {
      color: var(--el-color-primary);
      font-weight: 600;
    }
  }

  &__icon {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1px;
  }

  &__main {
    flex: 1;
    min-width: 0;
  }

  &__header-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 2px;
  }

  &__category {
    flex-shrink: 0;
    padding: 1px 7px;
    border-radius: 4px;
    background: var(--mc-bg);
    color: var(--mc-text-secondary);
    font-size: 11px;
    font-weight: 500;
  }

  &__title {
    margin: 0;
    font-size: 14px;
    font-weight: 500;
    color: var(--mc-text);
    line-height: 1.5;
  }

  &__content {
    margin: 0 0 6px;
    font-size: 13px;
    color: var(--mc-text-secondary);
    line-height: 1.5;
  }

  &__checkbox {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding-top: 2px;

    input[type='checkbox'] {
      width: 16px;
      height: 16px;
      accent-color: var(--el-color-primary);
      cursor: pointer;
    }
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    color: var(--mc-text-secondary);
  }

  &__time {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  &__sender {
    padding-left: 10px;
    border-left: 1px solid var(--mc-border);
  }

  &__actions {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.action-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--mc-text-secondary);
  background: transparent;

  &:hover {
    background: var(--mc-bg);
    color: var(--mc-wood);
  }

  &--read {
    color: var(--mc-sage);

    &:hover {
      background: var(--mc-sage-fade);
      color: var(--mc-sage);
    }
  }

  &--delete {
    color: var(--mc-danger);

    &:hover {
      background: var(--mc-danger-fade);
      color: var(--mc-danger);
    }
  }
}

@media (max-width: 768px) {
  .message-header {
    padding: 20px;

    &__title {
      font-size: 22px;
    }

    &__stats {
      width: 100%;
    }

    &__read-all {
      flex: 1;
      justify-content: center;
    }
  }

  .panel-toolbar {
    flex-direction: column;
    align-items: stretch;

    &__filters {
      width: 100%;
    }
  }

  .mc-input-wrap,
  .mc-select {
    width: 100%;
  }

  .message-card {
    flex-direction: column;

    &__actions {
      width: 100%;
      justify-content: flex-end;
      padding-top: 10px;
      border-top: 1px solid var(--mc-border);
    }
  }
}
</style>
