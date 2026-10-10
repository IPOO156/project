<script setup lang="ts">
/**
 * RoleAdd - 管理权限 · 新增账号
 *
 * 对接后端 POST /admin/users 创建管理员 / 审核员（辅导员）/ 课任教师 / 学生账号。
 * schoolId 取登录者 /auth/me 的 schoolId；学院下拉来自登录者授权范围（scopeType=2）；
 * 学生需指定班级（后端 UserManageService.createUser：roleCodes 含 student 时
 * classId 必填，缺则报「学生角色必须指定班级ID」）。
 *
 * ⚠️ roleIds 按**角色编码**解析（GET /admin/roles），不再只依赖硬编码数字 id：
 *   后端判定学生/教师看的是 roles.code（isStudent = roleCodes.contains("student")），
 *   按码取 id 才能与库内实际角色一一对应；解析失败时退回历史硬编码口径（不含学生）。
 * 审核员 = 教师 + 辅导员双角色（辅导员也是教师，与 RoleAdjust 口径一致）。
 */
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'

import { createUser, listClasses, listRoles } from '@/shared/api/teacher'
import { useTeacherMe } from '@/shared/composables/useTeacherMe'

const { me } = useTeacherMe()

/** 账号类型 → 后端角色编码（后端按编码判定身份，teacher/counselor/student/admin） */
const ROLE_CODES: Record<string, string[]> = {
  admin: ['admin'],
  reviewer: ['teacher', 'counselor'], // 审核员 = 教师 + 辅导员
  teacher: ['teacher'],
  student: ['student'],
}

/**
 * 兜底 roleIds（历史硬编码口径，仅在 /admin/roles 拉取失败时用于非学生类型）。
 * 学生类型**无兜底**：宁可提示失败，也不猜一个 id 建出身份错误的账号。
 */
const ROLE_ID_FALLBACK: Record<string, number[]> = {
  admin: [2],
  reviewer: [3, 4],
  teacher: [3],
}

const ROLE_LABELS: Record<string, string> = {
  admin: '管理员',
  reviewer: '审核员',
  teacher: '课任教师',
  student: '学生',
}

/** 角色编码 → roleId（来自 GET /admin/roles） */
const roleIdByCode = ref<Record<string, number>>({})

/** 班级列表（学生账号必选；classId 写入 student_profiles.class_id） */
const classes = ref<{ classId: number; className: string; grade: string }[]>([])

const form = reactive({
  userNo: '',
  name: '',
  password: '',
  confirmPassword: '',
  role: 'admin' as string,
  collegeId: undefined as number | undefined,
  classId: undefined as number | undefined,
  email: '',
  phone: '',
})

// 学院来自登录者授权范围（/auth/me scopes 中 scopeType=2 的学院）
const colleges = computed(() =>
  (me.value?.scopes ?? [])
    .filter((s) => s.scopeType === 2 && s.scopeId != null)
    .map((s) => ({ id: s.scopeId, name: s.scopeName ?? `学院 ${s.scopeId}` })),
)

const submitting = ref(false)

/** 班级下拉展示：带年级便于同名班级区分（如「2024级 · 计科2401班」） */
function classLabel(row: { className: string; grade: string }): string {
  return row.grade ? `${row.grade}级 · ${row.className}` : row.className
}

/** 按角色编码解析 roleIds；任一编码在 /admin/roles 里找不到即视为解析失败 */
function resolveRoleIds(role: string): number[] | null {
  const codes = ROLE_CODES[role] ?? []
  const ids = codes.map((code) => roleIdByCode.value[code]).filter((id) => id != null)
  if (ids.length === codes.length) {
    return ids
  }
  return ROLE_ID_FALLBACK[role] ?? null
}

onMounted(async () => {
  try {
    const res = await listRoles({ page: 1, per_page: 200 })
    roleIdByCode.value = Object.fromEntries((res.list ?? []).map((r) => [r.roleCode, r.roleId]))
  } catch {
    roleIdByCode.value = {}
  }
  try {
    const res = await listClasses({ page: 1, per_page: 200 })
    classes.value = (res.list ?? []).map((c) => ({
      classId: c.classId,
      className: c.className,
      grade: c.grade ?? '',
    }))
  } catch {
    classes.value = []
  }
})

