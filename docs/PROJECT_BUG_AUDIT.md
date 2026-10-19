# 学生档案管理系统 · 功能与 Bug 审计报告

- **审计日期**：2026-10-19
- **项目范围**：`frontend/`（Vue 3 + Vite + TypeScript + Pinia + Element Plus）、`backend/`（Spring Boot 3.3，仅阅读用于核对契约）
- **角色范围**：学生端、教师端、管理端
- **审计方式**：前端源码与调用链检查 → 后端 Controller/Service/DTO 契约核对 → 真实登录 token 的 curl 探针 → Playwright 浏览器流程验证 → 构建、Lint、E2E 回归
- **改动边界**：**本轮只修改前端代码，未修改任何后端 Java 源码、数据库结构或权限规则。** 后端源码只作为接口契约的依据读取。历史任务中新增的 `backend/seed_teacher_admin_pages.sql` 是演示数据脚本，不属于本轮代码改动，予以保留。

> 审计原则：先复现、再定位根因、再修复；不通过删除功能、吞异常、伪造成功响应或写死数据来"让检查通过"。无法确认的业务规则标记为"待验证/待产品确认"。

---

## 一、项目结构与审计范围

### 1.1 前端结构

| 层级                | 位置                             | 说明                                                                                      |
| ------------------- | -------------------------------- | ----------------------------------------------------------------------------------------- |
| 应用入口/路由       | `src/app/`                       | 路由守卫、布局（学生/教师/管理员共用教师外壳）、Pinia stores                              |
| 业务页面            | `src/features/`                  | 登录、首页、档案概览、申报、奖项、成长时间轴、职业规划、消息、AI 助手、教师端与管理端页面 |
| 接口层              | `src/shared/api/`                | 17 个 API 模块，统一 axios 封装与响应解包                                                 |
| 共享组件/组合式函数 | `src/shared/ui/`、`composables/` | 表单记录、草稿、上传、文件预览等                                                          |
| E2E                 | `tests/e2e/`                     | 学生/教师登录、核心页冒烟、画像卡片                                                       |

### 1.2 后端结构（只读核对）

- 55 个 Controller，共 268 个路由（`@RequestMapping` 前缀 + 方法级映射）。
- 全局 context-path：`/api/v1`；前端 `baseURL` 同为 `/api/v1`，无前缀错位。
- 鉴权：JWT + `tokenVersion`；登录/刷新/权限码由 `AuthController`、`AdminAuthService` 等实现。

### 1.3 本轮使用的 Skill 及实际用法

三个 Skill 均真实存在并已阅读其 `SKILL.md`：

| Skill             | 位置                                        | 实际应用                                                                                                                                               |
| ----------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `diagnosing-bugs` | `~/.claude/skills/diagnosing-bugs/SKILL.md` | 按"复现 → 证据 → 根因 → 最小修复 → 回归"执行；例如成长时间轴先由浏览器复现后端报错，再定位到后端 `validateSourceRequired` 与前端未传字段，而不是猜字段 |
| `ui-ux-pro-max`   | `~/.claude/skills/ui-ux-pro-max/SKILL.md`   | 检查弹窗 Loading/禁用态、空态、必填提示、失败后输入保留；未做视觉重设计                                                                                |
| `humanizer`       | `~/.claude/skills/humanizer/SKILL.md`       | 只审查本轮新增/修改文案，修正一处生硬表达，未机械改写全站文字                                                                                          |

---

## 二、前后端接口完整性对照

### 2.1 总量与映射结果

| 指标                       | 数值               | 说明                                                                                                                                                                                                  |
| -------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 前端 `request.*` 调用点    | 275 处             | 含多行链式调用、Blob 下载辅助函数                                                                                                                                                                     |
| 前端唯一接口               | 242 个（归一化后） | `${id}`、`{id}` 均归一为 `{}`                                                                                                                                                                         |
| 后端路由                   | 268 个             | 55 个 Controller                                                                                                                                                                                      |
| 前端调用 → 后端实现        | 均能对应到后端实现 | 241/268 个后端路由可静态匹配到前端调用；1 个前端动态路径（科研之星子资源）展开为 3 个后端接口；10 个申报提交端点由 `APPLICATION_CONTRACTS.endpoint` 动态生成。附录 A 共 273 行、271 个不同"方法+路径" |
| 后端有实现、前端无直接调用 | 27 个              | 其中 10 个为申报提交动态端点，实际已被前端使用；剩余 17 个待产品确认是否接入                                                                                                                          |

### 2.2 本轮确认的契约问题

| 接口                                          | 后端实际契约                                                                                                         | 前端原实现                                                       | 结论                                                               |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| `GET /applications/{type}/guide`              | 返回 `archiveType/typeName/evaluateDesc/evaluateRequirements/evaluateNotes/applyDesc/icon`；后两项是 **JSON 字符串** | 按 `title/content/requirements/notes` 读取，导致评选说明弹窗空白 | 已修复：前端统一归一化，兼容原始 JSON 字符串，并补"申报说明"与空态 |
| `GET /awards/{type}/guide`                    | 返回已解析的 `requirements/notes` 数组                                                                               | 已按该结构读取                                                   | 已验证正确（三类奖项 curl 实测）                                   |
| `POST /profile/growth-timeline`               | 强制 `sourceType + sourceId`；`abilityData.dimensionCode` 必填；同一来源唯一                                         | 表单允许不选来源、能力只传名称；刷新后能力丢失                   | 已修复：来源必选、维度下拉、提交 `abilityData`                     |
| `PUT /profile/contact`                        | 六个字段整体覆盖且全部 `@NotNull`                                                                                    | 只提交邮箱/手机号                                                | 已修复：提交邮箱、手机号、地址、紧急联系人姓名/关系/电话           |
| `GET /activities`                             | Spring 按 JavaBean `perPage` 绑定；`@JsonProperty("per_page")` 只影响 JSON，不影响 query                             | 两处调用传 `per_page`，被静默忽略并回落 20 条                    | 已修复：统一传 `perPage`；表单记录页分页拉全量                     |
| `GET /teacher/archives` 等教师/管理端分页接口 | Controller 显式声明 `@RequestParam("per_page")`                                                                      | 前端传 `per_page`                                                | 一致，无需修改（已用 curl 实测 `per_page=1` 返回 1 条）            |

> 结论：不能因为"URL 能调通"就认为契约正确。本次实际发现并修复了字段名、必填字段、分页参数、动态来源四类契约问题。

### 2.3 后端已实现、前端未直接调用的 17 个端点

以下端点在后端存在，但前端 `src/shared/api` 中没有调用点。它们不一定是 Bug，需产品确认是"功能未做"还是"端点冗余"：

| 方法   | 路径                                         | 后端实现                                        | 备注                                       |
| ------ | -------------------------------------------- | ----------------------------------------------- | ------------------------------------------ |
| GET    | `/admin/archives/{archiveId}`                | `AdminArchiveController#archiveDetail`          | 管理端档案详情；当前页面走教师端详情       |
| PUT    | `/admin/profile/contact`                     | `AdminProfileController#updateContact`          | 管理员个人资料页未做                       |
| POST   | `/admin/scores/recalculate`                  | `AdminScoreController#triggerRecalculate`       | 管理端独立重算；教师端已有重算             |
| GET    | `/admin/scores/recalculation-tasks/{taskId}` | `AdminScoreController#getRecalculationTask`     | 同上                                       |
| GET    | `/admin/statistics/overview`                 | `AdminStatisticsController#overview`            | 管理端概览                                 |
| POST   | `/admin/users/import`                        | `AdminUserImportController#importUsers`         | 用户批量导入未接入                         |
| GET    | `/admin/users/import-template`               | `AdminUserImportController#importTemplate`      | 同上                                       |
| GET    | `/common/form-templates`                     | `CommonController#getFormTemplate`              | 公共表单模板                               |
| GET    | `/common/dict/batch`                         | `CommonController#getDicts`                     | 批量字典                                   |
| GET    | `/messages/unified`                          | `MessageUnifiedController#listMessages`         | 统一消息聚合，当前使用 `/messages`         |
| POST   | `/profile/career-plans/ai-suggestions`       | `ProfileCareerPlanController#saveAiSuggestion`  | 保存 AI 建议                               |
| DELETE | `/profile/career-plans/{planId}`             | `ProfileCareerPlanController#deletePlan`        | **职业规划删除入口未接**，用户无法删除规划 |
| PUT    | `/teacher/profile/contact`                   | `TeacherProfileController#updateContact`        | 教师个人资料页未做                         |
| GET    | `/admin/semesters/import-records`            | `AdminSemesterController#listImportRecords`     | 学期导入记录                               |
| POST   | `/teacher/audits/{taskId}/transfer`          | `TeacherAuditController#transfer`               | 审核转交；当前用审批委托                   |
| GET    | `/teacher/students`                          | `TeacherStudentManageController#listStudents`   | 教师学生管理列表未接                       |
| GET    | `/teacher/students/{studentId}/activities`   | `TeacherStudentManageController#listActivities` | 同上                                       |

### 2.4 完整接口对照表

完整逐接口对照见 **附录 A**（273 行，按前端 API 模块分组）。状态说明：

- **已验证正确**：本轮用 curl/浏览器实际请求并确认业务结果。
- **存在问题（前端已修复）**：契约或调用方式有误，已在前端修复；是否回归见"验证证据"列。
- **待验证**：路径/方法与后端实现静态匹配，字段经代码核对，但未逐接口发真实请求。
- **后端代码不可见**：本次不适用（后端源码完整可见）。

---

## 三、Bug 清单（按严重级别）

