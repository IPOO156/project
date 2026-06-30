<script setup lang="ts">
import { AlertTriangle, Award, Info, Lightbulb, TrendingUp } from 'lucide-vue-next'
import { ref } from 'vue'
import { useUserStore } from '@/app/stores'

const userStore = useUserStore()

// 个人兴趣
const interests = ref([
  { category: '编程开发', content: 'Web 前端开发、人工智能应用', level: '熟练' },
  { category: '语言能力', content: '英语（CET-6）、日语（N3）', level: '良好' },
  { category: '运动爱好', content: '篮球、跑步', level: '一般' },
])

// 学期成绩（模拟数据）
const grades = ref([
  { semester: '大一上', courses: 8, gpa: 3.2, totalScore: 85.6 },
  { semester: '大一下', courses: 7, gpa: 3.4, totalScore: 87.2 },
  { semester: '大二上', courses: 9, gpa: 3.6, totalScore: 89.5 },
  { semester: '大二下', courses: 8, gpa: 3.8, totalScore: 91.3 },
])

// 个人奖项
const awards = ref([
  { name: '全国大学生数学建模竞赛', level: '省级', award: '二等奖', date: '2025-09' },
  { name: '校级优秀学生干部', level: '校级', award: '优秀干部', date: '2025-06' },
  { name: 'ACM 程序设计竞赛', level: '校级', award: '一等奖', date: '2025-05' },
])

// 短板识别（AI 生成）
const weaknesses = ref([
  { dimension: '科研创新', score: 60, weakness: '科研项目经历较少，缺乏论文发表', suggestion: '建议参与导师科研项目，尝试撰写学术论文' },
  { dimension: '竞赛实践', score: 65, weakness: '高级别竞赛参与度不足', suggestion: '关注国家级竞赛信息，组建团队参赛' },
])

// 多维度画像
const dimensions = ref([
  { label: '学业成绩', score: 88, color: '#409eff' },
  { label: '竞赛实践', score: 65, color: '#67c23a' },
  { label: '科研创新', score: 60, color: '#e6a23c' },
  { label: '社会工作', score: 85, color: '#f56c6c' },
  { label: '综合素质', score: 80, color: '#9b59b6' },
])
</script>

<template>
  <div class="profile-info">
    <!-- 基本资料卡片 -->
    <el-card class="profile-info__section">
      <template #header>
        <div class="section-header">
          <Info :size="18" />
          <span>基本资料</span>
        </div>
      </template>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="姓名">{{ userStore.userName }}</el-descriptions-item>
        <el-descriptions-item label="学号">{{ userStore.studentId }}</el-descriptions-item>
        <el-descriptions-item label="年级">{{ userStore.userInfo?.grade }}</el-descriptions-item>
        <el-descriptions-item label="专业">{{ userStore.userInfo?.major }}</el-descriptions-item>
        <el-descriptions-item label="班级">{{ userStore.userInfo?.className }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ userStore.userInfo?.email }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 多维度画像引擎 -->
    <el-card class="profile-info__section">
      <template #header>
        <div class="section-header">
          <TrendingUp :size="18" />
          <span>多维度画像引擎</span>
        </div>
      </template>
      <el-row :gutter="24">
        <el-col v-for="dim in dimensions" :key="dim.label" :span="12">
          <div class="dimension-item">
            <div class="dimension-item__header">
              <span>{{ dim.label }}</span>
              <span class="dimension-item__score">{{ dim.score }}分</span>
            </div>
            <el-progress
              :percentage="dim.score"
              :color="dim.color"
              :stroke-width="14"
              :format="() => ''"
            />
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 个人兴趣 -->
    <el-card class="profile-info__section">
      <template #header>
        <div class="section-header">
          <Lightbulb :size="18" />
          <span>个人兴趣</span>
        </div>
      </template>
      <el-table :data="interests" stripe>
        <el-table-column prop="category" label="兴趣类别" width="160" />
        <el-table-column prop="content" label="具体内容" />
        <el-table-column prop="level" label="掌握程度" width="120">
          <template #default="{ row }">
            <el-tag :type="row.level === '熟练' ? 'success' : row.level === '良好' ? 'warning' : 'info'" size="small">
              {{ row.level }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 期末成绩 + 绩点 -->
    <el-card class="profile-info__section">
      <template #header>
        <div class="section-header">
          <Award :size="18" />
          <span>期末成绩与绩点</span>
        </div>
      </template>
      <el-table :data="grades" stripe>
        <el-table-column prop="semester" label="学期" width="120" />
        <el-table-column prop="courses" label="课程数" width="100" />
        <el-table-column prop="gpa" label="绩点" width="120">
          <template #default="{ row }">
            <span style="font-weight: 600; color: var(--el-color-primary);">{{ row.gpa }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalScore" label="平均分" />
      </el-table>
    </el-card>

    <!-- 个人奖项 -->
    <el-card class="profile-info__section">
      <template #header>
        <div class="section-header">
          <Award :size="18" />
          <span>个人奖项</span>
        </div>
      </template>
      <el-table :data="awards" stripe>
        <el-table-column prop="name" label="奖项名称" />
        <el-table-column prop="level" label="奖项级别" width="120" />
        <el-table-column prop="award" label="获奖等级" width="120" />
        <el-table-column prop="date" label="获奖时间" width="120" />
      </el-table>
    </el-card>

    <!-- 短板识别 AI 生成 -->
    <el-card class="profile-info__section">
      <template #header>
        <div class="section-header">
          <AlertTriangle :size="18" />
          <span>短板识别与改进建议</span>
          <el-tag size="small" type="warning">AI 生成</el-tag>
        </div>
      </template>
      <div v-for="item in weaknesses" :key="item.dimension" class="weakness-item">
        <div class="weakness-item__header">
          <span class="weakness-item__dim">{{ item.dimension }}</span>
          <el-progress
            :percentage="item.score"
            :stroke-width="8"
            style="width: 200px"
            status="exception"
            :format="() => `${item.score}分`"
          />
        </div>
        <el-alert
          :title="`短板：${item.weakness}`"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 8px"
        />
        <el-alert
          :title="`建议：${item.suggestion}`"
          type="success"
          :closable="false"
          show-icon
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.profile-info {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__section {
    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;

      .el-tag {
        margin-left: auto;
      }
    }
  }
}

.dimension-item {
  margin-bottom: 20px;

  &__header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
    font-size: 14px;
  }

  &__score {
    font-weight: 600;
    color: var(--el-text-color-secondary);
  }
}

.weakness-item {
  margin-bottom: 20px;
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;

  &:last-child { margin-bottom: 0; }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  &__dim {
    font-weight: 600;
    font-size: 15px;
  }
}
</style>
