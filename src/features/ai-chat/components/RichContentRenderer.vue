<script setup lang="ts">
import type { CardBlock, CardIcon, ParagraphBlock, RichContent } from '../types'
/**
 * RichContentRenderer - 结构化富文本渲染
 *
 * 按 RichContent.blocks 的 type 分流渲染：paragraph / list / steps / card
 * - 高亮片段用 splitHighlight 纯函数切分（避免模板内复杂正则）
 * - 用户输入不经过此组件（仅渲染内置知识库数据），无 XSS 风险
 */
import { CircleCheck, Clock, Info, ShieldCheck } from 'lucide-vue-next'
import { splitHighlight } from '../utils/richText'

const props = defineProps<{
  content: RichContent
}>()

/** 卡片图标映射 */
const cardIconMap: Record<CardIcon, typeof Info> = {
  info: Info,
  shield: ShieldCheck,
  clock: Clock,
  success: CircleCheck,
}

function getCardIcon(icon?: CardIcon) {
  return icon ? cardIconMap[icon] : Info
}

/** 段落高亮片段（splitHighlight 为纯函数，模板调用安全） */
function paragraphSegments(block: ParagraphBlock) {
  return splitHighlight(block.text, block.highlights)
}

/** 卡片高亮片段 */
function cardSegments(block: CardBlock) {
  return splitHighlight(block.body, block.highlights)
}
</script>

<template>
  <div class="rc">
    <div v-if="props.content.greeting" class="rc__greeting">
      {{ props.content.greeting }}
    </div>

    <template v-for="(block, i) in props.content.blocks" :key="i">
      <!-- 段落 -->
      <p v-if="block.type === 'paragraph'" class="rc__p">
        <template v-for="(seg, j) in paragraphSegments(block)" :key="j">
          <span :class="{ rc__hl: seg.isHighlight }">{{ seg.text }}</span>
        </template>
      </p>

      <!-- 列表 -->
      <ul v-else-if="block.type === 'list'" class="rc__ul">
        <li v-for="(item, k) in block.items" :key="k" class="rc__li">
          <strong v-if="item.strong" class="rc__strong">{{ item.strong }}</strong>
          <span>{{ item.strong ? ' — ' : '' }}{{ item.text }}</span>
        </li>
      </ul>

      <!-- 步骤 -->
      <div v-else-if="block.type === 'steps'" class="rc__steps">
        <div v-for="step in block.items" :key="step.num" class="rc__step">
          <span class="rc__step-num">{{ step.num }}</span>
          <span class="rc__step-body">
            <strong class="rc__strong">{{ step.strong }}</strong>
            <span> — {{ step.text }}</span>
          </span>
        </div>
      </div>

      <!-- 信息卡 -->
      <div v-else-if="block.type === 'card'" class="rc__card">
        <div class="rc__card-title">
          <component :is="getCardIcon(block.icon)" :size="15" />
          <span>{{ block.title }}</span>
        </div>
        <div class="rc__card-body">
          <template v-for="(seg, j) in cardSegments(block)" :key="j">
            <span :class="{ rc__hl: seg.isHighlight }">{{ seg.text }}</span>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.rc {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  font-size: $font-size-base;
  line-height: 1.7;
  color: var(--el-text-color-primary);

  &__greeting {
    font-size: $font-size-lg;
    font-weight: 600;
    color: var(--mc-primary);
    margin-bottom: $spacing-xs;
  }

  &__p {
    margin: 0;
    color: var(--el-text-color-regular);
  }

  &__hl {
    color: var(--mc-accent);
    font-weight: 600;
    background: color-mix(in srgb, var(--mc-accent) 10%, transparent);
    padding: 0 4px;
    border-radius: $radius-sm;
  }

  &__strong {
    color: var(--mc-primary);
    font-weight: 600;
  }

  &__ul {
    margin: 0;
    padding-left: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__li {
    position: relative;
    padding-left: $spacing-lg;
    color: var(--el-text-color-regular);

    &::before {
      content: '';
      position: absolute;
      left: 4px;
      top: 9px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--mc-accent);
    }
  }

  &__steps {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__step {
    display: flex;
    align-items: flex-start;
    gap: $spacing-sm;
  }

  &__step-num {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--mc-primary), var(--mc-primary-light));
    color: #fff;
    font-size: $font-size-xs;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1px;
  }

  &__step-body {
    flex: 1;
    color: var(--el-text-color-regular);
  }

  &__card {
    background: var(--el-fill-color-light);
    border-left: 3px solid var(--mc-accent);
    border-radius: $radius-base;
    padding: $spacing-sm $spacing-md;
  }

  &__card-title {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-weight: 600;
    color: var(--mc-primary);
    font-size: $font-size-sm;
    margin-bottom: $spacing-xs;
  }

  &__card-body {
    color: var(--el-text-color-regular);
    font-size: $font-size-sm;
  }
}
</style>
