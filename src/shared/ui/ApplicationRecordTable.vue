<script setup lang="ts" generic="T">
import type { ApplicationType } from '@/shared/types/types'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, h, ref, watch } from 'vue'
import { getApplicationGuide, getApplicationVersions } from '@/shared/api/applications'
import { getAwardGuide, getAwardVersions } from '@/shared/api/awards'
import { activityCategoryOf } from '@/shared/api/submission'
import StatusTag from './StatusTag.vue'
import VersionHistoryDrawer from './VersionHistoryDrawer.vue'

interface Props {
  records?: T[]
  showRecords?: boolean
  status?: string
}

const props = withDefaults(defineProps<Props>(), {
  records: () => [],
  showRecords: true,
  status: '',
})

const emit = defineEmits<{
  (e: 'view', row: T): void
  (e: 'edit', row: T): void
  (e: 'remove', row: T): void
  (e: 'withdraw', row: T): void
  (e: 'correction', row: T): void
  (e: 'score', row: T): void
}>()

/* ===================== 申报记录分页 ===================== */
// 超过 PAGE_SIZE 条才启用分页（≤ 阈值时全量展示，保持简洁）；客户端分页基于当前 records 数组
const PAGE_SIZE = 10
const recordsPage = ref(1)
const showRecordsPagination = computed(() => props.records.length > PAGE_SIZE)
const pagedRecords = computed(() => {
  const list = props.records
  if (list.length <= PAGE_SIZE) return list
  const start = (recordsPage.value - 1) * PAGE_SIZE
  return list.slice(start, start + PAGE_SIZE)
})
// 记录增删后若当前页超出最大页，回退到最后一页，避免空白
watch(
  () => props.records.length,
  () => {
    const maxPage = Math.max(1, Math.ceil(props.records.length / PAGE_SIZE))
    if (recordsPage.value > maxPage) recordsPage.value = maxPage
  },
)

function getRecordStatus(record: any): string {
  return record.status || props.status || 'draft'
}
function canEdit(s: string) {
  return s === 'draft' || !s || s === 'rejected'
}
// 与后端 ActivityService.checkDeletable 对齐：草稿 / 已退回 / 已撤回可删除（最终以后端校验为准）
function canDelete(s: string) {
  return s === 'draft' || !s || s === 'rejected' || s === 'withdrawn'
}
function canWithdraw(s: string) {
  return s === 'pending'
}
/**
 * 申请更正仅适用于档案类记录。
 * 后端只有 POST /applications/{archiveId}/correction（ApplicationService 从 archive 表取数），
 * 奖项类没有对应接口；此前奖项行也显示该按钮，会把奖项 id 当作档案 id 提交。
 */
function canRequestCorrection(row: any) {
  return (
    getRecordStatus(row) === 'approved' &&
    activityCategoryOf(row?.type as ApplicationType) === 'archive'
  )
}
function canViewScore(s: string) {
  return s === 'pending' || s === 'approved' || s === 'withdrawn'
}

interface VersionItem {
  version: number
  title: string
  status: number
  statusLabel: string
  rejectedReason?: string
  createdAt: string
}

const versionsVisible = ref(false)
const versionsLoading = ref(false)
const versionsData = ref<{ currentVersion: number; versions: VersionItem[] }>({
  currentVersion: 0,
  versions: [],
})

/** 版本历史入口仅对真实记录开放（本地草稿 draft-local / 临时 rec- 无后端版本记录） */
function canViewVersions(row: any): boolean {
  const id = row?.id
  return id !== undefined && id !== null && /^\d+$/.test(String(id))
}
async function openVersions(row: any) {
  const id = Number(row.id)
  if (!id) return
  versionsVisible.value = true
  versionsLoading.value = true
  versionsData.value = { currentVersion: 0, versions: [] }
  try {
    const category = activityCategoryOf(row.type as ApplicationType)
    versionsData.value =
      category === 'award' ? await getAwardVersions(id) : await getApplicationVersions(id)
  } catch {
    // 版本历史拉取失败：接口 30001 返回 HTTP 404，已由 request 拦截器静默，此处展示空态
  } finally {
    versionsLoading.value = false
  }
}

/* ===================== 评选说明 ===================== */

/**
 * 档案类前端类型 → 评选说明接口类型（GET /applications/{type}/guide）。
 * 后端 ApplicationService.getGuide 用 ArchiveTypeEnum.of(type) 校验，仅接受下划线编码
 *（academic_competition/innovation_entrepreneurship/academic_research/honor_certificate/
 *  training_project/social_practice/book_review 等，见 ArchiveTypeEnum.java）；
 * 此前用驼峰短别名（competition/innovation/…）导致 of() 返回 null → 400「不支持的档案类型」。
 */
