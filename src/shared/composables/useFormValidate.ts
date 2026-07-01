import type { FormInstance, FormItemRule } from 'element-plus'
import { ref } from 'vue'

/**
 * 表单校验 Composable（占位实现）
 * 后续可抽离通用校验规则到 constants/validation.ts
 */
export function useFormValidate() {
  const formRef = ref<FormInstance>()

  async function validate(): Promise<boolean> {
    if (!formRef.value)
      return false
    return formRef.value.validate().then(() => true).catch(() => false)
  }

  function resetFields(): void {
    formRef.value?.resetFields()
  }

  return {
    formRef,
    validate,
    resetFields,
  }
}

/**
 * 必填规则工厂
 */
export function requiredRule(message: string): FormItemRule {
  return { required: true, message, trigger: 'blur' }
}
