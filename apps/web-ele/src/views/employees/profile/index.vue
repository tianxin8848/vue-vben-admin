<script lang="ts" setup>
import type { EmployeeApi } from '#/api';

import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  ElButton,
  ElCard,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElSelect,
} from 'element-plus';

import {
  getEmployeeProfileApi,
  getEmployeesApi,
  updateEmployeeBasicInfoApi,
  updateEmployeeProfileApi,
} from '#/api';

const route = useRoute();
const router = useRouter();
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
  address: '',
  birth_date: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  hire_date: '',
  id_number: '',
  work_start_date: '',
});

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
        address: profile.value.address || '',
        birth_date: profile.value.birth_date || '',
        emergency_contact_name: profile.value.emergency_contact_name || '',
        emergency_contact_phone: profile.value.emergency_contact_phone || '',
        hire_date: profile.value.hire_date || '',
        id_number: profile.value.id_number || '',
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
    ElMessage.success('基本信息更新成功');
    fetchData();
  } catch {
    ElMessage.error('更新失败');
  }
}

async function handleUpdateProfile() {
  try {
    await updateEmployeeProfileApi(employeeId, profileForm);
    ElMessage.success('档案信息更新成功');
    fetchData();
  } catch {
    ElMessage.error('更新失败');
  }
}

function goBack() {
  router.push('/employee/list');
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="employee-profile-page" v-loading="loading">
    <div class="page-header">
      <ElButton @click="goBack">返回</ElButton>
      <h2>员工档案</h2>
    </div>

    <ElCard v-if="employee" header="基本信息">
      <ElForm :model="basicInfoForm" label-width="120px">
        <ElFormItem label="账号">
          <ElInput :model-value="employee.username" disabled />
        </ElFormItem>
        <ElFormItem label="姓名">
          <ElInput :model-value="employee.full_name || ''" disabled />
        </ElFormItem>
        <ElFormItem label="邮箱">
          <ElInput :model-value="employee.email" disabled />
        </ElFormItem>
        <ElFormItem label="手机号">
          <ElInput :model-value="employee.phone || ''" disabled />
        </ElFormItem>
        <ElFormItem label="部门">
          <ElSelect v-model="basicInfoForm.department" clearable>
            <ElOption label="技术部" value="技术部" />
            <ElOption label="人事部" value="人事部" />
            <ElOption label="财务部" value="财务部" />
            <ElOption label="市场部" value="市场部" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="职位">
          <ElInput v-model="basicInfoForm.position" />
        </ElFormItem>
        <ElFormItem label="区域">
          <ElInput v-model="basicInfoForm.region" />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="handleUpdateBasicInfo">
            保存
          </ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>

    <ElCard v-if="profile" header="档案信息" style="margin-top: 20px">
      <ElForm :model="profileForm" label-width="120px">
        <ElFormItem label="入职日期">
          <ElDatePicker
            v-model="profileForm.hire_date"
            type="date"
            value-format="YYYY-MM-DD"
          />
        </ElFormItem>
        <ElFormItem label="工作开始日期">
          <ElDatePicker
            v-model="profileForm.work_start_date"
            type="date"
            value-format="YYYY-MM-DD"
          />
        </ElFormItem>
        <ElFormItem label="出生日期">
          <ElDatePicker
            v-model="profileForm.birth_date"
            type="date"
            value-format="YYYY-MM-DD"
          />
        </ElFormItem>
        <ElFormItem label="身份证号">
          <ElInput v-model="profileForm.id_number" />
        </ElFormItem>
        <ElFormItem label="住址">
          <ElInput v-model="profileForm.address" />
        </ElFormItem>
        <ElFormItem label="紧急联系人">
          <ElInput v-model="profileForm.emergency_contact_name" />
        </ElFormItem>
        <ElFormItem label="紧急联系电话">
          <ElInput v-model="profileForm.emergency_contact_phone" />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="handleUpdateProfile">
            保存
          </ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>
  </div>
</template>


