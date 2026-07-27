<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

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
            <span class="icon" aria-hidden="true">{{ item.icon }}</span>
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
  gap: 6px;
}

.group {
  padding: 4px;
}

.groupTitle {
  margin: 8px 12px 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius);
  color: var(--text);
  text-decoration: none;
  transition: all var(--transition);
  position: relative;
}

.item:hover {
  background: var(--bg);
}

.item[data-active='1'] {
  background: var(--accent-light);
  color: var(--accent-dark);
  font-weight: 600;
}

.item[data-active='1'] .icon {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.item[data-active='1']::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: var(--accent);
  border-radius: 0 2px 2px 0;
}

.left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  border: 1px solid var(--border);
  font-size: 15px;
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
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 20px;
  background: var(--accent-light);
  color: var(--accent);
  font-weight: 600;
  flex-shrink: 0;
}
</style>
