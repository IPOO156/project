<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import UiButton from '../../../components/ui/UiButton.vue'
import UiCard from '../../../components/ui/UiCard.vue'
import LineIcon from '../../../components/ui/LineIcon.vue'
import UiTag from '../../../components/ui/UiTag.vue'
import { getStudentArchiveCategory } from '../nav'
import { exportRecords, statusMeta, useArchiveStore } from '../archiveStore'

const router = useRouter()
const { records, stats, categorySummary, recentSubmissions, resetRecords } = useArchiveStore()
const notice = ref('')

const statCards = computed(() => [
  { label: '档案条目', value: stats.value.total, icon: 'file', tone: 'blue', note: `${stats.value.fileTotal} 份材料` },
  { label: '审核中', value: stats.value.wait, icon: 'clock', tone: 'orange', note: '等待处理' },
  { label: '完成度', value: `${stats.value.completion}%`, icon: 'check', tone: 'green', note: `${stats.value.ok} 条已通过` },
  { label: '需补充', value: stats.value.no, icon: 'close', tone: 'red', note: `${stats.value.draft} 条草稿` },
])

const recentRows = computed(() =>
  recentSubmissions.value.slice(0, 3).map((item) => ({
    ...item,
    categoryInfo: getStudentArchiveCategory(item.category),
    statusInfo: statusMeta[item.status],
  })),
)

const featuredCategories = computed(() =>
  categorySummary.value
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4),
)

function goArchive(category = 'honor', create = false) {
  router.push(`/student/archive/${category}${create ? '?new=1' : ''}`)
}

function exportAll() {
  exportRecords(records.value, '成长档案总览.csv')
  notice.value = '已生成成长档案总览 CSV。'
}

function syncData() {
  resetRecords()
  notice.value = '已恢复并同步默认演示数据。'
}
</script>

<template>
  <div class="dashboard">
    <div class="welcome">
      <div>
        <h1 class="welcomeTitle">欢迎回来，张同学</h1>
        <p class="welcomeSub">这里汇总了你的档案状态、最近提交和需要处理的材料。</p>
      </div>
      <div class="welcomeActions">
        <UiButton variant="secondary" size="sm" @click="exportAll">
          <LineIcon name="download" :size="14" />
          导出总览
        </UiButton>
        <UiButton variant="primary" size="sm" @click="goArchive('honor', true)">
          <LineIcon name="plus" :size="14" />
          新建档案
        </UiButton>
      </div>
    </div>

    <div v-if="notice" class="notice">{{ notice }}</div>

    <div class="stats">
      <UiCard v-for="card in statCards" :key="card.label" class="statCard">
        <div class="statIcon" :data-tone="card.tone">
          <LineIcon :name="card.icon" :size="22" />
        </div>
        <div class="statInfo">
          <div class="statNum">{{ card.value }}</div>
          <div class="statLabel">{{ card.label }}</div>
        </div>
        <div class="statNote">{{ card.note }}</div>
      </UiCard>
    </div>

    <div class="mainGrid">
      <UiCard padding="lg" class="submissions">
        <div class="cardHeader">
          <h2 class="cardTitle">最近提交</h2>
          <UiButton variant="ghost" size="sm" @click="router.push('/student/submissions')">查看全部</UiButton>
        </div>
        <div class="list">
          <div v-for="item in recentRows" :key="item.id" class="row">
            <div class="rowLeft">
              <div class="rowIcon" :data-status="item.status">
                <LineIcon :name="item.categoryInfo?.icon ?? 'file'" :size="17" />
              </div>
              <div class="rowInfo">
                <div class="rowTitle">{{ item.categoryInfo?.label }} - {{ item.title }}</div>
                <div class="rowMeta">提交于 {{ item.date }} · {{ item.files.length }} 份材料</div>
              </div>
            </div>
            <UiTag :tone="item.statusInfo.tone">{{ item.statusInfo.label }}</UiTag>
          </div>
        </div>
      </UiCard>

      <UiCard padding="lg" class="quickActions">
        <div class="cardHeader">
          <h2 class="cardTitle">快捷操作</h2>
        </div>
        <div class="actionGrid">
          <button class="actionItem" type="button" @click="goArchive('honor', true)">
            <span class="actionIcon blue"><LineIcon name="plus" :size="20" /></span>
            <span class="actionLabel">新建档案</span>
          </button>
          <button class="actionItem" type="button" @click="goArchive('practice', true)">
            <span class="actionIcon green"><LineIcon name="upload" :size="20" /></span>
            <span class="actionLabel">上传材料</span>
          </button>
          <button class="actionItem" type="button" @click="syncData">
            <span class="actionIcon slate"><LineIcon name="refresh" :size="20" /></span>
            <span class="actionLabel">同步数据</span>
          </button>
          <button class="actionItem" type="button" @click="router.push('/student/profile')">
            <span class="actionIcon orange"><LineIcon name="settings" :size="20" /></span>
            <span class="actionLabel">设置</span>
          </button>
        </div>
      </UiCard>
    </div>

    <UiCard padding="lg" class="categories">
      <div class="cardHeader">
        <h2 class="cardTitle">档案分类</h2>
        <UiButton variant="ghost" size="sm" @click="goArchive(featuredCategories[0]?.key ?? 'honor')">管理分类</UiButton>
      </div>
      <div class="categoryGrid">
        <button
          v-for="item in featuredCategories"
          :key="item.key"
          class="categoryItem"
          type="button"
          @click="goArchive(item.key)"
        >
          <span class="catIcon">
            <LineIcon :name="item.icon" :size="20" />
          </span>
          <span class="catInfo">
            <span class="catName">{{ item.label }}</span>
            <span class="catCount">{{ item.count }} 项 · {{ item.files }} 份材料</span>
          </span>
          <UiTag size="sm" :tone="statusMeta[item.status].tone">{{ statusMeta[item.status].label }}</UiTag>
        </button>
      </div>
    </UiCard>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.welcome {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px;
  background: #f0f5f7;
  border: 1px solid #d5e2e8;
  border-radius: var(--radius-lg);
}

