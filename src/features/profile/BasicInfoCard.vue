<script setup lang="ts">
/**
 * 基本资料卡片（档案概览页左列）。
 * 数据来自 useUserStore（账号信息/头像）与 useArchiveStore（/profile/info 的学籍与联系方式），
 * 子组件复用同一份 Pinia 实例，不重复发起 /profile/info 请求。
 */
import { ElMessage } from 'element-plus'
import { Edit2, Info } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useArchiveStore, useUserStore } from '@/app/stores/stores'
import { getDict } from '@/shared/api/common'
import { updatePoliticalStatus, updateStudentStatus } from '@/shared/api/student'
import { STUDENT_STATUS_OPTIONS } from '@/shared/constants/dict'
import AvatarUploader from './components/AvatarUploader.vue'

const archiveStore = useArchiveStore()
const userStore = useUserStore()

// ── 基本资料编辑 ──
// 学籍字段（学号/年级/专业/班级/姓名）属学术身份信息，仅只读展示，不进入编辑表单；
// 编辑表单保留可更新的联系方式（邮箱/手机号 PUT /profile/contact）与
// 政治面貌/学生状态（PUT /profile/political-status、/profile/student-status，见接口文档 4.1.5）。
const isEditing = ref(false)
/** 基本资料「保存」提交中（最多串行 3 次 PUT，防连点重复提交） */
const savingEdit = ref(false)
/**
 * 联系信息编辑表单。
 * 后端 PUT /profile/contact 六字段整体覆盖且均必填；
 * 其中邮箱/手机号/紧急联系人电话在 /profile/info 中被服务端脱敏（如 138****1234），
 * 不能把脱敏值回填提交（过不了 @Email/@Pattern），编辑时需用户重新填写。
 */
interface ProfileEditForm {
  email: string
  phone: string
  address: string
  emergencyName: string
  emergencyRelation: string
  emergencyPhone: string
  politicalStatus?: string
  studentStatus?: string
}
const formData = ref<Partial<ProfileEditForm>>({})
const politicalOptions = ref<{ value: string; label: string }[]>([])
/** /profile/info 中的学籍信息（政治面貌/学生状态的展示标签来自后端返回的 *Label 字段） */
const academicInfo = computed(() => archiveStore.profileData?.academicInfo ?? {})

/**
 * 联系邮箱/手机号：来自 /profile/info 的 contactInfo（PUT /profile/contact 的写入目标）。
 * 与「账号邮箱」（userStore.userInfo.email，用于登录与找回密码）不是同一份数据，展示上分开。
 */
const contactEmail = computed(() => archiveStore.profileData?.contactInfo?.email ?? '')
const contactPhone = computed(() => archiveStore.profileData?.contactInfo?.phone ?? '')

/** 政治面貌选项来自后端字典（GET /common/dict?dictType=political_status），不前端硬编码 */
async function loadPoliticalOptions() {
  try {
    const list = await getDict('political_status')
    politicalOptions.value = (list ?? []).map((d: any) => ({ value: d.value, label: d.label }))
  } catch {
    politicalOptions.value = []
  }
}

