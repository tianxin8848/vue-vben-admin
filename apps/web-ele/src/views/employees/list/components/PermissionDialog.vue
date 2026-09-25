<script lang="ts" setup>
import type { EmployeeApi } from '#/api';

import { computed, ref, watch } from 'vue';

import {
  ElButton,
  ElCheckbox,
  ElCheckboxGroup,
  ElDialog,
  ElEmpty,
  ElTag,
} from 'element-plus';

import { $t } from '#/locales';
import { toastWarning } from '#/utils/message';

type ModuleOption = EmployeeApi.EmployeeManageMeta['modules'][number];

const props = defineProps<{
  /** 被编辑的员工（权限以此人的 module_permissions 预勾选） */
  employee: EmployeeApi.EmployeeResponse | null;
  loading?: boolean;
  /** 可分配的模块清单（/employees/manage/meta 的 modules） */
  moduleOptions: ModuleOption[];
  /** 权限角色模板目录，用于「普通员工 / 管理员」一键填充勾选 */
  roleOptions: EmployeeApi.PermissionRoleOption[];
}>();

const emit = defineEmits<{
  submit: [payload: EmployeeApi.EmployeePermissionUpdate];
}>();

const visible = defineModel<boolean>('visible', { default: false });

/**
 * 角色 code → 文案 key。
 *
 * 角色名与创建抽屉共用同一套措辞（同一个 permission_roles 目录），
 * 这里直接复用它的文案，避免两处各写一份「普通员工 / 管理员」。
 * 目录里出现未知 code 时回退后端下发的 label。
 */
const ROLE_LABEL_KEYS: Record<string, string> = {
  administrator: 'page.employees.createDrawer.permissionRole.administrator',
  employee: 'page.employees.createDrawer.permissionRole.employee',
};

function roleLabel(role: EmployeeApi.PermissionRoleOption) {
  const key = ROLE_LABEL_KEYS[role.code];
  return key ? $t(key) : role.label;
}

/** 当前勾选的 module_code 列表 */
const selected = ref<string[]>([]);

const moduleCodeSet = computed(
  () => new Set(props.moduleOptions.map((m) => m.module_code)),
);

const employeeLabel = computed(() => {
  if (!props.employee) return '';
  const { full_name, username, employee_code } = props.employee;
  return [full_name || username, employee_code ? `(${employee_code})` : '']
    .filter(Boolean)
    .join(' ');
});

/** 已有权限中 can_view 为真的才算「已开通」，与后端语义一致 */
function syncSelected() {
  const granted = new Set<string>();
  for (const p of props.employee?.module_permissions ?? []) {
    if (p.can_view) granted.add(p.module_code);
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

/**
 * 按角色模板一键填充勾选。
 *
 * 与后端页面「普通员工 / 管理员」按钮同口径：直接取角色的 module_codes，
 * 只做本地勾选替换，不提交 permission_role（逐项勾选才是最终结果）。
 */
function applyRole(roleCode: string) {
  const role = props.roleOptions.find((item) => item.code === roleCode);
  if (!role) return;
  selected.value = (role.module_codes || []).filter((code) =>
    moduleCodeSet.value.has(code),
  );
}

function selectAll() {
  selected.value = props.moduleOptions.map((m) => m.module_code);
}

function clearAll() {
  selected.value = [];
}

function handleSubmit() {
  const granted = new Set(selected.value);
  const module_permissions: EmployeeApi.ModulePermission[] = props.moduleOptions
    .filter((m) => granted.has(m.module_code))
    .map((m) => ({
      can_approve: false,
      can_create: false,
      can_delete: false,
      can_edit: false,
      can_view: true,
      module_code: m.module_code,
      module_name: m.module_name,
    }));

  // 后端是全量覆盖：空列表会把该员工的模块权限清空，等于锁死其系统入口，
  // 因此这里拦一道，避免误点「清空选择」后直接保存。
  if (module_permissions.length === 0) {
    toastWarning($t('page.employees.permissionDialog.emptyWarning'));
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
    :title="
      $t('page.employees.permissionDialog.title', { name: employeeLabel })
    "
    width="640px"
    destroy-on-close
  >
    <p class="mb-3 text-sm text-muted-foreground">
      {{ $t('page.employees.permissionDialog.hint') }}
    </p>

    <ElEmpty
      v-if="!moduleOptions.length"
      :description="$t('page.employees.permissionDialog.noModules')"
      :image-size="60"
    />

    <div v-else class="flex flex-col gap-3">
      <!-- 角色快捷填充 + 全选 / 清空 -->
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-2">
          <ElButton
            v-for="role in roleOptions"
            :key="role.code"
            size="small"
            @click="applyRole(role.code)"
          >
            {{ roleLabel(role) }}
          </ElButton>
          <ElButton size="small" @click="selectAll">
            {{ $t('page.employees.permissionDialog.selectAll') }}
          </ElButton>
          <ElButton size="small" @click="clearAll">
            {{ $t('page.employees.permissionDialog.clearAll') }}
          </ElButton>
        </div>
        <span class="text-sm text-muted-foreground">
          {{
            $t('page.employees.permissionDialog.selectedCount', {
              count: selected.length,
              total: moduleOptions.length,
            })
          }}
        </span>
      </div>

      <!-- 模块清单 -->
      <ElCheckboxGroup v-model="selected" class="grid grid-cols-2 gap-2">
        <div
          v-for="mod in moduleOptions"
          :key="mod.module_code"
          class="flex items-center rounded border-b border-border py-2"
        >
          <ElCheckbox :value="mod.module_code">
            <strong>{{ mod.module_name }}</strong>
            <ElTag class="ml-2" size="small" type="info">
              {{ mod.module_code }}
            </ElTag>
          </ElCheckbox>
        </div>
      </ElCheckboxGroup>

      <p class="text-xs text-muted-foreground">
        {{ $t('page.employees.permissionDialog.tip') }}
      </p>
    </div>

    <template #footer>
      <ElButton :loading="loading" @click="handleClose">
        {{ $t('page.employees.permissionDialog.cancel') }}
      </ElButton>
      <ElButton :loading="loading" type="primary" @click="handleSubmit">
        {{ $t('page.employees.permissionDialog.save') }}
      </ElButton>
    </template>
  </ElDialog>
</template>
