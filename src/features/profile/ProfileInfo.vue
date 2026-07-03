<script setup lang="ts">
import { Download, BookOpen, FileText, KeyRound, TrendingUp } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/app/stores/stores'
import { useExport } from '@/shared/composables/composables'

const router = useRouter()
const userStore = useUserStore()
const { exporting, exportData } = useExport()

// 导航快捷入口
const navEntries = [
  { label: '成长时间轴', path: '/profile/timeline', icon: TrendingUp, color: '#2ecc71', desc: '查看成长历程' },
  { label: '职业规划', path: '/profile/career-plan', icon: BookOpen, color: '#e6a23c', desc: '制定职业目标' },
  { label: '修改密码', path: '/profile/edit-password', icon: KeyRound, color: '#909399', desc: '安全设置' },
  { label: '提交记录', path: '/approval/records', icon: FileText, color: '#409eff', desc: '查看申报历史' },
]

// 构造导出数据
const exportDataPayload = computed<Record<string, unknown>>(() => ({
  exportTime: new Date().toISOString(),
  userInfo: {
    name: userStore.userName,
    studentId: userStore.studentId,
    grade: userStore.userInfo?.grade,
    major: userStore.userInfo?.major,
    className: userStore.userInfo?.className,
    email: userStore.userInfo?.email,
  },
}))

function handleExport() {
  exportData('个人档案信息', exportDataPayload.value)
}
</script>

<template>
  <div class="profile-info">
    <!-- 标题区 -->
    <div class="profile-info__header">
      <h2 class="profile-info__title">个人档案信息</h2>
      <el-button
        type="primary"
        :loading="exporting"
        :icon="Download"
        @click="handleExport"
      >
        导出档案
      </el-button>
    </div>

    <!-- 基本资料卡片 -->
    <el-card class="profile-info__section">
      <template #header>
        <div class="section-header">
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

    <!-- 快捷导航卡片 -->
    <el-card class="profile-info__section">
      <template #header>
        <div class="section-header">
          <span>功能导航</span>
        </div>
      </template>
      <el-row :gutter="16">
        <el-col v-for="entry in navEntries" :key="entry.label" :span="6">
          <el-card
            shadow="hover"
            class="nav-card"
            @click="router.push(entry.path)"
          >
            <div class="nav-card__body">
              <div
                class="nav-card__icon"
                :style="{ background: `${entry.color}15`, color: entry.color }"
              >
                <component :is="entry.icon" :size="24" />
              </div>
              <div class="nav-card__info">
                <span class="nav-card__label">{{ entry.label }}</span>
                <span class="nav-card__desc">{{ entry.desc }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.profile-info {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__title {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 0;
  }

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

.nav-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
  }

  &__body {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__label {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>
