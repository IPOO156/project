<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { Delete, Edit, Eye, Plus } from 'lucide-vue-next'
import { ref } from 'vue'
import { useApplication } from '@/shared/composables/useApplication'
import { SCHOLARSHIP_LEVELS, SEMESTER_OPTIONS } from '@/shared/constants/dict'
import StatusTag from '@/shared/ui/StatusTag.vue'

interface ScholarshipItem {
  id: string
  awardName: string
  scholarshipLevel: string
  scholarshipGrade: string
  acquireDate: string
  semester: string
  status: string
  submitDate: string
  proofMaterials: string[]
}

// Mock 数据（接口联调后替换）
const list = ref<ScholarshipItem[]>([
  { id: '1', awardName: '校级一等奖学金', scholarshipLevel: 'school', scholarshipGrade: 'first', acquireDate: '2025-09', semester: '大二上', status: 'approved', submitDate: '2025-10-01', proofMaterials: [] },
])

const app = useApplication({
  awardName: '',
  scholarshipLevel: '',
  scholarshipGrade: '',
  acquireDate: '',
  semester: '',
  proofMaterials: [],
})

const gradeMap: Record<string, string> = { first: '一等奖', second: '二等奖', third: '三等奖' }

function handleSubmit() {
  ElMessage.success('申报提交成功')
  app.closeDialog()
}
</script>

<template>
  <div class="app-page">
    <el-alert title="奖学金申报说明" type="info" :closable="false" show-icon>
      <p>请填写获得的奖学金信息，包括奖学金名称、等级、级别等，并上传获奖证明。</p>
    </el-alert>
    <div class="app-page__actions mt-16">
      <el-button type="primary" :icon="Plus" @click="app.openCreate()">新增申报</el-button>
    </div>
    <el-card class="mt-16">
      <el-table :data="list" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="awardName" label="奖学金名称" min-width="180" />
        <el-table-column label="等级" width="120">
          <template #default="{ row }">{{ SCHOLARSHIP_LEVELS.find(t => t.value === row.scholarshipLevel)?.label || row.scholarshipLevel }}</template>
        </el-table-column>
        <el-table-column label="级别" width="100">
          <template #default="{ row }">{{ gradeMap[row.scholarshipGrade] || row.scholarshipGrade }}</template>
        </el-table-column>
        <el-table-column prop="acquireDate" label="获取时间" width="120" />
        <el-table-column prop="semester" label="学期" width="100" />
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

    <el-dialog v-model="app.dialogVisible" :title="app.isEdit ? '编辑奖学金' : '新增奖学金'" width="640px">
      <el-form :model="app.formData" label-width="120px">
        <el-form-item label="获奖名称" required><el-input v-model="app.formData.awardName" /></el-form-item>
        <el-form-item label="奖学金等级" required>
          <el-select v-model="app.formData.scholarshipLevel" placeholder="请选择" class="form-select">
            <el-option v-for="t in SCHOLARSHIP_LEVELS" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="奖学金级别" required>
          <el-select v-model="app.formData.scholarshipGrade" placeholder="请选择" class="form-select">
            <el-option label="一等奖" value="first" />
            <el-option label="二等奖" value="second" />
            <el-option label="三等奖" value="third" />
          </el-select>
        </el-form-item>
        <el-form-item label="获取时间" required><el-date-picker v-model="app.formData.acquireDate" type="month" /></el-form-item>
        <el-form-item label="学期" required>
          <el-select v-model="app.formData.semester" placeholder="请选择" class="form-select">
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
