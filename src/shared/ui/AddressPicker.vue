<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { ChevronDown } from 'lucide-vue-next'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createAIConversation, deleteAIConversation, sendAIMessage } from '@/shared/api/ai-chat'
import regionData from '@/shared/data/china-regions.json'

defineOptions({ name: 'AddressPicker' })

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请选择省 / 市 / 区 / 街道',
  disabled: false,
  size: 'default',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

interface Props {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  size?: 'default' | 'small'
}

type DistrictMap = Record<string, string[]>
type CityMap = Record<string, DistrictMap>
interface ProvinceNode {
  municipality?: boolean
  cities: CityMap
}
type RegionTree = Record<string, ProvinceNode>

const regions = regionData as unknown as RegionTree
const provinces = Object.keys(regions)

const rootRef = ref<HTMLElement | null>(null)
const panelOpen = ref(false)
const province = ref('')
const city = ref('')
const district = ref('')
const street = ref('')
const detail = ref('')
/** 粘贴识别输入框 */
const pasteText = ref('')
/** AI 识别中 */
const parsing = ref(false)
/** 回填但无法解析的整串原文：重选省份时清掉，避免旧串与新选择拼接重复 */
const unparsedOriginal = ref('')
/** 手动操作版本号：AI 识别结束后用于判断期间是否被手动修改 */
let interactionRevision = 0

function markInteraction() {
  interactionRevision += 1
}
let hydrating = false

const provinceNode = computed(() => (province.value ? regions[province.value] : undefined))
const isMunicipality = computed(() => Boolean(provinceNode.value?.municipality))
const cityMap = computed<CityMap>(() => provinceNode.value?.cities ?? {})
const cityNames = computed(() => Object.keys(cityMap.value))
const districtMap = computed<DistrictMap>(() => {
  if (!province.value) return {}
  return cityMap.value[city.value] ?? {}
})
const districtNames = computed(() => Object.keys(districtMap.value))
const streetNames = computed(() => districtMap.value[district.value] ?? [])

/** 行政区划展示片段：剔除与市同名的区县、“市辖区”，并裁掉街道前的市名前缀 */
const regionParts = computed(() => {
  const parts: string[] = []
  if (province.value) parts.push(province.value)
  if (city.value && !isMunicipality.value) parts.push(city.value)
  if (district.value && district.value !== city.value && district.value !== '市辖区') {
    parts.push(district.value)
  }
  if (street.value) {
    const prefix = city.value || ''
    parts.push(
      prefix && street.value.startsWith(prefix) ? street.value.slice(prefix.length) : street.value,
    )
  }
  return parts.filter(Boolean)
})

const displayText = computed(() => regionParts.value.join(' / '))

const regionText = computed(() => regionParts.value.join(''))

const fullAddress = computed(() => `${regionText.value}${detail.value}`.trim())

watch(
  fullAddress,
  (value) => {
    if (!hydrating) emit('update:modelValue', value)
  },
  { flush: 'sync' },
)

// 外部值变化（切换记录、提交后重置）时重新回填，避免残留上一次选择（报告 #1）
watch(
  () => props.modelValue,
  (value) => {
    if (hydrating) return
    hydrate(value ?? '')
  },
)

function municipalityCityName(name: string): string {
  const node = regions[name]
  return Object.keys(node?.cities ?? {})[0] ?? ''
}

function commitSelection(mutate: () => void) {
  hydrating = true
  mutate()
  hydrating = false
  markInteraction()
  emit('update:modelValue', fullAddress.value)
}

function selectProvince(name: string) {
  commitSelection(() => {
    if (unparsedOriginal.value && detail.value === unparsedOriginal.value) {
      detail.value = ''
    }
    unparsedOriginal.value = ''
    province.value = name
    city.value = regions[name]?.municipality ? municipalityCityName(name) : ''
    district.value = ''
    street.value = ''
  })
  panelOpen.value = true
}

function selectCity(name: string) {
  commitSelection(() => {
    city.value = name
    district.value = ''
    street.value = ''
  })
}

function selectDistrict(name: string) {
  commitSelection(() => {
    district.value = name
    street.value = ''
  })
}

function selectStreet(name: string) {
  commitSelection(() => {
    street.value = name
  })
}

function clear() {
  hydrating = true
  province.value = ''
  city.value = ''
  district.value = ''
  street.value = ''
  detail.value = ''
  unparsedOriginal.value = ''
  hydrating = false
  emit('update:modelValue', '')
}

/** 取最长的前缀匹配，避免“东莞市”被“东城街道”之类短名误匹配 */
function matchPrefix(value: string, names: string[]): string {
  const text = value.trim()
  if (!text) return ''
  let matched = ''
  for (const name of names) {
    if (name && text.startsWith(name) && name.length > matched.length) matched = name
  }
  return matched
}

