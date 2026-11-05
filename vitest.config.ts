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
      // 统计范围为「状态与纯逻辑层」：Store、工具、常量、Composable，以及 features 下
      // 非组件的 .ts（组合式函数、映射工具）。.vue 组件依赖真实渲染，纳入覆盖率会长期失真，
      // 改由 E2E / 人工回归保障；类型声明与静态数据（*.types.ts / data/）无执行逻辑，不计入分母。
      include: [
        'src/app/stores/**/*.ts',
        'src/shared/utils/**/*.ts',
        'src/shared/constants/**/*.ts',
        'src/shared/composables/**/*.ts',
        'src/features/**/*.ts',
      ],
      exclude: ['src/features/**/*.types.ts', 'src/features/**/data/**'],
      thresholds: {
        // 全逻辑层下限：2026-10-25 实测 29.54 / 25.75 / 30.51 / 29.65（含 features 纯逻辑）。
        // 分母扩大后仍保持 28/28/29/25 不变，等于收紧约束；门槛只升不降，禁止为过 CI 而下调。
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
