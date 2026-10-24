/**
 * 用户级 / 账号级本地存储键集中定义
 *
 * 区分原则：
 *  - 「用户级」键：内容随登录账号变化，登出（含 401 强制登出）必须清除，
 *    避免公用电脑残留上一账号的身份缓存与表单草稿。
 *  - 「设备级偏好」键：如主题 app_theme_mode、AI 悬浮球位置等，登出保留。
 */

/** 身份缓存 key：登录后写入，供标签栏/路由守卫读取 loginType（端级分流） */
export const USER_INFO_CACHE_KEY = 'user_info_cache'

/** 头像本地缓存：上传接口成功返回 OSS URL / Base64 后写入，避免刷新后头像丢失 */
export const USER_AVATAR_CACHE_KEY = 'user_avatar_cache'

/** 教师当前登录者身份缓存（/auth/me 的 roles / permissions / scopes） */
export const TEACHER_ME_KEY = 'teacher_me'

/** 表单草稿前缀：每页表单草稿键为 `form_draft_<key>`，登出后需按前缀整批清除 */
export const DRAFT_PREFIX = 'form_draft_'

/** 已撤回申报记录 id 标记（submission store 本地持久化，属账号级数据） */
export const SUBMISSION_WITHDRAWN_KEY = 'submission:withdrawnIds'

/** 学习建议收藏的提示 id 列表（账号级偏好，登出清理，避免公用电脑残留） */
export const LOADING_TIP_FAVORITES_KEY = 'loading_tip:favorites'

/** 已屏蔽的提示主题列表（账号级偏好，登出清理） */
export const LOADING_TIP_HIDDEN_KEY = 'loading_tip:hidden_categories'

/** 上一条已展示的提示 id：用于避免同一会话内连续重复推送（会话级，不随登出清理） */
export const LOADING_TIP_LAST_ID_KEY = 'loading_tip:last_id'
