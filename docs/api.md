# 学生端档案管理系统 — 后端接口文档

> 生成日期：2026-07-09  
> 前端代码基准：`src/shared/api/` 下各模块的函数注释（后端就绪后替换部分）  
> 类型定义：`src/shared/types/types.ts` 及 `src/features/ai-chat/types.ts`（AI Chat 模块）  
> 响应拦截器约定：`src/shared/api/request.ts`

---

## 〇、通用约定

### 0.1 Base URL

```
开发环境：Vite proxy /api → http://localhost:8080
生产环境：与前端同域 /api
```

### 0.2 请求头

| Header                           | 说明                                                  |
| -------------------------------- | ----------------------------------------------------- |
| `Content-Type: application/json` | 所有 POST/PUT 请求                                    |
| `Authorization: Bearer <token>`  | 登录后的请求自动携带（token 来自 `/auth/login` 返回） |

### 0.3 统一响应格式

```json
{
  "code": 0,        // 0 或 200 表示成功，其余表示失败
  "message": "ok",  // 提示信息
  "data": { ... }   // 业务数据（不同接口结构不同）
}
```

- `code` = `0` 或 `200`：前端视为成功，直接取 `data` 使用
- `code` 为其他值：前端弹窗显示 `message` 并 reject

### 0.4 HTTP 错误码处理

| 状态码 | 前端行为                       |
| ------ | ------------------------------ |
| 401    | 清除 token，跳转 `/login`      |
| 403    | 弹窗提示「没有权限执行此操作」 |
| 429    | 弹窗提示「请求过于频繁」       |
| 500    | 弹窗提示「服务器异常」         |

### 0.5 分页规范

分页请求参数：

```ts
{
  pageNum: number // 页码，从 1 开始
  pageSize: number // 每页条数
}
```

分页响应结构：

```ts
{
  list: T[]        // 数据列表
  total: number    // 总条数
  pageNum: number  // 当前页码
  pageSize: number // 每页条数
}
```

### 0.6 学期格式

所有学期字段统一为 `学年-学年-学期` 格式，如 `2024-2025-1`（第 1 学期即秋季学期）、`2024-2025-2`（第 2 学期即春季学期）。

---

## 一、认证模块 Auth

### 1.1 登录

```
POST /auth/login
```

| 参数      | 类型                   | 必填 | 说明         |
| --------- | ---------------------- | ---- | ------------ |
| username  | string                 | 是   | 学号或用户名 |
| password  | string                 | 是   | 密码         |
| loginType | `'student' \| 'admin'` | 是   | 登录类型     |

**请求示例：**

```json
{
  "username": "2024060001",
  "password": "***",
  "loginType": "student"
}
```

**响应 `data`：**

```ts
{
  token: string
  userInfo: {
    id: string
    username: string
    realName: string
    avatar?: string
    studentId: string
    grade: string
    major: string
    className: string
    email: string
    phone: string
  }
}
```

---

### 1.2 登出

```
POST /auth/logout
```

无请求参数。前端调用后清除本地 token，跳转登录页。

---

## 二、用户模块 User

### 2.1 获取当前用户信息

```
GET /user/info
```

**响应 `data`：** `UserInfo`（结构同 1.1 中的 `userInfo`）

---

### 2.2 更新用户资料

```
PUT /user/info
```

| 参数      | 类型   | 必填 | 说明   |
| --------- | ------ | ---- | ------ |
| realName  | string | 否   | 姓名   |
| studentId | string | 否   | 学号   |
| grade     | string | 否   | 年级   |
| major     | string | 否   | 专业   |
| className | string | 否   | 班级   |
| email     | string | 否   | 邮箱   |
| phone     | string | 否   | 手机号 |

**响应 `data`：** 更新后的 `UserInfo`

---

### 2.3 上传头像

```
POST /user/avatar
```

| 参数   | 类型   | 必填 | 说明                  |
| ------ | ------ | ---- | --------------------- |
| base64 | string | 是   | Base64 编码的头像图片 |

**响应 `data`：** `string` — 头像 URL

---

### 2.4 修改密码

```
PUT /user/password
```

| 参数        | 类型   | 必填 | 说明                |
| ----------- | ------ | ---- | ------------------- |
| oldPassword | string | 是   | 原密码              |
| newPassword | string | 是   | 新密码（至少 6 位） |

无返回数据。

---

### 2.5 文件上传

```
POST /upload
```

**Content-Type**: `multipart/form-data`

| 参数 | 类型 | 必填 | 说明                                |
| ---- | ---- | ---- | ----------------------------------- |
| file | File | 是   | 上传文件（form-data 字段名 `file`） |

