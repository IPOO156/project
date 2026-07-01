<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import UiButton from '../../../components/ui/UiButton.vue'
import UiCard from '../../../components/ui/UiCard.vue'
import LineIcon from '../../../components/ui/LineIcon.vue'
import UiTag from '../../../components/ui/UiTag.vue'
import { studentArchiveCategories, getStudentArchiveCategory } from '../nav'
import { downloadText, semesterOptions, statusMeta, useArchiveStore } from '../archiveStore'

const router = useRouter()
const { sortedRecords } = useArchiveStore()

const selectedSemester = ref('')
const selectedCategory = ref('')
const keyword = ref('')

const filteredRecords = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  return sortedRecords.value.filter((item) => {
    const category = getStudentArchiveCategory(item.category)?.label ?? ''
    const matchesSemester = !selectedSemester.value || item.semester === selectedSemester.value
    const matchesCategory = !selectedCategory.value || item.category === selectedCategory.value
    const matchesKeyword =
      !key ||
      [item.title, item.organization, item.review, category].some((value) =>
        String(value ?? '').toLowerCase().includes(key),
      )

    return matchesSemester && matchesCategory && matchesKeyword
  })
})

function exportReport() {
  const lines = [
    '成长时间轴报告',
    `生成时间：${new Date().toLocaleString()}`,
    `筛选结果：${filteredRecords.value.length} 条`,
    '',
    ...filteredRecords.value.map((item) => {
      const category = getStudentArchiveCategory(item.category)?.label ?? item.category
      const status = statusMeta[item.status]?.label ?? item.status
      return `${item.date}｜${category}｜${item.title}｜${status}｜材料 ${item.files.length} 份`
    }),
  ]

  downloadText('成长时间轴报告.txt', lines.join('\n'))
}

function openDetail(item) {
  router.push(`/student/archive/${item.category}?view=${item.id}`)
}
</script>

<template>
  <div class="timelinePage">
    <div class="pageHeader">
      <div>
        <h1 class="pageTitle">成长时间轴</h1>
        <p class="pageSub">按时间查看档案提交、审核和补充记录。</p>
      </div>
      <UiButton variant="secondary" size="sm" @click="exportReport">
        <LineIcon name="download" :size="14" />
        导出报告
      </UiButton>
    </div>

    <UiCard padding="md" class="filters">
      <div class="filterGrid">
        <label class="filterItem">
          <span class="filterLabel">学期</span>
          <select v-model="selectedSemester" class="filterSelect">
            <option value="">全部学期</option>
            <option v-for="semester in semesterOptions" :key="semester" :value="semester">{{ semester }}</option>
          </select>
        </label>
        <label class="filterItem">
          <span class="filterLabel">分类</span>
          <select v-model="selectedCategory" class="filterSelect">
            <option value="">全部分类</option>
            <option v-for="category in studentArchiveCategories" :key="category.key" :value="category.key">
              {{ category.label }}
            </option>
          </select>
        </label>
        <label class="filterItem search">
          <span class="filterLabel">关键词</span>
          <span class="searchBox">
            <LineIcon name="search" :size="16" />
            <input v-model="keyword" class="searchInput" placeholder="搜索活动、证书、组织名称" />
          </span>
        </label>
      </div>
    </UiCard>

    <div class="timeline">
      <div class="timelineLine"></div>

      <div v-for="item in filteredRecords" :key="item.id" class="tItem">
        <div class="timelineDot" :data-status="item.status"></div>
        <UiCard padding="md" class="timelineCard">
          <div class="tHeader">
            <div class="tMeta">
              <span class="tDate">{{ item.date }}</span>
              <UiTag size="sm" :tone="statusMeta[item.status].tone">{{ statusMeta[item.status].label }}</UiTag>
            </div>
            <h3 class="tTitle">{{ getStudentArchiveCategory(item.category)?.label }} - {{ item.title }}</h3>
            <p class="tDesc">{{ item.organization }} · {{ item.semester }}</p>
          </div>
          <div class="tFooter">
            <div class="tFiles">
              <LineIcon name="file" :size="14" />
              上传材料 {{ item.files.length }} 份
            </div>
            <UiButton variant="ghost" size="sm" @click="openDetail(item)">查看详情</UiButton>
          </div>
        </UiCard>
      </div>

      <UiCard v-if="filteredRecords.length === 0" padding="lg" class="empty">
        <LineIcon name="search" :size="28" />
        <div>
          <strong>没有找到匹配记录</strong>
          <p>调整学期、分类或关键词后再试。</p>
        </div>
      </UiCard>
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
  letter-spacing: 0;
  margin-bottom: 4px;
}

.pageSub {
  font-size: 14px;
  color: var(--muted);
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

.filterLabel {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
}

.filterSelect,
.searchBox {
  min-height: 40px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: #f8fafb;
  color: var(--text);
  font-size: 14px;
  transition: all var(--transition);
}

.filterSelect {
  padding: 9px 12px;
  cursor: pointer;
}

.filterSelect:hover,
.searchBox:focus-within {
  border-color: var(--accent);
  background: var(--panel);
}

.searchBox {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  color: var(--muted);
}

.searchInput {
  flex: 1;
  padding: 9px 0;
  border: none;
  background: transparent;
  color: var(--text);
  font-size: 14px;
  outline: none;
}

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
  background: var(--border);
  border-radius: 1px;
}

.tItem {
  position: relative;
  padding-bottom: 18px;
}

.tItem:last-child {
  padding-bottom: 0;
}

.timelineDot {
  position: absolute;
  left: -25px;
  top: 22px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 3px solid var(--panel);
  z-index: 1;
  background: var(--muted);
}

.timelineDot[data-status='ok'] {
  background: var(--success);
}

.timelineDot[data-status='wait'] {
  background: var(--warning);
}

.timelineDot[data-status='no'] {
  background: var(--danger);
}

.timelineDot[data-status='draft'] {
  background: #98a2b3;
}

.timelineCard {
  transition: all var(--transition);
}

.timelineCard:hover {
  border-color: var(--accent);
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

@media (max-width: 768px) {
  .filterGrid {
    grid-template-columns: 1fr;
  }

  .pageHeader {
    flex-direction: column;
  }
}
</style>
