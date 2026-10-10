<script setup lang="ts">
import type { IndicatorRuleVersionItem } from '@/shared/types/teacher'
/**
 * IndicatorVersionsDrawer - 指标规则版本列表（抽屉）
 * 对接后端：GET /admin/indicators/rule-versions（版本列表）、
 * PATCH /admin/indicators/rule-versions/{versionId}/snapshot（修补历史版本快照元数据）。
 * 文档 1.6/1.7。
 */
import { ElMessage } from 'element-plus'
import { RefreshCw, Wrench } from 'lucide-vue-next'

import { reactive, ref, watch } from 'vue'
import { listIndicatorRuleVersions, patchIndicatorRuleVersionSnapshot } from '@/shared/api/teacher'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{ (e: 'update:visible', v: boolean): void }>()

const loading = ref(false)
const list = ref<IndicatorRuleVersionItem[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(20)

const patchDialogVisible = ref(false)
const patchSaving = ref(false)
const patchingVersionId = ref<number | null>(null)
const patchForm = reactive({
  indicatorCode: '',
  indicatorName: '',
  description: '',
  newIndicatorCode: '',
})

watch(
  () => props.visible,
  (v) => {
    if (v) void load()
  },
)

async function load() {
  loading.value = true
  try {
    const res = await listIndicatorRuleVersions({ page: page.value, per_page: perPage.value })
    list.value = res.list
    total.value = res.total
  } catch {
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handlePageChange(p: number) {
  page.value = p
  void load()
}

function openPatch(row: IndicatorRuleVersionItem) {
  patchingVersionId.value = row.id
  patchForm.indicatorCode = ''
  patchForm.indicatorName = ''
  patchForm.description = ''
  patchForm.newIndicatorCode = ''
  patchDialogVisible.value = true
}

async function handlePatchSave() {
  if (!patchForm.indicatorCode.trim()) {
    ElMessage.warning('请填写目标指标编码')
    return
  }
  patchSaving.value = true
  try {
    await patchIndicatorRuleVersionSnapshot(patchingVersionId.value!, {
      indicatorCode: patchForm.indicatorCode.trim(),
      indicatorName: patchForm.indicatorName.trim() || undefined,
      description: patchForm.description.trim() || undefined,
      newIndicatorCode: patchForm.newIndicatorCode.trim() || undefined,
    })
    ElMessage.success('修补成功')
    patchDialogVisible.value = false
  } catch {
    /* 拦截器已提示 */
  } finally {
    patchSaving.value = false
  }
}

function handleClosed() {
  emit('update:visible', false)
}
</script>

<template>
  <el-drawer :model-value="visible" title="指标规则版本" size="680px" @closed="handleClosed">
    <div v-loading="loading" class="indicator-versions">
      <div class="indicator-versions__head">
        <span class="indicator-versions__hint"
          >历史发布版本，可按版本修补元数据（名称/说明/编码）</span
        >
        <el-button size="small" :icon="RefreshCw" :loading="loading" @click="load">刷新</el-button>
      </div>

      <el-table :data="list" stripe style="width: 100%">
        <el-table-column prop="version" label="版本号" width="80" align="center" />
        <el-table-column
          prop="versionName"
          label="版本名称"
          min-width="160"
          show-overflow-tooltip
        />
        <el-table-column prop="semesterId" label="学期ID" width="80" align="center">
          <template #default="{ row }">{{ row.semesterId ?? '-' }}</template>
        </el-table-column>
        <el-table-column prop="effectiveAt" label="生效时间" width="170">
          <template #default="{ row }">{{ row.effectiveAt ?? '-' }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="170">
          <template #default="{ row }">{{ row.createdAt ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="90" align="center">
          <template #default="{ row }">
            <el-button
              text
              type="primary"
              size="small"
              :icon="Wrench"
              @click="openPatch(row as IndicatorRuleVersionItem)"
            >
              修补
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="indicator-versions__pagination">
        <el-pagination
          :current-page="page"
          :page-size="perPage"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClosed">关闭</el-button>
    </template>

    <el-dialog v-model="patchDialogVisible" title="修补版本快照" width="480px" append-to-body>
      <el-form label-width="100px">
        <el-form-item label="目标编码" required>
          <el-input v-model="patchForm.indicatorCode" placeholder="快照中已存在的指标编码" />
        </el-form-item>
        <el-form-item label="新指标名称">
          <el-input v-model="patchForm.indicatorName" placeholder="留空不修改" />
        </el-form-item>
        <el-form-item label="新说明">
          <el-input
            v-model="patchForm.description"
            type="textarea"
            :rows="3"
            placeholder="留空不修改"
          />
        </el-form-item>
        <el-form-item label="新编码">
          <el-input v-model="patchForm.newIndicatorCode" placeholder="留空不修改" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="patchDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="patchSaving" @click="handlePatchSave">保存</el-button>
      </template>
    </el-dialog>
  </el-drawer>
</template>

<style scoped lang="scss">
.indicator-versions {
  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-md;
  }
  &__hint {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
  &__pagination {
    margin-top: $spacing-lg;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
