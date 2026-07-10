<script setup lang="ts">
import type { ChatSettings, ExportFormat } from './types'
import { ElMessage } from 'element-plus'
/**
 * AIChat - AI 智能助手独立页（编排者）
 *
 * 参照 archive-assistant.html 的布局与功能，沿用项目浅色主题（深海蓝 + 琥珀金）。
 * fullBleed 路由：根高度 calc(100vh - $header-height)，侧栏与消息区各自独立滚动。
 *
 * 结构：grid 280px 侧栏 + 1fr 主区
 *  - 左：ChatSidebar（品牌 / 新建 / 历史 / 用户 / 设置入口）
 *  - 右：ChatHeader + ChatMessages + QuickQuestions + ChatInput
 *  - 浮层：SettingsPanel（右滑入）/ ClearConfirmModal（居中）
 *
 * 子组件均为纯展示/交互组件，状态由本文件通过 useAIChat / useChatSettings / useChatExport 协调。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useUserStore } from '@/app/stores/stores'
import ChatHeader from './components/ChatHeader.vue'
import ChatInput from './components/ChatInput.vue'
import ChatMessages from './components/ChatMessages.vue'
import ChatSidebar from './components/ChatSidebar.vue'
import ClearConfirmModal from './components/ClearConfirmModal.vue'
import QuickQuestions from './components/QuickQuestions.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import { useAIChat } from './composables/useAIChat'
import { useChatExport } from './composables/useChatExport'
import { useChatSettings } from './composables/useChatSettings'
import { quickQuestions } from './data/quickQuestions'

defineOptions({ name: 'AIChat' })

const userStore = useUserStore()
const {
  messages,
  loading,
  sendMessage,
  clearMessages,
  conversations,
  currentConversationId,
  createConversation,
  switchConversation,
  deleteConversation,
  setFeedback,
} = useAIChat()
const { settings, update: updateSetting } = useChatSettings()
const { exportConversation } = useChatExport()

const showSettings = ref(false)
const showClearModal = ref(false)
/** 快捷问题对话状态可见性：首次提问后隐藏，新建/清空后按 settings.quick 恢复 */
const quickVisible = ref(settings.value.quick)

const userName = computed(() => userStore.userName || '同学')
const userAvatar = computed(() => userStore.avatar || '')
const messageCount = computed(() => messages.value.length)
/** 快捷问题有效可见 = 设置开关 && 对话状态 */
const quickEffectiveVisible = computed(() => settings.value.quick && quickVisible.value)

/** 发送消息（thinking 开启时 800ms 思考，关闭时 150ms 快速回复） */
function handleSend(text: string, files: File[]) {
  if (files.length) {
    ElMessage.info(`已附加 ${files.length} 个文件（演示模式暂不解析附件内容）`)
  }
  sendMessage(text, { delay: settings.value.thinking ? 800 : 150 })
  quickVisible.value = false
}

/** 快捷问题点击 → 直接发送 */
function handleQuickAsk(question: string) {
  sendMessage(question, { delay: settings.value.thinking ? 800 : 150 })
  quickVisible.value = false
}

/** 清空对话 → 弹确认 */
function handleClear() {
  showClearModal.value = true
}

/** 确认清空：恢复欢迎语 + 重置快捷问题可见性 */
function confirmClear() {
  clearMessages()
  showClearModal.value = false
  quickVisible.value = settings.value.quick
}

/** 新建对话：当前有内容时存入历史，重置欢迎语 */
function handleNewChat() {
  createConversation()
  quickVisible.value = settings.value.quick
}

/** 切换历史对话 */
function handleSwitch(id: string) {
  switchConversation(id)
  quickVisible.value = false
}

/** 删除历史对话 */
function handleDelete(id: string) {
  deleteConversation(id)
}

/** 导出当前对话 */
function handleExport(format: ExportFormat) {
  exportConversation(messages.value, userName.value, format)
}

/** 消息反馈（有用/无用） */
function handleFeedback(msgId: string, type: 'useful' | 'useless') {
  setFeedback(msgId, type)
  ElMessage.success(type === 'useful' ? '感谢反馈，已记录为"有用"' : '感谢反馈，已记录为"无用"')
}

/** 复制消息内容（content 字段已为纯文本，富文本回复时由 richToPlain 生成） */
function handleCopy(msgId: string) {
  const msg = messages.value.find((m) => m.id === msgId)
  if (!msg) return
  navigator.clipboard
    .writeText(msg.content)
    .then(() => ElMessage.success('已复制到剪贴板'))
    .catch(() => ElMessage.error('复制失败，请手动选择文本'))
}

/** 设置项更新（持久化由 useChatSettings 负责） */
function handleSettingUpdate(key: keyof ChatSettings, value: boolean) {
  updateSetting(key, value)
}

/** Esc 关闭浮层：优先关确认弹窗，其次关设置面板 */
function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  if (showClearModal.value) {
    showClearModal.value = false
  } else if (showSettings.value) {
    showSettings.value = false
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="ai-chat">
    <!-- 左侧：历史对话栏 -->
    <ChatSidebar
      :conversations="conversations"
      :current-id="currentConversationId"
      :user-name="userName"
      :user-avatar="userAvatar"
      @newchat="handleNewChat"
      @switch="handleSwitch"
      @delete="handleDelete"
      @opensettings="showSettings = true"
    />

    <!-- 右侧：主聊天区 -->
    <section class="ai-chat__main">
      <ChatHeader
        :online="true"
        :message-count="messageCount"
        @clear="handleClear"
        @export="handleExport"
      />

      <ChatMessages
        :messages="messages"
        :loading="loading"
        :show-thinking="settings.thinking"
        :show-feedback="settings.feedback"
        :user-name="userName"
        @feedback="handleFeedback"
        @copy="handleCopy"
      />

      <QuickQuestions
        :questions="quickQuestions"
        :visible="quickEffectiveVisible"
        @ask="handleQuickAsk"
      />

      <ChatInput :loading="loading" @send="handleSend" />
    </section>

    <!-- 浮层：设置面板（右侧滑入） -->
    <SettingsPanel
      :visible="showSettings"
      :settings="settings"
      @update="handleSettingUpdate"
      @close="showSettings = false"
    />

    <!-- 浮层：清空确认弹窗 -->
    <ClearConfirmModal
      :visible="showClearModal"
      @confirm="confirmClear"
      @cancel="showClearModal = false"
    />
  </div>
</template>

<style scoped lang="scss">
// fullBleed canonical 高度：HeaderBar 总占 $header-height(56px)，NavTabs 在其内部
// 根容器固定高度 + overflow hidden，侧栏/消息区各自独立滚动，避免双滚动条
.ai-chat {
  height: calc(100vh - #{$header-height});
  display: grid;
  grid-template-columns: 280px 1fr;
  overflow: hidden;
  background: var(--el-bg-color-page);

  &__main {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;
  }
}

// 平板/移动端：隐藏历史栏，主聊天区顶满
@media (max-width: 768px) {
  .ai-chat {
    grid-template-columns: 1fr;
  }

  // ChatSidebar 作为 grid 第一列被隐藏
  .ai-chat > :first-child {
    display: none;
  }
}
</style>
