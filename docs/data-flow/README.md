# 数据流文档

> 描述项目中的主要数据流向，帮助开发者理解请求、状态更新与视图渲染的关系。

## 通用数据流

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│  用户交互    │ --> │ Vue Component   │ --> │ Composable   │
│ (点击/提交)  │     │                 │     │ / Store      │
└─────────────┘     └─────────────────┘     └──────┬───────┘
                                                   │
                                                   v
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│  视图更新    │ <-- │    Component    │ <-- │   API 响应    │
│             │     │   (re-render)   │     │              │
└─────────────┘     └─────────────────┘     └──────────────┘
                           ^
                           │
                    ┌──────┴───────┐
                    │   Pinia Store │
                    │  (全局状态)   │
                    └───────────────┘
```

1. 用户操作触发组件方法。
2. 组件调用 Composable 或 Store Action。
3. Composable/Store 通过 `src/shared/api/request.ts` 发起 HTTP 请求。
4. 响应拦截器处理统一错误码与提示。
5. 数据回写到 Composable 的响应式变量或 Pinia Store。
6. 组件依赖的响应式数据变化，触发重新渲染。

## 申报模块数据流

以学科竞赛申报为例，其他申报模块遵循相同模式：

```
CompetitionList.vue
        │
        v
useApplication()  ──>  useTableQuery() ──>  request.get('/api/competition')
        │                                           │
        │                                           v
        │<───────────────  PaginatedData<Competition>
        v
formData / tableData / pagination
```

- 列表页初始化时调用 `useTableQuery` 拉取分页数据。
- 表单提交时调用 `useApplication` 封装的提交逻辑。
- 文件上传统一走 `useUpload`。

## 审批模块数据流

```
PendingApproval.vue / SubmitRecords.vue
        │
        v
useTableQuery()  ──>  request.get('/api/approval')
        │
        v
PaginatedData<ApprovalItem>
```

- 待审批列表与提交记录列表均通过 `useTableQuery` 获取。
- 审批操作（通过/驳回）通过对应 Action 发送 `POST/PUT` 请求。

## 用户认证数据流

```
Login.vue
    │
    v
useUserStore.login()  ──>  request.post('/api/auth/login')
    │
    v
localStorage.setItem('token', token)
    │
    v
router.push('/dashboard')
```

- 登录成功后写入 `token` 到 `localStorage`。
- 路由守卫读取 `token` 判断登录态。
- 请求拦截器自动携带 `Authorization: Bearer <token>`。
