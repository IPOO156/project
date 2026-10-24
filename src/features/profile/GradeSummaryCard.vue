<script setup lang="ts">
/**
 * 期末成绩卡片（纯展示）：按学期汇总的绩点/均分/课程数由父级 ProfileInfo 计算后传入。
 */
import { GraduationCap } from 'lucide-vue-next'

defineProps<{
  /** 各学期成绩汇总（已按学期升序） */
  gradeSummary: Array<{ semester: string; courses: number; gpa: number; totalScore: number }>
  /** 平均绩点文案（后端 overallGpa；加载失败时为 '--'） */
  avgGpa: string
}>()
</script>

<template>
  <el-card class="section-card" shadow="never">
    <template #header
      ><div class="section-head">
        <span class="section-head__title"><GraduationCap :size="15" /> 期末成绩</span
        ><span class="section-head__tag">平均绩点 {{ avgGpa }}</span>
      </div></template
    >
    <div class="grade-list">
      <div v-for="g in gradeSummary" :key="g.semester" class="grade-item">
        <div class="grade-item__sem">{{ g.semester.replace(/-(\d)$/g, '第$1学期') }}</div>
        <div class="grade-item__body">
          <div class="grade-item__stat">
            <span class="grade-item__num">{{ g.gpa }}</span
            ><span class="grade-item__lbl">绩点</span>
          </div>
          <div class="grade-item__stat">
            <span class="grade-item__num">{{ g.totalScore }}</span
            ><span class="grade-item__lbl">均分</span>
          </div>
          <div class="grade-item__stat">
            <span class="grade-item__num">{{ g.courses }}</span
            ><span class="grade-item__lbl">课程</span>
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<style scoped lang="scss">
// 区块卡片
.section-card {
  border: 1px solid #f1f5f9;
  border-radius: 10px;
  :deep(.el-card__body) {
    padding: 16px 20px;
  }
}
.section-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-head__title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}
.section-head__tag {
  font-size: 12px;
  color: #94a3b8;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f8fafc;
}

// 成绩
.grade-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.grade-item {
  padding: 10px 12px;
  border-radius: 6px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
}
.grade-item__sem {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 4px;
}
.grade-item__body {
  display: flex;
  gap: 20px;
}
.grade-item__stat {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.grade-item__num {
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
}
.grade-item__lbl {
  font-size: 11px;
  color: #cbd5e1;
}

// ─── 夜间模式适配 ───
html.dark {
  .section-card {
    border-color: #334155;
  }
  .section-head__title {
    color: #f1f5f9;
  }
  .section-head__tag {
    background: #1e293b;
    color: #94a3b8;
  }

  .grade-item {
    background: #1e293b;
    border-color: rgba(255, 255, 255, 0.08);
  }
  .grade-item__num {
    color: #f1f5f9;
  }
  .grade-item__lbl {
    color: #64748b;
  }
}
</style>
