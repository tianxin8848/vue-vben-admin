import { requestClient } from '#/api/request';

export namespace LeaveRequestApi {
  export type LeaveType = 'annual' | 'lieu' | 'long' | 'personal' | 'sick';
  export type LeaveSession = 'afternoon' | 'full_day' | 'morning';
  export type ApprovalStatus =
    | 'approved'
    | 'pending'
    | 'rejected'
    | 'withdrawn';

  export interface LeaveRequest {
    id: string;
    employee_id: string;
    employee_user_id: null | number;
    employee_code: null | string;
    employee_username: string;
    employee_name: string;
    employee_department: null | string;
    employee_region: null | string;
    leave_type: LeaveType;
    approval_status: ApprovalStatus;
    approval_chain: Record<string, unknown>[];
    current_approver_id: null | string;
    approval_history: Record<string, unknown>[];
    session: LeaveSession;
    start_date: string;
    end_date: string;
    date_keys: string[];
    reason: null | string;
    handover_to: null | string;
    created_by_id: string;
    created_by_name: string;
    reviewer_id: null | string;
    reviewer_name: null | string;
    review_comment: null | string;
    reviewed_at: null | string;
    created_at: null | string;
    updated_at: null | string;
  }

  export interface CreateLeaveRequestParams {
    employee_id?: null | string;
    leave_type: LeaveType;
    start_date: string;
    end_date: string;
    session?: LeaveSession;
    reason?: null | string;
    handover_to?: null | string;
  }

  export interface ReviewParams {
    approval_status: ApprovalStatus;
    review_comment?: null | string;
  }

  export interface ListParams {
    page?: number;
    pageSize?: number;
    status?: string;
    employee_id?: string;
    start_date?: string;
    end_date?: string;
  }

  export interface AnnualLeaveSummary {
    year: number;
    region: null | string;
    entitlement_days: number;
    used_days: number;
    available_days: number;
  }

  export interface LeaveCalendar {
    year: number;
    total: number;
    items: LeaveRequest[];
  }

  export interface ApprovalRecord {
    id: string;
    leave_request_id: string;
    action: 'approved' | 'rejected' | 'submitted' | 'withdrawn';
    operator_id: string;
    operator_username: string;
    operator_name: null | string;
    operator_role: null | string;
    employee_id: string;
    employee_user_id: null | number;
    employee_code: null | string;
    employee_username: string;
    employee_name: string;
    employee_department: null | string;
    employee_region: null | string;
    leave_type: LeaveType;
    session: LeaveSession;
    start_date: string;
    end_date: string;
    reason: null | string;
    handover_to: null | string;
    comment: null | string;
    approval_status_before: ApprovalStatus | null;
    approval_status_after: ApprovalStatus;
    current_approver_id_before: null | string;
    current_approver_id_after: null | string;
    current_approver_name_after: null | string;
    current_approver_level_after: null | number;
    is_flowing: boolean;
    created_at: null | string;
  }
}

export async function getLeaveRequestsApi(params?: LeaveRequestApi.ListParams) {
  return requestClient.get<LeaveRequestApi.LeaveRequest[]>('/leave-requests', {
    params,
  });
}

export async function getMyLeaveRequestsApi() {
  return requestClient.get<LeaveRequestApi.LeaveRequest[]>(
    '/leave-requests/my',
  );
}

export async function getMyPendingApprovalsApi() {
  return requestClient.get<LeaveRequestApi.LeaveRequest[]>(
    '/leave-requests/approvals/my',
  );
}

export async function getMyApprovalRecordsApi() {
  return requestClient.get<LeaveRequestApi.ApprovalRecord[]>(
    '/leave-requests/approvals/records/my',
  );
}

export async function getAnnualLeaveSummaryApi() {
  return requestClient.get<LeaveRequestApi.AnnualLeaveSummary>(
    '/leave-requests/annual-leave/summary',
  );
}

export async function getLeaveCalendarApi() {
  return requestClient.get<LeaveRequestApi.LeaveCalendar>(
    '/leave-requests/calendar',
  );
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
