# 科研之星（8.3）编辑更新接口需求

> 提出方：前端（学生端档案系统）
> 现状版本：学生端接口文档 V5.22 / 学生档案系统表 V5.6
> 目的：补齐 8.3 科研之星「编辑已存在记录」所需接口，避免前端编辑被退回记录时只能新建，产生重复申报

---

## 一、问题与现状

科研之星当前只有以下接口（均为新增/提交）：

| 方法 | 路径                                              | 说明                                         |
| ---- | ------------------------------------------------- | -------------------------------------------- |
| POST | `/awards/research-star`                           | 新建主记录（`isDraft=1` 为草稿，`0` 为正式） |
| POST | `/awards/research-star/{researchStarId}/projects` | 追加科研项目子项                             |
| POST | `/awards/research-star/{researchStarId}/software` | 追加软件著作权子项                           |
| POST | `/awards/research-star/{researchStarId}/papers`   | 追加论文子项                                 |
| POST | `/awards/research-star/{researchStarId}/submit`   | 确认提交                                     |

缺失的是「读取已有主记录 + 子项」和「更新主记录 + 子项」。前端编辑被退回（status=3）的科研之星记录时：

1. 列表 `GET /activities` 只返回摘要（`id`、`archive_type=research_star`、`title`、`status` 等），不含 `researchStarId` 与子项字段；
2. 提交只能再次 `POST /awards/research-star`，后端新增一条主记录及子项；
3. 旧记录仍保留，刷新后出现两条重复申报。

因此需要后端补充下文的更新接口。接口上线前，前端保持现有行为（编辑即新增），问题无法在纯前端闭环。

---

## 二、通用约定

- 鉴权：`Authorization: Bearer <student_token>`
- 数据归属：只能操作当前登录学生本人的记录（`award_applications.student_id` / `user_id` 与登录者一致），否则 `403`
- 允许编辑的状态：`status = 0`（草稿）或 `status = 3`（已退回）
  - `1`（待审核）、`2`（已通过）、`4`（已撤回）一律拒绝，返回 `409`
- 提交成功后状态由 `POST /submit` 推进，更新接口本身不改变状态
- 响应信封沿用现有约定：

```json
{ "code": 0, "message": "success", "data": {} }
```

- 幂等：建议主记录更新接口接受可选 `clientRequestId`（UUID），同一请求 ID 在 10 分钟内重复提交返回首次结果，避免弱网重试产生重复子项。

---

## 三、接口清单（推荐方案 A）

### 3.1 获取科研之星详情（编辑回填用）

```
GET /awards/research-star/{applicationId}
```

> 建议以 `/activities` 返回的记录 `id`（即 `applicationId`）作为入参，前端列表只有这个 id；
> 若必须用 `researchStarId`，请同时在 6.1 列表项中下发 `research_star_id`。

响应 `data`：

```json
{
  "applicationId": 134,
  "researchStarId": 88,
  "archiveType": "research_star",
  "primaryCategory": "project",
  "status": 3,
  "statusLabel": "已退回",
  "rejectedReason": "佐证材料不清晰",
  "semesterId": 6,
  "semesterName": "2025-2026-1",
  "participantRole": "solo",
  "certificateNo": "RS-2025-001",
  "issuingUnit": "示例大学",
  "validUntil": "2027-06-30",
  "projects": [
    {
      "projectId": 501,
      "projectName": "校园二手交易平台",
      "projectLevel": "provincial",
      "rankTotal": "3",
      "establishedTime": "2025-03-01",
      "evidenceFileIds": [9001, 9002]
    }
  ],
  "software": [],
  "papers": []
}
```

字段说明：

| 字段                  | 类型   | 说明                                                                     |
| --------------------- | ------ | ------------------------------------------------------------------------ |
| applicationId         | number | 奖项申报记录 id（`/activities` 的 `id`）                                 |
| researchStarId        | number | 科研之星主记录 id（更新接口使用）                                        |
| primaryCategory       | string | `project` / `software_copyright` / `published_paper`，用于列表按子类分页 |
| projects[].projectId  | number | 子项 id，更新/删除时必传                                                 |
| software[].softwareId | number | 同上                                                                     |
| papers[].paperId      | number | 同上                                                                     |

---

### 3.2 更新主记录 + 子项（推荐，一次事务）

```
PUT /awards/research-star/{researchStarId}
```

请求体（所有字段可选，传什么更新什么；子项数组传 `null`/不传表示不改，传空数组表示清空）：

