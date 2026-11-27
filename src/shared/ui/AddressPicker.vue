<script setup lang="ts">
import type { CityMap, DistrictMap, RegionTree } from './addressPickerHelpers'
import { ElMessage } from 'element-plus'
import { ChevronDown } from 'lucide-vue-next'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { createAIConversation, deleteAIConversation, sendAIMessage } from '@/shared/api/ai-chat'
import {
  findName,
  municipalityCityName,
  parseAddress,
  readAIReply,
  sanitizeForAI,
} from './addressPickerHelpers'

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

// 行政区划数据约 655KB：改为首次真正需要时（打开选择面板 / 回填已有地址 / AI 识别）再动态加载。
// 组件本身被申报页常驻渲染，静态 import 会让首屏直接下载整份数据。
const regions = shallowRef<RegionTree | null>(null)
let regionsLoading: Promise<void> | null = null

async function ensureRegions(): Promise<void> {
  if (regions.value) return
  if (!regionsLoading) {
    regionsLoading = import('@/shared/data/china-regions.json')
      .then((mod) => {
        regions.value = mod.default as unknown as RegionTree
      })
      .finally(() => {
        regionsLoading = null
      })
  }
  await regionsLoading
}

const provinces = computed(() => (regions.value ? Object.keys(regions.value) : []))

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

const provinceNode = computed(() => (province.value ? regions.value?.[province.value] : undefined))
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
    void hydrate(value ?? '')
  },
)

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
    city.value =
      regions.value && regions.value[name]?.municipality
        ? municipalityCityName(regions.value, name)
        : ''
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

async function parsePaste() {
  const text = pasteText.value.trim()
  if (!text) {
    ElMessage.warning('请先粘贴地址')
    return
  }
  if (parsing.value || props.disabled) return
  // AI 识别结果需要行政区划表做名称匹配：先确保数据已加载
  try {
    await ensureRegions()
  } catch {
    ElMessage.error('行政区划数据加载失败，请检查网络后重试')
    return
  }

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

    const provinceName = findName(provinceRaw, provinces.value)
    if (!provinceName) {
      ElMessage.warning('AI 没有识别出省份，请手动选择')
      return
    }

    const tree = regions.value
    const node = tree?.[provinceName]
    if (!tree || !node) {
      ElMessage.warning('行政区划数据未加载，请手动选择')
      return
    }
    const isMuni = Boolean(node.municipality)
    let cityName = isMuni
      ? municipalityCityName(tree, provinceName)
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

async function hydrate(value: string) {
  const next = value ?? ''
  if (next === fullAddress.value) return
  // 已有地址需要行政区划表才能拆级；空值不触发下载
  if (next.trim()) {
    try {
      await ensureRegions()
    } catch {
      /* 加载失败时按整串详细地址回填，用户仍可手动选择 */
    }
  }
  const parsed = parseAddress(next, regions.value)
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

async function togglePanel() {
  if (props.disabled) return
  if (!panelOpen.value) {
    try {
      await ensureRegions()
    } catch {
      ElMessage.error('行政区划数据加载失败，请检查网络后重试')
      return
    }
  }
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
  void hydrate(props.modelValue ?? '')
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

<style scoped lang="scss" src="./address-picker.scss"></style>
