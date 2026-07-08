<script setup lang="ts">
import type { TagProps } from 'element-plus'
import { ElMessage } from 'element-plus'
import { AlertTriangle, Download, Eye, Plus, Sparkles } from 'lucide-vue-next'
import { computed, reactive, ref } from 'vue'
import AIChatDrawer from '@/features/ai-chat/components/AIChatDrawer.vue'
import { useDict } from '@/shared/composables/composables'
import { useFormDraft } from '@/shared/composables/useFormDraft'
import { APPLICATION_STATUS, SEMESTER_OPTIONS } from '@/shared/constants/dict'

interface PlanRecord {
  id: string
  semester: string
  title: string
  submitDate: string
  status: 'draft' | 'submitted'
}

// ── 响应式数据 ──
const planForm = reactive({
  semester: '',
  title: '',
  content: '',
})
const { clearDraft } = useFormDraft('career-plan', planForm)

const planFiles = ref<{ name: string; url: string }[]>([])

// ── Mock 数据（接口联调后替换） ──
const planRecords = ref<PlanRecord[]>([
  {
    id: '1',
    semester: '2023-2024-1',
    title: '大二学年成长规划',
    submitDate: '2025-09-15',
    status: 'submitted',
  },
  {
    id: '2',
    semester: '2022-2023-2',
    title: '大一学年总结与规划',
    submitDate: '2025-03-10',
    status: 'submitted',
  },
])

const weaknesses = ref([
  {
    dimension: '科研创新',
    score: 60,
    weakness: '科研项目经历较少，缺乏论文发表',
    suggestion: '建议参与导师科研项目，尝试撰写学术论文',
  },
  {
    dimension: '竞赛实践',
    score: 65,
    weakness: '高级别竞赛参与度不足',
    suggestion: '关注国家级竞赛信息，组建团队参赛',
  },
])

const loading = ref(false)
const dialogVisible = ref(false)
const aiDrawerVisible = ref(false)
const aiInitialQuestion = '请分析我的职业规划短板并给出改进建议'

// ── Computed ──
const { getColor, getLabel } = useDict(APPLICATION_STATUS)

const getStatusType = computed(() => (status: PlanRecord['status']): TagProps['type'] => {
  return (getColor(status) as TagProps['type']) ?? 'info'
})

// ── 方法函数 ──
function handleSubmit() {
  if (!planForm.semester || !planForm.title) {
    ElMessage.warning('请填写完整信息')
    return
  }
  loading.value = true
  setTimeout(() => {
    planRecords.value.unshift({
      id: Date.now().toString(),
      semester: planForm.semester,
      title: planForm.title,
      submitDate: new Date().toISOString().slice(0, 10),
      status: 'submitted',
    })
    ElMessage.success('规划材料提交成功')
    clearDraft()
    dialogVisible.value = false
    planForm.semester = ''
    planForm.title = ''
    planForm.content = ''
    planFiles.value = []
    loading.value = false
  }, 600)
}
</script>

<template>
  <div class="career-plan">
    <el-card>
      <template #header>
        <div class="career-plan__header">
          <span class="card-title">职业规划与材料填写</span>
          <el-button type="primary" :icon="Plus" @click="dialogVisible = true">
            新增规划
          </el-button>
        </div>
      </template>

      <!-- 规划列表 -->
      <el-table :data="planRecords" stripe class="career-plan__table">
        <el-table-column prop="semester" label="学期" width="130" />
        <el-table-column prop="title" label="规划名称" min-width="160" />
        <el-table-column prop="submitDate" label="提交时间" width="110" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default>
            <div class="action-btns">
              <el-button text type="primary" :icon="Eye" size="small">查看</el-button>
              <el-button text type="primary" :icon="Download" size="small">下载</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 短板识别与改进建议 -->
    <el-card class="career-plan__section">
      <template #header>
        <div class="career-plan__header">
          <div class="section-title">
            <AlertTriangle :size="18" />
            <span>短板识别与改进建议</span>
          </div>
          <div class="section-actions">
            <el-button
              type="primary"
              size="small"
              plain
              :icon="Sparkles"
              @click="aiDrawerVisible = true"
            >
              AI 深度分析
            </el-button>
            <el-tag size="small" type="warning">AI 生成</el-tag>
          </div>
        </div>
      </template>
      <div v-for="item in weaknesses" :key="item.dimension" class="weakness-item">
        <div class="weakness-item__header">
          <span class="weakness-item__dim">{{ item.dimension }}</span>
          <el-progress
            :percentage="item.score"
            :stroke-width="8"
            class="progress-fixed"
            status="exception"
            :format="() => `${item.score}分`"
          />
        </div>
        <el-alert
          :title="`短板：${item.weakness}`"
          type="warning"
          :closable="false"
          show-icon
          class="mb-8"
        />
        <el-alert :title="`建议：${item.suggestion}`" type="success" :closable="false" show-icon />
      </div>
    </el-card>

    <!-- 新增规划弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      title="填写职业规划"
      width="640px"
      :close-on-click-modal="false"
    >
      <el-form :model="planForm" label-width="100px">
        <el-form-item label="学期" required>
          <el-select v-model="planForm.semester" placeholder="请选择学期" class="form-select">
            <el-option
              v-for="s in SEMESTER_OPTIONS"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="规划标题" required>
          <el-input v-model="planForm.title" placeholder="请输入规划标题" />
        </el-form-item>
        <el-form-item label="规划内容">
          <el-input
            v-model="planForm.content"
            type="textarea"
            :rows="6"
            placeholder="请描述你的职业规划、学习目标..."
          />
        </el-form-item>
        <el-form-item label="规划文件">
          <el-upload v-model:file-list="planFiles" action="#" :auto-upload="false" list-type="text">
            <el-button type="primary" plain>选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 pdf、doc、docx 格式</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">提交</el-button>
      </template>
    </el-dialog>

    <AIChatDrawer
      :visible="aiDrawerVisible"
      :initial-question="aiInitialQuestion"
      @close="aiDrawerVisible = false"
    />
  </div>
</template>

<style scoped lang="scss">
.career-plan {
  display: flex;
  flex-direction: column;
  gap: 16px;
  user-select: none;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__section {
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
    }
  }
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.form-select {
  width: 200px;
}

.action-btns {
  display: flex;
  align-items: center;
  gap: 4px;
}

.career-plan__table {
  :deep(td.el-table__cell:first-child) {
    white-space: nowrap;
  }
}

.weakness-item {
  margin-bottom: 20px;
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;

  &:last-child {
    margin-bottom: 0;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  &__dim {
    font-weight: 600;
    font-size: 15px;
  }
}
</style>
