<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import UiButton from '../../../components/ui/UiButton.vue'
import UiCard from '../../../components/ui/UiCard.vue'
import LineIcon from '../../../components/ui/LineIcon.vue'
import UiTag from '../../../components/ui/UiTag.vue'
import { getStudentArchiveCategory } from '../../student/nav'
import { statusMeta, useArchiveStore } from '../../student/archiveStore'

const route = useRoute()
const router = useRouter()

const { sortedRecords, updateRecord, fileSizeLabel } = useArchiveStore()

const tab = ref('pending')
const keyword = ref('')
const detailId = ref('')
const reviewComment = ref('')

watch(() => route.query.tab, (val) => {
  if (val === 'history' || val === 'pending') tab.value = val
})

const tabItems = computed(() => [
  { key: 'pending', label: '待审核', icon: 'clock', count: sortedRecords.value.filter(r => r.status === 'wait').length },
  { key: 'history', label: '审核记录', icon: 'receipt', count: sortedRecords.value.filter(r => r.status !== 'wait').length },
])

const reviews = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  return sortedRecords.value.filter(item => {
    const matchTab = tab.value === 'pending' ? item.status === 'wait' : item.status !== 'wait'
    const matchKeyword = !key || [item.title, item.organization, getStudentArchiveCategory(item.category)?.label]
      .some(v => String(v ?? '').toLowerCase().includes(key))
    return matchTab && matchKeyword
  })
})

const pendingCount = computed(() => sortedRecords.value.filter(r => r.status === 'wait').length)

function approve(item) {
  updateRecord(item.id, { status: 'ok', review: reviewComment.value || '审核通过，材料齐全，符合要求。' })
  detailId.value = ''
  reviewComment.value = ''
}

function reject(item) {
  const msg = reviewComment.value.trim()
  if (!msg) { alert('请输入驳回原因'); return }
  updateRecord(item.id, { status: 'no', review: msg })
  detailId.value = ''
  reviewComment.value = ''
}

const detailRecord = computed(() => sortedRecords.value.find(item => item.id === detailId.value))

function openDetail(item) {
  reviewComment.value = ''
  detailId.value = item.id
}
</script>

<template>
  <div class="reviewPage">
    <div class="pageHeader">
      <div>
        <h1 class="pageTitle">审核管理</h1>
        <p class="pageSub">
          共 <strong>{{ pendingCount }}</strong> 条待审核档案
        </p>
      </div>
      <div class="pageStats">
        <div class="statBadge">
          <span class="dot orange"></span>
          待审核 {{ tabItems[0].count }}
        </div>
        <div class="statBadge">
          <span class="dot green"></span>
          已通过 {{ sortedRecords.filter(r => r.status === 'ok').length }}
        </div>
        <div class="statBadge">
          <span class="dot red"></span>
          已驳回 {{ sortedRecords.filter(r => r.status === 'no').length }}
        </div>
      </div>
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
          <span class="tabCount" :data-tab="item.key">{{ item.count }}</span>
        </button>
      </div>
      <label class="searchBox">
        <LineIcon name="search" :size="16" />
        <input v-model="keyword" placeholder="搜索标题、分类、组织..." />
      </label>
    </div>

    <div class="list">
      <UiCard v-for="item in reviews" :key="item.id" padding="md" class="reviewCard" hoverable @click="openDetail(item)">
        <div class="cardTop">
          <div class="cardLeft">
            <div class="avatarIcon" :data-status="item.status">
              <LineIcon :name="getStudentArchiveCategory(item.category)?.icon ?? 'file'" :size="20" />
            </div>
            <div class="cardInfo">
              <h3 class="cardTitle">{{ item.title }}</h3>
              <div class="cardMeta">
                <span>{{ getStudentArchiveCategory(item.category)?.label }}</span>
                <span>·</span>
                <span>{{ item.organization }}</span>
                <span>·</span>
                <span>{{ item.date }}</span>
              </div>
            </div>
          </div>
          <div class="cardRight">
            <UiTag :tone="statusMeta[item.status].tone">{{ statusMeta[item.status].label }}</UiTag>
            <span class="fileCount">{{ item.files.length }} 份材料</span>
          </div>
        </div>
        <div v-if="item.review && tab === 'history'" class="reviewNote">
          <LineIcon name="edit" :size="13" />
          {{ item.review }}
        </div>
      </UiCard>

      <UiCard v-if="reviews.length === 0" padding="lg" class="empty">
        <LineIcon name="check" :size="28" />
        <div>
          <strong>{{ tab === 'pending' ? '暂无待审核档案' : '暂无审核记录' }}</strong>
          <p>{{ tab === 'pending' ? '所有档案已审核完毕。' : '还没有审核记录。' }}</p>
        </div>
      </UiCard>
    </div>

    <!-- 审核详情抽屉 -->
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
          <span>{{ detailRecord.semester }}</span>
        </div>

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

        <section v-if="detailRecord.status !== 'wait'" class="detailSection">
          <h3>审核意见</h3>
          <p class="reviewText">{{ detailRecord.review }}</p>
        </section>

        <section v-if="detailRecord.status === 'wait'" class="detailSection reviewSection">
          <h3>审核操作</h3>
          <div class="reviewBox">
            <label class="reviewLabel">审核意见</label>
            <textarea
              v-model="reviewComment"
              class="reviewInput"
              rows="3"
              placeholder="输入审核意见，或留空使用默认通过语..."
            ></textarea>
            <div class="reviewActions">
              <UiButton variant="ghost" @click="detailId = ''; reviewComment = ''">取消</UiButton>
              <UiButton variant="danger" @click="reject(detailRecord)">驳回</UiButton>
              <UiButton @click="approve(detailRecord)">审核通过</UiButton>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reviewPage {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.pageHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
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

.pageSub strong {
  color: var(--accent);
}

.pageStats {
  display: flex;
  gap: 16px;
}

.statBadge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--muted);
  font-weight: 600;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot.green { background: var(--success); }
