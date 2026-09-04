<script setup lang="ts">
/**
 * ScoreIndicatorDialog - 评分指标弹窗
 *
 * 展示申报/报名的各项评分指标及得分，用于查看审核评分详情。
 * 两个标签页：评分明细（含各维度「计算说明」）+ 指标体系（GET /common/indicators 指标树）。
 * 配合 useScoreIndicator composable 使用。
 */
import type { CommonIndicator } from '@/shared/api/common'
import type { IndicatorItem } from '@/shared/composables/useScoreIndicator'
import { ElMessage } from 'element-plus'
import { ref, watch } from 'vue'
import { getIndicators } from '@/shared/api/common'
import { getProfileScores, getScoreCalculationDetails } from '@/shared/api/student'

interface Props {
  visible: boolean
  title: string
  indicators: IndicatorItem[]
  loading?: boolean
  /** 画像分数计算说明 ID（GET /profile/scores 响应中的 calculationId），缺失时弹窗内自行获取 */
  calculationId?: number | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

// ── 计算说明 ──
interface CalcDetailRow {
  indicatorName: string
  weight: number
  rawScore: number
  weightedScore: number
  sourceArchiveTitles: string[]
}

interface CalcDetail {
  ruleVersion: number
  dataSource: string
  calculatedAt: string
  rows: CalcDetailRow[]
}

// ── 指标体系 ──
const treeData = ref<CommonIndicator[]>([])
const treeMeta = ref<{ versionName: string; effectiveAt: string } | null>(null)
const treeLoading = ref(false)
const treeUnavailable = ref(false)

const activeTab = ref('score')

const detailLoading = ref(false)
const calcDetail = ref<CalcDetail | null>(null)
const detailTitle = ref('')

/** 计算总分 */
function calcTotal(items: IndicatorItem[]): number {
  return items.reduce((sum, item) => sum + item.score * item.weight, 0)
}

/** 计算满分 */
function calcMaxTotal(items: IndicatorItem[]): number {
  return items.reduce((sum, item) => sum + item.maxScore * item.weight, 0)
}

/** 格式化百分比 */
function formatPercent(score: number, maxScore: number): string {
  if (!maxScore) return '0%'
  return `${Math.round((score / maxScore) * 100)}%`
}

/** 权重转百分比展示 */
function formatWeight(weight: number): string {
  return `${Math.round(weight * 100)}%`
}

/** 指标树节点标签：指标名 + 权重 */
function nodeLabel(data: unknown): string {
  const node = data as CommonIndicator
  return `${node.indicatorName}（${formatWeight(node.weight)}）`
}

/** 解析 calculationId：优先取父组件传入，缺失时回退拉取最新画像分数 */
async function resolveCalculationId(): Promise<number | null> {
  if (props.calculationId != null) return props.calculationId
  try {
    const data = await getProfileScores()
    return data?.calculationId ?? null
  } catch {
    return null
  }
}

/** 打开某维度的计算说明（GET /profile/scores/{calculationId}/details，4.1.3） */
async function openCalcDetail(item: IndicatorItem) {
  detailLoading.value = true
  calcDetail.value = null
  detailTitle.value = item.label
  try {
    const calcId = await resolveCalculationId()
    if (calcId == null) {
      ElMessage.info('暂无计算说明数据')
      return
    }
    const data = await getScoreCalculationDetails(calcId)
    const all = data?.details ?? []
    const matched = all.filter((d) => d.dimensionName === item.label)
    calcDetail.value = {
      ruleVersion: data.ruleVersion,
      dataSource: data.dataSource,
      calculatedAt: data.calculatedAt,
      rows: (matched.length > 0 ? matched : all).map((d) => ({
        indicatorName: d.indicatorName,
        weight: d.weight,
        rawScore: d.rawScore,
        weightedScore: d.weightedScore,
        sourceArchiveTitles: d.sourceArchiveTitles ?? [],
      })),
    }
  } catch {
    ElMessage.info('计算说明加载失败')
  } finally {
    detailLoading.value = false
  }
}

/** 收起计算说明 */
function closeDetail() {
  calcDetail.value = null
  detailTitle.value = ''
}

/** 加载指标体系（GET /common/indicators，3.7），失败静默提示 */
async function loadIndicators() {
  if (treeData.value.length > 0 || treeLoading.value) return
  treeLoading.value = true
  treeUnavailable.value = false
  try {
    const data = await getIndicators()
    treeMeta.value = { versionName: data.versionName, effectiveAt: data.effectiveAt }
    treeData.value = data.indicators ?? []
  } catch {
    treeData.value = []
    treeMeta.value = null
    treeUnavailable.value = true
  } finally {
    treeLoading.value = false
  }
}

watch(activeTab, (tab) => {
  if (tab === 'tree') loadIndicators()
})

watch(
  () => props.visible,
  () => {
    activeTab.value = 'score'
    closeDetail()
    treeData.value = []
    treeMeta.value = null
    treeUnavailable.value = false
  },
)
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="title"
    width="720px"
    :close-on-click-modal="false"
    @close="emit('close')"
  >
    <el-tabs v-model="activeTab">
      <el-tab-pane label="评分明细" name="score">
        <el-alert
          v-if="indicators.length === 0 && !loading"
          title="暂无评分数据"
          type="info"
          :closable="false"
          center
        />

