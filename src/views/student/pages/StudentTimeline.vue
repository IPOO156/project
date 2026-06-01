<script setup>
import UiCard from '../../../components/ui/UiCard.vue'
import UiTag from '../../../components/ui/UiTag.vue'
import UiButton from '../../../components/ui/UiButton.vue'
</script>

<template>
  <div class="timelinePage">
    <!-- 页面标题和筛选 -->
    <div class="pageHeader">
      <div class="headerLeft">
        <h1 class="pageTitle">成长时间轴</h1>
        <p class="pageSub">记录你的每一步成长足迹</p>
      </div>
      <div class="headerRight">
        <UiButton variant="secondary" size="sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          导出报告
        </UiButton>
      </div>
    </div>

    <!-- 筛选区域 -->
    <UiCard padding="md" class="filters">
      <div class="filterGrid">
        <div class="filterItem">
          <label class="filterLabel">学期</label>
          <select class="filterSelect">
            <option>2025-2026 第2学期</option>
            <option>2025-2026 第1学期</option>
            <option>2024-2025 第2学期</option>
          </select>
        </div>
        <div class="filterItem">
          <label class="filterLabel">分类</label>
          <select class="filterSelect">
            <option>全部</option>
            <option>学业成绩</option>
            <option>学科竞赛</option>
            <option>社会实践</option>
            <option>实习经历</option>
          </select>
        </div>
        <div class="filterItem search">
          <label class="filterLabel">关键词</label>
          <div class="searchBox">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input class="searchInput" placeholder="搜索活动/证书/论文…" />
          </div>
        </div>
      </div>
    </UiCard>

    <!-- 时间轴 -->
    <div class="timeline">
      <div class="timelineLine"></div>
      
      <div class="tItem">
        <div class="timelineDot blue"></div>
        <UiCard padding="md" class="timelineCard">
          <div class="tHeader">
            <div class="tMeta">
              <span class="tDate">2026年4月12日</span>
              <UiTag size="sm" tone="success">已通过</UiTag>
            </div>
            <h3 class="tTitle">学科竞赛 — 省赛获奖证明</h3>
            <p class="tDesc">全国大学生程序设计竞赛省级选拔赛二等奖</p>
          </div>
          <div class="tFooter">
            <div class="tFiles">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              上传材料 3 份
            </div>
            <UiButton variant="ghost" size="sm">查看详情</UiButton>
          </div>
        </UiCard>
      </div>

      <div class="tItem">
        <div class="timelineDot orange"></div>
        <UiCard padding="md" class="timelineCard">
          <div class="tHeader">
            <div class="tMeta">
              <span class="tDate">2026年3月3日</span>
              <UiTag size="sm" tone="warning">审核中</UiTag>
            </div>
            <h3 class="tTitle">社会实践 — 志愿服务照片</h3>
            <p class="tDesc">社区敬老院志愿服务活动</p>
          </div>
          <div class="tFooter">
            <div class="tFiles">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              上传材料 8 份
            </div>
            <UiButton variant="ghost" size="sm">查看详情</UiButton>
          </div>
        </UiCard>
      </div>

      <div class="tItem">
        <div class="timelineDot gray"></div>
        <UiCard padding="md" class="timelineCard">
          <div class="tHeader">
            <div class="tMeta">
              <span class="tDate">2026年2月1日</span>
              <UiTag size="sm" tone="neutral">草稿</UiTag>
            </div>
            <h3 class="tTitle">学术研究 — 论文投稿记录</h3>
            <p class="tDesc">基于深度学习的图像识别算法研究</p>
          </div>
          <div class="tFooter">
            <div class="tFiles">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              编辑条目
            </div>
            <UiButton variant="ghost" size="sm">继续编辑</UiButton>
          </div>
        </UiCard>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timelinePage {
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

/* 筛选区域 */
.filters {
  background: var(--panel);
}

.filterGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.filterItem {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filterItem.search {
  grid-column: span 1;
}

.filterLabel {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
}

.filterSelect {
  padding: 10px 12px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--transition);
}

.filterSelect:hover {
  border-color: var(--accent);
}

.filterSelect:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
}

.searchBox {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg);
  color: var(--muted);
  transition: all var(--transition);
}

.searchBox:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
}

.searchInput {
  flex: 1;
  padding: 10px 0;
  border: none;
  background: transparent;
  color: var(--text);
  font-size: 14px;
  outline: none;
}

.searchInput::placeholder {
  color: var(--muted);
}

/* 时间轴 */
.timeline {
  position: relative;
  padding-left: 28px;
}

.timelineLine {
  position: absolute;
  left: 8px;
  top: 20px;
  bottom: 20px;
  width: 2px;
  background: linear-gradient(180deg, var(--accent) 0%, var(--border) 100%);
  border-radius: 1px;
}

.tItem {
  position: relative;
  padding-bottom: 20px;
}

.tItem:last-child {
  padding-bottom: 0;
}

.timelineDot {
  position: absolute;
  left: -24px;
  top: 22px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 3px solid var(--panel);
  z-index: 1;
}

.timelineDot.blue {
  background: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-light);
}

.timelineDot.orange {
  background: var(--warning);
  box-shadow: 0 0 0 4px var(--warning-light);
}

.timelineDot.gray {
  background: var(--muted);
  box-shadow: 0 0 0 4px var(--bg);
}

.timelineCard {
  transition: all var(--transition);
}

.timelineCard:hover {
  transform: translateX(4px);
  box-shadow: var(--shadow-md);
}

.tHeader {
  margin-bottom: 12px;
}

.tMeta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.tDate {
  font-size: 12px;
  color: var(--muted);
  font-weight: 500;
}

.tTitle {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 4px;
}

.tDesc {
  font-size: 14px;
  color: var(--muted);
}

.tFooter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.tFiles {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--muted);
}

@media (max-width: 768px) {
  .filterGrid {
    grid-template-columns: 1fr;
  }
  
  .pageHeader {
    flex-direction: column;
  }
}
</style>
