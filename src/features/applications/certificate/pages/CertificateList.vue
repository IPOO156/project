<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { Delete, Edit, Eye, Plus } from 'lucide-vue-next'
import { ref } from 'vue'
import { useApplication } from '@/shared/composables/useApplication'
import { CERTIFICATE_TYPES, SEMESTER_OPTIONS } from '@/shared/constants/dict'

interface CertificateItem {
  id: string
  certType: string
  certName: string
  certDate: string
  semester: string
  status: string
  submitDate: string
  proofMaterials: string[]
}

const list = ref<CertificateItem[]>([
  { id: '1', certType: 'language', certName: '大学英语四级证书', certDate: '2025-06', semester: '大一下', status: 'approved', submitDate: '2025-07-01', proofMaterials: [] },
])

const app = useApplication({
  certType: '',
  certName: '',
  certDate: '',
  semester: '',
  proofMaterials: [],
})

function handleSubmit() {
  ElMessage.success('申报提交成功')
  app.closeDialog()
}
</script>

<template>
  <div class="app-page">
    <el-alert title="荣誉证书申报说明" type="info" :closable="false" show-icon>
      <p>请填写获得的各类荣誉证书信息，包括证书类型、名称、获得时间等，并上传证书扫描件。</p>
    </el-alert>
    <div class="app-page__actions" style="margin-top: 16px;">
      <el-button type="primary" :icon="Plus" @click="app.openCreate()">新增申报</el-button>
    </div>
    <el-card style="margin-top: 16px;">
      <el-table :data="list" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="certName" label="证书名称" min-width="200" />
        <el-table-column label="证书类型" width="120">
          <template #default="{ row }">{{ CERTIFICATE_TYPES.find(t => t.value === row.certType)?.label || row.certType }}</template>
        </el-table-column>
        <el-table-column prop="certDate" label="获得时间" width="120" />
        <el-table-column prop="semester" label="学期" width="100" />
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

    <el-dialog v-model="app.dialogVisible" :title="app.isEdit ? '编辑荣誉证书' : '新增荣誉证书'" width="640px">
      <el-form :model="app.formData" label-width="120px">
        <el-form-item label="证书类型" required>
          <el-select v-model="app.formData.certType" placeholder="请选择" style="width: 200px">
            <el-option v-for="t in CERTIFICATE_TYPES" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="证书名称" required><el-input v-model="app.formData.certName" /></el-form-item>
        <el-form-item label="获得时间" required><el-date-picker v-model="app.formData.certDate" type="month" /></el-form-item>
        <el-form-item label="学期" required>
          <el-select v-model="app.formData.semester" placeholder="请选择" style="width: 200px">
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
