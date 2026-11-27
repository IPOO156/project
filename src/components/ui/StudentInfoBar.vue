<script setup lang="ts">
import { GraduationCap } from 'lucide-vue-next'

interface Props {
  grade?: string
  className?: string
  major?: string
  studentId?: string
  college?: string
}
withDefaults(defineProps<Props>(), {
  grade: '-',
  className: '-',
  major: '-',
  studentId: '-',
  college: '-',
})
</script>

<template>
  <div class="student-info-bar">
    <div class="student-info-bar__icon">
      <GraduationCap :size="18" /><span class="student-info-bar__label">学籍信息</span>
    </div>
    <div class="student-info-bar__items">
      <span class="student-info-bar__item"
        ><span class="student-info-bar__key">年级</span
        ><span class="student-info-bar__val">{{ grade }}</span></span
      >
      <span class="student-info-bar__item"
        ><span class="student-info-bar__key">班级</span
        ><span class="student-info-bar__val">{{ className }}</span></span
      >
      <span class="student-info-bar__item"
        ><span class="student-info-bar__key">专业</span
        ><span class="student-info-bar__val">{{ major }}</span></span
      >
      <span class="student-info-bar__item"
        ><span class="student-info-bar__key">学号</span
        ><span class="student-info-bar__val">{{ studentId }}</span></span
      >
      <span class="student-info-bar__item"
        ><span class="student-info-bar__key">学院</span
        ><span class="student-info-bar__val">{{ college }}</span></span
      >
    </div>
    <el-tag size="small" type="info" effect="plain">仅限查看</el-tag>
  </div>
</template>

<style scoped lang="scss">
.student-info-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 10px 16px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  margin-bottom: 16px;
}
.student-info-bar__icon {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--el-color-primary);
  flex-shrink: 0;
}
.student-info-bar__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.student-info-bar__items {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  flex: 1;
}
.student-info-bar__item {
  display: flex;
  align-items: center;
  gap: 4px;
}
.student-info-bar__key {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.student-info-bar__val {
  font-size: 13px;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

@media (max-width: 768px) {
  /* 窄屏下 5 项纯 flex 换行会变成 4+1，末项孤零零一行。
     改为「图标 + 仅限查看」占首行、信息项 2 列网格，学院独占整行，行行齐平 */
  .student-info-bar {
    align-items: flex-start;
    row-gap: 10px;
  }

  .student-info-bar__icon {
    order: 1;
  }

  /* 用 order 把标签提到信息项之前，避免它被整行宽的 items 挤到第三行 */
  .student-info-bar > .el-tag {
    order: 2;
    margin-left: auto;
    flex-shrink: 0;
  }

  .student-info-bar__items {
    order: 3;
    flex: 0 0 100%;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px 12px;
  }

  .student-info-bar__item {
    min-width: 0;
  }

  /* 学院名称通常最长，独占整行，避免被截断或撑乱 2 列网格 */
  .student-info-bar__item:last-child {
    grid-column: 1 / -1;
  }
}
</style>
