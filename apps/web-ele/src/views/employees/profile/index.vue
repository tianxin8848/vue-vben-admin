<script lang="ts" setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElAvatar,
  ElButton,
  ElCard,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
  ElUpload,
} from 'element-plus';

import { $t } from '#/locales';

import { useEmployeeProfile } from './composables/useEmployeeProfile';
import {
  AVATAR_ACCEPT,
  BANK_TEXT_FIELDS,
  BASIC_SELECT_FIELDS,
  BASIC_TEXT_FIELDS,
  EMERGENCY_TEXT_FIELDS,
  EMPLOYMENT_DATE_FIELDS,
  IDENTITY_TEXT_FIELDS,
} from './data';

const route = useRoute();
const router = useRouter();
const employeeId = route.params.id as string;

const {
  avatarFallback,
  avatarName,
  avatarSrc,
  basicForm,
  canWriteBank,
  employee,
  fetchData,
  fetchOrgOptions,
  genderOptions,
  idKindOptions,
  isLeaver,
  loading,
  maritalOptions,
  nationalIdLabel,
  profileForm,
  relationshipOptions,
  revealBank,
  save,
  saving,
  selectOptions,
  uploadAvatar,
  uploadingAvatar,
} = useEmployeeProfile(employeeId);

/** 拼 `page.employees.profileDetail.*` 下的完整 key（字段配置里只存片段） */
function td(key: string): string {
  return `page.employees.profileDetail.${key}`;
}

/** 头像上传控件：每次选完文件后清空内部列表，否则连选同一张图不会再触发 change */
const avatarUploadRef = ref();

function handleAvatarChange(uploadFile: { raw?: File }) {
  const file = uploadFile?.raw;
  if (file) {
    uploadAvatar(file);
  }
  avatarUploadRef.value?.clearFiles();
}

function goBack() {
  router.push('/employee/manage/users');
}

function reload() {
  fetchData();
  fetchOrgOptions();
}
</script>

