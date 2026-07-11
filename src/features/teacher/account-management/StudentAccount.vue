<script setup lang="ts">
import { ElMessage } from 'element-plus'
/**
 * StudentAccount - 学生账号管理
 * 选择账号→查看信息→修改密码/权限/基础信息
 */
import { Eye, Lock, Pencil } from 'lucide-vue-next'
import { ref } from 'vue'

const search = ref({ keyword: '', grade: '', major: '' })
const studentList = ref([
  {
    id: 1,
    name: '张三',
    studentId: '2024060001',
    className: '计科2401班',
    status: 'active',
    lastLogin: '2026-07-08',
  },
  {
    id: 2,
    name: '李四',
    studentId: '2024060002',
    className: '计科2401班',
    status: 'active',
    lastLogin: '2026-07-07',
  },
  {
    id: 3,
    name: '王五',
    studentId: '2024060003',
    className: '计科2401班',
    status: 'inactive',
    lastLogin: '2026-06-20',
  },
])

const detailDialogVisible = ref(false)
const editDialogVisible = ref(false)
const passwordDialogVisible = ref(false)
const currentStudent = ref<any>(null)
const editForm = ref({ name: '', email: '', phone: '', status: '' })
const newPassword = ref('')

function viewDetail(student: any) {
  currentStudent.value = student
  detailDialogVisible.value = true
}

function editInfo(student: any) {
  currentStudent.value = student
  editForm.value = {
    name: student.name,
    email: `${student.studentId}@edu.cn`,
    phone: '138****0000',
    status: student.status,
  }
  editDialogVisible.value = true
}

function saveEdit() {
  ElMessage.success('信息已更新')
  editDialogVisible.value = false
}

function changePassword(student: any) {
  currentStudent.value = student
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
  <div class="student-account">
    <el-card class="student-account__filters">
      <el-row :gutter="16">
        <el-col :span="6"
          ><el-input v-model="search.keyword" placeholder="搜索姓名/学号" clearable
        /></el-col>
        <el-col :span="4"
          ><el-select v-model="search.grade" placeholder="年级" clearable style="width: 100%">
            <el-option label="2024级" value="2024级" />
            <el-option label="2023级" value="2023级" /> </el-select
        ></el-col>
        <el-col :span="4"
          ><el-select v-model="search.major" placeholder="专业" clearable style="width: 100%">
            <el-option label="计算机科学与技术" value="计算机科学与技术" />
            <el-option label="软件工程" value="软件工程" /> </el-select
        ></el-col>
        <el-col :span="4"><el-button type="primary">查询</el-button></el-col>
      </el-row>
    </el-card>

    <el-card>
      <template #header><span class="section-title">学生账号列表</span></template>
      <el-table :data="studentList" stripe>
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="studentId" label="学号" width="140" />
        <el-table-column prop="className" label="班级" width="140" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '正常' : '未激活' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastLogin" label="上次登录" width="120" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" :icon="Eye" @click="viewDetail(row)">查看</el-button>
            <el-button size="small" :icon="Pencil" @click="editInfo(row)">编辑</el-button>
            <el-button size="small" :icon="Lock" @click="changePassword(row)">重置密码</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="detailDialogVisible" title="学生详情" width="500px">
      <el-descriptions v-if="currentStudent" :column="2" border size="small">
        <el-descriptions-item label="姓名">{{ currentStudent.name }}</el-descriptions-item>
        <el-descriptions-item label="学号">{{ currentStudent.studentId }}</el-descriptions-item>
        <el-descriptions-item label="班级">{{ currentStudent.className }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{
          currentStudent.status === 'active' ? '正常' : '未激活'
        }}</el-descriptions-item>
        <el-descriptions-item label="邮箱"
          >{{ currentStudent.studentId }}@edu.cn</el-descriptions-item
        >
        <el-descriptions-item label="上次登录">{{ currentStudent.lastLogin }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="editDialogVisible" title="编辑信息" width="450px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="姓名"><el-input v-model="editForm.name" /></el-form-item>
        <el-form-item label="邮箱"><el-input v-model="editForm.email" /></el-form-item>
        <el-form-item label="手机"><el-input v-model="editForm.phone" /></el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="editForm.status" active-value="active" inactive-value="inactive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="passwordDialogVisible" title="重置密码" width="400px">
      <el-form>
        <el-form-item label="学生"
          >{{ currentStudent?.name }}（{{ currentStudent?.studentId }}）</el-form-item
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
.student-account {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
  &__filters {
    margin-bottom: 0;
  }
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
</style>
