<script setup lang="ts">
import type { RegisterOptionNode } from '@/shared/api/auth'
import type { UserInfo } from '@/shared/types/types'
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getRegisterOptions, registerStudent } from '@/shared/api/auth'
import { getCaptcha } from '@/shared/api/teacher-auth'
import { validatePasswordStrength } from '@/shared/utils/validatePassword'
import { useUserStore } from '@/stores/stores'

const router = useRouter()
const userStore = useUserStore()

const isEntered = ref(false)
const showCard = ref(false)

/* ===================== 表单 ===================== */
const form = reactive({
  userNo: '',
  name: '',
  gender: 1,
  phone: '',
  email: '',
  collegeId: null as number | null,
  majorId: null as number | null,
  className: '',
  password: '',
  confirmPassword: '',
  captcha: '',
})

/* ===================== 组织架构选项 ===================== */
const colleges = ref<RegisterOptionNode[]>([])
const majors = ref<RegisterOptionNode[]>([])
const optionsLoading = ref(true)
const optionsFailed = ref(false)

/**
 * 加载学院 / 专业选项。
 * dev server 重启或网络抖动会让首次请求直接失败，这里自动重试一次；
 * 仍失败则展示带「重新加载」按钮的提示，而不是让页面一直停在空状态。
 */
async function loadOptions() {
  optionsLoading.value = true
  optionsFailed.value = false
  for (let attempt = 0; attempt <= 1; attempt += 1) {
    try {
      const res = await getRegisterOptions()
      // 学院内部使用，学校层级不参与选择：直接把各学校下的二级学院铺平
      colleges.value = (res?.schools ?? []).flatMap((school) => school.children ?? [])
      majors.value = []
      form.collegeId = null
      form.majorId = null
      optionsLoading.value = false
      return
    } catch {
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 800))
    }
  }
  colleges.value = []
  majors.value = []
  optionsFailed.value = true
  optionsLoading.value = false
}

/** 切换学院后刷新专业下拉，并清空已选专业 */
function handleCollegeChange() {
  form.majorId = null
  const college = colleges.value.find((item) => item.id === form.collegeId)
  majors.value = college?.children ?? []
}

const loading = ref(false)
const registered = ref(false)
const passwordStrength = computed(() =>
  form.password ? validatePasswordStrength(form.password) : null,
)

/* ===================== 验证码 ===================== */
const captchaImage = ref<{ key: string; image: string } | null>(null)
const captchaFailed = ref(false)
const captchaRefreshKey = ref(0)
let captchaKey = ''

async function loadCaptcha() {
  captchaFailed.value = false
  try {
    const res = await getCaptcha()
    if (res?.key && res?.image) {
      captchaImage.value = res
      captchaKey = res.key
      form.captcha = ''
      captchaRefreshKey.value += 1
    } else {
      captchaImage.value = null
      captchaFailed.value = true
    }
  } catch {
    captchaImage.value = null
    captchaFailed.value = true
  }
}

function refreshCaptcha() {
  void loadCaptcha()
}

/* ===================== 提交 ===================== */
function validateForm(): string | null {
  if (!form.userNo.trim()) return '请输入学号'
  if (!form.name.trim()) return '请输入姓名'
  if (!/^1[3-9]\d{9}$/.test(form.phone.trim())) return '请输入正确的手机号'
  if (!/^[\w.%+-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)+$/i.test(form.email.trim())) {
    return '请输入正确的邮箱'
  }
  if (!form.collegeId) return '请选择学院'
  if (!form.majorId) return '请选择专业'
  if (!form.className.trim()) return '请填写班级'
  if (!form.password) return '请输入密码'
  if (form.password !== form.confirmPassword) return '两次输入的密码不一致'
  const strength = validatePasswordStrength(form.password)
  if (!strength.valid) return strength.message
  if (!form.captcha.trim()) return '请输入验证码'
  return null
}

