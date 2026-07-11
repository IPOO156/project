<script setup lang="ts">
import type { StarRecord } from '../composables/useStarMockData'
import { ElMessage } from 'element-plus'
/**
 * StarSection - 奖项报名审核情况
 *
 * 竞赛之星/科研之星/双创之星的报名状态展示。
 * 查看弹窗展示完整报名信息，
 * 编辑在弹窗内转为可编辑表单，修改后重新提交。
 */
import { computed, reactive, ref } from 'vue'
import {
  AWARD_LEVELS,
  COMPETITION_TYPES,
  INDUSTRY_TYPES,
  PROJECT_LEVELS,
  SEMESTER_OPTIONS,
} from '@/shared/constants/dict'
import StatusTag from '@/shared/ui/StatusTag.vue'
import { canEditStar, filterStarRecords, useStarMockData } from '../composables/useStarMockData'

const starTabs = [
  { key: 'all', label: '全部' },
  { key: 'competitionStar', label: '竞赛之星' },
  { key: 'scientificStar', label: '科研之星' },
  { key: 'innovationStar', label: '双创之星' },
]

const activeTab = ref<string>('all')
const allStarData = useStarMockData()

const filteredRecords = computed(() => filterStarRecords(allStarData.value, activeTab.value))

const pageNum = ref(1)
const pageSize = ref(10)

const paginatedRecords = computed(() => {
  const start = (pageNum.value - 1) * pageSize.value
  return filteredRecords.value.slice(start, start + pageSize.value)
})

const total = computed(() => filteredRecords.value.length)

function handlePageChange(page: number) {
  pageNum.value = page
}
function handleSizeChange(size: number) {
  pageSize.value = size
  pageNum.value = 1
}
function handleTabChange(tab: string | number) {
  activeTab.value = String(tab)
  pageNum.value = 1
}

// ── 详情/编辑弹窗 ──
const detailVisible = ref(false)
const detailMode = ref<'view' | 'edit'>('view')
const detailRecord = ref<StarRecord | null>(null)
const editForm = reactive<Record<string, any>>({})
const saving = ref(false)

const statusLabel: Record<string, string> = {
  draft: '草稿',
  submitted: '待审核',
  approved: '已通过',
  rejected: '已驳回',
}

function dictLabel(dict: readonly { label: string; value: string }[], value: string): string {
  return dict.find((d) => d.value === value)?.label || value
}

/** 查看模式字段：按之星类型展示完整报名信息 */
const detailFields = computed(() => {
  const r = detailRecord.value
  if (!r) return []

  const base = [
    { label: '报名人', value: r.applicant },
    { label: '提交日期', value: r.submitDate || '-' },
    { label: '学期', value: r.semester },
  ]

  let typeFields: { label: string; value: string }[] = []

  if (r.type === 'competitionStar') {
    typeFields = [
      { label: '竞赛名称', value: r.competitionName || r.title.replace(' - 竞赛之星报名', '') },
      { label: '竞赛时间', value: r.competitionDate || '-' },
      { label: '竞赛级别', value: dictLabel(COMPETITION_TYPES, r.competitionLevel || '') },
      { label: '获奖等级', value: dictLabel(AWARD_LEVELS, r.awardLevel || '') },
    ]
  } else if (r.type === 'scientificProject') {
    typeFields = [
      { label: '项目名称', value: r.projectName || r.title.replace(' - 科研之星报名', '') },
      { label: '项目级别', value: dictLabel(PROJECT_LEVELS, r.projectLevel || '') },
      { label: '申报人排名', value: r.ranking || '-' },
      { label: '项目时间', value: r.projectDate || '-' },
    ]
  } else if (r.type === 'softwareCopyright') {
    typeFields = [
      { label: '软件名称', value: r.softName || r.title.replace(' - 科研之星报名', '') },
      { label: '颁发单位', value: r.issuer || '-' },
      { label: '申报人排名', value: r.ranking || '-' },
      { label: '批准日期', value: r.approveDate || '-' },
    ]
  } else if (r.type === 'paper') {
    typeFields = [
      { label: '论文名称', value: r.paperName || r.title.replace(' - 科研之星报名', '') },
      { label: '发表期刊', value: r.journalName || '-' },
      { label: '申报人排名', value: r.ranking || '-' },
      { label: '发表日期', value: r.publishDate || '-' },
    ]
  } else if (r.type === 'innovationStar') {
    typeFields = [
      { label: '公司名称', value: r.companyName || r.title.replace(' - 双创之星报名', '') },
      { label: '行业类型', value: dictLabel(INDUSTRY_TYPES, r.industryType || '') },
      { label: '申报人排名', value: r.ranking || '-' },
      { label: '注册时间', value: r.registerDate || '-' },
    ]
  }

  return [
    { label: '报名类型', value: r.typeLabel },
    ...typeFields,
    ...base,
    { label: '当前状态', value: statusLabel[r.status] || r.status, isStatus: true },
  ]
})

