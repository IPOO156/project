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
        api: 'legacy',
        additionalData: `@use "variables.scss" as *;\n`,
        includePaths: [resolve(__dirname, 'src/assets/styles')],
      },
    },
  },
  server: {
    // 端口必须是后端 WebConfig 默认 CORS 白名单中的地址（3000/5173/8080），
    // 否则登录等带 Origin 的请求会被后端以 403 Invalid CORS request 拒绝。
    // 默认指向服务器已部署后端（111.228.56.207:8089，context-path 为 /api/v1）。
    // 需联调本地后端时，先启动后端，再以 VITE_API_PROXY_TARGET=http://localhost:8080 启动前端。
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://111.228.56.207:8089',
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
          'element-plus': ['element-plus', '@element-plus/icons-vue'],
          echarts: ['echarts', 'vue-echarts'],
          pdf: ['jspdf', 'html2canvas'],
        },
      },
    },
  },
})
