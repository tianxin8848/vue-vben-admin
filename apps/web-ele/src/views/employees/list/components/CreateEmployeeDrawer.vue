<script lang="ts" setup>
import type { EmployeeApi } from '#/api';

import { reactive } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { useI18n } from '@vben/locales';

import {
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElSelect,
} from 'element-plus';

import { createEmployeeApi } from '#/api';
import { handleActionError, toastSuccess, toastWarning } from '#/utils/message';

interface SelectOption {
  label: string;
  value: string;
}

defineProps<{
  departmentOptions: SelectOption[];
  permissionRoleOptions: EmployeeApi.PermissionRoleOption[];
  positionOptions: SelectOption[];
  regionOptions: SelectOption[];
}>();

const emit = defineEmits<{
  success: [];
}>();

const { t } = useI18n();

const createForm = reactive({
  department: '',
  email: '',
  employee_code: '',
  full_name: '',
  permission_role: 'employee' as EmployeeApi.PermissionRole,
  phone: '',
  position: '',
  region: '',
});

/**
 * 权限角色只决定「创建时开通哪些模块」，属于快捷模板。
 * 角色与模块的对应关系由后端下发（`permission_roles[].module_codes`），
 * 前端不硬编码；细项权限如需调整，走后台的权限管理入口。
 */
const ROLE_LABEL_KEYS: Record<string, string> = {
  administrator: 'page.employees.createDrawer.permissionRole.administrator',
  employee: 'page.employees.createDrawer.permissionRole.employee',
};

const ROLE_HINT_KEYS: Record<string, string> = {
  administrator: 'page.employees.createDrawer.permissionRole.administratorHint',
  employee: 'page.employees.createDrawer.permissionRole.employeeHint',
};

/** 角色名称：优先取 i18n，翻译缺失（返回原 key）时回退后端中文 label */
function permissionRoleLabel(role: EmployeeApi.PermissionRoleOption) {
  const key = ROLE_LABEL_KEYS[role.code];
  if (!key) return role.label;
  const text = t(key);
  return text === key ? role.label : text;
}

function permissionRoleHint(code: string) {
  const key = ROLE_HINT_KEYS[code];
  if (!key) return '';
  const text = t(key);
  return text === key ? '' : text;
}

function resetForm() {
  createForm.email = '';
  createForm.full_name = '';
  createForm.department = '';
  createForm.phone = '';
  createForm.position = '';
  createForm.region = '';
  createForm.employee_code = '';
  createForm.permission_role = 'employee';
}

const [CreateDrawer, createDrawerApi] = useVbenDrawer({
  confirmText: t('page.employees.create'),
  onClosed: resetForm,
  onConfirm: submitCreate,
  title: t('page.employees.drawer.createTitle'),
});

async function submitCreate() {
  if (!createForm.email || !createForm.full_name || !createForm.department) {
    toastWarning(t('page.employees.createDrawer.requiredFields'));
    return;
  }
  const payload: EmployeeApi.EmployeeCreate = {
    department: createForm.department,
    email: createForm.email,
    employee_code: createForm.employee_code || undefined,
    full_name: createForm.full_name,
    permission_role: createForm.permission_role,
    phone: createForm.phone || undefined,
    position: createForm.position || undefined,
    region: createForm.region || undefined,
  };
  createDrawerApi.lock(true);
  try {
    await createEmployeeApi(payload);
    toastSuccess(t('page.employees.createDrawer.createSuccess'));
    createDrawerApi.close();
    emit('success');
  } catch (error: any) {
    handleActionError(
      'employees/list/CreateEmployeeDrawer',
      error,
      t('page.employees.createDrawer.createFailed'),
    );
  } finally {
    createDrawerApi.lock(false);
  }
}

function open() {
  resetForm();
  createDrawerApi.open();
}

defineExpose({ open });
</script>

<template>
  <CreateDrawer class="w-[600px]">
    <ElForm :model="createForm" label-width="auto">
      <ElFormItem :label="`${t('page.employees.createDrawer.email')} *`">
        <ElInput
          v-model="createForm.email"
          :placeholder="t('page.employees.createDrawer.emailPlaceholder')"
          class="w-full"
        />
      </ElFormItem>
      <ElFormItem :label="`${t('page.employees.createDrawer.fullName')} *`">
        <ElInput
          v-model="createForm.full_name"
          :placeholder="t('page.employees.createDrawer.fullNamePlaceholder')"
          class="w-full"
        />
      </ElFormItem>
      <ElFormItem :label="t('page.employees.createDrawer.employeeCode')">
        <ElInput
          v-model="createForm.employee_code"
          :maxlength="32"
          :placeholder="
            t('page.employees.createDrawer.employeeCodePlaceholder')
          "
          class="w-full"
        />
      </ElFormItem>
      <ElFormItem :label="`${t('page.employees.createDrawer.department')} *`">
        <ElSelect
          v-model="createForm.department"
          :placeholder="t('page.employees.createDrawer.departmentPlaceholder')"
          class="w-full"
        >
          <ElOption
            v-for="opt in departmentOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem :label="t('page.employees.createDrawer.phone')">
        <ElInput
          v-model="createForm.phone"
          :placeholder="t('page.employees.createDrawer.phonePlaceholder')"
          class="w-full"
        />
      </ElFormItem>
      <ElFormItem :label="t('page.employees.createDrawer.region')">
        <ElSelect
          v-model="createForm.region"
          :placeholder="t('page.employees.createDrawer.regionPlaceholder')"
          class="w-full"
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
      <ElFormItem :label="t('page.employees.createDrawer.position')">
        <ElSelect
          v-model="createForm.position"
          :placeholder="t('page.employees.createDrawer.positionPlaceholder')"
          class="w-full"
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
      <ElFormItem
        :label="t('page.employees.createDrawer.permissionRole.label')"
      >
        <div class="w-full">
          <ElRadioGroup v-model="createForm.permission_role">
            <ElRadio
              v-for="role in permissionRoleOptions"
              :key="role.code"
              :value="role.code"
            >
              <strong>{{ permissionRoleLabel(role) }}</strong>
              <span
                v-if="permissionRoleHint(role.code)"
                class="ml-1 text-xs text-muted-foreground"
              >
                {{ permissionRoleHint(role.code) }}
              </span>
            </ElRadio>
          </ElRadioGroup>
          <p class="mt-2 text-xs text-muted-foreground">
            {{ t('page.employees.createDrawer.permissionRole.tip') }}
          </p>
        </div>
      </ElFormItem>
    </ElForm>
  </CreateDrawer>
</template>
