<script setup>
import { computed, reactive, ref, watch } from 'vue'

import UiButton from '../../../components/ui/UiButton.vue'
import UiCard from '../../../components/ui/UiCard.vue'
import LineIcon from '../../../components/ui/LineIcon.vue'
import UiTag from '../../../components/ui/UiTag.vue'
import { downloadText, exportRecords, useArchiveStore } from '../archiveStore'

const { records, stats } = useArchiveStore()

const activeNav = ref('base')
const editMode = ref(false)
const message = ref('')

const defaultUser = {
  name: '张同学',
  studentId: '20260001',
  college: '计算机学院',
  major: '软件工程',
  className: '软工 2026 届 1 班',
  email: 'zhangstudent@university.edu.cn',
  phone: '138****8888',
  enrollmentYear: '2022 年',
}

function loadJson(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    return { ...fallback, ...JSON.parse(window.localStorage.getItem(key) || '{}') }
  } catch {
    return fallback
  }
}

const userInfo = reactive(loadJson('sa.profile', defaultUser))
const noticeSettings = reactive(loadJson('sa.noticeSettings', {
  audit: true,
  supplement: true,
  weekly: false,
  announcement: true,
}))

watch(userInfo, (value) => {
  if (typeof window !== 'undefined') window.localStorage.setItem('sa.profile', JSON.stringify(value))
}, { deep: true })

watch(noticeSettings, (value) => {
  if (typeof window !== 'undefined') window.localStorage.setItem('sa.noticeSettings', JSON.stringify(value))
}, { deep: true })

const navItems = [
  { key: 'base', label: '基本信息', icon: 'user' },
  { key: 'security', label: '账号安全', icon: 'lock' },
  { key: 'notice', label: '通知设置', icon: 'bell' },
  { key: 'export', label: '数据导出', icon: 'download' },
]

const statItems = computed(() => [
  { label: '档案条目', value: stats.value.total },
  { label: '已通过', value: stats.value.ok },
  { label: '完成度', value: `${stats.value.completion}%` },
  { label: '毕业年份', value: '2026' },
])

function saveProfile() {
  editMode.value = false
  message.value = '资料已保存。'
}

function securityAction(text) {
  message.value = `${text}已记录，本地演示环境不会发送验证码。`
}

function exportReport() {
  const lines = [
    `${userInfo.name}成长档案报告`,
    `学号：${userInfo.studentId}`,
    `学院专业：${userInfo.college} / ${userInfo.major}`,
    `档案条目：${stats.value.total}`,
    `已通过：${stats.value.ok}`,
    '',
    ...records.value.map((item) => `${item.date}｜${item.title}｜${item.files.length} 份材料`),
  ]
  downloadText('成长档案报告.txt', lines.join('\n'))
  message.value = '成长档案报告已导出。'
}

function exportFiles() {
  exportRecords(records.value, '成长档案材料清单.csv')
  message.value = '材料清单已导出。'
}
</script>

