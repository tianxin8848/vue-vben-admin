<script lang="ts" setup>
import type { EmployeeApi } from '#/api';

import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  ElButton,
  ElCard,
  ElCheckbox,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
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
  updateEmployeeAdminApi,
  updateEmployeeStatusApi,
} from '#/api';

const router = useRouter();
const loading = ref(false);
const employees = ref<EmployeeApi.EmployeeResponse[]>([]);

const columnVisibility = reactive({
  user_id: true,
  employee_code: true,
  full_name: true,
  username: true,
  role: true,
  department_position: true,
  status: true,
  initial_status: true,
  temporary_password: true,
  permissions: true,
});

const searchForm = reactive({
  keyword: '',
  role: '',
  status: '',
  department: '',
  region: '',
});

const createForm = reactive<EmployeeApi.EmployeeCreate>({
  username: '',
  email: '',
  full_name: '',
  department: '',
  phone: '',
  position: '',
  region: '',
  is_admin: false,
});

const showResetModal = ref(false);
const resetResult = ref<EmployeeApi.EmployeePasswordResetResponse | null>(null);
const resetEmployeeId = ref('');

const sortField = ref<string>('');
const sortOrder = ref<'ascending' | 'descending'>('ascending');

const departmentOptions = [
  { label: '技术部', value: '技术部' },
  { label: '人事部', value: '人事部' },
  { label: '财务部', value: '财务部' },
  { label: '市场部', value: '市场部' },
];

const regionOptions = [
  { label: '北京', value: '北京' },
  { label: '上海', value: '上海' },
  { label: '广州', value: '广州' },
  { label: '深圳', value: '深圳' },
];

const filteredEmployees = computed(() => {
  let list = [...employees.value];

  if (searchForm.keyword) {
    const kw = searchForm.keyword.toLowerCase();
    list = list.filter(
      (e) =>
        (e.full_name?.toLowerCase().includes(kw) || false) ||
        e.username.toLowerCase().includes(kw) ||
        e.email.toLowerCase().includes(kw) ||
        (e.employee_code?.toLowerCase().includes(kw) || false),
    );
  }

  if (searchForm.role) {
    list = list.filter((e) => (searchForm.role === 'admin' ? e.is_admin : !e.is_admin));
  }

  if (searchForm.status) {
    list = list.filter((e) => (searchForm.status === 'active' ? e.is_active : !e.is_active));
  }

  if (searchForm.department) {
    list = list.filter((e) => e.department === searchForm.department);
  }

  if (searchForm.region) {
    list = list.filter((e) => e.region === searchForm.region);
  }

  if (sortField.value) {
    list.sort((a, b) => {
      const aVal = a[sortField.value as keyof EmployeeApi.EmployeeResponse];
      const bVal = b[sortField.value as keyof EmployeeApi.EmployeeResponse];
      const aStr = String(aVal ?? '').toLowerCase();
      const bStr = String(bVal ?? '').toLowerCase();
      const result = aStr.localeCompare(bStr);
      return sortOrder.value === 'ascending' ? result : -result;
    });
  }

  return list;
});

function toggleSort(field: string) {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'ascending' ? 'descending' : 'ascending';
  } else {
    sortField.value = field;
    sortOrder.value = 'ascending';
  }
}

function getSortIcon(field: string) {
  if (sortField.value !== field) return '↕';
  return sortOrder.value === 'ascending' ? '↑' : '↓';
}

