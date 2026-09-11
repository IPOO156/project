<script setup lang="ts">
import { Award, Clock, FileText } from 'lucide-vue-next'

interface Props {
  activeTab: 'activity' | 'submission'
  activityCount: number
  submissionCount: number
}

const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'update:activeTab', tab: 'activity' | 'submission'): void }>()

function switchTab(tab: 'activity' | 'submission') {
  emit('update:activeTab', tab)
}
</script>

<template>
  <header class="center-header">
    <div class="center-header__main">
      <div class="center-header__icon">
        <Clock :size="28" />
      </div>
      <div>
        <h1 class="center-header__title">动态中心</h1>
        <p class="center-header__subtitle">追踪你的申报动态与报名记录，一切进展一目了然</p>
      </div>
    </div>

    <div class="center-header__tabs" role="tablist">
      <button
        type="button"
        class="center-header__tab"
        :class="{ 'is-active': props.activeTab === 'activity' }"
        role="tab"
        :aria-selected="props.activeTab === 'activity'"
        @click="switchTab('activity')"
      >
        <FileText :size="16" />
        <span>动态记录</span>
        <span class="center-header__badge">{{ activityCount }}</span>
      </button>
      <button
        type="button"
        class="center-header__tab"
        :class="{ 'is-active': props.activeTab === 'submission' }"
        role="tab"
        :aria-selected="props.activeTab === 'submission'"
        @click="switchTab('submission')"
      >
        <Award :size="16" />
        <span>报名记录</span>
        <span class="center-header__badge">{{ submissionCount }}</span>
      </button>
    </div>
  </header>
</template>

<style scoped lang="scss">
@use '../styles/theme' as *;

.center-header {
  @include message-theme-vars;
  @include mc-fade-in;

  background: linear-gradient(135deg, var(--mc-card) 0%, var(--mc-cream) 100%);
  border: 1px solid var(--mc-border);
  border-radius: var(--mc-radius);
  padding: 28px 32px;
  box-shadow: var(--mc-shadow);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  font-family: $mc-font-body;
  color: var(--mc-text);

  &__main {
    display: flex;
    align-items: center;
    gap: 18px;
  }

  &__icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: linear-gradient(135deg, var(--mc-wood) 0%, var(--mc-wood-light) 100%);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 6px 16px var(--mc-primary-shadow);
  }

  &__title {
    margin: 0;
    font-family: $mc-font-display;
    font-size: 26px;
    font-weight: 700;
    color: var(--mc-wood);
    letter-spacing: 1px;
  }

  &__subtitle {
    margin: 6px 0 0;
    font-size: 14px;
    color: var(--mc-text-secondary);
  }

  &__tabs {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px;
    background: var(--mc-bg);
    border-radius: 12px;
    border: 1px solid var(--mc-border);
  }

  &__tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    border-radius: 10px;
    border: none;
    background: transparent;
    color: var(--mc-text-secondary);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.25s ease;

    &:hover {
      background: var(--mc-primary-faint);
      color: var(--mc-wood);
    }

    &.is-active {
      background: linear-gradient(135deg, var(--mc-wood) 0%, var(--mc-wood-light) 100%);
      color: #fff;
      box-shadow: 0 4px 12px var(--mc-primary-shadow);
    }
  }

  &__badge {
    min-width: 22px;
    padding: 2px 7px;
    border-radius: 11px;
    background: var(--mc-cream);
    color: var(--mc-wood);
    font-size: 12px;
    font-weight: 600;
  }

  &__tab.is-active &__badge {
    background: rgba(255, 255, 255, 0.25);
    color: #fff;
  }
}

/* 暗色模式下增强 tab 容器与 badge 对比度 */
html.dark .center-header {
  &__tabs {
    background: #1e293b;
    border-color: #475569;
  }

  &__tab {
    color: #94a3b8;

    &:hover {
      background: rgba(96, 165, 250, 0.12);
      color: #60a5fa;
    }

    &.is-active {
      color: #fff;
    }
  }

  &__badge {
    background: rgba(96, 165, 250, 0.2);
    color: #93c5fd;
  }

  &__tab.is-active &__badge {
    background: rgba(255, 255, 255, 0.25);
  }
}

@media (max-width: 768px) {
  .center-header {
    padding: 20px;

    &__title {
      font-size: 22px;
    }

    &__tabs {
      width: 100%;
    }

    &__tab {
      flex: 1;
      justify-content: center;
    }
  }
}
</style>
