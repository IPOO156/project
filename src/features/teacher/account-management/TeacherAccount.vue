<script setup lang="ts">
/**
 * TeacherAccount - 教师账号管理
 *
 * 后端现状：账号列表接口（/admin/users）尚未实现，列表区展示待就绪空态；
 * 重置密码的交互已按契约预留。
 */
import { Search, Users } from 'lucide-vue-next'
import { reactive, ref } from 'vue'

import { useTeacherMe } from '@/shared/composables/useTeacherMe'

const { me } = useTeacherMe()

const colleges = [
  ...new Set(
    (me.value?.scopes ?? [])
      .filter((s) => s.scopeType === 2)
      .map((s) => s.scopeName)
      .filter((n): n is string => Boolean(n)),
  ),
]

const search = reactive({ keyword: '', college: '' })

const passwordDialogVisible = ref(false)
const currentTeacher = ref<{ name: string; username: string } | null>(null)
</script>

<template>
  <div class="mc-page">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <p class="mc-page-head__eyebrow">账号管理 · Teachers</p>
        <h2 class="mc-page-head__title">教师账号管理</h2>
        <p class="mc-page-head__desc">
          查看教师账号信息，修改密码、权限与信息。账号列表由后端 /admin/users 提供。
        </p>
      </div>
    </div>

    <div class="mc-filter-bar">
      <el-form inline @submit.prevent>
        <el-form-item label="关键词">
          <el-input
            v-model="search.keyword"
            placeholder="教师姓名 / 用户名"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="学院">
          <el-select v-model="search.college" placeholder="全部学院" clearable style="width: 150px">
            <el-option v-for="c in colleges" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search">查询</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="mc-card">
      <div class="mc-card__head">
        <span class="mc-card__title">教师账号列表</span>
      </div>
      <div class="mc-card__body">
        <div class="mc-empty">
          <div class="mc-empty__icon"><Users :size="24" /></div>
          <p class="mc-empty__title">教师账号数据待后端就绪</p>
          <p class="mc-empty__desc">
            查看、修改密码与权限的操作已按契约预留，账号列表接口（/admin/users）就绪后自动加载。
          </p>
        </div>
      </div>
    </div>

    <el-dialog v-model="passwordDialogVisible" title="重置密码" width="400px">
      <el-form>
        <el-form-item label="教师">
          {{ currentTeacher?.name }}（{{ currentTeacher?.username }}）
        </el-form-item>
        <el-form-item label="新密码" required>
          <el-input type="password" show-password placeholder="输入新密码（至少 6 位）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary">确认重置</el-button>
      </template>
    </el-dialog>
  </div>
</template>
