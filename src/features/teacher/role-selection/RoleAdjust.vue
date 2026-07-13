<script setup lang="ts">
import { ElMessage } from 'element-plus'
/**
 * RoleAdjust - 教师职位调整
 * 筛选路径：选择学院→选择专业→选择教师→修改职位
 */
import { ref } from 'vue'

const filters = ref({ college: '', major: '', teacher: '' })
const collegeOptions = ['计算机学院', '数学学院', '物理学院', '外语学院']
const majorOptions = ['计算机科学与技术', '软件工程', '数学与应用数学', '物理学']
const teacherOptions = ['李老师', '王老师', '赵老师', '刘老师', '陈老师']
const teacherList = ref([
  {
    id: 1,
    name: '李老师',
    college: '计算机学院',
    major: '计算机科学与技术',
    currentRole: '课任教师',
    editable: true,
  },
  {
    id: 2,
    name: '王老师',
    college: '计算机学院',
    major: '软件工程',
    currentRole: '课任教师',
    editable: true,
  },
  {
    id: 3,
    name: '赵老师',
    college: '数学学院',
    major: '数学与应用数学',
    currentRole: '管理员',
    editable: true,
  },
  {
    id: 4,
    name: '刘老师',
    college: '外语学院',
    major: '英语',
    currentRole: '审核员',
    editable: true,
  },
])

const roleOptions = ['管理员', '审核员', '课任教师']
const editDialogVisible = ref(false)
const currentTeacher = ref<any>(null)
const selectedRole = ref('')

function handleEdit(teacher: any) {
  currentTeacher.value = teacher
  selectedRole.value = teacher.currentRole
  editDialogVisible.value = true
}

function handleSave() {
  if (currentTeacher.value) {
    currentTeacher.value.currentRole = selectedRole.value
    ElMessage.success(`${currentTeacher.value.name} 的职位已修改为 ${selectedRole.value}`)
    editDialogVisible.value = false
  }
}
</script>

<template>
  <div class="role-adjust">
    <!-- 筛选 -->
    <el-card class="role-adjust__filters">
      <el-row :gutter="16">
        <el-col :xs="8" :sm="6">
          <el-form-item label="学院">
            <el-select
              v-model="filters.college"
              placeholder="选择学院"
              clearable
              style="width: 100%"
            >
              <el-option v-for="c in collegeOptions" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="8" :sm="6">
          <el-form-item label="专业">
            <el-select v-model="filters.major" placeholder="选择专业" clearable style="width: 100%">
              <el-option v-for="m in majorOptions" :key="m" :label="m" :value="m" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="8" :sm="6">
          <el-form-item label="教师">
            <el-select
              v-model="filters.teacher"
              placeholder="选择教师"
              clearable
              style="width: 100%"
            >
              <el-option v-for="t in teacherOptions" :key="t" :label="t" :value="t" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="8" :sm="6">
          <el-button type="primary">查询</el-button>
          <el-button>重置</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 教师列表 -->
    <el-card>
      <template #header>
        <span class="section-title">教师列表</span>
      </template>
      <el-table :data="teacherList" stripe>
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="college" label="学院" width="140" />
        <el-table-column prop="major" label="专业" width="180" />
        <el-table-column prop="currentRole" label="当前职位" width="120">
          <template #default="{ row }">
            <el-tag
              :type="
                row.currentRole === '管理员'
                  ? 'danger'
                  : row.currentRole === '审核员'
                    ? 'warning'
                    : 'info'
              "
              size="small"
            >
              {{ row.currentRole }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button v-if="row.editable" type="primary" size="small" @click="handleEdit(row)">
              修改职位
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 修改职位弹窗 -->
    <el-dialog v-model="editDialogVisible" title="修改职位" width="400px">
      <el-form v-if="currentTeacher">
        <el-form-item label="教师">
          <el-input :model-value="currentTeacher.name" disabled />
        </el-form-item>
        <el-form-item label="当前职位">
          <el-input :model-value="currentTeacher.currentRole" disabled />
        </el-form-item>
        <el-form-item label="修改为">
          <el-select v-model="selectedRole" style="width: 100%">
            <el-option v-for="r in roleOptions" :key="r" :label="r" :value="r" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.role-adjust {
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
