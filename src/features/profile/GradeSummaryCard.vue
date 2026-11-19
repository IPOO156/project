<script setup lang="ts">
/**
 * 期末成绩卡片：按学期展示汇总（绩点/均分/课程数），
 * 若后端回传了 semesterGrades[].courses，则逐科列出每门课的期末成绩。
 */
import { GraduationCap } from 'lucide-vue-next'

defineProps<{
  /** 各学期成绩汇总（已按学期升序），courseList 为该学期逐课明细 */
  gradeSummary: Array<{
    semester: string
    courses: number
    gpa: number
    totalScore: number
    courseList?: Array<{
      courseCode: string
      courseName: string
      courseType: string
      credit: number
      gpa: number
      score: number
    }>
  }>
  /** 平均绩点文案（后端 overallGpa；加载失败时为 '--'） */
  avgGpa: string
  /** 是否存在逐课明细；false 时展示「仅学期汇总」说明 */
  hasDetail?: boolean
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

        <div v-if="g.courseList?.length" class="course-list">
          <div
            v-for="(c, i) in g.courseList"
            :key="c.courseCode || `${c.courseName}-${i}`"
            class="course-row"
          >
            <span class="course-row__name">{{ c.courseName }}</span>
            <span class="course-row__meta">
              {{
                [c.courseType, c.credit ? `${c.credit} 学分` : '', c.gpa ? `绩点 ${c.gpa}` : '']
                  .filter(Boolean)
                  .join(' · ')
              }}
            </span>
            <span class="course-row__score">{{ c.score }}</span>
          </div>
        </div>
      </div>
    </div>
    <p v-if="hasDetail === false" class="grade-note">暂无课程明细，当前按学期汇总展示</p>
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
.grade-note {
  margin: 10px 0 0;
  font-size: 12px;
  color: #94a3b8;
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

// 逐课成绩
.course-list {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.course-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 12px;
}
.course-row__name {
  flex: 1;
  min-width: 0;
  color: #334155;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.course-row__meta {
  font-size: 11px;
  color: #94a3b8;
  white-space: nowrap;
}
.course-row__score {
  min-width: 40px;
  text-align: right;
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
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
  .course-list {
    border-color: rgba(255, 255, 255, 0.08);
  }
  .course-row__name {
    color: #cbd5e1;
  }
  .course-row__meta {
    color: #64748b;
  }
  .course-row__score {
    color: #f1f5f9;
  }
}
</style>
