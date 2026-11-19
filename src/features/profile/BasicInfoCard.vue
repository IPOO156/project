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
import AddressPicker from '@/shared/ui/AddressPicker.vue'
import { isValidEmail } from '@/shared/utils/validateEmail'
import AvatarUploader from './components/AvatarUploader.vue'

const archiveStore = useArchiveStore()
const userStore = useUserStore()

// ── 基本资料编辑 ──
// 学籍字段（学号/年级/专业/班级/姓名/学历层次/政治面貌/学生状态/出生日期）属学术身份信息，
// 文档 4.1 明确由教务系统同步、应用层只读；学生本人只能更新联系方式
// （邮箱/手机号等 PUT /profile/contact）。
const isEditing = ref(false)
/** 基本资料「保存」提交中（防连点重复提交） */
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
}
// 政治面貌、学生状态、学历层次、出生日期由学校/教务统一维护，仅在表单中只读展示，
// 不进入编辑字段、不随保存提交。
const formData = ref<Partial<ProfileEditForm>>({})
/** /profile/info 中的学籍信息（学历层次/政治面貌/学生状态的展示标签来自后端返回的 *Label 字段） */
const academicInfo = computed(() => archiveStore.profileData?.academicInfo ?? {})
/** 学历层次只读展示文本：后端标签优先，缺标签时回退原始值 */
const degreeTypeText = computed(
  () => academicInfo.value.degreeTypeLabel ?? academicInfo.value.degreeType ?? '-',
)
/** 政治面貌 / 学生状态只读展示文本（后端 *Label 字段） */
const politicalStatusText = computed(() => academicInfo.value.politicalStatusLabel ?? '-')
const studentStatusText = computed(() => academicInfo.value.studentStatusLabel ?? '-')
/** 出生日期展示文本：后端若返回带时间部分，只取日期段 */
const birthDateText = computed(() =>
  academicInfo.value.birthDate ? String(academicInfo.value.birthDate).slice(0, 10) : '-',
)

/**
 * 联系邮箱/手机号：来自 /profile/info 的 contactInfo（PUT /profile/contact 的写入目标）。
 * 后端只有这一份邮箱（user_contact_info.email）：登录用学号/工号，邮箱用于找回密码与系统邮件；
 * 登录响应 /auth/me 返回的 email 也取自同一字段，不存在独立的「账号邮箱」。
 */
const contactEmail = computed(() => archiveStore.profileData?.contactInfo?.email ?? '')
const contactPhone = computed(() => archiveStore.profileData?.contactInfo?.phone ?? '')
const contactAddress = computed(() => archiveStore.profileData?.contactInfo?.address ?? '')
const emergencyName = computed(() => archiveStore.profileData?.contactInfo?.emergencyName ?? '')
const emergencyRelation = computed(
  () => archiveStore.profileData?.contactInfo?.emergencyRelation ?? '',
)
const emergencyPhone = computed(() => archiveStore.profileData?.contactInfo?.emergencyPhone ?? '')

function startEdit() {
  const c = archiveStore.profileData?.contactInfo
  formData.value = {
    // 邮箱/手机号/紧急联系人电话均为脱敏值，留空让用户重新填写
    email: '',
    phone: '',
    address: c?.address ?? '',
    emergencyName: c?.emergencyName ?? '',
    emergencyRelation: c?.emergencyRelation ?? '',
    emergencyPhone: '',
  }
  isEditing.value = true
}

async function saveEdit() {
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
  if (!isValidEmail(String(formData.value.email ?? ''))) {
    ElMessage.warning('请输入正确的邮箱地址')
    return
  }
  // 联系方式 PUT /profile/contact：失败即终止流程，不提示「已保存」
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
  } catch {
    savingEdit.value = false
    return
  }

  savingEdit.value = false
  isEditing.value = false
  // 强制重新拉取 /profile/info（绕过 60s 缓存），保证刚保存的联系方式立即回显
  await archiveStore.fetchArchive(true)
  ElMessage.success('已保存')
}
function cancelEdit() {
  isEditing.value = false
  formData.value = {}
}

