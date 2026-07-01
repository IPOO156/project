<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { Delete, Edit, Eye, Plus } from 'lucide-vue-next'
import { ref } from 'vue'
import { useApplication } from '@/shared/composables/useApplication'
import { INDUSTRY_TYPES, SEMESTER_OPTIONS } from '@/shared/constants/dict'
import StatusTag from '@/shared/ui/StatusTag.vue'

interface InnovationItem {
  id: string
  companyName: string
  industryType: string
  companyType: string
  teamRole: string
  registerDate: string
  semester: string
  status: string
  submitDate: string
  proofMaterials: string[]
}

const list = ref<InnovationItem[]>([ // Mock 数据（接口联调后替换）
  { id: '1', companyName: '智创科技工作室', industryType: 'it', companyType: '创业实践', teamRole: '创始人', registerDate: '2025-06', semester: '大二下', status: 'approved', submitDate: '2025-07-01', proofMaterials: [] },
])

const app = useApplication({
  companyName: '',
  industryType: '',
  companyType: '',
  teamRole: '',
  registerDate: '',
  semester: '',
  proofMaterials: [],
})

const companyTypes = ['创业实践', '创业计划', '实体注册', '其他']

function handleSubmit() {
  ElMessage.success('申报提交成功')
  app.closeDialog()
}
</script>

<template>
  <div class="app-page">
    <el-alert title="创新创业申报说明" type="info" :closable="false" show-icon class="app-page__alert">
      <template #default>
        <p>请如实填写创新创业项目信息，包括公司/工作室注册情况，并上传佐证材料。</p>
        <p>双创之星报名需额外提交公司名称、行业类型、申报人排名及注册信息。</p>
      </template>
    </el-alert>

    <div class="app-page__actions">
      <el-button type="primary" :icon="Plus" @click="app.openCreate()">新增申报</el-button>
    </div>

    <el-card>
      <el-table :data="list" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="companyName" label="公司/项目名称" min-width="180" />
        <el-table-column label="行业类型" width="120">
          <template #default="{ row }">{{ INDUSTRY_TYPES.find(t => t.value === row.industryType)?.label || row.industryType }}</template>
        </el-table-column>
        <el-table-column prop="companyType" label="类型" width="120" />
        <el-table-column prop="teamRole" label="团队角色" width="120" />
        <el-table-column prop="registerDate" label="注册时间" width="120" />
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

    <el-dialog v-model="app.dialogVisible" :title="app.isEdit ? '编辑创新创业' : '新增创新创业'" width="640px">
      <el-form :model="app.formData" label-width="120px">
        <el-form-item label="公司名称" required>
          <el-input v-model="app.formData.companyName" placeholder="请输入公司/工作室名称" />
        </el-form-item>
        <el-form-item label="行业类型" required>
          <el-select v-model="app.formData.industryType" placeholder="请选择" class="form-select">
            <el-option v-for="t in INDUSTRY_TYPES" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型" required>
          <el-select v-model="app.formData.companyType" placeholder="请选择" class="form-select">
            <el-option v-for="t in companyTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="团队角色" required>
          <el-input v-model="app.formData.teamRole" placeholder="如：创始人、核心成员" />
        </el-form-item>
        <el-form-item label="创建/注册时间" required>
          <el-date-picker v-model="app.formData.registerDate" type="month" placeholder="选择年月" />
        </el-form-item>
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

<style scoped lang="scss">
.app-page { display: flex; flex-direction: column; gap: 16px;
  &__alert :deep(p) { margin: 4px 0; font-size: 13px; }
  &__actions { display: flex; gap: 12px; }
}
</style>
