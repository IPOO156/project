<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { Delete, Edit, Eye, Plus } from 'lucide-vue-next'
import { ref } from 'vue'
import { useApplication } from '@/shared/composables/useApplication'
import { SEMESTER_OPTIONS } from '@/shared/constants/dict'
import StatusTag from '@/shared/ui/StatusTag.vue'

interface PracticeItem {
  id: string
  activityName: string
  location: string
  organization: string
  startDate: string
  endDate: string
  volunteerHours: number
  semester: string
  status: string
  submitDate: string
  proofMaterials: string[]
}

// Mock 数据（接口联调后替换）
const list = ref<PracticeItem[]>([
  { id: '1', activityName: '科技下乡志愿服务', location: 'XX县XX村', organization: '校青年志愿者协会', startDate: '2025-07', endDate: '2025-08', volunteerHours: 120, semester: '大二下', status: 'approved', submitDate: '2025-09-01', proofMaterials: [] },
])

const app = useApplication({
  activityName: '',
  location: '',
  organization: '',
  startDate: '',
  endDate: '',
  volunteerHours: 0,
  semester: '',
  proofMaterials: [],
})

function handleSubmit() { ElMessage.success('申报提交成功'); app.closeDialog() }
</script>

<template>
  <div class="app-page">
    <el-alert title="社会实践申报说明" type="info" :closable="false" show-icon>
      <p>请填写参与的社会实践活动信息，包括活动名称、地点、实践单位、时间及志愿时长。</p>
    </el-alert>
    <div class="app-page__actions mt-16">
      <el-button type="primary" :icon="Plus" @click="app.openCreate()">新增申报</el-button>
    </div>
    <el-card class="mt-16">
      <el-table :data="list" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="activityName" label="活动名称" min-width="180" />
        <el-table-column prop="location" label="实践地点" width="150" />
        <el-table-column prop="organization" label="实践单位" width="150" />
        <el-table-column label="实践时间" width="160">
          <template #default="{ row }">{{ row.startDate }} ~ {{ row.endDate }}</template>
        </el-table-column>
        <el-table-column prop="volunteerHours" label="志愿时长(h)" width="100" />
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

    <el-dialog v-model="app.dialogVisible" :title="app.isEdit ? '编辑社会实践' : '新增社会实践'" width="640px">
      <el-form :model="app.formData" label-width="120px">
        <el-form-item label="活动名称" required><el-input v-model="app.formData.activityName" /></el-form-item>
        <el-form-item label="实践地点" required><el-input v-model="app.formData.location" /></el-form-item>
        <el-form-item label="实践单位" required><el-input v-model="app.formData.organization" /></el-form-item>
        <el-form-item label="开始时间" required><el-date-picker v-model="app.formData.startDate" type="month" /></el-form-item>
        <el-form-item label="结束时间" required><el-date-picker v-model="app.formData.endDate" type="month" /></el-form-item>
        <el-form-item label="志愿时长" required><el-input-number v-model="app.formData.volunteerHours" :min="0" style="width: 200px" /> 小时</el-form-item>
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
