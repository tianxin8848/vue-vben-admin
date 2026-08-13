<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page, Profile, ProfileBaseSetting } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { ElMessage } from 'element-plus';

import {
  getMyProfileApi,
  getUserInfoApi,
  updateMyBasicInfoApi,
  updateMyProfileApi,
} from '#/api';

const userStore = useUserStore();

const loading = ref(false);

const activeTab = ref<'basic' | 'profile'>('basic');

const basicFormRef = ref();
const profileFormRef = ref();

const userInfo = computed(() => ({
  avatar: userStore.userInfo?.avatar ?? '',
  realName: userStore.userInfo?.realName ?? '',
  userId: userStore.userInfo?.userId ?? '',
  username: userStore.userInfo?.username ?? '',
}));

const basicInfoForm = reactive({
  department: '',
  position: '',
  region: '',
});

const profileForm = reactive({
  address: '',
  birth_date: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  hire_date: '',
  id_number: '',
  work_start_date: '',
});

const departmentOptions = [
  { label: '技术部', value: '技术部' },
  { label: '人事部', value: '人事部' },
  { label: '财务部', value: '财务部' },
  { label: '市场部', value: '市场部' },
];

const tabs = [
  { label: '基本信息', value: 'basic' },
  { label: '档案信息', value: 'profile' },
];

const basicSchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: { disabled: true },
    fieldName: 'username',
    label: '账号',
  },
  {
    component: 'Input',
    componentProps: { disabled: true },
    fieldName: 'full_name',
    label: '姓名',
  },
  {
    component: 'Input',
    componentProps: { disabled: true },
    fieldName: 'email',
    label: '邮箱',
  },
  {
    component: 'Input',
    componentProps: { disabled: true },
    fieldName: 'phone',
    label: '手机号',
  },
  {
    component: 'Select',
    componentProps: {
      clearable: true,
      options: departmentOptions,
      placeholder: '请选择部门',
    },
    fieldName: 'department',
    label: '部门',
  },
  {
    component: 'Input',
    componentProps: { placeholder: '请输入职位' },
    fieldName: 'position',
    label: '职位',
  },
  {
    component: 'Input',
    componentProps: { placeholder: '请输入区域' },
    fieldName: 'region',
    label: '区域',
  },
];

const profileSchema: VbenFormSchema[] = [
  {
    component: 'DatePicker',
    componentProps: {
      placeholder: '请选择日期',
      type: 'date',
      valueFormat: 'YYYY-MM-DD',
    },
    fieldName: 'hire_date',
    label: '入职日期',
  },
  {
    component: 'DatePicker',
    componentProps: {
      placeholder: '请选择日期',
      type: 'date',
      valueFormat: 'YYYY-MM-DD',
    },
    fieldName: 'work_start_date',
    label: '工作开始日期',
  },
  {
    component: 'DatePicker',
    componentProps: {
      placeholder: '请选择日期',
      type: 'date',
      valueFormat: 'YYYY-MM-DD',
    },
    fieldName: 'birth_date',
    label: '出生日期',
  },
  {
    component: 'Input',
    componentProps: { placeholder: '请输入身份证号' },
    fieldName: 'id_number',
    label: '身份证号',
  },
  {
    component: 'Input',
    componentProps: { placeholder: '请输入住址' },
    fieldName: 'address',
    label: '住址',
  },
  {
    component: 'Input',
    componentProps: { placeholder: '请输入紧急联系人' },
    fieldName: 'emergency_contact_name',
    label: '紧急联系人',
  },
  {
    component: 'Input',
    componentProps: { placeholder: '请输入紧急联系电话' },
    fieldName: 'emergency_contact_phone',
    label: '紧急联系电话',
  },
];

async function fetchData() {
  loading.value = true;
  try {
    const [userRes, profileRes] = await Promise.all([
      getUserInfoApi(),
      getMyProfileApi(),
    ]);

    basicInfoForm.department = userRes.department || '';
    basicInfoForm.position = userRes.position || '';
    basicInfoForm.region = userRes.region || '';

    Object.assign(profileForm, {
      address: profileRes.address || '',
      birth_date: profileRes.birth_date || '',
      emergency_contact_name: profileRes.emergency_contact_name || '',
      emergency_contact_phone: profileRes.emergency_contact_phone || '',
      hire_date: profileRes.hire_date || '',
      id_number: profileRes.id_number || '',
      work_start_date: profileRes.work_start_date || '',
    });

    basicFormRef.value?.getFormApi().setValues({
      ...basicInfoForm,
      email: userRes.email,
      full_name: userRes.realName,
      phone: userRes.phone || '',
      username: userRes.username,
    });

    profileFormRef.value?.getFormApi().setValues({ ...profileForm });
  } finally {
    loading.value = false;
  }
}

async function handleUpdateBasicInfo(values: Record<string, any>) {
  try {
    await updateMyBasicInfoApi({
      department: values.department || '',
      position: values.position || '',
      region: values.region || '',
    });
    ElMessage.success('基本信息更新成功');
    await fetchData();
  } catch {
    ElMessage.error('更新失败');
  }
}

async function handleUpdateProfile(values: Record<string, any>) {
  try {
    await updateMyProfileApi({
      address: values.address || null,
      birth_date: values.birth_date || null,
      emergency_contact_name: values.emergency_contact_name || null,
      emergency_contact_phone: values.emergency_contact_phone || null,
      hire_date: values.hire_date || null,
      id_number: values.id_number || null,
      work_start_date: values.work_start_date || null,
    });
    ElMessage.success('档案信息更新成功');
    await fetchData();
  } catch {
    ElMessage.error('更新失败');
  }
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <Page v-loading="loading">
    <Profile
      v-model:model-value="activeTab"
      title="个人信息维护"
      :user-info="userInfo"
      :tabs="tabs"
    >
      <template #content>
        <ProfileBaseSetting
          v-if="activeTab === 'basic'"
          ref="basicFormRef"
          :form-schema="basicSchema"
          @submit="handleUpdateBasicInfo"
        />
        <ProfileBaseSetting
          v-else-if="activeTab === 'profile'"
          ref="profileFormRef"
          :form-schema="profileSchema"
          @submit="handleUpdateProfile"
        />
      </template>
    </Profile>
  </Page>
</template>
