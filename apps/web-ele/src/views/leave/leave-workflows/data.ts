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

export const gridOptions: VxeGridProps<LeaveWorkflowApi.LeaveWorkflow> = {
  id: 'leave-workflow-index',
  rowConfig: {
    keyField: 'id',
  },
  columns: [
    {
      field: 'name',
      title: '名称',
      minWidth: 180,
      slots: { default: 'name' },
    },
    { field: 'priority', title: '优先级', width: 90 },
    {
      title: '匹配条件',
      minWidth: 220,
      slots: { default: 'match' },
    },
    {
      title: '审批链',
      minWidth: 260,
      slots: { default: 'approvers' },
    },
    {
      field: 'is_active',
      title: '状态',
      width: 90,
      slots: { default: 'status' },
    },
    {
      title: '操作',
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
        name: '刷新',
      },
    ],
  },
  customConfig: {
    storage: false,
  },
};