### 3.1 总表

| ID   | 级别 | 问题                                                           | 复现/证据                                                                                                                                 | 根因                                                           | 影响                                       | 状态                                                                               |
| ---- | ---- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------- |
| B-01 | P1   | 档案"评选说明"弹窗总是空白                                     | `GET /applications/scholarship/guide` 实测返回 `evaluateDesc/evaluateRequirements/...`；前端旧模型读取 `title/content/requirements/notes` | 前后端字段模型不一致，且后端返回原始 JSON 字符串               | 用户看不到评选条件，可能按错误要求申报     | 已修复；配置为空时有明确空态                                                       |
| B-02 | P1   | 成长时间轴"能力成长"保存后丢失                                 | 浏览器首次运行结果为 `abilityData` 为空；刷新后能力项消失                                                                                 | 前端表单未把能力项映射为后端 `abilityData.dimensionCode/score` | 用户以为已记录成长，实际未落库             | 已修复；Playwright 实测请求体含 `abilityData`，保存成功                            |
| B-03 | P1   | 成长经历提交报"必须关联已有来源记录"                           | 浏览器实测后端返回 `20001/10001：必须关联已有的来源记录，需同时提供来源类型(sourceType)和来源ID(sourceId)`                                | 后端强制来源必填，前端表单却允许不选来源直接提交               | 用户无法新增成长经历                       | 已修复；来源下拉必选、无来源时禁用提交；Playwright 实测保存成功                    |
| B-04 | P1   | 成长经历保存失败时页面仍显示成功记录                           | 用 Playwright 拦截 POST 返回 500：弹窗保持打开、标题保留、列表未出现伪记录                                                                | 原实现先乐观写入本地列表，失败后未撤回                         | 刷新后记录消失，属于"假成功"               | 已修复并验证                                                                       |
| B-05 | P1   | 档案概览"编辑联系信息"保存必失败                               | 后端返回 `10001：通讯地址不能为空；紧急联系人电话/姓名/关系不能为空`                                                                      | 后端六字段整体覆盖且均必填，前端只提交邮箱/手机号              | 用户无法保存联系方式                       | 已修复；Playwright 实测六字段提交返回"更新成功"                                    |
| B-06 | P1   | 教师账号在身份缓存缺失时可打开学生页                           | 浏览器实测：教师登录后删除 `user_info_cache`，访问 `/profile/info` 仍停留在该页并渲染"档案概览"                                           | 学生端守卫在无缓存时 fail-open，仅缓存明确为 teacher 才拦截    | 跨端页面混用，教师外壳渲染学生数据         | 已修复；教师无缓存访问学生页被重定向到 `/teacher/dashboard`，学生正常停留          |
| B-07 | P2   | 换账号后可能读到上一个账号的草稿/撤回标记                      | 静态检查：草稿 key、撤回 ID key 原为全局 key                                                                                              | localStorage 内容未按用户隔离                                  | 同一浏览器换账号后数据串号                 | 已修复：统一按 `user_info_cache.id` 加作用域；登出整页刷新清空 Pinia               |
| B-08 | P2   | 申报记录/首页动态最多只拿到 20 条                              | curl 实测 `/activities?page=1&per_page=2` 返回 20 条、分页元数据 `per_page:20`；`perPage=2` 返回 2 条                                     | 后端按 `perPage` 绑定，`per_page` 被忽略                       | 记录多于 20 条时列表/导出聚合不完整        | 已修复：`useFormRecords` 分页拉全量；`activity.ts` 改 `perPage`                    |
| B-09 | P2   | 申报记录与奖项报名 ID 相同时选错来源                           | 静态检查：`sourceId` 仅用数字 ID，两个来源表 ID 可重复                                                                                    | 前端用 `id` 作为下拉唯一键                                     | 关联到错误的申报/奖项                      | 已修复：改用 `sourceType:id` 复合键                                                |
| B-10 | P2   | 未选来源时提交按钮一直 Loading                                 | 代码检查：`submitting=true` 在来源校验之前，校验失败直接 return                                                                           | 状态设置顺序错误                                               | 按钮卡死，只能关闭弹窗重开                 | 已修复：校验通过后再置 Loading                                                     |
| B-11 | P2   | 登出/切换学生端后仍保留上一账号的 Pinia 业务数据               | 代码检查：登出只清 token/缓存，未清 store 内存；切换端仅做路由跳转                                                                        | SPA 内存状态未随身份重置                                       | 极端情况下短暂显示上一账号数据             | 已修复：登出与切换角色改为整页跳转登录页                                           |
| B-12 | P2   | 档案评选说明无数据（`archive_type_configs` 为空）              | SQL 实测 `SELECT COUNT(*) = 0`；接口返回所有说明字段为 `null`                                                                             | 数据库未配置档案类型评选说明                                   | 所有档案类型都看不到评选条件               | 已缓解：前端展示"暂无评选说明，请联系管理员补充"；**未伪造数据**，配置需管理员补齐 |
| B-13 | P2   | "同步数据来源"会生成本地编造的能力分数且不落库                 | 静态检查：`inferSkillsByType` 按类型写死 55–80 分；新增经历只进 `localExperiences`                                                        | 该功能是前端本地拼装，未调用后端持久化                         | 用户看到的能力分数并非真实数据，刷新后消失 | **未修改**，需产品确认同步规则后再接后端                                           |
| B-14 | P2   | 联系信息编辑必须重填脱敏的邮箱/手机号/紧急电话                 | `GET /profile/info` 对三项做掩码；`PUT /profile/contact` 六字段必填                                                                       | 后端自助查看也脱敏，整体覆盖保存                               | 每次编辑都要重新输入三项，体验不佳         | 已缓解：表单明确提示"保存前请重新填写这三项"；是否放开自助查看需后端/产品确认      |
| B-15 | P3   | 教师端/管理端部分后端能力未接入                                | 见 §2.3 的 17 个端点                                                                                                                      | 功能未开发或端点冗余                                           | 相关入口不存在，非报错型缺陷               | 待产品确认                                                                         |
| B-16 | P3   | 构建主包 850 KB，超过 Vite 500 KB 警告阈值                     | `npm run build` 输出                                                                                                                      | 第三方库+页面未进一步拆包                                      | 首屏加载偏慢                               | 未修改，属性能优化项                                                               |
| B-17 | P3   | AI 助手后端不可用时回退本地模拟回复                            | 代码检查：`requestOfflineReply`，消息带 `offline: true`                                                                                   | 离线兜底设计                                                   | 离线回复不是真实 AI 结果                   | 保留；已在界面标注"离线模式"，不视为伪造成功                                       |
| B-18 | P3   | 无用代码 `archiveStore.syncFromSubmissions` 写死奖项级别与学期 | 静态检查：`level:'school'`、`semester:'2024-2025-1'`，且无调用方                                                                          | 历史遗留                                                       | 误用会生成错误数据                         | 未删除；建议后续清理，避免被误接                                                   |

### 3.2 重点问题说明

#### B-01 评选说明契约不一致

后端 `ApplicationService.getGuide()` 直接返回配置表字段：

```java
.evaluateDesc(config != null ? config.getEvaluateDesc() : null)
.evaluateRequirements(config != null ? config.getEvaluateRequirements() : null)
.evaluateNotes(config != null ? config.getEvaluateNotes() : null)
.applyDesc(config != null ? config.getApplyDesc() : null)
```

而配置表的 `evaluate_requirements`、`evaluate_notes` 是 JSON 列，接口返回的是字符串。前端原 `ApplicationGuide` 类型按奖项接口的结构（`title/content/requirements/notes`）读取，导致弹窗没有任何内容。

修复方式（只改前端）：

- `applications.ts` 中 `getApplicationGuide` 做归一化：解析 JSON 字符串、映射 `evaluateDesc → content`、`typeName → typeLabel`、`applyDesc`；
- `ApplicationFormRecord.vue` 增加"申报说明"区块，并在所有字段为空时展示明确空态，而不是空白弹窗。

#### B-02/B-03/B-04 成长时间轴

后端 `ProfileGrowthTimelineService` 在 `create` 中依次执行：

1. `validateSourceRequired(sourceType, sourceId)`：来源必填；
2. `validateSourceRecord(...)`：来源必须存在且归属本人；
3. `checkSourceUnique(...)`：同一来源只能关联一次；
4. `abilityData` 中的 `dimensionCode` 必填。

前端修复：

- 打开弹窗时并行加载 `GET /archive/dimensions`，能力项改为维度下拉，提交时映射为 `abilityData: [{ dimensionCode, score }]`；
- 来源下拉改为必选，选项来自已提交/待审核的申报与报名记录；用 `sourceType:id` 复合键避免 ID 冲突；
- 无来源时禁用"确定"；保存失败时撤回乐观记录、保留弹窗和输入内容；
- 修复未选来源时按钮卡 Loading 的顺序问题。

#### B-06 路由守卫 fail-open

原守卫逻辑只有 `user_info_cache` 存在时才判断 `loginType`；缓存不存在时直接放行。复现步骤：

1. 教师登录；
2. 手动删除 `localStorage.user_info_cache`；
3. 访问 `/profile/info` → 页面停留在学生端并渲染。

修复：新增 `resolveLoginType()`。缓存存在时直接使用；缺失时用 `GET /auth/me` 的 `roles` 回源并补写最小身份缓存；无法判定时跳转登录页。已验证教师被重定向到 `/teacher/dashboard`，学生仍可访问 `/profile/info`。

---

## 四、关键业务流程验证

### 4.1 学生端

