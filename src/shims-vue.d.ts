// 为不具备 Vue 语言服务的 TypeScript 环境提供 .vue 模块声明兜底
// （vue-tsc / Volar 会优先使用 .vue 文件的真实类型，此声明仅作回退）
declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<any, any, any>
  export default component
}
