<script setup lang="ts" generic="T">
interface Props {
  alertTitle: string
  alertDescription: string
  isEditing?: boolean
  submitting?: boolean
  records?: T[]
  showAlert?: boolean
  showRecords?: boolean
}

withDefaults(defineProps<Props>(), {
  records: () => [],
  showAlert: true,
  showRecords: true,
})

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'cancel'): void
  (e: 'view', row: T): void
  (e: 'edit', row: T): void
  (e: 'remove', row: T): void
}>()
</script>

<template>
  <div class="app-page">
    <el-alert v-if="showAlert" :title="alertTitle" type="info" :closable="false" show-icon>
      <p>{{ alertDescription }}</p>
    </el-alert>

    <el-card class="form-card">
      <template #header>
        <span class="card-title">{{ isEditing ? '编辑报名信息' : '填写报名信息' }}</span>
      </template>
      <slot name="form" />
      <div class="form-actions">
        <el-button v-if="isEditing" @click="$emit('cancel')">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="$emit('submit')">
          {{ isEditing ? '保存修改' : '提交报名' }}
        </el-button>
      </div>
    </el-card>

    <el-card v-if="showRecords && records.length" class="record-card">
      <template #header>
        <span class="card-title">报名记录</span>
      </template>
      <el-table :data="records as any" stripe>
        <slot name="columns" />
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="emit('view', row as T)"
              >查看</el-button
            >
            <el-button size="small" type="primary" link @click="emit('edit', row as T)"
              >编辑</el-button
            >
            <el-button size="small" type="danger" link @click="emit('remove', row as T)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.app-page {
  display: flex;
  flex-direction: column;
  gap: 16px;

  // el-alert 描述段落的默认边距与项目设计规范不符，Element Plus 未暴露相关 props，需覆盖内部类名。
  :deep(.el-alert__description) p {
    margin: 4px 0 0;
    font-size: 13px;
  }
}

.form-card,
.record-card {
  /* 顶部装饰线已去除 */

  .card-title {
    font-weight: 600;
  }
}

.form-card {
  // 统一申报表单中各类输入框宽度，避免 input/select/date-picker/textarea 长短不一
  :deep(.el-form) {
    .el-input,
    .el-input-number,
    .el-select,
    .el-date-editor,
    .el-textarea {
      width: 480px;
      max-width: 100%;
    }
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}
</style>
