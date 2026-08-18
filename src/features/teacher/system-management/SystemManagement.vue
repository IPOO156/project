<script setup lang="ts">
/**
 * SystemManagement - 系统管理（教师端）
 * 将字典管理 / 角色管理 / 学期管理 三个子模块聚合为单页 Tabs，
 * 侧边栏与路由只保留「系统管理」一个入口。
 * 子模块组件保持独立（各自维护数据与操作），tab 首次激活时懒加载，
 * 切换不会销毁已加载的 tab，子页状态得以保留。
 */

// ── 1. 外部依赖导入 ──
import { ref } from 'vue'

import DictManagement from '../dict-management/DictManagement.vue'
import RoleManagement from '../role-management/RoleManagement.vue'
import SemesterManagement from '../semester-management/SemesterManagement.vue'

// ── 2. 类型/接口定义 ──
type SystemTabName = 'dict' | 'role' | 'semester'

// ── 3. Props & Emits（顶层页面，无）──

// ── 4. Store / Composable（无）──

// ── 5. 响应式数据 ──
const activeTab = ref<SystemTabName>('dict')

// ── 6. Computed（无）──

// ── 7. Watch（无）──

// ── 8. 生命周期（无）──

// ── 9. 方法函数（无）──
</script>

<template>
  <div class="mc-page system-management">
    <el-tabs v-model="activeTab" class="system-management__tabs">
      <el-tab-pane label="字典管理" name="dict" lazy>
        <DictManagement />
      </el-tab-pane>
      <el-tab-pane label="角色管理" name="role" lazy>
        <RoleManagement />
      </el-tab-pane>
      <el-tab-pane label="学期管理" name="semester" lazy>
        <SemesterManagement />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="scss">
.system-management {
  // 子页面自带 mc-page-head（含标题与操作按钮），Tabs 内容区顶部留白衔接
  &__tabs {
    :deep(.el-tabs__content) {
      padding-top: $spacing-md;
    }
  }
}
</style>
