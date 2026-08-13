<script setup lang="ts">
/**
 * RoleAdd - 管理权限 · 新增账号
 * 添加管理员、审核员账号。
 * 后端现状：无用户创建接口（POST /admin/users 未实现），
 * 提交时仅做前端校验并提示，接口就绪后接入。
 */
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'

const form = reactive({
  username: '',
  realName: '',
  password: '',
  confirmPassword: '',
  role: 'admin' as string,
  college: '',
  major: '',
  email: '',
  phone: '',
})

const colleges = ['计算机学院', '数学学院', '物理学院', '外语学院']
const majors = ['计算机科学与技术', '软件工程', '数学与应用数学', '英语']

const submitting = ref(false)

function handleAdd() {
  if (!form.username.trim() || !form.realName.trim()) {
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
  submitting.value = true
  // 后端暂无创建账号接口（POST /admin/users），此处仅完成前端校验
  setTimeout(() => {
    submitting.value = false
    ElMessage.warning('账号创建接口待后端就绪（POST /admin/users），暂未写入系统')
  }, 400)
}
</script>

<template>
  <div class="mc-page">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <p class="mc-page-head__eyebrow">管理权限 · Accounts</p>
        <h2 class="mc-page-head__title">新增账号</h2>
        <p class="mc-page-head__desc">
          添加管理员、审核员账号。表单校验已完成，写入接口待后端就绪。
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
                <el-input v-model="form.username" placeholder="登录用户名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="真实姓名" required>
                <el-input v-model="form.realName" placeholder="教师真实姓名" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="密码" required>
                <el-input v-model="form.password" type="password" show-password />
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
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="学院">
                <el-select v-model="form.college" placeholder="选择学院" style="width: 100%">
                  <el-option v-for="c in colleges" :key="c" :label="c" :value="c" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="专业">
                <el-select v-model="form.major" placeholder="选择专业" style="width: 100%">
                  <el-option v-for="m in majors" :key="m" :label="m" :value="m" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
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
