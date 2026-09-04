<script setup lang="ts">
import { Eye, FileText, ImageIcon } from 'lucide-vue-next'
import { computed, ref } from 'vue'

interface Props {
  record: any | null
  visible: boolean
}
const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'prev'): void; (e: 'next'): void }>()

const previewVisible = ref(false)
const previewUrl = ref('')

const formFields = computed(() => {
  if (!props.record?.formData) return []
  const skipFields = [
    'id',
    'status',
    'submitDate',
    'semester',
    'proofMaterials',
    'type',
    'typeLabel',
    'sourcePath',
  ]
  return Object.entries(props.record.formData)
    .filter(([k]) => !skipFields.includes(k))
    .map(([k, v]) => ({ key: k, label: getFieldLabel(k as string), value: v }))
})

function previewAttachment(url: string) {
  previewUrl.value = url
  previewVisible.value = true
}
function isImage(name: string) {
  return /\.(?:jpg|jpeg|png|gif|webp)$/i.test(name)
}

function recordTitle(record: any): string {
  if (!record) return '审核详情'
  return `${record.title || record.name} - ${record.typeLabel ?? record.type}`
}

function getFieldLabel(key: string): string {
  const labels: Record<string, string> = {
    competitionName: '竞赛名称',
    competitionType: '竞赛类型',
    awardLevel: '获奖等级',
    awardDate: '获奖时间',
    companyName: '公司名称',
    industryType: '行业类型',
    companyType: '公司类型',
    teamRole: '团队角色',
    registerDate: '注册时间',
    projectName: '项目名称',
    projectLevel: '项目级别',
    researchType: '研究类型',
    projectDate: '项目时间',
    awardName: '奖项名称',
    scholarshipLevel: '奖学金级别',
    scholarshipGrade: '获奖等级',
    acquireDate: '获得时间',
    certType: '证书类型',
    certName: '证书名称',
    certDate: '获得时间',
    company: '实习公司',
    location: '实习地点',
    position: '实习岗位',
    startDate: '开始时间',
    endDate: '结束时间',
    organizationLevel: '组织级别',
    department: '部门',
    activityName: '活动名称',
    organization: '组织单位',
    volunteerHours: '志愿时长',
    bookName: '图书名称',
    bookDate: '阅读时间',
    review: '心得体会',
    projectContent: '项目内容',
    competitionDate: '参赛时间',
    competitionLevel: '竞赛级别',
    journalName: '期刊名称',
    paperName: '论文名称',
    ranking: '排名/总人数',
    publishDate: '发表时间',
    softName: '软著名称',
    issuer: '颁发单位',
    approveDate: '获批时间',
    role: '本人角色',
    certNumber: '证书编号',
    issuingAuthority: '发证单位',
    acquisitionDate: '取得时间',
    validityPeriod: '有效期',
    title: '标题',
    semester: '学期',
  }
  return labels[key] || key
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="recordTitle(record)"
    width="700px"
    top="5vh"
    :close-on-click-modal="false"
    class="review-panel"
    @close="emit('close')"
  >
    <template v-if="record">
      <div class="review-panel__layout">
        <div class="review-panel__form">
          <div class="review-panel__section-title">申报信息</div>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="标题">{{
              record.title || record.name
            }}</el-descriptions-item>
            <el-descriptions-item label="申报类型">{{
              record.typeLabel ?? record.type
            }}</el-descriptions-item>
            <el-descriptions-item v-if="record.name" label="姓名">{{
              record.name
            }}</el-descriptions-item>
            <el-descriptions-item v-if="record.studentId" label="学号">{{
              record.studentId
            }}</el-descriptions-item>
            <el-descriptions-item v-if="record.className" label="班级">{{
              record.className
            }}</el-descriptions-item>
            <el-descriptions-item v-if="record.semester" label="学期">{{
              record.semester
            }}</el-descriptions-item>
            <el-descriptions-item label="提交时间">{{ record.submitDate }}</el-descriptions-item>
          </el-descriptions>
          <div class="review-panel__section-title review-panel__section-title--gap">填报内容</div>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item
              v-for="field in formFields"
              :key="field.key"
              :label="field.label"
              >{{ field.value || '-' }}</el-descriptions-item
            >
          </el-descriptions>
        </div>
        <div class="review-panel__attachments">
          <div class="review-panel__section-title">证明材料</div>
          <div v-if="record.attachments?.length" class="review-panel__files">
            <div
              v-for="(file, idx) in record.attachments"
              :key="idx"
              class="review-panel__file"
              @click="previewAttachment(file.url)"
            >
              <div class="review-panel__file-icon">
                <component :is="isImage(file.name) ? ImageIcon : FileText" :size="24" />
              </div>
              <div class="review-panel__file-info">
                <span class="review-panel__file-name">{{ file.name }}</span>
              </div>
              <Eye :size="16" class="review-panel__file-preview" />
            </div>
          </div>
          <div v-else class="review-panel__no-files">暂无附件材料</div>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="review-panel__footer">
        <div class="review-panel__nav">
          <el-button size="small" @click="emit('prev')">← 上一条</el-button
          ><el-button size="small" @click="emit('next')">下一条 →</el-button>
        </div>
        <div class="review-panel__actions"><slot name="actions" /></div>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.review-panel {
  &__layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $spacing-lg;
    min-height: 300px;
  }
  &__form {
    overflow-y: auto;
    max-height: 50vh;
  }
  &__attachments {
    border-left: 1px solid var(--el-border-color-light);
    padding-left: $spacing-lg;
    overflow-y: auto;
    max-height: 50vh;
  }
  &__section-title {
    font-size: $font-size-base;
    font-weight: 600;
    color: $color-text-primary;
    margin-bottom: $spacing-md;
    padding-bottom: $spacing-sm;
    border-bottom: 1px solid var(--el-border-color-light);

    &--gap {
      margin-top: $spacing-lg;
    }
  }
  &__files {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }
  &__file {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md;
    border: 1px solid var(--el-border-color-light);
    border-radius: $radius-lg;
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
      border-color: $color-accent;
      background: $color-primary-lightest;
    }
  }
  &__file-icon {
    width: 40px;
    height: 40px;
    border-radius: $radius-base;
    background: var(--el-fill-color-light);
    display: flex;
    align-items: center;
    justify-content: center;
    color: $color-primary-lighter;
  }
  &__file-info {
    flex: 1;
    min-width: 0;
  }
  &__file-name {
    font-size: $font-size-sm;
    font-weight: 500;
    color: $color-text-primary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &__file-preview {
    color: $color-primary-lighter;
    flex-shrink: 0;
  }
  &__no-files {
    text-align: center;
    padding: $spacing-2xl;
    color: var(--el-text-color-secondary);
    font-size: $font-size-base;
  }
  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }
  &__nav {
    display: flex;
    gap: $spacing-sm;
  }
  &__actions {
    display: flex;
    gap: $spacing-sm;
    flex-wrap: wrap;
    align-items: center;
  }
}
@media (max-width: 900px) {
  .review-panel__layout {
    grid-template-columns: 1fr;
  }
  .review-panel__attachments {
    border-left: none;
    padding-left: 0;
    border-top: 1px solid var(--el-border-color-light);
    padding-top: $spacing-lg;
  }
}
</style>
