/**
 * AI 助手结构化知识库
 *
 * 按 keywords 关键词匹配命中的 KnowledgeEntry，返回结构化 RichContent。
 * 内容对齐「学生端档案管理系统」业务语境（个人档案信息申报、奖项报名、成长时间轴等）。
 * 未命中时使用 defaultEntry 兜底。
 */
import type { KnowledgeEntry } from '../types'

export const knowledgeBase: KnowledgeEntry[] = [
  {
    topic: '档案',
    keywords: ['档案', '填写', '个人信息', '完善', '基本资料'],
    rich: {
      greeting: '关于个人档案信息填写 📋',
      blocks: [
        { type: 'paragraph', text: '填写个人档案信息建议按以下步骤操作：' },
        {
          type: 'steps',
          items: [
            {
              num: 1,
              strong: '进入档案模块',
              text: '点击左侧导航「个人中心 → 个人档案信息」，进入个人信息主页面。',
            },
            {
              num: 2,
              strong: '逐项填写',
              text: '基本信息、教育经历、联系方式、家庭信息等模块需依次完善。',
            },
            {
              num: 3,
              strong: '上传佐证材料',
              text: '学历证书、获奖证书等需上传扫描件，支持 PDF/JPG/PNG 格式，单文件不超过 10MB。',
            },
            {
              num: 4,
              strong: '提交审核',
              text: '确认信息无误后点击「提交审核」，档案室将在 3 个工作日内完成审核。',
            },
          ],
        },
        {
          type: 'card',
          title: '温馨提示',
          icon: 'info',
          body: '带 * 号为必填项，保存后可随时修改，但已审核通过的信息变更需重新提交审批。',
          highlights: ['3 个工作日'],
        },
      ],
    },
  },
  {
    topic: '申报',
    keywords: ['申报', '奖项', '材料', '报名', '评优', '竞赛', '科研', '双创'],
    rich: {
      greeting: '奖项报名材料准备指南 🏆',
      blocks: [
        { type: 'paragraph', text: '不同类型奖项所需材料略有差异，以下为通用清单：' },
        {
          type: 'list',
          items: [
            { strong: '报名表', text: '系统内在线填写，含个人基本信息、申报理由、主要业绩。' },
            { strong: '业绩证明', text: '项目成果、获奖证书、论文专利等（至少 3 项）。' },
            { strong: '推荐材料', text: '需 1-2 位导师或辅导员推荐签字。' },
            { strong: '述职报告', text: '800-1500 字，概述学年工作成果与突出贡献。' },
            { strong: '附件材料', text: '相关佐证文件扫描件。' },
          ],
        },
        {
          type: 'card',
          title: '申报流程',
          icon: 'shield',
          body: '在线填报 → 辅导员初审 → 评委会复审 → 结果公示 → 证书颁发，全程约 15-20 个工作日。',
          highlights: ['15-20 个工作日'],
        },
        {
          type: 'paragraph',
          text: '可在「奖项报名」模块选择对应类别（竞赛之星 / 科研之星 / 双创之星）开始报名。',
        },
      ],
    },
  },
  {
    topic: '时间轴',
    keywords: ['时间轴', '成长', '经历', '添加', '记录', '学期'],
    rich: {
      greeting: '成长时间轴操作说明 ⏳',
      blocks: [
        { type: 'paragraph', text: '成长时间轴用于记录和展示你的在校发展轨迹，添加经历步骤如下：' },
        {
          type: 'steps',
          items: [
            { num: 1, strong: '打开成长档案', text: '进入左侧导航「成长时间轴」页面。' },
            { num: 2, strong: '添加节点', text: '点击中央的年轮原子核，弹出经历编辑窗口。' },
            {
              num: 3,
              strong: '填写内容',
              text: '选择经历类型（学习/项目/荣誉/实践/培训），填写时间段、标题、详细描述。',
            },
            {
              num: 4,
              strong: '保存发布',
              text: '保存后经历将按学期自动排序到对应的年轮圈上展示。',
            },
          ],
        },
        {
          type: 'card',
          title: '小技巧',
          icon: 'info',
          body: '时间轴支持分类筛选，经历会按学期分布在 8 层轨道上，点击电子或卡片可查看详情。',
        },
      ],
    },
  },
  {
    topic: '审批',
    keywords: ['审批', '进度', '查询', '流程', '状态', '审核', '提交记录'],
    rich: {
      greeting: '审批进度查询方法 📊',
      blocks: [
        { type: 'paragraph', text: '你可以通过以下方式查看审批进度：' },
        {
          type: 'list',
          items: [
            {
              strong: '提交记录',
              text: '在「审批与记录 → 提交记录」查看你发起的所有申报及当前状态。',
            },
            { strong: '消息中心', text: '每次审批状态变更，系统会通过消息中心推送站内提醒。' },
            { strong: '审批模块', text: '辅导员可在「申报审核 / 奖项审核」按状态筛选处理。' },
          ],
        },
        {
          type: 'card',
          title: '处理时长参考',
          icon: 'clock',
          body: '辅导员审批 1-2 天 → 评委会复审 3-5 天 → 结果公示 1-2 天。超过预计时间可联系辅导员催办。',
          highlights: ['1-2 天', '3-5 天'],
        },
      ],
    },
  },
  {
    topic: '密码',
    keywords: ['密码', '忘记', '重置', '找回', '登录', '修改密码'],
    rich: {
      greeting: '密码重置与修改指南 🔐',
      blocks: [
        { type: 'paragraph', text: '忘记密码或需要修改密码，可通过以下方式处理：' },
        {
          type: 'steps',
          items: [
            {
              num: 1,
              strong: '自助修改',
              text: '登录后进入「个人中心 → 修改密码」页面，验证原密码后设置新密码。',
            },
            {
              num: 2,
              strong: '联系管理员',
              text: '若忘记原密码无法登录，可联系辅导员或系统管理员在后台重置。',
            },
          ],
        },
        {
          type: 'card',
          title: '密码安全要求',
          icon: 'shield',
          body: '新密码需 8-20 位，包含大小写字母和数字，建议包含特殊字符，不可与最近 3 次密码重复。',
          highlights: ['8-20 位'],
        },
      ],
    },
  },
  {
    topic: '导出',
    keywords: ['导出', '备份', '下载', '数据', '打印'],
    rich: {
      greeting: '档案数据导出与备份 💾',
      blocks: [
        { type: 'paragraph', text: '系统支持多种数据导出方式：' },
        {
          type: 'list',
          items: [
            { strong: '单份导出', text: '在档案详情页点击「导出」，可生成 PDF 格式的单份档案。' },
            {
              strong: '批量导出',
              text: '在列表页勾选多条记录，点击「批量导出」，系统将打包为 ZIP 文件。',
            },
            {
              strong: '对话导出',
              text: '本 AI 助手页顶部「导出」按钮支持将当前对话导出为 TXT/MD/PDF。',
            },
          ],
        },
        {
          type: 'card',
          title: '注意事项',
          icon: 'info',
          body: '导出操作会记录在系统审计日志中，请确保导出数据的合规使用。',
        },
      ],
    },
  },
  {
    topic: '职业规划',
    keywords: ['职业规划', '短板', '改进', '建议', '规划', '能力'],
    rich: {
      greeting: '职业规划与改进建议 🎯',
      blocks: [
        { type: 'paragraph', text: '根据你的档案数据，我从以下几个维度给出分析与建议：' },
        {
          type: 'list',
          items: [
            {
              strong: '科研创新',
              text: '项目经历较少，建议主动联系导师参与课题，尝试撰写综述或论文。',
            },
            {
              strong: '竞赛实践',
              text: '高级别竞赛参与不足，可关注「挑战杯」「互联网+」等赛事并组建团队。',
            },
            { strong: '社会实践', text: '实践记录偏少，建议利用寒暑假参加支教、调研或企业实习。' },
          ],
        },
        {
          type: 'card',
          title: '持续跟踪',
          icon: 'success',
          body: '在「个人中心 → 职业规划」可查看完整规划，并在成长时间轴持续记录经历，我会基于最新数据动态更新分析。',
        },
      ],
    },
  },
]

/** 默认兜底回复（未命中任何关键词时） */
export const defaultEntry: KnowledgeEntry = {
  topic: 'default',
  keywords: [],
  rich: {
    greeting: '让我来帮你解答 🤔',
    blocks: [
      { type: 'paragraph', text: '抱歉，这个问题我暂时没有找到精确匹配的答案。建议你：' },
      {
        type: 'list',
        items: [
          { strong: '更换关键词', text: '尝试用更具体的词汇重新提问。' },
          { strong: '查看常见问题', text: '点击下方快捷问题查看是否涵盖你的需求。' },
          { strong: '联系辅导员', text: '获取人工帮助。' },
        ],
      },
      {
        type: 'card',
        title: '联系方式',
        icon: 'info',
        body: '可通过消息中心联系辅导员，或前往学院办公室咨询。',
      },
    ],
  },
}

/**
 * 按用户输入匹配知识库条目
 * - 命中任一 keyword 即返回对应条目
 * - 未命中返回 defaultEntry
 */
export function matchKnowledge(query: string): KnowledgeEntry {
  for (const entry of knowledgeBase) {
    if (entry.keywords.some((kw) => query.includes(kw))) {
      return entry
    }
  }
  return defaultEntry
}