| 流程               | 操作                                                                                                                                                                            | 结果                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 登录               | 学生 `202401002 / 123456`，Playwright + curl                                                                                                                                    | 成功进入学生首页                                                                                     |
| 核心页             | 首页、成长时间轴、档案概览、申报、消息、审批看板                                                                                                                                | E2E 20/20 中 7 条学生用例全部通过                                                                    |
| 成长时间轴新增     | 填写标题/日期/维度/来源，提交                                                                                                                                                   | 请求体含 `abilityData:[{dimensionCode:"practice",score:0}]` 与 `sourceId/sourceType`，返回"新增成功" |
| 成长时间轴失败回滚 | 拦截 POST 返回 500                                                                                                                                                              | 弹窗保持打开、标题保留、列表无伪记录                                                                 |
| 成长时间轴删除     | 调用 DELETE 清理测试记录                                                                                                                                                        | HTTP 200                                                                                             |
| 档案概览联系信息   | 六字段提交                                                                                                                                                                      | 返回"更新成功"                                                                                       |
| 关键 GET           | `/home/dashboard`、`/profile/scores`、`/profile/data-completeness`、`/profile/career-plans`、`/awards/overview`、`/messages`、`/profile/growth-timeline`、`/archive/dimensions` | 均 `code=0`                                                                                          |

### 4.2 教师端

| 流程     | 操作                                                                                                                                                                    | 结果                                                                        |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 登录     | `T00003 / 123456`                                                                                                                                                       | 成功，`loginType=teacher` 缓存正确                                          |
| 核心页   | 首页、档案查看、评分重算、材料审核、审批委托、消息中心                                                                                                                  | E2E 6 条教师冒烟全部通过                                                    |
| 关键 GET | `/teacher/dashboard`、`/teacher/archives`、`/teacher/audits/pending`、`/teacher/delegations`、`/teacher/statistics/dashboard`、`/teacher/messages`、`/teacher/students` | 均 `code=0`                                                                 |
| 分页参数 | `/teacher/archives?per_page=1` vs `perPage=1`                                                                                                                           | `per_page=1` 返回 1 条，`perPage=1` 回落 20 条；证明该接口契约是 `per_page` |
| 守卫     | 删除身份缓存后访问学生页                                                                                                                                                | 重定向到 `/teacher/dashboard`                                               |

### 4.3 管理端

| 流程     | 操作                                                                                                                                                      | 结果                                   |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| 登录     | `A00001 / 123456`                                                                                                                                         | 成功（`loginType=admin`）              |
| 关键 GET | `/auth/me`、`/admin/statistics/dashboard`、`/admin/users`、`/admin/roles`、`/admin/settings`、`/admin/logs/system`、`/admin/archives`、`/admin/semesters` | 均 `code=0`                            |
| 页面数据 | 使用 `backend/seed_teacher_admin_pages.sql` 预置的演示数据                                                                                                | 教师/管理端主要页面有 1–2 条数据可展示 |

> 说明：管理端页面冒烟以真实接口 `code=0` 为准，未对所有写操作做批量执行，避免污染演示数据。

---

## 五、构建、测试与浏览器验证结果

### 5.1 静态检查与构建

| 命令                 | 结果                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| `npm run lint:check` | 通过（`eslint . --max-warnings 0`，无错误/警告）                                                  |
| `npm run build`      | 通过；主包 `index-*.js` 850.50 KB（gzip 294.75 KB），Vite 提示超过 500 KB，仅性能提示，不阻断构建 |
| `npm run test:e2e`   | **20/20 通过**（学生 7、教师 7、画像 4、登录 2），耗时约 30 s                                     |

### 5.2 定向浏览器验证（临时脚本，验证后已删除）

| 检查                         | 结果                                             |
| ---------------------------- | ------------------------------------------------ |
| 成长时间轴提交 `abilityData` | PASS，`[{"dimensionCode":"practice","score":0}]` |
| 成长时间轴保存成功           | PASS，"新增成功"                                 |
| 测试记录清理                 | PASS，HTTP 200                                   |
| 联系信息提交六字段           | PASS，字段完整                                   |
| 联系信息保存成功             | PASS，"更新成功"                                 |
| 保存失败不保留伪记录         | PASS（弹窗保留、输入保留、列表无记录）           |
| 教师无缓存访问学生页         | PASS（重定向 `/teacher/dashboard`）              |
| 学生无缓存访问学生页         | PASS（停留 `/profile/info`）                     |

### 5.3 数据库核对

| 查询                                        | 结果 | 说明                              |
| ------------------------------------------- | ---- | --------------------------------- |
| `SELECT COUNT(*) FROM archive_type_configs` | 0    | 评选说明全部为空，B-12 的直接原因 |
| `SELECT COUNT(*) FROM ability_dimensions`   | 3    | 成长时间轴能力维度下拉有 3 个选项 |

### 5.4 环境与限制

- 后端 8080、前端 5173 均已启动；MySQL 演示库 `student_archives_demo` 可用。
- 学生 `202401002`、教师 `T00003`、管理员 `A00001`（密码均为 `123456`）。
- 登录会使旧 token 的 `tokenVersion` 失效；curl 与浏览器交替登录时需要重新取 token。
- 本轮没有删除/修改演示业务数据，仅创建并删除了一条审计用成长时间轴记录。

---

## 六、未解决问题、环境限制与待确认事项

1. **评选说明配置为空（B-12）**：`archive_type_configs` 0 条是数据配置问题，不是前端能"补"出来的。前端已展示空态。需管理员在管理端补齐每种档案类型的评选说明与申报说明。
2. **联系信息脱敏与自助编辑（B-14）**：后端对本人查看也返回掩码邮箱/手机号/紧急电话，而保存接口要求完整六字段。前端已提示重填，但更合理的方案是后端对"本人查看"返回明文或提供部分更新接口。该改动涉及隐私规则，本轮未改后端，待确认。
3. **成长数据源同步（B-13）**：当前"同步"会在前端生成写死的能力分并只存在内存，刷新即消失。修复需要产品明确"同步是否应落库、能力分从哪来"，本轮未擅自改业务规则。
4. **17 个后端未接端点（B-15）**：尤其是 `DELETE /profile/career-plans/{planId}`（用户无法删除职业规划）和用户/学期导入模板，需要产品确认是否纳入前端迭代。
5. **接口验证覆盖度**：附录 A 的 273 行中，35 个接口有本轮真实执行证据（31 个"已验证正确"、4 个"存在问题（前端已修复）"并完成回归），其余 238 个为静态契约核对，标记为"待验证"。没有把"页面能打开"当作所有接口已验证。
6. **后端权限与数据范围**：本轮只从前端视角验证了路由与接口可达性；未对后端所有 `role_scopes`、跨学校越权场景做穷举渗透。该部分超出"仅改前端"的范围，建议后端单独做权限回归。
7. **构建体积（B-16）**：850 KB 主包警告，不影响功能；如需要可在后续迭代做路由级拆包。
8. **旧文档时效性**：`docs/api-reconciliation-student.md` 等旧文档仍描述 `GET /activities/{id}` 等旧路径，当前后端已改为 `/{type}/{id}`。建议同步更新文档，避免后续按旧契约开发。

---

## 七、修改文件与原因

> 全部为前端文件；后端 Java 源码 0 处修改。

| 文件                                                            | 修改原因                                                                                                                              |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `src/shared/api/applications.ts`                                | 归一化档案评选说明响应（后端原始 JSON 字符串与字段名），修复弹窗空白（B-01）                                                          |
| `src/shared/ui/ApplicationFormRecord.vue`                       | 渲染"申报说明"，评选说明为空时展示空态（B-01/B-12）                                                                                   |
| `src/shared/api/archive.ts`                                     | 新增 `getAbilityDimensionOptions`，读取 `GET /archive/dimensions`；修正来源必填注释（B-02/B-03）                                      |
| `src/features/growth-timeline/components/ExperienceForm.vue`    | 能力改为维度下拉并映射 `abilityData`；来源必选/无来源禁用提交；复合 sourceKey；修复提交 Loading 顺序；文案微调（B-02/B-03/B-09/B-10） |
| `src/features/growth-timeline/timeline-constants.ts`            | `GrowthExperience.skills` 增加 `dimensionCode`；修正来源必填注释（B-02/B-03）                                                         |
| `src/features/growth-timeline/composables/useGrowthTimeline.ts` | 提交 `abilityData` 与 `sourceId/sourceType`；失败撤回乐观记录并通知表单（B-02/B-03/B-04）                                             |
| `src/shared/api/student.ts`                                     | `ProfileInfo.contactInfo` 增加地址/紧急联系人字段；`updateProfileContact` 改为六字段（B-05）                                          |
| `src/app/stores/user.ts`                                        | `updateUserInfo` 接收并提交完整六字段联系信息（B-05）                                                                                 |
| `src/features/profile/ProfileInfo.vue`                          | 联系信息表单补齐六字段、编辑时清空掩码值、增加脱敏提示（B-05/B-14）                                                                   |
| `src/shared/utils/storageScope.ts`（新增）                      | 按当前登录用户 ID 生成 localStorage 作用域（B-07）                                                                                    |
| `src/shared/composables/useFormDraft.ts`                        | 草稿 key 按用户隔离（B-07）                                                                                                           |
| `src/shared/composables/useFormRecords.ts`                      | 草稿 key 按用户隔离；`/activities` 分页改用 `perPage` 并聚合全量（B-07/B-08）                                                         |
| `src/app/stores/submission.ts`                                  | 已撤回记录 ID 按用户隔离（B-07）                                                                                                      |
| `src/app/layouts/components/HeaderBar.vue`                      | 登出/切换学生端改为整页跳转，清空 Pinia 内存状态（B-11）                                                                              |
| `src/app/layouts/components/Sidebar.vue`                        | 切换学生端改为整页跳转（B-11）                                                                                                        |
| `src/app/router/routes.ts`                                      | 缓存缺失时用 `/auth/me` 回源判定端级身份，修复学生页 fail-open（B-06）                                                                |
| `src/shared/api/activity.ts`                                    | `/activities` 列表参数 `per_page` 改为 `perPage`（B-08）                                                                              |

