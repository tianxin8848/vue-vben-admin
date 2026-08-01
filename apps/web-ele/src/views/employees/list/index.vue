<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { EmployeeApi, SystemSettingsApi } from '#/api';

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

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
  ElTag,
} from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createEmployeeApi,
  getEmployeesApi,
  getSystemSettingsApi,
  resetEmployeePasswordApi,
  updateEmployeeAdminApi,
  updateEmployeeStatusApi,
} from '#/api';

const router = useRouter();

// ─── 列显示切换 ──────────────────────────────────────────────────────────────
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

// ─── 选项数据 ────────────────────────────────────────────────────────────────
const departmentOptions = ref<{ label: string; value: string }[]>([]);
const positionOptions = ref<{ label: string; value: string }[]>([]);
const regionOptions = ref<{ label: string; value: string }[]>([]);
const moduleOptions = ref<SystemSettingsApi.SystemModuleItem[]>([]);
const selectedModuleCodes = ref<string[]>([]);

const allEmployees = ref<EmployeeApi.EmployeeResponse[]>([]);

async function fetchSystemSettings() {
  try {
    const settings: SystemSettingsApi.SystemSettingsResponse =
      await getSystemSettingsApi();
    departmentOptions.value = (settings.departments || []).map((d) => ({
      label: d,
      value: d,
    }));
    positionOptions.value = (settings.positions || []).map((p) => ({
      label: p,
      value: p,
    }));
    regionOptions.value = (settings.regions || []).map((r) => ({
      label: r,
      value: r,
    }));
    moduleOptions.value = settings.modules || [];
  } catch {
    // 获取系统设置失败时保持空选项
  }
}

