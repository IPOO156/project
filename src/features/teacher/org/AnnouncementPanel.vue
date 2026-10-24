<script setup lang="ts">
/**
 * AnnouncementPanel - 公告管理面板（系统配置页「公告管理」页签）
 *
 * 数据来源：GET/POST /admin/announcements、PUT/DELETE /admin/announcements/{id}。
 * 投放范围与投递时机见 ANNOUNCEMENT_DELIVERY_HINT（依据后端实现，非推测）：
 *   - 后端 MessageProduceAspect.notifyAnnouncementPublished 在**创建**公告且 status=1 时
 *     按 targetType 解析接收人 → 系统通知；解析来源只有 student_profiles，
 *     故 all/college/major/class 都只指学生，教师与管理员不会收到公告通知。
 *   - 该切面只挂在创建方法上，故「草稿 → 改为已发布」不会补发通知。
 * 由 SystemConfig 页内嵌使用，自身负责加载与分页。
 */
import type { AnnouncementItem } from '@/shared/types/teacher'
import type {
  OrgClassItem,
  OrgCollegeItem,
  OrgMajorItem,
} from '@/shared/types/teacher/organization'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Megaphone, Plus, RefreshCw } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref, watch } from 'vue'

import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  listClasses,
  listColleges,
  listMajors,
  updateAnnouncement,
} from '@/shared/api/teacher-api'
import RowActions from '@/shared/ui/RowActions.vue'

const announcementLoading = ref(false)
const deletingId = ref<number | null>(null)
const announcements = ref<AnnouncementItem[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(10)
const announcementFilters = reactive({
  targetType: '' as string | '',
  status: '' as number | '',
})

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 0, label: '草稿' },
  { value: 1, label: '已发布' },
  { value: 2, label: '已下线' },
]
/**
 * 发布对象选项（含「全部」筛选项）。
 * all 的文案取「全校学生」而非「全体用户」：后端接收人解析只覆盖学生档案
 * （MessageProduceAspect.resolveAnnouncementRecipients 仅查 student_profiles）。
 */
const targetTypeFilterOptions = [
  { value: '', label: '全部对象' },
  { value: 'all', label: '全校学生' },
  { value: 'college', label: '学院' },
  { value: 'major', label: '专业' },
  { value: 'class', label: '班级' },
]
/** 发布对象选项（新建/编辑用，后端枚举 AnnouncementTargetTypeEnum） */
const targetTypeOptions = targetTypeFilterOptions.filter((t) => t.value !== '')
const TARGET_TYPE_LABELS: Record<string, string> = {
  all: '全校学生',
  college: '学院',
  major: '专业',
  class: '班级',
}

/**
 * 投递口径说明（与后端实现一致，避免「以为发了其实没人收到」）：
 * Announcement.receiverType 未在创建请求中暴露，后端默认 ALL —— 接收人 = 学生 + 教师 + 管理员；
 * 草稿/下线改为已发布时后端会补发通知（SystemConfigManageService.updateAnnouncement）。
 */
const ANNOUNCEMENT_DELIVERY_HINT =
  '公告按所选对象推送站内系统通知：全校 = 全校学生、教师与管理员；学院 / 专业 / 班级 = 对应范围内的学生与教师，管理员始终接收。公告必须选择具体范围，未选择时学生不会收到通知。「立即发布」创建时投递一次；草稿或已下线公告改为「已发布」时会补发，已发布状态下重复编辑不会重发。删除公告不会撤回已发出的通知。'

const annDialog = reactive({
  visible: false,
  saving: false,
  editingId: 0,
  title: '',
  content: '',
  targetType: 'all',
  status: 1,
})

/**
 * 学院 / 专业 / 班级目标对象。
 * 后端 create/update 接收 targetId；缺失时 resolveStudentUserIds 对 college/major/class
 * 直接返回空列表（公告只发给教师与管理员，学生一个都收不到），故非 all 必须选到具体对象。
 */
