// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useUpload } from '@/shared/composables/useUpload'

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  error: vi.fn(),
}))

vi.mock('element-plus', () => ({ ElMessage: { error: mocks.error } }))
vi.mock('@/shared/api/api', () => ({ request: { post: mocks.post } }))

function makeFile(name: string, size: number): File {
  const file = new File(['x'], name, { type: 'application/pdf' })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

beforeEach(() => {
  mocks.post.mockReset()
  mocks.error.mockReset()
})

describe('useUpload', () => {
  it('超过大小上限时提示并拒绝上传', async () => {
    const upload = useUpload({ maxSize: 1 })
    const file = makeFile('big.pdf', 2 * 1024 * 1024)

    await expect(upload.handleUpload(file)).resolves.toBeNull()

    expect(mocks.error).toHaveBeenCalledWith('文件大小不能超过 1MB')
    expect(mocks.post).not.toHaveBeenCalled()
    expect(upload.uploading.value).toBe(false)
  })

  it('按默认上限 10MB 判断，边界值放行', async () => {
    mocks.post.mockResolvedValue({ fileUrl: 'https://cdn.example.com/a.pdf' })
    const upload = useUpload()

    const result = await upload.handleUpload(makeFile('edge.pdf', 10 * 1024 * 1024))

    expect(mocks.error).not.toHaveBeenCalled()
    expect(result).toBe('https://cdn.example.com/a.pdf')
  })

  it('上传时携带文件与固定业务参数，并把 fileUrl 写入已上传列表', async () => {
    mocks.post.mockResolvedValue({ fileUrl: 'https://cdn.example.com/a.pdf', fileId: 1 })
    const upload = useUpload()
    const file = makeFile('a.pdf', 1024)

    const result = await upload.handleUpload(file)

    expect(result).toBe('https://cdn.example.com/a.pdf')
    expect(upload.uploadedUrls.value).toEqual(['https://cdn.example.com/a.pdf'])
    expect(upload.uploading.value).toBe(false)
    expect(upload.progress.value).toBe(0)

    const [url, formData, config] = mocks.post.mock.calls[0]
    expect(url).toBe('/common/upload')
    const body = formData as FormData
    expect((body.get('file') as File).name).toBe('a.pdf')
    expect(body.get('type')).toBe('evidence')
    expect(body.get('module')).toBe('archive')
    expect(config).toEqual({ onUploadProgress: expect.any(Function) })
  })

  it('响应依次回退 fileUrl → url → 字符串，缺省为空串', async () => {
    const upload = useUpload()

    mocks.post.mockResolvedValueOnce({ url: 'https://cdn.example.com/url.pdf' })
    await expect(upload.handleUpload(makeFile('a.pdf', 1))).resolves.toBe(
      'https://cdn.example.com/url.pdf',
    )

    mocks.post.mockResolvedValueOnce('https://cdn.example.com/plain.pdf')
    await expect(upload.handleUpload(makeFile('b.pdf', 1))).resolves.toBe(
      'https://cdn.example.com/plain.pdf',
    )

    mocks.post.mockResolvedValueOnce(null)
    await expect(upload.handleUpload(makeFile('c.pdf', 1))).resolves.toBe('')

    expect(upload.uploadedUrls.value).toHaveLength(3)
  })

  it('上传进度按 loaded/total 取整，total 缺失时不更新', async () => {
    mocks.post.mockResolvedValue({ fileUrl: 'u' })
    const upload = useUpload()

    await upload.handleUpload(makeFile('a.pdf', 1))
    const onUploadProgress = mocks.post.mock.calls[0][2].onUploadProgress as (e: {
      loaded: number
      total?: number
    }) => void

    onUploadProgress({ loaded: 42, total: 100 })
    expect(upload.progress.value).toBe(42)

    onUploadProgress({ loaded: 80 })
    expect(upload.progress.value).toBe(42)
  })

  it('上传失败返回 null 并复位状态', async () => {
    mocks.post.mockRejectedValue(new Error('network'))
    const upload = useUpload()

    await expect(upload.handleUpload(makeFile('a.pdf', 1))).resolves.toBeNull()
    expect(upload.uploading.value).toBe(false)
    expect(upload.progress.value).toBe(0)
    expect(upload.uploadedUrls.value).toEqual([])
  })

  it('支持自定义上传地址，clearFiles 清空文件与地址', async () => {
    mocks.post.mockResolvedValue({ fileUrl: 'u' })
    const upload = useUpload({ url: '/custom/upload' })

    await upload.handleUpload(makeFile('a.pdf', 1))
    expect(mocks.post.mock.calls[0][0]).toBe('/custom/upload')

    upload.fileList.value.push({ name: 'a.pdf' })
    upload.clearFiles()
    expect(upload.fileList.value).toEqual([])
    expect(upload.uploadedUrls.value).toEqual([])
  })
})
