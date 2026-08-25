<script setup lang="ts">
import type { TagProps } from 'element-plus'
import type { Interest } from '@/shared/types/types'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Heart, Lightbulb, Plus } from 'lucide-vue-next'
import { computed, reactive, ref } from 'vue'
import { useArchiveStore } from '@/app/stores/stores'
import { useDict } from '@/shared/composables/composables'
import { INTEREST_LEVEL } from '@/shared/constants/dict'

const props = defineProps<{ interests: Interest[] }>()

const archiveStore = useArchiveStore()

const { getColor, getLabel } = useDict(INTEREST_LEVEL)
const getInterestType = computed(
  () =>
    (level: number): TagProps['type'] =>
      (getColor(level) as TagProps['type']) ?? 'info',
)

const interestDialogVisible = ref(false)
const editingInterestId = ref<number | null>(null)
const interestForm = reactive<{ tagName: string; detailContent: string; proficiencyLevel: number }>(
  {
    tagName: '',
    detailContent: '',
    proficiencyLevel: 2,
  },
)

function openAddInterest() {
  editingInterestId.value = null
  interestForm.tagName = ''
  interestForm.detailContent = ''
  interestForm.proficiencyLevel = 2
  interestDialogVisible.value = true
}

function openEditInterest(id: number) {
  editingInterestId.value = id
  const item = props.interests.find((i) => i.id === id)
  if (!item) return
  interestForm.tagName = item.tagName
  interestForm.detailContent = item.detailContent
  interestForm.proficiencyLevel = item.proficiencyLevel
  interestDialogVisible.value = true
}

async function saveInterest() {
  if (!interestForm.tagName.trim() || !interestForm.detailContent.trim()) {
    ElMessage.warning('请填写完整信息')
    return
  }
  try {
    if (editingInterestId.value !== null)
      await archiveStore.editInterest(editingInterestId.value, { ...interestForm })
    else await archiveStore.createInterest({ ...interestForm })
    interestDialogVisible.value = false
  } catch {
    ElMessage.error('保存失败')
  }
}

function deleteInterest(id: number) {
  ElMessageBox.confirm('确定删除该兴趣吗？', '确认', { type: 'warning' })
    .then(() => archiveStore.removeInterest(id))
    .catch(() => {})
}
</script>

<template>
  <el-card class="section-card" shadow="never">
    <template #header>
      <div class="section-head">
        <span class="section-head__title"><Heart :size="15" /> 个人兴趣</span>
        <el-button link type="primary" size="small" :icon="Plus" @click="openAddInterest">
          新增
        </el-button>
      </div>
    </template>
    <div class="interest-grid">
      <div v-for="item in interests" :key="item.id" class="interest-card">
        <div class="interest-card__top">
          <Lightbulb :size="13" /><span class="interest-card__cat">{{ item.tagName }}</span
          ><el-tag :type="getInterestType(item.proficiencyLevel)" size="small" effect="plain">{{
            getLabel(item.proficiencyLevel)
          }}</el-tag>
        </div>
        <p class="interest-card__text">{{ item.detailContent }}</p>
        <div class="interest-card__acts">
          <el-button link type="primary" size="small" @click="openEditInterest(item.id)">
            编辑
          </el-button>
          <el-button link type="danger" size="small" @click="deleteInterest(item.id)">
            删除
          </el-button>
        </div>
      </div>
    </div>
  </el-card>

  <el-dialog
    v-model="interestDialogVisible"
    :title="editingInterestId ? '编辑兴趣' : '新增兴趣'"
    width="480px"
  >
    <el-form :model="interestForm" label-width="80px">
      <el-form-item label="标签名称" required
        ><el-input v-model="interestForm.tagName" placeholder="请输入标签名称"
      /></el-form-item>
      <el-form-item label="具体内容" required
        ><el-input v-model="interestForm.detailContent" placeholder="请输入具体内容"
      /></el-form-item>
      <el-form-item label="掌握程度"
        ><el-select v-model="interestForm.proficiencyLevel"
          ><el-option label="入门" :value="1" /><el-option label="一般" :value="2" /><el-option
            label="熟练"
            :value="3" /><el-option label="精通" :value="4" /></el-select
      ></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="interestDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="saveInterest">保存</el-button>
    </template>
  </el-dialog>
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

.interest-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.interest-card {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
  background: #f8fafc;
  transition: border-color 0.2s;

  &:hover {
    border-color: #e2e8f0;
  }
}

.interest-card__top {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 4px;
  color: #4a7fb5;
}

.interest-card__cat {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  flex: 1;
}

.interest-card__text {
  margin: 0 0 6px;
  font-size: 13px;
  color: #64748b;
  line-height: 1.4;
}

.interest-card__acts {
  display: flex;
  gap: 8px;
}

@media (max-width: 900px) {
  .interest-grid {
    grid-template-columns: 1fr;
  }
}
</style>
