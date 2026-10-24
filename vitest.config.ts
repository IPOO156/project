import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * 单元测试配置（与 vite.config.ts 分离，避免单元测试加载 Vue 插件与开发代理）。
 * 默认 environment 为 node；需要浏览器存储的用例在文件头用
 * `// @vitest-environment jsdom` 单独声明，避免全量用例变慢。
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['tests/unit/**/*.spec.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // 只对「纯逻辑」模块设门槛：组件与页面走 E2E/人工回归，纳入覆盖率会长期失真
      include: [
        'src/app/stores/notificationHelpers.ts',
        'src/shared/utils/token.ts',
        'src/shared/utils/session.ts',
        'src/shared/constants/loadingTips.ts',
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 70,
      },
    },
  },
})
