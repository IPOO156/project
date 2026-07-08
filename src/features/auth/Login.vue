<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { Moon, Sun } from 'lucide-vue-next'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeStore, useUserStore } from '@/app/stores/stores'
import logoIcon from '@/assets/logo/logo-icon.jpg'

const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()

const loginForm = reactive({
  username: '',
  password: '',
  remember: false,
})

const loading = ref(false)
const loginSuccess = ref(false)
const loginType = ref<'student' | 'admin'>('student')
const capsLockOn = ref(false)

function checkCapsLock(event: KeyboardEvent) {
  capsLockOn.value = event.getModifierState?.('CapsLock') ?? false
}

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
    loginSuccess.value = true
    themeStore.applyTimeBasedTheme()
    setTimeout(() => {
      router.push('/dashboard')
    }, 300)
  }, 800)
}
</script>

<template>
  <div class="login">
    <div class="login__bg"></div>

    <button
      class="login__theme-toggle"
      type="button"
      :aria-label="themeStore.isDark ? '切换至日间模式' : '切换至夜间模式'"
      @click="themeStore.toggleTheme"
    >
      <component :is="themeStore.isDark ? Sun : Moon" :size="18" />
    </button>

    <div class="login__card">
      <div class="login__header">
        <div class="login__logo">
          <img :src="logoIcon" alt="档案管理系统" class="login__logo-img" />
        </div>
        <h1 class="login__title">档案管理系统</h1>
        <p class="login__subtitle">学生端 · 综合档案管理平台</p>
      </div>

      <el-tabs v-model="loginType" class="login__tabs" stretch>
        <el-tab-pane label="学生登录" name="student" />
        <el-tab-pane label="管理员登录" name="admin" />
      </el-tabs>

      <Transition name="login-form-fade" mode="out-in">
        <el-form :key="loginType" :model="loginForm" class="login__form" @keyup.enter="handleLogin">
          <el-form-item>
            <el-input
              v-model="loginForm.username"
              placeholder="请输入学号/用户名"
              prefix-icon="User"
              size="large"
            />
            <p class="login__hint">请输入学号或用户名</p>
          </el-form-item>
          <el-form-item>
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              prefix-icon="Lock"
              size="large"
              show-password
              @keyup="checkCapsLock"
            />
            <p class="login__hint">密码区分大小写，请确认输入法状态</p>
            <p v-if="capsLockOn" class="login__caps-warning">大写锁定已开启，可能输入错误密码</p>
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
              :class="{ 'login__btn--success': loginSuccess }"
              @click="handleLogin"
            >
              <template v-if="loginSuccess">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  style="margin-right: 6px"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                登录成功
              </template>
              <template v-else>登 录</template>
            </el-button>
          </el-form-item>
        </el-form>
      </Transition>
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
  transition: background 0.3s ease;
  user-select: none;

  &__bg {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at 20% 50%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 20%, rgba(255, 255, 255, 0.06) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 80%, rgba(255, 255, 255, 0.04) 0%, transparent 50%);
  }

  &__theme-toggle {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
    cursor: pointer;
    backdrop-filter: blur(6px);
    transition:
      background-color 0.2s,
      border-color 0.2s,
      color 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.25);
    }
  }

  &__card {
    position: relative;
    width: 420px;
    padding: 40px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: $radius-2xl;
    border: 1px solid rgba(255, 255, 255, 0.6);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    transition:
      background-color 0.3s,
      box-shadow 0.3s;
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
    background: #fff;
    border-radius: 18px;
    margin-bottom: 16px;
    overflow: hidden;
  }

  &__logo-img {
    width: 56px;
    height: 56px;
    object-fit: contain;
  }

  &__title {
    font-size: 24px;
    font-weight: 700;
    color: #1e3a5f;
    margin-bottom: 6px;
    transition: color 0.3s;
  }

  &__subtitle {
    font-size: 14px;
    color: #64748b;
    transition: color 0.3s;
  }

  &__tabs {
    margin-bottom: 24px;
  }

  &__form {
    .el-form-item {
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .el-form-item__content {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }
  }

  &__hint {
    margin: 4px 0 0;
    font-size: 12px;
    line-height: 1.4;
    color: #94a3b8;
    transition: color 0.3s;
  }

  &__caps-warning {
    margin: 4px 0 0;
    font-size: 12px;
    line-height: 1.4;
    color: #e6a23c;
  }

  &__btn {
    width: 100%;
    height: 44px;
    font-size: 16px;
    border-radius: 8px;
  }

  &__btn--success {
    background-color: var(--el-color-success) !important;
    border-color: var(--el-color-success) !important;
    pointer-events: none;
  }
}

.login-form-fade-enter-active,
.login-form-fade-leave-active {
  transition: all $duration-base $ease-standard;
}

.login-form-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.login-form-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>

<style lang="scss">
/* 夜间模式：使用全局选择器确保覆盖日间样式 */
html.dark .login {
  background: linear-gradient(135deg, #0b1120 0%, #0f172a 50%, #1e293b 100%);

  .login__bg {
    background:
      radial-gradient(ellipse at 20% 50%, rgba(96, 165, 250, 0.08) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 20%, rgba(96, 165, 250, 0.05) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 80%, rgba(96, 165, 250, 0.03) 0%, transparent 50%);
  }

  .login__theme-toggle {
    background: rgba(30, 41, 59, 0.6);
    border-color: rgba(148, 163, 184, 0.3);
    color: #f1f5f9;

    &:hover {
      background: rgba(51, 65, 85, 0.8);
    }
  }

  .login__card {
    background: rgba(30, 41, 59, 0.96);
    border: 1px solid rgba(148, 163, 184, 0.18);
    box-shadow:
      0 20px 60px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }

  .login__logo {
    background: rgba(30, 41, 59, 0.8);
    box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.2);
  }

  .login__title {
    color: #f1f5f9;
  }

  .login__subtitle,
  .login__hint {
    color: #94a3b8;
  }

  .login__tabs {
    .el-tabs__item {
      color: var(--el-text-color-secondary);
    }

    .el-tabs__item.is-active {
      color: var(--el-color-primary);
    }

    .el-tabs__active-bar {
      background-color: var(--el-color-primary);
    }

    .el-tabs__nav-wrap::after {
      background-color: var(--el-border-color);
    }
  }

  .login__form {
    .el-input__wrapper {
      background-color: var(--el-fill-color-blank);
      box-shadow: 0 0 0 1px var(--el-border-color) inset;
    }

    .el-input__inner {
      color: var(--el-text-color-primary);

      &::placeholder {
        color: var(--el-text-color-placeholder);
      }
    }

    .el-input__icon {
      color: var(--el-text-color-secondary);
    }

    .el-checkbox__label {
      color: var(--el-text-color-primary);
    }

    .el-checkbox__input.is-checked + .el-checkbox__label {
      color: var(--el-color-primary);
    }
  }
}
</style>
