<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import UiButton from '../../../components/ui/UiButton.vue'
import UiCard from '../../../components/ui/UiCard.vue'
import LineIcon from '../../../components/ui/LineIcon.vue'
import UiTag from '../../../components/ui/UiTag.vue'
import { getStudentArchiveCategory } from '../nav'
import { statusMeta, useArchiveStore } from '../archiveStore'

const router = useRouter()
const { sortedRecords, resubmitRecord, fileSizeLabel } = useArchiveStore()

const tab = ref('wait')
const keyword = ref('')
const detailId = ref('')

const tabItems = computed(() => [
  { key: 'wait', label: '待审核', icon: 'clock', count: sortedRecords.value.filter((item) => item.status === 'wait').length },
  { key: 'ok', label: '已通过', icon: 'check', count: sortedRecords.value.filter((item) => item.status === 'ok').length },
  { key: 'no', label: '已驳回', icon: 'close', count: sortedRecords.value.filter((item) => item.status === 'no').length },
])

const filteredSubmissions = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  return sortedRecords.value.filter((item) => {
    const category = getStudentArchiveCategory(item.category)?.label ?? ''
    const matchesTab = item.status === tab.value
    const matchesKeyword =
      !key ||
      [item.title, item.organization, item.review, category].some((value) =>
        String(value ?? '').toLowerCase().includes(key),
      )
    return matchesTab && matchesKeyword
  })
})

const detailRecord = computed(() => sortedRecords.value.find((item) => item.id === detailId.value))

function createSubmission() {
  router.push('/student/archive/honor?new=1')
}

function openArchive(item) {
  router.push(`/student/archive/${item.category}?view=${item.id}`)
}
</script>

<template>
  <div class="submissionsPage">
    <div class="pageHeader">
      <div>
        <h1 class="pageTitle">提交记录</h1>
        <p class="pageSub">查看审核进度、审核意见，并处理被驳回的材料。</p>
      </div>
      <UiButton variant="primary" size="sm" @click="createSubmission">
        <LineIcon name="plus" :size="14" />
        新建提交
      </UiButton>
    </div>

    <div class="toolbar">
      <div class="tabs">
        <button
          v-for="item in tabItems"
          :key="item.key"
          class="tabItem"
          :class="{ active: tab === item.key }"
          type="button"
          @click="tab = item.key"
        >
          <LineIcon :name="item.icon" :size="16" />
          {{ item.label }}
          <span class="tabCount" :data-status="item.key">{{ item.count }}</span>
        </button>
      </div>
      <label class="searchBox">
        <LineIcon name="search" :size="16" />
        <input v-model="keyword" placeholder="搜索标题、组织或审核意见" />
      </label>
    </div>

    <div class="list">
      <UiCard
        v-for="item in filteredSubmissions"
        :key="item.id"
        padding="md"
        class="listItem"
        hoverable
      >
        <div class="itemIcon" :data-status="item.status">
          <LineIcon :name="getStudentArchiveCategory(item.category)?.icon ?? 'file'" :size="22" />
        </div>
        <div class="itemContent">
          <h3 class="itemTitle">{{ item.title }}</h3>
          <div class="itemMeta">
            <span>{{ getStudentArchiveCategory(item.category)?.label }}</span>
            <span>{{ item.date }}</span>
            <span>{{ item.files.length }} 份材料</span>
          </div>
          <div v-if="item.status === 'no'" class="itemReason">
            <LineIcon name="close" :size="12" />
            驳回原因：{{ item.review }}
          </div>
        </div>
        <div class="itemActions">
          <UiTag :tone="statusMeta[item.status].tone">{{ statusMeta[item.status].label }}</UiTag>
          <UiButton variant="ghost" size="sm" @click="detailId = item.id">查看</UiButton>
          <UiButton v-if="item.status === 'no'" variant="secondary" size="sm" @click="resubmitRecord(item.id)">重新提交</UiButton>
        </div>
      </UiCard>

      <UiCard v-if="filteredSubmissions.length === 0" padding="lg" class="empty">
        <LineIcon name="search" :size="28" />
        <div>
          <strong>暂无匹配提交</strong>
          <p>切换状态或修改关键词后再试。</p>
        </div>
      </UiCard>
    </div>

    <div v-if="detailRecord" class="modalLayer" role="dialog" aria-modal="true">
      <div class="drawer">
        <div class="modalHead">
          <h2>{{ detailRecord.title }}</h2>
          <button class="closeBtn" type="button" aria-label="关闭" @click="detailId = ''">×</button>
        </div>
        <div class="detailMeta">
          <UiTag :tone="statusMeta[detailRecord.status].tone">{{ statusMeta[detailRecord.status].label }}</UiTag>
          <span>{{ getStudentArchiveCategory(detailRecord.category)?.label }}</span>
          <span>{{ detailRecord.organization }}</span>
          <span>{{ detailRecord.date }}</span>
        </div>
        <section class="detailSection">
          <h3>审核意见</h3>
          <p>{{ detailRecord.review }}</p>
        </section>
        <section class="detailSection">
          <h3>附件材料</h3>
          <div class="fileList">
            <div v-for="file in detailRecord.files" :key="file.name" class="fileRow">
              <LineIcon name="file" :size="15" />
              <span>{{ file.name }}</span>
              <small>{{ fileSizeLabel(file.size) }}</small>
            </div>
          </div>
        </section>
        <div class="modalFoot">
          <UiButton variant="secondary" @click="openArchive(detailRecord)">打开档案</UiButton>
          <UiButton v-if="detailRecord.status === 'no'" @click="resubmitRecord(detailRecord.id)">重新提交</UiButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.submissionsPage {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.pageHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.pageTitle {
  font-size: 24px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: 0;
  margin-bottom: 4px;
}

.pageSub {
  font-size: 14px;
  color: var(--muted);
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.tabs {
  display: flex;
  gap: 6px;
  padding: 5px;
  background: var(--panel);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}

.tabItem {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 13px;
  border: none;
  background: transparent;
  color: var(--muted);
  font-size: 14px;
  font-weight: 600;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all var(--transition);
}

.tabItem:hover {
  background: var(--bg);
  color: var(--text);
}

.tabItem.active {
  background: var(--accent-light);
  color: var(--accent);
}

.tabCount {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--bg);
  color: var(--muted);
}

.tabCount[data-status='wait'] {
  background: var(--warning-light);
  color: #b45309;
}

.tabCount[data-status='ok'] {
  background: var(--success-light);
  color: #047857;
}

.tabCount[data-status='no'] {
  background: var(--danger-light);
  color: #b91c1c;
}

.searchBox {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: min(320px, 100%);
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--panel);
  color: var(--muted);
}

