<script setup lang="ts">
/**
 * RoleManagement - 角色管理
 * 对接后端 /admin/roles（列表/创建/更新/删除/权限分配/权限列表）。
 * 权限分配抽屉独立为 components/PermissionDrawer 组件。
 */
// ── 1. 外部依赖导入 ──
import type { RoleListItem } from '@/shared/types/teacher'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, RefreshCw, Search, ShieldCheck } from 'lucide-vue-next'
import { onMounted, reactive, ref } from 'vue'

import { createRole, deleteRole, listRoles, updateRole } from '@/shared/api/teacher'
import { COMMON_STATUS } from '@/shared/constants/dict'
import PermissionDrawer from './components/PermissionDrawer.vue'

// ── 2. 类型/接口定义 ──
// （无自定义类型，直接使用共享层 DTO）

// ── 3. Props & Emits ──
// （页面组件无 props/emits）

// ── 4. Store / Composable ──
// （无全局状态依赖，数据直接通过 API 获取）

// ── 5. 响应式数据 ──
const loading = ref(false)
const list = ref<RoleListItem[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(20)

const filter = reactive<{ status: number | '' }>({ status: '' })

// ── 新增/编辑弹窗 ──
const dialogVisible = ref(false)
const saving = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({
  roleName: '',
  roleCode: '',
  level: 1,
  description: '',
  status: 1,
})

// ── 权限分配抽屉 ──
const permDrawerVisible = ref(false)
const permRoleId = ref(0)
const permRoleName = ref('')

// ── 6. Computed ──
// （无）

// ── 7. Watch ──
// （无）

// ── 8. 生命周期 ──
onMounted(() => void load())

// ── 9. 方法函数 ──
async function load() {
  loading.value = true
  try {
    const res = await listRoles({
      status: filter.status === '' ? undefined : filter.status,
      page: page.value,
      per_page: perPage.value,
    })
    list.value = res.list
    total.value = res.total
  } catch {
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  void load()
}

function handleReset() {
  filter.status = ''
  page.value = 1
  void load()
}

function handlePageChange(p: number) {
  page.value = p
  void load()
}

/** 角色状态展示：优先后端 statusLabel，其次 COMMON_STATUS 映射，兜底「-」 */
function statusView(row: RoleListItem): { label: string; tag: 'success' | 'danger' | 'info' } {
  if (row.statusLabel) {
    return { label: row.statusLabel, tag: row.status === 1 ? 'success' : 'danger' }
  }
  if (row.status != null && COMMON_STATUS[row.status]) {
    return COMMON_STATUS[row.status]
  }
  return { label: '-', tag: 'info' }
}

function openCreate() {
  isEdit.value = false
  editingId.value = null
  form.roleName = ''
  form.roleCode = ''
  form.level = 1
  form.description = ''
  form.status = 1
  dialogVisible.value = true
}

function openEdit(row: RoleListItem) {
  isEdit.value = true
  editingId.value = row.roleId
  form.roleName = row.roleName
  form.roleCode = row.roleCode
  form.level = row.level ?? 1
  form.description = row.description ?? ''
  form.status = row.status ?? 1
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.roleName.trim() || !form.roleCode.trim()) {
    ElMessage.warning('请填写角色名称和编码')
    return
  }
  saving.value = true
  try {
    const payload = {
      roleName: form.roleName.trim(),
      roleCode: form.roleCode.trim(),
      level: form.level,
      description: form.description || undefined,
      status: form.status,
    }
    if (isEdit.value && editingId.value != null) {
      await updateRole(editingId.value, payload)
      ElMessage.success('更新成功')
    } else {
      await createRole(payload)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    void load()
  } catch {
    /* 拦截器已提示 */
  } finally {
    saving.value = false
  }
}

async function handleDelete(row: RoleListItem) {
  try {
    await ElMessageBox.confirm(`确定删除角色「${row.roleName}」吗？`, '提示', {
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await deleteRole(row.roleId)
    ElMessage.success('删除成功')
    void load()
  } catch {
    /* 拦截器已提示 */
  }
}

function openPermissionAssign(row: RoleListItem) {
  permRoleId.value = row.roleId
  permRoleName.value = row.roleName
  permDrawerVisible.value = true
}
</script>

<template>
  <div class="mc-page role-management">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <h2 class="mc-page-head__title">角色管理</h2>
        <p class="mc-page-head__desc">管理系统角色，维护启用状态与权限分配。</p>
      </div>
      <div class="mc-page-head__actions">
        <el-button :icon="RefreshCw" :loading="loading" @click="load">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreate">新增角色</el-button>
      </div>
    </div>

    <div class="mc-filter-bar">
      <el-form inline @submit.prevent="handleSearch">
        <el-form-item label="状态">
          <el-select
            v-model="filter.status"
            placeholder="全部状态"
            clearable
            style="width: 140px"
            @change="handleSearch"
          >
            <el-option
              v-for="(item, value) in COMMON_STATUS"
              :key="value"
              :label="item.label"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="mc-card">
      <div class="mc-card__body">
        <el-table v-loading="loading" :data="list" stripe style="width: 100%">
          <el-table-column prop="roleName" label="角色名称" min-width="100" />
          <el-table-column prop="roleCode" label="角色编码" min-width="90" />
          <el-table-column label="级别" width="60" align="center">
            <template #default="{ row }">{{ row.level ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="状态" width="72">
            <template #default="{ row }">
              <el-tag :type="statusView(row as RoleListItem).tag" size="small">
                {{ statusView(row as RoleListItem).label }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="权限数" width="56" align="center">
            <template #default="{ row }">{{ row.permissionCount ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="用户数" width="56" align="center">
            <template #default="{ row }">{{ row.userCount ?? '-' }}</template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="110" show-overflow-tooltip>
            <template #default="{ row }">{{ row.description ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="创建时间" min-width="120">
            <template #default="{ row }">{{ row.createdAt ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="230" align="center">
            <template #default="{ row }">
              <div class="role-management__actions">
                <el-button
                  text
                  type="primary"
                  size="small"
                  :icon="ShieldCheck"
                  @click="openPermissionAssign(row as RoleListItem)"
                >
                  权限分配
                </el-button>
                <el-button text type="primary" size="small" @click="openEdit(row as RoleListItem)">
                  编辑
                </el-button>
                <el-button
                  text
                  type="danger"
                  size="small"
                  @click="handleDelete(row as RoleListItem)"
                >
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <div class="role-management__pagination">
          <el-pagination
            :current-page="page"
            :page-size="perPage"
            :total="total"
            layout="total, prev, pager, next"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑角色' : '新增角色'" width="520px">
      <el-form label-width="90px">
        <el-form-item label="角色名称" required>
          <el-input v-model="form.roleName" placeholder="如：辅导员" />
        </el-form-item>
        <el-form-item label="角色编码" required>
          <el-input v-model="form.roleCode" placeholder="如：counselor" />
        </el-form-item>
        <el-form-item label="级别">
          <el-input-number v-model="form.level" :min="1" style="width: 160px" />
          <span class="role-management__hint">数值越小权限层级越高</span>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="角色描述" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
          <span class="role-management__hint">{{ form.status === 1 ? '启用' : '禁用' }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" :disabled="saving" @click="handleSave"
          >保存</el-button
        >
      </template>
    </el-dialog>

    <PermissionDrawer
      v-model:visible="permDrawerVisible"
      :role-id="permRoleId"
      :role-name="permRoleName"
    />
  </div>
</template>

<style scoped lang="scss">
.role-management {
  &__actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    flex-wrap: nowrap;
    white-space: nowrap;

    // 去掉 Element Plus 相邻按钮默认 12px 间距，保证三个操作一排排布
    :deep(.el-button + .el-button) {
      margin-left: 0;
    }
  }

  &__pagination {
    margin-top: $spacing-lg;
    display: flex;
    justify-content: flex-end;
  }

  &__hint {
    margin-left: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>