**响应 `data`：** `{ url: string }` — 上传后的文件访问 URL

> 前端通过 `useUpload` composable（`src/shared/composables/useUpload.ts`）统一调用，支持进度跟踪和文件校验。

---

## 三、档案模块 Archive

### 3.1 兴趣列表

**查询：** `GET /archive/interests`

**响应 `data`：** `Interest[]`

```ts
interface Interest {
  id: string
  category: string // 分类，如 "编程开发"、"语言能力"
  content: string // 内容描述
  level: string // 掌握程度：proficient / good / general
}
```

**新增：** `POST /archive/interests` — Body: `Omit<Interest, 'id'>`，返回新 `Interest`

**更新：** `PUT /archive/interests/:id` — Body: `Partial<Interest>`，返回更新后的 `Interest`

**删除：** `DELETE /archive/interests/:id`

---

### 3.2 成绩列表

```
GET /archive/grades
```

**响应 `data`：** `Grade[]`

```ts
interface Grade {
  id: string
  semester: string // 如 "2024-2025-1"
  courseName: string // 课程名称
  score: number // 百分制分数
  gpa: number // 绩点
  credits: number // 学分
}
```

> 前端按学期聚合展示（学分加权平均 GPA/均分）。

---

### 3.3 奖项列表

**查询：** `GET /archive/awards`

**响应 `data`：** `Award[]`

```ts
interface Award {
  id: string
  name: string // 奖项名称
  level: string // 级别：national / provincial / school / college
  type: string // 类型：competition / other
  date: string // 获奖日期 yyyy-MM
  prize?: string // 获奖等级文字，如 "一等奖"
  description?: string
  proof?: string // 证明材料 URL
}
```

**新增：** `POST /archive/awards` — Body: `Omit<Award, 'id'>`，返回新 `Award`

**更新：** `PUT /archive/awards/:id` — Body: `Partial<Award>`，返回更新后的 `Award`

**删除：** `DELETE /archive/awards/:id`

---

### 3.4 多维度画像

```
GET /archive/dimensions
```

**响应 `data`：** `ProfileDimension[]`

```ts
interface ProfileDimension {
  label: string // 维度名称，如 "学业成绩"、"竞赛实践"
  current: number // 当前分数
  target: number // 目标分数
  previous: number // 上一阶段分数
}
```

> 目前 5 个维度：学业成绩 / 竞赛实践 / 科研创新 / 社会工作 / 综合素质。  
> color 由前端按主题（light/dark）派生，后端无需返回。

---

### 3.5 成长时间轴

```
GET /archive/timeline
```

**响应 `data`：** `TimelineNode[]`

```ts
interface TimelineNode {
  id: string
  semester: string // 学期
  type: 'award' | 'practice' | 'grade' | 'competition' | 'internship' | 'other'
  title: string
  description: string
  date: string // yyyy-MM
  recordId?: string // 关联记录 ID，用于点击跳转
}
```

---

### 3.6 添加时间轴事件（成长经历）

```
POST /archive/timeline
```

| 参数        | 类型   | 必填 | 说明                                                        |
| ----------- | ------ | ---- | ----------------------------------------------------------- |
| semester    | string | 是   | 学期                                                        |
| type        | string | 是   | award / practice / grade / competition / internship / other |
| title       | string | 是   | 事件标题                                                    |
| description | string | 是   | 事件描述                                                    |
| date        | string | 是   | 日期 yyyy-MM                                                |

**响应 `data`：** `TimelineNode`

---

## 四、提交记录模块 Submission

### 4.1 提交申报申请

```
POST /submissions
```

Body: 包含所有表单字段的 JSON 对象（`{ type, typeLabel, ...formData }`），后端将状态置为 `submitted`。

**响应 `data`：** `SubmissionRecord`

---

### 4.2 查询提交记录

```
GET /submissions
```

**查询参数（Query）：**

| 参数      | 类型     | 必填 | 说明                                    |
| --------- | -------- | ---- | --------------------------------------- |
| keyword   | string   | 否   | 搜索关键词（匹配 title/typeLabel）      |
| type      | string   | 否   | 申报类型，见下方 ApplicationType 枚举   |
| status    | string   | 否   | 状态：submitted / approved / rejected   |
| dateRange | string[] | 否   | 日期范围 `["yyyy-MM-dd", "yyyy-MM-dd"]` |

**响应 `data`：** `SubmissionRecord[]`

```ts
interface SubmissionRecord {
  id: string
  type: ApplicationType // 申报类型
  typeLabel: string // 中文类型名
  title: string // 标题
  submitDate: string // 提交日期 yyyy-MM-dd
  semester: string // 学期
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  sourcePath: string // 详情页路径，前端用于跳转
}
```

