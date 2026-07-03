<script setup>
import { ref } from 'vue'
import UiButton from '../../../components/ui/UiButton.vue'
import UiCard from '../../../components/ui/UiCard.vue'
import UiTag from '../../../components/ui/UiTag.vue'

const tab = ref('wait')

const submissions = {
  wait: [
    { id: 1, title: '社会实践 — 志愿服务材料', date: '2026-03-03', files: 8, category: '社会实践' },
    { id: 2, title: '学科竞赛 — 校赛报名表', date: '2026-02-28', files: 2, category: '学科竞赛' },
  ],
  ok: [
    { id: 3, title: '实习经历 — 某某科技（合同/证明）', date: '2026-04-12', files: 3, category: '实习经历' },
    { id: 4, title: '学业成绩 — 2025-2026第一学期', date: '2026-01-15', files: 5, category: '学业成绩' },
    { id: 5, title: '学科竞赛 — 省赛获奖证明', date: '2025-12-20', files: 4, category: '学科竞赛' },
  ],
  no: [
    { id: 6, title: '学术研究 — 论文投稿记录', date: '2026-02-01', files: 1, category: '学术研究', reason: '缺少期刊录用证明' },
    { id: 7, title: '社会实践 — 暑期三下乡', date: '2025-08-15', files: 6, category: '社会实践', reason: '材料不完整' },
  ],
}

function getIcon(category) {
  const icons = {
    社会实践: '🌱',
    学科竞赛: '🏆',
    实习经历: '💼',
    学业成绩: '📚',
    学术研究: '📝',
  }
  return icons[category] || '📄'
}
</script>

<template>
  <div class="submissionsPage">
    <!-- 页面标题 -->
    <div class="pageHeader">
      <div class="headerLeft">
        <h1 class="pageTitle">提交记录</h1>
        <p class="pageSub">管理你的所有档案提交</p>
      </div>
      <UiButton variant="primary" size="sm">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        新建提交
      </UiButton>
    </div>

    <!-- 标签切换 -->
    <div class="tabs">
      <button
        class="tabItem"
        :class="{ active: tab === 'wait' }"
        type="button"
        @click="tab = 'wait'"
      >
        <span class="tabIcon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </span>
        待审核
        <span class="tabCount warning">2</span>
      </button>
      <button
        class="tabItem"
        :class="{ active: tab === 'ok' }"
        type="button"
        @click="tab = 'ok'"
      >
        <span class="tabIcon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </span>
        已通过
        <span class="tabCount success">3</span>
      </button>
      <button
        class="tabItem"
        :class="{ active: tab === 'no' }"
        type="button"
        @click="tab = 'no'"
      >
        <span class="tabIcon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </span>
        已驳回
        <span class="tabCount danger">2</span>
      </button>
    </div>

    <!-- 列表 -->
    <div class="list">
      <template v-if="tab === 'wait'">
        <UiCard
          v-for="item in submissions.wait"
          :key="item.id"
          padding="md"
          class="listItem"
          hoverable
        >
          <div class="itemIcon blue">
            {{ getIcon(item.category) }}
          </div>
          <div class="itemContent">
            <h3 class="itemTitle">{{ item.title }}</h3>
            <div class="itemMeta">
              <span class="metaDate">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {{ item.date }}
              </span>
              <span class="metaFiles">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                {{ item.files }} 份材料
              </span>
            </div>
          </div>
          <div class="itemActions">
            <UiTag tone="warning">审核中</UiTag>
            <UiButton variant="ghost" size="sm">查看</UiButton>
          </div>
        </UiCard>
      </template>

      <template v-else-if="tab === 'ok'">
        <UiCard
          v-for="item in submissions.ok"
          :key="item.id"
          padding="md"
          class="listItem"
          hoverable
        >
          <div class="itemIcon green">
            {{ getIcon(item.category) }}
          </div>
          <div class="itemContent">
            <h3 class="itemTitle">{{ item.title }}</h3>
            <div class="itemMeta">
              <span class="metaDate">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {{ item.date }}
              </span>
              <span class="metaFiles">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                {{ item.files }} 份材料
              </span>
            </div>
          </div>
          <div class="itemActions">
            <UiTag tone="success">已通过</UiTag>
            <UiButton variant="ghost" size="sm">查看</UiButton>
          </div>
        </UiCard>
      </template>

      <template v-else>
        <UiCard
          v-for="item in submissions.no"
          :key="item.id"
          padding="md"
          class="listItem"
          hoverable
        >
          <div class="itemIcon red">
            {{ getIcon(item.category) }}
          </div>
          <div class="itemContent">
            <h3 class="itemTitle">{{ item.title }}</h3>
            <div class="itemMeta">
              <span class="metaDate">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {{ item.date }}
              </span>
              <span class="metaFiles">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                {{ item.files }} 份材料
              </span>
            </div>
            <div class="itemReason">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              驳回原因：{{ item.reason }}
            </div>
          </div>
          <div class="itemActions">
            <UiTag tone="danger">已驳回</UiTag>
            <UiButton variant="secondary" size="sm">重新提交</UiButton>
          </div>
        </UiCard>
      </template>
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
  letter-spacing: -0.02em;
  margin-bottom: 4px;
}

.pageSub {
  font-size: 14px;
  color: var(--muted);
}

/* 标签切换 */
.tabs {
  display: flex;
  gap: 8px;
  padding: 6px;
  background: var(--panel);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}

.tabItem {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
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

.tabIcon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.tabCount {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
}

.tabCount.warning {
  background: var(--warning-light);
  color: #b45309;
}

.tabCount.success {
  background: var(--success-light);
  color: #047857;
}

.tabCount.danger {
  background: var(--danger-light);
  color: #b91c1c;
}

/* 列表 */
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
  width: 48px;
  height: 48px;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.itemIcon.blue {
  background: var(--accent-light);
}
.itemIcon.green {
  background: var(--success-light);
}
.itemIcon.red {
  background: var(--danger-light);
}

.itemContent {
  flex: 1;
  min-width: 0;
}

.itemTitle {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 6px;
}

.itemMeta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.metaDate,
.metaFiles {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: var(--muted);
}

.itemReason {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 8px;
  padding: 8px 10px;
  background: var(--danger-light);
  color: #b91c1c;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
}

.itemActions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .listItem {
    flex-direction: column;
    align-items: flex-start;
  }

  .itemActions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
