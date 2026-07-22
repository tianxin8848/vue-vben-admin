<script lang="ts" setup>
import type { EmployeeApi } from '#/api';

import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElSelect,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  createEmployeeApi,
  getEmployeesApi,
  resetEmployeePasswordApi,
  updateEmployeeStatusApi,
} from '#/api';

const router = useRouter();
const loading = ref(false);
const employees = ref<EmployeeApi.EmployeeResponse[]>([]);

const searchForm = reactive({
  keyword: '',
  department: '',
});

const showCreateModal = ref(false);
const createForm = reactive<EmployeeApi.EmployeeCreate>({
  department: '',
  email: '',
  full_name: '',
  phone: '',
  position: '',
  region: '',
  username: '',
});

const showResetModal = ref(false);
const resetResult = ref<EmployeeApi.EmployeePasswordResetResponse | null>(null);
const resetEmployeeId = ref('');

async function fetchEmployees() {
  loading.value = true;
  try {
    const res = await getEmployeesApi();
    // 前端过滤（后端暂无分页/筛选参数）
    let list = res;
    if (searchForm.keyword) {
      const kw = searchForm.keyword.toLowerCase();
      list = list.filter(
        (e) =>
          e.full_name?.toLowerCase().includes(kw) ||
          e.username.toLowerCase().includes(kw),
      );
    }
    if (searchForm.department) {
      list = list.filter((e) => e.department === searchForm.department);
    }
    employees.value = list;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  fetchEmployees();
}

function handleReset() {
  searchForm.keyword = '';
  searchForm.department = '';
  fetchEmployees();
}

function viewProfile(id: string) {
  router.push(`/employees/profile/${id}`);
}

async function handleStatusChange(
  id: string,
  isActive: boolean,
) {
  try {
    await updateEmployeeStatusApi(id, { is_active: isActive });
    ElMessage.success('状态更新成功');
    fetchEmployees();
  } catch {
    ElMessage.error('状态更新失败');
  }
}

function openResetModal(id: string) {
  resetEmployeeId.value = id;
  resetResult.value = null;
  showResetModal.value = true;
}

async function handleResetPassword() {
  try {
    const res = await resetEmployeePasswordApi(resetEmployeeId.value);
    resetResult.value = res;
    ElMessage.success(`密码已重置，临时密码：${res.temporary_password}`);
  } catch {
    ElMessage.error('密码重置失败');
  }
}

async function handleCreate() {
  try {
    await createEmployeeApi(createForm);
    ElMessage.success('创建成功');
    showCreateModal.value = false;
    createForm.username = '';
    createForm.email = '';
    createForm.full_name = '';
    createForm.phone = '';
    createForm.department = '';
    createForm.position = '';
    createForm.region = '';
    fetchEmployees();
  } catch {
    ElMessage.error('创建失败');
  }
}

fetchEmployees();
</script>

<template>
  <div class="employee-list-page">
    <h2>员工列表</h2>
    <ElForm :model="searchForm" inline class="search-form">
      <ElFormItem label="关键词">
        <ElInput
          v-model="searchForm.keyword"
          placeholder="姓名/账号"
          clearable
        />
      </ElFormItem>
      <ElFormItem label="部门">
        <ElSelect
          v-model="searchForm.department"
          placeholder="请选择"
          clearable
        >
          <ElOption label="技术部" value="技术部" />
          <ElOption label="人事部" value="人事部" />
          <ElOption label="财务部" value="财务部" />
          <ElOption label="市场部" value="市场部" />
        </ElSelect>
      </ElFormItem>
      <ElButton type="primary" @click="handleSearch">搜索</ElButton>
      <ElButton @click="handleReset">重置</ElButton>
      <ElButton type="primary" @click="showCreateModal = true">
        新增员工
      </ElButton>
    </ElForm>

    <ElTable :data="employees" border stripe v-loading="loading">
      <ElTableColumn prop="username" label="账号" />
      <ElTableColumn prop="full_name" label="姓名" />
      <ElTableColumn prop="email" label="邮箱" />
      <ElTableColumn prop="phone" label="手机号" />
      <ElTableColumn prop="department" label="部门" />
      <ElTableColumn prop="position" label="职位" />
      <ElTableColumn label="状态">
        <template #default="{ row }">
          <ElSwitch
            :model-value="row.is_active"
            @change="
              (val: boolean) => handleStatusChange(row.id, val)
            "
            active-text="在职"
            inactive-text="离职"
          />
        </template>
      </ElTableColumn>
      <ElTableColumn label="管理员">
        <template #default="{ row }">
          <ElTag :type="row.is_admin ? 'danger' : 'info'" size="small">
            {{ row.is_admin ? '是' : '否' }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="200">
        <template #default="{ row }">
          <ElButton size="small" @click="viewProfile(row.id)">档案</ElButton>
          <ElButton size="small" @click="openResetModal(row.id)">
            重置密码
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>

    <ElDialog v-model="showCreateModal" title="新增员工" width="600px">
      <ElForm :model="createForm" label-width="100px">
        <ElFormItem label="账号" prop="username">
          <ElInput v-model="createForm.username" />
        </ElFormItem>
        <ElFormItem label="姓名" prop="full_name">
          <ElInput v-model="createForm.full_name" />
        </ElFormItem>
        <ElFormItem label="邮箱" prop="email">
          <ElInput v-model="createForm.email" />
        </ElFormItem>
        <ElFormItem label="手机号" prop="phone">
          <ElInput v-model="createForm.phone" />
        </ElFormItem>
        <ElFormItem label="部门" prop="department">
          <ElSelect v-model="createForm.department">
            <ElOption label="技术部" value="技术部" />
            <ElOption label="人事部" value="人事部" />
            <ElOption label="财务部" value="财务部" />
            <ElOption label="市场部" value="市场部" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="职位" prop="position">
          <ElInput v-model="createForm.position" />
        </ElFormItem>
        <ElFormItem label="区域" prop="region">
          <ElInput v-model="createForm.region" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showCreateModal = false">取消</ElButton>
        <ElButton type="primary" @click="handleCreate">确定</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="showResetModal" title="重置密码" width="400px">
      <div v-if="resetResult" style="text-align: center; padding: 20px 0">
        <p style="margin-bottom: 12px">密码已重置成功！</p>
        <p>
          临时密码：
          <ElTag type="warning" size="large">{{ resetResult.temporary_password }}</ElTag>
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 8px">
          请通知用户使用该临时密码登录并及时修改
        </p>
      </div>
      <div v-else style="text-align: center; padding: 20px 0">
        <p>确认重置该员工密码？</p>
        <p style="color: #999; font-size: 12px">
          系统将自动生成临时密码
        </p>
      </div>
      <template #footer>
        <ElButton @click="showResetModal = false">
          {{ resetResult ? '关闭' : '取消' }}
        </ElButton>
        <ElButton
          v-if="!resetResult"
          type="primary"
          @click="handleResetPassword"
        >
          确认重置
        </ElButton>
      </template>
    </ElDialog>
  </div>
</template>


