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
      // 统计范围为「状态与纯逻辑层」：Store、工具、常量、Composable。
      // 组件与页面依赖真实渲染，纳入覆盖率会长期失真，改由 E2E / 人工回归保障。
      include: [
        'src/app/stores/**/*.ts',
        'src/shared/utils/**/*.ts',
        'src/shared/constants/**/*.ts',
        'src/shared/composables/**/*.ts',
      ],
      thresholds: {
        // 全逻辑层下限：2026-10-25 实测 30.51 / 27 / 33.67 / 30.53，向下取整留出波动余量。
        // 门槛只升不降：新增测试后应同步上调，禁止为过 CI 而下调。
        lines: 28,
        statements: 28,
        functions: 29,
        branches: 25,
        // 原白名单 4 个纯逻辑文件继续维持 80/80/80/70 的严格门槛，防止既有覆盖退化
        'src/app/stores/notificationHelpers.ts': {
          lines: 80,
          statements: 80,
          functions: 80,
          branches: 70,
        },
        'src/shared/utils/token.ts': {
          lines: 80,
          statements: 80,
          functions: 80,
          branches: 70,
        },
        'src/shared/utils/session.ts': {
          lines: 80,
          statements: 80,
          functions: 80,
          branches: 70,
        },
        'src/shared/constants/loadingTips.ts': {
          lines: 80,
          statements: 80,
          functions: 80,
          branches: 70,
        },
      },
    },
  },
})
