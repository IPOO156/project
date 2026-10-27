<script setup lang="ts">
import { Lock, Moon, Shield, Sun, User } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { useThemeRipple } from '@/app/composables/useThemeRipple'
import { useThemeStore } from '@/app/stores/stores'
import { isRoleMatchedLoginTab } from '@/shared/config/teacherModuleRegistry'
import ChangePasswordDialog from './components/ChangePasswordDialog.vue'
import LoginBackground from './components/LoginBackground.vue'
import LoginHero from './components/LoginHero.vue'
import LoginParticles from './components/LoginParticles.vue'
import { useLoginFlow } from './composables/useLoginFlow'

const themeStore = useThemeStore()
const { toggleThemeWithRipple } = useThemeRipple()

// 角色页签判定保留在调用侧：登录流程在写 token 之前回调它，不把判定逻辑迁进 composable
const {
  loginForm,
  loading,
  loginSuccess,
  loginType,
  capsLockOn,
  backendCaptcha,
  captchaFailed,
  captchaRefreshKey,
  usernameInputRef,
  passwordInputRef,
  captchaInputRef,
  refreshCaptcha,
  switchLoginType,
  checkCapsLock,
  handleLogin,
} = useLoginFlow({ isRoleMatched: isRoleMatchedLoginTab })

/* ===================== 交互（视图态） ===================== */
const mouseX = ref(0)
const mouseY = ref(0)
const focusUsername = ref(false)
const focusPassword = ref(false)
const focusCaptcha = ref(false)
const isEntered = ref(false)
const showCard = ref(false)
const forgotDialogVisible = ref(false)

function onParticleMouseMove(pos: { x: number; y: number }) {
  mouseX.value = pos.x
  mouseY.value = pos.y
}

function handleThemeToggle(e: MouseEvent) {
  toggleThemeWithRipple(e, () => refreshCaptcha())
}

function openForgotDialog() {
  forgotDialogVisible.value = true
}

onMounted(() => {
  setTimeout(() => {
    isEntered.value = true
    showCard.value = true
  }, 50)
})
</script>

