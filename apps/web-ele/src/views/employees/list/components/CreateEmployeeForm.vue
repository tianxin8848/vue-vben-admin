<script lang="ts" setup>
import type { EmployeeApi } from '#/api';

import { reactive, ref } from 'vue';

import {
  ElButton,
  ElCard,
  ElCheckbox,
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
  submit: [payload: EmployeeApi.EmployeeCreate];
}>();

const createForm = reactive({
  department: '',
  email: '',
  full_name: '',
  is_admin: false,
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
  createForm.is_admin = false;
  selectedModuleCodes.value = [];
}

function handleSubmit() {
  if (
    !createForm.username ||
    !createForm.email ||
    !createForm.full_name ||
    !createForm.department
  ) {
    ElMessage.warning('请填写必填项');
    return;
  }
  const payload: EmployeeApi.EmployeeCreate = {
    department: createForm.department,
    email: createForm.email,
    full_name: createForm.full_name,
    is_admin: createForm.is_admin,
    module_permissions: buildModulePermissions(),
    phone: createForm.phone || undefined,
    position: createForm.position || undefined,
    region: createForm.region || undefined,
    username: createForm.username,
  };
  emit('submit', payload);
}

defineExpose({ resetForm });
</script>

<template>
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
        <ElButton type="primary" @click="handleSubmit">创建员工</ElButton>
      </ElFormItem>
    </ElForm>
  </ElCard>
</template>
