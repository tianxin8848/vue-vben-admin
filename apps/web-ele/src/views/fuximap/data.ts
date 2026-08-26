import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

/** 工具栏配置（含刷新按钮） */
export function buildSharedToolbarConfig(
  t: (key: string) => string,
): VxeGridProps['toolbarConfig'] {
  return {
    custom: true,
    zoom: true,
    tools: [
      {
        code: 'manual-refresh',
        circle: true,
        icon: 'vxe-icon-refresh',
        name: t('page.fuximap.refresh'),
      },
    ],
  };
}

/** 构建筛选表单 schema */
export function buildFormSchema(
  t: (key: string) => string,
): VbenFormProps['schema'] {
  return [
    {
      component: 'Input',
      fieldName: 'keyword',
      label: t('page.fuximap.keyword'),
      componentProps: {
        clearable: true,
        placeholder: t('page.fuximap.keywordPlaceholder'),
      },
    },
  ];
}

/** 构建表格列配置 */
export function buildColumns(
  t: (key: string) => string,
): VxeGridProps['columns'] {
  return [
    { type: 'seq', width: 60, title: t('page.fuximap.serialNo') },
    {
      field: 'name',
      sortable: true,
      title: t('page.fuximap.customerName'),
      width: 180,
    },
    {
      field: 'address',
      minWidth: 220,
      title: t('page.fuximap.address'),
    },
    {
      slots: { default: 'coords' },
      title: t('page.fuximap.coords'),
      width: 220,
      visible: false,
    },
    {
      field: 'phone',
      sortable: true,
      title: t('page.fuximap.contactPhone'),
      width: 160,
    },
    {
      slots: { default: 'contacts_summary' },
      minWidth: 260,
      title: t('page.fuximap.contactsSummary'),
    },
    {
      field: 'notes',
      minWidth: 200,
      showOverflow: true,
      title: t('page.fuximap.notes'),
    },
    {
      slots: { default: 'created_at' },
      sortable: true,
      title: t('page.fuximap.createdAt'),
      width: 180,
    },
    {
      fixed: 'right',
      resizable: false,
      slots: { default: 'action' },
      title: t('page.fuximap.actions'),
      width: 200,
    },
  ];
}

export function buildCustomerFormSchema(
  t: (key: string) => string,
): VbenFormProps['schema'] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: t('page.fuximap.customerName'),
      rules: 'required',
      componentProps: {
        placeholder: t('page.fuximap.customerNamePlaceholder'),
        clearable: true,
      },
    },
    {
      component: 'Input',
      fieldName: 'address',
      label: t('page.fuximap.address'),
      rules: 'required',
      componentProps: {
        placeholder: t('page.fuximap.addressPlaceholder'),
        clearable: true,
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'longitude',
      label: t('page.fuximap.longitude'),
      rules: 'selectRequired',
      componentProps: {
        placeholder: t('page.fuximap.longitudePlaceholder'),
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
      label: t('page.fuximap.latitude'),
      rules: 'selectRequired',
      componentProps: {
        placeholder: t('page.fuximap.latitudePlaceholder'),
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
      label: t('page.fuximap.phone'),
      componentProps: {
        placeholder: t('page.fuximap.phoneFormPlaceholder'),
        clearable: true,
      },
    },
    {
      component: 'Input',
      fieldName: 'notes',
      label: t('page.fuximap.notes'),
      componentProps: {
        placeholder: t('page.fuximap.notesPlaceholder'),
        type: 'textarea',
        rows: 3,
        resize: 'none',
      },
    },
  ];
}
