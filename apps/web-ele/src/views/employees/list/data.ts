import type { ComputedRef, Ref } from 'vue';

import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { computed } from 'vue';

type TFunc = (key: string, named?: Record<string, any>) => string;

/** 列显隐配置类型 */
export type ColumnVisibility = {
  department_position: boolean;
  employee_code: boolean;
  full_name: boolean;
  initial_status: boolean;
  role: boolean;
  status: boolean;
  temporary_password: boolean;
  username: boolean;
};

/** 默认列显隐（全部显示） */
export const defaultColumnVisibility: ColumnVisibility = {
  department_position: true,
  employee_code: true,
  full_name: true,
  initial_status: true,
  role: true,
  status: true,
  temporary_password: true,
  username: true,
};

type SelectOption = { label: string; value: string };

/** 工具栏配置（含刷新按钮） */
export function createSharedToolbarConfig(
  t: TFunc,
): VxeGridProps['toolbarConfig'] {
  return {
    custom: true,
    zoom: true,
    tools: [
      {
        code: 'manual-refresh',
        circle: true,
        icon: 'vxe-icon-refresh',
        name: t('page.employees.toolbar.refresh'),
      },
    ],
  };
}

/** 构建筛选表单 schema（部门/地区选项随元数据动态变化） */
export function buildFormSchema(
  t: TFunc,
  departmentOptions: ComputedRef<SelectOption[]> | Ref<SelectOption[]>,
  regionOptions: ComputedRef<SelectOption[]> | Ref<SelectOption[]>,
): VbenFormProps['schema'] {
  return [
    {
      component: 'Input',
      fieldName: 'keyword',
      label: t('page.employees.search.keywordLabel'),
      componentProps: {
        clearable: true,
        placeholder: t('page.employees.search.keywordPlaceholder'),
      },
    },
    {
      component: 'Select',
      fieldName: 'role',
      label: t('page.employees.search.roleLabel'),
      componentProps: {
        clearable: true,
        options: [
          { label: t('page.employees.role.admin'), value: 'admin' },
          { label: t('page.employees.role.employee'), value: 'employee' },
        ],
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: t('page.employees.search.statusLabel'),
      componentProps: {
        clearable: true,
        options: [
          { label: t('page.employees.statusOption.active'), value: 'active' },
          {
            label: t('page.employees.statusOption.disabled'),
            value: 'disabled',
          },
        ],
      },
    },
    {
      component: 'Select',
      fieldName: 'department',
      label: t('page.employees.search.departmentLabel'),
      componentProps: {
        clearable: true,
        options: computed(() => departmentOptions.value),
      },
    },
    {
      component: 'Select',
      fieldName: 'region',
      label: t('page.employees.search.regionLabel'),
      componentProps: {
        clearable: true,
        options: computed(() => regionOptions.value),
      },
    },
  ];
}

/** 根据列显隐状态构建表格列配置 */
export function buildColumns(
  t: TFunc,
  visibility: ColumnVisibility,
): VxeGridProps['columns'] {
  const cols: VxeGridProps['columns'] = [];
  if (visibility.employee_code) {
    cols.push({
      field: 'employee_code',
      sortable: true,
      title: t('page.employees.column.employeeCode'),
      width: 100,
    });
  }
  if (visibility.full_name) {
    cols.push({
      field: 'full_name',
      sortable: true,
      title: t('page.employees.column.fullName'),
      width: 100,
    });
  }
  if (visibility.username) {
    cols.push({
      field: 'username',
      sortable: true,
      title: t('page.employees.column.username'),
      width: 120,
    });
  }
  if (visibility.role) {
    cols.push({
      slots: { default: 'role' },
      title: t('page.employees.column.role'),
      width: 80,
    });
  }
  if (visibility.department_position) {
    cols.push({
      slots: { default: 'dept_pos_region' },
      title: t('page.employees.column.deptPosRegion'),
      width: 200,
    });
  }
  if (visibility.status) {
    cols.push({
      field: 'is_active',
      slots: { default: 'status' },
      sortable: true,
      title: t('page.employees.column.status'),
      width: 120,
    });
  }
  if (visibility.initial_status) {
    cols.push({
      field: 'is_initial_password',
      slots: { default: 'initial_status' },
      title: t('page.employees.column.initialPasswordStatus'),
      width: 120,
    });
  }
  if (visibility.temporary_password) {
    cols.push({
      field: 'temporary_password',
      slots: { default: 'temporary_password' },
      title: t('page.employees.column.initialPassword'),
      width: 180,
    });
  }
  cols.push({
    fixed: 'right',
    resizable: false,
    slots: { default: 'action' },
    title: t('page.employees.column.action'),
    width: 460,
  });
  return cols;
}