<template>
  <div
    class="login"
    :class="[
      `login--${loginType}`,
      {
        'login--light': !themeStore.isDark,
        'login--dark': themeStore.isDark,
        'login--success': loginSuccess,
        'is-entered': isEntered,
      },
    ]"
  >
    <LoginParticles @mousemove="onParticleMouseMove" />
    <LoginBackground />
    <button
      class="login__theme-toggle"
      type="button"
      :aria-label="themeStore.isDark ? '切换至日间模式' : '切换至夜间模式'"
      @click="handleThemeToggle"
    >
      <Sun v-if="themeStore.isDark" :size="18" class="login__theme-icon" />
      <Moon v-else :size="18" class="login__theme-icon" />
    </button>
    <LoginHero :login-type="loginType" :mouse-x="mouseX" :mouse-y="mouseY" />
    <section class="login__panel">
      <Transition name="login-card-enter">
        <div v-if="showCard" class="login__card">
          <div class="login__card-glow"></div>
          <div class="login__card-inner">
            <div class="login__header">
              <p class="login__eyebrow">Digital Access</p>
              <h2 class="login__title">欢迎回来</h2>
              <p class="login__subtitle">
                <span :key="`cs-${loginType}`">{{
                  loginType === 'student'
                    ? '开始你的个人成长档案旅程'
                    : '进入校园档案管理与审核工作台'
                }}</span>
              </p>
            </div>
            <div class="login__tabs" role="tablist" aria-label="登录角色切换">
              <button
                class="login__tab"
                :class="{ 'is-active': loginType === 'student' }"
                type="button"
                @click="switchLoginType('student')"
              >
                学生登录
              </button>
              <button
                class="login__tab"
                :class="{ 'is-active': loginType === 'admin' }"
                type="button"
                @click="switchLoginType('admin')"
              >
                管理员登录
              </button>
              <span
                class="login__tab-indicator"
                :class="{ 'is-admin': loginType === 'admin' }"
              ></span>
            </div>
            <el-form class="login__form" :model="loginForm" @submit.prevent="handleLogin">
              <el-form-item>
                <div
                  class="login__input-group"
                  :class="{ 'has-value': loginForm.username, 'is-focus': focusUsername }"
                >
                  <label class="login__floating-label">{{
                    loginType === 'student' ? '学号 / 用户名' : '管理员账号'
                  }}</label>
                  <el-input
                    ref="usernameInputRef"
                    v-model="loginForm.username"
                    placeholder=" "
                    :prefix-icon="User"
                    size="large"
                    @focus="focusUsername = true"
                    @blur="focusUsername = false"
                  />
                </div>
                <p class="login__hint">统一身份识别入口，请使用有效账号登录</p>
              </el-form-item>
              <el-form-item>
                <div
                  class="login__input-group"
                  :class="{ 'has-value': loginForm.password, 'is-focus': focusPassword }"
                >
                  <label class="login__floating-label">密码</label>
                  <el-input
                    ref="passwordInputRef"
                    v-model="loginForm.password"
                    type="password"
                    placeholder=" "
                    :prefix-icon="Lock"
                    size="large"
                    show-password
                    @focus="focusPassword = true"
                    @blur="focusPassword = false"
                    @keyup="checkCapsLock"
                  />
                </div>
                <p class="login__hint">建议确认输入法与大小写状态后再提交</p>
                <p v-if="capsLockOn" class="login__caps-warning">
                  大写锁定已开启，可能输入错误密码
                </p>
              </el-form-item>
              <el-form-item>
                <div class="login__captcha-row">
                  <div
                    class="login__input-group login__input-group--captcha"
                    :class="{ 'has-value': loginForm.captcha, 'is-focus': focusCaptcha }"
                  >
                    <label class="login__floating-label">验证码</label>
                    <el-input
                      ref="captchaInputRef"
                      v-model="loginForm.captcha"
                      placeholder=" "
                      :prefix-icon="Shield"
                      size="large"
                      maxlength="4"
                      @focus="focusCaptcha = true"
                      @blur="focusCaptcha = false"
                    />
                  </div>
                  <button
                    :key="captchaRefreshKey"
                    type="button"
                    class="login__captcha-box login__captcha-box--img"
                    title="点击刷新验证码"
                    @click="refreshCaptcha"
                  >
                    <img
                      v-if="backendCaptcha"
                      :src="backendCaptcha.image"
                      alt="验证码"
                      class="login__captcha-img"
                    />
                    <span v-else-if="captchaFailed" class="login__captcha-loading"
                      >加载失败，点击重试</span
                    >
                    <span v-else class="login__captcha-loading">加载中…</span>
                  </button>
                </div>
                <p class="login__hint">看不清？点击右侧验证码图片刷新</p>
              </el-form-item>
              <div class="login__options">
                <el-checkbox v-model="loginForm.remember">记住密码</el-checkbox>
                <button type="button" class="login__link" @click="openForgotDialog">
                  忘记密码？
                </button>
              </div>
              <!-- native-type="submit"：使按钮成为表单默认提交按钮，Enter 键隐式提交与点击共用 @submit.prevent 一条链路 -->
              <el-button
                type="primary"
                size="large"
                native-type="submit"
                :loading="loading"
                class="login__btn"
                :class="{ 'login__btn--success': loginSuccess }"
              >
                <span class="login__btn-text">
                  <template v-if="loginSuccess">登录成功，正在进入</template>
                  <template v-else-if="loading">正在验证身份</template>
                  <template v-else>立即进入系统</template>
                </span>
              </el-button>
            </el-form>
            <div class="login__security">
              <Shield :size="13" /><span>全程加密传输 · 数据安全有保障</span>
            </div>
          </div>
        </div>
      </Transition>
    </section>

    <!-- 忘记密码 / 改密弹窗 -->
    <ChangePasswordDialog v-model="forgotDialogVisible" />
  </div>
</template>

<style scoped lang="scss" src="./styles/login.scss"></style>

<style scoped lang="scss">
/* ============================================================
   响应式
   ============================================================ */
@media (max-width: 1200px) {
  .login {
    grid-template-columns: 1fr;
    &__panel {
      padding: 12px 24px 40px;
    }
  }
}
@media (max-width: 768px) {
  .login {
    &__panel {
      order: -1;
      padding: 72px 16px 12px;
    }
    &__card-inner {
      padding: 30px 22px 24px;
    }
    &__theme-toggle {
      top: 16px;
      right: 16px;
    }
    &__captcha-box {
      width: 100px;
    }
  }
}
</style>

<style lang="scss" src="./styles/login-global.scss"></style>