**ApplicationType 枚举：**

```
competition  | innovation | research    | scholarship | certificate
internship   | organization | training  | socialPractice | bookReport
competitionStar | innovationStar | scientificProject | softwareCopyright | paper
```

---

### 4.3 撤回提交

```
POST /submissions/:id/withdraw
```

将指定记录状态改为 `draft`。无请求体。无返回数据。

---

## 五、消息通知模块 Notification

### 5.1 查询通知列表

```
GET /notifications
```

**查询参数（Query）：**

| 参数     | 类型   | 必填 | 说明                                   |
| -------- | ------ | ---- | -------------------------------------- |
| keyword  | string | 否   | 搜索标题/内容                          |
| category | string | 否   | system / approval / activity / message |
| status   | string | 否   | read / unread                          |

**响应 `data`：** `Notification[]`

```ts
interface Notification {
  id: string
  title: string
  content: string
  category: 'system' | 'approval' | 'activity' | 'message'
  status: 'read' | 'unread'
  isRead: boolean
  createdAt: string // yyyy-MM-dd HH:mm
  link?: string // 点击跳转路径
  sender?: string // 发送者
}
```

---

### 5.2 标记已读

**单条：** `PUT /notifications/:id/read`  
**全部：** `PUT /notifications/read-all`

均无请求体，无返回数据。

---

### 5.3 删除通知

```
DELETE /notifications/:id
```

无返回数据。

---

## 六、动态记录模块 Activity

### 6.1 查询动态列表

```
GET /activities
```

**查询参数（Query）：**

| 参数    | 类型   | 必填 | 说明                            |
| ------- | ------ | ---- | ------------------------------- |
| keyword | string | 否   | 搜索关键词                      |
| status  | string | 否   | submitted / approved / rejected |

**响应 `data`：** `Activity[]`

```ts
interface Activity {
  id: string
  type: 'draft' | 'submitted' | 'approved' | 'rejected'
  text: string // 动态内容
  time: string // yyyy-MM-dd HH:mm
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
}
```

---

### 6.2 更新动态

```
PUT /activities/:id
```

Body: 更新的字段（如 `{ text: string }`）。

> 前端侧约束：`approved` 状态的动态不可修改。

---

### 6.3 删除动态

```
DELETE /activities/:id
```

> 前端侧约束：`approved` 状态的动态不可删除。

---

## 七、职业规划模块 Career Plan

### 7.1 查询职业规划列表

```
GET /career-plan
```

**响应 `data`：** `CareerPlanRecord[]`

```ts
interface CareerPlanRecord {
  id: string
  semester: string // 学期
  title: string // 规划标题
  submitDate: string // 提交日期 yyyy-MM-dd
  status: 'draft' | 'submitted'
}
```

---

### 7.2 提交职业规划

```
POST /career-plan
```

| 参数     | 类型   | 必填 | 说明     |
| -------- | ------ | ---- | -------- |
| semester | string | 是   | 学期     |
| title    | string | 是   | 规划标题 |

**响应 `data`：** 新创建的 `CareerPlanRecord`

---

## 八、申报审核模块 Review

### 8.1 查询全部审核列表

```
GET /reviews
```

**查询参数（Query）：**

| 参数      | 类型     | 必填 | 说明                                    |
| --------- | -------- | ---- | --------------------------------------- |
| keyword   | string   | 否   | 搜索关键词                              |
| type      | string   | 否   | 申报类型（ApplicationType 枚举值）      |
| status    | string   | 否   | submitted / approved / rejected         |
| dateRange | string[] | 否   | 日期范围 `["yyyy-MM-dd", "yyyy-MM-dd"]` |

**响应 `data`：** `ReviewRecord[]`

```ts
interface ReviewRecord {
  id: string
  type: string // 申报类型
  typeLabel: string // 中文类型名
  title: string // 标题
  submitDate: string // 提交日期 yyyy-MM-dd
  semester: string // 学期
  status: string // draft / submitted / approved / rejected
  proofMaterials: string[] // 证明材料 URL 列表
  // 以下为各类型特有字段，按需返回
  [key: string]: any
}
```

> 查询时后端自动过滤 `status === 'draft'` 的记录（审核页不展示草稿）。

---

### 8.2 按类型查询审核列表

```
GET /reviews/:type
```

路径参数 `:type` 取 ApplicationType 枚举值（如 `competition`、`innovation` 等）。

**查询参数（Query）：** 同 8.1，按需传类型特有字段过滤。

**响应 `data`：** `ReviewRecord[]`

---

