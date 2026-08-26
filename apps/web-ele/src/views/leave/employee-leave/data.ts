import type { VxeGridProps } from '#/adapter/vxe-table';

type TFunc = (key: string, named?: Record<string, any>) => string;

// 请假类型映射
export function createLeaveTypeOptions(t: TFunc): Record<string, string> {
  return {
    annual: t('page.leave.leaveTypes.annual'),
    personal: t('page.leave.leaveTypes.personal'),
    sick: t('page.leave.leaveTypes.sick'),
    lieu: t('page.leave.leaveTypes.lieu'),
    long: t('page.leave.leaveTypes.long'),
  };
}

// 请假时段映射
export function createSessionOptions(t: TFunc): Record<string, string> {
  return {
    full_day: t('page.leave.session.full_day'),
    morning: t('page.leave.session.morning'),
    afternoon: t('page.leave.session.afternoon'),
  };
}

// 审批状态映射
export function createStatusOptions(t: TFunc): Record<string, string> {
  return {
    pending: t('page.leave.approvalStatus.pending'),
    approved: t('page.leave.approvalStatus.approved'),
    rejected: t('page.leave.approvalStatus.rejected'),
    withdrawn: t('page.leave.approvalStatus.withdrawn'),
  };
}

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
export function createTableColumns(t: TFunc): VxeGridProps['columns'] {
  return [
    {
      field: 'date_range',
      title: t('page.leave.employeeLeave.table.dateRange'),
      minWidth: 200,
      slots: { default: 'date_range' },
    },
    {
      field: 'leave_type',
      title: t('page.leave.employeeLeave.table.leaveType'),
      width: 120,
      align: 'center',
      slots: { default: 'leave_type' },
    },
    {
      field: 'session',
      title: t('page.leave.employeeLeave.table.session'),
      width: 100,
      align: 'center',
      slots: { default: 'session' },
    },
    {
      field: 'approval_status',
      title: t('page.leave.employeeLeave.table.status'),
      width: 120,
      align: 'center',
      slots: { default: 'status' },
    },
    {
      field: 'created_at',
      title: t('page.leave.employeeLeave.table.createdAt'),
      width: 180,
      slots: { default: 'created_at' },
    },
    {
      title: t('page.leave.employeeLeave.table.action'),
      width: 120,
      fixed: 'right',
      slots: { default: 'action' },
    },
  ];
}

// 表格工具栏配置
export function createSharedToolbarConfig(
  t: TFunc,
): VxeGridProps['toolbarConfig'] {
  return {
    custom: true,
    tools: [
      {
        code: 'manual-refresh',
        icon: 'vxe-icon-refresh',
        circle: true,
        name: t('page.leave.employeeLeave.table.refresh'),
      },
    ],
  };
}
