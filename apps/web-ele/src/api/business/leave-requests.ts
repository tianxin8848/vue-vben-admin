import { requestClient } from '#/api/request';

export namespace LeaveRequestApi {
  export interface LeaveRequest {
    id: string;
    employeeId: string;
    employeeName: string;
    type: 'annual' | 'maternity' | 'other' | 'paternity' | 'personal' | 'sick';
    startDate: string;
    endDate: string;
    duration: number;
    reason: string;
    status: 'approved' | 'cancelled' | 'pending' | 'rejected';
    createdAt: string;
    updatedAt: string;
    reviewedBy?: string;
    reviewComment?: string;
    reviewTime?: string;
  }

  export interface CreateLeaveRequestParams {
    type: LeaveRequest['type'];
    startDate: string;
    endDate: string;
    reason: string;
  }

  export interface ReviewParams {
    status: 'approved' | 'rejected';
    comment?: string;
  }

  export interface ListParams {
    page?: number;
    pageSize?: number;
    status?: string;
    employeeId?: string;
    startDate?: string;
    endDate?: string;
  }

  export interface ListResult {
    data: LeaveRequest[];
    total: number;
    page: number;
    pageSize: number;
  }
}

export async function getLeaveRequestsApi(params?: LeaveRequestApi.ListParams) {
  return requestClient.get<LeaveRequestApi.ListResult>('/leave-requests', {
    params,
  });
}

export async function createLeaveRequestApi(
  data: LeaveRequestApi.CreateLeaveRequestParams,
) {
  return requestClient.post<LeaveRequestApi.LeaveRequest>(
    '/leave-requests',
    data,
  );
}

export async function getLeaveRequestApi(id: string) {
  return requestClient.get<LeaveRequestApi.LeaveRequest>(
    `/leave-requests/${id}`,
  );
}

export async function deleteLeaveRequestApi(id: string) {
  return requestClient.delete(`/leave-requests/${id}`);
}

export async function reviewLeaveRequestApi(
  id: string,
  data: LeaveRequestApi.ReviewParams,
) {
  return requestClient.post(`/leave-requests/${id}/review`, data);
}
