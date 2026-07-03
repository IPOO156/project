import { reactive, ref } from 'vue'

export interface ApplicationForm {
  id?: string
  [key: string]: unknown
}

/**
 * 通用申报 Composable - 管理表单、弹窗、提交状态
 */
export function useApplication<T extends ApplicationForm>(defaultForm: T) {
  const dialogVisible = ref(false)
  const detailVisible = ref(false)
  const loading = ref(false)
  const submitting = ref(false)
  const formData = reactive<T>({ ...defaultForm })
  const currentId = ref<string>('')
  const isEdit = ref(false)

  function openCreate() {
    Object.assign(formData, defaultForm)
    currentId.value = ''
    isEdit.value = false
    dialogVisible.value = true
  }

  function openEdit(data: T) {
    Object.assign(formData, { ...defaultForm, ...data })
    currentId.value = data.id ?? ''
    isEdit.value = true
    dialogVisible.value = true
  }

  function openDetail(data: T) {
    Object.assign(formData, { ...defaultForm, ...data })
    detailVisible.value = true
  }

  function closeDialog() {
    dialogVisible.value = false
    Object.assign(formData, defaultForm)
  }

  function resetForm() {
    Object.assign(formData, defaultForm)
  }

  return reactive({
    dialogVisible,
    detailVisible,
    loading,
    submitting,
    formData,
    currentId,
    isEdit,
    openCreate,
    openEdit,
    openDetail,
    closeDialog,
    resetForm,
  })
}
