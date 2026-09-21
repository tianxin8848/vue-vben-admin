<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { EmployeeApi } from '#/api';

import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useI18n } from '@vben/locales';

import { ElButton, ElSwitch, ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getEmployeesApi,
  resetEmployeePasswordApi,
  updateEmployeeBasicInfoApi,
  updateEmployeeStatusApi,
} from '#/api';
import { handleActionError, toastSuccess } from '#/utils/message';

import BasicInfoEditDialog from './components/BasicInfoEditDialog.vue';
import CreateEmployeeDrawer from './components/CreateEmployeeDrawer.vue';
import ResetPasswordDialog from './components/ResetPasswordDialog.vue';
import { useEmployeeData } from './composables/useEmployeeData';
import {
  buildColumns,
  buildFormSchema,
  createSharedToolbarConfig,
} from './data';

const router = useRouter();
const { t } = useI18n();

const {
  allEmployees,
  columnVisibility,
  departmentOptions,
  fetchSystemSettings,
  getInitialPasswordStatus,
  invalidateEmployees,
  isManager,
  moduleOptions,
  openResetModal,
  positionOptions,
  regionOptions,
  resetEmployeeId,
  resetResult,
  showResetModal,
} = useEmployeeData();

// ─── 筛选表单配置（Search / Reset / Collapse 由 BasicTable 内置） ────────────
const formOptions: VbenFormProps = {
  schema: buildFormSchema(t, departmentOptions, regionOptions),
  commonConfig: {
    componentProps: {
      allowClear: true,
    },
    labelWidth: 70,
  },
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  handleSubmit: async () => {
    const { formApi, reload } = tableApi;
    const formValues = await formApi.getValues();
    formApi.setLatestSubmissionValues(formValues);
    await reload(formValues);
  },
  handleReset: async () => {
    const { formApi, reload } = tableApi;
    await formApi.resetForm();
    const formValues = formApi.form.values;
    formApi.setLatestSubmissionValues(formValues);
    await reload(formValues);
  },
};

// ─── 表格配置 ────────────────────────────────────────────────────────────────
const gridOptions = computed<VxeGridProps<EmployeeApi.EmployeeResponse>>(
  () => ({
    columns: buildColumns(t, columnVisibility),
    customConfig: {
      storage: false,
    },
    id: 'employees-list',
    keepSource: true,
    minHeight: 400,
    pagerConfig: {
      pageSize: 10,
      pageSizes: [10, 20, 50, 100],
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues: any = {}) => {
          if (allEmployees.value.length === 0) {
            allEmployees.value = await getEmployeesApi();
          }
          let list = [...allEmployees.value];
          if (formValues.keyword) {
            const kw = String(formValues.keyword).toLowerCase();
            list = list.filter(
              (e) =>
                e.full_name?.toLowerCase().includes(kw) ||
                e.username.toLowerCase().includes(kw) ||
                e.email.toLowerCase().includes(kw) ||
                e.employee_code?.toLowerCase().includes(kw),
            );
          }
          if (formValues.role) {
            list = list.filter((e) =>
              formValues.role === 'admin'
                ? isManager(e.module_permissions)
                : !isManager(e.module_permissions),
            );
          }
          if (formValues.status) {
            list = list.filter((e) =>
              formValues.status === 'active' ? e.is_active : !e.is_active,
            );
          }
          if (formValues.department) {
            list = list.filter((e) => e.department === formValues.department);
          }
          if (formValues.region) {
            list = list.filter((e) => e.region === formValues.region);
          }
          const total = list.length;
          const start = (page.currentPage - 1) * page.pageSize;
          const items = list.slice(start, start + page.pageSize);
          return { items, total };
        },
      },
    },
    rowConfig: {
      isHover: true,
      keyField: 'id',
    },
    toolbarConfig: createSharedToolbarConfig(t),
  }),
);

const [BasicTable, tableApi] = useVbenVxeGrid({
  formOptions,
  gridOptions: gridOptions.value,
  gridEvents: {
    toolbarToolClick(event: { code: string }) {
      if (event.code === 'manual-refresh') refreshEmployees();
    },
  },
});

watch(gridOptions, () => {
  tableApi.setGridOptions(gridOptions.value);
});

async function refreshEmployees() {
  invalidateEmployees();
  await tableApi.reload();
}

// ─── 新增员工 ────────────────────────────────────────────────────────────────
const createDrawerRef = ref<InstanceType<typeof CreateEmployeeDrawer>>();

function openCreateDrawer() {
  createDrawerRef.value?.open();
}

async function handleCreateSuccess() {
  invalidateEmployees();
  await tableApi.reload();
}

// ─── 行操作 ──────────────────────────────────────────────────────────────────
function viewProfile(id: string) {
  router.push(`/employee/manage/users/${id}/profile`);
}

async function handleStatusChange(id: string, isActive: boolean) {
  try {
    await updateEmployeeStatusApi(id, { is_active: isActive });
    toastSuccess(t('page.employees.message.statusUpdateSuccess'));
    invalidateEmployees();
    await tableApi.reload();
  } catch (error) {
    handleActionError(
      'employees/list',
      error,
      t('page.employees.message.statusUpdateFailed'),
    );
  }
}

