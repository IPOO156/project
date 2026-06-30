<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { BookOpen, Delete, Edit, Eye, FileText } from 'lucide-vue-next'
import { reactive, ref } from 'vue'
import { SEMESTER_OPTIONS } from '@/shared/constants/dict'

/** 软件著作权 */
interface SoftwareCopyright {
  id: string
  softName: string
  issuer: string
  ranking: string
  approveDate: string
  semester: string
  status: string
}
/** 论文 */
interface PaperRecord {
  id: string
  journalName: string
  paperName: string
  ranking: string
  publishDate: string
  semester: string
  status: string
}

const activeTab = ref<'copyright' | 'paper'>('copyright')

const copyrightList = ref<SoftwareCopyright[]>([
  { id: '1', softName: '智能档案管理系统 V1.0', issuer: '国家版权局', ranking: '1/4', approveDate: '2025-11', semester: '大二上', status: 'approved' },
])
const paperList = ref<PaperRecord[]>([
  { id: '1', journalName: '《计算机科学与应用》', paperName: '基于Vue3的档案管理系统设计与实现', ranking: '2/3', publishDate: '2026-03', semester: '大二下', status: 'submitted' },
])

const copyrightForm = reactive({ softName: '', issuer: '', ranking: '', approveDate: '', semester: '', proofMaterials: [] })
const paperForm = reactive({ journalName: '', paperName: '', ranking: '', publishDate: '', semester: '', proofMaterials: [] })
const diagVisible = ref(false)
const diagTitle = ref('')
const diagType = ref<'copyright' | 'paper'>('copyright')
const submitting = ref(false)

function openCreate(type: 'copyright' | 'paper') {
  diagType.value = type
  diagTitle.value = type === 'copyright' ? '新增软件著作权' : '新增论文'
  diagVisible.value = true
}
function handleSubmit() {
  submitting.value = true
  setTimeout(() => {
    ElMessage.success('提交成功')
    diagVisible.value = false
    submitting.value = false
  }, 600)
}
</script>

<template>
  <div class="app-page">
    <el-alert title="科研之星报名说明" type="info" :closable="false" show-icon>
      <p>科研之星报名包含软件著作权和论文两类成果，请根据实际情况填写并上传证明材料。</p>
    </el-alert>

    <div class="app-page__actions" style="margin-top: 16px;">
      <el-button type="primary" :icon="FileText" @click="openCreate('copyright')">新增软著</el-button>
      <el-button type="primary" :icon="BookOpen" @click="openCreate('paper')">新增论文</el-button>
    </div>

    <el-card style="margin-top: 16px;">
      <el-tabs v-model="activeTab">
        <!-- 软著 Tab -->
        <el-tab-pane label="软件著作权" name="copyright">
          <el-table :data="copyrightList" stripe>
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="softName" label="软著名称" min-width="220" />
            <el-table-column prop="issuer" label="颁发单位" width="180" />
            <el-table-column prop="ranking" label="排名/总人数" width="130" />
            <el-table-column prop="approveDate" label="获批时间" width="120" />
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
        </el-tab-pane>

        <!-- 论文 Tab -->
        <el-tab-pane label="论文" name="paper">
          <el-table :data="paperList" stripe>
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="paperName" label="论文名称" min-width="250" show-overflow-tooltip />
            <el-table-column prop="journalName" label="期刊名称" width="200" show-overflow-tooltip />
            <el-table-column prop="ranking" label="排名/总人数" width="130" />
            <el-table-column prop="publishDate" label="发表时间" width="120" />
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
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 新增弹窗 -->
    <el-dialog v-model="diagVisible" :title="diagTitle" width="640px">
      <el-form v-if="diagType === 'copyright'" :model="copyrightForm" label-width="120px">
        <el-form-item label="软著名称" required><el-input v-model="copyrightForm.softName" /></el-form-item>
        <el-form-item label="颁发单位" required><el-input v-model="copyrightForm.issuer" /></el-form-item>
        <el-form-item label="排名/总人数" required><el-input v-model="copyrightForm.ranking" placeholder="如：1/4" style="width: 200px" /></el-form-item>
        <el-form-item label="获批时间" required><el-date-picker v-model="copyrightForm.approveDate" type="month" /></el-form-item>
        <el-form-item label="学期" required>
          <el-select v-model="copyrightForm.semester" placeholder="请选择" style="width: 200px">
            <el-option v-for="s in SEMESTER_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="证明材料"><el-upload action="#" :auto-upload="false" list-type="text"><el-button type="primary" plain>上传文件</el-button></el-upload></el-form-item>
      </el-form>
      <el-form v-else :model="paperForm" label-width="120px">
        <el-form-item label="期刊名称" required><el-input v-model="paperForm.journalName" /></el-form-item>
        <el-form-item label="论文名称" required><el-input v-model="paperForm.paperName" /></el-form-item>
        <el-form-item label="排名/总人数" required><el-input v-model="paperForm.ranking" placeholder="如：2/3" style="width: 200px" /></el-form-item>
        <el-form-item label="发表时间" required><el-date-picker v-model="paperForm.publishDate" type="month" /></el-form-item>
        <el-form-item label="学期" required>
          <el-select v-model="paperForm.semester" placeholder="请选择" style="width: 200px">
            <el-option v-for="s in SEMESTER_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="证明材料"><el-upload action="#" :auto-upload="false" list-type="text"><el-button type="primary" plain>上传文件</el-button></el-upload></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="diagVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
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
