<script setup lang="ts">
/**
 * ArchiveExport - 档案导出
 *
 * 后端现状：教师/管理端批量导出接口（/teacher/exports 等）尚未实现，
 * 导出范围（学院/专业/班级）来源于登录者数据范围 scopes。
 * 导出记录列表展示待后端就绪的空态。
 */
import { Download, FileDown, FileUp, Plus, Search, Trash2, Upload } from 'lucide-vue-next'
import { computed, reactive, ref } from 'vue'

import { useUserStore } from '@/app/stores/stores'
import { useTeacherMe } from '@/shared/composables/useTeacherMe'

const userStore = useUserStore()
const { me } = useTeacherMe()
const isSuperAdmin = computed(() => userStore.isSuperAdmin)

const colleges = computed(
  () =>
    [
      ...new Set(
        (me.value?.scopes ?? [])
          .filter((s) => s.scopeType === 2)
          .map((s) => s.scopeName)
          .filter(Boolean),
      ),
    ] as string[],
)
const majors = computed(
  () =>
    [
      ...new Set(
        (me.value?.scopes ?? [])
          .filter((s) => s.scopeType === 3)
          .map((s) => s.scopeName)
          .filter(Boolean),
      ),
    ] as string[],
)
const classes = computed(
  () =>
    [
      ...new Set(
        (me.value?.scopes ?? [])
          .filter((s) => s.scopeType === 4)
          .map((s) => s.scopeName)
          .filter(Boolean),
      ),
    ] as string[],
)

const filters = reactive({
  scope: '全校',
  college: '',
  major: '',
  className: '',
  status: '',
  dateRange: [] as string[],
})

const scopeOptions = ['全校', '学院', '专业', '班级']

const exportRecords = ref([] as unknown[])

const statusOptions = ['全部', '已完成', '处理中', '失败']

// ── 超管专属：添加学期 / 导入 / 可导年级 ──
const semesterDialogVisible = ref(false)
const newSemester = ref('')
const importDialogVisible = ref(false)
const importType = ref<'students' | 'grades'>('students')
const gradeSelection = ref<string[]>([])
const gradeOptions = ['2024级', '2023级', '2022级', '2021级']

function handleExport() {
  // 后端导出任务接口就绪后接入
  void 0
}
</script>

<template>
  <div class="mc-page archive-export">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <p class="mc-page-head__eyebrow">档案导出 · Exports</p>
        <h2 class="mc-page-head__title">档案导出</h2>
        <p class="mc-page-head__desc">
          选择导出范围（全校 / 学院 / 专业 / 班级）并管理导出任务。导出任务接口
          （/teacher/exports）待后端就绪。
        </p>
      </div>
    </div>

    <div class="mc-filter-bar">
      <el-form inline @submit.prevent>
        <el-form-item label="导出范围">
          <el-select v-model="filters.scope" style="width: 120px">
            <el-option v-for="s in scopeOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="filters.scope === '学院' || filters.scope === '专业' || filters.scope === '班级'"
          label="学院"
        >
          <el-select
            v-model="filters.college"
            placeholder="全部学院"
            clearable
            style="width: 150px"
          >
            <el-option v-for="c in colleges" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="filters.scope === '专业' || filters.scope === '班级'" label="专业">
          <el-select v-model="filters.major" placeholder="全部专业" clearable style="width: 160px">
            <el-option v-for="m in majors" :key="m" :label="m" :value="m" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="filters.scope === '班级'" label="班级">
          <el-select
            v-model="filters.className"
            placeholder="全部班级"
            clearable
            style="width: 150px"
          >
            <el-option v-for="c in classes" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" clearable placeholder="全部" style="width: 120px">
            <el-option
              v-for="s in statusOptions"
              :key="s"
              :label="s"
              :value="s === '全部' ? '' : s"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="时间">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search">查询</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="mc-card">
      <div class="mc-card__head">
        <span class="mc-card__title">导出操作</span>
      </div>
      <div class="mc-card__body archive-export__actions">
        <el-button :icon="Download" @click="handleExport">导出学生文件</el-button>
        <el-button :icon="FileDown" @click="handleExport">一键导出基本信息</el-button>
        <el-button :icon="Trash2" type="danger" plain @click="handleExport">删除导出</el-button>
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
          >
            学院导入
          </el-button>
          <el-button
            :icon="FileUp"
            @click="
              () => {
                importType = 'grades'
                importDialogVisible = true
              }
            "
          >
            导入成绩
          </el-button>
        </template>
      </div>
      <div v-if="isSuperAdmin" class="mc-card__body">
        <el-form-item label="选择可导年级">
          <el-checkbox-group v-model="gradeSelection">
            <el-checkbox v-for="g in gradeOptions" :key="g" :label="g" :value="g" />
          </el-checkbox-group>
        </el-form-item>
      </div>
    </div>

    <div class="mc-card">
      <div class="mc-card__head">
        <span class="mc-card__title">导出记录</span>
        <span class="archive-export__count">{{ exportRecords.length }} 条</span>
      </div>
      <div class="mc-card__body">
        <div class="mc-empty">
          <div class="mc-empty__icon"><FileDown :size="24" /></div>
          <p class="mc-empty__title">导出记录待后端就绪</p>
          <p class="mc-empty__desc">
            导出任务创建、进度查询与删除依赖后端 /teacher/exports 接口，接口就绪后记录会自动加载。
          </p>
        </div>
      </div>
    </div>

    <el-dialog v-model="semesterDialogVisible" title="手动添加学期" width="400px">
      <el-form>
        <el-form-item label="学期名称">
          <el-input v-model="newSemester" placeholder="例如：2026-2027-1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="semesterDialogVisible = false">取消</el-button>
        <el-button type="primary">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="importDialogVisible"
      :title="importType === 'grades' ? '导入学生成绩' : '学期导入'"
      width="450px"
    >
      <el-upload drag :auto-upload="false" accept=".xlsx,.xls">
        <template #default>
          <div class="upload-hint">
            <Upload :size="40" class="upload-hint__icon" />
            <p class="upload-hint__title">拖拽文件到此处，或点击上传</p>
            <p class="upload-hint__desc">仅支持 .xlsx / .xls 格式</p>
          </div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary">开始导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.archive-export {
  &__count {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
  }
}
.upload-hint {
  padding: $spacing-xl;
  &__icon {
    color: var(--el-color-primary);
    margin-bottom: $spacing-sm;
  }
  &__title {
    font-size: 14px;
    color: var(--el-text-color-primary);
    margin-bottom: 4px;
  }
  &__desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>
