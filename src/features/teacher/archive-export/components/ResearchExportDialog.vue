<script setup lang="ts">
/**
 * ResearchExportDialog - 研究数据导出弹窗
 *
 * 从 ArchiveExport.vue 拆出（该文件有效行数已贴 650 行放宽上限，见项目 2.5 节）。
 * 弹窗自持表单与学期加载；提交成功后把新建任务 emit 给父级，
 * 由父级负责入列表与进度轮询 —— 父子职责边界：父持列表，子弹窗。
 *
 * 对接后端 /admin/exports/research（无教师端等价接口，超管专属）。
 */
import type { SemesterItem, TeacherExportJob } from '@/shared/types/teacher'
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'

import { getSemesters, submitResearchExport } from '@/shared/api/teacher'
import { scopeCascade, useScopeFilter } from '@/shared/composables/useScopeFilter'

/** 任务创建成功：父级据此入列表并启动轮询 */
const emit = defineEmits<{ created: [job: TeacherExportJob] }>()

const visible = defineModel<boolean>('visible', { default: false })

/** 组织范围下拉项（学院/专业/班级，来自 /auth/me 的 scopes） */
const { colleges, majors, classes } = useScopeFilter()

const semesters = ref<SemesterItem[]>([])
const loadingSemesters = ref(false)
const submitting = ref(false)

const form = reactive({
  semesterId: undefined as number | undefined,
  scope: '全校',
  collegeId: undefined as number | undefined,
  majorId: undefined as number | undefined,
  classId: undefined as number | undefined,
  grade: '',
  // TODO 字段级选择需后端扩展导出接口参数
  dataTypes: ['archives', 'scores'] as string[],
  isAnonymized: true,
  includeMetadata: true,
})

/** 导出范围 → 后端 scopeType（年级为 6，与筛选栏的 1~4 不同，勿合并两张表） */
const RESEARCH_SCOPE_TYPE: Record<string, number> = {
  全校: 1,
  学院: 2,
  专业: 3,
  班级: 4,
  年级: 6,
}

const RESEARCH_SCOPES = ['全校', '学院', '专业', '班级', '年级']

const DATA_TYPE_OPTIONS = [
  { value: 'archives', label: '档案' },
  { value: 'scores', label: '成绩' },
  { value: 'audits', label: '审核' },
  { value: 'ai', label: 'AI 分析' },
  { value: 'career', label: '职业规划' },
]

/** 导出范围 → 学院/专业/班级下拉显隐（与筛选栏同一套规则，仅维度表不同） */
const cascade = computed(() => scopeCascade(RESEARCH_SCOPE_TYPE[form.scope]))

async function loadSemesters() {
  loadingSemesters.value = true
  try {
    semesters.value = await getSemesters()
    // 默认选中当前学期（原 ArchiveExport.openResearch 的行为）
    form.semesterId = semesters.value.find((s) => s.isCurrent === 1)?.value
  } catch {
    semesters.value = []
  } finally {
    loadingSemesters.value = false
  }
}

async function handleSubmit() {
  if (!form.semesterId) {
    ElMessage.warning('请选择学期')
    return
  }
  if (!form.dataTypes.length) {
    ElMessage.warning('请至少选择一种数据类型')
    return
  }
  let scopeId: number | undefined
  if (form.scope === '学院') scopeId = form.collegeId
  else if (form.scope === '专业') scopeId = form.majorId
  else if (form.scope === '班级') scopeId = form.classId
  if (form.scope !== '全校' && form.scope !== '年级' && !scopeId) {
    ElMessage.warning(`请选择具体的${form.scope}`)
    return
  }
  if (form.scope === '年级' && !form.grade.trim()) {
    ElMessage.warning('请填写年级，如 2023级')
    return
  }
  submitting.value = true
  try {
    const res = await submitResearchExport({
      semesterId: form.semesterId,
      scopeType: RESEARCH_SCOPE_TYPE[form.scope],
      scopeId,
      grade: form.scope === '年级' ? form.grade.trim() : undefined,
      dataTypes: form.dataTypes,
      isAnonymized: form.isAnonymized,
      includeMetadata: form.includeMetadata,
    })
    ElMessage.success(
      `研究数据导出任务已创建（任务 ID: ${res.jobId}），预计 ${res.estimatedSeconds ?? 60} 秒完成`,
    )
    visible.value = false
    emit('created', {
      exportJobId: res.jobId,
      templateName: '研究数据导出',
      exportType: 'research',
      status: res.status,
      statusLabel: res.statusLabel,
      totalCount: null,
      successCount: null,
      downloadUrl: null,
      expireAt: null,
      createdAt: new Date().toISOString(),
    })
  } catch {
    /* 拦截器已提示 */
  } finally {
    submitting.value = false
  }
}

// el-dialog 首次打开才挂载内容，故此处即「首次打开」时机
onMounted(() => void loadSemesters())
</script>

<template>
  <el-dialog v-model="visible" title="研究数据导出" width="520px">
    <el-form label-width="100px">
      <el-form-item label="学期" required>
        <el-select
          v-model="form.semesterId"
          placeholder="请选择学期"
          style="width: 100%"
          :loading="loadingSemesters"
        >
          <el-option v-for="s in semesters" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="导出范围">
        <el-radio-group v-model="form.scope">
          <el-radio-button v-for="s in RESEARCH_SCOPES" :key="s" :value="s">
            {{ s }}
          </el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="cascade.college" label="学院">
        <el-select v-model="form.collegeId" clearable placeholder="全部学院" style="width: 200px">
          <el-option v-for="c in colleges" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="cascade.major" label="专业">
        <el-select v-model="form.majorId" clearable placeholder="全部专业" style="width: 200px">
          <el-option v-for="m in majors" :key="m.id" :label="m.name" :value="m.id" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="cascade.class" label="班级">
        <el-select v-model="form.classId" clearable placeholder="全部班级" style="width: 200px">
          <el-option v-for="c in classes" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="form.scope === '年级'" label="年级">
        <el-input v-model="form.grade" placeholder="如 2023级" style="width: 200px" />
      </el-form-item>
      <el-form-item label="数据类型" required>
        <el-checkbox-group v-model="form.dataTypes">
          <el-checkbox
            v-for="t in DATA_TYPE_OPTIONS"
            :key="t.value"
            :value="t.value"
            :label="t.value"
          >
            {{ t.label }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      <el-form-item label="匿名化">
        <el-switch v-model="form.isAnonymized" />
        <span class="research-export-dialog__hint">用匿名编号替代姓名与学号</span>
      </el-form-item>
      <el-form-item label="含元数据">
        <el-switch v-model="form.includeMetadata" />
        <span class="research-export-dialog__hint">包含字段说明与数据版本</span>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        创建导出任务
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.research-export-dialog {
  &__hint {
    margin-left: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>