.welcomeTitle {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 4px;
  letter-spacing: 0;
}

.welcomeSub {
  font-size: 14px;
  color: var(--muted);
}

.welcomeActions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.notice {
  padding: 10px 12px;
  border: 1px solid #d5e2e8;
  background: #f7fbfc;
  color: var(--accent-dark);
  border-radius: var(--radius);
  font-size: 13px;
}

.stats {
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

.statIcon,
.rowIcon,
.actionIcon,
.catIcon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid transparent;
}

.statIcon {
  width: 44px;
  height: 44px;
  border-radius: 8px;
}

.statIcon[data-tone='blue'] {
  background: var(--accent-light);
  color: var(--accent);
}

.statIcon[data-tone='orange'] {
  background: var(--warning-light);
  color: #b45309;
}

.statIcon[data-tone='green'] {
  background: var(--success-light);
  color: #047857;
}

.statIcon[data-tone='red'] {
  background: var(--danger-light);
  color: #b91c1c;
}

.statInfo {
  min-width: 0;
}

.statNum {
  font-size: 25px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--text);
}

.statLabel,
.statNote {
  font-size: 13px;
  color: var(--muted);
}

.statNote {
  grid-column: 1 / -1;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}

.mainGrid {
  display: grid;
  grid-template-columns: 1.35fr 0.9fr;
  gap: 18px;
}

.cardHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.cardTitle {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: 0;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px;
  background: #f8fafb;
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.rowLeft {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.rowIcon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--panel);
  color: var(--accent);
  border-color: var(--border);
}

.rowIcon[data-status='wait'] {
  color: #b45309;
}

.rowIcon[data-status='no'] {
  color: #b91c1c;
}

.rowInfo {
  min-width: 0;
}

.rowTitle {
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rowMeta,
.catCount {
  font-size: 12px;
  color: var(--muted);
}

.actionGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.actionItem {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  background: #f8fafb;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  text-align: left;
  transition: all var(--transition);
}

.actionItem:hover,
.categoryItem:hover {
  border-color: var(--accent);
  background: #f7fbfc;
}

.actionIcon {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: var(--panel);
}

.actionIcon.blue { color: var(--accent); }
.actionIcon.green { color: #047857; }
.actionIcon.slate { color: #475467; }
.actionIcon.orange { color: #b45309; }

.actionLabel {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.categoryGrid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.categoryItem {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: #f8fafb;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  text-align: left;
  transition: all var(--transition);
}

.catIcon {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: var(--panel);
  color: var(--accent);
  border-color: var(--border);
}

.catInfo {
  display: grid;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.catName {
  font-weight: 600;
  font-size: 14px;
  color: var(--text);
}

@media (max-width: 1200px) {
  .stats,
  .categoryGrid {
    grid-template-columns: repeat(2, 1fr);
  }

  .mainGrid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats,
  .categoryGrid,
  .actionGrid {
    grid-template-columns: 1fr;
  }

  .welcome {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
