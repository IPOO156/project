<script setup lang="ts">
/**
 * AiFaqManagement - AI 常见问题配置（/admin/ai-faqs）
 *
 * 学生端 AI 聊天页与悬浮球抽屉的快捷提问均读取本页维护的数据（GET /ai/faqs）。
 * 列表不分页、按 sort 升序；新建固定为启用状态，状态只在本页表格开关中调整。
 * 学生端展示：完整对话页取前 6 条、悬浮窗取前 4 条（仅展示层截断）。
 */
import type { AdminAiFaqItem } from '@/shared/types/teacher'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, RefreshCw } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref } from 'vue'

import EmptyState from '@/components/ui/EmptyState.vue'
import { createAiFaq, deleteAiFaq, listAiFaqs, updateAiFaq } from '@/shared/api/teacher-api'

/** 与后端校验一致：问题内容 1~200 字 */
const MAX_QUESTION_LENGTH = 200

const loading = ref(false)
const list = ref<AdminAiFaqItem[]>([])

// 新增/编辑弹窗：只改问题与排序，状态走表格开关（避免双入口口径不一）
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
/** 正在删除的 id（仅该行按钮转圈） */
const deletingId = ref<number | null>(null)
/** 正在切换状态的 id（仅该行开关转圈） */
const statusSavingId = ref<number | null>(null)
const form = reactive({
  question: '',
  sort: 0,
})

const total = computed(() => list.value.length)
const enabledCount = computed(() => list.value.filter((item) => item.status === 1).length)

onMounted(() => void load())

async function load() {
  loading.value = true
  try {
    list.value = await listAiFaqs()
  } catch {
    // 拦截器已提示；清空避免残留旧数据误导操作
    list.value = []
  } finally {
    loading.value = false
  }
}

/** 新增时排序默认排到最后（当前最大 sort + 1） */
function nextSort(): number {
  return list.value.reduce((max, item) => Math.max(max, item.sort ?? 0), 0) + 1
}

function openCreate() {
  isEdit.value = false
  editingId.value = null
  form.question = ''
  form.sort = nextSort()
  dialogVisible.value = true
}

function openEdit(row: AdminAiFaqItem) {
  isEdit.value = true
  editingId.value = row.id
  form.question = row.question ?? ''
  form.sort = row.sort ?? 0
  dialogVisible.value = true
}

async function handleSave() {
  const question = form.question.trim()
  if (!question) {
    ElMessage.warning('请输入问题内容')
    return
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    ElMessage.warning(`问题内容不能超过 ${MAX_QUESTION_LENGTH} 个字符`)
    return
  }
  if (saving.value) return
  // el-input-number 允许清空，清空后运行时为 undefined；兜底为 0
  const sort = Number.isFinite(form.sort) ? form.sort : 0
  saving.value = true
  try {
    if (isEdit.value && editingId.value != null) {
      await updateAiFaq(editingId.value, { question, sort })
      ElMessage.success('保存成功')
    } else {
      await createAiFaq({ question, sort })
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    await load()
  } catch {
    /* 拦截器已提示 */
  } finally {
    saving.value = false
  }
}

/** el-switch 变更回调：归一化 change 载荷后执行启用/禁用 */
function handleStatusChange(row: AdminAiFaqItem, v: boolean | string | number) {
  void handleToggle(row, v === true || v === 'true' || v === 1)
}

async function handleToggle(row: AdminAiFaqItem, enabled: boolean) {
  const verb = enabled ? '启用' : '禁用'
  try {
    await ElMessageBox.confirm(
      enabled
        ? `确认启用问题「${row.question}」？启用后学生端将展示该问题。`
        : `确认禁用问题「${row.question}」？禁用后学生端立即不再展示。`,
      `${verb}确认`,
      {
        confirmButtonText: verb,
        cancelButtonText: '取消',
        type: enabled ? 'success' : 'warning',
      },
    )
  } catch {
    void load() // 取消确认时回滚开关视觉状态
    return
  }
  statusSavingId.value = row.id
  try {
    await updateAiFaq(row.id, { status: enabled ? 1 : 0 })
    ElMessage.success(`已${verb}`)
    await load()
  } catch {
    void load() // 失败时回滚开关视觉状态（错误提示由拦截器给出）
  } finally {
    statusSavingId.value = null
  }
}

async function handleDelete(row: AdminAiFaqItem) {
  try {
    await ElMessageBox.confirm(
      `确定删除问题「${row.question}」吗？删除后学生端不再展示，且不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )
  } catch {
    return
  }
  deletingId.value = row.id
  try {
    await deleteAiFaq(row.id)
    ElMessage.success('删除成功')
    await load()
  } catch {
    /* 拦截器已提示 */
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <div class="mc-page ai-faq-management">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <h2 class="mc-page-head__title">AI 常见问题</h2>
        <p class="mc-page-head__desc">
          维护学生端 AI 助手的快捷提问。完整对话页最多展示前 6 条，悬浮窗展示前 4
          条，均按排序升序取启用项。
        </p>
      </div>
      <div class="mc-page-head__actions">
        <el-button :icon="RefreshCw" :loading="loading" @click="load">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreate">新增问题</el-button>
      </div>
    </div>

    <div class="mc-card">
      <div class="mc-card__head">
        <span class="mc-card__title">问题列表</span>
        <span class="ai-faq-management__meta">共 {{ total }} 条，启用 {{ enabledCount }} 条</span>
      </div>
      <div class="mc-card__body">
        <el-table v-loading="loading" class="u-w-full" :data="list" stripe>
          <el-table-column prop="sort" label="排序" width="80" align="center" />
          <el-table-column prop="question" label="问题内容" min-width="320" show-overflow-tooltip />
          <el-table-column label="状态" width="110" align="center">
            <template #default="{ row }">
              <el-switch
                :model-value="(row as AdminAiFaqItem).status === 1"
                inline-prompt
                active-text="启用"
                inactive-text="禁用"
                :loading="statusSavingId === (row as AdminAiFaqItem).id"
                :disabled="statusSavingId !== null && statusSavingId !== (row as AdminAiFaqItem).id"
                @change="handleStatusChange(row as AdminAiFaqItem, $event)"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" align="center">
            <template #default="{ row }">
              <el-button text type="primary" size="small" @click="openEdit(row as AdminAiFaqItem)">
                编辑
              </el-button>
              <el-button
                text
                type="danger"
                size="small"
                :loading="deletingId === (row as AdminAiFaqItem).id"
                :disabled="deletingId !== null"
                @click="handleDelete(row as AdminAiFaqItem)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
          <template #empty>
            <EmptyState text="暂无常见问题，学生端将隐藏快捷提问区" compact />
          </template>
        </el-table>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑问题' : '新增问题'"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-form label-width="80px">
        <el-form-item label="问题内容" required>
          <el-input
            v-model="form.question"
            type="textarea"
            :rows="3"
            :maxlength="MAX_QUESTION_LENGTH"
            show-word-limit
            placeholder="如：如何申请奖学金？"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :step="1" :step-strictly="true" />
          <span class="ai-faq-management__hint">数字越小越靠前</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" :disabled="saving" @click="handleSave">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.ai-faq-management {
  &__meta {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  &__hint {
    margin-left: $spacing-sm;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>
