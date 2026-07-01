<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import LineIcon from '../ui/LineIcon.vue'

const props = defineProps({
  groups: { type: Array, required: true },
  collapsed: { type: Boolean, default: false },
})

const route = useRoute()

const activePath = computed(() => route.path)
</script>

<template>
  <nav class="nav">
    <section v-for="group in groups" :key="group.title" class="group">
      <h3 v-if="!collapsed" class="groupTitle">{{ group.title }}</h3>
      <div class="items">
        <RouterLink
          v-for="item in group.items"
          :key="item.to"
          class="item"
          :to="item.to"
          :data-active="activePath === item.to ? '1' : '0'"
          :title="collapsed ? item.label : ''"
        >
          <span class="left">
            <span class="icon" aria-hidden="true">
              <LineIcon :name="item.icon" :size="16" />
            </span>
            <span v-if="!collapsed" class="label">{{ item.label }}</span>
          </span>
          <span v-if="!collapsed && item.pill" class="pill">{{ item.pill }}</span>
        </RouterLink>
      </div>
    </section>
  </nav>
</template>

<style scoped>
.nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.group {
  padding: 2px 4px;
}

.groupTitle {
  margin: 10px 12px 8px;
  font-size: 10px;
  font-weight: 700;
  color: rgba(255,255,255,0.3);
  letter-spacing: 0.8px;
  text-transform: uppercase;
}

.items {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 12px;
  border-radius: var(--radius);
  color: var(--sidebar-text);
  text-decoration: none;
  transition: all var(--transition);
  position: relative;
}

.item:hover {
  background: var(--sidebar-hover-bg);
  color: var(--sidebar-active-text);
}

.item[data-active='1'] {
  background: var(--sidebar-active-bg);
  color: var(--sidebar-active-text);
  font-weight: 600;
}

.item[data-active='1'] .icon {
  background: var(--sidebar-brand);
  color: white;
  border-color: var(--sidebar-brand);
}

.item[data-active='1']::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 18px;
  background: var(--sidebar-brand);
  border-radius: 0 3px 3px 0;
}

.left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.icon {
  width: 30px;
  height: 30px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
  transition: all var(--transition);
}

.label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
}

.pill {
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 20px;
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.45);
  font-weight: 600;
  flex-shrink: 0;
  letter-spacing: 0.3px;
}
</style>
