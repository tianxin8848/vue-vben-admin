<script lang="ts" setup>
import type { EmployeeApi } from '#/api';

import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElCard,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import {
  getEmployeesApi,
  getSystemSettingsApi,
  updateEmployeeAccessControlApi,
} from '#/api';

const router = useRouter();
const loading = ref(false);
const employees = ref<EmployeeApi.EmployeeResponse[]>([]);

const searchForm = reactive({
  keyword: '',
  department: '',
  region: '',
});

const showEditModal = ref(false);
const editEmployeeId = ref('');
const editEmployee = ref<EmployeeApi.EmployeeResponse | null>(null);
const editForm = reactive({ accessControlId: '' });

const departmentOptions = ref<{ label: string; value: string }[]>([]);
const regionOptions = ref<{ label: string; value: string }[]>([]);

async function fetchSystemSettings() {
  try {
    const settings = await getSystemSettingsApi();
    departmentOptions.value = (settings.departments || []).map((d) => ({
      label: d,
      value: d,
    }));
    regionOptions.value = (settings.regions || []).map((r) => ({
      label: r,
      value: r,
    }));
  } catch {
    // 获取系统设置失败时保持空选项
  }
}

const filteredEmployees = computed(() => {
  let list = [...employees.value];

  if (searchForm.keyword) {
    const kw = searchForm.keyword.toLowerCase();
    list = list.filter(
      (e) =>
        e.full_name?.toLowerCase().includes(kw) ||
        e.username.toLowerCase().includes(kw) ||
        e.email.toLowerCase().includes(kw) ||
        e.employee_code?.toLowerCase().includes(kw) ||
        e.access_control_id?.toLowerCase().includes(kw),
    );
  }

  if (searchForm.department) {
    list = list.filter((e) => e.department === searchForm.department);
  }

  if (searchForm.region) {
    list = list.filter((e) => e.region === searchForm.region);
  }

  return list;
});

async function fetchEmployees() {
  loading.value = true;
  try {
    employees.value = await getEmployeesApi();
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
  searchForm.region = '';
  fetchEmployees();
}

function openEditModal(employee: EmployeeApi.EmployeeResponse) {
  editEmployeeId.value = employee.id;
  editEmployee.value = employee;
  editForm.accessControlId = employee.access_control_id || '';
  showEditModal.value = true;
}

function closeEditModal() {
  showEditModal.value = false;
  editEmployeeId.value = '';
  editEmployee.value = null;
  editForm.accessControlId = '';
}

async function handleSaveAccessControl() {
  try {
    await updateEmployeeAccessControlApi(editEmployeeId.value, {
      access_control_id: editForm.accessControlId,
    });
    ElMessage.success('门禁ID更新成功');
    closeEditModal();
    fetchEmployees();
  } catch {
    ElMessage.error('更新失败');
  }
}

function goBack() {
  router.push('/employee/manage');
}

fetchSystemSettings();
fetchEmployees();
</script>

<template>
  <Page title="门禁管理" description="管理员工的门禁ID，支持搜索和批量编辑">
    <ElButton @click="goBack" style="margin-bottom: 16px">返回</ElButton>

    <ElCard class="search-card">
      <div class="search-bar">
        <ElInput
          v-model="searchForm.keyword"
          placeholder="搜索用户名 / 邮箱 / 姓名 / 工号 / 门禁ID"
          style="width: 280px"
          clearable
          @keyup.enter="handleSearch"
        />
        <ElSelect
          v-model="searchForm.department"
          placeholder="全部部门"
          style="width: 140px"
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

    <ElCard class="table-card" header="门禁列表">
      <ElTable
        :data="filteredEmployees"
        border
        stripe
        v-loading="loading"
        size="small"
      >
        <ElTableColumn prop="employee_code" label="工号" width="100" />
        <ElTableColumn prop="full_name" label="姓名" width="100" />
        <ElTableColumn prop="username" label="账号" width="120" />
        <ElTableColumn prop="department" label="部门" width="140" />
        <ElTableColumn prop="region" label="地区" width="100" />
        <ElTableColumn prop="access_control_id" label="门禁ID" min-width="150">
          <template #default="{ row }">
            <span v-if="row.access_control_id">{{
              row.access_control_id
            }}</span>
            <span v-else class="no-value">-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="is_active" label="状态" width="100">
          <template #default="{ row }">
            <span :class="row.is_active ? 'status-active' : 'status-inactive'">
              {{ row.is_active ? '启用' : '禁用' }}
            </span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <ElButton
              size="small"
              type="primary"
              @click="openEditModal(row as EmployeeApi.EmployeeResponse)"
            >
              编辑
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElDialog v-model="showEditModal" title="编辑门禁ID" width="450px">
      <div v-if="editEmployee" style="padding: 10px 0">
        <p style="margin-bottom: 12px; color: #64748b">
          员工：{{ editEmployee.full_name }}（{{ editEmployee.username }}）
        </p>
        <ElForm :model="editForm" label-width="80px">
          <ElFormItem label="门禁ID">
            <ElInput
              v-model="editForm.accessControlId"
              placeholder="请输入门禁ID"
              style="width: 100%"
            />
          </ElFormItem>
        </ElForm>
      </div>
      <template #footer>
        <ElButton @click="closeEditModal">取消</ElButton>
        <ElButton type="primary" @click="handleSaveAccessControl">
          保存
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
