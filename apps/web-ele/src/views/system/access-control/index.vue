<script lang="ts" setup>
import type { AccessControlEmployeeItem } from '#/api';

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
  ElTable,
  ElTableColumn,
} from 'element-plus';

import {
  getAccessControlEmployeesApi,
  updateEmployeeAccessControlV2Api,
} from '#/api';

const router = useRouter();
const loading = ref(false);
const employees = ref<AccessControlEmployeeItem[]>([]);

const searchForm = reactive({
  keyword: '',
});

const showEditModal = ref(false);
const editEmployeeId = ref('');
const editEmployee = ref<AccessControlEmployeeItem | null>(null);
const editForm = reactive({ accessControlId: '' });

const filteredEmployees = computed(() => {
  let list = [...employees.value];

  if (searchForm.keyword) {
    const kw = searchForm.keyword.toLowerCase();
    list = list.filter(
      (e) =>
        e.full_name?.toLowerCase().includes(kw) ||
        e.username.toLowerCase().includes(kw) ||
        e.access_control_id?.toLowerCase().includes(kw),
    );
  }

  return list;
});

async function fetchEmployees() {
  loading.value = true;
  try {
    employees.value = await getAccessControlEmployeesApi();
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  fetchEmployees();
}

function handleReset() {
  searchForm.keyword = '';
  fetchEmployees();
}

function openEditModal(employee: AccessControlEmployeeItem) {
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
    await updateEmployeeAccessControlV2Api(editEmployeeId.value, {
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

fetchEmployees();
</script>

<template>
  <Page>
    <ElButton @click="goBack" style="margin-bottom: 16px">返回</ElButton>

    <ElCard class="search-card">
      <div class="search-bar">
        <ElInput
          v-model="searchForm.keyword"
          placeholder="搜索姓名 / 账号 / 门禁ID"
          style="width: 280px"
          clearable
          @keyup.enter="handleSearch"
        />
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
        <ElTableColumn prop="full_name" label="姓名" min-width="120" />
        <ElTableColumn prop="username" label="账号" min-width="140" />
        <ElTableColumn prop="access_control_id" label="门禁ID" min-width="180">
          <template #default="{ row }">
            <span v-if="row.access_control_id">{{
              row.access_control_id
            }}</span>
            <span v-else class="no-value">-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <ElButton
              size="small"
              type="primary"
              @click="openEditModal(row as AccessControlEmployeeItem)"
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

<style scoped>
.search-card {
  margin-bottom: 16px;
}

.search-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.no-value {
  color: #cbd5e1;
}

.status-active {
  font-weight: 500;
  color: #16a34a;
}

.status-inactive {
  font-weight: 500;
  color: #dc2626;
}
</style>