```json
{
  "clientRequestId": "a3f1c2d4-...",
  "semesterId": 6,
  "participantRole": "solo",
  "certificateNo": "RS-2025-001",
  "issuingUnit": "示例大学",
  "validUntil": "2027-06-30",
  "projects": [
    {
      "projectId": 501,
      "projectName": "校园二手交易平台",
      "projectLevel": "provincial",
      "rankTotal": "3",
      "establishedTime": "2025-03-01",
      "evidenceFileIds": [9001, 9002]
    }
  ],
  "software": [],
  "papers": []
}
```

规则：

- `projectId` 为空表示新增子项；有值表示更新；数组中缺失的旧子项默认保留（如需删除请显式提供删除接口或传 `deletedProjectIds`）
- `projectLevel` / `participantRole` 等枚举值按现有字典校验，非法值返回 `10003`
- `evidenceFileIds` 必须属于当前学生且状态为已上传，否则 `10003`
- 更新成功后返回：

```json
{
  "applicationId": 134,
  "researchStarId": 88,
  "status": 3,
  "statusLabel": "已退回",
  "updatedAt": "2026-11-25T16:00:00+08:00"
}
```

前端拿到成功响应后会调用 `POST /awards/research-star/{researchStarId}/submit` 正式提交。

---

### 3.3 单子项更新（方案 B，可选）

若不希望主接口承载子项数组，可提供：

| 方法   | 路径                                                           | 说明             |
| ------ | -------------------------------------------------------------- | ---------------- |
| PUT    | `/awards/research-star/{researchStarId}/projects/{projectId}`  | 更新科研项目子项 |
| PUT    | `/awards/research-star/{researchStarId}/software/{softwareId}` | 更新软著子项     |
| PUT    | `/awards/research-star/{researchStarId}/papers/{paperId}`      | 更新论文子项     |
| DELETE | `/awards/research-star/{researchStarId}/projects/{projectId}`  | 删除子项（可选） |
| DELETE | `/awards/research-star/{researchStarId}/software/{softwareId}` | 删除子项（可选） |
| DELETE | `/awards/research-star/{researchStarId}/papers/{paperId}`      | 删除子项（可选） |

请求体字段与对应 POST 新增接口一致；状态/归属校验同上。

> 前端优先接方案 A：一次请求保存主记录与子项，失败可整体回滚，减少「主记录已改、子项未改」的中间态。

---

## 四、列表接口需要补充的字段（6.1 `GET /activities`）

为让前端能把列表行定位到科研之星主记录与子类，建议在 `GET /activities` 返回项中补充：

| 字段               | 类型           | 说明                                                 |
| ------------------ | -------------- | ---------------------------------------------------- |
| `research_star_id` | number \| null | 仅 `archive_type=research_star` 时有值               |
| `primary_category` | string \| null | `project` / `software_copyright` / `published_paper` |
| `child_id`         | number \| null | 当前子项 id（若一条主记录只挂一个子项）              |

现状：前端只能靠 `title` 是否包含「科研项目 / 软件著作权 / 发表论文」来分页签（见
`src/shared/composables/useFormRecords.ts` 的 `RESEARCH_STAR_TITLE_HINTS`），标题一改就会错位。

---

## 五、错误码建议

| HTTP | code  | 场景                                         |
| ---- | ----- | -------------------------------------------- |
| 400  | 10003 | 参数校验失败（枚举、日期格式、文件 id 非法） |
| 403  | 40301 | 非本人记录 / 无学生权限                      |
| 404  | 30001 | `researchStarId` 或子项 id 不存在            |
| 409  | 40901 | 当前状态不允许编辑（1/2/4）                  |
| 409  | 40902 | 同一 `clientRequestId` 正在处理中            |

---

## 六、前端接入改造（接口上线后）

1. `src/shared/api/submission/submit.ts`：`submitResearchStarApplication` 增加 `recordId` 分支
   - 有 `recordId`：先 `PUT /awards/research-star/{researchStarId}`，再 `POST /submit`
   - 无 `recordId`：保持现有「POST 主记录 → POST 子项 → POST submit」
2. `src/shared/composables/useApplicationPage.ts`：编辑回填改用 `GET /awards/research-star/{applicationId}`
3. `src/shared/composables/useFormRecords.ts`：按 `primary_category` 分页签，移除标题匹配回退
4. 补单测：编辑提交前后 `/activities` 中该主记录数量不变（不新增重复行）

---

## 七、验收用例

1. 学生 A 的 `status=3` 科研项目记录，编辑名称后提交：原记录更新，列表仍 1 条，状态变为待审核。
2. 学生 A 的 `status=1` 记录调用更新接口：返回 `40901`，数据不变。
3. 学生 B 用自己的 token 更新学生 A 的子项：返回 `40301`。
4. 同一 `clientRequestId` 连续提交两次：只产生一份更新结果。
5. `evidenceFileIds` 传入他人文件 id：返回 `10003`，主记录与子项均不变（事务回滚）。
