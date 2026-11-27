<script setup lang="ts">
import type { Ref } from 'vue'
import { AlertTriangle, CheckCircle2, Eye, Lightbulb, ListChecks } from 'lucide-vue-next'
import { computed, unref } from 'vue'

/**
 * 申报/报名表单统一布局：左侧表单 + 右侧辅助栏。
 * 辅助栏由竞赛之星报名表单抽象而来，包含：填写进度 / 实时预览 / 填写指引 / 常见退回原因。
 */
export interface ApplicationPreviewField {
  key: string
  label: string
  /** 下拉字段的码值 → 文案映射；可传 Ref，字典异步加载后自动刷新 */
  options?:
    readonly { label: string; value: string }[] | Ref<readonly { label: string; value: string }[]>
  /** 取值来源：默认主表单，extended 表示扩展信息（本人角色/证书编号等） */
  source?: 'form' | 'extended'
}

interface Props {
  /** 必填项清单：与 useApplicationPage 提交校验共用同一份，右栏进度据此计算 */
  requiredFields: readonly { key: string; label: string }[]
  /** 主表单 */
  form: Record<string, unknown>
  /** 实时预览字段；不传时按必填项生成 */
  previewFields?: readonly ApplicationPreviewField[]
  /** 扩展信息（本人角色/证书编号/发证单位/有效期） */
  extendedForm?: Record<string, string>
  /** 填写指引；不传使用通用文案 */
  guideItems?: readonly string[]
  /** 常见退回原因；不传使用通用文案 */
  rejectItems?: readonly string[]
}

const props = withDefaults(defineProps<Props>(), {
  previewFields: () => [],
  extendedForm: () => ({}),
  guideItems: () => [
    '先选学期再填日期；切换学期会清空与新学期的日期。',
    '所有必填项填完后再提交，缺项会被本地校验拦截。',
    '佐证材料需真实有效，支持 JPG / PNG / PDF，单文件不超过 10MB。',
  ],
  rejectItems: () => [
    '必填项有缺项，提交时会提示「请填写必填项」。',
    '日期与所选学期不匹配。',
    '佐证材料未上传，或格式、大小不符合上传限制。',
    '与已有记录重复，提交前的查重检测会拦截。',
  ],
})

function valueOf(field: ApplicationPreviewField): unknown {
  return field.source === 'extended' ? props.extendedForm[field.key] : props.form[field.key]
}

/** 必填进度：空串 / 空数组均视为未填，与提交校验口径一致 */
const requiredProgress = computed(() => {
  const missing = props.requiredFields
    .filter((f) => {
      const value = props.form[f.key]
      if (Array.isArray(value)) return value.length === 0
      return value === undefined || value === null || value === ''
    })
    .map((f) => f.label)
  const done = props.requiredFields.length - missing.length
  return {
    done,
    total: props.requiredFields.length,
    percent: props.requiredFields.length
      ? Math.round((done / props.requiredFields.length) * 100)
      : 0,
    missing,
  }
})

/** 实时预览：只列已填字段；数组显示上传份数，码值按下拉映射转文案 */
const previewItems = computed(() => {
  const fields: readonly ApplicationPreviewField[] = props.previewFields.length
    ? props.previewFields
    : props.requiredFields.map((f) => ({ key: f.key, label: f.label }))
  return fields
    .map((field) => {
      const raw = valueOf(field)
      let value = ''
      if (Array.isArray(raw)) {
        value = raw.length ? `已上传 ${raw.length} 份` : ''
      } else if (raw !== undefined && raw !== null && raw !== '') {
        const options = unref(field.options)
        value = options?.find((o) => String(o.value) === String(raw))?.label ?? String(raw)
      }
      return { label: field.label, value }
    })
    .filter((item) => item.value)
})
</script>

