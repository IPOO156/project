<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { confirmPasswordReset, requestPasswordReset } from '@/shared/api/teacher-api'
import { isValidEmail } from '@/shared/utils/validateEmail'
import { validatePasswordStrength } from '@/shared/utils/validatePassword'

/** 弹窗显隐（v-model），由登录页控制 */
const forgotDialogVisible = defineModel<boolean>({ required: true })

/** 重发验证码冷却秒数（纯前端节流，后端频率限制仍未确认，见追踪表 p32） */
const RESEND_SECONDS = 60

/* ===================== 忘记密码（POST /auth/password/reset + confirm）===================== */
const forgotSending = ref(false)
const forgotSubmitting = ref(false)
const forgotStep = ref<1 | 2>(1)
const forgotForm = reactive({
  email: '',
  verificationCode: '',
  newPassword: '',
  confirmPassword: '',
})
const forgotEmailInputRef = ref<{ input: HTMLInputElement } | null>(null)
const forgotCodeInputRef = ref<{ input: HTMLInputElement } | null>(null)
const forgotPasswordInputRef = ref<{ input: HTMLInputElement } | null>(null)
const forgotConfirmInputRef = ref<{ input: HTMLInputElement } | null>(null)

/** 重发冷却剩余秒数（>0 时禁用「重新发送」） */
const resendLeft = ref(0)
let resendTimer: number | null = null

/** 新密码强度实时提示：与提交时使用的同一套规则，避免提示文案前后不一致 */
const passwordStrengthHint = computed(() =>
  forgotForm.newPassword ? validatePasswordStrength(forgotForm.newPassword) : null,
)
/** 两次密码一致性实时提示 */
const passwordMatchHint = computed(() => {
  if (!forgotForm.confirmPassword) return ''
  return forgotForm.newPassword === forgotForm.confirmPassword
    ? '两次输入一致'
    : '两次输入不一致，请检查'
})

function stopResendCountdown() {
  if (resendTimer !== null) {
    window.clearInterval(resendTimer)
    resendTimer = null
  }
  resendLeft.value = 0
}

function startResendCountdown() {
  stopResendCountdown()
  resendLeft.value = RESEND_SECONDS
  resendTimer = window.setInterval(() => {
    resendLeft.value -= 1
    if (resendLeft.value <= 0) stopResendCountdown()
  }, 1000)
}

onBeforeUnmount(stopResendCountdown)

/**
 * 后端用 404 + code=30001 表示「该邮箱未注册」（响应拦截器对 404 静默、不弹全局错误）。
 * 前端一律按中性文案处理，不向前端用户暴露账号是否存在。
 */
function isUnregisteredEmailError(error: unknown): boolean {
  const resp = (error as { response?: { status?: number; data?: { code?: number } } } | undefined)
    ?.response
  return resp?.data?.code === 30001 || resp?.status === 404
}

/** 每次打开都回到第一步并清空输入（与原先 openForgotDialog 的行为一致） */
watch(forgotDialogVisible, (visible) => {
  stopResendCountdown()
  if (!visible) return
  forgotStep.value = 1
  forgotForm.email = ''
  forgotForm.verificationCode = ''
  forgotForm.newPassword = ''
  forgotForm.confirmPassword = ''
})

/** 发送验证码（首次发送与「重新发送」共用；冷却期内与提交中一律拦截） */
async function handleSendResetEmail() {
  if (forgotSending.value || resendLeft.value > 0) return
  const email = forgotForm.email.trim()
  if (!email) {
    ElMessage.warning('请输入注册邮箱')
    forgotEmailInputRef.value?.input?.focus()
    return
  }
  if (!isValidEmail(email)) {
    ElMessage.warning('请输入正确的邮箱地址')
    forgotEmailInputRef.value?.input?.focus()
    return
  }
  forgotSending.value = true
  try {
    await requestPasswordReset({ email })
    forgotStep.value = 2
    ElMessage.success('如果该邮箱已注册，验证码将发送至邮箱，请查收')
    startResendCountdown()
  } catch (error) {
    // 未注册邮箱：同样进入第二步并给中性提示，避免通过界面差异枚举账号
    if (isUnregisteredEmailError(error)) {
      forgotStep.value = 2
      ElMessage.info('如果该邮箱已注册，验证码将发送至邮箱，请查收')
      startResendCountdown()
    }
    /* 其余错误由拦截器提示 */
  } finally {
    forgotSending.value = false
  }
}