function startEdit() {
  const a = academicInfo.value
  const c = archiveStore.profileData?.contactInfo
  formData.value = {
    // 邮箱/手机号/紧急联系人电话均为脱敏值，留空让用户重新填写
    email: '',
    phone: '',
    address: c?.address ?? '',
    emergencyName: c?.emergencyName ?? '',
    emergencyRelation: c?.emergencyRelation ?? '',
    emergencyPhone: '',
    politicalStatus: a.politicalStatus ?? '',
    studentStatus: a.studentStatus ?? '',
  }
  isEditing.value = true
  loadPoliticalOptions()
}
async function saveEdit() {
  const a = academicInfo.value
  const required: Array<[keyof ProfileEditForm, string]> = [
    ['email', '联系邮箱'],
    ['phone', '手机号'],
    ['address', '通讯地址'],
    ['emergencyName', '紧急联系人姓名'],
    ['emergencyRelation', '与紧急联系人关系'],
    ['emergencyPhone', '紧急联系人电话'],
  ]
  const missing = required.find(([key]) => !String(formData.value[key] ?? '').trim())
  if (missing) {
    ElMessage.warning(`请填写${missing[1]}`)
    return
  }
  // 三类保存（联系方式 PUT /profile/contact、政治面貌、学生状态）任一失败即终止流程，
  // 不继续执行后续「已保存」，避免成败提示并存；失败提示由请求拦截器统一给出
  savingEdit.value = true
  try {
    await userStore.updateUserInfo({
      email: String(formData.value.email ?? '').trim(),
      phone: String(formData.value.phone ?? '').trim(),
      address: String(formData.value.address ?? '').trim(),
      emergencyName: String(formData.value.emergencyName ?? '').trim(),
      emergencyRelation: String(formData.value.emergencyRelation ?? '').trim(),
      emergencyPhone: String(formData.value.emergencyPhone ?? '').trim(),
    })
    if (formData.value.politicalStatus && formData.value.politicalStatus !== a.politicalStatus) {
      await updatePoliticalStatus(formData.value.politicalStatus)
    }
    if (formData.value.studentStatus && formData.value.studentStatus !== a.studentStatus) {
      await updateStudentStatus(formData.value.studentStatus)
    }
  } catch {
    return
  } finally {
    savingEdit.value = false
  }
  isEditing.value = false
  // 重新拉取 /profile/info，保证展示标签与后端一致
  await archiveStore.fetchArchive()
  ElMessage.success('已保存')
}
function cancelEdit() {
  isEditing.value = false
  formData.value = {}
}

async function handleAvatarUpload(base64: string) {
  await userStore.updateAvatar(base64 || undefined)
  ElMessage.success(base64 ? '头像更新成功' : '头像已删除')
}
</script>

