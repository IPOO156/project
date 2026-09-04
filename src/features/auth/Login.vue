<script setup lang="ts">
import type { TeacherRole, UserInfo } from '@/shared/types/types'
import { ElMessage } from 'element-plus'
import { Lock, Moon, Shield, Sun, User } from 'lucide-vue-next'
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeStore, useUserStore } from '@/app/stores/stores'
import {
  confirmPasswordReset,
  getCaptcha,
  requestPasswordReset,
  teacherLogin,
} from '@/shared/api/teacher'
import { useTeacherMe } from '@/shared/composables/useTeacherMe'
import { useThemeRipple } from '@/shared/composables/useThemeRipple'
import { setRefreshToken } from '@/shared/utils/token'
import { validatePasswordStrength } from '@/shared/utils/validatePassword'
import LoginBackground from './components/LoginBackground.vue'
import LoginHero from './components/LoginHero.vue'
import LoginParticles from './components/LoginParticles.vue'

const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()
const { toggleThemeWithRipple } = useThemeRipple()
const { refresh: refreshTeacherMe } = useTeacherMe()

// ── 后端角色 → 前端教师角色映射 ──
// 后端 role code：super_admin=超级管理员 / admin=管理员 / counselor=辅导员≈审核员 / teacher=课任教师
// 超级管理员同时持有 admin + super_admin 双角色，故先判断 super_admin。
function mapBackendRole(roles: string[]): TeacherRole {
  if (roles.includes('super_admin')) return 'super_admin'
  if (roles.includes('admin')) return 'admin'
  if (roles.includes('counselor')) return 'reviewer'
  return 'teacher'
}

function toUserInfo(user: {
  userId: number
  userNo: string
  name: string
  email: string | null
  phone?: string | null
  schoolName: string | null
  roles: string[]
  avatar: string | null
}): UserInfo {
  const role = mapBackendRole(user.roles)
  return {
    id: String(user.userId),
    username: user.userNo,
    realName: user.name,
    avatar: user.avatar ?? undefined,
    studentId: '',
    grade: '',
    major: '',
    className: '',
    email: user.email ?? '',
    phone: user.phone ?? '',
    role,
    college: user.schoolName ?? '',
    department: '',
    loginType: 'teacher',
  }
}

function toStudentUserInfo(user: {
  userId: number
  userNo: string
  name: string
  email: string | null
  phone?: string | null
  schoolName: string | null
  roles: string[]
  avatar: string | null
}): UserInfo {
  return {
    id: String(user.userId),
    username: user.userNo,
    realName: user.name,
    avatar: user.avatar ?? undefined,
    studentId: user.userNo,
    grade: '',
    major: '',
    className: '',
    email: user.email ?? '',
    phone: user.phone ?? '',
    college: user.schoolName ?? '',
    department: '',
    loginType: 'student',
  }
}

// ── 登录：后端验证码（学生端与管理员端共用 /auth/captcha）──
const isAdminLogin = computed(() => loginType.value === 'admin')
const backendCaptcha = ref<{ key: string; image: string } | null>(null)
const captchaFailed = ref(false)
let captchaKey = ''

async function loadBackendCaptcha() {
  captchaFailed.value = false
  try {
    const res = await getCaptcha()
    if (res?.key && res?.image) {
      backendCaptcha.value = res
      captchaKey = res.key
      loginForm.captcha = ''
    } else {
      backendCaptcha.value = null
      captchaFailed.value = true
    }
  } catch {
    backendCaptcha.value = null
    captchaFailed.value = true
  }
}

const loginForm = reactive({ username: '', password: '', captcha: '', remember: false })
const loading = ref(false)
const loginSuccess = ref(false)
const loginType = ref<'student' | 'admin'>('student')
const capsLockOn = ref(false)
const captchaRefreshKey = ref(0)
const mouseX = ref(0)
const mouseY = ref(0)
const focusUsername = ref(false)
const focusPassword = ref(false)
const focusCaptcha = ref(false)
const usernameInputRef = ref<{ input: HTMLInputElement } | null>(null)
const passwordInputRef = ref<{ input: HTMLInputElement } | null>(null)
const isEntered = ref(false)
const showCard = ref(false)