### 7.1 临时文件清理

审计过程中使用的 `audit-crawl.mjs`、`audit-401-deadlock.mjs`、`audit-verify-fixes.mjs` 及守卫/失败回滚临时脚本均已删除，未留在仓库中。`backend/seed_teacher_admin_pages.sql` 为历史演示数据脚本，保留。

---

## 附录 A：完整接口对照表

<!-- 本表由脚本按 2026-10-19 当前代码自动生成；状态以实际执行证据为准 -->

#### `activities.ts`（申报记录、审核重提、成长来源）

| #   | 方法   | 路径                                         | 前端调用点        | 后端实现                     | 契约核对                                                                                                                                        | 验证证据                                              | 状态                   |
| --- | ------ | -------------------------------------------- | ----------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------- |
| 1   | GET    | `/activities`                                | activities.ts:65  | ActivityController#list      | 前端已按实测响应修正字段映射<br>注：Spring 按 JavaBean perPage 绑定；实测 per_page 被忽略并回落 20 条。前端记录聚合已改用 perPage，并分页拉全量 | curl 实测 per_page 被忽略、perPage 生效；记录列表正常 | 存在问题（前端已修复） |
| 2   | DELETE | `/activities/${type}/${activityId}`          | activities.ts:92  | ActivityController#delete    | 路径/方法一致；字段静态核对                                                                                                                     | 未逐接口发请求（静态核对）                            | 待验证                 |
| 3   | GET    | `/activities/${type}/${activityId}`          | activities.ts:72  | ActivityController#getDetail | 路径/方法一致；字段静态核对                                                                                                                     | 未逐接口发请求（静态核对）                            | 待验证                 |
| 4   | PUT    | `/activities/${type}/${activityId}`          | activities.ts:87  | ActivityController#edit      | 路径/方法一致；字段静态核对                                                                                                                     | 未逐接口发请求（静态核对）                            | 待验证                 |
| 5   | PUT    | `/activities/${type}/${activityId}/withdraw` | activities.ts:103 | ActivityController#withdraw  | 路径/方法一致；字段静态核对                                                                                                                     | 未逐接口发请求（静态核对）                            | 待验证                 |

#### `activity.ts`（首页最近动态）

| #   | 方法 | 路径          | 前端调用点     | 后端实现                | 契约核对                                                                                                                                        | 验证证据                                              | 状态                   |
| --- | ---- | ------------- | -------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------- |
| 1   | GET  | `/activities` | activity.ts:17 | ActivityController#list | 前端已按实测响应修正字段映射<br>注：Spring 按 JavaBean perPage 绑定；实测 per_page 被忽略并回落 20 条。前端记录聚合已改用 perPage，并分页拉全量 | curl 实测 per_page 被忽略、perPage 生效；记录列表正常 | 存在问题（前端已修复） |

#### `ai-chat.ts`（AI 助手）

| #   | 方法   | 路径                                                                   | 前端调用点     | 后端实现                                          | 契约核对                    | 验证证据                   | 状态   |
| --- | ------ | ---------------------------------------------------------------------- | -------------- | ------------------------------------------------- | --------------------------- | -------------------------- | ------ |
| 1   | GET    | `/ai/conversations`                                                    | ai-chat.ts:190 | AiConversationController#listConversations        | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证 |
| 2   | POST   | `/ai/conversations`                                                    | ai-chat.ts:174 | AiConversationController#createConversation       | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证 |
| 3   | DELETE | `/ai/conversations/${conversationId}`                                  | ai-chat.ts:265 | AiConversationController#deleteConversation       | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证 |
| 4   | PUT    | `/ai/conversations/${conversationId}`                                  | ai-chat.ts:279 | AiConversationRenameController#renameConversation | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证 |
| 5   | GET    | `/ai/conversations/${conversationId}/messages`                         | ai-chat.ts:209 | AiConversationController#getMessages              | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证 |
| 6   | POST   | `/ai/conversations/${conversationId}/messages`                         | ai-chat.ts:228 | AiConversationController#sendMessage              | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证 |
| 7   | POST   | `/ai/conversations/${conversationId}/messages/${messageId}/regenerate` | ai-chat.ts:248 | AiConversationController#regenerate               | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证 |
| 8   | POST   | `/ai/messages/${messageId}/feedback`                                   | ai-chat.ts:161 | AiConversationController#submitFeedback           | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证 |
| 9   | GET    | `/ai/suggestions`                                                      | ai-chat.ts:260 | AiConversationController#getSuggestions           | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证 |

#### `applications.ts`（档案申报表单、评选说明）

| #   | 方法 | 路径                                    | 前端调用点          | 后端实现                             | 契约核对                                                                                                                                                                                                  | 验证证据                            | 状态                   |
| --- | ---- | --------------------------------------- | ------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ---------------------- |
| 1   | POST | `/applications/duplicate-check`         | applications.ts:38  | ApplicationController#duplicateCheck | 路径/方法一致；字段静态核对                                                                                                                                                                               | 未逐接口发请求（静态核对）          | 待验证                 |
| 2   | PUT  | `/applications/${archiveId}/autosave`   | applications.ts:15  | ApplicationController#autosave       | 路径/方法一致；字段静态核对                                                                                                                                                                               | 未逐接口发请求（静态核对）          | 待验证                 |
| 3   | POST | `/applications/${archiveId}/correction` | applications.ts:76  | ApplicationController#correction     | 路径/方法一致；字段静态核对                                                                                                                                                                               | 未逐接口发请求（静态核对）          | 待验证                 |
| 4   | GET  | `/applications/${type}/guide`           | applications.ts:114 | ApplicationController#getGuide       | 前端已按实测响应修正字段映射<br>注：后端返回 evaluateRequirements/evaluateNotes 原始 JSON 字符串及 evaluateDesc/applyDesc，前端旧模型按 title/content/requirements/notes 读取导致弹窗空白；已做响应归一化 | curl 实测响应字段；前端归一化后渲染 | 存在问题（前端已修复） |
| 5   | GET  | `/applications/${archiveId}/versions`   | applications.ts:55  | ApplicationController#getVersions    | 路径/方法一致；字段静态核对                                                                                                                                                                               | 未逐接口发请求（静态核对）          | 待验证                 |

#### `archive.ts`（成长时间轴、档案概览）

| #   | 方法   | 路径                             | 前端调用点     | 后端实现                                        | 契约核对                                                                                                                                                     | 验证证据                                                        | 状态                   |
| --- | ------ | -------------------------------- | -------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- | ---------------------- |
| 1   | GET    | `/archive/dimensions`            | archive.ts:108 | StudentArchiveDimensionController#getDimensions | 路径/方法一致；字段静态核对                                                                                                                                  | curl 实测 code=0；成长表单维度下拉加载                          | 已验证正确             |
| 2   | POST   | `/profile/growth-timeline`       | archive.ts:71  | ProfileGrowthTimelineController#create          | 前端已按实测响应修正字段映射<br>注：后端强制 sourceId+sourceType，且 abilityData 需 dimensionCode；前端此前未提交 abilityData/source，已补维度下拉与来源必选 | Playwright 实测 abilityData+sourceId/sourceType，返回“新增成功” | 存在问题（前端已修复） |
| 3   | DELETE | `/profile/growth-timeline/${id}` | archive.ts:96  | ProfileGrowthTimelineController#delete          | 路径/方法一致；字段静态核对                                                                                                                                  | Playwright 清理测试记录，HTTP 200                               | 已验证正确             |
| 4   | GET    | `/profile/growth-timeline/${id}` | archive.ts:78  | ProfileGrowthTimelineController#detail          | 路径/方法一致；字段静态核对                                                                                                                                  | 未逐接口发请求（静态核对）                                      | 待验证                 |
| 5   | PUT    | `/profile/growth-timeline/${id}` | archive.ts:89  | ProfileGrowthTimelineController#update          | 路径/方法一致；字段静态核对                                                                                                                                  | 未逐接口发请求（静态核对）                                      | 待验证                 |

#### `auth.ts`（登录页、路由守卫、修改密码）

| #   | 方法 | 路径                           | 前端调用点  | 后端实现                      | 契约核对                    | 验证证据                                            | 状态       |
| --- | ---- | ------------------------------ | ----------- | ----------------------------- | --------------------------- | --------------------------------------------------- | ---------- |
| 1   | POST | `/auth/login`                  | auth.ts:36  | AuthController#login          | 路径/方法一致；字段静态核对 | curl + Playwright 登录成功                          | 已验证正确 |
| 2   | POST | `/auth/logout`                 | auth.ts:43  | AuthController#logout         | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 3   | GET  | `/auth/me`                     | auth.ts:65  | AuthController#me             | 路径/方法一致；字段静态核对 | curl 实测 roles/permissions；缓存丢失时守卫回源可用 | 已验证正确 |
| 4   | PUT  | `/auth/password`               | auth.ts:76  | AuthController#changePassword | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 5   | POST | `/auth/password/reset`         | auth.ts:83  | AuthController#sendResetEmail | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 6   | POST | `/auth/password/reset/confirm` | auth.ts:95  | AuthController#confirmReset   | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 7   | POST | `/auth/refresh`                | auth.ts:107 | AuthController#refreshToken   | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |

