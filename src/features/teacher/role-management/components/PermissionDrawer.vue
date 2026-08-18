<script setup lang="ts">
/**
 * PermissionDrawer - 角色权限分配抽屉
 * 左侧回显该角色已分配权限（GET /admin/roles/{id}/permissions），
 * 右侧展示全部启用权限列表（GET /admin/permissions），
 * 勾选后覆盖式保存（PUT /admin/roles/{id}/permissions，提交全部勾选权限 id）。
 */
// ── 1. 外部依赖导入 ──
import type { PermissionListItem, RolePermissionItem } from '@/shared/types/teacher'
import { ElMessage } from 'element-plus'
import { Check } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'

import { assignRolePermissions, getRolePermissions, listPermissions } from '@/shared/api/teacher'

// ── 2. 类型/接口定义 ──
interface PermissionDisplay {
  permissionId: number
  permissionCode: string
  permissionName: string
}

// ── 3. Props & Emits ──
const props = defineProps<{
  visible: boolean
  roleId: number
  roleName: string
}>()

const emit = defineEmits<{ (e: 'update:visible', v: boolean): void }>()

// ── 4. Store / Composable ──
// （无全局状态依赖，数据直接通过 API 获取）

// ── 5. 响应式数据 ──
const loading = ref(false)
const saving = ref(false)
const assignedList = ref<RolePermissionItem[]>([])
const permissionList = ref<PermissionListItem[]>([])
const checkedIds = ref<number[]>([])

// ── 6. Computed ──
/** 全部可分配权限：启用权限 + 已分配但不在启用列表中的权限，去重后按 permissionId 升序 */
const allPermissions = computed<PermissionDisplay[]>(() => {
  const map = new Map<number, PermissionDisplay>()
  for (const p of permissionList.value) {
    map.set(p.permissionId, {
      permissionId: p.permissionId,
      permissionCode: p.permissionCode,
      permissionName: p.permissionName,
    })
  }
  for (const a of assignedList.value) {
    if (!map.has(a.permissionId)) {
      map.set(a.permissionId, {
        permissionId: a.permissionId,
        permissionCode: a.permissionCode,
        permissionName: a.permissionName,
      })
    }
  }
  return [...map.values()].sort((x, y) => x.permissionId - y.permissionId)
})

/** 左侧回显：当前已勾选的全部权限 */
const checkedPermissions = computed<PermissionDisplay[]>(() =>
  allPermissions.value.filter((p) => checkedIds.value.includes(p.permissionId)),
)

const isIndeterminate = computed(
  () => checkedIds.value.length > 0 && checkedIds.value.length < allPermissions.value.length,
)

const isAllChecked = computed(
  () => allPermissions.value.length > 0 && checkedIds.value.length === allPermissions.value.length,
)

// ── 7. Watch ──
watch(
  () => props.visible,
  (v) => {
    if (v) void load()
  },
)

// ── 8. 生命周期 ──
// （抽屉打开时通过 watch visible 触发加载）

// ── 9. 方法函数 ──
async function load() {
  loading.value = true
  try {
    const [rolePerms, perms] = await Promise.all([
      getRolePermissions(props.roleId),
      listPermissions({ status: 1 }),
    ])
    assignedList.value = rolePerms.permissions ?? []
    permissionList.value = perms
    checkedIds.value = assignedList.value.map((p) => p.permissionId)
  } catch {
    assignedList.value = []
    permissionList.value = []
    checkedIds.value = []
  } finally {
    loading.value = false
  }
}

/** el-checkbox change 事件回传 CheckboxValueType（string|number|boolean），归一化为 boolean */
function handleCheckAll(checked: boolean | string | number) {
  checkedIds.value = checked ? allPermissions.value.map((p) => p.permissionId) : []
}

async function handleSave() {
  saving.value = true
  try {
    await assignRolePermissions(props.roleId, checkedIds.value)
    ElMessage.success('权限分配已保存')
    emit('update:visible', false)
  } catch {
    /* 拦截器已提示 */
  } finally {
    saving.value = false
  }
}

function handleClosed() {
  emit('update:visible', false)
}
</script>

<template>
  <el-drawer
    :model-value="visible"
    :title="`权限分配 · ${roleName}`"
    size="760px"
    @closed="handleClosed"
  >
    <div v-loading="loading" class="perm-drawer">
      <div class="perm-drawer__hint">勾选右侧权限后点击「保存分配」，将全量覆盖该角色的权限。</div>

      <div class="perm-drawer__cols">
        <div class="perm-drawer__col perm-drawer__col--assigned">
          <div class="perm-drawer__col-title">已分配权限（{{ checkedPermissions.length }}）</div>
          <ul v-if="checkedPermissions.length" class="perm-drawer__list">
            <li v-for="p in checkedPermissions" :key="p.permissionId" class="perm-drawer__item">
              {{ p.permissionName }}
            </li>
          </ul>
          <el-empty v-else description="暂未分配权限" :image-size="56" />
        </div>

        <div class="perm-drawer__col perm-drawer__col--all">
          <div class="perm-drawer__col-title">
            <el-checkbox
              :model-value="isAllChecked"
              :indeterminate="isIndeterminate"
              @change="handleCheckAll"
            >
              全选
            </el-checkbox>
            <span class="perm-drawer__count">共 {{ allPermissions.length }} 项</span>
          </div>
          <el-checkbox-group v-model="checkedIds" class="perm-drawer__group">
            <el-checkbox
              v-for="p in allPermissions"
              :key="p.permissionId"
              :value="p.permissionId"
              class="perm-drawer__group-item"
            >
              {{ p.permissionName }}
            </el-checkbox>
          </el-checkbox-group>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClosed">取消</el-button>
      <el-button
        type="primary"
        :icon="Check"
        :loading="saving"
        :disabled="saving"
        @click="handleSave"
      >
        保存分配
      </el-button>
    </template>
  </el-drawer>
</template>

<style scoped lang="scss">
.perm-drawer {
  &__hint {
    margin-bottom: $spacing-md;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__cols {
    display: flex;
    gap: 16px;
    min-height: 400px;
  }

  &__col {
    border: 1px solid var(--el-border-color-light);
    border-radius: 6px;
    padding: 12px;
    overflow-y: auto;

    &--assigned {
      width: 220px;
      flex-shrink: 0;
      background: var(--el-fill-color-lighter);
    }

    &--all {
      flex: 1;
    }
  }

  &__col-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    font-weight: 600;
    font-size: 13px;
  }

  &__count {
    font-weight: 400;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  &__item {
    padding: 4px 0;
    font-size: 13px;
    color: var(--el-text-color-regular);
  }

  &__group {
    display: flex;
    flex-direction: column;
  }

  &__group-item {
    margin-right: 0;
    height: 28px;
  }
}
</style>
