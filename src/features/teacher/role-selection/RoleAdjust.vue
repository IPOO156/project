<script setup lang="ts">
/**
 * RoleAdjust - 管理权限 · 职位调整
 *
 * 后端现状：/admin/permissions/** 已提供「用户角色/数据范围」的查询与更新，
 * 但**没有用户列表接口**（/admin/users 未实现），因此教师列表暂无法拉取。
 * 前端先按契约准备好筛选与修改职位的操作，列表区展示待后端就绪的空态。
 */
import { Search, UserCog } from 'lucide-vue-next'
import { computed, ref } from 'vue'

import { useTeacherMe } from '@/shared/composables/useTeacherMe'

const { me } = useTeacherMe()

// 筛选维度来源于登录管理员自身的数据范围（/auth/me scopes）
const colleges = computed(
  () =>
    [
      ...new Set(
        (me.value?.scopes ?? [])
          .filter((s) => s.scopeType === 2)
          .map((s) => s.scopeName)
          .filter(Boolean),
      ),
    ] as string[],
)
const majors = computed(
  () =>
    [
      ...new Set(
        (me.value?.scopes ?? [])
          .filter((s) => s.scopeType === 3)
          .map((s) => s.scopeName)
          .filter(Boolean),
      ),
    ] as string[],
)

const filters = ref({ college: '', major: '', keyword: '' })
</script>

<template>
  <div class="mc-page">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <p class="mc-page-head__eyebrow">管理权限 · Roles</p>
        <h2 class="mc-page-head__title">教师职位调整</h2>
        <p class="mc-page-head__desc">
          选择学院、专业后查看教师，将职位调整为管理员、审核员或课任教师。
        </p>
      </div>
    </div>

    <div class="mc-filter-bar">
      <el-form inline @submit.prevent>
        <el-form-item label="学院">
          <el-select
            v-model="filters.college"
            placeholder="全部学院"
            clearable
            style="width: 160px"
          >
            <el-option v-for="c in colleges" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="专业">
          <el-select v-model="filters.major" placeholder="全部专业" clearable style="width: 180px">
            <el-option v-for="m in majors" :key="m" :label="m" :value="m" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="filters.keyword"
            placeholder="教师姓名 / 工号"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search">查询</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="mc-card">
      <div class="mc-card__head">
        <span class="mc-card__title">教师列表</span>
      </div>
      <div class="mc-card__body">
        <div class="mc-empty">
          <div class="mc-empty__icon"><UserCog :size="24" /></div>
          <p class="mc-empty__title">教师列表待后端就绪</p>
          <p class="mc-empty__desc">
            后端尚未提供用户列表接口（GET /admin/users）。筛选、修改职位的操作已按
            /admin/permissions/users/* 契约准备好，接口就绪后列表会自动加载。
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
