import { ref } from 'vue'

export interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  content: string
  time: string
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function simulateAIReply(userText: string): string {
  const lower = userText.toLowerCase()
  if (lower.includes('档案') || lower.includes('个人')) {
    return '你可以在「个人中心 → 个人档案信息」页面查看和编辑基本资料。点击头像可以更换照片，基本资料支持直接修改保存。'
  }
  if (lower.includes('奖项') || lower.includes('申报') || lower.includes('报名')) {
    return '奖项申报请进入「奖项报名」模块，选择对应类别后填写信息并上传佐证材料。提交后可在「消息中心」查看审批提醒。'
  }
  if (lower.includes('成长') || lower.includes('时间轴') || lower.includes('经历')) {
    return '在「成长时间轴」页面点击中央的年轮原子核即可添加经历。经历会按学期自动排序到对应的年轮圈上。'
  }
  if (lower.includes('审批') || lower.includes('进度') || lower.includes('审核')) {
    return '提交记录可在「审批与记录 → 提交记录」中查看。审批状态变更时，系统会通过消息中心推送提醒。'
  }
  if (lower.includes('密码') || lower.includes('登录')) {
    return '如需修改密码，请前往「个人中心 → 修改密码」页面。登录时请注意大小写锁定状态。'
  }
  if (lower.includes('短板') || lower.includes('职业规划') || lower.includes('改进建议')) {
    return '根据你的档案数据，我识别出以下短板与建议：\n\n1. 科研创新：项目经历较少，建议主动联系导师参与课题，尝试撰写综述或论文。\n2. 竞赛实践：高级别竞赛参与不足，可关注「挑战杯」「互联网+」等赛事并组建团队。\n3. 社会实践：实践记录偏少，建议利用寒暑假参加支教、调研或企业实习。\n\n你可以在「成长时间轴」持续记录经历，我会基于最新数据动态更新分析。'
  }
  return '这个问题我暂时无法给出具体答案。你可以联系辅导员或系统管理员获取帮助，也可以尝试描述得更详细一些。'
}

export function useAIChat() {
  const messages = ref<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'ai',
      content:
        '你好！我是你的档案智能助手，可以帮你解答关于个人档案、奖项申报、成长记录等方面的问题。',
      time: formatTime(new Date()),
    },
  ])

  const loading = ref(false)

  function pushUserMessage(text: string) {
    messages.value.push({
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      time: formatTime(new Date()),
    })
  }

  function pushAIMessage(content: string) {
    messages.value.push({
      id: `ai-${Date.now()}`,
      role: 'ai',
      content,
      time: formatTime(new Date()),
    })
  }

  function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading.value) return
    pushUserMessage(trimmed)
    loading.value = true
    setTimeout(() => {
      pushAIMessage(simulateAIReply(trimmed))
      loading.value = false
    }, 800)
  }

  function clearMessages() {
    messages.value = [
      {
        id: 'welcome',
        role: 'ai',
        content:
          '你好！我是你的档案智能助手，可以帮你解答关于个人档案、奖项申报、成长记录等方面的问题。',
        time: formatTime(new Date()),
      },
    ]
    loading.value = false
  }

  return {
    messages,
    loading,
    sendMessage,
    clearMessages,
    formatTime,
  }
}