// ─── 筛选表单配置（自动带 Search / Reset / Collapse 按钮） ───────────────────
const formOptions: VbenFormProps = {
  schema: [
    {
      component: 'Input',
      fieldName: 'keyword',
      label: '关键词',
      componentProps: {
        placeholder: '搜索用户名 / 邮箱 / 姓名 / 工号',
        clearable: true,
      },
    },
    {
      component: 'Select',
      fieldName: 'role',
      label: '身份',
      componentProps: {
        clearable: true,
        options: [
          { label: '管理员', value: 'admin' },
          { label: '员工', value: 'employee' },
        ],
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: '状态',
      componentProps: {
        clearable: true,
        options: [
          { label: '启用', value: 'active' },
          { label: '禁用', value: 'disabled' },
        ],
      },
    },
    {
      component: 'Select',
      fieldName: 'department',
      label: '部门',
      componentProps: {
        clearable: true,
        options: computed(() => departmentOptions.value),
      },
    },
    {
      component: 'Select',
      fieldName: 'region',
      label: '地区',
      componentProps: {
        clearable: true,
        options: computed(() => regionOptions.value),
      },
    },
  ],
  commonConfig: {
    labelWidth: 70,
    componentProps: {
      allowClear: true,
    },
  },
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  // 提交/重置后触发表格重载
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

// ─── 表格列配置 ──────────────────────────────────────────────────────────────
function buildColumns(): VxeGridProps['columns'] {
  const cols: VxeGridProps['columns'] = [];
  if (columnVisibility.user_id) {
    cols.push({
      field: 'id',
      title: '用户ID',
      width: 100,
      sortable: true,
    });
  }
  if (columnVisibility.employee_code) {
    cols.push({
      field: 'employee_code',
      title: '工号',
      width: 100,
      sortable: true,
    });
  }
  if (columnVisibility.full_name) {
    cols.push({
      field: 'full_name',
      title: '姓名',
      width: 100,
      sortable: true,
    });
  }
  if (columnVisibility.username) {
    cols.push({
      field: 'username',
      title: '账号',
      width: 120,
      sortable: true,
    });
  }
  if (columnVisibility.role) {
    cols.push({
      field: 'is_admin',
      title: '身份',
      width: 80,
      sortable: true,
      slots: { default: 'role' },
    });
  }
  if (columnVisibility.department_position) {
    cols.push({
      title: '部门/岗位/地区',
      width: 200,
      slots: { default: 'dept_pos_region' },
    });
  }
  if (columnVisibility.status) {
    cols.push({
      field: 'is_active',
      title: '状态',
      width: 120,
      sortable: true,
      slots: { default: 'status' },
    });
  }
  if (columnVisibility.initial_status) {
    cols.push({
      field: 'is_initial_password',
      title: '初始密码状态',
      width: 120,
      slots: { default: 'initial_status' },
    });
  }
  if (columnVisibility.temporary_password) {
    cols.push({
      field: 'temporary_password',
      title: '初始密码',
      width: 180,
      slots: { default: 'temporary_password' },
    });
  }
  if (columnVisibility.permissions) {
    cols.push({
      title: '权限',
      minWidth: 200,
      slots: { default: 'permissions' },
    });
  }
  cols.push({
    title: '操作',
    width: 180,
    fixed: 'right',
    slots: { default: 'action' },
    resizable: false,
  });
  return cols;
}

const gridOptions: VxeGridProps<EmployeeApi.EmployeeResponse> = {
  id: 'employees-list',
  rowConfig: {
    keyField: 'id',
    isHover: true,
  },
  columns: buildColumns(),
  minHeight: 400,
  keepSource: true,
  pagerConfig: {
    pageSize: 10,
    pageSizes: [10, 20, 50, 100],
  },
  proxyConfig: {
    ajax: {
      // 首次加载 & reload 触发
      query: async ({ page }, formValues: any = {}) => {
        if (allEmployees.value.length === 0) {
          allEmployees.value = await getEmployeesApi();
        }
        // 前端筛选
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
        // 分页切片
        const start = (page.currentPage - 1) * page.pageSize;
        const items = list.slice(start, start + page.pageSize);
        return { items, total };
      },
    },
  },
  toolbarConfig: {
    custom: true,
    zoom: true,
    tools: [
      {
        code: 'manual-refresh',
        icon: 'vxe-icon-refresh',
        circle: true,
        name: '刷新',
      },
    ],
  },
  customConfig: {
    storage: false,
  },
};

const [BasicTable, tableApi] = useVbenVxeGrid({
  formOptions,
  gridOptions,
  gridEvents: {
    toolbarToolClick(event: { code: string }) {
      if (event.code === 'manual-refresh') {
        refreshEmployees();
      }
    },
  },
});

// 列显隐变化时刷新表格列配置
watch(
  () => ({ ...columnVisibility }),
  () => {
    tableApi.setGridOptions({ columns: buildColumns() });
  },
  { deep: true },
);

async function refreshEmployees() {
  allEmployees.value = [];
  await tableApi.reload();
}

// ─── 新增员工表单 ────────────────────────────────────────────────────────────
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

async function handleCreate() {
  if (
    !createForm.username ||
    !createForm.email ||
    !createForm.full_name ||
    !createForm.department
  ) {
    ElMessage.warning('请填写必填项');
    return;
  }
  try {
    const payload: EmployeeApi.EmployeeCreate = {
      username: createForm.username,
      email: createForm.email,
      full_name: createForm.full_name,
      department: createForm.department,
      phone: createForm.phone || undefined,
      position: createForm.position || undefined,
      region: createForm.region || undefined,
      is_admin: createForm.is_admin,
      module_permissions: buildModulePermissions(),
    };
    await createEmployeeApi(payload);
    ElMessage.success('创建成功');
    createForm.username = '';
    createForm.email = '';
    createForm.full_name = '';
    createForm.department = '';
    createForm.phone = '';
    createForm.position = '';
    createForm.region = '';
    createForm.is_admin = false;
    selectedModuleCodes.value = [];
    // 刷新列表
    allEmployees.value = [];
    await tableApi.reload();
  } catch (error: any) {
    console.error('创建员工失败:', error);
  }
}

function toggleModule(moduleCode: string) {
  if (selectedModuleCodes.value.includes(moduleCode)) {
    selectedModuleCodes.value = selectedModuleCodes.value.filter(
      (c) => c !== moduleCode,
    );
  } else {
    selectedModuleCodes.value.push(moduleCode);
  }
}
function selectAllModules() {
  selectedModuleCodes.value = moduleOptions.value.map((m) => m.module_code);
}
function clearModules() {
  selectedModuleCodes.value = [];
}
function buildModulePermissions(): EmployeeApi.ModulePermission[] {
  const selectedSet = new Set(selectedModuleCodes.value);
  return moduleOptions.value
    .filter((m) => selectedSet.has(m.module_code))
    .map((m) => ({
      module_code: m.module_code,
      module_name: m.module_name,
      can_view: true,
      can_create: false,
      can_edit: false,
      can_delete: false,
      can_approve: false,
    }));
}

// ─── 行操作 ──────────────────────────────────────────────────────────────────
function viewProfile(id: string) {
  router.push(`/employee/manage/users/${id}/profile`);
}

async function handleStatusChange(id: string, isActive: boolean) {
  try {
    await updateEmployeeStatusApi(id, { is_active: isActive });
    ElMessage.success('状态更新成功');
    allEmployees.value = [];
    await tableApi.reload();
  } catch {
    ElMessage.error('状态更新失败');
  }
}

async function handleAdminChange(id: string, isAdmin: boolean) {
  try {
    await updateEmployeeAdminApi(id, { is_admin: isAdmin });
    ElMessage.success('管理员状态更新成功');
    allEmployees.value = [];
    await tableApi.reload();
  } catch {
    ElMessage.error('更新失败');
  }
}

function getInitialPasswordStatus(isInitial: number) {
  return isInitial === 1 ? '未修改' : '已修改';
}

function getPermissionLabels(permissions: EmployeeApi.ModulePermission[]) {
  return permissions
    .filter(
      (p) =>
        p.can_view ||
        p.can_create ||
        p.can_edit ||
        p.can_delete ||
        p.can_approve,
    )
    .map((p) => p.module_name)
    .join(', ');
}

// ─── 重置密码弹窗 ────────────────────────────────────────────────────────────
const showResetModal = ref(false);
const resetResult = ref<EmployeeApi.EmployeePasswordResetResponse | null>(null);
const resetEmployeeId = ref('');

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

// ─── 初始化 ──────────────────────────────────────────────────────────────────
onMounted(async () => {
  await fetchSystemSettings();
});
</script>

<template>
  <Page
    title="用户管理"
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
      <ElCard header="新增员工">
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
            <ElSelect
              v-model="createForm.position"
              placeholder="请选择岗位"
              style="width: 120px"
              clearable
            >
              <ElOption
                v-for="opt in positionOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem>
            <ElCheckbox v-model="createForm.is_admin" label="创建为管理员" />
          </ElFormItem>
          <ElFormItem label="模块权限">
            <div v-if="moduleOptions.length" class="w-full">
              <div class="mb-2 flex items-center gap-2">
                <ElButton size="small" type="default" @click="selectAllModules">
                  全选模块
                </ElButton>
                <ElButton size="small" type="default" @click="clearModules">
                  清空选择
                </ElButton>
                <span class="text-sm text-muted-foreground">
                  已选择 {{ selectedModuleCodes.length }} 个模块
                </span>
              </div>
              <div class="flex flex-wrap gap-4">
                <ElCheckbox
                  v-for="mod in moduleOptions"
                  :key="mod.module_code"
                  :model-value="selectedModuleCodes.includes(mod.module_code)"
                  @change="toggleModule(mod.module_code)"
                >
                  <strong>{{ mod.module_name }}</strong>
                  <span class="ml-1 text-xs text-muted-foreground">
                    {{ mod.module_code }}
                  </span>
                </ElCheckbox>
              </div>
              <p class="mt-2 text-xs text-muted-foreground">
                勾选后默认开通该模块的查看权限
              </p>
            </div>
            <div v-else class="text-sm text-muted-foreground">
              暂无可选模块，请先到"系统参数维护"中配置
            </div>
          </ElFormItem>
          <ElFormItem>
            <ElButton type="primary" @click="handleCreate">创建员工</ElButton>
          </ElFormItem>
        </ElForm>
      </ElCard>

      <!-- 筛选 + 表格（由 BasicTable 内置：Reset / Search / Collapse 按钮 + 分页 + 工具栏） -->
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
            @change="(val) => handleStatusChange(row.id, Boolean(val))"
            active-text="启用"
            inactive-text="禁用"
            active-color="#10b981"
            inactive-color="#ef4444"
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
    <ElDialog v-model="showResetModal" title="重置密码" width="400px">
      <div v-if="resetResult" class="py-5 text-center">
        <p class="mb-3">密码已重置成功！</p>
        <p>
          临时密码：
          <ElTag type="warning" size="large">
            {{ resetResult.temporary_password }}
          </ElTag>
        </p>
        <p class="mt-2 text-xs text-muted-foreground">
          请通知用户使用该临时密码登录并及时修改
        </p>
      </div>
      <div v-else class="py-5 text-center">
        <p>确认重置该员工密码？</p>
        <p class="text-xs text-muted-foreground">系统将自动生成临时密码</p>
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
  </Page>
</template>
