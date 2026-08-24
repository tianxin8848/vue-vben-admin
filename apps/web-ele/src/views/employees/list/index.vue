<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { EmployeeApi } from '#/api';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useI18n } from '@vben/locales';

import {
  ElButton,
  ElMessage,
  ElMessageBox,
  ElSwitch,
  ElTag,
} from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteEmployeeApi,
  getEmployeesApi,
  resetEmployeePasswordApi,
  updateEmployeeAccessControlApi,
  updateEmployeeBasicInfoApi,
  updateEmployeePermissionsApi,
  updateEmployeeStatusApi,
} from '#/api';

import AccessControlDialog from './components/AccessControlDialog.vue';
import BasicInfoEditDialog from './components/BasicInfoEditDialog.vue';
import CreateEmployeeDrawer from './components/CreateEmployeeDrawer.vue';
import PermissionDialog from './components/PermissionDialog.vue';
import ResetPasswordDialog from './components/ResetPasswordDialog.vue';
import { useEmployeeData } from './composables/useEmployeeData';
import { buildColumns, buildFormSchema, sharedToolbarConfig } from './data';

const router = useRouter();
const { t } = useI18n();

const {
  allEmployees,
  columnVisibility,
  departmentOptions,
  fetchSystemSettings,
  getInitialPasswordStatus,
  getPermissionLabels,
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
  schema: buildFormSchema(departmentOptions, regionOptions),
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
const gridOptions: VxeGridProps<EmployeeApi.EmployeeResponse> = {
  columns: buildColumns(columnVisibility),
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
  toolbarConfig: sharedToolbarConfig,
};

const [BasicTable, tableApi] = useVbenVxeGrid({
  formOptions,
  gridOptions,
  gridEvents: {
    toolbarToolClick(event: { code: string }) {
      if (event.code === 'manual-refresh') refreshEmployees();
    },
  },
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
    ElMessage.success('状态更新成功');
    invalidateEmployees();
    await tableApi.reload();
  } catch {
    ElMessage.error('状态更新失败');
  }
}

// ─── 权限管理 ────────────────────────────────────────────────────────────────
const showPermissionModal = ref(false);
const permissionLoading = ref(false);
const permissionTarget = ref<EmployeeApi.EmployeeResponse | null>(null);

function openPermissionModal(row: EmployeeApi.EmployeeResponse) {
  permissionTarget.value = row;
  showPermissionModal.value = true;
}

async function handlePermissionUpdate(
  payload: EmployeeApi.EmployeePermissionUpdate,
) {
  const target = permissionTarget.value;
  if (!target) return;
  permissionLoading.value = true;
  try {
    await updateEmployeePermissionsApi(target.id, payload);
    ElMessage.success('权限更新成功');
    showPermissionModal.value = false;
    permissionTarget.value = null;
    invalidateEmployees();
    await tableApi.reload();
  } catch (error: any) {
    console.error('权限更新失败:', error);
    ElMessage.error('权限更新失败');
  } finally {
    permissionLoading.value = false;
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
    ElMessage.success('基础信息更新成功');
    showBasicInfoModal.value = false;
    basicInfoTarget.value = null;
    invalidateEmployees();
    await tableApi.reload();
  } catch (error: any) {
    console.error('基础信息更新失败:', error);
    ElMessage.error('基础信息更新失败');
  } finally {
    basicInfoLoading.value = false;
  }
}

// ─── 门禁 ID 编辑 ────────────────────────────────────────────────────────────
const showAccessControlModal = ref(false);
const accessControlLoading = ref(false);
const accessControlTarget = ref<EmployeeApi.EmployeeResponse | null>(null);

function openAccessControlModal(row: EmployeeApi.EmployeeResponse) {
  accessControlTarget.value = row;
  showAccessControlModal.value = true;
}

async function handleAccessControlUpdate(
  payload: EmployeeApi.EmployeeAccessControlUpdate,
) {
  const target = accessControlTarget.value;
  if (!target) return;
  accessControlLoading.value = true;
  try {
    await updateEmployeeAccessControlApi(target.id, payload);
    ElMessage.success('门禁 ID 更新成功');
    showAccessControlModal.value = false;
    accessControlTarget.value = null;
    invalidateEmployees();
    await tableApi.reload();
  } catch (error: any) {
    console.error('门禁 ID 更新失败:', error);
    ElMessage.error('门禁 ID 更新失败');
  } finally {
    accessControlLoading.value = false;
  }
}

// ─── 删除员工 ────────────────────────────────────────────────────────────────
async function handleDelete(row: EmployeeApi.EmployeeResponse) {
  const label = row.full_name || row.username;
  try {
    await ElMessageBox.confirm(
      `确认删除员工「${label}」？该操作不可恢复，将一并清除其账号与权限。`,
      '删除员工',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      },
    );
  } catch {
    return; // 用户取消
  }
  try {
    await deleteEmployeeApi(row.id);
    ElMessage.success('员工已删除');
    invalidateEmployees();
    await tableApi.reload();
  } catch (error: any) {
    console.error('删除员工失败:', error);
    ElMessage.error('删除员工失败');
  }
}

// ─── 重置密码 ────────────────────────────────────────────────────────────────
async function handleResetPassword() {
  try {
    const res = await resetEmployeePasswordApi(resetEmployeeId.value);
    resetResult.value = res;
    ElMessage.success(`密码已重置，临时密码：${res.temporary_password}`);
  } catch {
    ElMessage.error('密码重置失败');
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
      <BasicTable table-title="员工列表">
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
            {{ isManager(row.module_permissions) ? '管理员' : '员工' }}
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
            active-text="启用"
            inactive-color="#ef4444"
            inactive-text="禁用"
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

        <template #permissions="{ row }">
          <span class="text-sm">
            {{ getPermissionLabels(row.module_permissions) || '-' }}
          </span>
        </template>

        <template #action="{ row }">
          <ElButton size="small" @click="viewProfile(row.id)">档案</ElButton>
          <ElButton
            size="small"
            type="primary"
            @click="openBasicInfoModal(row)"
          >
            编辑
          </ElButton>
          <ElButton size="small" @click="openAccessControlModal(row)">
            门禁
          </ElButton>
          <ElButton size="small" type="warning" @click="openResetModal(row.id)">
            重置密码
          </ElButton>
          <ElButton
            size="small"
            :type="isManager(row.module_permissions) ? 'danger' : 'primary'"
            @click="openPermissionModal(row)"
          >
            权限
          </ElButton>
          <ElButton size="small" type="danger" @click="handleDelete(row)">
            删除
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

    <!-- 权限管理弹窗 -->
    <PermissionDialog
      v-model:visible="showPermissionModal"
      :employee="permissionTarget"
      :loading="permissionLoading"
      :module-options="moduleOptions"
      @submit="handlePermissionUpdate"
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

    <!-- 门禁 ID 编辑弹窗 -->
    <AccessControlDialog
      v-model:visible="showAccessControlModal"
      :employee="accessControlTarget"
      :loading="accessControlLoading"
      @submit="handleAccessControlUpdate"
    />
  </Page>
</template>
