import { ElMessage } from 'element-plus'
import { ref } from 'vue'

/**
 * 导入/导出 Composable（占位实现）
 * 后续根据实际导入导出接口扩展
 */
export function useExport() {
  const exporting = ref(false)

  async function exportData(_filename: string, _fetchFn: () => Promise<Blob>): Promise<void> {
    exporting.value = true
    try {
      // TODO: 接入实际导出接口
      ElMessage.success('导出成功')
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