async function handleConfirmReset() {
  if (forgotSubmitting.value) return
  const { email, verificationCode, newPassword, confirmPassword } = forgotForm
  if (!verificationCode.trim()) {
    ElMessage.warning('请输入邮箱收到的验证码')
    forgotCodeInputRef.value?.input?.focus()
    return
  }
  const strength = validatePasswordStrength(newPassword)
  if (!strength.valid) {
    ElMessage.warning(strength.message)
    forgotPasswordInputRef.value?.input?.focus()
    return
  }
  if (newPassword !== confirmPassword) {
    ElMessage.warning('两次输入的密码不一致')
    forgotConfirmInputRef.value?.input?.focus()
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
</script>

<template>
  <el-dialog v-model="forgotDialogVisible" title="忘记密码" width="420px" append-to-body>
    <!-- 单输入框表单：HTML 标准隐式提交原生支持 Enter 键提交，@submit.prevent 统一接管 -->
    <el-form v-if="forgotStep === 1" label-width="80px" @submit.prevent="handleSendResetEmail">
      <el-form-item label="邮箱" required>
        <el-input
          ref="forgotEmailInputRef"
          v-model="forgotForm.email"
          placeholder="请输入注册邮箱"
        />
      </el-form-item>
      <p class="login__hint">验证码将发送到该邮箱，请确认邮箱可正常接收</p>
    </el-form>
    <el-form v-else label-width="90px" @submit.prevent="handleConfirmReset">
      <!-- 隐藏原生 submit 按钮：多输入框表单须存在提交按钮才能触发 Enter 隐式提交（HTML 标准，四大浏览器行为一致） -->
      <button type="submit" hidden tabindex="-1" aria-hidden="true"></button>
      <el-form-item label="验证码" required>
        <el-input
          ref="forgotCodeInputRef"
          v-model="forgotForm.verificationCode"
          placeholder="邮箱收到的 6 位验证码"
        />
      </el-form-item>
      <p class="login__hint forgot-resend">
        <span>没有收到？</span>
        <button
          type="button"
          class="forgot-resend__btn"
          :disabled="forgotSending || resendLeft > 0"
          @click="handleSendResetEmail"
        >
          {{ resendLeft > 0 ? `重新发送（${resendLeft}s）` : '重新发送' }}
        </button>
        <button type="button" class="forgot-resend__btn" @click="forgotStep = 1">
          返回修改邮箱
        </button>
      </p>
      <el-form-item label="新密码" required>
        <el-input
          ref="forgotPasswordInputRef"
          v-model="forgotForm.newPassword"
          type="password"
          show-password
          placeholder="6-32 位，含大小写字母、数字与特殊字符"
        />
        <p
          v-if="passwordStrengthHint"
          class="login__hint"
          :class="{ 'is-error': !passwordStrengthHint.valid }"
        >
          {{ passwordStrengthHint.valid ? '密码强度符合要求' : passwordStrengthHint.message }}
        </p>
      </el-form-item>
      <el-form-item label="确认密码" required>
        <el-input
          ref="forgotConfirmInputRef"
          v-model="forgotForm.confirmPassword"
          type="password"
          show-password
          placeholder="再次输入新密码"
        />
        <p
          v-if="passwordMatchHint"
          class="login__hint"
          :class="{ 'is-error': passwordMatchHint !== '两次输入一致' }"
        >
          {{ passwordMatchHint }}
        </p>
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
</template>

<style scoped lang="scss">
/* 改密弹窗内的提示文案样式（原先复用登录页 .login__hint） */
.login__hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--login-text-faint);
  transition: color 0.5s ease;
}

/* 密码强度 / 两次一致提示：el-form-item 内容为 flex 行，需允许换行并占满整行 */
:deep(.el-form-item__content) {
  flex-wrap: wrap;
}
.login__hint.is-error {
  color: var(--el-color-danger);
}

/* 「重新发送 / 返回修改邮箱」一行，与 label-width 90px 的表单左对齐 */
.forgot-resend {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: -8px 0 12px;
  padding-left: 90px;
}
.forgot-resend__btn {
  padding: 0;
  border: none;
  background: none;
  font-size: 12px;
  color: var(--el-color-primary);
  cursor: pointer;
}
.forgot-resend__btn:disabled {
  color: var(--el-text-color-disabled);
  cursor: not-allowed;
}
</style>
