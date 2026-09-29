<script setup lang="ts">
/**
 * DictManagement - 字典管理
 * 对接后端 /admin/dict（字典类型列表只读展示、字典项新增/编辑/删除）。
 * 顶部为字典类型表格（关键字/状态筛选 + 分页），行内「字典项」按钮打开右侧抽屉，
 * 抽屉内维护该类型下字典项列表（状态筛选 + 分页 + 新增/编辑弹窗 + 删除二次确认）。
 */

// ── 1. 外部依赖导入 ──
import type { DictItemVO, DictTypeItem } from '@/shared/types/teacher'
import { ElMessage, ElMessageBox } from 'element-plus'
import { List, Plus, RefreshCw, Search } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref, watch } from 'vue'

import {
  createDictItem,
  deleteDictItem,
  listDictItems,
  listDictTypes,
  updateDictItem,
} from '@/shared/api/teacher'
import { COMMON_STATUS } from '@/shared/constants/dict'

// ── 2. 类型接口 ──
// 字典类型/字典项 DTO 均来自 @/shared/types/teacher，此处复用，无需本地新增类型。

// ── 3. Props & Emits ──
// 本页为顶级路由页，无 props / emits。

// ── 4. Store ──
// 本页数据全部来自接口，未使用 Pinia store。

// ── 5. 响应式数据 ──
// 字典类型列表：筛选与分页
const typeLoading = ref(false)
const typeList = ref<DictTypeItem[]>([])
const typeTotal = ref(0)
const typePage = ref(1)
const typePerPage = ref(20)
const typeFilters = reactive({
  keyword: '',
  status: '' as number | '',
})

// 字典项抽屉：列表/筛选/分页
const itemsDrawerVisible = ref(false)
const itemsLoading = ref(false)
const currentDictType = ref('')
const itemList = ref<DictItemVO[]>([])
const itemTotal = ref(0)
const itemPage = ref(1)
const itemPerPage = ref(20)
const itemFilters = reactive({
  status: '' as number | '',
})

// 字典项新增/编辑弹窗
const itemDialogVisible = ref(false)
const itemIsEdit = ref(false)
const itemEditingId = ref<number | null>(null)
const saving = ref(false)
const itemForm = reactive({
  dictValue: '',
  label: '',
  sort: 0,
  status: 1,
})

// ── 6. Computed ──
const statusOptions = computed(() => [
  { label: '全部状态', value: '' },
  ...Object.entries(COMMON_STATUS).map(([value, meta]) => ({
    label: meta.label,
    value: Number(value),
  })),
])

const drawerTitle = computed(() =>
  currentDictType.value ? `${currentDictType.value} · 字典项` : '字典项',
)

// ── 7. Watch ──
watch(itemsDrawerVisible, (visible) => {
  if (visible) void loadItems()
})

// ── 8. 生命周期 ──
onMounted(() => void loadTypes())

// ── 9. 方法函数 ──
async function loadTypes() {
  typeLoading.value = true
  try {
    const res = await listDictTypes({
      page: typePage.value,
      per_page: typePerPage.value,
      keyword: typeFilters.keyword.trim() || undefined,
      status: typeFilters.status === '' ? undefined : typeFilters.status,
    })
    typeList.value = res.list
    typeTotal.value = res.total
  } catch {
    typeList.value = []
    typeTotal.value = 0
  } finally {
    typeLoading.value = false
  }
}

function handleTypeSearch() {
  typePage.value = 1
  void loadTypes()
}

function handleTypeReset() {
  typeFilters.keyword = ''
  typeFilters.status = ''
  typePage.value = 1
  void loadTypes()
}

function handleTypePageChange(p: number) {
  typePage.value = p
  void loadTypes()
}

function openItemsDrawer(row: DictTypeItem) {
  currentDictType.value = row.dictType
  itemFilters.status = ''
  itemPage.value = 1
  itemsDrawerVisible.value = true
}

