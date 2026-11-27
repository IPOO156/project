/**
 * 地址选择器的纯函数与类型：行政区划匹配、已保存地址拆分、AI 返回解析、PII 剥离。
 * 与组件状态解耦，便于单测与复用；数据表由调用方传入，不在本模块加载 JSON。
 */

export type DistrictMap = Record<string, string[]>
export type CityMap = Record<string, DistrictMap>
export interface ProvinceNode {
  municipality?: boolean
  cities: CityMap
}
export type RegionTree = Record<string, ProvinceNode>

export interface ParsedAddress {
  province: string
  city: string
  district: string
  street: string
  detail: string
}

/** 取最长的前缀匹配，避免“东莞市”被“东城街道”之类短名误匹配 */
export function matchPrefix(value: string, names: string[]): string {
  const text = value.trim()
  if (!text) return ''
  let matched = ''
  for (const name of names) {
    if (name && text.startsWith(name) && name.length > matched.length) matched = name
  }
  return matched
}

/** 直辖市取唯一城市名 */
export function municipalityCityName(tree: RegionTree, name: string): string {
  const node = tree[name]
  return Object.keys(node?.cities ?? {})[0] ?? ''
}

/**
 * 把已保存的地址串拆成四级 + 详细地址（报告 #2）。
 * 匹配不到省份时整串作为详细地址，保证旧数据不丢。
 */
export function parseAddress(value: string, tree: RegionTree | null): ParsedAddress {
  const text = (value ?? '').trim()
  if (!text) return { province: '', city: '', district: '', street: '', detail: '' }
  // 数据未加载时先把整串当详细地址，等 ensureRegions 完成后再 hydrate 一次
  if (!tree) return { province: '', city: '', district: '', street: '', detail: text }
  const provinceName = matchPrefix(text, Object.keys(tree))
  if (!provinceName) return { province: '', city: '', district: '', street: '', detail: text }

  const node = tree[provinceName]
  let rest = text.slice(provinceName.length)
  const cityName = node.municipality
    ? municipalityCityName(tree, provinceName)
    : matchPrefix(rest, Object.keys(node.cities ?? {}))
  if (!cityName) return { province: provinceName, city: '', district: '', street: '', detail: rest }
  if (!node.municipality) rest = rest.slice(cityName.length)

  const districtNamesInCity = Object.keys(node.cities?.[cityName] ?? {})
  const districtName = matchPrefix(rest, districtNamesInCity)
  if (districtName) {
    rest = rest.slice(districtName.length)
  } else if (districtNamesInCity.length === 1) {
    // 省直辖县级市：区县层只有“市辖区”或与市同名，街道名可能带市名前缀
    const onlyDistrict = districtNamesInCity[0]
    const withoutCityPrefix = rest.startsWith(cityName) ? rest.slice(cityName.length) : rest
    const streetCandidate = matchPrefix(
      withoutCityPrefix,
      node.cities?.[cityName]?.[onlyDistrict] ?? [],
    )
    if (streetCandidate) {
      return {
        province: provinceName,
        city: cityName,
        district: onlyDistrict,
        street: streetCandidate,
        detail: withoutCityPrefix.slice(streetCandidate.length),
      }
    }
  }

  const streetName = districtName
    ? matchPrefix(rest, node.cities?.[cityName]?.[districtName] ?? [])
    : ''
  if (streetName) rest = rest.slice(streetName.length)
  return {
    province: provinceName,
    city: cityName,
    district: districtName,
    street: streetName,
    detail: rest,
  }
}

/** 送 AI 前剥离手机号、身份证号、邮箱等个人信息（报告 #6） */
export function sanitizeForAI(text: string): string {
  return (
    text
      // “姓名：张三” / “姓名:张三”
      .replace(/姓名[：:]?\s*[\u4E00-\u9FA5]{2,4}/g, '')
      // 开头“张三13800138000…”：仅当 2-4 个汉字紧邻手机号时按姓名剥离，避免误伤地址
      // 兼容姓名与手机号之间带中英文逗号、顿号、分号、冒号或空白的情况
      .replace(/^[\u4E00-\u9FA5]{2,4}[，,、;；:：\s]*(?=1[3-9]\d{9})/, '')
      .replace(/1[3-9]\d{9}/g, '')
      .replace(/\b\d{17}[\dX]\b/i, '')
      .replace(/\w[\w.%+-]*@[\w.-]+\.[a-z]{2,}/gi, '')
      .trim()
  )
}

function extractJson(content: string): Record<string, unknown> | null {
  const fenced = content.match(/```(?:json)?([\s\S]*?)```/i)
  const raw = fenced ? fenced[1].trim() : content
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    const parsed = JSON.parse(raw.slice(start, end + 1))
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null
  } catch {
    return null
  }
}

function pickString(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = obj[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

/** 把 AI 返回的名称对齐到本地行政区划数据（允许 AI 少写“省/市/区”后缀） */
export function findName(candidate: string, names: string[]): string {
  const text = candidate.trim()
  if (!text) return ''
  if (names.includes(text)) return text
  const suffixes = [
    '特别行政区',
    '自治区',
    '自治州',
    '地区',
    '街道',
    '省',
    '市',
    '区',
    '县',
    '镇',
    '乡',
    '盟',
    '旗',
  ]
  for (const suffix of suffixes) {
    if (text.endsWith(suffix) && names.includes(text.slice(0, -suffix.length))) {
      return text.slice(0, -suffix.length)
    }
  }
  return names.find((name) => name.startsWith(text)) ?? ''
}

function unwrapAIJson(json: Record<string, unknown>): Record<string, unknown> {
  if (json.data && typeof json.data === 'object') return json.data as Record<string, unknown>
  if (json.address && typeof json.address === 'object')
    return json.address as Record<string, unknown>
  return json
}

export interface ParsedAIReply {
  provinceRaw: string
  cityRaw: string
  districtRaw: string
  streetRaw: string
  detailRaw: string
}

export function readAIReply(content: string): ParsedAIReply | null {
  const json = extractJson(content)
  if (!json) return null
  const data = unwrapAIJson(json)
  const provinceRaw = pickString(data, ['province', 'provinceName', '省', '省份'])
  const cityRaw = pickString(data, ['city', 'cityName', '市', '城市'])
  const districtRaw = pickString(data, ['district', 'districtName', '区', '区县', '县'])
  const streetRaw = pickString(data, ['street', 'streetName', '街道', '镇', '乡镇'])
  const detailRaw = pickString(data, ['detail', 'detailAddress', '详细地址', '地址'])
  return provinceRaw ? { provinceRaw, cityRaw, districtRaw, streetRaw, detailRaw } : null
}
