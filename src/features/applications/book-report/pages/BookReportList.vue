<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { Delete, Edit, Eye, Plus } from 'lucide-vue-next'
import { ref } from 'vue'
import { useApplication } from '@/shared/composables/useApplication'
import { SEMESTER_OPTIONS } from '@/shared/constants/dict'

interface BookReportItem {
  id: string
  semester: string
  bookName: string
  bookDate: string
  review: string
  status: string
  submitDate: string
  proofMaterials: string[]
}

const list = ref<BookReportItem[]>([
  { id: '1', semester: '大二上', bookName: '《深入理解计算机系统》', bookDate: '2025-10', review: '通过阅读本书，深入理解了计算机系统的底层原理...', status: 'approved', submitDate: '2025-11-01', proofMaterials: [] },
])

const app = useApplication({
  semester: '',
  bookName: '',
  bookDate: '',
  review: '',
  proofMaterials: [],
})

function handleSubmit() { ElMessage.success('申报提交成功'); app.closeDialog() }
</script>

<template>
  <div class="app-page">
    <el-alert title="图书心得申报说明" type="info" :closable="false" show-icon>
      <p>请填写阅读的书籍信息及读书心得，可上传心得文档作为佐证材料。</p>
    </el-alert>
    <div class="app-page__actions" style="margin-top: 16px;">
      <el-button type="primary" :icon="Plus" @click="app.openCreate()">新增申报</el-button>
    </div>
    <el-card style="margin-top: 16px;">
      <el-table :data="list" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="bookName" label="书籍名称" min-width="200" />
        <el-table-column prop="bookDate" label="阅读时间" width="120" />
        <el-table-column prop="review" label="读书心得" min-width="240" show-overflow-tooltip />
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

    <el-dialog v-model="app.dialogVisible" :title="app.isEdit ? '编辑图书心得' : '新增图书心得'" width="640px">
      <el-form :model="app.formData" label-width="120px">
        <el-form-item label="学期" required>
          <el-select v-model="app.formData.semester" placeholder="请选择" style="width: 200px">
            <el-option v-for="s in SEMESTER_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="书名" required><el-input v-model="app.formData.bookName" /></el-form-item>
        <el-form-item label="阅读时间" required><el-date-picker v-model="app.formData.bookDate" type="month" /></el-form-item>
        <el-form-item label="读书心得">
          <el-input v-model="app.formData.review" type="textarea" :rows="4" placeholder="请分享你的读书心得..." />
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
