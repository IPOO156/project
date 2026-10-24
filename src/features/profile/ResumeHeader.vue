<script setup lang="ts">
/**
 * ResumeHeader - 简历模板头部（姓名 / 学历 / 联系方式）
 *
 * 打印/导出用模板的纯结构子组件：DOM 层级、class 名与样式必须与拆分前完全一致。
 */
import type { UserInfo } from '@/shared/types/types'

defineProps<{ userInfo: Partial<UserInfo> }>()
</script>

<template>
  <header class="resume-header">
    <div class="header-top">
      <h1 class="header-name">{{ userInfo.realName || '姓名' }}</h1>
      <p class="header-subtitle">应届毕业生 · {{ userInfo.major || '' }}</p>
    </div>
    <div class="header-contact">
      <span v-if="userInfo.phone" class="contact-item">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
          />
        </svg>
        {{ userInfo.phone }}
      </span>
      <span v-if="userInfo.email" class="contact-item">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
        {{ userInfo.email }}
      </span>
      <span v-if="userInfo.studentId" class="contact-item">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
        {{ userInfo.studentId }}
      </span>
      <span v-if="userInfo.grade" class="contact-item">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        {{ userInfo.grade }}级
      </span>
      <span v-if="userInfo.className" class="contact-item">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        {{ userInfo.className }}
      </span>
    </div>
  </header>
</template>

<style scoped>
/* ====== 头部 ====== */
.resume-header {
  padding: 28px 30px 20px;
  border-bottom: 3px solid #1e3a5f;
}

.header-top {
  margin-bottom: 10px;
}

.header-name {
  margin: 0 0 2px;
  font-size: 26pt;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 4px;
}

.header-subtitle {
  margin: 0;
  font-size: 11pt;
  color: #64748b;
}

.header-contact {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  font-size: 9.5pt;
  color: #475569;
}

.contact-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #475569;
}

.contact-item svg {
  opacity: 0.6;
  flex-shrink: 0;
}
</style>