<template>
  <div class="app-form-layout">
    <div class="app-form-layout__main">
      <slot />
    </div>

    <aside class="app-form-side" aria-label="填写辅助">
      <!-- 进度环 + 未填项 chip：把「还差什么」变成一眼可读的信息 -->
      <section class="side-card side-card--progress">
        <h3 class="side-card__title"><ListChecks :size="15" />填写进度</h3>
        <div class="side-progress">
          <div class="side-progress__ring">
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              role="img"
              :aria-label="`必填项完成 ${requiredProgress.percent}%`"
            >
              <circle
                cx="32"
                cy="32"
                r="26"
                fill="none"
                stroke="var(--el-border-color)"
                stroke-width="6"
              />
              <!-- 0% 时圆头描边会缩成一个孤立圆点，干脆不画进度弧，只留底环 -->
              <circle
                v-if="requiredProgress.percent > 0"
                cx="32"
                cy="32"
                r="26"
                fill="none"
                :stroke="
                  requiredProgress.percent === 100
                    ? 'var(--el-color-success)'
                    : 'var(--el-color-primary)'
                "
                stroke-width="6"
                stroke-linecap="round"
                pathLength="100"
                :stroke-dasharray="`${requiredProgress.percent} ${100 - requiredProgress.percent}`"
                transform="rotate(-90 32 32)"
                class="side-progress__arc"
              />
            </svg>
            <span class="side-progress__pct">{{ requiredProgress.percent }}%</span>
          </div>
          <div class="side-progress__info">
            <p class="side-progress__count">
              <b>{{ requiredProgress.done }}</b
              ><span>/ {{ requiredProgress.total }} 项必填</span>
            </p>
            <p v-if="requiredProgress.missing.length" class="side-muted">
              还差 {{ requiredProgress.missing.length }} 项
            </p>
            <p v-else class="side-progress__done">
              <CheckCircle2 :size="14" />必填项已完成，可以提交
            </p>
          </div>
        </div>
        <ul v-if="requiredProgress.missing.length" class="side-progress__missing">
          <li v-for="item in requiredProgress.missing" :key="item">{{ item }}</li>
        </ul>
      </section>

      <section class="side-card">
        <h3 class="side-card__title"><Eye :size="15" />实时预览</h3>
        <ul v-if="previewItems.length" class="side-preview">
          <li v-for="item in previewItems" :key="item.label">
            <span>{{ item.label }}</span
            ><b>{{ item.value }}</b>
          </li>
        </ul>
        <p v-else class="side-muted">填写后这里会同步显示摘要</p>
      </section>

      <section class="side-card side-card--guide">
        <h3 class="side-card__title"><Lightbulb :size="15" />填写指引</h3>
        <ol class="side-list side-list--ordered">
          <li v-for="item in guideItems" :key="item">{{ item }}</li>
        </ol>
      </section>

      <section class="side-card side-card--reject">
        <h3 class="side-card__title"><AlertTriangle :size="15" />常见退回原因</h3>
        <ul class="side-list">
          <li v-for="item in rejectItems" :key="item">{{ item }}</li>
        </ul>
      </section>
    </aside>
  </div>
</template>

<style scoped lang="scss">
.app-form-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 24px;
  align-items: start;
}

.app-form-layout__main {
  min-width: 0;

  /* 表单控件铺满剩余宽度，不再受共享容器 480px 限制 */
  :deep(.el-form-item .el-input),
  :deep(.el-form-item .el-select),
  :deep(.el-form-item .el-date-editor),
  :deep(.el-form-item .el-textarea) {
    width: 100%;
  }

  :deep(.el-form-item) {
    margin-bottom: 20px;
  }

  :deep(.el-form-item:last-child) {
    margin-bottom: 0;
  }
}

.app-form-side {
  position: sticky;
  top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.side-card {
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: $radius-lg;
  background: var(--el-bg-color);

  /* 进度卡是辅助栏的主信息：浅品牌底 + 品牌描边略作强调 */
  &--progress {
    border-color: var(--el-color-primary-light-8);
    background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-bg-color) 72%);
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 10px;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.4;
    color: var(--el-text-color-primary);

    svg {
      flex-shrink: 0;
      color: var(--el-color-primary);
    }
  }

  &--guide &__title svg {
    color: var(--el-color-warning);
  }

  &--reject &__title svg {
    color: var(--el-color-danger);
  }
}

.side-progress {
  display: flex;
  align-items: center;
  gap: 14px;

  &__ring {
    position: relative;
    flex: 0 0 64px;
    width: 64px;
    height: 64px;

    svg {
      display: block;
    }
  }

  &__arc {
    transition: stroke-dasharray 0.3s ease;
  }

  &__pct {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    font-variant-numeric: tabular-nums;
  }

  &__info {
    min-width: 0;
  }

  &__count {
    display: flex;
    align-items: baseline;
    gap: 4px;
    margin: 0;

    b {
      font-size: 22px;
      font-weight: 600;
      line-height: 1.1;
      color: var(--el-color-primary);
    }

    span {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  &__done {
    display: flex;
    align-items: center;
    gap: 4px;
    margin: 4px 0 0;
    font-size: 12px;
    color: var(--el-color-success);
  }

  &__missing {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 12px 0 0;
    padding: 0;
    list-style: none;

    li {
      padding: 0 8px;
      border-radius: 999px;
      background: var(--el-color-warning-light-9);
      color: var(--el-color-warning);
      font-size: 12px;
      line-height: 18px;
    }
  }
}

.side-preview {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 6px 0;
    font-size: 12px;
    line-height: 1.5;

    &:first-child {
      padding-top: 0;
    }

    &:last-child {
      padding-bottom: 0;
    }

    & + li {
      border-top: 1px dashed var(--el-border-color-lighter);
    }
  }

  span {
    flex-shrink: 0;
    color: var(--el-text-color-secondary);
  }

  b {
    min-width: 0;
    font-weight: 500;
    color: var(--el-text-color-primary);
    text-align: right;
    word-break: break-all;
  }
}

.side-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding-left: 16px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-regular);

  /* 指引按步骤编号，弱化项目符号的「随手记」感 */
  &--ordered {
    padding-left: 0;
    list-style: none;
    counter-reset: side-step;

    li {
      position: relative;
      padding-left: 22px;
      counter-increment: side-step;

      &::before {
        content: counter(side-step);
        position: absolute;
        top: 2px;
        left: 0;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
        font-size: 10px;
        font-weight: 600;
        line-height: 16px;
        text-align: center;
      }
    }
  }
}

.side-card--reject .side-list li::marker {
  color: var(--el-color-danger);
}

.side-muted {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

@media (max-width: 900px) {
  .app-form-layout {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }

  .app-form-side {
    position: static;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .app-form-side {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
