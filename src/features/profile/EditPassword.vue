<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const loading = ref(false)

function handleSubmit() {
  if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
    ElMessage.warning('请填写完整信息')
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.error('两次密码输入不一致')
    return
  }
  if (passwordForm.newPassword.length < 6) {
    ElMessage.warning('新密码长度不能少于6位')
    return
  }

  loading.value = true
  setTimeout(() => {
    ElMessage.success('密码修改成功')
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    loading.value = false
  }, 800)
}
</script>

<template>
  <div class="edit-password">
    <el-card>
      <template #header>
        <span class="card-title">修改密码</span>
      </template>

      <el-form
        :model="passwordForm"
        label-width="100px"
        class="edit-password__form"
        @keyup.enter="handleSubmit"
      >
        <el-form-item label="原密码" required>
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            placeholder="请输入原密码"
            show-password
            class="form-input--password"
          />
        </el-form-item>
        <el-form-item label="新密码" required>
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码（至少6位）"
            show-password
            class="form-input--password"
          />
        </el-form-item>
        <el-form-item label="确认密码" required>
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
            class="form-input--password"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit"> 确认修改 </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.edit-password {
  max-width: 640px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.edit-password__form {
  padding-top: 20px;
}

.form-input--password {
  max-width: 400px;
}
</style>
