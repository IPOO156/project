<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import PaperList from './PaperList.vue'
import ScientificProjectList from './ScientificProjectList.vue'
import SoftwareCopyrightList from './SoftwareCopyrightList.vue'

// 支持 ?sub=project|copyright|paper 定位子页签（消息中心"编辑"跳转 sourcePathOf 携带，
// 见 2026-08-31 修改记录）；无效值回退默认「科研项目」。
const route = useRoute()
const subKey = typeof route.query.sub === 'string' ? route.query.sub : ''
const activeTab = ref<'project' | 'copyright' | 'paper'>(
  subKey === 'copyright' || subKey === 'paper' ? subKey : 'project',
)
</script>

<template>
  <div class="app-page page-enter">
    <el-alert title="科研之星报名说明" type="info" :closable="false" show-icon>
      <p>科研之星报名包含科研项目、软件著作权和论文三类成果，请根据实际情况填写并上传证明材料。</p>
    </el-alert>

    <!-- 子页签只包住页签条本身，不再用 el-card 包整页：
         否则里面的表单卡 / 记录卡会形成「卡中卡」，整块内容也比其他之星分类内缩 20px -->
    <el-tabs v-model="activeTab" class="sci-tabs">
      <el-tab-pane label="科研项目" name="project">
        <ScientificProjectList />
      </el-tab-pane>
      <el-tab-pane label="软件著作权" name="copyright">
        <SoftwareCopyrightList />
      </el-tab-pane>
      <el-tab-pane label="发表论文" name="paper">
        <PaperList />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="scss">
.page-enter {
  @include page-enter;
}

.app-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  user-select: none;

  // el-alert 内容段落默认边距过大，Element Plus 未提供相关 props，需通过 :deep() 覆盖内部类名。
  &__alert :deep(p) {
    margin: 4px 0;
    font-size: 13px;
  }
}

/* 页签条单独做成一张卡片，与分类条 / 表单卡同一套描边圆角；
   通过 :deep() 限定作用域覆盖 el-tabs 内部类，避免影响其他页签组件 */
.sci-tabs :deep(.el-tabs__header) {
  margin: 0 0 16px;
  padding: 0 16px;
  border: 1px solid var(--el-border-color);
  border-radius: $radius-lg;
  background: var(--el-bg-color);
  box-shadow: $shadow-sm;
}

/* 卡片自带描边，去掉 el-tabs 默认的整条下划线 */
.sci-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.sci-tabs :deep(.el-tabs__item) {
  height: 44px;
  font-size: 13px;
}
</style>
