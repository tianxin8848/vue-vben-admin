import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

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

/** 构建筛选表单 schema */
export function buildFormSchema(): VbenFormProps['schema'] {
  return [
    {
      component: 'Input',
      fieldName: 'keyword',
      label: '关键词',
      componentProps: {
        clearable: true,
        placeholder: '搜索客户名称 / 地址 / 电话 / 备注',
      },
    },
  ];
}

/** 构建表格列配置 */
export function buildColumns(): VxeGridProps['columns'] {
  return [
    { type: 'seq', width: 60, title: '序号' },
    {
      field: 'name',
      sortable: true,
      title: '客户名称',
      width: 180,
    },
    {
      field: 'address',
      minWidth: 220,
      title: '地址',
    },
    {
      slots: { default: 'coords' },
      title: '经纬度',
      width: 220,
      visible: false,
    },
    {
      field: 'phone',
      sortable: true,
      title: '联系电话',
      width: 160,
    },
    {
      slots: { default: 'contacts_summary' },
      minWidth: 260,
      title: '联系人',
    },
    {
      field: 'notes',
      minWidth: 200,
      showOverflow: true,
      title: '备注',
    },
    {
      slots: { default: 'created_at' },
      sortable: true,
      title: '创建时间',
      width: 180,
    },
    {
      fixed: 'right',
      resizable: false,
      slots: { default: 'action' },
      title: '操作',
      width: 200,
    },
  ];
}

export function buildCustomerFormSchema(): VbenFormProps['schema'] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: '客户名称',
      rules: 'required',
      componentProps: { placeholder: '请输入客户名称', clearable: true },
    },
    {
      component: 'Input',
      fieldName: 'address',
      label: '地址',
      rules: 'required',
      componentProps: { placeholder: '请输入详细地址', clearable: true },
    },
    {
      component: 'InputNumber',
      fieldName: 'longitude',
      label: '经度',
      rules: 'selectRequired',
      componentProps: {
        placeholder: '经度（-180 ~ 180）',
        min: -180,
        max: 180,
        step: 0.000_001,
        precision: 6,
        controlsPosition: 'right',
        style: { width: '100%' },
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'latitude',
      label: '纬度',
      rules: 'selectRequired',
      componentProps: {
        placeholder: '纬度（-90 ~ 90）',
        min: -90,
        max: 90,
        step: 0.000_001,
        precision: 6,
        controlsPosition: 'right',
        style: { width: '100%' },
      },
    },
    {
      component: 'Input',
      fieldName: 'phone',
      label: '电话',
      componentProps: { placeholder: '请输入联系电话', clearable: true },
    },
    {
      component: 'Input',
      fieldName: 'notes',
      label: '备注',
      componentProps: {
        placeholder: '请输入备注信息',
        type: 'textarea',
        rows: 3,
        resize: 'none',
      },
    },
  ];
}
