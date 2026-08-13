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
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