function toStudentUserInfo(user: {
  userId: number
  userNo: string
  name: string
  email?: string
  schoolName?: string
  avatar?: string | null
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
    phone: form.phone.trim(),
    college: user.schoolName ?? '',
    department: '',
    loginType: 'student',
  }
}

async function handleRegister() {
  if (loading.value || registered.value) return
  if (optionsLoading.value) {
    ElMessage.warning('组织架构加载中，请稍候再试')
    return
  }
  const error = validateForm()
  if (error) {
    ElMessage.warning(error)
    return
  }

  loading.value = true
  try {
    const res = await registerStudent({
      userNo: form.userNo.trim(),
      name: form.name.trim(),
      gender: form.gender,
      email: form.email.trim(),
      phone: form.phone.trim(),
      majorId: form.majorId as number,
      className: form.className.trim(),
      password: form.password,
      confirmPassword: form.confirmPassword,
      captchaKey,
      captchaCode: form.captcha.trim(),
    })
    // 注册即登录：写入会话级 token（关闭浏览器即失效）
    userStore.setToken(res.accessToken, false)
    userStore.setUserInfo(toStudentUserInfo(res.user))
    registered.value = true
    ElMessage.success('注册成功，正在进入系统')
    window.setTimeout(() => router.push('/dashboard'), 600)
  } catch {
    // 验证码已在后端被消费，失败后统一换一张，避免用户沿用失效 key
    refreshCaptcha()
  } finally {
    loading.value = false
  }
}

function goLogin() {
  void router.push('/login')
}

onMounted(() => {
  setTimeout(() => {
    isEntered.value = true
    showCard.value = true
  }, 50)
  void loadOptions()
  void loadCaptcha()
})
</script>

