<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { reactive, ref } from 'vue'
import { AWARD_LEVELS, COMPETITION_TYPES, SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import DictColumn from '@/shared/ui/DictColumn.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'
import StatusTag from '@/shared/ui/StatusTag.vue'

interface CompetitionItem {
  id: string
  competitionName: string
  competitionType: string
  awardLevel: string
  awardDate: string
  semester: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  submitDate: string
  proofMaterials: string[]
}

function emptyForm() {
  return {
    competitionName: '',
    competitionType: '',
    awardLevel: '',
    awardDate: '',
    semester: '',
    proofMaterials: [] as string[],
  }
}

const form = reactive(emptyForm())
const list = ref<CompetitionItem[]>([
  {
    id: '1',
    competitionName: '全国大学生数学建模竞赛',
    competitionType: 'national',
    awardLevel: 'second',
    awardDate: '2025-09',
    semester: '2023-2024-1',
    status: 'approved',
    submitDate: '2025-10-01',
    proofMaterials: [],
  },
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
      const idx = list.value.findIndex((i) => i.id === editingId.value)
      if (idx > -1) {
        list.value[idx] = {
          ...list.value[idx],
          ...form,
          status: 'submitted',
          submitDate: new Date().toISOString().slice(0, 10),
        }
      }
      ElMessage.success('申报信息已更新')
    } else {
      list.value.unshift({
        id: `${Date.now()}`,
        ...form,
        status: 'submitted',
        submitDate: new Date().toISOString().slice(0, 10),
        proofMaterials: [],
      })
      ElMessage.success('申报提交成功')
    }
    reset()
    submitting.value = false
  }, 600)
}

function edit(row: CompetitionItem) {
  editingId.value = row.id
  Object.assign(form, {
    competitionName: row.competitionName,
    competitionType: row.competitionType,
    awardLevel: row.awardLevel,
    awardDate: row.awardDate,
    semester: row.semester,
  })
}

function remove(row: CompetitionItem) {
  ElMessageBox.confirm(`确定删除 "${row.competitionName}" 的申报记录吗？`, '提示', {
    type: 'warning',
  })
    .then(() => {
      list.value = list.value.filter((i) => i.id !== row.id)
      ElMessage.success('删除成功')
      if (editingId.value === row.id) reset()
    })
    .catch(() => {})
}
</script>

<template>
  <ApplicationFormRecord
    alert-title="学科竞赛申报说明"
    alert-description="请如实填写参与的学科竞赛信息，并上传相关佐证材料（获奖证书扫描件等）。材料经审核通过后将记入个人档案，作为评奖评优依据。"
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
        <el-form-item label="竞赛名称" required
          ><el-input v-model="form.competitionName" placeholder="请输入竞赛名称"
        /></el-form-item>
        <el-form-item label="竞赛类型" required>
          <el-select v-model="form.competitionType" placeholder="请选择" class="form-select">
            <el-option
              v-for="t in COMPETITION_TYPES"
              :key="t.value"
              :label="t.label"
              :value="t.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="获奖等级" required>
          <el-select v-model="form.awardLevel" placeholder="请选择" class="form-select">
            <el-option v-for="t in AWARD_LEVELS" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="获奖时间" required
          ><el-date-picker v-model="form.awardDate" type="month" placeholder="选择年月"
        /></el-form-item>
        <el-form-item label="学期" required>
          <el-select v-model="form.semester" placeholder="请选择" class="form-select">
            <el-option
              v-for="s in SEMESTER_OPTIONS"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="佐证材料">
          <ProofUpload v-model:file-list="form.proofMaterials" />
        </el-form-item>
      </el-form>
    </template>
    <template #columns>
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column prop="competitionName" label="竞赛名称" min-width="180" />
      <el-table-column label="竞赛类型" width="120">
        <template #default="{ row }">
          <DictColumn
            :value="(row as CompetitionItem).competitionType"
            :options="COMPETITION_TYPES"
          />
        </template>
      </el-table-column>
      <el-table-column label="获奖等级" width="120">
        <template #default="{ row }">
          <DictColumn :value="(row as CompetitionItem).awardLevel" :options="AWARD_LEVELS" />
        </template>
      </el-table-column>
      <el-table-column prop="awardDate" label="获奖时间" width="120" />
      <el-table-column prop="semester" label="学期" width="100" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }"
          ><StatusTag :status="(row as CompetitionItem).status" size="small"
        /></template>
      </el-table-column>
    </template>
  </ApplicationFormRecord>
</template>

<style scoped lang="scss">
.form-select {
  width: 200px;
}

.form-input-number {
  width: 200px;
}
</style>
