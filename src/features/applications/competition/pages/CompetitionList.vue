<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { Delete, Edit, Eye, Plus } from 'lucide-vue-next'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useApplication } from '@/shared/composables/useApplication'
import { AWARD_LEVELS, COMPETITION_TYPES, SEMESTER_OPTIONS } from '@/shared/constants/dict'

interface CompetitionItem {
  id: string
  competitionName: string
  competitionType: string
  awardLevel: string
  awardDate: string
  semester: string
  status: string
  submitDate: string
  proofMaterials: string[]
}

const router = useRouter()

const list = ref<CompetitionItem[]>([
  { id: '1', competitionName: '全国大学生数学建模竞赛', competitionType: 'national', awardLevel: 'second', awardDate: '2025-09', semester: '大二上', status: 'approved', submitDate: '2025-10-01', proofMaterials: [] },
  { id: '2', competitionName: '校ACM程序设计竞赛', competitionType: 'school', awardLevel: 'first', awardDate: '2025-05', semester: '大二上', status: 'submitted', submitDate: '2025-06-01', proofMaterials: [] },
])

const app = useApplication({
  competitionName: '',
  competitionType: '',
  awardLevel: '',
  awardDate: '',
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
    <!-- 评选说明 -->
    <el-alert
      title="学科竞赛申报说明"
      type="info"
      :closable="false"
      show-icon
      class="app-page__alert"
    >
      <template #default>
        <p>请如实填写参与的学科竞赛信息，并上传相关佐证材料（获奖证书扫描件等）。</p>
        <p>材料经审核通过后将记入个人档案，作为评奖评优依据。</p>
      </template>
    </el-alert>

    <!-- 操作栏 -->
    <div class="app-page__actions">
      <el-button type="primary" :icon="Plus" @click="app.openCreate()">
        新增申报
      </el-button>
      <el-button @click="router.push('/profile/timeline')">
        查看成长时间轴
      </el-button>
    </div>

    <!-- 申报列表 -->
    <el-card>
      <el-table :data="list" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="competitionName" label="竞赛名称" min-width="180" />
        <el-table-column label="竞赛类型" width="120">
          <template #default="{ row }">
            {{ COMPETITION_TYPES.find(t => t.value === row.competitionType)?.label || row.competitionType }}
          </template>
        </el-table-column>
        <el-table-column label="获奖等级" width="120">
          <template #default="{ row }">
            {{ AWARD_LEVELS.find(t => t.value === row.awardLevel)?.label || row.awardLevel }}
          </template>
        </el-table-column>
        <el-table-column prop="awardDate" label="获奖时间" width="120" />
        <el-table-column prop="semester" label="学期" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'approved'" type="success" size="small">已通过</el-tag>
            <el-tag v-else-if="row.status === 'submitted'" type="warning" size="small">待审核</el-tag>
            <el-tag v-else-if="row.status === 'rejected'" type="danger" size="small">已驳回</el-tag>
            <el-tag v-else size="small">草稿</el-tag>
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="app.dialogVisible"
      :title="app.isEdit ? '编辑学科竞赛' : '新增学科竞赛'"
      width="640px"
    >
      <el-form :model="app.formData" label-width="120px">
        <el-form-item label="竞赛名称" required>
          <el-input v-model="app.formData.competitionName" placeholder="请输入竞赛名称" />
        </el-form-item>
        <el-form-item label="竞赛类型" required>
          <el-select v-model="app.formData.competitionType" placeholder="请选择" style="width: 200px">
            <el-option v-for="t in COMPETITION_TYPES" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="获奖等级" required>
          <el-select v-model="app.formData.awardLevel" placeholder="请选择" style="width: 200px">
            <el-option v-for="t in AWARD_LEVELS" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="获奖时间" required>
          <el-date-picker v-model="app.formData.awardDate" type="month" placeholder="选择年月" />
        </el-form-item>
        <el-form-item label="学期" required>
          <el-select v-model="app.formData.semester" placeholder="请选择" style="width: 200px">
            <el-option v-for="s in SEMESTER_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="佐证材料">
          <el-upload action="#" :auto-upload="false" list-type="text">
            <el-button type="primary" plain>上传文件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 jpg、png、pdf 格式</div>
            </template>
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
.app-page {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__alert {
    :deep(p) {
      margin: 4px 0;
      font-size: 13px;
    }
  }

  &__actions {
    display: flex;
    gap: 12px;
  }
}
</style>