<template>
  <div class="profilePage">
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
        <UiButton variant="secondary" size="sm" @click="activeNav = 'base'; editMode = true">
          <LineIcon name="edit" :size="14" />
          编辑资料
        </UiButton>
      </div>
      <div class="userStats">
        <div v-for="item in statItems" :key="item.label" class="stat">
          <div class="statNum">{{ item.value }}</div>
          <div class="statLabel">{{ item.label }}</div>
        </div>
      </div>
    </UiCard>

    <div v-if="message" class="message">{{ message }}</div>

    <div class="settingsGrid">
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
            <LineIcon :name="item.icon" :size="18" />
            <span>{{ item.label }}</span>
          </button>
        </nav>
      </UiCard>

      <div class="settingsContent">
        <UiCard v-if="activeNav === 'base'" padding="lg">
          <div class="sectionHeader">
            <h3 class="sectionTitle">基本信息</h3>
            <div class="actions">
              <UiButton v-if="!editMode" variant="secondary" size="sm" @click="editMode = true">编辑</UiButton>
              <template v-else>
                <UiButton variant="ghost" size="sm" @click="editMode = false">取消</UiButton>
                <UiButton size="sm" @click="saveProfile">保存</UiButton>
              </template>
            </div>
          </div>
          <div class="infoGrid">
            <label class="infoItem">
              <span class="infoLabel">姓名</span>
              <input v-if="editMode" v-model="userInfo.name" class="infoInput" />
              <span v-else class="infoValue">{{ userInfo.name }}</span>
            </label>
            <label class="infoItem">
              <span class="infoLabel">学号</span>
              <input v-if="editMode" v-model="userInfo.studentId" class="infoInput" />
              <span v-else class="infoValue">{{ userInfo.studentId }}</span>
            </label>
            <label class="infoItem">
              <span class="infoLabel">学院</span>
              <input v-if="editMode" v-model="userInfo.college" class="infoInput" />
              <span v-else class="infoValue">{{ userInfo.college }}</span>
            </label>
            <label class="infoItem">
              <span class="infoLabel">专业</span>
              <input v-if="editMode" v-model="userInfo.major" class="infoInput" />
              <span v-else class="infoValue">{{ userInfo.major }}</span>
            </label>
            <label class="infoItem">
              <span class="infoLabel">班级</span>
              <input v-if="editMode" v-model="userInfo.className" class="infoInput" />
              <span v-else class="infoValue">{{ userInfo.className }}</span>
            </label>
            <label class="infoItem">
              <span class="infoLabel">入学年份</span>
              <input v-if="editMode" v-model="userInfo.enrollmentYear" class="infoInput" />
              <span v-else class="infoValue">{{ userInfo.enrollmentYear }}</span>
            </label>
          </div>
        </UiCard>

        <UiCard v-else-if="activeNav === 'security'" padding="lg">
          <div class="sectionHeader">
            <h3 class="sectionTitle">账号安全</h3>
          </div>
          <div class="securityList">
            <div class="securityItem">
              <div class="securityLeft">
                <div class="securityIcon"><LineIcon name="lock" :size="20" /></div>
                <div>
                  <div class="securityTitle">登录密码</div>
                  <div class="securityDesc">上次修改于 3 个月前</div>
                </div>
              </div>
              <UiButton variant="ghost" size="sm" @click="securityAction('登录密码修改')">修改</UiButton>
            </div>
            <div class="securityItem">
              <div class="securityLeft">
                <div class="securityIcon"><LineIcon name="mail" :size="20" /></div>
                <div>
                  <div class="securityTitle">邮箱绑定</div>
                  <div class="securityDesc">{{ userInfo.email }}</div>
                </div>
              </div>
              <UiButton variant="ghost" size="sm" @click="securityAction('邮箱更换')">更换</UiButton>
            </div>
            <div class="securityItem">
              <div class="securityLeft">
                <div class="securityIcon"><LineIcon name="phone" :size="20" /></div>
                <div>
                  <div class="securityTitle">手机绑定</div>
                  <div class="securityDesc">{{ userInfo.phone }}</div>
                </div>
              </div>
              <UiButton variant="ghost" size="sm" @click="securityAction('手机号更换')">更换</UiButton>
            </div>
          </div>
        </UiCard>

        <UiCard v-else-if="activeNav === 'notice'" padding="lg">
          <div class="sectionHeader">
            <h3 class="sectionTitle">通知设置</h3>
          </div>
          <div class="noticeList">
            <label class="noticeItem">
              <span>
                <span class="noticeTitle">审核结果通知</span>
                <span class="noticeDesc">档案审核完成时提醒</span>
              </span>
              <span class="toggle">
                <input v-model="noticeSettings.audit" type="checkbox" />
                <span class="toggleSlider"></span>
              </span>
            </label>
            <label class="noticeItem">
              <span>
                <span class="noticeTitle">材料补充提醒</span>
                <span class="noticeDesc">档案被驳回后提醒补充</span>
              </span>
              <span class="toggle">
                <input v-model="noticeSettings.supplement" type="checkbox" />
                <span class="toggleSlider"></span>
              </span>
            </label>
            <label class="noticeItem">
              <span>
                <span class="noticeTitle">每周汇总</span>
                <span class="noticeDesc">每周一发送档案动态</span>
              </span>
              <span class="toggle">
                <input v-model="noticeSettings.weekly" type="checkbox" />
                <span class="toggleSlider"></span>
              </span>
            </label>
            <label class="noticeItem">
              <span>
                <span class="noticeTitle">系统公告</span>
                <span class="noticeDesc">接收系统重要通知</span>
              </span>
              <span class="toggle">
                <input v-model="noticeSettings.announcement" type="checkbox" />
                <span class="toggleSlider"></span>
              </span>
            </label>
          </div>
        </UiCard>

        <UiCard v-else-if="activeNav === 'export'" padding="lg">
          <div class="sectionHeader">
            <h3 class="sectionTitle">数据导出</h3>
          </div>
          <div class="exportGrid">
            <div class="exportItem">
              <div class="exportIcon blue"><LineIcon name="file" :size="24" /></div>
              <div class="exportInfo">
                <div class="exportTitle">成长档案报告</div>
                <div class="exportDesc">包含基础信息和档案条目摘要</div>
              </div>
              <UiButton variant="secondary" size="sm" @click="exportReport">导出</UiButton>
            </div>
            <div class="exportItem">
              <div class="exportIcon green"><LineIcon name="download" :size="24" /></div>
              <div class="exportInfo">
                <div class="exportTitle">材料清单</div>
                <div class="exportDesc">包含所有附件名称和审核状态</div>
              </div>
              <UiButton variant="secondary" size="sm" @click="exportFiles">下载</UiButton>
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

