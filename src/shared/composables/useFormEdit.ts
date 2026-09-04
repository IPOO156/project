import type { FormRecord } from './useFormRecords'
/**
 * useFormEdit - 统一管理表单记录的查看/编辑状态
 *
 * 配合 useFormRecords 使用，提供查看弹窗和编辑模式切换。
 */
import { computed, ref } from 'vue'

export function useFormEdit() {
  const editingId = ref<string | null>(null)
  const detailVisible = ref(false)
  const detailRecord = ref<FormRecord | null>(null)

  const isEditing = computed(() => editingId.value !== null)

  /** 查看模式：打开详情弹窗 */
  function viewRecord(record: FormRecord) {
    detailRecord.value = record
    editingId.value = null
    detailVisible.value = true
  }

  /** 编辑模式：设置编辑 ID，打开详情弹窗（可由父组件监听后处理表单填充） */
  function startEdit(record: FormRecord) {
    detailRecord.value = record
    editingId.value = record.id
    detailVisible.value = false // 编辑不需要弹窗，由父组件处理
  }

  /** 取消编辑 */
  function cancelEdit() {
    editingId.value = null
    detailRecord.value = null
  }

  /** 关闭详情弹窗 */
  function closeDetail() {
    detailVisible.value = false
    detailRecord.value = null
  }

  return {
    editingId,
    detailVisible,
    detailRecord,
    isEditing,
    viewRecord,
    startEdit,
    cancelEdit,
    closeDetail,
  }
}
