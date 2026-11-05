/**
 * 教师端/管理端 API 类型 —— 表单自定义（/admin/form-templates）
 */

/** 表单字段静态选项（select/radio/checkbox 用，后端结构为 {value,label}） */
export interface FormTemplateOption {
  value: string
  label: string
}

export interface FormTemplateFieldItem {
  key: string
  label: string
  /** input / textarea / number / select / radio / checkbox / date / upload / switch */
  type: string
  required?: boolean
  placeholder?: string
  rules?: unknown
  options?: FormTemplateOption[] | null
  dataSource?: string | null
  visible?: boolean
  sort?: number
}

export interface FormTemplateItem {
  id: number
  schoolId: number | null
  templateName: string
  code: string
  /** archive / award / career_plan */
  category: string
  categoryLabel: string | null
  description: string | null
  applicableRoles: string[] | null
  isDefault: number | null
  version: number | null
  status: number | null
  statusLabel: string | null
  createdBy: number | null
  createdByName: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface FormTemplateDetail extends FormTemplateItem {
  fields: FormTemplateFieldItem[]
  layoutConfig: unknown | null
}

export interface FormTemplateCreatePayload {
  templateName: string
  code: string
  category: string
  description?: string
  fields: FormTemplateFieldItem[]
  layoutConfig?: unknown
  applicableRoles?: string[]
  isDefault?: number
  status?: number
}

export interface FormTemplateUpdatePayload {
  templateName?: string
  description?: string
  fields?: FormTemplateFieldItem[]
  layoutConfig?: unknown
  applicableRoles?: string[]
  status?: number
}
