import type { ComputedRef, Ref } from 'vue';

import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { EmployeeApi } from '#/api';

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

/**
 * 列宽基准。
 *
 * 除「部门/岗位/地区」外都是固定宽度；该列只给 minWidth 不给 width，
 * 由 vxe 把容器的剩余宽度分给它，这样表格总宽恒等于容器宽：
 * - 表头与表体共用同一张表、同一份 colgroup，永远不会左右错位；
 * - 右侧不会留出空白（不会出现「数据表比表头短」）。
 */
const COLUMN_WIDTH = {
  // 操作列 4 个按钮（档案 / 重置密码 / 编辑权限 / 分享）。
  // 宽度由英文文案决定，最宽的是 `Edit Permissions`；给窄了会被全局
  // showOverflow 裁成省略号。
  action: 430,
  deptPosRegion: 190,
  employeeCode: 120,
  fullName: 110,
  initialPassword: 155,
  initialPasswordStatus: 170,
  role: 90,
  status: 110,
  username: 170,
} as const;

/**
 * 根据列显隐状态构建表格列配置。
 *
 * - 每个可排序的列都带 field，vxe 会把排序字段透传给 proxy 的 query；
 * - slot 列（身份 / 部门 / 状态等）用 field 指向行内真实字段或派生字段，
 *   具体比较逻辑见 compareEmployees。
 */
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
      width: COLUMN_WIDTH.employeeCode,
    });
  }
  if (visibility.full_name) {
    cols.push({
      field: 'full_name',
      sortable: true,
      title: t('page.employees.column.fullName'),
      width: COLUMN_WIDTH.fullName,
    });
  }
  if (visibility.username) {
    cols.push({
      field: 'username',
      sortable: true,
      title: t('page.employees.column.username'),
      width: COLUMN_WIDTH.username,
    });
  }
  if (visibility.role) {
    cols.push({
      field: 'module_permissions',
      slots: { default: 'role' },
      sortable: true,
      title: t('page.employees.column.role'),
      width: COLUMN_WIDTH.role,
    });
  }
  if (visibility.department_position) {
    cols.push({
      field: 'department',
      minWidth: COLUMN_WIDTH.deptPosRegion,
      slots: { default: 'dept_pos_region' },
      sortable: true,
      title: t('page.employees.column.deptPosRegion'),
    });
  }
  if (visibility.status) {
    cols.push({
      field: 'is_active',
      slots: { default: 'status' },
      sortable: true,
      title: t('page.employees.column.status'),
      width: COLUMN_WIDTH.status,
    });
  }
  if (visibility.initial_status) {
    cols.push({
      field: 'is_initial_password',
      slots: { default: 'initial_status' },
      sortable: true,
      title: t('page.employees.column.initialPasswordStatus'),
      width: COLUMN_WIDTH.initialPasswordStatus,
    });
  }
  if (visibility.temporary_password) {
    cols.push({
      field: 'temporary_password',
      slots: { default: 'temporary_password' },
      sortable: true,
      title: t('page.employees.column.initialPassword'),
      width: COLUMN_WIDTH.initialPassword,
    });
  }
  // Action 列必须是普通列：一旦 fixed:'right'，vxe 会为表头 / 表体
  // 各渲染一层独立的「固定列表格」，两层宽度差一个纵向滚动条宽度，
  // 表头与数据行就会对不上。
  cols.push({
    resizable: false,
    slots: { default: 'action' },
    title: t('page.employees.column.action'),
    width: COLUMN_WIDTH.action,
  });
  return cols;
}

/**
 * 员工行排序比较器。
 *
 * 后端 /employees 返回的是全量数据，前端自行筛选 + 分页，
 * 因此排序也放在前端做：vxe 把当前排序字段透传给 query，
 * 这里按字段取值比较（slot 列取派生值）。
 *
 * @param field 排序字段（即列上的 field）
 * @param isManager 判定是否管理员的函数（身份列排序用）
 */
export function compareEmployees(
  field: string,
  isManager: (permissions: EmployeeApi.ModulePermission[]) => boolean,
): (
  a: EmployeeApi.EmployeeResponse,
  b: EmployeeApi.EmployeeResponse,
) => number {
  const pick = (row: EmployeeApi.EmployeeResponse): number | string => {
    switch (field) {
      case 'department': {
        // 部门 / 岗位 / 地区的展示顺序即为比较顺序
        return [row.department, row.position, row.region]
          .map((v) => v || '')
          .join('/');
      }
      case 'is_active': {
        return row.is_active ? 1 : 0;
      }
      case 'is_initial_password': {
        return row.is_initial_password ?? 0;
      }
      case 'module_permissions': {
        return isManager(row.module_permissions || []) ? 1 : 0;
      }
      default: {
        return String((row as Record<string, any>)[field] ?? '');
      }
    }
  };
  return (a, b) => {
    const av = pick(a);
    const bv = pick(b);
    if (typeof av === 'number' && typeof bv === 'number') {
      return av - bv;
    }
    return String(av).localeCompare(String(bv), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  };
}
