import { requestClient } from '#/api/request';

export namespace LeaveWorkflowApi {
  /** 审批人 */
  export interface WorkflowApprover {
    full_name: null | string;
    user_id: string;
    username: string;
  }

  /** 匹配条件 */
  export interface WorkflowMatch {
    department: null | string;
    employee_id: null | string;
    position: null | string;
    region: null | string;
  }

  /** 请假流程响应 */
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

  /** 创建请假流程请求参数 */
  export interface CreateWorkflowParams {
    approvers?: WorkflowApprover[];
    is_active?: boolean;
    match?: WorkflowMatch;
    name: string;
    priority?: number;
  }

  /** 更新请假流程请求参数（所有字段可选） */
  export interface UpdateWorkflowParams {
    approvers?: null | WorkflowApprover[];
    is_active?: boolean | null;
    match?: null | WorkflowMatch;
    name?: null | string;
    priority?: null | number;
  }

  /** 流程维护页面筛选下拉数据 */
  export interface LeaveWorkflowMeta {
    departments: string[];
    employees: {
      department: null | string;
      employee_code: null | string;
      full_name: null | string;
      id: string;
      is_active: boolean;
      position: null | string;
      region: null | string;
      username: string;
    }[];
    positions: string[];
    regions: string[];
  }
}

/** 获取请假流程列表 */
export async function getLeaveWorkflowsApi() {
  return requestClient.get<LeaveWorkflowApi.LeaveWorkflow[]>(
    '/leave-workflows',
  );
}

/** 获取流程维护页面筛选下拉数据（地区/部门/岗位/员工） */
export async function getLeaveWorkflowsMetaApi() {
  const data = await requestClient.get<LeaveWorkflowApi.LeaveWorkflowMeta>(
    '/leave-workflows/meta',
  );
  console.warn('[DEBUG][getLeaveWorkflowsMetaApi] response:', data);
  return data;
}

/** 创建请假流程 */
export async function createLeaveWorkflowApi(
  data: LeaveWorkflowApi.CreateWorkflowParams,
) {
  return requestClient.post<LeaveWorkflowApi.LeaveWorkflow>(
    '/leave-workflows',
    data,
  );
}

/** 更新请假流程（PATCH） */
export async function updateLeaveWorkflowApi(
  id: string,
  data: LeaveWorkflowApi.UpdateWorkflowParams,
) {
  return requestClient.request<LeaveWorkflowApi.LeaveWorkflow>(
    `/leave-workflows/${id}`,
    { method: 'PATCH', data },
  );
}

/** 删除请假流程 */
export async function deleteLeaveWorkflowApi(id: string) {
  return requestClient.delete(`/leave-workflows/${id}`);
}
