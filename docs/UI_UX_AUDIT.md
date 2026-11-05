# UI/UX 审计与优化报告

**项目**：学生档案管理系统（教师端 / 学生端 / 管理员端）
**审计日期**：2026-10-19
**审计对象**：`frontend/`（Vue 3 + TypeScript + Element Plus 2.9.7）
**工作性质**：视觉与交互优化。未改接口定义、路由结构、权限规则、表单字段和业务数据流。

---

## 1. 审计覆盖范围

### 1.1 三个 Skill 的实际使用

开工前先检查了本机 Skill 目录。以下三个 Skill 都真实存在，均已读取各自的 `SKILL.md`，并按其中流程执行：

| Skill           | 实际路径                                                  | 在本项目中的用法                                                                                       |
| --------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| ui-ux-pro-max   | `C:\Users\Lenovo\.claude\skills\ui-ux-pro-max\SKILL.md`   | 用其设计系统检查表审查颜色角色、层级、间距、表格密度、空态与响应式；先处理共享组件和全局样式，再改页面 |
| diagnosing-bugs | `C:\Users\Lenovo\.claude\skills\diagnosing-bugs\SKILL.md` | 对布局缺陷按“复现 → 定位 DOM/CSS → 最小修复 → 回归”执行，例如固定列遮挡、标签栏无法滚动、操作列折行    |
| humanizer       | `C:\Users\Lenovo\.claude\skills\humanizer\SKILL.md`       | 清理英文眉标、空泛说明和重复描述，改成用户能直接理解的中文操作文案；没有用文案包装未验证的结论         |

这三个 Skill 用于方法与检查，不代替证据。下文每个结论都对应截图、DOM 测量或源码位置。

### 1.2 环境、账号与方法

- 前端 `http://localhost:5173`，后端 `http://localhost:8080/api/v1`，本地 MySQL 演示库。
- 学生端：`202401002 / 123456`。
- 教师端：`T00003 / 123456`。
- 管理员端：`A00002 / 123456`（超级管理员）。管理员没有独立路由组，登录后复用 `/teacher` 页面，由权限过滤菜单。
- 视口：以 1024px 和 1440px 宽度为主，另做 1280px 与深色主题抽查。项目规范以 ≥1366px 为标准桌面宽度，1024px 是本次补充验证的窄桌面边界。
- 工具：Playwright 1.64 逐路由打开页面、切换页内 Tab、打开可到达的弹窗/抽屉，监听 `console` 与 `pageerror`；必要时读取单元格尺寸、换行行数、滚动宽度做 DOM 测量。
- 截图：`D:\tmp\uiux`（审计过程）、`D:\tmp\uiux\regression`（全量回归）、`D:\tmp\uiux\final`（1024/1440 定向复核）。截图未纳入仓库。

没有真实用户研究、埋点或使用时长数据。下文对“高频/低频”的判断依据是操作语义、页面角色和误操作后果，不冒充统计结论。

### 1.3 页面清单

学生端共 23 个可运行页面状态：

| 模块             | 页面状态                                                                          | 路由                                                              |
| ---------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 首页             | 首页                                                                              | `/dashboard`                                                      |
| 成长             | 成长时间轴                                                                        | `/growth-timeline`                                                |
| AI               | AI 助手                                                                           | `/ai-chat`                                                        |
| 个人中心         | 档案概览、成长发展、修改密码（3）                                                 | `/profile/info`、`/profile/career-plan`、`/profile/edit-password` |
| 个人档案信息申报 | 竞赛、创新、科研、奖学金、证书、实习、组织、培训、社会实践、读书报告（10 个 Tab） | `/applications?tab=...`                                           |
| 奖项报名         | 竞赛之星、科研之星、双创之星（3）                                                 | `/awards/competition-star` 等                                     |
| 消息             | 消息中心、全部动态（2）                                                           | `/messages`、`/messages/activities`                               |
| 我的申报         | 申报看板、奖项看板（2）                                                           | `/approval/pending`、`/approval/award-review`                     |

教师端与管理员端共 26 个可运行页面状态：

| 模块       | 页面状态                                           | 路由                                                       |
| ---------- | -------------------------------------------------- | ---------------------------------------------------------- |
| 首页       | 首页                                               | `/teacher/dashboard`                                       |
| 档案       | 档案查看、学生成长档案（2）                        | `/teacher/archive-view`、`/teacher/student-detail/:userId` |
| 审核       | 材料审核、审核记录（2）                            | `/teacher/material-review/pending`、`/history`             |
| 消息       | 消息中心                                           | `/teacher/messages`                                        |
| 组织       | 组织架构                                           | `/teacher/org-management`                                  |
| 统计       | 成果热力图                                         | `/teacher/heat-map`                                        |
| 审批       | 审批委托管理                                       | `/teacher/delegation`                                      |
| 审计       | 日志查看                                           | `/teacher/log-view`                                        |
| 指标       | 能力维度、指标配置（2 个 Tab）                     | `/teacher/indicator-system?tab=dimension                   | indicator` |
| 评分       | 评分重算                                           | `/teacher/score-recalculate`                               |
| 导出       | 档案导出、导出模板（2 个 Tab）                     | `/teacher/export-center?tab=export                         | template`  |
| 流程       | 审批流程                                           | `/teacher/approval-flow`                                   |
| 系统管理   | 字典管理、角色管理、学期管理（3 个 Tab）           | `/teacher/system-management?tab=dict                       | role       | semester` |
| 账号与角色 | 学生账号、教师账号、职位调整、新增账号（4 个 Tab） | `/teacher/account-role?tab=student                         | teacher    | adjust    | add` |
| 表单       | 表单自定义                                         | `/teacher/form-customization`                              |
| 配置       | 系统配置                                           | `/teacher/system-config`                                   |
| 任务       | 定时任务                                           | `/teacher/scheduled-task`                                  |

另有登录页（学生 / 教师 / 管理员三个登录 Tab）。旧路径重定向 11 条（教师端）及学生端 `/profile`、`/applications/*`、`/awards` 重定向，均已实际访问确认落到目标页，不单独计为页面状态。