### 8.3 重新提交审核

```
PUT /reviews/:id/resubmit
```

用户在审核页编辑后重新提交。Body 为修改后的字段集合（`Record<string, any>`），后端将状态置为 `submitted`。

**响应 `data`：** 更新后的 `ReviewRecord`

---

## 九、奖项审核模块 Award Review

### 9.1 查询奖项审核列表

```
GET /award-reviews
```

**查询参数（Query）：**

| 参数 | 类型   | 必填 | 说明                                                                                                                          |
| ---- | ------ | ---- | ----------------------------------------------------------------------------------------------------------------------------- |
| type | string | 否   | competitionStar / innovationStar / scientificStar（scientificStar 包含 scientificProject + softwareCopyright + paper 子类型） |

**响应 `data`：** `StarRecord[]`

```ts
interface StarRecord {
  id: string
  type: string // competitionStar | scientificProject | softwareCopyright | paper | innovationStar
  typeLabel: string // 中文类型名，如 "竞赛之星报名"
  title: string
  submitDate: string
  semester: string
  status: string // draft / submitted / approved / rejected
  sourcePath: string
  applicant: string // 报名人姓名

  // ── 竞赛之星 ──
  competitionName?: string
  competitionDate?: string
  competitionLevel?: string // national / provincial / school
  awardLevel?: string // first / second / third / excellent

  // ── 科研项目 ──
  projectName?: string
  projectLevel?: string // national / provincial / school

  // ── 软著 ──
  softName?: string
  issuer?: string

  // ── 论文 ──
  paperName?: string
  journalName?: string

  // ── 公共 ──
  ranking?: string // 排名，如 "1/3"
  projectDate?: string
  approveDate?: string
  publishDate?: string

  // ── 双创之星 ──
  companyName?: string
  industryType?: string // it / media / finance / ...
  registerDate?: string
}
```

---

### 9.2 重新提交奖项审核

```
PUT /award-reviews/:id/resubmit
```

用户在奖项审核页编辑后重新提交。Body 为修改后的字段集合，后端将状态置为 `submitted`。

**响应 `data`：** 更新后的 `StarRecord`

---

## 十、接口汇总

| 模块         | 方法   | 路径                          | 说明                   |
| ------------ | ------ | ----------------------------- | ---------------------- |
| Auth         | POST   | `/auth/login`                 | 登录                   |
| Auth         | POST   | `/auth/logout`                | 登出                   |
| User         | GET    | `/user/info`                  | 获取用户信息           |
| User         | PUT    | `/user/info`                  | 更新用户资料           |
| User         | POST   | `/user/avatar`                | 上传头像               |
| User         | PUT    | `/user/password`              | 修改密码               |
| User         | POST   | `/upload`                     | 文件上传               |
| Archive      | GET    | `/archive/interests`          | 兴趣列表               |
| Archive      | POST   | `/archive/interests`          | 新增兴趣               |
| Archive      | PUT    | `/archive/interests/:id`      | 更新兴趣               |
| Archive      | DELETE | `/archive/interests/:id`      | 删除兴趣               |
| Archive      | GET    | `/archive/grades`             | 成绩列表               |
| Archive      | GET    | `/archive/awards`             | 奖项列表               |
| Archive      | POST   | `/archive/awards`             | 新增奖项               |
| Archive      | PUT    | `/archive/awards/:id`         | 更新奖项               |
| Archive      | DELETE | `/archive/awards/:id`         | 删除奖项               |
| Archive      | GET    | `/archive/dimensions`         | 多维度画像             |
| Archive      | GET    | `/archive/timeline`           | 成长时间轴             |
| Archive      | POST   | `/archive/timeline`           | 添加时间轴事件         |
| Archive      | DELETE | `/archive/timeline/:id`       | 删除时间轴事件         |
| Submission   | POST   | `/submissions`                | 提交申报申请           |
| Submission   | GET    | `/submissions`                | 提交记录列表           |
| Submission   | POST   | `/submissions/:id/withdraw`   | 撤回提交               |
| Notification | GET    | `/notifications`              | 通知列表               |
| Notification | PUT    | `/notifications/:id/read`     | 标记单条已读           |
| Notification | PUT    | `/notifications/read-all`     | 全部已读               |
| Notification | DELETE | `/notifications/:id`          | 删除通知               |
| Activity     | GET    | `/activities`                 | 动态列表               |
| Activity     | PUT    | `/activities/:id`             | 更新动态               |
| Activity     | DELETE | `/activities/:id`             | 删除动态               |
| Career Plan  | GET    | `/career-plan`                | 职业规划列表           |
| Career Plan  | POST   | `/career-plan`                | 提交职业规划           |
| Review       | GET    | `/reviews`                    | 申报审核列表（全部）   |
| Review       | GET    | `/reviews/:type`              | 申报审核列表（按类型） |
| Review       | PUT    | `/reviews/:id/resubmit`       | 重新提交审核           |
| Award Review | GET    | `/award-reviews`              | 奖项审核列表           |
| Award Review | PUT    | `/award-reviews/:id/resubmit` | 重新提交奖项审核       |
| AI Chat      | GET    | `/ai/quick-questions`         | 快捷问题列表（可选）   |
| AI Chat      | POST   | `/ai/chat`                    | 发送消息，获取 AI 回复 |
| AI Chat      | POST   | `/ai/feedback`                | 消息反馈上报           |
| AI Chat      | GET    | `/ai/conversations`           | 对话历史列表           |
| AI Chat      | GET    | `/ai/conversations/:id`       | 对话详情               |
| AI Chat      | POST   | `/ai/conversations`           | 创建新对话             |
| AI Chat      | DELETE | `/ai/conversations/:id`       | 删除对话               |

