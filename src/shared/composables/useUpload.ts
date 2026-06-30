import { ElMessage } from 'element-plus'
import { ref } from 'vue'
import { request } from '@/shared/api'

interface UploadOptions {
  url?: string
  maxSize?: number // MB
  accept?: string[]
  multiple?: boolean
}

export function useUpload(options: UploadOptions = {}) {
  const uploading = ref(false)
  const progress = ref(0)
  const fileList = ref<any[]>([])
  const uploadedUrls = ref<string[]>([])

  const defaultOptions: UploadOptions = {
    url: '/api/upload',
    maxSize: 10,
    accept: ['.jpg', '.png', '.pdf', '.doc', '.docx'],
    multiple: false,
  }

  const mergedOptions = { ...defaultOptions, ...options }

  async function handleUpload(file: File): Promise<string | null> {
    if (mergedOptions.maxSize && file.size > mergedOptions.maxSize * 1024 * 1024) {
      ElMessage.error(`文件大小不能超过 ${mergedOptions.maxSize}MB`)
      return null
    }

    const formData = new FormData()
    formData.append('file', file)

    uploading.value = true
    progress.value = 0

    try {
      const res = await request.post(mergedOptions.url!, formData, {
        onUploadProgress: (e) => {
          if (e.total) {
            progress.value = Math.round((e.loaded / e.total) * 100)
          }
        },
      })
      const url = res.data?.url ?? res.data
      uploadedUrls.value.push(url)
      return url
    }
    catch {
      return null
    }
    finally {
      uploading.value = false
      progress.value = 0
    }
  }

  function clearFiles() {
    fileList.value = []
    uploadedUrls.value = []
  }

  return {
    uploading,
    progress,
    fileList,
    uploadedUrls,
    handleUpload,
    clearFiles,
  }
}
