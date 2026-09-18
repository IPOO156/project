/**
 * 快捷问题常量
 *
 * icon 为标识字符串，由 QuickQuestions.vue 映射到 lucide-vue-next 图标组件
 * （避免在数据文件中引入组件依赖，保持数据层纯净）
 */
import type { QuickQuestion } from '../types'

export const quickQuestions: QuickQuestion[] = [
  {
    label: '如何填写个人档案信息？',
    question: '如何填写个人档案信息？',
    icon: 'file',
  },
  {
    label: '奖项申报需要准备哪些材料？',
    question: '奖项申报需要准备哪些材料？',
    icon: 'award',
  },
  {
    label: '成长时间轴怎么添加经历？',
    question: '成长时间轴怎么添加经历？',
    icon: 'timeline',
  },
  {
    label: '如何查看审批进度？',
    question: '如何查看审批进度？',
    icon: 'check',
  },
  {
    label: '忘记密码怎么重置？',
    question: '忘记密码怎么重置？',
    icon: 'lock',
  },
  {
    label: '档案数据如何导出备份？',
    question: '档案数据如何导出备份？',
    icon: 'download',
  },
]
