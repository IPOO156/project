<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { Edit2 } from 'lucide-vue-next'
import { ref } from 'vue'
import { useArchiveStore } from '@/app/stores/stores'
import { updateSelfEvaluation } from '@/shared/api/student'

const archiveStore = useArchiveStore()

const selfEvaluation = ref('')
const editing = ref(false)

function startEdit() {
  selfEvaluation.value = archiveStore.profileData?.selfEvaluation ?? ''
  editing.value = true
}

function cancel() {
  editing.value = false
}

/** 全量更新自我评价（PUT /profile/self-evaluation，4.1.6；传空字符串表示清空） */
async function save() {
  try {
    await updateSelfEvaluation(selfEvaluation.value ?? '')
    editing.value = false
    // 保存后回读 /profile/info，保证展示与后端一致
    await archiveStore.fetchArchive()
    ElMessage.success('自我评价已保存')
  } catch {
    ElMessage.error('保存失败，请稍后重试')
  }
}
</script>

<template>
  <el-card class="section-card" shadow="never">
    <template #header>
      <div class="section-head">
        <span class="section-head__title"><Edit2 :size="15" /> 自我评价</span>
        <el-button v-if="!editing" link type="primary" size="small" :icon="Edit2" @click="startEdit"
          >编辑</el-button
        >
        <div v-else class="edit-actions">
          <el-button size="small" @click="cancel">取消</el-button
          ><el-button size="small" type="primary" @click="save">保存</el-button>
        </div>
      </div>
    </template>
    <el-input
      v-if="editing"
      v-model="selfEvaluation"
      type="textarea"
      :rows="4"
      maxlength="2000"
      show-word-limit
      placeholder="请描述你的自我评价，最长 2000 字"
    />
    <p v-else class="self-eval__text">
      {{ archiveStore.profileData?.selfEvaluation || '暂无自我评价' }}
    </p>
  </el-card>
</template>

<style scoped lang="scss">
.section-card {
  border: 1px solid #f1f5f9;
  border-radius: 10px;

  :deep(.el-card__body) {
    padding: 16px 20px;
  }
}
.section-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-head__title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}
.edit-actions {
  display: flex;
  gap: 6px;
}
.self-eval__text {
  margin: 0;
  font-size: 13px;
  color: #475569;
  line-height: 1.7;
  white-space: pre-wrap;
}
</style>