.dot.orange { background: var(--warning); }
.dot.red { background: var(--danger); }

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

.tabItem:hover { background: var(--bg); color: var(--text); }
.tabItem.active { background: var(--accent-light); color: var(--accent); }

.tabCount {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--bg);
  color: var(--muted);
}

.tabCount[data-tab='pending'] { background: var(--warning-light); color: #b45309; }
.tabCount[data-tab='history'] { background: var(--accent-light); color: var(--accent); }

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
  gap: 10px;
}

.reviewCard {
  cursor: pointer;
  transition: all var(--transition);
}

.reviewCard:hover {
  border-color: var(--accent);
  box-shadow: var(--shadow);
}

.cardTop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.cardLeft {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  flex: 1;
}

.avatarIcon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--accent-light);
  color: var(--accent);
}

.avatarIcon[data-status='no'] { background: var(--danger-light); color: var(--danger); }
.avatarIcon[data-status='ok'] { background: var(--success-light); color: var(--success); }

.cardInfo { flex: 1; min-width: 0; }

.cardTitle {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cardMeta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--muted);
}

.cardRight {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.fileCount {
  font-size: 12px;
  color: var(--muted);
  font-weight: 600;
}

.reviewNote {
  margin-top: 12px;
  padding: 10px 12px;
  background: #f8fafb;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 13px;
  color: var(--muted);
  display: flex;
  align-items: flex-start;
  gap: 8px;
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
  margin-bottom: 2px;
}

.modalLayer {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  justify-items: end;
  padding: 24px;
  background: rgba(10, 32, 41, 0.35);
}

.drawer {
  width: min(620px, 100%);
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

.modalHead h2 { font-size: 18px; line-height: 1.35; }

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

.detailSection h3 { font-size: 14px; margin-bottom: 8px; }

.fileList { display: grid; gap: 8px; }

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

.fileRow small { color: var(--muted); }

.reviewText {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
}

.reviewBox {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reviewLabel {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
}

.reviewInput {
  min-height: 80px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: #f8fafb;
  color: var(--text);
  outline: none;
  resize: vertical;
  font-size: 14px;
}

.reviewInput:focus {
  border-color: var(--accent);
  background: var(--panel);
}

.reviewActions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 768px) {
  .cardTop {
    flex-direction: column;
    align-items: flex-start;
  }

  .pageStats {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