function onParticleMouseMove(pos: { x: number; y: number }) {
  mouseX.value = pos.x
  mouseY.value = pos.y
}

/* ===================== 验证码 ===================== */
function refreshCaptcha() {
  void loadBackendCaptcha()
}
function handleThemeToggle(e: MouseEvent) {
  toggleThemeWithRipple(e, () => refreshCaptcha())
}

/* ===================== 交互 ===================== */
function switchLoginType(type: 'student' | 'admin') {
  if (loginType.value !== type) {
    loginType.value = type
    void loadBackendCaptcha()
  }
}
function checkCapsLock(event: KeyboardEvent) {
  capsLockOn.value = event.getModifierState?.('CapsLock') ?? false
}
async function handleLogin() {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  if (isAdminLogin.value && !backendCaptcha.value) {
    ElMessage.warning('验证码加载中，请稍候再试')
    void loadBackendCaptcha()
    return
  }
  if (!loginForm.captcha) {
    ElMessage.warning('请输入验证码')
    return
  }
  loading.value = true

  // ── 登录：学生端与管理员端统一对接后端 POST /auth/login（含后端验证码）──
  try {
    const res = await teacherLogin({
      userNo: loginForm.username,
      password: loginForm.password,
      // captchaKey：curl 实测后端 POST /auth/login 读取的是 captchaKey（不是 key），
      // captchaKey 的值来自验证码接口返回的 key
      captchaKey,
      captchaCode: loginForm.captcha,
      rememberMe: loginForm.remember,
    })
    // token 存储遵循「记住我」：默认仅当前会话（sessionStorage），勾选记住我才持久化
    userStore.setToken(res.accessToken, loginForm.remember)
    setRefreshToken(res.refreshToken ?? '', loginForm.remember)

    if (loginType.value === 'admin') {
      userStore.setUserInfo(toUserInfo(res.user))
      // 拉取完整身份（roles / permissions / scopes），供教师端授权范围过滤
      refreshTeacherMe()
        .then((me) => {
          if (me) userStore.setUserInfo(toUserInfo(me))
        })
        .catch(() => null)
      themeStore.applyTimeBasedTheme()
      setTimeout(() => router.push('/teacher/dashboard'), 300)
    } else {
      userStore.setUserInfo(toStudentUserInfo(res.user))
      setTimeout(() => router.push('/dashboard'), 600)
    }
    loading.value = false
    loginSuccess.value = true
  } catch {
    loading.value = false
    refreshCaptcha()
  }
}

/* ===================== 忘记密码（POST /auth/password/reset + confirm）===================== */
const forgotDialogVisible = ref(false)
const forgotSending = ref(false)
const forgotSubmitting = ref(false)
const forgotStep = ref<1 | 2>(1)
const forgotForm = reactive({
  email: '',
  verificationCode: '',
  newPassword: '',
  confirmPassword: '',
})

function openForgotDialog() {
  forgotStep.value = 1
  forgotForm.email = ''
  forgotForm.verificationCode = ''
  forgotForm.newPassword = ''
  forgotForm.confirmPassword = ''
  forgotDialogVisible.value = true
}

async function handleSendResetEmail() {
  if (!forgotForm.email.trim()) {
    ElMessage.warning('请输入注册邮箱')
    return
  }
  forgotSending.value = true
  try {
    await requestPasswordReset({ email: forgotForm.email.trim() })
    forgotStep.value = 2
    ElMessage.success('验证码已发送至邮箱，请查收')
  } catch {
    /* 拦截器已提示 */
  } finally {
    forgotSending.value = false
  }
}

async function handleConfirmReset() {
  const { email, verificationCode, newPassword, confirmPassword } = forgotForm
  if (!verificationCode.trim()) {
    ElMessage.warning('请输入邮箱收到的验证码')
    return
  }
  const strength = validatePasswordStrength(newPassword)
  if (!strength.valid) {
    ElMessage.warning(strength.message)
    return
  }
  if (newPassword !== confirmPassword) {
    ElMessage.warning('两次输入的新密码不一致')
    return
  }
  forgotSubmitting.value = true
  try {
    await confirmPasswordReset({
      verificationCode: verificationCode.trim(),
      email: email.trim(),
      newPassword,
      confirmPassword,
    })
    ElMessage.success('密码已重置，请使用新密码登录')
    forgotDialogVisible.value = false
  } catch {
    /* 拦截器已提示 */
  } finally {
    forgotSubmitting.value = false
  }
}

