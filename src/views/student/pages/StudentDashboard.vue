<script setup>
import UiCard from '../../../components/ui/UiCard.vue'
import UiTag from '../../../components/ui/UiTag.vue'
import UiButton from '../../../components/ui/UiButton.vue'
</script>

<template>
  <div class="dashboard">
    <!-- 欢迎横幅 -->
    <div class="welcome">
      <div class="welcomeLeft">
        <h1 class="welcomeTitle">欢迎回来，张同学</h1>
        <p class="welcomeSub">今天是充实的一天，继续加油整理你的成长档案吧</p>
      </div>
      <div class="welcomeRight">
        <UiButton variant="secondary" size="sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          2025-2026学年
        </UiButton>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats">
      <UiCard class="statCard statBlue">
        <div class="statIcon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <div class="statInfo">
          <div class="statNum">12</div>
          <div class="statLabel">档案条目</div>
        </div>
        <div class="statTrend up">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="18 15 12 9 6 15"/>
          </svg>
          +3
        </div>
      </UiCard>

      <UiCard class="statCard statOrange">
        <div class="statIcon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div class="statInfo">
          <div class="statNum">6</div>
          <div class="statLabel">待审核</div>
        </div>
        <div class="statBadge">
          <UiTag size="sm" tone="warning">尽快处理</UiTag>
        </div>
      </UiCard>

      <UiCard class="statCard statGreen">
        <div class="statIcon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <div class="statInfo">
          <div class="statNum">89%</div>
          <div class="statLabel">完成度</div>
        </div>
        <div class="statProgress">
          <div class="progressBar">
            <div class="progressFill" style="width: 89%"></div>
          </div>
        </div>
      </UiCard>

      <UiCard class="statCard statPurple">
        <div class="statIcon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
            <polyline points="17 6 23 6 23 12"/>
          </svg>
        </div>
        <div class="statInfo">
          <div class="statNum">5</div>
          <div class="statLabel">已通过</div>
        </div>
        <div class="statTrend up">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="18 15 12 9 6 15"/>
          </svg>
          本月
        </div>
      </UiCard>
    </div>

    <!-- 主要内容区域 -->
    <div class="mainGrid">
      <!-- 提交记录 -->
      <UiCard padding="lg" class="submissions">
        <div class="cardHeader">
          <h2 class="cardTitle">最近提交</h2>
          <UiButton variant="ghost" size="sm">查看全部</UiButton>
        </div>
        <div class="list">
          <div class="row">
            <div class="rowLeft">
              <div class="rowIcon blue">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div class="rowInfo">
                <div class="rowTitle">学科竞赛 — 国赛答辩资料</div>
                <div class="rowMeta">提交于 2026-05-28 14:32</div>
              </div>
            </div>
            <UiTag tone="success">已通过</UiTag>
          </div>

          <div class="row">
            <div class="rowLeft">
              <div class="rowIcon orange">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div class="rowInfo">
                <div class="rowTitle">实习经历 — 某某科技（合同/证明）</div>
                <div class="rowMeta">提交于 2026-05-25 09:15</div>
              </div>
            </div>
            <UiTag tone="warning">审核中</UiTag>
          </div>

          <div class="row">
            <div class="rowLeft">
              <div class="rowIcon red">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <div class="rowInfo">
                <div class="rowTitle">社会实践 — 志愿服务照片材料</div>
                <div class="rowMeta">提交于 2026-05-20 16:45 · 需补充获奖证书</div>
              </div>
            </div>
            <UiTag tone="danger">已驳回</UiTag>
          </div>
        </div>
      </UiCard>

      <!-- 快捷操作 -->
      <UiCard padding="lg" class="quickActions">
        <div class="cardHeader">
          <h2 class="cardTitle">快捷操作</h2>
        </div>
        <div class="actionGrid">
          <div class="actionItem">
            <div class="actionIcon blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
            </div>
            <div class="actionLabel">新建档案</div>
          </div>
          <div class="actionItem">
            <div class="actionIcon green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div class="actionLabel">上传材料</div>
          </div>
          <div class="actionItem">
            <div class="actionIcon purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            </div>
            <div class="actionLabel">同步数据</div>
          </div>
          <div class="actionItem">
            <div class="actionIcon orange">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </div>
            <div class="actionLabel">设置</div>
          </div>
        </div>
      </UiCard>
    </div>

    <!-- 档案分类 -->
    <UiCard padding="lg" class="categories">
      <div class="cardHeader">
        <h2 class="cardTitle">档案分类</h2>
        <UiButton variant="ghost" size="sm">管理分类</UiButton>
      </div>
      <div class="categoryGrid">
        <div class="categoryItem">
          <div class="catIcon blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <div class="catInfo">
            <div class="catName">学业成绩</div>
            <div class="catCount">4 项</div>
          </div>
          <UiTag size="sm" tone="success">已完成</UiTag>
        </div>
        <div class="categoryItem">
          <div class="catIcon green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <div class="catInfo">
            <div class="catName">学科竞赛</div>
            <div class="catCount">3 项</div>
          </div>
          <UiTag size="sm" tone="warning">进行中</UiTag>
        </div>
        <div class="categoryItem">
          <div class="catIcon purple">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <div class="catInfo">
            <div class="catName">社会实践</div>
            <div class="catCount">2 项</div>
          </div>
          <UiTag size="sm" tone="danger">待补充</UiTag>
        </div>
        <div class="categoryItem">
          <div class="catIcon orange">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <div class="catInfo">
            <div class="catName">实习经历</div>
            <div class="catCount">1 项</div>
          </div>
          <UiTag size="sm" tone="info">审核中</UiTag>
        </div>
      </div>
    </UiCard>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 欢迎横幅 */
