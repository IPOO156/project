/**
 * 加载页温馨提示文案库（静态数据）
 *
 * 设计原则：
 *  1. 按主题分类，由 resolveLoadingTipCategories 依据当前路由/角色匹配，避免「申报页推留学」；
 *  2. 每条 1-2 句、可执行、不说教，优先写具体动作而非口号；
 *  3. 文案只做「顺手的提醒」，不承诺结果、不制造焦虑；
 *  4. 新增主题时同步更新 LoadingTipCategory 与 LOADING_TIP_CATEGORY_LABELS。
 */

export type LoadingTipCategory =
  | 'platform'
  | 'growth'
  | 'college'
  | 'postgrad'
  | 'abroad'
  | 'career'
  | 'startup'
  | 'paper'
  | 'internship'
  | 'teaching'

/**
 * 学习阶段：用于把建议收敛到当前年级，未识别时不展示阶段专属文案。
 * 本科四阶段 + 研究生（硕士）与博士阶段。
 */
export type GradeStage = 'freshman' | 'sophomore' | 'junior' | 'senior' | 'master' | 'phd'

export interface LoadingTip {
  id: string
  category: LoadingTipCategory
  text: string
  /** 仅对特定年级展示；缺省表示通用建议 */
  stages?: GradeStage[]
}

/** 分类中文名（同时用于提示卡上的标签） */
export const LOADING_TIP_CATEGORY_LABELS: Record<LoadingTipCategory, string> = {
  platform: '平台使用',
  growth: '个人成长',
  college: '大学生活',
  postgrad: '考研升学',
  abroad: '出国留学',
  career: '求职就业',
  startup: '创业',
  paper: '论文写作',
  internship: '实习实践',
  teaching: '教学与审核',
}

