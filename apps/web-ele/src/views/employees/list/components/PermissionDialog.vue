<script lang="ts" setup>
import type { EmployeeApi } from '#/api';

import { computed, ref, watch } from 'vue';

import {
  ElButton,
  ElCheckbox,
  ElCheckboxGroup,
  ElDialog,
  ElEmpty,
  ElMessage,
  ElTag,
} from 'element-plus';

interface ModuleOption {
  module_code: string;
  module_name: string;
}

const props = defineProps<{
  employee: EmployeeApi.EmployeeResponse | null;
  loading?: boolean;
  moduleOptions: ModuleOption[];
}>();

const emit = defineEmits<{
  submit: [payload: EmployeeApi.EmployeePermissionUpdate];
}>();

const visible = defineModel<boolean>('visible', { default: false });

/** 当前勾选的 module_code 列表 */
const selected = ref<string[]>([]);

const employeeLabel = computed(() => {
  if (!props.employee) return '';
  const { full_name, username, employee_code } = props.employee;
  return [full_name || username, employee_code ? `(${employee_code})` : '']
    .filter(Boolean)
    .join(' ');
});

function syncSelected() {
  const granted = new Set<string>();
  if (props.employee?.module_permissions) {
    for (const p of props.employee.module_permissions) {
      if (p.can_view) granted.add(p.module_code);
    }
  }
  selected.value = [...granted];
}

watch(
  () => [props.employee, visible.value] as const,
  () => {
    if (visible.value) syncSelected();
  },
  { deep: true, immediate: true },
);

function selectAll() {
  selected.value = props.moduleOptions.map((m) => m.module_code);
}

function clearAll() {
  selected.value = [];
}

function handleSubmit() {
  const grantedSet = new Set(selected.value);
  const module_permissions: EmployeeApi.ModulePermission[] = props.moduleOptions
    .filter((m) => grantedSet.has(m.module_code))
    .map((m) => ({
      can_approve: false,
      can_create: false,
      can_delete: false,
      can_edit: false,
      can_view: true,
      module_code: m.module_code,
      module_name: m.module_name,
    }));

  if (module_permissions.length === 0) {
    ElMessage.warning('请至少授予一个模块权限，或直接关闭弹窗取消');
    return;
  }
  emit('submit', { module_permissions });
}

function handleClose() {
  visible.value = false;
}
</script>

<template>
  <ElDialog
    v-model="visible"
    :title="`权限管理 - ${employeeLabel}`"
    width="640px"
    destroy-on-close
  >
    <div v-if="!moduleOptions.length" class="py-6">
      <ElEmpty
        description="暂无可分配的模块，请先在系统参数维护中配置模块清单"
      />
    </div>

    <div v-else class="flex flex-col gap-3">
      <!-- 顶部操作 -->
      <div class="flex items-center justify-between">
        <span class="text-sm text-muted-foreground">
          已选择 {{ selected.length }} / {{ moduleOptions.length }} 个模块
        </span>
        <div class="flex gap-2">
          <ElButton size="small" type="primary" link @click="selectAll">
            全选
          </ElButton>
          <ElButton size="small" type="danger" link @click="clearAll">
            清空
          </ElButton>
        </div>
      </div>

      <!-- 模块清单 -->
      <ElCheckboxGroup v-model="selected" class="grid grid-cols-2 gap-2">
        <div
          v-for="mod in moduleOptions"
          :key="mod.module_code"
          class="flex items-center gap-2 rounded border-b border-gray-100 py-2"
        >
          <ElCheckbox :value="mod.module_code">
            <strong>{{ mod.module_name }}</strong>
            <ElTag size="small" type="info" class="ml-2">
              {{ mod.module_code }}
            </ElTag>
          </ElCheckbox>
        </div>
      </ElCheckboxGroup>

      <p class="text-xs text-muted-foreground">
        提示：勾选即授予该模块权限（后端默认开通查看权限）；未勾选的模块将被移除。
      </p>
    </div>

    <template #footer>
      <ElButton :loading="loading" @click="handleClose">取消</ElButton>
      <ElButton :loading="loading" type="primary" @click="handleSubmit">
        保存权限
      </ElButton>
    </template>
  </ElDialog>
</template>