const annTarget = reactive({
  collegeId: undefined as number | undefined,
  majorId: undefined as number | undefined,
  classId: undefined as number | undefined,
})
const annColleges = ref<OrgCollegeItem[]>([])
const annMajors = ref<OrgMajorItem[]>([])
const annClasses = ref<OrgClassItem[]>([])

const selectedTargetId = computed(() => {
  if (annDialog.targetType === 'college') return annTarget.collegeId
  if (annDialog.targetType === 'major') return annTarget.majorId
  if (annDialog.targetType === 'class') return annTarget.classId
  return undefined
})

function resetAnnTarget() {
  annTarget.collegeId = undefined
  annTarget.majorId = undefined
  annTarget.classId = undefined
  annMajors.value = []
  annClasses.value = []
}

async function loadAnnColleges() {
  try {
    annColleges.value = await listColleges()
  } catch {
    annColleges.value = []
  }
}

async function loadAnnMajors(collegeId: number) {
  try {
    annMajors.value = await listMajors({ collegeId })
  } catch {
    annMajors.value = []
  }
}

async function loadAnnClasses(majorId: number) {
  try {
    const res = await listClasses({ majorId, page: 1, per_page: 100 })
    annClasses.value = res?.list ?? []
  } catch {
    annClasses.value = []
  }
}

// 切换目标类型时清空下级选择；学院/专业/班级都需要先选学院
watch(
  () => annDialog.targetType,
  (type) => {
    resetAnnTarget()
    if (type !== 'all') void loadAnnColleges()
  },
)

watch(
  () => annTarget.collegeId,
  (collegeId) => {
    annTarget.majorId = undefined
    annTarget.classId = undefined
    annMajors.value = []
    annClasses.value = []
    if (collegeId) void loadAnnMajors(collegeId)
  },
)

watch(
  () => annTarget.majorId,
  (majorId) => {
    annTarget.classId = undefined
    annClasses.value = []
    if (majorId) void loadAnnClasses(majorId)
  },
)

async function loadAnnouncements() {
  announcementLoading.value = true
  try {
    const res = await listAnnouncements({
      targetType: announcementFilters.targetType || undefined,
      // 0（草稿）是有效筛选值，不能用 || 丢弃；仅空串表示「全部」
      status: announcementFilters.status === '' ? undefined : announcementFilters.status,
      page: page.value,
      per_page: perPage.value,
    })
    announcements.value = res?.list ?? []
    total.value = res?.total ?? announcements.value.length
  } catch {
    announcements.value = []
    total.value = 0
  } finally {
    announcementLoading.value = false
  }
}

/**
 * 公告筛选查询：回到第 1 页并重新加载（查询 / 切换分页大小共用）。
 * 模板禁止多语句内联表达式（Vue 编译器会将换行当作空白，导致
 * 多行无分号的 `page = 1\nloadAnnouncements()` 解析失败、模块 500），
 * 故统一抽为具名函数，模板仅 `@click="searchAnnouncements"` 引用。
 */
function searchAnnouncements() {
  page.value = 1
  void loadAnnouncements()
}

/** 重置公告筛选条件并回到第 1 页重新加载 */
function resetAnnouncementFilters() {
  announcementFilters.targetType = ''
  announcementFilters.status = ''
  searchAnnouncements()
}

function openAnnCreate() {
  annDialog.editingId = 0
  annDialog.title = ''
  annDialog.content = ''
  annDialog.targetType = 'all'
  annDialog.status = 1
  resetAnnTarget()
  annDialog.visible = true
}

function openAnnEdit(item: AnnouncementItem) {
  annDialog.editingId = item.announcementId
  annDialog.title = item.title
  annDialog.content = item.content
  annDialog.targetType = item.targetType ?? 'all'
  annDialog.status = item.status ?? 0
  // 列表 DTO 不返回 targetId，编辑时非 all 需重新选择具体范围
  resetAnnTarget()
  annDialog.visible = true
}

