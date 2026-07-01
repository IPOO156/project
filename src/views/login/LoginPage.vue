<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import LineIcon from '../../components/ui/LineIcon.vue'

const router = useRouter()

const role = ref('')
const studentId = ref('')
const password = ref('')
const error = ref('')

const roles = [
  { key: 'student', label: '学生端', icon: 'user', desc: '查看档案、提交材料、跟踪审核', color: '#1a8a7a' },
  { key: 'teacher', label: '教师端', icon: 'users', desc: '审核档案、统计分析、数据管理', color: '#0d2b36' },
]

function handleLogin() {
  if (!role.value) {
    error.value = '请选择登录角色'
    return
  }
  if (!studentId.value.trim()) {
    error.value = '请输入学号/工号'
    return
  }
  if (!password.value.trim()) {
    error.value = '请输入密码'
    return
  }

  error.value = ''
  if (role.value === 'student') {
    router.push('/student/dashboard')
  } else {
    router.push('/teacher/dashboard')
  }
}
</script>

<template>
  <div class="loginPage">
    <div class="loginCard">
      <div class="loginBrand">
        <div class="brandLogo">
          <LineIcon name="book" :size="28" />
        </div>
        <h1 class="brandTitle">档案管理系统</h1>
        <p class="brandDesc">学生成长档案综合管理平台</p>
      </div>

      <div class="rolePicker">
        <button
          v-for="r in roles"
          :key="r.key"
          class="roleBtn"
          :class="{ active: role === r.key }"
          type="button"
          @click="role = r.key; error = ''"
        >
          <span class="roleIcon" :style="{ background: r.color }">
            <LineIcon :name="r.icon" :size="18" />
          </span>
          <span class="roleInfo">
            <span class="roleLabel">{{ r.label }}</span>
            <span class="roleDesc">{{ r.desc }}</span>
          </span>
        </button>
      </div>

      <div class="form">
        <label class="field">
          <span class="fieldLabel">{{ role === 'teacher' ? '工号' : '学号' }}</span>
          <input v-model="studentId" class="fieldInput" :placeholder="`请输入${role === 'teacher' ? '工号' : '学号'}`" />
        </label>
        <label class="field">
          <span class="fieldLabel">密码</span>
          <input v-model="password" class="fieldInput" type="password" placeholder="请输入密码" @keyup.enter="handleLogin" />
        </label>

        <div v-if="error" class="formError">{{ error }}</div>

        <button class="loginBtn" type="button" @click="handleLogin">
          登 录
        </button>
      </div>

      <div class="loginFooter">
        <span>演示环境 · 任意账号即可登录</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loginPage {
  min-height: 100svh;
  display: grid;
  place-items: center;
  background: var(--bg);
  padding: 24px;
}

.loginCard {
  width: min(420px, 100%);
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  padding: 40px 36px;
}

.loginBrand {
  text-align: center;
  margin-bottom: 32px;
}

.brandLogo {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin: 0 auto 16px;
}

.brandTitle {
  font-size: 24px;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 6px;
}

.brandDesc {
  font-size: 14px;
  color: var(--muted);
}

.rolePicker {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.roleBtn {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 2px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--panel);
  cursor: pointer;
  transition: all var(--transition);
  text-align: left;
}

.roleBtn:hover {
  border-color: var(--accent);
  background: var(--accent-light);
}

.roleBtn.active {
  border-color: var(--accent);
  background: var(--accent-light);
}

.roleIcon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.roleInfo {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.roleLabel {
  font-weight: 700;
  font-size: 14px;
  color: var(--text);
}

.roleDesc {
  font-size: 11px;
  color: var(--muted);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.fieldLabel {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
}

.fieldInput {
  min-height: 44px;
  padding: 11px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: #f8fafb;
  color: var(--text);
  font-size: 14px;
  outline: none;
  transition: all var(--transition);
}

.fieldInput:focus {
  border-color: var(--accent);
  background: var(--panel);
}

.formError {
  font-size: 13px;
  color: var(--danger);
  background: var(--danger-light);
  padding: 10px 12px;
  border-radius: var(--radius);
}

.loginBtn {
  width: 100%;
  min-height: 46px;
  border: none;
  border-radius: var(--radius);
  background: var(--accent);
  color: white;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition);
  letter-spacing: 4px;
}

.loginBtn:hover {
  background: var(--accent-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.loginBtn:active {
  transform: none;
}

.loginFooter {
  margin-top: 24px;
  text-align: center;
  font-size: 12px;
  color: var(--muted);
}
</style>