#### `awards.ts`（奖项报名、评选说明）

| #   | 方法 | 路径                                               | 前端调用点    | 后端实现                              | 契约核对                    | 验证证据                                                              | 状态       |
| --- | ---- | -------------------------------------------------- | ------------- | ------------------------------------- | --------------------------- | --------------------------------------------------------------------- | ---------- |
| 1   | POST | `/awards/competition-star`                         | awards.ts:117 | AwardController#submitCompetitionStar | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                                            | 待验证     |
| 2   | POST | `/awards/duplicate-check`                          | awards.ts:76  | AwardController#duplicateCheck        | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                                            | 待验证     |
| 3   | POST | `/awards/innovation-star`                          | awards.ts:187 | AwardController#submitInnovationStar  | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                                            | 待验证     |
| 4   | GET  | `/awards/overview`                                 | awards.ts:43  | AwardController#getOverview           | 路径/方法一致；字段静态核对 | curl 实测 code=0                                                      | 已验证正确 |
| 5   | POST | `/awards/research-star`                            | awards.ts:128 | AwardController#createResearchStar    | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                                            | 待验证     |
| 6   | POST | `/awards/research-star/${researchStarId}/papers`   | awards.ts:169 | AwardController#addPaper              | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                                            | 待验证     |
| 7   | POST | `/awards/research-star/${researchStarId}/projects` | awards.ts:142 | AwardController#addProject            | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                                            | 待验证     |
| 8   | POST | `/awards/research-star/${researchStarId}/software` | awards.ts:155 | AwardController#addSoftware           | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                                            | 待验证     |
| 9   | POST | `/awards/research-star/${researchStarId}/submit`   | awards.ts:174 | AwardController#submitResearchStar    | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                                            | 待验证     |
| 10  | PUT  | `/awards/${applicationId}/autosave`                | awards.ts:56  | AwardController#autosave              | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                                            | 待验证     |
| 11  | GET  | `/awards/${type}/guide`                            | awards.ts:89  | AwardController#getGuide              | 路径/方法一致；字段静态核对 | curl 实测 competition_star/innovation_star/research_star 返回完整结构 | 已验证正确 |
| 12  | GET  | `/awards/${applicationId}/versions`                | awards.ts:104 | AwardController#getVersions           | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                                            | 待验证     |

#### `career-plan.ts`（职业规划）

| #   | 方法   | 路径                                                             | 前端调用点         | 后端实现                                       | 契约核对                    | 验证证据                   | 状态       |
| --- | ------ | ---------------------------------------------------------------- | ------------------ | ---------------------------------------------- | --------------------------- | -------------------------- | ---------- |
| 1   | GET    | `/profile/career-plans`                                          | career-plan.ts:26  | ProfileCareerPlanController#listPlans          | 路径/方法一致；字段静态核对 | curl 实测 code=0           | 已验证正确 |
| 2   | POST   | `/profile/career-plans`                                          | career-plan.ts:78  | ProfileCareerPlanController#createPlan         | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证     |
| 3   | POST   | `/profile/career-plans/ai-add`                                   | career-plan.ts:297 | ProfileCareerPlanController#aiAddPlan          | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证     |
| 4   | POST   | `/profile/career-plans/copy`                                     | career-plan.ts:145 | ProfileCareerPlanController#copyPlan           | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证     |
| 5   | GET    | `/profile/career-plans/${planId}`                                | career-plan.ts:106 | ProfileCareerPlanController#getPlanDetail      | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证     |
| 6   | DELETE | `/profile/career-plans/${planId}/actions/${actionId}`            | career-plan.ts:243 | ProfileCareerPlanController#deleteAction       | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证     |
| 7   | PUT    | `/profile/career-plans/${planId}/actions/${actionId}`            | career-plan.ts:238 | ProfileCareerPlanController#updateAction       | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证     |
| 8   | POST   | `/profile/career-plans/${planId}/actions/${actionId}/files`      | career-plan.ts:270 | ProfileCareerPlanController#bindActionFile     | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证     |
| 9   | POST   | `/profile/career-plans/${planId}/actions/${actionId}/milestones` | career-plan.ts:204 | ProfileCareerPlanController#addMilestone       | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证     |
| 10  | PUT    | `/profile/career-plans/${planId}/actions/${actionId}/status`     | career-plan.ts:257 | ProfileCareerPlanController#updateActionStatus | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证     |
| 11  | GET    | `/profile/career-plans/${planId}/download`                       | career-plan.ts:118 | ProfileCareerPlanController#downloadPlan       | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证     |
| 12  | POST   | `/profile/career-plans/${planId}/goals`                          | career-plan.ts:158 | ProfileCareerPlanController#addGoal            | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证     |
| 13  | DELETE | `/profile/career-plans/${planId}/goals/${goalId}`                | career-plan.ts:177 | ProfileCareerPlanController#deleteGoal         | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证     |
| 14  | PUT    | `/profile/career-plans/${planId}/goals/${goalId}`                | career-plan.ts:172 | ProfileCareerPlanController#updateGoal         | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证     |
| 15  | POST   | `/profile/career-plans/${planId}/goals/${goalId}/actions`        | career-plan.ts:192 | ProfileCareerPlanController#addAction          | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证     |
| 16  | DELETE | `/profile/career-plans/${planId}/milestones/${milestoneId}`      | career-plan.ts:223 | ProfileCareerPlanController#deleteMilestone    | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证     |
| 17  | PUT    | `/profile/career-plans/${planId}/milestones/${milestoneId}`      | career-plan.ts:218 | ProfileCareerPlanController#updateMilestone    | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证     |
| 18  | GET    | `/profile/career-plans/${planId}/preview`                        | career-plan.ts:136 | ProfileCareerPlanController#previewPlan        | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证     |
| 19  | POST   | `/profile/career-plans/${planId}/reflections`                    | career-plan.ts:280 | ProfileCareerPlanController#addReflection      | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证     |
| 20  | POST   | `/profile/export`                                                | career-plan.ts:324 | ProfileController#submitExport                 | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证     |
| 21  | GET    | `/profile/export/preview`                                        | career-plan.ts:308 | ProfileController#getExportPreview             | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证     |
| 22  | POST   | `/profile/resume/export`                                         | career-plan.ts:351 | ProfileController#submitResumeExport           | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证     |
| 23  | GET    | `/profile/resume/export/preview`                                 | career-plan.ts:335 | ProfileController#getResumeExportPreview       | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证     |

#### `common.ts`（上传、附件预览/下载、字典/学期）

| #   | 方法   | 路径                               | 前端调用点    | 后端实现                                 | 契约核对                    | 验证证据                   | 状态   |
| --- | ------ | ---------------------------------- | ------------- | ---------------------------------------- | --------------------------- | -------------------------- | ------ |
| 1   | GET    | `/common/dict`                     | common.ts:130 | CommonController#getDict                 | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证 |
| 2   | DELETE | `/common/files/${fileId}`          | common.ts:55  | CommonController#deleteFile              | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证 |
| 3   | GET    | `/common/files/${fileId}/download` | common.ts:50  | CommonController#downloadFile            | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证 |
| 4   | GET    | `/common/files/${fileId}/preview`  | common.ts:45  | CommonController#previewFile             | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证 |
| 5   | GET    | `/common/indicators`               | common.ts:155 | CommonController#getIndicators           | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证 |
| 6   | GET    | `/common/semesters`                | common.ts:117 | CommonController#getSemesters            | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证 |
| 7   | POST   | `/common/upload`                   | common.ts:27  | CommonController#uploadFile              | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证 |
| 8   | POST   | `/common/upload/avatar`            | common.ts:62  | CommonController#uploadAvatar            | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证 |
| 9   | POST   | `/common/upload/cover`             | common.ts:79  | CoverUploadController#uploadCover        | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证 |
| 10  | GET    | `/public/statistics`               | common.ts:103 | PublicStatisticsController#getStatistics | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证 |

#### `notification.ts`（消息中心）

| #   | 方法   | 路径                               | 前端调用点          | 后端实现                         | 契约核对                    | 验证证据                         | 状态       |
| --- | ------ | ---------------------------------- | ------------------- | -------------------------------- | --------------------------- | -------------------------------- | ---------- |
| 1   | GET    | `/messages`                        | notification.ts:21  | MessageController#listMessages   | 路径/方法一致；字段静态核对 | curl 实测 code=0；消息页冒烟通过 | 已验证正确 |
| 2   | DELETE | `/messages/batch`                  | notification.ts:95  | MessageController#deleteMessages | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）       | 待验证     |
| 3   | PUT    | `/messages/batch-read`             | notification.ts:67  | MessageController#markBatchRead  | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）       | 待验证     |
| 4   | PUT    | `/messages/read-all`               | notification.ts:60  | MessageController#markAllRead    | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）       | 待验证     |
| 5   | GET    | `/messages/settings`               | notification.ts:110 | MessageController#getSettings    | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）       | 待验证     |
| 6   | PUT    | `/messages/settings`               | notification.ts:123 | MessageController#updateSetting  | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）       | 待验证     |
| 7   | DELETE | `/messages/${messageId}`           | notification.ts:90  | MessageController#deleteMessage  | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）       | 待验证     |
| 8   | PUT    | `/messages/${messageId}/archive`   | notification.ts:76  | MessageController#archive        | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）       | 待验证     |
| 9   | PUT    | `/messages/${messageId}/read`      | notification.ts:55  | MessageController#markRead       | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）       | 待验证     |
| 10  | PUT    | `/messages/${messageId}/unarchive` | notification.ts:85  | MessageController#unarchive      | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）       | 待验证     |

