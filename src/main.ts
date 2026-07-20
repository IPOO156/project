import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'

import router from './app/router/routes'
import { initTabsRouter } from './app/stores/tabs'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './assets/styles/themes.css'
import './assets/styles/global.scss'
import './assets/styles/motion-override.scss'
import './shared/utils/echarts-setup'

// 项目动画策略：始终启用，不受系统 prefers-reduced-motion 影响
// 详细见 src/assets/styles/motion-override.scss 和 docs/2026-07-20.md
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-allow-motion', 'true')
}

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(ElementPlus, { locale: zhCn })

// 注入 router 实例到 tabs store（store 初始化在首次使用时惰性执行，
// 此时 router 已通过 app.use(router) 注册完毕，无需等待组件渲染）
initTabsRouter(router)

app.mount('#app')