function handleView(row: StarRecord) {
  detailRecord.value = row
  detailMode.value = 'view'
  detailVisible.value = true
}

function handleEdit(row: StarRecord) {
  detailRecord.value = row
  detailMode.value = 'edit'
  Object.keys(editForm).forEach((k) => delete (editForm as any)[k])
  // 按类型填充完整字段，与各报名页字段一致
  if (row.type === 'competitionStar') {
    editForm.competitionName = row.competitionName || row.title.replace(' - 竞赛之星报名', '')
    editForm.competitionDate = row.competitionDate || ''
    editForm.competitionLevel = row.competitionLevel || ''
    editForm.awardLevel = row.awardLevel || ''
    editForm.semester = row.semester || ''
  } else if (row.type === 'scientificProject') {
    editForm.projectName = row.projectName || row.title.replace(' - 科研之星报名', '')
    editForm.projectLevel = row.projectLevel || ''
    editForm.ranking = row.ranking || ''
    editForm.projectDate = row.projectDate || ''
    editForm.semester = row.semester || ''
  } else if (row.type === 'softwareCopyright') {
    editForm.softName = row.softName || row.title.replace(' - 科研之星报名', '')
    editForm.issuer = row.issuer || ''
    editForm.ranking = row.ranking || ''
    editForm.approveDate = row.approveDate || ''
    editForm.semester = row.semester || ''
  } else if (row.type === 'paper') {
    editForm.paperName = row.paperName || row.title.replace(' - 科研之星报名', '')
    editForm.journalName = row.journalName || ''
    editForm.ranking = row.ranking || ''
    editForm.publishDate = row.publishDate || ''
    editForm.semester = row.semester || ''
  } else if (row.type === 'innovationStar') {
    editForm.companyName = row.companyName || row.title.replace(' - 双创之星报名', '')
    editForm.industryType = row.industryType || ''
    editForm.ranking = row.ranking || ''
    editForm.registerDate = row.registerDate || ''
    editForm.semester = row.semester || ''
  }
  detailVisible.value = true
}

function handleSave() {
  saving.value = true
  setTimeout(() => {
    if (detailRecord.value) {
      // 按子类型重构标题
      const suffixMap: Record<string, string> = {
        competitionStar: ' - 竞赛之星报名',
        scientificProject: ' - 科研之星报名',
        softwareCopyright: ' - 科研之星报名',
        paper: ' - 科研之星报名',
        innovationStar: ' - 双创之星报名',
      }
      const suffix = suffixMap[detailRecord.value.type] || ''
      const type = detailRecord.value.type
      const titleField =
        type === 'competitionStar'
          ? editForm.competitionName
          : type === 'scientificProject'
            ? editForm.projectName
            : type === 'softwareCopyright'
              ? editForm.softName
              : type === 'paper'
                ? editForm.paperName
                : editForm.companyName
      if (titleField) {
        detailRecord.value.title = titleField + suffix
      }
      // 保存各类型特有字段
      if (type === 'competitionStar') {
        detailRecord.value.competitionName = editForm.competitionName
        detailRecord.value.competitionDate = editForm.competitionDate
        detailRecord.value.competitionLevel = editForm.competitionLevel
        detailRecord.value.awardLevel = editForm.awardLevel
      } else if (type === 'scientificProject') {
        detailRecord.value.projectName = editForm.projectName
        detailRecord.value.projectLevel = editForm.projectLevel
        detailRecord.value.ranking = editForm.ranking
        detailRecord.value.projectDate = editForm.projectDate
      } else if (type === 'softwareCopyright') {
        detailRecord.value.softName = editForm.softName
        detailRecord.value.issuer = editForm.issuer
        detailRecord.value.ranking = editForm.ranking
        detailRecord.value.approveDate = editForm.approveDate
      } else if (type === 'paper') {
        detailRecord.value.paperName = editForm.paperName
        detailRecord.value.journalName = editForm.journalName
        detailRecord.value.ranking = editForm.ranking
        detailRecord.value.publishDate = editForm.publishDate
      } else if (type === 'innovationStar') {
        detailRecord.value.companyName = editForm.companyName
        detailRecord.value.industryType = editForm.industryType
        detailRecord.value.ranking = editForm.ranking
        detailRecord.value.registerDate = editForm.registerDate
      }
      detailRecord.value.semester = editForm.semester
      detailRecord.value.status = 'submitted'
    }
    saving.value = false
    detailVisible.value = false
    ElMessage.success('修改已保存，等待重新审核')
  }, 400)
}
</script>

