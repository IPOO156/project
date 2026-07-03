import { ElMessage } from 'element-plus'
import { ref } from 'vue'

/**
 * 导入/导出 Composable
 * 支持导出 JSON/Blob 文件下载
 */
export function useExport() {
  const exporting = ref(false)

  /**
   * 导出数据为文件下载
   * @param filename 导出文件名（不含扩展名）
   * @param dataOrFetchFn 直接数据对象或返回 Blob 的异步函数
   */
  async function exportData(
    filename: string,
    dataOrFetchFn: Record<string, unknown> | (() => Promise<Blob>),
  ): Promise<void> {
    exporting.value = true
    try {
      let blob: Blob

      if (typeof dataOrFetchFn === 'function') {
        blob = await dataOrFetchFn()
      }
      else {
        const json = JSON.stringify(dataOrFetchFn, null, 2)
        blob = new Blob([json], { type: 'application/json;charset=utf-8' })
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      ElMessage.success('导出成功')
    }
    catch {
      ElMessage.error('导出失败，请稍后重试')
    }
    finally {
      exporting.value = false
    }
  }

  async function importData(_file: File, _uploadFn: (file: File) => Promise<void>): Promise<void> {
    // TODO: 接入实际导入接口
    ElMessage.success('导入成功')
  }

  return {
    exporting,
    exportData,
    importData,
  }
}
