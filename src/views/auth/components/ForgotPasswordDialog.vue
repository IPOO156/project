<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { X } from 'lucide-vue-next'
import { computed, onBeforeUnmount, ref } from 'vue'
import { confirmPasswordReset, sendPasswordResetCode } from '@/shared/api/auth'
import { validatePasswordStrength } from '@/shared/utils/validatePassword'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}>()

const EMAIL_PATTERN = /^[\w.%+-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)+$/i

const email = ref('')
const verificationCode = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const sending = ref(false)
const submitting = ref(false)
const cooldown = ref(0)
let cooldownTimer: number | null = null

const passwordStrength = computed(() =>
  newPassword.value ? validatePasswordStrength(newPassword.value) : null,
)

function stopCooldown() {
  if (cooldownTimer !== null) {
    window.clearInterval(cooldownTimer)
    cooldownTimer = null
  }
}

function startCooldown(seconds: number) {
  stopCooldown()
  cooldown.value = seconds
  cooldownTimer = window.setInterval(() => {
    cooldown.value -= 1
    if (cooldown.value <= 0) stopCooldown()
  }, 1000)
}

function close() {
  emit('update:modelValue', false)
}

function validateEmail(): boolean {
  if (!email.value.trim()) {
    ElMessage.warning('请输入邮箱')
    return false
  }
  if (!EMAIL_PATTERN.test(email.value.trim())) {
    ElMessage.warning('请输入正确的邮箱')
    return false
  }
  return true
}

async function handleSendCode() {
  if (sending.value || cooldown.value > 0) return
  if (!validateEmail()) return
  sending.value = true
  try {
    await sendPasswordResetCode(email.value.trim())
    ElMessage.success('验证码已发送，请查收邮箱')
    startCooldown(60)
  } catch {
    // 失败提示由请求拦截器统一弹出
  } finally {
    sending.value = false
  }
}

async function handleSubmit() {
  if (submitting.value) return
  if (!validateEmail()) return
  if (!/^\d{6}$/.test(verificationCode.value.trim())) {
    ElMessage.warning('请输入 6 位数字验证码')
    return
  }
  if (!newPassword.value) {
    ElMessage.warning('请输入新密码')
    return
  }
  const strength = validatePasswordStrength(newPassword.value)
  if (!strength.valid) {
    ElMessage.warning(strength.message)
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    ElMessage.warning('两次输入的新密码不一致')
    return
  }

  submitting.value = true
  try {
    await confirmPasswordReset({
      email: email.value.trim(),
      verificationCode: verificationCode.value.trim(),
      newPassword: newPassword.value,
      confirmPassword: confirmPassword.value,
    })
    ElMessage.success('密码重置成功，请使用新密码登录')
    email.value = ''
    verificationCode.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    stopCooldown()
    cooldown.value = 0
    emit('success')
    close()
  } catch {
    // 失败提示由请求拦截器统一弹出
  } finally {
    submitting.value = false
  }
}

onBeforeUnmount(stopCooldown)
</script>

<template>
  <Teleport to="body">
    <Transition name="forgot-fade">
      <div v-if="props.modelValue" class="forgot" @click.self="close">
        <div class="forgot__dialog" role="dialog" aria-modal="true" aria-labelledby="forgot-title">
          <button type="button" class="forgot__close" aria-label="关闭" @click="close">
            <X :size="18" />
          </button>

          <h2 id="forgot-title" class="forgot__title">重置登录密码</h2>
          <p class="forgot__desc">填写注册时使用的邮箱，我们会发送 6 位验证码。</p>

          <form @submit.prevent="handleSubmit">
            <label class="forgot__field">
              <span class="forgot__label">邮箱</span>
              <div class="forgot__email-row">
                <el-input
                  v-model="email"
                  size="large"
                  maxlength="255"
                  placeholder="请输入注册邮箱"
                />
                <el-button
                  native-type="button"
                  :loading="sending"
                  :disabled="cooldown > 0"
                  class="forgot__code-btn"
                  @click="handleSendCode"
                >
                  {{ cooldown > 0 ? `${cooldown}s 后重发` : '发送验证码' }}
                </el-button>
              </div>
            </label>

            <label class="forgot__field">
              <span class="forgot__label">验证码</span>
              <el-input
                v-model="verificationCode"
                size="large"
                maxlength="6"
                placeholder="请输入邮箱中的 6 位验证码"
              />
            </label>

            <label class="forgot__field">
              <span class="forgot__label">新密码</span>
              <el-input
                v-model="newPassword"
                type="password"
                size="large"
                show-password
                autocomplete="new-password"
                placeholder="请输入新密码"
              />
            </label>
            <p
              v-if="passwordStrength"
              class="forgot__hint"
              :class="{ 'is-error': !passwordStrength.valid }"
            >
              {{ passwordStrength.valid ? '密码强度符合要求' : passwordStrength.message }}
            </p>

            <label class="forgot__field">
              <span class="forgot__label">确认新密码</span>
              <el-input
                v-model="confirmPassword"
                type="password"
                size="large"
                show-password
                autocomplete="new-password"
                placeholder="请再次输入新密码"
              />
            </label>

            <el-button
              type="primary"
              native-type="submit"
              :loading="submitting"
              class="forgot__submit"
            >
              重置密码
            </el-button>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.forgot {
  position: fixed;
  inset: 0;
  z-index: 2100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(3px);

  &__dialog {
    position: relative;
    width: min(100%, 420px);
    max-height: calc(100vh - 40px);
    overflow-y: auto;
    padding: 28px 28px 26px;
    border-radius: 10px;
    background: #fff;
    box-shadow: 0 20px 60px rgba(15, 23, 42, 0.24);
  }

  &__close {
    position: absolute;
    top: 14px;
    right: 14px;
    display: inline-flex;
    padding: 4px;
    border: 0;
    border-radius: 4px;
    background: none;
    color: #64748b;
    cursor: pointer;

    &:hover {
      background: #f1f5f9;
      color: #1e293b;
    }
  }

  &__title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #0f172a;
  }

  &__desc {
    margin: 8px 0 20px;
    font-size: 13px;
    line-height: 1.7;
    color: #64748b;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
  }

  &__label {
    font-size: 13px;
    font-weight: 500;
    color: #334155;
  }

  &__email-row {
    display: flex;
    gap: 8px;

    :deep(.el-input) {
      flex: 1;
    }
  }

  &__code-btn {
    flex-shrink: 0;
    min-width: 108px;
  }

  &__hint {
    margin: -8px 0 14px;
    font-size: 12px;
    color: #64748b;

    &.is-error {
      color: #dc2626;
    }
  }

  &__submit {
    width: 100%;
    height: 44px;
    margin-top: 6px;
    border: 0;
    border-radius: 6px;
    background: #1d4ed8;
    font-size: 15px;
    font-weight: 600;

    &:hover {
      background: #1a44bd;
    }
  }

  :deep(.el-input__wrapper) {
    min-height: 42px;
    border-radius: 6px;
    box-shadow: 0 0 0 1px #dbe3ec inset;

    &:hover {
      box-shadow: 0 0 0 1px #c3cedb inset;
    }

    &.is-focus {
      box-shadow:
        0 0 0 1px #2563eb inset,
        0 0 0 3px rgba(37, 99, 235, 0.12);
    }
  }
}

.forgot-fade-enter-active,
.forgot-fade-leave-active {
  transition: opacity 0.2s ease;
}

.forgot-fade-enter-from,
.forgot-fade-leave-to {
  opacity: 0;
}
</style>
