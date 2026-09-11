# 学生端接口对账表（前端 ↔ 后端）

> 日期：2026-08-21 ｜ 分支：ry ｜ 判定口径：
>
> - 以**真实登录学生 token** 探测 + 前端页面实际调用链核对
> - 一个接口"缺失"须满足：**前端页面真实在用（非死代码 Mock）且后端无等价接口**
> - ⚠️ 本版已修正 8/21 初版误判：`/reviews*`、`/award-reviews*`、`/archive/*`、`/score-indicators/*`
>   经核对页面调用链，功能已分别跑在 `/activities`、`/profile`、`/common/indicators` 等真实接口上，那些路径是死代码 Mock，**不是后端缺口**。

---

## 一、需要后端实现 / 确认（5 项）

> 8/22 更新：7.x 申报提交 / 8.x 奖项报名已按接口文档逐字段映射（[submission.ts](src/shared/api/submission.ts) 的 `APPLICATION_CONTRACTS`），
> 纠错已接 7.12 `POST /applications/{archiveId}/correction`、奖项查重已接 8.1.2 `POST /awards/duplicate-check`、科研之星已按 8.3 主记录+子项目流程接入。
> ⚠️ 8/22 实测：`GET/PUT/DELETE /activities/{id}`、`POST /applications/{id}/submit`、`PUT /applications/{id}` 全部返回 **30001 接口不存在**（详见第四节）。

| 前端功能                         | 前端当前调用                                                                                                                                      | 后端契约                                                                                                          | 状态                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 档案详情（编辑回填）             | `getActivityDetail()` → `GET /activities/{id}`（6.2）                                                                                             | **30001 接口不存在**；[useApplicationPage.ts](src/shared/composables/useApplicationPage.ts) 已 catch 回退摘要字段 | ❌ 需后端实现 6.2，否则编辑真实记录无法回填完整字段            |
| 档案编辑（审核"重新提交"）       | `updateActivity()` → `PUT /activities/{id}`（6.3，[review.ts](src/app/stores/review.ts)、[award-review.ts](src/app/stores/award-review.ts) 在用） | **30001 接口不存在**                                                                                              | ❌ 需后端实现 6.3；当前审核重新提交实际失败                    |
| 档案删除                         | `deleteActivity()` → `DELETE /activities/{id}`（6.4，[activity.ts](src/app/stores/activity.ts) 在用）                                             | **30001 接口不存在**                                                                                              | ❌ 需后端实现 6.4，且诊断期间产生的探测脏数据无法通过 API 清理 |
| 档案申报查重（7.x 申报提交前）   | `duplicateCheck()` → `POST /applications/duplicate-check`                                                                                         | **7.x 文档未定义此接口**（仅 8.1.2 有奖项查重）                                                                   | 需后端确认是否提供；若无则前端可去掉该前置校验                 |
| 申报草稿保存/加载/删除           | 草稿已改**本地持久化**（localStorage `form_draft_<type>`，[useFormRecords.ts](src/shared/composables/useFormRecords.ts) 合并进列表）              | 7.x 仅在 POST 上支持 `isDraft=1`，**无档案草稿更新/续存接口**（8.1.1 autosave 仅限奖项）                          | ✅ 前端已本地化落地；若需跨设备同步草稿，后端须补档案草稿接口  |
| 档案"荣誉奖项"手动新增/编辑/删除 | `addAward/updateAward/deleteAward`（Mock，[AwardsPanel.vue](src/features/profile/components/AwardsPanel.vue)）                                    | 后端无奖项 CRUD 接口，仅只读 `/awards/overview`                                                                   | 产品决策：保留手动编辑（补接口）还是只读展示                   |
| 图书心得申报                     | `POST /applications/book-review`（[submission.ts](src/shared/api/submission.ts) 已配置契约）                                                      | **全量载荷变体均 10003/超时**（含 ASCII/空值/数字），后端阻塞                                                     | ❌ 需后端排查；前端已就绪待恢复                                |

**科研之星（8.3）**：前端 3 个独立页面（科研项目/软著/论文）已改按 8.3 流程「创建主记录 → 添加子项目 → 确认提交」落地，
但每个页面提交会各建一条主记录；若产品要求一个主记录挂多个子项目，需把 3 页合并为向导式 UI（见第三节前端待办）。

