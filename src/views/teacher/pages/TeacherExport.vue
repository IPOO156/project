<script setup>
import { ref } from 'vue'

import UiButton from '../../../components/ui/UiButton.vue'
import UiCard from '../../../components/ui/UiCard.vue'
import LineIcon from '../../../components/ui/LineIcon.vue'
import { exportRecords, exportTemplate, useArchiveStore } from '../../student/archiveStore'

const { records } = useArchiveStore()
const exporting = ref(false)

const exportItems = [
  {
    icon: 'file',
    title: '全部档案导出',
    desc: '包含所有分类、审核状态的档案条目',
    action: () => { exportRecords(records.value, '全部档案数据.csv'); exporting.value = true; setTimeout(() => exporting.value = false, 1500) },
  },
  {
    icon: 'check',
    title: '已通过档案',
    desc: '仅导出审核已通过的档案条目',
    action: () => { exportRecords(records.value.filter(r => r.status === 'ok'), '已通过档案.csv') },
  },
  {
    icon: 'clock',
    title: '待审核清单',
    desc: '导出当前待审核的档案列表',
    action: () => { exportRecords(records.value.filter(r => r.status === 'wait'), '待审核清单.csv') },
  },
  {
    icon: 'close',
    title: '已驳回记录',
    desc: '导出被驳回需补充的档案',
    action: () => { exportRecords(records.value.filter(r => r.status === 'no'), '已驳回记录.csv') },
  },
  {
    icon: 'download',
    title: '导入模板下载',
    desc: 'CSV 模板，用于批量导入档案数据',
    action: () => { exportTemplate('批量导入') },
  },
  {
    icon: 'book',
    title: '全量数据报告',
    desc: 'TXT 格式的完整档案报告',
    action: () => {
      const lines = [
        '档案管理全量数据报告',
        `导出时间：${new Date().toLocaleString()}`,
        `总条目：${records.value.length}`,
        '',
        ...records.value.map(r => `${r.date} | ${r.title} | ${r.organization} | ${r.status}`),
      ]
      const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = '全量数据报告.txt'; a.click()
      URL.revokeObjectURL(url)
    },
  },
]
</script>

<template>
  <div class="exportPage">
    <div class="pageHeader">
      <div>
        <h1 class="pageTitle">导出管理</h1>
        <p class="pageSub">数据导出与模板下载</p>
      </div>
    </div>

    <div class="exportGrid">
      <UiCard
        v-for="item in exportItems"
        :key="item.title"
        padding="lg"
        class="exportCard"
        hoverable
        @click="item.action"
      >
        <div class="exportIcon">
          <LineIcon :name="item.icon" :size="26" />
        </div>
        <div class="exportInfo">
          <div class="exportTitle">{{ item.title }}</div>
          <div class="exportDesc">{{ item.desc }}</div>
        </div>
        <UiButton variant="secondary" size="sm" @click.stop="item.action">
          <LineIcon name="download" :size="14" />
          导出
        </UiButton>
      </UiCard>
    </div>

    <UiCard v-if="exporting" padding="md" class="successNote">
      <LineIcon name="check" :size="16" />
      导出任务已启动，文件将自动下载。
    </UiCard>
  </div>
</template>

<style scoped>
.exportPage {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.pageHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.pageTitle { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
.pageSub { font-size: 14px; color: var(--muted); }

.exportGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.exportCard {
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all var(--transition);
}

.exportCard:hover { border-color: var(--accent); box-shadow: var(--shadow); }

.exportIcon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-light);
  color: var(--accent);
  flex-shrink: 0;
}

.exportInfo { flex: 1; min-width: 0; }

.exportTitle { font-weight: 700; font-size: 15px; margin-bottom: 4px; }
.exportDesc { font-size: 13px; color: var(--muted); }

.successNote {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--accent);
  font-weight: 600;
  font-size: 14px;
  background: var(--accent-light);
  border-color: var(--accent-subtle);
}

@media (max-width: 768px) {
  .exportGrid { grid-template-columns: 1fr; }
}
</style>
