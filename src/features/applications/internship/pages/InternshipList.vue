<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { Delete, Edit, Eye, Plus } from 'lucide-vue-next'
import { ref } from 'vue'
import { useApplication } from '@/shared/composables/useApplication'
import { SEMESTER_OPTIONS } from '@/shared/constants/dict'
import StatusTag from '@/shared/ui/StatusTag.vue'

interface InternshipItem {
  id: string
  company: string
  location: string
  position: string
  startDate: string
  endDate: string
  semester: string
  status: string
  submitDate: string
  proofMaterials: string[]
}

const list = ref<InternshipItem[]>([ // Mock 数据（接口联调后替换）
  { id: '1', company: 'XX科技有限公司', location: '北京市海淀区', position: '前端开发实习生', startDate: '2025-07', endDate: '2025-09', semester: '大二下', status: 'approved', submitDate: '2025-10-01', proofMaterials: [] },
])

const app = useApplication({
  company: '',
  location: '',
  position: '',
  startDate: '',
  endDate: '',
  semester: '',
  proofMaterials: [],
})

function handleSubmit() { ElMessage.success('申报提交成功'); app.closeDialog() }
</script>

<template>
  <div class="app-page">
    <el-alert title="实习经历申报说明" type="info" :closable="false" show-icon>
      <p>请如实填写实习经历，包括实习单位、岗位、时间等信息，并上传实习证明或鉴定材料。</p>
    </el-alert>
    <div class="app-page__actions mt-16">
      <el-button type="primary" :icon="Plus" @click="app.openCreate()">新增申报</el-button>
    </div>
    <el-card class="mt-16">
      <el-table :data="list" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="company" label="实习单位" min-width="180" />
        <el-table-column prop="location" label="实习地点" width="150" />
        <el-table-column prop="position" label="实习岗位" width="150" />
        <el-table-column label="实习时间" width="160">
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

    <el-dialog v-model="app.dialogVisible" :title="app.isEdit ? '编辑实习经历' : '新增实习经历'" width="640px">
      <el-form :model="app.formData" label-width="120px">
        <el-form-item label="实习单位" required><el-input v-model="app.formData.company" /></el-form-item>
        <el-form-item label="实习地点" required><el-input v-model="app.formData.location" /></el-form-item>
        <el-form-item label="实习岗位" required><el-input v-model="app.formData.position" /></el-form-item>
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
