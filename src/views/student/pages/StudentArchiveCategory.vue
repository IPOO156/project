<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import UiButton from '../../../components/ui/UiButton.vue'
import UiCard from '../../../components/ui/UiCard.vue'
import UiTag from '../../../components/ui/UiTag.vue'
import { getStudentArchiveCategory } from '../nav'

const route = useRoute()

const categoryKey = computed(() => route.params.category)
const category = computed(() => getStudentArchiveCategory(String(categoryKey.value)))
</script>

<template>
  <div class="wrap">
    <div class="header">
      <div class="left">
        <div class="title">
          <span class="icon" aria-hidden="true">{{ category?.icon ?? '📁' }}</span>
          <span>{{ category?.label ?? '成长档案' }}</span>
        </div>
        <div class="sub">统一模型：档案条目 + 材料附件 + 审核状态</div>
      </div>
      <div class="right">
        <UiButton variant="ghost">批量导出</UiButton>
        <UiButton>+ 新增条目</UiButton>
      </div>
    </div>

    <UiCard>
      <div class="filters">
        <label class="field">
          <span class="lab">学期</span>
          <select class="ctl">
            <option>2025-2026 第2学期</option>
            <option>2025-2026 第1学期</option>
          </select>
        </label>
        <label class="field">
          <span class="lab">状态</span>
          <select class="ctl">
            <option>全部</option>
            <option>待审核</option>
            <option>通过</option>
            <option>驳回</option>
          </select>
        </label>
        <label class="field grow">
          <span class="lab">关键词</span>
          <input class="ctl" placeholder="输入标题/组织/项目名称…" />
        </label>
      </div>

      <div class="table">
        <div class="tr th">
          <div>标题</div>
          <div>时间</div>
          <div>材料</div>
          <div>状态</div>
          <div>操作</div>
        </div>

        <div class="tr">
          <div class="main">示例条目：{{ category?.label ?? '成长档案' }}</div>
          <div class="muted">2026-04-12</div>
          <div class="muted">3 份</div>
          <div><UiTag tone="wait">待审核</UiTag></div>
          <div class="ops">
            <button class="linkBtn" type="button">查看</button>
            <button class="linkBtn" type="button">编辑</button>
          </div>
        </div>

        <div class="tr">
          <div class="main">示例条目：附件齐全</div>
          <div class="muted">2026-03-03</div>
          <div class="muted">8 份</div>
          <div><UiTag tone="ok">通过</UiTag></div>
          <div class="ops">
            <button class="linkBtn" type="button">查看</button>
            <button class="linkBtn" type="button">导出</button>
          </div>
        </div>

        <div class="tr">
          <div class="main">示例条目：需补充材料</div>
          <div class="muted">2026-02-01</div>
          <div class="muted">1 份</div>
          <div><UiTag tone="no">驳回</UiTag></div>
          <div class="ops">
            <button class="linkBtn" type="button">查看</button>
            <button class="linkBtn" type="button">重新提交</button>
          </div>
        </div>
      </div>

      <div class="note">后续接入：上传/预览附件、提交审核、审核意见、批量操作与导出模板。</div>
    </UiCard>
  </div>
</template>

<style scoped>
.wrap {
  display: grid;
  gap: 14px;
}

.header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 900;
  letter-spacing: 0.2px;
  font-size: 20px;
}

.icon {
  width: 34px;
  height: 34px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: rgba(15, 23, 42, 0.03);
  border: 1px solid var(--border);
  font-size: 16px;
}

.sub {
  margin-top: 6px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
}

.right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filters {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  flex-wrap: wrap;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 12px;
}

.field {
  display: grid;
  gap: 4px;
}

.field.grow {
  flex: 1 1 260px;
  min-width: 260px;
}

.lab {
  font-size: 12px;
  color: var(--muted);
  font-weight: 800;
}

.ctl {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.85);
  color: var(--text);
  outline: none;
}

.table {
  display: grid;
  gap: 8px;
}

.tr {
  display: grid;
  grid-template-columns: 1.3fr 0.7fr 0.6fr 0.7fr 0.7fr;
  gap: 10px;
  padding: 12px 12px;
  border-radius: 16px;
  border: 1px solid var(--border);
  background: rgba(15, 23, 42, 0.02);
  align-items: center;
}

.tr.th {
  background: rgba(15, 23, 42, 0.015);
  font-size: 12px;
  font-weight: 900;
  color: var(--muted);
  letter-spacing: 0.6px;
}

.main {
  font-weight: 900;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.muted {
  color: var(--muted);
  font-weight: 800;
  font-size: 12px;
}

.ops {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: flex-end;
}

.linkBtn {
  padding: 0;
  border: none;
  background: transparent;
  color: var(--link);
  font-weight: 900;
  cursor: pointer;
}

.linkBtn:hover {
  text-decoration: underline;
}

.note {
  margin-top: 12px;
  font-size: 12px;
  color: var(--muted);
}

@media (max-width: 880px) {
  .tr {
    grid-template-columns: 1fr;
    gap: 6px;
  }
  .ops {
    justify-content: flex-start;
  }
}
</style>
