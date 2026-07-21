import { requestClient } from '#/api/request';

export namespace LeaveWorkflowApi {
  export interface WorkflowApprover {
    user_id: string;
    username: string;
    full_name: null | string;
  }

  export interface WorkflowMatch {
    employee_id: null | string;
    department: null | string;
    region: null | string;
    position: null | string;
  }

  export interface LeaveWorkflow {
    id: string;
    name: string;
    priority: number;
    is_active: boolean;
    match: WorkflowMatch;
    approvers: WorkflowApprover[];
    created_at: null | string;
    updated_at: null | string;
  }

  export interface CreateWorkflowParams {
    name: string;
    priority?: number;
    is_active?: boolean;
    match?: WorkflowMatch;
    approvers?: WorkflowApprover[];
  }

  export type UpdateWorkflowParams = Partial<CreateWorkflowParams>;

  export interface ListParams {
    page?: number;
    pageSize?: number;
    is_active?: boolean;
  }
}

export async function getLeaveWorkflowsApi(
  params?: LeaveWorkflowApi.ListParams,
) {
  return requestClient.get<LeaveWorkflowApi.LeaveWorkflow[]>(
    '/leave-workflows',
    { params },
  );
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
