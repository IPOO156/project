import type { AxiosRequestConfig } from 'axios'
import request from '@/shared/api/request'

/**
 * 从 Content-Disposition 中解析文件名，优先 RFC 5987 的 filename*=UTF-8'' 形式。
 * 返回 null 表示响应头未提供可用文件名，由调用方回退。
 */
export function resolveFileName(headers: unknown): string | null {
  if (!headers || typeof headers !== 'object') return null
  const disposition = (headers as Record<string, unknown>)['content-disposition']
  if (typeof disposition !== 'string') return null
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1])
    } catch {
      return utf8Match[1]
    }
  }
  const plainMatch = disposition.match(/filename="?([^";]+)"?/i)
  return plainMatch?.[1] ?? null
}

/**
 * 以 blob 方式请求文件并触发浏览器下载。
 * 接口需要携带 Authorization，因此不能直接用 <a href> 打开后端地址；
 * responseType=blob 时请求拦截器会把完整响应交回这里（见 request.ts）。
 */
export async function downloadBlobFile(
  path: string,
  fallbackFileName: string,
  fileName?: string,
  config?: AxiosRequestConfig,
): Promise<void> {
  const response = (await request.get(path, { ...config, responseType: 'blob' })) as unknown as {
    data: Blob
    headers: Record<string, string>
  }
  const blob = response.data instanceof Blob ? response.data : new Blob([response.data])
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName ?? resolveFileName(response.headers) ?? fallbackFileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
