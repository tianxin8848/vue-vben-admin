<script setup lang="ts">
import type { BasicOption } from '@vben/types';

import type { VbenFormSchema } from '#/adapter/form';

import { computed, onMounted, ref } from 'vue';

import { ProfileBaseSetting } from '@vben/common-ui';
import { $t } from '@vben/locales';

import {
  getMyProfileApi,
  getSystemSettingsApi,
  getUserInfoApi,
  updateMyProfileApi,
} from '#/api';
import { handleActionError, toastSuccess } from '#/utils/message';

const profileBaseSettingRef = ref();

const departments = ref<string[]>([]);
const positions = ref<string[]>([]);
const regions = ref<string[]>([]);

const departmentOptions = computed<BasicOption[]>(() => {
  return [
    { label: $t('profile.pleaseSelect'), value: '' },
    ...departments.value.map((d) => ({ label: d, value: d })),
  ];
});

const positionOptions = computed<BasicOption[]>(() => {
  return [
    { label: $t('profile.pleaseSelect'), value: '' },
    ...positions.value.map((p) => ({ label: p, value: p })),
  ];
});

const regionOptions = computed<BasicOption[]>(() => {
  return [
    { label: $t('profile.pleaseSelect'), value: '' },
    ...regions.value.map((r) => ({ label: r, value: r })),
  ];
});

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      fieldName: 'realName',
      component: 'Input',
      label: $t('profile.realName'),
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'username',
      component: 'Input',
      label: $t('profile.username'),
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'department',
      component: 'Select',
      label: $t('profile.department'),
      componentProps: {
        options: departmentOptions.value,
      },
    },
    {
      fieldName: 'position',
      component: 'Select',
      label: $t('profile.position'),
      componentProps: {
        options: positionOptions.value,
      },
    },
    {
      fieldName: 'region',
      component: 'Select',
      label: $t('profile.region'),
      componentProps: {
        options: regionOptions.value,
      },
    },
    {
      fieldName: 'hire_date',
      component: 'DatePicker',
      label: $t('profile.hireDate'),
      componentProps: {
        type: 'date',
        valueFormat: 'YYYY-MM-DD',
        placeholder: $t('profile.optional'),
      },
    },
    {
      fieldName: 'work_start_date',
      component: 'DatePicker',
      label: $t('profile.workStartDate'),
      componentProps: {
        type: 'date',
        valueFormat: 'YYYY-MM-DD',
        placeholder: $t('profile.optional'),
      },
    },
    {
      fieldName: 'birth_date',
      component: 'DatePicker',
      label: $t('profile.birthDate'),
      componentProps: {
        type: 'date',
        valueFormat: 'YYYY-MM-DD',
        placeholder: $t('profile.optional'),
      },
    },
    {
      fieldName: 'hkid_number',
      component: 'Input',
      label: $t('profile.hkidNumber'),
      componentProps: {
        placeholder: $t('profile.optional'),
      },
    },
    {
      fieldName: 'english_address',
      component: 'Textarea',
      label: $t('profile.englishAddress'),
      componentProps: {
        placeholder: $t('profile.optional'),
        rows: 3,
      },
    },
    {
      fieldName: 'emergency_contact_name',
      component: 'Input',
      label: $t('profile.emergencyContactName'),
      componentProps: {
        placeholder: $t('profile.optional'),
      },
    },
    {
      fieldName: 'emergency_contact_phone',
      component: 'Input',
      label: $t('profile.emergencyContactPhone'),
      componentProps: {
        placeholder: $t('profile.optional'),
      },
    },
  ];
});

async function loadSystemSettings() {
  try {
    const settings = await getSystemSettingsApi();
    departments.value = settings.departments || [];
    positions.value = settings.positions || [];
    regions.value = settings.regions || [];
  } catch {
    departments.value = [];
    positions.value = [];
    regions.value = [];
  }
}

async function loadUserData() {
  const [userInfo, profile] = await Promise.all([
    getUserInfoApi(),
    getMyProfileApi(),
  ]);

  const formData: Record<string, any> = {
    realName: userInfo.realName,
    username: userInfo.username,
    department: userInfo.department || '',
    position: userInfo.position || '',
    region: userInfo.region || '',
  };

  if (profile) {
    formData.hire_date = profile.hire_date || '';
    formData.work_start_date = profile.work_start_date || '';
    formData.birth_date = profile.birth_date || '';
    formData.hkid_number = profile.hkid_number || '';
    formData.english_address = profile.english_address || '';
    formData.emergency_contact_name = profile.emergency_contact_name || '';
    formData.emergency_contact_phone = profile.emergency_contact_phone || '';
  }

  profileBaseSettingRef.value.getFormApi().setValues(formData);
}

async function handleSubmit(values: Record<string, any>) {
  try {
    const profilePayload = {
      hire_date: values.hire_date || null,
      work_start_date: values.work_start_date || null,
      birth_date: values.birth_date || null,
      hkid_number: values.hkid_number || null,
      english_address: values.english_address || null,
      emergency_contact_name: values.emergency_contact_name || null,
      emergency_contact_phone: values.emergency_contact_phone || null,
    };

    await updateMyProfileApi(profilePayload);
    toastSuccess($t('profile.savedSuccess'));
  } catch (error) {
    handleActionError(
      '_core/profile/base-setting',
      error,
      $t('profile.savedFailed'),
    );
  }
}

onMounted(async () => {
  await loadSystemSettings();
  await loadUserData();
});
</script>
<template>
  <ProfileBaseSetting
    ref="profileBaseSettingRef"
    :form-schema="formSchema"
    @submit="handleSubmit"
  />
</template>
