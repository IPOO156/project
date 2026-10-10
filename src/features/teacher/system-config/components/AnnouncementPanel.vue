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
import { ElMessage, ElMessageBox } from 'element-plus'
import { Megaphone, Plus, RefreshCw, Trash2 } from 'lucide-vue-next'
import { onMounted, reactive, ref } from 'vue'

import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  updateAnnouncement,
} from '@/shared/api/teacher'

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

/** 投递口径说明（与后端实现一致，避免「以为发了其实没人收到」） */
const ANNOUNCEMENT_DELIVERY_HINT =
  '公告按所选对象推送站内系统通知，接收人按学生档案归属解析：全校 = 全校学生，学院 / 专业 / 班级 = 对应范围内的学生；教师与管理员不会收到公告通知。通知仅在以「立即发布」创建时投递一次，保存为「草稿」后再改为「立即发布」不会补发，删除公告也不会撤回已发出的通知。'

const annDialog = reactive({
  visible: false,
  saving: false,
  editingId: 0,
  title: '',
  content: '',
  targetType: 'all',
  status: 1,
})

async function loadAnnouncements() {
  announcementLoading.value = true
  try {
    const res = await listAnnouncements({
      targetType: announcementFilters.targetType || undefined,
      status: announcementFilters.status || undefined,
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
  annDialog.visible = true
}

function openAnnEdit(item: AnnouncementItem) {
  annDialog.editingId = item.announcementId
  annDialog.title = item.title
  annDialog.content = item.content
  annDialog.targetType = item.targetType ?? 'all'
  annDialog.status = item.status ?? 0
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
  const payload = {
    title: annDialog.title.trim(),
    content: annDialog.content.trim(),
    targetType: annDialog.targetType,
    status: annDialog.status,
  }
  annDialog.saving = true
  try {
    if (annDialog.editingId) {
      await updateAnnouncement(annDialog.editingId, payload)
      // 编辑保存不会触发通知投递（后端只在创建时投递），如实提示以免误以为已通知
      ElMessage.success(
        annDialog.status === 1 ? '公告已更新（编辑保存不会向学生补发通知）' : '公告已更新',
      )
    } else {
      await createAnnouncement(payload)
      ElMessage.success(
        annDialog.status === 1 ? '公告已发布，已向范围内学生推送通知' : '公告已保存为草稿',
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
          <el-select v-model="announcementFilters.targetType" clearable style="width: 140px">
            <el-option
              v-for="t in targetTypeFilterOptions"
              :key="t.value"
              :label="t.label"
              :value="t.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="announcementFilters.status" clearable style="width: 130px">
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
                :icon="Trash2"
                :loading="deletingId === (row as AnnouncementItem).announcementId"
                :disabled="deletingId !== null"
                @click="handleDeleteAnnouncement(row as AnnouncementItem)"
              >
                删除
              </el-button>
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
          <el-select v-model="annDialog.targetType" style="width: 100%">
            <el-option
              v-for="t in targetTypeOptions"
              :key="t.value"
              :label="t.label"
              :value="t.value"
            />
          </el-select>
          <span class="announcement-panel__field-hint">
            接收人按学生档案归属解析，仅学生范围可选
          </span>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="annDialog.status" style="width: 100%">
            <el-option label="草稿（不通知）" :value="0" />
            <el-option label="立即发布（创建时通知学生）" :value="1" />
            <el-option label="已下线" :value="2" />
          </el-select>
          <span class="announcement-panel__field-hint">
            选「立即发布」创建才会推送通知；草稿改发布不会补发
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
    color: var(--el-text-color-secondary);
  }

  &__pagination {
    display: flex;
    justify-content: flex-end;
    padding-top: $spacing-lg;
  }
}
</style>
