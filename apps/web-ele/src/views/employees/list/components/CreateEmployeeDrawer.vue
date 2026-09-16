<script lang="ts" setup>
import type { EmployeeApi } from '#/api';

import { reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { useI18n } from '@vben/locales';

import {
  ElButton,
  ElCheckbox,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
} from 'element-plus';

import { createEmployeeApi } from '#/api';
import { handleActionError, toastSuccess, toastWarning } from '#/utils/message';

interface SelectOption {
  label: string;
  value: string;
}

interface ModuleOption {
  module_code: string;
  module_name: string;
}

const props = defineProps<{
  departmentOptions: SelectOption[];
  moduleOptions: ModuleOption[];
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
  phone: '',
  position: '',
  region: '',
  username: '',
});

const selectedModuleCodes = ref<string[]>([]);

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
  selectedModuleCodes.value = props.moduleOptions.map((m) => m.module_code);
}

function clearModules() {
  selectedModuleCodes.value = [];
}

function buildModulePermissions(): EmployeeApi.ModulePermission[] {
  const selectedSet = new Set(selectedModuleCodes.value);
  return props.moduleOptions
    .filter((m) => selectedSet.has(m.module_code))
    .map((m) => ({
      can_approve: false,
      can_create: false,
      can_delete: false,
      can_edit: false,
      can_view: true,
      module_code: m.module_code,
      module_name: m.module_name,
    }));
}

function resetForm() {
  createForm.username = '';
  createForm.email = '';
  createForm.full_name = '';
  createForm.department = '';
  createForm.phone = '';
  createForm.position = '';
  createForm.region = '';
  createForm.employee_code = '';
  selectedModuleCodes.value = [];
}

const [CreateDrawer, createDrawerApi] = useVbenDrawer({
  confirmText: t('page.employees.create'),
  onClosed: resetForm,
  onConfirm: submitCreate,
  title: t('page.employees.drawer.createTitle'),
});

async function submitCreate() {
  if (
    !createForm.username ||
    !createForm.email ||
    !createForm.full_name ||
    !createForm.department
  ) {
    toastWarning(t('page.employees.createDrawer.requiredFields'));
    return;
  }
  const payload: EmployeeApi.EmployeeCreate = {
    department: createForm.department,
    email: createForm.email,
    employee_code: createForm.employee_code || undefined,
    full_name: createForm.full_name,
    module_permissions: buildModulePermissions(),
    phone: createForm.phone || undefined,
    position: createForm.position || undefined,
    region: createForm.region || undefined,
    username: createForm.username,
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
      <ElFormItem :label="`${t('page.employees.createDrawer.username')} *`">
        <ElInput
          v-model="createForm.username"
          :placeholder="t('page.employees.createDrawer.usernamePlaceholder')"
          class="w-full"
        />
      </ElFormItem>
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
      <ElFormItem :label="t('page.employees.createDrawer.modulePermissions')">
        <div v-if="moduleOptions.length" class="w-full">
          <div class="mb-2 flex items-center gap-2">
            <ElButton size="small" type="default" @click="selectAllModules">
              {{ t('page.employees.createDrawer.selectAll') }}
            </ElButton>
            <ElButton size="small" type="default" @click="clearModules">
              {{ t('page.employees.createDrawer.clearAll') }}
            </ElButton>
            <span class="text-sm text-muted-foreground">
              {{
                t('page.employees.createDrawer.selectedCount', {
                  count: selectedModuleCodes.length,
                })
              }}
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
            {{ t('page.employees.createDrawer.moduleTip') }}
          </p>
        </div>
        <div v-else class="text-sm text-muted-foreground">
          {{ t('page.employees.createDrawer.noModules') }}
        </div>
      </ElFormItem>
    </ElForm>
  </CreateDrawer>
</template>
