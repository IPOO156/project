/**
 * 教师端/管理端 API 类型 —— 字典管理（/admin/dict）
 */

export interface DictTypeItem {
  dictType: string
  itemCount: number | null
  status: number | null
  createdAt: string | null
}

export interface DictItemVO {
  id: number
  dictValue: string | null
  label: string | null
  sort: number | null
  status: number | null
  createdAt: string | null
}

export interface DictItemListResult {
  dictType: string | null
  list: DictItemVO[]
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
  } | null
}

export interface DictItemCreatePayload {
  dictType: string
  dictValue: string
  label: string
  sort?: number
  status?: number
}

export interface DictItemUpdatePayload {
  dictValue?: string
  label?: string
  sort?: number
  remark?: string
  status?: number
}
