<script setup lang="ts">
import type { SettingItem } from '@/shared/types/teacher'
/**
 * SystemConfig - 系统配置 + 公告管理（管理端）
 * 数据来源：
 *   - GET /admin/settings / PUT /admin/settings              系统配置
 *   - 公告管理（GET/POST/PUT/DELETE /admin/announcements）已下沉到
 *     ./components/AnnouncementPanel.vue，其内含公告投递范围的说明。
 * 教师端无等价接口，属管理端功能，前端在此统一展示。
 */
import { ElMessage } from 'element-plus'
import { Settings } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref } from 'vue'

import { listSystemSettings, updateSystemSetting } from '@/shared/api/teacher'

import AnnouncementPanel from './components/AnnouncementPanel.vue'

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

// ── 公告管理已下沉至 ./components/AnnouncementPanel.vue ──

onMounted(() => {
  void loadSettings()
})
</script>

<template>
  <div class="mc-page system-config">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <h2 class="mc-page-head__title">系统配置</h2>
        <p class="mc-page-head__desc">
          维护系统参数与公告信息（管理端功能）。公告的推送范围与投递时机见「公告管理」页签顶部说明。
        </p>
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

      <!-- 公告管理（面板见 components/AnnouncementPanel.vue） -->
      <el-tab-pane label="公告管理" name="announcements">
        <AnnouncementPanel />
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
}
</style>
