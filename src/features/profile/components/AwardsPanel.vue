<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { Award, Plus } from 'lucide-vue-next'
import { reactive, ref } from 'vue'
import { useArchiveStore } from '@/app/stores/stores'

const props = defineProps<{
  awards: Array<{ id: string; name: string; level: string; prize?: string; date: string }>
}>()

const archiveStore = useArchiveStore()

const AWARD_LEVEL_LABELS: Record<string, string> = {
  national: '国家级',
  provincial: '省级',
  school: '校级',
  college: '院级',
}

const awardDialogVisible = ref(false)
const editingAwardId = ref<string | null>(null)
const awardForm = reactive({ name: '', level: '', prize: '', date: '' })

function openAddAward() {
  editingAwardId.value = null
  awardForm.name = ''
  awardForm.level = ''
  awardForm.prize = ''
  awardForm.date = ''
  awardDialogVisible.value = true
}

function openEditAward(id: string) {
  editingAwardId.value = id
  const item = props.awards.find((a) => a.id === id)
  if (!item) return
  awardForm.name = item.name
  awardForm.level = item.level
  awardForm.prize = item.prize ?? ''
  awardForm.date = item.date
  awardDialogVisible.value = true
}

async function saveAward() {
  if (!awardForm.name || !awardForm.level) {
    ElMessage.warning('请填写完整信息')
    return
  }
  try {
    const payload = {
      name: awardForm.name,
      level: awardForm.level,
      prize: awardForm.prize,
      date: awardForm.date,
      type: 'other',
    }
    if (editingAwardId.value) {
      await archiveStore.editAward(editingAwardId.value, payload)
    } else {
      await archiveStore.createAward(payload)
    }
    awardDialogVisible.value = false
  } catch {
    ElMessage.error('保存失败，请重试')
  }
}

function deleteAward(id: string) {
  ElMessageBox.confirm('确定删除该奖项吗？', '删除确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => archiveStore.removeAward(id))
    .catch(() => {})
}
</script>

<template>
  <el-card class="profile-card">
    <template #header>
      <div class="card-header">
        <div class="card-header__left">
          <Award :size="16" />
          <span>个人奖项</span>
        </div>
        <el-button link type="primary" size="small" :icon="Plus" @click="openAddAward">
          新增
        </el-button>
      </div>
    </template>
    <div class="award-list">
      <div v-for="a in awards" :key="a.id" class="award-item">
        <div class="award-item__icon">
          <Award :size="18" />
        </div>
        <div class="award-item__body">
          <div class="award-item__name">{{ a.name }}</div>
          <div class="award-item__meta">
            <el-tag size="small" type="warning" effect="plain">{{
              AWARD_LEVEL_LABELS[a.level] ?? a.level
            }}</el-tag>
            <span v-if="a.prize">{{ a.prize }}</span>
            <span>{{ a.date }}</span>
          </div>
        </div>
        <div class="award-item__actions">
          <el-button link type="primary" size="small" @click="openEditAward(a.id)">
            编辑
          </el-button>
          <el-button link type="danger" size="small" @click="deleteAward(a.id)"> 删除 </el-button>
        </div>
      </div>
    </div>
  </el-card>

  <el-dialog
    v-model="awardDialogVisible"
    :title="editingAwardId ? '编辑奖项' : '新增奖项'"
    width="480px"
    :close-on-click-modal="false"
  >
    <el-form :model="awardForm" label-width="80px">
      <el-form-item label="奖项名称" required>
        <el-input v-model="awardForm.name" placeholder="请输入奖项名称" />
      </el-form-item>
      <el-form-item label="奖项级别" required>
        <el-select v-model="awardForm.level" class="form-select" placeholder="请选择级别">
          <el-option label="国家级" value="national" />
          <el-option label="省级" value="provincial" />
          <el-option label="校级" value="school" />
          <el-option label="院级" value="college" />
        </el-select>
      </el-form-item>
      <el-form-item label="获奖等级">
        <el-input v-model="awardForm.prize" placeholder="如 一等奖、优秀干部" />
      </el-form-item>
      <el-form-item label="获奖时间">
        <el-date-picker
          v-model="awardForm.date"
          type="month"
          placeholder="选择月份"
          format="YYYY-MM"
          value-format="YYYY-MM"
          class="form-select"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="awardDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="saveAward">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.profile-card {
  margin-bottom: 0;

  :deep(.el-card__body) {
    padding: 16px 20px;
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 15px;
  font-weight: 600;

  &__left {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--el-text-color-primary);
  }
}

.award-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.award-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  transition: border-color 0.2s;

  &:hover {
    border-color: #d4a574;
  }

  &__icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(212, 165, 116, 0.1);
    color: #d4a574;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 4px;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex-shrink: 0;
  }
}
</style>
