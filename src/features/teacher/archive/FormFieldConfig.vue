<script setup lang="ts">
import { Plus } from 'lucide-vue-next'

/** 字段编辑器（UI 层）——options 用字符串数组，提交时转换为后端 {value,label} 结构 */
interface FieldEditor {
  key: string
  label: string
  type: string
  required: boolean
  placeholder: string
  options: string[]
  sort: number
}

defineProps<{
  fields: FieldEditor[]
  fieldTypeOptions: { value: string; label: string }[]
}>()

const emit = defineEmits<{
  (e: 'add'): void
  (e: 'remove', index: number): void
}>()
</script>

<template>
  <el-divider content-position="left">字段配置</el-divider>
  <div class="form-customization__fields">
    <div v-for="(field, idx) in fields" :key="idx" class="form-customization__field">
      <div class="form-customization__field-main">
        <el-input v-model="field.label" class="u-w-150" placeholder="字段标签，如：姓名" />
        <el-input
          v-model="field.key"
          placeholder="字段名(提交JSON键)，如 name"
          class="mc-num u-w-170"
        />
        <el-select v-model="field.type" class="u-w-120">
          <el-option
            v-for="t in fieldTypeOptions"
            :key="t.value"
            :label="t.label"
            :value="t.value"
          />
        </el-select>
        <el-switch v-model="field.required" active-text="必填" />
        <el-button text type="danger" @click="emit('remove', idx)">删除</el-button>
      </div>
      <div
        v-if="field.type === 'select' || field.type === 'radio' || field.type === 'checkbox'"
        class="form-customization__field-options"
      >
        <el-tag
          v-for="(opt, oi) in field.options ?? []"
          :key="oi"
          closable
          size="small"
          effect="plain"
          @close="(field.options ?? []).splice(oi, 1)"
        >
          {{ String(opt) }}
        </el-tag>
        <el-input
          class="u-w-180"
          placeholder="输入选项后回车添加"
          size="small"
          @keyup.enter="
            (e: KeyboardEvent) => {
              const v = (e.target as HTMLInputElement).value.trim()
              if (v) {
                field.options = [...(field.options ?? []), v]
                ;(e.target as HTMLInputElement).value = ''
              }
            }
          "
        />
      </div>
    </div>
    <el-button :icon="Plus" plain class="form-customization__add-field" @click="emit('add')">
      添加字段
    </el-button>
  </div>
</template>

<style scoped lang="scss">
.form-customization {
  &__fields {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
    max-height: 320px;
    overflow-y: auto;
    padding: $spacing-sm;
    border: 1px dashed var(--el-border-color-light);
    border-radius: $radius-lg;
    background: var(--el-fill-color-lighter);
  }

  &__field {
    padding: $spacing-sm $spacing-md;
    border-radius: $radius-base;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
  }

  &__field-main {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    flex-wrap: wrap;
  }

  &__field-options {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    flex-wrap: wrap;
    margin-top: $spacing-sm;
    padding-top: $spacing-sm;
    border-top: 1px dashed var(--el-border-color-lighter);
  }

  &__add-field {
    align-self: flex-start;
  }
}
</style>
