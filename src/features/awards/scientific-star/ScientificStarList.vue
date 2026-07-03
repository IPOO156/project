<script setup lang="ts">
import { ref } from 'vue'
import PaperList from './PaperList.vue'
import ScientificProjectList from './ScientificProjectList.vue'
import SoftwareCopyrightList from './SoftwareCopyrightList.vue'

const activeTab = ref<'project' | 'copyright' | 'paper'>('project')
</script>

<template>
  <div class="app-page">
    <el-alert title="科研之星报名说明" type="info" :closable="false" show-icon>
      <p>科研之星报名包含科研项目、软件著作权和论文三类成果，请根据实际情况填写并上传证明材料。</p>
    </el-alert>

    <el-card class="mt-16">
      <el-tabs v-model="activeTab">
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
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.app-page {
  display: flex;
  flex-direction: column;
  gap: 16px;

  // el-alert 内容段落默认边距过大，Element Plus 未提供相关 props，需通过 :deep() 覆盖内部类名。
  &__alert :deep(p) {
    margin: 4px 0;
    font-size: 13px;
  }
}
</style>
