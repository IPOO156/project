import { ElMessage } from 'element-plus'
import { reactive, ref, toRaw } from 'vue'

export interface ApplicationFormOptions<T> {
  emptyForm: () => T
  requiredFields?: (keyof T & string)[]
  onSubmit?: (form: T) => Promise<void> | void
  successMessage?: string
}

export function useApplicationForm<T extends Record<string, any>>({
  emptyForm,
  requiredFields,
  onSubmit,
  successMessage = '申报提交成功',
}: ApplicationFormOptions<T>) {
  const form = reactive(emptyForm())
  const submitting = ref(false)

  function reset() {
    Object.assign(form, emptyForm())
  }

  /** 校验必填字段是否已填写 */
  function validateRequired(): boolean {
    if (!requiredFields || requiredFields.length === 0) return true

    const emptyFields = requiredFields.filter((key) => {
      const value = form[key]
      if (value == null || value === '') return true
      if (Array.isArray(value) && value.length === 0) return true
      return false
    })

    if (emptyFields.length > 0) {
      ElMessage.warning('请填写所有必填项后再提交')
      return false
    }
    return true
  }

  async function handleSubmit() {
    if (submitting.value) return
    if (!validateRequired()) return

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
