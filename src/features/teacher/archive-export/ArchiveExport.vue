<script setup lang="ts">
import { ElMessage } from 'element-plus'
/**
 * ArchiveExport - 档案导出
 * 筛选维度：全校 / 选择学院→选择专业→选择班级
 * 列表筛选：文件操作、状态、年级/班级、创建时间、更新时间、操作
 * 功能：教师删除导出、导出学生文件、一键导出基本信息
 *
 * 超级管理员额外功能：手动添加学期、学期导入、导入成绩、选择可导年级
 */
import { Download, FileDown, FileUp, Plus, Search, Trash2, Upload } from 'lucide-vue-next'
import { computed, ref } from 'vue'

import { useUserStore } from '@/app/stores/stores'

const userStore = useUserStore()
const isSuperAdmin = computed(() => userStore.isSuperAdmin)

// ── 筛选状态 ──
const filters = ref({
  scope: '全校',
  college: '',
  major: '',
  className: '',
  status: '',
  dateRange: [] as string[],
})

// ── Mock 导出记录 ──
const exportRecords = ref([
  {
    id: 1,
    fileName: '2024级学生基本信息.xlsx',
    status: 'completed',
    scope: '全校',
    grade: '2024级',
    createdAt: '2026-07-01 10:30',
    updatedAt: '2026-07-01 10:30',
    fileSize: '2.3MB',
  },
  {
    id: 2,
    fileName: '计科2401班成绩汇总.xlsx',
    status: 'completed',
    scope: '班级',
    grade: '2024级',
    createdAt: '2026-07-02 14:20',
    updatedAt: '2026-07-02 14:20',
    fileSize: '856KB',
  },
  {
    id: 3,
    fileName: '计算机学院获奖统计.xlsx',
    status: 'processing',
    scope: '学院',
    grade: '2024级',
    createdAt: '2026-07-03 09:15',
    updatedAt: '2026-07-03 09:15',
    fileSize: '-',
  },
  {
    id: 4,
    fileName: '2023级学生基本信息.xlsx',
    status: 'failed',
    scope: '全校',
    grade: '2023级',
    createdAt: '2026-06-28 16:45',
    updatedAt: '2026-06-28 16:46',
    fileSize: '-',
  },
])

const scopeOptions = ['全校', '选择学院', '选择专业', '选择班级']
const statusOptions = ['全部', '已完成', '处理中', '失败']

const statusMap: Record<string, { label: string; type: string }> = {
  completed: { label: '已完成', type: 'success' },
  processing: { label: '处理中', type: 'warning' },
  failed: { label: '失败', type: 'danger' },
}

// ── 超级管理员专属功能 ──
const semesterDialogVisible = ref(false)
const newSemester = ref('')
const importDialogVisible = ref(false)
const importType = ref<'students' | 'grades'>('students')
const gradeSelection = ref<string[]>([])

const gradeOptions = ['2024级', '2023级', '2022级', '2021级']

function handleExport() {
  ElMessage.success('导出任务已创建，请稍后在列表中查看')
}

function handleDeleteExport(_id: number) {
  ElMessage.success('导出记录已删除')
}

function handleBatchExport() {
  ElMessage.success('批量导出任务已提交')
}

function addSemester() {
  if (newSemester.value) {
    ElMessage.success(`学期 ${newSemester.value} 已添加`)
    semesterDialogVisible.value = false
    newSemester.value = ''
  }
}

function handleImport() {
  ElMessage.success('导入任务已提交')
}
</script>

