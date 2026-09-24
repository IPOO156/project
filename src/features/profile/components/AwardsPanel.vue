<script setup lang="ts">
import { Award } from 'lucide-vue-next'

/**
 * 个人奖项（只读展示）
 * 数据源：GET /profile/info → personalAwards（后端按类别聚合 category/totalCount/maxLevel/latestTime，
 * 由申报/奖项报名审核通过的记录汇总，见接口文档 4.1）。
 * 方案一：后端无个人奖项 CRUD 接口，前端不提供手动新增/编辑/删除，避免「新增后刷新消失」的假象。
 */
defineProps<{
  awards: Array<{ category: string; totalCount: number; maxLevel: string; latestTime: string }>
}>()
</script>

<template>
  <el-card class="profile-card">
    <template #header>
      <div class="card-header">
        <div class="card-header__left">
          <Award :size="16" />
          <span>个人奖项</span>
        </div>
        <span class="card-header__note">申报审核通过后自动汇总</span>
      </div>
    </template>
    <div v-if="awards.length" class="award-list">
      <div v-for="(a, i) in awards" :key="`${a.category}-${i}`" class="award-item">
        <div class="award-item__icon">
          <Award :size="18" />
        </div>
        <div class="award-item__body">
          <div class="award-item__name">{{ a.category }}</div>
          <div class="award-item__meta">
            <el-tag size="small" type="warning" effect="plain">{{ a.maxLevel }}</el-tag>
            <span>共 {{ a.totalCount }} 项</span>
            <span v-if="a.latestTime">最近 {{ a.latestTime }}</span>
          </div>
        </div>
      </div>
    </div>
    <el-empty v-else :image-size="56" description="暂无奖项记录，通过申报审核后自动汇总" />
  </el-card>
</template>

<style scoped lang="scss">
.profile-card {
  margin-bottom: 0;

  :deep(.el-card__body) {
    padding: 16px 20px;
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 15px;
  font-weight: 600;

  &__left {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--el-text-color-primary);
  }

  &__note {
    font-size: 12px;
    font-weight: 400;
    color: var(--el-text-color-secondary);
  }
}

.award-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.award-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  transition: border-color 0.2s;

  &:hover {
    border-color: #d4a574;
  }

  &__icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(212, 165, 116, 0.1);
    color: #d4a574;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 4px;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>