### B. 需要产品/后端确认（1 项）

| 功能                             | 前端现状                                                                                                       | 问题                                                                                                                                                 |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 档案"荣誉奖项"手动新增/编辑/删除 | `addAward/updateAward/deleteAward`（Mock，[AwardsPanel.vue](src/features/profile/components/AwardsPanel.vue)） | 后端无奖项 CRUD 接口，只有只读 `/awards/overview`。奖项本应由申报/报名流程产生。**确认：保留手动编辑（后端补接口）还是只读展示（前端去掉手动交互）** |

---

## 二、已对接成功（前端真实在用，实测 200）

- `GET /home/dashboard`（3.1 首页统计）
- `GET /profile/info`（4.1 个人资料：含维度画像/兴趣/学期成绩/个人奖项）
- `GET /profile/growth-timeline`（4.2 成长时间线）
- `GET /profile/career-plans`（职业规划列表）
- `GET /activities`（6.1 动态记录：申报记录页、首页统计兜底、**申报/奖项审核页面**共用；列表按 `ARCHIVE_TYPE_ALIASES` 别名匹配后端 archiveType）
- `PUT /activities/{id}/withdraw`（6.5 撤回，已由 [submission.ts](src/shared/api/submission.ts) 迁移接上）
- `POST /applications/{type}`（7.1~7.10 申报提交，已按契约映射字段/semesterId/日期，[submission.ts](src/shared/api/submission.ts)；枚举/ASCII-only 字段已归一化，见第四节）
- `POST /awards/competition-star`、`POST /awards/innovation-star`（8.2 / 8.4 奖项报名提交）
- `POST /awards/research-star` + `/{id}/projects|software|papers` + `/{id}/submit`（8.3 科研之星主记录+子项目流程）
- `POST /applications/{archiveId}/correction`（7.12 更正已通过申报，[useCorrection.ts](src/shared/composables/useCorrection.ts)）
- `POST /awards/duplicate-check`（8.1.2 奖项重复申报检测）
- `GET /messages`、`GET /messages/settings`（消息中心）
- `GET /ai/conversations`（AI 对话会话）
- `POST /common/upload`（2.1 附件上传，[ProofUpload.vue](src/shared/ui/ProofUpload.vue) 已真实接入，fileId 回填后随提交映射为 `evidenceFileIds`）
- `DELETE /common/files/{fileId}`（2.1.3 删除未关联附件，仅草稿/已退回/未关联记录开放）
- `GET /common/semesters`（2.2）、`GET /common/indicators`（2.4）、`GET /profile/interests` 系（4.1.x）

---

## 三、前端侧待处理（非后端缺口，勿找后端）