<template>
  <div class="login login--register login--light" :class="{ 'is-entered': isEntered }">
    <section class="login__panel">
      <div v-if="showCard" class="register-card">
        <header class="register-head">
          <h1>学生账号注册</h1>
          <p>请填写本人真实的学号与班级信息，提交后自动登录系统。</p>
        </header>

        <div v-if="optionsFailed" class="register-alert" role="alert">
          <span>学院 / 专业 / 班级数据加载失败，请检查网络连接。</span>
          <button type="button" class="register-alert__retry" @click="loadOptions">重新加载</button>
        </div>
        <div v-else-if="!optionsLoading && colleges.length === 0" class="register-alert">
          <span>暂无可选学院，请联系管理员先维护学院 / 专业数据。</span>
        </div>

        <form class="register-form" @submit.prevent="handleRegister">
          <section class="register-section">
            <h2>基本信息</h2>
            <div class="register-grid">
              <label class="register-field">
                <span class="register-label">学号</span>
                <el-input
                  v-model="form.userNo"
                  size="large"
                  maxlength="50"
                  placeholder="请输入学号"
                />
              </label>
              <label class="register-field">
                <span class="register-label">姓名</span>
                <el-input
                  v-model="form.name"
                  size="large"
                  maxlength="100"
                  placeholder="请输入姓名"
                />
              </label>
              <label class="register-field">
                <span class="register-label">手机号</span>
                <el-input
                  v-model="form.phone"
                  size="large"
                  maxlength="11"
                  placeholder="用于接收通知"
                />
              </label>
              <label class="register-field">
                <span class="register-label">邮箱</span>
                <el-input
                  v-model="form.email"
                  size="large"
                  maxlength="255"
                  placeholder="用于找回密码"
                />
              </label>
              <div class="register-field register-field--full">
                <span class="register-label">性别</span>
                <el-radio-group v-model="form.gender" :disabled="loading">
                  <el-radio :value="1">男</el-radio>
                  <el-radio :value="2">女</el-radio>
                </el-radio-group>
              </div>
            </div>
          </section>

          <section class="register-section">
            <h2>学籍信息</h2>
            <div class="register-grid">
              <label class="register-field">
                <span class="register-label">学院</span>
                <el-select
                  v-model="form.collegeId"
                  size="large"
                  :disabled="optionsLoading"
                  :placeholder="optionsLoading ? '正在加载学院…' : '请选择学院'"
                  @change="handleCollegeChange"
                >
                  <el-option
                    v-for="college in colleges"
                    :key="college.id"
                    :label="college.name"
                    :value="college.id"
                  />
                </el-select>
              </label>
              <label class="register-field">
                <span class="register-label">专业</span>
                <el-select
                  v-model="form.majorId"
                  size="large"
                  :disabled="!form.collegeId"
                  :placeholder="form.collegeId ? '请选择专业' : '请先选择学院'"
                >
                  <el-option
                    v-for="major in majors"
                    :key="major.id"
                    :label="major.name"
                    :value="major.id"
                  />
                </el-select>
              </label>
              <label class="register-field register-field--full">
                <span class="register-label">班级</span>
                <el-input
                  v-model="form.className"
                  size="large"
                  maxlength="100"
                  placeholder="请填写班级，如：软件工程2024级1班"
                />
                <p class="register-hint">按「专业 + 班级名称」归档；该班级尚未录入时会自动创建。</p>
              </label>
            </div>
          </section>

          <section class="register-section">
            <h2>账号安全</h2>
            <div class="register-grid">
              <label class="register-field">
                <span class="register-label">密码</span>
                <el-input
                  v-model="form.password"
                  type="password"
                  size="large"
                  show-password
                  autocomplete="new-password"
                  placeholder="请输入登录密码"
                />
              </label>
              <label class="register-field">
                <span class="register-label">确认密码</span>
                <el-input
                  v-model="form.confirmPassword"
                  type="password"
                  size="large"
                  show-password
                  autocomplete="new-password"
                  placeholder="请再次输入密码"
                />
              </label>
              <p
                class="register-hint register-field--full"
                :class="{ 'is-error': passwordStrength && !passwordStrength.valid }"
              >
                {{
                  passwordStrength && !passwordStrength.valid
                    ? passwordStrength.message
                    : '6-32 位，需包含大小写字母、数字和特殊字符'
                }}
              </p>
              <div class="register-field register-field--full">
                <span class="register-label">验证码</span>
                <div class="register-captcha">
                  <el-input
                    v-model="form.captcha"
                    size="large"
                    maxlength="4"
                    placeholder="请输入验证码"
                  />
                  <button
                    :key="captchaRefreshKey"
                    type="button"
                    class="register-captcha__box"
                    title="点击刷新验证码"
                    @click="refreshCaptcha"
                  >
                    <img v-if="captchaImage" :src="captchaImage.image" alt="验证码" />
                    <span v-else-if="captchaFailed">加载失败，点击重试</span>
                    <span v-else>加载中…</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <el-button
            type="primary"
            native-type="submit"
            :loading="loading"
            :disabled="optionsLoading || colleges.length === 0"
            class="register-submit"
            :class="{ 'register-submit--success': registered }"
          >
            <template v-if="registered">注册成功，正在进入系统</template>
            <template v-else-if="loading">正在创建账号</template>
            <template v-else>注册并进入系统</template>
          </el-button>
        </form>

        <footer class="register-foot">
          <span>已有账号？</span>
          <button type="button" class="register-foot__link" @click="goLogin">返回登录</button>
        </footer>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss" src="./styles/login.scss"></style>

<style scoped lang="scss">
/* ============================================================
   注册页：办公表单风格，去掉登录页的极光/玻璃拟态装饰
   ============================================================ */
.login.login--register {
  --register-card-bg: #ffffff;
  --register-input-bg: #ffffff;
  --register-border: #dbe3ec;
  --register-border-strong: #c3cedb;
  --register-muted: #64748b;
  --register-section-line: #e8eef5;
  --register-hover: #f5f8fc;

  grid-template-columns: minmax(0, 1fr);
  overflow-y: auto;
  background: #f2f5f9;

  .login__panel {
    width: 100%;
    padding: 64px 24px 56px;
    align-items: flex-start;
  }
}

