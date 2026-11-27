<script setup lang="ts" generic="T">
import { ref } from 'vue'
import ApplicationRecordTable from './ApplicationRecordTable.vue'
import RejectionBanner from './RejectionBanner.vue'
import StatusTag from './StatusTag.vue'
import StudentInfoBar from './StudentInfoBar.vue'

interface Props {
  alertTitle: string
  alertDescription: string
  isEditing?: boolean
  submitting?: boolean
  records?: T[]
  showAlert?: boolean
  showRecords?: boolean
  status?: string
  rejectionReason?: string
  enrollmentInfo?: Record<string, string>
  submitText?: string
}

withDefaults(defineProps<Props>(), {
  records: () => [],
  showAlert: true,
  showRecords: true,
  status: '',
  rejectionReason: '',
  enrollmentInfo: undefined,
  submitText: '提交报名',
})

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'cancel'): void
  (e: 'saveDraft'): void
  (e: 'view', row: T): void
  (e: 'edit', row: T): void
  (e: 'remove', row: T): void
  (e: 'withdraw', row: T): void
  (e: 'correction', row: T): void
  (e: 'score', row: T): void
}>()

function canEdit(s: string) {
  return s === 'draft' || !s || s === 'rejected'
}

/** 申报说明默认收起：说明文字较长，展开后会把表单卡挤出首屏 */
const noticeOpen = ref(false)
</script>

<template>
  <div class="app-page">
    <!-- 常驻渲染：数据到达后原地替换占位短横线，避免异步插入把下方内容整体下推 -->
    <StudentInfoBar v-bind="enrollmentInfo ?? {}" />
    <RejectionBanner
      v-if="rejectionReason && (status === 'rejected' || status === 'pending')"
      :reason="rejectionReason"
    />
    <el-alert v-if="showAlert" type="info" :closable="false" show-icon>
      <template #title>
        <span class="app-page__alert-title">
          {{ alertTitle }}
          <el-button
            v-if="alertDescription"
            link
            type="primary"
            size="small"
            class="app-page__alert-toggle"
            @click="noticeOpen = !noticeOpen"
          >
            {{ noticeOpen ? '收起说明' : '查看说明' }}
          </el-button>
        </span>
      </template>
      <el-collapse-transition>
        <p v-if="noticeOpen && alertDescription" class="app-page__alert-desc">
          {{ alertDescription }}
        </p>
      </el-collapse-transition>
      <div v-if="status" class="app-page__status-bar">
        当前状态：<StatusTag :status="status" size="small" />
      </div>
    </el-alert>

    <el-card class="form-card">
      <template #header>
        <!-- 表单卡是页面的主操作区：标题 + 说明让「在哪里填报」一眼可见；
             上方报名说明已带图标，此处不再重复放图标 -->
        <div class="form-card__head">
          <div class="form-card__head-text">
            <span class="form-card__head-title">{{
              isEditing ? '编辑申报信息' : '填写申报信息'
            }}</span>
            <span class="form-card__head-desc">带 * 为必填项，填完后点击下方「提交申报」</span>
          </div>
        </div>
      </template>

      <slot name="form" />

      <div class="form-actions">
        <el-button v-if="canEdit(status)" @click="emit('saveDraft')">保存草稿</el-button>
        <el-button v-if="isEditing && canEdit(status)" @click="emit('cancel')">取消</el-button>
        <el-button
          v-if="canEdit(status)"
          type="primary"
          :loading="submitting"
          @click="emit('submit')"
          >{{ isEditing ? '保存修改' : submitText }}</el-button
        >
        <el-tag v-if="status === 'approved' || status === 'withdrawn'" type="info" effect="plain"
          >当前记录仅可查看</el-tag
        >
      </div>
    </el-card>

    <ApplicationRecordTable
      :records="records"
      :show-records="showRecords"
      :status="status"
      @view="emit('view', $event as T)"
      @edit="emit('edit', $event as T)"
      @remove="emit('remove', $event as T)"
      @withdraw="emit('withdraw', $event as T)"
      @correction="emit('correction', $event as T)"
      @score="emit('score', $event as T)"
    >
      <template #columns><slot name="columns" /></template>
    </ApplicationRecordTable>
  </div>
</template>

<style scoped lang="scss">
.app-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  :deep(.el-alert__description) p {
    margin: 4px 0 0;
    font-size: 13px;
  }
  /* 公告标题行：标题与「查看说明」同一行，按钮不换行 */
  &__alert-title {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  &__alert-toggle {
    flex-shrink: 0;
  }
  &__alert-desc {
    margin: 8px 0 0;
    font-size: 13px;
    line-height: 1.7;
    color: var(--el-text-color-regular);
  }
  &__status-bar {
    margin-top: 8px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
/* 表单卡头部：浅品牌色底形成「填报区」的视觉锚点 */
.form-card :deep(.el-card__header) {
  padding: 12px 20px;
  background: linear-gradient(90deg, var(--el-color-primary-light-9), var(--el-bg-color));
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.form-card__head {
  display: flex;
  align-items: center;
}
.form-card__head-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.3;
}
.form-card__head-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.form-card__head-desc {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.form-card :deep(.el-form) .el-input,
.form-card :deep(.el-form) .el-select,
.form-card :deep(.el-form) .el-date-editor,
.form-card :deep(.el-form) .el-textarea,
.form-card :deep(.el-form) .proof-upload {
  width: 480px;
  max-width: 100%;
}
/* 上传区跟随控件宽度：el-upload 默认按内容自适应，会比其他输入框窄一截 */
.form-card :deep(.el-form) .proof-upload .el-upload {
  width: 100%;
}
.form-card {
  /* el-card 默认 overflow:hidden 会禁用子元素 sticky，这里放行 */
  overflow: visible;
}
.form-actions {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 12px;
  /* 吸底常驻：表单较长时提交按钮始终可见，不必滚到底部 */
  position: sticky;
  bottom: 0;
  z-index: 3;
  /* 横向负边距让操作条撑满卡片宽度；左内边距与原表单控件左缘对齐 */
  margin: 16px calc(var(--el-card-padding) * -1) 0;
  padding: 12px var(--el-card-padding) 12px calc(var(--el-card-padding) + 120px);
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 -2px 8px rgb(0 0 0 / 4%);

  :deep(.el-button) {
    min-width: 96px;
  }
}
@media (max-width: 768px) {
  /* 控件改为 100% 后按钮跟随表单左缘 */
  .form-actions {
    padding-left: var(--el-card-padding);
    /* 吸底条贴在视口底部，需避开 iPhone 全面屏底部横条 */
    padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  }
  .form-card :deep(.el-form) .el-input,
  .form-card :deep(.el-form) .el-select,
  .form-card :deep(.el-form) .el-date-editor,
  .form-card :deep(.el-form) .el-textarea,
  .form-card :deep(.el-form) .proof-upload {
    width: 100%;
  }
}
</style>
