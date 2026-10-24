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
    // 后端地址以《学生端接口文档.md》（V5.8，2026-08-09）基础 URL 为准。
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://vf2a39ce.natappfree.cc',
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