interface ParsedAddress {
  province: string
  city: string
  district: string
  street: string
  detail: string
}

/**
 * 把已保存的地址串拆成四级 + 详细地址（报告 #2）。
 * 匹配不到省份时整串作为详细地址，保证旧数据不丢。
 */
function parseAddress(value: string): ParsedAddress {
  const text = (value ?? '').trim()
  if (!text) return { province: '', city: '', district: '', street: '', detail: '' }
  const provinceName = matchPrefix(text, provinces)
  if (!provinceName) return { province: '', city: '', district: '', street: '', detail: text }

  const node = regions[provinceName]
  let rest = text.slice(provinceName.length)
  const cityName = node.municipality
    ? municipalityCityName(provinceName)
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
function sanitizeForAI(text: string): string {
  return (
    text
      // “姓名：张三” / “姓名:张三”
      .replace(/姓名[：:]?\s*[\u4E00-\u9FA5]{2,4}/g, '')
      // 开头“张三13800138000…”：仅当 2-4 个汉字紧邻手机号时按姓名剥离，避免误伤地址
      .replace(/^[\u4E00-\u9FA5]{2,4}\s*(?=1[3-9]\d{9})/, '')
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
function findName(candidate: string, names: string[]): string {
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

function readAIReply(content: string): {
  provinceRaw: string
  cityRaw: string
  districtRaw: string
  streetRaw: string
  detailRaw: string
} | null {
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

async function parsePaste() {
  const text = pasteText.value.trim()
  if (!text) {
    ElMessage.warning('请先粘贴地址')
    return
  }
  if (parsing.value || props.disabled) return

  // 姓名/手机号/身份证/邮箱等个人信息不发送给 AI（报告 #6）
  const safeText = sanitizeForAI(text)
  if (!safeText) {
    ElMessage.warning('粘贴内容只有个人信息，请补充地址')
    return
  }
  // 记录识别开始前的手动操作版本，识别期间被手动修改则丢弃结果（报告 #5）
  const revisionAtStart = interactionRevision

  parsing.value = true
  let conversationId: number | null = null
  try {
    const conversation = await createAIConversation({ title: '地址识别' })
    conversationId = conversation.conversationId
    const prompt = [
      '我在填写学生成长档案系统的申报表单，“实习地点 / 活动地点 / 通讯地址”字段需要把地址拆分为省、市、区县、街道和详细地址，这是档案申报材料的一部分。',
      '请只返回一行 JSON，不要解释、不要 markdown：{"province":"省/直辖市/自治区/特别行政区","city":"市/自治州/地区","district":"区/县/县级市","street":"街道/镇/乡","detail":"剩余详细地址"}',
      '无法识别的层级返回空字符串。',
      `地址文本：${safeText}`,
    ].join('\n')

    let result = readAIReply((await sendAIMessage(conversationId, prompt)).content)
    if (!result) {
      // 重试时保留“档案申报表单”上下文，否则 AI 助手会按超范围请求拒绝解析
      const retryPrompt = `请把下面地址拆成省、市、区县、街道、详细地址五个字段，用于学生档案申报的地点填写。只输出一行 JSON，不要解释：{"province":"","city":"","district":"","street":"","detail":""}。地址：${safeText}`
      result = readAIReply((await sendAIMessage(conversationId, retryPrompt)).content)
    }
    if (!result) {
      ElMessage.warning('AI 没有返回可识别的地址，请重试或手动选择')
      return
    }

    const { provinceRaw, cityRaw, districtRaw, streetRaw, detailRaw } = result

    const provinceName = findName(provinceRaw, provinces)
    if (!provinceName) {
      ElMessage.warning('AI 没有识别出省份，请手动选择')
      return
    }

    const node = regions[provinceName]
    const isMuni = Boolean(node.municipality)
    let cityName = isMuni
      ? municipalityCityName(provinceName)
      : findName(cityRaw, Object.keys(node.cities ?? {}))
    let districtName = cityName
      ? findName(districtRaw, Object.keys(node.cities?.[cityName] ?? {}))
      : ''

    // AI 可能把县级市写进 city（如“都江堰市”），这里回退到区县里找
    if (!cityName && cityRaw) {
      for (const [candidateCity, districts] of Object.entries(node.cities ?? {})) {
        const foundDistrict = findName(cityRaw, Object.keys(districts))
        if (foundDistrict) {
          cityName = candidateCity
          districtName = foundDistrict
          break
        }
      }
    }

    const streetName =
      cityName && districtName
        ? findName(streetRaw, node.cities?.[cityName]?.[districtName] ?? [])
        : ''

    // AI 未匹配到的层级回退进详细地址，避免“高新区”这类数据缺失的文本被静默丢弃（报告 #4）
    const leftovers: string[] = []
    if (!cityName && cityRaw) leftovers.push(cityRaw)
    if (!districtName && districtRaw) leftovers.push(districtRaw)
    if (!streetName && streetRaw) leftovers.push(streetRaw)

    if (interactionRevision !== revisionAtStart) {
      ElMessage.warning('AI 识别期间地址已被手动修改，本次结果未覆盖')
      return
    }

    hydrating = true
    province.value = provinceName
    city.value = cityName
    district.value = districtName
    street.value = streetName
    detail.value = `${leftovers.join('')}${detailRaw}`
    unparsedOriginal.value = ''
    hydrating = false
    markInteraction()
    emit('update:modelValue', fullAddress.value)
    pasteText.value = ''
    panelOpen.value = !cityName || !districtName

    if (!cityName) {
      ElMessage.warning(`AI 已识别到${provinceName}，请继续选择城市`)
    } else if (!districtName) {
      ElMessage.warning(`AI 已识别到${provinceName} / ${cityName}，请继续选择区 / 县`)
    } else {
      ElMessage.success('AI 已识别并填入地址')
    }
  } catch (error) {
    // 请求拦截器已统一提示后端错误；这里把真实状态码/后端信息打到控制台，便于排查环境差异
    const err = error as {
      code?: string
      __handled?: boolean
      response?: { status?: number; data?: { code?: number; message?: string } }
    } | null
    const status = err?.response?.status
    const backendMessage = String(err?.response?.data?.message ?? '').trim()
    console.error('[AddressPicker] AI 地址识别失败', {
      status,
      backendCode: err?.response?.data?.code,
      backendMessage,
      transportCode: err?.code,
    })
    if (status === 404 || status === 405) {
      ElMessage.error('当前后端未部署 AI 识别接口，请联系管理员')
    } else if (!err?.response && !err?.__handled) {
      ElMessage.error(
        err?.code === 'ECONNABORTED'
          ? 'AI 识别超时，请检查网络后重试'
          : 'AI 识别失败，请检查网络后重试',
      )
    }
  } finally {
    parsing.value = false
    if (conversationId != null) {
      void deleteAIConversation(conversationId).catch(() => {})
    }
  }
}

function hydrate(value: string) {
  const next = value ?? ''
  if (next === fullAddress.value) return
  const parsed = parseAddress(next)
  hydrating = true
  province.value = parsed.province
  city.value = parsed.city
  district.value = parsed.district
  street.value = parsed.street
  detail.value = parsed.detail
  unparsedOriginal.value = parsed.province ? '' : next
  hydrating = false
  markInteraction()
}

function togglePanel() {
  if (props.disabled) return
  panelOpen.value = !panelOpen.value
}

function onDocumentClick(event: MouseEvent) {
  if (!panelOpen.value) return
  if (rootRef.value && !rootRef.value.contains(event.target as Node)) {
    panelOpen.value = false
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') panelOpen.value = false
}

onMounted(() => {
  hydrate(props.modelValue ?? '')
  document.addEventListener('click', onDocumentClick)
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div
    ref="rootRef"
    class="address-picker"
    :class="{ 'is-disabled': disabled, 'is-small': size === 'small' }"
  >
    <div class="address-paste">
      <el-input
        v-model="pasteText"
        class="address-paste__input"
        :size="size"
        clearable
        placeholder="粘贴完整地址，一键识别，如：四川省成都市武侯区桂溪街道518号"
        @keyup.enter="parsePaste"
      />
      <el-button
        type="primary"
        plain
        class="address-paste__btn"
        :size="size"
        :loading="parsing"
        @click="parsePaste"
        >AI 识别</el-button
      >
    </div>

    <div class="address-region">
      <button
        type="button"
        class="address-trigger"
        :class="{ 'is-placeholder': !displayText, 'is-open': panelOpen }"
        :disabled="disabled"
        :aria-expanded="panelOpen"
        aria-haspopup="listbox"
        @click.stop="togglePanel"
      >
        <span class="address-trigger__text">{{ displayText || placeholder }}</span>
        <ChevronDown :size="16" class="address-trigger__icon" />
      </button>

      <div v-if="panelOpen" class="address-panel" @click.stop>
        <div class="address-columns">
          <div class="address-column">
            <div class="address-column__title">省 / 直辖市</div>
            <button
              v-for="p in provinces"
              :key="p"
              type="button"
              class="address-option"
              :class="{ 'is-active': p === province }"
              @click.stop="selectProvince(p)"
            >
              {{ p }}
            </button>
          </div>

          <div v-if="province && !isMunicipality" class="address-column">
            <div class="address-column__title">城市</div>
            <button
              v-for="c in cityNames"
              :key="c"
              type="button"
              class="address-option"
              :class="{ 'is-active': c === city }"
              @click.stop="selectCity(c)"
            >
              {{ c }}
            </button>
          </div>

          <div v-if="province && (isMunicipality || city)" class="address-column">
            <div class="address-column__title">区 / 县</div>
            <button
              v-for="d in districtNames"
              :key="d"
              type="button"
              class="address-option"
              :class="{ 'is-active': d === district }"
              @click.stop="selectDistrict(d)"
            >
              {{ d }}
            </button>
          </div>

          <div v-if="district" class="address-column">
            <div class="address-column__title">街道 / 乡镇</div>
            <button
              v-for="s in streetNames"
              :key="s"
              type="button"
              class="address-option"
              :class="{ 'is-active': s === street }"
              @click.stop="selectStreet(s)"
            >
              {{ s }}
            </button>
          </div>
        </div>

        <div class="address-panel__foot">
          <button type="button" class="address-clear" @click.stop="clear">清空地区</button>
          <span class="address-hint">{{
            street ? '已选到街道，可在下方补充门牌号' : '点击左侧逐级选择'
          }}</span>
        </div>
      </div>
    </div>

    <el-input
      v-model="detail"
      class="address-detail"
      :size="size"
      :disabled="disabled"
      clearable
      placeholder="街道 / 门牌号 / 楼栋，例如：物联网街 518 号 3 幢 501"
      @input="markInteraction"
    />
  </div>
</template>

<style scoped lang="scss">
.address-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 480px;
  max-width: 100%;
}

.address-picker.is-small {
  width: 100%;
  gap: 6px;
}

.address-picker.is-small .address-trigger {
  height: 32px;
  padding: 0 32px 0 10px;
  font-size: 13px;
}

.address-picker.is-small .address-trigger__icon {
  right: 10px;
  width: 14px;
  height: 14px;
}

.address-picker.is-small .address-columns {
  height: 220px;
}

.address-picker.is-small .address-option {
  padding: 7px 10px;
  font-size: 12px;
}

.address-picker.is-small .address-panel__foot {
  padding: 6px 10px;
}

.address-paste {
  display: flex;
  align-items: center;
  gap: 8px;
}

.address-paste :deep(.el-input) {
  flex: 1;
  width: auto;
  min-width: 0;
}

.address-paste__btn {
  flex: none;
}

.address-region {
  position: relative;
}

.address-trigger {
  position: relative;
  width: 100%;
  height: 40px;
  padding: 0 36px 0 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;

  &:hover {
    border-color: var(--el-color-primary);
  }

  &:focus,
  &.is-open {
    outline: none;
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 3px var(--el-color-primary-light-8);
  }

  &.is-placeholder {
    color: var(--el-text-color-placeholder);
  }

  &:disabled {
    background: var(--el-fill-color-light);
    color: var(--el-text-color-disabled);
    cursor: not-allowed;
  }
}

.address-trigger__text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.address-trigger__icon {
  position: absolute;
  top: 50%;
  right: 12px;
  color: var(--el-text-color-secondary);
  transform: translateY(-50%);
  transition: transform 0.18s ease;
}

.address-trigger.is-open .address-trigger__icon {
  transform: translateY(-50%) rotate(180deg);
}

.address-panel {
  position: absolute;
  z-index: 30;
  top: calc(100% + 6px);
  right: 0;
  left: 0;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  box-shadow: var(--el-box-shadow-light);
}

.address-columns {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  height: 264px;
}

.address-column {
  overflow-y: auto;
  border-right: 1px solid var(--el-border-color-lighter);
  scrollbar-color: var(--el-border-color) transparent;
  scrollbar-width: thin;

  &:last-child {
    border-right: none;
  }

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color);
    border-radius: 999px;
  }
}

.address-column__title {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 9px 12px;
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.address-option {
  display: block;
  width: 100%;
  padding: 9px 12px;
  border: none;
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 13px;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: var(--el-fill-color-light);
  }

  &.is-active {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-weight: 600;
  }
}

.address-panel__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.address-clear {
  padding: 0;
  border: none;
  background: none;
  color: var(--el-color-primary);
  font-size: 12px;
  cursor: pointer;
}

.address-hint {
  overflow: hidden;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.address-detail {
  width: 100%;
}

@media (max-width: 768px) {
  .address-picker {
    width: 100%;
  }

  .address-columns {
    height: 220px;
  }
}
</style>