async function fetchEmployees() {
  loading.value = true;
  try {
    employees.value = await getEmployeesApi();
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  sortField.value = '';
  fetchEmployees();
}

function handleReset() {
  searchForm.keyword = '';
  searchForm.role = '';
  searchForm.status = '';
  searchForm.department = '';
  searchForm.region = '';
  sortField.value = '';
  fetchEmployees();
}

function viewProfile(id: string) {
  router.push(`/employees/profile/${id}`);
}

async function handleStatusChange(id: string, isActive: boolean) {
  try {
    await updateEmployeeStatusApi(id, { is_active: isActive });
    ElMessage.success('状态更新成功');
    fetchEmployees();
  } catch {
    ElMessage.error('状态更新失败');
  }
}

async function handleAdminChange(id: string, isAdmin: boolean) {
  try {
    await updateEmployeeAdminApi(id, { is_admin: isAdmin });
    ElMessage.success('管理员状态更新成功');
    fetchEmployees();
  } catch {
    ElMessage.error('更新失败');
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
  if (!createForm.username || !createForm.email || !createForm.full_name || !createForm.department) {
    ElMessage.warning('请填写必填项');
    return;
  }
  try {
    await createEmployeeApi(createForm);
    ElMessage.success('创建成功');
    createForm.username = '';
    createForm.email = '';
    createForm.full_name = '';
    createForm.department = '';
    createForm.phone = '';
    createForm.position = '';
    createForm.region = '';
    createForm.is_admin = false;
    fetchEmployees();
  } catch {
    ElMessage.error('创建失败');
  }
}

function getInitialPasswordStatus(isInitial: number) {
  return isInitial === 1 ? '未修改' : '已修改';
}

function getPermissionLabels(permissions: EmployeeApi.ModulePermission[]) {
  return permissions
    .filter((p) => p.can_view || p.can_create || p.can_edit || p.can_delete || p.can_approve)
    .map((p) => p.module_name)
    .join(', ');
}

fetchEmployees();
</script>

<template>
  <div class="employee-list-page">
    <div class="page-header">
      <h2>用户管理</h2>
      <p class="page-desc">新增员工、查看初始密码、重置密码、维护员工模块权限</p>
    </div>

    <div class="column-toggle-bar">
      <ElCheckbox
        v-model="columnVisibility.user_id"
        label="用户ID"
      />
      <ElCheckbox
        v-model="columnVisibility.employee_code"
        label="工号"
      />
      <ElCheckbox
        v-model="columnVisibility.full_name"
        label="姓名"
      />
      <ElCheckbox
        v-model="columnVisibility.username"
        label="账号"
      />
      <ElCheckbox
        v-model="columnVisibility.role"
        label="身份"
      />
      <ElCheckbox
        v-model="columnVisibility.department_position"
        label="部门/岗位/地区"
      />
      <ElCheckbox
        v-model="columnVisibility.status"
        label="状态"
      />
      <ElCheckbox
        v-model="columnVisibility.initial_status"
        label="初始密码状态"
      />
      <ElCheckbox
        v-model="columnVisibility.temporary_password"
        label="初始密码"
      />
      <ElCheckbox
        v-model="columnVisibility.permissions"
        label="权限"
      />
    </div>

    <ElCard class="create-card" header="新增员工">
      <p class="card-desc">用于快速创建员工账号，系统会自动生成复杂初始密码。</p>
      <ElForm :model="createForm" label-width="100px" inline>
        <ElFormItem label="用户名 *">
          <ElInput
            v-model="createForm.username"
            placeholder="请输入用户名"
            style="width: 180px"
          />
        </ElFormItem>
        <ElFormItem label="邮箱 *">
          <ElInput
            v-model="createForm.email"
            placeholder="请输入邮箱"
            style="width: 220px"
          />
        </ElFormItem>
        <ElFormItem label="姓名 *">
          <ElInput
            v-model="createForm.full_name"
            placeholder="请输入姓名"
            style="width: 120px"
          />
        </ElFormItem>
        <ElFormItem label="部门 *">
          <ElSelect
            v-model="createForm.department"
            placeholder="请选择部门"
            style="width: 140px"
          >
            <ElOption
              v-for="opt in departmentOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="手机号">
          <ElInput
            v-model="createForm.phone"
            placeholder="请输入手机号"
            style="width: 140px"
          />
        </ElFormItem>
        <ElFormItem label="地区">
          <ElSelect
            v-model="createForm.region"
            placeholder="请选择地区"
            style="width: 120px"
            clearable
          >
            <ElOption
              v-for="opt in regionOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="岗位">
          <ElInput
            v-model="createForm.position"
            placeholder="请选择岗位"
            style="width: 120px"
          />
        </ElFormItem>
        <ElFormItem>
          <ElCheckbox v-model="createForm.is_admin" label="创建为管理员" />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="handleCreate">创建员工</ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>

    <ElCard class="search-card">
      <div class="search-bar">
        <ElInput
          v-model="searchForm.keyword"
          placeholder="搜索用户名 / 邮箱 / 姓名 / 工号"
          style="width: 250px"
          clearable
          @keyup.enter="handleSearch"
        />
        <ElSelect
          v-model="searchForm.role"
          placeholder="全部身份"
          style="width: 120px"
        >
          <ElOption label="全部身份" value="" />
          <ElOption label="管理员" value="admin" />
          <ElOption label="员工" value="employee" />
        </ElSelect>
        <ElSelect
          v-model="searchForm.status"
          placeholder="全部状态"
          style="width: 120px"
        >
          <ElOption label="全部状态" value="" />
          <ElOption label="启用" value="active" />
          <ElOption label="禁用" value="disabled" />
        </ElSelect>
        <ElSelect
          v-model="searchForm.department"
          placeholder="全部部门"
          style="width: 120px"
          clearable
        >
          <ElOption label="全部部门" value="" />
          <ElOption
            v-for="opt in departmentOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
        <ElSelect
          v-model="searchForm.region"
          placeholder="全部地区"
          style="width: 120px"
          clearable
        >
          <ElOption label="全部地区" value="" />
          <ElOption
            v-for="opt in regionOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
        <ElButton type="primary" @click="handleSearch">搜索</ElButton>
        <ElButton @click="handleReset">重置筛选</ElButton>
        <ElButton @click="fetchEmployees">刷新列表</ElButton>
      </div>
    </ElCard>

    <ElCard class="table-card" header="员工列表">
      <ElTable :data="filteredEmployees" border stripe v-loading="loading" size="small">
        <ElTableColumn
          v-if="columnVisibility.user_id"
          prop="id"
          label="用户ID"
          width="100"
          sortable="custom"
          @sort-change="toggleSort('id')"
        >
          <template #header>
            <span @click="toggleSort('id')" class="sortable-header">
              用户ID {{ getSortIcon('id') }}
            </span>
          </template>
        </ElTableColumn>

        <ElTableColumn
          v-if="columnVisibility.employee_code"
          prop="employee_code"
          label="工号"
          width="100"
        >
          <template #header>
            <span @click="toggleSort('employee_code')" class="sortable-header">
              工号 {{ getSortIcon('employee_code') }}
            </span>
          </template>
        </ElTableColumn>

        <ElTableColumn
          v-if="columnVisibility.full_name"
          prop="full_name"
          label="姓名"
          width="100"
        >
          <template #header>
            <span @click="toggleSort('full_name')" class="sortable-header">
              姓名 {{ getSortIcon('full_name') }}
            </span>
          </template>
        </ElTableColumn>

        <ElTableColumn
          v-if="columnVisibility.username"
          prop="username"
          label="账号"
          width="120"
        >
          <template #header>
            <span @click="toggleSort('username')" class="sortable-header">
              账号 {{ getSortIcon('username') }}
            </span>
          </template>
        </ElTableColumn>

        <ElTableColumn
          v-if="columnVisibility.role"
          label="身份"
          width="80"
        >
          <template #header>
            <span @click="toggleSort('is_admin')" class="sortable-header">
              身份 {{ getSortIcon('is_admin') }}
            </span>
          </template>
          <template #default="{ row }">
            <ElTag :type="row.is_admin ? 'danger' : 'info'" size="small">
              {{ row.is_admin ? '管理员' : '员工' }}
            </ElTag>
          </template>
        </ElTableColumn>

        <ElTableColumn
          v-if="columnVisibility.department_position"
          label="部门/岗位/地区"
          width="200"
        >
          <template #header>
            <span class="sortable-header">部门/岗位/地区</span>
          </template>
          <template #default="{ row }">
            <span>{{ row.department || '-' }}</span>
            <span v-if="row.position" class="separator">/</span>
            <span>{{ row.position || '' }}</span>
            <span v-if="row.region" class="separator">/</span>
            <span>{{ row.region || '' }}</span>
          </template>
        </ElTableColumn>

        <ElTableColumn
          v-if="columnVisibility.status"
          label="状态"
          width="120"
        >
          <template #header>
            <span @click="toggleSort('is_active')" class="sortable-header">
              状态 {{ getSortIcon('is_active') }}
            </span>
          </template>
          <template #default="{ row }">
            <ElSwitch
              :model-value="row.is_active"
              @change="(val) => handleStatusChange(row.id, val as boolean)"
              active-text="启用"
              inactive-text="禁用"
              active-color="#10b981"
              inactive-color="#ef4444"
            />
          </template>
        </ElTableColumn>

        <ElTableColumn
          v-if="columnVisibility.initial_status"
          label="初始密码状态"
          width="120"
        >
          <template #header>
            <span class="sortable-header">初始密码状态</span>
          </template>
          <template #default="{ row }">
            <ElTag
              :type="row.is_initial_password === 1 ? 'warning' : 'success'"
              size="small"
            >
              {{ getInitialPasswordStatus(row.is_initial_password) }}
            </ElTag>
          </template>
        </ElTableColumn>

        <ElTableColumn
          v-if="columnVisibility.temporary_password"
          label="初始密码"
          width="180"
        >
          <template #header>
            <span class="sortable-header">初始密码</span>
          </template>
          <template #default="{ row }">
            <span v-if="row.temporary_password" class="password-text">
              {{ row.temporary_password }}
            </span>
            <span v-else class="no-password">-</span>
          </template>
        </ElTableColumn>

        <ElTableColumn
          v-if="columnVisibility.permissions"
          label="权限"
          min-width="200"
        >
          <template #header>
            <span class="sortable-header">权限</span>
          </template>
          <template #default="{ row }">
            <span class="permissions-text">
              {{ getPermissionLabels(row.module_permissions) || '-' }}
            </span>
          </template>
        </ElTableColumn>

        <ElTableColumn label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <ElButton size="small" @click="viewProfile(row.id)">档案</ElButton>
            <ElButton
              size="small"
              type="warning"
              @click="openResetModal(row.id)"
            >
              重置密码
            </ElButton>
            <ElButton
              size="small"
              :type="row.is_admin ? 'danger' : 'primary'"
              @click="handleAdminChange(row.id, !row.is_admin)"
            >
              {{ row.is_admin ? '取消管理员' : '设为管理员' }}
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

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
        <p style="color: #999; font-size: 12px">系统将自动生成临时密码</p>
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

<style scoped>
.employee-list-page {
  padding: 24px;
  background: #f5f5f5;
  min-height: calc(100vh - 80px);
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.page-desc {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.column-toggle-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.column-toggle-bar :deep(.el-checkbox) {
  margin-right: 0;
}

.create-card {
  margin-bottom: 16px;
}

.card-desc {
  font-size: 13px;
  color: #909399;
  margin-bottom: 16px;
}

.search-card {
  margin-bottom: 16px;
}

.search-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.table-card {
  overflow: auto;
}

.sortable-header {
  cursor: pointer;
  user-select: none;
  color: #409eff;
}

.sortable-header:hover {
  text-decoration: underline;
}

.separator {
  margin: 0 4px;
  color: #c0c4cc;
}

.password-text {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #606266;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 4px;
}

.no-password {
  color: #c0c4cc;
}

.permissions-text {
  font-size: 12px;
  color: #606266;
  line-height: 1.6;
}
</style>
