<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { Delete, Edit, Eye, Plus } from 'lucide-vue-next'
import { ref } from 'vue'
import { useApplication } from '@/shared/composables/useApplication'
import { AWARD_LEVELS, COMPETITION_TYPES, SEMESTER_OPTIONS } from '@/shared/constants/dict'
import StatusTag from '@/shared/ui/StatusTag.vue'

interface CompetitionStarItem {
  id: string
  semester: string
  competitionName: string
  competitionDate: string
  competitionLevel: string
  awardLevel: string
  status: string
  submitDate: string
  proofMaterials: string[]
}

// Mock 数据（接口联调后替换）
const list = ref<CompetitionStarItem[]>([
  { id: '1', semester: '大二上', competitionName: '全国大学生数学建模竞赛', competitionDate: '2025-09', competitionLevel: 'national', awardLevel: 'second', status: 'submitted', submitDate: '2025-10-01', proofMaterials: [] },
])

const app = useApplication({
  semester: '',
  competitionName: '',
  competitionDate: '',
  competitionLevel: '',
  awardLevel: '',
  proofMaterials: [],
})

function handleSubmit() { ElMessage.success('报名提交成功'); app.closeDialog() }
</script>

<template>
  <div class="app-page">
    <el-alert title="竞赛之星报名说明" type="info" :closable="false" show-icon>
      <p>竞赛之星用于评选在学科竞赛中表现突出的同学。请填写参赛信息及获奖情况。</p>
    </el-alert>
    <div class="app-page__actions mt-16">
      <el-button type="primary" :icon="Plus" @click="app.openCreate()">新增报名</el-button>
    </div>
    <el-card class="mt-16">
      <el-table :data="list" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="competitionName" label="竞赛名称" min-width="200" />
        <el-table-column label="竞赛级别" width="120">
          <template #default="{ row }">{{ COMPETITION_TYPES.find(t => t.value === row.competitionLevel)?.label || row.competitionLevel }}</template>
        </el-table-column>
        <el-table-column label="获奖级别" width="120">
          <template #default="{ row }">{{ AWARD_LEVELS.find(t => t.value === row.awardLevel)?.label || row.awardLevel }}</template>
        </el-table-column>
        <el-table-column prop="competitionDate" label="参赛时间" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <StatusTag :status="row.status" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default>
            <el-button text type="primary" :icon="Eye" size="small">查看</el-button>
            <el-button text type="primary" :icon="Edit" size="small">编辑</el-button>
            <el-button text type="danger" :icon="Delete" size="small">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="app.dialogVisible" title="竞赛之星报名" width="640px">
      <el-form :model="app.formData" label-width="120px">
        <el-form-item label="学期" required>
          <el-select v-model="app.formData.semester" placeholder="请选择" class="form-select">
            <el-option v-for="s in SEMESTER_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="竞赛名称" required><el-input v-model="app.formData.competitionName" /></el-form-item>
        <el-form-item label="参赛时间" required><el-date-picker v-model="app.formData.competitionDate" type="month" /></el-form-item>
        <el-form-item label="竞赛级别" required>
          <el-select v-model="app.formData.competitionLevel" placeholder="请选择" class="form-select">
            <el-option v-for="t in COMPETITION_TYPES" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="获奖级别" required>
          <el-select v-model="app.formData.awardLevel" placeholder="请选择" class="form-select">
            <el-option v-for="t in AWARD_LEVELS" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="佐证材料">
          <el-upload action="#" :auto-upload="false" list-type="text">
            <el-button type="primary" plain>上传文件</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="app.closeDialog()">取消</el-button>
        <el-button type="primary" :loading="app.submitting" @click="handleSubmit">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.app-page { display: flex; flex-direction: column; gap: 16px;
  &__alert :deep(p) { margin: 4px 0; font-size: 13px; }
  &__actions { display: flex; gap: 12px; }
}
</style>