onMounted(() => {
  nextTick(() => void loadBackendCaptcha())
  // 浏览器自动填充（记住密码）会在 mounted 之后异步写入原生 input 的 value，
  // 此时 Vue 的 v-model 未同步，导致 loginForm 为空但 DOM 已显示文字，
  // 浮动标签 .has-value 判断失真，与实际填入内容重叠。
  // 延迟读取原生 input DOM 值并回写 loginForm，保证状态一致。
  setTimeout(() => {
    const u = usernameInputRef.value?.input?.value
    const p = passwordInputRef.value?.input?.value
    if (u && !loginForm.username) loginForm.username = u
    if (p && !loginForm.password) loginForm.password = p
  }, 200)
  setTimeout(() => {
    isEntered.value = true
    showCard.value = true
  }, 50)
})
onUnmounted(() => {
  /* 子组件自行管理生命周期 */
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
              <el-button
                type="primary"
                size="large"
                :loading="loading"
                class="login__btn"
                :class="{ 'login__btn--success': loginSuccess }"
                @click="handleLogin"
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

    <el-dialog v-model="forgotDialogVisible" title="忘记密码" width="420px" append-to-body>
      <el-form v-if="forgotStep === 1" label-width="80px" @submit.prevent>
        <el-form-item label="邮箱" required>
          <el-input v-model="forgotForm.email" placeholder="请输入注册邮箱" />
        </el-form-item>
        <p class="login__hint">验证码将发送到该邮箱，请确认邮箱可正常接收</p>
      </el-form>
      <el-form v-else label-width="90px" @submit.prevent>
        <el-form-item label="验证码" required>
          <el-input v-model="forgotForm.verificationCode" placeholder="邮箱收到的 6 位验证码" />
        </el-form-item>
        <el-form-item label="新密码" required>
          <el-input
            v-model="forgotForm.newPassword"
            type="password"
            show-password
            placeholder="6-32 位，含大小写字母、数字与特殊字符"
          />
        </el-form-item>
        <el-form-item label="确认密码" required>
          <el-input
            v-model="forgotForm.confirmPassword"
            type="password"
            show-password
            placeholder="再次输入新密码"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="forgotDialogVisible = false">取消</el-button>
        <el-button
          v-if="forgotStep === 1"
          type="primary"
          :loading="forgotSending"
          @click="handleSendResetEmail"
        >
          发送验证码
        </el-button>
        <el-button v-else type="primary" :loading="forgotSubmitting" @click="handleConfirmReset">
          重置密码
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
/* ============================================================
   CSS Variables — shared with LoginHero / LoginParticles / LoginBackground
   ============================================================ */
.login {
  --login-primary: #2157a6;
  --login-primary-strong: #15386d;
  --login-accent: rgba(142, 197, 255, 0.9);
  --login-gold: rgba(236, 198, 126, 0.8);
  --login-surface: rgba(10, 18, 34, 0.72);
  --login-surface-soft: rgba(255, 255, 255, 0.08);
  --login-border: rgba(255, 255, 255, 0.14);
  --login-border-strong: rgba(255, 255, 255, 0.2);
  --login-text: #f8fbff;
  --login-text-soft: rgba(240, 247, 255, 0.72);
  --login-text-faint: rgba(240, 247, 255, 0.5);
  --login-aurora-one: rgba(59, 130, 246, 0.42);
  --login-aurora-two: rgba(236, 198, 126, 0.24);
  --login-aurora-three: rgba(154, 200, 255, 0.18);
  --login-ring-color: rgba(255, 255, 255, 0.08);
  --login-grid-color: rgba(255, 255, 255, 0.12);
  --login-input-bg: rgba(255, 255, 255, 0.06);
  --login-input-border: rgba(255, 255, 255, 0.08);
  --login-input-focus-border: rgba(124, 181, 255, 0.4);
  --login-input-focus-ring: rgba(33, 87, 166, 0.14);
  --login-btn-primary-1: #245db3;
  --login-btn-primary-2: #163c78;
  --login-btn-shadow: rgba(15, 43, 88, 0.32);
  --login-card-shadow: rgba(0, 0, 0, 0.34);
  --login-tab-active-1: rgba(39, 102, 188, 0.92);
  --login-tab-active-2: rgba(18, 55, 110, 0.96);
  --login-captcha-bg: rgba(255, 255, 255, 0.06);
  --login-float-bg: linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.5));

  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(420px, 0.8fr);
  position: relative;
  overflow: hidden;
  user-select: none;
  isolation: isolate;
  background:
    radial-gradient(circle at 20% 20%, var(--login-aurora-one), transparent 34%),
    radial-gradient(circle at 80% 18%, var(--login-aurora-two), transparent 24%),
    linear-gradient(135deg, #07111f 0%, #0c1830 38%, #10274b 100%);
  transition:
    background 0.5s ease,
    color 0.5s ease;

  &--light {
    --login-text: #0f172a;
    --login-text-soft: rgba(51, 65, 85, 0.78);
    --login-text-faint: rgba(100, 116, 139, 0.72);
    --login-surface: rgba(255, 255, 255, 0.8);
    --login-surface-soft: rgba(255, 255, 255, 0.9);
    --login-border: rgba(148, 163, 184, 0.18);
    --login-border-strong: rgba(148, 163, 184, 0.3);
    --login-aurora-one: rgba(96, 165, 250, 0.22);
    --login-aurora-two: rgba(251, 191, 36, 0.14);
    --login-aurora-three: rgba(191, 219, 254, 0.16);
    --login-ring-color: rgba(51, 65, 85, 0.08);
    --login-grid-color: rgba(15, 23, 42, 0.08);
    --login-input-bg: rgba(248, 250, 252, 0.9);
    --login-input-border: rgba(148, 163, 184, 0.25);
    --login-input-focus-border: rgba(59, 130, 246, 0.5);
    --login-input-focus-ring: rgba(59, 130, 246, 0.1);
    --login-btn-primary-1: #1d4ed8;
    --login-btn-primary-2: #1e3a8a;
    --login-btn-shadow: rgba(29, 78, 216, 0.18);
    --login-card-shadow: rgba(15, 23, 42, 0.08);
    --login-tab-active-1: rgba(29, 78, 216, 0.95);
    --login-tab-active-2: rgba(30, 58, 138, 0.96);
    --login-captcha-bg: rgba(248, 250, 252, 0.95);
    --login-float-bg: linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(241, 245, 249, 0.75));
    background:
      radial-gradient(circle at 20% 20%, var(--login-aurora-one), transparent 36%),
      radial-gradient(circle at 80% 18%, var(--login-aurora-two), transparent 26%),
      linear-gradient(135deg, #eef4ff 0%, #f8faff 36%, #e6efff 100%);
  }

  &--success {
    animation: loginFadeOut 0.55s ease 0.05s forwards;
  }

  /* ---- 主题切换 ---- */
  &__theme-toggle {
    position: absolute;
    top: 24px;
    right: 24px;
    z-index: 4;
    width: 46px;
    height: 46px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 16px;
    border: 1px solid var(--login-border);
    background: var(--login-surface-soft);
    color: var(--login-text);
    backdrop-filter: blur(16px);
    cursor: pointer;
    transition:
      transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
      border-color 0.45s ease,
      box-shadow 0.45s ease,
      color 0.45s ease;
    &:hover {
      transform: translateY(-2px) scale(1.05);
      border-color: var(--login-border-strong);
      box-shadow: 0 12px 30px var(--login-card-shadow);
    }
  }
  &__theme-icon {
    animation: themeIconSpin 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  }

  /* ---- 右侧登录面板 ---- */
  &__panel {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 56px 5vw 56px 0;
    animation: panelEnter 1.4s cubic-bezier(0.16, 1, 0.3, 1);
  }
  &__card {
    position: relative;
    width: min(100%, 460px);
    border-radius: 32px;
    background: var(--login-surface);
    border: 1px solid var(--login-border);
    backdrop-filter: blur(24px);
    overflow: hidden;
    box-shadow:
      0 34px 80px var(--login-card-shadow),
      inset 0 1px 0 rgba(255, 255, 255, 0.12);
    transition:
      background-color 0.6s cubic-bezier(0.22, 1, 0.36, 1),
      border-color 0.6s ease,
      box-shadow 0.6s ease;
  }
  &__card-inner {
    position: relative;
    z-index: 1;
    padding: 38px 34px 34px;
  }
  &__card-glow {
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    padding: 1px;
    pointer-events: none;
    background: linear-gradient(
      135deg,
      var(--login-input-focus-border),
      transparent 35%,
      var(--login-aurora-two) 100%
    );
    opacity: 0.85;
    mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    mask-composite: exclude;
    transition:
      opacity 0.6s ease,
      background 0.6s ease;
  }
  &__header {
    position: relative;
    z-index: 1;
    margin-bottom: 28px;
  }
  &__eyebrow {
    margin: 0 0 12px;
    font-size: 12px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--login-text-faint);
    transition: color 0.5s ease;
  }
  &__title {
    margin: 0;
    font-size: 34px;
    line-height: 1.1;
    color: var(--login-text);
    transition: color 0.5s ease;
  }
  &__subtitle {
    margin: 12px 0 0;
    font-size: 14px;
    line-height: 1.7;
    color: var(--login-text-soft);
    transition: color 0.5s ease;
    > span {
      display: inline-block;
      animation: textSlideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1);
    }
  }

  /* Tab */
  &__tabs {
    position: relative;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
    padding: 6px;
    border-radius: 18px;
    background: var(--login-surface-soft);
    border: 1px solid var(--login-border);
    margin-bottom: 28px;
    transition:
      background-color 0.5s ease,
      border-color 0.5s ease;
  }
  &__tab {
    position: relative;
    z-index: 1;
    height: 46px;
    border: 0;
    background: transparent;
    color: var(--login-text-soft);
    font-size: 14px;
    font-weight: 600;
    border-radius: 14px;
    cursor: pointer;
    transition: color 0.3s ease;
    &.is-active {
      color: #fff;
    }
  }
  .login--light &__tab.is-active {
    color: #fff;
  }
  &__tab-indicator {
    position: absolute;
    top: 6px;
    left: 6px;
    width: calc(50% - 6px);
    height: calc(100% - 12px);
    border-radius: 14px;
    background: linear-gradient(135deg, var(--login-tab-active-1), var(--login-tab-active-2));
    box-shadow:
      0 16px 30px var(--login-btn-shadow),
      inset 0 1px 0 rgba(255, 255, 255, 0.18);
    transition:
      transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
      background 0.5s ease,
      box-shadow 0.5s ease;
    &.is-admin {
      transform: translateX(100%);
    }
  }

  /* 表单 */
  &__input-group {
    position: relative;
    &--captcha {
      flex: 1;
    }
  }
  &__floating-label {
    position: absolute;
    left: 44px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 14px;
    color: var(--login-text-faint);
    pointer-events: none;
    z-index: 2;
    background: transparent;
    padding: 0;
    font-weight: 500;
    letter-spacing: 0.01em;
    opacity: 1;
    transition:
      all 0.3s cubic-bezier(0.22, 1, 0.36, 1),
      color 0.3s ease,
      opacity 0.2s ease;
  }
  .login__input-group.is-focus &__floating-label {
    top: -6px;
    left: 38px;
    font-size: 12px;
    color: var(--login-accent);
    background: transparent;
    transform: translateY(-50%);
    padding: 0;
    opacity: 1;
  }
  .login__input-group.has-value:not(.is-focus) &__floating-label {
    opacity: 0;
  }
  .login--dark .login__input-group.is-focus &__floating-label {
    color: #8bb8ff;
    background: transparent;
    text-shadow: 0 0 20px rgba(139, 184, 255, 0.3);
  }
  .login--light .login__input-group.is-focus &__floating-label {
    color: #2563eb;
    background: transparent;
  }

  &__form {
    position: relative;
    z-index: 1;
    :deep(.el-form-item) {
      margin-bottom: 18px;
    }
    :deep(.el-form-item__content) {
      flex-direction: column;
      align-items: stretch;
      gap: 6px;
    }
    :deep(.el-input__wrapper) {
      min-height: 54px;
      border-radius: 18px;
      background: var(--login-input-bg);
      box-shadow: inset 0 0 0 1px var(--login-input-border);
      transition:
        box-shadow 0.35s cubic-bezier(0.22, 1, 0.36, 1),
        transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
        background-color 0.35s ease;
      &::after {
        content: '';
        position: absolute;
        inset: -2px;
        border-radius: 20px;
        background: linear-gradient(
          135deg,
          var(--login-input-focus-border),
          transparent 60%,
          var(--login-aurora-two)
        );
        opacity: 0;
        z-index: -1;
        transition: opacity 0.35s cubic-bezier(0.22, 1, 0.36, 1);
      }
    }
    :deep(.el-input__wrapper.is-focus) {
      background: var(--login-input-bg);
      box-shadow:
        0 0 0 1px var(--login-input-focus-border) inset,
        0 0 0 5px var(--login-input-focus-ring);
      transform: translateY(-2px);
      &::after {
        opacity: 0.6;
      }
    }
    :deep(.el-input__inner) {
      color: var(--login-text);
      font-size: 14px;
      transition: color 0.35s ease;
      &::placeholder {
        color: var(--login-text-faint);
      }
    }
    :deep(.el-input__icon) {
      color: var(--login-text-soft);
      transition: color 0.35s ease;
    }
    :deep(.el-checkbox__label) {
      color: var(--login-text-soft);
      transition: color 0.35s ease;
    }
    :deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
      color: var(--login-text);
    }
  }

  &__captcha-row {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  &__captcha-box {
    flex-shrink: 0;
    // 140px：--img 变体 padding 4px 后内容区为 132×46，≥ 验证码自然尺寸（后端返回 130×48 PNG）。
    // 这样即便 object-fit 在个别浏览器/陈旧缓存下未生效，整张图也能以自然宽度完整放入，
    // 从机制上杜绝"第 4 位被右侧 overflow 裁掉"的可能。
    width: 140px;
    height: 54px;
    border-radius: 18px;
    background: var(--login-captcha-bg);
    border: 1px solid var(--login-input-border);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 0 8px;
    overflow: hidden;
    transition:
      border-color 0.3s ease,
      transform 0.3s ease;
    &:hover {
      border-color: var(--login-input-focus-border);
      transform: translateY(-1px);
    }
    &--img {
      padding: 4px;
    }
  }
  &__captcha-img {
    // block + max 约束兜底：确保 img 永远不超过内容区尺寸，避免被盒子 overflow:hidden 横向裁切
    display: block;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    // min-width/min-height:0：img 是 flex 子项，默认 min-width:auto 不允许收缩到固有宽度以下，
    // 验证码图固有宽度大于容器时会把元素撑宽，溢出被 overflow:hidden 裁掉右侧（第四位只剩一半）。
    min-width: 0;
    min-height: 0;
    // contain：完整显示整张验证码，避免 cover 等比放大裁切字符
    object-fit: contain;
    border-radius: 14px;
  }
  &__captcha-loading {
    font-size: 12px;
    line-height: 1.4;
    text-align: center;
    color: var(--login-text-faint);
  }
  &__captcha-char {
    display: inline-block;
    font-size: 22px;
    font-weight: 700;
    font-family: Georgia, 'Times New Roman', serif;
    letter-spacing: 1px;
    user-select: none;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.15);
  }
  &__hint {
    margin: 0;
    font-size: 12px;
    line-height: 1.6;
    color: var(--login-text-faint);
    transition: color 0.5s ease;
  }
  &__caps-warning {
    margin: 0;
    font-size: 12px;
    line-height: 1.6;
    color: #f59e0b;
  }
  &__options {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 6px 0 22px;
  }
  &__link {
    border: 0;
    padding: 0;
    background: none;
    color: var(--login-text-soft);
    font-size: 13px;
    cursor: pointer;
    transition:
      color 0.25s ease,
      transform 0.25s ease;
    &:hover {
      color: var(--login-text);
      transform: translateX(2px);
    }
  }

  &__btn {
    position: relative;
    width: 100%;
    height: 54px;
    border: 0;
    border-radius: 18px;
    overflow: hidden;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.08em;
    background: linear-gradient(
      135deg,
      var(--login-btn-primary-1) 0%,
      var(--login-btn-primary-2) 65%,
      var(--login-btn-primary-1) 100%
    ) !important;
    box-shadow:
      0 20px 36px var(--login-btn-shadow),
      inset 0 1px 0 rgba(255, 255, 255, 0.16);
    transition:
      transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
      box-shadow 0.45s ease,
      filter 0.45s ease,
      background 0.45s ease;
    &:hover {
      transform: translateY(-2px);
      box-shadow:
        0 26px 44px var(--login-btn-shadow),
        inset 0 1px 0 rgba(255, 255, 255, 0.18);
      filter: brightness(1.04);
    }
    &:active {
      transform: translateY(0);
    }
    &--success {
      background: linear-gradient(135deg, #1f9d67 0%, #16784f 100%) !important;
      pointer-events: none;
      animation: btnSuccessPulse 0.5s ease;
    }
  }

  &__security {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 28px;
    font-size: 11px;
    color: var(--login-text-faint);
    letter-spacing: 0.5px;
    opacity: 0.8;
    transition: color 0.5s ease;
    svg {
      color: var(--login-accent);
    }
  }
  .login--light &__security svg {
    color: #2563eb;
  }
}

