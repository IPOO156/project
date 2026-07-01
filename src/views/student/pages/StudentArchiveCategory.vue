<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import UiButton from '../../../components/ui/UiButton.vue'
import UiCard from '../../../components/ui/UiCard.vue'
import LineIcon from '../../../components/ui/LineIcon.vue'
import UiTag from '../../../components/ui/UiTag.vue'
import { getStudentArchiveCategory } from '../nav'
import {
  exportRecords,
  exportTemplate,
  semesterOptions,
  statusMeta,
  statusOptions,
  useArchiveStore,
} from '../archiveStore'

const route = useRoute()
const {
  records,
  addRecord,
  updateRecord,
  submitRecord,
  resubmitRecord,
  fileSizeLabel,
} = useArchiveStore()

const selectedSemester = ref('')
const selectedStatus = ref('')
const keyword = ref('')
const selectedIds = ref([])
const showForm = ref(false)
const editingId = ref('')
const formError = ref('')
const detailId = ref('')
const previewFile = ref(null)

const form = reactive({
  title: '',
  organization: '',
  date: '',
  semester: semesterOptions[0],
  status: 'draft',
  files: [],
})

const categoryKey = computed(() => String(route.params.category ?? 'honor'))
const category = computed(() => getStudentArchiveCategory(categoryKey.value))

const categoryRecords = computed(() =>
  records.value
    .filter((item) => item.category === categoryKey.value)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
)

const filteredRecords = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  return categoryRecords.value.filter((item) => {
    const matchesSemester = !selectedSemester.value || item.semester === selectedSemester.value
    const matchesStatus = !selectedStatus.value || item.status === selectedStatus.value
    const matchesKeyword =
      !key ||
      [item.title, item.organization, item.review].some((value) =>
        String(value ?? '').toLowerCase().includes(key),
      )

    return matchesSemester && matchesStatus && matchesKeyword
  })
})

const selectedRows = computed(() =>
  filteredRecords.value.filter((item) => selectedIds.value.includes(item.id)),
)

const allSelected = computed({
  get() {
    return filteredRecords.value.length > 0 && filteredRecords.value.every((item) => selectedIds.value.includes(item.id))
  },
  set(value) {
    selectedIds.value = value ? filteredRecords.value.map((item) => item.id) : []
  },
})

const detailRecord = computed(() => records.value.find((item) => item.id === detailId.value))

function resetForm() {
  editingId.value = ''
  formError.value = ''
  form.title = ''
  form.organization = ''
  form.date = new Date().toISOString().slice(0, 10)
  form.semester = semesterOptions[0]
  form.status = 'draft'
  form.files = []
}

function openCreate() {
  resetForm()
  showForm.value = true
}

function openEdit(item) {
  editingId.value = item.id
  formError.value = ''
  form.title = item.title
  form.organization = item.organization
  form.date = item.date
  form.semester = item.semester
  form.status = item.status
  form.files = item.files.map((file) => ({ ...file }))
  showForm.value = true
}

function handleFiles(event) {
  const nextFiles = Array.from(event.target.files ?? []).map((file) => ({
    name: file.name,
    size: file.size,
    type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
  }))
  form.files = [...form.files, ...nextFiles]
  event.target.value = ''
}

function removeFile(index) {
  form.files.splice(index, 1)
}

function saveRecord(submit = false) {
  if (!form.title.trim()) {
    formError.value = '请填写档案标题。'
    return
  }

  const payload = {
    category: categoryKey.value,
    title: form.title.trim(),
    organization: form.organization.trim() || '个人提交',
    date: form.date || new Date().toISOString().slice(0, 10),
    semester: form.semester,
    files: form.files,
    status: submit ? 'wait' : form.status,
    review: submit ? '已提交，等待审核。' : form.status === 'draft' ? '草稿尚未提交审核。' : undefined,
  }

  if (editingId.value) {
    updateRecord(editingId.value, payload)
  } else {
    addRecord(payload)
  }

  showForm.value = false
}

function submitOrResubmit(item) {
  if (item.status === 'no') {
    resubmitRecord(item.id)
  } else {
    submitRecord(item.id)
  }
}

