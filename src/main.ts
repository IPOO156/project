import { ElMessage } from 'element-plus'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import bookCursor from '@/shared/utils/bookCursor'
import { initAuthState } from '@/shared/utils/token'

import App from './App.vue'
import router from './app/router/routes'
import { initTabsRouter } from './app/stores/useTabsStore'
import { vPermission } from './shared/directives/permission'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './assets/styles/themes.css'
import './assets/styles/global.scss'
import './assets/styles/motion-override.scss'
import './assets/styles/teacher-console.scss'
import './shared/utils/echarts-setup'

// 项目动画策略：始终启用，不受系统 prefers-reduced-motion 影响
// 详细见 src/assets/styles/motion-override.scss 和 docs/2026-07-20.md
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-allow-motion', 'true')
}

// 清理历史遗留的 localStorage 令牌（无「记住我」标记），避免未登录直接进入系统。
// 必须在 router 安装前执行，确保首个导航守卫读到的是清理后的令牌状态。
initAuthState()

// 书册鼠标指针：配色自动跟随 html[data-theme]（theme store 切换时由 MutationObserver 同步）
// 加载态由 request.ts 的全局请求计数驱动（延迟 180ms 触发，避免短请求闪烁）
bookCursor.init({ theme: 'auto' })

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)
// 元素级权限指令：v-permission（无权限隐藏，admin 直通，与路由守卫同源）
app.directive('permission', vPermission)

// 注入 router 实例到 tabs store（store 初始化在首次使用时惰性执行，
// 此时 router 已通过 app.use(router) 注册完毕，无需等待组件渲染）
initTabsRouter(router)

// ── 全局错误兜底（CLAUDE.md 3.4：异常需日志记录，不向用户暴露技术细节）──
// 组件渲染错误统一捕获：记录日志并给出友好提示
app.config.errorHandler = (err) => {
  console.error('[GlobalError]', err)
  ElMessage.error('页面出现异常，请刷新重试')
}
// 未处理的 Promise rejection 仅记录日志（请求层 rejection 已由拦截器提示，此处避免重复弹窗）
window.addEventListener('unhandledrejection', (e) => {
  console.error('[UnhandledRejection]', e.reason)
})

app.mount('#app')
