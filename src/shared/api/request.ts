import axios from 'axios'
import { ElMessage } from 'element-plus'
import {
  clearAuth,
  getRefreshToken,
  getToken,
  writeTokenPreservingSource,
} from '@/shared/utils/token'

const request = axios.create({
  // 后端全局 context-path 为 /api/v1（见后端 application.yml），接口文档基础 URL 亦为 /api/v1。
  // 此前为 /api 与后端前缀不一致，联调时全部 404；现统一对齐后端契约。
  baseURL: '/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ── 401 令牌刷新：并发去重，单飞（singleton）──
let refreshPromise: Promise<string | null> | null = null

function tryRefreshToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return Promise.resolve(null)
  if (!refreshPromise) {
    refreshPromise = request
      .post('/auth/refresh', { refreshToken })
      .then((data) => {
        // 响应拦截器已解包 res.data，静态类型仍为 AxiosResponse，按真实形状取值
        const tokenResult = data as unknown as {
          accessToken?: string
          refreshToken?: string | null
        }
        const accessToken = tokenResult.accessToken
        if (accessToken) {
          // 回写新令牌时沿用旧 token 所在存储，避免把「记住我」降级为会话级
          writeTokenPreservingSource(accessToken, tokenResult.refreshToken)
          return accessToken
        }
        return null
      })
      .catch(() => {
        clearAuth()
        return null
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

function forceLogout() {
  clearAuth()
  window.location.href = '/login'
}

// 业务 401：登录/修改密码等接口返回 401 表示"凭据有误"而非"令牌过期"，
// 此时只提示错误信息，禁止触发令牌刷新与强制登出（否则原密码错误会误登出用户）。
function isBusiness401(url = '') {
  return url.includes('/auth/login') || url.includes('/auth/password')
}

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code !== 0 && res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res.data
  },
  (error) => {
    if (error.response) {
      const status = error.response.status
      const url: string | undefined = error.config?.url
      // 401：优先用 refreshToken 换新令牌并原样重试一次；刷新失败才回登录页。
      // 业务 401（登录/修改密码等凭据有误）不在此列，见 isBusiness401。
      if (status === 401 && !isBusiness401(url)) {
        return tryRefreshToken().then((token) => {
          if (!token) {
            forceLogout()
            return Promise.reject(error)
          }
          error.config.headers = {
            ...error.config.headers,
            Authorization: `Bearer ${token}`,
          }
          return request(error.config)
        })
      }
      switch (status) {
        case 401:
          // 登录请求（/auth/login）返回 401 表示账号/密码/验证码有误：
          // 只提示错误并交由登录页刷新验证码，禁止强制登出跳转导致整页刷新
          if (url?.includes('/auth/login')) {
            ElMessage.error(error.response.data?.message || '用户名、密码或验证码错误')
          } else if (url?.includes('/auth/password')) {
            // 修改密码/忘记密码返回 401 表示原密码或验证码有误：仅提示，不登出
            ElMessage.error(error.response.data?.message || '原密码错误或修改失败')
          } else {
            forceLogout()
          }
          break
        case 403:
          ElMessage.error('没有权限执行此操作')
          break
        case 429:
          ElMessage.error('请求过于频繁，请稍后重试')
          break
        case 500:
          ElMessage.error('服务器异常，请稍后重试')
          break
        case 404:
          // 接口未实现/路径不存在：静默降级，由调用方 catch 处理（展示空态），不弹全局错误
          break
        default:
          ElMessage.error(error.response.data?.message || '网络错误')
      }
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请检查网络')
    } else {
      ElMessage.error('网络异常，请检查网络连接')
    }
    return Promise.reject(error)
  },
)

export default request