<template>
  <div class="star-section">
    <el-tabs v-model="activeTab" type="card" @tab-change="handleTabChange">
      <el-tab-pane v-for="tab in starTabs" :key="tab.key" :label="tab.label" :name="tab.key" />
    </el-tabs>

    <el-table :data="paginatedRecords" stripe style="width: 100%">
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column prop="title" label="报名标题" min-width="240" show-overflow-tooltip />
      <el-table-column prop="typeLabel" label="报名类型" width="120" />
      <el-table-column prop="applicant" label="报名人" width="100" />
      <el-table-column prop="submitDate" label="提交日期" width="120" />
      <el-table-column prop="semester" label="学期" width="110" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }"
          ><StatusTag :status="(row as StarRecord).status" size="small"
        /></template>
      </el-table-column>
      <el-table-column label="操作" width="120" align="center" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="canEditStar((row as StarRecord).status)"
            type="warning"
            link
            size="small"
            @click="handleEdit(row as StarRecord)"
            >编辑</el-button
          >
          <el-button v-else type="primary" link size="small" @click="handleView(row as StarRecord)"
            >查看</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <div v-if="total > 0" class="star-section__pagination">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <!-- 详情/编辑弹窗 -->
    <el-dialog
      v-model="detailVisible"
      :title="detailMode === 'edit' ? '编辑报名信息' : '报名详情'"
      width="560px"
    >
      <!-- 查看模式 -->
      <template v-if="detailRecord && detailMode === 'view'">
        <el-descriptions :column="1" border>
          <el-descriptions-item v-for="f in detailFields" :key="f.label" :label="f.label">
            <template v-if="f.isStatus">
              <StatusTag :status="detailRecord.status" size="small" />
            </template>
            <span v-else>{{ f.value }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </template>

      <!-- 编辑模式 -->
      <template v-if="detailRecord && detailMode === 'edit'">
        <el-alert title="编辑说明" type="warning" :closable="false" show-icon class="mb-16">
          <p>修改后提交将进入待审核状态。</p>
        </el-alert>
        <el-form :model="editForm" label-width="120px">
          <!-- 竞赛之星 -->
          <template v-if="detailRecord.type === 'competitionStar'">
            <el-form-item label="竞赛名称" required>
              <el-input
                v-model="editForm.competitionName"
                placeholder="请输入竞赛名称"
                class="form-control"
              />
            </el-form-item>
            <el-form-item label="参赛时间">
              <el-date-picker
                v-model="editForm.competitionDate"
                type="month"
                placeholder="选择年月"
                class="form-control"
              />
            </el-form-item>
            <el-form-item label="竞赛级别">
              <el-select
                v-model="editForm.competitionLevel"
                placeholder="请选择"
                class="form-control"
              >
                <el-option
                  v-for="t in COMPETITION_TYPES"
                  :key="t.value"
                  :label="t.label"
                  :value="t.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="获奖等级">
              <el-select v-model="editForm.awardLevel" placeholder="请选择" class="form-control">
                <el-option
                  v-for="t in AWARD_LEVELS"
                  :key="t.value"
                  :label="t.label"
                  :value="t.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="学期">
              <el-select v-model="editForm.semester" placeholder="请选择" class="form-control">
                <el-option
                  v-for="s in SEMESTER_OPTIONS"
                  :key="s.value"
                  :label="s.label"
                  :value="s.value"
                />
              </el-select>
            </el-form-item>
          </template>

          <!-- 科研项目 -->
          <template v-if="detailRecord.type === 'scientificProject'">
            <el-form-item label="项目名称" required>
              <el-input
                v-model="editForm.projectName"
                placeholder="请输入科研项目名称"
                class="form-control"
              />
            </el-form-item>
            <el-form-item label="项目级别">
              <el-select v-model="editForm.projectLevel" placeholder="请选择" class="form-control">
                <el-option
                  v-for="t in PROJECT_LEVELS"
                  :key="t.value"
                  :label="t.label"
                  :value="t.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="申报人排名">
              <el-input v-model="editForm.ranking" placeholder="如：1/3" class="form-control" />
            </el-form-item>
            <el-form-item label="项目时间">
              <el-date-picker
                v-model="editForm.projectDate"
                type="month"
                placeholder="选择年月"
                class="form-control"
              />
            </el-form-item>
            <el-form-item label="学期">
              <el-select v-model="editForm.semester" placeholder="请选择" class="form-control">
                <el-option
                  v-for="s in SEMESTER_OPTIONS"
                  :key="s.value"
                  :label="s.label"
                  :value="s.value"
                />
              </el-select>
            </el-form-item>
          </template>

          <!-- 软件著作权 -->
          <template v-if="detailRecord.type === 'softwareCopyright'">
            <el-form-item label="软件名称" required>
              <el-input
                v-model="editForm.softName"
                placeholder="请输入软件名称"
                class="form-control"
              />
            </el-form-item>
            <el-form-item label="颁发单位">
              <el-input
                v-model="editForm.issuer"
                placeholder="请输入颁发单位"
                class="form-control"
              />
            </el-form-item>
            <el-form-item label="申报人排名">
              <el-input v-model="editForm.ranking" placeholder="如：1/3" class="form-control" />
            </el-form-item>
            <el-form-item label="批准日期">
              <el-date-picker
                v-model="editForm.approveDate"
                type="month"
                placeholder="选择年月"
                class="form-control"
              />
            </el-form-item>
            <el-form-item label="学期">
              <el-select v-model="editForm.semester" placeholder="请选择" class="form-control">
                <el-option
                  v-for="s in SEMESTER_OPTIONS"
                  :key="s.value"
                  :label="s.label"
                  :value="s.value"
                />
              </el-select>
            </el-form-item>
          </template>

          <!-- 发表论文 -->
          <template v-if="detailRecord.type === 'paper'">
            <el-form-item label="论文名称" required>
              <el-input
                v-model="editForm.paperName"
                placeholder="请输入论文名称"
                class="form-control"
              />
            </el-form-item>
            <el-form-item label="发表期刊">
              <el-input
                v-model="editForm.journalName"
                placeholder="请输入期刊名称"
                class="form-control"
              />
            </el-form-item>
            <el-form-item label="申报人排名">
              <el-input v-model="editForm.ranking" placeholder="如：1/3" class="form-control" />
            </el-form-item>
            <el-form-item label="发表日期">
              <el-date-picker
                v-model="editForm.publishDate"
                type="month"
                placeholder="选择年月"
                class="form-control"
              />
            </el-form-item>
            <el-form-item label="学期">
              <el-select v-model="editForm.semester" placeholder="请选择" class="form-control">
                <el-option
                  v-for="s in SEMESTER_OPTIONS"
                  :key="s.value"
                  :label="s.label"
                  :value="s.value"
                />
              </el-select>
            </el-form-item>
          </template>

          <!-- 双创之星 -->
          <template v-if="detailRecord.type === 'innovationStar'">
            <el-form-item label="公司名称" required>
              <el-input
                v-model="editForm.companyName"
                placeholder="请输入公司名称"
                class="form-control"
              />
            </el-form-item>
            <el-form-item label="行业类型">
              <el-select v-model="editForm.industryType" placeholder="请选择" class="form-control">
                <el-option
                  v-for="t in INDUSTRY_TYPES"
                  :key="t.value"
                  :label="t.label"
                  :value="t.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="申报人排名">
              <el-input v-model="editForm.ranking" placeholder="如：1/3" class="form-control" />
            </el-form-item>
            <el-form-item label="注册时间">
              <el-date-picker
                v-model="editForm.registerDate"
                type="month"
                placeholder="选择年月"
                class="form-control"
              />
            </el-form-item>
            <el-form-item label="学期">
              <el-select v-model="editForm.semester" placeholder="请选择" class="form-control">
                <el-option
                  v-for="s in SEMESTER_OPTIONS"
                  :key="s.value"
                  :label="s.label"
                  :value="s.value"
                />
              </el-select>
            </el-form-item>
          </template>
        </el-form>
      </template>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button v-if="detailMode === 'edit'" type="primary" :loading="saving" @click="handleSave"
          >保存修改</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.star-section {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
  }
}

.form-control {
  width: 360px;
}

:deep(.mb-16) {
  margin-bottom: 16px;
}
</style>