#### `request.ts`（全局令牌刷新（拦截器内部））

| #   | 方法 | 路径            | 前端调用点    | 后端实现                    | 契约核对                    | 验证证据                   | 状态   |
| --- | ---- | --------------- | ------------- | --------------------------- | --------------------------- | -------------------------- | ------ |
| 1   | POST | `/auth/refresh` | request.ts:53 | AuthController#refreshToken | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证 |

#### `student.ts`（个人档案、成绩、成长时间轴、兴趣）

| #   | 方法   | 路径                                       | 前端调用点     | 后端实现                               | 契约核对                    | 验证证据                              | 状态       |
| --- | ------ | ------------------------------------------ | -------------- | -------------------------------------- | --------------------------- | ------------------------------------- | ---------- |
| 1   | GET    | `/home/dashboard`                          | student.ts:62  | HomeController#getDashboard            | 路径/方法一致；字段静态核对 | curl 实测 code=0                      | 已验证正确 |
| 2   | GET    | `/profile/career-plans`                    | student.ts:312 | ProfileCareerPlanController#listPlans  | 路径/方法一致；字段静态核对 | curl 实测 code=0                      | 已验证正确 |
| 3   | PUT    | `/profile/contact`                         | student.ts:246 | ProfileController#updateContact        | 路径/方法一致；字段静态核对 | Playwright 提交六字段，返回“更新成功” | 已验证正确 |
| 4   | GET    | `/profile/data-completeness`               | student.ts:220 | ProfileController#getDataCompleteness  | 路径/方法一致；字段静态核对 | curl 实测 code=0                      | 已验证正确 |
| 5   | GET    | `/profile/growth-timeline`                 | student.ts:300 | ProfileController#getGrowthTimeline    | 路径/方法一致；字段静态核对 | curl 实测 code=0；页面加载成功        | 已验证正确 |
| 6   | GET    | `/profile/info`                            | student.ts:156 | ProfileController#getProfileInfo       | 路径/方法一致；字段静态核对 | 浏览器页面加载成功                    | 已验证正确 |
| 7   | PUT    | `/profile/interests`                       | student.ts:280 | ProfileController#updateInterests      | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）            | 待验证     |
| 8   | DELETE | `/profile/interests/${id}`                 | student.ts:285 | ProfileController#deleteInterest       | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）            | 待验证     |
| 9   | PUT    | `/profile/political-status`                | student.ts:254 | ProfileController#updateBasicInfo      | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）            | 待验证     |
| 10  | GET    | `/profile/scores`                          | student.ts:184 | ProfileController#getScores            | 路径/方法一致；字段静态核对 | curl 实测 code=0                      | 已验证正确 |
| 11  | GET    | `/profile/scores/${calculationId}/details` | student.ts:205 | ProfileController#getScoreDetails      | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）            | 待验证     |
| 12  | PUT    | `/profile/self-evaluation`                 | student.ts:267 | ProfileController#updateSelfEvaluation | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）            | 待验证     |
| 13  | PUT    | `/profile/student-status`                  | student.ts:262 | ProfileController#updateStudentStatus  | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）            | 待验证     |

#### `submission.ts`（申报/报名提交与记录）

| #   | 方法 | 路径                                                  | 前端调用点        | 后端实现                           | 契约核对                                                   | 验证证据                   | 状态   |
| --- | ---- | ----------------------------------------------------- | ----------------- | ---------------------------------- | ---------------------------------------------------------- | -------------------------- | ------ |
| 1   | POST | `/awards/research-star`                               | submission.ts:721 | AwardController#createResearchStar | 路径/方法一致；字段静态核对                                | 未逐接口发请求（静态核对） | 待验证 |
| 2   | POST | `/awards/research-star/${researchStarId}/submit`      | submission.ts:737 | AwardController#submitResearchStar | 路径/方法一致；字段静态核对                                | 未逐接口发请求（静态核对） | 待验证 |
| 3   | POST | `/awards/research-star/${researchStarId}/${sub.path}` | submission.ts:735 | —（动态路径，见备注）              | 动态拼装路径；展开为 projects/software/papers 三个后端接口 | 未逐接口发请求（静态核对） | 待验证 |

#### `teacher.ts`（教师端与管理端业务页面）

