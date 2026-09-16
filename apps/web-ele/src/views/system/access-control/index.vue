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
  ElTable,
  ElTableColumn,
} from 'element-plus';

import {
  getAccessControlEmployeesApi,
  updateEmployeeAccessControlV2Api,
} from '#/api';
import { $t } from '#/locales';
import { handleActionError, toastSuccess } from '#/utils/message';

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
    toastSuccess($t('page.system.accessControlDetail.updateSuccess'));
    closeEditModal();
    fetchEmployees();
  } catch (error) {
    handleActionError(
      'system/access-control',
      error,
      $t('page.system.accessControlDetail.updateFailed'),
    );
  }
}

function goBack() {
  router.push('/employee/manage');
}

fetchEmployees();
</script>

<template>
  <Page>
    <ElButton @click="goBack" style="margin-bottom: 16px">
      {{ $t('page.leave.common.back') }}
    </ElButton>

    <ElCard class="search-card">
      <div class="search-bar">
        <ElInput
          v-model="searchForm.keyword"
          :placeholder="$t('page.system.accessControlDetail.searchPlaceholder')"
          style="width: 280px"
          clearable
          @keyup.enter="handleSearch"
        />
        <ElButton type="primary" @click="handleSearch">
          {{ $t('page.leave.common.search') }}
        </ElButton>
        <ElButton @click="handleReset">
          {{ $t('page.leave.common.resetFilter') }}
        </ElButton>
        <ElButton @click="fetchEmployees">
          {{ $t('page.leave.common.refreshList') }}
        </ElButton>
      </div>
    </ElCard>

    <ElCard
      class="table-card"
      :header="$t('page.system.accessControlDetail.listTitle')"
    >
      <ElTable
        :data="filteredEmployees"
        border
        stripe
        v-loading="loading"
        size="small"
      >
        <ElTableColumn
          prop="full_name"
          :label="$t('page.system.accessControlDetail.employeeName')"
          min-width="120"
        />
        <ElTableColumn
          prop="username"
          :label="$t('page.system.accessControlDetail.username')"
          min-width="140"
        />
        <ElTableColumn
          prop="access_control_id"
          :label="$t('page.system.accessControlDetail.accessId')"
          min-width="180"
        >
          <template #default="{ row }">
            <span v-if="row.access_control_id">{{
              row.access_control_id
            }}</span>
            <span v-else class="no-value">-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn
          :label="$t('page.leave.common.action')"
          width="100"
          fixed="right"
        >
          <template #default="{ row }">
            <ElButton
              size="small"
              type="primary"
              @click="openEditModal(row as AccessControlEmployeeItem)"
            >
              {{ $t('page.leave.common.edit') }}
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElDialog
      v-model="showEditModal"
      :title="$t('page.system.accessControlDetail.editTitle')"
      width="450px"
    >
      <div v-if="editEmployee" style="padding: 10px 0">
        <p style="margin-bottom: 12px; color: #64748b">
          {{ $t('page.system.accessControlDetail.employeeLabel')
          }}{{ editEmployee.full_name }}（{{ editEmployee.username }}）
        </p>
        <ElForm :model="editForm" label-width="80px">
          <ElFormItem
            :label="$t('page.system.accessControlDetail.accessIdLabel')"
          >
            <ElInput
              v-model="editForm.accessControlId"
              :placeholder="
                $t('page.system.accessControlDetail.inputPlaceholder')
              "
              style="width: 100%"
            />
          </ElFormItem>
        </ElForm>
      </div>
      <template #footer>
        <ElButton @click="closeEditModal">
          {{ $t('page.leave.common.cancel') }}
        </ElButton>
        <ElButton type="primary" @click="handleSaveAccessControl">
          {{ $t('page.leave.common.save') }}
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
