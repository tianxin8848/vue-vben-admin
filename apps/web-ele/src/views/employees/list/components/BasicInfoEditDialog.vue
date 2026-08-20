<script lang="ts" setup>
import type { EmployeeApi } from '#/api';

import { computed, reactive, watch } from 'vue';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
} from 'element-plus';

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
    ElMessage.warning('用户名 / 邮箱 / 姓名不能为空');
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
    :title="`编辑基础信息 - ${employeeLabel}`"
    width="640px"
    destroy-on-close
  >
    <ElForm :model="form" label-width="80px">
      <div class="grid grid-cols-2 gap-x-4">
        <ElFormItem label="用户名">
          <ElInput v-model="form.username" placeholder="登录账号" />
        </ElFormItem>
        <ElFormItem label="邮箱">
          <ElInput v-model="form.email" placeholder="邮箱" />
        </ElFormItem>
        <ElFormItem label="姓名">
          <ElInput v-model="form.full_name" placeholder="姓名" />
        </ElFormItem>
        <ElFormItem label="手机号">
          <ElInput v-model="form.phone" placeholder="手机号" />
        </ElFormItem>
        <ElFormItem label="部门">
          <ElSelect
            v-model="form.department"
            placeholder="选择部门"
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
        <ElFormItem label="岗位">
          <ElSelect
            v-model="form.position"
            placeholder="选择岗位"
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
        <ElFormItem label="地区">
          <ElSelect
            v-model="form.region"
            placeholder="选择地区"
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
      <ElButton :loading="loading" @click="handleClose">取消</ElButton>
      <ElButton :loading="loading" type="primary" @click="handleSubmit">
        保存
      </ElButton>
    </template>
  </ElDialog>
</template>
