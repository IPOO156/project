import type { DictOption } from '@/shared/types'

/**
 * 字典转换 - 将后端字典值转为前端展示文本
 */
export function useDict(dictMap: Record<string, { label: string, color?: string }>) {
  function getLabel(value: string | number): string {
    return dictMap[value]?.label ?? String(value)
  }

  function getColor(value: string | number): string | undefined {
    return dictMap[value]?.color
  }

  function getOptions(): DictOption[] {
    return Object.entries(dictMap).map(([value, config]) => ({
      label: config.label,
      value,
      color: config.color,
    }))
  }

  return { getLabel, getColor, getOptions }
}