const ARCHIVE_GUIDE_TYPES: Record<string, string> = {
  competition: 'academic_competition',
  scholarship: 'scholarship',
  innovation: 'innovation_entrepreneurship',
  research: 'academic_research',
  certificate: 'honor_certificate',
  internship: 'internship',
  organization: 'organization',
  training: 'training_project',
  socialPractice: 'social_practice',
  bookReport: 'book_review',
}

/** 奖项类前端类型 → 评选说明接口类型（GET /awards/{type}/guide） */
const AWARD_GUIDE_TYPES: Record<string, string> = {
  competitionStar: 'competition_star',
  innovationStar: 'innovation_star',
  scientificProject: 'research_star',
  softwareCopyright: 'research_star',
  paper: 'research_star',
}

interface GuideData {
  type: string
  typeLabel: string
  title: string
  content: string
  /** 申报说明（档案类评选说明接口的 applyDesc；奖项类无此字段） */
  applyDesc?: string
  requirements: Array<{ field: string; label: string; required: boolean; description: string }>
  notes: string[]
  updatedAt: string
}

/** 前端类型 → 评选说明接口真实类型（按 archive/award 区分），未知类型返回 null */
function resolveGuideType(rowType: any): { category: 'archive' | 'award'; type: string } | null {
  // activityCategoryOf 返回 ActivityType（含 career_plan），本组件仅申报/奖项记录，非 award 一律归 archive
  const category: 'archive' | 'award' =
    activityCategoryOf(rowType as ApplicationType) === 'award' ? 'award' : 'archive'
  const type = (category === 'award' ? AWARD_GUIDE_TYPES : ARCHIVE_GUIDE_TYPES)[rowType]
  return type ? { category, type } : null
}

function canViewGuide(row: any): boolean {
  return resolveGuideType(row?.type) !== null
}

function formatUpdatedAt(value?: string): string {
  if (!value) return ''
  return value.length >= 10 ? value.slice(0, 10) : value
}

/** 用 h() 渲染评选说明 VNode（message 渲染于 message box 内，样式见文末非 scoped 样式块） */
function buildGuideVNode(data: GuideData) {
  const hasContent = Boolean(data.content || data.applyDesc)
  const hasRequirements = Boolean(data.requirements?.length)
  const hasNotes = Boolean(data.notes?.length)
  return h('div', { class: 'message-guide' }, [
    h('div', { class: 'message-guide__title' }, [
      data.title || data.typeLabel || '评选说明',
      data.typeLabel ? h('span', { class: 'message-guide__type' }, data.typeLabel) : null,
    ]),
    data.content ? h('p', { class: 'message-guide__content' }, data.content) : null,
    data.applyDesc
      ? h('div', { class: 'message-guide__section' }, [
          h('div', { class: 'message-guide__section-title' }, '申报说明'),
          h('p', { class: 'message-guide__content' }, data.applyDesc),
        ])
      : null,
    !hasContent && !hasRequirements && !hasNotes
      ? h(
          'p',
          { class: 'message-guide__empty' },
          '暂无评选说明，请联系管理员补充该类型的申报配置。',
        )
      : null,
    data.requirements?.length
      ? h('div', { class: 'message-guide__section' }, [
          h('div', { class: 'message-guide__section-title' }, '申报要求'),
          h('table', { class: 'message-guide__table' }, [
            h('thead', null, [
              h('tr', null, [
                h('th', null, '材料项'),
                h('th', null, '填写说明'),
                h('th', { class: 'message-guide__center' }, '是否必填'),
              ]),
            ]),
            h(
              'tbody',
              null,
              data.requirements.map((r) =>
                h('tr', { key: r.field }, [
                  h('td', null, r.label || r.field),
                  h('td', null, r.description || ''),
                  h('td', { class: 'message-guide__center' }, r.required ? '必填' : '选填'),
                ]),
              ),
            ),
          ]),
        ])
      : null,
    data.notes?.length
      ? h('div', { class: 'message-guide__section' }, [
          h('div', { class: 'message-guide__section-title' }, '注意事项'),
          h(
            'ul',
            { class: 'message-guide__notes' },
            data.notes.map((n) => h('li', { key: n }, n)),
          ),
        ])
      : null,
    data.updatedAt
      ? h(
          'div',
          { class: 'message-guide__updated' },
          `更新时间：${formatUpdatedAt(data.updatedAt)}`,
        )
      : null,
  ])
}