.welcome {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px;
  background: linear-gradient(135deg, var(--accent) 0%, #60a5fa 100%);
  border-radius: var(--radius-lg);
  color: white;
}

.welcomeTitle {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 4px;
  letter-spacing: -0.02em;
}

.welcomeSub {
  font-size: 14px;
  opacity: 0.9;
}

/* 统计卡片 */
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.statCard {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px !important;
  position: relative;
  overflow: hidden;
}

.statCard::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
}

.statBlue::before { background: var(--accent); }
.statOrange::before { background: var(--warning); }
.statGreen::before { background: var(--success); }
.statPurple::before { background: #8b5cf6; }

.statIcon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.statBlue .statIcon {
  background: var(--accent-light);
  color: var(--accent);
}
.statOrange .statIcon {
  background: var(--warning-light);
  color: var(--warning);
}
.statGreen .statIcon {
  background: var(--success-light);
  color: var(--success);
}
.statPurple .statIcon {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.statInfo {
  flex: 1;
  min-width: 0;
}

.statNum {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text);
}

.statLabel {
  font-size: 13px;
  color: var(--muted);
  margin-top: 2px;
}

.statTrend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 20px;
}

.statTrend.up {
  background: var(--success-light);
  color: var(--success);
}

.statBadge {
  position: absolute;
  top: 14px;
  right: 14px;
}

.statProgress {
  position: absolute;
  bottom: 14px;
  left: 18px;
  right: 18px;
}

.progressBar {
  height: 4px;
  background: var(--bg);
  border-radius: 2px;
  overflow: hidden;
}

.progressFill {
  height: 100%;
  background: var(--success);
  border-radius: 2px;
  transition: width 0.5s ease;
}

/* 主要内容网格 */
.mainGrid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 20px;
}

/* 卡片通用 */
.cardHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.cardTitle {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.01em;
}

/* 提交记录 */
.submissions .list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  background: var(--bg);
  border-radius: var(--radius);
  transition: all var(--transition);
}

.row:hover {
  background: var(--accent-light);
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
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rowIcon.blue { background: var(--accent-light); color: var(--accent); }
.rowIcon.orange { background: var(--warning-light); color: var(--warning); }
.rowIcon.red { background: var(--danger-light); color: var(--danger); }

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

.rowMeta {
  font-size: 12px;
  color: var(--muted);
  margin-top: 2px;
}

/* 快捷操作 */
.actionGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.actionItem {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 18px 12px;
  background: var(--bg);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all var(--transition);
}

.actionItem:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.actionIcon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.actionIcon.blue { background: var(--accent-light); color: var(--accent); }
.actionIcon.green { background: var(--success-light); color: var(--success); }
.actionIcon.purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
.actionIcon.orange { background: var(--warning-light); color: var(--warning); }

.actionLabel {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

/* 档案分类 */
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
  background: var(--bg);
  border-radius: var(--radius);
  transition: all var(--transition);
  cursor: pointer;
}

.categoryItem:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.catIcon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.catIcon.blue { background: var(--accent-light); color: var(--accent); }
.catIcon.green { background: var(--success-light); color: var(--success); }
.catIcon.purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
.catIcon.orange { background: var(--warning-light); color: var(--warning); }

.catInfo {
  flex: 1;
  min-width: 0;
}

.catName {
  font-weight: 600;
  font-size: 14px;
}

.catCount {
  font-size: 12px;
  color: var(--muted);
  margin-top: 2px;
}

/* 响应式 */
@media (max-width: 1200px) {
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .mainGrid {
    grid-template-columns: 1fr;
  }
  .categoryGrid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats {
    grid-template-columns: 1fr;
  }
  .categoryGrid {
    grid-template-columns: 1fr;
  }
  .welcome {
    flex-direction: column;
    text-align: center;
  }
}
</style>
