import type { ComputedRef, Ref } from 'vue';

import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { computed } from 'vue';

/** 列显隐配置类型 */
export type ColumnVisibility = {
  department_position: boolean;
  employee_code: boolean;
  full_name: boolean;
  initial_status: boolean;
  permissions: boolean;
  role: boolean;
  status: boolean;
  temporary_password: boolean;
  user_id: boolean;
  username: boolean;
};

/** 默认列显隐（全部显示） */
export const defaultColumnVisibility: ColumnVisibility = {
  department_position: true,
  employee_code: true,
  full_name: true,
  initial_status: true,
  permissions: true,
  role: true,
  status: true,
  temporary_password: true,
  user_id: true,
  username: true,
};

/** 身份筛选选项 */
export const roleOptions = [
  { label: '管理员', value: 'admin' },
  { label: '员工', value: 'employee' },
];

/** 状态筛选选项 */
export const statusOptions = [
  { label: '启用', value: 'active' },
  { label: '禁用', value: 'disabled' },
];

/** 工具栏配置（含刷新按钮） */
export const sharedToolbarConfig: VxeGridProps['toolbarConfig'] = {
  custom: true,
  zoom: true,
  tools: [
    {
      code: 'manual-refresh',
      circle: true,
      icon: 'vxe-icon-refresh',
      name: '刷新',
    },
  ],
};

type SelectOption = { label: string; value: string };

/** 构建筛选表单 schema（部门/地区选项随元数据动态变化） */
export function buildFormSchema(
  departmentOptions: ComputedRef<SelectOption[]> | Ref<SelectOption[]>,
  regionOptions: ComputedRef<SelectOption[]> | Ref<SelectOption[]>,
): VbenFormProps['schema'] {
  return [
    {
      component: 'Input',
      fieldName: 'keyword',
      label: '关键词',
      componentProps: {
        clearable: true,
        placeholder: '搜索用户名 / 邮箱 / 姓名 / 工号',
      },
    },
    {
      component: 'Select',
      fieldName: 'role',
      label: '身份',
      componentProps: {
        clearable: true,
        options: roleOptions,
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: '状态',
      componentProps: {
        clearable: true,
        options: statusOptions,
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
  ];
}

/** 根据列显隐状态构建表格列配置 */
export function buildColumns(
  visibility: ColumnVisibility,
): VxeGridProps['columns'] {
  const cols: VxeGridProps['columns'] = [];
  if (visibility.user_id) {
    cols.push({ field: 'id', sortable: true, title: '用户ID', width: 100 });
  }
  if (visibility.employee_code) {
    cols.push({
      field: 'employee_code',
      sortable: true,
      title: '工号',
      width: 100,
    });
  }
  if (visibility.full_name) {
    cols.push({
      field: 'full_name',
      sortable: true,
      title: '姓名',
      width: 100,
    });
  }
  if (visibility.username) {
    cols.push({ field: 'username', sortable: true, title: '账号', width: 120 });
  }
  if (visibility.role) {
    cols.push({
      field: 'is_admin',
      slots: { default: 'role' },
      sortable: true,
      title: '身份',
      width: 80,
    });
  }
  if (visibility.department_position) {
    cols.push({
      slots: { default: 'dept_pos_region' },
      title: '部门/岗位/地区',
      width: 200,
    });
  }
  if (visibility.status) {
    cols.push({
      field: 'is_active',
      slots: { default: 'status' },
      sortable: true,
      title: '状态',
      width: 120,
    });
  }
  if (visibility.initial_status) {
    cols.push({
      field: 'is_initial_password',
      slots: { default: 'initial_status' },
      title: '初始密码状态',
      width: 120,
    });
  }
  if (visibility.temporary_password) {
    cols.push({
      field: 'temporary_password',
      slots: { default: 'temporary_password' },
      title: '初始密码',
      width: 180,
    });
  }
  if (visibility.permissions) {
    cols.push({
      minWidth: 200,
      slots: { default: 'permissions' },
      title: '权限',
    });
  }
  cols.push({
    fixed: 'right',
    resizable: false,
    slots: { default: 'action' },
    title: '操作',
    width: 180,
  });
  return cols;
}
