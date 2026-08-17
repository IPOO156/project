<script setup lang="ts">
/**
 * RoleAdjust - 管理权限 · 职位调整
 *
 * 对接后端：
 *  - GET /admin/users（roleId=3 教师）拉取教师账号列表
 *  - PUT /admin/users/{id}/roles 覆盖式调整职位（管理员/审核员/课任教师）
 *
 * 角色编码 → roleIds：admin=[2]；审核员(辅导员)=[3,4]；课任教师=[3]。
 */
import type { ScopeConfigItem, UserListItem } from '@/shared/types/teacher'
import { ElMessage } from 'element-plus'
import { RefreshCw, Search } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref } from 'vue'

import { getUserDetail, listUsers, updateUserRoles, updateUserScopes } from '@/shared/api/teacher'
import { useTeacherMe } from '@/shared/composables/useTeacherMe'

const ROLE_IDS: Record<string, number[]> = {
  admin: [2],
  reviewer: [3, 4], // 辅导员 = 教师 + 辅导员双角色
  teacher: [3],
}

const ROLE_LABELS: Record<string, string> = {
  admin: '管理员',
  reviewer: '审核员',
  teacher: '课任教师',
}

const loading = ref(false)
const users = ref<UserListItem[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(10)
const search = reactive({ keyword: '' })

async function load() {
  loading.value = true
  try {
    const res = await listUsers({
      roleId: 3,
      keyword: search.keyword || undefined,
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

/** 从后端 roles 编码推断当前职位，用于弹窗默认选中 */
function currentRoleOf(row: UserListItem): string {
  if (row.roles?.includes('admin')) return 'admin'
  if (row.roles?.includes('counselor')) return 'reviewer'
  return 'teacher'
}

// ── 调整职位弹窗 ──
const roleDialogVisible = ref(false)
const targetRole = ref('teacher')
const currentUser = ref<UserListItem | null>(null)

function openRoleDialog(row: UserListItem) {
  currentUser.value = row
  targetRole.value = currentRoleOf(row)
  roleDialogVisible.value = true
}

async function handleSaveRole() {
  if (!currentUser.value) return
  try {
    await updateUserRoles(currentUser.value.userId, ROLE_IDS[targetRole.value])
    ElMessage.success(`已将「${currentUser.value.name}」调整为${ROLE_LABELS[targetRole.value]}`)
    roleDialogVisible.value = false
    void load()
  } catch {
    /* 拦截器已提示 */
  }
}

// ── 数据范围配置 ──
const { me } = useTeacherMe()
const scopeDialogVisible = ref(false)
const scopeLoading = ref(false)
const scopeUser = ref<UserListItem | null>(null)
const scopeForm = reactive({
  collegeIds: [] as number[],
  majorIds: [] as number[],
  classIds: [] as number[],
})

// 可配置范围来自登录者授权范围（/auth/me scopes）
const collegeOptions = computed(() => (me.value?.scopes ?? []).filter((s) => s.scopeType === 2))
const majorOptions = computed(() => (me.value?.scopes ?? []).filter((s) => s.scopeType === 3))
const classOptions = computed(() => (me.value?.scopes ?? []).filter((s) => s.scopeType === 4))

async function openScopeDialog(row: UserListItem) {
  scopeUser.value = row
  scopeForm.collegeIds = []
  scopeForm.majorIds = []
  scopeForm.classIds = []
  scopeDialogVisible.value = true
  scopeLoading.value = true
  try {
    const detail = await getUserDetail(row.userId)
    scopeForm.collegeIds = (detail.scopes ?? [])
      .filter((s) => s.scopeType === 2)
      .map((s) => s.scopeId)
    scopeForm.majorIds = (detail.scopes ?? [])
      .filter((s) => s.scopeType === 3)
      .map((s) => s.scopeId)
    scopeForm.classIds = (detail.scopes ?? [])
      .filter((s) => s.scopeType === 4)
      .map((s) => s.scopeId)
  } catch {
    /* 拦截器已提示 */
  } finally {
    scopeLoading.value = false
  }
}

async function handleSaveScope() {
  if (!scopeUser.value) return
  const scopes: ScopeConfigItem[] = [
    ...scopeForm.collegeIds.map((id) => ({ scopeType: 2, scopeId: id })),
    ...scopeForm.majorIds.map((id) => ({ scopeType: 3, scopeId: id })),
    ...scopeForm.classIds.map((id) => ({ scopeType: 4, scopeId: id })),
  ]
  try {
    await updateUserScopes(scopeUser.value.userId, scopes)
    ElMessage.success('数据范围已更新')
    scopeDialogVisible.value = false
  } catch {
    /* 拦截器已提示 */
  }
}

onMounted(() => void load())
</script>

<template>
  <div class="mc-page">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <p class="mc-page-head__eyebrow">管理权限 · Roles</p>
        <h2 class="mc-page-head__title">教师职位调整</h2>
        <p class="mc-page-head__desc">
          将教师职位调整为管理员、审核员（辅导员）或课任教师。数据来自后端 /admin/users。
        </p>
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
            placeholder="教师姓名 / 工号"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
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
        <span class="mc-card__title">教师列表</span>
        <span class="role-adjust__total">共 {{ total }} 条</span>
      </div>
      <div class="mc-card__body">
        <el-table v-loading="loading" :data="users" stripe max-height="600" style="width: 100%">
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="userNo" label="工号" width="140" />
          <el-table-column prop="name" label="姓名" width="120" />
          <el-table-column label="当前职位" width="140">
            <template #default="{ row }">{{ row.roleNames?.join('、') ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="所属学院" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">{{ row.departmentPath ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
                {{ row.statusLabel }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" align="center">
            <template #default="{ row }">
              <el-button
                text
                type="primary"
                size="small"
                @click="openRoleDialog(row as UserListItem)"
              >
                调整职位
              </el-button>
              <el-button
                text
                type="primary"
                size="small"
                @click="openScopeDialog(row as UserListItem)"
              >
                配置范围
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="role-adjust__pagination">
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
      v-model="roleDialogVisible"
      title="调整职位"
      width="420px"
      @close="currentUser = null"
    >
      <el-form label-width="80px">
        <el-form-item label="教师">
          <span>{{ currentUser?.name }}（{{ currentUser?.userNo }}）</span>
        </el-form-item>
        <el-form-item label="新职位" required>
          <el-radio-group v-model="targetRole">
            <el-radio value="admin">管理员</el-radio>
            <el-radio value="reviewer">审核员</el-radio>
            <el-radio value="teacher">课任教师</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveRole">确认调整</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="scopeDialogVisible"
      title="配置数据范围"
      width="520px"
      @close="scopeUser = null"
    >
      <el-form v-loading="scopeLoading" label-width="80px">
        <el-form-item label="教师">
          <span>{{ scopeUser?.name }}（{{ scopeUser?.userNo }}）</span>
        </el-form-item>
        <el-form-item label="学院">
          <el-select
            v-model="scopeForm.collegeIds"
            multiple
            collapse-tags
            placeholder="选择学院"
            style="width: 100%"
          >
            <el-option
              v-for="c in collegeOptions"
              :key="c.scopeId"
              :label="c.scopeName ?? `学院 ${c.scopeId}`"
              :value="c.scopeId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="专业">
          <el-select
            v-model="scopeForm.majorIds"
            multiple
            collapse-tags
            placeholder="选择专业"
            style="width: 100%"
          >
            <el-option
              v-for="m in majorOptions"
              :key="m.scopeId"
              :label="m.scopeName ?? `专业 ${m.scopeId}`"
              :value="m.scopeId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="班级">
          <el-select
            v-model="scopeForm.classIds"
            multiple
            collapse-tags
            placeholder="选择班级"
            style="width: 100%"
          >
            <el-option
              v-for="cl in classOptions"
              :key="cl.scopeId"
              :label="cl.scopeName ?? `班级 ${cl.scopeId}`"
              :value="cl.scopeId"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="scopeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveScope">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.role-adjust {
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
