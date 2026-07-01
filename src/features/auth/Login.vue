<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { GraduationCap } from 'lucide-vue-next'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/app/stores/stores'

const router = useRouter()
const userStore = useUserStore()

const loginForm = reactive({
  username: '',
  password: '',
  remember: false,
})

const loading = ref(false)
const loginType = ref<'student' | 'admin'>('student')

function handleLogin() {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  loading.value = true
  // 模拟登录 - 实际项目中替换为真实 API
  setTimeout(() => {
    userStore.setToken(`mock-token-${Date.now()}`)
    userStore.setUserInfo({
      id: '1',
      username: loginForm.username,
      realName: '张三',
      studentId: '2024060001',
      grade: '2024级',
      major: '计算机科学与技术',
      className: '计科2401班',
      email: 'zhangsan@edu.cn',
      phone: '138****0000',
    })
    loading.value = false
    router.push('/dashboard')
  }, 800)
}
</script>

<template>
  <div class="login">
    <div class="login__bg"></div>
    <div class="login__card">
      <div class="login__header">
        <div class="login__logo">
          <GraduationCap :size="40" />
        </div>
        <h1 class="login__title">档案管理系统</h1>
        <p class="login__subtitle">学生端 · 综合档案管理平台</p>
      </div>

      <el-tabs v-model="loginType" class="login__tabs" stretch>
        <el-tab-pane label="学生登录" name="student" />
        <el-tab-pane label="管理员登录" name="admin" />
      </el-tabs>

      <el-form
        :model="loginForm"
        class="login__form"
        @keyup.enter="handleLogin"
      >
        <el-form-item>
          <el-input
            v-model="loginForm.username"
            placeholder="请输入学号/用户名"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="loginForm.remember">记住密码</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login__btn"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #4a7fb5 100%);
  position: relative;
  overflow: hidden;

  &__bg {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at 20% 50%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 20%, rgba(255, 255, 255, 0.06) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 80%, rgba(255, 255, 255, 0.04) 0%, transparent 50%);
  }

  &__card {
    position: relative;
    width: 420px;
    padding: 40px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  &__header {
    text-align: center;
    margin-bottom: 32px;
  }

  &__logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 72px;
    height: 72px;
    background: linear-gradient(135deg, #1e3a5f, #2d5a87);
    border-radius: 18px;
    color: #fff;
    margin-bottom: 16px;
  }

  &__title {
    font-size: 24px;
    font-weight: 700;
    color: #1e3a5f;
    margin-bottom: 6px;
  }

  &__subtitle {
    font-size: 14px;
    color: #64748b;
  }

  &__tabs {
    margin-bottom: 24px;
  }

  &__form {
    .el-form-item {
      margin-bottom: 20px;
    }
  }

  &__btn {
    width: 100%;
    height: 44px;
    font-size: 16px;
    border-radius: 8px;
  }
}
</style>
