<script setup lang="ts">
import { ElMessage } from 'element-plus'
/**
 * LogView - 日志查看
 * 管理员：筛选条件（年级→学院→专业→时间）→ 查看操作记录
 * 审核员/课任教师：筛选时间 → 查看全部操作记录
 */
import { Eye, RefreshCw, Search } from 'lucide-vue-next'
import { computed, ref } from 'vue'

import { useUserStore } from '@/app/stores/stores'

const userStore = useUserStore()
const isAdmin = computed(() => userStore.isAdmin || userStore.isSuperAdmin)

const filters = ref({
  grade: '',
  college: '',
  major: '',
  dateRange: [] as string[],
})

const logList = ref([
  {
    id: 1,
    user: '管理员-李老师',
    role: '管理员',
    action: '导出2024级学生基本信息',
    target: '2024级全校',
    ip: '192.168.1.100',
    time: '2026-07-08 10:32:15',
    status: 'success',
  },
  {
    id: 2,
    user: '审核员-王老师',
    role: '审核员',
    action: '通过张三的竞赛之星申报',
    target: '张三(2024060001)',
    ip: '192.168.1.101',
    time: '2026-07-08 10:15:42',
    status: 'approved',
  },
  {
    id: 3,
    user: '课任教师-刘老师',
    role: '课任教师',
    action: '查看计科2401班档案',
    target: '计科2401班',
    ip: '192.168.1.102',
    time: '2026-07-08 09:48:20',
    status: 'info',
  },
  {
    id: 4,
    user: '管理员-赵老师',
    role: '管理员',
    action: '修改学生密码',
    target: '李四(2024060002)',
    ip: '192.168.1.103',
    time: '2026-07-08 09:22:05',
    status: 'success',
  },
  {
    id: 5,
    user: '审核员-钱老师',
    role: '审核员',
    action: '驳回王五的社会实践申报',
    target: '王五(2024060003)',
    ip: '192.168.1.104',
    time: '2026-07-08 08:55:33',
    status: 'rejected',
  },
  {
    id: 6,
    user: '管理员-李老师',
    role: '管理员',
    action: '新增管理员账号',
    target: '孙老师',
    ip: '192.168.1.100',
    time: '2026-07-07 17:20:10',
    status: 'success',
  },
  {
    id: 7,
    user: '系统',
    role: '系统',
    action: '每日数据备份完成',
    target: '数据库',
    ip: '-',
    time: '2026-07-08 03:00:00',
    status: 'info',
  },
  {
    id: 8,
    user: '课任教师-刘老师',
    role: '课任教师',
    action: '下载成绩汇总表',
    target: '软件2401班',
    ip: '192.168.1.102',
    time: '2026-07-07 16:10:45',
    status: 'success',
  },
])

const gradeOptions = ['2024级', '2023级', '2022级', '2021级']
const collegeOptions = ['计算机学院', '数学学院', '物理学院', '外语学院']

const statusMap: Record<string, { label: string; type: string }> = {
  success: { label: '成功', type: 'success' },
  approved: { label: '通过', type: 'success' },
  rejected: { label: '驳回', type: 'danger' },
  info: { label: '信息', type: 'info' },
}

function handleSearch() {
  ElMessage.success('查询完成')
}
</script>

<template>
  <div class="log-view">
    <!-- 筛选条件 -->
    <el-card class="log-view__filters">
      <el-row :gutter="16">
        <el-col v-if="isAdmin" :xs="12" :sm="6" :md="4">
          <el-form-item label="年级">
            <el-select v-model="filters.grade" placeholder="选择年级" clearable style="width: 100%">
              <el-option v-for="g in gradeOptions" :key="g" :label="g" :value="g" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col v-if="isAdmin" :xs="12" :sm="6" :md="5">
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
        <el-col v-if="isAdmin && filters.college" :xs="12" :sm="6" :md="4">
          <el-form-item label="专业">
            <el-select v-model="filters.major" placeholder="选择专业" clearable style="width: 100%">
              <el-option label="计算机科学与技术" value="计算机科学与技术" />
              <el-option label="软件工程" value="软件工程" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="12" :sm="8" :md="6">
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="filters.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :xs="12" :sm="4" :md="3">
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        </el-col>
        <el-col :xs="12" :sm="4" :md="2">
          <el-button :icon="RefreshCw" @click="handleSearch">刷新</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 日志列表 -->
    <el-card class="log-view__list">
      <template #header>
        <div class="log-view__header">
          <span class="section-title">操作记录</span>
          <span class="log-view__total">共 {{ logList.length }} 条记录</span>
        </div>
      </template>

      <el-table :data="logList" stripe style="width: 100%">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="user" label="操作人" width="140" />
        <el-table-column prop="role" label="角色" width="90">
          <template #default="{ row }">
            <el-tag size="small">{{ row.role }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="action" label="操作内容" min-width="220" />
        <el-table-column prop="target" label="操作对象" width="160" />
        <el-table-column prop="ip" label="IP 地址" width="140">
          <template #default="{ row }">
            <code class="log-view__ip">{{ row.ip }}</code>
          </template>
        </el-table-column>
        <el-table-column prop="time" label="操作时间" width="170" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag
              :type="statusMap[row.status]?.type as 'success' | 'warning' | 'danger' | 'info'"
              size="small"
            >
              {{ statusMap[row.status]?.label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default>
            <el-button link type="primary" size="small" :icon="Eye">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="log-view__pagination">
        <el-pagination :total="256" :page-size="10" layout="prev, pager, next, total" small />
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.log-view {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;

  &__filters {
    margin-bottom: 0;
  }

  &__list {
    margin-bottom: 0;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__total {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  &__ip {
    font-size: 12px;
    background: var(--el-fill-color-light);
    padding: 2px 6px;
    border-radius: 3px;
    color: var(--el-text-color-secondary);
  }

  &__pagination {
    margin-top: $spacing-lg;
    display: flex;
    justify-content: flex-end;
  }
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
</style>