async function handleAvatarUpload(base64: string) {
  try {
    await userStore.updateAvatar(base64 || undefined)
  } catch (e) {
    // 接口失败已由请求拦截器统一提示；非 HTTP 异常（如响应缺少头像地址）需本地兜底
    if (!(e as { response?: unknown })?.response) {
      ElMessage.error('头像更新失败，请稍后重试')
    }
    return
  }
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
      <el-descriptions-item label="出生日期">{{ birthDateText }}</el-descriptions-item>
      <el-descriptions-item label="学历层次">{{ degreeTypeText }}</el-descriptions-item>
      <el-descriptions-item label="联系邮箱">{{ contactEmail || '-' }}</el-descriptions-item>
      <el-descriptions-item label="手机号">{{ contactPhone || '-' }}</el-descriptions-item>
      <el-descriptions-item label="通讯地址">{{ contactAddress || '-' }}</el-descriptions-item>
      <el-descriptions-item label="紧急联系人">{{ emergencyName || '-' }}</el-descriptions-item>
      <el-descriptions-item label="关系">{{ emergencyRelation || '-' }}</el-descriptions-item>
      <el-descriptions-item label="紧急联系电话">{{ emergencyPhone || '-' }}</el-descriptions-item>
    </el-descriptions>
    <el-form v-else :model="formData" label-width="112px" class="profile-form">
      <p class="contact-hint">
        联系邮箱、手机号、紧急联系人电话在展示时已脱敏；保存前请重新填写这三项。
        联系邮箱同时是「忘记密码」的验证码接收地址，请填写本人常用邮箱。
      </p>
      <p class="contact-hint">
        出生日期、政治面貌、学生状态、学历层次由学校/教务系统统一维护，仅展示不可修改。
      </p>
      <el-row :gutter="12">
        <el-col :span="12"
          ><el-form-item label="联系邮箱" required
            ><el-input
              v-model="formData.email"
              size="small"
              maxlength="254"
              placeholder="请输入联系邮箱" /></el-form-item
        ></el-col>
        <el-col :span="12"
          ><el-form-item label="手机号" required
            ><el-input
              v-model="formData.phone"
              size="small"
              maxlength="11"
              placeholder="请输入手机号" /></el-form-item
        ></el-col>
        <el-col :span="24"
          ><el-form-item label="通讯地址" required
            ><AddressPicker v-model="formData.address" size="small" /></el-form-item
        ></el-col>
        <el-col :span="12"
          ><el-form-item label="紧急联系人" required
            ><el-input
              v-model="formData.emergencyName"
              size="small"
              maxlength="50"
              show-word-limit /></el-form-item
        ></el-col>
        <el-col :span="12"
          ><el-form-item label="关系" required
            ><el-input
              v-model="formData.emergencyRelation"
              size="small"
              maxlength="20"
              show-word-limit
              placeholder="如：父亲" /></el-form-item
        ></el-col>
        <el-col :span="12"
          ><el-form-item label="紧急联系电话" required
            ><el-input
              v-model="formData.emergencyPhone"
              size="small"
              maxlength="11"
              placeholder="请输入紧急联系人电话" /></el-form-item
        ></el-col>
        <el-col :span="12"
          ><el-form-item label="政治面貌"
            ><span class="readonly-value">{{ politicalStatusText }}</span></el-form-item
          ></el-col
        >
        <el-col :span="12"
          ><el-form-item label="学生状态"
            ><span class="readonly-value">{{ studentStatusText }}</span></el-form-item
          ></el-col
        >
        <el-col :span="12"
          ><el-form-item label="出生日期"
            ><span class="readonly-value">{{ birthDateText }}</span>
            <span class="form-readonly-hint">（由教务系统同步）</span></el-form-item
          ></el-col
        >
        <el-col :span="12"
          ><el-form-item label="学历层次"
            ><span class="readonly-value">{{ degreeTypeText }}</span>
            <span class="form-readonly-hint">（由管理员维护）</span></el-form-item
          ></el-col
        >
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
// 只读字段（学历层次）：与表单控件同高，避免看起来像可输入框
.readonly-value {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  font-size: 13px;
  color: #334155;
}
.form-readonly-hint {
  margin-left: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
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
  .readonly-value {
    color: #cbd5e1;
  }
}
</style>