| 事项                          | 说明                                                                                                                                                                                                | 前端动作                                                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 上传 module 精细化            | [ProofUpload.vue](src/shared/ui/ProofUpload.vue) 已真实上传，`module` 缺省 `'archive'`；若后端按 module 白名单校验或需按业务分目录，则各页传 `module="competition"` 等                              | 视后端要求逐页补充                                                                                                 |
| 编辑回显既有附件              | 6.2 详情接口**未实现（30001）**，既有证据文件无法回显                                                                                                                                               | 待后端实现 6.2 后确认返回字段回填                                                                                  |
| 学术研究表单缺结束日期        | 契约 7.4 要求 `startDate`+`endDate` 均必填                                                                                                                                                          | ✅ 已补"结束时间"表单项并映射 `endDate`（[ResearchList.vue](src/features/applications/research/ResearchList.vue)） |
| 纠错 correctedData 形态不符   | 7.12 要求 `correctedData` 为"修正后的完整申报数据"，当前 [useCorrection.ts](src/shared/composables/useCorrection.ts) 传 `{字段:{old,new}}` 增量                                                     | 改为提交完整修正后的契约字段对象                                                                                   |
| 编辑/重提走 POST 会重复建记录 | doSubmit 对真实记录也一律 `POST` 新建；契约 6.3 `PUT /activities/{id}` **实测 30001 未实现**（审核重新提交在用，见第一节）                                                                          | 前端保持 POST（避免依赖未实现端点）；待后端实现 6.3 后改调 PUT 避免重复建记录                                      |
| 中文自由文本字段被置空        | 实习 `location/position`、实践 `practiceLocation/practiceUnit`、实训 `projectContent`、组织 `positionTitle` 后端仅接受 ASCII，中文输入提交时被 `asciiOrEmpty` 置空串（组织 `positionTitle` 还必填） | 提示用户输入 ASCII/枚举，或等后端放开 UTF-8；`projectType`/`orgLevel` 已改下拉枚举不受影响                         |
| 草稿 Mock 未接线              | [submission.ts](src/shared/api/submission.ts) 的 `saveDraft/loadDraft/deleteDraft` 仍是 Mock，草稿实际走 `useFormDraft` localStorage                                                                | 清理 Mock 或统一收口到 `useFormDraft`                                                                              |
| 科研之星向导化（可选）        | 8.3 设计为一个主记录挂多个子项目；当前 3 个独立页面各建一条主记录                                                                                                                                   | 视产品要求合并为向导式 UI                                                                                          |
| 兴趣增删改接线                | 档案 store 的 `createInterest/editInterest/removeInterest` 走了 Mock；后端已有 `PUT/DELETE /profile/interests`（student.ts 已封装），**接错函数**                                                   | 改为调用 `updateInterests/deleteInterest`，删 Mock                                                                 |
| 审核/奖项审核死代码           | `/reviews*`、`/award-reviews*` API 模块无页面引用，功能已在 `/activities` 上                                                                                                                        | 清理 review.ts / award-review.ts 的 Mock                                                                           |
| 档案成绩/画像/时间线死代码    | `/archive/grades                                                                                                                                                                                    | dimensions                                                                                                         | timeline`无页面引用，已用`/profile/info`、`/profile/growth-timeline` | 清理 archive.ts 中未用 Mock |
| 评分指标                      | `/score-indicators/{type}` 是 Mock 占位，真实为 `/common/indicators`                                                                                                                                | 改用 `/common/indicators`                                                                                          |

---

## 四、8/22 实测发现（curl 探测，真实登录 token）

### 4.1 后端 archiveType 编码（GET /activities 实测）

前端 type key ≠ 后端 `archiveType`，列表已用 `ARCHIVE_TYPE_ALIASES` 别名兼容匹配：

| 前端 type         | 后端 archiveType                          |
| ----------------- | ----------------------------------------- |
| competition       | `academic_competition`                    |
| scholarship       | `scholarship`（同名）                     |
| certificate       | `honor_certificate`                       |
| innovation        | `innovation_entrepreneurship`             |
| research          | `academic_research`                       |
| internship        | `internship`（同名）                      |
| organization      | `organization`（同名）                    |
| training          | `training_project`                        |
| socialPractice    | `social_practice`                         |
| competitionStar   | `competition_star`                        |
| innovationStar    | `innovation_star`                         |
| scientificProject | `research_project` / `scientific_project` |
| softwareCopyright | `software_copyright`                      |
| paper             | `published_paper`                         |
| bookReport        | 未能确认（POST 契约异常，见下）           |

### 4.2 后端字段校验行为

- **未知字段被忽略**（不报错），缺必填项才失败。
- **枚举字段**（`projectType`/`orgLevel` 等）只接受枚举码，中文 label → 10003；缺失 → 60005。前端已用 `enumMap` 中文→枚举码转换。
- **ASCII-only 字段**（实习 `location/position`、实践 `practiceLocation/practiceUnit`、实训 `projectContent`、组织 `positionTitle`）含中文 → 10003，空值可存；前端 `asciiOrEmpty` 非 ASCII 置空串。
- **research** 契约要求 `startDate`+`endDate` 均必填且 end>start。

### 4.3 未实现端点（30001 接口不存在）

`GET /activities/{id}`（6.2）、`PUT /activities/{id}`（6.3）、`DELETE /activities/{id}`（6.4）、
`POST /applications/{id}/submit`、`PUT /applications/{id}` —— 均需后端实现（见第一节）。

### 4.4 图书心得（book-report）后端阻塞

`POST /applications/book-review` 全量载荷变体（中文/ASCII/空值/数字字段组合）均返回 10003 或超时，前端契约已就绪待后端恢复。

### 4.5 探测脏数据（需后端清理）

诊断期间用真实登录 token 在账号上创建约 **25 条测试申报**（id 约 21、22、65-99 部分），因后端无 DELETE 端点无法通过 API 清理，需后端实现删除或管理员后台清理。
