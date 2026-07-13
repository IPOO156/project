<script setup lang="ts">
import { ElMessage } from 'element-plus'
/**
 * FormCustomization - 表单自定义
 * 添加菜单→输入新增项目→发布信息
 * 超级管理员/管理员可用
 */
import { Eye, EyeOff, Plus, Save, Trash2 } from 'lucide-vue-next'
import { ref } from 'vue'

const formItems = ref([
  { id: 1, label: '学科竞赛', type: 'input', required: true, status: 'published', order: 1 },
  { id: 2, label: '创新创业', type: 'input', required: false, status: 'published', order: 2 },
  { id: 3, label: '学术研究', type: 'textarea', required: false, status: 'published', order: 3 },
  { id: 4, label: '社会实践', type: 'input', required: true, status: 'draft', order: 4 },
])

const dialogVisible = ref(false)
const newItem = ref({ label: '', type: 'input', required: false })

const typeOptions = [
  { value: 'input', label: '单行文本' },
  { value: 'textarea', label: '多行文本' },
  { value: 'select', label: '下拉选择' },
  { value: 'file', label: '文件上传' },
]

function handleAdd() {
  if (!newItem.value.label.trim()) {
    ElMessage.warning('请输入项目名称')
    return
  }
  formItems.value.push({
    id: Date.now(),
    label: newItem.value.label,
    type: newItem.value.type,
    required: newItem.value.required,
    status: 'draft',
    order: formItems.value.length + 1,
  })
  newItem.value = { label: '', type: 'input', required: false }
  dialogVisible.value = false
  ElMessage.success('新增项目已添加')
}

function handleToggle(item: any) {
  item.status = item.status === 'published' ? 'draft' : 'published'
  ElMessage.success(`项目已${item.status === 'published' ? '发布' : '下架'}`)
}

function handleDelete(id: number) {
  formItems.value = formItems.value.filter((i) => i.id !== id)
  ElMessage.success('项目已删除')
}

function handlePublishAll() {
  formItems.value.forEach((i) => (i.status = 'published'))
  ElMessage.success('全部信息已发布')
}

function moveUp(index: number) {
  if (index > 0) {
    const temp = formItems.value[index]
    formItems.value[index] = formItems.value[index - 1]
    formItems.value[index - 1] = temp
  }
}

function moveDown(index: number) {
  if (index < formItems.value.length - 1) {
    const temp = formItems.value[index]
    formItems.value[index] = formItems.value[index + 1]
    formItems.value[index + 1] = temp
  }
}
</script>

<template>
  <div class="form-custom">
    <!-- 操作栏 -->
    <el-card class="form-custom__toolbar">
      <el-row justify="space-between" align="middle">
        <el-col :span="12">
          <span class="section-title">表单自定义管理</span>
        </el-col>
        <el-col :span="12" style="text-align: right">
          <el-button type="primary" :icon="Save" @click="handlePublishAll">发布全部</el-button>
          <el-button type="primary" :icon="Plus" @click="dialogVisible = true">添加菜单</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 表单项目列表 -->
    <el-card>
      <template #header>
        <span class="section-title">申报项目列表</span>
      </template>

      <div class="form-items">
        <div v-for="(item, index) in formItems" :key="item.id" class="form-item">
          <div class="form-item__order">{{ item.order }}</div>
          <div class="form-item__main">
            <div class="form-item__info">
              <span class="form-item__label">{{ item.label }}</span>
              <el-tag size="small" type="info">{{
                typeOptions.find((t) => t.value === item.type)?.label
              }}</el-tag>
              <el-tag v-if="item.required" size="small" type="danger" effect="plain">必填</el-tag>
            </div>
            <div class="form-item__meta">
              <el-tag
                :type="item.status === 'published' ? 'success' : 'info'"
                size="small"
                effect="plain"
              >
                {{ item.status === 'published' ? '已发布' : '草稿' }}
              </el-tag>
            </div>
          </div>
          <div class="form-item__actions">
            <el-button link size="small" :disabled="index === 0" @click="moveUp(index)">
              上移
            </el-button>
            <el-button
              link
              size="small"
              :disabled="index === formItems.length - 1"
              @click="moveDown(index)"
            >
              下移
            </el-button>
            <el-button
              link
              size="small"
              :icon="item.status === 'published' ? EyeOff : Eye"
              @click="handleToggle(item)"
            >
              {{ item.status === 'published' ? '下架' : '发布' }}
            </el-button>
            <el-button
              link
              size="small"
              type="danger"
              :icon="Trash2"
              @click="handleDelete(item.id)"
            >
              删除
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 添加弹窗 -->
    <el-dialog v-model="dialogVisible" title="新增菜单项目" width="480px">
      <el-form label-width="80px">
        <el-form-item label="项目名称" required>
          <el-input v-model="newItem.label" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="字段类型">
          <el-select v-model="newItem.type" style="width: 100%">
            <el-option v-for="t in typeOptions" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否必填">
          <el-switch v-model="newItem.required" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAdd">确定新增</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.form-custom {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;

  &__toolbar {
    margin-bottom: 0;
  }
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.form-items {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.form-item {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md $spacing-lg;
  border: 1px solid var(--el-border-color-light);
  border-radius: $radius-base;
  transition: all 0.2s;

  &:hover {
    background: var(--el-fill-color-light);
    border-color: var(--el-color-primary-light-7);
  }

  &__order {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    border-radius: 50%;
    font-size: 13px;
    font-weight: 600;
    flex-shrink: 0;
  }

  &__main {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-md;
  }

  &__info {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__label {
    font-weight: 600;
    font-size: 14px;
    color: var(--el-text-color-primary);
    min-width: 80px;
  }

  &__actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }
}
</style>