.searchBox input {
  min-width: 0;
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.listItem {
  display: flex;
  align-items: center;
  gap: 16px;
}

.itemIcon {
  width: 46px;
  height: 46px;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #f8fafb;
  border: 1px solid var(--border);
  color: var(--accent);
}

.itemIcon[data-status='wait'] {
  color: #b45309;
}

.itemIcon[data-status='no'] {
  color: #b91c1c;
}

.itemContent {
  flex: 1;
  min-width: 0;
}

.itemTitle {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.itemMeta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: var(--muted);
}

.itemReason {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 8px 10px;
  background: var(--danger-light);
  color: #b91c1c;
  font-size: 12px;
  font-weight: 500;
  border-radius: var(--radius);
}

.itemActions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.empty {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--muted);
}

.empty strong {
  display: block;
  color: var(--text);
}

.modalLayer {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  justify-items: end;
  padding: 24px;
  background: rgba(15, 23, 42, 0.28);
}

.drawer {
  width: min(560px, 100%);
  height: calc(100vh - 48px);
  overflow: auto;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 20px;
}

.modalHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.modalHead h2 {
  font-size: 18px;
  line-height: 1.35;
}

.closeBtn {
  width: 34px;
  height: 34px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--panel);
  cursor: pointer;
  font-size: 22px;
  line-height: 1;
}

.detailMeta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  color: var(--muted);
  font-size: 13px;
}

.detailSection {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid var(--border);
}

.detailSection h3 {
  font-size: 14px;
  margin-bottom: 8px;
}

.detailSection p {
  color: var(--muted);
}

.fileList {
  display: grid;
  gap: 8px;
}

.fileRow {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: #f8fafb;
}

.fileRow span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fileRow small {
  color: var(--muted);
}

.modalFoot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

@media (max-width: 768px) {
  .listItem {
    flex-direction: column;
    align-items: flex-start;
  }

  .itemActions {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
  }
}
</style>
