<script setup>
import { ref } from 'vue'
import UiCard from '../../../components/ui/UiCard.vue'
import UiButton from '../../../components/ui/UiButton.vue'
import UiTag from '../../../components/ui/UiTag.vue'

const tab = ref('base')
const activeNav = ref('base')

const userInfo = {
  name: '张同学',
  studentId: '20260001',
  college: '计算机学院',
  major: '软件工程',
  class: '软工 2026 届 1 班',
  email: 'zhangstudent@university.edu.cn',
  phone: '138****8888',
  avatar: null,
}

const navItems = [
  { key: 'base', label: '基本信息', icon: '👤' },
  { key: 'security', label: '账号安全', icon: '🔒' },
  { key: 'notice', label: '通知设置', icon: '🔔' },
  { key: 'export', label: '数据导出', icon: '📤' },
]
</script>

<template>
  <div class="profilePage">
    <!-- 用户信息卡片 -->
    <UiCard padding="lg" class="userCard">
      <div class="userHeader">
        <div class="avatar">
          <span class="avatarText">{{ userInfo.name.slice(0, 1) }}</span>
        </div>
        <div class="userInfo">
          <h2 class="userName">{{ userInfo.name }}</h2>
          <p class="userMeta">{{ userInfo.studentId }} · {{ userInfo.major }}</p>
          <div class="userTags">
            <UiTag size="sm" tone="success">已认证</UiTag>
            <UiTag size="sm" tone="info">正式学生</UiTag>
          </div>
        </div>
        <UiButton variant="secondary" size="sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          编辑资料
        </UiButton>
      </div>
      <div class="userStats">
        <div class="stat">
          <div class="statNum">12</div>
          <div class="statLabel">档案条目</div>
        </div>
        <div class="stat">
          <div class="statNum">5</div>
          <div class="statLabel">已通过</div>
        </div>
        <div class="stat">
          <div class="statNum">89%</div>
          <div class="statLabel">完成度</div>
        </div>
        <div class="stat">
          <div class="statNum">2026</div>
          <div class="statLabel">毕业年份</div>
        </div>
      </div>
    </UiCard>

    <!-- 设置区域 -->
    <div class="settingsGrid">
      <!-- 侧边导航 -->
      <UiCard padding="sm" class="navCard">
        <nav class="sideNav">
          <button 
            v-for="item in navItems" 
            :key="item.key"
            class="navItem"
            :class="{ active: activeNav === item.key }"
            type="button"
            @click="activeNav = item.key"
          >
            <span class="navIcon">{{ item.icon }}</span>
            <span class="navLabel">{{ item.label }}</span>
          </button>
        </nav>
      </UiCard>

      <!-- 设置内容 -->
      <div class="settingsContent">
        <!-- 基本信息 -->
        <UiCard v-if="activeNav === 'base'" padding="lg">
          <div class="sectionHeader">
            <h3 class="sectionTitle">基本信息</h3>
            <UiButton variant="secondary" size="sm">编辑</UiButton>
          </div>
          <div class="infoGrid">
            <div class="infoItem">
              <label class="infoLabel">姓名</label>
              <div class="infoValue">{{ userInfo.name }}</div>
            </div>
            <div class="infoItem">
              <label class="infoLabel">学号</label>
              <div class="infoValue">{{ userInfo.studentId }}</div>
            </div>
            <div class="infoItem">
              <label class="infoLabel">学院</label>
              <div class="infoValue">{{ userInfo.college }}</div>
            </div>
            <div class="infoItem">
              <label class="infoLabel">专业</label>
              <div class="infoValue">{{ userInfo.major }}</div>
            </div>
            <div class="infoItem">
              <label class="infoLabel">班级</label>
              <div class="infoValue">{{ userInfo.class }}</div>
            </div>
            <div class="infoItem">
              <label class="infoLabel">入学年份</label>
              <div class="infoValue">2022 年</div>
            </div>
          </div>
        </UiCard>

        <!-- 账号安全 -->
        <UiCard v-else-if="activeNav === 'security'" padding="lg">
          <div class="sectionHeader">
            <h3 class="sectionTitle">账号安全</h3>
          </div>
          <div class="securityList">
            <div class="securityItem">
              <div class="securityLeft">
                <div class="securityIcon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <div class="securityInfo">
                  <div class="securityTitle">登录密码</div>
                  <div class="securityDesc">上次修改于 3 个月前</div>
                </div>
              </div>
              <UiButton variant="ghost" size="sm">修改</UiButton>
            </div>
            <div class="securityItem">
              <div class="securityLeft">
                <div class="securityIcon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <div class="securityInfo">
                  <div class="securityTitle">邮箱绑定</div>
                  <div class="securityDesc">{{ userInfo.email }}</div>
                </div>
              </div>
              <UiButton variant="ghost" size="sm">更换</UiButton>
            </div>
            <div class="securityItem">
              <div class="securityLeft">
                <div class="securityIcon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </div>
                <div class="securityInfo">
                  <div class="securityTitle">手机绑定</div>
                  <div class="securityDesc">{{ userInfo.phone }}</div>
                </div>
              </div>
              <UiButton variant="ghost" size="sm">更换</UiButton>
            </div>
          </div>
        </UiCard>

        <!-- 通知设置 -->
        <UiCard v-else-if="activeNav === 'notice'" padding="lg">
          <div class="sectionHeader">
            <h3 class="sectionTitle">通知设置</h3>
          </div>
          <div class="noticeList">
            <div class="noticeItem">
              <div class="noticeInfo">
                <div class="noticeTitle">审核结果通知</div>
                <div class="noticeDesc">当档案审核完成时，发送通知提醒</div>
              </div>
              <label class="toggle">
                <input type="checkbox" checked />
                <span class="toggleSlider"></span>
              </label>
            </div>
            <div class="noticeItem">
              <div class="noticeInfo">
                <div class="noticeTitle">材料补充提醒</div>
                <div class="noticeDesc">档案被驳回后，定期提醒补充材料</div>
              </div>
              <label class="toggle">
                <input type="checkbox" checked />
                <span class="toggleSlider"></span>
              </label>
            </div>
            <div class="noticeItem">
              <div class="noticeInfo">
                <div class="noticeTitle">每周汇总</div>
                <div class="noticeDesc">每周一发送本周档案动态汇总</div>
              </div>
              <label class="toggle">
                <input type="checkbox" />
                <span class="toggleSlider"></span>
              </label>
            </div>
            <div class="noticeItem">
              <div class="noticeInfo">
                <div class="noticeTitle">系统公告</div>
                <div class="noticeDesc">接收系统重要通知和公告</div>
              </div>
              <label class="toggle">
                <input type="checkbox" checked />
                <span class="toggleSlider"></span>
              </label>
            </div>
          </div>
        </UiCard>

        <!-- 数据导出 -->
        <UiCard v-else-if="activeNav === 'export'" padding="lg">
          <div class="sectionHeader">
            <h3 class="sectionTitle">数据导出</h3>
          </div>
          <div class="exportGrid">
            <div class="exportItem">
              <div class="exportIcon blue">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div class="exportInfo">
                <div class="exportTitle">成长档案 PDF</div>
                <div class="exportDesc">导出完整的成长档案报告</div>
              </div>
              <UiButton variant="secondary" size="sm">导出</UiButton>
            </div>
            <div class="exportItem">
              <div class="exportIcon green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </div>
              <div class="exportInfo">
                <div class="exportTitle">材料压缩包</div>
                <div class="exportDesc">下载所有已上传的材料文件</div>
              </div>
              <UiButton variant="secondary" size="sm">下载</UiButton>
            </div>
          </div>
        </UiCard>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profilePage {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 用户卡片 */
.userCard {
  background: linear-gradient(135deg, var(--accent) 0%, #60a5fa 100%);
  border: none;
  color: white;
}

.userHeader {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatarText {
  font-size: 28px;
  font-weight: 700;
}

.userInfo {
  flex: 1;
}

.userName {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 4px;
}

.userMeta {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.userTags {
  display: flex;
  gap: 8px;
}

.userStats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.stat {
  text-align: center;
}

.statNum {
  font-size: 24px;
  font-weight: 700;
}

.statLabel {
  font-size: 13px;
  opacity: 0.85;
  margin-top: 4px;
}

/* 设置网格 */
.settingsGrid {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 20px;
}

/* 侧边导航 */
.navCard {
  height: fit-content;
  position: sticky;
  top: 100px;
}

.sideNav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.navItem {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: none;
  background: transparent;
  color: var(--muted);
  font-size: 14px;
  font-weight: 500;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all var(--transition);
  text-align: left;
}

.navItem:hover {
  background: var(--bg);
  color: var(--text);
}

.navItem.active {
  background: var(--accent-light);
  color: var(--accent);
  font-weight: 600;
}

.navIcon {
  font-size: 18px;
}

/* 设置内容 */
.settingsContent {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sectionHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.sectionTitle {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
}

/* 信息网格 */
.infoGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.infoItem {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.infoLabel {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.infoValue {
  font-size: 15px;
  color: var(--text);
  font-weight: 500;
}

/* 安全列表 */
.securityList {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.securityItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: var(--bg);
  border-radius: var(--radius);
}

.securityLeft {
  display: flex;
  align-items: center;
  gap: 14px;
}

.securityIcon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius);
  background: var(--panel);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
}

.securityTitle {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 2px;
}

.securityDesc {
  font-size: 13px;
  color: var(--muted);
}

/* 通知列表 */
.noticeList {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.noticeItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: var(--bg);
  border-radius: var(--radius);
}

.noticeTitle {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 2px;
}

.noticeDesc {
  font-size: 13px;
  color: var(--muted);
}

/* 开关 */
.toggle {
  position: relative;
  width: 48px;
  height: 26px;
  cursor: pointer;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggleSlider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--border);
  border-radius: 13px;
  transition: all var(--transition);
}

.toggleSlider::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  left: 3px;
  bottom: 3px;
  background: white;
  border-radius: 50%;
  transition: all var(--transition);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toggle input:checked + .toggleSlider {
  background: var(--accent);
}

.toggle input:checked + .toggleSlider::before {
  transform: translateX(22px);
}

/* 导出网格 */
.exportGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.exportItem {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  background: var(--bg);
  border-radius: var(--radius);
}

.exportIcon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.exportIcon.blue {
  background: var(--accent-light);
  color: var(--accent);
}

.exportIcon.green {
  background: var(--success-light);
  color: var(--success);
}

.exportInfo {
  flex: 1;
}

.exportTitle {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 2px;
}

.exportDesc {
  font-size: 13px;
  color: var(--muted);
}

/* 响应式 */
@media (max-width: 980px) {
  .settingsGrid {
    grid-template-columns: 1fr;
  }
  
  .navCard {
    position: static;
  }
  
  .sideNav {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .userStats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .infoGrid {
    grid-template-columns: 1fr;
  }
  
  .exportGrid {
    grid-template-columns: 1fr;
  }
  
  .userHeader {
    flex-direction: column;
    text-align: center;
  }
}
</style>
