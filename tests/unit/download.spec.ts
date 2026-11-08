// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import request from '@/shared/api/request'
import { downloadBlobFile, downloadFromUrl, resolveFileName } from '@/shared/utils/download'

vi.mock('@/shared/api/request', () => ({
  default: { get: vi.fn() },
}))

const get = vi.mocked(request.get)

interface Clicked {
  href: string
  download: string
  rel: string
}

let clicked: Clicked[]

beforeEach(() => {
  clicked = []
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    clicked.push({ href: this.href, download: this.download, rel: this.rel })
  })
  Object.assign(URL, {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn(),
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  get.mockReset()
  document.body.innerHTML = ''
})

describe('resolveFileName', () => {
  it('响应头缺失或不可用时返回 null', () => {
    expect(resolveFileName(null)).toBeNull()
    expect(resolveFileName('x')).toBeNull()
    expect(resolveFileName({})).toBeNull()
    expect(resolveFileName({ 'content-disposition': 123 })).toBeNull()
  })

  it('优先解析 RFC 5987 的 filename* 并解码', () => {
    const headers = {
      'content-disposition': "attachment; filename*=UTF-8''%E8%AF%81%E4%B9%A6.pdf",
    }
    expect(resolveFileName(headers)).toBe('证书.pdf')
  })

  it('filename* 编码损坏时返回原始值', () => {
    const headers = { 'content-disposition': "attachment; filename*=UTF-8''%ZZ" }
    expect(resolveFileName(headers)).toBe('%ZZ')
  })

  it('退化解析普通 filename，带引号与不带引号都支持', () => {
    expect(resolveFileName({ 'content-disposition': 'attachment; filename="a.pdf"' })).toBe('a.pdf')
    expect(resolveFileName({ 'content-disposition': 'attachment; filename=b.pdf' })).toBe('b.pdf')
    expect(resolveFileName({ 'content-disposition': 'inline' })).toBeNull()
  })

  it('两种形式同时存在时以 filename* 为准', () => {
    const headers = {
      'content-disposition': 'attachment; filename="fallback.pdf"; filename*=UTF-8\'\'real.pdf',
    }
    expect(resolveFileName(headers)).toBe('real.pdf')
  })
})

describe('downloadFromUrl', () => {
  it('创建临时链接并模拟点击，结束后从文档中移除', () => {
    downloadFromUrl('https://cdn.example.com/a.pdf', '证书.pdf')

    expect(clicked).toEqual([
      { href: 'https://cdn.example.com/a.pdf', download: '证书.pdf', rel: 'noopener' },
    ])
    expect(document.body.querySelector('a')).toBeNull()
  })
})

describe('downloadBlobFile', () => {
  it('以 blob 方式请求，优先使用调用方指定文件名', async () => {
    get.mockResolvedValue({
      data: new Blob(['x']),
      headers: { 'content-disposition': 'attachment; filename="server.pdf"' },
    })

    await downloadBlobFile('/files/1', 'fallback.pdf', '指定.pdf', { timeout: 5000 })

    expect(get).toHaveBeenCalledWith('/files/1', { timeout: 5000, responseType: 'blob' })
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
    expect(clicked[0]).toMatchObject({ href: 'blob:mock-url', download: '指定.pdf' })
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    expect(document.body.querySelector('a')).toBeNull()
  })

  it('未指定文件名时取响应头，响应头缺失再回退默认名', async () => {
    get.mockResolvedValueOnce({
      data: new Blob(['x']),
      headers: { 'content-disposition': "attachment; filename*=UTF-8''%E8%AF%81%E4%B9%A6.pdf" },
    })
    await downloadBlobFile('/files/1', 'fallback.pdf')
    expect(clicked[0].download).toBe('证书.pdf')

    get.mockResolvedValueOnce({ data: new Blob(['x']), headers: {} })
    await downloadBlobFile('/files/2', 'fallback.pdf')
    expect(clicked[1].download).toBe('fallback.pdf')
  })

  it('非 Blob 响应会包装成 Blob 再下载', async () => {
    get.mockResolvedValue({ data: 'plain-text', headers: {} })

    await downloadBlobFile('/files/3', 'a.txt')

    const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0]
    expect(blob).toBeInstanceOf(Blob)
    expect(clicked[0].download).toBe('a.txt')
  })
})
