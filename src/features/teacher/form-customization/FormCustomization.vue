<script setup lang="ts">
/**
 * FormCustomization - 表单自定义（菜单/申报项目）
 *
 * 后端现状：/admin/form-templates 与 /admin/navigation 接口尚未实现，
 * 本页面展示待后端就绪的空态。接口就绪后按契约对接。
 */
import { RefreshCw, SlidersHorizontal } from 'lucide-vue-next'
</script>

<template>
  <div class="mc-page">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <h2 class="mc-page-head__title">表单自定义</h2>
        <p class="mc-page-head__desc">维护学生端申报项目菜单，新增申报类别、调整字段并发布版本。</p>
      </div>
      <div class="mc-page-head__actions">
        <el-button :icon="RefreshCw">刷新</el-button>
      </div>
    </div>

    <div class="mc-card">
      <div class="mc-card__body">
        <div class="mc-empty">
          <div class="mc-empty__icon"><SlidersHorizontal :size="24" /></div>
          <p class="mc-empty__title">表单自定义待后端就绪</p>
          <p class="mc-empty__desc">
            申报项目模板（/admin/form-templates）与菜单结构（/admin/navigation）接口后端尚未实现，
            接口就绪后本页面将自动加载并支持新增 / 编辑 / 发布。
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
