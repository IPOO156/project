import antfu from '@antfu/eslint-config'

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
  },
  ignores: [
    // 参考手册、文档与修改记录中的代码片段不参与 ESLint 校验
    'claude.md',
    '开发手册.md',
    '前端开发规范与最佳实践（优化版）.md',
    'docs/**/*.md',
    '代码修改记录/**/*.md',
    // Husky 钩子脚本由 Husky 管理，不参与 ESLint 校验
    '.husky/**',
  ],
})
