<script setup lang="ts">
/**
 * ExportTemplateDetailDrawer - 导出模板详情（抽屉）
 * 对接后端：GET /admin/export-templates/{templateId}（完整配置）、
 * POST /admin/export-templates/{templateId}/preview-image（上传/覆盖预览图）。
 * 文档 5.4 / 5.10。
 */
import type { UploadFile } from 'element-plus'
import type { ExportTemplateDetail } from '@/shared/types/teacher'
import { ElMessage } from 'element-plus'
import { ImagePlus } from 'lucide-vue-next'

import { computed, ref, watch } from 'vue'
import { getExportTemplateDetail, uploadExportTemplatePreview } from '@/shared/api/teacher'

const props = defineProps<{
  visible: boolean
  templateId: number
  templateName: string
  initialPreviewImage: string | null
}>()

const emit = defineEmits<{ (e: 'update:visible', v: boolean): void }>()

const loading = ref(false)
const detail = ref<ExportTemplateDetail | null>(null)
const previewUrl = ref<string | null>(null)
const uploading = ref(false)

watch(
  () => props.visible,
  (v) => {
    if (!v) return
    previewUrl.value = props.initialPreviewImage
    detail.value = null
    void loadDetail()
  },
)

async function loadDetail() {
  loading.value = true
  try {
    detail.value = await getExportTemplateDetail(props.templateId)
    if (detail.value.previewImage) previewUrl.value = detail.value.previewImage
  } catch {
    detail.value = null
  } finally {
    loading.value = false
  }
}

function jsonText(v: unknown) {
  if (v == null) return '-'
  if (typeof v === 'string') return v
  return JSON.stringify(v, null, 2)
}

const configBlocks = computed(() => {
  if (!detail.value) return []
  const d = detail.value
  return [
    { key: 'fieldsConfig', label: '字段配置', value: d.fieldsConfig },
    { key: 'filterConditions', label: '默认筛选条件', value: d.filterConditions },
    { key: 'templateContent', label: 'HTML 模板内容', value: d.templateContent },
    { key: 'pageConfig', label: '页面配置', value: d.pageConfig },
    { key: 'marginConfig', label: '页边距配置', value: d.marginConfig },
    { key: 'headerHtml', label: '页眉', value: d.headerHtml },
    { key: 'footerHtml', label: '页脚', value: d.footerHtml },
    { key: 'watermarkConfig', label: '水印配置', value: d.watermarkConfig },
    { key: 'fontConfig', label: '字体配置', value: d.fontConfig },
  ].filter((b) => b.value != null)
})

async function handlePreviewUpload(file: UploadFile) {
  if (!file.raw) return
  if (file.raw.size > 2 * 1024 * 1024) {
    ElMessage.warning('预览图大小不能超过 2MB')
    return
  }
  uploading.value = true
  try {
    const res = await uploadExportTemplatePreview(props.templateId, file.raw)
    previewUrl.value = res.previewImage
    ElMessage.success('预览图已更新')
  } catch {
    /* 拦截器已提示 */
  } finally {
    uploading.value = false
  }
}

function handleClosed() {
  emit('update:visible', false)
}
</script>

<template>
  <el-drawer
    :model-value="visible"
    :title="`模板详情 · ${templateName}`"
    size="560px"
    @closed="handleClosed"
  >
    <div v-loading="loading" class="template-detail">
      <template v-if="detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="模板名称">{{ detail.templateName }}</el-descriptions-item>
          <el-descriptions-item label="模板编码">{{ detail.templateCode }}</el-descriptions-item>
          <el-descriptions-item label="导出类型">
            {{ detail.exportTypeLabel ?? detail.exportType }}
          </el-descriptions-item>
          <el-descriptions-item label="范围">
            {{ detail.scopeTypeLabel ?? detail.scopeType ?? '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="渲染模式">
            {{ detail.templateModeLabel ?? detail.templateMode ?? '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="纸张 / 方向">
            {{ detail.paperSize ?? '-' }} /
            {{ detail.orientationLabel ?? detail.orientation ?? '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="版本 / 默认">
            v{{ detail.version }} / {{ detail.isDefault === 1 ? '默认' : '非默认' }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">{{ detail.statusLabel }}</el-descriptions-item>
          <el-descriptions-item label="创建人">
            {{ detail.createdByName ?? '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ detail.updatedAt ?? '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="template-detail__section">
          <p class="template-detail__title">预览图</p>
          <div class="template-detail__preview">
            <img
              v-if="previewUrl"
              :src="previewUrl"
              alt="模板预览图"
              class="template-detail__preview-img"
            />
            <div v-else class="template-detail__preview-empty">暂无预览图</div>
            <el-upload
              :show-file-list="false"
              :auto-upload="false"
              accept="image/jpeg,image/png,image/gif,image/webp,image/bmp"
              :on-change="handlePreviewUpload"
            >
              <el-button type="primary" plain size="small" :icon="ImagePlus" :loading="uploading">
                {{ previewUrl ? '更换预览图' : '上传预览图' }}
              </el-button>
            </el-upload>
          </div>
        </div>

        <div v-if="configBlocks.length" class="template-detail__section">
          <p class="template-detail__title">配置信息</p>
          <el-collapse>
            <el-collapse-item v-for="b in configBlocks" :key="b.key" :title="b.label">
              <pre class="template-detail__json">{{ jsonText(b.value) }}</pre>
            </el-collapse-item>
          </el-collapse>
        </div>
      </template>
      <el-empty v-else-if="!loading" description="暂无详情数据" :image-size="72" />
    </div>
  </el-drawer>
</template>

<style scoped lang="scss">
.template-detail {
  &__section {
    margin-top: $spacing-lg;
  }
  &__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 0 0 $spacing-sm;
  }
  &__preview {
    display: flex;
    align-items: flex-start;
    gap: $spacing-md;
    &-img {
      max-width: 240px;
      max-height: 320px;
      border: 1px solid var(--el-border-color-light);
      border-radius: $radius-sm;
    }
    &-empty {
      padding: 32px 40px;
      border: 1px dashed var(--el-border-color);
      border-radius: $radius-sm;
      color: var(--el-text-color-secondary);
      font-size: 13px;
    }
  }
  &__json {
    margin: 0;
    padding: $spacing-sm;
    background: var(--el-fill-color-light);
    border-radius: $radius-sm;
    font-size: 12px;
    line-height: 1.6;
    max-height: 280px;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-all;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  }
}
</style>
