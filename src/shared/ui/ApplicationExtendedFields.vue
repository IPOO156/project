<script setup lang="ts">
import { onMounted } from 'vue'

import { useRemoteDict } from '@/shared/composables/useRemoteDict'
import { ROLE_OPTIONS } from '@/shared/constants/dict'

/**
 * 申报/奖项扩展字段：直接渲染 el-form-item，需放在页面自己的 <el-form> 内
 * （一般位于「佐证材料」之前），标签宽度、行距、控件宽度全部继承主表单。
 * 不直接改写 props，而是通过 update 事件把字段与新值交回页面写入 extendedForm。
 */
export type ExtendedFieldKey =
  'role' | 'certNumber' | 'issuingAuthority' | 'acquisitionDate' | 'validityPeriod'

const props = withDefaults(
  defineProps<{
    form: Record<string, string | undefined>
    /** 该业务类型后端未落库的扩展字段：不渲染（空值不会进入提交体） */
    hidden?: readonly ExtendedFieldKey[]
  }>(),
  { hidden: () => [] },
)

const emit = defineEmits<{
  (e: 'update', field: ExtendedFieldKey, value: string): void
}>()

function visible(key: ExtendedFieldKey) {
  return !props.hidden.includes(key)
}

/** 本人角色：后端字典优先，常量兜底 */
const { options: participantRoleOptions, load: loadParticipantRoles } = useRemoteDict(
  'participant_role',
  ROLE_OPTIONS,
)

onMounted(() => void loadParticipantRoles())
</script>

<template>
  <el-form-item v-if="visible('role')" label="本人角色">
    <el-select
      :model-value="form.role"
      placeholder="请选择"
      @update:model-value="emit('update', 'role', $event)"
    >
      <el-option
        v-for="r in participantRoleOptions"
        :key="r.value"
        :label="r.label"
        :value="r.value"
      />
    </el-select>
  </el-form-item>
  <el-form-item v-if="visible('certNumber')" label="证书编号">
    <el-input
      :model-value="form.certNumber"
      placeholder="请输入证书编号"
      @update:model-value="emit('update', 'certNumber', $event)"
    />
  </el-form-item>
  <el-form-item v-if="visible('issuingAuthority')" label="发证单位">
    <el-input
      :model-value="form.issuingAuthority"
      placeholder="请输入发证单位"
      @update:model-value="emit('update', 'issuingAuthority', $event)"
    />
  </el-form-item>
  <el-form-item v-if="visible('acquisitionDate')" label="取得时间">
    <el-date-picker
      :model-value="form.acquisitionDate"
      type="month"
      placeholder="选择年月"
      value-format="YYYY-MM"
      @update:model-value="emit('update', 'acquisitionDate', $event)"
    />
  </el-form-item>
  <el-form-item v-if="visible('validityPeriod')" label="有效期">
    <el-date-picker
      :model-value="form.validityPeriod"
      type="month"
      placeholder="选择年月"
      value-format="YYYY-MM"
      @update:model-value="emit('update', 'validityPeriod', $event)"
    />
  </el-form-item>
</template>
