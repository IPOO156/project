<script setup lang="ts">
import type { AnnouncementItem, SettingItem } from '@/shared/types/teacher'
/**
 * SystemConfig - 系统配置 + 公告管理（管理端）
 * 数据来源：
 *   - GET /admin/settings / PUT /admin/settings              系统配置
 *   - GET/POST /admin/announcements + PUT/DELETE /{id}       公告管理
 * 教师端无等价接口，属管理端功能，前端在此统一展示。
 */
import { ElMessage, ElMessageBox } from 'element-plus'
import { Megaphone, Plus, RefreshCw, Settings, Trash2 } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref } from 'vue'

import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  listSystemSettings,
  updateAnnouncement,
  updateSystemSetting,
} from '@/shared/api/teacher'

const activeTab = ref('settings')

// ── 系统配置 ──
const settingsLoading = ref(false)
const settings = ref<SettingItem[]>([])

const settingsGroups = computed(() => {
  const groups = new Map<string, SettingItem[]>()
  for (const s of settings.value) {
    const key = s.group || '基础配置'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(s)
  }
  return [...groups.entries()]
})

async function loadSettings() {
  settingsLoading.value = true
  try {
    const res = await listSystemSettings({ per_page: 100 })
    settings.value = res?.list ?? []
  } catch {
    settings.value = []
  } finally {
    settingsLoading.value = false
  }
}

const settingDialog = reactive({
  visible: false,
  saving: false,
  key: '',
  name: '',
  value: '',
  description: '',
})

function openSettingEdit(item: SettingItem) {
  settingDialog.key = item.settingKey
  settingDialog.name = item.settingName
  settingDialog.value = item.settingValue ?? ''
  settingDialog.description = item.description ?? ''
  settingDialog.visible = true
}

async function handleSaveSetting() {
  settingDialog.saving = true
  try {
    await updateSystemSetting({
      settingKey: settingDialog.key,
      settingValue: settingDialog.value,
    })
    ElMessage.success('配置已保存')
    settingDialog.visible = false
    await loadSettings()
  } catch {
    /* 拦截器已提示 */
  } finally {
    settingDialog.saving = false
  }
}

// ── 公告管理 ──
const announcementLoading = ref(false)
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
/** 发布对象筛选（含全部） */
const targetTypeFilterOptions = [
  { value: '', label: '全部对象' },
  { value: 'all', label: '全体用户' },
  { value: 'college', label: '学院' },
  { value: 'major', label: '专业' },
  { value: 'class', label: '班级' },
]
/** 发布对象选项（新建/编辑用，后端枚举 AnnouncementTargetTypeEnum） */
const targetTypeOptions = [
  { value: 'all', label: '全体用户' },
  { value: 'college', label: '学院' },
  { value: 'major', label: '专业' },
  { value: 'class', label: '班级' },
]
const TARGET_TYPE_LABELS: Record<string, string> = {
  all: '全体用户',
  college: '学院',
  major: '专业',
  class: '班级',
}

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

const annDialog = reactive({
  visible: false,
  saving: false,
  editingId: 0,
  title: '',
  content: '',
  targetType: 'all',
  status: 1,
})

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
  annDialog.saving = true
  try {
    const payload = {
      title: annDialog.title.trim(),
      content: annDialog.content.trim(),
      targetType: annDialog.targetType,
      status: annDialog.status,
    }
    if (annDialog.editingId) {
      await updateAnnouncement(annDialog.editingId, payload)
      ElMessage.success('公告已更新')
    } else {
      await createAnnouncement(payload)
      ElMessage.success('公告已创建')
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
  try {
    await deleteAnnouncement(item.announcementId)
    ElMessage.success('公告已删除')
    await loadAnnouncements()
  } catch {
    /* 拦截器已提示 */
  }
}

onMounted(() => {
  void loadSettings()
  void loadAnnouncements()
})
</script>

<template>
  <div class="mc-page system-config">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <h2 class="mc-page-head__title">系统配置</h2>
        <p class="mc-page-head__desc">维护系统参数与面向全体用户的公告信息（管理端功能）。</p>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="system-config__tabs">
      <!-- 系统配置 -->
      <el-tab-pane label="系统配置" name="settings">
        <div v-loading="settingsLoading" class="system-config__settings">
          <div v-for="[group, items] in settingsGroups" :key="group" class="mc-card">
            <div class="mc-card__head">
              <span class="mc-card__title"><Settings :size="15" /> {{ group }}</span>
            </div>
            <div class="mc-card__body">
              <div v-for="item in items" :key="item.settingKey" class="system-config__setting">
                <div class="system-config__setting-info">
                  <p class="system-config__setting-name">{{ item.settingName }}</p>
                  <p class="system-config__setting-desc">
                    {{ item.description || item.settingKey }}
                  </p>
                </div>
                <div class="system-config__setting-value">
                  <span class="system-config__setting-text">{{ item.settingValue ?? '-' }}</span>
                  <el-button text type="primary" size="small" @click="openSettingEdit(item)">
                    修改
                  </el-button>
                </div>
              </div>
              <el-empty v-if="!items.length" description="该分组暂无配置项" :image-size="56" />
            </div>
          </div>
          <el-empty
            v-if="!settings.length && !settingsLoading"
            description="暂无系统配置"
            :image-size="72"
          />
        </div>
      </el-tab-pane>

      <!-- 公告管理 -->
      <el-tab-pane label="公告管理" name="announcements">
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
                <template #default="{ row }">{{
                  TARGET_TYPE_LABELS[row.targetType] ?? '-'
                }}</template>
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
              <el-table-column prop="publishedAt" label="发布时间" width="170">
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
                    @click="handleDeleteAnnouncement(row as AnnouncementItem)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="system-config__pagination">
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
      </el-tab-pane>
    </el-tabs>

    <!-- 配置项编辑 -->
    <el-dialog
      v-model="settingDialog.visible"
      :title="`修改配置：${settingDialog.name}`"
      width="520px"
    >
      <el-form label-width="80px">
        <el-form-item label="配置项">
          <el-input :model-value="settingDialog.key" disabled />
        </el-form-item>
        <el-form-item label="配置值" required>
          <el-input
            v-model="settingDialog.value"
            type="textarea"
            :rows="3"
            :placeholder="settingDialog.description"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="settingDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="settingDialog.saving" @click="handleSaveSetting">
          保存
        </el-button>
      </template>
    </el-dialog>

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
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="annDialog.status" style="width: 100%">
            <el-option label="草稿" :value="0" />
            <el-option label="立即发布" :value="1" />
            <el-option label="已下线" :value="2" />
          </el-select>
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
.system-config {
  &__tabs {
    :deep(.el-tabs__header) {
      margin-bottom: $spacing-lg;
    }
  }

  &__settings {
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;
  }

  &__setting {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-lg;
    padding: $spacing-md 0;
    border-bottom: 1px solid var(--el-border-color-lighter);

    &:last-child {
      border-bottom: none;
    }
  }

  &__setting-info {
    flex: 1;
    min-width: 0;
  }

  &__setting-name {
    margin: 0;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  &__setting-desc {
    margin: 4px 0 0;
    font-size: 12px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
  }

  &__setting-value {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    flex-shrink: 0;
    max-width: 60%;
  }

  &__setting-text {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__pagination {
    display: flex;
    justify-content: flex-end;
    padding-top: $spacing-lg;
  }
}
</style>