// ─── 基础信息编辑 ────────────────────────────────────────────────────────────
const showBasicInfoModal = ref(false);
const basicInfoLoading = ref(false);
const basicInfoTarget = ref<EmployeeApi.EmployeeResponse | null>(null);

function openBasicInfoModal(row: EmployeeApi.EmployeeResponse) {
  basicInfoTarget.value = row;
  showBasicInfoModal.value = true;
}

async function handleBasicInfoUpdate(
  payload: EmployeeApi.EmployeeBasicInfoUpdate,
) {
  const target = basicInfoTarget.value;
  if (!target) return;
  basicInfoLoading.value = true;
  try {
    await updateEmployeeBasicInfoApi(target.id, payload);
    toastSuccess(t('page.employees.message.basicInfoUpdateSuccess'));
    showBasicInfoModal.value = false;
    basicInfoTarget.value = null;
    invalidateEmployees();
    await tableApi.reload();
  } catch (error: any) {
    handleActionError(
      'employees/list',
      error,
      t('page.employees.message.basicInfoUpdateFailed'),
    );
  } finally {
    basicInfoLoading.value = false;
  }
}

// ─── 重置密码 ────────────────────────────────────────────────────────────────
async function handleResetPassword() {
  try {
    const res = await resetEmployeePasswordApi(resetEmployeeId.value);
    resetResult.value = res;
    toastSuccess(
      t('page.employees.message.resetPasswordSuccess', {
        password: res.temporary_password,
      }),
    );
  } catch (error) {
    handleActionError(
      'employees/list',
      error,
      t('page.employees.message.resetPasswordFailed'),
    );
  }
}

// ─── 初始化 ──────────────────────────────────────────────────────────────────
onMounted(async () => {
  await fetchSystemSettings();
});
</script>

<template>
  <Page>
    <div class="flex flex-col gap-4">
      <!-- 筛选 + 表格（Reset / Search / Collapse 按钮 + 分页 + 工具栏由 BasicTable 内置） -->
      <BasicTable :table-title="t('page.employees.list')">
        <template #toolbar-tools>
          <ElButton type="primary" @click="openCreateDrawer">
            {{ t('page.employees.buttons.createShort') }}
          </ElButton>
        </template>
        <template #role="{ row }">
          <ElTag
            :type="isManager(row.module_permissions) ? 'danger' : 'info'"
            size="small"
          >
            {{
              isManager(row.module_permissions)
                ? t('page.employees.role.admin')
                : t('page.employees.role.employee')
            }}
          </ElTag>
        </template>

        <template #dept_pos_region="{ row }">
          <span>{{ row.department || '-' }}</span>
          <span v-if="row.position" class="mx-1 text-muted-foreground">/</span>
          <span>{{ row.position || '' }}</span>
          <span v-if="row.region" class="mx-1 text-muted-foreground">/</span>
          <span>{{ row.region || '' }}</span>
        </template>

        <template #status="{ row }">
          <ElSwitch
            :model-value="row.is_active"
            active-color="#10b981"
            inactive-color="#ef4444"
            @change="(val) => handleStatusChange(row.id, Boolean(val))"
          />
        </template>

        <template #initial_status="{ row }">
          <ElTag
            :type="row.is_initial_password === 1 ? 'warning' : 'success'"
            size="small"
          >
            {{ getInitialPasswordStatus(row.is_initial_password) }}
          </ElTag>
        </template>

        <template #temporary_password="{ row }">
          <span v-if="row.temporary_password" class="font-mono text-sm">
            {{ row.temporary_password }}
          </span>
          <span v-else class="text-muted-foreground">-</span>
        </template>

        <template #action="{ row }">
          <ElButton size="small" @click="viewProfile(row.id)">
            {{ t('page.employees.action.profile') }}
          </ElButton>
          <ElButton size="small" @click="openBasicInfoModal(row)">
            {{ t('page.employees.action.edit') }}
          </ElButton>
          <ElButton size="small" type="warning" @click="openResetModal(row.id)">
            {{ t('page.employees.action.resetPassword') }}
          </ElButton>
        </template>
      </BasicTable>
    </div>

    <!-- 重置密码弹窗 -->
    <ResetPasswordDialog
      v-model:visible="showResetModal"
      :result="resetResult"
      @confirm="handleResetPassword"
    />

    <!-- 新增员工抽屉 -->
    <CreateEmployeeDrawer
      ref="createDrawerRef"
      :department-options="departmentOptions"
      :module-options="moduleOptions"
      :position-options="positionOptions"
      :region-options="regionOptions"
      @success="handleCreateSuccess"
    />

    <!-- 基础信息编辑弹窗 -->
    <BasicInfoEditDialog
      v-model:visible="showBasicInfoModal"
      :employee="basicInfoTarget"
      :department-options="departmentOptions"
      :position-options="positionOptions"
      :region-options="regionOptions"
      :loading="basicInfoLoading"
      @submit="handleBasicInfoUpdate"
    />
  </Page>
</template>