async function openGuide(row: any) {
  const target = resolveGuideType(row?.type)
  if (!target) return
  try {
    const data =
      target.category === 'award'
        ? await getAwardGuide(target.type)
        : await getApplicationGuide(target.type)
    ElMessageBox.alert(buildGuideVNode(data), '评选说明', {
      confirmButtonText: '知道了',
    }).catch(() => {})
  } catch {
    ElMessage.error('评选说明加载失败，请稍后重试')
  }
}
</script>

<template>
  <el-card v-if="showRecords && records.length" class="record-card">
    <template #header
      ><span class="card-title">申报记录</span
      ><span class="card-title__count">共 {{ records.length }} 条</span></template
    >
    <!-- pagedRecords 为泛型 T[]，el-table data 要求 DefaultRow[]（Record<PropertyKey, any>），双重断言显式收窄 -->
    <el-table :data="pagedRecords as unknown as Record<PropertyKey, any>[]" stripe>
      <slot name="columns" />
      <el-table-column label="状态" width="100" align="center"
        ><template #default="{ row }"
          ><StatusTag :status="getRecordStatus(row)" size="small" /></template
      ></el-table-column>
      <el-table-column label="操作" width="360" fixed="right" align="center">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="emit('view', row as T)"
            >查看</el-button
          >
          <el-button
            v-if="canEdit(getRecordStatus(row))"
            size="small"
            type="primary"
            link
            @click="emit('edit', row as T)"
            >编辑</el-button
          >
          <el-button
            v-if="canDelete(getRecordStatus(row))"
            size="small"
            type="danger"
            link
            @click="emit('remove', row as T)"
            >删除</el-button
          >
          <el-button
            v-if="canWithdraw(getRecordStatus(row))"
            size="small"
            type="warning"
            link
            @click="emit('withdraw', row as T)"
            >撤回</el-button
          >
          <el-button
            v-if="canRequestCorrection(row)"
            size="small"
            type="primary"
            link
            @click="emit('correction', row as T)"
            >申请更正</el-button
          >
          <el-button
            v-if="canViewScore(getRecordStatus(row))"
            size="small"
            type="info"
            link
            @click="emit('score', row as T)"
            >计分影响</el-button
          >
          <el-button
            v-if="canViewVersions(row)"
            size="small"
            type="info"
            link
            @click="openVersions(row as T)"
            >版本</el-button
          >
          <el-button
            v-if="canViewGuide(row)"
            size="small"
            type="info"
            link
            @click="openGuide(row as T)"
            >评选说明</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <div v-if="showRecordsPagination" class="record-card__pagination">
      <el-pagination
        v-model:current-page="recordsPage"
        :page-size="PAGE_SIZE"
        :total="records.length"
        layout="prev, pager, next, jumper, total"
        background
        small
      />
    </div>
  </el-card>

  <VersionHistoryDrawer
    v-model:visible="versionsVisible"
    :loading="versionsLoading"
    :current-version="versionsData.currentVersion"
    :versions="versionsData.versions"
  />
</template>

<style scoped lang="scss">
.card-title {
  font-weight: 600;
}
.record-card__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
.card-title__count {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 400;
}
</style>

<style lang="scss">
/* 评选说明弹窗：VNode 由 h() 生成并渲染于 body（message box 内），scoped 样式不会命中，故用非 scoped 且加前缀隔离 */
.message-guide {
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  text-align: left;

  &__title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 8px;
  }

  &__type {
    font-size: 12px;
    font-weight: 500;
    line-height: 20px;
    padding: 0 8px;
    border-radius: 4px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }

  &__content {
    /* 后端说明字段可能含换行，保留段落结构 */
    white-space: pre-line;
    margin: 0 0 12px;
    color: var(--el-text-color-regular);
  }

  &__empty {
    margin: 4px 0 0;
    color: var(--el-text-color-secondary);
  }

  &__section {
    margin-top: 10px;
  }

  &__section-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 6px;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;

    th,
    td {
      padding: 6px 8px;
      border: 1px solid var(--el-border-color-lighter);
      font-size: 12px;
      text-align: left;
    }

    th {
      font-weight: 600;
      background: var(--el-fill-color-light);
    }
  }

  &__center {
    text-align: center;
    white-space: nowrap;
  }

  &__notes {
    margin: 0;
    padding-left: 18px;
    color: var(--el-text-color-regular);

    li {
      margin: 2px 0;
    }
  }

  &__updated {
    margin-top: 12px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    text-align: right;
  }
}
</style>