function exportSelected() {
  const rows = selectedRows.value.length ? selectedRows.value : filteredRecords.value
  exportRecords(rows, `${category.value?.label ?? '成长档案'}导出.csv`)
}

function exportSingle(item) {
  exportRecords([item], `${item.title}.csv`)
}

function clearFilters() {
  selectedSemester.value = ''
  selectedStatus.value = ''
  keyword.value = ''
}

watch(
  () => route.params.category,
  () => {
    selectedIds.value = []
    clearFilters()
  },
)

watch(
  () => route.query.new,
  (value) => {
    if (value === '1') openCreate()
  },
  { immediate: true },
)

watch(
  () => route.query.view,
  (value) => {
    if (value) detailId.value = String(value)
  },
  { immediate: true },
)
</script>

<template>
  <div class="wrap">
    <div class="header">
      <div>
        <div class="title">
          <span class="icon" aria-hidden="true">
            <LineIcon :name="category?.icon ?? 'folder'" :size="18" />
          </span>
          <span>{{ category?.label ?? '成长档案' }}</span>
        </div>
        <div class="sub">支持新增、附件管理、审核提交、驳回重提和批量导出。</div>
      </div>
      <div class="right">
        <UiButton variant="ghost" @click="exportTemplate(category?.label)">导出模板</UiButton>
        <UiButton variant="secondary" @click="exportSelected">批量导出</UiButton>
        <UiButton @click="openCreate">
          <LineIcon name="plus" :size="15" />
          新增条目
        </UiButton>
      </div>
    </div>

    <UiCard>
      <div class="filters">
        <label class="field">
          <span class="lab">学期</span>
          <select v-model="selectedSemester" class="ctl">
            <option value="">全部学期</option>
            <option v-for="semester in semesterOptions" :key="semester" :value="semester">{{ semester }}</option>
          </select>
        </label>
        <label class="field">
          <span class="lab">状态</span>
          <select v-model="selectedStatus" class="ctl">
            <option v-for="item in statusOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </label>
        <label class="field grow">
          <span class="lab">关键词</span>
          <input v-model="keyword" class="ctl" placeholder="输入标题、组织或审核意见" />
        </label>
        <UiButton variant="ghost" size="sm" @click="clearFilters">清空</UiButton>
      </div>

      <div class="table">
        <div class="tr th">
          <label class="checkCell">
            <input v-model="allSelected" type="checkbox" />
          </label>
          <div>标题</div>
          <div>时间</div>
          <div>材料</div>
          <div>状态</div>
          <div>操作</div>
        </div>

        <div v-for="item in filteredRecords" :key="item.id" class="tr">
          <label class="checkCell">
            <input v-model="selectedIds" type="checkbox" :value="item.id" />
          </label>
          <div class="main">
            <button class="titleBtn" type="button" @click="detailId = item.id">{{ item.title }}</button>
            <span>{{ item.organization }} · {{ item.semester }}</span>
          </div>
          <div class="muted">{{ item.date }}</div>
          <div class="muted">{{ item.files.length }} 份</div>
          <div><UiTag :tone="statusMeta[item.status].tone">{{ statusMeta[item.status].label }}</UiTag></div>
          <div class="ops">
            <button class="linkBtn" type="button" @click="detailId = item.id">查看</button>
            <button class="linkBtn" type="button" @click="openEdit(item)">编辑</button>
            <button v-if="item.status === 'draft' || item.status === 'no'" class="linkBtn" type="button" @click="submitOrResubmit(item)">
              {{ item.status === 'no' ? '重新提交' : '提交审核' }}
            </button>
            <button class="linkBtn" type="button" @click="exportSingle(item)">导出</button>
          </div>
        </div>

        <div v-if="filteredRecords.length === 0" class="empty">
          <LineIcon name="folder" :size="26" />
          <div>
            <strong>暂无匹配条目</strong>
            <p>可以新建条目，或调整筛选条件。</p>
          </div>
        </div>
      </div>
    </UiCard>

    <div v-if="showForm" class="modalLayer" role="dialog" aria-modal="true">
      <div class="modal">
        <div class="modalHead">
          <h2>{{ editingId ? '编辑档案条目' : '新增档案条目' }}</h2>
          <button class="closeBtn" type="button" aria-label="关闭" @click="showForm = false">×</button>
        </div>

        <div class="formGrid">
          <label class="field grow">
            <span class="lab">标题</span>
            <input v-model="form.title" class="ctl" placeholder="例如：省赛获奖证明" />
          </label>
          <label class="field">
            <span class="lab">组织/项目</span>
            <input v-model="form.organization" class="ctl" placeholder="学院、组织或项目名称" />
          </label>
          <label class="field">
            <span class="lab">日期</span>
            <input v-model="form.date" class="ctl" type="date" />
          </label>
          <label class="field">
            <span class="lab">学期</span>
            <select v-model="form.semester" class="ctl">
              <option v-for="semester in semesterOptions" :key="semester" :value="semester">{{ semester }}</option>
            </select>
          </label>
        </div>

        <label class="uploadBox">
          <LineIcon name="upload" :size="20" />
          <span>选择附件</span>
          <input type="file" multiple @change="handleFiles" />
        </label>

        <div class="fileList">
          <div v-for="(file, index) in form.files" :key="`${file.name}-${index}`" class="fileRow">
            <LineIcon name="file" :size="15" />
            <span>{{ file.name }}</span>
            <small>{{ fileSizeLabel(file.size) }}</small>
            <button type="button" @click="removeFile(index)">移除</button>
          </div>
        </div>

        <div v-if="formError" class="formError">{{ formError }}</div>

        <div class="modalFoot">
          <UiButton variant="secondary" @click="saveRecord(false)">保存草稿</UiButton>
          <UiButton @click="saveRecord(true)">提交审核</UiButton>
        </div>
      </div>
    </div>

    <div v-if="detailRecord" class="modalLayer detailLayer" role="dialog" aria-modal="true">
      <div class="drawer">
        <div class="modalHead">
          <h2>{{ detailRecord.title }}</h2>
          <button class="closeBtn" type="button" aria-label="关闭" @click="detailId = ''">×</button>
        </div>
        <div class="detailMeta">
          <UiTag :tone="statusMeta[detailRecord.status].tone">{{ statusMeta[detailRecord.status].label }}</UiTag>
          <span>{{ detailRecord.organization }}</span>
          <span>{{ detailRecord.date }}</span>
          <span>{{ detailRecord.semester }}</span>
        </div>
        <section class="detailSection">
          <h3>审核意见</h3>
          <p>{{ detailRecord.review || '暂无审核意见。' }}</p>
        </section>
        <section class="detailSection">
          <h3>附件材料</h3>
          <div class="fileList">
            <div v-for="file in detailRecord.files" :key="file.name" class="fileRow">
              <LineIcon name="file" :size="15" />
              <span>{{ file.name }}</span>
              <small>{{ fileSizeLabel(file.size) }}</small>
              <button type="button" @click="previewFile = file">预览</button>
            </div>
          </div>
        </section>
        <div class="modalFoot">
          <UiButton variant="secondary" @click="openEdit(detailRecord)">编辑</UiButton>
          <UiButton v-if="detailRecord.status === 'draft' || detailRecord.status === 'no'" @click="submitOrResubmit(detailRecord)">
            {{ detailRecord.status === 'no' ? '重新提交' : '提交审核' }}
          </UiButton>
        </div>
      </div>
    </div>

    <div v-if="previewFile" class="modalLayer" role="dialog" aria-modal="true">
      <div class="preview">
        <div class="modalHead">
          <h2>附件预览</h2>
          <button class="closeBtn" type="button" aria-label="关闭" @click="previewFile = null">×</button>
        </div>
        <div class="previewBody">
          <LineIcon name="file" :size="42" />
          <strong>{{ previewFile.name }}</strong>
          <p>本地演示环境仅保留文件名和大小；接入后端后可在这里显示 PDF、图片或 Office 预览。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wrap {
  display: grid;
  gap: 16px;
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
  font-weight: 800;
  letter-spacing: 0;
  font-size: 20px;
}

.icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: var(--accent-light);
  color: var(--accent);
  border: 1px solid #c9dce5;
}

.sub {
  margin-top: 6px;
  color: var(--muted);
  font-size: 13px;
}

.right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
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
  gap: 5px;
}

.field.grow {
  flex: 1 1 260px;
  min-width: 240px;
}

.lab {
  font-size: 12px;
  color: var(--muted);
  font-weight: 600;
}

.ctl {
  min-height: 40px;
  padding: 9px 12px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: #f8fafb;
  color: var(--text);
  outline: none;
}

.ctl:focus {
  border-color: var(--accent);
  background: var(--panel);
}

.table {
  display: grid;
  gap: 8px;
}

.tr {
  display: grid;
  grid-template-columns: 34px minmax(220px, 1.35fr) 0.65fr 0.5fr 0.62fr minmax(220px, 0.9fr);
  gap: 10px;
  padding: 12px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: #f8fafb;
  align-items: center;
}

.tr.th {
  background: #f2f4f7;
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
  letter-spacing: 0;
}

.checkCell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.main {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.main span {
  color: var(--muted);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.titleBtn {
  padding: 0;
  border: none;
  background: transparent;
  color: var(--text);
  text-align: left;
  font-weight: 700;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.muted {
  color: var(--muted);
  font-weight: 600;
  font-size: 12px;
}

.ops {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.linkBtn,
.fileRow button {
  padding: 0;
  border: none;
  background: transparent;
  color: var(--link);
  font-weight: 700;
  cursor: pointer;
}

.linkBtn:hover,
.fileRow button:hover {
  text-decoration: underline;
}

.empty {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 28px;
  color: var(--muted);
  border: 1px dashed var(--border);
  border-radius: var(--radius);
}

.empty strong {
  display: block;
  color: var(--text);
  margin-bottom: 2px;
}

.modalLayer {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.28);
}

.detailLayer {
  justify-items: end;
}

.modal,
.drawer,
.preview {
  width: min(720px, 100%);
  max-height: calc(100vh - 48px);
  overflow: auto;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 20px;
}

.drawer {
  width: min(560px, 100%);
  height: calc(100vh - 48px);
}

.preview {
  width: min(460px, 100%);
}

.modalHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.modalHead h2 {
  font-size: 18px;
  line-height: 1.35;
}

.closeBtn {
  width: 34px;
  height: 34px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--panel);
  cursor: pointer;
  font-size: 22px;
  line-height: 1;
}

.formGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.uploadBox {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 76px;
  margin-top: 14px;
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  background: #f8fafb;
  color: var(--accent);
  cursor: pointer;
  font-weight: 700;
}

.uploadBox input {
  display: none;
}

.fileList {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.fileRow {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: #f8fafb;
}

.fileRow span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fileRow small {
  color: var(--muted);
}

.formError {
  margin-top: 12px;
  padding: 10px;
  border-radius: var(--radius);
  background: var(--danger-light);
  color: #b91c1c;
  font-size: 13px;
}

.modalFoot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.detailMeta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  color: var(--muted);
  font-size: 13px;
}

.detailSection {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid var(--border);
}

.detailSection h3 {
  font-size: 14px;
  margin-bottom: 8px;
}

.detailSection p {
  color: var(--muted);
}

.previewBody {
  display: grid;
  gap: 10px;
  place-items: center;
  text-align: center;
  padding: 24px 10px;
  color: var(--muted);
}

.previewBody strong {
  color: var(--text);
}

@media (max-width: 960px) {
  .tr {
    grid-template-columns: 28px 1fr;
  }

  .tr.th div:nth-child(n + 3),
  .tr > div:nth-child(n + 3) {
    display: none;
  }

  .ops {
    display: flex !important;
    grid-column: 2;
    justify-content: flex-start;
  }
}

@media (max-width: 680px) {
  .formGrid {
    grid-template-columns: 1fr;
  }
}
</style>
