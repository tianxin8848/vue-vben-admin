<script lang="ts" setup>
import type { EmployeeApi } from '#/api';

import { computed, reactive, watch } from 'vue';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
} from 'element-plus';

import { $t } from '#/locales';
import { toastWarning } from '#/utils/message';

interface SelectOption {
  label: string;
  value: string;
}

const props = defineProps<{
  departmentOptions: SelectOption[];
  employee: EmployeeApi.EmployeeResponse | null;
  loading?: boolean;
  positionOptions: SelectOption[];
  regionOptions: SelectOption[];
}>();

const emit = defineEmits<{
  submit: [payload: EmployeeApi.EmployeeBasicInfoUpdate];
}>();

const visible = defineModel<boolean>('visible', { default: false });

const form = reactive<EmployeeApi.EmployeeBasicInfoUpdate>({
  department: null,
  email: null,
  employee_code: null,
  full_name: null,
  phone: null,
  position: null,
  region: null,
  username: null,
});

const employeeLabel = computed(() => {
  if (!props.employee) return '';
  const { full_name, username, employee_code } = props.employee;
  return [full_name || username, employee_code ? `(${employee_code})` : '']
    .filter(Boolean)
    .join(' ');
});

function syncForm() {
  const e = props.employee;
  if (!e) return;
  form.username = e.username;
  form.email = e.email;
  form.full_name = e.full_name;
  form.phone = e.phone;
  form.department = e.department;
  form.position = e.position;
  form.region = e.region;
  form.employee_code = e.employee_code;
}

watch(
  () => [props.employee, visible.value] as const,
  () => {
    if (visible.value) syncForm();
  },
  { deep: true, immediate: true },
);

function handleSubmit() {
  if (!form.username || !form.email || !form.full_name) {
    toastWarning($t('page.employees.basicInfoEdit.requiredFields'));
    return;
  }
  emit('submit', { ...form });
}

function handleClose() {
  visible.value = false;
}
</script>

<template>
  <ElDialog
    v-model="visible"
    :title="$t('page.employees.basicInfoEdit.title', { name: employeeLabel })"
    width="640px"
    destroy-on-close
  >
    <ElForm :model="form" label-width="80px">
      <div class="grid grid-cols-2 gap-x-4">
        <ElFormItem :label="$t('page.employees.basicInfoEdit.username')">
          <ElInput
            v-model="form.username"
            :placeholder="
              $t('page.employees.basicInfoEdit.usernamePlaceholder')
            "
          />
        </ElFormItem>
        <ElFormItem :label="$t('page.employees.basicInfoEdit.email')">
          <ElInput
            v-model="form.email"
            :placeholder="$t('page.employees.basicInfoEdit.emailPlaceholder')"
          />
        </ElFormItem>
        <ElFormItem :label="$t('page.employees.basicInfoEdit.fullName')">
          <ElInput
            v-model="form.full_name"
            :placeholder="
              $t('page.employees.basicInfoEdit.fullNamePlaceholder')
            "
          />
        </ElFormItem>
        <ElFormItem :label="$t('page.employees.basicInfoEdit.employeeCode')">
          <ElInput
            v-model="form.employee_code"
            :maxlength="32"
            :placeholder="
              $t('page.employees.basicInfoEdit.employeeCodePlaceholder')
            "
          />
        </ElFormItem>
        <ElFormItem :label="$t('page.employees.basicInfoEdit.phone')">
          <ElInput
            v-model="form.phone"
            :placeholder="$t('page.employees.basicInfoEdit.phonePlaceholder')"
          />
        </ElFormItem>
        <ElFormItem :label="$t('page.employees.basicInfoEdit.department')">
          <ElSelect
            v-model="form.department"
            :placeholder="
              $t('page.employees.basicInfoEdit.departmentPlaceholder')
            "
            clearable
            filterable
            style="width: 100%"
          >
            <ElOption
              v-for="opt in departmentOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem :label="$t('page.employees.basicInfoEdit.position')">
          <ElSelect
            v-model="form.position"
            :placeholder="
              $t('page.employees.basicInfoEdit.positionPlaceholder')
            "
            clearable
            filterable
            style="width: 100%"
          >
            <ElOption
              v-for="opt in positionOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem :label="$t('page.employees.basicInfoEdit.region')">
          <ElSelect
            v-model="form.region"
            :placeholder="$t('page.employees.basicInfoEdit.regionPlaceholder')"
            clearable
            filterable
            style="width: 100%"
          >
            <ElOption
              v-for="opt in regionOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
        </ElFormItem>
      </div>
    </ElForm>

    <template #footer>
      <ElButton :loading="loading" @click="handleClose">
        {{ $t('page.employees.basicInfoEdit.cancel') }}
      </ElButton>
      <ElButton :loading="loading" type="primary" @click="handleSubmit">
        {{ $t('page.employees.basicInfoEdit.save') }}
      </ElButton>
    </template>
  </ElDialog>
</template>
