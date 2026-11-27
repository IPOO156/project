import antfu from '@antfu/eslint-config'
import eslintConfigPrettier from 'eslint-config-prettier'

export default antfu({
  rules: {
    'vue/max-attributes-per-line': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    'vue/html-self-closing': 'off',
    'unused-imports/no-unused-vars': 'warn',
    'no-console': 'warn',
    'ts/no-use-before-define': 'off',
    'node/prefer-global/process': 'off',
    'style/max-statements-per-line': 'off',
    'ts/no-empty-object-type': 'off',
    // 禁止显式 any：动态后端字段用 unknown + @/shared/utils/unknown 的 asRecord/asText 等收窄
    'ts/no-explicit-any': 'error',
    // Prettier 会把 `if (x)\n  return` 合并成一行，与 antfu/if-newline 冲突
    'antfu/if-newline': 'off',
  },
  ignores: [
    // 测试产物
    'login-result.json',
    '*.result.json',
    'dist/**',
    // 运行检查脚本/截图/报告，非产品代码
    '.runtime-check/**',
    // 参考手册、文档与修改记录中的代码片段不参与 ESLint 校验
    // Windows 下文件名不区分大小写，仓库跟踪为 claude.md、磁盘上可能显示为 CLAUDE.md，两者都要忽略
    'claude.md',
    'CLAUDE.md',
    '开发手册.md',
    '前端开发规范与最佳实践（优化版）.md',
    'docs/**/*.md',
    '代码修改记录/**/*.md',
    // Cursor AI 规则目录：含 markdown 中的示例代码片段，不参与 ESLint 校验
    '.cursor/**',
    // Husky 钩子脚本由 Husky 管理，不参与 ESLint 校验
    '.husky/**',
    // Node 依赖
    'node_modules/**',
  ],
})
  .append(eslintConfigPrettier)
  .append(
    // 分层约束（见 docs/architecture.md「分层约束」）：
    // 页面/组件层禁止绕过服务层直接用 axios，保证 token、错误提示、401 兜底只有一处实现。
    {
      name: 'project/layer-boundary-views',
      files: [
        'src/views/**/*.ts',
        'src/views/**/*.vue',
        'src/components/**/*.ts',
        'src/components/**/*.vue',
        'src/layouts/**/*.ts',
        'src/layouts/**/*.vue',
      ],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'axios',
                message: '请求统一走 @/shared/api，禁止在页面/组件层直接使用 axios',
              },
            ],
          },
        ],
      },
    },
    // shared 层不得反向依赖视图层 / 组件层 / 应用装配层；仅类型导入放行。
    // ignores 中的文件是已知技术债，改完应同步从列表移除（只减不增）。
    {
      name: 'project/layer-boundary-shared',
      files: ['src/shared/**/*.ts', 'src/shared/**/*.vue'],
      ignores: [
        // 学习建议组合式函数读 user store 的年级，且被 components/ui/StudyTipInline 复用；
        // 迁移需先把该 UI 组件改为纯展示（props 注入），暂列例外。
        'src/shared/composables/useLoadingTip.ts',
      ],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: [
                  '@/views',
                  '@/views/*',
                  '@/views/**',
                  '@/components',
                  '@/components/*',
                  '@/components/**',
                  '@/layouts',
                  '@/layouts/*',
                  '@/router',
                  '@/router/*',
                  '@/stores',
                  '@/stores/*',
                  '@/composables',
                  '@/composables/*',
                ],
                allowTypeImports: true,
                message: 'shared 层不得反向依赖视图层 / 组件层（分层红线）',
              },
            ],
          },
        ],
      },
    },
  )
