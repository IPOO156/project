<script setup lang="ts">
/**
 * RoleAdd - 管理权限 · 新增账号
 *
 * 对接后端 POST /admin/users 创建管理员 / 审核员（辅导员）/ 课任教师账号。
 * schoolId 取登录者 /auth/me 的 schoolId；学院下拉来自登录者授权范围（scopeType=2）。
 * 角色编码 → roleId：admin=2 / reviewer(辅导员)=4 / teacher=3。
 */
import { ElMessage } from 'element-plus'
import { computed, reactive, ref } from 'vue'

import { createUser } from '@/shared/api/teacher'
import { useTeacherMe } from '@/shared/composables/useTeacherMe'

const { me } = useTeacherMe()

const ROLE_ID_MAP: Record<string, number> = {
  admin: 2,
  reviewer: 4, // 审核员 = 辅导员 counselor
  teacher: 3,
}

const ROLE_LABELS: Record<string, string> = {
  admin: '管理员',
  reviewer: '审核员',
  teacher: '课任教师',
}

const form = reactive({
  userNo: '',
  name: '',
  password: '',
  confirmPassword: '',
  role: 'admin' as string,
  collegeId: undefined as number | undefined,
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
    ElMessage.error('两次输入的密码不一致')
    return
  }
  if (form.role === 'teacher' && !form.collegeId) {
    ElMessage.warning('课任教师账号需选择所属学院')
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
      roleIds: [ROLE_ID_MAP[form.role]],
      collegeId: form.collegeId,
    })
    ElMessage.success(`已创建${ROLE_LABELS[form.role]}账号「${form.name.trim()}」`)
    form.userNo = ''
    form.name = ''
    form.password = ''
    form.confirmPassword = ''
    form.collegeId = undefined
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
          添加管理员、审核员（辅导员）、课任教师账号。数据写入后端 /admin/users。
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
}
</style>