**共计 10 个模块，39 个接口。**

---

## 十一、AI 助手模块 AI Chat

> **快速开发指引**：本节是所有模块中最晚确定的方向性接口。其中 AI 对话接口为核心；对话历史、反馈为辅助；快捷问题接口可选。建议迭代优先级：`/ai/chat` → `/ai/conversations` → `/ai/feedback` → `/ai/quick-questions`。

### 11.1 快捷问题列表（可选）

```
GET /ai/quick-questions
```

**说明**：前端已硬编码 6 条 FAQ 快捷问题（`src/features/ai-chat/data/quickQuestions.ts`），如需动态配置可启用此接口。

**响应 `data`：** `QuickQuestion[]`

```ts
interface QuickQuestion {
  label: string // 显示文案，如 "如何填写个人档案信息？"
  question: string // 点击后发送的提问
  icon: string // 图标标识，如 "file"、"award"、"timeline"
}
```

---

### 11.2 发送消息（核心 AI 对话）

```
POST /ai/chat
```

| 参数           | 类型   | 必填 | 说明                                  |
| -------------- | ------ | ---- | ------------------------------------- |
| message        | string | 是   | 用户消息文本                          |
| conversationId | string | 否   | 对话 ID（新对话不传，后端创建后返回） |
| context        | object | 否   | 上下文信息（学期、当前页面等）        |

**响应 `data`：**

```ts
{
  message: {
    id: string
    role: 'ai'
    content: string             // 纯文本摘要（用于导出/抽屉预览）
    time: string                // HH:mm
    richContent?: {             // 结构化富文本（独立页渲染用）
      greeting?: string         // 标题问候语
      blocks: Array<
        | { type: 'paragraph'; text: string; highlights?: string[] }
        | { type: 'list'; items: Array<{ strong?: string; text: string }> }
        | { type: 'steps'; items: Array<{ num: number; strong: string; text: string }> }
        | { type: 'card'; title: string; icon?: 'info' | 'shield' | 'clock' | 'success'; body: string; highlights?: string[] }
      >
    }
  }
  conversationId: string        // 所属对话 ID（新对话时返回）
}
```

> 富文本块（richContent.blocks）的前端渲染逻辑在 `RichContentRenderer.vue` 中，支持段落高亮、列表、步骤引导、信息卡片四种形态。后端可返回其中一种或多种组合。

---

### 11.3 消息反馈上报

```
POST /ai/feedback
```

| 参数           | 类型                    | 必填 | 说明        |
| -------------- | ----------------------- | ---- | ----------- |
| messageId      | string                  | 是   | AI 消息 ID  |
| feedback       | `'useful' \| 'useless'` | 是   | 用户反馈    |
| conversationId | string                  | 否   | 所属对话 ID |

无返回数据。

---

### 11.4 对话历史管理

**查询列表：** `GET /ai/conversations`

**响应 `data`：** `ConversationSummary[]`

```ts
interface ConversationSummary {
  id: string
  title: string // 对话标题（首条用户消息截取）
  createTime: string // 创建时间 yyyy-MM-dd HH:mm
  messageCount: number
}
```

**查询详情：** `GET /ai/conversations/:id`

**响应 `data`：**

```ts
{
  id: string
  title: string
  messages: ChatMessage[]   // 完整消息列表（含 user 和 ai 角色）
  createTime: string
}
```

**创建新对话：** `POST /ai/conversations` — Body: `{ title?: string }`，返回 `ConversationSummary`

**删除对话：** `DELETE /ai/conversations/:id`