.register-card {
  width: min(100%, 720px);
  margin: 0 auto;
  padding: 36px 40px 30px;
  border-radius: 10px;
  background: var(--register-card-bg);
  border: 1px solid var(--register-border);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.register-head {
  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    line-height: 1.3;
    color: var(--login-text);
  }

  p {
    margin: 8px 0 0;
    font-size: 13px;
    line-height: 1.7;
    color: var(--register-muted);
  }
}

.register-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 20px;
  padding: 10px 14px;
  border-radius: 6px;
  border: 1px solid #f0c98a;
  background: #fdf6e9;
  color: #92580b;
  font-size: 13px;
  line-height: 1.6;

  &__retry {
    flex-shrink: 0;
    padding: 4px 10px;
    border-radius: 4px;
    border: 1px solid #d9a44f;
    background: #fff;
    color: #92580b;
    font-size: 12px;
    cursor: pointer;

    &:hover {
      background: #fffaf0;
    }
  }
}

.register-form {
  margin-top: 8px;
}

.register-section {
  margin-top: 26px;

  h2 {
    margin: 0 0 16px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--register-section-line);
    font-size: 14px;
    font-weight: 600;
    color: var(--login-text);
  }
}

.register-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 20px;
}

.register-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;

  &--full {
    grid-column: 1 / -1;
  }
}

.register-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--login-text);
  opacity: 0.85;
}

.register-hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--register-muted);

  &.is-error {
    color: #dc2626;
  }
}

.register-form :deep(.el-select) {
  width: 100%;
}

.register-captcha {
  display: flex;
  align-items: center;
  gap: 10px;

  &__box {
    flex-shrink: 0;
    width: 132px;
    height: 44px;
    padding: 4px;
    border-radius: 6px;
    border: 1px solid var(--register-border);
    background: var(--register-input-bg);
    color: var(--register-muted);
    font-size: 12px;
    cursor: pointer;
    overflow: hidden;

    &:hover {
      border-color: var(--register-border-strong);
    }

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
}

/* 表单控件：统一圆角与边框，覆盖登录页的大圆角/发光样式 */
.register-form {
  :deep(.el-input__wrapper) {
    min-height: 44px;
    border-radius: 6px;
    background: var(--register-input-bg);
    box-shadow: 0 0 0 1px var(--register-border) inset;
    transition:
      box-shadow 0.2s ease,
      border-color 0.2s ease;

    &:hover {
      box-shadow: 0 0 0 1px var(--register-border-strong) inset;
    }

    &.is-focus {
      box-shadow:
        0 0 0 1px #2563eb inset,
        0 0 0 3px rgba(37, 99, 235, 0.12);
    }
  }

  :deep(.el-input__inner) {
    color: var(--login-text);
    font-size: 14px;

    &::placeholder {
      color: var(--register-muted);
      opacity: 0.8;
    }
  }

  :deep(.el-radio-group) {
    min-height: 44px;
    align-items: center;
  }

  :deep(.el-radio__label) {
    color: var(--login-text);
  }

  :deep(.el-radio__input.is-checked + .el-radio__label) {
    color: var(--login-text);
  }
}

.register-submit {
  width: 100%;
  height: 46px;
  margin-top: 26px;
  border: 0;
  border-radius: 6px;
  background: #1d4ed8 !important;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.02em;

  &:hover {
    background: #1a44bd !important;
  }

  &--success {
    background: #15803d !important;
    pointer-events: none;
  }
}

.register-foot {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 20px;
  font-size: 13px;
  color: var(--register-muted);

  &__link {
    padding: 0;
    border: 0;
    background: none;
    color: #1d4ed8;
    font-size: 13px;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }
}

@media (max-width: 640px) {
  .login.login--register .login__panel {
    padding: 56px 14px 32px;
  }

  .register-card {
    padding: 26px 20px 24px;
  }

  .register-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

<style lang="scss" src="./styles/login-global.scss"></style>