### 1.4 覆盖边界

- 49 个页面状态已逐页打开。所有可到达的表格、筛选栏、页头操作、分页、页内 Tab、主要弹窗/抽屉做了布局与交互检查。
- 会写库或不可逆的提交（新增、删除、导出、批量操作、真实审批通过/退回）没有实际执行，只验证到表单校验、确认框和按钮状态。
- 依赖特定历史数据才会出现的状态（例如导入失败明细、部分批量结果、空消息管理员视图）没有构造数据。
- 具体的权限与数据限制见第 8 节，未检查的部分不会写成“已检查”。

---

## 2. 问题清单（P1–P4）

**分级口径**

- **P1**：在支持宽度下直接阻断任务、导致误操作或数据理解错误。
- **P2**：显著降低效率或造成明显布局破坏，但仍有绕行方式。
- **P3**：一致性与易读性问题，不影响主流程完成。
- **P4**：细节打磨。

“修复前”证据以 `D:\tmp\uiux` 截图与当时的 DOM 测量为准；“修复后”以 `D:\tmp\uiux\final` 和源码为准。

### 2.1 P1 问题

| ID    | 范围与证据                                                                                                                                                                                                                                                              | 影响                                             | 处理结果                                                                                         |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| P1-01 | 教师/管理员消息中心：三个文字操作挤在行尾，窄宽度下换行并压到相邻内容；操作列未固定。修复前截图在 `D:\tmp\uiux\admin-messages-*.png`、`teacher-messages-*.png`；修复后见 [TeacherMessageCenter.vue:243](../src/features/teacher/messages/TeacherMessageCenter.vue#L243) | 读消息后无法稳定完成归档/标已读，按钮容易误点    | 已修复：详情保持行内，标为已读/归档收进“更多”，操作列 130px 固定右侧，时间列禁止换行             |
| P1-02 | 多张宽表在 1024px 下将操作列滚出视野；归档、账号、定时任务、审批流程、指标等处尤甚。修复前在 `D:\tmp\uiux\*.png` 可见操作列随横向滚动消失                                                                                                                               | 用户看不到行操作，只能横向拖到底，管理任务被阻断 | 已修复/部分：审计后 26 个操作列使用 `fixed="right"`；剩余遮挡风险见 8.4                          |
| P1-03 | 学生成长档案“添加改进建议”等 plain 主按钮渲染为深色空块。根因是深海蓝实心样式叠加到浅色 plain 按钮，文字与背景同色。修复见 [teacher-console.scss:134](../src/assets/styles/teacher-console.scss#L134)、[:632](../src/assets/styles/teacher-console.scss#L632)           | 按钮看似禁用或空白，用户不敢点                   | 已修复：light/dark 分别覆盖 background-color、background-image、border、color，悬停/按下保持白字 |
| P1-04 | 顶栏标签在 1024px 下被压成“材料…”“系统…”，标签栏隐藏滚动条，鼠标无法横向滚动。修复前截图见 `D:\tmp\uiux\teacher-*-1024x768.png`；修复见 [NavTabs.vue:204](../src/app/layouts/components/NavTabs.vue#L204)、[:358](../src/app/layouts/components/NavTabs.vue#L358)       | 多标签用户无法识别和切换页面                     | 已修复：标签最小宽度 140px，支持鼠标滚轮横向滚动，当前标签保持可见                               |
| P1-05 | 日志日期筛选只传开始日 00:00:00 到结束日 00:00:00，结束日当天的记录被排除。修复见 [time.ts:12](../src/shared/utils/time.ts#L12)、[LogView.vue:126](../src/features/teacher/log-view/LogView.vue#L126)                                                                   | 按“今天/某天”筛选时漏记录，审计结论可能错误      | 已修复：统一 `toDayRangeBounds`，结束日包含到 23:59:59                                           |
| P1-06 | 审批委托“取消委托”在原因输入框点“返回”后仍继续执行取消。原 `catch` 后没有中止。修复见 [DelegationManage.vue:190](../src/features/teacher/delegation/DelegationManage.vue#L190)                                                                                          | 用户明确放弃操作，委托却被取消，属误写           | 已修复：原因框取消即 return，只有确认后才调用取消接口                                            |

### 2.2 P2 问题

| ID    | 范围与证据                                                                                                                                                                                                                                                                                                                                    | 影响                                      | 处理结果                                                                                                        |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| P2-01 | 行内三个以上文字按钮在 180px 以下折行、堆高整行：学期管理、审批步骤抽屉、公告管理、账号管理。修复前截图；修复后见 [SemesterManagement.vue:358](../src/features/teacher/semester-management/SemesterManagement.vue#L358)、[ApprovalFlowStepsDrawer.vue:254](../src/features/teacher/approval-flow/components/ApprovalFlowStepsDrawer.vue#L254) | 行高不一，操作看起来粘连，删除/编辑易误点 | 已修复：引入 [RowActions.vue](../src/shared/ui/RowActions.vue)，统一 4px 间距、禁止换行；按频次拆分行内与“更多” |
| P2-02 | 操作列宽度失控：活动列表 300px、账号管理 300px、定时任务 230px、审批流程 320px、指标 240px；单个操作列挤掉业务列                                                                                                                                                                                                                              | 表格有效信息变少，横向滚动增加            | 已修复：活动列表 126px、账号管理 180px、定时任务 130px、审批流程 156px、指标 176px；操作仍全部保留              |
| P2-03 | 页头标题、说明、操作组在 1024px 下互相挤压，说明被压成窄条，按钮组换行无序。修复见 [teacher-console.scss:320](../src/assets/styles/teacher-console.scss#L320)                                                                                                                                                                                 | 页面第一屏信息难读，主操作位置漂移        | 已修复：页头允许换行，左侧至少 420px，操作组整体换行；标题改为实色主色，不再用渐变                              |
| P2-04 | 时间列折行：消息、日志、账号最后登录等列在窄宽度下两行显示，撑高整表。修复见 [TeacherMessageCenter.vue:341](../src/features/teacher/messages/TeacherMessageCenter.vue#L341)、[LogTable.vue](../src/features/teacher/log-view/components/LogTable.vue)                                                                                         | 行高不稳定，扫描时间列困难                | 已修复：时间列固定宽度并 `nowrap`，统一 `formatDateTime`                                                        |
| P2-05 | 固定操作列覆盖相邻窄列：审批流程/导出模板“默认”标签在 60–70px 列宽下被裁切。修复见 [ApprovalFlow.vue:230](../src/features/teacher/approval-flow/ApprovalFlow.vue#L230)、[ExportTemplate.vue:292](../src/features/teacher/export-template/ExportTemplate.vue#L292)                                                                             | “是否默认”无法确认，配置结果不可见        | 已修复：列宽 76px；DOM 实测标签宽 40px、单元格内宽 76px、`fitsCell: true`                                       |
| P2-06 | 界面直接露出后端编码：日志动作 `audit`、定时任务分组英文、审批步骤 `end`/`return`/`student_major`。修复见 [dict.ts:195](../src/shared/constants/dict.ts#L195)、[ApprovalFlowStepsDrawer.vue:36](../src/features/teacher/approval-flow/components/ApprovalFlowStepsDrawer.vue#L36)                                                             | 用户无法判断动作含义，配置错误风险高      | 已修复：补充动作/模块/任务分组字典；审批步骤改为中文标签，未知值原样显示不丢信息                                |
| P2-07 | 学生首页在 <1200px 仍按四列/固定高度排布，卡片被压扁，雷达图与统计区拥挤。修复见 [Dashboard.vue](../src/features/dashboard/Dashboard.vue)、[QuickEntries.vue](../src/features/dashboard/components/QuickEntries.vue)                                                                                                                          | 1024px 下首页信息拥挤，快捷入口文字竖排   | 已修复：卡片响应式列数、<1200px 单列堆叠、高度自适应；快捷入口 `minmax(168px, 1fr)`                             |
| P2-08 | 空态缺失、重复或仍用默认英文/空表：活动列表、审核记录、角色、组织、配置、字典、学期、档案等                                                                                                                                                                                                                                                   | 无数据时页面像加载失败，用户不知道下一步  | 已修复：统一 [EmptyState.vue](../src/shared/ui/EmptyState.vue)，文案区分“无数据”“筛选无结果”“暂无归档”          |
| P2-09 | 文案与行为不符：“切换学生端”实际是退出登录；管理员角色标签用 warning 色像告警；多处说明重复标题。修复见 [HeaderBar.vue:126](../src/app/layouts/components/HeaderBar.vue#L126)、[Sidebar.vue:137](../src/app/layouts/components/Sidebar.vue#L137)                                                                                              | 用户预期错误，管理员界面显得异常          | 已修复：统一“切换账号”；角色标签改 info；删除重复说明并保留一句可执行说明                                       |

### 2.3 P3 问题

| ID    | 范围与证据                                                                                                                                                              | 影响                            | 处理结果                                                                         |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------- |
| P3-01 | 装饰性英文眉标、标题图标、按钮装饰图标过多；如账号管理、表单自定义、导出、角色选择页。修复见 [teacher-console.scss:335](../src/assets/styles/teacher-console.scss#L335) | 增加视觉噪声，弱化真正标题      | 已修复：隐藏眉标；删除无功能图标；仅保留有语义的工具栏图标                       |
| P3-02 | 静态卡片悬停位移、列表逐行错峰动画；用户移动鼠标时页面晃动                                                                                                              | 管理后台显得轻浮，影响阅读      | 已修复：移除静态卡片 translateY 和活动/消息列表逐行动画；保留必要的加载骨架      |
| P3-03 | 学生消息卡片操作点击区偏小，未读状态只有文字；缺少 aria-label。修复见 [MessageCard.vue](../src/features/messages/components/MessageCard.vue)                            | 触控/精确点击困难，读屏语义不足 | 已修复：操作区 36px，增加未读标记、时间格式化、`aria-label` 和 ChevronRight 提示 |
| P3-04 | 工具栏查询、刷新、导出等按钮等权排列，窄宽度下换行无序                                                                                                                  | 主操作不突出，用户视线跳跃      | 已修复：按“筛选 → 查询 → 次要动作”分组并允许换行                                 |
| P3-05 | 成果热力图使用装饰性光晕/色块，视觉重心偏离数据矩阵                                                                                                                     | 数据页像展示页                  | 已修复：去掉装饰，改标准筛选栏 + 统计条 + 矩阵标题                               |
| P3-06 | 日期时间格式不统一，部分直接显示后端原值                                                                                                                                | 同页时间格式不一致，难比较      | 已修复：列表与详情统一 `formatDateTime`                                          |
| P3-07 | 消息中心总数为 0 时仍显示分页；部分页面重复空态                                                                                                                         | 无数据页面底部出现无意义控件    | 已修复：消息中心 `total > 0` 才渲染分页；空态由表格 `#empty` 统一承载            |

### 2.4 P4 问题

| ID    | 范围与证据                                             | 影响                           | 处理结果                                                                                              |
| ----- | ------------------------------------------------------ | ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| P4-01 | 页面间距、圆角、按钮间距存在局部不一致                 | 轻微视觉不齐，不影响任务       | 部分统一：页头/卡片/表格间距使用既有 `$spacing-*` 与 6/8/12px 圆角；未做全量像素级重排                |
| P4-02 | 深色主题下消息卡片木质渐隐变量缺失，边缘与背景对比不足 | 深色模式边缘层级弱             | 已修复：[`_theme.scss`](../src/features/messages/styles/_theme.scss) 增加 light/dark `--mc-wood-fade` |
| P4-03 | 弹窗宽度固定 480–640px，极窄窗口可能溢出               | 小于弹窗宽度的窗口出现横向滚动 | 保留：项目标准桌面宽度 ≥1366px，本次只验证到 1024px；未改全局弹窗宽度策略                             |
| P4-04 | 个别页面说明仍然偏长，重复标题信息                     | 首屏阅读成本高                 | 部分修复：删除英文眉标和重复描述；未删除承载业务规则的说明                                            |

---

## 3. 教师端 / 管理员端消息中心专项

### 3.1 页面与角色事实

教师端消息中心路由为 `/teacher/messages`，组件 [TeacherMessageCenter.vue](../src/features/teacher/messages/TeacherMessageCenter.vue)。管理员登录后复用同一路由和同一组件，没有单独的管理员消息页面。页面数据来自 `/teacher/messages`，视图分收件箱和已归档。

实测账号差异：

- 教师 `T00003`：消息列表有数据，均为已读。
- 管理员 `A00002`：消息列表为空，无法触发未读、标为已读、归档等状态。
- 因此“管理员布局正确”可以验证，但“管理员在未读/归档状态下的行为”没有真实数据可验证，见 8.3。

### 3.2 修复前的问题

1. **操作按钮同级堆叠**：详情、标为已读、归档三个文字按钮并排，长标签挤压，操作列在 1024px 下换行或被固定列覆盖。
2. **操作重要性没有分层**：查看详情是每次读消息都会用的动作；标为已读是状态维护；归档会改变消息所在视图。三者视觉权重相同，误点成本却被混在一起。
3. **信息列不足**：类型、标题/内容、阅读状态、时间、操作五列中，时间列会折行；标题与内容没有区分层级；未读状态不够醒目。
4. **页头与工具栏拥挤**：页头说明和筛选区在窄宽度下挤占表格空间；收件箱/已归档与筛选控件没有明确分组。
5. **空态与分页**：筛选无结果和确实没有消息使用同一句空文案；总数 0 时仍显示分页。

### 3.3 频次 / 风险判断与处置

| 操作            | 使用频次判断               | 操作风险                             | 处置                                       |
| --------------- | -------------------------- | ------------------------------------ | ------------------------------------------ |
| 详情            | 高：读消息的主路径         | 低，只读；打开后自动标已读           | 保持行内可见                               |
| 标为已读        | 低：多数消息打开详情即已读 | 低，可逆性尚可                       | 收进“更多”，仅未读行出现                   |
| 归档            | 低：消息处理完才做         | 中：从收件箱移走；重要消息会二次确认 | 收进“更多”；收件箱视图才出现；重要消息确认 |
| 类型/关键词筛选 | 中                         | 低                                   | 保留在筛选栏，查询/刷新成组                |
| 收件箱/已归档   | 中                         | 低                                   | 独立分段控件，与筛选分开                   |

这里没有“为了简洁全收起来”。详情留下，是因为它是读消息的必经动作；归档没有删除，而是保留在“更多”中并加了确认。

### 3.4 具体修改

- **列宽**：类型 96px；标题/内容 `min-width: 236px`；阅读状态 84px；时间 150px 且 `nowrap`；操作 130px 且 `fixed="right"`。源码见 [TeacherMessageCenter.vue:243](../src/features/teacher/messages/TeacherMessageCenter.vue#L243) 起。
- **标题层级**：标题与摘要上下排列，未读标题加粗；重要消息用“重要”标签，不靠颜色单独表达。
- **阅读状态**：圆点 + “未读/已读”，未读用主色；不再只靠字体粗细。
- **操作层级**：`RowActions` 行内放“详情”，更多菜单放“标为已读/归档”；归档中显示“归档中…”，防重复点击。
- **页头**：只保留一句说明“打开详情后会自动标记为已读，重要消息归档前需要确认”，去掉重复介绍。
- **筛选区**：收件箱/已归档与类型、关键词、查询、刷新分组；允许换行。
- **空态**：无消息、无归档、筛选无结果分别给不同文案；总数 0 不渲染分页。
- **动效**：移除消息列表逐行错峰动画，减少阅读干扰。

### 3.5 管理员端差异

管理员与教师共用组件，没有凭空添加管理员专属功能。管理员的差异只体现在：

- 菜单和权限范围不同，消息数据可能为空。
- 顶部角色标签由 warning 改为 info，避免管理员身份看起来像异常告警。
- 侧边栏“切换学生端”改为“切换账号”，因为管理员没有学生端，实际行为是退出登录。

管理员消息为空是数据状态，不是 UI 缺陷；本次没有为了截图效果构造假消息。

### 3.6 结果

修复后，消息中心在 1024/1440 宽度下操作列保持可见，行内按钮不换行；消息行高度由标题+摘要两行稳定控制，时间列不再折行。最终定向复核没有出现控制台错误或页面异常。管理员空列表、教师全已读是两个未覆盖的状态限制，已在第 8 节列明。

---

## 4. 其他操作拥挤与按钮层级问题

消息中心不是孤例。全站检查后，按钮拥挤主要来自四类结构问题，处理方式按“频次 + 风险”而不是按页面统一套模板。

### 4.1 表格操作列

| 页面         | 原问题                                                             | 处置                                                               | 理由                                                           |
| ------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------ | -------------------------------------------------------------- |
| 学期管理     | 设为当前/编辑/禁用三个按钮在固定列内折行；表头“当前学期”也折成两行 | 设为当前、编辑留在行内；启用/禁用进“更多”；操作列 180px；表头 84px | 设当前是学期配置核心动作，且已有确认框；启停低频且改变可用状态 |
| 审批步骤抽屉 | 编辑/删除在 110px 内折行                                           | 两按钮保留行内，`RowActions :more="false"`，列 120px               | 只有两个动作，步骤编辑是抽屉主任务，强行收起反而多一次点击     |
| 公告管理     | 编辑/删除挤压，图标与文字混排                                      | 文本按钮 + `RowActions :more="false"`，列 120px                    | 两个动作，无低频项；去掉无功能图标                             |
| 账号管理     | 操作列 300px，按钮组占掉大量表格宽度                               | 列 180px，按角色/状态合并低频动作                                  | 查看/编辑常用；重置密码、停用等低频动作区分风险                |
| 定时任务     | 230px 操作列；详情/编辑/立即执行/删除同权                          | 列 130px；详情行内，编辑、立即执行、删除进“更多”                   | “立即执行”低频且有副作用，不应与详情同权                       |
| 审批流程     | 320px 操作列；详情/步骤/映射/编辑/启停/删除混排                    | 列 156px；详情、步骤行内；编辑、启停、删除进“更多”                 | 详情与步骤是流程配置主路径；启停/删除低频高风险                |
| 指标配置     | 240px 操作列；批量操作入口不显眼                                   | 列 176px；批量操作改为带下拉箭头的菜单                             | 保留全部动作，降低单行占用                                     |
| 活动列表     | 操作列 300px、逐行动画、重复空态                                   | 列 126px，`RowActions`，统一空态                                   | 操作少，原列宽纯属浪费                                         |
| 审批委托     | 取消按钮与查看同权；取消流程有误写                                 | 改为文本操作，修正取消原因框中止逻辑                               | 取消委托是低频高风险动作，必须确认且可中止                     |
| 角色调整     | 操作列过窄                                                         | 列 180px 固定右侧                                                  | 职位调整动作标签较长，避免折行                                 |

所有原有操作均保留。区别只在行内/更多菜单/页头的呈现层级。

### 4.2 页头与工具栏

- 页头改为可换行：说明区 `flex: 1 1 420px`，操作组整体换行，避免 1024px 下标题、说明和按钮互相挤压。见 [teacher-console.scss:320](../src/assets/styles/teacher-console.scss#L320)。
- 主按钮使用实色主色，不再用渐变；次按钮与刷新按钮按用途分组。
- 学期管理的“本次导入结果”从每行操作列移到页头。它是页面级结果，不是某行属性；没有结果时按钮禁用，避免点击后必然提示“请先导入”。
- 多个页面删除英文眉标和重复说明，但保留业务规则说明。例如审批流程的“子类型说明”仍保留，因为字段含义不能靠猜。

### 4.3 抽屉与弹窗

- 审批步骤抽屉：范围规则、退回动作显示中文；退回动作选择“退回”但未填退回步骤时给出可操作提示；操作列固定右侧。
- 流程映射抽屉、指标版本抽屉、导出模板详情：操作列固定，避免在抽屉内部再出现横向滚动后看不到按钮。
- 弹窗底部按钮顺序统一为“取消 / 主操作”，保存中禁用重复提交。未改校验规则和提交字段。

### 4.4 顶栏标签

- 标签最小宽度从 80px 提升到 140px，1024px 下不再把“材料审核”压成“材料…”。见 [NavTabs.vue:358](../src/app/layouts/components/NavTabs.vue#L358)。
- 标签栏保留横向滚动，并增加鼠标滚轮横向映射；隐藏滚动条的情况下，滚轮是桌面用户可发现的替代方式。见 [NavTabs.vue:204](../src/app/layouts/components/NavTabs.vue#L204)。

---

## 5. 整体评估

### 5.1 已有基础

- 业务结构完整：三端、49 个页面状态、权限菜单、审批/档案/指标/导出等主流程都能跑通。
- 技术栈统一，Element Plus 组件使用一致；已有深海蓝 + 琥珀色的基础色，不需要推倒重来。
- 大部分页面的信息架构合理：筛选、表格、分页、详情抽屉的主干清楚。问题集中在共享样式、操作列和窄桌面边界，而不是业务结构。

### 5.2 本次解决的主要问题

- 操作列从“能显示”提升到“在 1024px 下可见、可点、不折行”。
- 高频操作与低频/高风险操作分层，未删除任何业务入口。
- 修掉 plain 按钮空块、日志漏结束日、委托取消误写三个会直接影响结果的交互缺陷。
- 统一空态、时间格式、字典标签和页头响应式行为。
- 移除装饰性英文眉标、渐变标题、悬停位移、列表错峰动画等“展示型”设计，让界面回到档案管理工具的语气。

### 5.3 仍存在的差距

- 1024px 下宽表仍需要横向滚动。固定操作列能保证操作可见，但滚动到中间时固定列会覆盖相邻列，这是 Element Plus 固定列机制的固有限制，不是本次能完全消除的。
- 页面仍以“表格 + 卡片 + 页头说明”为主，视觉辨识度一般。对内部档案系统这是可接受的取舍，但如果要做品牌化，需要单独的设计阶段，不应在本次修缺陷时夹带。
- 没有真实用户数据验证“高频/低频”判断。当前结论可解释、可复查，但不能替代可用性测试。
- 深色模式只做了重点页面抽查，没有逐页截图比对。

### 5.4 结论

系统已经达到可交付的内部管理后台水平：主要任务可完成，窄桌面下关键操作可见，危险操作有确认，空态和错误提示可理解。距离成熟设计系统还有差距，差距主要在宽表策略、角色差异化文案和真实使用数据，而不是配色或装饰。

---

## 6. 推荐的设计系统与优化范围

### 6.1 视觉方向

保留现有深海蓝 `#1e3a5f` 与琥珀 `#d4a574`，不新增第二套品牌色。档案系统的视觉重点应是信息秩序，不是氛围。

- **主色**：导航、链接、主按钮、当前状态。
- **成功色**：完成、启用、当前学期；不要用来表示“普通信息”。
- **警告色**：需要关注但非破坏性的状态。
- **危险色**：只用于删除、停用、驳回等不可逆或高后果动作。
- **中性色**：表格、说明、分隔、次要按钮。页面大面积保持中性。
- 禁止用渐变标题、玻璃拟态、装饰光晕、无功能大图标来制造“高级感”。

### 6.2 Token 与排版

沿用项目已有尺度，不再扩张：

| 类别 | 建议值                                                             |
| ---- | ------------------------------------------------------------------ |
| 间距 | 4 / 8 / 12 / 16 / 24 / 32                                          |
| 圆角 | 6 / 8 / 12；表格和输入框不超过 8                                   |
| 字号 | 12（辅助）/ 13–14（正文、表格）/ 16（卡片标题）/ 20–26（页面标题） |
| 行高 | 正文 1.6–1.7；表格单元格单行，必要时用 tooltip                     |
| 阴影 | 只用于浮层和卡片分层，不用来做装饰                                 |
| 边框 | 1px 中性色；卡片内不再套卡片                                       |

### 6.3 操作层级规则

1. 每行默认最多 2 个行内文字操作 + 1 个“更多”。超过时按频次和风险排序。
2. 只读高频操作（详情、查看）优先留在行内。
3. 编辑类操作在空间足够时留在行内；与删除/启停并列时，删除与启停进“更多”。
4. 会改变业务状态、影响他人可见性或不可逆的操作，一律进“更多”并加确认。
5. 不用纯图标代替含义不明的行操作；图标只用于有通用语义的工具栏动作。
6. 不因为“看起来简洁”删除低频操作。低频但必要的操作必须仍可到达。

### 6.4 表格列宽与固定列

- 固定操作列建议 90–180px；文字按钮标签按“汉字数 × 14px + 内边距”预留，不把 4 个汉字塞进 70px。
- 标签列（默认/状态）最小 76px；时间列固定宽度并禁止换行。
- 宽表允许横向滚动，但操作列必须固定。固定列会覆盖相邻列，因此相邻列不要放必须同时阅读的短标签；必要时把“默认”并入名称列或状态列。
- 1024px 是补充边界，不承诺手机端表格体验；小于 1024px 的布局需要单独设计，不能靠压缩列宽硬塞。

### 6.5 状态与反馈

- 空态必须区分：无数据、筛选无结果、无权限、加载失败。
- 加载用骨架或表格 loading，不用整页空白。
- 成功用轻提示；失败要说明原因和下一步；破坏性操作必须二次确认。
- 分页仅在总数大于 0 时显示。
- 时间统一使用共享格式化函数，日期筛选包含结束日全天。

### 6.6 角色差异

- **学生端**：重点是“我下一步做什么”。首页快捷入口、申报状态、消息提醒优先；不要照搬教师端的高密度表格。
- **教师端**：重点是审核、档案查看、流程配置。表格密度可以高，但操作列必须稳定；审核动作要能一眼找到。
- **管理员端**：重点是系统配置、账号权限、字典和日志。危险操作与权限变更必须更醒目地标注后果；不要复制学生端的卡片化表达。
- 同一组件可复用，但文案、空态和默认视图要按角色调整。本次只做了共享组件与明显错位文案，未做完整的角色化信息架构重写。

### 6.7 不在本次范围

- 不新增业务功能、接口、权限或表单字段。
- 不重写路由和状态管理。
- 不做品牌视觉升级、插画、动效体系。
- 不引入新依赖或新组件库。
- 不以个人审美替代用户研究；如需确定优先级，应接入真实使用数据或做任务测试。

---

## 7. 修改文件与原因

本次 UI/UX 优化共修改 51 个前端源码文件，未新增依赖。未修改 `shared/api/*`、路由表、权限注册表、接口类型字段或后端代码。

同日更早还有一批 API/类型/路由文件改动，属于此前的缺陷审计任务，不在本清单内，也不计入本次 UI/UX 成果。

### 7.1 共享与全局（11）

| 文件                                                                   | 修改原因                                                                             |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [NavTabs.vue](../src/app/layouts/components/NavTabs.vue)               | 标签最小宽度 80→140，增加滚轮横向滚动，避免 1024px 标题截断                          |
| [HeaderBar.vue](../src/app/layouts/components/HeaderBar.vue)           | 管理员角色标签 warning→info；“切换学生端”改为符合实际行为的“切换账号”                |
| [Sidebar.vue](../src/app/layouts/components/Sidebar.vue)               | 统一品牌标题“档鉴未来”；底部操作改“切换账号”；补身份空值保护                         |
| [teacher-console.scss](../src/assets/styles/teacher-console.scss)      | 页头换行、实色标题、操作组换行、plain 主按钮修复（light/dark）、移除静态卡片位移动画 |
| [RowActions.vue](../src/shared/ui/RowActions.vue)                      | 统一行操作容器：4px 间距、禁止换行、行内与“更多”分层                                 |
| [shared/ui/index.ts](../src/shared/ui/index.ts)                        | 同步共享 UI 导出                                                                     |
| [GreetingToast.vue](../src/shared/ui/GreetingToast.vue)                | 提示移到右下并避让悬浮按钮；去 emoji 和分时段渐变，统一品牌蓝                        |
| [useGreeting.ts](../src/features/dashboard/composables/useGreeting.ts) | 统一问候语配色与文案                                                                 |
| [dict.ts](../src/shared/constants/dict.ts)                             | 补充日志动作/模块、定时任务分组中文标签                                              |
| [time.ts](../src/shared/utils/time.ts)                                 | 新增 `toDayRangeBounds`，结束日包含全天                                              |
| [_theme.scss](../src/features/messages/styles/_theme.scss)             | 增加 light/dark 的 `--mc-wood-fade` 变量                                             |

### 7.2 消息与学生端（7）

| 文件                                                                              | 修改原因                                                         |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| [MessageCenter.vue](../src/features/messages/MessageCenter.vue)                   | 工具栏分组换行，移除逐行错峰动画，说明文案改清楚                 |
| [ActivityList.vue](../src/features/messages/activities/ActivityList.vue)          | 操作列 300→126px 固定右侧并用 RowActions；统一空态；移除逐行动画 |
| [MessageCard.vue](../src/features/messages/components/MessageCard.vue)            | 未读标记、aria-label、时间格式化、36px 操作区、右侧进入提示      |
| [Dashboard.vue](../src/features/dashboard/Dashboard.vue)                          | 响应式列数，<1200px 堆叠，高度自适应，雷达图单列                 |
| [QuickEntries.vue](../src/features/dashboard/components/QuickEntries.vue)         | 快捷入口改用自适应网格，避免单字竖排                             |
| [CareerPlan.vue](../src/features/profile/CareerPlan.vue)                          | 操作列 130px 固定右侧；表单标签宽 84px，避免换行                 |
| [SubmissionRecords.vue](../src/features/submission-records/SubmissionRecords.vue) | 操作列 120px 固定右侧（该组件当前未被路由引用，仅静态验证）      |

### 7.3 教师端页面（33）

| 文件                                                                                                              | 修改原因                                                                            |
| ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [TeacherMessageCenter.vue](../src/features/teacher/messages/TeacherMessageCenter.vue)                             | 消息中心专项：列宽、操作分层、时间禁折行、空态、分页、移除动画                      |
| [ScheduledTask.vue](../src/features/teacher/scheduled-task/ScheduledTask.vue)                                     | 任务编码 tooltip；分组/标题中文化；操作列 230→130px；详情行内，其余进“更多”         |
| [AuditPendingList.vue](../src/features/teacher/material-review/AuditPendingList.vue)                              | 调整列宽；班级/专业堆叠；显示重复标记；审核操作固定可见                             |
| [AuditHistory.vue](../src/features/teacher/material-review/AuditHistory.vue)                                      | 统一空态；审核意见标题可读                                                          |
| [LogView.vue](../src/features/teacher/log-view/LogView.vue)                                                       | 日期筛选包含结束日；统一空态；移除英文眉标                                          |
| [ScopedLogView.vue](../src/features/teacher/log-view/components/ScopedLogView.vue)                                | 同上，作用域日志筛选与空态                                                          |
| [LogTable.vue](../src/features/teacher/log-view/components/LogTable.vue)                                          | 时间格式化、时间列 nowrap、列宽调整、字典标签                                       |
| [LoginLogTable.vue](../src/features/teacher/log-view/components/LoginLogTable.vue)                                | 登录时间格式化与列宽                                                                |
| [ExportLogTable.vue](../src/features/teacher/log-view/components/ExportLogTable.vue)                              | 导出时间格式化、列宽和字典标签                                                      |
| [StudentAccount.vue](../src/features/teacher/account-management/StudentAccount.vue)                               | 去掉英文眉标；说明改清楚；操作列 300→180px 固定；最后登录格式化                     |
| [TeacherAccount.vue](../src/features/teacher/account-management/TeacherAccount.vue)                               | 同学生账号；操作分层与列宽固定                                                      |
| [RoleManagement.vue](../src/features/teacher/role-management/RoleManagement.vue)                                  | RowActions、文本操作、空态、列宽 190px                                              |
| [OrganizationManagement.vue](../src/features/teacher/organization/OrganizationManagement.vue)                     | 空态、文本编辑、操作列 90/120px 固定                                                |
| [SystemConfig.vue](../src/features/teacher/system-config/SystemConfig.vue)                                        | 空态；设置值增加 title，长值可查看                                                  |
| [AnnouncementPanel.vue](../src/features/teacher/system-config/components/AnnouncementPanel.vue)                   | RowActions（无“更多”）、去掉装饰图标、操作列 120px 固定                             |
| [HeatMap.vue](../src/features/teacher/heat-map/HeatMap.vue)                                                       | 去掉装饰光晕；标准筛选栏、统计条、矩阵标题                                          |
| [ArchiveExport.vue](../src/features/teacher/archive-export/ArchiveExport.vue)                                     | 去掉英文眉标；操作列 90px 固定                                                      |
| [GradeImportPanel.vue](../src/features/teacher/archive-export/components/GradeImportPanel.vue)                    | 去掉英文眉标；操作列 90px 固定                                                      |
| [RoleAdjust.vue](../src/features/teacher/role-selection/RoleAdjust.vue)                                           | 去掉英文眉标；操作列 180px 固定                                                     |
| [RoleAdd.vue](../src/features/teacher/role-selection/RoleAdd.vue)                                                 | 去掉英文眉标                                                                        |
| [FormCustomization.vue](../src/features/teacher/form-customization/FormCustomization.vue)                         | 去掉标题图标和删除图标；提示文案改准确；代码列 nowrap；更新时间格式化；操作列 132px |
| [AbilityDimension.vue](../src/features/teacher/ability-dimension/AbilityDimension.vue)                            | 操作列 200px 固定右侧                                                               |
| [Indicator.vue](../src/features/teacher/indicator/Indicator.vue)                                                  | RowActions；操作列 240→176px 固定；批量操作菜单加下拉箭头；发布流程说明             |
| [IndicatorVersionsDrawer.vue](../src/features/teacher/indicator/components/IndicatorVersionsDrawer.vue)           | 抽屉内操作列 90px 固定                                                              |
| [ApprovalFlow.vue](../src/features/teacher/approval-flow/ApprovalFlow.vue)                                        | RowActions；操作列 320→156px 固定；默认列 76px                                      |
| [ApprovalFlowMappingsDrawer.vue](../src/features/teacher/approval-flow/components/ApprovalFlowMappingsDrawer.vue) | 抽屉内操作列 130px 固定                                                             |
| [ApprovalFlowStepsDrawer.vue](../src/features/teacher/approval-flow/components/ApprovalFlowStepsDrawer.vue)       | 范围规则/退回动作中文化；退回校验文案；操作列 120px + RowActions                    |
| [ExportTemplate.vue](../src/features/teacher/export-template/ExportTemplate.vue)                                  | RowActions；操作列 156px 固定；默认列 76px；创建人 90px；更新时间格式化             |
| [SemesterManagement.vue](../src/features/teacher/semester-management/SemesterManagement.vue)                      | 操作列 180px，设为当前/编辑行内，启停进“更多”；当前学期表头 84px；空态              |
| [StudentDetail.vue](../src/features/teacher/student-detail/StudentDetail.vue)                                     | 改进建议列表操作列 110px 固定右侧                                                   |
| [DelegationManage.vue](../src/features/teacher/delegation/DelegationManage.vue)                                   | 修正取消原因框中止逻辑；文本操作；空态；有效期格式化；操作列收窄                    |
| [DictManagement.vue](../src/features/teacher/dict-management/DictManagement.vue)                                  | 统一空态；修正提示文案；时间格式化；列宽调整                                        |
| [ArchiveView.vue](../src/features/teacher/archive-view/ArchiveView.vue)                                           | 统一空态；时间格式化；操作列 156px 固定；移除卡片悬停位移                           |

### 7.4 临时文件

审计期间创建过 Playwright 检查脚本（`.uiux-*.mjs`），最终已全部删除，未留在仓库。`npm run lint:check` 曾因这些临时脚本的顶层 `await`/`console` 报错，删除后通过。

### 7.5 改动边界

- 没有新增 npm 依赖。
- 没有修改路由、权限、API 定义、接口字段和表单字段。
- 没有删除业务操作；低频操作移动到“更多”菜单，仍可到达。
- 交互缺陷修复（日志结束日、委托取消、字典标签）超出纯 CSS 范围，但直接服务于可用性，已在 P1/P2 中单列。
- 没有把修复前的截图或临时脚本提交到仓库。

---

## 8. 验证结果与未验证范围

### 8.1 构建与静态检查

在 `frontend/` 执行：

```text
npm run lint:check  → 通过
npm run build       → 通过（18.37s）
```

构建仅保留既有的 chunk 体积 >500kB 警告，没有新增错误。未引入新依赖，因此没有依赖审计变更。

### 8.2 浏览器回归

- 全量回归访问 89 次，覆盖三端页面、页内 Tab、动态学生详情路径和旧路径重定向。
- 额外流程脚本覆盖 23 个弹窗/抽屉/Tab/菜单切换，包括审批步骤抽屉、流程映射、导出模板详情、指标版本、账号相关 Tab、系统管理 Tab 等。
- 最终定向复核在 1024px 与 1440px 下执行，关键结果：

```text
学期管理 rowActions:
  buttonCount: 3
  buttonTexts: ["设为当前", "编辑", "更多"]
  lineCount: 1
  cellOverflow: false

“当前学期”表头:
  text: "当前学期"
  cellHeight: 23
  overflow: false

学期“更多”菜单: ["禁用"]

审批流程 / 导出模板“默认”标签:
  tagWidth: 40
  cellInnerWidth: 76
  fitsCell: true

审批步骤抽屉:
  hasEnd: false
  hasReturn: false
  hasScopeCodes: false
  rowActions: ["编辑", "删除"], lineCount: 1, cellOverflow: false

最终定向复核:
  consoleErrors: []
  pageErrors: []
```

- 深色主题抽查了管理员日志、管理员消息等页面，没有发现文字与背景同色或固定列错位。
- 固定列截图曾出现“看起来没固定”的现象，后用 DOM 测量确认 Element Plus 使用 sticky 单元格；最终截图已重新采集。

### 8.3 未能验证的页面与状态

| 项目                                 | 限制                                                | 已做到什么                                                                                                     |
| ------------------------------------ | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `/teacher/log-view` 的教师视角       | 教师 `T00003` 没有该模块权限，访问被守卫拦截        | 用管理员 `A00002` 打开了同一页面并检查布局、筛选、表格；教师角色的入口与拦截行为已核对，但未以教师身份查看页面 |
| `SubmissionRecords.vue`              | 组件当前未被任何路由引用                            | 做了静态检查与样式修改；无法通过 UI 实跑                                                                       |
| 学生 `/awards`                       | 已重定向到 `/approval/award-review`，没有独立总览页 | 验证重定向落点；未把重定向当作独立页面检查                                                                     |
| 管理员消息中心                       | `A00002` 的消息列表为空                             | 验证空态、列布局、页头、筛选；未验证管理员未读、标已读、归档状态                                               |
| 教师消息“标为已读”                   | 教师 `T00003` 的消息全部已读，菜单项不出现          | 验证了菜单条件与代码路径；未在真实未读消息上点击                                                               |
| 导入失败明细 / 导入结果              | 需要实际上传 Excel，且会写库                        | 检查空态、按钮禁用逻辑和弹窗结构；未构造导入数据                                                               |
| 新增/删除/导出/审批通过退回/批量操作 | 会写库或产生外部文件                                | 只验证到表单校验、确认框与按钮 loading/disabled；未提交                                                        |
| 真实用户研究                         | 无埋点、无访谈、无任务测试                          | 频次与风险结论基于操作语义和页面角色，已在正文标注                                                             |

### 8.4 剩余问题与风险

1. **1024px 宽表横向滚动仍然存在。** 操作列固定后可用，但滚动到中间时固定列会覆盖相邻列。当前通过加宽“默认”等窄列、避免把必须同时阅读的短标签放在固定列旁边来缓解，没有改 Element Plus 的固定列机制。
2. **固定列宽度是经验值。** 本次按中文标签和内边距实测调整；如果后续增加更长按钮或语言变更，需要重新测量，不能只加 `fixed`。
3. **未做自动化无障碍扫描。** 已检查重点页面的焦点顺序、按钮可访问名称、对比度和 36px 点击区，但没有 axe 等工具的逐页报告。
4. **深色模式未逐页全量截图。** 只对日志、消息等重点页和共享样式做了抽查，其他页面可能存在局部对比度问题。
5. **移动端没有纳入范围。** 项目规范以 ≥1366px 为标准桌面宽度；1024px 是补充边界，更窄宽度需要单独设计。
6. **弹窗固定宽度。** 480–640px 的弹窗在极窄窗口会溢出；本次未改全局弹窗策略。
7. **没有真实用户数据。** 操作分层是保守、可解释的决策，但仍应通过真实使用频率和误操作记录校准。

### 8.5 回归判断

- 页面路由、API 调用、权限规则、表单字段没有因本次视觉修改被删减或改名。
- 操作入口没有丢失：被收起的低频操作都在“更多”菜单中；页面级导入结果从行内移到页头，仍可到达。
- lint 与 build 均通过；最终定向复核无控制台/页面异常。
- 没有可用的历史视觉基线或设计稿，因此无法做像素级前后 diff；本报告的验证以功能可达、布局测量和截图为准。
