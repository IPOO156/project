import { ElMessage } from 'element-plus'
import { reactive, ref, toRaw } from 'vue'

export interface ApplicationFormOptions<T> {
  emptyForm: () => T
  onSubmit?: (form: T) => Promise<void> | void
  successMessage?: string
}

export function useApplicationForm<T extends Record<string, any>>({
  emptyForm,
  onSubmit,
  successMessage = '申报提交成功',
}: ApplicationFormOptions<T>) {
  const form = reactive(emptyForm())
  const submitting = ref(false)

  function reset() {
    Object.assign(form, emptyForm())
  }

  async function handleSubmit() {
    if (submitting.value) return

    submitting.value = true

    try {
      if (onSubmit) {
        await onSubmit(toRaw(form) as T)
      } else {
        await new Promise((resolve) => setTimeout(resolve, 600))
      }

      ElMessage.success(successMessage)
      reset()
    } catch (error) {
      ElMessage.error('提交失败，请重试')
      console.error('表单提交错误:', error)
    } finally {
      submitting.value = false
    }
  }

  return {
    form,
    submitting,
    reset,
    handleSubmit,
  }
}
