import { describe, expect, it } from 'vitest'
import {
  findName,
  matchPrefix,
  municipalityCityName,
  parseAddress,
  readAIReply,
  sanitizeForAI,
} from '@/components/ui/addressPickerHelpers'

const tree = {
  北京市: {
    municipality: true,
    cities: { 北京市: { 东城区: ['东华门街道', '景山街道'] } },
  },
  四川省: {
    cities: { 成都市: { 锦江区: ['春熙路街道'] } },
  },
  // 省直辖县级市：区县层只有“市辖区”，街道名直接跟在地级市名后
  河南省: {
    cities: { 济源市: { 市辖区: ['济水街道'] } },
  },
}

describe('parseAddress 已保存地址拆分', () => {
  it('空串返回全空字段', () => {
    expect(parseAddress('', tree)).toEqual({
      province: '',
      city: '',
      district: '',
      street: '',
      detail: '',
    })
  })

  it('数据未加载（tree 为 null）时整串作为详细地址', () => {
    expect(parseAddress('四川省成都市锦江区春熙路1号', null)).toEqual({
      province: '',
      city: '',
      district: '',
      street: '',
      detail: '四川省成都市锦江区春熙路1号',
    })
  })

  it('匹配不到省份时整串作为详细地址', () => {
    const parsed = parseAddress('某某路 1 号', tree)
    expect(parsed.province).toBe('')
    expect(parsed.detail).toBe('某某路 1 号')
  })

  it('拆出省/市/区/街道与详细地址', () => {
    expect(parseAddress('四川省成都市锦江区春熙路街道1号', tree)).toEqual({
      province: '四川省',
      city: '成都市',
      district: '锦江区',
      street: '春熙路街道',
      detail: '1号',
    })
  })

  it('直辖市补齐唯一城市名', () => {
    expect(parseAddress('北京市东城区东华门街道王府井1号', tree)).toEqual({
      province: '北京市',
      city: '北京市',
      district: '东城区',
      street: '东华门街道',
      detail: '王府井1号',
    })
  })

  it('省直辖县级市：区县只有“市辖区”时仍能匹配街道', () => {
    expect(parseAddress('河南省济源市济水街道济水大街1号', tree)).toEqual({
      province: '河南省',
      city: '济源市',
      district: '市辖区',
      street: '济水街道',
      detail: '济水大街1号',
    })
  })

  it('只有省份时其后内容作为详细地址', () => {
    const parsed = parseAddress('四川省', tree)
    expect(parsed.province).toBe('四川省')
    expect(parsed.city).toBe('')
    expect(parsed.detail).toBe('')
  })
})

describe('sanitizeForAI 个人信息剥离', () => {
  it('剥离“姓名：”与手机号', () => {
    const text = sanitizeForAI('姓名：张三 13800138000 四川省成都市锦江区春熙路1号')
    expect(text).not.toContain('张三')
    expect(text).not.toContain('13800138000')
    expect(text).toContain('四川省成都市锦江区春熙路1号')
  })

  it('剥离紧邻手机号的姓名前缀', () => {
    expect(sanitizeForAI('张三13800138000北京市东城区')).toBe('北京市东城区')
  })

  it('剥离邮箱与身份证号', () => {
    const text = sanitizeForAI('北京市东城区 a@b.com 110101199001011234')
    expect(text).not.toContain('a@b.com')
    expect(text).not.toContain('110101199001011234')
    expect(text).toContain('北京市东城区')
  })
})

describe('行政区划名称匹配', () => {
  it('matchPrefix 取最长前缀，避免短名误匹配', () => {
    expect(matchPrefix('东城区东华门街道', ['东城', '东城区'])).toBe('东城区')
    expect(matchPrefix('  成都市  ', ['成都市'])).toBe('成都市')
    expect(matchPrefix('', ['成都市'])).toBe('')
  })

  it('municipalityCityName 返回直辖市唯一城市', () => {
    expect(municipalityCityName(tree, '北京市')).toBe('北京市')
    expect(municipalityCityName(tree, '四川省')).toBe('成都市')
    expect(municipalityCityName(tree, '不存在')).toBe('')
  })

  it('findName 允许 AI 少写行政后缀', () => {
    expect(findName('成都', ['成都市'])).toBe('成都市')
    expect(findName('四川省', ['四川省'])).toBe('四川省')
    expect(findName('成都', [])).toBe('')
  })
})

describe('readAIReply AI 返回解析', () => {
  it('解析带 markdown 围栏的 JSON', () => {
    const reply =
      '```json\n{"province":"四川省","city":"成都市","district":"锦江区","street":"春熙路街道","detail":"1号"}\n```'
    expect(readAIReply(reply)).toEqual({
      provinceRaw: '四川省',
      cityRaw: '成都市',
      districtRaw: '锦江区',
      streetRaw: '春熙路街道',
      detailRaw: '1号',
    })
  })

  it('兼容 data 包装与中文键名', () => {
    const reply = '{"data":{"省":"北京市","市":"北京市","区":"东城区","detail":"王府井1号"}}'
    const parsed = readAIReply(reply)
    expect(parsed?.provinceRaw).toBe('北京市')
    expect(parsed?.districtRaw).toBe('东城区')
    expect(parsed?.detailRaw).toBe('王府井1号')
  })

  it('无省份或非 JSON 时返回 null', () => {
    expect(readAIReply('抱歉，我无法识别')).toBeNull()
    expect(readAIReply('{"city":"成都市"}')).toBeNull()
  })
})
