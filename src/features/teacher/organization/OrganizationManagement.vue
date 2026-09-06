<script setup lang="ts">
/**
 * OrganizationManagement - 组织架构（教师端管理页）
 * 维护学校 → 学院 → 专业 → 班级层级，级联定位组织后管理班级 / 专业。
 * 学校只读（无创建接口）；学院仅提供列表（无创建接口）。
 * 数据来源：
 *   - GET /admin/schools /colleges /majors /classes  下拉与列表
 *   - POST /admin/classes 新增班级；PUT /admin/classes/{id} 编辑班级
 *   - POST /admin/majors 新增专业
 * 新增/编辑班级、新增专业弹窗已下沉到 ./components/ClassEditDialog.vue、MajorCreateDialog.vue。
 */
import type {
  OrgClassItem,
  OrgClassQuery,
  OrgCollegeItem,
  OrgMajorItem,
  OrgSchoolItem,
} from '@/shared/types/teacher'
import { ElMessage } from 'element-plus'
import { Pencil, Plus, RefreshCw, Search } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref } from 'vue'

import { listClasses, listColleges, listMajors, listSchools } from '@/shared/api/teacher'
import { COMMON_STATUS } from '@/shared/constants/dict'

import ClassEditDialog from './components/ClassEditDialog.vue'
import MajorCreateDialog from './components/MajorCreateDialog.vue'

// ── 级联筛选 ──
const filters = reactive({
  schoolId: undefined as number | undefined,
  collegeId: undefined as number | undefined,
  majorId: undefined as number | undefined,
})

const schools = ref<OrgSchoolItem[]>([])
const colleges = ref<OrgCollegeItem[]>([])
const majors = ref<OrgMajorItem[]>([])
const schoolsLoading = ref(false)
const collegesLoading = ref(false)
const majorsLoading = ref(false)

async function loadSchools() {
  schoolsLoading.value = true
  try {
    schools.value = (await listSchools()) ?? []
  } catch {
    schools.value = []
  } finally {
    schoolsLoading.value = false
  }
}

async function loadColleges() {
  collegesLoading.value = true
  try {
    colleges.value = filters.schoolId
      ? ((await listColleges({ schoolId: filters.schoolId })) ?? [])
      : []
  } catch {
    colleges.value = []
  } finally {
    collegesLoading.value = false
  }
}

// 专业按当前最深上下文加载：有学院按学院，否则有学校按学校（学校级专业列表）
async function loadMajors() {
  majorsLoading.value = true
  try {
    if (filters.collegeId) majors.value = (await listMajors({ collegeId: filters.collegeId })) ?? []
    else if (filters.schoolId)
      majors.value = (await listMajors({ schoolId: filters.schoolId })) ?? []
    else majors.value = []
  } catch {
    majors.value = []
  } finally {
    majorsLoading.value = false
  }
}

function handleSchoolChange() {
  filters.collegeId = undefined
  filters.majorId = undefined
  colleges.value = []
  majors.value = []
  classPage.value = 1
  if (!filters.schoolId) {
    void refreshClassList()
    return
  }
  void loadColleges()
  void loadMajors()
  void refreshClassList()
}

function handleCollegeChange() {
  filters.majorId = undefined
  majors.value = []
  classPage.value = 1
  void loadMajors()
  void refreshClassList()
}

function handleMajorChange() {
  classPage.value = 1
  void refreshClassList()
}

const hasOrgContext = computed(() =>
  Boolean(filters.schoolId || filters.collegeId || filters.majorId),
)

const currentMajorName = computed(() => {
  if (!filters.majorId) return ''
  return majors.value.find((m) => m.majorId === filters.majorId)?.majorName ?? ''
})

// ── 班级列表 ──
const classLoading = ref(false)
const classList = ref<OrgClassItem[]>([])
const classTotal = ref(0)
const classPage = ref(1)
const classPerPage = ref(10)

const orgParams = computed<OrgClassQuery>(() => {
  const params: OrgClassQuery = {}
  if (filters.majorId) params.majorId = filters.majorId
  else if (filters.collegeId) params.collegeId = filters.collegeId
  else if (filters.schoolId) params.schoolId = filters.schoolId
  return params
})

async function refreshClassList() {
  if (!hasOrgContext.value) {
    classList.value = []
    classTotal.value = 0
    return
  }
  classLoading.value = true
  try {
    const res = await listClasses({
      ...orgParams.value,
      page: classPage.value,
      per_page: classPerPage.value,
    })
    classList.value = res?.list ?? []
    classTotal.value = res?.total ?? res?.pagination?.total ?? classList.value.length
  } catch {
    classList.value = []
    classTotal.value = 0
  } finally {
    classLoading.value = false
  }
}

