<script setup lang="ts">
import { Activity, CheckCircle2, Lock, Shield, ShieldAlert, Wifi } from 'lucide-vue-next'

const securityItems = [
  {
    category: '边界防护',
    icon: Shield,
    items: [
      { name: '防火墙', status: 'normal', detail: '策略已更新 · 拦截 1,247 次攻击' },
      { name: '入侵检测系统(IDS)', status: 'normal', detail: '运行正常 · 今日告警 3 条' },
    ],
  },
  {
    category: '流量防护',
    icon: Activity,
    items: [
      { name: '流量监控', status: 'normal', detail: '当前带宽使用率 34%' },
      { name: 'DDoS防护', status: 'normal', detail: '清洗中 · 今日拦截 2 次' },
    ],
  },
  {
    category: '传输安全',
    icon: Lock,
    items: [
      { name: 'SSL/TLS证书', status: 'normal', detail: '证书有效期至 2026-12-31' },
      { name: 'VPN通道', status: 'normal', detail: '4 条隧道 · 全部加密' },
    ],
  },
  {
    category: '无线安全',
    icon: Wifi,
    items: [
      { name: 'Wi-Fi加密', status: 'normal', detail: 'WPA3-Enterprise · 802.1X' },
      { name: '无线入侵防护', status: 'normal', detail: '运行正常 · 已隔离 1 个恶意AP' },
    ],
  },
]
</script>

<template>
  <div class="network-security">
    <el-card class="network-security__header">
      <el-row justify="space-between" align="middle">
        <el-col :span="12"><span class="section-title">网络安全防护</span></el-col>
        <el-col :span="12" style="text-align: right">
          <el-tag type="success" size="large" effect="dark"><Shield :size="14" /> 防护中</el-tag>
        </el-col>
      </el-row>
    </el-card>

    <el-row :gutter="16">
      <el-col v-for="group in securityItems" :key="group.category" :span="12">
        <el-card class="network-security__group">
          <template #header>
            <div class="network-security__group-header">
              <component :is="group.icon" :size="18" style="color: var(--el-color-primary)" />
              <span class="section-title">{{ group.category }}</span>
            </div>
          </template>
          <div class="security-items">
            <div v-for="item in group.items" :key="item.name" class="security-item">
              <div class="security-item__left">
                <component
                  :is="item.status === 'normal' ? CheckCircle2 : ShieldAlert"
                  :size="18"
                  color="var(--el-color-success)"
                />
                <span class="security-item__name">{{ item.name }}</span>
              </div>
              <span class="security-item__detail">{{ item.detail }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.network-security {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
  &__header {
    margin-bottom: 0;
  }
  &__group {
    height: 100%;
  }
  &__group-header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.security-items {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}
.security-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md;
  border-radius: $radius-base;
  background: var(--el-fill-color-light);
  &__left {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }
  &__name {
    font-size: 14px;
    font-weight: 500;
  }
  &__detail {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>
