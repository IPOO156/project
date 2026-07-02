<script setup lang="ts">
/**
 * ScholarshipList - 奖学金申报列表页（样板）
 *
 * 展示符合 .cursor/rules/ui-ux-rules.md 的标准页面写法：
 *   - 使用 PageHeader 渲染标题区
 *   - 使用 PageToolbar 渲染搜索/筛选
 *   - 使用 PageContainer 包裹表格（统一空/加载/错误态）
 *   - 使用 StatusTag 渲染状态
 *   - 全部使用 Lucide 图标、token 化样式
 */
import { Delete, Edit, Eye, Info, Plus } from 'lucide-vue-next'
import { ref } from 'vue'
import { useApplication } from '@/shared/composables/useApplication'
import {
  SCHOLARSHIP_GRADES,
  SCHOLARSHIP_LEVELS,
  SEMESTER_OPTIONS,
} from '@/shared/constants/dict'
import {
  PageContainer,
  PageToolbar,
  StatusTag,
} from '@/shared/ui'

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

const list = ref<ScholarshipItem[]>([
  { id: '1', awardName: '校级一等奖学金', scholarshipLevel: 'school', scholarshipGrade: 'first', acquireDate: '2025-09', semester: '大二上', status: 'approved', submitDate: '2025-10-01', proofMaterials: [] },
])

const loading = ref(false)
const keyword = ref('')
const status = ref('')

const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '已提交', value: 'submitted' },
  { label: '已通过', value: 'approved' },
  { label: '已驳回', value: 'rejected' },
]

const app = useApplication({
  awardName: '',
  scholarshipLevel: '',
  scholarshipGrade: '',
  acquireDate: '',
  semester: '',
  proofMaterials: [],
})

function handleSubmit() {
  app.closeDialog()
}
</script>

<template>
  <div class="scholarship-list">
    <!-- 提示说明 -->
    <el-alert
      type="info"
      :closable="false"
      show-icon
      class="scholarship-list__alert"
    >
      <template #title>
        <span class="scholarship-list__alert-title">
          <Info :size="16" /> 奖学金申报说明
        </span>
      </template>
      请填写获得的奖学金信息，包括奖学金名称、等级、级别等，并上传获奖证明。
    </el-alert>

    <!-- 表格容器 -->
    <PageContainer
      :loading="loading"
      :empty="!loading && list.length === 0"
      empty-text="暂无奖学金申报记录"
    >
      <!-- 工具栏：搜索/筛选/操作 -->
      <PageToolbar
        v-model:keyword="keyword"
        v-model:status="status"
        :status-options="statusOptions"
        placeholder="搜索奖学金名称"
        class="scholarship-list__toolbar"
        @search="() => {}"
      >
        <el-button type="primary" :icon="Plus" @click="app.openCreate()">
          新增申报
        </el-button>
      </PageToolbar>

      <el-table :data="list" stripe class="scholarship-list__table">
        <el-table-column type="index" label="序号" width="64" align="center" />
        <el-table-column prop="awardName" label="奖学金名称" min-width="180" show-overflow-tooltip />
        <el-table-column label="等级" width="120">
          <template #default="{ row }">
            {{ SCHOLARSHIP_LEVELS.find(t => t.value === row.scholarshipLevel)?.label || row.scholarshipLevel }}
          </template>
        </el-table-column>
        <el-table-column label="级别" width="100">
          <template #default="{ row }">
            {{ SCHOLARSHIP_GRADES.find(t => t.value === row.scholarshipGrade)?.label || row.scholarshipGrade }}
          </template>
        </el-table-column>
        <el-table-column prop="acquireDate" label="获取时间" width="120" />
        <el-table-column prop="semester" label="学期" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <StatusTag :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default>
            <el-button text type="primary" :icon="Eye" aria-label="查看">查看</el-button>
            <el-button text type="primary" :icon="Edit" aria-label="编辑">编辑</el-button>
            <el-button text type="danger" :icon="Delete" aria-label="删除">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="scholarship-list__pagination">
        <el-pagination
          background
          layout="total, prev, pager, next, jumper"
          :total="list.length"
        />
      </div>
    </PageContainer>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="app.dialogVisible"
      :title="app.isEdit ? '编辑奖学金' : '新增奖学金'"
      width="640px"
      destroy-on-close
    >
      <el-form :model="app.formData" label-width="120px">
        <el-form-item label="获奖名称" required>
          <el-input v-model="app.formData.awardName" placeholder="请输入奖学金名称" />
        </el-form-item>
        <el-form-item label="奖学金等级" required>
          <el-select v-model="app.formData.scholarshipLevel" placeholder="请选择" class="form-select">
            <el-option v-for="t in SCHOLARSHIP_LEVELS" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="奖学金级别" required>
          <el-select v-model="app.formData.scholarshipGrade" placeholder="请选择" class="form-select">
            <el-option v-for="t in SCHOLARSHIP_GRADES" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="获取时间" required>
          <el-date-picker v-model="app.formData.acquireDate" type="month" placeholder="选择月份" />
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
.scholarship-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;

  &__alert-title {
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    font-weight: 600;
  }

  &__pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: $spacing-lg;
  }

  &__table {
    :deep(.el-table__cell) {
      padding: $spacing-md $spacing-sm;
    }
  }
}
</style>
