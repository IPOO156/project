<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { Delete, Edit, Eye, Plus } from 'lucide-vue-next'
import { ref } from 'vue'
import { useApplication } from '@/shared/composables/useApplication'
import { PROJECT_LEVELS, SEMESTER_OPTIONS } from '@/shared/constants/dict'

interface ResearchItem {
  id: string
  projectName: string
  projectLevel: string
  researchType: string
  teamRole: string
  startDate: string
  semester: string
  status: string
  submitDate: string
  proofMaterials: string[]
}

const list = ref<ResearchItem[]>([
  { id: '1', projectName: '基于深度学习的图像识别研究', projectLevel: 'school', researchType: '创新实验', teamRole: '项目负责人', startDate: '2025-03', semester: '大二下', status: 'submitted', submitDate: '2025-04-15', proofMaterials: [] },
])

const app = useApplication({
  projectName: '',
  projectLevel: '',
  researchType: '',
  teamRole: '',
  startDate: '',
  semester: '',
  proofMaterials: [],
})

const researchTypes = ['创新实验', '课题研究', '调研报告', '其他']

function handleSubmit() {
  ElMessage.success('申报提交成功')
  app.closeDialog()
}
</script>

<template>
  <div class="app-page">
    <el-alert title="学术研究申报说明" type="info" :closable="false" show-icon class="app-page__alert">
      <p>请填写参与的学术研究项目信息，包括项目名称、级别、团队角色等，并上传相关佐证材料。</p>
    </el-alert>
    <div class="app-page__actions">
      <el-button type="primary" :icon="Plus" @click="app.openCreate()">新增申报</el-button>
    </div>
    <el-card>
      <el-table :data="list" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="projectName" label="项目名称" min-width="200" />
        <el-table-column label="项目级别" width="120">
          <template #default="{ row }">{{ PROJECT_LEVELS.find(t => t.value === row.projectLevel)?.label || row.projectLevel }}</template>
        </el-table-column>
        <el-table-column prop="researchType" label="类型" width="120" />
        <el-table-column prop="teamRole" label="团队角色" width="120" />
        <el-table-column prop="startDate" label="立项时间" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'approved' ? 'success' : row.status === 'submitted' ? 'warning' : 'info'" size="small">
              {{ row.status === 'approved' ? '已通过' : row.status === 'submitted' ? '待审核' : '草稿' }}
            </el-tag>
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

    <el-dialog v-model="app.dialogVisible" :title="app.isEdit ? '编辑学术研究' : '新增学术研究'" width="640px">
      <el-form :model="app.formData" label-width="120px">
        <el-form-item label="项目名称" required><el-input v-model="app.formData.projectName" /></el-form-item>
        <el-form-item label="项目级别" required>
          <el-select v-model="app.formData.projectLevel" placeholder="请选择" style="width: 200px">
            <el-option v-for="t in PROJECT_LEVELS" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型" required>
          <el-select v-model="app.formData.researchType" placeholder="请选择" style="width: 200px">
            <el-option v-for="t in researchTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="团队角色" required><el-input v-model="app.formData.teamRole" /></el-form-item>
        <el-form-item label="立项时间" required><el-date-picker v-model="app.formData.startDate" type="month" /></el-form-item>
        <el-form-item label="学期" required>
          <el-select v-model="app.formData.semester" placeholder="请选择" style="width: 200px">
            <el-option v-for="s in SEMESTER_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
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