async function handleAdd() {
  if (!form.userNo.trim() || !form.name.trim()) {
    ElMessage.warning('请填写用户名和真实姓名')
    return
  }
  if (!form.password) {
    ElMessage.warning('请填写密码')
    return
  }
  if (form.password.length < 6) {
    ElMessage.warning('密码长度至少 6 位')
    return
  }
  if (form.password !== form.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }
  if (form.role === 'teacher' && !form.collegeId) {
    ElMessage.warning('课任教师账号需选择所属学院')
    return
  }
  // 后端对含 student 编码的角色强制要求 classId（写入 student_profiles.class_id）
  if (form.role === 'student' && !form.classId) {
    ElMessage.warning('学生账号需选择所属班级')
    return
  }
  const roleIds = resolveRoleIds(form.role)
  if (!roleIds) {
    ElMessage.error('未获取到角色信息，请刷新后重试')
    return
  }
  const schoolId = me.value?.schoolId
  if (!schoolId) {
    ElMessage.warning('未获取到学校信息，请重新登录')
    return
  }

  submitting.value = true
  try {
    await createUser({
      userNo: form.userNo.trim(),
      name: form.name.trim(),
      password: form.password,
      email: form.email || undefined,
      phone: form.phone || undefined,
      schoolId,
      roleIds,
      collegeId: form.collegeId,
      classId: form.role === 'student' ? form.classId : undefined,
    })
    ElMessage.success(`已创建${ROLE_LABELS[form.role]}账号「${form.name.trim()}」`)
    form.userNo = ''
    form.name = ''
    form.password = ''
    form.confirmPassword = ''
    form.collegeId = undefined
    form.classId = undefined
    form.email = ''
    form.phone = ''
  } catch {
    /* 拦截器已提示 */
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mc-page">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <p class="mc-page-head__eyebrow">管理权限 · Accounts</p>
        <h2 class="mc-page-head__title">新增账号</h2>
        <p class="mc-page-head__desc">
          添加管理员、审核员（辅导员）、课任教师、学生账号，数据写入后端 /admin/users。
          学生账号需选择所属班级；目前仅支持逐个创建，批量导入学生尚未提供（后端无导入接口），
          已有的学生账号请在「学生账号」页查看与维护。
        </p>
      </div>
    </div>

    <div class="mc-card">
      <div class="mc-card__head">
        <span class="mc-card__title">账号创建</span>
      </div>
      <div class="mc-card__body">
        <el-form :model="form" label-width="100px" class="role-add__form">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="用户名" required>
                <el-input v-model="form.userNo" placeholder="登录用户名（学号/工号）" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="真实姓名" required>
                <el-input v-model="form.name" placeholder="真实姓名" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="密码" required>
                <el-input
                  v-model="form.password"
                  type="password"
                  show-password
                  placeholder="至少 6 位"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="确认密码" required>
                <el-input v-model="form.confirmPassword" type="password" show-password />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="账号类型" required>
            <el-radio-group v-model="form.role">
              <el-radio value="admin">管理员</el-radio>
              <el-radio value="reviewer">审核员</el-radio>
              <el-radio value="teacher">课任教师</el-radio>
              <el-radio value="student">学生</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="form.role === 'teacher'" label="所属学院" required>
            <el-select
              v-model="form.collegeId"
              placeholder="选择学院"
              clearable
              style="width: 100%"
            >
              <el-option v-for="c in colleges" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="form.role === 'student'" label="所属班级" required>
            <el-select
              v-model="form.classId"
              placeholder="选择班级"
              filterable
              clearable
              style="width: 100%"
            >
              <el-option
                v-for="c in classes"
                :key="c.classId"
                :label="classLabel(c)"
                :value="c.classId"
              />
            </el-select>
            <span class="role-add__hint">
              学生账号必须指定班级：后端会把该班级写入学生档案归属，未选班级无法创建。
            </span>
          </el-form-item>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="邮箱">
                <el-input v-model="form.email" placeholder="邮箱地址" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="手机">
                <el-input v-model="form.phone" placeholder="手机号码" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <div class="role-add__foot">
          <el-button type="primary" :loading="submitting" @click="handleAdd">提交创建</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.role-add {
  &__form {
    max-width: 720px;
  }
  &__foot {
    margin-top: $spacing-lg;
  }

  &__hint {
    margin-left: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>