<template>
  <el-card class="section-card" shadow="never">
    <template #header
      ><div class="section-head">
        <span class="section-head__title"><Info :size="15" /> 基本资料</span
        ><el-button
          v-if="!isEditing"
          link
          type="primary"
          size="small"
          :icon="Edit2"
          @click="startEdit"
          >编辑</el-button
        >
        <div v-else class="edit-actions">
          <el-button size="small" @click="cancelEdit">取消</el-button
          ><el-button
            size="small"
            type="primary"
            :loading="savingEdit"
            :disabled="savingEdit"
            @click="saveEdit"
            >保存</el-button
          >
        </div>
      </div></template
    >
    <div class="profile-top">
      <AvatarUploader
        :model-value="userStore.avatar ?? ''"
        :size="72"
        @upload="handleAvatarUpload"
      />
      <div>
        <h3 class="profile-top__name">{{ userStore.userName }}</h3>
        <p class="profile-top__meta">
          {{ userStore.userInfo?.major || '' }} · {{ userStore.userInfo?.className || '' }} · 学号
          {{ userStore.studentId }}
        </p>
      </div>
    </div>
    <el-descriptions v-if="!isEditing" :column="2" border class="profile-desc" size="small">
      <el-descriptions-item label="姓名">{{ userStore.userName || '-' }}</el-descriptions-item>
      <el-descriptions-item label="学号">{{ userStore.studentId || '-' }}</el-descriptions-item>
      <el-descriptions-item label="年级">{{
        userStore.userInfo?.grade || '-'
      }}</el-descriptions-item>
      <el-descriptions-item label="专业">{{
        userStore.userInfo?.major || '-'
      }}</el-descriptions-item>
      <el-descriptions-item label="班级">{{
        userStore.userInfo?.className || '-'
      }}</el-descriptions-item>
      <el-descriptions-item label="政治面貌">{{
        academicInfo.politicalStatusLabel || '-'
      }}</el-descriptions-item>
      <el-descriptions-item label="学生状态">{{
        academicInfo.studentStatusLabel || '-'
      }}</el-descriptions-item>
      <el-descriptions-item label="账号邮箱">
        {{ userStore.userInfo?.email || '-' }}
        <div class="profile-desc__hint">用于登录与找回密码，如需修改请联系管理员</div>
      </el-descriptions-item>
      <el-descriptions-item label="联系邮箱">{{ contactEmail || '-' }}</el-descriptions-item>
      <el-descriptions-item label="手机号">{{ contactPhone || '-' }}</el-descriptions-item>
    </el-descriptions>
    <el-form v-else :model="formData" label-width="100px" class="profile-form">
      <p class="contact-hint">
        联系邮箱、手机号、紧急联系人电话在展示时已脱敏；保存前请重新填写这三项。
      </p>
      <el-row :gutter="12">
        <el-col :span="12"
          ><el-form-item label="联系邮箱" required
            ><el-input
              v-model="formData.email"
              size="small"
              placeholder="请输入联系邮箱" /></el-form-item
        ></el-col>
        <el-col :span="12"
          ><el-form-item label="手机号" required
            ><el-input
              v-model="formData.phone"
              size="small"
              placeholder="请输入手机号" /></el-form-item
        ></el-col>
        <el-col :span="24"
          ><el-form-item label="通讯地址" required
            ><el-input v-model="formData.address" size="small" /></el-form-item
        ></el-col>
        <el-col :span="12"
          ><el-form-item label="紧急联系人" required
            ><el-input v-model="formData.emergencyName" size="small" /></el-form-item
        ></el-col>
        <el-col :span="12"
          ><el-form-item label="关系" required
            ><el-input
              v-model="formData.emergencyRelation"
              size="small"
              placeholder="如：父亲" /></el-form-item
        ></el-col>
        <el-col :span="12"
          ><el-form-item label="紧急联系电话" required
            ><el-input
              v-model="formData.emergencyPhone"
              size="small"
              placeholder="请输入紧急联系人电话" /></el-form-item
        ></el-col>
        <el-col :span="12"
          ><el-form-item label="政治面貌"
            ><el-select v-model="formData.politicalStatus" size="small" class="form-w">
              <el-option
                v-for="o in politicalOptions"
                :key="o.value"
                :label="o.label"
                :value="o.value" /></el-select></el-form-item
        ></el-col>
        <el-col :span="12"
          ><el-form-item label="学生状态"
            ><el-select v-model="formData.studentStatus" size="small" class="form-w">
              <el-option
                v-for="o in STUDENT_STATUS_OPTIONS"
                :key="o.value"
                :label="o.label"
                :value="o.value" /></el-select></el-form-item
        ></el-col>
      </el-row>
    </el-form>
  </el-card>
</template>

<style scoped lang="scss">
// 区块卡片
.section-card {
  border: 1px solid #f1f5f9;
  border-radius: 10px;
  :deep(.el-card__body) {
    padding: 16px 20px;
  }
}
.section-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-head__title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}
.edit-actions {
  display: flex;
  gap: 6px;
}

// 基本资料
.profile-top {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f1f5f9;
}
.profile-top__name {
  font-size: 17px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 2px;
}
.profile-top__meta {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}
.profile-desc {
  :deep(.el-descriptions__label) {
    width: 65px;
    min-width: 65px;
    text-align: center;
    font-size: 13px;
  }
  :deep(.el-descriptions__content) {
    font-size: 13px;
  }
}
.profile-desc__hint {
  margin-top: 2px;
  font-size: 12px;
  color: #94a3b8;
}
.profile-form {
  margin-top: 8px;
}
.contact-hint {
  margin: 0 0 10px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}
.form-w {
  width: 100%;
}

// ─── 夜间模式适配 ───
html.dark {
  .section-card {
    border-color: #334155;
  }
  .section-head__title {
    color: #f1f5f9;
  }

  .profile-top {
    border-bottom-color: #334155;
  }
  .profile-top__name {
    color: #f1f5f9;
  }
}
</style>
