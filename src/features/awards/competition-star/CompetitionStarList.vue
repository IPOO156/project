<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { reactive, ref } from 'vue'
import { AWARD_LEVELS, COMPETITION_TYPES, SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import DictColumn from '@/shared/ui/DictColumn.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'
import StatusTag from '@/shared/ui/StatusTag.vue'

interface CompetitionStarItem {
  id: string
  semester: string
  competitionName: string
  competitionDate: string
  competitionLevel: string
  awardLevel: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  submitDate: string
  proofMaterials: string[]
}

function emptyForm() {
  return {
    semester: '',
    competitionName: '',
    competitionDate: '',
    competitionLevel: '',
    awardLevel: '',
    proofMaterials: [] as string[],
  }
}

const form = reactive(emptyForm())
const list = ref<CompetitionStarItem[]>([
  { id: '1', semester: '2023-2024-1', competitionName: '全国大学生数学建模竞赛', competitionDate: '2025-09', competitionLevel: 'national', awardLevel: 'second', status: 'submitted', submitDate: '2025-10-01', proofMaterials: [] },
])
const editingId = ref<string | null>(null)
const submitting = ref(false)

function reset() {
  Object.assign(form, emptyForm())
  editingId.value = null
}

function handleSubmit() {
  submitting.value = true
  setTimeout(() => {
    if (editingId.value) {
      const idx = list.value.findIndex(i => i.id === editingId.value)
      if (idx > -1) {
        list.value[idx] = {
          ...list.value[idx],
          ...form,
          status: 'submitted',
          submitDate: new Date().toISOString().slice(0, 10),
        }
      }
      ElMessage.success('报名信息已更新')
    }
    else {
      list.value.unshift({
        id: `${Date.now()}`,
        ...form,
        status: 'submitted',
        submitDate: new Date().toISOString().slice(0, 10),
        proofMaterials: [],
      })
      ElMessage.success('报名提交成功')
    }
    reset()
    submitting.value = false
  }, 600)
}

function edit(row: CompetitionStarItem) {
  editingId.value = row.id
  Object.assign(form, {
    semester: row.semester,
    competitionName: row.competitionName,
    competitionDate: row.competitionDate,
    competitionLevel: row.competitionLevel,
    awardLevel: row.awardLevel,
    proofMaterials: row.proofMaterials,
  })
}

function remove(row: CompetitionStarItem) {
  ElMessageBox.confirm(`确定删除 "${row.competitionName}" 的报名记录吗？`, '提示', { type: 'warning' })
    .then(() => {
      list.value = list.value.filter(i => i.id !== row.id)
      ElMessage.success('删除成功')
      if (editingId.value === row.id)
        reset()
    })
    .catch(() => {})
}
</script>

<template>
  <ApplicationFormRecord
    alert-title="竞赛之星报名说明"
    alert-description="竞赛之星用于评选在学科竞赛中表现突出的同学。请填写参赛信息及获奖情况，提交后可在下方查看报名记录。"
    :is-editing="!!editingId"
    :submitting="submitting"
    :records="list"
    @submit="handleSubmit"
    @cancel="reset"
    @edit="edit"
    @remove="remove"
  >
    <template #form>
      <el-form :model="form" label-width="120px">
        <el-form-item label="学期" required>
          <el-select v-model="form.semester" placeholder="请选择" class="form-select">
            <el-option v-for="s in SEMESTER_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="竞赛名称" required><el-input v-model="form.competitionName" /></el-form-item>
        <el-form-item label="参赛时间" required><el-date-picker v-model="form.competitionDate" type="month" /></el-form-item>
        <el-form-item label="竞赛级别" required>
          <el-select v-model="form.competitionLevel" placeholder="请选择" class="form-select">
            <el-option v-for="t in COMPETITION_TYPES" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="获奖级别" required>
          <el-select v-model="form.awardLevel" placeholder="请选择" class="form-select">
            <el-option v-for="t in AWARD_LEVELS" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="佐证材料">
          <ProofUpload v-model:file-list="form.proofMaterials" />
        </el-form-item>
      </el-form>
    </template>
    <template #columns>
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column prop="competitionName" label="竞赛名称" min-width="200" />
      <el-table-column label="竞赛级别" width="120">
        <template #default="{ row }">
          <DictColumn :value="(row as CompetitionStarItem).competitionLevel" :options="COMPETITION_TYPES" />
        </template>
      </el-table-column>
      <el-table-column label="获奖级别" width="120">
        <template #default="{ row }">
          <DictColumn :value="(row as CompetitionStarItem).awardLevel" :options="AWARD_LEVELS" />
        </template>
      </el-table-column>
      <el-table-column prop="competitionDate" label="参赛时间" width="120" />
      <el-table-column prop="semester" label="学期" width="100" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <StatusTag :status="(row as CompetitionStarItem).status" size="small" />
        </template>
      </el-table-column>
    </template>
  </ApplicationFormRecord>
</template>

<style scoped lang="scss">
.form-select {
  width: 200px;
}
</style>
