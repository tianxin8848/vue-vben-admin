<script setup lang="ts">
import type { BasicOption } from '@vben/types';

import type { VbenFormSchema } from '#/adapter/form';

import { computed, onMounted, ref } from 'vue';

import { ProfileBaseSetting } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import {
  getMyProfileApi,
  getSystemSettingsApi,
  getUserInfoApi,
  updateMyProfileApi,
} from '#/api';

const profileBaseSettingRef = ref();

const departments = ref<string[]>([]);
const positions = ref<string[]>([]);
const regions = ref<string[]>([]);

const departmentOptions = computed<BasicOption[]>(() => {
  return [
    { label: '请选择', value: '' },
    ...departments.value.map((d) => ({ label: d, value: d })),
  ];
});

const positionOptions = computed<BasicOption[]>(() => {
  return [
    { label: '请选择', value: '' },
    ...positions.value.map((p) => ({ label: p, value: p })),
  ];
});

const regionOptions = computed<BasicOption[]>(() => {
  return [
    { label: '请选择', value: '' },
    ...regions.value.map((r) => ({ label: r, value: r })),
  ];
});

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      fieldName: 'realName',
      component: 'Input',
      label: '姓名',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'username',
      component: 'Input',
      label: '用户名',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'department',
      component: 'Select',
      label: '部门',
      componentProps: {
        options: departmentOptions.value,
      },
    },
    {
      fieldName: 'position',
      component: 'Select',
      label: '岗位',
      componentProps: {
        options: positionOptions.value,
      },
    },
    {
      fieldName: 'region',
      component: 'Select',
      label: '地区',
      componentProps: {
        options: regionOptions.value,
      },
    },
    {
      fieldName: 'hire_date',
      component: 'DatePicker',
      label: '本单位入职日期',
      componentProps: {
        type: 'date',
        valueFormat: 'YYYY-MM-DD',
        placeholder: '选填',
      },
    },
    {
      fieldName: 'work_start_date',
      component: 'DatePicker',
      label: '累计工龄起始日期',
      componentProps: {
        type: 'date',
        valueFormat: 'YYYY-MM-DD',
        placeholder: '选填',
      },
    },
    {
      fieldName: 'birth_date',
      component: 'DatePicker',
      label: '出生日期',
      componentProps: {
        type: 'date',
        valueFormat: 'YYYY-MM-DD',
        placeholder: '选填',
      },
    },
    {
      fieldName: 'hkid_number',
      component: 'Input',
      label: '香港身份证号',
      componentProps: {
        placeholder: '选填',
      },
    },
    {
      fieldName: 'english_address',
      component: 'Textarea',
      label: '英文住址',
      componentProps: {
        placeholder: '选填',
        rows: 3,
      },
    },
    {
      fieldName: 'emergency_contact_name',
      component: 'Input',
      label: '紧急联系人',
      componentProps: {
        placeholder: '选填',
      },
    },
    {
      fieldName: 'emergency_contact_phone',
      component: 'Input',
      label: '紧急联系人电话',
      componentProps: {
        placeholder: '选填',
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
    ElMessage.success('保存成功');
  } catch {
    ElMessage.error('保存失败');
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