.userCard {
  background: #f0f5f7;
  border-color: #d5e2e8;
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
  background: #dce9ef;
  color: var(--accent-dark);
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
  color: var(--muted);
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
  border-top: 1px solid #d5e2e8;
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
  color: var(--muted);
  margin-top: 4px;
}

.message {
  padding: 10px 12px;
  border: 1px solid #d5e2e8;
  background: #f7fbfc;
  color: var(--accent-dark);
  border-radius: var(--radius);
  font-size: 13px;
}

.settingsGrid {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 20px;
}

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
  font-weight: 600;
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
}

.settingsContent {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sectionHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.sectionTitle {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.infoGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
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
  letter-spacing: 0;
}

.infoValue {
  font-size: 15px;
  color: var(--text);
  font-weight: 500;
}

.infoInput {
  min-height: 40px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 9px 12px;
  outline: none;
}

.infoInput:focus {
  border-color: var(--accent);
}

.securityList,
.noticeList {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.securityItem,
.noticeItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  background: #f8fafb;
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.securityLeft {
  display: flex;
  align-items: center;
  gap: 14px;
}

.securityIcon {
  width: 42px;
  height: 42px;
  border-radius: var(--radius);
  background: var(--panel);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
}

.securityTitle,
.noticeTitle {
  display: block;
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 2px;
}

.securityDesc,
.noticeDesc {
  display: block;
  font-size: 13px;
  color: var(--muted);
}

.toggle {
  position: relative;
  width: 46px;
  height: 26px;
  cursor: pointer;
  flex-shrink: 0;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggleSlider {
  position: absolute;
  inset: 0;
  background: var(--border);
  border-radius: 999px;
  transition: all var(--transition);
}

.toggleSlider::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  left: 3px;
  top: 3px;
  background: white;
  border-radius: 50%;
  transition: all var(--transition);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.18);
}

.toggle input:checked + .toggleSlider {
  background: var(--accent);
}

.toggle input:checked + .toggleSlider::before {
  transform: translateX(20px);
}

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
  background: #f8fafb;
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.exportIcon {
  width: 50px;
  height: 50px;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--panel);
  border: 1px solid var(--border);
}

.exportIcon.blue {
  color: var(--accent);
}

.exportIcon.green {
  color: #047857;
}

.exportInfo {
  flex: 1;
  min-width: 0;
}

.exportTitle {
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 2px;
}

.exportDesc {
  font-size: 13px;
  color: var(--muted);
}

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
  .infoGrid,
  .exportGrid {
    grid-template-columns: 1fr;
  }

  .userHeader {
    flex-direction: column;
    text-align: center;
  }
}
</style>