function handleSearch() {
  classPage.value = 1
  void refreshClassList()
}

function handleReset() {
  filters.schoolId = undefined
  filters.collegeId = undefined
  filters.majorId = undefined
  colleges.value = []
  majors.value = []
  classPage.value = 1
  void refreshClassList()
}

function handleClassPageChange(p: number) {
  classPage.value = p
  void refreshClassList()
}

function handleClassSizeChange() {
  classPage.value = 1
  void refreshClassList()
}

// ── 弹窗调用（组件通过 props/emit 交互）──
const classDialogRef = ref<InstanceType<typeof ClassEditDialog> | null>(null)
const majorDialogRef = ref<InstanceType<typeof MajorCreateDialog> | null>(null)

function handleAddClass() {
  if (!filters.majorId) {
    ElMessage.warning('请先在「专业」筛选中选择具体专业，再新增班级')
    return
  }
  classDialogRef.value?.openCreate(filters.majorId)
}

function handleEditClass(row: OrgClassItem) {
  classDialogRef.value?.openEdit(row)
}

// 专业列表行：以该专业定位班级并快速新增
function handleAddClassForMajor(row: OrgMajorItem) {
  filters.majorId = row.majorId
  classPage.value = 1
  void refreshClassList()
  document.getElementById('class-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  classDialogRef.value?.openCreate(row.majorId)
}

function handleAddMajor() {
  if (!filters.collegeId) {
    ElMessage.warning('请先在「学院」筛选中选择学院，再新增专业')
    return
  }
  majorDialogRef.value?.open(filters.collegeId)
}

function handleMajorSaved() {
  void loadMajors()
}

// ── 展示辅助 ──
function statusInfo(status: number | null | undefined): {
  label: string
  tag: 'success' | 'danger' | 'info'
} {
  return COMMON_STATUS[status ?? -1] ?? { label: '-', tag: 'info' }
}

function formatGrade(grade: string | null | undefined): string {
  const value = (grade ?? '').trim()
  if (!value) return '-'
  return /^\d{4}$/.test(value) ? `${value}级` : value
}

function formatStudentCount(count: number | null | undefined): string {
  return count == null ? '-' : String(count)
}

function formatMajorCode(code: string | null | undefined): string {
  const value = (code ?? '').trim()
  return value || '-'
}

const collegeNameMap = computed(() => {
  const map = new Map<number, string>()
  for (const college of colleges.value) map.set(college.collegeId, college.collegeName)
  return map
})

function collegeNameOf(collegeId: number | null | undefined): string {
  return collegeId == null ? '-' : (collegeNameMap.value.get(collegeId) ?? '-')
}

onMounted(() => void loadSchools())
</script>

<template>
  <div class="mc-page org-management">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <h2 class="mc-page-head__title">组织架构</h2>
        <p class="mc-page-head__desc">
          浏览学校 → 学院 → 专业 → 班级的组织层级，并对专业与班级进行增改管理。
        </p>
      </div>
    </div>

    <div class="mc-filter-bar">
      <el-form inline @submit.prevent="handleSearch">
        <el-form-item label="学校">
          <el-select
            v-model="filters.schoolId"
            class="org-management__filter-select"
            placeholder="请选择学校"
            clearable
            filterable
            :loading="schoolsLoading"
            @change="handleSchoolChange"
          >
            <el-option
              v-for="item in schools"
              :key="item.schoolId"
              :label="item.schoolName"
              :value="item.schoolId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="学院">
          <el-select
            v-model="filters.collegeId"
            class="org-management__filter-select"
            placeholder="请选择学院"
            clearable
            filterable
            :disabled="!filters.schoolId"
            :loading="collegesLoading"
            @change="handleCollegeChange"
          >
            <el-option
              v-for="item in colleges"
              :key="item.collegeId"
              :label="item.collegeName"
              :value="item.collegeId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="专业">
          <el-select
            v-model="filters.majorId"
            class="org-management__filter-select"
            placeholder="请选择专业"
            clearable
            filterable
            :disabled="!filters.schoolId"
            :loading="majorsLoading"
            @change="handleMajorChange"
          >
            <el-option
              v-for="item in majors"
              :key="item.majorId"
              :label="item.majorName"
              :value="item.majorId"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="RefreshCw" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 班级管理 -->
    <div id="class-card" class="mc-card">
      <div class="mc-card__head">
        <div class="org-management__head-left">
          <span class="mc-card__title">班级管理</span>
          <span v-if="currentMajorName" class="org-management__head-meta">
            当前定位专业：{{ currentMajorName }}，新增班级将归入该专业
          </span>
          <span v-else-if="hasOrgContext" class="org-management__head-meta">
            展示当前所选组织下的全部班级
          </span>
        </div>
        <el-tooltip
          :disabled="Boolean(filters.majorId)"
          content="请先在筛选区选择具体专业"
          placement="top"
        >
          <span>
            <el-button
              type="primary"
              :icon="Plus"
              :disabled="!filters.majorId"
              @click="handleAddClass"
            >
              新增班级
            </el-button>
          </span>
        </el-tooltip>
      </div>
      <div class="mc-card__body">
        <template v-if="hasOrgContext">
          <el-table v-loading="classLoading" :data="classList" stripe>
            <el-table-column label="班级名称" min-width="180">
              <template #default="{ row }">{{ row.className ?? '-' }}</template>
            </el-table-column>
            <el-table-column label="入学年级" width="110" align="center">
              <template #default="{ row }">{{ formatGrade(row.grade) }}</template>
            </el-table-column>
            <el-table-column label="学生人数" width="100" align="center">
              <template #default="{ row }">{{ formatStudentCount(row.studentCount) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="statusInfo(row.status).tag" size="small">
                  {{ statusInfo(row.status).label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="90" align="center">
              <template #default="{ row }">
                <el-button
                  text
                  type="primary"
                  size="small"
                  :icon="Pencil"
                  @click="handleEditClass(row as OrgClassItem)"
                >
                  编辑
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty
            v-if="!classLoading && !classList.length"
            class="org-management__empty"
            description="当前选择下暂无班级，可点击「新增班级」创建"
            :image-size="72"
          />
          <div v-if="classTotal > 0" class="org-management__pagination">
            <el-pagination
              v-model:current-page="classPage"
              v-model:page-size="classPerPage"
              :total="classTotal"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @current-change="handleClassPageChange"
              @size-change="handleClassSizeChange"
            />
          </div>
        </template>
        <el-empty
          v-else
          class="org-management__empty"
          description="请先在上方选择学校 / 学院 / 专业，再查看对应班级"
          :image-size="88"
        />
      </div>
    </div>

    <!-- 专业管理 -->
    <div class="mc-card">
      <div class="mc-card__head">
        <div class="org-management__head-left">
          <span class="mc-card__title">专业列表</span>
          <span class="org-management__head-meta">{{ majors.length }} 个专业</span>
        </div>
        <el-tooltip
          :disabled="Boolean(filters.collegeId)"
          content="请先在筛选区选择学院"
          placement="top"
        >
          <span>
            <el-button
              type="primary"
              :icon="Plus"
              :disabled="!filters.collegeId"
              @click="handleAddMajor"
            >
              新增专业
            </el-button>
          </span>
        </el-tooltip>
      </div>
      <div class="mc-card__body">
        <template v-if="filters.schoolId">
          <el-table v-loading="majorsLoading" :data="majors" stripe>
            <el-table-column prop="majorName" label="专业名称" min-width="180" />
            <el-table-column label="专业代码" width="120" align="center">
              <template #default="{ row }">{{ formatMajorCode(row.code) }}</template>
            </el-table-column>
            <el-table-column label="所属学院" min-width="160">
              <template #default="{ row }">{{ collegeNameOf(row.collegeId) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="statusInfo(row.status).tag" size="small">
                  {{ statusInfo(row.status).label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" align="center">
              <template #default="{ row }">
                <el-button
                  text
                  type="primary"
                  size="small"
                  @click="handleAddClassForMajor(row as OrgMajorItem)"
                >
                  新增班级
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty
            v-if="!majorsLoading && !majors.length"
            class="org-management__empty"
            description="当前选择下暂无专业，可点击「新增专业」创建"
            :image-size="72"
          />
        </template>
        <el-empty
          v-else
          class="org-management__empty"
          description="请先在上方选择学校，查看其下专业"
          :image-size="88"
        />
      </div>
    </div>

    <ClassEditDialog ref="classDialogRef" :majors="majors" @saved="handleSearch" />
    <MajorCreateDialog ref="majorDialogRef" :colleges="colleges" @saved="handleMajorSaved" />
  </div>
</template>

<style scoped lang="scss">
.org-management {
  &__filter-select {
    width: 190px;
  }

  &__head-left {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    min-width: 0;
  }

  &__head-meta {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__empty {
    margin-top: $spacing-lg;
  }

  &__pagination {
    display: flex;
    justify-content: flex-end;
    padding-top: $spacing-lg;
  }
}
</style>
