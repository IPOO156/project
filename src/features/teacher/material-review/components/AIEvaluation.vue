<script setup lang="ts">
import { Bot, Check, Edit3, X } from 'lucide-vue-next'
import { ref } from 'vue'

const props = withDefaults(defineProps<{ content?: string }>(), {
  content: '该同学申报材料基本完整，竞赛成果显著，建议予以通过。',
})
const emit = defineEmits<{
  (e: 'accept'): void
  (e: 'modify', text: string): void
  (e: 'reject'): void
}>()

const status = ref<'pending' | 'accepted' | 'modified' | 'rejected'>('pending')
const editMode = ref(false)
const editText = ref('')

function handleAccept() {
  status.value = 'accepted'
  emit('accept')
}
function handleReject() {
  status.value = 'rejected'
  emit('reject')
}
function startEdit() {
  editMode.value = true
  editText.value = props.content
}
function saveEdit() {
  status.value = 'modified'
  editMode.value = false
  emit('modify', editText.value)
}
</script>

<template>
  <div class="ai-eval">
    <div class="ai-eval__header">
      <Bot :size="16" class="ai-eval__icon" /><span class="ai-eval__title">AI 辅助评价</span
      ><el-tag size="small" type="warning" effect="plain">AI 辅助生成，请教师复核</el-tag>
    </div>
    <div v-if="!editMode" class="ai-eval__content">{{ content }}</div>
    <el-input v-else v-model="editText" type="textarea" :rows="4" class="ai-eval__edit" />
    <div v-if="status === 'pending'" class="ai-eval__actions">
      <el-button size="small" type="success" :icon="Check" @click="handleAccept">采纳</el-button>
      <el-button size="small" :icon="Edit3" @click="startEdit">{{
        editMode ? '取消' : '修改'
      }}</el-button>
      <el-button v-if="editMode" size="small" type="primary" @click="saveEdit">保存修改</el-button>
      <el-button size="small" type="danger" :icon="X" @click="handleReject">拒绝</el-button>
    </div>
    <div v-else class="ai-eval__result">
      <el-tag
        :type="status === 'accepted' ? 'success' : status === 'modified' ? 'warning' : 'info'"
        size="small"
        >{{ { accepted: '已采纳', modified: '已修改', rejected: '已拒绝' }[status] }}</el-tag
      >
    </div>
  </div>
</template>

<style scoped lang="scss">
.ai-eval {
  margin-top: 12px;
  padding: 12px 14px;
  border: 1px solid #fde68a;
  border-radius: 8px;
  background: #fffbeb;
}
.ai-eval__header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}
.ai-eval__icon {
  color: #f59e0b;
}
.ai-eval__title {
  font-size: 13px;
  font-weight: 600;
  color: #92400e;
}
.ai-eval__content {
  font-size: 13px;
  color: var(--el-text-color-primary);
  line-height: 1.6;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  margin-bottom: 8px;
}
.ai-eval__edit {
  margin-bottom: 8px;
}
.ai-eval__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.ai-eval__result {
  margin-top: 4px;
}
</style>
