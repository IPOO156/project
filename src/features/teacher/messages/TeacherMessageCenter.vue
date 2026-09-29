<script setup lang="ts">
import type { MessageCategory, MessageItem } from '@/shared/types/teacher'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Archive, Check, Eye, Inbox, RefreshCw, Search } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useTeacherMessageStore } from '@/app/stores/stores'
import { NOTIFICATION_CATEGORY } from '@/shared/constants/dict'
import { formatDateTime } from '@/shared/utils/time'

/**
 * 教师端消息中心
 * 数据来源：/teacher/messages（列表/已读/归档），由 teacherMessage Store 承载，
 * 与 HeaderBar 铃铛共用同一份 unreadCount。
 * 说明：教师端仅提供「已读/归档」，无删除能力（后端无 DELETE 端点）。
 */

const store = useTeacherMessageStore()

// ── 视图 / 筛选 ──
const viewMode = ref<'inbox' | 'archived'>('inbox')
const category = ref<MessageCategory | 'all'>('all')
const keyword = ref('')
const page = ref(1)
const perPage = ref(20)
let keywordTimer = 0

const categoryOptions = computed(() => [
  { value: 'all', label: '全部类型' },
  ...Object.entries(NOTIFICATION_CATEGORY).map(([value, meta]) => ({
    value,
    label: meta.label,
  })),
])

function isArchivedValue(): number {
  return viewMode.value === 'archived' ? 1 : 0
}

function buildParams() {
  return {
    page: page.value,
    perPage: perPage.value,
    category: category.value,
    isArchived: isArchivedValue(),
    keyword: keyword.value.trim(),
  }
}

async function loadList() {
  await store.fetchList(buildParams())
}

function handleSearch() {
  page.value = 1
  void loadList()
}

function switchView(mode: string | number | boolean | undefined) {
  if (mode === 'inbox' || mode === 'archived') {
    viewMode.value = mode
  }
  page.value = 1
  void loadList()
}

function onKeywordInput() {
  window.clearTimeout(keywordTimer)
  keywordTimer = window.setTimeout(() => handleSearch(), 300)
}

function categoryTagType(item: MessageItem): 'success' | 'warning' | 'danger' | 'info' {
  const color = NOTIFICATION_CATEGORY[item.category as MessageCategory]?.color ?? 'info'
  if (color === 'primary') return 'info'
  return color as 'success' | 'warning' | 'danger' | 'info'
}

function categoryLabel(item: MessageItem): string {
  return (
    item.categoryLabel ||
    NOTIFICATION_CATEGORY[item.category as MessageCategory]?.label ||
    item.category
  )
}

function isImportant(item: MessageItem): boolean {
  return item.isImportant === 1
}

function fmtTime(value: string | null | undefined): string {
  return formatDateTime(value)
}

// ── 操作 ──
async function handleRead(item: MessageItem) {
  const ok = await store.markRead(item.id)
  if (ok) ElMessage.success('已标记为已读')
}

async function handleArchive(item: MessageItem) {
  if (isImportant(item)) {
    const confirmed = await confirmArchive()
    if (!confirmed) return
  }
  const ok = await store.archive(item.id)
  if (ok) ElMessage.success('已归档')
}

function confirmArchive(): Promise<boolean> {
  return ElMessageBox.confirm(
    '这是一条重要消息，归档后可在「已归档」视图中查看。确定归档吗？',
    '归档确认',
    { confirmButtonText: '归档', cancelButtonText: '取消', type: 'warning' },
  )
    .then(() => true)
    .catch(() => false)
}

// ── 详情 ──
const detailVisible = ref(false)
const activeMessage = ref<MessageItem | null>(null)

function openDetail(item: MessageItem) {
  activeMessage.value = item
  detailVisible.value = true
  if (item.isRead !== 1) {
    void store.markRead(item.id)
  }
}

