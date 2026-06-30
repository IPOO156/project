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
})