async function loadItems() {
  itemsLoading.value = true
  try {
    const res = await listDictItems({
      dictType: currentDictType.value,
      page: itemPage.value,
      per_page: itemPerPage.value,
      status: itemFilters.status === '' ? undefined : itemFilters.status,
    })
    itemList.value = res.list ?? []
    itemTotal.value = res.pagination?.total ?? 0
  } catch {
    itemList.value = []
    itemTotal.value = 0
  } finally {
    itemsLoading.value = false
  }
}

function handleItemSearch() {
  itemPage.value = 1
  void loadItems()
}

function handleItemReset() {
  itemFilters.status = ''
  itemPage.value = 1
  void loadItems()
}

function handleItemPageChange(p: number) {
  itemPage.value = p
  void loadItems()
}

function handleItemsDrawerClosed() {
  currentDictType.value = ''
  itemList.value = []
  itemTotal.value = 0
}

function openItemCreate() {
  itemIsEdit.value = false
  itemEditingId.value = null
  itemForm.dictValue = ''
  itemForm.label = ''
  itemForm.sort = 0
  itemForm.status = 1
  itemDialogVisible.value = true
}

function openItemEdit(row: DictItemVO) {
  itemIsEdit.value = true
  itemEditingId.value = row.id
  itemForm.dictValue = row.dictValue ?? ''
  itemForm.label = row.label ?? ''
  itemForm.sort = row.sort ?? 0
  itemForm.status = row.status ?? 1
  itemDialogVisible.value = true
}

async function handleItemSave() {
  if (!itemForm.dictValue.trim() || !itemForm.label.trim()) {
    ElMessage.warning('请填写字典值和显示名称')
    return
  }
  saving.value = true
  try {
    if (itemIsEdit.value && itemEditingId.value != null) {
      await updateDictItem(itemEditingId.value, {
        dictValue: itemForm.dictValue.trim(),
        label: itemForm.label.trim(),
        sort: itemForm.sort,
        status: itemForm.status,
      })
      ElMessage.success('更新成功')
    } else {
      await createDictItem({
        dictType: currentDictType.value,
        dictValue: itemForm.dictValue.trim(),
        label: itemForm.label.trim(),
        sort: itemForm.sort,
        status: itemForm.status,
      })
      ElMessage.success('新增成功')
    }
    itemDialogVisible.value = false
    void loadItems()
  } catch {
    /* 拦截器已提示 */
  } finally {
    saving.value = false
  }
}

