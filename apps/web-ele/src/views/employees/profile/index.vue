<script lang="ts" setup>
import type { EmployeeApi } from '#/api';

import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  ElButton,
  ElCard,
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
const employee = ref<EmployeeApi.Employee | null>(null);
const profile = ref<EmployeeApi.EmployeeProfile | null>(null);

const basicInfoForm = reactive<EmployeeApi.EmployeeBasicInfo>({
  realName: '',
  email: '',
  phone: '',
  department: '',
  position: '',
});

const profileForm = reactive<Partial<EmployeeApi.EmployeeProfile>>({
  education: '',
  workExperience: '',
  skills: [],
  emergencyContact: '',
  emergencyPhone: '',
  bankAccount: '',
  bankName: '',
  address: '',
});

async function fetchData() {
  loading.value = true;
  try {
    const [empRes, profileRes] = await Promise.all([
      getEmployeesApi({ page: 1, pageSize: 1 }),
      getEmployeeProfileApi(employeeId),
    ]);
    employee.value = empRes.data.find((e) => e.id === employeeId) || null;
    profile.value = profileRes;

    if (employee.value) {
      basicInfoForm.realName = employee.value.realName;
      basicInfoForm.email = employee.value.email;
      basicInfoForm.phone = employee.value.phone;
      basicInfoForm.department = employee.value.department;
      basicInfoForm.position = employee.value.position;
    }

    if (profile.value) {
      Object.assign(profileForm, profile.value);
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
  router.push('/employees/list');
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

    <ElCard v-if="employee" title="基本信息">
      <ElForm :model="basicInfoForm" label-width="120px">
        <ElFormItem label="姓名">
          <ElInput v-model="basicInfoForm.realName" />
        </ElFormItem>
        <ElFormItem label="邮箱">
          <ElInput v-model="basicInfoForm.email" />
        </ElFormItem>
        <ElFormItem label="手机号">
          <ElInput v-model="basicInfoForm.phone" />
        </ElFormItem>
        <ElFormItem label="部门">
          <ElSelect v-model="basicInfoForm.department">
            <ElOption label="技术部" value="技术部" />
            <ElOption label="人事部" value="人事部" />
            <ElOption label="财务部" value="财务部" />
            <ElOption label="市场部" value="市场部" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="职位">
          <ElInput v-model="basicInfoForm.position" />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="handleUpdateBasicInfo">
            保存
          </ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>

    <ElCard v-if="profile" title="档案信息" style="margin-top: 20px">
      <ElForm :model="profileForm" label-width="120px">
        <ElFormItem label="学历">
          <ElInput v-model="profileForm.education" />
        </ElFormItem>
        <ElFormItem label="工作经历">
          <ElInput
            v-model="profileForm.workExperience"
            type="textarea"
            :rows="4"
          />
        </ElFormItem>
        <ElFormItem label="技能特长">
          <ElInput v-model="profileForm.skills" type="textarea" :rows="2" />
        </ElFormItem>
        <ElFormItem label="紧急联系人">
          <ElInput v-model="profileForm.emergencyContact" />
        </ElFormItem>
        <ElFormItem label="紧急联系电话">
          <ElInput v-model="profileForm.emergencyPhone" />
        </ElFormItem>
        <ElFormItem label="银行账号">
          <ElInput v-model="profileForm.bankAccount" />
        </ElFormItem>
        <ElFormItem label="开户银行">
          <ElInput v-model="profileForm.bankName" />
        </ElFormItem>
        <ElFormItem label="住址">
          <ElInput v-model="profileForm.address" />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="handleUpdateProfile">保存</ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>
  </div>
</template>

<style scoped>
.employee-profile-page {
  padding: 20px;
}

.page-header {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 20px;
}
</style>
