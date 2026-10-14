/**
 * 教师端/管理端 API 类型 —— 系统配置（/admin/settings）
 */

export interface SettingItem {
  settingKey: string
  settingName: string
  settingValue: string | null
  group: string | null
  description: string | null
  updatedAt: string | null
}

export interface SettingUpdatePayload {
  settingKey: string
  settingValue: string
}
