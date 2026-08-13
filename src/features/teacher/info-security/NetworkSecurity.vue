<script setup lang="ts">
/**
 * NetworkSecurity - 网络安全
 * 覆盖：网络安全（边界防护/流量防护/传输安全/无线安全/入侵防护）
 *       + 主机终端安全（服务器安全）
 * 说明：本页为安全防护配置台账，状态由安全平台同步。
 */
import { Activity, CheckCircle2, Lock, Radar, Server, ShieldCheck, Wifi } from 'lucide-vue-next'

interface SecurityGroup {
  title: string
  icon: any
  items: { name: string; detail: string }[]
}

const networkGroups: SecurityGroup[] = [
  {
    title: '边界防护',
    icon: ShieldCheck,
    items: [
      { name: '防火墙策略', detail: '按来源/目的端口放行，其余默认拒绝' },
      { name: '入侵防御系统（IPS）', detail: '实时匹配攻击特征并拦截' },
    ],
  },
  {
    title: '流量防护',
    icon: Activity,
    items: [
      { name: '流量监控', detail: '记录出入流量与连接数，超阈值告警' },
      { name: 'DDoS 清洗', detail: '异常流量自动牵引清洗' },
    ],
  },
  {
    title: '传输安全',
    icon: Lock,
    items: [
      { name: 'HTTPS 证书', detail: '全站启用 TLS，证书到期前自动续期提醒' },
      { name: 'VPN 隧道', detail: '远程接入走加密隧道' },
    ],
  },
  {
    title: '无线安全',
    icon: Wifi,
    items: [
      { name: 'Wi-Fi 加密', detail: 'WPA3 企业级认证' },
      { name: '无线接入审计', detail: '非法接入点自动隔离' },
    ],
  },
  {
    title: '入侵防护',
    icon: Radar,
    items: [
      { name: '入侵检测（IDS）', detail: '旁路镜像分析异常行为' },
      { name: '行为基线', detail: '按正常访问基线识别异常登录' },
    ],
  },
  {
    title: '主机终端安全',
    icon: Server,
    items: [
      { name: '服务器加固', detail: '最小化开放端口，关闭无用服务' },
      { name: '终端管控', detail: '统一补丁与防病毒策略' },
      { name: '系统资源监控', detail: 'CPU / 内存 / 磁盘阈值告警' },
    ],
  },
]
</script>

<template>
  <div class="mc-page">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <p class="mc-page-head__eyebrow">信息安全 · Network</p>
        <h2 class="mc-page-head__title">网络安全</h2>
        <p class="mc-page-head__desc">
          边界、流量、传输、无线与入侵防护的配置台账，以及主机终端安全加固项。
        </p>
      </div>
      <div class="mc-page-head__actions">
        <el-tag type="success" size="large" effect="dark"><ShieldCheck :size="14" /> 防护中</el-tag>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col v-for="group in networkGroups" :key="group.title" :xs="24" :sm="12" :lg="8">
        <div class="mc-card sec-group">
          <div class="mc-card__head">
            <span class="mc-card__title">{{ group.title }}</span>
          </div>
          <div class="mc-card__body">
            <div v-for="item in group.items" :key="item.name" class="sec-item">
              <component :is="CheckCircle2" :size="16" color="var(--el-color-success)" />
              <div class="sec-item__info">
                <span class="sec-item__name">{{ item.name }}</span>
                <span v-if="item.detail" class="sec-item__detail">{{ item.detail }}</span>
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