        <div v-loading="loading" class="score-indicator">
          <table v-if="indicators.length > 0" class="score-indicator__table">
            <thead>
              <tr>
                <th class="score-indicator__th">指标</th>
                <th class="score-indicator__th score-indicator__th--center">得分</th>
                <th class="score-indicator__th score-indicator__th--center">满分</th>
                <th class="score-indicator__th score-indicator__th--center">权重</th>
                <th class="score-indicator__th score-indicator__th--center">得分率</th>
                <th class="score-indicator__th">备注</th>
                <th class="score-indicator__th score-indicator__th--center">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in indicators" :key="index">
                <td class="score-indicator__td">{{ item.label }}</td>
                <td class="score-indicator__td score-indicator__td--center">
                  <span
                    class="score-indicator__score"
                    :class="{
                      'score-indicator__score--high': item.score / item.maxScore >= 0.8,
                      'score-indicator__score--mid':
                        item.score / item.maxScore >= 0.6 && item.score / item.maxScore < 0.8,
                      'score-indicator__score--low': item.score / item.maxScore < 0.6,
                    }"
                  >
                    {{ item.score }}
                  </span>
                </td>
                <td class="score-indicator__td score-indicator__td--center">{{ item.maxScore }}</td>
                <td class="score-indicator__td score-indicator__td--center">
                  {{ Math.round(item.weight * 100) }}%
                </td>
                <td class="score-indicator__td score-indicator__td--center">
                  {{ formatPercent(item.score, item.maxScore) }}
                </td>
                <td class="score-indicator__td">{{ item.remark || '-' }}</td>
                <td class="score-indicator__td score-indicator__td--center">
                  <el-button link type="primary" size="small" @click="openCalcDetail(item)">
                    计算说明
                  </el-button>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="indicators.length > 0" class="score-indicator__total">
            <span class="score-indicator__total-label">加权总分</span>
            <span class="score-indicator__total-value">
              {{ calcTotal(indicators).toFixed(1) }}
              / {{ calcMaxTotal(indicators).toFixed(1) }}
            </span>
          </div>
        </div>

        <div v-if="calcDetail || detailLoading" class="calc-detail">
          <div class="calc-detail__head">
            <span class="calc-detail__title">{{ detailTitle }} · 计算说明</span>
            <el-button link type="primary" size="small" @click="closeDetail">收起</el-button>
          </div>
          <div v-loading="detailLoading" class="calc-detail__body">
            <template v-if="calcDetail">
              <div class="calc-detail__meta">
                <span>规则版本：v{{ calcDetail.ruleVersion }}</span>
                <span>计算时间：{{ calcDetail.calculatedAt }}</span>
                <span>数据来源：{{ calcDetail.dataSource || '-' }}</span>
              </div>
              <el-empty
                v-if="calcDetail.rows.length === 0"
                description="该维度暂无明细"
                :image-size="60"
              />
              <table v-else class="calc-detail__table">
                <thead>
                  <tr>
                    <th class="calc-detail__th">指标</th>
                    <th class="calc-detail__th calc-detail__th--center">权重</th>
                    <th class="calc-detail__th calc-detail__th--center">原始分</th>
                    <th class="calc-detail__th calc-detail__th--center">加权分</th>
                    <th class="calc-detail__th">依据档案</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, i) in calcDetail.rows" :key="i">
                    <td class="calc-detail__td">{{ row.indicatorName }}</td>
                    <td class="calc-detail__td calc-detail__td--center">
                      {{ formatWeight(row.weight) }}
                    </td>
                    <td class="calc-detail__td calc-detail__td--center">{{ row.rawScore }}</td>
                    <td class="calc-detail__td calc-detail__td--center">{{ row.weightedScore }}</td>
                    <td class="calc-detail__td">
                      <el-tag
                        v-for="(archiveTitle, j) in row.sourceArchiveTitles"
                        :key="j"
                        class="calc-detail__tag"
                        size="small"
                      >
                        {{ archiveTitle }}
                      </el-tag>
                      <span v-if="row.sourceArchiveTitles.length === 0" class="calc-detail__empty">
                        —
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </template>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="指标体系" name="tree">
        <div v-loading="treeLoading" class="indicator-tree">
          <el-empty v-if="treeUnavailable" description="指标体系暂不可用" :image-size="80" />
          <template v-else-if="treeData.length > 0">
            <div class="indicator-tree__meta">
              <span>版本：{{ treeMeta?.versionName || '-' }}</span>
              <span>生效时间：{{ treeMeta?.effectiveAt || '-' }}</span>
            </div>
            <el-tree
              :data="treeData"
              :props="{ label: nodeLabel, children: 'children' }"
              node-key="indicatorId"
              default-expand-all
            />
          </template>
          <el-empty
            v-else
            :description="treeLoading ? '加载中…' : '暂无指标数据'"
            :image-size="80"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <el-button @click="emit('close')">关闭</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.score-indicator {
  min-height: 80px;

  &__table {
    width: 100%;
    border-collapse: collapse;
  }

  &__th {
    text-align: left;
    padding: 10px 8px;
    font-size: 13px;
    color: #606266;
    background: #f5f7fa;
    border-bottom: 1px solid #e4e7ed;
    font-weight: 600;

    &--center {
      text-align: center;
    }
  }

  &__td {
    padding: 10px 8px;
    font-size: 14px;
    color: #303133;
    border-bottom: 1px solid #ebeef5;

    &--center {
      text-align: center;
    }
  }

  &__score {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 4px;
    font-weight: 600;

    &--high {
      color: #67c23a;
      background: #f0f9eb;
    }

    &--mid {
      color: #e6a23c;
      background: #fdf6ec;
    }

    &--low {
      color: #f56c6c;
      background: #fef0f0;
    }
  }

  &__total {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 2px solid #409eff;

    &-label {
      font-size: 14px;
      color: #606266;
      font-weight: 600;
    }

    &-value {
      font-size: 18px;
      color: #409eff;
      font-weight: 700;
    }
  }
}

.calc-detail {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed #e4e7ed;

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }

  &__body {
    min-height: 60px;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 20px;
    margin-bottom: 12px;
    font-size: 12px;
    color: #909399;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
  }

  &__th {
    text-align: left;
    padding: 8px;
    font-size: 13px;
    color: #606266;
    background: #f5f7fa;
    border-bottom: 1px solid #e4e7ed;
    font-weight: 600;

    &--center {
      text-align: center;
    }
  }

  &__td {
    padding: 8px;
    font-size: 13px;
    color: #303133;
    border-bottom: 1px solid #ebeef5;

    &--center {
      text-align: center;
    }
  }

  &__tag {
    margin-right: 6px;
    margin-bottom: 2px;
  }

  &__empty {
    color: #c0c4cc;
  }
}

.indicator-tree {
  min-height: 120px;
  max-height: 420px;
  overflow-y: auto;

  &__meta {
    display: flex;
    gap: 20px;
    margin-bottom: 12px;
    padding: 8px 12px;
    font-size: 13px;
    color: #606266;
    background: #f5f7fa;
    border-radius: 4px;
  }
}
</style>
