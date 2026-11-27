import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))
const srcDir = resolve(__dirname, 'src').replace(/\\/g, '/')

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': srcDir,
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // modern-compiler 走 Sass 现代 API，消除 legacy API 的弃用告警；
        // 现代 API 的加载路径选项为 loadPaths（includePaths 只属于 legacy API）
        api: 'modern-compiler',
        additionalData: `@use "variables.scss" as *;\n`,
        loadPaths: [resolve(__dirname, 'src/assets/styles')],
      },
    },
  },
  server: {
    // 端口必须是后端 WebConfig 默认 CORS 白名单中的地址（3000/5173/8080），
    // 否则登录等带 Origin 的请求会被后端以 403 Invalid CORS request 拒绝。
    // 本地联调指向服务器已部署后端（111.228.56.207:8089，
    // context-path 为 /api/v1，前端 baseURL '/api/v1' 由此经代理转发）。
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://111.228.56.207:8089',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // 按依赖域拆包：主包曾达 919KB，拆分后首屏并行加载、缓存粒度更细。
        // 注意：element-plus 为按需引入，分包名只影响落地位置，不改变引入方式。
        manualChunks: {
          vue: ['vue', 'vue-router', 'pinia'],
          // echarts / pdf / element-plus 不单独列 manualChunks：
          // 一旦列入，Vite 会在 index.html 为它们注入 modulepreload，
          // 登录页/首页也会被迫下载图表、导出库与全量组件库。
          // 交给路由级动态 import 与 Rollup 自动分包按需加载，移动端首屏更轻。
        },
      },
    },
  },
})
