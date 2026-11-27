import { describe, expect, it } from 'vitest'
import {
  extOf,
  fileSizeText,
  isFutureDate,
  isImageFile,
  moveFile,
  validateAchievementFiles,
} from '@/views/school/achievements/components/achievementUploadRules'

function fakeFile(name: string, size = 1024, type = ''): File {
  return { name, size, type } as File
}

describe('证书文件校验', () => {
  it('空列表提示至少添加一页', () => {
    expect(validateAchievementFiles([])).toBe('请至少添加一页证书')
  })

  it('超过页数上限提示删减', () => {
    const files = Array.from({ length: 7 }, (_, i) => fakeFile(`p${i}.jpg`, 1024, 'image/jpeg'))
    expect(validateAchievementFiles(files)).toContain('最多 6 页')
  })

  it('不支持的扩展名拦截', () => {
    expect(validateAchievementFiles([fakeFile('a.doc')])).toContain('格式不支持')
  })

  it('单页超过 5MB 拦截', () => {
    const oversized = fakeFile('big.pdf', 5 * 1024 * 1024 + 1)
    expect(validateAchievementFiles([oversized])).toContain('超过 5MB')
  })

  it('合法文件返回空串', () => {
    expect(
      validateAchievementFiles([fakeFile('a.jpg', 1024, 'image/jpeg'), fakeFile('b.PDF', 2048)]),
    ).toBe('')
  })
})

describe('文件辅助函数', () => {
  it('extOf 取小写扩展名', () => {
    expect(extOf('证书.JPG')).toBe('jpg')
    expect(extOf('无扩展名')).toBe('无扩展名')
  })

  it('isImageFile 优先 MIME，扩展名兜底', () => {
    expect(isImageFile(fakeFile('a.bin', 10, 'image/webp'))).toBe(true)
    expect(isImageFile(fakeFile('a.png'))).toBe(true)
    expect(isImageFile(fakeFile('a.pdf'))).toBe(false)
  })

  it('fileSizeText 换算单位', () => {
    expect(fileSizeText(500)).toBe('1 KB')
    expect(fileSizeText(2048)).toBe('2 KB')
    expect(fileSizeText(2.5 * 1024 * 1024)).toBe('2.5 MB')
  })

  it('isFutureDate 以今天 23:59 为界', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    expect(isFutureDate(tomorrow)).toBe(true)
    expect(isFutureDate(new Date())).toBe(false)
  })
})

describe('moveFile 调整页序', () => {
  const files = [fakeFile('1.jpg'), fakeFile('2.jpg'), fakeFile('3.jpg')]

  it('越界时返回原数组引用', () => {
    expect(moveFile(files, 0, -1)).toBe(files)
    expect(moveFile(files, 2, 1)).toBe(files)
  })

  it('上移/下移返回新数组且不修改原数组', () => {
    const moved = moveFile(files, 2, -1)
    expect(moved.map((f) => f.name)).toEqual(['1.jpg', '3.jpg', '2.jpg'])
    expect(files.map((f) => f.name)).toEqual(['1.jpg', '2.jpg', '3.jpg'])
  })
})
