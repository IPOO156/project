/// <reference types="vite/client" />

export {}

declare module 'vue-echarts' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<any, any, any>
  export default component
}

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    noLayout?: boolean
    affix?: boolean
  }
}
