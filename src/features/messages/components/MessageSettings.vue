<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { ref, watch } from 'vue'
import { getMessageSettings, updateMessageSettings } from '@/shared/api/notification'

interface MessageSetting {
  category: string
  categoryLabel: string
  emailEnabled: number
  smsEnabled: number
  pushEnabled: number
}

const visible = defineModel<boolean>('visible', { default: false })

const loading = ref(false)
const saving = ref(false)
const settings = ref<MessageSetting[]>([])

type ChannelKey = 'emailEnabled' | 'smsEnabled' | 'pushEnabled'

const CHANNELS: Array<{ key: ChannelKey; label: string }> = [
  { key: 'emailEnabled', label: '邮件通知' },
  { key: 'smsEnabled', label: '短信通知' },
  { key: 'pushEnabled', label: '站内推送' },
]

async function loadSettings() {
  loading.value = true
  try {
    settings.value = await getMessageSettings()
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  saving.value = true
  try {
    await Promise.all(
      settings.value.map((item) =>
        updateMessageSettings({
          category: item.category,
          emailEnabled: item.emailEnabled ? 1 : 0,
          smsEnabled: item.smsEnabled ? 1 : 0,
          pushEnabled: item.pushEnabled ? 1 : 0,
        }),
      ),
    )
    ElMessage.success('消息设置已保存')
    close()
  } catch {
    // 保存失败提示已由 request 拦截器统一处理
  } finally {
    saving.value = false
  }
}

function close() {
  visible.value = false
}

watch(
  () => visible.value,
  (val) => {
    if (val) loadSettings()
  },
)
</script>

<template>
  <el-dialog
    v-model="visible"
    title="消息设置"
    width="560px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div v-loading="loading" class="message-settings">
      <el-empty
        v-if="!loading && settings.length === 0"
        description="暂无消息设置项"
        :image-size="80"
      />
      <div v-for="item in settings" :key="item.category" class="message-settings__item">
        <div class="message-settings__label">{{ item.categoryLabel || item.category }}</div>
        <div class="message-settings__switches">
          <div v-for="channel in CHANNELS" :key="channel.key" class="message-settings__switch">
            <span class="message-settings__switch-label">{{ channel.label }}</span>
            <el-switch
              :model-value="item[channel.key] === 1"
              @update:model-value="(val) => (item[channel.key] = val ? 1 : 0)"
            />
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.message-settings {
  min-height: 120px;

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 4px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    &:last-child {
      border-bottom: none;
    }
  }

  &__label {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__switches {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  &__switch {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__switch-label {
    font-size: 13px;
    color: var(--el-text-color-regular);
  }
}
</style>
