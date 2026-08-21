import type { VxeGridProps } from '#/adapter/vxe-table';

// 请假类型映射
export const leaveTypeOptions: Record<string, string> = {
  annual: '年假',
  personal: '事假',
  sick: '病假',
  lieu: '调休',
  long: '长假',
};

// 请假时段映射
export const sessionOptions: Record<string, string> = {
  full_day: '全天',
  morning: '上午',
  afternoon: '下午',
};

// 审批状态映射
export const statusOptions: Record<string, string> = {
  pending: '待审批',
  approved: '已批准',
  rejected: '已驳回',
  withdrawn: '已撤回',
};

// 审批状态对应的 ElTag 类型
export const statusTypeMap: Record<
  string,
  'danger' | 'info' | 'primary' | 'success' | 'warning'
> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  withdrawn: 'info',
};

export function statusTagType(
  status: string,
): 'danger' | 'info' | 'primary' | 'success' | 'warning' | undefined {
  return statusTypeMap[status] ?? 'info';
}

// 表格列配置
export const tableColumns: VxeGridProps['columns'] = [
  {
    field: 'date_range',
    title: '日期范围',
    minWidth: 200,
    slots: { default: 'date_range' },
  },
  {
    field: 'leave_type',
    title: '请假类型',
    width: 120,
    align: 'center',
    slots: { default: 'leave_type' },
  },
  {
    field: 'session',
    title: '时段',
    width: 100,
    align: 'center',
    slots: { default: 'session' },
  },
  {
    field: 'approval_status',
    title: '状态',
    width: 120,
    align: 'center',
    slots: { default: 'status' },
  },
  {
    field: 'created_at',
    title: '创建时间',
    width: 180,
    slots: { default: 'created_at' },
  },
  {
    title: '操作',
    width: 120,
    fixed: 'right',
    slots: { default: 'action' },
  },
];

// 表格工具栏配置
export const sharedToolbarConfig: VxeGridProps['toolbarConfig'] = {
  custom: true,
  tools: [
    {
      code: 'manual-refresh',
      icon: 'vxe-icon-refresh',
      circle: true,
      name: '刷新',
    },
  ],
};