function openLink(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

onMounted(() => void loadList())
</script>

<template>
  <div class="mc-page">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <h2 class="mc-page-head__title">消息中心</h2>
        <p class="mc-page-head__desc">
          接收审核反馈、系统通知与动态提醒。打开详情自动标记为已读，重要消息归档前需二次确认。
        </p>
      </div>
    </div>

    <div class="mc-filter-bar mc-filter-bar--msg">
      <div class="msg-tabs">
        <el-radio-group v-model="viewMode" @change="switchView">
          <el-radio-button value="inbox">
            <el-icon><Inbox :size="14" /></el-icon>&nbsp;收件箱
          </el-radio-button>
          <el-radio-button value="archived">已归档</el-radio-button>
        </el-radio-group>
      </div>
      <el-form inline @submit.prevent>
        <el-form-item label="类型">
          <el-select v-model="category" style="width: 130px" @change="handleSearch">
            <el-option
              v-for="opt in categoryOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="keyword"
            placeholder="标题 / 内容"
            clearable
            style="width: 200px"
            @input="onKeywordInput"
            @clear="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="RefreshCw" @click="handleSearch">刷新</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="mc-card">
      <div class="mc-card__head">
        <span class="mc-card__title">{{ viewMode === 'inbox' ? '收件箱' : '已归档' }}</span>
        <span class="msg-count">{{ store.total }} 条</span>
      </div>
      <div class="mc-card__body">
        <el-table v-loading="store.loading" :data="store.list" stripe>
          <el-table-column label="类型" width="110">
            <template #default="{ row }">
              <el-tag :type="categoryTagType(row as MessageItem)" size="small" effect="light">
                {{ categoryLabel(row as MessageItem) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="标题 / 内容" min-width="300">
            <template #default="{ row }">
              <div
                class="msg-row"
                :class="{ 'msg-row--unread': (row as MessageItem).isRead !== 1 }"
              >
                <span class="msg-row__title">
                  <i v-if="(row as MessageItem).isImportant === 1" class="msg-row__pin">重</i>
                  {{ (row as MessageItem).title }}
                </span>
                <span class="msg-row__content">{{ (row as MessageItem).content }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="时间" width="150">
            <template #default="{ row }">{{ fmtTime((row as MessageItem).createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="190" align="center" fixed="right">
            <template #default="{ row }">
              <el-button
                text
                type="primary"
                size="small"
                :icon="Eye"
                @click="openDetail(row as MessageItem)"
              >
                详情
              </el-button>
              <el-button
                v-if="(row as MessageItem).isRead !== 1"
                text
                size="small"
                :icon="Check"
                @click="handleRead(row as MessageItem)"
              >
                已读
              </el-button>
              <el-button
                v-if="viewMode === 'inbox'"
                text
                type="warning"
                size="small"
                :icon="Archive"
                @click="handleArchive(row as MessageItem)"
              >
                归档
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="msg-pagination">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="perPage"
            :total="store.total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @current-change="loadList"
            @size-change="handleSearch"
          />
        </div>
      </div>
    </div>

    <!-- 消息详情 -->
    <el-dialog v-model="detailVisible" title="消息详情" width="560px" append-to-body>
      <template v-if="activeMessage">
        <div class="msg-detail__head">
          <el-tag :type="categoryTagType(activeMessage)" size="small" effect="light">
            {{ categoryLabel(activeMessage) }}
          </el-tag>
          <el-tag v-if="activeMessage.isImportant === 1" type="danger" size="small" effect="light"
            >重要</el-tag
          >
          <span class="msg-detail__time">{{ fmtTime(activeMessage.createdAt) }}</span>
        </div>
        <h3 class="msg-detail__title">{{ activeMessage.title }}</h3>
        <p class="msg-detail__content">{{ activeMessage.content }}</p>
        <div v-if="activeMessage.deadline" class="msg-detail__deadline">
          截止时间：{{ fmtTime(activeMessage.deadline) }}
        </div>
      </template>
      <template #footer>
        <el-button
          v-if="activeMessage?.jumpUrl"
          type="primary"
          plain
          @click="openLink(activeMessage!.jumpUrl!)"
        >
          查看相关内容
        </el-button>
        <el-button type="primary" @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.mc-filter-bar--msg {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: $spacing-md;
}

.msg-tabs {
  padding-top: 2px;
}

.msg-count {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.msg-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  &--unread .msg-row__title {
    color: $color-text-primary;
    font-weight: 600;
  }

  &__title {
    color: var(--el-text-color-regular);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__content {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__pin {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 16px;
    height: 16px;
    margin-right: 4px;
    padding: 0 3px;
    border-radius: 3px;
    background: $color-danger;
    color: #fff;
    font-size: 11px;
    font-style: normal;
  }
}

.msg-pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: $spacing-lg;
}

.msg-detail {
  &__head {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-sm;
  }

  &__time {
    margin-left: auto;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__title {
    margin: 0 0 $spacing-sm;
    font-size: 16px;
    color: $color-text-primary;
  }

  &__content {
    margin: 0;
    font-size: 14px;
    line-height: 1.7;
    color: var(--el-text-color-regular);
    white-space: pre-wrap;
    word-break: break-word;
  }

  &__deadline {
    margin-top: $spacing-md;
    font-size: 13px;
    color: $color-danger;
  }
}
</style>
