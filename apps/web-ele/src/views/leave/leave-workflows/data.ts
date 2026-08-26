import type { VxeGridProps } from '#/adapter/vxe-table';
import type { LeaveWorkflowApi } from '#/api';

export interface WorkflowApprover {
  full_name: null | string;
  user_id: string;
  username: string;
}

export interface WorkflowMatch {
  employee_id: string;
  region: string;
  department: string;
  position: string;
}

export interface WorkflowForm {
  name: string;
  priority: number;
  match: WorkflowMatch;
  approvers: WorkflowApprover[];
}

export function createDefaultWorkflowForm(): WorkflowForm {
  return {
    name: '',
    priority: 100,
    match: {
      employee_id: '',
      region: '',
      department: '',
      position: '',
    },
    approvers: [],
  };
}

export function createDefaultApproverLevels(): string[][] {
  return [['']];
}

type TFunc = (key: string, named?: Record<string, any>) => string;

export function createGridOptions(
  t: TFunc,
): VxeGridProps<LeaveWorkflowApi.LeaveWorkflow> {
  return {
    id: 'leave-workflow-index',
    rowConfig: {
      keyField: 'id',
    },
    columns: [
      {
        field: 'name',
        title: t('page.leave.workflowMaintenance.column.name'),
        minWidth: 180,
        slots: { default: 'name' },
      },
      {
        field: 'priority',
        title: t('page.leave.workflowMaintenance.column.priority'),
        width: 90,
      },
      {
        title: t('page.leave.workflowMaintenance.column.matchCondition'),
        minWidth: 220,
        slots: { default: 'match' },
      },
      {
        title: t('page.leave.workflowMaintenance.column.approverChain'),
        minWidth: 260,
        slots: { default: 'approvers' },
      },
      {
        field: 'is_active',
        title: t('page.leave.workflowMaintenance.column.status'),
        width: 90,
        slots: { default: 'status' },
      },
      {
        title: t('page.leave.workflowMaintenance.column.action'),
        width: 180,
        fixed: 'right',
        slots: { default: 'action' },
      },
    ],
    proxyConfig: {
      enabled: false,
    },
    toolbarConfig: {
      zoom: true,
      custom: true,
      tools: [
        {
          code: 'manual-refresh',
          icon: 'vxe-icon-refresh',
          circle: true,
          name: t('page.leave.workflowMaintenance.refresh'),
        },
      ],
    },
    customConfig: {
      storage: false,
    },
  };
}
