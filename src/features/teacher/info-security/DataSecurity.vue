<script setup lang="ts">
/**
 * DataSecurity - 数据安全
 * 覆盖：数据安全（数据加密/备份与恢复/数据脱敏）
 *       + 应用系统安全（Web安全/业务系统/代码安全）
 *       + 身份与访问安全（账号管理/认证机制/权限管理）
 * 说明：本页为安全配置台账，由安全团队维护。
 */
import {
  AppWindow,
  CheckCircle2,
  Database,
  Eye,
  KeyRound,
  Lock,
  ShieldCheck,
  UserCheck,
} from 'lucide-vue-next'

interface SecurityGroup {
  title: string
  icon: any
  items: { name: string; detail: string }[]
}

const dataGroups: SecurityGroup[] = [
  {
    title: '数据加密',
    icon: KeyRound,
    items: [
      { name: '存储加密', detail: '数据库与备份介质静态加密（AES-256）' },
      { name: '传输加密', detail: '全链路 TLS 1.3 传输' },
      { name: '敏感字段加密', detail: '密码、密钥等使用单向散列存储' },
    ],
  },
  {
    title: '数据备份与恢复',
    icon: Database,
    items: [
      { name: '自动备份', detail: '每日全量 + 增量，保留 30 天' },
      { name: '异地容灾', detail: '备份同步至异地灾备节点' },
      { name: '恢复演练', detail: '定期执行恢复验证' },
    ],
  },
  {
    title: '数据脱敏',
    icon: Eye,
    items: [
      { name: '手机号脱敏', detail: '对外展示如 138****0000' },
      { name: '身份证号脱敏', detail: '仅保留后四位可见' },
      { name: '日志脱敏', detail: '系统日志自动过滤敏感字段' },
    ],
  },
  {
    title: '应用系统安全',
    icon: AppWindow,
    items: [
      { name: 'Web 安全', detail: '越权访问与文件上传漏洞防护' },
      { name: '业务系统', detail: '后台功能按权限码控制' },
      { name: '代码安全', detail: '上线前代码审计，第三方组件漏洞修复' },
    ],
  },
  {
    title: '身份与访问安全',
    icon: UserCheck,
    items: [
      { name: '账号管理', detail: '一人一号，定期清理无效账号' },
      { name: '认证机制', detail: '强密码策略，关键操作短信认证' },
      { name: '权限管理', detail: '按角色分级授权，最小权限原则' },
    ],
  },
  {
    title: '访问控制',
    icon: ShieldCheck,
    items: [
      { name: '会话管理', detail: '超时自动登出，异地登录提醒' },
      { name: '操作审计', detail: '关键操作留痕可追溯' },
    ],
  },
]
</script>

<template>
  <div class="mc-page">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <p class="mc-page-head__eyebrow">信息安全 · Data</p>
        <h2 class="mc-page-head__title">数据与访问安全</h2>
        <p class="mc-page-head__desc">
          数据加密、备份恢复、脱敏策略，以及应用系统与身份访问安全的防护配置。
        </p>
      </div>
      <div class="mc-page-head__actions">
        <el-tag type="success" size="large" effect="dark"><Lock :size="14" /> 数据保护中</el-tag>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col v-for="group in dataGroups" :key="group.title" :xs="24" :sm="12" :lg="8">
        <div class="mc-card sec-group">
          <div class="mc-card__head">
            <span class="mc-card__title">{{ group.title }}</span>
          </div>
          <div class="mc-card__body">
            <div v-for="item in group.items" :key="item.name" class="sec-item">
              <component :is="CheckCircle2" :size="16" color="var(--el-color-success)" />
              <div class="sec-item__info">
                <span class="sec-item__name">{{ item.name }}</span>
                <span class="sec-item__detail">{{ item.detail }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.sec-group {
  height: 100%;
}
.sec-item {
  display: flex;
  align-items: flex-start;
  gap: $spacing-sm;
  padding: $spacing-sm 0;
  &:not(:last-child) {
    border-bottom: 1px solid var(--el-border-color-lighter);
  }
  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  &__name {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }
  &__detail {
    font-size: 12px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
  }
}
</style>
