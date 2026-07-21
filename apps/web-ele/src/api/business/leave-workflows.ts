import { requestClient } from '#/api/request';

export namespace LeaveWorkflowApi {
  export interface WorkflowNode {
    id: string;
    order: number;
    approverId: string;
    approverName: string;
    required: boolean;
  }

  export interface LeaveWorkflow {
    id: string;
    name: string;
    leaveType:
      | 'all'
      | 'annual'
      | 'maternity'
      | 'other'
      | 'paternity'
      | 'personal'
      | 'sick';
    description: string;
    nodes: WorkflowNode[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }

  export interface CreateWorkflowParams {
    name: string;
    leaveType: LeaveWorkflow['leaveType'];
    description?: string;
    nodes: WorkflowNode[];
    isActive?: boolean;
  }

  export type UpdateWorkflowParams = Partial<CreateWorkflowParams>;

  export interface ListParams {
    page?: number;
    pageSize?: number;
    leaveType?: string;
    isActive?: boolean;
  }

  export interface ListResult {
    data: LeaveWorkflow[];
    total: number;
    page: number;
    pageSize: number;
  }
}

export async function getLeaveWorkflowsApi(
  params?: LeaveWorkflowApi.ListParams,
) {
  return requestClient.get<LeaveWorkflowApi.ListResult>('/leave-workflows', {
    params,
  });
}

export async function createLeaveWorkflowApi(
  data: LeaveWorkflowApi.CreateWorkflowParams,
) {
  return requestClient.post<LeaveWorkflowApi.LeaveWorkflow>(
    '/leave-workflows',
    data,
  );
}

export async function getLeaveWorkflowApi(id: string) {
  return requestClient.get<LeaveWorkflowApi.LeaveWorkflow>(
    `/leave-workflows/${id}`,
  );
}

export async function updateLeaveWorkflowApi(
  id: string,
  data: LeaveWorkflowApi.UpdateWorkflowParams,
) {
  return requestClient.put<LeaveWorkflowApi.LeaveWorkflow>(
    `/leave-workflows/${id}`,
    data,
  );
}

export async function deleteLeaveWorkflowApi(id: string) {
  return requestClient.delete(`/leave-workflows/${id}`);
}