| #   | 方法   | 路径                                                    | 前端调用点      | 后端实现                                             | 契约核对                    | 验证证据                                            | 状态       |
| --- | ------ | ------------------------------------------------------- | --------------- | ---------------------------------------------------- | --------------------------- | --------------------------------------------------- | ---------- |
| 1   | GET    | `/admin/ability-dimensions`                             | teacher.ts:306  | AdminAbilityDimensionController#list                 | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 2   | POST   | `/admin/ability-dimensions`                             | teacher.ts:312  | AdminAbilityDimensionController#create               | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 3   | DELETE | `/admin/ability-dimensions/${id}`                       | teacher.ts:323  | AdminAbilityDimensionController#delete               | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 4   | PUT    | `/admin/ability-dimensions/${id}`                       | teacher.ts:319  | AdminAbilityDimensionController#update               | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 5   | GET    | `/admin/announcements`                                  | teacher.ts:1048 | AdminSystemConfigController#listAnnouncements        | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 6   | POST   | `/admin/announcements`                                  | teacher.ts:1052 | AdminSystemConfigController#createAnnouncement       | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 7   | DELETE | `/admin/announcements/${announcementId}`                | teacher.ts:1063 | AdminSystemConfigController#deleteAnnouncement       | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 8   | PUT    | `/admin/announcements/${announcementId}`                | teacher.ts:1059 | AdminSystemConfigController#updateAnnouncement       | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 9   | GET    | `/admin/approval-flow-mappings`                         | teacher.ts:635  | AdminApprovalFlowController#listMappings             | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 10  | POST   | `/admin/approval-flow-mappings`                         | teacher.ts:641  | AdminApprovalFlowController#upsertMapping            | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 11  | DELETE | `/admin/approval-flow-mappings/${mappingId}`            | teacher.ts:645  | AdminApprovalFlowController#deleteMapping            | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 12  | GET    | `/admin/approval-flows`                                 | teacher.ts:381  | AdminApprovalFlowController#listFlows                | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 13  | POST   | `/admin/approval-flows`                                 | teacher.ts:385  | AdminApprovalFlowController#createFlow               | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 14  | DELETE | `/admin/approval-flows/${id}`                           | teacher.ts:396  | AdminApprovalFlowController#deleteFlow               | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 15  | GET    | `/admin/approval-flows/${flowId}`                       | teacher.ts:615  | AdminApprovalFlowController#getFlowDetail            | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 16  | PUT    | `/admin/approval-flows/${id}`                           | teacher.ts:392  | AdminApprovalFlowController#updateFlow               | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 17  | GET    | `/admin/approval-flows/${flowId}/steps`                 | teacher.ts:619  | AdminApprovalFlowController#listSteps                | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 18  | PUT    | `/admin/approval-flows/${flowId}/steps`                 | teacher.ts:626  | AdminApprovalFlowController#saveSteps                | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 19  | GET    | `/admin/archives`                                       | teacher.ts:651  | AdminArchiveController#listArchives                  | 路径/方法一致；字段静态核对 | curl 实测 code=0                                    | 已验证正确 |
| 20  | GET    | `/admin/archives/overview`                              | teacher.ts:669  | AdminArchiveController#archiveOverview               | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 21  | GET    | `/admin/classes`                                        | teacher.ts:1236 | AdminOrgController#listClasses                       | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 22  | POST   | `/admin/classes`                                        | teacher.ts:1240 | AdminOrgController#createClass                       | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 23  | PUT    | `/admin/classes/${classId}`                             | teacher.ts:1244 | AdminOrgController#updateClass                       | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 24  | GET    | `/admin/colleges`                                       | teacher.ts:1224 | AdminOrgController#listColleges                      | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 25  | GET    | `/admin/dict/items`                                     | teacher.ts:902  | AdminDictionaryController#listItems                  | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 26  | POST   | `/admin/dict/items`                                     | teacher.ts:906  | AdminDictionaryController#createItem                 | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 27  | DELETE | `/admin/dict/items/${itemId}`                           | teacher.ts:914  | AdminDictionaryController#deleteItem                 | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 28  | PUT    | `/admin/dict/items/${itemId}`                           | teacher.ts:910  | AdminDictionaryController#updateItem                 | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 29  | GET    | `/admin/dict/types`                                     | teacher.ts:893  | AdminDictionaryController#listTypes                  | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 30  | GET    | `/admin/export-templates`                               | teacher.ts:347  | AdminExportTemplateController#listTemplates          | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 31  | POST   | `/admin/export-templates`                               | teacher.ts:351  | AdminExportTemplateController#createTemplate         | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 32  | DELETE | `/admin/export-templates/${id}`                         | teacher.ts:362  | AdminExportTemplateController#deleteTemplate         | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 33  | GET    | `/admin/export-templates/${templateId}`                 | teacher.ts:860  | AdminExportTemplateController#getTemplateDetail      | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 34  | PUT    | `/admin/export-templates/${id}`                         | teacher.ts:358  | AdminExportTemplateController#updateTemplate         | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 35  | PUT    | `/admin/export-templates/${id}/default`                 | teacher.ts:366  | AdminExportTemplateController#setDefaultTemplate     | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 36  | POST   | `/admin/export-templates/${templateId}/preview-image`   | teacher.ts:869  | AdminExportTemplateController#uploadPreviewImage     | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 37  | PATCH  | `/admin/export-templates/${id}/status`                  | teacher.ts:370  | AdminExportTemplateController#updateTemplateStatus   | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 38  | POST   | `/admin/exports/archives`                               | teacher.ts:269  | AdminExportController#submitArchiveExport            | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 39  | POST   | `/admin/exports/research`                               | teacher.ts:882  | AdminExportController#submitResearchExport           | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 40  | GET    | `/admin/exports/${jobId}`                               | teacher.ts:274  | AdminExportController#getExportJob                   | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 41  | GET    | `/admin/form-templates`                                 | teacher.ts:999  | AdminFormTemplateController#listTemplates            | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 42  | POST   | `/admin/form-templates`                                 | teacher.ts:1007 | AdminFormTemplateController#createTemplate           | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 43  | DELETE | `/admin/form-templates/${templateId}`                   | teacher.ts:1018 | AdminFormTemplateController#deleteTemplate           | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 44  | GET    | `/admin/form-templates/${templateId}`                   | teacher.ts:1003 | AdminFormTemplateController#getTemplateDetail        | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 45  | PUT    | `/admin/form-templates/${templateId}`                   | teacher.ts:1014 | AdminFormTemplateController#updateTemplate           | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 46  | PUT    | `/admin/form-templates/${templateId}/default`           | teacher.ts:1022 | AdminFormTemplateController#setDefaultTemplate       | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 47  | GET    | `/admin/grade-import-configs`                           | teacher.ts:588  | AdminGradeImportConfigController#getConfig           | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 48  | POST   | `/admin/grade-import-configs`                           | teacher.ts:594  | AdminGradeImportConfigController#createConfig        | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 49  | DELETE | `/admin/grade-import-configs/${id}`                     | teacher.ts:605  | AdminGradeImportConfigController#deleteConfig        | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 50  | PUT    | `/admin/grade-import-configs/${id}`                     | teacher.ts:601  | AdminGradeImportConfigController#updateConfig        | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 51  | PATCH  | `/admin/grade-import-configs/${id}/status`              | teacher.ts:609  | AdminGradeImportConfigController#updateStatus        | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 52  | POST   | `/admin/grades/import`                                  | teacher.ts:567  | AdminGradeController#importGrades                    | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 53  | GET    | `/admin/grades/import-template`                         | teacher.ts:582  | AdminGradeController#importTemplate                  | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 54  | GET    | `/admin/grades/imports`                                 | teacher.ts:573  | AdminGradeController#listImports                     | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 55  | GET    | `/admin/grades/imports/${importId}`                     | teacher.ts:577  | AdminGradeController#importDetail                    | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 56  | POST   | `/admin/indicators`                                     | teacher.ts:410  | AdminIndicatorController#createIndicator             | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 57  | POST   | `/admin/indicators/publish`                             | teacher.ts:441  | AdminIndicatorController#publish                     | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 58  | GET    | `/admin/indicators/rule-versions`                       | teacher.ts:847  | AdminIndicatorController#listRuleVersions            | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 59  | PATCH  | `/admin/indicators/rule-versions/${versionId}/snapshot` | teacher.ts:854  | AdminIndicatorController#patchRuleVersionSnapshot    | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 60  | PATCH  | `/admin/indicators/status`                              | teacher.ts:839  | AdminIndicatorController#updateIndicatorStatusBatch  | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 61  | GET    | `/admin/indicators/tree`                                | teacher.ts:406  | AdminIndicatorController#getTree                     | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 62  | DELETE | `/admin/indicators/${id}`                               | teacher.ts:418  | AdminIndicatorController#deleteIndicator             | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 63  | PUT    | `/admin/indicators/${id}`                               | teacher.ts:414  | AdminIndicatorController#updateIndicator             | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 64  | PATCH  | `/admin/indicators/${id}/status`                        | teacher.ts:422  | AdminIndicatorController#updateIndicatorStatus       | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 65  | GET    | `/admin/logs/exports`                                   | teacher.ts:208  | AdminLogController#listExportLogs                    | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 66  | GET    | `/admin/logs/login`                                     | teacher.ts:204  | AdminLogController#listLoginLogs                     | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 67  | GET    | `/admin/logs/system`                                    | teacher.ts:200  | AdminLogController#listSystemLogs                    | 路径/方法一致；字段静态核对 | curl 实测 code=0                                    | 已验证正确 |
| 68  | GET    | `/admin/majors`                                         | teacher.ts:1232 | AdminOrgController#listMajors                        | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 69  | POST   | `/admin/majors`                                         | teacher.ts:1248 | AdminOrgController#createMajor                       | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 70  | GET    | `/admin/permissions`                                    | teacher.ts:951  | AdminRoleController#listPermissions                  | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 71  | GET    | `/admin/roles`                                          | teacher.ts:924  | AdminRoleController#listRoles                        | 路径/方法一致；字段静态核对 | curl 实测 code=0                                    | 已验证正确 |
| 72  | POST   | `/admin/roles`                                          | teacher.ts:928  | AdminRoleController#createRole                       | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 73  | DELETE | `/admin/roles/${roleId}`                                | teacher.ts:936  | AdminRoleController#deleteRole                       | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 74  | PUT    | `/admin/roles/${roleId}`                                | teacher.ts:932  | AdminRoleController#updateRole                       | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 75  | GET    | `/admin/roles/${roleId}/permissions`                    | teacher.ts:940  | AdminRoleController#getRolePermissions               | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 76  | PUT    | `/admin/roles/${roleId}/permissions`                    | teacher.ts:944  | AdminRoleController#assignRolePermissions            | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 77  | GET    | `/admin/scheduled-tasks`                                | teacher.ts:1074 | AdminScheduledTaskController#listTasks               | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 78  | POST   | `/admin/scheduled-tasks`                                | teacher.ts:1098 | AdminScheduledTaskController#createTask              | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 79  | GET    | `/admin/scheduled-tasks/handlers`                       | teacher.ts:1086 | AdminScheduledTaskController#listHandlers            | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 80  | DELETE | `/admin/scheduled-tasks/${taskId}`                      | teacher.ts:1111 | AdminScheduledTaskController#deleteTask              | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 81  | GET    | `/admin/scheduled-tasks/${taskId}`                      | teacher.ts:1091 | AdminScheduledTaskController#getTaskDetail           | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 82  | PUT    | `/admin/scheduled-tasks/${taskId}`                      | teacher.ts:1106 | AdminScheduledTaskController#updateTask              | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 83  | PUT    | `/admin/scheduled-tasks/${taskId}/status`               | teacher.ts:1081 | AdminScheduledTaskController#updateStatus            | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 84  | POST   | `/admin/scheduled-tasks/${taskId}/trigger`              | teacher.ts:1116 | AdminScheduledTaskController#triggerTask             | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 85  | GET    | `/admin/schools`                                        | teacher.ts:1217 | AdminOrgController#listSchools                       | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 86  | GET    | `/admin/semesters`                                      | teacher.ts:962  | AdminSemesterController#listSemesters                | 路径/方法一致；字段静态核对 | curl 实测 code=0                                    | 已验证正确 |
| 87  | POST   | `/admin/semesters`                                      | teacher.ts:966  | AdminSemesterController#createSemester               | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 88  | POST   | `/admin/semesters/import`                               | teacher.ts:982  | AdminSemesterController#importSemesters              | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 89  | GET    | `/admin/semesters/import-template`                      | teacher.ts:987  | AdminSemesterController#importTemplate               | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 90  | PUT    | `/admin/semesters/${semesterId}`                        | teacher.ts:970  | AdminSemesterController#updateSemester               | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 91  | PUT    | `/admin/semesters/${semesterId}/set-current`            | teacher.ts:974  | AdminSemesterController#setCurrentSemester           | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 92  | PUT    | `/admin/semesters/${semesterId}/status`                 | teacher.ts:978  | AdminSemesterController#updateSemesterStatus         | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 93  | GET    | `/admin/settings`                                       | teacher.ts:1033 | AdminSystemConfigController#listSettings             | 路径/方法一致；字段静态核对 | curl 实测 code=0                                    | 已验证正确 |
| 94  | PUT    | `/admin/settings`                                       | teacher.ts:1037 | AdminSystemConfigController#updateSetting            | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 95  | GET    | `/admin/statistics/dashboard`                           | teacher.ts:794  | AdminStatisticsController#dashboard                  | 路径/方法一致；字段静态核对 | curl 实测 code=0                                    | 已验证正确 |
| 96  | GET    | `/admin/statistics/heatmap`                             | teacher.ts:809  | AdminStatisticsController#heatmap                    | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 97  | POST   | `/admin/statistics/refresh`                             | teacher.ts:824  | AdminStatisticsController#refreshSnapshot            | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 98  | GET    | `/admin/users`                                          | teacher.ts:214  | AdminUserController#listUsers                        | 路径/方法一致；字段静态核对 | curl 实测 code=0                                    | 已验证正确 |
| 99  | POST   | `/admin/users`                                          | teacher.ts:222  | AdminUserController#createUser                       | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 100 | GET    | `/admin/users/${userId}`                                | teacher.ts:218  | AdminUserController#getDetail                        | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 101 | PUT    | `/admin/users/${userId}`                                | teacher.ts:226  | AdminUserController#updateUser                       | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 102 | PUT    | `/admin/users/${userId}/password/reset`                 | teacher.ts:234  | AdminUserController#resetPassword                    | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 103 | PUT    | `/admin/users/${userId}/roles`                          | teacher.ts:238  | AdminUserController#updateRoles                      | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 104 | PUT    | `/admin/users/${userId}/scopes`                         | teacher.ts:242  | AdminUserController#updateScopes                     | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 105 | PUT    | `/admin/users/${userId}/status`                         | teacher.ts:230  | AdminUserController#updateStatus                     | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 106 | GET    | `/auth/captcha`                                         | teacher.ts:163  | AuthController#getCaptcha                            | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 107 | POST   | `/auth/login`                                           | teacher.ts:174  | AuthController#login                                 | 路径/方法一致；字段静态核对 | curl + Playwright 登录成功                          | 已验证正确 |
| 108 | POST   | `/auth/logout`                                          | teacher.ts:182  | AuthController#logout                                | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 109 | GET    | `/auth/me`                                              | teacher.ts:178  | AuthController#me                                    | 路径/方法一致；字段静态核对 | curl 实测 roles/permissions；缓存丢失时守卫回源可用 | 已验证正确 |
| 110 | POST   | `/auth/password/reset`                                  | teacher.ts:186  | AuthController#sendResetEmail                        | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 111 | POST   | `/auth/password/reset/confirm`                          | teacher.ts:190  | AuthController#confirmReset                          | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 112 | POST   | `/auth/refresh`                                         | teacher.ts:194  | AuthController#refreshToken                          | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 113 | GET    | `/common/dict`                                          | teacher.ts:451  | CommonController#getDict                             | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 114 | GET    | `/common/enums`                                         | teacher.ts:455  | CommonController#getEnums                            | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 115 | DELETE | `/common/files/${fileId}`                               | teacher.ts:542  | CommonController#deleteFile                          | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 116 | GET    | `/common/files/${fileId}/download`                      | teacher.ts:560  | CommonController#downloadFile                        | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 117 | GET    | `/common/files/${fileId}/preview`                       | teacher.ts:538  | CommonController#previewFile                         | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 118 | GET    | `/common/indicators`                                    | teacher.ts:459  | CommonController#getIndicators                       | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 119 | GET    | `/common/semesters`                                     | teacher.ts:447  | CommonController#getSemesters                        | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 120 | POST   | `/common/upload`                                        | teacher.ts:530  | CommonController#uploadFile                          | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 121 | GET    | `/messages`                                             | teacher.ts:474  | MessageController#listMessages                       | 路径/方法一致；字段静态核对 | curl 实测 code=0；消息页冒烟通过                    | 已验证正确 |
| 122 | DELETE | `/messages/batch`                                       | teacher.ts:520  | MessageController#deleteMessages                     | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 123 | PUT    | `/messages/batch-read`                                  | teacher.ts:514  | MessageController#markBatchRead                      | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 124 | PUT    | `/messages/read-all`                                    | teacher.ts:482  | MessageController#markAllRead                        | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 125 | GET    | `/messages/settings`                                    | teacher.ts:506  | MessageController#getSettings                        | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 126 | PUT    | `/messages/settings`                                    | teacher.ts:510  | MessageController#updateSetting                      | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 127 | DELETE | `/messages/${id}`                                       | teacher.ts:502  | MessageController#deleteMessage                      | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 128 | PUT    | `/messages/${id}/archive`                               | teacher.ts:490  | MessageController#archive                            | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 129 | PUT    | `/messages/${id}/read`                                  | teacher.ts:478  | MessageController#markRead                           | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 130 | PUT    | `/messages/${id}/unarchive`                             | teacher.ts:498  | MessageController#unarchive                          | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 131 | GET    | `/teacher/archives`                                     | teacher.ts:682  | TeacherArchiveController#listArchives                | 路径/方法一致；字段静态核对 | curl 实测 code=0；页面冒烟通过                      | 已验证正确 |
| 132 | GET    | `/teacher/archives/overview`                            | teacher.ts:692  | TeacherArchiveController#archiveOverview             | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 133 | GET    | `/teacher/archives/${archiveId}`                        | teacher.ts:660  | TeacherArchiveController#archiveDetail               | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 134 | POST   | `/teacher/audits/batch/approve`                         | teacher.ts:1158 | TeacherAuditController#batchApprove                  | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 135 | GET    | `/teacher/audits/history`                               | teacher.ts:1177 | TeacherAuditHistoryController#listHistory            | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 136 | GET    | `/teacher/audits/pending`                               | teacher.ts:1123 | TeacherAuditController#listPending                   | 路径/方法一致；字段静态核对 | curl 实测 code=0；页面冒烟通过                      | 已验证正确 |
| 137 | GET    | `/teacher/audits/pending/${taskId}`                     | teacher.ts:1135 | TeacherAuditController#getDetail                     | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 138 | GET    | `/teacher/audits/reject-templates`                      | teacher.ts:1163 | TeacherAuditController#rejectTemplates               | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 139 | POST   | `/teacher/audits/${taskId}/approve`                     | teacher.ts:1143 | TeacherAuditController#approve                       | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 140 | POST   | `/teacher/audits/${taskId}/reject`                      | teacher.ts:1151 | TeacherAuditController#reject                        | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 141 | POST   | `/teacher/audits/${taskId}/revoke`                      | teacher.ts:1171 | TeacherAuditController#revoke                        | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 142 | POST   | `/teacher/career-plans/${planId}/feedbacks`             | teacher.ts:733  | TeacherCareerPlanController#submitFeedback           | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 143 | GET    | `/teacher/dashboard`                                    | teacher.ts:831  | TeacherDashboardController#getDashboard              | 路径/方法一致；字段静态核对 | curl 实测 code=0；页面冒烟通过                      | 已验证正确 |
| 144 | GET    | `/teacher/delegations`                                  | teacher.ts:754  | TeacherDelegationController#listDelegations          | 路径/方法一致；字段静态核对 | curl 实测 code=0；页面冒烟通过                      | 已验证正确 |
| 145 | POST   | `/teacher/delegations`                                  | teacher.ts:760  | TeacherDelegationController#createDelegation         | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 146 | GET    | `/teacher/delegations/candidates`                       | teacher.ts:778  | TeacherDelegationController#listCandidates           | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 147 | PUT    | `/teacher/delegations/${delegationId}/cancel`           | teacher.ts:767  | TeacherDelegationController#cancelDelegation         | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 148 | GET    | `/teacher/exports`                                      | teacher.ts:295  | TeacherExportController#listJobs                     | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 149 | POST   | `/teacher/exports`                                      | teacher.ts:252  | TeacherExportController#submitArchiveExport          | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 150 | GET    | `/teacher/exports/templates`                            | teacher.ts:286  | TeacherExportController#listTemplates                | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 151 | DELETE | `/teacher/exports/${jobId}`                             | teacher.ts:300  | TeacherExportController#deleteExport                 | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 152 | GET    | `/teacher/logs`                                         | teacher.ts:1184 | TeacherLogController#listLogs                        | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 153 | GET    | `/teacher/messages`                                     | teacher.ts:1203 | TeacherMessageController#listMessages                | 路径/方法一致；字段静态核对 | curl 实测 code=0；页面冒烟通过                      | 已验证正确 |
| 154 | PUT    | `/teacher/messages/${messageId}/archive`                | teacher.ts:1211 | TeacherMessageController#archive                     | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 155 | PUT    | `/teacher/messages/${messageId}/read`                   | teacher.ts:1207 | TeacherMessageController#markRead                    | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 156 | POST   | `/teacher/scores/recalculate`                           | teacher.ts:332  | TeacherScoreController#triggerRecalculate            | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 157 | GET    | `/teacher/scores/recalculation-tasks/${taskId}`         | teacher.ts:336  | TeacherScoreController#getRecalculationTask          | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 158 | GET    | `/teacher/statistics/dashboard`                         | teacher.ts:787  | TeacherStatisticsController#dashboard                | 路径/方法一致；字段静态核对 | curl 实测 code=0                                    | 已验证正确 |
| 159 | GET    | `/teacher/statistics/heatmap`                           | teacher.ts:804  | TeacherStatisticsController#heatmap                  | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 160 | GET    | `/teacher/statistics/overview`                          | teacher.ts:799  | TeacherStatisticsController#overview                 | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 161 | POST   | `/teacher/statistics/refresh`                           | teacher.ts:817  | TeacherStatisticsController#refreshSnapshot          | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 162 | GET    | `/teacher/students/${userId}/career-plans/${planId}`    | teacher.ts:725  | TeacherStudentController#getCareerPlanDetail         | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 163 | GET    | `/teacher/students/${userId}/growth-timeline`           | teacher.ts:712  | TeacherStudentController#getGrowthTimeline           | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 164 | POST   | `/teacher/students/${userId}/improvement-suggestions`   | teacher.ts:741  | TeacherImprovementSuggestionController#addSuggestion | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 165 | GET    | `/teacher/students/${userId}/profile`                   | teacher.ts:701  | TeacherStudentController#getStudentProfile           | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |
| 166 | GET    | `/teacher/students/${userId}/weaknesses`                | teacher.ts:717  | TeacherStudentController#getWeaknesses               | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对）                          | 待验证     |

#### `user.ts`（顶栏用户信息、退出登录）

| #   | 方法 | 路径                    | 前端调用点 | 后端实现                      | 契约核对                    | 验证证据                   | 状态   |
| --- | ---- | ----------------------- | ---------- | ----------------------------- | --------------------------- | -------------------------- | ------ |
| 1   | POST | `/auth/logout`          | user.ts:45 | AuthController#logout         | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证 |
| 2   | PUT  | `/auth/password`        | user.ts:30 | AuthController#changePassword | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证 |
| 3   | POST | `/common/upload/avatar` | user.ts:19 | CommonController#uploadAvatar | 路径/方法一致；字段静态核对 | 未逐接口发请求（静态核对） | 待验证 |
