import { requestClient } from '#/api/request';

export namespace LeaveWorkflowApi {
  export interface WorkflowApprover {
    full_name: null | string;
    user_id: string;
    username: string;
  }

  export interface WorkflowMatch {
    department: null | string;
    employee_id: null | string;
    position: null | string;
    region: null | string;
  }

  export interface LeaveWorkflow {
    approvers: WorkflowApprover[];
    created_at: null | string;
    id: string;
    is_active: boolean;
    match: WorkflowMatch;
    name: string;
    priority: number;
    updated_at: null | string;
  }

  export interface CreateWorkflowParams {
    approvers?: WorkflowApprover[];
    is_active?: boolean;
    match?: WorkflowMatch;
    name: string;
    priority?: number;
  }

  export type UpdateWorkflowParams = Partial<CreateWorkflowParams>;

  export interface ListParams {
    is_active?: boolean;
    page?: number;
    pageSize?: number;
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