export const LOADING_TIPS: LoadingTip[] = [
  // ── 平台使用 ──
  {
    id: 'platform-01',
    category: 'platform',
    text: '申报被退回时，退回原因在「消息中心 → 报名记录」里能看到，不必反复找老师确认。',
  },
  {
    id: 'platform-02',
    category: 'platform',
    text: '成长时间轴会自动汇总审核通过的申报记录，同一段经历不需要重复录入。',
  },
  {
    id: 'platform-03',
    category: 'platform',
    text: '导出简历前先把联系方式补全，PDF 才会带上最新的个人信息。',
  },
  {
    id: 'platform-04',
    category: 'platform',
    text: '奖项名称写得具体些：赛事级别、名次、时间都写清，审核会更快。',
  },
  {
    id: 'platform-05',
    category: 'platform',
    text: '标签页最多保留 7 个，常用页面可以固定，减少来回切换。',
  },
  {
    id: 'platform-06',
    category: 'platform',
    text: '夜间模式已适配全部页面的对比度，晚上整理材料可以打开它。',
  },

  // ── 个人成长 ──
  {
    id: 'growth-01',
    category: 'growth',
    text: '每学期挑三件让你自豪的事写下来，毕业时你会感谢现在的自己。',
  },
  {
    id: 'growth-02',
    category: 'growth',
    text: '大目标拆成本周能完成的一步，比列一张永远完不成的清单更有用。',
  },
  {
    id: 'growth-03',
    category: 'growth',
    text: '记录经历时多写「我做了什么、结果如何」，少写「参与了」。',
  },
  {
    id: 'growth-04',
    category: 'growth',
    text: '复盘不是检讨：只回答「哪一步有效、下次保留什么」。',
  },
  { id: 'growth-05', category: 'growth', text: '与其等准备好，不如先做一个小到不可能失败的版本。' },
  {
    id: 'growth-06',
    category: 'growth',
    text: '成长不是线性的，停滞的那段时间也在积累，别急着否定自己。',
  },

  // ── 大学生活 ──
  {
    id: 'college-01',
    category: 'college',
    text: '大一多探索、大二找方向、大三做深度、大四收口，每个阶段只抓一件事。',
  },
  {
    id: 'college-02',
    category: 'college',
    text: '绩点是门槛，项目是差异；两者都重要，但别用熬夜同时换。',
  },
  {
    id: 'college-03',
    category: 'college',
    text: '主动去一次老师的答疑时间，被记住的人更容易拿到机会。',
  },
  {
    id: 'college-04',
    category: 'college',
    text: '社团、竞赛、实习都可以试，但每学期只新增一个身份。',
  },
  {
    id: 'college-05',
    category: 'college',
    text: '学会用学校的数据库和图书馆，它们比搜索引擎更可靠。',
  },
  {
    id: 'college-06',
    category: 'college',
    text: '找比你高两届的学长学姐聊一次，比自己摸索一个学期更快。',
  },

  // ── 考研升学 ──
  {
    id: 'postgrad-01',
    category: 'postgrad',
    text: '先定专业再定院校：方向错了，努力只会放大偏差。',
  },
  {
    id: 'postgrad-02',
    category: 'postgrad',
    text: '真题是最好的模拟题，先做三年真题，再谈刷题量。',
  },
  {
    id: 'postgrad-03',
    category: 'postgrad',
    text: '英语和数学拉分，专业课决定上限，时间按分值分配。',
  },
  {
    id: 'postgrad-04',
    category: 'postgrad',
    text: '复试看科研经历和表达，初试结束就开始准备，别等出分。',
  },
  {
    id: 'postgrad-05',
    category: 'postgrad',
    text: '择校时看近三年的报录比和复试线，别只盯一年的「爆冷」。',
  },
  { id: 'postgrad-06', category: 'postgrad', text: '备考是长跑，固定作息比偶尔通宵更接近上岸。' },

  // ── 出国留学 ──
  {
    id: 'abroad-01',
    category: 'abroad',
    text: 'GPA、语言、文书三条线并行，任何一条拖到最后都会很被动。',
  },
  {
    id: 'abroad-02',
    category: 'abroad',
    text: '推荐信找真正了解你的老师，头衔不如「他写过你什么」。',
  },
  {
    id: 'abroad-03',
    category: 'abroad',
    text: '把每个学校的截止日期倒排进日历，提前两周提交最稳。',
  },
  {
    id: 'abroad-04',
    category: 'abroad',
    text: '文书不要罗列经历，讲清「为什么是你、为什么是这个项目」。',
  },
  {
    id: 'abroad-05',
    category: 'abroad',
    text: '选校分冲刺、匹配、保底三档，别把希望押在一所学校。',
  },
  { id: 'abroad-06', category: 'abroad', text: '语言成绩够用就好，省下的时间留给科研和文书。' },

  // ── 求职就业 ──
  {
    id: 'career-01',
    category: 'career',
    text: '简历用 STAR 写：情境、任务、行动、结果，结果尽量带数字。',
  },
  {
    id: 'career-02',
    category: 'career',
    text: '投递前把 JD 里的关键词圈出来，简历里出现同样的词，通过率更高。',
  },
  { id: 'career-03', category: 'career', text: '实习转正通常比海投高效，先争取一段能转正的实习。' },
  {
    id: 'career-04',
    category: 'career',
    text: '面试前准备三个能讲透的项目，比背二十个名词更有用。',
  },
  {
    id: 'career-05',
    category: 'career',
    text: '被拒不等于你不行，可能只是岗位匹配度问题，记下原因再调整。',
  },
  { id: 'career-06', category: 'career', text: '秋招别等到九月，很多暑期实习在春天就截止了。' },

  // ── 创业 ──
  {
    id: 'startup-01',
    category: 'startup',
    text: '先验证需求再投入：愿意付费的用户，比点赞的用户更可信。',
  },
  { id: 'startup-02', category: 'startup', text: '找互补的合伙人，比找一个和你一样的人更重要。' },
  { id: 'startup-03', category: 'startup', text: '现金流比估值重要，先算清楚能活几个月。' },
  { id: 'startup-04', category: 'startup', text: '最小可行产品先上线，用户的反馈比你的假设值钱。' },
  {
    id: 'startup-05',
    category: 'startup',
    text: '创业不是逃避就业，它需要更强的执行力和抗压能力。',
  },
  { id: 'startup-06', category: 'startup', text: '把每次失败写成可复用的清单，下一次会快很多。' },

  // ── 论文写作 ──
  { id: 'paper-01', category: 'paper', text: '先写提纲再填内容，结构定了，写作速度会快一倍。' },
  { id: 'paper-02', category: 'paper', text: '每写完一节就锁稿，最后统一改格式，别边写边排版。' },
  { id: 'paper-03', category: 'paper', text: '引用格式从一开始就统一，返工会浪费整晚。' },
  { id: 'paper-04', category: 'paper', text: '摘要最后写，它决定别人要不要继续读你的正文。' },
  { id: 'paper-05', category: 'paper', text: '数据留好原始记录，审稿人追问细节时你会庆幸。' },
  {
    id: 'paper-06',
    category: 'paper',
    text: '找一个人读你的初稿，他读不懂的地方就是需要改的地方。',
  },

  // ── 实习实践 ──
  {
    id: 'internship-01',
    category: 'internship',
    text: '实习记录要量化：独立完成 3 个页面，比「参与开发」有说服力。',
  },
  {
    id: 'internship-02',
    category: 'internship',
    text: '主动争取核心项目，边缘任务做十件不如核心任务做一件。',
  },
  {
    id: 'internship-03',
    category: 'internship',
    text: '入职第一周把流程和联系人画成一张图，后面会省很多时间。',
  },
  {
    id: 'internship-04',
    category: 'internship',
    text: '每周给导师发一次简短进展，让帮忙的人知道你在做什么。',
  },
  {
    id: 'internship-05',
    category: 'internship',
    text: '实习结束前整理一份成果清单，转正和下一份工作都用得上。',
  },
  {
    id: 'internship-06',
    category: 'internship',
    text: '不懂就问，但先自己查十分钟，问题会更有质量。',
  },

  // ── 教学与审核 ──
  {
    id: 'teaching-01',
    category: 'teaching',
    text: '审核时先看材料是否完整，再看内容质量，能少返工一半。',
  },
  { id: 'teaching-02', category: 'teaching', text: '退回原因写得具体，学生才知道下一步该改什么。' },
  {
    id: 'teaching-03',
    category: 'teaching',
    text: '批量处理前先筛出「明显不合规」的，优先集中处理。',
  },
  { id: 'teaching-04', category: 'teaching', text: '给学生的建议控制在三条以内，多了等于没建议。' },
  { id: 'teaching-05', category: 'teaching', text: '同一类问题出现三次，就值得做成模板或说明。' },
  {
    id: 'teaching-06',
    category: 'teaching',
    text: '审核高峰期先处理临近截止的，避免学生错过时间。',
  },

  // ── 按年级细分的建议（仅在识别到年级时进入候选池） ──
  {
    id: 'stage-freshman-01',
    category: 'college',
    stages: ['freshman'],
    text: '大一先把绩点和作息稳住，后面的选择会多很多。',
  },
  {
    id: 'stage-freshman-02',
    category: 'growth',
    stages: ['freshman'],
    text: '大一不必急着定方向，但每门课都别轻易放弃。',
  },
  {
    id: 'stage-sophomore-01',
    category: 'growth',
    stages: ['sophomore'],
    text: '大二试着进一个课题组或团队，深度比数量重要。',
  },
  {
    id: 'stage-sophomore-02',
    category: 'internship',
    stages: ['sophomore'],
    text: '大二把一门工具学到能用，比学十门入门课值钱。',
  },
  {
    id: 'stage-junior-01',
    category: 'internship',
    stages: ['junior'],
    text: '大三优先补一段与目标方向相关的实习或科研。',
  },
  {
    id: 'stage-junior-02',
    category: 'growth',
    stages: ['junior'],
    text: '大三要开始做减法：方向越聚焦，准备越有效。',
  },
  {
    id: 'stage-senior-01',
    category: 'career',
    stages: ['senior'],
    text: '大四同时推进毕业设计与去向落实，给彼此留缓冲。',
  },
  {
    id: 'stage-senior-02',
    category: 'postgrad',
    stages: ['senior'],
    text: '大四别只盯一个结果，offer、复试、备选方案同时准备。',
  },

  // ── 硕士阶段 ──
  {
    id: 'stage-master-01',
    category: 'growth',
    stages: ['master'],
    text: '研究生阶段尽早定题，方向清晰之后每一分投入才开始有复利。',
  },
  {
    id: 'stage-master-02',
    category: 'paper',
    stages: ['master'],
    text: '研一把文献笔记按主题归档，开题和综述会省下大半时间。',
  },
  {
    id: 'stage-master-03',
    category: 'career',
    stages: ['master'],
    text: '硕士两年很快，秋招前最好有一段与目标岗位对口的实习。',
  },
  {
    id: 'stage-master-04',
    category: 'internship',
    stages: ['master'],
    text: '优先选与课题相关的实习，论文和工作可以互相反哺。',
  },
  {
    id: 'stage-master-05',
    category: 'abroad',
    stages: ['master'],
    text: '若考虑读博或出国，研二前把语言成绩和推荐人确定下来。',
  },
  {
    id: 'stage-master-06',
    category: 'growth',
    stages: ['master'],
    text: '和导师保持固定频率的沟通，比临近节点才汇报有效得多。',
  },

  // ── 博士阶段 ──
  {
    id: 'stage-phd-01',
    category: 'paper',
    stages: ['phd'],
    text: '把一篇论文的实验流程沉淀成可复用框架，后续产出会明显加快。',
  },
  {
    id: 'stage-phd-02',
    category: 'growth',
    stages: ['phd'],
    text: '读博是长周期项目，按季度设可交付目标，比只盯毕业时间更稳。',
  },
  {
    id: 'stage-phd-03',
    category: 'career',
    stages: ['phd'],
    text: '博士就业面窄而深，提前两年同时经营学术与工业界两条线。',
  },
  {
    id: 'stage-phd-04',
    category: 'paper',
    stages: ['phd'],
    text: '投稿被拒是常态，把审稿意见当作免费的同行评审认真对待。',
  },
  {
    id: 'stage-phd-05',
    category: 'abroad',
    stages: ['phd'],
    text: '联培或访学要提前一年准备，导师的推荐与接收函是关键。',
  },
  {
    id: 'stage-phd-06',
    category: 'growth',
    stages: ['phd'],
    text: '保留一个与科研无关的长期爱好，它是长期抗压的缓冲带。',
  },
]

/** 按主题预分组，选池时直接取用，避免每次遍历全量文案 */
export const TIPS_BY_CATEGORY: Record<LoadingTipCategory, LoadingTip[]> = LOADING_TIPS.reduce(
  (acc, tip) => {
    acc[tip.category].push(tip)
    return acc
  },
  {
    platform: [],
    growth: [],
    college: [],
    postgrad: [],
    abroad: [],
    career: [],
    startup: [],
    paper: [],
    internship: [],
    teaching: [],
  } as Record<LoadingTipCategory, LoadingTip[]>,
)