<template>
  <Page>
    <div class="profile-toolbar">
      <ElButton @click="goBack">
        {{ $t('page.employees.profileDetail.back') }}
      </ElButton>
      <ElButton :loading="loading" @click="reload">
        {{ $t('page.employees.profileDetail.refresh') }}
      </ElButton>
      <span v-if="employee" class="profile-subtitle">
        {{
          $t('page.employees.profileDetail.subtitle', {
            department: employee.department || '-',
            name: employee.full_name || '-',
            username: employee.username,
          })
        }}
      </span>
    </div>

    <ElForm v-loading="loading" label-width="220px">
      <!-- 员工头像：PATCH /employees/{id}/avatar，选中文件即时上传 -->
      <ElCard :header="$t('page.employees.profileDetail.avatarInfo')">
        <div class="avatar-panel">
          <ElAvatar
            class="avatar-preview"
            :size="120"
            shape="square"
            :src="avatarSrc"
          >
            <span class="avatar-fallback">{{ avatarFallback }}</span>
          </ElAvatar>
          <div class="avatar-side">
            <ElUpload
              ref="avatarUploadRef"
              :accept="AVATAR_ACCEPT"
              :auto-upload="false"
              :disabled="uploadingAvatar"
              :show-file-list="false"
              :on-change="handleAvatarChange"
            >
              <ElButton :loading="uploadingAvatar" type="primary">
                {{
                  avatarName
                    ? $t('page.employees.profileDetail.changeAvatar')
                    : $t('page.employees.profileDetail.uploadAvatar')
                }}
              </ElButton>
            </ElUpload>
            <p v-if="avatarName" class="avatar-name">
              {{
                $t('page.employees.profileDetail.currentAvatar', {
                  name: avatarName,
                })
              }}
            </p>
            <p class="section-hint avatar-tip">
              {{ $t('page.employees.profileDetail.avatarHint') }}
            </p>
          </div>
        </div>
      </ElCard>

      <!-- 基础信息：PATCH /employees/{id}/basic-info -->
      <ElCard
        class="section-card"
        :header="$t('page.employees.profileDetail.basicInfo')"
      >
        <p class="section-hint">
          {{ $t('page.employees.profileDetail.basicInfoHint') }}
        </p>
        <ElFormItem :label="$t('page.employees.profileDetail.account')">
          <ElInput :model-value="employee?.username || ''" disabled />
        </ElFormItem>
        <ElFormItem
          v-for="field in BASIC_TEXT_FIELDS"
          :key="field.fieldName"
          :label="$t(td(field.label))"
        >
          <ElInput
            v-model="basicForm[field.fieldName]"
            clearable
            :maxlength="field.maxlength"
            :placeholder="field.placeholder ? $t(td(field.placeholder)) : ''"
          />
        </ElFormItem>
        <ElFormItem
          v-for="field in BASIC_SELECT_FIELDS"
          :key="field.fieldName"
          :label="$t(td(field.label))"
        >
          <ElSelect
            v-model="basicForm[field.fieldName]"
            clearable
            :placeholder="$t(td('selectPlaceholder'))"
          >
            <ElOption
              v-for="option in selectOptions[field.fieldName]"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <p class="section-hint">
          {{ $t('page.employees.profileDetail.loginEmailHint') }}
        </p>
      </ElCard>

      <!-- 证件与身份信息：PATCH /employees/{id}/profile -->
      <ElCard
        class="section-card"
        :header="$t('page.employees.profileDetail.identityInfo')"
      >
        <p class="section-hint">
          {{ $t('page.employees.profileDetail.identityHint') }}
        </p>
        <ElFormItem
          v-for="field in IDENTITY_TEXT_FIELDS"
          :key="field.fieldName"
          :label="$t(td(field.label))"
        >
          <ElInput
            v-model="profileForm[field.fieldName]"
            clearable
            :maxlength="field.maxlength"
            :placeholder="field.placeholder ? $t(td(field.placeholder)) : ''"
          />
        </ElFormItem>
        <ElFormItem :label="$t(td('gender'))">
          <ElSelect
            v-model="profileForm.gender"
            clearable
            :placeholder="$t(td('selectPlaceholder'))"
          >
            <ElOption
              v-for="option in genderOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem :label="$t(td('maritalStatus'))">
          <ElSelect
            v-model="profileForm.marital_status"
            clearable
            :placeholder="$t(td('selectPlaceholder'))"
          >
            <ElOption
              v-for="option in maritalOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem :label="$t(td('birthDate'))">
          <ElDatePicker
            v-model="profileForm.birth_date"
            :placeholder="$t(td('datePlaceholder'))"
            type="date"
            value-format="YYYY-MM-DD"
          />
        </ElFormItem>
        <ElFormItem :label="$t(td('idKind'))">
          <ElSelect
            v-model="profileForm.id_kind"
            clearable
            :placeholder="$t(td('selectPlaceholder'))"
          >
            <ElOption
              v-for="option in idKindOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem :label="nationalIdLabel">
          <ElInput
            v-model="profileForm.hkid_number"
            clearable
            maxlength="50"
            :placeholder="$t(td('nationalIdPlaceholder'))"
          />
        </ElFormItem>
        <ElFormItem :label="$t(td('englishAddress'))">
          <ElInput
            v-model="profileForm.english_address"
            maxlength="300"
            :placeholder="$t(td('englishAddressPlaceholder'))"
            :rows="2"
            type="textarea"
          />
        </ElFormItem>
      </ElCard>

      <!-- 任职信息 -->
      <ElCard
        class="section-card"
        :header="$t('page.employees.profileDetail.employmentInfo')"
      >
        <p class="section-hint">
          {{ $t('page.employees.profileDetail.employmentHint') }}
        </p>
        <ElFormItem
          v-for="field in EMPLOYMENT_DATE_FIELDS"
          :key="field.fieldName"
          :label="$t(td(field.label))"
        >
          <ElDatePicker
            v-model="profileForm[field.fieldName]"
            :placeholder="$t(td('datePlaceholder'))"
            type="date"
            value-format="YYYY-MM-DD"
          />
        </ElFormItem>
        <p v-if="isLeaver" class="section-hint">
          {{ $t('page.employees.profileDetail.lastWorkingDateLocked') }}
        </p>
      </ElCard>

      <!-- 工作所在地紧急联系人 -->
      <ElCard
        class="section-card"
        :header="$t('page.employees.profileDetail.emergencyInfo')"
      >
        <ElFormItem
          v-for="field in EMERGENCY_TEXT_FIELDS"
          :key="field.fieldName"
          :label="$t(td(field.label))"
        >
          <ElInput
            v-model="profileForm[field.fieldName]"
            clearable
            :maxlength="field.maxlength"
            :placeholder="field.placeholder ? $t(td(field.placeholder)) : ''"
          />
        </ElFormItem>
        <ElFormItem :label="$t(td('emergencyContactRelationship'))">
          <ElSelect
            v-model="profileForm.emergency_contact_relationship"
            clearable
            :placeholder="$t(td('selectPlaceholder'))"
          >
            <ElOption
              v-for="option in relationshipOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
      </ElCard>

      <!-- 自动转账资料 -->
      <ElCard
        class="section-card"
        :header="$t('page.employees.profileDetail.bankInfo')"
      >
        <p class="section-hint">
          {{
            canWriteBank
              ? $t('page.employees.profileDetail.bankHint')
              : $t('page.employees.profileDetail.bankLocked')
          }}
        </p>
        <ElFormItem
          v-for="field in BANK_TEXT_FIELDS"
          :key="field.fieldName"
          :label="$t(td(field.label))"
        >
          <ElInput
            v-model="profileForm[field.fieldName]"
            clearable
            :disabled="!canWriteBank"
            :maxlength="field.maxlength"
            :placeholder="field.placeholder ? $t(td(field.placeholder)) : ''"
          />
        </ElFormItem>
        <ElFormItem :label="$t(td('bankAccountNumber'))">
          <div class="bank-account-row">
            <ElInput
              v-model="profileForm.bank_account_number"
              clearable
              :disabled="!canWriteBank"
              maxlength="100"
              :placeholder="$t(td('bankAccountNumberPlaceholder'))"
            />
            <ElButton v-if="canWriteBank" @click="revealBank">
              {{ $t('page.employees.profileDetail.revealBank') }}
            </ElButton>
          </div>
        </ElFormItem>
      </ElCard>
    </ElForm>

    <div class="profile-actions">
      <ElButton :loading="saving" type="primary" @click="save">
        {{ $t('page.employees.profileDetail.save') }}
      </ElButton>
    </div>
  </Page>
</template>

<style scoped>
.profile-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.profile-subtitle {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.section-card {
  margin-top: 20px;
}

.section-hint {
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.avatar-panel {
  display: flex;
  gap: 24px;
  align-items: center;
}

.avatar-preview {
  flex-shrink: 0;
  background: var(--el-fill-color-light);
}

.avatar-fallback {
  font-size: 32px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.avatar-side {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
}

.avatar-name {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.avatar-tip {
  margin: 0;
}

.bank-account-row {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
}

.profile-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
