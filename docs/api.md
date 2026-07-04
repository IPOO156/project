# 通用接口清单

> 按《前端开发规范与最佳实践（优化版）》2.4 / claude.md 八、项目文档结构 要求维护。
> 所有通用接口（被 ≥2 个模块调用）需登记到本文档。

## 登记格式

| 接口名 | URL            | Method | 请求字段                | 响应字段          | 调用示例 | 负责人 |
| ------ | -------------- | ------ | ----------------------- | ----------------- | -------- | ------ |
| 示例   | `/api/example` | GET    | `{ pageNum, pageSize }` | `{ list, total }` | ...      | ...    |

## 通用约定

### 1. 响应结构

后端统一返回：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

- `code === 0 || code === 200`：业务成功；其余视为业务异常，由响应拦截器统一 `ElMessage.error`。
- `message`：异常时的提示文案。
- `data`：实际业务数据。

### 2. 错误码处理

| HTTP 状态    | 前端处理行为                                  |
| ------------ | --------------------------------------------- |
| 401          | 清除 `token` 并跳转 `/login`                  |
| 403          | `ElMessage.error('没有权限执行此操作')`       |
| 429          | `ElMessage.error('请求过于频繁，请稍后重试')` |
| 500          | `ElMessage.error('服务器异常，请稍后重试')`   |
| ECONNABORTED | `ElMessage.error('请求超时，请检查网络')`     |

### 3. 分页参数

| 字段       | 类型   | 说明                |
| ---------- | ------ | ------------------- |
| `pageNum`  | number | 当前页码，从 1 开始 |
| `pageSize` | number | 每页条数            |

分页响应结构见 `src/shared/types/types.ts` 中的 `PaginatedData<T>`。

### 4. 请求封装

统一使用 `src/shared/api/request.ts` 创建的 axios 实例：

- `baseURL: '/api'`
- `timeout: 15000`
- 自动注入 `Authorization: Bearer <token>`
- 自动处理通用错误提示

## 当前通用接口

### 文件上传

| 接口名   | URL           | Method | 请求字段                    | 响应字段          | 调用示例    | 负责人 |
| -------- | ------------- | ------ | --------------------------- | ----------------- | ----------- | ------ |
| 文件上传 | `/api/upload` | POST   | `FormData`（字段名 `file`） | `{ url: string }` | `useUpload` | 前端   |

- 默认限制：单文件 ≤ 10MB，允许格式 `.jpg/.png/.pdf/.doc/.docx`。
- 被多个申报表单模块复用，统一封装在 `src/shared/composables/useUpload.ts`。

## 待补充接口

目前业务接口层处于 Mock/占位阶段，尚未与后端完成正式接口联调。各申报模块（竞赛、创新创业、奖学金、荣誉证书、实习、组织履历、实训、社会实践、图书心得、竞赛之星、科研之星等）的增删改查接口，将在后端接口文档确定后按上方格式补充。

> 后端接口文档统一存放路径：`D:\ruidao\laravel-first\NewRuiDao\docs\conclusion`（见 claude.md 3.3）
