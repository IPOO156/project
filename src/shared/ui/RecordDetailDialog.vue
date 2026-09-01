<script setup lang="ts">
import { computed } from 'vue'
import { APPLICATION_STATUS } from '@/shared/constants/dict'

/**
 * RecordDetailDialog - 申报/奖项记录「查看」详情弹窗
 *
 * 仅展示记录中**用户填写的关键字段**：
 *  - 白名单 FIELD_LABELS 过滤：id、后端内部下划线字段（archive_type/submit_time/can_edit 等）、
 *    canXxx 标志等无用信息一律不展示；
 *  - 字段名统一中文标签，按白名单定义顺序排列；
 *  - 空值 / 空数组字段自动隐藏（只显示已填写的信息）；
 *  - status 经 APPLICATION_STATUS 字典转中文（草稿/待审核/已驳回/已通过/已撤销）；
 *  - 数组字段（如 proofMaterials 证明材料）以「、」分隔，对象字段 JSON 序列化。
 */
interface Props {
  visible: boolean
  record?: Record<string, any> | null
  /** 加载详情数据中的 loading 态（真实后端记录需先拉详情接口） */
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
}>()

/** 字段名 → 中文标签白名单：仅展示映射内的关键用户填写字段，对象键顺序即展示顺序 */
const FIELD_LABELS: Record<string, string> = {
  /* 通用 */
  title: '标题',
  typeLabel: '类型',
  submitDate: '提交日期',
  semester: '学期',
  status: '状态',
  rejectedReason: '退回原因',
  proofMaterials: '证明材料',
  role: '本人角色',
  certNumber: '证书编号',
  issuingAuthority: '发证单位',
  acquisitionDate: '取得时间',
  validityPeriod: '有效期',
  /* 学科竞赛 / 竞赛之星 */
  competitionName: '竞赛名称',
  competitionType: '竞赛类型',
  competitionDate: '参赛时间',
  competitionLevel: '竞赛级别',
  awardLevel: '获奖等级',
  /* 创新创业 / 双创之星 */
  companyName: '公司名称',
  industryType: '行业类型',
  companyType: '公司类型',
  teamRole: '团队角色',
  registerDate: '注册时间',
  /* 实训 / 科研项目 / 学术研究 / 科研之星-科研项目 */
  projectName: '项目名称',
  projectContent: '项目内容',
  projectLevel: '项目级别',
  researchType: '研究类型',
  projectDate: '开始时间',
  ranking: '排名/总人数',
  /* 社会实践 */
  activityName: '活动名称',
  location: '活动地点',
  organization: '组织单位',
  volunteerHours: '志愿时长',
  /* 组织履历 */
  organizationLevel: '组织级别',
  department: '部门',
  position: '职务',
  /* 荣誉证书 */
  certType: '证书类型',
  certName: '证书名称',
  certDate: '获得时间',
  /* 图书心得 */
  bookName: '图书名称',
  bookDate: '阅读时间',
  review: '心得体会',
  /* 奖学金 */
  awardName: '奖项名称',
  scholarshipLevel: '奖学金级别',
  scholarshipGrade: '获奖等级',
  acquireDate: '获得时间',
  /* 实习经历 */
  company: '实习公司',
  /* 软件著作权 */
  softName: '软著名称',
  issuer: '颁发单位',
  approveDate: '获批时间',
  /* 发表论文 */
  journalName: '期刊名称',
  paperName: '论文名称',
  publishDate: '发表时间',
  /* 起止时间通用 */
  startDate: '开始时间',
  endDate: '结束时间',
}

function handleClose() {
  emit('update:visible', false)
  emit('close')
}

function isEmpty(v: unknown): boolean {
  if (v === undefined || v === null || v === '') return true
  if (Array.isArray(v) && v.length === 0) return true
  return false
}

function formatValue(key: string, val: unknown): string {
  if (key === 'status') {
    return APPLICATION_STATUS[val as keyof typeof APPLICATION_STATUS]?.label ?? String(val)
  }
  if (Array.isArray(val))
    return val.map((i) => (typeof i === 'object' ? JSON.stringify(i) : String(i))).join('、')
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

/** 仅保留白名单内且非空的用户填写字段，按 FIELD_LABELS 定义顺序展示 */
const displayItems = computed(() => {
  if (!props.record) return []
  const order = Object.fromEntries(Object.keys(FIELD_LABELS).map((k, i) => [k, i]))
  return Object.entries(props.record)
    .filter(([key, val]) => FIELD_LABELS[key] && !isEmpty(val))
    .sort(([a], [b]) => order[a] - order[b])
    .map(([key, val]) => ({ key, label: FIELD_LABELS[key], value: formatValue(key, val) }))
})
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="记录详情"
    width="560px"
    @update:model-value="handleClose"
  >
    <template v-if="displayItems.length || loading">
      <el-descriptions v-loading="loading" :column="1" border>
        <el-descriptions-item v-for="item in displayItems" :key="item.key" :label="item.label">
          {{ item.value }}
        </el-descriptions-item>
      </el-descriptions>
    </template>
    <el-empty v-else description="暂无记录详情" :image-size="80" />
    <template #footer><el-button @click="handleClose">关闭</el-button></template>
  </el-dialog>
</template>
