<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { reactive, ref, watch } from 'vue'
import { confirmPasswordReset, requestPasswordReset } from '@/shared/api/teacher-api'
import { validatePasswordStrength } from '@/shared/utils/validatePassword'

/** 弹窗显隐（v-model），由登录页控制 */
const forgotDialogVisible = defineModel<boolean>({ required: true })

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

/** 每次打开都回到第一步并清空输入（与原先 openForgotDialog 的行为一致） */
watch(forgotDialogVisible, (visible) => {
  if (!visible) return
  forgotStep.value = 1
  forgotForm.email = ''
  forgotForm.verificationCode = ''
  forgotForm.newPassword = ''
  forgotForm.confirmPassword = ''
})

async function handleSendResetEmail() {
  if (forgotSending.value) return
  if (!forgotForm.email.trim()) {
    ElMessage.warning('请输入注册邮箱')
    forgotEmailInputRef.value?.input?.focus()
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
      <el-form-item label="新密码" required>
        <el-input
          ref="forgotPasswordInputRef"
          v-model="forgotForm.newPassword"
          type="password"
          show-password
          placeholder="6-32 位，含大小写字母、数字与特殊字符"
        />
      </el-form-item>
      <el-form-item label="确认密码" required>
        <el-input
          ref="forgotConfirmInputRef"
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
</style>
