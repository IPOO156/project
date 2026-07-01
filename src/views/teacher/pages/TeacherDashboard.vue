<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import UiButton from '../../../components/ui/UiButton.vue'
import UiCard from '../../../components/ui/UiCard.vue'
import LineIcon from '../../../components/ui/LineIcon.vue'
import UiTag from '../../../components/ui/UiTag.vue'
import { getStudentArchiveCategory, studentArchiveCategories } from '../../student/nav'
import { statusMeta, useArchiveStore } from '../../student/archiveStore'

const router = useRouter()
const { records, sortedRecords, stats } = useArchiveStore()

const categoryStats = computed(() =>
  studentArchiveCategories.map(cat => {
    const items = records.value.filter(r => r.category === cat.key)
    return {
      ...cat,
      total: items.length,
      wait: items.filter(r => r.status === 'wait').length,
      ok: items.filter(r => r.status === 'ok').length,
      no: items.filter(r => r.status === 'no').length,
    }
  })
)

const recentPending = computed(() =>
  sortedRecords.value.filter(r => r.status === 'wait').slice(0, 5)
)

const reviewRate = computed(() => {
  if (stats.value.total === 0) return 0
  return Math.round((stats.value.ok / stats.value.total) * 100)
})
</script>

<template>
  <div class="dashboard">
    <div class="header">
      <div>
        <h1 class="pageTitle">审核总览</h1>
        <p class="pageSub">教师端 · 档案审核与数据总览</p>
      </div>
      <UiButton variant="primary" @click="router.push('/teacher/review')">
        <LineIcon name="clock" :size="15" />
        开始审核
        <span v-if="stats.wait > 0" class="headerBadge">{{ stats.wait }}</span>
      </UiButton>
    </div>

    <div class="statsGrid">
      <UiCard class="statCard">
        <div class="statIcon blue"><LineIcon name="file" :size="22" /></div>
        <div class="statInfo">
          <div class="statNum">{{ stats.total }}</div>
          <div class="statLabel">档案总数</div>
        </div>
        <div class="statFooter">{{ stats.fileTotal }} 份材料</div>
      </UiCard>
      <UiCard class="statCard">
        <div class="statIcon orange"><LineIcon name="clock" :size="22" /></div>
        <div class="statInfo">
          <div class="statNum">{{ stats.wait }}</div>
          <div class="statLabel">待审核</div>
        </div>
        <div class="statFooter">等待处理</div>
      </UiCard>
      <UiCard class="statCard">
        <div class="statIcon green"><LineIcon name="check" :size="22" /></div>
        <div class="statInfo">
          <div class="statNum">{{ stats.ok }}</div>
          <div class="statLabel">已通过</div>
        </div>
        <div class="statFooter">通过率 {{ reviewRate }}%</div>
      </UiCard>
      <UiCard class="statCard">
        <div class="statIcon red"><LineIcon name="close" :size="22" /></div>
        <div class="statInfo">
          <div class="statNum">{{ stats.no }}</div>
          <div class="statLabel">已驳回</div>
        </div>
        <div class="statFooter">{{ stats.draft }} 条草稿</div>
      </UiCard>
    </div>

    <div class="grid2">
      <UiCard padding="lg">
        <div class="cardHeader">
          <h2 class="cardTitle">待审核列表</h2>
          <UiButton variant="ghost" size="sm" @click="router.push('/teacher/review')">查看全部</UiButton>
        </div>
        <div class="pendingList">
          <div v-for="item in recentPending" :key="item.id" class="pendingItem" @click="router.push(`/teacher/review`);">
            <div class="pendingIcon">
              <LineIcon :name="getStudentArchiveCategory(item.category)?.icon ?? 'file'" :size="16" />
            </div>
            <div class="pendingInfo">
              <div class="pendingTitle">{{ item.title }}</div>
              <div class="pendingMeta">{{ item.date }} · {{ item.organization }}</div>
            </div>
            <UiTag size="sm" tone="warning">待审核</UiTag>
          </div>
          <div v-if="recentPending.length === 0" class="emptySmall">
            暂无待审核档案
          </div>
        </div>
      </UiCard>

      <UiCard padding="lg">
        <div class="cardHeader">
          <h2 class="cardTitle">档案分类统计</h2>
        </div>
        <div class="catList">
          <div v-for="cat in categoryStats" :key="cat.key" class="catItem">
            <div class="catHead">
              <LineIcon :name="cat.icon" :size="14" />
              <span class="catLabel">{{ cat.label }}</span>
              <span class="catTotal">{{ cat.total }}</span>
            </div>
            <div class="catBar">
              <div class="catBarFill" :style="{ width: cat.total ? `${(cat.ok / cat.total) * 100}%` : '0%' }"></div>
            </div>
          </div>
        </div>
      </UiCard>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.pageTitle {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.pageSub {
  font-size: 14px;
  color: var(--muted);
}

.headerBadge {
  background: var(--danger);
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 99px;
  margin-left: 2px;
}

.statsGrid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.statCard {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 12px;
  padding: 18px !important;
}

.statIcon {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.statIcon.blue { background: var(--accent-light); color: var(--accent); }
.statIcon.orange { background: var(--warning-light); color: #b45309; }
.statIcon.green { background: var(--success-light); color: #047857; }
.statIcon.red { background: var(--danger-light); color: #b91c1c; }

.statInfo { min-width: 0; }

.statNum {
  font-size: 25px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--text);
}

.statLabel {
  font-size: 13px;
  color: var(--muted);
}

.statFooter {
  grid-column: 1 / -1;
  padding-top: 10px;
  border-top: 1px solid var(--border);
  font-size: 12px;
  color: var(--muted);
}

.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.cardHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.cardTitle { font-size: 16px; font-weight: 700; }

.pendingList { display: flex; flex-direction: column; gap: 8px; }

.pendingItem {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8fafb;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all var(--transition);
}

.pendingItem:hover {
  border-color: var(--accent);
  background: var(--accent-light);
}

.pendingIcon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--warning-light);
  color: #b45309;
  flex-shrink: 0;
}

.pendingInfo { flex: 1; min-width: 0; }

.pendingTitle {
  font-weight: 600;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pendingMeta { font-size: 12px; color: var(--muted); }

.emptySmall {
  padding: 24px;
  text-align: center;
  color: var(--muted);
  font-size: 13px;
}

.catList { display: flex; flex-direction: column; gap: 12px; }

.catItem { display: flex; flex-direction: column; gap: 6px; }

.catHead {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--muted);
}

.catLabel { flex: 1; font-weight: 600; color: var(--text); }

.catTotal { font-weight: 700; color: var(--text); }

.catBar {
  height: 6px;
  background: var(--bg);
  border-radius: 3px;
  overflow: hidden;
}

.catBarFill {
  height: 100%;
  background: var(--accent);
  border-radius: 3px;
  transition: width 0.6s ease;
}

@media (max-width: 1200px) {
  .statsGrid { grid-template-columns: repeat(2, 1fr); }
  .grid2 { grid-template-columns: 1fr; }
}
</style>