<template>
  <div class="archive-export">
    <!-- 工具栏 -->
    <el-card class="archive-export__toolbar">
      <el-row :gutter="16" align="middle">
        <el-col :xs="24" :sm="6">
          <el-form-item label="导出范围">
            <el-select v-model="filters.scope" class="archive-export__select">
              <el-option v-for="s in scopeOptions" :key="s" :label="s" :value="s" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="12" :sm="4">
          <el-form-item label="状态">
            <el-select
              v-model="filters.status"
              clearable
              placeholder="全部"
              class="archive-export__select"
            >
              <el-option
                v-for="s in statusOptions"
                :key="s"
                :label="s"
                :value="s === '全部' ? '' : s"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-form-item label="时间">
            <el-date-picker
              v-model="filters.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始"
              end-placeholder="结束"
              size="default"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :xs="12" :sm="4">
          <el-button type="primary" :icon="Search">查询</el-button>
        </el-col>
        <el-col :xs="12" :sm="4" class="archive-export__actions">
          <el-button type="primary" :icon="Download" @click="handleExport">新建导出</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 操作按钮组 -->
    <el-card class="archive-export__actions-bar">
      <el-row :gutter="8">
        <el-col :span="12">
          <el-button :icon="Download" @click="handleBatchExport">导出学生文件</el-button>
          <el-button :icon="FileDown" @click="handleBatchExport">一键导出基本信息</el-button>
          <el-button :icon="Trash2" type="danger" plain>教师删除导出</el-button>
        </el-col>
        <el-col :span="12" style="text-align: right">
          <template v-if="isSuperAdmin">
            <el-button :icon="Plus" @click="semesterDialogVisible = true">手动添加学期</el-button>
            <el-button
              :icon="Upload"
              @click="
                () => {
                  importType = 'students'
                  importDialogVisible = true
                }
              "
              >学期导入</el-button
            >
            <el-button
              :icon="FileUp"
              @click="
                () => {
                  importType = 'grades'
                  importDialogVisible = true
                }
              "
              >导入成绩</el-button
            >
          </template>
        </el-col>
      </el-row>
    </el-card>

    <!-- 超管：选择可导年级 -->
    <el-card v-if="isSuperAdmin" class="archive-export__grade-select">
      <el-form-item label="选择可导年级">
        <el-checkbox-group v-model="gradeSelection">
          <el-checkbox v-for="g in gradeOptions" :key="g" :label="g" :value="g" />
        </el-checkbox-group>
      </el-form-item>
    </el-card>

    <!-- 导出记录列表 -->
    <el-card class="archive-export__list">
      <template #header>
        <span class="section-title">导出记录</span>
      </template>
      <el-table :data="exportRecords" stripe style="width: 100%">
        <el-table-column prop="fileName" label="文件名" min-width="240">
          <template #default="{ row }">
            <div class="file-name">
              <FileDown :size="16" />
              <span>{{ row.fileName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type as any" size="small">
              {{ statusMap[row.status]?.label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="scope" label="范围" width="80" />
        <el-table-column prop="grade" label="年级/班级" width="120" />
        <el-table-column prop="fileSize" label="文件大小" width="100" />
        <el-table-column prop="createdAt" label="创建时间" width="170" />
        <el-table-column prop="updatedAt" label="更新时间" width="170" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'completed'" link type="primary" size="small">
              <Download :size="14" /> 下载
            </el-button>
            <el-button link type="danger" size="small" @click="handleDeleteExport(row.id)">
              <Trash2 :size="14" /> 删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="archive-export__pagination">
        <el-pagination :total="50" :page-size="10" layout="prev, pager, next, total" small />
      </div>
    </el-card>

    <!-- 添加学期弹窗 -->
    <el-dialog v-model="semesterDialogVisible" title="手动添加学期" width="400px">
      <el-form>
        <el-form-item label="学期名称">
          <el-input v-model="newSemester" placeholder="例如：2026-2027-1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="semesterDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addSemester">确定</el-button>
      </template>
    </el-dialog>

    <!-- 导入弹窗 -->
    <el-dialog
      v-model="importDialogVisible"
      :title="importType === 'grades' ? '导入学生成绩' : '学期导入'"
      width="450px"
    >
      <el-upload drag :auto-upload="false" accept=".xlsx,.xls">
        <template #default>
          <div style="padding: 20px">
            <Upload :size="40" style="color: var(--el-color-primary); margin-bottom: 12px" />
            <p style="font-size: 14px; color: var(--el-text-color-primary); margin-bottom: 4px">
              拖拽文件到此处，或点击上传
            </p>
            <p style="font-size: 12px; color: var(--el-text-color-secondary)">
              仅支持 .xlsx / .xls 格式
            </p>
          </div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleImport">开始导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.archive-export {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;

  &__toolbar,
  &__actions-bar,
  &__grade-select,
  &__list {
    margin-bottom: 0;
  }

  &__select {
    width: 100%;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
  }

  &__pagination {
    margin-top: $spacing-lg;
    display: flex;
    justify-content: flex-end;
  }
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.file-name {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  color: var(--el-color-primary);
  font-weight: 500;
}
</style>
