import { ElMessage } from 'element-plus'
import { reactive, ref, toRaw } from 'vue'
import { submitApplication } from '@/shared/api/submission'

export interface ApplicationFormOptions<T> {
  emptyForm: () => T
  requiredFields?: (keyof T & string)[]
  /** 自定义提交回调，默认走 submitApplication(type, typeLabel, ...form) */
  onSubmit?: (form: T) => Promise<void> | void
  /** 申报类型标识（默认提交时使用） */
  type?: string
  /** 申报类型中文名 */
  typeLabel?: string
  successMessage?: string
}

export function useApplicationForm<T extends Record<string, any>>({
  emptyForm,
  requiredFields,
  onSubmit,
  type,
  typeLabel,
  successMessage = '申报提交成功',
}: ApplicationFormOptions<T>) {
  const form = reactive(emptyForm())
  const submitting = ref(false)

  function reset() {
    Object.assign(form, emptyForm())
  }

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
      } else if (type) {
        await submitApplication({ type, typeLabel, ...toRaw(form) })
      } else {
        await new Promise((resolve) => setTimeout(resolve, 600))
      }

      ElMessage.success(successMessage)
      reset()
    } catch {
      ElMessage.error('提交失败，请重试')
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
