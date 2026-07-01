<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { Delete, Edit, Eye, Plus } from 'lucide-vue-next'
import { ref } from 'vue'
import { useApplication } from '@/shared/composables/useApplication'
import { SEMESTER_OPTIONS } from '@/shared/constants/dict'
import StatusTag from '@/shared/ui/StatusTag.vue'

interface TrainingItem {
  id: string
  projectName: string
  projectContent: string
  startDate: string
  endDate: string
  semester: string
  status: string
  submitDate: string
  proofMaterials: string[]
}

// Mock 数据（接口联调后替换）
const list = ref<TrainingItem[]>([
  { id: '1', projectName: 'Java Web开发实训', projectContent: '基于Spring Boot的在线商城系统开发', startDate: '2025-07', endDate: '2025-08', semester: '大二下', status: 'approved', submitDate: '2025-09-01', proofMaterials: [] },
])

const app = useApplication({
  projectName: '',
  projectContent: '',
  startDate: '',
  endDate: '',
  semester: '',
  proofMaterials: [],
})

function handleSubmit() { ElMessage.success('申报提交成功'); app.closeDialog() }
</script>

<template>
  <div class="app-page">
    <el-alert title="实训项目申报说明" type="info" :closable="false" show-icon>
      <p>请填写参与的实训项目信息，包括项目名称、内容、时间段等，并上传实训成果材料。</p>
    </el-alert>
    <div class="app-page__actions mt-16">
      <el-button type="primary" :icon="Plus" @click="app.openCreate()">新增申报</el-button>
    </div>
    <el-card class="mt-16">
      <el-table :data="list" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="projectName" label="实训项目名称" min-width="180" />
        <el-table-column prop="projectContent" label="实训内容" min-width="200" show-overflow-tooltip />
        <el-table-column label="项目时间" width="160">
          <template #default="{ row }">{{ row.startDate }} ~ {{ row.endDate }}</template>
        </el-table-column>
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

    <el-dialog v-model="app.dialogVisible" :title="app.isEdit ? '编辑实训项目' : '新增实训项目'" width="640px">
      <el-form :model="app.formData" label-width="120px">
        <el-form-item label="项目名称" required><el-input v-model="app.formData.projectName" /></el-form-item>
        <el-form-item label="实训内容" required><el-input v-model="app.formData.projectContent" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="开始时间" required><el-date-picker v-model="app.formData.startDate" type="month" /></el-form-item>
        <el-form-item label="结束时间" required><el-date-picker v-model="app.formData.endDate" type="month" /></el-form-item>
        <el-form-item label="学期" required>
          <el-select v-model="app.formData.semester" placeholder="请选择" class="form-select">
            <el-option v-for="s in SEMESTER_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="证明材料">
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
