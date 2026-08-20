<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { EmployeeApi } from '#/api';

import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { ElButton, ElCheckbox, ElMessage, ElSwitch, ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createEmployeeApi,
  getEmployeesApi,
  resetEmployeePasswordApi,
  updateEmployeeAdminApi,
  updateEmployeeStatusApi,
} from '#/api';

import CreateEmployeeForm from './components/CreateEmployeeForm.vue';
import ResetPasswordDialog from './components/ResetPasswordDialog.vue';
import { useEmployeeData } from './composables/useEmployeeData';
import { buildColumns, buildFormSchema, sharedToolbarConfig } from './data';

const router = useRouter();

const {
  allEmployees,
  columnVisibility,
  departmentOptions,
  fetchSystemSettings,
  getInitialPasswordStatus,
  getPermissionLabels,
  invalidateEmployees,
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
    await tableApi.reload();
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
            formValues.role === 'admin' ? e.is_admin : !e.is_admin,
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

// 列显隐变化时刷新表格列配置
watch(
  () => ({ ...columnVisibility }),
  () => {
    tableApi.setGridOptions({ columns: buildColumns(columnVisibility) });
  },
  { deep: true },
);

async function refreshEmployees() {
  invalidateEmployees();
  await tableApi.reload();
}

// ─── 新增员工 ────────────────────────────────────────────────────────────────
const createFormRef = ref<InstanceType<typeof CreateEmployeeForm>>();

async function handleCreate(payload: EmployeeApi.EmployeeCreate) {
  try {
    await createEmployeeApi(payload);
    ElMessage.success('创建成功');
    createFormRef.value?.resetForm();
    invalidateEmployees();
    await tableApi.reload();
  } catch (error: any) {
    console.error('创建员工失败:', error);
  }
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

async function handleAdminChange(id: string, isAdmin: boolean) {
  try {
    await updateEmployeeAdminApi(id, { is_admin: isAdmin });
    ElMessage.success('管理员状态更新成功');
    invalidateEmployees();
    await tableApi.reload();
  } catch {
    ElMessage.error('更新失败');
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
  <Page
    title="用户管理11"
    description="新增员工、查看初始密码、重置密码、维护员工模块权限"
  >
    <div class="flex flex-col gap-4">
      <!-- 列显示切换 -->
      <div class="flex flex-wrap items-center gap-3">
        <ElCheckbox v-model="columnVisibility.user_id" label="用户ID" />
        <ElCheckbox v-model="columnVisibility.employee_code" label="工号" />
        <ElCheckbox v-model="columnVisibility.full_name" label="姓名" />
        <ElCheckbox v-model="columnVisibility.username" label="账号" />
        <ElCheckbox v-model="columnVisibility.role" label="身份" />
        <ElCheckbox
          v-model="columnVisibility.department_position"
          label="部门/岗位/地区"
        />
        <ElCheckbox v-model="columnVisibility.status" label="状态" />
        <ElCheckbox
          v-model="columnVisibility.initial_status"
          label="初始密码状态"
        />
        <ElCheckbox
          v-model="columnVisibility.temporary_password"
          label="初始密码"
        />
        <ElCheckbox v-model="columnVisibility.permissions" label="权限" />
      </div>

      <!-- 新增员工卡片 -->
      <CreateEmployeeForm
        ref="createFormRef"
        :department-options="departmentOptions"
        :module-options="moduleOptions"
        :position-options="positionOptions"
        :region-options="regionOptions"
        @submit="handleCreate"
      />

      <!-- 筛选 + 表格（Reset / Search / Collapse 按钮 + 分页 + 工具栏由 BasicTable 内置） -->
      <BasicTable table-title="员工列表">
        <template #role="{ row }">
          <ElTag :type="row.is_admin ? 'danger' : 'info'" size="small">
            {{ row.is_admin ? '管理员' : '员工' }}
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
          <ElButton size="small" type="warning" @click="openResetModal(row.id)">
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
      </BasicTable>
    </div>

    <!-- 重置密码弹窗 -->
    <ResetPasswordDialog
      v-model:visible="showResetModal"
      :result="resetResult"
      @confirm="handleResetPassword"
    />
  </Page>
</template>