/* ============================================================
   Keyframes
   ============================================================ */
@keyframes loginFadeOut {
  to {
    opacity: 0;
    transform: scale(1.03);
    filter: blur(4px);
  }
}
@keyframes textSlideIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes btnSuccessPulse {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.04);
  }
  100% {
    transform: scale(1);
  }
}
@keyframes themeIconSpin {
  from {
    opacity: 0;
    transform: rotate(-90deg) scale(0.5);
  }
  to {
    opacity: 1;
    transform: rotate(0deg) scale(1);
  }
}
@keyframes panelEnter {
  from {
    opacity: 0;
    transform: translateX(48px) scale(0.98);
    filter: blur(12px);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
    filter: blur(0);
  }
}

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
      padding: 8px 16px 28px;
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

<style lang="scss">
.login-card-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.98);
  filter: blur(10px);
}
.login-card-enter-active {
  transition:
    opacity 1.2s cubic-bezier(0.22, 1, 0.36, 1),
    transform 1.2s cubic-bezier(0.22, 1, 0.36, 1),
    filter 1.2s cubic-bezier(0.22, 1, 0.36, 1);
}
.login-card-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: blur(0);
}

html.dark .login {
  background:
    radial-gradient(circle at 20% 20%, rgba(81, 152, 255, 0.24), transparent 34%),
    radial-gradient(circle at 80% 18%, rgba(251, 191, 36, 0.12), transparent 24%),
    linear-gradient(135deg, #040912 0%, #08111f 38%, #0d1d35 100%);
  &.login--admin {
    background:
      radial-gradient(circle at 20% 20%, rgba(95, 181, 255, 0.18), transparent 30%),
      radial-gradient(circle at 80% 18%, rgba(94, 234, 212, 0.1), transparent 24%),
      linear-gradient(135deg, #030812 0%, #09121f 38%, #0b2741 100%);
  }
}

.login--light {
  .login__theme-toggle {
    background: rgba(255, 255, 255, 0.85);
    border-color: rgba(148, 163, 184, 0.25);
    color: #1e293b;
  }
  .login__card {
    background: rgba(255, 255, 255, 0.88);
  }
  .login__tabs {
    border-color: rgba(148, 163, 184, 0.18);
  }
  .login__form .el-input__wrapper {
    background: rgba(248, 250, 252, 0.95);
    box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.25);
  }
  .login__form .el-input__wrapper.is-focus {
    box-shadow:
      0 0 0 1px rgba(59, 130, 246, 0.5) inset,
      0 0 0 4px rgba(59, 130, 246, 0.1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .login *,
  .login *::before,
  .login *::after {
    animation: none !important;
    transition: none !important;
  }
}
</style>