async function handleSaveAnnouncement() {
  if (!annDialog.title.trim()) {
    ElMessage.warning('请输入公告标题')
    return
  }
  if (!annDialog.content.trim()) {
    ElMessage.warning('请输入公告内容')
    return
  }
  if (annDialog.targetType !== 'all' && !selectedTargetId.value) {
    ElMessage.warning('请选择公告的具体投放范围（学院 / 专业 / 班级）')
    return
  }
  const payload = {
    title: annDialog.title.trim(),
    content: annDialog.content.trim(),
    targetType: annDialog.targetType,
    targetId: annDialog.targetType === 'all' ? undefined : selectedTargetId.value,
    status: annDialog.status,
  }
  annDialog.saving = true
  try {
    if (annDialog.editingId) {
      await updateAnnouncement(annDialog.editingId, payload)
      // 后端仅在「非已发布 → 已发布」的转换时补发通知，已发布状态下编辑不重发
      ElMessage.success(
        annDialog.status === 1 ? '公告已更新（状态转为已发布时会补发通知）' : '公告已更新',
      )
    } else {
      await createAnnouncement(payload)
      ElMessage.success(
        annDialog.status === 1 ? '公告已发布，已向范围内用户推送通知' : '公告已保存为草稿',
      )
    }
    annDialog.visible = false
    await loadAnnouncements()
  } catch {
    /* 拦截器已提示 */
  } finally {
    annDialog.saving = false
  }
}

