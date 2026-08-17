import axios from 'axios'
import { ElMessage } from 'element-plus'

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
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

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
      switch (error.response.status) {
        case 401:
          localStorage.removeItem('token')
          window.location.href = '/login'
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
