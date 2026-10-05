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
  employmentTypeOptions: SelectOption[];
  lineManagerOptions: SelectOption[];
  loading?: boolean;
  positionOptions: SelectOption[];
  regionOptions: SelectOption[];
}>();

const emit = defineEmits<{
  submit: [payload: EmployeeApi.EmployeeBasicInfoUpdate];
}>();

const visible = defineModel<boolean>('visible', { default: false });

const form = reactive<EmployeeApi.EmployeeBasicInfoUpdate>({
  chinese_name: null,
  department: null,
  email: null,
  employee_code: null,
  employment_type: null,
  full_name: null,
  line_manager_id: null,
  phone: null,
  position: null,
  region: null,
  username: null,
});

/** 直属上司不能是自己（后端会直接 400），这里先把本人从候选里摘掉 */
const lineManagerChoices = computed(() =>
  props.lineManagerOptions.filter((opt) => opt.value !== props.employee?.id),
);

const employeeLabel = computed(() => {
  if (!props.employee) return '';
  const { chinese_name, full_name, username, employee_code } = props.employee;
  return [
    chinese_name || full_name || username,
    employee_code ? `(${employee_code})` : '',
  ]
    .filter(Boolean)
    .join(' ');
});

function syncForm() {
  const e = props.employee;
  if (!e) return;
  form.username = e.username;
  form.email = e.email;
  form.full_name = e.full_name;
  form.chinese_name = e.chinese_name;
  form.phone = e.phone;
  form.department = e.department;
  form.position = e.position;
  form.region = e.region;
  form.employee_code = e.employee_code;
  form.employment_type = e.employment_type;
  form.line_manager_id = e.line_manager_id;
}

watch(
  () => [props.employee, visible.value] as const,
  () => {
    if (visible.value) syncForm();
  },
  { deep: true, immediate: true },
);

function handleSubmit() {
  // 登录账号（username）已由邮箱锁定，后端在 PATCH 时忽略该字段，
  // 这里不再要求、也不再提交 username。
  if (!form.email || !form.full_name) {
    toastWarning($t('page.employees.basicInfoEdit.requiredFields'));
    return;
  }
  const payload: EmployeeApi.EmployeeBasicInfoUpdate = { ...form };
  delete payload.username;
  emit('submit', payload);
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
    <ElForm :model="form" label-width="auto">
      <div class="grid grid-cols-2 gap-x-4">
        <ElFormItem :label="$t('page.employees.basicInfoEdit.username')">
          <ElInput
            v-model="form.username"
            :disabled="true"
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
        <ElFormItem :label="$t('page.employees.basicInfoEdit.chineseName')">
          <ElInput
            v-model="form.chinese_name"
            :maxlength="50"
            :placeholder="
              $t('page.employees.basicInfoEdit.chineseNamePlaceholder')
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
        <ElFormItem :label="$t('page.employees.basicInfoEdit.employmentType')">
          <ElSelect
            v-model="form.employment_type"
            :placeholder="
              $t('page.employees.basicInfoEdit.employmentTypePlaceholder')
            "
            style="width: 100%"
          >
            <ElOption
              v-for="opt in employmentTypeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem :label="$t('page.employees.basicInfoEdit.lineManager')">
          <ElSelect
            v-model="form.line_manager_id"
            :placeholder="
              $t('page.employees.basicInfoEdit.lineManagerPlaceholder')
            "
            clearable
            filterable
            style="width: 100%"
          >
            <ElOption
              v-for="opt in lineManagerChoices"
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
