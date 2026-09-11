<script setup lang="ts">
/**
 * TeacherAccount - 教师账号管理
 *
 * 对接后端 /admin/users（roleId=3 教师），支持按关键词/状态筛选与分页；
 * 重置密码对接 PUT /admin/users/{id}/password/reset，
 * 启停账号对接 PUT /admin/users/{id}/status。
 */
import type { UserDetail, UserListItem } from '@/shared/types/teacher'
import { ElMessage, ElMessageBox } from 'element-plus'
import { RefreshCw, Search } from 'lucide-vue-next'
import { onMounted, reactive, ref } from 'vue'

import {
  getUserDetail,
  listUsers,
  resetUserPassword,
  updateUser,
  updateUserStatus,
} from '@/shared/api/teacher'

const loading = ref(false)
const users = ref<UserListItem[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(10)

const search = reactive({ keyword: '', status: '' })

async function load() {
  loading.value = true
  try {
    const res = await listUsers({
      roleId: 3,
      keyword: search.keyword || undefined,
      status: search.status === '' ? undefined : Number(search.status),
      page: page.value,
      per_page: perPage.value,
    })
    users.value = res.list
    total.value = res.total
  } catch {
    users.value = []
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
  search.keyword = ''
  search.status = ''
  page.value = 1
  void load()
}

function handlePageChange(p: number) {
  page.value = p
  void load()
}

function handleSizeChange(size: number) {
  perPage.value = size
  page.value = 1
  void load()
}

// ── 重置密码 ──
const passwordDialogVisible = ref(false)
const passwordForm = reactive({ newPassword: '' })
const currentUser = ref<UserListItem | null>(null)

function openPasswordDialog(row: UserListItem) {
  currentUser.value = row
  passwordForm.newPassword = ''
  passwordDialogVisible.value = true
}

async function handleResetPassword() {
  if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
    ElMessage.warning('新密码至少 6 位')
    return
  }
  if (!currentUser.value) return
  try {
    await resetUserPassword(currentUser.value.userId, passwordForm.newPassword)
    ElMessage.success('密码已重置')
    passwordDialogVisible.value = false
  } catch {
    /* 拦截器已提示 */
  }
}

// ── 启停账号 ──
async function handleToggleStatus(row: UserListItem) {
  const next = row.status === 1 ? 0 : 1
  const action = next === 1 ? '启用' : '禁用'
  try {
    await ElMessageBox.confirm(`确定${action}账号「${row.name}」吗？`, '提示', { type: 'warning' })
  } catch {
    return
  }
  try {
    await updateUserStatus(row.userId, next)
    row.status = next
    row.statusLabel = next === 1 ? '正常' : '禁用'
    ElMessage.success(`已${action}`)
  } catch {
    /* 拦截器已提示 */
  }
}

// ── 详情 ──
const detailDialogVisible = ref(false)
const detail = ref<UserDetail | null>(null)

async function openDetail(row: UserListItem) {
  detailDialogVisible.value = true
  detail.value = null
  try {
    detail.value = await getUserDetail(row.userId)
  } catch {
    /* 拦截器已提示 */
  }
}

// ── 编辑 ──
const editDialogVisible = ref(false)
const editForm = reactive({ name: '', email: '', phone: '' })
const editUser = ref<UserListItem | null>(null)

function openEdit(row: UserListItem) {
  editUser.value = row
  editForm.name = row.name
  editForm.email = row.email ?? ''
  editForm.phone = row.phone ?? ''
  editDialogVisible.value = true
}

async function handleSaveEdit() {
  if (!editForm.name.trim()) {
    ElMessage.warning('姓名不能为空')
    return
  }
  if (!editUser.value) return
  try {
    await updateUser(editUser.value.userId, {
      name: editForm.name.trim(),
      email: editForm.email || undefined,
      phone: editForm.phone || undefined,
    })
    ElMessage.success('已保存')
    editDialogVisible.value = false
    void load()
  } catch {
    /* 拦截器已提示 */
  }
}

onMounted(() => void load())
</script>

<template>
  <div class="mc-page teacher-account">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <p class="mc-page-head__eyebrow">账号管理 · Teachers</p>
        <h2 class="mc-page-head__title">教师账号管理</h2>
        <p class="mc-page-head__desc">查看教师账号，重置密码与启停账号。</p>
      </div>
      <div class="mc-page-head__actions">
        <el-button :icon="RefreshCw" :loading="loading" @click="handleReset">刷新</el-button>
      </div>
    </div>

    <div class="mc-filter-bar">
      <el-form inline @submit.prevent="handleSearch">
        <el-form-item label="关键词">
          <el-input
            v-model="search.keyword"
            placeholder="姓名 / 工号"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="search.status" placeholder="全部状态" clearable style="width: 140px">
            <el-option label="正常" value="1" />
            <el-option label="禁用" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" :loading="loading" @click="handleSearch">
            查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="mc-card">
      <div class="mc-card__head">
        <span class="mc-card__title">教师账号列表</span>
        <span class="teacher-account__total">共 {{ total }} 条</span>
      </div>
      <div class="mc-card__body">
        <el-table v-loading="loading" :data="users" stripe max-height="600" style="width: 100%">
          <el-table-column type="index" label="序号" width="55" />
          <el-table-column prop="userNo" label="工号" width="110" />
          <el-table-column prop="name" label="姓名" width="90" />
          <el-table-column label="性别" width="55">
            <template #default="{ row }">{{ row.genderLabel ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="角色" width="110">
            <template #default="{ row }">{{ row.roleNames?.join('、') ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="所属学院" min-width="140" show-overflow-tooltip>
            <template #default="{ row }">{{ row.departmentPath ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="状态" width="70">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
                {{ row.statusLabel }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="300" align="center">
            <template #default="{ row }">
              <el-button text type="primary" size="small" @click="openDetail(row as UserListItem)">
                详情
              </el-button>
              <el-button text type="primary" size="small" @click="openEdit(row as UserListItem)">
                编辑
              </el-button>
              <el-button
                text
                type="primary"
                size="small"
                @click="openPasswordDialog(row as UserListItem)"
              >
                重置密码
              </el-button>
              <el-button
                text
                :type="row.status === 1 ? 'danger' : 'success'"
                size="small"
                @click="handleToggleStatus(row as UserListItem)"
              >
                {{ row.status === 1 ? '禁用' : '启用' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="teacher-account__pagination">
          <el-pagination
            :current-page="page"
            :page-size="perPage"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </div>
      </div>
    </div>

    <el-dialog
      v-model="passwordDialogVisible"
      title="重置密码"
      width="420px"
      @close="currentUser = null"
    >
      <el-form label-width="80px">
        <el-form-item label="账号">
          <span>{{ currentUser?.name }}（{{ currentUser?.userNo }}）</span>
        </el-form-item>
        <el-form-item label="新密码" required>
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            show-password
            placeholder="输入新密码（至少 6 位）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleResetPassword">确认重置</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="账号详情" width="560px" @close="detail = null">
      <el-descriptions v-if="detail" :column="2" border>
        <el-descriptions-item label="工号">{{ detail.userNo }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ detail.name }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ detail.genderLabel ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="detail.status === 1 ? 'success' : 'danger'" size="small">
            {{ detail.statusLabel }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ detail.email ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机">{{ detail.phone ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="学校">{{ detail.schoolName ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="角色">
          {{ detail.roles?.map((r) => r.roleName).join('、') || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="数据范围" :span="2">
          {{
            detail.scopes
              ?.map((s) => s.scopeName)
              .filter(Boolean)
              .join('、') || '-'
          }}
        </el-descriptions-item>
        <el-descriptions-item label="最后登录" :span="2">
          {{ detail.lastLoginAt ?? '-' }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editDialogVisible" title="编辑账号" width="440px" @close="editUser = null">
      <el-form label-width="80px">
        <el-form-item label="工号">
          <span>{{ editUser?.userNo }}</span>
        </el-form-item>
        <el-form-item label="姓名" required>
          <el-input v-model="editForm.name" placeholder="姓名" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" placeholder="邮箱" />
        </el-form-item>
        <el-form-item label="手机">
          <el-input v-model="editForm.phone" placeholder="手机" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.teacher-account {
  &__total {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  &__pagination {
    margin-top: $spacing-lg;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
