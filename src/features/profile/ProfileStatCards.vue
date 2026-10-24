<script setup lang="ts">
/**
 * 档案概览顶部四张统计卡（纯展示）。
 * 数据全部由父级 ProfileInfo 从 archiveStore 计算后传入，组件内不发请求。
 */
import { GraduationCap, Lightbulb, Plus } from 'lucide-vue-next'

defineProps<{
  /** 平均绩点文案（后端 overallGpa；加载失败时为 '--'） */
  avgGpa: string
  /** 获奖总数（加载失败时为 '--'） */
  totalAwardCount: number | string
  /** 课程总数（加载失败时为 '--'） */
  totalCourses: number | string
  /** 综合评分（null = 尚无计算结果，展示占位符） */
  dimAvg: number | null
}>()
</script>

<template>
  <div class="stat-grid">
    <div class="stat-card">
      <div class="stat-card__inner">
        <div>
          <p class="stat-card__label">平均绩点</p>
          <p class="stat-card__value">{{ avgGpa }}</p>
        </div>
        <div class="stat-card__icon stat-card__icon--gpa">
          <GraduationCap :size="20" />
        </div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-card__inner">
        <div>
          <p class="stat-card__label">获奖总数</p>
          <p class="stat-card__value">{{ totalAwardCount }}</p>
        </div>
        <div class="stat-card__icon stat-card__icon--award">
          <Plus :size="20" />
        </div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-card__inner">
        <div>
          <p class="stat-card__label">课程总数</p>
          <p class="stat-card__value">{{ totalCourses }}</p>
        </div>
        <div class="stat-card__icon stat-card__icon--course">
          <GraduationCap :size="20" />
        </div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-card__inner">
        <div>
          <p class="stat-card__label">综合评分</p>
          <p class="stat-card__value">{{ dimAvg ?? '--' }}</p>
        </div>
        <div class="stat-card__icon stat-card__icon--score">
          <Lightbulb :size="20" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
// 统计卡片
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.stat-card {
  border: 1px solid #f1f5f9;
  border-radius: 10px;
  background: #fff;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  &:hover {
    border-color: #e2e8f0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  }
}
.stat-card__inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
}
.stat-card__label {
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 2px;
}
.stat-card__value {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}
.stat-card__icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &--gpa {
    background: #e8f0fe;
    color: #4a7fb5;
  }
  &--award {
    background: #fef3e2;
    color: #d4a574;
  }
  &--course {
    background: #e6f7ee;
    color: #10b981;
  }
  &--score {
    background: #f0e6ff;
    color: #8b5cf6;
  }
}

@media (max-width: 900px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

// ─── 夜间模式适配 ───
// 盒子降亮度：页面级盒子与卡片同层（#0f172a），卡片内嵌套盒再暗一档（#1e293b），
// 图标底改用低透明度叠色，避免实色浅底刺眼；硬编码深色文字同步亮化保证可读性
html.dark {
  .stat-card {
    background: #0f172a;
    border-color: #334155;

    &:hover {
      border-color: #475569;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
    }
  }
  .stat-card__value {
    color: #f1f5f9;
  }
  .stat-card__icon--gpa {
    background: rgba(96, 165, 250, 0.14);
    color: #7fb0e0;
  }
  .stat-card__icon--award {
    background: rgba(212, 165, 116, 0.14);
    color: #dbb68c;
  }
  .stat-card__icon--course {
    background: rgba(16, 185, 129, 0.14);
    color: #34d399;
  }
  .stat-card__icon--score {
    background: rgba(139, 92, 246, 0.16);
    color: #a78bfa;
  }
}
</style>
