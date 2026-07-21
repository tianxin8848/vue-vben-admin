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
  ElPagination,
  ElSelect,
  ElSwitch,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import {
  createEmployeeApi,
  getEmployeesApi,
  resetEmployeePasswordApi,
  updateEmployeeStatusApi,
} from '#/api';

const router = useRouter();
const loading = ref(false);
const employees = ref<EmployeeApi.Employee[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);

const searchForm = reactive({
  keyword: '',
  department: '',
  status: '',
});

const showCreateModal = ref(false);
const createForm = reactive<EmployeeApi.CreateEmployeeParams>({
  username: '',
  password: '',
  realName: '',
  email: '',
  phone: '',
  department: '',
  position: '',
});

const showResetModal = ref(false);
const resetPassword = ref('');
const resetEmployeeId = ref('');

async function fetchEmployees() {
  loading.value = true;
  try {
    const res = await getEmployeesApi({
      page: page.value,
      pageSize: pageSize.value,
      ...searchForm,
    });
    employees.value = res.data;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  page.value = 1;
  fetchEmployees();
}

function handleReset() {
  searchForm.keyword = '';
  searchForm.department = '';
  searchForm.status = '';
  fetchEmployees();
}

function handlePageChange(val: number) {
  page.value = val;
  fetchEmployees();
}

function handlePageSizeChange(val: number) {
  pageSize.value = val;
  page.value = 1;
  fetchEmployees();
}

function viewProfile(id: string) {
  router.push(`/employees/profile/${id}`);
}

async function handleStatusChange(id: string, status: 'active' | 'inactive') {
  try {
    await updateEmployeeStatusApi(id, { status });
    ElMessage.success('状态更新成功');
    fetchEmployees();
  } catch {
    ElMessage.error('状态更新失败');
  }
}

function openResetModal(id: string) {
  resetEmployeeId.value = id;
  showResetModal.value = true;
}

async function handleResetPassword() {
  if (!resetPassword.value) {
    ElMessage.warning('请输入新密码');
    return;
  }
  try {
    await resetEmployeePasswordApi(resetEmployeeId.value, {
      newPassword: resetPassword.value,
    });
    ElMessage.success('密码重置成功');
    showResetModal.value = false;
    resetPassword.value = '';
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
    createForm.password = '';
    createForm.realName = '';
    createForm.email = '';
    createForm.phone = '';
    createForm.department = '';
    createForm.position = '';
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
      <ElFormItem label="状态">
        <ElSelect v-model="searchForm.status" placeholder="请选择" clearable>
          <ElOption label="在职" value="active" />
          <ElOption label="离职" value="inactive" />
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
      <ElTableColumn prop="realName" label="姓名" />
      <ElTableColumn prop="email" label="邮箱" />
      <ElTableColumn prop="phone" label="手机号" />
      <ElTableColumn prop="department" label="部门" />
      <ElTableColumn prop="position" label="职位" />
      <ElTableColumn label="状态">
        <template #default="{ row }">
          <ElSwitch
            :model-value="row.status === 'active'"
            @change="
              (val) => handleStatusChange(row.id, val ? 'active' : 'inactive')
            "
            active-text="在职"
            inactive-text="离职"
          />
        </template>
      </ElTableColumn>
      <ElTableColumn prop="isAdmin" label="管理员">
        <template #default="{ row }">
          {{ row.isAdmin ? '是' : '否' }}
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

    <ElPagination
      :current-page="page"
      :page-size="pageSize"
      :total="total"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handlePageSizeChange"
      @current-change="handlePageChange"
      class="pagination"
    />

    <ElDialog v-model="showCreateModal" title="新增员工" width="600px">
      <ElForm :model="createForm" label-width="100px">
        <ElFormItem label="账号" prop="username">
          <ElInput v-model="createForm.username" />
        </ElFormItem>
        <ElFormItem label="密码" prop="password">
          <ElInput type="password" v-model="createForm.password" />
        </ElFormItem>
        <ElFormItem label="姓名" prop="realName">
          <ElInput v-model="createForm.realName" />
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
      </ElForm>
      <template #footer>
        <ElButton @click="showCreateModal = false">取消</ElButton>
        <ElButton type="primary" @click="handleCreate">确定</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="showResetModal" title="重置密码">
      <ElForm :model="{ password: resetPassword }" label-width="80px">
        <ElFormItem label="新密码">
          <ElInput type="password" v-model="resetPassword" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showResetModal = false">取消</ElButton>
        <ElButton type="primary" @click="handleResetPassword">确定</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
.employee-list-page {
  padding: 20px;
}

.search-form {
  margin-bottom: 20px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
