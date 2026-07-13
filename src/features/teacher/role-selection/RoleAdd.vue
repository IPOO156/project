<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { UserPlus } from 'lucide-vue-next'
import { reactive, ref } from 'vue'

const form = reactive({
  username: '',
  realName: '',
  password: '',
  confirmPassword: '',
  role: 'admin' as string,
  college: '',
  major: '',
  email: '',
  phone: '',
})

const collegeOptions = ['计算机学院', '数学学院', '物理学院', '外语学院']
const majorOptions = ['计算机科学与技术', '软件工程', '数学与应用数学', '英语']

const accountList = ref([
  {
    id: 1,
    username: 'li_laoshi',
    realName: '李老师',
    role: '管理员',
    college: '计算机学院',
    createdAt: '2026-06-01',
  },
  {
    id: 2,
    username: 'wang_laoshi',
    realName: '王老师',
    role: '审核员',
    college: '数学学院',
    createdAt: '2026-06-15',
  },
])

function handleAdd() {
  if (form.password !== form.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    return
  }
  ElMessage.success('账号添加成功')
  accountList.value.unshift({
    id: Date.now(),
    username: form.username,
    realName: form.realName,
    role: form.role === 'admin' ? '管理员' : '审核员',
    college: form.college,
    createdAt: new Date().toISOString().slice(0, 10),
  })
  Object.assign(form, {
    username: '',
    realName: '',
    password: '',
    confirmPassword: '',
    role: 'admin',
    college: '',
    major: '',
    email: '',
    phone: '',
  })
  addDialogVisible.value = false
}

function handleDelete(id: number) {
  accountList.value = accountList.value.filter((a) => a.id !== id)
  ElMessage.success('账号已删除')
}

const addDialogVisible = ref(false)
</script>

<template>
  <div class="role-add">
    <el-card class="role-add__header">
      <el-row :gutter="16" justify="space-between" align="middle">
        <el-col :span="12">
          <span class="section-title">账号列表</span>
        </el-col>
        <el-col :span="12" style="text-align: right">
          <el-button type="primary" :icon="UserPlus" @click="addDialogVisible = true"
            >新增账号</el-button
          >
        </el-col>
      </el-row>
    </el-card>

    <el-card>
      <el-table :data="accountList" stripe>
        <el-table-column prop="realName" label="姓名" width="120" />
        <el-table-column prop="username" label="用户名" width="140" />
        <el-table-column prop="role" label="账号类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.role === '管理员' ? 'danger' : 'warning'" size="small">{{
              row.role
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="college" label="所属学院" width="150" />
        <el-table-column prop="createdAt" label="创建时间" width="120" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button link type="danger" size="small" @click="handleDelete(row.id)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="addDialogVisible" title="新增账号" width="550px">
      <el-form :model="form" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="用户名" required>
              <el-input v-model="form.username" placeholder="登录用户名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="真实姓名" required>
              <el-input v-model="form.realName" placeholder="教师真实姓名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="密码" required>
              <el-input v-model="form.password" type="password" show-password />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="确认密码" required>
              <el-input v-model="form.confirmPassword" type="password" show-password />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="账号类型" required>
          <el-radio-group v-model="form.role">
            <el-radio value="admin">管理员</el-radio>
            <el-radio value="reviewer">审核员</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="学院">
              <el-select v-model="form.college" placeholder="选择学院" style="width: 100%">
                <el-option v-for="c in collegeOptions" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="专业">
              <el-select v-model="form.major" placeholder="选择专业" style="width: 100%">
                <el-option v-for="m in majorOptions" :key="m" :label="m" :value="m" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="邮箱">
              <el-input v-model="form.email" placeholder="邮箱地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机">
              <el-input v-model="form.phone" placeholder="手机号码" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAdd">确定添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.role-add {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
  &__header {
    margin-bottom: 0;
  }
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
</style>