async function handleItemDelete(row: DictItemVO) {
  try {
    await ElMessageBox.confirm(`确定删除字典项「${row.label ?? row.dictValue}」吗？`, '提示', {
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await deleteDictItem(row.id)
    ElMessage.success('删除成功')
    if (itemList.value.length === 1 && itemPage.value > 1) itemPage.value -= 1
    void loadItems()
  } catch {
    /* 拦截器已提示 */
  }
}

function statusLabel(status: number | null): string {
  return status == null ? '-' : (COMMON_STATUS[status]?.label ?? '-')
}

function statusTag(status: number | null): 'success' | 'danger' | 'info' {
  return status == null ? 'info' : (COMMON_STATUS[status]?.tag ?? 'info')
}
</script>

<template>
  <div class="mc-page dict-management">
    <div class="mc-page-head">
      <div class="mc-page-head__left">
        <h2 class="mc-page-head__title">字典管理</h2>
        <p class="mc-page-head__desc">维护系统字典类型及其字典项，支撑下拉选项与枚举映射。</p>
      </div>
      <div class="mc-page-head__actions">
        <el-button :icon="RefreshCw" :loading="typeLoading" @click="loadTypes">刷新</el-button>
      </div>
    </div>

    <div class="mc-filter-bar">
      <el-form inline @submit.prevent="handleTypeSearch">
        <el-form-item label="关键字">
          <el-input
            v-model="typeFilters.keyword"
            placeholder="字典类型关键字"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="typeFilters.status" style="width: 140px">
            <el-option
              v-for="opt in statusOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" :loading="typeLoading" @click="handleTypeSearch">
            查询
          </el-button>
          <el-button @click="handleTypeReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="mc-card">
      <div class="mc-card__head">
        <span class="mc-card__title">字典类型</span>
        <span class="dict-management__total">共 {{ typeTotal }} 条</span>
      </div>
      <div class="mc-card__body">
        <el-table v-loading="typeLoading" :data="typeList" stripe style="width: 100%">
          <el-table-column prop="dictType" label="字典类型" min-width="180" show-overflow-tooltip />
          <el-table-column label="字典项数量" width="120" align="center">
            <template #default="{ row }">{{ row.itemCount ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="statusTag(row.status)" size="small">
                {{ statusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="170">
            <template #default="{ row }">{{ row.createdAt ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="110" align="center">
            <template #default="{ row }">
              <el-button
                text
                type="primary"
                size="small"
                :icon="List"
                @click="openItemsDrawer(row as DictTypeItem)"
              >
                字典项
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div v-if="typeTotal > 0" class="dict-management__pagination">
          <el-pagination
            :current-page="typePage"
            :page-size="typePerPage"
            :total="typeTotal"
            layout="total, prev, pager, next"
            @current-change="handleTypePageChange"
          />
        </div>
      </div>
    </div>

    <el-drawer
      v-model="itemsDrawerVisible"
      :title="drawerTitle"
      size="720px"
      @closed="handleItemsDrawerClosed"
    >
      <div v-loading="itemsLoading" class="dict-management__items">
        <div class="mc-filter-bar dict-management__items-filter">
          <el-form inline @submit.prevent="handleItemSearch">
            <el-form-item label="状态">
              <el-select v-model="itemFilters.status" style="width: 140px">
                <el-option
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :icon="Search"
                :loading="itemsLoading"
                @click="handleItemSearch"
              >
                查询
              </el-button>
              <el-button @click="handleItemReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <el-table :data="itemList" stripe size="small" style="width: 100%">
          <el-table-column prop="dictValue" label="字典值" min-width="150" show-overflow-tooltip />
          <el-table-column prop="label" label="显示名称" min-width="150" show-overflow-tooltip />
          <el-table-column prop="sort" label="排序" width="80" align="center" />
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="statusTag(row.status)" size="small">
                {{ statusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="160">
            <template #default="{ row }">{{ row.createdAt ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center">
            <template #default="{ row }">
              <el-button text type="primary" size="small" @click="openItemEdit(row as DictItemVO)">
                编辑
              </el-button>
              <el-button
                text
                type="danger"
                size="small"
                @click="handleItemDelete(row as DictItemVO)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div v-if="itemTotal > 0" class="dict-management__items-pagination">
          <el-pagination
            :current-page="itemPage"
            :page-size="itemPerPage"
            :total="itemTotal"
            layout="total, prev, pager, next"
            @current-change="handleItemPageChange"
          />
        </div>
      </div>

      <template #footer>
        <el-button @click="itemsDrawerVisible = false">关闭</el-button>
        <el-button type="primary" :icon="Plus" @click="openItemCreate">新增字典项</el-button>
      </template>

      <el-dialog
        v-model="itemDialogVisible"
        :title="itemIsEdit ? '编辑字典项' : '新增字典项'"
        width="480px"
        append-to-body
      >
        <el-form label-width="90px">
          <el-form-item label="字典类型">
            <el-input :model-value="currentDictType" disabled />
          </el-form-item>
          <el-form-item label="字典值" required>
            <el-input v-model="itemForm.dictValue" placeholder="字典值（存储值）" />
          </el-form-item>
          <el-form-item label="显示名称" required>
            <el-input v-model="itemForm.label" placeholder="显示名称（展示文案）" />
          </el-form-item>
          <el-form-item label="排序">
            <el-input-number v-model="itemForm.sort" :min="0" />
          </el-form-item>
          <el-form-item label="状态">
            <el-switch
              v-model="itemForm.status"
              :active-value="1"
              :inactive-value="0"
              active-text="启用"
              inactive-text="禁用"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="itemDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="handleItemSave">保存</el-button>
        </template>
      </el-dialog>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.dict-management {
  &__total {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  &__pagination {
    margin-top: $spacing-lg;
    display: flex;
    justify-content: flex-end;
  }

  &__items {
    &-filter {
      padding: 0 0 14px;
      margin-bottom: 4px;
      background: transparent;
      border: none;
    }

    &-pagination {
      margin-top: $spacing-lg;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>