async function handleDeleteAnnouncement(item: AnnouncementItem) {
  try {
    await ElMessageBox.confirm(`确认删除公告「${item.title}」？删除后不可恢复。`, '删除公告', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }
  deletingId.value = item.announcementId
  try {
    await deleteAnnouncement(item.announcementId)
    ElMessage.success('公告已删除')
    await loadAnnouncements()
  } catch {
    /* 拦截器已提示 */
  } finally {
    deletingId.value = null
  }
}

onMounted(() => void loadAnnouncements())
</script>

<template>
  <div class="announcement-panel">
    <el-alert
      class="announcement-panel__hint"
      type="info"
      :closable="false"
      show-icon
      :title="ANNOUNCEMENT_DELIVERY_HINT"
    />

    <div class="mc-filter-bar">
      <el-form inline @submit.prevent>
        <el-form-item label="发布对象">
          <el-select v-model="announcementFilters.targetType" class="u-w-140" clearable>
            <el-option
              v-for="t in targetTypeFilterOptions"
              :key="t.value"
              :label="t.label"
              :value="t.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="announcementFilters.status" class="u-w-130" clearable>
            <el-option
              v-for="s in statusOptions"
              :key="String(s.value)"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchAnnouncements">查询</el-button>
          <el-button :icon="RefreshCw" @click="resetAnnouncementFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="mc-card">
      <div class="mc-card__head">
        <span class="mc-card__title"><Megaphone :size="15" /> 公告列表</span>
        <el-button :icon="Plus" type="primary" @click="openAnnCreate">新建公告</el-button>
      </div>
      <div class="mc-card__body">
        <el-table v-loading="announcementLoading" :data="announcements" stripe>
          <el-table-column prop="announcementId" label="ID" width="70" />
          <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
          <el-table-column prop="content" label="内容" min-width="220" show-overflow-tooltip />
          <el-table-column label="对象" width="100" align="center">
            <template #default="{ row }">{{ TARGET_TYPE_LABELS[row.targetType] ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag
                :type="row.status === 1 ? 'success' : row.status === 2 ? 'info' : 'warning'"
                size="small"
              >
                {{ row.statusLabel }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="发布时间" width="170">
            <template #default="{ row }">{{ row.publishedAt ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center" fixed="right">
            <template #default="{ row }">
              <RowActions :more="false">
                <el-button
                  text
                  type="primary"
                  size="small"
                  @click="openAnnEdit(row as AnnouncementItem)"
                >
                  编辑
                </el-button>
                <el-button
                  text
                  type="danger"
                  size="small"
                  :loading="deletingId === (row as AnnouncementItem).announcementId"
                  :disabled="deletingId !== null"
                  @click="handleDeleteAnnouncement(row as AnnouncementItem)"
                >
                  删除
                </el-button>
              </RowActions>
            </template>
          </el-table-column>
        </el-table>
        <div class="announcement-panel__pagination">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="perPage"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @current-change="loadAnnouncements"
            @size-change="searchAnnouncements"
          />
        </div>
        <el-empty
          v-if="!announcementLoading && !announcements.length"
          description="暂无公告"
          :image-size="72"
        />
      </div>
    </div>

    <!-- 公告编辑 -->
    <el-dialog
      v-model="annDialog.visible"
      :title="annDialog.editingId ? '编辑公告' : '新建公告'"
      width="560px"
    >
      <el-form label-width="90px">
        <el-form-item label="标题" required>
          <el-input
            v-model="annDialog.title"
            placeholder="请输入公告标题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="内容" required>
          <el-input
            v-model="annDialog.content"
            type="textarea"
            :rows="5"
            placeholder="请输入公告内容"
            maxlength="2000"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="发布对象">
          <el-select v-model="annDialog.targetType" class="u-w-full">
            <el-option
              v-for="t in targetTypeOptions"
              :key="t.value"
              :label="t.label"
              :value="t.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="annDialog.targetType !== 'all'"
          :label="annDialog.targetType === 'college' ? '目标学院' : '所属学院'"
          required
        >
          <el-select v-model="annTarget.collegeId" placeholder="请选择学院" style="width: 100%">
            <el-option
              v-for="c in annColleges"
              :key="c.collegeId"
              :label="c.collegeName"
              :value="c.collegeId"
            />
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="annDialog.targetType === 'major' || annDialog.targetType === 'class'"
          :label="annDialog.targetType === 'major' ? '目标专业' : '所属专业'"
          required
        >
          <el-select
            v-model="annTarget.majorId"
            placeholder="请选择专业"
            :disabled="!annTarget.collegeId"
            style="width: 100%"
          >
            <el-option
              v-for="m in annMajors"
              :key="m.majorId"
              :label="m.majorName"
              :value="m.majorId"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="annDialog.targetType === 'class'" label="目标班级" required>
          <el-select
            v-model="annTarget.classId"
            placeholder="请选择班级"
            :disabled="!annTarget.majorId"
            style="width: 100%"
          >
            <el-option
              v-for="c in annClasses"
              :key="c.classId"
              :label="c.className"
              :value="c.classId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="接收说明">
          <span class="announcement-panel__field-hint announcement-panel__field-hint--block">
            接收人按所选范围解析；管理员始终接收。学院 / 专业 /
            班级必须选到具体对象，否则学生收不到通知。
          </span>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="annDialog.status" class="u-w-full">
            <el-option label="草稿（不通知）" :value="0" />
            <el-option label="立即发布（创建时通知学生）" :value="1" />
            <el-option label="已下线" :value="2" />
          </el-select>
          <span class="announcement-panel__field-hint">
            「立即发布」创建时推送；草稿 / 已下线改为「已发布」时会补发
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="annDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="annDialog.saving" @click="handleSaveAnnouncement">
          {{ annDialog.editingId ? '保存修改' : '创建公告' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.announcement-panel {
  &__hint {
    margin-bottom: $spacing-lg;

    :deep(.el-alert__title) {
      font-size: 12px;
      line-height: 1.6;
    }
  }

  &__field-hint {
    margin-left: 8px;
    font-size: 12px;
    &--block {
      margin-left: 0;
      line-height: 1.6;
    }
    color: var(--el-text-color-secondary);
  }

  &__pagination {
    display: flex;
    justify-content: flex-end;
    padding-top: $spacing-lg;
  }
}
</style>
