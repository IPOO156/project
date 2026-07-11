<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { Lock } from 'lucide-vue-next'
import { ref } from 'vue'

const teacherList = ref([
  {
    id: 1,
    name: '李老师',
    username: 'li_laoshi',
    role: '管理员',
    college: '计算机学院',
    status: 'active',
  },
  {
    id: 2,
    name: '王老师',
    username: 'wang_laoshi',
    role: '审核员',
    college: '计算机学院',
    status: 'active',
  },
  {
    id: 3,
    name: '赵老师',
    username: 'zhao_laoshi',
    role: '课任教师',
    college: '数学学院',
    status: 'active',
  },
])

const passwordDialogVisible = ref(false)
const currentTeacher = ref<any>(null)
const newPassword = ref('')

function changePassword(teacher: any) {
  currentTeacher.value = teacher
  newPassword.value = ''
  passwordDialogVisible.value = true
}

function savePassword() {
  if (newPassword.value.length < 6) {
    ElMessage.warning('密码长度至少6位')
    return
  }
  ElMessage.success('密码已重置')
  passwordDialogVisible.value = false
}
</script>

<template>
  <div class="teacher-account">
    <el-card>
      <template #header><span class="section-title">教师账号列表</span></template>
      <el-table :data="teacherList" stripe>
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="username" label="用户名" width="140" />
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }"
            ><el-tag
              :type="row.role === '管理员' ? 'danger' : row.role === '审核员' ? 'warning' : 'info'"
              size="small"
              >{{ row.role }}</el-tag
            ></template
          >
        </el-table-column>
        <el-table-column prop="college" label="学院" width="150" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }"
            ><el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">{{
              row.status === 'active' ? '正常' : '停用'
            }}</el-tag></template
          >
        </el-table-column>
        <el-table-column label="操作" width="160">
          <template #default="{ row }">
            <el-button size="small" :icon="Lock" @click="changePassword(row)">重置密码</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="passwordDialogVisible" title="重置密码" width="400px">
      <el-form>
        <el-form-item label="教师"
          >{{ currentTeacher?.name }}（{{ currentTeacher?.username }}）</el-form-item
        >
        <el-form-item label="新密码" required>
          <el-input
            v-model="newPassword"
            type="password"
            show-password
            placeholder="输入新密码（至少6位）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePassword">确认重置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.teacher-account {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
</style>
