<script lang="ts" setup>
import type { EmployeeApi, SystemSettingsApi } from '#/api';

import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useI18n } from '@vben/locales';

import {
  ElButton,
  ElCard,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
} from 'element-plus';

import {
  getEmployeeProfileApi,
  getEmployeesApi,
  getSystemSettingsApi,
  updateEmployeeBasicInfoApi,
  updateEmployeeProfileApi,
} from '#/api';
import { handleActionError, toastSuccess } from '#/utils/message';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const loading = ref(false);

const employeeId = route.params.id as string;
const employee = ref<EmployeeApi.EmployeeResponse | null>(null);
const profile = ref<EmployeeApi.EmployeeProfileResponse | null>(null);

const basicInfoForm = reactive<EmployeeApi.EmployeeBasicInfoUpdate>({
  department: '',
  position: '',
  region: '',
});

const profileForm = reactive<Partial<EmployeeApi.EmployeeProfileUpdate>>({
  emergency_contact_name: '',
  emergency_contact_phone: '',
  english_address: '',
  hire_date: '',
  hkid_number: '',
  work_start_date: '',
});

const departmentOptions = ref<{ label: string; value: string }[]>([]);
const positionOptions = ref<{ label: string; value: string }[]>([]);
const regionOptions = ref<{ label: string; value: string }[]>([]);

async function fetchSystemSettings() {
  try {
    const settings: SystemSettingsApi.SystemSettingsResponse =
      await getSystemSettingsApi();
    departmentOptions.value = (settings.departments || []).map((d) => ({
      label: d,
      value: d,
    }));
    positionOptions.value = (settings.positions || []).map((p) => ({
      label: p,
      value: p,
    }));
    regionOptions.value = (settings.regions || []).map((r) => ({
      label: r,
      value: r,
    }));
  } catch {
    // 获取失败保持空选项
  }
}

async function fetchData() {
  loading.value = true;
  try {
    const [empList, profileRes] = await Promise.all([
      getEmployeesApi(),
      getEmployeeProfileApi(employeeId),
    ]);
    employee.value = empList.find((e) => e.id === employeeId) || null;
    profile.value = profileRes;

    if (employee.value) {
      basicInfoForm.department = employee.value.department || '';
      basicInfoForm.position = employee.value.position || '';
      basicInfoForm.region = employee.value.region || '';
    }

    if (profile.value) {
      Object.assign(profileForm, {
        emergency_contact_name: profile.value.emergency_contact_name || '',
        emergency_contact_phone: profile.value.emergency_contact_phone || '',
        english_address: profile.value.english_address || '',
        hire_date: profile.value.hire_date || '',
        hkid_number: profile.value.hkid_number || '',
        work_start_date: profile.value.work_start_date || '',
      });
    }
  } finally {
    loading.value = false;
  }
}

async function handleUpdateBasicInfo() {
  try {
    await updateEmployeeBasicInfoApi(employeeId, basicInfoForm);
    toastSuccess(t('page.employees.profileDetail.basicInfoUpdateSuccess'));
    fetchData();
  } catch (error) {
    handleActionError(
      'employees/profile',
      error,
      t('page.employees.profileDetail.updateFailed'),
    );
  }
}

async function handleUpdateProfile() {
  try {
    await updateEmployeeProfileApi(employeeId, profileForm);
    toastSuccess(t('page.employees.profileDetail.profileInfoUpdateSuccess'));
    fetchData();
  } catch (error) {
    handleActionError(
      'employees/profile',
      error,
      t('page.employees.profileDetail.updateFailed'),
    );
  }
}

function goBack() {
  router.push('/employee/manage/users');
}

onMounted(() => {
  fetchData();
  fetchSystemSettings();
});
</script>

<template>
  <Page>
    <ElButton @click="goBack" style="margin-bottom: 16px">
      {{ t('page.employees.profileDetail.back') }}
    </ElButton>
    <ElCard
      v-if="employee"
      :header="t('page.employees.profileDetail.basicInfo')"
    >
      <ElForm :model="basicInfoForm" label-width="auto">
        <ElFormItem :label="t('page.employees.profileDetail.account')">
          <ElInput :model-value="employee.username" disabled />
        </ElFormItem>
        <ElFormItem :label="t('page.employees.profileDetail.fullName')">
          <ElInput :model-value="employee.full_name || ''" disabled />
        </ElFormItem>
        <ElFormItem :label="t('page.employees.profileDetail.email')">
          <ElInput :model-value="employee.email" disabled />
        </ElFormItem>
        <ElFormItem :label="t('page.employees.profileDetail.phone')">
          <ElInput :model-value="employee.phone || ''" disabled />
        </ElFormItem>
        <ElFormItem :label="t('page.employees.profileDetail.department')">
          <ElSelect v-model="basicInfoForm.department" clearable>
            <ElOption
              v-for="opt in departmentOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem :label="t('page.employees.profileDetail.position')">
          <ElSelect v-model="basicInfoForm.position" clearable>
            <ElOption
              v-for="opt in positionOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem :label="t('page.employees.profileDetail.region')">
          <ElSelect v-model="basicInfoForm.region" clearable>
            <ElOption
              v-for="opt in regionOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="handleUpdateBasicInfo">
            {{ t('page.employees.profileDetail.save') }}
          </ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>

    <ElCard
      v-if="profile"
      :header="t('page.employees.profileDetail.profileInfo')"
      style="margin-top: 20px"
    >
      <ElForm :model="profileForm" label-width="auto">
        <ElFormItem :label="t('page.employees.profileDetail.hireDate')">
          <ElDatePicker
            v-model="profileForm.hire_date"
            type="date"
            value-format="YYYY-MM-DD"
          />
        </ElFormItem>
        <ElFormItem :label="t('page.employees.profileDetail.workStartDate')">
          <ElDatePicker
            v-model="profileForm.work_start_date"
            type="date"
            value-format="YYYY-MM-DD"
          />
        </ElFormItem>
        <ElFormItem :label="t('page.employees.profileDetail.hkidNumber')">
          <ElInput v-model="profileForm.hkid_number" />
        </ElFormItem>
        <ElFormItem :label="t('page.employees.profileDetail.englishAddress')">
          <ElInput v-model="profileForm.english_address" />
        </ElFormItem>
        <ElFormItem :label="t('page.employees.profileDetail.emergencyContact')">
          <ElInput v-model="profileForm.emergency_contact_name" />
        </ElFormItem>
        <ElFormItem
          :label="t('page.employees.profileDetail.emergencyContactPhone')"
        >
          <ElInput v-model="profileForm.emergency_contact_phone" />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="handleUpdateProfile">
            {{ t('page.employees.profileDetail.save') }}
          </ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>
  </Page>
</template>
