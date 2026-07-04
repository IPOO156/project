<script setup lang="ts">
import type { NotificationCategory, NotificationStatus } from '@/shared/types/types'
import { Bell, CheckCheck, Filter, Mail, MailOpen, Search, Trash2, X } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/app/stores/stores'
import { NOTIFICATION_CATEGORY } from '@/shared/constants/dict'
import PageContainer from '@/shared/ui/PageContainer.vue'

/**
 * 消息中心通知页面
 * 采用蓝白配色的自定义卡片风格，与系统页面布局一致。
 */

const router = useRouter()
const notificationStore = useNotificationStore()

const keyword = ref('')
const categoryFilter = ref<NotificationCategory | ''>('')
const statusFilter = ref<NotificationStatus | ''>('')

const pageNum = ref(1)
const pageSize = ref(10)

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
  const map: Record<NotificationCategory, { backgroundColor: string; color: string }> = {
    system: { backgroundColor: 'rgba(30, 136, 229, 0.10)', color: '#1e88e5' },
    approval: { backgroundColor: 'rgba(255, 167, 38, 0.14)', color: '#f57c00' },
    activity: { backgroundColor: 'rgba(67, 160, 71, 0.12)', color: '#388e3c' },
    message: { backgroundColor: 'rgba(96, 125, 139, 0.12)', color: '#546e7a' },
  }
  return map[category] ?? { backgroundColor: 'rgba(30, 136, 229, 0.10)', color: '#1e88e5' }
}

function markAsRead(id: string) {
  notificationStore.markAsRead(id)
}

function deleteItem(id: string) {
  notificationStore.deleteNotification(id)
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
        <button
          type="button"
          class="mc-btn mc-btn--primary message-header__read-all"
          :disabled="notificationStore.unreadCount === 0"
          @click="markAllAsRead"
        >
          <CheckCheck :size="16" /> 一键已读
        </button>
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
        <button type="button" class="mc-btn mc-btn--secondary" @click="handleSearch">
          <Filter :size="14" /> 筛选
        </button>
        <button type="button" class="mc-btn mc-btn--ghost" @click="handleReset">
          <X :size="14" /> 重置
        </button>
      </div>
      <button type="button" class="mc-btn mc-btn--secondary" @click="navigateToActivities">
        <Mail :size="16" /> 查看动态记录
      </button>
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
}

.message-header {
  @include mc-fade-in;

  background: linear-gradient(135deg, var(--mc-card) 0%, var(--mc-cream) 100%);
  border: 1px solid var(--mc-border);
  border-radius: var(--mc-radius);
  padding: 28px 32px;
  box-shadow: var(--mc-shadow);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 20px;

  &__main {
    display: flex;
    align-items: center;
    gap: 18px;
  }

  &__icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: linear-gradient(135deg, var(--mc-wood) 0%, var(--mc-wood-light) 100%);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 6px 16px var(--mc-primary-shadow);
  }

  &__title {
    margin: 0;
    font-family: $mc-font-display;
    font-size: 26px;
    font-weight: 700;
    color: var(--mc-wood);
    letter-spacing: 1px;
  }

  &__subtitle {
    margin: 6px 0 0;
    font-size: 14px;
    color: var(--mc-text-secondary);
  }

  &__stats {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    min-width: 92px;
    padding: 12px 18px;
    background: #fff;
    border: 1px solid var(--mc-border);
    border-radius: 12px;

    &:first-child {
      border-color: rgba(30, 136, 229, 0.35);
      background: var(--mc-cream);
    }
  }

  &__stat-main {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--mc-wood);
  }

  &__stat-value {
    font-size: 22px;
    font-weight: 700;
    color: var(--mc-wood);
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
}

.mc-input-wrap {
  @include mc-input-wrap(240px);
}

.mc-select {
  @include mc-select(150px);
}

.mc-btn {
  &--primary {
    @include mc-btn-primary;
  }

  &--secondary {
    @include mc-btn-secondary;
  }

  &--ghost {
    @include mc-btn-ghost;
  }
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
  gap: 14px;
  padding: 16px 20px 16px 18px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid var(--mc-border);
  transition: all 0.25s ease;

  &:hover {
    box-shadow: var(--mc-shadow-hover);
    transform: translateY(-2px);
  }

  &__accent {
    position: absolute;
    left: 0;
    top: 14px;
    bottom: 14px;
    width: 3px;
    border-radius: 0 3px 3px 0;
    background: transparent;
    transition: background 0.25s ease;
  }

  &.is-unread {
    background: linear-gradient(135deg, var(--mc-cream) 0%, #ffffff 100%);
    border-color: rgba(30, 136, 229, 0.25);

    .message-card__accent {
      background: var(--mc-wood);
    }

    .message-card__title {
      color: var(--mc-wood);
      font-weight: 700;
    }

    .message-card__content {
      color: var(--mc-text);
    }
  }

  &__icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 2px;
  }

  &__main {
    flex: 1;
    min-width: 0;
  }

  &__header-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 4px;
  }

  &__category {
    flex-shrink: 0;
    padding: 2px 8px;
    border-radius: 6px;
    background: var(--mc-cream);
    color: var(--mc-wood);
    font-size: 12px;
    font-weight: 500;
  }

  &__title {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--mc-text);
    line-height: 1.5;
  }

  &__content {
    margin: 0 0 8px;
    font-size: 13px;
    color: var(--mc-text-secondary);
    line-height: 1.6;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 14px;
    font-size: 12px;
    color: var(--mc-text-secondary);
  }

  &__time {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  &__sender {
    padding-left: 12px;
    border-left: 1px solid var(--mc-border);
  }

  &__actions {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    padding-top: 2px;
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
      background: rgba(67, 160, 71, 0.12);
      color: var(--mc-sage);
    }
  }

  &--delete {
    color: #c45c5c;

    &:hover {
      background: rgba(196, 92, 92, 0.1);
      color: #c45c5c;
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
